import { useEffect, useRef, useState } from 'react'

// Segunda seção da página. Aparece ao rolar pra baixo.
// - texto com animação de entrada (IntersectionObserver)
// - uma linha SVG que se "desenha" conforme o scroll avança na seção
// - box do reel: já pronta pra receber um vídeo. Quando você tiver o reel,
//   é só colocar o arquivo em public/ e passar o caminho na prop `videoSrc`
//   (ex.: <ApproachSection videoSrc="/reel.mp4" />). Sem vídeo, mostra um placeholder.
export default function ApproachSection({ videoSrc, poster }) {
  const sectionRef = useRef(null)
  const pathRef = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const section = sectionRef.current
    const path = pathRef.current
    if (!section || !path) return

    // prepara a linha: começa totalmente "escondida" (offset = comprimento)
    const length = path.getTotalLength()
    path.style.strokeDasharray = `${length}`
    path.style.strokeDashoffset = `${length}`

    // Loop contínuo com easing (lerp): em vez de saltar a linha a cada evento
    // de scroll (o que causava a sensação de "travado"), a cada frame o valor
    // atual persegue suavemente o alvo. Isso dá o desenho fluido tipo LUSION.
    let current = 0
    let raf = 0
    const tick = () => {
      const rect = section.getBoundingClientRect()
      const vh = window.innerHeight
      const total = rect.height + vh
      const seen = vh - rect.top
      const target = Math.min(Math.max(seen / total, 0), 1)
      current += (target - current) * 0.08 // fator de suavização
      path.style.strokeDashoffset = `${length * (1 - current)}`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    // dispara a animação de entrada do texto quando a seção aparece
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setInView(true)
        })
      },
      { threshold: 0.2 },
    )
    io.observe(section)

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      id="sobre"
      className={`approach${inView ? ' in-view' : ''}`}
    >
      <svg
        className="approach-line"
        viewBox="0 0 300 1000"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="approachLineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a8a8b0" stopOpacity="0.15" />
            <stop offset="45%" stopColor="#bcd0ff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#5b7bff" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <path
          ref={pathRef}
          d="M 150 -20 C 30 130, 270 230, 150 370 S 20 580, 150 700 S 285 880, 150 1030"
          stroke="url(#approachLineGrad)"
        />
      </svg>

      <div className="approach-content">
        <p className="approach-eyebrow reveal">Nossa abordagem</p>
        <h2 className="approach-title reveal">
          3D, motion e design — sustentados por um <em>backend que funciona de verdade</em>.
        </h2>
        <p className="approach-text reveal">
          Na NOVA IRIS, estética e engenharia andam juntas. Criamos experiências
          imersivas em 3D e motion, com um design afiado — e, por trás de tudo,
          construímos um backend sólido: rápido, seguro e pronto para escalar.
          Da primeira ideia ao deploy, entregamos o sistema completo: impressionante
          por fora, robusto por dentro. Se você quer tirar o seu projeto do papel,
          a gente desenvolve com você.
        </p>
        <a className="approach-cta reveal" href="#contato">
          Vamos conversar
        </a>
      </div>

      <div className="reel reveal">
        {videoSrc ? (
          <video
            className="reel-video"
            src={videoSrc}
            poster={poster}
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          <div className="reel-placeholder">
            <span className="reel-play">▶</span>
            <span>Reel de apresentação em breve</span>
          </div>
        )}
      </div>
    </section>
  )
}
