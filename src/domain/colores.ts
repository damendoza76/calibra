/*
 * Colores de ficha: tonos cálidos derivados del ámbar.
 * Se evitan a propósito el verde y el ladrillo, reservados para ocurrió / no ocurrió.
 */
export const PALETA_FICHAS = [
  '#E39A00', // ámbar
  '#B8742A', // caramelo
  '#8C6D1F', // ocre oscuro
  '#C9A227', // mostaza
  '#7A5C3E', // café
  '#B07D5B', // arcilla
  '#D98B3A', // naranja tostado
  '#6F6A3B', // aceituna seca
  '#9C7A54', // cuero
  '#C4904B', // miel
]

export function colorPara(indice: number): string {
  return PALETA_FICHAS[((indice % PALETA_FICHAS.length) + PALETA_FICHAS.length) % PALETA_FICHAS.length]
}
