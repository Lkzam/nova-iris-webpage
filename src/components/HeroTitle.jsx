// Título sólido (texto real, selecionável) com efeito de "shine" metálico no
// hover — leve, só CSS, sem canvas/partículas (não trava).
export default function HeroTitle({ text = 'NOVA IRIS' }) {
  return <h1 className="hero-title">{text}</h1>
}
