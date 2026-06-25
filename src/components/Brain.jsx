import { Suspense, lazy, useEffect, useRef } from 'react'
import pointer from '../lib/pointer'

// Carrega o Spline só quando precisa (lazy) — o runtime é pesado.
const Spline = lazy(() => import('@splinetool/react-spline'))

const SCENE = 'https://prod.spline.design/XssvEUIbhQ6tVIWn/scene.splinecode'

export default function Brain() {
  const wrapRef = useRef(null)

  // Parallax do cérebro: aplicamos um translate + leve rotação (tilt) no
  // container conforme o mouse. Como é CSS no wrapper, funciona igual
  // independente de a cena 3D ter ou não mouse-look interno.
  useEffect(() => {
    let raf = 0
    const el = wrapRef.current

    const loop = () => {
      if (el) {
        const tx = pointer.x * 34
        const ty = pointer.y * 28
        const rotY = pointer.x * 6
        const rotX = -pointer.y * 6
        el.style.transform =
          `translate3d(${tx}px, ${ty}px, 0) ` +
          `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.05)`
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="brain" ref={wrapRef}>
      <Suspense fallback={<div className="brain-loading">carregando cérebro…</div>}>
        <Spline scene={SCENE} />
      </Suspense>
    </div>
  )
}
