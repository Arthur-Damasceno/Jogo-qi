# 🧠 Jogo QI — Treino Cerebral

App mobile (PWA) em português com jogos para treinar o raciocínio, instalável
direto do navegador — sem lojas de aplicativos.

**Produção:** https://arthur-damasceno.github.io/Jogo-qi/

## Jogos

| Jogo | O que treina |
| --- | --- |
| 🧠 Raciocínio Crítico | Silogismos, falácias lógicas e análise de argumentos |
| 🔷 Matrizes de Padrões | Raciocínio fluido com padrões visuais (estilo Raven) |
| 🎯 Memória de Trabalho | Sequências espaciais que crescem a cada rodada (até 5×5) |
| 🔁 N-Back | Atenção e memória de trabalho: detectar repetições N passos atrás |
| 🎨 Stroop | Controle inibitório: tocar na cor da tinta, não na palavra |
| 🔢 Raciocínio Numérico | Sequências e padrões numéricos gerados na hora |
| ➗ Cálculo Mental | Aritmética rápida contra o relógio |
| 📚 Raciocínio Verbal | Analogias, sinônimos, antônimos e intrusos |

## QI estimado

Cada jogo tem **10 níveis** que se adaptam ao desempenho: ≥ 80% de acerto sobe
de nível, < 40% desce. Nos níveis altos entra pressão de tempo por questão.

O app calcula um **QI estimado numa escala de 80 a 200**: cada jogo contribui
com `80 + 12 × (nível efetivo)`, onde o nível efetivo combina o nível atual e o
acerto médio das últimas 5 sessões. Chegar ao nível 10 com alta precisão em
todos os jogos leva a estimativa a 200.

> ⚠️ É uma métrica de progresso dentro do app — não substitui um teste
> psicométrico aplicado por profissionais.

## Perfis locais

Até **6 jogadores** no mesmo aparelho, cada um com progresso, níveis, XP e QI
próprios. Tudo fica em `localStorage` — sem conta, sem servidor.

## Como instalar no celular

1. Abra https://arthur-damasceno.github.io/Jogo-qi/ no navegador do celular.
2. **Android (Chrome):** toque em ⋮ → "Adicionar à tela inicial" / "Instalar app".
3. **iPhone (Safari):** toque em Compartilhar → "Adicionar à Tela de Início".

O app funciona offline depois da primeira visita (service worker).

## Desenvolvimento

```bash
npm install
npm run dev       # servidor local com hot reload
npm run build     # build de produção em dist/
npm run preview   # serve o build localmente
npm run icons     # regenera os ícones PNG a partir de public/favicon.svg
```

Stack: React 18 + TypeScript + Vite + vite-plugin-pwa. Sem backend.

## Deploy

O deploy é automático: todo push para a branch principal roda o workflow
`.github/workflows/deploy.yml`, que faz o build e publica a pasta `dist/` na
branch `gh-pages`, servida pelo GitHub Pages.

## Estrutura

```
src/
  App.tsx                    # telas: perfis, início, jogo, resultado, estatísticas
  state/
    profiles.ts              # até 6 perfis locais (localStorage)
    progress.ts              # progresso por perfil + cálculo do QI estimado
  components/QuizEngine.tsx  # motor de múltipla escolha com feedback e cronômetro
  games/
    bank.ts                  # utilitários de banco de questões
    critical/data.ts         # banco de raciocínio crítico (pt-BR)
    verbal/data.ts           # banco de raciocínio verbal (pt-BR)
    numeric/generator.ts     # gerador procedural de sequências (10 níveis)
    calc/generator.ts        # gerador de aritmética mental (10 níveis)
    matrices/generator.tsx   # gerador procedural de matrizes SVG (10 níveis)
    memory/MemoryGame.tsx    # sequência espacial (grades 3×3 a 5×5)
    nback/NBackGame.tsx      # n-back espacial (n = 1 a 3)
    stroop/StroopGame.tsx    # teste de Stroop cronometrado
```

## Caminho para as lojas (futuro)

- **Google Play:** empacotar o PWA como TWA com [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) (conta de desenvolvedor: US$ 25, taxa única).
- **App Store:** empacotar com [Capacitor](https://capacitorjs.com/) (conta Apple Developer: US$ 99/ano).
