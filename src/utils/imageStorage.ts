// Utilities for managing local `.src/` image folder storage and resolution

const SRC_FOLDER_STORAGE_KEY = 'flovenote_local_src_folder';
const CUSTOM_ASSETS_KEY = 'flovenote_custom_assets';

export interface LocalSrcFile {
  relativePath: string; // e.g. '.src/img_1723400000000_photo.png'
  dataUrl: string;      // Base64 Data URL
  fileName: string;
  createdAt: number;
}

/**
 * Saves a DataURL image into the virtual `.src/` relative directory in localStorage
 */
export function saveImageToLocalSrcFolder(
  dataUrl: string,
  originalName?: string
): { relativePath: string; fileName: string } {
  try {
    const time = Date.now();
    const cleanOriginalName = (originalName || 'image')
      .replace(/[^a-zA-Z0-9_\u4e00-\u9fa5-]/g, '_')
      .substring(0, 20);

    const fileName = `img_${time}_${cleanOriginalName}.png`;
    const relativePath = `.src/${fileName}`;

    // Get current stored .src/ files map
    const existingMapStr = localStorage.getItem(SRC_FOLDER_STORAGE_KEY);
    const existingMap: Record<string, string> = existingMapStr ? JSON.parse(existingMapStr) : {};

    // Save with normalized keys (.src/xxx, ./.src/xxx)
    existingMap[relativePath] = dataUrl;
    existingMap[`./${relativePath}`] = dataUrl;
    existingMap[`/${relativePath}`] = dataUrl;

    localStorage.setItem(SRC_FOLDER_STORAGE_KEY, JSON.stringify(existingMap));

    // Also register in custom assets for ResourceManagerModal
    try {
      const storedAssets = localStorage.getItem(CUSTOM_ASSETS_KEY);
      const assetsList = storedAssets ? JSON.parse(storedAssets) : [];
      const newAsset = {
        id: `src-asset-${time}`,
        name: originalName || fileName,
        url: relativePath,
        type: 'image',
        size: `${Math.round(dataUrl.length * 0.75 / 1024)} KB`,
        createdAt: time,
      };
      assetsList.unshift(newAsset);
      localStorage.setItem(CUSTOM_ASSETS_KEY, JSON.stringify(assetsList));
    } catch {
      // ignore asset registry error
    }

    return { relativePath, fileName };
  } catch (err) {
    console.error('Failed to save image to .src/ folder:', err);
    return { relativePath: dataUrl, fileName: originalName || 'image' };
  }
}

/**
 * Resolves a Markdown image URL.
 * If url starts with .src/ or ./.src/ or /.src/, looks up in virtual .src/ storage.
 */
export function resolveSrcImageUrl(url: string): string {
  if (!url || !url.trim()) return url;
  const cleanUrl = url.replace(/[\r\n]+/g, '').trim();

  if (cleanUrl.includes('.src/')) {
    try {
      const existingMapStr = localStorage.getItem(SRC_FOLDER_STORAGE_KEY);
      if (existingMapStr) {
        const existingMap: Record<string, string> = JSON.parse(existingMapStr);
        // Try direct lookup
        if (existingMap[cleanUrl]) return existingMap[cleanUrl];

        // Try normalized lookup
        const normalizedKey = cleanUrl.replace(/^\.\//, '').replace(/^\//, '');
        if (existingMap[normalizedKey]) return existingMap[normalizedKey];
        if (existingMap[`.src/${normalizedKey.split('.src/')[1]}`]) {
          return existingMap[`.src/${normalizedKey.split('.src/')[1]}`];
        }
      }
    } catch (err) {
      console.error('Failed to resolve .src image url:', err);
    }
  }

  return cleanUrl;
}

/**
 * Gets list of all stored .src/ images for Resource Manager
 */
export function getAllLocalSrcImages(): { relativePath: string; dataUrl: string }[] {
  try {
    const existingMapStr = localStorage.getItem(SRC_FOLDER_STORAGE_KEY);
    if (!existingMapStr) return [];
    const existingMap: Record<string, string> = JSON.parse(existingMapStr);
    const result: { relativePath: string; dataUrl: string }[] = [];
    
    Object.keys(existingMap).forEach((key) => {
      if (key.startsWith('.src/')) {
        result.push({
          relativePath: key,
          dataUrl: existingMap[key],
        });
      }
    });
    return result;
  } catch {
    return [];
  }
}
