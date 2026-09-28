// Fondo de terminal: bichos ASCII que cruzan la pantalla de izquierda a derecha.
// Cada bicho tiene dos fotogramas que se alternan para "andar".
const BICHOS = [
  [ // gato
    String.raw`
 /\_/\
( o.o )
 /   \ `,
    String.raw`
 /\_/\
( -.- )
  | |`,
  ],
  [ // caracol
    String.raw`
    _____
   / ___ \
  | (   ) |
 __\_____/_@_@`,
    String.raw`
    _____
   / ___ \
  | (   ) |
___\_____/__@@`,
  ],
  [ // pato
    String.raw`
   __
 <(o )___
  ( ._> /
   \'---'`,
    String.raw`
   __
 <(o )___
  ( ._> /
   /'---\ `,
  ],
  [ // perro
    String.raw`
  __
o-''|\_____/)
 \_/|_)     )
    \  __  /
    (_/ (_/`,
    String.raw`
  __
o-''|\_____/)
 \_/|_)     )
    /  __  \
   (_/  (_/`,
  ],
  [ // tren de commits
    String.raw`o---o---o---o===>`,
    String.raw`-o---o---o---o==>`,
  ],
  [ // cangrejo
    String.raw`
(\/)  (\/)
  \_oo_/
  /|  |\ `,
    String.raw`
(\/)  (\/)
  \_oo_/
  |\  /| `,
  ],
];

const fondo = document.getElementById("fondo");

function soltarBicho(y) {
  const frames = BICHOS[Math.floor(Math.random() * BICHOS.length)];
  const el = document.createElement("div");
  el.className = "bicho";
  const pre = document.createElement("pre");
  pre.textContent = frames[0].replace(/^\n/, "");
  el.appendChild(pre);

  const tam = 14 + Math.random() * 12;
  const duracion = 14 + Math.random() * 16;
  el.style.fontSize = tam + "px";
  el.style.top = (y ?? Math.random() * (innerHeight - 80)) + "px";
  el.style.animationDuration = duracion + "s";

  // alternar fotogramas mientras cruza
  let f = 0;
  const paso = setInterval(() => {
    f = 1 - f;
    pre.textContent = frames[f].replace(/^\n/, "");
  }, 260);

  // al hacer clic, salta
  el.addEventListener("click", (e) => {
    e.stopPropagation();
    el.classList.remove("salta");
    void el.offsetWidth;
    el.classList.add("salta");
  });

  el.addEventListener("animationend", (e) => {
    if (e.animationName === "cruzar") {
      clearInterval(paso);
      el.remove();
    }
  });
  fondo.appendChild(el);
}

// clic en un hueco del fondo: aparece un bicho a esa altura
document.addEventListener("click", (e) => {
  if (e.target === document.body || e.target === fondo || e.target.closest(".portada, .temario, .pie") === e.target) {
    soltarBicho(e.clientY - 20);
  }
});

// arranque con unos cuantos ya en pantalla y luego goteo constante
for (let i = 0; i < 4; i++) setTimeout(() => soltarBicho(), i * 1800);
setInterval(() => {
  if (!document.hidden && fondo.querySelectorAll(".bicho").length < 9) soltarBicho();
}, 2600);
