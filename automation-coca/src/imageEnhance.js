import { Jimp } from 'jimp';

// Retoque automático para fotos de producto que llegan por WhatsApp/mail,
// normalmente sacadas apurado con el celular: nivela el balance de luz/color,
// le suma un poco de contraste y nitidez para que se vean prolijas en Instagram.
export async function enhanceImageFile(filePath) {
  try {
    const img = await Jimp.read(filePath);
    img
      .normalize()
      .contrast(0.08)
      .color([{ apply: 'saturate', params: [12] }])
      .convolute([
        [0, -1, 0],
        [-1, 5, -1],
        [0, -1, 0],
      ]);
    await img.write(filePath);
  } catch (err) {
    console.error('[imageEnhance] no se pudo retocar la imagen, se usa la original:', err.message);
  }
}
