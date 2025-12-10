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

// Generate a subtle click/tick sound
function playTick(frequency: number = 3500, duration: number = 0.03) {
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

// Soft whoosh for transitions (using noise)
function playWhoosh() {
  if (!isEnabled.value) return;

  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const bufferSize = ctx.sampleRate * 0.08; // 80ms
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const source = ctx.createBufferSource();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    source.buffer = buffer;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.08);

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    gainNode.gain.setValueAtTime(volume.value * 0.5, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    source.start();
  } catch (e) {
    // Silently fail
  }
}

export function useSound() {
  return {
    isEnabled,
    volume,
    playHover,
    playClick,
    playWhoosh,
    playTick
  };
}
