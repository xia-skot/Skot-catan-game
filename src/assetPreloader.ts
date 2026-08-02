import { ALL_GAME_IMAGES, SAILING_BOAT_IMG, CATAN_LOGO_IMG } from './images';
import { audioService } from './audioService';

let isPreloaded = false;
let isPreloading = false;

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

function preloadSingleImage(src: string, timeoutMs: number = 4000): Promise<void> {
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
  onProgress?: (progressPercent: number, label: string) => void
): Promise<void> {
  if (checkIsAssetsCached()) {
    isPreloaded = true;
    if (onProgress) onProgress(100, '资源已就绪');
    return;
  }
  if (isPreloading) return;
  isPreloading = true;

  // Step 1: Priority load sailboat and logo first
  if (onProgress) onProgress(10, '正在初始化关键动画资源...');
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
    if (onProgress) {
      onProgress(percent, label);
    }
  };

  // Preload all remaining images with 3.5s timeout each
  const imagePromises = ALL_GAME_IMAGES.map((src) => {
    return preloadSingleImage(src, 3500).then(() => {
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

  if (onProgress) onProgress(100, '所有资源预加载完成');
}


