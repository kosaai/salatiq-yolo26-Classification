import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

/** One short-lived player at a time. Event deduplication lives in useSahwAudio. */
export function createSahwAudio() {
  let cleanup: (() => void) | null = null;
  let generation = 0;
  let disposed = false;
  const ready = setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});

  const stop = () => {
    generation += 1;
    cleanup?.();
    cleanup = null;
  };

  return {
    async play() {
      if (disposed) return;
      stop();
      const request = generation;
      await ready;
      if (disposed || request !== generation) return;

      try {
        const player = createAudioPlayer(require('../assets/audio/subhan-allah.mp3'));
        let subscription: { remove(): void } | undefined;
        let timeout: ReturnType<typeof setTimeout> | undefined;
        let released = false;
        const release = () => {
          if (released) return;
          released = true;
          if (timeout) clearTimeout(timeout);
          subscription?.remove();
          player.remove();
          if (cleanup === release) cleanup = null;
        };
        cleanup = release;
        player.loop = false;
        subscription = player.addListener('playbackStatusUpdate', (status) => {
          if (status.didJustFinish || status.error) release();
        });
        // Also release if loading or playback never completes.
        timeout = setTimeout(release, 30_000);
        player.play();
      } catch {
        cleanup?.();
        cleanup = null;
      }
    },
    dispose() {
      disposed = true;
      stop();
    },
  };
}
