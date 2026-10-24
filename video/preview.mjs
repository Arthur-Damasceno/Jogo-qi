#!/usr/bin/env node
// Prévia ao vivo no navegador, com a narração tocando e barra para navegar no tempo.
//   node video/preview.mjs video/exemplos/do-zero/roteiro.json
// Abra o endereço impresso. Espaço = tocar/pausar. Salve o JSON e recarregue a página para ver a mudança.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const roteiro = process.argv[2];
if (!roteiro) {
  console.error('uso: node video/preview.mjs <roteiro.json>');
  process.exit(1);
}
const pastaRoteiro = path.dirname(path.resolve(roteiro));
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4' };

// /motor/* vem do motor; /r/* vem da pasta do roteiro (mídias com caminho relativo funcionam igual ao render)
createServer(async (req, res) => {
  const u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const [raiz, resto] = u.startsWith('/r/') ? [pastaRoteiro, u.slice(3)] : [path.join(aqui, 'motor'), u.replace(/^\/motor\//, '')];
  const arq = path.resolve(raiz, resto || 'index.html');
  if (!arq.startsWith(raiz)) return res.writeHead(403).end();
  try {
    const dados = await readFile(arq);
    const cab = { 'content-type': tipos[path.extname(arq).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store', 'accept-ranges': 'bytes' };
    // pedidos parciais: sem isso o navegador não consegue pular para o meio do áudio
    const faixa = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
    if (faixa) {
      const ini = faixa[1] ? +faixa[1] : 0;
      const fim = faixa[2] ? +faixa[2] : dados.length - 1;
      res.writeHead(206, { ...cab, 'content-range': `bytes ${ini}-${fim}/${dados.length}` });
      return res.end(dados.subarray(ini, fim + 1));
    }
    res.writeHead(200, cab);
    res.end(dados);
  } catch {
    res.writeHead(404).end();
  }
}).listen(5178, () => {
  console.log(`prévia: http://localhost:5178/motor/index.html?roteiro=/r/${encodeURIComponent(path.basename(roteiro))}`);
});
