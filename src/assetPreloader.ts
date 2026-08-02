import { ALL_GAME_IMAGES, SAILING_BOAT_IMG, CATAN_LOGO_IMG } from './images';
import { audioService } from './audioService';

type ProgressCallback = (progressPercent: number, label: string) => void;

let isPreloaded = false;
let isPreloading = false;
let currentProgress = 0;
let currentLabel = '资源加载中...';
const progressListeners: ProgressCallback[] = [];

const CACHE_KEY = 'catan_assets_cached_v2';

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

function preloadSingleImage(src: string, timeoutMs: number = 3000): Promise<void> {
  return new Promise<void>((resolve) => {
    let resolved = false;
    const finish = () => {
      if (!resolved) {
        resolved = true;
        resolve();
      }
    };

    const timer = setTimeout(finish, timeoutMs);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;

    const tryDecodeAndFinish = () => {
      if ('decode' in img && typeof img.decode === 'function') {
        img.decode()
          .then(() => {
            clearTimeout(timer);
            finish();
          })
          .catch(() => {
            clearTimeout(timer);
            finish();
          });
      } else {
        clearTimeout(timer);
        finish();
      }
    };

    if (img.complete) {
      tryDecodeAndFinish();
    } else {
      img.onload = tryDecodeAndFinish;
      img.onerror = () => {
        clearTimeout(timer);
        finish();
      };
    }
  });
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

  // Step 1: Priority load sailboat and logo first
  broadcastProgress(10, '正在初始化关键动画资源...');
  await Promise.allSettled([
    preloadSingleImage(SAILING_BOAT_IMG, 2000),
    preloadSingleImage(CATAN_LOGO_IMG, 2000),
  ]);

  const totalImages = ALL_GAME_IMAGES.length;
  const totalAudio = 6;
  const totalAssets = totalImages + totalAudio;

  let loadedAssets = 0;

  const notifyProgress = (label: string) => {
    loadedAssets++;
    const percent = Math.min(100, Math.round((loadedAssets / totalAssets) * 100));
    broadcastProgress(percent, label);
  };

  // Preload all remaining images with 3s timeout each
  const imagePromises = ALL_GAME_IMAGES.map((src) => {
    return preloadSingleImage(src, 3000).then(() => {
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


