import { useEffect, useRef } from 'react';
import { createSahwAudio } from '../services/sahwAudio';
import { createSahwAudioEventTracker } from '../services/sahwAudioEvents';
import type { ActiveSahwEvent, SahwAlert } from '../types/prayer';

export function useSahwAudio(
  sessionId: number,
  activeEvent: ActiveSahwEvent | null,
  latestAlert: SahwAlert | null,
) {
  const audio = useRef<ReturnType<typeof createSahwAudio> | null>(null);
  const consumeEvent = useRef(createSahwAudioEventTracker());

  useEffect(() => {
    const player = createSahwAudio();
    audio.current = player;
    return () => {
      audio.current = null;
      player.dispose();
    };
  }, [sessionId]);

  useEffect(() => {
    // Mark the event before starting asynchronous playback. Re-renders,
    // continuing detections and React effect replays cannot replay it.
    if (consumeEvent.current(activeEvent, latestAlert)) {
      void audio.current?.play();
    }
  }, [sessionId, activeEvent, latestAlert]);
}
