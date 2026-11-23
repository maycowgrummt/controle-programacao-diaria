// painel: abas, filtros, kpis e tabelas
"use strict";

// app
function iniciarApp(){
  show("app");
  $("#uNome").textContent = S.perfil.nome;
  $("#uSetor").textContent = SETORES[S.perfil.setor]||S.perfil.setor;
  const av = $("#uAvatar"); av.textContent = iniciais(S.perfil.nome); av.style.background = COR_SETOR[S.perfil.setor] || "#0072bc";
  $("#btnUsers").classList.toggle("hidden", S.perfil.setor!=="admin");
  $("#btnLimpar").classList.toggle("hidden", S.perfil.setor!=="admin");
  $("#fEtapa").innerHTML = `<option value="">Todas as etapas</option>` + ETAPAS.map(([k,l])=>`<option value="${k}">${l}</option>`).join("");
  $("#dDate").value = S.data;
  if (S.perfil.setor !== "admin" && S.perfil.setor !== "consulta") $("#fMine").checked = true;
  ajustarToolbar();
  ouvirPendentes(); ouvirDia();
}
function pararListeners(){
  S.unsub.forEach(u=>u()); S.unsub=[];
  S.unsubDia.forEach(u=>u()); S.unsubDia=[];
  S.unsubUsers?.(); S.unsubUsers=null; fecharDrawer();
}
const snapMap = snap => new Map(snap.docs.map(d=>[d.id,{id:d.id,...d.data()}]));
function ouvirDia(){
  S.unsubDia.forEach(u=>u()); S.unsubDia=[];
  S.doDia = new Map(); S.palDia = new Map(); render();
  const erro = err=>toast("Erro ao carregar dados: "+authMsg(err), true);
  S.unsubDia.push(onSnapshot(query(collection(db,"cargas"), where("data","==",S.data)), snap=>{ S.doDia = snapMap(snap); render(); atualizarDrawer(); }, erro));
  S.unsubDia.push(onSnapshot(query(collection(db,"paletizadas"), where("data","==",S.data)), snap=>{ S.palDia = snapMap(snap); render(); atualizarDrawer(); }, erro));
}
function ouvirPendentes(){
  const erro = err=>toast("Erro ao carregar pendentes: "+authMsg(err), true);
  S.unsub.push(onSnapshot(query(collection(db,"cargas"), where("concluida","==",false)), snap=>{ S.pend = snapMap(snap); render(); atualizarDrawer(); }, erro));
  S.unsub.push(onSnapshot(query(collection(db,"paletizadas"), where("concluida","==",false)), snap=>{ S.palPend = snapMap(snap); render(); atualizarDrawer(); }, erro));
}
function setData(iso){ if(!iso) return; S.data = iso; $("#dDate").value = iso; ouvirDia(); }
$("#dDate").onchange = e=>setData(e.target.value);
$("#dPrev").onclick = ()=>setData(addDias(S.data,-1));
$("#dNext").onclick = ()=>setData(addDias(S.data,1));
$("#dToday").onclick = ()=>setData(hojeISO());
for (const id of ["#fSearch","#fEtapa","#fMine","#fPend"]) $(id).addEventListener("input", render);

// abas
const ABAS = [
  ["todas","Todas","layout-list","var(--marca)"],
  ["programada","Programadas","calendar-check","var(--s-plan)"],
  ["extra","Cargas extras","zap","#0284c7"],
  ["frigorifico","Frigoríficos","snowflake","#0891b2"],
  ["atraso","Em atraso","alarm-clock","var(--perigo)"],
  ["paletizadas","Paletizadas","boxes","var(--s-op)"],
];
const ehPal = () => S.aba === "paletizadas";
function renderTabs(){
  const t = todasCargas();
  const n = {
    todas: t.length,
    programada: t.filter(c=>catOf(c)==="programada").length,
    extra: t.filter(c=>catOf(c)==="extra").length,
    frigorifico: t.filter(c=>catOf(c)==="frigorifico").length,
    atraso: atrasadas().length,
    paletizadas: todasPal().length,
  };
  $("#tabs").innerHTML = ABAS.map(([k,l,ic,cor])=>`<button data-aba="${k}" style="--t:${cor}" class="${S.aba===k?"on":""} ${k==="atraso"&&n[k]?"warn":""}">${icone(ic)}${l}<span class="cnt">${n[k]}</span></button>`).join("");
}
$("#tabs").addEventListener("click", e=>{
  const b = e.target.closest("[data-aba]"); if (!b) return;
  S.aba = b.dataset.aba;
  S.sort = ehPal() ? {k:"chegada",dir:1} : {k:"doca",dir:1};
  ajustarToolbar(); render();
});
function ajustarToolbar(){
  const pal = ehPal();
  $("#btnNova").querySelector("span").textContent = pal ? "Nova coleta paletizada" : S.aba==="extra" ? "Nova carga extra" : S.aba==="frigorifico" ? "Novo frigorífico" : "Nova carga";
  $("#btnNova").classList.toggle("hidden", pal ? !podeCriarPal() : !isPlan());
  $("#btnImport").classList.toggle("hidden", pal || !isPlan());
  $("#fPendWrap").classList.toggle("hidden", S.aba==="atraso");
  $("#fSearch").placeholder = pal ? "Buscar nota, cliente, transportadora, placa…" : "Buscar carga, nome, doca, placa, romaneio…";
}

// filtros
function todasCargas(){
  const m = new Map(S.doDia);
  if ($("#fPend").checked) for (const [k,v] of S.pend) if (!m.has(k) && v.data < S.data) m.set(k,v);
  return [...m.values()];
}
const atrasadas = () => [...S.pend.values()].filter(c=>c.data < S.data);
function todasPal(){
  const m = new Map(S.palDia);
  if ($("#fPend").checked) for (const [k,v] of S.palPend) if (!m.has(k) && v.data < S.data) m.set(k,v);
  return [...m.values()];
}
function sortVal(c,k){
  if (k==="etapa") return ETAPAS.findIndex(x=>x[0]===etapaDe(ehPal()?"pal":"carga", c));
  if (k==="total") return (ehPal()?temposPal(c):tempos(c)).total ?? -1;
  if (k==="ocupacao") return ocupacao(c) ?? -1;
  if (k==="notas") return c.notas?.[0]?.nota ?? "";
  if (k==="clientes") return c.notas?.[0]?.cliente ?? "";
  if (k==="crono") return c.crono ? cronoMs(ehPal()?"pal":"op", c) : -1;
  if (k==="cronoFat") return c.cronoFat ? cronoMs("fat", c) : -1;
  return c[k];
}
function ordenar(rows){
  const {k,dir} = S.sort;
  return rows.sort((a,b)=>{
    const va=sortVal(a,k), vb=sortVal(b,k);
    if (typeof va==="number"||typeof vb==="number") return ((va??0)-(vb??0))*dir;
    return String(va??"").localeCompare(String(vb??""),"pt-BR",{numeric:true})*dir
      || String(a.carga??a.id).localeCompare(String(b.carga??b.id),"pt-BR",{numeric:true});
  });
}
function filtrar(rows, tipo, hayFn, pendFn){
  const q = norm($("#fSearch").value), et = $("#fEtapa").value, mine = $("#fMine").checked;
  return rows.filter(c=>{
    if (et && etapaDe(tipo,c) !== et) return false;
    if (mine && !pendFn(S.perfil.setor, c)) return false;
    if (q){ const hay = norm(hayFn(c)); if (!q.split(" ").every(t=>hay.includes(t))) return false; }
    return true;
  });
}
function filtradas(){
  let base = S.aba==="atraso" ? atrasadas() : todasCargas();
  if (["programada","extra","frigorifico"].includes(S.aba)) base = base.filter(c=>catOf(c)===S.aba);
  return ordenar(filtrar(base, "carga",
    c=>[c.carga,c.nome,c.doca,c.placa,c.romaneio,c.transportadora,c.transpColeta,c.equipe,c.motorista,c.cidade].join(" "), pendenteDe));
}
function filtradasPal(){
  return ordenar(filtrar(todasPal(), "pal",
    p=>[fmtNotas(p.notas),p.transportadora,p.placa,p.equipe,p.obs,p.obsOp,p.motorista].join(" "), pendenteDePal));
}

// kpis
const kpi = (ic, cor, valor, rotulo, sub="", extra="", cls="") =>
  `<div class="kpi ${cls}" style="--k:${cor}"><div class="kpi-icone">${icone(ic)}</div><div class="kpi-textos">
    <span class="kpi-valor">${valor}</span><span class="kpi-rotulo">${rotulo}</span>${sub?`<span class="kpi-sub">${sub}</span>`:""}${extra}</div></div>`;
function renderKpis(){
  const d = [...S.doDia.values()];
  const sum = k => d.reduce((s,c)=>s+(Number(c[k])||0),0);
  const conc = d.filter(c=>etapaDe("carga",c)==="concluida").length;
  const carreg = d.filter(c=>["aguardando_fat","faturando","concluida"].includes(etapaDe("carga",c))).length;
  const pal = d.filter(c=>c.paletizado==="sim").length;
  const atr = atrasadas().length;
  const coletas = S.palDia.size, coletasOk = [...S.palDia.values()].filter(p=>p.termino).length;
  const pct = d.length ? Math.round(conc/d.length*100) : 0;
  $("#kpis").innerHTML =
    kpi("weight","#0072bc", fmtN(sum("peso"),1), "Total peso", "kg") +
    kpi("box","#0891b2", fmtN(sum("cubagem"),2), "Cubagem", "m³") +
    kpi("truck","#15803d", d.length, "Cargas", brData(S.data)) +
    kpi("clipboard-list","#7c3aed", fmtI(sum("pedidos")), "Pedidos") +
    kpi("layers","#ea580c", pal, "Paletizados", "cargas") +
    kpi("package-check","#4f46e5", carreg, "Carregadas", `de ${d.length}`) +
    kpi("circle-check-big","#0ca30c", `${conc} <small>${pct}%</small>`, "Concluídas", "", `<div class="progress"><i style="width:${pct}%"></i></div>`) +
    kpi("boxes","#c98a00", coletas, "Coletas", `paletizadas · ${coletasOk} ok`) +
    kpi("alarm-clock", atr ? "#d03b3b" : "#7a8594", atr, "Em atraso", "dias anteriores", "", atr ? "alerta" : "");
}

// tabela
function renderTable(tipo, cols, grupos, rows, cellFn, vazio, footFn){
  const spans = [];
  for (const c of cols){ if (spans.length && spans.at(-1).g===c.g) spans.at(-1).n++; else spans.push({g:c.g,n:1}); }
  const gh = spans.map(s=>`<th class="${s.g}" colspan="${s.n}">${grupos[s.g]||""}</th>`).join("");
  const arrow = k => S.sort.k===k ? (S.sort.dir>0?" ▲":" ▼") : "";
  const ch = cols.map(c=>`<th data-k="${c.k}" class="${c.sep?"sep":""}">${c.l}${arrow(c.k)}</th>`).join("");
  const body = rows.length
    ? rows.map(c=>`<tr data-tipo="${tipo}" data-id="${esc(c.id)}" class="r-${etapaDe(tipo,c)} ${c.data!==S.data?"outro":""}">${cols.map(col=>`<td class="${col.n?"n":""} ${col.sep?"sep":""}">${cellFn(c,col)}</td>`).join("")}</tr>`).join("")
    : `<tr><td colspan="${cols.length}" class="empty">${vazio}</td></tr>`;
  const foot = rows.length && footFn ? `<tfoot><tr>${cols.map(col=>`<td class="${col.n?"n":""} ${col.sep?"sep":""}">${footFn(col,rows)}</td>`).join("")}</tr></tfoot>` : "";
  $("#grid").innerHTML = `<thead><tr class="g">${gh}</tr><tr class="c">${ch}</tr></thead><tbody>${body}</tbody>${foot}`;
}
function render(){
  if (!S.perfil) return;
  renderKpis(); renderTabs();
  if (ehPal()) renderPal(); else renderCargas();
  renderDatalists();
  ajustarAltura();
}
// altura da tabela = resto da tela
function ajustarAltura(){
  const w = $(".tablewrap"); if (!w || !w.offsetParent) return;
  if (innerWidth <= 860){ w.style.maxHeight = ""; return; }
  const topo = w.getBoundingClientRect().top + scrollY;
  const rod = $(".rodape")?.offsetHeight || 0;   // deixa o rodapé sempre visível
  w.style.maxHeight = Math.max(300, innerHeight - topo - rod - 24) + "px";
}
addEventListener("resize", ()=>requestAnimationFrame(ajustarAltura));
document.fonts?.ready.then(()=>ajustarAltura());
$("#grid").addEventListener("click", e=>{
  const th = e.target.closest("thead tr.c th");
  if (th){ const k=th.dataset.k; S.sort = {k, dir: S.sort.k===k ? -S.sort.dir : 1}; render(); return; }
  if (e.target.closest(".crono-btn")) return;   // botões do cronômetro não abrem a ficha
  const tr = e.target.closest("tbody tr[data-id]");
  if (tr) abrirDrawer(tr.dataset.tipo, tr.dataset.id);
});

// cargas
const COLS = [
  {g:"ge",k:"etapa",l:"Etapa"},
  {g:"gp",k:"carga",l:"Carga",sep:1},{g:"gp",k:"nome",l:"Nome da carga"},{g:"gp",k:"doca",l:"Doca"},{g:"gp",k:"cifFob",l:"CIF/FOB"},
  {g:"gp",k:"pedidos",l:"Ped.",n:1},{g:"gp",k:"cubagem",l:"Cub.",n:1},{g:"gp",k:"peso",l:"Peso",n:1},
  {g:"gx",k:"transpColeta",l:"Transportadora",sep:1},{g:"gx",k:"previsaoChegada",l:"Previsão chegada"},{g:"gx",k:"cubagemVeiculo",l:"Cub. veículo",n:1},{g:"gx",k:"ocupacao",l:"Ocup.",n:1},
  {g:"gc",k:"chegada",l:"Chegada",sep:1},{g:"gc",k:"placa",l:"Placa"},
  {g:"go",k:"status",l:"Status",sep:1},{g:"go",k:"crono",l:"Cronômetro"},{g:"go",k:"inicioCarreg",l:"Início"},{g:"go",k:"fimCarreg",l:"Fim"},{g:"go",k:"paletizado",l:"Palet."},
  {g:"go",k:"equipe",l:"Equipe"},{g:"go",k:"sobrouEspaco",l:"Espaço"},{g:"go",k:"obsOperacao",l:"Obs"},
  {g:"gf",k:"cronoFat",l:"Cronômetro",sep:1},{g:"gf",k:"inicioFat",l:"Início"},{g:"gf",k:"fimFat",l:"Término"},{g:"gf",k:"responsavelFat",l:"Responsável"},{g:"gf",k:"romaneio",l:"Romaneio"},
  {g:"gt",k:"total",l:"Tempo total",sep:1},
];
const GRUPOS = {gp:"Planejamento",gx:"Transporte",gc:"Fat. · Chegada",go:"Operação",gf:"Faturamento"};
const simNao = v => v==="sim"?`<span class="sim">SIM</span>`:v==="nao"?`<span class="nao">NÃO</span>`:"";
function cell(c,col){
  const v = c[col.k];
  switch(col.k){
    case "etapa": { const e=etapaDe("carga",c); return `<span class="et et-${e}">${ETAPA_LBL[e]}</span>`; }
    case "carga": {
      const cat = catOf(c);
      return `<b>${esc(v)}</b>${cat!=="programada"&&!["extra","frigorifico"].includes(S.aba)?`<span class="cat cat-${cat}">${cat==="extra"?"Extra":"Frigo"}</span>`:""}${c.data!==S.data?`<span class="tag">${brData(c.data).slice(0,5)}</span>`:""}`;
    }
    case "nome": return `<div class="nome" title="${esc(v)}">${esc(v)}</div>`;
    case "pedidos": return fmtI(v);
    case "cubagem": return fmtN(v,2);
    case "peso": return fmtN(v,1);
    case "transpColeta": return `<div class="nome" style="max-width:160px" title="${esc(v)}">${esc(v)}</div>`;
    case "cubagemVeiculo": return fmtN(v,2);
    case "ocupacao": return fmtOcup(ocupacao(c));
    case "status": return v?esc(STATUS_LBL[v]):`<span class="muted">—</span>`;
    case "crono": return cronoCell("op", c);
    case "cronoFat": return cronoCell("fat", c);
    case "paletizado": case "sobrouEspaco": return simNao(v);
    case "obsOperacao": return v?`<div class="nome" style="max-width:140px" title="${esc(v)}">${esc(v)}</div>`:"";
    case "total": return fmtDur(tempos(c).total);
    default: return esc(v);
  }
}
function renderCargas(){
  const rows = filtradas();
  const sum = (k,r) => r.reduce((s,c)=>s+(Number(c[k])||0),0);
  let vazio;
  if (S.aba==="atraso") vazio = `${icone("party-popper")}Nenhuma carga em atraso. Tudo em dia!`;
  else if (!S.doDia.size && !S.pend.size) vazio = `${icone("calendar-x-2")}Nenhuma carga programada para ${brData(S.data)}.${isPlan()?" Use <b>Importar Korber</b> para carregar.":""}`;
  else vazio = `${icone("search-x")}Nenhuma carga com esses filtros.`;
  renderTable("carga", COLS, GRUPOS, rows, cell, vazio, (col,r)=>
    col.k==="carga"?`${r.length} cargas`:col.k==="pedidos"?fmtI(sum("pedidos",r)):col.k==="cubagem"?fmtN(sum("cubagem",r),2):col.k==="peso"?fmtN(sum("peso",r),1):"");
}

// paletizadas
const PCOLS = [
  {g:"ge",k:"etapa",l:"Etapa"},
  {g:"gp",k:"notas",l:"Notas",sep:1},{g:"gp",k:"clientes",l:"Clientes"},{g:"gp",k:"transportadora",l:"Transportadora"},{g:"gp",k:"obs",l:"Obs / Entrega"},
  {g:"gc",k:"chegada",l:"Chegada",sep:1},{g:"gc",k:"placa",l:"Placa"},
  {g:"go",k:"crono",l:"Cronômetro",sep:1},{g:"go",k:"inicio",l:"Início"},{g:"go",k:"termino",l:"Término"},{g:"go",k:"paletes",l:"Paletes"},{g:"go",k:"equipe",l:"Equipe"},{g:"go",k:"obsOp",l:"Obs"},
  {g:"gt",k:"total",l:"Tempo",sep:1},
];
const PGRUPOS = {gp:"Coleta paletizada",gc:"Fat. · Chegada",go:"Operação"};
function cellPal(p,col){
  const v = p[col.k];
  switch(col.k){
    case "etapa": { const e=etapaDe("pal",p); return `<span class="et et-${e}">${etapaLbl("pal",e)}</span>`; }
    case "notas": return `<div class="stack">${(p.notas||[]).map(n=>`<div><b>${esc(n.nota)}</b></div>`).join("")}${p.data!==S.data?`<span class="tag">${brData(p.data).slice(0,5)}</span>`:""}${p.origem==="logistica"?`<span class="tag" title="Veio do Logística Darnel (pedido ${esc(p.pedidoLogistica)})">Logística</span>`:""}</div>`;
    case "clientes": return `<div class="stack">${(p.notas||[]).map(n=>`<div>${esc(n.cliente)}</div>`).join("")}</div>`;
    case "obs": return `<div class="nome" style="max-width:240px" title="${esc(v)}">${esc(v)}</div>`;
    case "crono": return cronoCell("pal", p);
    case "total": return fmtDur(temposPal(p).total);
    default: return esc(v);
  }
}
function renderPal(){
  const rows = filtradasPal();
  const vazio = S.palDia.size||S.palPend.size ? `${icone("search-x")}Nenhuma coleta com esses filtros.`
    : `${icone("boxes")}Nenhuma coleta paletizada em ${brData(S.data)}.${podeCriarPal()?" Use <b>Nova coleta paletizada</b>.":""}`;
  renderTable("pal", PCOLS, PGRUPOS, rows, cellPal, vazio, (col,r)=>
    col.k==="notas"?`${r.reduce((s,p)=>s+(p.notas?.length||0),0)} notas`:col.k==="clientes"?`${r.length} coletas`:"");
}

function renderDatalists(){
  let el = $("#datalists"); if(!el){ el=document.createElement("div"); el.id="datalists"; document.body.appendChild(el); }
  const all = [...todasCargas(), ...todasPal()];
  const uniq = k => [...new Set(all.map(c=>c[k]).filter(Boolean))];
  const transp = [...new Set([...uniq("transportadora"),...uniq("transpColeta")])].sort();
  const resp = [...new Set([...uniq("responsavelFat"), S.perfil?.nome].filter(Boolean))];
  el.innerHTML = `<datalist id="dlTransp">${transp.map(v=>`<option value="${esc(v)}">`).join("")}</datalist>
    <datalist id="dlEquipe">${uniq("equipe").sort().map(v=>`<option value="${esc(v)}">`).join("")}</datalist>
    <datalist id="dlResp">${resp.map(v=>`<option value="${esc(v)}">`).join("")}</datalist>`;
}

