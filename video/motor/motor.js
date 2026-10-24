/*
 * Motor de vídeo "explicativo animado".
 * Lê um roteiro (JSON) e desenha o quadro do instante t em renderAt(t).
 * Todo tempo do roteiro é absoluto, em segundos, igual ao da narração.
 * Nada aqui usa relógio: o mesmo t sempre gera o mesmo quadro.
 */
(() => {
  const W = 1080;

  // ---------- utilidades ----------
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const prog = (t, ini, dur) => clamp((t - ini) / dur);
  const lerp = (a, b, p) => a + (b - a) * p;
  const ease = {
    out: (x) => 1 - Math.pow(1 - x, 3),
    inOut: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    back: (x) => 1 + 2.2 * Math.pow(x - 1, 3) + 1.2 * Math.pow(x - 1, 2),
  };
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // *palavra* vira destaque vermelho
  const fmt = (s) => esc(s).replace(/\*([^*]+)\*/g, '<b class="vermelho">$1</b>');
  const h = (html) => {
    const d = document.createElement('div');
    d.innerHTML = html.trim();
    return d.firstElementChild;
  };
  const $ = (raiz, sel) => raiz.querySelector(sel);
  const $$ = (raiz, sel) => [...raiz.querySelectorAll(sel)];
  let base = location.href;
  const url = (p) => (p ? new URL(p, base).href : '');

  const FAISCA = '<svg viewBox="0 0 40 40" width="1em" height="1em"><g stroke="#d9583b" stroke-width="4.2" stroke-linecap="round">' +
    [0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5].map((a) => `<line x1="20" y1="4" x2="20" y2="36" transform="rotate(${a} 20 20)"/>`).join('') + '</g></svg>';
  const CADEADO = '<svg viewBox="0 0 20 24" width="0.8em" height="1em"><rect x="2" y="10" width="16" height="13" rx="3" fill="currentColor"/><path d="M5.5 10V7a4.5 4.5 0 0 1 9 0v3" fill="none" stroke="currentColor" stroke-width="2.6"/></svg>';
  const SETA = '<svg viewBox="0 0 24 24"><path d="M4 2l15 11-6.5 1.2L16.8 22l-3 1.4-4.3-7.8L4 20z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';

  // Entrada/saída padrão de qualquer coisa na tela.
  function presenca(t, ent, sai, modo = 'subir') {
    if (t < ent) return null;
    const pe = prog(t, ent, 0.5);
    const ps = sai == null ? 0 : prog(t, sai, 0.32);
    if (ps >= 1) return null;
    const e = ease.out(pe);
    let op = e, y = 0, blur = 0, s = 1;
    switch (modo) {
      case 'zoom': s = lerp(0.82, 1, ease.back(pe)); blur = 14 * (1 - e); break;
      case 'pop': s = lerp(0.4, 1, ease.back(pe)); op = clamp(pe * 3); blur = 8 * (1 - e); break;
      case 'desfoque': blur = 28 * (1 - e); s = lerp(1.05, 1, e); break;
      case 'descer': y = -60 * (1 - e); blur = 12 * (1 - e); break;
      case 'nenhum': op = 1; break;
      default: y = 60 * (1 - e); blur = 14 * (1 - e); s = lerp(0.97, 1, e);
    }
    if (ps > 0) {
      const x = ease.inOut(ps);
      op *= 1 - x; blur += 18 * x; s *= 1 - 0.03 * x;
    }
    return { op, y, blur, s };
  }
  const filtro = (b) => (b > 0.3 ? `blur(${b.toFixed(1)}px)` : 'none');

  // Mostra/esconde uma parte interna de um componente (mantém o espaço no layout).
  function mostrar(no, t, ent, sai, modo = 'subir', dist = 0.5) {
    const p = presenca(t, ent, sai, modo);
    if (!p) { no.style.visibility = 'hidden'; return 0; }
    no.style.visibility = '';
    no.style.opacity = p.op;
    no.style.transform = `translateY(${p.y * dist}px) scale(${p.s})`;
    no.style.filter = filtro(p.blur);
    return p.op;
  }
  // Igual a mostrar, mas a altura cresce junto (itens que empurram os de baixo).
  function revelar(no, t, ent, sai) {
    const pe = ease.out(prog(t, ent, 0.45));
    const ps = sai == null ? 0 : ease.inOut(prog(t, sai, 0.32));
    no.style.height = `${(no._h || 0) * pe * (1 - ps)}px`;
    mostrar(no.firstElementChild || no, t, ent, sai, 'subir', 0.3);
  }

  // Ponteiro que viaja até cada alvo e clica no instante pedido.
  function ponteiro(raiz, cliques) {
    const p = h(`<div class="ponteiro">${SETA}</div>`);
    raiz.appendChild(p);
    let pts = [];
    return {
      medir() {
        const r0 = raiz.getBoundingClientRect();
        pts = cliques.map((c) => {
          const r = c.no.getBoundingClientRect();
          return { t: c.t, x: r.left - r0.left + r.width * 0.55, y: r.top - r0.top + r.height * 0.55 };
        });
      },
      atualizar(t) {
        if (!pts.length || t < pts[0].t - 1.1) { p.style.display = 'none'; return; }
        p.style.display = '';
        let k = pts.findIndex((q) => t < q.t + 0.2);
        if (k < 0) k = pts.length - 1;
        const alvo = pts[k];
        const de = k > 0 ? pts[k - 1] : { x: alvo.x + 170, y: alvo.y + 230 };
        const m = ease.inOut(prog(t, alvo.t - 0.85, 0.7));
        const x = lerp(de.x, alvo.x, m), y = lerp(de.y, alvo.y, m);
        const aperto = t >= alvo.t && t < alvo.t + 0.16 ? 0.82 : 1;
        p.style.opacity = prog(t, pts[0].t - 1.1, 0.25);
        p.style.transform = `translate(${x}px, ${y}px) scale(${aperto})`;
      },
    };
  }

  // Liga um texto digitado letra a letra a um nó.
  function digitar(no, texto, t, ini, cps = 16, cursor = true) {
    if (ini == null || t < ini) { no.innerHTML = ''; return false; }
    const n = Math.floor((t - ini) * cps);
    const fim = n >= texto.length;
    const pisca = cursor && (!fim || Math.floor((t - ini) * 2) % 2 === 0);
    no.innerHTML = esc(texto.slice(0, n)) + (pisca ? '<span class="cursor-txt"></span>' : '');
    return true;
  }

  // ---------- componentes ----------
  // Cada um recebe as props do roteiro (p) e o bloco; devolve { no, atualizar(t), medir?() }.
  const C = {};

  C.bloqueio = (p) => {
    const no = h(`<div class="bloqueio"><div class="cadeado">${CADEADO}</div><div class="data">${esc(p.data || '')}</div>
      <div class="hora">${esc(p.hora || '21:47')}</div><div class="notifs"></div></div>`);
    const lista = $(no, '.notifs');
    const itens = (p.notificacoes || []).map((n) => {
      const el = h(`<div class="notif"><div class="ic">◎</div><div class="txt"><div class="app">${esc(n.app || 'Instagram')}</div>
        <div class="msg"><b>${esc(n.usuario || '')}</b> ${fmt(n.texto)}</div></div><div class="quando">agora</div></div>`);
      lista.appendChild(el);
      return { el, t: n.t };
    });
    return {
      no,
      atualizar(t) {
        for (const it of itens) {
          const novos = itens.filter((o) => o.t > it.t);
          const desloc = novos.reduce((s, o) => s + ease.out(prog(t, o.t, 0.45)), 0);
          const v = mostrar(it.el, t, it.t, null, 'descer');
          if (v) it.el.style.transform += ` translateY(${desloc * 118}px) scale(${1 - 0.025 * desloc})`;
          it.el.style.zIndex = Math.round(100 - desloc);
        }
      },
    };
  };

  C.cartao = (p, bloco) => {
    const vidro = bloco.tema === 'escuro';
    const no = h(`<div class="cartao ${vidro ? 'vidro' : 'card'}"><div class="topo"><span>${esc(p.rotulo || '')}</span><b>${esc(p.canto || '')}</b></div>
      <div class="tit">${fmt(p.titulo || '')}</div><div class="sub"></div>
      <div class="pe"><span class="seta">→</span><span class="brilho">✦</span></div></div>`);
    const sub = $(no, '.sub');
    return { no, atualizar: (t) => digitar(sub, p.sub || '', t, p.tDigitar ?? p.t + 0.5, p.cps || 18) };
  };

  C.icones = (p) => {
    const no = h('<div class="icones"></div>');
    const itens = (p.itens || []).map((i) => {
      const el = h(`<div class="icone" style="background:${esc(i.cor || '#2a2a2e')};color:${esc(i.corTexto || '#fff')}">${i.img ? `<img src="${url(i.img)}">` : i.faisca ? FAISCA : esc(i.texto || '')}</div>`);
      no.appendChild(el);
      return { el, t: i.t };
    });
    return { no, atualizar: (t) => itens.forEach((i) => mostrar(i.el, t, i.t, null, 'pop')) };
  };

  C.campo = (p, bloco) => {
    const no = h(`<div class="campo ${bloco.tema === 'escuro' ? 'vidro' : 'card'}"><div class="t"></div><div class="enviar">↑</div></div>`);
    const txt = $(no, '.t');
    return {
      no,
      atualizar(t) {
        if (!digitar(txt, p.texto || '', t, p.tDigitar ?? p.t + 0.4, p.cps || 14)) txt.innerHTML = `<span class="ph">${esc(p.placeholder || '')}</span>`;
      },
    };
  };

  // Janela de app com conversa. Itens entram empurrando os de baixo.
  C.janela = (p) => {
    const no = h(`<div class="janela card"><div class="barra"><i></i><i></i><i></i><span>${esc(p.titulo || '')}</span></div><div class="corpo"></div></div>`);
    const corpo = $(no, '.corpo');
    const cliques = [];
    const itens = (p.itens || []).map((it) => {
      let el;
      switch (it.tipo) {
        case 'usuario':
          el = h(`<div class="msg-usuario ${it.lado === 'esq' ? 'esq' : ''}"><div class="bal">${it.thumb ? `<div class="thumb">${it.thumb === true ? '' : `<img src="${url(it.thumb)}">`}</div>` : ''}${fmt(it.texto)}</div></div>`);
          break;
        case 'ia':
          el = h(`<div class="msg-ia"><span class="faisca">${FAISCA}</span><span class="pontos3"><span></span><span></span><span></span></span>${it.duvida ? '<span class="duvida">?</span>' : ''}${it.texto ? `<span>${fmt(it.texto)}</span>` : ''}</div>`);
          break;
        case 'linha':
          el = h(`<div class="linha-ia"><span class="ic">${esc(it.icone || '•')}</span>${fmt(it.texto)}<span class="fim">${esc(it.fim ?? '?')}</span></div>`);
          break;
        case 'chip':
          el = h(`<div><span class="chip"><span class="doc"></span>${esc(it.texto)}</span></div>`);
          break;
        case 'colar': {
          el = h(`<div class="colar"><div class="rot">${FAISCA} ${esc(it.rotulo || 'Cole na sua IA')}</div>${fmt(it.texto)}<div class="acoes"><span>${esc(it.rodape || '')}</span><b>Copiar</b></div></div>`);
          if (it.clique != null) cliques.push({ t: it.clique, no: $(el, 'b') });
          break;
        }
        case 'inicio': {
          el = h(`<div style="text-align:center;padding:20px 0 10px"><div style="font-size:90px;line-height:1">${it.icone ? esc(it.icone) : FAISCA}</div><div style="font-size:40px;font-weight:700;margin:8px 0 18px">${esc(it.nome || '')}</div>
            <div class="abas" style="display:inline-flex;background:#efe7dc;border-radius:16px;padding:6px;font-size:24px">${(it.abas || []).map((a) => `<span style="padding:10px 30px;border-radius:12px">${esc(a)}</span>`).join('')}</div>
            <div class="prompt" style="text-align:left;margin-top:40px;font-size:24px;color:#a59c94;font-family:var(--mono)">${esc(it.placeholder || 'Como posso ajudar?')}</div></div>`);
          const abas = $$(el, '.abas span');
          const prompt = $(el, '.prompt');
          if (it.trocar != null && abas[1]) cliques.push({ t: it.trocar, no: abas[1] });
          el._atualizar = (t) => {
            const k = it.ativa ?? (it.trocar != null && t >= it.trocar ? 1 : 0);
            abas.forEach((a, i) => { a.style.background = i === k ? '#fff' : 'transparent'; a.style.color = i === k && k ? 'var(--vermelho)' : ''; });
            if (k && it.comando) digitar(prompt, it.comando, t, it.trocar + 0.3, 14);
          };
          break;
        }
        default:
          el = h(`<div style="font-size:28px;padding:8px 0">${fmt(it.texto)}</div>`);
      }
      const caixa = h('<div class="item"></div>');
      caixa.appendChild(el);
      corpo.appendChild(caixa);
      return { caixa, el, it };
    });
    let campo;
    if (p.campo) {
      const r = h(`<div class="rodape"><div class="campo"><div class="t"></div><div class="enviar">↑</div></div></div>`);
      no.appendChild(r);
      campo = $(r, '.t');
    }
    const ptr = cliques.length ? ponteiro(no, cliques) : null;
    return {
      no,
      medir() {
        itens.forEach((i) => { i.caixa._h = i.caixa.scrollHeight; });
        ptr?.medir();
      },
      atualizar(t) {
        for (const { caixa, el, it } of itens) {
          revelar(caixa, t, it.t, it.ate);
          el._atualizar?.(t);
          if (it.tipo === 'ia') $$(el, '.pontos3 span').forEach((s, k) => { s.style.opacity = 0.35 + 0.65 * Math.max(0, Math.sin(t * 7 - k * 0.9)); });
        }
        if (campo) {
          const c = p.campo;
          const enviado = c.enviar != null && t >= c.enviar;
          if (enviado || !digitar(campo, c.texto || '', t, c.t, c.cps || 14)) campo.innerHTML = `<span class="ph">${esc(c.placeholder || 'Peça ao Claude...')}</span>`;
        }
        ptr?.atualizar(t);
      },
    };
  };

  C.terminal = (p) => {
    const no = h(`<div class="janela card terminal"><div class="barra"><i></i><i></i><i></i><span>${esc(p.titulo || '')}</span></div>
      <div class="corpo"><div class="boas-vindas">${fmt(p.boasVindas || '')}</div></div></div>`);
    const corpo = $(no, '.corpo');
    const linhas = (p.linhas || []).map((l) => {
      const el = h(`<div class="ln ${l.forte ? 'forte' : ''}">${l.faisca ? FAISCA + ' ' : ''}${fmt(l.texto)}</div>`);
      corpo.appendChild(el);
      return { el, l };
    });
    let barra;
    if (p.progresso) {
      corpo.appendChild(h('<div class="barra-prog"><i></i></div>'));
      barra = $(corpo, '.barra-prog i');
    }
    return {
      no,
      atualizar(t) {
        linhas.forEach(({ el, l }) => mostrar(el, t, l.t, null, 'subir', 0.2));
        if (barra) barra.style.width = `${3 + 97 * ease.inOut(prog(t, p.progresso.t, p.progresso.ate - p.progresso.t))}%`;
      },
    };
  };

  C.arquivo = (p) => {
    const no = h(`<div class="arquivo"><div class="moldura"><div class="doc" data-sel="${esc(p.selo || 'IA')}"></div></div><div class="nome">${esc(p.nome || '')}</div></div>`);
    const mold = $(no, '.moldura');
    return {
      no,
      atualizar(t) {
        const d = p.destacar == null ? 0 : ease.out(prog(t, p.destacar, 0.3));
        mold.style.boxShadow = `0 0 0 ${6 * d}px var(--vermelho), var(--sombra)`;
      },
    };
  };

  C.lista = (p) => {
    const vis = p.visiveis || 3;
    const no = h(`<div class="lista card"><div class="trilho"></div></div>`);
    const trilho = $(no, '.trilho');
    const rows = (p.itens || []).map((i) => {
      const el = h(`<div class="row"><span class="ic">${esc(i.icone || '•')}</span><span class="tx">${fmt(i.texto)}</span><span class="ok">✓</span></div>`);
      trilho.appendChild(el);
      return { el, i, ok: $(el, '.ok'), tx: $(el, '.tx') };
    });
    return {
      no,
      atualizar(t) {
        // o item da vez fica na faixa do meio; os outros aparecem apagados
        let desloc = 0;
        rows.forEach((r, k) => { if (k >= 1) desloc += ease.inOut(prog(t, r.i.t, 0.4)); });
        trilho.style.transform = `translateY(${(vis >> 1) * 90 - desloc * 90}px)`;
        rows.forEach((r) => {
          const foco = ease.out(prog(t, r.i.t, 0.3)) * (1 - ease.out(prog(t, rows[rows.indexOf(r) + 1]?.i.t ?? 1e9, 0.3)));
          r.el.style.opacity = 0.35 + 0.65 * foco;
          r.el.style.transform = `scale(${1 + 0.06 * foco})`;
          r.el.style.transformOrigin = '0 50%';
          r.tx.style.fontWeight = foco > 0.5 ? 700 : 500;
          mostrar(r.ok, t, r.i.t + 0.35, null, 'pop');
        });
      },
    };
  };

  C.dialogo = (p) => {
    const bts = p.botoes || ['Negar', 'Permitir'];
    const no = h(`<div class="dialogo card"><div class="app">${FAISCA}<span>${esc(p.app || '')}</span></div><h3>${fmt(p.titulo || '')}</h3>
      ${p.comando ? `<div class="cmd">${esc(p.comando)}</div>` : ''}<div class="desc">${fmt(p.descricao || '')}</div>
      <div class="botoes">${bts.map((b, i) => `<div class="bt ${i === bts.length - 1 ? 'prim' : ''}">${esc(b)}</div>`).join('')}</div></div>`);
    const prim = $(no, '.bt.prim');
    const ptr = p.clique != null ? ponteiro(no, [{ t: p.clique, no: prim }]) : null;
    return {
      no,
      medir: () => ptr?.medir(),
      atualizar(t) {
        prim.classList.toggle('ativo', p.clique != null && t >= p.clique);
        ptr?.atualizar(t);
      },
    };
  };

  C.senha = (p) => {
    const no = h(`<div class="senha card" style="position:relative"><div class="cad">${CADEADO}</div><h4>${esc(p.titulo || 'O instalador quer fazer alterações.')}</h4>
      <p>${esc(p.texto || 'Digite sua senha para permitir.')}</p><div class="campo-s">••••••••</div><div class="acoes"><span>Cancelar</span><b>OK</b></div><div class="x">×</div></div>`);
    const x = $(no, '.x');
    return {
      no,
      atualizar(t) {
        const v = p.negar == null ? 0 : mostrar(x, t, p.negar, null, 'pop');
        if (!v) x.style.visibility = 'hidden';
        no.style.opacity = p.negar != null && t >= p.negar ? 1 - 0.3 * prog(t, p.negar, 0.3) : 1;
      },
    };
  };

  C.pilula = (p) => {
    const no = h(`<div class="pilula"><div class="grande">${p.prefixo ? `<span>${esc(p.prefixo)} </span>` : ''}${esc(p.texto || '')}</div>
      ${p.sub ? `<div><div class="peq">${fmt(p.sub.texto)}</div></div>` : ''}</div>`);
    const peq = $(no, '.peq');
    return { no, atualizar: (t) => peq && mostrar(peq, t, p.sub.t, null, 'pop') };
  };

  C.botao = (p) => {
    const no = h(`<div style="position:relative"><div class="botao">${esc(p.texto || '')} ›</div></div>`);
    const b = $(no, '.botao');
    const ptr = p.clique != null ? ponteiro(no, [{ t: p.clique, no: b }]) : null;
    return {
      no,
      medir: () => ptr?.medir(),
      atualizar(t) {
        b.classList.toggle('ativo', p.clique != null && t >= p.clique);
        ptr?.atualizar(t);
      },
    };
  };

  C.marca = (p) => ({ no: h(`<div class="marca-ok">${esc(p.simbolo || '✓')}</div>`), atualizar() {} });

  C.selo = (p) => ({ no: h(`<div class="selo"><i></i>${fmt(p.texto || '')}</div>`), atualizar() {} });

  C.texto = (p) => ({
    no: h(`<div class="texto-livre" style="font-size:${p.tamanho || 64}px;font-weight:${p.peso || 800};letter-spacing:${p.espaco ?? -2}px;color:${esc(p.cor || 'inherit')}">${fmt(p.texto || '')}</div>`),
    atualizar() {},
  });

  // Celular com imagem ou vídeo. O vídeo é posicionado quadro a quadro.
  C.celular = (p) => {
    const ehVideo = /\.(mp4|mov|webm|m4v)$/i.test(p.midia || '');
    const midia = !p.midia ? '<div class="play">▶</div>' : ehVideo ? `<video muted playsinline preload="auto" src="${url(p.midia)}"></video>` : `<img src="${url(p.midia)}">`;
    const no = h(`<div class="celular"><div class="tela"><div class="ilha"></div>${midia}</div></div>`);
    const v = $(no, 'video');
    return {
      no,
      atualizar(t) {
        if (!v || t < p.t) return;
        const alvo = Math.min((p.inicioMidia || 0) + (t - p.t), (v.duration || 1e9) - 0.05);
        if (Math.abs(v.currentTime - alvo) < 0.005) return;
        v.currentTime = alvo;
        if (window.__renderizando) return new Promise((ok) => v.addEventListener('seeked', ok, { once: true }));
      },
    };
  };

  // Fileira de imagens (fotos, capturas), cada uma pode ganhar um selo (× ou ✓).
  C.imagens = (p) => {
    const no = h('<div class="grade"></div>');
    const itens = (p.itens || []).map((i) => {
      const el = h(`<div class="imagem" style="${p.pb ? 'filter:grayscale(1)' : ''};width:${p.largura || 260}px;height:${p.altura || 380}px">${i.midia ? `<img src="${url(i.midia)}">` : ''}${i.marca ? `<div class="marca">${esc(i.marca.simbolo || '×')}</div>` : ''}</div>`);
      no.appendChild(el);
      return { el, i, marca: $(el, '.marca') };
    });
    return {
      no,
      atualizar(t) {
        itens.forEach(({ el, i, marca }) => {
          mostrar(el, t, i.t ?? p.t, i.ate, 'zoom');
          if (marca) mostrar(marca, t, i.marca.t, null, 'pop');
        });
      },
    };
  };

  // Onda de áudio com pausas que ficam vermelhas e depois somem.
  C.onda = (p) => {
    const n = p.barras || 64;
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const pausas = p.pausas || [[0.18, 0.24], [0.42, 0.47], [0.66, 0.72], [0.86, 0.9]];
    const naPausa = (k) => pausas.some(([a, b]) => k / n >= a && k / n < b);
    const barras = Array.from({ length: n }, (_, k) => {
      const alt = naPausa(k) ? 0.12 + 0.1 * rnd() : 0.25 + 0.75 * Math.pow(rnd(), 0.8) * (0.6 + 0.4 * Math.sin(k * 0.45));
      return `<i style="height:${(alt * 100).toFixed(0)}%" class="${naPausa(k) ? 'p' : ''}"></i>`;
    });
    const no = h(`<div class="onda card"><div class="rot">${esc(p.rotulo || 'gravacao.mov')}</div><div class="barras">${barras.join('')}</div></div>`);
    const ps = $$(no, '.barras i.p');
    return {
      no,
      atualizar(t) {
        const marcado = p.marcar != null && t >= p.marcar;
        const c = p.cortar == null ? 0 : ease.inOut(prog(t, p.cortar, 0.6));
        ps.forEach((b) => {
          b.classList.toggle('pausa', marcado);
          b.style.flexGrow = 1 - c;
          b.style.marginLeft = b.style.marginRight = `${-2.5 * c}px`;
          b.style.opacity = 1 - c;
        });
      },
    };
  };

  C.tomadas = (p) => {
    const no = h(`<div class="tomadas">${(p.itens || []).map((x) => `<span>${esc(x)}</span>`).join('')}</div>`);
    const spans = $$(no, 'span');
    return {
      no,
      atualizar(t) {
        const e = p.escolher;
        spans.forEach((s, k) => {
          mostrar(s, t, p.t + k * 0.15, null, 'pop');
          const ok = e && t >= e.t;
          s.classList.toggle('sel', !!ok && k === e.indice);
          s.classList.toggle('riscada', !!ok && k !== e.indice);
        });
      },
    };
  };

  C.painel = (p) => {
    const bts = p.botoes || ['Aprovar', 'Pedir ajuste'];
    const no = h(`<div class="painel card" style="position:relative"><h4>${esc(p.titulo || 'Corte pronto')}</h4><p>${esc(p.sub || 'Reels · 9:16')}</p>
      ${bts.map((b) => `<div class="bt">${esc(b)}</div>`).join('')}</div>`);
    const els = $$(no, '.bt');
    const cliques = (p.cliques || []).map((c) => ({ t: c.t, no: els[c.indice] }));
    const ptr = cliques.length ? ponteiro(no, cliques) : null;
    return {
      no,
      medir: () => ptr?.medir(),
      atualizar(t) {
        els.forEach((b, k) => b.classList.toggle('ativo', (p.cliques || []).some((c) => c.indice === k && t >= c.t)));
        ptr?.atualizar(t);
      },
    };
  };

  // ---------- montagem ----------
  let R, blocos = [], legendas = [], elementos = [];
  const palco = document.getElementById('palco');
  const camada = document.getElementById('elementos');
  const cab = document.getElementById('cabecalho');
  const legEl = document.getElementById('legenda');
  const cv = document.getElementById('fundo-escuro');
  const ctx = cv.getContext('2d');
  const claro = document.getElementById('fundo-claro');
  const bolhas = $$(claro, '.bolha');

  function prepararLegendas(lista, fimVideo) {
    return lista.map((L, i) => {
      const crus = L.texto.trim().split(/\s+/);
      let dentro = false, viu = false;
      const palavras = crus.map((w) => {
        const abre = w.startsWith('*');
        if (abre) dentro = true;
        const dest = dentro;
        if (w.endsWith('*') && (w.length > 1 || !abre)) dentro = false;
        if (dest) viu = true;
        return { txt: w.replace(/\*/g, ''), dest, depois: !dest && viu };
      });
      const prox = lista[i + 1];
      const fim = L.fim ?? (prox ? prox.t : fimVideo);
      const dur = Math.min(0.3 * palavras.length, (fim - L.t) * 0.75);
      palavras.forEach((p, k) => { p.t = L.palavras?.[k] ?? L.t + (k * dur) / palavras.length; });
      return { ...L, fim, palavras, colado: prox && Math.abs(prox.t - fim) < 0.05 };
    });
  }

  let legAtual = null;
  function desenharLegenda(t) {
    const L = legendas.find((l) => t >= l.t && t < l.fim + (l.colado ? 0 : 0.3));
    if (L !== legAtual) {
      legAtual = L;
      legEl.innerHTML = '';
      if (L) {
        const linhas = { antes: h('<div class="linha peq"></div>'), dest: h('<div class="linha dest"></div>'), depois: h('<div class="linha peq"></div>') };
        L.palavras.forEach((p) => {
          p.el = h(`<span class="p">${esc(p.txt)}</span>`);
          const alvo = p.dest ? linhas.dest : p.depois ? linhas.depois : linhas.antes;
          if (alvo.childNodes.length) alvo.appendChild(document.createTextNode(' '));
          alvo.appendChild(p.el);
        });
        Object.values(linhas).forEach((l) => l.childNodes.length && legEl.appendChild(l));
      }
    }
    if (!L) return;
    const saida = L.colado ? 0 : ease.inOut(prog(t, L.fim, 0.3));
    for (const p of L.palavras) {
      const e = ease.out(prog(t, p.t, p.dest ? 0.3 : 0.22));
      p.el.style.opacity = e * (1 - saida);
      p.el.style.filter = filtro((p.dest ? 16 : 10) * (1 - e) + 14 * saida);
      p.el.style.transform = `translateY(${10 * (1 - e)}px)`;
    }
  }

  function desenharFundo(t, mistura) {
    claro.style.opacity = mistura;
    cv.style.opacity = 1 - mistura;
    if (mistura < 1) {
      ctx.filter = 'none';
      ctx.fillStyle = '#050304';
      ctx.fillRect(0, 0, 270, 480);
      ctx.filter = 'blur(12px)';
      const fitas = [
        { x: 66, a: 30, f: 0.014, w: 0.45, f0: 0, larg: 40, cor: 'rgba(120,0,16,.75)' },
        { x: 62, a: 26, f: 0.015, w: 0.5, f0: 0.3, larg: 12, cor: 'rgba(230,20,45,.5)' },
        { x: 220, a: 18, f: 0.011, w: 0.35, f0: 2, larg: 26, cor: 'rgba(90,0,12,.35)' },
      ];
      for (const r of fitas) {
        ctx.beginPath();
        for (let y = -30; y <= 510; y += 10) {
          const x = r.x + r.a * Math.sin(y * r.f + t * r.w + r.f0) + 10 * Math.sin(y * 0.041 - t * 0.3);
          y === -30 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = r.cor;
        ctx.lineWidth = r.larg;
        ctx.stroke();
      }
    }
    const bases = [[-200, 0], [500, -250], [-300, 1300], [600, 1200]];
    bolhas.forEach((b, i) => {
      const [bx, by] = bases[i];
      b.style.transform = `translate(${bx + 70 * Math.sin(t * 0.25 + i * 1.7)}px, ${by + 60 * Math.cos(t * 0.21 + i * 2.3)}px)`;
    });
  }

  let cabAtual = null;
  function desenharCabecalho(t, b, i) {
    const ps = b.passo;
    if (!ps) { cab.style.visibility = 'hidden'; return; }
    if (cabAtual !== ps) {
      cabAtual = ps;
      $(cab, '.n').textContent = String(ps.n).padStart(2, '0');
      $(cab, '.de').textContent = ps.total ? `de ${String(ps.total).padStart(2, '0')}` : '';
      $(cab, '.titulo').innerHTML = fmt(ps.titulo || '');
    }
    cab.style.visibility = '';
    const ant = blocos[i - 1], prox = blocos[i + 1];
    const mesmoAnt = ant?.passo?.n === ps.n, mesmoProx = prox?.passo?.n === ps.n;
    const ini = mesmoAnt ? -99 : b.inicio + 0.05;
    const sai = mesmoProx ? null : b.fim - 0.32;
    mostrar($(cab, '.num'), t, ini, sai, 'desfoque');
    mostrar($(cab, '.titulo'), t, mesmoAnt ? -99 : ps.tTitulo ?? b.inicio + 0.45, sai, 'subir', 0.4);
  }

  async function renderAt(t) {
    let i = blocos.findIndex((b) => t >= b.inicio && t < b.fim);
    if (i < 0) i = t < blocos[0].inicio ? 0 : blocos.length - 1;
    const b = blocos[i];
    const tema = (x) => (x?.tema === 'escuro' ? 0 : 1);
    const ant = blocos[i - 1];
    const mistura = lerp(ant ? tema(ant) : tema(b), tema(b), ease.inOut(prog(t, b.inicio - 0.15, 0.5)));
    palco.classList.toggle('escuro', b.tema === 'escuro');
    desenharFundo(t, mistura);
    desenharCabecalho(t, b, i);
    const esperas = [];
    for (const e of elementos) {
      const p = presenca(t, e.ent, e.sai, e.modo);
      if (!p) { e.raiz.style.display = 'none'; continue; }
      const r = e.raiz.style;
      r.display = '';
      r.opacity = p.op;
      r.filter = filtro(p.blur);
      r.transform = `translate(${e.x}px, ${e.y + p.y}px) translate(-50%, -50%) scale(${p.s * e.escala})`;
      const w = e.comp.atualizar(t);
      if (w) esperas.push(w);
    }
    desenharLegenda(t);
    await Promise.all(esperas);
  }

  async function carregar(roteiro, baseUrl) {
    R = roteiro;
    if (baseUrl) base = baseUrl;
    blocos = R.blocos;
    const duracao = R.duracao ?? blocos[blocos.length - 1].fim;
    legendas = prepararLegendas(R.legendas || [], duracao);
    camada.innerHTML = '';
    elementos = [];
    for (const b of blocos) {
      for (const p of b.elementos || []) {
        const fab = C[p.tipo];
        if (!fab) throw new Error(`Tipo de elemento desconhecido: ${p.tipo}`);
        const comp = fab(p, b);
        const raiz = h('<div class="el"></div>');
        raiz.appendChild(comp.no);
        camada.appendChild(raiz);
        elementos.push({
          comp, raiz,
          ent: p.t ?? b.inicio,
          sai: p.ate ?? b.fim - 0.32,
          modo: p.entrada || 'subir',
          x: p.x ?? W / 2,
          y: p.y ?? (b.passo ? 900 : 760),
          escala: p.escala ?? 1,
        });
      }
    }
    if (R.legendaY) legEl.style.top = `${R.legendaY}px`;
    await document.fonts.ready;
    await Promise.all([...document.images].map((im) => (im.complete ? 0 : new Promise((ok) => { im.onload = im.onerror = ok; }))));
    await Promise.all([...document.querySelectorAll('video')].map((v) => (v.readyState >= 2 ? 0 : new Promise((ok) => { v.onloadeddata = v.onerror = ok; }))));
    // mede alturas e alvos do ponteiro com tudo visível e sem transformação
    elementos.forEach((e) => { e.raiz.style.display = ''; e.raiz.style.transform = 'none'; });
    elementos.forEach((e) => e.comp.medir?.());
    await renderAt(0);
    return { duracao };
  }

  window.motor = { carregar, renderAt };

  // ---------- prévia no navegador: motor/index.html?roteiro=../exemplos/x/roteiro.json ----------
  const q = new URLSearchParams(location.search).get('roteiro');
  if (q) {
    (async () => {
      const ru = new URL(q, location.href).href;
      const r = await (await fetch(ru)).json();
      const { duracao } = await carregar(r, ru);
      const ajustar = () => {
        const s = Math.min(innerWidth / 1080, (innerHeight - 50) / 1920);
        palco.style.transform = `scale(${s})`;
        document.body.style.height = '100vh';
      };
      ajustar();
      addEventListener('resize', ajustar);
      const ui = h(`<div id="controles"><button>▶</button><input type="range" min="0" max="${duracao}" step="0.01" value="0"><span>0.00s</span></div>`);
      document.body.appendChild(ui);
      const [bt, barra, rot] = [$(ui, 'button'), $(ui, 'input'), $(ui, 'span')];
      const audio = r.voz ? new Audio(new URL(r.voz, ru).href) : null;
      let tocando = false, t0 = 0, rel = 0;
      const agora = () => (audio ? audio.currentTime : rel + (tocando ? (performance.now() - t0) / 1000 : 0));
      const alternar = () => {
        tocando = !tocando;
        bt.textContent = tocando ? '❚❚' : '▶';
        if (audio) tocando ? audio.play() : audio.pause();
        else if (tocando) t0 = performance.now(); else rel = agora();
      };
      bt.onclick = alternar;
      addEventListener('keydown', (e) => { if (e.code === 'Space') { e.preventDefault(); alternar(); } });
      barra.oninput = () => { const v = +barra.value; if (audio) audio.currentTime = v; rel = v; t0 = performance.now(); renderAt(v); };
      const laco = () => {
        if (tocando) {
          const t = agora();
          barra.value = t;
          renderAt(t);
          if (t >= duracao) alternar();
        }
        rot.textContent = `${(+barra.value).toFixed(2)}s`;
        requestAnimationFrame(laco);
      };
      laco();
    })();
  }
})();
