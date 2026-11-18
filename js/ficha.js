/* Ficha lateral da carga/coleta: seções por setor, salvar, histórico, excluir. */
"use strict";

/* ================= DRAWER ================= */
function getItem(tipo, id){
  return tipo==="pal" ? (S.palDia.get(id) || S.palPend.get(id)) : (S.doDia.get(id) || S.pend.get(id));
}
function abrirDrawer(tipo, id){
  S.aberta = {tipo, id};
  S.unsubHist?.();
  S.hist = [];
  S.unsubHist = onSnapshot(query(collection(db,TIPOS[tipo].col,id,"historico"), orderBy("em","desc"), limit(40)), snap=>{
    S.hist = snap.docs.map(d=>d.data()); renderHist();
  }, ()=>{});
  renderDrawer();
}
function fecharDrawer(){ S.aberta=null; S.unsubHist?.(); S.unsubHist=null; $("#drawerRoot").innerHTML=""; }
function atualizarDrawer(){
  if (!S.aberta) return;
  const {tipo,id} = S.aberta;
  const c = getItem(tipo,id); if (!c) return;
  for (const sec of TIPOS[tipo].secoes){
    const el = document.querySelector(`.drawer .sec[data-sec="${sec.id}"]`);
    if (el && !el.dataset.dirty) el.outerHTML = secHTML(tipo, sec, c);
  }
  const hd = $(".drawer header"); if (hd) hd.className = "r-"+etapaDe(tipo,c);
  const h = $("#drHead"); if (h) h.innerHTML = headHTML(tipo,c);
  const st = $("#drSteps"); if (st) st.innerHTML = stepsHTML(tipo,c);
  const du = $("#drDurs"); if (du) du.innerHTML = dursHTML(tipo,c);
  document.querySelectorAll(".drawer [data-crono-slot]").forEach(el=>el.innerHTML = cronoBoxHTML(el.dataset.cronoSlot, c));
  bindSecs();
}
function headHTML(tipo, c){
  const e = etapaDe(tipo,c);
  if (tipo==="pal"){
    return `<h2>${icone("boxes")}Coleta paletizada · ${esc(c.transportadora||"sem transportadora")} <span class="et et-${e}">${etapaLbl("pal",e)}</span></h2>
      <div class="meta">${(c.notas||[]).length} nota(s) · ${brData(c.data)}${c.obs?" · "+esc(c.obs):""}</div>`;
  }
  const cat = catOf(c);
  return `<h2>${icone("truck")}Carga ${esc(c.carga)} <span class="et et-${e}">${ETAPA_LBL[e]}</span>${cat!=="programada"?`<span class="cat cat-${cat}">${CAT_LBL[cat]}</span>`:""}</h2>
    <div class="meta">${esc(c.nome)} · ${esc(c.doca||"sem doca")} · ${esc(c.cifFob||"")} · ${brData(c.data)}${c.cidade?" · "+esc(c.cidade):""}${c.estadoWms?" · WMS: "+esc(c.estadoWms):""}</div>`;
}
function stepsHTML(tipo, c){
  const e = etapaDe(tipo,c);
  if (tipo==="pal"){
    const passos = ["Cadastrada","Chegada","Carregando","Finalizada"];
    const ord = {aguardando_veiculo:0,patio:1,carregando:2,concluida:3}[e];
    return passos.map((l,i)=>`<span class="${i<ord||e==="concluida"?"done":i===ord?"cur":""}">${l}</span>`).join("");
  }
  const passos = ["Planejado","Chegada","Carregamento","Carregado","Faturamento","Concluída"];
  const ord = {planejada:0,patio:1,aguardando_veiculo:2,na_doca:2,carregando:2,aguardando_fat:3,faturando:4,concluida:5}[e];
  return passos.map((l,i)=>`<span class="${i<ord||e==="concluida"?"done":i===ord?"cur":""}">${l}</span>`).join("");
}
function dursHTML(tipo, c){
  if (tipo==="pal"){
    const t = temposPal(c);
    return `<div>Espera p/ carregar<b>${fmtDur(t.espera)||"—"}</b></div><div>Carregamento<b>${fmtDur(t.carreg)||"—"}</b></div><div>Tempo total<b>${fmtDur(t.total)||"—"}</b></div>`;
  }
  const t = tempos(c);
  return `<div>Espera p/ carregar<b>${fmtDur(t.espera)||"—"}</b></div><div>Carregamento<b>${fmtDur(t.carreg)||"—"}</b></div>
    <div>Faturamento<b>${fmtDur(t.fat)||"—"}</b></div><div>Tempo total<b>${fmtDur(t.total)||"—"}</b></div>
    <div>Ocupação do veículo<b>${fmtOcup(ocupacao(c))||"—"}</b></div>`;
}
function notaRowHTML(n, dis){
  const d = dis ? "disabled" : "";
  return `<div class="nota-row"><input class="n-nota" placeholder="Nota fiscal" value="${esc(n.nota)}" ${d}><input class="n-cli" placeholder="Cliente" value="${esc(n.cliente)}" style="text-transform:uppercase" ${d}>${dis?"":`<button type="button" class="btn sm danger rm-nota" title="Remover nota">${icone("x")}</button>`}</div>`;
}
function notasEditorHTML(notas, dis){
  const list = notas?.length ? notas : (dis ? [] : [{nota:"",cliente:""}]);
  return `<div data-notas>${list.map(n=>notaRowHTML(n,dis)).join("")||`<span class="muted">Nenhuma nota.</span>`}</div>${dis?"":`<button type="button" class="btn sm secondary add-nota">${icone("plus")}Adicionar nota</button>`}`;
}
function lerNotas(root){
  return [...root.querySelectorAll(".nota-row")].map(r=>({nota:r.querySelector(".n-nota").value.trim(), cliente:r.querySelector(".n-cli").value.trim().toUpperCase()})).filter(n=>n.nota||n.cliente);
}
function inputHTML(f, v, dis){
  const d = dis ? "disabled" : "";
  const name = `name="${f.k}"`;
  if (v==null || v==="") v = f.def ?? v;
  if (f.t==="notas") return notasEditorHTML(v, dis);
  if (f.t==="select") return `<select ${name} ${d}>${f.o.map(([k,l])=>`<option value="${k}" ${String(v??"")===k?"selected":""}>${l}</option>`).join("")}</select>`;
  if (f.t==="textarea") return `<textarea ${name} rows="2" ${d}>${esc(v)}</textarea>`;
  if (f.t==="time") return `<div class="timefield"><input type="time" ${name} value="${esc(v)}" ${d}>${dis?"":`<button type="button" class="btn sm now" data-k="${f.k}" title="Preencher com a hora atual">${icone("clock")}Agora</button>`}</div>`;
  if (f.t==="date") return `<input type="date" ${name} value="${esc(v)}" ${d}>`;
  if (f.t==="num"||f.t==="int") return `<input type="number" step="${f.t==="int"?1:"any"}" ${name} value="${v??""}" ${d}>`;
  return `<input type="text" ${name} value="${esc(v)}" ${f.list?`list="${f.list}"`:""} ${f.up?`style="text-transform:uppercase"`:""} ${d}>`;
}
function secHTML(tipo, sec, c){
  const ok = pode(sec);
  const del = sec.del && TIPOS[tipo].podeExcluir();
  return `<form class="sec ${sec.cls}" data-sec="${sec.id}">
    <h3>${icone(sec.icon)}${sec.titulo}<span class="lock">${ok?"":icone("lock")+"somente leitura"}</span></h3>
    ${CRONO_DA_SECAO[sec.id] ? `<div class="crono-slot" data-crono-slot="${CRONO_DA_SECAO[sec.id]}">${cronoBoxHTML(CRONO_DA_SECAO[sec.id], c)}</div>` : ""}
    <div class="fields">${sec.campos.map(f=>`<div class="f ${f.w===3?"w3":f.w===2?"w2":""}"><label>${f.l}</label>${inputHTML(f,c[f.k],!ok)}</div>`).join("")}</div>
    ${ok?`<div class="actions">${del?`<button type="button" class="btn danger del">${icone("trash-2")}Excluir</button><span class="spacer"></span>`:""}<button type="submit" class="btn primary">${icone("save")}Salvar ${sec.btn}</button></div>`:""}
  </form>`;
}
function renderDrawer(){
  const {tipo,id} = S.aberta;
  const c = getItem(tipo,id); if (!c) return;
  $("#drawerRoot").innerHTML = `<div class="overlay" id="drOv"></div>
  <aside class="drawer" role="dialog">
    <header class="r-${etapaDe(tipo,c)}"><div style="flex:1" id="drHead">${headHTML(tipo,c)}</div><button class="btn-fechar" id="drClose" title="Fechar (Esc)">${icone("x")}</button></header>
    <div class="body">
      <div class="steps" id="drSteps">${stepsHTML(tipo,c)}</div>
      <div class="durs" id="drDurs">${dursHTML(tipo,c)}</div>
      ${TIPOS[tipo].secoes.map(s=>secHTML(tipo,s,c)).join("")}
      <div class="sec hist"><h3>${icone("history")}Histórico de alterações</h3><ul id="drHist"><li class="when">Carregando…</li></ul></div>
    </div>
  </aside>`;
  $("#drOv").onclick = fecharDrawer; $("#drClose").onclick = fecharDrawer;
  bindSecs(); renderHist();
}
function renderHist(){
  const el = $("#drHist"); if (!el) return;
  if (!S.hist.length){ el.innerHTML = `<li class="when">Sem registros.</li>`; return; }
  el.innerHTML = S.hist.map(h=>{
    const quando = h.em?.toDate ? h.em.toDate().toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}) : "agora";
    const campos = Object.entries(h.campos||{}).map(([k,v])=>`${esc(CAMPO[k]?.l||k)}: <b>${esc(fmtVal(k,v))||"(vazio)"}</b>`).join(" · ");
    return `<li><span class="when">${quando}</span> — <b>${esc(h.por)}</b> (${esc(SETORES[h.setor]||h.setor)}) ${esc(h.acao)}${campos?`<br>${campos}`:""}</li>`;
  }).join("");
}
function fmtVal(k,v){
  const f = CAMPO[k]; if (!f) return v;
  if (f.t==="notas") return fmtNotas(v);
  if (f.t==="select") return (f.o.find(o=>o[0]===v)||[,v])[1];
  if (f.t==="date") return brData(v);
  return v;
}
// adicionar/remover linhas de nota (drawer e modal)
document.addEventListener("click", e=>{
  const add = e.target.closest(".add-nota");
  if (add){
    const ed = add.previousElementSibling;
    ed.querySelector(".muted")?.remove();
    ed.insertAdjacentHTML("beforeend", notaRowHTML({nota:"",cliente:""}, false));
    ed.lastElementChild.querySelector("input").focus();
    const f = add.closest("form"); if (f) f.dataset.dirty = 1;
  }
  const rm = e.target.closest(".rm-nota");
  if (rm){ const f = rm.closest("form"); rm.closest(".nota-row").remove(); if (f) f.dataset.dirty = 1; }
});
function bindSecs(){
  document.querySelectorAll(".drawer .sec[data-sec]").forEach(form=>{
    if (form.dataset.bound) return; form.dataset.bound = 1;
    form.addEventListener("input", ()=>form.dataset.dirty = 1);
    form.addEventListener("click", e=>{
      const b = e.target.closest(".now");
      if (b){ form.elements[b.dataset.k].value = agoraHM(); form.dataset.dirty=1; autoPreencher(form, b.dataset.k); }
      if (e.target.closest(".del")) excluirItem(S.aberta.tipo, S.aberta.id);
    });
    form.addEventListener("change", e=>{ if (e.target.type==="time") autoPreencher(form, e.target.name); });
    form.addEventListener("submit", e=>{ e.preventDefault(); salvarSecao(form); });
  });
}
function autoPreencher(form, k){
  const el = form.elements;
  if (form.dataset.sec==="operacao"){
    if (k==="inicioCarreg" && el.inicioCarreg.value && (!el.status.value || el.status.value==="na_doca" || el.status.value==="aguardando_veiculo")) el.status.value = "carregando";
    if (k==="fimCarreg" && el.fimCarreg.value) el.status.value = "finalizado";
  }
  if (form.dataset.sec==="faturamento" && k==="inicioFat" && !el.responsavelFat.value) el.responsavelFat.value = S.perfil.nome;
}
function lerForm(form, sec){
  const out = {};
  for (const f of sec.campos){
    if (f.t==="notas"){ out[f.k] = lerNotas(form.querySelector("[data-notas]")); continue; }
    let v = form.elements[f.k].value;
    if (f.t==="num") v = v===""?null:Number(v);
    else if (f.t==="int") v = v===""?null:parseInt(v,10);
    else { v = v.trim(); if (f.up) v = v.toUpperCase(); }
    out[f.k] = v;
  }
  return out;
}
const igual = (a,b) => JSON.stringify(a ?? "") === JSON.stringify(b ?? "");
async function salvarSecao(form){
  const {tipo,id} = S.aberta;
  const T = TIPOS[tipo];
  const sec = T.secoes.find(s=>s.id===form.dataset.sec);
  const c = getItem(tipo,id); if (!c) return;
  const novo = lerForm(form, sec);
  if (sec.id==="operacao" && novo.fimCarreg && !novo.inicioCarreg) return toast("Informe o início do carregamento.", true);
  if (sec.id==="faturamento" && novo.fimFat && !novo.inicioFat) return toast("Informe o início do faturamento.", true);
  if (sec.id==="pop" && novo.termino && !novo.inicio) return toast("Informe o início do carregamento.", true);
  if ((sec.id==="plan" || sec.id==="pcad") && !novo.data) return toast("Informe a data.", true);
  if (sec.id==="pcad" && !novo.notas.length) return toast("Informe pelo menos uma nota.", true);
  const diff = {};
  for (const [k,v] of Object.entries(novo)){
    const atual = c[k] ?? CAMPO[k]?.def ?? "";
    if (!igual(atual, v)) diff[k] = v;
  }
  if (!Object.keys(diff).length){ delete form.dataset.dirty; return toast("Nada para salvar."); }
  const etapa = T.etapa({...c, ...diff});
  const upd = {...diff, etapa, concluida: etapa==="concluida",
    atualizadoPor:S.perfil.nome, atualizadoPorUid:S.perfil.uid, atualizadoEm:serverTimestamp()};
  const ref = doc(db,T.col,c.id);
  const b = writeBatch(db);
  b.update(ref, upd);
  b.set(doc(collection(ref,"historico")), {em:serverTimestamp(), por:S.perfil.nome, uid:S.perfil.uid, setor:S.perfil.setor, acao:`salvou ${sec.titulo}`, campos:diff});
  const btn = form.querySelector("button[type=submit]"); btn.disabled = true;
  try {
    await b.commit(); delete form.dataset.dirty; toast("Salvo com sucesso");
    if (diff.data && diff.data!==S.data) toast(`Movido para ${brData(diff.data)}.`);
  }
  catch(err){ toast("Não foi possível salvar: "+authMsg(err), true); }
  finally { btn.disabled = false; atualizarDrawer(); }
}
async function excluirItem(tipo, id){
  const c = getItem(tipo,id); if (!c) return;
  const desc = tipo==="pal" ? `a coleta paletizada (${fmtNotas(c.notas)})` : `a carga ${c.carga} (${c.nome})`;
  if (!confirm(`Excluir ${desc}? Essa ação não pode ser desfeita.`)) return;
  try { await deleteDoc(doc(db,TIPOS[tipo].col,id)); fecharDrawer(); toast("Excluído."); }
  catch(err){ toast(authMsg(err), true); }
}
document.addEventListener("keydown", e=>{ if (e.key==="Escape"){ if ($("#modalRoot").innerHTML) fecharModal(); else fecharDrawer(); } });

