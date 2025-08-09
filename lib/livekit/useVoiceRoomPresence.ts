'use client';

import { useEffect, useRef } from 'react';
import { getVoiceRoomPresence } from './supabase';
import { useRoomContext } from './RoomContext';

export function useVoiceRoomPresence() {
  const { currentRoomName, currentRoom, currentUser, isConnected } = useRoomContext();
  const currentChannelRef = useRef<any>(null);
  const currentRoomRef = useRef<string | null>(null);

  const leaveCurrentRoom = async () => {
    if (currentChannelRef.current) {
      await currentChannelRef.current.untrack();
      await currentChannelRef.current.unsubscribe();
      currentChannelRef.current = null;
      currentRoomRef.current = null;
    }
  };

  const joinVoiceRoom = async (roomId: string, userKey: string) => {
    // Always leave current room first
    await leaveCurrentRoom();

    const channel = getVoiceRoomPresence(roomId, userKey);
    currentChannelRef.current = channel;
    currentRoomRef.current = roomId;
    
    await channel.subscribe(async (status: string) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          id: userKey,
          name: userKey,
          joinedAt: new Date().toISOString(),
        });
      }
    });
  };

  // Handle room changes and disconnections
  useEffect(() => {
    if (currentRoomName && isConnected) {
      // Only join if we're not already in this room
      if (currentRoomRef.current !== currentRoomName) {
        const identity =
          currentRoom?.localParticipant?.identity || currentUser || 'anon';
        joinVoiceRoom(currentRoomName, identity);
      }
    } else if (!isConnected) {
      leaveCurrentRoom();
    }
  }, [currentRoomName, isConnected, currentRoom]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveCurrentRoom();
    };
  }, []);

  return null;
} 