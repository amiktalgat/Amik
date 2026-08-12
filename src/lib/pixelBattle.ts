import { supabase } from './supabase';

export const CANVAS_SIZE = 2000;
export const CHUNK_SIZE = 256;
export const MAX_BALANCE = 100;
export const DAILY_BONUS_HOURS = 24;
export const BASE_RECHARGE_SECONDS = 5;

export const BATTLE_COLORS = [
  '#000000', '#ffffff', '#f87171', '#ef4444', '#fb923c', '#f59e0b',
  '#fde047', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#38bdf8',
  '#3b82f6', '#2563eb', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f472b6', '#78716c', '#a16207', '#64748b', '#94a3b8',
];

export type BattlePixel = {
  x: number;
  y: number;
  color: string;
  user_id: string;
  updated_at: string;
};

export type BattleProfile = {
  user_id: string;
  username: string;
  email: string;
  balance: number;
  placed_pixels: number;
  best_streak: number;
  active_days: number;
  last_recharge_at: string;
  last_daily_bonus_at: string | null;
  created_at: string;
};

export type BattleStats = {
  canvasPixels: number;
  placedPixels: number;
  players: number;
  myPixels: number;
};

export type PlacePixelResult = {
  x: number;
  y: number;
  color: string;
  balance: number;
  placedPixels: number;
};

export type ViewBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

export async function loadBattleProfile() {
  return supabase.rpc('get_pixel_battle_profile').single<BattleProfile>();
}

export async function loadBattleStats() {
  return supabase.rpc('get_pixel_battle_stats').single<BattleStats>();
}

export async function loadVisiblePixels(bounds: ViewBounds) {
  return supabase
    .from('canvas_pixels')
    .select('x,y,color,user_id,updated_at')
    .gte('x', bounds.minX)
    .lte('x', bounds.maxX)
    .gte('y', bounds.minY)
    .lte('y', bounds.maxY)
    .limit(12000)
    .returns<BattlePixel[]>();
}

export async function loadMiniMapPixels() {
  return supabase
    .from('canvas_pixels')
    .select('x,y,color,user_id,updated_at')
    .order('updated_at', { ascending: false })
    .limit(4500)
    .returns<BattlePixel[]>();
}

export async function placeBattlePixel(x: number, y: number, color: string) {
  return supabase.functions.invoke<PlacePixelResult>('place-pixel', {
    body: { x, y, color },
  });
}

export function getChunkBounds(centerX: number, centerY: number, width: number, height: number) {
  const padding = CHUNK_SIZE;
  return {
    minX: clamp(Math.floor(centerX - width / 2 - padding), 0, CANVAS_SIZE - 1),
    maxX: clamp(Math.ceil(centerX + width / 2 + padding), 0, CANVAS_SIZE - 1),
    minY: clamp(Math.floor(centerY - height / 2 - padding), 0, CANVAS_SIZE - 1),
    maxY: clamp(Math.ceil(centerY + height / 2 + padding), 0, CANVAS_SIZE - 1),
  };
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function getRechargeSeconds(placedPixels: number) {
  if (placedPixels > 3000) return 3;
  if (placedPixels > 1000) return 4;
  return BASE_RECHARGE_SECONDS;
}
