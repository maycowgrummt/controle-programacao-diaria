// cronometros start/stop (operacao e faturamento) - sem pausa
"use strict";

// campo onde salva, campos de inicio/fim e secao da ficha
const CRONOS = {
  op:  {tipo:"carga", campo:"crono",    ini:"inicioCarreg", fim:"fimCarreg", sec:"operacao",    nome:"carregamento", acaoIni:"Carregando",  acaoFim:"Carregamento finalizado"},
  fat: {tipo:"carga", campo:"cronoFat", ini:"inicioFat",    fim:"fimFat",    sec:"faturamento", nome:"faturamento",  acaoIni:"Faturando",   acaoFim:"Faturamento finalizado"},
  pal: {tipo:"pal",   campo:"crono",    ini:"inicio",       fim:"termino",   sec:"pop",         nome:"carregamento", acaoIni:"Carregando",  acaoFim:"Carregamento finalizado"},
};
// secao -> cronometro
const CRONO_DA_SECAO = { operacao:"op", faturamento:"fat", pop:"pal" };
const cronoDe = (k, c) => c[CRONOS[k].campo];
const cronoMs = (k, c) => { const x = cronoDe(k,c); if (!x) return 0; return (x.acum||0) + (x.estado==="rodando" ? Math.max(0, Date.now()-(x.desde||Date.now())) : 0); };
const fmtCrono = ms => { const s=Math.floor(ms/1000); return `${pad(Math.floor(s/3600))}:${pad(Math.floor(s/60)%60)}:${pad(s%60)}`; };
function cronoEstado(k, c){ return cronoDe(k,c)?.estado || (c[CRONOS[k].fim] ? "manual" : "novo"); }
function podeCrono(k){ const F = CRONOS[k]; return pode(TIPOS[F.tipo].secoes.find(s=>s.id===F.sec)); }
function cronoBotoes(k, c, mini){
  const est = cronoEstado(k,c);
  if (!podeCrono(k) || est==="parado" || est==="manual") return "";
  const b = (acao, cls, ic, txt) => `<button type="button" class="btn ${mini?"sm ":""}${cls} crono-btn" data-acao="${acao}" data-k="${k}" data-id="${esc(c.id)}" title="${txt}">${icone(ic)}${mini?"":txt}</button>`;
  // "pausado" = cargas antigas, de quando tinha pausa
  if (est==="novo") return b("start","success","play","START");
  return (est==="pausado" ? b("start","success","play","RETOMAR") : "") + b("stop","parar","square","STOP");
}
function cronoCell(k, c){
  const est = cronoEstado(k,c);
  if (est==="manual") return `<span class="muted" title="Horários lançados manualmente">manual</span>`;
  const btns = cronoBotoes(k,c,true);
  if (est==="novo" && !btns) return `<span class="muted">—</span>`;
  return `<div class="crono est-${est}">${est==="novo"?"":`<span class="crono-tempo" data-crono="${k}|${esc(c.id)}">${fmtCrono(cronoMs(k,c))}</span>`}${btns}</div>`;
}
function cronoBoxHTML(k, c){
  const F = CRONOS[k], est = cronoEstado(k,c);
  const lbl = {novo:"Cronômetro · aguardando início", rodando:`${F.acaoIni} · cronômetro rodando`, pausado:"Cronômetro parado",
               parado:F.acaoFim, manual:"Horários lançados manualmente"}[est];
  const sub = [];
  if (c[F.ini]) sub.push(`Início ${esc(c[F.ini])}`);
  if (c[F.fim]) sub.push(`Fim ${esc(c[F.fim])}`);
  if (est==="novo" && podeCrono(k)) sub.push(`Clique em START quando o ${F.nome} começar.`);
  if (est==="manual") sub.push("Para usar o cronômetro, limpe os horários de início e fim.");
  const tempo = est==="manual" ? (fmtDur(mins(c[F.ini], c[F.fim])) || "—") : fmtCrono(cronoMs(k,c));
  return `<div class="crono-box est-${est}">
    <div class="crono-info"><div class="lbl">${icone("timer")}${lbl}</div>
      <div class="crono-tempo" ${est==="manual"?"":`data-crono="${k}|${esc(c.id)}"`}>${tempo}</div>
      <div class="sub">${sub.join(" · ")}</div></div>
    <div class="crono-acoes">${cronoBotoes(k,c,false)}</div>
  </div>`;
}
// tick 1s
setInterval(()=>{
  document.querySelectorAll("[data-crono]").forEach(el=>{
    const [k,id] = el.dataset.crono.split("|"); const c = getItem(CRONOS[k].tipo, id);
    if (c && cronoDe(k,c)?.estado==="rodando") el.textContent = fmtCrono(cronoMs(k,c));
  });
}, 1000);
async function cronoAcao(k, id, acao){
  const F = CRONOS[k], tipo = F.tipo;
  const c = getItem(tipo,id); if (!c) return;
  const T = TIPOS[tipo];
  const x = cronoDe(k,c) || {estado:"novo", acum:0};
  const agora = Date.now(), corrido = x.estado==="rodando" ? Math.max(0, agora-(x.desde||agora)) : 0;
  const diff = {}; let crono, txt;
  if (acao==="start"){
    if (!["novo","pausado"].includes(x.estado)) return;
    crono = {estado:"rodando", desde:agora, acum:x.acum||0, inicioMs:x.inicioMs||agora};
    if (!c[F.ini]) diff[F.ini] = agoraHM();
    if (k==="op" && c.status!=="carregando") diff.status = "carregando";
    if (k==="fat" && !c.responsavelFat) diff.responsavelFat = S.perfil.nome;
    txt = `iniciou o ${F.nome} (cronômetro)`;
  } else if (acao==="stop"){
    if (!["rodando","pausado"].includes(x.estado)) return;
    if (!confirm(`Finalizar o ${F.nome}? O cronômetro será encerrado e o horário de fim preenchido.`)) return;
    crono = {...x, estado:"parado", desde:null, acum:(x.acum||0)+corrido, fimMs:agora};
    diff[F.fim] = agoraHM();
    if (k==="op") diff.status = "finalizado";
    txt = `finalizou o ${F.nome} · tempo ${fmtCrono(crono.acum)}`;
  } else return;
  const etapa = T.etapa({...c, ...diff});
  const ref = doc(db,T.col,c.id);
  const b = writeBatch(db);
  b.update(ref, {...diff, [F.campo]:crono, etapa, concluida: etapa==="concluida",
    atualizadoPor:S.perfil.nome, atualizadoPorUid:S.perfil.uid, atualizadoEm:serverTimestamp()});
  b.set(doc(collection(ref,"historico")), {em:serverTimestamp(), por:S.perfil.nome, uid:S.perfil.uid, setor:S.perfil.setor, acao:txt, campos:diff});
  const meus = () => document.querySelectorAll(`.crono-btn[data-k="${k}"][data-id="${CSS.escape(id)}"]`);
  meus().forEach(el=>el.disabled=true);
  try {
    await b.commit();
    // form com edicao pendente: so atualiza os horarios
    const form = document.querySelector(`.drawer .sec[data-sec="${F.sec}"][data-dirty]`);
    if (form) for (const [kk,v] of Object.entries(diff)) if (form.elements[kk]) form.elements[kk].value = v;
    toast(acao==="start" ? "Cronômetro iniciado" : `${F.acaoFim} · ${fmtCrono(crono.acum)}`);
  } catch(err){
    toast("Não foi possível atualizar o cronômetro: "+authMsg(err), true);
    meus().forEach(el=>el.disabled=false);
  }
}
document.addEventListener("click", e=>{
  const b = e.target.closest(".crono-btn");
  if (b) cronoAcao(b.dataset.k, b.dataset.id, b.dataset.acao);
});
