# 🧠 Jogo QI — Treino Cerebral

App mobile (PWA) em português com jogos para treinar o raciocínio, instalável
direto do navegador — sem lojas de aplicativos.

**Produção:** https://arthur-damasceno.github.io/Jogo-qi/

## Jogos

| Jogo | O que treina |
| --- | --- |
| 🧠 Raciocínio Crítico | Silogismos, falácias lógicas e análise de argumentos |
| 🔷 Matrizes de Padrões | Raciocínio fluido com padrões visuais (estilo Raven) |
| 🎯 Memória de Trabalho | Sequências espaciais que crescem a cada rodada |
| 🔢 Raciocínio Numérico | Sequências e padrões numéricos gerados na hora |
| 📚 Raciocínio Verbal | Analogias, sinônimos, antônimos e intrusos |

Cada jogo tem níveis de dificuldade que se adaptam ao seu desempenho:
**≥ 80% de acerto sobe de nível, < 40% desce.** O progresso (XP, níveis,
sequência de dias) fica salvo no aparelho — sem conta, sem servidor.

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
`.github/workflows/deploy.yml`, que faz o build e publica no GitHub Pages.

> Primeira vez: se o workflow falhar em "configure-pages", ative o Pages em
> **Settings → Pages → Source: GitHub Actions** e rode o workflow de novo.

## Estrutura

```
src/
  App.tsx                    # telas: início, jogo, resultado, estatísticas
  state/progress.ts          # progresso em localStorage + regras de nível
  components/QuizEngine.tsx  # motor de múltipla escolha com feedback
  games/
    bank.ts                  # utilitários de banco de questões
    critical/data.ts         # banco de raciocínio crítico (pt-BR)
    verbal/data.ts           # banco de raciocínio verbal (pt-BR)
    numeric/generator.ts     # gerador procedural de sequências
    matrices/generator.tsx   # gerador procedural de matrizes (SVG)
    memory/MemoryGame.tsx    # jogo de sequência espacial
```

## Caminho para as lojas (futuro)

- **Google Play:** empacotar o PWA como TWA com [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) (conta de desenvolvedor: US$ 25, taxa única).
- **App Store:** empacotar com [Capacitor](https://capacitorjs.com/) (conta Apple Developer: US$ 99/ano).
