/* Janelas (modais) e cadastro manual de nova carga / nova coleta paletizada. */
"use strict";

/* ================= MODAIS ================= */
function abrirModal(html, sm=false){
  $("#modalRoot").innerHTML = `<div class="modal" id="mdBg"><div class="box ${sm?"sm":""}">${html}</div></div>`;
  $("#mdBg").addEventListener("mousedown", e=>{ if (e.target.id==="mdBg") fecharModal(); });
  $("#modalRoot").querySelectorAll("[data-close]").forEach(b=>b.onclick=fecharModal);
}
function fecharModal(){ $("#modalRoot").innerHTML=""; S.unsubUsers?.(); S.unsubUsers=null; }
const cabecalho = (ic, titulo) => `<div class="hd"><h2>${icone(ic)}${titulo}</h2><button class="btn-fechar" data-close title="Fechar">${icone("x")}</button></div>`;
const metaNovo = () => ({ criadoPor:S.perfil.nome, criadoPorUid:S.perfil.uid, criadoEm:serverTimestamp(),
  atualizadoPor:S.perfil.nome, atualizadoPorUid:S.perfil.uid, atualizadoEm:serverTimestamp() });
const histNovo = acao => ({em:serverTimestamp(), por:S.perfil.nome, uid:S.perfil.uid, setor:S.perfil.setor, acao, campos:{}});

/* ---------- Nova carga / nova coleta ---------- */
$("#btnNova").onclick = ()=> ehPal() ? novaColeta() : novaCarga();
function novaCarga(){
  const catPadrao = ["extra","frigorifico"].includes(S.aba) ? S.aba : "extra";
  abrirModal(`${cabecalho("package-plus","Nova carga")}
  <form id="nvForm"><div class="bd"><div class="row">
    <div><label>Tipo de carga *</label><select name="categoria">${CATEGORIAS.map(([k,l])=>`<option value="${k}" ${k===catPadrao?"selected":""}>${l}</option>`).join("")}</select></div>
    <div><label>Nº carga *</label><input name="carga" required></div>
    <div><label>Data *</label><input type="date" name="data" value="${S.data}" required></div>
  </div><div class="row" style="margin-top:12px">
    <div style="flex-basis:100%"><label>Nome da carga *</label><input name="nome" required></div>
  </div><div class="row" style="margin-top:12px">
    <div><label>Doca</label><input name="doca" style="text-transform:uppercase"></div>
    <div><label>CIF/FOB</label><select name="cifFob"><option>CIF</option><option>FOB</option></select></div>
    <div><label>UF</label><input name="uf" maxlength="2" style="text-transform:uppercase"></div>
  </div><div class="row" style="margin-top:12px">
    <div><label>Pedidos</label><input type="number" name="pedidos" step="1"></div>
    <div><label>Cubagem (m³)</label><input type="number" name="cubagem" step="any"></div>
    <div><label>Peso (kg)</label><input type="number" name="peso" step="any"></div>
  </div><div class="row" style="margin-top:12px">
    <div><label>Transportadora / Cliente</label><input name="transportadora" list="dlTransp"></div>
  </div></div>
  <div class="ft"><button type="button" class="btn" data-close>Cancelar</button><button class="btn primary">${icone("check")}Criar carga</button></div></form>`, true);
  $("#nvForm").addEventListener("submit", async e=>{
    e.preventDefault();
    const f = e.target.elements;
    const carga = f.carga.value.trim().replace(/\s+/g,"");
    const id = "c_"+carga.replace(/[^\w-]/g,"_");
    try{
      const ex = await getDoc(doc(db,"cargas",id));
      if (ex.exists()) return toast(`A carga ${carga} já existe (${brData(ex.data().data)}).`, true);
      const nome = f.nome.value.trim();
      const dados = {carga, categoria:f.categoria.value, data:f.data.value, nome, doca:f.doca.value.trim().toUpperCase(),
        cifFob:f.cifFob.value, uf:f.uf.value.trim().toUpperCase(),
        pedidos:f.pedidos.value?parseInt(f.pedidos.value):0, cubagem:f.cubagem.value?Number(f.cubagem.value):0, peso:f.peso.value?Number(f.peso.value):0,
        transportadora:f.transportadora.value.trim(), origem:"manual", etapa:"planejada", concluida:false, status:"", ...metaNovo()};
      const b = writeBatch(db);
      b.set(doc(db,"cargas",id), dados);
      b.set(doc(collection(db,"cargas",id,"historico")), histNovo(`criou a carga manualmente (${CAT_LBL[dados.categoria]})`));
      await b.commit(); fecharModal(); toast("Carga criada");
      if (dados.data !== S.data) setData(dados.data);
    }catch(err){ toast(authMsg(err), true); }
  });
}
function novaColeta(){
  abrirModal(`${cabecalho("boxes","Nova coleta paletizada")}
  <form id="pvForm"><div class="bd"><div class="row">
    <div style="flex:0 1 170px"><label>Data *</label><input type="date" name="data" value="${S.data}" required></div>
    <div><label>Transportadora *</label><input name="transportadora" list="dlTransp" required></div>
  </div><div class="row" style="margin-top:12px">
    <div style="flex-basis:100%"><label>Obs / Entrega (agendamento)</label><input name="obs" placeholder="ex.: ENTREGA 18/11 07:00 4542286"></div>
  </div>
  <div style="margin-top:14px"><label>Notas fiscais e clientes *</label>${notasEditorHTML([],false)}</div>
  </div>
  <div class="ft"><button type="button" class="btn" data-close>Cancelar</button><button class="btn primary">${icone("check")}Criar coleta</button></div></form>`, true);
  $("#pvForm").addEventListener("submit", async e=>{
    e.preventDefault();
    const f = e.target.elements;
    const notas = lerNotas(e.target.querySelector("[data-notas]"));
    if (!notas.length) return toast("Informe pelo menos uma nota.", true);
    try{
      const ref = doc(collection(db,"paletizadas"));
      const dados = {data:f.data.value, transportadora:f.transportadora.value.trim(), obs:f.obs.value.trim(), notas,
        etapa:"aguardando_veiculo", concluida:false, ...metaNovo()};
      const b = writeBatch(db);
      b.set(ref, dados);
      b.set(doc(collection(ref,"historico")), histNovo("criou a coleta paletizada"));
      await b.commit(); fecharModal(); toast("Coleta criada");
      if (dados.data !== S.data) setData(dados.data);
    }catch(err){ toast(authMsg(err), true); }
  });
}

