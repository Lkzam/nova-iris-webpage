// Ponteiro global compartilhado por todas as camadas (fundo, cérebro, texto).
// Guardamos o alvo (tx,ty) vindo do mouse e um valor suavizado (x,y) que as
// camadas leem dentro do seu próprio requestAnimationFrame — assim ninguém
// precisa re-renderizar o React a cada movimento do mouse.
//
// x/y são normalizados de -1 (esquerda/topo) a 1 (direita/baixo), 0 = centro.

const pointer = { tx: 0, ty: 0, x: 0, y: 0 }

if (typeof window !== 'undefined') {
  window.addEventListener(
    'mousemove',
    (e) => {
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1
      pointer.ty = (e.clientY / window.innerHeight) * 2 - 1
    },
    { passive: true },
  )

  // suavização (easing) contínua
  const loop = () => {
    pointer.x += (pointer.tx - pointer.x) * 0.07
    pointer.y += (pointer.ty - pointer.y) * 0.07
    requestAnimationFrame(loop)
  }
  requestAnimationFrame(loop)
}

export default pointer
