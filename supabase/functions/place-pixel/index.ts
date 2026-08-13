import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.110.8';

type PixelRequest = {
  x: number;
  y: number;
  color: string;
  brushSize?: number;
  tool?: 'paint' | 'erase';
};

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function isPixelRequest(value: unknown): value is PixelRequest {
  if (!value || typeof value !== 'object') return false;
  const body = value as Record<string, unknown>;
  return (
    Number.isInteger(body.x) &&
    Number.isInteger(body.y) &&
    typeof body.color === 'string' &&
    /^#[0-9A-Fa-f]{6}$/.test(body.color) &&
    (body.brushSize === undefined || Number.isInteger(body.brushSize)) &&
    (body.tool === undefined || body.tool === 'paint' || body.tool === 'erase')
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'auth_required' }), {
      status: 401,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  const body: unknown = await req.json().catch(() => null);
  if (!isPixelRequest(body)) {
    return new Response(JSON.stringify({ error: 'bad_request' }), {
      status: 400,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data, error } = await supabase.rpc('place_battle_pixels', {
    pixel_x: body.x,
    pixel_y: body.y,
    pixel_color: body.color,
    brush_size: body.brushSize ?? 1,
    erase_pixels: body.tool === 'erase',
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(data), {
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
});
