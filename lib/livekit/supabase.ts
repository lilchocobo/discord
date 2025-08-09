import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = url && key
  ? createClient(url, key, { realtime: { params: { eventsPerSecond: 10 } } })
  : undefined;

export const getVoiceRoomPresence = (roomId: string, userId: string) => {
  if (!supabase) return undefined as unknown as ReturnType<typeof createClient>['channel'];
  return supabase.channel(`voice-room-${roomId}`, {
    config: { presence: { key: userId } },
  });
};