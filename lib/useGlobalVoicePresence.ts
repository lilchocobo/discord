'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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

const roomIds = ['general-voice', 'gaming-lounge', 'study-hall', 'music-jam', 'dev-talk'];

export function useGlobalVoicePresence() {
  const { currentRoomName, currentUser, isConnected } = useRoomContext();
  const [presence, setPresence] = useState<VoiceRoomPresence>({});
  const channelsRef = useRef<{[roomId: string]: any}>({});
  const currentUserRoomRef = useRef<string | null>(null);

  // Initialize all room channels
  useEffect(() => {
    roomIds.forEach(roomId => {
      if (!channelsRef.current[roomId]) {
        const channel = getVoiceRoomPresence(roomId);
        channelsRef.current[roomId] = channel;

        channel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Subscribed to presence channel: ${roomId}`);
          }
        });

        channel.on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const users = Object.values(state).map(user => user[0] as unknown as VoiceRoomUser);
          setPresence(prev => ({
            ...prev,
            [roomId]: users,
          }));
        });

        channel.on('presence', { event: 'join' }, ({ newPresences }) => {
          const newUsers = newPresences as unknown as VoiceRoomUser[];
          setPresence(prev => ({
            ...prev,
            [roomId]: [...(prev[roomId] || []).filter(u => !newUsers.some(nu => nu.id === u.id)), ...newUsers],
          }));
        });

        channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
          const leftUsers = leftPresences as unknown as VoiceRoomUser[];
          setPresence(prev => ({
            ...prev,
            [roomId]: (prev[roomId] || []).filter(
              user => !leftUsers.some(leftUser => leftUser.id === user.id)
            ),
          }));
        });
      }
    });

    return () => {
      Object.values(channelsRef.current).forEach(channel => {
        channel?.unsubscribe();
      });
      channelsRef.current = {};
    };
  }, []);

  // Track user presence in current room
  useEffect(() => {
    const trackUserPresence = async () => {
      // Remove user from previous room
      if (currentUserRoomRef.current && channelsRef.current[currentUserRoomRef.current]) {
        console.log(`Removing user from: ${currentUserRoomRef.current}`);
        await channelsRef.current[currentUserRoomRef.current].untrack();
      }

      // Add user to current room
      if (currentRoomName && currentUser && isConnected && channelsRef.current[currentRoomName]) {
        console.log(`Adding user to: ${currentRoomName}`);
        await channelsRef.current[currentRoomName].track({
          id: currentUser,
          name: currentUser,
          joinedAt: new Date().toISOString(),
        });
        currentUserRoomRef.current = currentRoomName;
      } else if (!isConnected && currentUserRoomRef.current) {
        // User disconnected, remove from all rooms
        console.log('User disconnected, removing from all rooms');
        currentUserRoomRef.current = null;
      }
    };

    trackUserPresence();
  }, [currentRoomName, currentUser, isConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentUserRoomRef.current && channelsRef.current[currentUserRoomRef.current]) {
        channelsRef.current[currentUserRoomRef.current].untrack();
      }
    };
  }, []);

  return {
    presence,
  };
} 