// importacao do excel do korber
"use strict";

// import
const MAP_CAMPOS = [
  {k:"carga",l:"Nº carga *",syn:["carga","n carga","no carga","numero carga","numero da carga","nr carga"]},
  {k:"nome",l:"Nome da carga *",syn:["comentarios","comentario","nome","nome da carga","descricao","observacao"]},
  {k:"doca",l:"Doca",syn:["porta","doca"]},
  {k:"cubagem",l:"Cubagem",syn:["cubagem","cubagem m3","m3","volume"]},
  {k:"pedidos",l:"Qtd. pedidos",syn:["pedidos","qtd pedidos","qtd de pedidos","quantidade pedidos"]},
  {k:"peso",l:"Peso",syn:["peso","peso kg","peso bruto","total peso"]},
  {k:"valor",l:"Valor",syn:["valor","valor total","r carga"]},
  {k:"cidade",l:"Cidade",syn:["cidade"]},
  {k:"estadoWms",l:"Status WMS",syn:["estado","status","situacao"]},
  {k:"osLogisfrete",l:"OS Logisfrete",syn:["os logisfrete","os"]},
  {k:"cifFob",l:"CIF/FOB",syn:["cif fob","cif","fob","tipo frete","modalidade frete"]},
  {k:"uf",l:"UF",syn:["uf"]},
  {k:"transportadora",l:"Transportadora",syn:["transportadora"]},
];
const IMP = {};
$("#btnImport").onclick = ()=>{
  abrirModal(`${cabecalho("file-up","Importar cargas do Korber One")}
  <div class="bd" id="impBd">
    <label class="drop" id="drop"><input type="file" id="impFile" accept=".xlsx,.xls,.csv" hidden>
      ${icone("cloud-upload")}<div><b>Arraste o Excel exportado do Korber aqui</b><br>ou clique para escolher o arquivo</div></label>
  </div>
  <div class="ft"><span id="impInfo" style="margin-right:auto;color:var(--texto-3)"></span><button class="btn" data-close>Cancelar</button><button class="btn primary" id="impGo" disabled>${icone("download")}Importar</button></div>`);
  const drop = $("#drop");
  $("#impFile").onchange = e=>e.target.files[0] && lerArquivo(e.target.files[0]);
  drop.addEventListener("dragover", e=>{ e.preventDefault(); drop.classList.add("over"); });
  drop.addEventListener("dragleave", ()=>drop.classList.remove("over"));
  drop.addEventListener("drop", e=>{ e.preventDefault(); drop.classList.remove("over"); e.dataTransfer.files[0] && lerArquivo(e.dataTransfer.files[0]); });
  $("#impGo").onclick = confirmarImport;
};
async function lerArquivo(file){
  try{
    const wb = XLSX.read(await file.arrayBuffer(), {type:"array"});
    const ws = wb.Sheets[wb.SheetNames[0]];
    const aoa = XLSX.utils.sheet_to_json(ws, {header:1, raw:true, defval:""});
    let best = {i:0,score:-1};
    aoa.slice(0,25).forEach((r,i)=>{
      const sc = r.filter(c=>MAP_CAMPOS.some(m=>m.syn.includes(norm(c)))).length;
      if (sc > best.score) best = {i,score:sc};
    });
    IMP.file = file.name; IMP.header = aoa[best.i].map(h=>String(h)); IMP.rows = aoa.slice(best.i+1);
    let salvo = {}; try { salvo = JSON.parse(localStorage.getItem("pd_map")||"{}"); } catch {}
    IMP.map = {};
    for (const m of MAP_CAMPOS){
      let idx = salvo[m.k] ? IMP.header.findIndex(h=>h===salvo[m.k]) : -1;
      if (idx<0) for (const s of m.syn){ idx = IMP.header.findIndex(h=>norm(h)===s); if (idx>=0) break; }
      IMP.map[m.k] = idx;
    }
    IMP.modoData = "comentario"; IMP.dataFixa = S.data; IMP.cif = {}; IMP.sel = null;
    IMP.categoria = ["extra","frigorifico"].includes(S.aba) ? S.aba : "programada";
    montarPreview();
  }catch(err){ toast("Não consegui ler o arquivo: "+err.message, true); }
}
function dataDoNome(nome){
  const m = String(nome).match(/^\s*(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (!m) return null;
  const y = m[3].length===2 ? "20"+m[3] : m[3];
  return `${y}-${pad(m[2])}-${pad(m[1])}`;
}
function linhasImport(){
  const g = (r,k) => IMP.map[k]>=0 ? r[IMP.map[k]] : "";
  const out = [], vistos = new Set();
  for (const r of IMP.rows){
    let carga = String(g(r,"carga")).trim().replace(/\.0+$/,"");
    if (!carga || vistos.has(carga)) continue;
    vistos.add(carga);
    const nome = String(g(r,"nome")).trim();
    const dt = IMP.modoData==="comentario" ? (dataDoNome(nome) || IMP.dataFixa) : IMP.dataFixa;
    let cif = String(g(r,"cifFob")).toUpperCase().trim();
    if (!["CIF","FOB"].includes(cif)) cif = /\bFOB\b/i.test(nome) ? "FOB" : "CIF";
    const doca = String(g(r,"doca")).trim().toUpperCase();
    const l = {carga, nome, data:dt, doca, cifFob:cif,
      cubagem:num(g(r,"cubagem")), pedidos:Math.round(num(g(r,"pedidos"))), peso:num(g(r,"peso")), valor:num(g(r,"valor")),
      cidade:String(g(r,"cidade")).trim(), estadoWms:String(g(r,"estadoWms")).trim(), osLogisfrete:String(g(r,"osLogisfrete")).trim(),
      uf:String(g(r,"uf")).trim().toUpperCase(), transportadora:String(g(r,"transportadora")).trim()};
    l.id = "c_"+carga.replace(/[^\w-]/g,"_");
    l.avisos = [!doca&&"sem doca", !l.peso&&"sem peso", !l.pedidos&&"0 pedidos"].filter(Boolean);
    out.push(l);
  }
  return out;
}
function montarPreview(){
  const linhas = linhasImport();
  IMP.linhas = linhas; if (!IMP.sel) IMP.sel = new Set(linhas.map(l=>l.id));
  const opts = i => `<option value="-1">(não usar)</option>`+IMP.header.map((h,j)=>`<option value="${j}" ${i===j?"selected":""}>${esc(h||"(coluna "+(j+1)+")")}</option>`).join("");
  const datas = [...new Set(linhas.map(l=>l.data))].sort();
  $("#impBd").innerHTML = `
    <div style="margin-bottom:10px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">${icone("file-spreadsheet",'style="color:var(--s-plan)"')}<b>${esc(IMP.file)}</b> · ${linhas.length} cargas encontradas
      ${datas.length?` · datas: ${datas.map(brData).join(", ")}`:""}
      <button class="link" id="impOutro">trocar arquivo</button></div>
    <div class="row">
      <div><label>Data da programação</label>
        <select id="impModo"><option value="comentario" ${IMP.modoData==="comentario"?"selected":""}>Usar a data do início do comentário (ex.: 17/11/26)</option>
        <option value="fixa" ${IMP.modoData==="fixa"?"selected":""}>Usar a mesma data para todas</option></select></div>
      <div style="flex:0 1 180px"><label>Data fixa / quando não houver</label><input type="date" id="impData" value="${IMP.dataFixa}"></div>
      <div style="flex:0 1 200px"><label>Importar como</label><select id="impCat">${CATEGORIAS.map(([k,l])=>`<option value="${k}" ${IMP.categoria===k?"selected":""}>${l}</option>`).join("")}</select></div>
    </div>
    <details ${IMP.map.carga<0||IMP.map.nome<0?"open":""}><summary>Ajustar colunas do arquivo</summary>
      <div class="mapgrid">${MAP_CAMPOS.map(m=>`<div><label>${m.l}</label><select data-map="${m.k}">${opts(IMP.map[m.k])}</select></div>`).join("")}</div>
    </details>
    ${IMP.map.carga<0?`<p class="warn">Escolha qual coluna é o <b>Nº da carga</b>.</p>`:""}
    <div class="prev"><table><thead><tr><th><input type="checkbox" id="impAll" ${IMP.sel.size===linhas.length?"checked":""}></th><th>Situação</th><th>Data</th><th>Carga</th><th>Nome</th><th>Doca</th><th>CIF/FOB</th><th>Ped.</th><th>Cubagem</th><th>Peso</th><th>Valor</th><th>WMS</th><th>Avisos</th></tr></thead>
    <tbody>${linhas.map(l=>{ const ex=getItem("carga",l.id); const cif = IMP.cif[l.id]||l.cifFob; return `<tr>
      <td><input type="checkbox" data-sel="${esc(l.id)}" ${IMP.sel.has(l.id)?"checked":""}></td>
      <td>${ex?`<span class="st-upd">Atualizar</span>`:`<span class="st-nova">Nova</span>`}</td>
      <td>${brData(l.data)}</td><td><b>${esc(l.carga)}</b></td><td>${esc(l.nome)}</td><td>${esc(l.doca)}</td>
      <td><select data-cif="${esc(l.id)}"><option ${cif==="CIF"?"selected":""}>CIF</option><option ${cif==="FOB"?"selected":""}>FOB</option></select></td>
      <td>${fmtI(l.pedidos)}</td><td>${fmtN(l.cubagem)}</td><td>${fmtN(l.peso,1)}</td><td>${l.valor?fmtN(l.valor):""}</td><td>${esc(l.estadoWms)}</td>
      <td class="warn">${l.avisos.join(", ")}</td></tr>`;}).join("")}</tbody></table></div>
    <p style="font-size:12px;color:var(--texto-3);margin:10px 0 0">Cargas que já existem no app têm os dados do WMS atualizados (peso, cubagem, pedidos, doca, nome…); o tipo de carga e o que Transporte, Faturamento e Operação preencheram <b>não são alterados</b>.</p>`;
  $("#impOutro").onclick = ()=>$("#btnImport").click();
  $("#impModo").onchange = e=>{ IMP.modoData = e.target.value; montarPreview(); };
  $("#impData").onchange = e=>{ IMP.dataFixa = e.target.value || S.data; montarPreview(); };
  $("#impCat").onchange = e=>{ IMP.categoria = e.target.value; };
  document.querySelectorAll("[data-map]").forEach(s=>s.onchange = e=>{
    IMP.map[s.dataset.map] = parseInt(e.target.value,10);
    try { const m = {}; for (const k in IMP.map) if (IMP.map[k]>=0) m[k]=IMP.header[IMP.map[k]]; localStorage.setItem("pd_map", JSON.stringify(m)); } catch {}
    IMP.sel = null; montarPreview();
  });
  document.querySelectorAll("[data-sel]").forEach(c=>c.onchange = e=>{ e.target.checked ? IMP.sel.add(c.dataset.sel) : IMP.sel.delete(c.dataset.sel); infoImport(); });
  document.querySelectorAll("[data-cif]").forEach(c=>c.onchange = e=>{ IMP.cif[c.dataset.cif] = e.target.value; });
  $("#impAll").onchange = e=>{ IMP.sel = e.target.checked ? new Set(linhas.map(l=>l.id)) : new Set(); montarPreview(); };
  infoImport();
}
function infoImport(){
  const n = IMP.linhas.filter(l=>IMP.sel.has(l.id)).length;
  $("#impInfo").textContent = `${n} de ${IMP.linhas.length} selecionadas`;
  $("#impGo").disabled = !n || IMP.map.carga<0;
}
async function confirmarImport(){
  const sel = IMP.linhas.filter(l=>IMP.sel.has(l.id));
  const btn = $("#impGo"); btn.disabled = true; btn.textContent = "Importando…";
  let novas=0, atual=0;
  try{
    const existentes = new Map();
    await Promise.all(sel.map(async l=>{ const s = await getDoc(doc(db,"cargas",l.id)); if (s.exists()) existentes.set(l.id, s.data()); }));
    for (let i=0; i<sel.length; i+=200){
      const b = writeBatch(db);
      for (const l of sel.slice(i,i+200)){
        const ref = doc(db,"cargas",l.id);
        const wms = {carga:l.carga, nome:l.nome, data:l.data, doca:l.doca, cubagem:l.cubagem, pedidos:l.pedidos, peso:l.peso, valor:l.valor,
          cidade:l.cidade, estadoWms:l.estadoWms, osLogisfrete:l.osLogisfrete, cifFob:IMP.cif[l.id]||l.cifFob};
        const ex = existentes.get(l.id);
        if (ex){
          if (ex.cifFob && !IMP.cif[l.id]) delete wms.cifFob;
          const upd = {}; for (const [k,v] of Object.entries(wms)) if ((ex[k]??"")!==(v??"")) upd[k]=v;
          if (l.uf && !ex.uf) upd.uf = l.uf;
          if (l.transportadora && !ex.transportadora) upd.transportadora = l.transportadora;
          if (!Object.keys(upd).length) continue;
          b.update(ref, {...upd, atualizadoPor:S.perfil.nome, atualizadoPorUid:S.perfil.uid, atualizadoEm:serverTimestamp()});
          b.set(doc(collection(ref,"historico")), {...histNovo(`atualizou pela importação (${IMP.file})`), campos:upd});
          atual++;
        } else {
          b.set(ref, {...wms, uf:l.uf, transportadora:l.transportadora, categoria:IMP.categoria, origem:"korber",
            etapa:"planejada", concluida:false, status:"", ...metaNovo()});
          b.set(doc(collection(ref,"historico")), histNovo(`importou do Korber (${IMP.file})`));
          novas++;
        }
      }
      await b.commit();
    }
    fecharModal();
    toast(`Importação concluída: ${novas} novas, ${atual} atualizadas.`);
    const datas = [...new Set(sel.map(l=>l.data))];
    if (datas.length===1 && datas[0]!==S.data) setData(datas[0]);
  }catch(err){
    toast("Erro na importação: "+authMsg(err), true); btn.disabled=false; btn.textContent="Importar";
  }
}

