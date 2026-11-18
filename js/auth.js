/* Estado do sistema (dados em memória) e login / primeiro administrador. */
"use strict";

/* ================= ESTADO ================= */
const S = {
  user:null, perfil:null, data:hojeISO(), aba:"todas",
  doDia:new Map(), pend:new Map(), palDia:new Map(), palPend:new Map(),
  unsub:[], unsubDia:[], unsubUsers:null, usuarios:[],
  sort:{k:"doca",dir:1}, aberta:null, unsubHist:null, hist:[],
};
const pode = sec => !!S.perfil && sec.roles.includes(S.perfil.setor);
const isPlan = () => ["admin","planejamento"].includes(S.perfil?.setor);
const podeCriarPal = () => ["admin","planejamento","faturamento"].includes(S.perfil?.setor);

/* ================= AUTH ================= */
async function checaSetup(){
  try { const s = await getDoc(doc(db,"config","setup")); $("#setupLinkWrap").classList.toggle("hidden", s.exists()); }
  catch(err) {
    $("#setupLinkWrap").classList.remove("hidden");
    if (String(err?.code).includes("permission")) $("#lgErr").textContent = "Publique as regras do Firestore (arquivo firestore.rules) antes do primeiro acesso.";
  }
}
$("#loginForm").addEventListener("submit", async e=>{
  e.preventDefault(); $("#lgErr").textContent="";
  const btn = e.target.querySelector("button[type=submit]"); btn.disabled = true;
  try { await signInWithEmailAndPassword(auth, toEmail($("#lgUser").value), $("#lgPass").value); }
  catch(err){ $("#lgErr").textContent = authMsg(err); }
  finally { btn.disabled = false; }
});
$("#setupLink").onclick = ()=>{ $("#loginForm").classList.add("hidden"); $("#setupForm").classList.remove("hidden"); };
$("#setupBack").onclick = ()=>{ $("#setupForm").classList.add("hidden"); $("#loginForm").classList.remove("hidden"); };
$("#setupForm").addEventListener("submit", async e=>{
  e.preventDefault(); $("#suErr").textContent="";
  const nome=$("#suNome").value.trim(), usuario=slug($("#suUser").value);
  if(!usuario){ $("#suErr").textContent="Usuário inválido."; return; }
  try{
    S.criandoSetup = true;
    const cred = await createUserWithEmailAndPassword(auth, toEmail(usuario), $("#suPass").value);
    const b = writeBatch(db);
    b.set(doc(db,"usuarios",cred.user.uid), {nome, usuario, setor:"admin", ativo:true, criadoEm:serverTimestamp()});
    b.set(doc(db,"config","setup"), {em:serverTimestamp(), por:cred.user.uid});
    await b.commit();
    S.criandoSetup = false;
    await carregarPerfil(cred.user);
  }catch(err){ S.criandoSetup=false; $("#suErr").textContent = authMsg(err); }
});
$("#btnLogout").onclick = ()=>signOut(auth);
$("#noaccessOut").onclick = ()=>signOut(auth);


async function carregarPerfil(user){
  try{
    const p = await getDoc(doc(db,"usuarios",user.uid));
    if (!p.exists() || !p.data().ativo){ show("noaccess"); return; }
    S.perfil = { uid:user.uid, ...p.data() };
    iniciarApp();
  }catch(err){ show("noaccess"); toast(authMsg(err), true); }
}

