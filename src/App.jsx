import { useEffect, useRef } from 'react'
import Starfield from './components/Starfield'
import Brain from './components/Brain'
import HeroTitle from './components/HeroTitle'
import StaggeredMenu from './components/StaggeredMenu'
import ApproachSection from './components/ApproachSection'
import pointer from './lib/pointer'

const menuItems = [
  { label: 'Início', ariaLabel: 'Ir para o início', link: '#inicio' },
  { label: 'Sobre', ariaLabel: 'Saiba mais sobre nós', link: '#sobre' },
  { label: 'Projetos', ariaLabel: 'Ver projetos', link: '#projetos' },
  { label: 'Contato', ariaLabel: 'Entre em contato', link: '#contato' },
]

const socialItems = [
  { label: 'Instagram', link: 'https://instagram.com' },
  { label: 'LinkedIn', link: 'https://linkedin.com' },
  { label: 'GitHub', link: 'https://github.com' },
]

export default function App() {
  const heroRef = useRef(null)
  const sceneRef = useRef(null)

  // parallax sutil no bloco de texto (move menos que o cérebro)
  useEffect(() => {
    let raf = 0
    const el = heroRef.current
    const loop = () => {
      if (el) {
        el.style.transform = `translate3d(${pointer.x * 12}px, ${pointer.y * 10}px, 0)`
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  // saída suave: ao rolar, a tela do hero desvanece e recua um pouco,
  // revelando o degrade do fundo por baixo (em vez de um corte seco)
  useEffect(() => {
    let raf = 0
    const loop = () => {
      const scene = sceneRef.current
      if (scene) {
        const vh = window.innerHeight
        const p = Math.min(Math.max(window.scrollY / (vh * 0.9), 0), 1)
        scene.style.opacity = String(1 - p)
        scene.style.transform = `scale(${1 - p * 0.06})`
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <>
      <StaggeredMenu
        position="right"
        isFixed
        items={menuItems}
        socialItems={socialItems}
        displaySocials
        displayItemNumbering
        menuButtonColor="#ffffff"
        openMenuButtonColor="#ffffff"
        changeMenuColorOnOpen={false}
        colors={['#4a4a52', '#26262b']}
        logoUrl="/logo.svg"
        accentColor="#a8a8b0"
      />

      <main>
        {/* Seção 1 — hero com partículas, cérebro 3D e título */}
        <section id="inicio" className="scene" ref={sceneRef}>
          <Starfield />
          <Brain />
          <div className="hero" ref={heroRef}>
            <HeroTitle text="NOVA IRIS" />
            <p className="hero-subtitle">Transformando ideias em realidade</p>
          </div>
          {/* cobre a marca d'água "Built with Spline" no canto inferior direito */}
          <div className="watermark-cover" />
        </section>

        {/* Seção 2 — abordagem (3D + motion + design + backend) */}
        <ApproachSection />
      </main>
    </>
  )
}
