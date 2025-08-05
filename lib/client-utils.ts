export function encodePassphrase(passphrase: string) {
  return encodeURIComponent(passphrase);
}

export function decodePassphrase(pass: string) {
  return new Uint8Array(Buffer.from(pass, 'base64'));
}

export function generateRoomId(): string {
  return `${randomString(4)}-${randomString(4)}`;
}

export function randomString(length: number): string {
  let result = '';
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export function isLowPowerDevice() {
  return navigator.hardwareConcurrency < 6;
}

/**
 * Diagnose media device access issues
 */
export async function diagnoseMediaDevices(): Promise<{
  supported: boolean;
  secureContext: boolean;
  devices: MediaDeviceInfo[];
  errors: string[];
}> {
  const errors: string[] = [];
  let devices: MediaDeviceInfo[] = [];
  
  // Check if running in secure context
  const secureContext = window.isSecureContext;
  if (!secureContext) {
    errors.push('Not running in secure context (HTTPS required for media access)');
  }
  
  // Check if mediaDevices API is supported
  const supported = !!(navigator.mediaDevices && navigator.mediaDevices.enumerateDevices);
  if (!supported) {
    errors.push('MediaDevices API not supported in this browser');
    return { supported, secureContext, devices, errors };
  }
  
  try {
    devices = await navigator.mediaDevices.enumerateDevices();
  } catch (error) {
    if (error instanceof DOMException) {
      errors.push(`MediaDevices enumeration failed: ${error.name} - ${error.message}`);
    } else {
      errors.push(`MediaDevices enumeration failed: ${error}`);
    }
  }
  
  return { supported, secureContext, devices, errors };
}

/**
 * Request media permissions with better error handling
 */
export async function requestMediaPermissions(constraints: MediaStreamConstraints = {
  video: true,
  audio: true
}): Promise<{
  stream: MediaStream | null;
  error: string | null;
}> {
  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      return {
        stream: null,
        error: 'getUserMedia not supported in this browser'
      };
    }
    
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return { stream, error: null };
  } catch (error) {
    let errorMessage = 'Unknown media access error';
    
    if (error instanceof DOMException) {
      switch (error.name) {
        case 'NotFoundError':
          errorMessage = 'No camera or microphone found';
          break;
        case 'NotAllowedError':
          errorMessage = 'Permission denied for camera/microphone access';
          break;
        case 'NotSupportedError':
          errorMessage = 'Media devices not supported';
          break;
        case 'NotReadableError':
          errorMessage = 'Media device is already in use';
          break;
        case 'OverconstrainedError':
          errorMessage = 'Requested media constraints cannot be satisfied';
          break;
        default:
          errorMessage = `Media access error: ${error.message}`;
      }
    }
    
    return { stream: null, error: errorMessage };
  }
}
