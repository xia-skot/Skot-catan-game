import { ALL_GAME_IMAGES } from './images';
import { audioService } from './audioService';

let isPreloaded = false;
let isPreloading = false;

export async function preloadAllAssets(
  onProgress?: (progressPercent: number, label: string) => void
): Promise<void> {
  if (isPreloaded) {
    if (onProgress) onProgress(100, '资源已就绪');
    return;
  }
  if (isPreloading) return;
  isPreloading = true;

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

  // Preload images
  const imagePromises = ALL_GAME_IMAGES.map((src) => {
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.src = src;
      const done = () => {
        notifyProgress('正在加载游戏贴图与图标...');
        resolve();
      };
      if (img.complete) {
        done();
      } else {
        img.onload = done;
        img.onerror = done;
      }
    });
  });

  // Preload audio
  const audioPromise = audioService.preloadAllAudio(() => {
    notifyProgress('正在预缓存音频与音效...');
  });

  await Promise.allSettled([...imagePromises, audioPromise]);

  isPreloaded = true;
  isPreloading = false;
  if (onProgress) onProgress(100, '所有资源预加载完成');
}
