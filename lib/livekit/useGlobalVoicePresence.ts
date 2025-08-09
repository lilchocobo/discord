'use client';

import { useEffect, useRef, useState } from 'react';
import { getVoiceRoomPresence } from './supabase';
import { useRoomContext } from './RoomContext';

interface VoiceRoomUser {
  id: string;
  name: string;
  joinedAt: string;
}

interface VoiceRoomPresence {
  [roomId: string]: VoiceRoomUser[];
}

/**
 * Subscribe (read-only) to presence for a set of roomIds.
 * We DO NOT track the local user here; that is done by useVoiceRoomPresence().
 */
export function useGlobalVoicePresence(roomIds: string[]) {
  const { currentUser } = useRoomContext();
  const [presence, setPresence] = useState<VoiceRoomPresence>({});
  const channelsRef = useRef<{ [roomId: string]: ReturnType<typeof getVoiceRoomPresence> }>(
    {},
  );

  useEffect(() => {
    const userKey = currentUser || 'anon';
    // subscribe to each room's presence channel
    roomIds.forEach((roomId) => {
      if (!channelsRef.current[roomId]) {
        const channel = getVoiceRoomPresence(roomId, userKey);
        channelsRef.current[roomId] = channel;

        channel.subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            // no-op
          }
        });

        channel.on('presence', { event: 'sync' }, () => {
          const state = channelsRef.current[roomId]?.presenceState() ?? {};
          const users = Object.values(state).flat().map((u) => u as unknown as VoiceRoomUser);
          setPresence((prev) => ({ ...prev, [roomId]: users }));
        });

        channel.on('presence', { event: 'join' }, ({ newPresences }) => {
          const newUsers = newPresences as unknown as VoiceRoomUser[];
          setPresence((prev) => ({
            ...prev,
            [roomId]: [
              ...(prev[roomId] || []).filter((u) => !newUsers.some((nu) => nu.id === u.id)),
              ...newUsers,
            ],
          }));
        });

        channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
          const leftUsers = leftPresences as unknown as VoiceRoomUser[];
          setPresence((prev) => ({
            ...prev,
            [roomId]: (prev[roomId] || []).filter(
              (u) => !leftUsers.some((lu) => lu.id === u.id),
            ),
          }));
        });
      }
    });

    return () => {
      Object.values(channelsRef.current).forEach((ch) => ch?.unsubscribe());
      channelsRef.current = {};
    };
  }, [roomIds, currentUser]);

  return { presence };
} 