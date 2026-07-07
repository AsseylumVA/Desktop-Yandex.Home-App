/** Default playback gain (~400%) — camera mics are often very quiet. */
export const CAMERA_AUDIO_GAIN = 4.0;

export interface VideoAudioBoost {
  setGain: (value: number) => void;
  release: () => void;
}

const attached = new WeakMap<HTMLVideoElement, VideoAudioBoost>();

/**
 * Route <video> audio through a GainNode so volume can exceed HTMLMediaElement's 1.0 cap.
 * Safe to call repeatedly on the same element — createMediaElementSource runs once.
 */
export const attachVideoAudioBoost = (
  video: HTMLVideoElement,
  initialGain = CAMERA_AUDIO_GAIN,
): VideoAudioBoost => {
  const existing = attached.get(video);
  if (existing) {
    existing.setGain(initialGain);
    return existing;
  }

  const ctx = new AudioContext();
  const source = ctx.createMediaElementSource(video);
  const gainNode = ctx.createGain();
  gainNode.gain.value = initialGain;
  source.connect(gainNode);
  gainNode.connect(ctx.destination);

  const resume = () => { void ctx.resume(); };
  video.addEventListener('play', resume);
  void ctx.resume();

  const boost: VideoAudioBoost = {
    setGain: (value) => { gainNode.gain.value = value; },
    release: () => {
      video.removeEventListener('play', resume);
      attached.delete(video);
      try {
        source.disconnect();
        gainNode.disconnect();
      } catch { /* ignore */ }
      void ctx.close();
    },
  };

  attached.set(video, boost);
  return boost;
};
