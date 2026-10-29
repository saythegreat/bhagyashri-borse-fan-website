const MAX_AUTOPLAYING_VIDEOS = 1;

interface VisibleVideo {
  onBlocked: () => void;
  onGrantChanged: (granted: boolean) => void;
}

const visibleVideos = new Map<HTMLVideoElement, VisibleVideo>();
const grantedVideos = new Set<HTMLVideoElement>();

function startVisibleVideos() {
  for (const [video, callbacks] of Array.from(visibleVideos.entries())) {
    if (grantedVideos.size >= MAX_AUTOPLAYING_VIDEOS) break;
    if (grantedVideos.has(video)) continue;

    // Pause any other video that might be currently playing
    pauseAllOtherVideos(video);

    grantedVideos.add(video);
    callbacks.onGrantChanged(true);
    video.play().catch(() => {
      visibleVideos.delete(video);
      grantedVideos.delete(video);
      callbacks.onGrantChanged(false);
      callbacks.onBlocked();
      startVisibleVideos();
    });
  }
}

export function pauseAllOtherVideos(activeVideo: HTMLVideoElement) {
  if (typeof document === "undefined") return;
  const allVideos = document.querySelectorAll<HTMLVideoElement>("video");
  allVideos.forEach((v) => {
    if (v !== activeVideo && !v.paused) {
      v.pause();
    }
  });
  // Clear any other granted video
  for (const v of Array.from(grantedVideos)) {
    if (v !== activeVideo) {
      grantedVideos.delete(v);
      const cb = visibleVideos.get(v);
      cb?.onGrantChanged(false);
    }
  }
}

export function queueVisibleVideo(
  video: HTMLVideoElement,
  onBlocked: () => void,
  onGrantChanged: (granted: boolean) => void,
) {
  visibleVideos.set(video, { onBlocked, onGrantChanged });
  startVisibleVideos();
}

export function pauseQueuedVideo(video: HTMLVideoElement) {
  const callbacks = visibleVideos.get(video);
  visibleVideos.delete(video);
  if (grantedVideos.delete(video)) {
    callbacks?.onGrantChanged(false);
  }
  video.pause();
  startVisibleVideos();
}
