---
name: video-explicativo
description: Cria Reels 9:16 no estilo "explicativo animado" (sem câmera; narração, legenda palavra por palavra em três andares e interfaces animadas trocando a cada 1 a 2 s, gancho em fundo escuro e passos numerados em fundo creme). Use quando pedirem "vídeo explicativo", "vídeo no estilo do Do zero", "vídeo animado a partir dessa narração", "transforma esse roteiro/áudio em vídeo" ou ajuste em um vídeo feito com o motor de video/.
---

# Vídeo explicativo animado

O motor fica em `video/` (leia `video/README.md` para a referência completa dos
elementos). Este é o fluxo de trabalho.

## 1. Entrada

- **Narração pronta (áudio):** rode `python3 video/transcrever.py <audio> <pasta>/roteiro.json`.
  Sem rede para baixar o modelo, peça à pessoa para rodar localmente ou leia o
  áudio por outro meio; nunca invente tempos de fala.
- **Só o texto:** escreva o roteiro falado primeiro, peça a gravação e só então
  monte as cenas. Sem voz, use tempos estimados de 3,5 palavras por segundo e
  avise que serão refeitos quando a voz chegar.

## 2. Revisar as legendas

- Uma frase por legenda, de 1 a 6 palavras, quebrando na pontuação ou na pausa.
- Um destaque por frase entre `*asteriscos*`: a palavra que carrega o sentido
  (o verbo de ação, o objeto, o número). Frases de uma palavra só ("Primeiro,",
  "Pronto:") ficam inteiras em destaque.
- Mantenha os tempos de `palavras` da transcrição; só mude texto e destaque.

## 3. Montar os blocos

1. **Gancho (0 a ~10 s, `tema: "escuro"`, sem `passo`):** prova social
   (`bloqueio` com notificações de gente pedindo) e promessa (`cartao` com
   subtítulo digitado, `icones`, `campo`).
2. **Passos (`tema: "claro"`, com `passo: {n, total, titulo}`):** de 2 a 4
   passos. Título curto no imperativo ("Abra a sua IA", "Mande o seu vídeo").
3. **Fechamento (sem `passo`):** `celular` + `botao` clicado + `selo`.

Regra de ouro: para cada legenda, pergunte "o que aparece ou muda na tela
agora?". Ponha o `t` do elemento (ou do item, clique, check) no tempo da
palavra que ele ilustra. Se a tela fica mais de 2 s sem mudar, falta elemento.

Elementos de um mesmo bloco se revezam com `t`/`ate`; o `ate` de um deve ser
mais ou menos o `t` do próximo menos 0,1 s. Use `x`, `y` e `escala` para pôr
dois lado a lado (ex.: `x: 290` e `x: 790` com `escala: 0.56`).

## 4. Conferir e renderizar

1. `node video/render.mjs <roteiro> --quadros t1,t2,...`: um quadro por
   elemento novo. Olhe as imagens: sobreposição, texto cortado, legenda
   colidindo com o elemento (suba o `y` do elemento ou mude `legendaY`).
2. `node video/render.mjs <roteiro> --rascunho` e confira o sincronismo.
3. `node video/render.mjs <roteiro>` para a versão final.

Entregue o MP4 e diga quais trechos merecem revisão humana (destaques
escolhidos por heurística, mídias que faltaram e ficaram com o marcador ▶).
