/* Brilho com interpolação temporal, ativo apenas durante a interação. */
(() => {
 const reduced = matchMedia('(prefers-reduced-motion: reduce)');
 document.querySelectorAll('#sobre .border-glow-card').forEach(card => {
  let frame = 0, previous = 0, edge = 0, angle = 135;
  let targetEdge = 0, targetAngle = angle, rect = null, entering = true;
  function paint() {
   card.style.setProperty('--edge-proximity', edge.toFixed(3));
   card.style.setProperty('--cursor-angle', angle.toFixed(3) + 'deg');
  }
  function tick(now) {
   const elapsed = previous ? Math.min(now - previous, 50) : 16.67;
   previous = now;
   const blend = 1 - Math.exp(-elapsed / (targetEdge > edge ? 95 : 160));
   const delta = ((targetAngle - angle + 540) % 360) - 180;
   edge += (targetEdge - edge) * blend;
   angle = (angle + delta * (1 - Math.exp(-elapsed / 100)) + 360) % 360;
   const settled = Math.abs(targetEdge - edge) < .03 && Math.abs(delta) < .08;
   if (settled) { edge = targetEdge; angle = targetAngle; }
   paint();
   if (!settled) frame = requestAnimationFrame(tick);
   else { frame = 0; previous = 0; }
  }
  function wake() {
   if (reduced.matches) { cancelAnimationFrame(frame); frame = 0; previous = 0; edge = targetEdge; angle = targetAngle; paint(); return; }
   if (!frame) frame = requestAnimationFrame(tick);
  }
  function move(event) {
   if (event.pointerType === 'touch') return;
   rect ||= card.getBoundingClientRect();
   const cx = rect.width / 2, cy = rect.height / 2;
   if (!cx || !cy) return;
   const dx = event.clientX - rect.left - cx, dy = event.clientY - rect.top - cy;
   targetEdge = Math.min(1, Math.max(Math.abs(dx) / cx, Math.abs(dy) / cy)) * 100;
   targetAngle = (Math.atan2(dy, dx) * 180 / Math.PI + 450) % 360;
   if (entering) { angle = targetAngle; entering = false; }
   wake();
  }
  function leave() { targetEdge = 0; entering = true; rect = null; wake(); }
  card.addEventListener('pointerenter', event => { rect = card.getBoundingClientRect(); entering = true; move(event); }, {passive:true});
  card.addEventListener('pointermove', move, {passive:true});
  card.addEventListener('pointerleave', leave, {passive:true});
  card.addEventListener('pointercancel', leave, {passive:true});
  window.addEventListener('resize', () => { rect = null; }, {passive:true});
  window.addEventListener('scroll', () => { rect = null; }, {passive:true});
  function reset() { cancelAnimationFrame(frame); frame = 0; previous = 0; edge = targetEdge = 0; entering = true; rect = null; paint(); }
  reduced.addEventListener('change', reset);
  window.addEventListener('pagehide', reset);
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
 });
})();