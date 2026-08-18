/**
 * Helper to process clipboard paste events and extract image files,
 * converting them into Base64 Data URLs for local note insertion.
 */
export function handleClipboardImagePaste(
  e: React.ClipboardEvent<HTMLElement>,
  onImageExtracted: (dataUrl: string, altName: string) => void
): boolean {
  const items = e.clipboardData?.items;
  if (!items) return false;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.type.indexOf('image') !== -1) {
      e.preventDefault();
      const file = item.getAsFile();
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          let dataUrl = event.target?.result as string;
          if (dataUrl) {
            // Clean up any potential newlines in base64 string
            dataUrl = dataUrl.replace(/[\r\n]+/g, '');
            const timeStr = new Date().toLocaleTimeString('zh-CN', { hour12: false }).replace(/:/g, '');
            const imageName = file.name && file.name !== 'image.png' 
              ? file.name.replace(/\.[^/.]+$/, '')
              : `剪贴板图片_${timeStr}`;
            onImageExtracted(dataUrl, imageName);
          }
        };
        reader.onerror = (err) => {
          console.error('Failed to read pasted image file:', err);
        };
        reader.readAsDataURL(file);
        return true;
      }
    }
  }

  return false;
}
