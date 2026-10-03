/**
 * Reduce una foto a un cuadrado pequeño (JPEG) y la devuelve como data URL.
 * Así ocupa pocos KB, se guarda en el dispositivo y viaja dentro del respaldo JSON.
 */
export async function reducirFoto(archivo: File, lado = 160): Promise<string> {
  const url = URL.createObjectURL(archivo)
  try {
    const img = await new Promise<HTMLImageElement>((ok, mal) => {
      const i = new Image()
      i.onload = () => ok(i)
      i.onerror = () => mal(new Error('No pude leer esa imagen.'))
      i.src = url
    })
    const corte = Math.min(img.naturalWidth, img.naturalHeight)
    const lienzo = document.createElement('canvas')
    lienzo.width = lado
    lienzo.height = lado
    const ctx = lienzo.getContext('2d')!
    ctx.drawImage(img, (img.naturalWidth - corte) / 2, (img.naturalHeight - corte) / 2, corte, corte, 0, 0, lado, lado)
    return lienzo.toDataURL('image/jpeg', 0.82)
  } finally {
    URL.revokeObjectURL(url)
  }
}
