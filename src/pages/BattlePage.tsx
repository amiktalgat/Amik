import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { BattleCanvas, type Camera } from '../components/pixel-battle/BattleCanvas';
import { BattleHeader } from '../components/pixel-battle/BattleHeader';
import { BattleHud } from '../components/pixel-battle/BattleHud';
import { ColorPalette } from '../components/pixel-battle/ColorPalette';
import { MiniMap } from '../components/pixel-battle/MiniMap';
import { OwnerTools } from '../components/pixel-battle/OwnerTools';
import { ZoomControls } from '../components/pixel-battle/ZoomControls';
import { useAuthSession } from '../lib/auth';
import {
  BATTLE_OWNER_EMAIL,
  CANVAS_SIZE,
  DAILY_BONUS_HOURS,
  MAX_BALANCE,
  clamp,
  getChunkBounds,
  getRechargeSeconds,
  loadBattleProfile,
  loadBattleStats,
  loadMiniMapPixels,
  loadVisiblePixels,
  placeBattlePixel,
  type BattleTool,
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
  const [brushSize, setBrushSize] = useState(1);
  const [tool, setTool] = useState<BattleTool>('paint');
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

  const rechargeText = useMemo(() => {
    if (!profile) return 'loading';
    const rechargeSeconds = getRechargeSeconds(profile.placed_pixels);
    const elapsed = (tick - new Date(profile.last_recharge_at).getTime()) / 1000;
    const secondsLeft = rechargeSeconds - (elapsed % rechargeSeconds);
    return `in ${clamp(secondsLeft, 0, rechargeSeconds).toFixed(1)}s`;
  }, [profile, tick]);

  const isOwner = profile?.email.toLowerCase() === BATTLE_OWNER_EMAIL;

  useEffect(() => {
    localStorage.setItem(colorStorageKey, color);
  }, [color]);

  useEffect(() => {
    const id = window.setInterval(() => setTick(Date.now()), 200);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    setProfile((current) => (current ? rechargeProfile(current, tick) : current));
  }, [tick]);

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
        if (payload.eventType === 'DELETE') {
          const oldPixel = payload.old as Pick<BattlePixel, 'x' | 'y'>;
          setPixels((current) => current.filter((pixel) => pixel.x !== oldPixel.x || pixel.y !== oldPixel.y));
          setMiniPixels((current) => current.filter((pixel) => pixel.x !== oldPixel.x || pixel.y !== oldPixel.y));
          return;
        }
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
    if (!isOwner && profile.balance <= 0) {
      setNotice('Not enough pixels');
      return;
    }

    const size = isOwner ? brushSize : 1;
    const previousPixels = getBrushPixels(pixels, x, y, size);
    const optimisticPixels = makeBrushPixels(x, y, size, color.toUpperCase(), user.id);
    const optimisticProfile = {
      ...profile,
      balance: isOwner ? MAX_BALANCE : profile.balance - 1,
      placed_pixels: tool === 'erase' ? profile.placed_pixels : profile.placed_pixels + optimisticPixels.length,
    };

    setPixels((current) => applyBrushPixels(current, optimisticPixels, tool === 'erase'));
    setMiniPixels((current) => applyBrushPixels(current, optimisticPixels, tool === 'erase').slice(-4500));
    setProfile(optimisticProfile);
    setStats((current) => current
      ? {
          ...current,
          canvasPixels: tool === 'erase'
            ? Math.max(0, current.canvasPixels - previousPixels.length)
            : current.canvasPixels + Math.max(0, optimisticPixels.length - previousPixels.length),
          placedPixels: tool === 'erase' ? current.placedPixels : current.placedPixels + optimisticPixels.length,
          myPixels: tool === 'erase' ? current.myPixels : current.myPixels + optimisticPixels.length,
        }
      : current);
    setNotice(tool === 'erase' ? 'Pixels erased!' : 'Pixel placed!');

    const { data, error } = await placeBattlePixel(x, y, color, size, tool);
    if (error) {
      setNotice(error.message.includes('rate_limited') ? 'Too many clicks. Wait a second.' : error.message);
      setPixels((current) => restoreBrushPixels(current, optimisticPixels, previousPixels));
      setMiniPixels((current) => restoreBrushPixels(current, optimisticPixels, previousPixels).slice(-4500));
      setProfile(profile);
      void refreshStats();
      await refreshProfile();
      return;
    }
    if (data) {
      setPixels((current) => applyBrushPixels(current, data.pixels, data.erased));
      setMiniPixels((current) => applyBrushPixels(current, data.pixels, data.erased).slice(-4500));
    }
    setProfile({
      ...optimisticProfile,
      balance: isOwner ? MAX_BALANCE : data?.balance ?? optimisticProfile.balance,
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
        <BattleHud
          profile={profile}
          cursor={cursor}
          rechargeText={rechargeText}
          nextBonusText={nextBonusText}
          canPlace={Boolean(user)}
        />
        <ColorPalette color={color} onChange={setColor} />
        {isOwner && (
          <OwnerTools
            brushSize={brushSize}
            tool={tool}
            onBrushSizeChange={setBrushSize}
            onToolChange={setTool}
          />
        )}
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

function makeBrushPixels(x: number, y: number, size: number, color: string, userId: string) {
  const half = Math.floor(size / 2);
  let startX = clamp(x - half, 0, CANVAS_SIZE - 1);
  let startY = clamp(y - half, 0, CANVAS_SIZE - 1);
  const endX = clamp(startX + size - 1, 0, CANVAS_SIZE - 1);
  const endY = clamp(startY + size - 1, 0, CANVAS_SIZE - 1);
  startX = clamp(endX - size + 1, 0, CANVAS_SIZE - 1);
  startY = clamp(endY - size + 1, 0, CANVAS_SIZE - 1);
  const updatedAt = new Date().toISOString();
  const nextPixels: BattlePixel[] = [];

  for (let py = startY; py <= endY; py += 1) {
    for (let px = startX; px <= endX; px += 1) {
      nextPixels.push({ x: px, y: py, color, user_id: userId, updated_at: updatedAt });
    }
  }

  return nextPixels;
}

function getBrushPixels(pixels: BattlePixel[], x: number, y: number, size: number) {
  const brushKeys = new Set(makeBrushPixels(x, y, size, '#000000', '').map((pixel) => `${pixel.x}:${pixel.y}`));
  return pixels.filter((pixel) => brushKeys.has(`${pixel.x}:${pixel.y}`));
}

function applyBrushPixels(pixels: BattlePixel[], brushPixels: BattlePixel[], erase: boolean) {
  if (erase) {
    const eraseKeys = new Set(brushPixels.map((pixel) => `${pixel.x}:${pixel.y}`));
    return pixels.filter((pixel) => !eraseKeys.has(`${pixel.x}:${pixel.y}`));
  }
  return brushPixels.reduce((current, pixel) => upsertPixel(current, pixel), pixels);
}

function restoreBrushPixels(pixels: BattlePixel[], brushPixels: BattlePixel[], previousPixels: BattlePixel[]) {
  return applyBrushPixels(applyBrushPixels(pixels, brushPixels, true), previousPixels, false);
}

function rechargeProfile(profile: BattleProfile, now: number) {
  if (profile.balance >= MAX_BALANCE) return profile;
  const rechargeSeconds = getRechargeSeconds(profile.placed_pixels);
  const rechargeMs = rechargeSeconds * 1000;
  const elapsedMs = now - new Date(profile.last_recharge_at).getTime();
  const generated = Math.floor(elapsedMs / rechargeMs);
  if (generated <= 0) return profile;

  const nextBalance = Math.min(MAX_BALANCE, profile.balance + generated);
  const usedRecharges = nextBalance - profile.balance;
  const nextRechargeAt = nextBalance >= MAX_BALANCE
    ? new Date(now)
    : new Date(new Date(profile.last_recharge_at).getTime() + usedRecharges * rechargeMs);

  return {
    ...profile,
    balance: nextBalance,
    last_recharge_at: nextRechargeAt.toISOString(),
  };
}

function formatBonusWait(milliseconds: number) {
  if (milliseconds <= 0) return 'today';
  const totalMinutes = Math.ceil(milliseconds / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `in ${minutes}m`;
  return `in ${hours}h ${minutes}m`;
}
