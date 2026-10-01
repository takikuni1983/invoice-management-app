// 画像の周囲の余白（透明・白に近い部分）を切り取って PNG の data URL を返す（ブラウザ専用）
// 印鑑画像の右端を PDF の枠にぴったりそろえるために使う
export function trimImageMargins(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0);
      const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const isEmpty = (i: number) =>
        data[i + 3] < 16 || (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240);
      let top = height, left = width, right = -1, bottom = -1;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (isEmpty((y * width + x) * 4)) continue;
          if (x < left) left = x;
          if (x > right) right = x;
          if (y < top) top = y;
          if (y > bottom) bottom = y;
        }
      }
      if (right < 0) return resolve(dataUrl); // 中身が見つからなければそのまま
      if (left === 0 && top === 0 && right === width - 1 && bottom === height - 1) return resolve(dataUrl);

      const out = document.createElement('canvas');
      out.width = right - left + 1;
      out.height = bottom - top + 1;
      out.getContext('2d')!.drawImage(canvas, left, top, out.width, out.height, 0, 0, out.width, out.height);
      resolve(out.toDataURL('image/png'));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
