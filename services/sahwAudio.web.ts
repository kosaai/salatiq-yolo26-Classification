import { Asset } from 'expo-asset';

/** Unlock Web Audio on a real user gesture (including iPhone Safari).
 * Each alert gets a disposable, non-looping source; no sound plays on unlock.
 */
export function createSahwAudio() {
  let context: AudioContext | null = null;
  let buffer: Promise<AudioBuffer> | null = null;
  let source: AudioBufferSourceNode | null = null;
  let disposed = false;
  let generation = 0;

  const unlock = () => {
    if (disposed) return;
    try {
      context ??= new AudioContext();
      void context.resume().catch(() => {});
    } catch {
      // Audio availability must not affect prayer tracking.
    }
  };
  document.addEventListener('pointerdown', unlock);
  document.addEventListener('keydown', unlock);

  const stop = () => {
    generation += 1;
    if (source) {
      source.onended = null;
      source.stop();
      source.disconnect();
      source = null;
    }
  };

  return {
    async play() {
      if (disposed) return;
      stop();
      const request = generation;
      unlock();
      const audioContext = context;
      if (!audioContext) return;
      try {
        buffer ??= (async () => {
          const asset = Asset.fromModule(require('../assets/audio/subhan-allah.mp3'));
          const response = await fetch(asset.uri);
          if (!response.ok) throw new Error('Unable to load Sahw sound');
          return audioContext.decodeAudioData(await response.arrayBuffer());
        })();
        const decoded = await buffer;
        if (disposed || request !== generation || audioContext.state !== 'running') return;
        const next = audioContext.createBufferSource();
        next.buffer = decoded;
        next.loop = false;
        next.connect(audioContext.destination);
        next.onended = () => {
          next.disconnect();
          next.onended = null;
          if (source === next) source = null;
        };
        source = next;
        next.start();
      } catch {
        buffer = null;
        if (request === generation) stop();
      }
    },
    dispose() {
      disposed = true;
      stop();
      document.removeEventListener('pointerdown', unlock);
      document.removeEventListener('keydown', unlock);
      buffer = null;
      if (context) void context.close().catch(() => {});
      context = null;
    },
  };
}
