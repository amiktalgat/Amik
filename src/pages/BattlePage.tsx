import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { BattleCanvas, type Camera } from '../components/pixel-battle/BattleCanvas';
import { BattleHeader } from '../components/pixel-battle/BattleHeader';
import { BattleHud } from '../components/pixel-battle/BattleHud';
import { BattleReferencePanel } from '../components/pixel-battle/BattleReferencePanel';
import { BattleTutorial } from '../components/pixel-battle/BattleTutorial';
import { ColorPalette } from '../components/pixel-battle/ColorPalette';
import { Leaderboard } from '../components/pixel-battle/Leaderboard';
import { MiniMap } from '../components/pixel-battle/MiniMap';
import { OwnerTools } from '../components/pixel-battle/OwnerTools';
import { ZoomControls } from '../components/pixel-battle/ZoomControls';
import { useAuthSession } from '../lib/auth';
import {
  CANVAS_SIZE,
  DAILY_BONUS_HOURS,
  MAX_BALANCE,
  clamp,
  getRechargeSeconds,
  loadAllBattlePixels,
  loadBattleLeaderboard,
  loadBattleProfile,
  loadBattleStats,
  placeBattlePixel,
  isBattleHelper,
  isBattleOwner,
  isBattlePrivileged,
  type BattleTool,
  type BattleLeaderboardEntry,
  type BattlePixel,
  type BattleProfile,
  type BattleStats,
} from '../lib/pixelBattle';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import './battle.css';

const colorStorageKey = 'pixelBattleColor';
const tutorialStorageKey = 'pixelBattleTutorialSeen';
const ownerBrushSizes = [1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48];
const helperBrushSizes = [1, 2, 4];

export function BattlePage() {
  const [, navigate] = useLocation();
  const { user } = useAuthSession();
  const [camera, setCamera] = useState<Camera>({ x: 1000, y: 1000, zoom: 4 });
  const [pixels, setPixels] = useState<BattlePixel[]>([]);
  const [miniPixels, setMiniPixels] = useState<BattlePixel[]>([]);
  const [profile, setProfile] = useState<BattleProfile | null>(null);
  const [stats, setStats] = useState<BattleStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<BattleLeaderboardEntry[]>([]);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(true);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [color, setColor] = useState(() => localStorage.getItem(colorStorageKey) ?? '#ef4444');
  const [brushSize, setBrushSize] = useState(1);
  const [canvasSize, setCanvasSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [tool, setTool] = useState<BattleTool>('paint');
  const [notice, setNotice] = useState('Connecting...');
  const [onlineCount, setOnlineCount] = useState(1);
  const [tick, setTick] = useState(Date.now());
  const [isLoadingPixels, setIsLoadingPixels] = useState(true);
  const [isTutorialOpen, setIsTutorialOpen] = useState(() => localStorage.getItem(tutorialStorageKey) !== 'yes');
  const [isReferenceOpen, setIsReferenceOpen] = useState(false);
  const [referenceImageUrl, setReferenceImageUrl] = useState('');
  const [referenceOpacity, setReferenceOpacity] = useState(0.35);
  const [referencePosition, setReferencePosition] = useState({ x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2 });
  const [referenceScale, setReferenceScale] = useState(1);

  const visibleView = useMemo(() => ({
    x: clamp(camera.x - canvasSize.width / 2 / camera.zoom, 0, CANVAS_SIZE),
    y: clamp(camera.y - canvasSize.height / 2 / camera.zoom, 0, CANVAS_SIZE),
    width: clamp(canvasSize.width / camera.zoom, 1, CANVAS_SIZE),
    height: clamp(canvasSize.height / camera.zoom, 1, CANVAS_SIZE),
  }), [camera, canvasSize]);

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

  const isOwner = isBattleOwner(profile?.email);
  const isHelper = isBattleHelper(profile?.email);
  const hasPowerTools = isBattlePrivileged(profile?.email);
  const canErase = isOwner;
  const availableBrushSizes = isOwner ? ownerBrushSizes : helperBrushSizes;

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
    if (!canErase && tool === 'erase') setTool('paint');
  }, [canErase, tool]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setNotice('Supabase is not configured.');
      setIsLoadingPixels(false);
      return;
    }
    void refreshProfile();
    void refreshStats();
    void refreshLeaderboard();
    setIsLoadingPixels(true);
    void loadAllBattlePixels().then(({ data, error }) => {
      if (error) setNotice(error.message);
      if (data) {
        setPixels(data);
        setMiniPixels(data);
      }
      setIsLoadingPixels(false);
    });
  }, [user]);

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
          setPixels((current) => removePixel(current, oldPixel));
          setMiniPixels((current) => removePixel(current, oldPixel));
          return;
        }
        const next = payload.new as BattlePixel;
        setPixels((current) => mergePixels(current, [next]));
        setMiniPixels((current) => mergePixels(current, [next]).slice(-4500));
        window.setTimeout(() => void refreshLeaderboard(), 400);
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

  async function refreshLeaderboard() {
    const { data, error } = await loadBattleLeaderboard();
    if (error) setNotice(error.message);
    else setLeaderboard(data ?? []);
    setIsLeaderboardLoading(false);
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
    if (!hasPowerTools && profile.balance <= 0) {
      setNotice('Not enough pixels');
      return;
    }

    const size = getAllowedBrushSize(brushSize, tool, hasPowerTools, canErase, availableBrushSizes);
    const brushPixels = makeBrushPixels(x, y, size, color.toUpperCase(), user.id);
    const optimisticPixels = tool === 'erase' ? brushPixels : getChangedBrushPixels(pixels, brushPixels, tool);
    if (optimisticPixels.length === 0) {
      setNotice(tool === 'erase' ? 'Nothing to erase here.' : 'This pixel already has that color.');
      return;
    }

    const previousPixels = getBrushPixels(pixels, optimisticPixels);
    const newCanvasPixelCount = Math.max(0, optimisticPixels.length - previousPixels.length);
    const placedPixelCount = tool === 'erase' ? previousPixels.length : optimisticPixels.length;
    const optimisticProfile = {
      ...profile,
      balance: hasPowerTools ? MAX_BALANCE : profile.balance - 1,
      placed_pixels: tool === 'erase' ? profile.placed_pixels : profile.placed_pixels + placedPixelCount,
    };

    setPixels((current) => applyBrushPixels(current, optimisticPixels, tool === 'erase'));
    setMiniPixels((current) => applyBrushPixels(current, optimisticPixels, tool === 'erase').slice(-4500));
    setProfile(optimisticProfile);
    setStats((current) => current
      ? {
          ...current,
          canvasPixels: tool === 'erase'
            ? Math.max(0, current.canvasPixels - previousPixels.length)
            : current.canvasPixels + newCanvasPixelCount,
          placedPixels: tool === 'erase' ? current.placedPixels : current.placedPixels + placedPixelCount,
          myPixels: tool === 'erase' ? current.myPixels : current.myPixels + placedPixelCount,
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
      if (data.erased) {
        const hiddenErasedCount = Math.max(0, data.affected - previousPixels.length);
        setStats((current) => current
          ? { ...current, canvasPixels: Math.max(0, current.canvasPixels - hiddenErasedCount) }
          : current);
      }
    }
    setProfile({
      ...optimisticProfile,
      balance: hasPowerTools ? MAX_BALANCE : data?.balance ?? optimisticProfile.balance,
      placed_pixels: data?.placedPixels ?? optimisticProfile.placed_pixels,
    });
    void refreshProfile();
    void refreshStats();
    void refreshLeaderboard();
  }

  function closeTutorial() {
    localStorage.setItem(tutorialStorageKey, 'yes');
    setIsTutorialOpen(false);
  }

  function changeReferenceImage(imageUrl: string) {
    setReferenceImageUrl(imageUrl);
    setReferenceScale(0.5);
  }

  return (
    <main className="battle-shell">
      <BattleHeader
        user={user}
        onlineCount={onlineCount}
        stats={stats}
        onReferenceOpen={() => setIsReferenceOpen(true)}
        onTutorialOpen={() => setIsTutorialOpen(true)}
      />
      <BattleCanvas
        camera={camera}
        canPlace={Boolean(user && profile && (hasPowerTools || profile.balance > 0))}
        color={color}
        pixels={pixels}
        referenceImageUrl={referenceImageUrl}
        referenceOpacity={referenceOpacity}
        referencePosition={referencePosition}
        referenceScale={referenceScale}
        onCameraChange={setCamera}
        onCursorChange={setCursor}
        onPlace={handlePlace}
        onSizeChange={setCanvasSize}
      />
      {isLoadingPixels && (
        <section className="battle-loading" aria-live="polite">
          <div>
            <h2>Loading drawings</h2>
            <p>The shared canvas will appear when the visible pixels are ready.</p>
          </div>
        </section>
      )}
      <aside className="battle-sidebar">
        <BattleHud
          profile={profile}
          cursor={cursor}
          rechargeText={rechargeText}
          nextBonusText={nextBonusText}
          canPlace={Boolean(user)}
        />
        <ColorPalette color={color} onChange={setColor} />
        {hasPowerTools && (
          <OwnerTools
            brushSize={brushSize}
            brushSizes={availableBrushSizes}
            canErase={canErase}
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
        <Leaderboard entries={leaderboard} currentUserId={user?.id} loading={isLeaderboardLoading} />
        <MiniMap
          pixels={miniPixels}
          view={visibleView}
          onJump={(x, y) => setCamera({ ...camera, x, y })}
        />
      </aside>
      <p className="battle-toast">{notice}</p>
      <BattleReferencePanel
        imageUrl={referenceImageUrl}
        opacity={referenceOpacity}
        open={isReferenceOpen}
        position={referencePosition}
        scale={referenceScale}
        onClose={() => setIsReferenceOpen(false)}
        onImageChange={changeReferenceImage}
        onOpacityChange={setReferenceOpacity}
        onPositionChange={setReferencePosition}
        onScaleChange={setReferenceScale}
        onRemove={() => setReferenceImageUrl('')}
      />
      <BattleTutorial isOwner={isOwner || isHelper} open={isTutorialOpen && !isLoadingPixels} onClose={closeTutorial} />
    </main>
  );
}

function getAllowedBrushSize(
  brushSize: number,
  tool: BattleTool,
  hasPowerTools: boolean,
  canErase: boolean,
  availableBrushSizes: number[],
) {
  if (!hasPowerTools) return 1;
  if (tool === 'erase' && !canErase) return 1;
  return availableBrushSizes.includes(brushSize) ? brushSize : availableBrushSizes[0];
}

function pixelKey(pixel: Pick<BattlePixel, 'x' | 'y'>) {
  return `${pixel.x}:${pixel.y}`;
}

function mergePixels(pixels: BattlePixel[], nextPixels: BattlePixel[]) {
  const byKey = new Map(pixels.map((pixel) => [pixelKey(pixel), pixel]));
  for (const pixel of nextPixels) byKey.set(pixelKey(pixel), pixel);
  return [...byKey.values()];
}

function removePixel(pixels: BattlePixel[], target: Pick<BattlePixel, 'x' | 'y'>) {
  const key = pixelKey(target);
  return pixels.filter((pixel) => pixelKey(pixel) !== key);
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

function getBrushPixels(pixels: BattlePixel[], brushPixels: BattlePixel[]) {
  const brushKeys = new Set(brushPixels.map(pixelKey));
  return pixels.filter((pixel) => brushKeys.has(pixelKey(pixel)));
}

function getChangedBrushPixels(pixels: BattlePixel[], brushPixels: BattlePixel[], tool: BattleTool) {
  const currentByKey = new Map(pixels.map((pixel) => [pixelKey(pixel), pixel.color.toUpperCase()]));
  return brushPixels.filter((pixel) => {
    const currentColor = currentByKey.get(pixelKey(pixel));
    return tool === 'erase' ? Boolean(currentColor) : currentColor !== pixel.color.toUpperCase();
  });
}

function applyBrushPixels(pixels: BattlePixel[], brushPixels: BattlePixel[], erase: boolean) {
  const byKey = new Map(pixels.map((pixel) => [pixelKey(pixel), pixel]));
  if (erase) {
    for (const pixel of brushPixels) byKey.delete(pixelKey(pixel));
    return [...byKey.values()];
  }
  for (const pixel of brushPixels) byKey.set(pixelKey(pixel), pixel);
  return [...byKey.values()];
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
