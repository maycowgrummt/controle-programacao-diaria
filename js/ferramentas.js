// exportar excel + limpar dia
"use strict";

// exportar
$("#btnExport").onclick = ()=>{
  const sn = v => v==="sim"?"SIM":v==="nao"?"NÃO":"";
  let data, nomeAba;
  if (ehPal()){
    const rows = filtradasPal();
    if (!rows.length) return toast("Nada para exportar.", true);
    nomeAba = "Paletizadas";
    data = rows.map(p=>{ const t=temposPal(p); return {
      "Data":brData(p.data), "Etapa":etapaLbl("pal",etapaDe("pal",p)),
      "Notas":(p.notas||[]).map(n=>n.nota).join(" / "), "Clientes":(p.notas||[]).map(n=>n.cliente).join(" / "),
      "Transportadora":p.transportadora||"", "Obs / Entrega":p.obs||"", "Chegada":p.chegada||"", "Placa":p.placa||"", "Motorista":p.motorista||"",
      "Início":p.inicio||"", "Término":p.termino||"", "Paletes":p.paletes||"", "Equipe":p.equipe||"", "Obs operação":p.obsOp||"",
      "Tempo carregamento":fmtDur(t.carreg), "Tempo total":fmtDur(t.total) };});
  } else {
    const rows = filtradas();
    if (!rows.length) return toast("Nada para exportar.", true);
    nomeAba = "Programação";
    data = rows.map(c=>{ const t=tempos(c); return {
      "Data":brData(c.data), "Tipo":CAT_LBL[catOf(c)], "Etapa":ETAPA_LBL[etapaDe("carga",c)], "Carga":c.carga, "Nome da carga":c.nome, "Doca":c.doca, "CIF/FOB":c.cifFob,
      "UF":c.uf||"", "Transportadora":c.transportadora||"", "Pedidos":c.pedidos||0, "Cubagem":c.cubagem||0, "Peso":c.peso||0, "Valor":c.valor||0,
      "Transp. que se apresentou":c.transpColeta||"", "Previsão chegada":c.previsaoChegada||"","Cubagem veículo":c.cubagemVeiculo??"", "Ocupação %":ocupacao(c)==null?"":Math.round(ocupacao(c)),
      "Chegada":c.chegada||"", "Placa":c.placa||"", "Motorista":c.motorista||"",
      "Status operação":c.status?STATUS_LBL[c.status]:"", "Início carreg.":c.inicioCarreg||"", "Fim carreg.":c.fimCarreg||"",
      "Paletizado":sn(c.paletizado), "Qtd paletes":c.qtdPaletes??"", "Equipe":c.equipe||"", "Sobrou espaço":sn(c.sobrouEspaco), "Espaço livre":c.espacoM3||"", "Obs operação":c.obsOperacao||"",
      "Início fat.":c.inicioFat||"", "Término fat.":c.fimFat||"", "Responsável fat.":c.responsavelFat||"", "Romaneio":c.romaneio||"", "Obs faturamento":c.obsFaturamento||"",
      "Espera p/ carregar":fmtDur(t.espera), "Tempo carregamento":fmtDur(t.carreg), "Tempo faturamento":fmtDur(t.fat), "Tempo total":fmtDur(t.total),
      "Obs planejamento":c.obsPlanejamento||"" };});
  }
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = Object.keys(data[0]).map(k=>({wch:Math.max(8, Math.min(40, Math.max(k.length+2, ...data.map(r=>String(r[k]).length+1))))}));
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, nomeAba);
  const sufixo = S.aba==="todas" ? "" : "_"+S.aba;
  XLSX.writeFile(wb, `programacao_${S.data}${sufixo}.xlsx`);
};

// limpar dia - so p/ testes
$("#btnLimpar").onclick = ()=>{
  if (S.perfil?.setor !== "admin") return;
  const cargas = [...S.doDia.values()];
  const korber = cargas.filter(c=>c.origem==="korber");
  const manuais = cargas.filter(c=>c.origem!=="korber");
  const pals = [...S.palDia.values()];
  const opc = (id, n, txt, marcado) => `<label class="chk" style="margin:6px 0"><input type="checkbox" id="${id}" ${marcado&&n?"checked":""} ${n?"":"disabled"}> ${txt} <b>(${n})</b></label><br>`;
  abrirModal(`${cabecalho("trash-2","Limpar dados de "+brData(S.data))}
  <div class="bd">
    <p style="margin-top:0">Apaga <b>definitivamente</b> os registros com data <b>${brData(S.data)}</b>, junto com o histórico de cada um. Cargas em atraso de outros dias <b>não</b> são afetadas.</p>
    ${opc("lmKorber", korber.length, "Cargas importadas do Korber", true)}
    ${opc("lmManual", manuais.length, "Cargas lançadas manualmente (extras, frigoríficos…)", false)}
    ${opc("lmPal", pals.length, "Coletas paletizadas", false)}
    <div style="margin-top:14px"><label>Para confirmar, digite <b>EXCLUIR</b></label><input id="lmConf" autocomplete="off" placeholder="EXCLUIR"></div>
  </div>
  <div class="ft"><span id="lmInfo" style="margin-right:auto;color:var(--texto-3)"></span><button class="btn" data-close>Cancelar</button><button class="btn danger" id="lmGo" disabled>${icone("trash-2")}Excluir</button></div>`, true);
  const atualizar = ()=>{
    const n = ($("#lmKorber").checked?korber.length:0) + ($("#lmManual").checked?manuais.length:0) + ($("#lmPal").checked?pals.length:0);
    $("#lmInfo").textContent = `${n} registro(s) selecionado(s)`;
    $("#lmGo").disabled = !n || $("#lmConf").value.trim().toUpperCase() !== "EXCLUIR";
  };
  ["#lmKorber","#lmManual","#lmPal","#lmConf"].forEach(s=>$(s).addEventListener("input", atualizar));
  atualizar();
  $("#lmGo").onclick = async ()=>{
    const alvos = [
      ...($("#lmKorber").checked ? korber.map(c=>["cargas",c.id]) : []),
      ...($("#lmManual").checked ? manuais.map(c=>["cargas",c.id]) : []),
      ...($("#lmPal").checked ? pals.map(p=>["paletizadas",p.id]) : []),
    ];
    const btn = $("#lmGo"); btn.disabled = true; btn.textContent = "Excluindo…";
    try{
      // batch tem limite de 500, uso 450
      const refs = [];
      for (const [col,id] of alvos){
        const ref = doc(db,col,id);
        const hist = await getDocs(collection(ref,"historico"));
        hist.forEach(h=>refs.push(h.ref));
        refs.push(ref);
      }
      for (let i=0; i<refs.length; i+=450){
        const b = writeBatch(db);
        refs.slice(i,i+450).forEach(r=>b.delete(r));
        await b.commit();
      }
      fecharModal(); fecharDrawer();
      toast(`${alvos.length} registro(s) de ${brData(S.data)} excluído(s).`);
    }catch(err){
      toast("Erro ao excluir: "+authMsg(err), true);
      btn.disabled = false; btn.innerHTML = `${icone("trash-2")}Excluir`;
    }
  };
};

