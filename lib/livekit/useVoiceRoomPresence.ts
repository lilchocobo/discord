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

export function useVoiceRoomPresence() {
  const { currentRoomName, currentUser, isConnected } = useRoomContext();
  const [presence, setPresence] = useState<VoiceRoomPresence>({});
  const [isPresenceConnected, setIsPresenceConnected] = useState(false);
  const currentChannelRef = useRef<any>(null);
  const currentRoomRef = useRef<string | null>(null);

  const leaveCurrentRoom = useCallback(async () => {
    if (currentChannelRef.current) {
      console.log('Leaving presence channel:', currentRoomRef.current);
      await currentChannelRef.current.untrack();
      await currentChannelRef.current.unsubscribe();
      currentChannelRef.current = null;
      currentRoomRef.current = null;
      setIsPresenceConnected(false);
    }
  }, []);

  const joinVoiceRoom = useCallback(async (roomId: string, userName: string) => {
    // Always leave current room first
    await leaveCurrentRoom();

    console.log('Joining presence channel:', roomId);
    const channel = getVoiceRoomPresence(roomId);
    currentChannelRef.current = channel;
    currentRoomRef.current = roomId;
    
    await channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Subscribed to channel, tracking presence for:', userName);
        await channel.track({
          id: userName,
          name: userName,
          joinedAt: new Date().toISOString(),
        });
        setIsPresenceConnected(true);
      }
    });

    // Listen for all presence events for all rooms
    channel.on('presence', { event: 'sync' }, () => {
      console.log('Presence sync for room:', roomId);
      const state = channel.presenceState();
      const users = Object.values(state).map(user => user[0] as unknown as VoiceRoomUser);
      setPresence(prev => ({
        ...prev,
        [roomId]: users,
      }));
    });

    channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('User joined room:', roomId, newPresences);
      const newUsers = newPresences as unknown as VoiceRoomUser[];
      setPresence(prev => ({
        ...prev,
        [roomId]: [...(prev[roomId] || []).filter(u => !newUsers.some(nu => nu.id === u.id)), ...newUsers],
      }));
    });

    channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('User left room:', roomId, leftPresences);
      const leftUsers = leftPresences as unknown as VoiceRoomUser[];
      setPresence(prev => ({
        ...prev,
        [roomId]: (prev[roomId] || []).filter(
          user => !leftUsers.some(leftUser => leftUser.id === user.id)
        ),
      }));
    });

    return channel;
  }, [leaveCurrentRoom]);

  // Handle room changes and disconnections
  useEffect(() => {
    if (currentRoomName && currentUser && isConnected) {
      // Only join if we're not already in this room
      if (currentRoomRef.current !== currentRoomName) {
        console.log('Room changed from', currentRoomRef.current, 'to', currentRoomName);
        joinVoiceRoom(currentRoomName, currentUser);
      }
    } else if (!isConnected) {
      // Leave room when disconnected
      console.log('Disconnected from LiveKit, leaving presence');
      leaveCurrentRoom();
    }
  }, [currentRoomName, currentUser, isConnected, joinVoiceRoom, leaveCurrentRoom]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveCurrentRoom();
    };
  }, [leaveCurrentRoom]);

  return {
    presence,
    isConnected: isPresenceConnected,
    joinVoiceRoom,
    leaveVoiceRoom: leaveCurrentRoom,
  };
} 