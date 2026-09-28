# CLAUDE.md — Curso interactivo de Git (estilo TryHackMe)

## Objetivo

App web en `localhost` para aprender Git de forma **muy práctica** (mínima teoría), estilo TryHackMe: cada lección tiene una intro breve, un conjunto de **tareas** (arriba) y una **terminal integrada** debajo para resolverlas todas.

Cubre dos frentes por igual:
- **Git general / uso diario:** crear y gestionar tus propios repos, ramas, remotos, publicar en GitHub, reescritura de historia, etc.
- **Git para pentesting / red team:** `.git` expuesto, secretos en el historial, forense de repos, hooks maliciosos, etc.

Un solo usuario, en local. Sin login, sin multiusuario, sin despliegue.

## Stack

- **Backend:** Python + FastAPI. Sirve contenido, valida comandos y respuestas, persiste progreso.
- **Frontend:** web, HTML + JS (vanilla o mínimo). Terminal con **xterm.js** (CDN), markdown con **marked** (CDN).
- **Progreso:** `progress.json` local. (Migrar a SQLite es trivial si algún día hace falta.)

## Terminal: SIMULADA

La terminal **no ejecuta git real**. Cada lección define:

1. Un **mapa de comandos** (`terminal`): comandos reconocidos → salida predefinida. Permite explorar libremente y obtener salidas coherentes (ej. `git log --oneline` devuelve una lista fija de commits). Es lo que permite *investigar* para responder preguntas.
2. Un conjunto de **tareas** que hay que completar.

Flujo de `/run` (cuando el usuario escribe un comando):
1. Normaliza la entrada (trim + colapsar espacios).
2. ¿Completa alguna tarea `comando` pendiente (`accept`)? → márcala y devuelve su `output`.
3. Si no, ¿está en el mapa `terminal`? → devuelve esa salida (exploración).
4. Si no, devuelve "comando no reconocido" o la pista de la lección.

## Tipos de tarea

- **`comando`** — hay que escribir el comando correcto en la terminal. Se valida por patrón (`accept`) y se marca al ejecutarlo.
- **`pregunta`** — una pregunta cuya respuesta se averigua **usando la terminal** (ej. "¿cómo se llama el repo?", "¿en qué commit se filtró la contraseña?"). El usuario investiga con los comandos del mapa y envía la respuesta en el campo de esa pregunta. Se valida contra `respuestas` (normalizadas).

## Tipos de lección

- **`practica`** — tareas con `bloqueante: true`. Se completa al terminar todas.
- **`mixta`** — intro + tareas con `bloqueante: false` ("prueba a ejecutar / responde esto"). No cortan el avance; se puede pasar.
- **`teoria`** — sin tareas, botón "Completar".

La mayoría son `practica`.

## Layout

- **Sidebar izquierdo:** bloques con lecciones y su estado (candado / punto / check). Las bloqueadas no son clicables.
- **Panel central, arriba:** intro breve (markdown) + la **lista de tareas/preguntas** de la lección, cada una con su check y, si es `pregunta`, su campo de respuesta.
- **Panel central, abajo:** la **terminal** (xterm.js), compartida para resolver todas las tareas.
- Al completar la última tarea bloqueante se habilita "Siguiente lección".

## Progresión

- Dentro de una lección las tareas se pueden hacer en **cualquier orden** (tienes la terminal y todas las preguntas a la vista). La lección se completa cuando todas las tareas `bloqueante` están hechas.
- **Entre lecciones:** una lección `bloqueante` no se desbloquea hasta completar la anterior bloqueante. Progreso lineal por `orden`. Las no bloqueantes no cortan.

## Estructura de carpetas

```
curso-git/
├── CLAUDE.md
├── backend/
│   ├── main.py            # FastAPI: endpoints + carga de content/
│   ├── validator.py       # normalización + match de comandos/respuestas
│   └── progress.json      # generado
├── content/
│   ├── 01-que-es-git.json
│   └── ...                # una lección por archivo, numerada
└── frontend/
    ├── index.html
    ├── app.js
    └── style.css
```

## Formato de una lección (`content/NN-slug.json`)

```json
{
  "id": "23-secretos-historial",
  "orden": 23,
  "bloque": "Git para pentesting",
  "titulo": "Cazar secretos en el historial",
  "tipo": "practica",
  "bloqueante": true,
  "teoria_md": "## Secretos en el historial\n\nAunque un archivo con credenciales se borre, **sigue vivo en la historia**. Aquí lo cazamos.",
  "terminal": [
    {
      "accept": ["^git log --oneline$"],
      "output": "e4f5a6b add readme\na1b2c3d add config\n9f8e7d6 initial commit"
    },
    {
      "accept": ["^git show a1b2c3d$", "^git log -p$"],
      "output": "commit a1b2c3d\n    add config\n\n+DB_HOST=10.0.0.5\n+DB_PASSWORD=s3cr3t_p4ss"
    }
  ],
  "tareas": [
    {
      "id": "t1",
      "tipo": "comando",
      "objetivo": "Muestra el historial, un commit por línea.",
      "accept": ["^git log --oneline$"],
      "output": "e4f5a6b add readme\na1b2c3d add config\n9f8e7d6 initial commit",
      "check": "Historial listado",
      "bloqueante": true,
      "pista": "Usa `git log --oneline`."
    },
    {
      "id": "t2",
      "tipo": "pregunta",
      "pregunta": "¿En qué commit (hash corto) se añadió la contraseña?",
      "respuestas": ["a1b2c3d"],
      "check": "Commit identificado",
      "bloqueante": true,
      "pista": "Inspecciona los diffs con `git log -p` o `git show <hash>`."
    },
    {
      "id": "t3",
      "tipo": "pregunta",
      "pregunta": "¿Cuál es el valor filtrado de DB_PASSWORD?",
      "respuestas": ["s3cr3t_p4ss"],
      "check": "Secreto extraído",
      "bloqueante": true,
      "pista": "Está en el diff de ese commit."
    }
  ]
}
```

Notas:
- `accept` y `terminal` usan regex anclada (`^...$`) sobre la entrada normalizada; incluir variantes razonables (flags en distinto orden, `switch`/`checkout`, comillas simples/dobles).
- `respuestas` se comparan normalizadas (minúsculas, sin espacios sobrantes); admitir sinónimos válidos.
- Lección `teoria`: `tareas: []` y `terminal: []`.

## Endpoints (FastAPI)

- `GET /api/lessons` → `{id, orden, bloque, titulo, tipo, estado}` (estado ∈ `bloqueada | disponible | en_curso | completada`).
- `GET /api/lessons/{id}` → contenido + progreso de sus tareas.
- `POST /api/lessons/{id}/run` → `{command}` → `{matched, tarea_id, output, check, hint, lesson_completed}`.
- `POST /api/lessons/{id}/answer` → `{tarea_id, respuesta}` → `{correcta, check, pista, lesson_completed}`.
- `POST /api/lessons/{id}/complete` → marca completadas las `teoria`/`mixta`.
- `GET /api/progress` / `POST /api/progress/reset`.

## Convenciones de código

- Español en comentarios, UI y contenido.
- Conciso y directo, sin sobreingeniería ni abstracciones que no se usen.
- Ediciones quirúrgicas: tocar solo lo necesario, no reescribir archivos enteros.
- El contenido (`content/*.json`) se genera **una lección a una**, no todo de golpe.

## Orden de construcción

1. Backend: `main.py` (carga de `content/`, endpoints) + `validator.py`, con 1–2 lecciones de prueba.
2. Frontend base: sidebar + intro + lista de tareas + render markdown + estados.
3. Terminal xterm.js + `/run` + `/answer` + marcado de checks.
4. Progresión, bloqueo entre lecciones y persistencia (`progress.json`).
5. Generar las lecciones del temario, empezando por el Bloque 1.

## Temario (30 lecciones)

### Bloque 1 · Fundamentos y tu primer repo
1. Qué es Git + primeros comandos — *mixta*
2. Configuración inicial y alias — *práctica*
3. Crear tu repo: init, add, commit, status — *práctica, bloqueante*
4. Staging y flujo real de Git — *práctica, bloqueante*
5. Leer el historial: log, show, diff — *práctica*
6. .gitignore — *práctica*
7. Deshacer: restore, reset (soft/mixed/hard), revert — *práctica, bloqueante*

### Bloque 2 · Ramas y trabajo diario
8. Ramas: branch, switch/checkout — *práctica, bloqueante*
9. stash: guardar trabajo a medias — *práctica*
10. Merge: fast-forward vs three-way — *práctica*
11. Conflictos y resolución — *práctica, bloqueante*
12. Tags — *práctica*

### Bloque 3 · Remotos y GitHub
13. Remotos: clone, remote, fetch, pull, push + aviso reconcile (pull.rebase) — *práctica, bloqueante*
14. Fork y upstream: mantener al día un repo ajeno — *práctica*
15. Autenticación: claves SSH y tokens — *práctica*

### Bloque 4 · Historia avanzada y reescritura
16. amend: arreglar el último commit — *práctica*
17. rebase e interactivo (squash, reword, edit, drop) — *práctica, bloqueante*
18. cherry-pick — *práctica*
19. reflog y recuperación: rescatar lo "borrado" — *práctica*
20. Firmar y verificar commits (GPG): por qué un commit puede mentir — *práctica*

### Bloque 5 · Git para pentesting / red team
21. .git expuesto: detección y dumping (git-dumper) — *práctica, bloqueante*
22. Reconstruir el código desde un .git filtrado — *práctica*
23. Cazar secretos en el historial — *práctica, bloqueante*
24. Qué queda recuperable: commits borrados, stashes, ramas huérfanas — *práctica*
25. OSINT y GitHub dorking: leaks en repos públicos — *mixta*
26. Git hooks y su abuso (supply chain) — *mixta*
27. Análisis forense de un repo comprometido — *práctica*
28. Git en un engagement: notas, evidencias, workflow por cliente — *mixta*

### Bloque 6 · Higiene y cierre
29. No filtrar secretos y purgar el historial (git-filter-repo / BFG) — *práctica*
30. Cheatsheet + proyecto integrador — *práctica, bloqueante*

**Estimación:** ~8–12 h, denso y sin relleno.
