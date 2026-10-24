#!/usr/bin/env node
// Renderiza um roteiro em MP4: o Chromium desenha cada quadro, o ffmpeg monta vídeo + áudio.
//
//   node video/render.mjs video/exemplos/do-zero/roteiro.json
//   node video/render.mjs roteiro.json --saida final.mp4 --voz narracao.wav
//   node video/render.mjs roteiro.json --rascunho            (metade da resolução, 15 fps)
//   node video/render.mjs roteiro.json --de 10 --ate 20       (só um trecho)
//   node video/render.mjs roteiro.json --quadros 2,6.5,31     (PNGs para conferir)
import { createRequire } from 'node:module';
import { spawn, execFileSync } from 'node:child_process';
import { readFileSync, existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
// Efeitos sintetizados no próprio ffmpeg, para funcionar sem banco de sons.
const SONS = {
  pop: ['-f', 'lavfi', '-i', "aevalsrc='0.7*sin(2*PI*(500+2600*exp(-30*t))*t)*exp(-28*t)':s=48000:d=0.15"],
  clique: ['-f', 'lavfi', '-i', "aevalsrc='0.9*sin(2*PI*2200*t)*exp(-260*t)+0.4*sin(2*PI*900*t)*exp(-120*t)':s=48000:d=0.06"],
  whoosh: ['-f', 'lavfi', '-i', 'anoisesrc=d=0.55:c=pink:r=48000:a=0.6', '-af', 'bandpass=f=1400:width_type=h:w=1800,afade=t=in:d=0.3,afade=t=out:st=0.3:d=0.25'],
};
const { chromium } = require('playwright');
const aqui = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const opc = (nome, padrao) => {
  const i = args.indexOf(`--${nome}`);
  if (i < 0) return padrao;
  const v = args[i + 1];
  return v === undefined || v.startsWith('--') ? true : v;
};
const arquivoRoteiro = args.find((a) => !a.startsWith('--') && a.endsWith('.json'));
if (!arquivoRoteiro) {
  console.error('uso: node video/render.mjs <roteiro.json> [--saida x.mp4] [--voz audio] [--rascunho] [--de s] [--ate s] [--quadros t1,t2]');
  process.exit(1);
}
const pastaRoteiro = path.dirname(path.resolve(arquivoRoteiro));
const roteiro = JSON.parse(readFileSync(arquivoRoteiro, 'utf8'));
const rascunho = !!opc('rascunho', false);
const fps = rascunho ? 15 : roteiro.fps || 30;
const escala = rascunho ? 0.5 : 1;
const saida = path.resolve(opc('saida', path.join(pastaRoteiro, rascunho ? 'rascunho.mp4' : 'video.mp4')));
const doRoteiro = (p) => (p ? path.resolve(pastaRoteiro, p) : null);
const voz = opc('voz', null) ? path.resolve(opc('voz')) : doRoteiro(roteiro.voz);

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: escala });
pagina.on('pageerror', (e) => console.error('erro na página:', e.message));
await pagina.goto(pathToFileURL(path.join(aqui, 'motor', 'index.html')).href);
const { duracao } = await pagina.evaluate(
  ([r, b]) => { window.__renderizando = true; return window.motor.carregar(r, b); },
  [roteiro, pathToFileURL(path.resolve(arquivoRoteiro)).href],
);

// Modo conferência: só tira fotos de alguns instantes.
const quadros = opc('quadros', null);
if (quadros) {
  for (const t of String(quadros).split(',').map(Number)) {
    await pagina.evaluate((x) => window.motor.renderAt(x), t);
    const f = saida.replace(/\.mp4$/, '') + `_${t.toFixed(2)}s.png`;
    await pagina.screenshot({ path: f });
    console.log(f);
  }
  await navegador.close();
  process.exit(0);
}

const de = Number(opc('de', 0));
const ate = Math.min(Number(opc('ate', duracao)), duracao);
const total = Math.round((ate - de) * fps);

// ---------- áudio: voz + trilha (abaixa sozinha quando há fala) + efeitos ----------
const entradas = [];
let nEntradas = 0; // a entrada 0 é o vídeo
const entrada = (...a) => { entradas.push(...a); return ++nEntradas; };
const filtros = [];
const mix = [];
let temVoz = false;
if (voz && existsSync(voz)) {
  const k = entrada('-i', voz);
  filtros.push(`[${k}:a]atrim=start=${de},asetpts=PTS-STARTPTS,aresample=48000${roteiro.trilha ? ',asplit[voz][vozsc]' : '[voz]'}`);
  mix.push('[voz]');
  temVoz = true;
} else if (voz) console.warn(`aviso: narração não encontrada (${voz}); o vídeo sai sem voz.`);
if (roteiro.trilha) {
  const tr = typeof roteiro.trilha === 'string' ? { arquivo: roteiro.trilha } : roteiro.trilha;
  const k = entrada('-stream_loop', '-1', '-i', doRoteiro(tr.arquivo));
  filtros.push(`[${k}:a]atrim=start=${de},asetpts=PTS-STARTPTS,aresample=48000,volume=${tr.volume ?? 0.18}[tr0]`);
  if (temVoz) filtros.push('[tr0][vozsc]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=400[tr]');
  mix.push(temVoz ? '[tr]' : '[tr0]');
}
const efeitos = coletarEfeitos(roteiro).filter((e) => e.t >= de && e.t < ate);
if (efeitos.length) {
  const tmp = mkdtempSync(path.join(tmpdir(), 'sons-'));
  const gerados = {};
  for (const e of efeitos) {
    const arq = SONS[e.som] ? (gerados[e.som] ??= gerarSom(tmp, e.som)) : doRoteiro(e.som);
    const k = entrada('-i', arq);
    const ms = Math.round((e.t - de) * 1000);
    filtros.push(`[${k}:a]aresample=48000,volume=${e.volume ?? 0.35},adelay=${ms}|${ms}[s${k}]`);
    mix.push(`[s${k}]`);
  }
}

const cmd = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', ...entradas];
if (mix.length) {
  filtros.push(`${mix.join('')}amix=inputs=${mix.length}:normalize=0:dropout_transition=0,alimiter=limit=0.95[a]`);
  cmd.push('-filter_complex', filtros.join(';'), '-map', '0:v', '-map', '[a]', '-c:a', 'aac', '-b:a', '192k');
} else cmd.push('-an');
cmd.push('-c:v', 'libx264', '-preset', rascunho ? 'veryfast' : 'medium', '-crf', rascunho ? '26' : '17', '-pix_fmt', 'yuv420p',
  '-r', String(fps), '-t', String(total / fps), '-movflags', '+faststart', saida);

const ff = spawn('ffmpeg', cmd, { stdio: ['pipe', 'inherit', 'inherit'] });
const fim = new Promise((ok, erro) => ff.on('close', (c) => (c === 0 ? ok() : erro(new Error(`ffmpeg saiu com código ${c}`)))));
const inicio = Date.now();
for (let i = 0; i < total; i++) {
  await pagina.evaluate((x) => window.motor.renderAt(x), de + i / fps);
  const img = await pagina.screenshot({ type: 'jpeg', quality: 93 });
  if (!ff.stdin.write(img)) await new Promise((ok) => ff.stdin.once('drain', ok));
  if (i % fps === 0) process.stdout.write(`\r${((i / total) * 100).toFixed(0)}%  ${(de + i / fps).toFixed(1)}s / ${ate.toFixed(1)}s`);
}
ff.stdin.end();
await fim;
await navegador.close();
console.log(`\rpronto em ${((Date.now() - inicio) / 1000).toFixed(0)}s → ${saida}`);

// ---------- efeitos sonoros ----------
function gerarSom(pasta, nome) {
  const arq = path.join(pasta, `${nome}.wav`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...SONS[nome], arq]);
  return arq;
}
function coletarEfeitos(r) {
  const lista = [...(r.efeitos || [])];
  if (r.efeitosAuto) {
    r.blocos.forEach((b, i) => i > 0 && lista.push({ t: b.inicio, som: 'whoosh', volume: 0.3 }));
    const visitar = (o) => {
      if (!o || typeof o !== 'object') return;
      if (Array.isArray(o)) return o.forEach(visitar);
      if (typeof o.clique === 'number') lista.push({ t: o.clique, som: 'clique', volume: 0.5 });
      if (typeof o.trocar === 'number') lista.push({ t: o.trocar, som: 'clique', volume: 0.5 });
      (o.cliques || []).forEach((c) => lista.push({ t: c.t, som: 'clique', volume: 0.5 }));
      if (typeof o.t === 'number' && o.tipo !== undefined) lista.push({ t: o.t, som: 'pop', volume: 0.22 });
      Object.values(o).forEach(visitar);
    };
    r.blocos.forEach((b) => visitar(b.elementos));
  }
  lista.sort((a, b) => a.t - b.t);
  return lista.filter((e, i) => i === 0 || e.t - lista[i - 1].t > 0.12 || e.som !== lista[i - 1].som);
}
