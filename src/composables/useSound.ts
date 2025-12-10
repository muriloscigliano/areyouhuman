import { ref } from 'vue';

// Singleton audio context for all sounds
let audioContext: AudioContext | null = null;

const isEnabled = ref(true);
const volume = ref(0.15); // Subtle volume

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

// Generate a subtle tick sound
function playTick(frequency: number, duration: number) {
  if (!isEnabled.value) return;

  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    // Quick fade in and out for a soft tick
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume.value, ctx.currentTime + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (e) {
    // Silently fail if audio isn't available
  }
}

// Hover sound - higher pitch, very short
function playHover() {
  playTick(4200, 0.025);
}

// Click sound - slightly lower, slightly longer
function playClick() {
  playTick(2800, 0.04);
}

export function useSound() {
  return {
    isEnabled,
    volume,
    playHover,
    playClick
  };
}
