'use client';

import React from 'react';
import { useRoomContext } from '@/lib/RoomContext';
import { Track } from 'livekit-client';
import { useTrackToggle, useLocalParticipant } from '@livekit/components-react';
import styles from '../../styles/VoiceStatusBar.module.css';

function VoiceConnectedIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
    </svg>
  );
}

function MicIcon({ muted }: { muted: boolean }) {
  if (muted) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.24-5.3-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c.57-.08 1.12-.23 1.64-.46l2.92 2.92L19 20.46 4.27 3z"/>
      </svg>
    );
  }
  
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
    </svg>
  );
}

function CameraIcon({ disabled }: { disabled: boolean }) {
  if (disabled) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2zM5 16V8h1.73l8 8H5z"/>
      </svg>
    );
  }
  
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
    </svg>
  );
}

function ScreenShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.11-.9-2-2-2H4c-1.11 0-2 .89-2 2v10c0 1.1.89 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/>
    </svg>
  );
}


function VoiceStatusBarInner() {
  const { currentRoomName, leaveRoom } = useRoomContext();
  
  const { localParticipant } = useLocalParticipant();
  
  const { toggle: toggleMic, enabled: micEnabled } = useTrackToggle({ 
    source: Track.Source.Microphone 
  });
  const { toggle: toggleCamera, enabled: cameraEnabled } = useTrackToggle({ 
    source: Track.Source.Camera 
  });
  const { toggle: toggleScreenShare, enabled: screenShareEnabled } = useTrackToggle({ 
    source: Track.Source.ScreenShare 
  });

  return (
    <div className={styles.voiceStatusBar}>
      <div className={styles.connectionInfo}>
        <VoiceConnectedIcon />
        <div className={styles.connectionText}>
          <span className={styles.status}>Connected</span>
          <span className={styles.roomName}>{currentRoomName}</span>
        </div>
      </div>

      <div className={styles.controls}>
        <button 
          className={`${styles.controlButton} ${styles.smallButton} ${!micEnabled ? styles.muted : ''}`}
          onClick={() => toggleMic()}
          title={micEnabled ? 'Mute' : 'Unmute'}
          style={{ width: 28, height: 28, minWidth: 0, minHeight: 0, padding: 2 }}
        >
          <MicIcon muted={!micEnabled} />
        </button>

        <button 
          className={`${styles.controlButton} ${styles.smallButton} ${!cameraEnabled ? styles.disabled : ''}`}
          onClick={() => toggleCamera()}
          title={cameraEnabled ? 'Turn off camera' : 'Turn on camera'}
          style={{ width: 28, height: 28, minWidth: 0, minHeight: 0, padding: 2 }}
        >
          <CameraIcon disabled={!cameraEnabled} />
        </button>

        <button 
          className={`${styles.controlButton} ${styles.smallButton} ${screenShareEnabled ? styles.active : ''}`}
          onClick={() => toggleScreenShare()}
          title={screenShareEnabled ? 'Stop sharing' : 'Share screen'}
          style={{ width: 28, height: 28, minWidth: 0, minHeight: 0, padding: 2 }}
        >
          <ScreenShareIcon />
        </button>

      </div>

      <div className={styles.actions}>
        <button 
          className={styles.leaveButton}
          onClick={leaveRoom}
          title="Leave voice channel"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

export function VoiceStatusBar() {
  const { currentRoomName, isConnected, leaveRoom } = useRoomContext();
  
  // Only render when connected to a room
  if (!currentRoomName || !isConnected) {
    return null;
  }

  return <VoiceStatusBarInner />;
}