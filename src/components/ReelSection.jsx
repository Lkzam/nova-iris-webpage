import { useEffect, useRef } from 'react'

// --- Homografia: gera a matrix3d que mapeia um retângulo (w×h) para um
// quadrilátero arbitrário definido por 4 cantos. É isso que permite mover
// cada canto de forma independente (o que skew/rotate não conseguem).
// Implementação clássica (projeção 2D geral).
function adj(m) {
  return [
    m[4] * m[8] - m[5] * m[7], m[2] * m[7] - m[1] * m[8], m[1] * m[5] - m[2] * m[4],
    m[5] * m[6] - m[3] * m[8], m[0] * m[8] - m[2] * m[6], m[2] * m[3] - m[0] * m[5],
    m[3] * m[7] - m[4] * m[6], m[1] * m[6] - m[0] * m[7], m[0] * m[4] - m[1] * m[3],
  ]
}
function multmm(a, b) {
  const c = Array(9)
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++) {
      let cij = 0
      for (let k = 0; k < 3; k++) cij += a[3 * i + k] * b[3 * k + j]
      c[3 * i + j] = cij
    }
  return c
}
function multmv(m, v) {
  return [
    m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
    m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
    m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
  ]
}
function basisToPoints(x1, y1, x2, y2, x3, y3, x4, y4) {
  const m = [x1, x2, x3, y1, y2, y3, 1, 1, 1]
  const v = multmv(adj(m), [x4, y4, 1])
  return multmm(m, [v[0], 0, 0, 0, v[1], 0, 0, 0, v[2]])
}
function general2DProjection(
  x1s, y1s, x1d, y1d, x2s, y2s, x2d, y2d,
  x3s, y3s, x3d, y3d, x4s, y4s, x4d, y4d,
) {
  const s = basisToPoints(x1s, y1s, x2s, y2s, x3s, y3s, x4s, y4s)
  const d = basisToPoints(x1d, y1d, x2d, y2d, x3d, y3d, x4d, y4d)
  return multmm(d, adj(s))
}
// w,h = tamanho de origem; c = cantos destino {tl,tr,bl,br} em coords locais
function matrix3dForQuad(w, h, c) {
  const t = general2DProjection(
    0, 0, c.tl[0], c.tl[1],
    w, 0, c.tr[0], c.tr[1],
    0, h, c.bl[0], c.bl[1],
    w, h, c.br[0], c.br[1],
  )
  for (let i = 0; i < 9; i++) t[i] = t[i] / t[8]
  const m = [
    t[0], t[3], 0, t[6],
    t[1], t[4], 0, t[7],
    0, 0, 1, 0,
    t[2], t[5], 0, t[8],
  ]
  return `matrix3d(${m.join(',')})`
}

// Seção 3 — o reel.
// A box ocupa a tela cheia (estado final). O vídeo (mídia) é mapeado por
// matrix3d nos 4 cantos. Cada canto sai do estado miniatura (à direita) para
// o estado final com um ATRASO próprio (stagger): TL primeiro, depois BL, TR,
// BR — dando o efeito de "puxar um canto de cada vez" pra aumentar o vídeo.
//
// Vídeo: coloque o arquivo em public/ e passe na prop `videoSrc`
// (ex.: <ReelSection videoSrc="/reel.mp4" />). Sem vídeo, mostra um placeholder.
export default function ReelSection({ videoSrc, poster }) {
  const wrapRef = useRef(null)
  const boxRef = useRef(null)
  const mediaRef = useRef(null)
  const innerRef = useRef(null)
  const overlayRef = useRef(null)
  const videoRef = useRef(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const box = boxRef.current
    const media = mediaRef.current
    const inner = innerRef.current
    const overlay = overlayRef.current
    if (!wrap || !box || !media) return

    const lerp = (a, b, t) => a + (b - a) * t
    const clamp = (v, a, b) => Math.min(Math.max(v, a), b)
    const smooth = (t) => t * t * (3 - 2 * t) // easing suave por canto

    // ordem e atraso de cada canto (stagger)
    const DELAY = 0.16 // separação entre os cantos
    const SPAN = 1 - 3 * DELAY // duração do trajeto de cada canto
    const order = { tl: 0, bl: 1, tr: 2, br: 3 } // TL -> BL -> TR -> BR

    let current = 0
    let raf = 0

    const tick = () => {
      const rect = wrap.getBoundingClientRect()
      const vh = window.innerHeight
      const scrollable = rect.height - vh
      const target = clamp(-rect.top / scrollable, 0, 1)
      current += (target - current) * 0.09 // easing global (fluido)
      const p = current

      const vw = window.innerWidth

      // estado inicial: miniatura 16:9, à direita, mais pra cima
      const sW = vw * 0.4
      const sH = sW * (9 / 16)
      const sL = vw * 0.94 - sW
      const sT = vh * 0.06

      // estado final: quase tela cheia, centralizado
      const eW = vw * 0.96
      const eH = vh * 0.88
      const eL = (vw - eW) / 2
      const eT = (vh - eH) / 2

      // a box fica fixa no tamanho final; a deformação vem da matrix3d
      box.style.left = `${eL}px`
      box.style.top = `${eT}px`
      box.style.width = `${eW}px`
      box.style.height = `${eH}px`

      // cantos: inicial (miniatura) e final (tela cheia), em coords absolutas
      const start = {
        tl: [sL, sT], tr: [sL + sW, sT], bl: [sL, sT + sH], br: [sL + sW, sT + sH],
      }
      const end = {
        tl: [eL, eT], tr: [eL + eW, eT], bl: [eL, eT + eH], br: [eL + eW, eT + eH],
      }

      // progresso individual de cada canto (com atraso)
      const cps = {}
      for (const k of ['tl', 'tr', 'bl', 'br']) {
        cps[k] = smooth(clamp((p - order[k] * DELAY) / SPAN, 0, 1))
      }

      // posição atual de cada canto, relativa à origem da box (eL,eT)
      const local = {}
      for (const k of ['tl', 'tr', 'bl', 'br']) {
        const cp = cps[k]
        local[k] = [
          lerp(start[k][0], end[k][0], cp) - eL,
          lerp(start[k][1], end[k][1], cp) - eT,
        ]
      }

      media.style.transformOrigin = '0 0'
      media.style.transform = matrix3dForQuad(eW, eH, local)

      // --- bordas curvas: cada aresta encurva conforme a diferença de
      // progresso entre seus dois cantos. Um canto adiantado faz a linha que
      // o liga ao vizinho virar uma curva (bézier), em vez de ficar reta.
      const Kh = eW * 0.09
      const Kv = eH * 0.09
      const bTop = Math.abs(cps.tr - cps.tl) * Kv
      const bRight = Math.abs(cps.br - cps.tr) * Kh
      const bBottom = Math.abs(cps.bl - cps.br) * Kv
      const bLeft = Math.abs(cps.tl - cps.bl) * Kh
      const totalBow = bTop + bRight + bBottom + bLeft

      // overscan do conteúdo durante a transição (dá "material" pra curva sair)
      const bend = Math.sin(p * Math.PI)
      if (inner) inner.style.transform = `scale(${1 + bend * 0.2})`

      if (totalBow > 2) {
        const w = eW
        const h = eH
        // arestas como curvas bézier, pontos de controle deslocados pra fora
        media.style.clipPath =
          `path('M 0 0 ` +
          `C ${w / 3} ${-bTop}, ${(2 * w) / 3} ${-bTop}, ${w} 0 ` +
          `C ${w + bRight} ${h / 3}, ${w + bRight} ${(2 * h) / 3}, ${w} ${h} ` +
          `C ${(2 * w) / 3} ${h + bBottom}, ${w / 3} ${h + bBottom}, 0 ${h} ` +
          `C ${-bLeft} ${(2 * h) / 3}, ${-bLeft} ${h / 3}, 0 0 Z')`
        media.style.borderRadius = '0px'
      } else {
        // em repouso: sem curva, cantos arredondados normais
        media.style.clipPath = 'none'
        media.style.borderRadius = `${lerp(18, 20, p)}px`
      }

      // overlay PLAY REEL aparece na metade final
      if (overlay) {
        const ov = clamp((p - 0.6) / 0.4, 0, 1)
        overlay.style.opacity = `${ov}`
        overlay.style.pointerEvents = ov > 0.6 ? 'auto' : 'none'
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  // clique no PLAY: dá play com som / tela cheia (ajuste como preferir)
  const handlePlay = () => {
    const video = videoRef.current
    if (video) {
      video.muted = false
      video.play?.()
      video.requestFullscreen?.()
    }
  }

  return (
    <section className="reel-scroll" ref={wrapRef} id="reel">
      <div className="reel-sticky">
        <div className="reel-box" ref={boxRef}>
          <div className="reel-media" ref={mediaRef}>
            <div className="reel-inner" ref={innerRef}>
              {videoSrc ? (
                <video
                  ref={videoRef}
                  className="reel-video"
                  src={videoSrc}
                  poster={poster}
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : (
                <div className="reel-fallback" />
              )}
            </div>
          </div>

          <button
            className="reel-overlay"
            ref={overlayRef}
            onClick={handlePlay}
            aria-label="Assistir ao reel"
            type="button"
          >
            <span>Play</span>
            <span className="reel-playbtn" aria-hidden="true">
              ▶
            </span>
            <span>Reel</span>
          </button>
        </div>
      </div>
    </section>
  )
}
