import { useEffect, useRef } from 'react'
import pointer from '../lib/pointer'

// Campo de estrelas em canvas 2D.
// Cada estrela tem uma "profundidade" (depth): estrelas mais "próximas"
// (depth alto) são maiores, mais brilhantes e se deslocam mais com o parallax.
export default function Starfield() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let width = 0
    let height = 0
    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    let stars = []
    let raf = 0

    const STAR_COUNT = 320

    function resize() {
      width = canvas.clientWidth
      height = canvas.clientHeight
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      buildStars()
    }

    function buildStars() {
      stars = []
      for (let i = 0; i < STAR_COUNT; i++) {
        const depth = Math.random() // 0 = longe, 1 = perto
        const angle = Math.random() * Math.PI * 2
        // velocidade base lenta; estrelas "próximas" derivam um pouco mais
        const speed = (0.04 + Math.random() * 0.12) * (0.5 + depth)
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          depth,
          radius: 0.4 + depth * 1.6,
          baseAlpha: 0.25 + depth * 0.6,
          twinkle: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.005 + Math.random() * 0.02,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
        })
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height)

      // deslocamento de parallax: estrelas "perto" se movem mais
      const offX = pointer.x * 26
      const offY = pointer.y * 26

      for (const s of stars) {
        s.twinkle += s.twinkleSpeed
        const alpha = s.baseAlpha * (0.6 + 0.4 * Math.sin(s.twinkle))

        // deriva lenta e autônoma (alem do parallax)
        s.x += s.vx
        s.y += s.vy
        // dá a volta ao sair da tela (com margem pro glow)
        const m = 8
        if (s.x < -m) s.x = width + m
        else if (s.x > width + m) s.x = -m
        if (s.y < -m) s.y = height + m
        else if (s.y > height + m) s.y = -m

        const px = s.x + offX * s.depth
        const py = s.y + offY * s.depth

        ctx.beginPath()
        ctx.arc(px, py, s.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(225, 228, 235, ${alpha})`
        ctx.fill()

        // glow nas estrelas maiores
        if (s.depth > 0.7) {
          ctx.beginPath()
          ctx.arc(px, py, s.radius * 3.5, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(200, 205, 215, ${alpha * 0.08})`
          ctx.fill()
        }
      }

      raf = requestAnimationFrame(draw)
    }

    resize()
    draw()
    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="starfield" />
}
