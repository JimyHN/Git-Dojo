// GitDojo — portada, índice del temario y animaciones de scroll.
const $ = (sel) => document.querySelector(sel);
const CHECK_SVG = '<svg viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6.5"/></svg>';
const NOMBRE_TIPO = { practica: "práctica", mixta: "mixta", teoria: "teoría" };

// ===== Temario =====
async function cargarTemario() {
  const bloques = await (await fetch("/api/temario")).json();
  const cont = $("#bloques");
  cont.innerHTML = "";

  bloques.forEach((b, bi) => {
    const hechas = b.lecciones.filter((l) => l.completada).length;
    const art = document.createElement("article");
    art.className = "bloque revelar" + (b.completado ? " hecho" : "");
    art.style.setProperty("--retraso", (bi % 3) * 0.12 + "s");
    art.innerHTML = `
      <header class="bloque-cab">
        <span class="bloque-num">0${b.bloque}</span>
        <span class="bloque-titulo">${b.titulo}</span>
        <span class="bloque-cuenta">${hechas}/${b.lecciones.length}</span>
        <span class="check grande${b.completado ? " on" : ""}">${CHECK_SVG}</span>
      </header>
      <ul class="lecciones">
        ${b.lecciones.map((l, i) => `
          <li class="leccion${l.completada ? " hecha" : ""}" style="--i:${i}" data-orden="${l.orden}">
            <span class="check${l.completada ? " on" : ""}">${CHECK_SVG}</span>
            <span class="leccion-num">${String(l.orden).padStart(2, "0")}</span>
            <span class="leccion-titulo">${l.titulo}</span>
            <span class="etiqueta">${NOMBRE_TIPO[l.tipo]}</span>
            ${l.bloqueante ? '<span class="etiqueta bloq">bloqueante</span>' : ""}
          </li>`).join("")}
      </ul>`;
    cont.appendChild(art);
  });

  // marcador de la portada
  const total = bloques.reduce((n, b) => n + b.lecciones.length, 0);
  const hechas = bloques.reduce((n, b) => n + b.lecciones.filter((l) => l.completada).length, 0);
  const pct = Math.round((hechas / total) * 100);
  $("#m-lecciones").textContent = `${hechas}/${total}`;
  $("#m-bloques").textContent = `${bloques.filter((b) => b.completado).length}/${bloques.length}`;
  $("#m-pct").textContent = pct + "%";
  requestAnimationFrame(() => ($("#progreso-fill").style.width = pct + "%"));

  observar();
}

// Las lecciones aún no existen: aviso al pulsarlas
$("#bloques").addEventListener("click", (e) => {
  const li = e.target.closest(".leccion");
  if (!li) return;
  pulsar(li);
  avisar(`Lección ${li.dataset.orden.padStart(2, "0")}: todavía en construcción`);
});

// ===== Animaciones de scroll =====
// 1) la portada se aleja según bajas (y vuelve al subir)
const portada = $(".portada");
let ultimoY = scrollY;
let bajando = true;
function alScrollear() {
  bajando = scrollY >= ultimoY;
  ultimoY = scrollY;
  const s = Math.min(1, scrollY / (innerHeight * 0.8));
  portada.style.setProperty("--s", s.toFixed(3));
  portada.style.visibility = s >= 1 ? "hidden" : "visible";
}
addEventListener("scroll", alScrollear, { passive: true });

// 2) bloques y título aparecen al entrar en pantalla y se esconden al salir,
//    entrando desde abajo si bajas o desde arriba si subes
let observador;
function observar() {
  observador?.disconnect();
  observador = new IntersectionObserver((entradas) => {
    for (const en of entradas) {
      if (en.isIntersecting) {
        en.target.style.setProperty("--desde", bajando ? "60px" : "-60px");
        en.target.classList.add("visible");
      } else {
        en.target.classList.remove("visible");
      }
    }
  }, { threshold: 0.12 });
  document.querySelectorAll(".revelar, .temario-titulo").forEach((el) => observador.observe(el));
}

// ===== Botones =====
function pulsar(el) {
  el.classList.remove("pulsado");
  void el.offsetWidth; // reinicia la animación
  el.classList.add("pulsado");
}
document.addEventListener("pointerdown", (e) => {
  const btn = e.target.closest(".btn");
  if (btn) pulsar(btn);
});

$("#btn-empezar").addEventListener("click", () => {
  $("#temario").scrollIntoView({ behavior: "smooth" });
});

$("#btn-reset").addEventListener("click", async () => {
  await fetch("/api/progress/reset", { method: "POST" });
  await cargarTemario();
  avisar("Progreso reiniciado");
});

let temporizador;
function avisar(texto) {
  const a = $("#aviso");
  a.textContent = texto;
  a.classList.add("on");
  clearTimeout(temporizador);
  temporizador = setTimeout(() => a.classList.remove("on"), 2200);
}

alScrollear();
cargarTemario();
