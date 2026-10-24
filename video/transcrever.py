#!/usr/bin/env python3
"""Transcreve a narração e gera as legendas do roteiro, palavra por palavra.

    pip install faster-whisper
    python3 video/transcrever.py narracao.mp3 meu-video/roteiro.json

Se o roteiro já existe, só a chave "legendas" é substituída (as cenas ficam).
Se não existe, cria um roteiro novo com um bloco claro cobrindo a narração toda.

Cada frase vira até 3 andares: palavras antes do destaque (pequenas),
o *destaque* (grande e vermelho) e o resto (pequeno). O destaque automático é
um chute (última palavra forte da frase); revise à mão: é aí que mora o estilo.
"""
import argparse
import json
import os
import re

FRACAS = set("""a o as os um uma uns umas de do da dos das no na nos nas em pra pro pras pros por para com sem
e ou mas que se eu tu ele ela eles elas você vocês me te lhe nos é foi ser ter tem vai já só não sim
isso esse essa este esta aquele aquela aí ali lá aqui meu minha seu sua""".split())


def limpa(p):
    return re.sub(r"[^\wÀ-ÿ]", "", p.lower())


def agrupar(palavras, max_palavras=6, max_dur=1.6, pausa=0.35):
    frases, atual = [], []
    for i, w in enumerate(palavras):
        atual.append(w)
        prox = palavras[i + 1] if i + 1 < len(palavras) else None
        fim_pont = re.search(r"[,.:;!?…]$", w["txt"])
        lacuna = prox and prox["t"] - w["fim"] > pausa
        longa = len(atual) >= max_palavras or (w["fim"] - atual[0]["t"] > max_dur and len(atual) >= 2)
        if not prox or fim_pont or lacuna or longa:
            frases.append(atual)
            atual = []
    return frases


def marcar(frase):
    """Escolhe o destaque: a última palavra forte da frase (siglas como IA contam)."""
    if len(frase) == 1:
        return 0, 1
    for k in range(len(frase) - 1, -1, -1):
        w = re.sub(r"[^\wÀ-ÿ]", "", frase[k]["txt"])
        if limpa(w) not in FRACAS and (len(w) >= 3 or (len(w) >= 2 and w.isupper())):
            return k, k + 1
    return None


def montar(frase):
    m = marcar(frase)
    txts = [w["txt"] for w in frase]
    if m:
        a, b = m
        txts[a] = "*" + txts[a]
        txts[b - 1] = txts[b - 1] + "*"
    return {
        "t": round(frase[0]["t"], 2),
        "texto": " ".join(txts),
        "palavras": [round(w["t"], 2) for w in frase],
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("audio")
    ap.add_argument("roteiro")
    ap.add_argument("--modelo", default="small", help="tiny, base, small, medium, large-v3")
    ap.add_argument("--idioma", default="pt")
    a = ap.parse_args()

    from faster_whisper import WhisperModel

    modelo = WhisperModel(a.modelo, device="auto", compute_type="int8")
    segs, info = modelo.transcribe(a.audio, language=a.idioma, word_timestamps=True, vad_filter=True)
    palavras = [
        {"txt": w.word.strip(), "t": w.start, "fim": w.end}
        for s in segs for w in s.words if w.word.strip()
    ]
    if not palavras:
        raise SystemExit("nenhuma fala encontrada no áudio")
    legendas = [montar(f) for f in agrupar(palavras)]
    duracao = round(info.duration, 2)
    legendas[-1]["fim"] = round(palavras[-1]["fim"] + 0.4, 2)

    if os.path.exists(a.roteiro):
        with open(a.roteiro, encoding="utf-8") as f:
            roteiro = json.load(f)
    else:
        roteiro = {
            "fps": 30,
            "voz": os.path.relpath(os.path.abspath(a.audio), os.path.dirname(os.path.abspath(a.roteiro))),
            "efeitosAuto": True,
            "blocos": [{"inicio": 0, "fim": duracao, "tema": "claro", "elementos": []}],
        }
    roteiro["duracao"] = duracao
    roteiro["legendas"] = legendas
    os.makedirs(os.path.dirname(os.path.abspath(a.roteiro)), exist_ok=True)
    with open(a.roteiro, "w", encoding="utf-8") as f:
        json.dump(roteiro, f, ensure_ascii=False, indent=2)
    print(f"{len(legendas)} frases, {len(palavras)} palavras, {duracao}s → {a.roteiro}")
    for l in legendas:
        print(f"  {l['t']:6.2f}  {l['texto']}")


if __name__ == "__main__":
    main()
