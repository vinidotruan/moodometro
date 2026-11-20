/** Lê a imagem escolhida pelo usuário e devolve um JPEG quadrado pequeno (data URL) pra guardar no navegador. */
export async function fileToPhoto(file: File, size = 160): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Escolha uma imagem');

  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error('Não deu pra abrir essa imagem');
  });
  try {
    // Recorte quadrado central: lado = menor dimensão.
    const side = Math.min(bitmap.width, bitmap.height);
    const sx = (bitmap.width - side) / 2;
    const sy = (bitmap.height - side) / 2;

    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Não deu pra processar a imagem');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);
    return canvas.toDataURL('image/jpeg', 0.82);
  } finally {
    bitmap.close();
  }
}
