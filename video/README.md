# Método de vídeo explicativo animado

Motor que produz Reels 9:16 no estilo do vídeo "Edição com IA do zero":
nenhuma câmera, só narração, legenda palavra por palavra e interfaces
animadas que mudam a cada 1 a 2 segundos.

O vídeo é descrito num **roteiro JSON**. O Chromium desenha cada quadro a
partir do roteiro e o ffmpeg junta os quadros com a voz, a trilha e os efeitos.
O mesmo roteiro sempre gera o mesmo vídeo.

```
narração (mp3) ──► transcrever.py ──► roteiro.json (legendas com tempo)
                                          │  + você descreve as cenas
                                          ▼
                     preview.mjs (ajuste ao vivo) ──► render.mjs ──► video.mp4
```

## Uso

```bash
npm install                  # instala o Playwright (já é dependência do projeto)
pip install faster-whisper   # só para a transcrição automática

# 1. legendas a partir da narração (cria o roteiro se ele não existir)
python3 video/transcrever.py narracao.mp3 meu-video/roteiro.json

# 2. escrever as cenas em meu-video/roteiro.json e conferir ao vivo
node video/preview.mjs meu-video/roteiro.json

# 3. conferir quadros soltos, rascunho rápido e versão final
node video/render.mjs meu-video/roteiro.json --quadros 3,12.5,40
node video/render.mjs meu-video/roteiro.json --rascunho
node video/render.mjs meu-video/roteiro.json
```

Na máquina de referência, 60 s de vídeo em 1080×1920 a 30 fps levam cerca de
2,5 min. O `--rascunho` sai em 540×960 a 15 fps e leva cerca de 45 s.

`video/exemplos/do-zero/roteiro.json` recria o vídeo de referência inteiro.
Para ouvi-lo, ponha a narração como `voz.mp3` ao lado do roteiro ou passe
`--voz caminho.mp3`.

## As regras do estilo

O motor já traz estas regras embutidas. O roteiro só precisa respeitá-las.

1. **Gancho escuro, conteúdo claro.** Os 10 primeiros segundos ficam em fundo
   preto com a fita vermelha (`tema: "escuro"`): prova social (notificações de
   gente pedindo) e a promessa ("Do zero / o passo a passo inteiro"). Depois o
   fundo vira creme com manchas rosadas (`tema: "claro"`).
2. **Estrutura em passos numerados.** `01 de 03 / Abra a sua IA`. O cabeçalho
   fica fixo enquanto o passo dura; só o miolo muda.
3. **Algo novo a cada 1 a 2 s.** Cada frase falada ganha um elemento ou uma
   mudança de estado (clique, check, item novo). A tela nunca fica parada por
   mais de 2 s.
4. **A imagem mostra o que a voz diz.** "onde cortar?" aparece como item no
   chat quando a voz fala "cortar". O tempo de cada elemento é o tempo da palavra.
5. **Legenda em três andares.** Pequeno em cima, destaque grande em vermelho no
   meio, pequeno embaixo. Cada palavra entra desfocando no instante em que é
   dita. Uma frase tem de 1 a 6 palavras e só um destaque.
6. **Tudo entra com desfoque e sobe; tudo sai desfocando.** Nada de cortes
   secos dentro de um bloco.
7. **Interfaces genéricas, não capturas de tela.** Janelas, cartões e diálogos
   são desenhados em HTML, por isso ficam nítidos e consistentes.
8. **Fechamento com chamada.** Último bloco sem cabeçalho, com botão sendo
   clicado ("Saiba mais") e o selo do que a pessoa vai ver.

## Roteiro

```jsonc
{
  "fps": 30,
  "duracao": 60,                // opcional: padrão é o fim do último bloco
  "voz": "voz.mp3",             // caminhos relativos ao roteiro
  "trilha": { "arquivo": "trilha.mp3", "volume": 0.18 },  // abaixa sozinha quando há fala
  "efeitosAuto": true,          // pop na entrada de cada elemento, clique nos cliques, whoosh na troca de bloco
  "efeitos": [{ "t": 12.9, "som": "clique" }],            // "pop" | "clique" | "whoosh" | arquivo
  "legendaY": 1340,             // altura da legenda (padrão 1340 de 1920)

  "legendas": [
    { "t": 10.7, "texto": "abre a sua *IA* no computador." },
    { "t": 12.0, "texto": "Pode ser o *Claude,*", "palavras": [12.0, 12.2, 12.35, 12.5] }
  ],

  "blocos": [
    {
      "inicio": 10, "fim": 25, "tema": "claro",
      "passo": { "n": 1, "total": 3, "titulo": "Abra a sua IA", "tTitulo": 10.8 },
      "elementos": [
        { "tipo": "janela", "t": 11.0, "ate": 13.7, "titulo": "Claude", "itens": [ ... ] }
      ]
    }
  ]
}
```

- `t` é quando o elemento entra; `ate` é quando começa a sair (padrão: fim do bloco).
- `x`, `y` posicionam o centro do elemento no palco de 1080×1920 (padrão: centro, y = 900).
- `escala` reduz ou aumenta; `entrada` escolhe `subir` (padrão), `zoom`, `pop`, `desfoque`, `descer` ou `nenhum`.
- Em qualquer texto, `*assim*` fica em vermelho.
- Sem `palavras`, as palavras da legenda são espalhadas no início da frase.
  Com a transcrição automática, cada palavra vem com o tempo exato.

### Elementos

| tipo | para quê | campos principais |
| --- | --- | --- |
| `bloqueio` | tela de bloqueio com notificações empilhando | `data`, `hora`, `notificacoes[{t, app, usuario, texto}]` |
| `cartao` | cartão de título com subtítulo digitado | `rotulo`, `canto`, `titulo`, `sub`, `tDigitar` |
| `icones` | fileira de ícones de app que pulam | `itens[{t, texto \| img \| faisca, cor, corTexto}]` |
| `campo` | caixa de prompt digitando | `texto`, `tDigitar`, `placeholder` |
| `janela` | app com conversa | `titulo`, `campo{texto, t, enviar}`, `itens[]` (abaixo) |
| `terminal` | instalação com barra de progresso | `titulo`, `boasVindas`, `linhas[{t, texto, forte}]`, `progresso{t, ate}` |
| `arquivo` | arquivo grande sendo apresentado | `nome`, `selo`, `destacar` |
| `lista` | itens marcados um a um, o atual no meio | `itens[{t, icone, texto}]` |
| `dialogo` | pedido de permissão com clique | `app`, `titulo`, `comando`, `descricao`, `clique` |
| `senha` | pedido de senha negado com um X | `negar` |
| `pilula` | número de destaque | `prefixo`, `texto`, `sub{t, texto}` |
| `onda` | áudio com pausas marcadas e cortadas | `rotulo`, `marcar`, `cortar`, `pausas[[ini, fim]]` |
| `tomadas` | escolha da melhor tomada | `itens[]`, `escolher{t, indice}` |
| `celular` | celular com imagem ou vídeo (sincronizado quadro a quadro) | `midia`, `inicioMidia` |
| `imagens` | fotos lado a lado com selo ✓ ou × | `itens[{t, midia, marca{t, simbolo}}]`, `pb` |
| `painel` | "Corte pronto" com aprovar / pedir ajuste | `titulo`, `sub`, `cliques[{t, indice}]` |
| `botao` | chamada final clicada | `texto`, `clique` |
| `selo`, `marca`, `texto` | rótulos soltos | `texto` / `simbolo` |

Itens da `janela`: `usuario` (balão, `thumb`, `lado`), `ia` (pensando, `duvida`),
`linha` (pergunta da IA com `icone`), `chip` (arquivo anexado),
`colar` (mensagem com botão Copiar e `clique`), `inicio` (tela inicial do app
com `abas`, `trocar` ou `ativa`, `comando`) e `texto`.

## Estender

Cada elemento é uma função em `motor/motor.js` (`C.nome = (props, bloco) => ({ no, atualizar(t) })`)
com o estilo em `motor/motor.css`. `atualizar` recebe o tempo absoluto e deve
depender só dele. As funções `mostrar`, `revelar`, `digitar` e `ponteiro`
cuidam de entradas, textos digitados e cliques.
