'use client';

import { useRoomContext } from '@/lib/livekit/RoomContext';
import { RoomContext, VideoConference, formatChatMessageLinks } from '@livekit/components-react';
import { DebugMode } from '@/lib/livekit/Debug';
import { KeyboardShortcuts } from '@/lib/livekit/KeyboardShortcuts';
import { RecordingIndicator } from '@/lib/livekit/RecordingIndicator';
import { SettingsMenu } from '@/lib/livekit/SettingsMenu';
import styles from '../styles/Discord.module.css';

const SHOW_SETTINGS_MENU = process.env.NEXT_PUBLIC_SHOW_SETTINGS_MENU == 'true';

export default function HomePage() {
  const { currentRoom, currentRoomName, isConnecting, isConnected } = useRoomContext();

  if (currentRoom && isConnected) {
    return (
      <div className="lk-room-container" style={{ height: '100%' }}>
        <RoomContext.Provider value={currentRoom}>
          <KeyboardShortcuts />
          <VideoConference
            chatMessageFormatter={formatChatMessageLinks}
            SettingsComponent={SHOW_SETTINGS_MENU ? SettingsMenu : undefined}
          />
          <DebugMode />
          <RecordingIndicator />
          
          {/* Debug participant info */}
          <div style={{ 
            position: 'absolute', 
            top: '10px', 
            right: '10px', 
            background: 'rgba(0,0,0,0.8)', 
            color: 'white', 
            padding: '10px', 
            borderRadius: '5px',
            fontSize: '12px',
            zIndex: 1000
          }}>
            <div>Local: {currentRoom.localParticipant.identity}</div>
            <div>Remote: {Array.from(currentRoom.remoteParticipants.values()).map(p => p.identity).join(', ')}</div>
            <div>Total: {currentRoom.remoteParticipants.size + 1}</div>
          </div>
        </RoomContext.Provider>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className={styles.welcomeArea}>
        <div className={styles.welcomeContent}>
          <h1>Connecting to {currentRoomName}...</h1>
          <p>Please wait while we connect you to the voice channel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.welcomeArea}>
      <div className={styles.welcomeContent}>
        <h1>Welcome to LiveKit Meet</h1>
        <p>Select a voice channel from the sidebar to join a conversation!</p>
        
        <div className={styles.features}>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>🎥</span>
            <div>
              <h3>HD Video Calls</h3>
              <p>Crystal clear video with adaptive streaming</p>
            </div>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>🔒</span>
            <div>
              <h3>End-to-End Encryption</h3>
              <p>Your conversations stay private and secure</p>
            </div>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>🌐</span>
            <div>
              <h3>Global Infrastructure</h3>
              <p>Low latency connections worldwide</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}