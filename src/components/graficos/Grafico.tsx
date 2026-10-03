import type { ReactNode } from 'react'
import s from './Grafico.module.css'

/**
 * Marco común: ningún gráfico sin su frase en lenguaje llano,
 * y siempre con una alternativa en tabla para quien no pueda verlo.
 */
export function Grafico({
  titulo,
  frase,
  ejemplo,
  tabla,
  children,
}: {
  titulo: string
  frase: ReactNode
  ejemplo?: boolean
  tabla?: ReactNode
  children: ReactNode
}) {
  return (
    <figure className={`card ${s.grafico}`}>
      {ejemplo && <MarcaEjemplo />}
      <h3 className={s.titulo}>{titulo}</h3>
      <div className={s.lienzo}>{children}</div>
      <figcaption className={s.frase}>{frase}</figcaption>
      {tabla && (
        <details className={s.tabla}>
          <summary>Ver los números</summary>
          {tabla}
        </details>
      )}
    </figure>
  )
}

export function MarcaEjemplo() {
  return <span className={s.marca}>ejemplo ilustrativo · no son tus datos</span>
}
