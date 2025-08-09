import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error('Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  }
  _supabase = createClient(url, anon, {
    realtime: { params: { eventsPerSecond: 10 } },
  });
  return _supabase;
}

/**
 * Presence channel for voice rooms.
 * @param roomId e.g. 'general-voice'
 * @param userKey the *user identity* (must be unique per user)
 */
export function getVoiceRoomPresence(roomId: string, userKey: string) {
  const supabase = getSupabase();
  return supabase.channel(`voice-room-${roomId}`, {
    config: {
      presence: {
        key: userKey, // IMPORTANT: presence key must be a user identity, not the room id
      },
    },
  });
}