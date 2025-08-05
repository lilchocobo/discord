'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Room, RoomOptions, RoomConnectOptions, VideoPresets, VideoCodec, ExternalE2EEKeyProvider, DeviceUnsupportedError, RoomEvent } from 'livekit-client';
import { ConnectionDetails } from './types';
import { useSetupE2EE } from './useSetupE2EE';
import { useLowCPUOptimizer } from './usePerfomanceOptimiser';

interface RoomContextType {
  currentRoom: Room | null;
  currentRoomName: string | null;
  currentUser: string;
  isConnecting: boolean;
  isConnected: boolean;
  joinRoom: (roomName: string) => Promise<void>;
  leaveRoom: () => void;
  error: string | null;
}

const RoomContext = createContext<RoomContextType | null>(null);

export function useRoomContext() {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoomContext must be used within RoomProvider');
  }
  return context;
}

const CONN_DETAILS_ENDPOINT = '/api/connection-details';

export function RoomProvider({ children }: { children: React.ReactNode }) {
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [currentRoomName, setCurrentRoomName] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const keyProvider = new ExternalE2EEKeyProvider();
  const { worker, e2eePassphrase } = useSetupE2EE();
  const e2eeEnabled = !!(e2eePassphrase && worker);

  // Get user identity from localStorage
  const getUserIdentity = useCallback(() => {
    if (typeof window === 'undefined') return 'User1234';
    
    let userId = localStorage.getItem('livekit-user-id');
    if (!userId) {
      userId = `User${Math.random().toString(36).substr(2, 4)}`;
      localStorage.setItem('livekit-user-id', userId);
    }
    return userId;
  }, []);

  // Initialize currentUser on mount
  useEffect(() => {
    setCurrentUser(getUserIdentity());
  }, [getUserIdentity]);

  const createRoom = useCallback(() => {
    const roomOptions: RoomOptions = {
      publishDefaults: {
        videoSimulcastLayers: [VideoPresets.h540, VideoPresets.h216],
        red: !e2eeEnabled,
        videoCodec: 'vp9' as VideoCodec,
      },
      adaptiveStream: { pixelDensity: 'screen' },
      dynacast: true,
      e2ee: e2eeEnabled ? { keyProvider, worker } : undefined,
    };
    return new Room(roomOptions);
  }, [e2eeEnabled, keyProvider, worker]);

  const joinRoom = useCallback(async (roomName: string) => {
    try {
      setError(null);
      setIsConnecting(true);

      // Leave current room if connected
      if (currentRoom) {
        currentRoom.disconnect();
        setCurrentRoom(null);
        setCurrentRoomName(null);
        setIsConnected(false);
      }

      // Get connection details
      const userIdentity = getUserIdentity();
      const url = new URL(CONN_DETAILS_ENDPOINT, window.location.origin);
      url.searchParams.append('roomName', roomName);
      url.searchParams.append('participantName', userIdentity);

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error('Failed to get connection details');
      }
      
      const connectionDetails: ConnectionDetails = await response.json();

      // Create and connect to new room
      const room = createRoom();
      
      // Set up event listeners
      room.on(RoomEvent.Connected, () => {
        setIsConnected(true);
        setIsConnecting(false);
      });

      room.on(RoomEvent.Disconnected, () => {
        setIsConnected(false);
        setCurrentRoom(null);
        setCurrentRoomName(null);
      });

      room.on(RoomEvent.ParticipantDisconnected, (participant) => {
        // Handle when other participants disconnect
        console.log('Participant disconnected:', participant.identity);
      });

      room.on(RoomEvent.EncryptionError, (error) => {
        console.error('Encryption error:', error);
        setError(`Encryption error: ${error.message}`);
      });

      room.on(RoomEvent.MediaDevicesError, (error) => {
        console.error('Media devices error:', error);
        setError(`Media error: ${error.message}`);
      });

      // Handle E2EE setup
      if (e2eeEnabled) {
        await keyProvider.setKey(e2eePassphrase);
        await room.setE2EEEnabled(true);
      }

      // Connect to room
      const connectOptions: RoomConnectOptions = {
        autoSubscribe: true,
      };

      await room.connect(connectionDetails.serverUrl, connectionDetails.participantToken, connectOptions);

      // Enable microphone only (camera disabled by default)
      try {
        await room.localParticipant.setMicrophoneEnabled(true);
        // Camera remains disabled by default
      } catch (mediaError) {
        console.warn('Failed to enable microphone:', mediaError);
      }

      setCurrentRoom(room);
      setCurrentRoomName(roomName);

    } catch (err) {
      console.error('Failed to join room:', err);
      setError(err instanceof Error ? err.message : 'Failed to join room');
      setIsConnecting(false);
    }
  }, [currentRoom, getUserIdentity, createRoom, e2eeEnabled, keyProvider, e2eePassphrase, worker]);

  const leaveRoom = useCallback(() => {
    if (currentRoom) {
      currentRoom.disconnect();
      setCurrentRoom(null);
      setCurrentRoomName(null);
      setIsConnected(false);
    }
  }, [currentRoom]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentRoom) {
        currentRoom.disconnect();
      }
    };
  }, [currentRoom]);

  // Use performance optimizer if room exists
  useLowCPUOptimizer(currentRoom);

  const value: RoomContextType = {
    currentRoom,
    currentRoomName,
    currentUser,
    isConnecting,
    isConnected,
    joinRoom,
    leaveRoom,
    error,
  };

  return (
    <RoomContext.Provider value={value}>
      {children}
    </RoomContext.Provider>
  );
}