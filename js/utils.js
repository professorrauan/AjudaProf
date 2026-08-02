/* =========================================================
   AJUDA+PROF — UTILITÁRIOS GERAIS
   Tema e funções reutilizáveis
   ========================================================= */


/* =========================================================
   TEMA
   ========================================================= */

function aplicarTemaSalvo(){

  const temaEscuroAtivo =
  localStorage.getItem("temaEscuro") === "true";

  document.body.classList.toggle(
    "darkMode",
    temaEscuroAtivo
  );

  atualizarLogosDoTema();

}


function alternarTema(){

  document.body.classList.toggle(
    "darkMode"
  );

  const temaEscuroAtivo =
  document.body.classList.contains(
    "darkMode"
  );

  localStorage.setItem(
    "temaEscuro",
    String(temaEscuroAtivo)
  );

  atualizarLogosDoTema();

}


function atualizarLogosDoTema(){

  const temaEscuroAtivo =
  document.body.classList.contains(
    "darkMode"
  );

  const logoAtual =
  temaEscuroAtivo
  ? "logo1.png"
  : "logo2.png";

  const idsLogos = [
    "logoHome",
    "logoSplash",
    "logoLogin"
  ];

  idsLogos.forEach(id=>{

    const logo =
    document.getElementById(id);

    if(logo){
      logo.src = logoAtual;
    }

  });

}

function mostrarToast(texto){

  let toast=document.createElement("div");

  toast.className="toast";
  toast.innerHTML=texto;

  document.body.appendChild(toast);

  setTimeout(()=>{
    toast.remove();
  },2500);

}

function barraInferior(ativo=""){
return `
<div class="bottomBar">
<div class="bottomItem ${ativo==='home'?'ativo':''}" onclick="voltarHome()">
    <div class="bottomIcon material-icons-round">home</div>
    Home
  </div>

<div class="bottomItem ${ativo==='provas'?'ativo':''}" onclick="abrirCorrecao()">
    <div class="bottomIcon material-icons-round">photo_camera</div>
    Provas
  </div>

<div class="bottomItem ${ativo==='historico'?'ativo':''}" onclick="abrirHistorico()">
    <div class="bottomIcon material-icons-round">history</div>
    Histórico
  </div>

<div class="bottomItem ${ativo==='resumo'?'ativo':''}" onclick="abrirResumo()">
    <div class="bottomIcon material-icons-round">analytics</div>
    Resumo
  </div>
</div>
`;
}

/*
As funções são mantidas no objeto window porque o aplicativo
ainda utiliza chamadas como onclick="alternarTema()".
*/

window.aplicarTemaSalvo =
aplicarTemaSalvo;

window.alternarTema =
alternarTema;

window.atualizarLogosDoTema =
atualizarLogosDoTema;
window.mostrarToast = mostrarToast;
window.barraInferior = barraInferior;