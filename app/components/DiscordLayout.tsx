'use client';

import { useRouter, usePathname } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { generateRoomId, randomString } from '@/lib/livekit/client-utils';
import { useRoomContext } from '@/lib/livekit/RoomContext';
import { VoiceStatusBar } from './VoiceStatusBar';
import { RoomContext } from '@livekit/components-react';
import { useGlobalVoicePresence } from '@/lib/livekit/useGlobalVoicePresence';
import styles from '../../styles/Discord.module.css';

interface Room {
  id: string;
  name: string;
}

// Available rooms - in real app this would come from your backend
const mockRooms: Room[] = [
  { id: 'general-voice', name: 'General' },
  { id: 'gaming-lounge', name: 'Gaming Lounge' },
  { id: 'study-hall', name: 'Study Hall' },
  { id: 'music-jam', name: 'Music Jam' },
  { id: 'dev-talk', name: 'Dev Talk' },
];

function VoiceChannelIcon({ isActive }: { isActive: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 21H5V3H13V9H19Z"/>
    </svg>
  );
}

function UserAvatar({ name }: { name: string }) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
  return (
    <div className={styles.avatar}>
      <div className={styles.avatarInner}>
        {initials}
      </div>
      <div className={styles.onlineIndicator} />
    </div>
  );
}

function VoiceChannel({ room, onJoin, isActive, presence }: { 
  room: Room; 
  onJoin: (roomId: string) => void; 
  isActive: boolean;
  presence: {[roomId: string]: any[]};
}) {
  const roomUsers = presence[room.id] || [];
  
  return (
    <div className={styles.voiceChannel}>
      <div 
        className={`${styles.channelHeader} ${isActive ? styles.activeChannel : ''}`}
        onClick={() => onJoin(room.id)}
      >
        <div className={styles.channelInfo}>
          <VoiceChannelIcon isActive={isActive} />
          <span className={styles.channelName}>{room.name}</span>
        </div>
        <button className={styles.joinButton}>
          Join
        </button>
      </div>
      
      {/* Show users in the channel */}
      {roomUsers.length > 0 && (
        <div className={styles.channelUsers}>
          {roomUsers.map(user => (
            <div key={user.id} className={styles.channelUser}>
              <div className={styles.userAvatar}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className={styles.userName}>{user.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateRoomModal({ isOpen, onClose, onCreateRoom }: {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (name: string) => void;
}) {
  const [roomName, setRoomName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomName.trim()) {
      onCreateRoom(roomName.trim());
      setRoomName('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h3>Create Voice Channel</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Channel name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            className={styles.input}
            autoFocus
          />
          <div className={styles.modalButtons}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" className={styles.createButton}>
              Create Channel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function DiscordLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentRoomName, joinRoom, isConnecting, currentRoom, isConnected, leaveRoom } = useRoomContext();
  const [rooms, setRooms] = useState<Room[]>(mockRooms);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<string>('');
  
  // Initialize global presence tracking
  const { presence } = useGlobalVoicePresence();

  // Get user identity from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let userId = localStorage.getItem('livekit-user-id');
      if (!userId) {
        userId = `User${Math.random().toString(36).substr(2, 4)}`;
        localStorage.setItem('livekit-user-id', userId);
      }
      setCurrentUser(userId);
    }
  }, []);

  const handleJoinRoom = async (roomId: string) => {
    try {
      // If already in a room, leave it first
      if (currentRoomName && currentRoomName !== roomId) {
        await leaveRoom();
      }
      
      await joinRoom(roomId);
      // Navigate to home to show the room content
      router.push('/');
    } catch (error) {
      console.error('Failed to join room:', error);
    }
  };

  const handleCreateRoom = (name: string) => {
    const newRoomId = generateRoomId();
    const newRoom: Room = {
      id: newRoomId,
      name,
    };
    setRooms(prev => [...prev, newRoom]);
    handleJoinRoom(newRoomId);
  };

  return (
    <div className={styles.discordContainer} data-lk-theme="default">
      <div className={styles.sidebar}>
        <div className={styles.serverIcon}>
          <img src="/images/livekit-meet-home.svg" alt="LiveKit Meet" width="32" height="32" />
        </div>
      </div>

      <div className={styles.channelList}>
        <div className={styles.serverHeader}>
          <h2>LiveKit Meet</h2>
        </div>

        <div className={styles.channelCategory}>
          <div className={styles.categoryHeader}>
            <span>VOICE CHANNELS</span>
            <button 
              className={styles.addChannelButton}
              onClick={() => setShowCreateModal(true)}
              title="Create Channel"
            >
              +
            </button>
          </div>

          <div className={styles.channelsList}>
            {rooms.map(room => (
              <VoiceChannel
                key={room.id}
                room={room}
                onJoin={handleJoinRoom}
                isActive={room.id === currentRoomName}
                presence={presence}
              />
            ))}
          </div>
        </div>

        {currentRoom && isConnected ? (
          <RoomContext.Provider value={currentRoom}>
            <VoiceStatusBar />
          </RoomContext.Provider>
        ) : (
          <VoiceStatusBar />
        )}

        <div className={styles.userArea}>
          <UserAvatar name={currentUser} />
          <div className={styles.userInfo}>
            <span className={styles.username}>{currentUser}</span>
            <span className={styles.userStatus}>Online</span>
          </div>
          <div className={styles.userControls}>
            <button className={styles.controlButton} title="Mute">🎤</button>
            <button className={styles.controlButton} title="Deafen">🎧</button>
            <button className={styles.controlButton} title="Settings">⚙️</button>
          </div>
        </div>
        
     
      </div>

      <div className={styles.mainContent}>
        <div className={styles.contentArea}>
          {children}
        </div>
      </div>

      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateRoom={handleCreateRoom}
      />
    </div>
  );
}