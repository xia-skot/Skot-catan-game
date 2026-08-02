import { ALL_GAME_IMAGES, SAILING_BOAT_IMG, CATAN_LOGO_IMG, getImageCandidates, RESOLVED_IMAGE_MAP } from './images';
import { audioService } from './audioService';

type ProgressCallback = (progressPercent: number, label: string) => void;

let isPreloaded = false;
let isPreloading = false;
let currentProgress = 0;
let currentLabel = '资源加载中...';
const progressListeners: ProgressCallback[] = [];

const CACHE_KEY = 'catan_assets_cached_v3';

export function checkIsAssetsCached(): boolean {
  try {
    if (typeof window !== 'undefined' && window.location.search.toLowerCase().includes('resetcache')) {
      clearAssetsCache();
      return false;
    }
  } catch {}
  if (isPreloaded) return true;
  try {
    return localStorage.getItem(CACHE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function clearAssetsCache(): void {
  isPreloaded = false;
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {}
}

function preloadSingleImageCandidate(candidateUrl: string, timeoutMs: number = 3000): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    let finished = false;
    const done = (success: boolean) => {
      if (!finished) {
        finished = true;
        clearTimeout(timer);
        resolve(success);
      }
    };

    const timer = setTimeout(() => done(false), timeoutMs);

    const img = new Image();
    img.referrerPolicy = 'no-referrer';

    img.onload = () => {
      if (img.naturalWidth > 0) {
        done(true);
      } else {
        done(false);
      }
    };

    img.onerror = () => done(false);
    img.src = candidateUrl;

    if (img.complete && img.naturalWidth > 0) {
      done(true);
    }
  });
}

async function preloadSingleImage(originalSrc: string): Promise<void> {
  const candidates = getImageCandidates(originalSrc);
  for (const candidateUrl of candidates) {
    const success = await preloadSingleImageCandidate(candidateUrl, 3000);
    if (success) {
      RESOLVED_IMAGE_MAP[originalSrc] = candidateUrl;
      return;
    }
  }
  // If all CDN candidates failed, assign the first candidate as fallback
  if (candidates.length > 0) {
    RESOLVED_IMAGE_MAP[originalSrc] = candidates[0];
  }
}

export async function preloadAllAssets(
  onProgress?: ProgressCallback
): Promise<void> {
  if (checkIsAssetsCached()) {
    isPreloaded = true;
    currentProgress = 100;
    if (onProgress) onProgress(100, '资源已就绪');
    return;
  }

  if (onProgress) {
    progressListeners.push(onProgress);
    if (isPreloading) {
      onProgress(currentProgress, currentLabel);
    }
  }

  if (isPreloading) return;
  isPreloading = true;

  const broadcastProgress = (percent: number, label: string) => {
    currentProgress = percent;
    currentLabel = label;
    progressListeners.forEach(fn => {
      try {
        fn(percent, label);
      } catch (e) {}
    });
  };

  // Priority load sailboat and logo first
  broadcastProgress(5, '正在初始化关键动画资源...');
  await Promise.allSettled([
    preloadSingleImage(SAILING_BOAT_IMG),
    preloadSingleImage(CATAN_LOGO_IMG),
  ]);

  const totalImages = ALL_GAME_IMAGES.length;
  const totalAudio = 6;
  const totalAssets = totalImages + totalAudio;

  let loadedAssets = 0;

  const notifyProgress = (label: string) => {
    loadedAssets++;
    const percent = Math.min(99, Math.round(5 + (loadedAssets / totalAssets) * 94));
    broadcastProgress(percent, label);
  };

  // Preload all remaining images with candidate failover
  const imagePromises = ALL_GAME_IMAGES.map((src) => {
    return preloadSingleImage(src).then(() => {
      notifyProgress('正在加载游戏贴图与图标...');
    });
  });

  // Preload audio
  const audioPromise = audioService.preloadAllAudio(() => {
    notifyProgress('正在预缓存音频与音效...');
  }).catch(() => {});

  await Promise.allSettled([...imagePromises, audioPromise]);

  isPreloaded = true;
  isPreloading = false;
  try {
    localStorage.setItem(CACHE_KEY, 'true');
  } catch {}

  broadcastProgress(100, '所有资源预加载完成');
}


