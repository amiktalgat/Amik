import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { BattleCanvas, type Camera } from '../components/pixel-battle/BattleCanvas';
import { BattleHeader } from '../components/pixel-battle/BattleHeader';
import { BattleHud } from '../components/pixel-battle/BattleHud';
import { ColorPalette } from '../components/pixel-battle/ColorPalette';
import { MiniMap } from '../components/pixel-battle/MiniMap';
import { ZoomControls } from '../components/pixel-battle/ZoomControls';
import { useAuthSession } from '../lib/auth';
import {
  CANVAS_SIZE,
  DAILY_BONUS_HOURS,
  clamp,
  getChunkBounds,
  loadBattleProfile,
  loadBattleStats,
  loadMiniMapPixels,
  loadVisiblePixels,
  placeBattlePixel,
  type BattlePixel,
  type BattleProfile,
  type BattleStats,
} from '../lib/pixelBattle';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import './battle.css';

const colorStorageKey = 'pixelBattleColor';

export function BattlePage() {
  const [, navigate] = useLocation();
  const { user } = useAuthSession();
  const [camera, setCamera] = useState<Camera>({ x: 1000, y: 1000, zoom: 4 });
  const [pixels, setPixels] = useState<BattlePixel[]>([]);
  const [miniPixels, setMiniPixels] = useState<BattlePixel[]>([]);
  const [profile, setProfile] = useState<BattleProfile | null>(null);
  const [stats, setStats] = useState<BattleStats | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [color, setColor] = useState(() => localStorage.getItem(colorStorageKey) ?? '#ef4444');
  const [notice, setNotice] = useState('Connecting...');
  const [onlineCount, setOnlineCount] = useState(1);
  const [tick, setTick] = useState(Date.now());

  const bounds = useMemo(() => {
    const worldWidth = window.innerWidth / camera.zoom;
    const worldHeight = window.innerHeight / camera.zoom;
    return getChunkBounds(camera.x, camera.y, worldWidth, worldHeight);
  }, [camera]);

  const visibleView = useMemo(() => ({
    x: clamp(camera.x - window.innerWidth / 2 / camera.zoom, 0, CANVAS_SIZE),
    y: clamp(camera.y - window.innerHeight / 2 / camera.zoom, 0, CANVAS_SIZE),
    width: clamp(window.innerWidth / camera.zoom, 1, CANVAS_SIZE),
    height: clamp(window.innerHeight / camera.zoom, 1, CANVAS_SIZE),
  }), [camera]);

  const nextBonusText = useMemo(() => {
    if (!profile?.last_daily_bonus_at) return 'today';
    const nextBonusAt = new Date(profile.last_daily_bonus_at).getTime() + DAILY_BONUS_HOURS * 60 * 60 * 1000;
    return formatBonusWait(nextBonusAt - tick);
  }, [profile, tick]);

  useEffect(() => {
    localStorage.setItem(colorStorageKey, color);
  }, [color]);

  useEffect(() => {
    const id = window.setInterval(() => setTick(Date.now()), 60000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setNotice('Supabase is not configured.');
      return;
    }
    void refreshProfile();
    void refreshStats();
    void loadMiniMapPixels().then(({ data }) => setMiniPixels(data ?? []));
  }, [user]);

  useEffect(() => {
    void loadVisiblePixels(bounds).then(({ data, error }) => {
      if (error) setNotice(error.message);
      setPixels(data ?? []);
    });
  }, [bounds.maxX, bounds.maxY, bounds.minX, bounds.minY]);

  useEffect(() => {
    const channel = supabase.channel('pixel-battle-room', {
      config: { presence: { key: user?.id ?? crypto.randomUUID() } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        setOnlineCount(Object.keys(channel.presenceState()).length);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'canvas_pixels' }, (payload) => {
        const next = payload.new as BattlePixel;
        setPixels((current) => upsertPixel(current, next));
        setMiniPixels((current) => upsertPixel(current, next).slice(-4500));
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          void channel.track({ online_at: new Date().toISOString() });
          setNotice('Connection restored');
        }
        if (status === 'CHANNEL_ERROR') setNotice('Connection lost');
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id]);

  async function refreshProfile() {
    if (!user) {
      setProfile(null);
      return;
    }
    const { data, error } = await loadBattleProfile();
    if (error) setNotice(error.message);
    if (data) setProfile(data);
  }

  async function refreshStats() {
    const { data } = await loadBattleStats();
    if (data) setStats(data);
  }

  async function handlePlace(x: number, y: number) {
    if (!user) {
      navigate('/auth?next=/battle');
      return;
    }
    if (!profile) {
      setNotice('Player profile is loading. Try again in a second.');
      await refreshProfile();
      return;
    }
    if (profile.balance <= 0) {
      setNotice('Not enough pixels');
      return;
    }

    const previousPixel = pixels.find((pixel) => pixel.x === x && pixel.y === y) ?? null;
    const optimisticPixel = {
      x,
      y,
      color: color.toUpperCase(),
      user_id: user.id,
      updated_at: new Date().toISOString(),
    };
    const optimisticProfile = {
      ...profile,
      balance: profile.balance - 1,
      placed_pixels: profile.placed_pixels + 1,
    };

    setPixels((current) => upsertPixel(current, optimisticPixel));
    setMiniPixels((current) => upsertPixel(current, optimisticPixel).slice(-4500));
    setProfile(optimisticProfile);
    setStats((current) => current
      ? {
          ...current,
          canvasPixels: current.canvasPixels + (previousPixel ? 0 : 1),
          placedPixels: current.placedPixels + 1,
          myPixels: current.myPixels + 1,
        }
      : current);
    setNotice('Pixel placed!');

    const { data, error } = await placeBattlePixel(x, y, color);
    if (error) {
      setNotice(error.message.includes('rate_limited') ? 'Too many clicks. Wait a second.' : error.message);
      setPixels((current) => restorePixel(current, x, y, previousPixel));
      setMiniPixels((current) => restorePixel(current, x, y, previousPixel).slice(-4500));
      setProfile(profile);
      void refreshStats();
      await refreshProfile();
      return;
    }
    if (data) {
      const placedPixel = {
        x: data.x,
        y: data.y,
        color: data.color,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };
      setPixels((current) => upsertPixel(current, placedPixel));
      setMiniPixels((current) => upsertPixel(current, placedPixel).slice(-4500));
    }
    setProfile({
      ...optimisticProfile,
      balance: data?.balance ?? optimisticProfile.balance,
      placed_pixels: data?.placedPixels ?? optimisticProfile.placed_pixels,
    });
    void refreshProfile();
    void refreshStats();
  }

  function handleSignOut() {
    void supabase.auth.signOut();
  }

  return (
    <main className="battle-shell">
      <BattleHeader user={user} onlineCount={onlineCount} stats={stats} onSignOut={handleSignOut} />
      <BattleCanvas
        camera={camera}
        canPlace={Boolean(user && profile && profile.balance > 0)}
        color={color}
        pixels={pixels}
        onCameraChange={setCamera}
        onCursorChange={setCursor}
        onPlace={handlePlace}
      />
      <aside className="battle-sidebar">
        <BattleHud profile={profile} cursor={cursor} nextBonusText={nextBonusText} canPlace={Boolean(user)} />
        <ColorPalette color={color} onChange={setColor} />
        <ZoomControls
          onCenter={() => setCamera({ x: 1000, y: 1000, zoom: camera.zoom })}
          onReset={() => setCamera({ x: camera.x, y: camera.y, zoom: 4 })}
          onZoomIn={() => setCamera({ ...camera, zoom: clamp(camera.zoom * 1.25, 0.2, 32) })}
          onZoomOut={() => setCamera({ ...camera, zoom: clamp(camera.zoom * 0.8, 0.2, 32) })}
        />
        <MiniMap
          pixels={miniPixels}
          view={visibleView}
          onJump={(x, y) => setCamera({ ...camera, x, y })}
        />
      </aside>
      <p className="battle-toast">{notice}</p>
    </main>
  );
}

function upsertPixel(pixels: BattlePixel[], next: BattlePixel) {
  const key = `${next.x}:${next.y}`;
  const index = pixels.findIndex((pixel) => `${pixel.x}:${pixel.y}` === key);
  if (index === -1) return [...pixels, next];
  const copy = pixels.slice();
  copy[index] = next;
  return copy;
}

function restorePixel(pixels: BattlePixel[], x: number, y: number, previous: BattlePixel | null) {
  if (previous) return upsertPixel(pixels, previous);
  return pixels.filter((pixel) => pixel.x !== x || pixel.y !== y);
}

function formatBonusWait(milliseconds: number) {
  if (milliseconds <= 0) return 'today';
  const totalMinutes = Math.ceil(milliseconds / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `in ${minutes}m`;
  return `in ${hours}h ${minutes}m`;
}
