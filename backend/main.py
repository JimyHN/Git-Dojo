"""GitDojo — backend FastAPI.

Por ahora solo sirve el frontend y el temario con su progreso.
Las lecciones (content/NN-slug.json) y sus endpoints llegarán después.
"""
import json
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

RAIZ = Path(__file__).resolve().parent.parent
CONTENT = RAIZ / "content"
FRONTEND = RAIZ / "frontend"
PROGRESS = Path(__file__).resolve().parent / "progress.json"

app = FastAPI(title="GitDojo")


def leer_progreso() -> dict:
    if PROGRESS.exists():
        return json.loads(PROGRESS.read_text(encoding="utf-8"))
    return {"completadas": []}


def guardar_progreso(progreso: dict) -> None:
    PROGRESS.write_text(json.dumps(progreso, indent=2, ensure_ascii=False), encoding="utf-8")


@app.get("/api/temario")
def temario():
    bloques = json.loads((CONTENT / "temario.json").read_text(encoding="utf-8"))
    hechas = set(leer_progreso()["completadas"])
    for bloque in bloques:
        for leccion in bloque["lecciones"]:
            leccion["completada"] = leccion["orden"] in hechas
        bloque["completado"] = all(l["completada"] for l in bloque["lecciones"])
    return bloques


@app.get("/api/progress")
def progreso():
    return leer_progreso()


@app.post("/api/progress/reset")
def reset_progreso():
    guardar_progreso({"completadas": []})
    return {"ok": True}


# El frontend se monta al final para no tapar las rutas /api
app.mount("/", StaticFiles(directory=FRONTEND, html=True), name="frontend")
