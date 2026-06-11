let baseBNCC = [];
let baseDescritores = [];

let bancoBNCC = [];

async function perguntarIA(pergunta){

try{

let resposta = await fetch("https://ajudaprof-api.vercel.app/api/ia",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
pergunta:pergunta
})
});

console.log("Status:", resposta.status);

let dados = await resposta.json();

console.log("Resposta completa:", dados);

return dados.resposta || JSON.stringify(dados);

}catch(erro){

console.log("ERRO:", erro);

return "❌ Erro: " + erro;

}

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

function aplicarTemaSalvo(){
if(localStorage.getItem("temaEscuro")==="true"){
document.body.classList.add("darkMode");
}
}

function alternarTema(){

document.body.classList.toggle("darkMode");

localStorage.setItem(
"temaEscuro",
document.body.classList.contains("darkMode")
);

let logoHome=document.getElementById("logoHome");
let logoSplash=document.getElementById("logoSplash");

let logoAtual=
document.body.classList.contains("darkMode")
? "logo1.png"
: "logo2.png";

if(logoHome){
logoHome.src=logoAtual;
}

if(logoSplash){
logoSplash.src=logoAtual;
}

}

function abrirSplash(){

document.body.style.opacity="1";

document.body.innerHTML=`
<div class="splashTela">

<div class="glowSplash"></div>

<img id="logoSplash" class="logoSplash" src="">

<div class="barraSplash">
<div id="barraLoad"></div>
<div id="textoLoad">Carregando... 0%</div>
</div>

<div id="statusSplash">Carregando...</div>

</div>
`;

aplicarTemaSalvo();

let logoSplash=document.getElementById("logoSplash");

logoSplash.src=document.body.classList.contains("darkMode")
? "logo1.png"
: "logo2.png";

let progresso=0;

let intervalo=setInterval(()=>{

progresso+=5;

document.getElementById("barraLoad").style.width=progresso+"%";
document.getElementById("textoLoad").innerHTML="Carregando... "+progresso+"%";

if(progresso>=70){
document.getElementById("statusSplash").innerHTML="Preparando...";
}

if(progresso>=100){
clearInterval(intervalo);

document.getElementById("statusSplash").innerHTML=
"Entrando no Ajuda+Prof...";

document.querySelector(".logoSplash").classList.add("zoomFinal");
document.querySelector(".glowSplash").classList.add("glowFinal");

setTimeout(()=>{
document.body.style.transition=".5s";
document.body.style.opacity="0";

setTimeout(()=>{
voltarHome();
document.body.style.opacity="1";
},500);

},600);
}

},100);

}

function voltarHome(){

document.body.innerHTML=`
<div class="cabecalho">

<img id="logoHome" src="">

</div>

<div id="home" class="homeGrid">

<div class="painelHome">

<div onclick="abrirHistorico()" class="cardPainel">
<span class="iconePainel">📷</span>
<strong id="totalCorrigidasHome">0</strong>
<small>Corrigidas</small>
</div>

<div onclick="abrirTurmas()" class="cardPainel">
<span class="iconePainel">📚</span>
<strong id="totalTurmasHome">0</strong>
<small>Cadastradas</small>
</div>

<div onclick="abrirTurmas()" class="cardPainel">
<span class="iconePainel">👨‍🎓</span>
<strong id="totalAlunosHome">0</strong>
<small>Registrados</small>
</div>

</div>

<div class="cardBoasVindas" onclick="abrirHistorico()">

<h3>
👋 Olá, professor(a)!
<span class="setaCard">›</span>
</h3>

<p>
📚 Última turma<br>
<span id="ultimaTurmaHome">Nenhuma turma recente</span>
</p>

<p>
📷 Última correção<br>
<span id="ultimaCorrecaoHome">Nenhuma correção recente</span>
</p>

</div>

<button>
<span class="iconeHome material-icons-round">photo_camera</span>
<span>Corrigir Prova</span>
<small>Corrija cartões-resposta</small>
</button>

<button>
<span class="iconeHome material-icons-round">task_alt</span>
<span>Tarefas</span>
<small>Organize atividades</small>
</button>

<button>
<span class="iconeHome material-icons-round">calendar_month</span>
<span>Agenda</span>
<small>Compromissos escolares</small>
</button>

<button>
<span class="iconeHome material-icons-round">qr_code_scanner</span>
<span>QR Code</span>
<small>Crie códigos rápidos</small>
</button>

<button>
<span class="iconeHome material-icons-round">menu_book</span>
<span>BNCC</span>
<small>Consultar habilidades</small>
</button>

<button>
<span class="iconeHome material-icons-round">analytics</span>
<span>Resumo</span>
<small>Veja estatísticas</small>
</button>

<button>
<span class="iconeHome material-icons-round">history</span>
<span>Histórico</span>
<small>Correções salvas</small>
</button>

<button>
<span class="iconeHome material-icons-round">groups</span>
<span>Turmas</span>
<small>Gerencie alunos</small>
</button>

<button>
<span class="iconeHome material-icons-round">bookmark</span>
<span>Favoritos BNCC</span>
<small>Habilidades salvas</small>
</button>

<button>
<span class="iconeHome material-icons-round">dashboard</span>
<span>Painel Pedagógico</span>
<small>Gráficos e desempenho</small>
</button>

<button>
<span class="iconeHome material-icons-round">edit_note</span>
<span>Planejamento</span>
<small>Planos de aula</small>
</button>

<button class="botaoOculto" onclick="document.getElementById('arquivoBackup').click()">
<span class="iconeHome material-icons-round">restore</span>
<span>Restaurar Backup</span>
<small>Carregar dados salvos</small>
</button>

<button onclick="abrirConfiguracoes()">
<span class="iconeHome material-icons-round">settings</span>
<span>Configurações

<input
id="arquivoBackup"
type="file"
accept=".json"
style="display:none;"
onchange="restaurarBackup(event)"
>

</div>
` + barraInferior("home");

let historicoHome=JSON.parse(localStorage.getItem("historico"))||[];
let turmasHome=JSON.parse(localStorage.getItem("turmas"))||[];

document.getElementById("totalCorrigidasHome").innerHTML=historicoHome.length;
document.getElementById("totalTurmasHome").innerHTML=turmasHome.length;

let totalAlunos=0;

turmasHome.forEach(turma=>{

if(turma.alunos){

totalAlunos+=turma.alunos.length;

}

});

document.getElementById("totalAlunosHome").innerHTML=
totalAlunos;

let ultimoRegistro=null;

if(historicoHome.length>0){
ultimoRegistro=historicoHome[historicoHome.length-1];
}

if(ultimoRegistro){

document.getElementById("ultimaTurmaHome").innerHTML=
ultimoRegistro.turma || "Sem turma";

document.getElementById("ultimaCorrecaoHome").innerHTML=
(ultimoRegistro.nome || "Aluno")+
" — Nota "+
(ultimoRegistro.nota || "-");

}else{

document.getElementById("ultimaTurmaHome").innerHTML=
"Nenhuma turma recente";

document.getElementById("ultimaCorrecaoHome").innerHTML=
"Nenhuma correção recente";

}

iniciarBotoes();
aplicarTemaSalvo();

let logoHome=document.getElementById("logoHome");

if(document.body.classList.contains("darkMode")){
logoHome.src="logo1.png";
}else{
logoHome.src="logo2.png";
}

}

function abrirHome(){
voltarHome();
}

function iniciarBotoes(){

let botoes=document.querySelectorAll("#home button");

botoes[0].onclick=function(){
abrirCorrecao();
}

botoes[1].onclick=function(){
abrirTarefas();
}

botoes[2].onclick=function(){
abrirAgenda();
}

botoes[3].onclick=function(){
abrirQRCode();
}

botoes[4].onclick=function(){
abrirBNCC();
}

botoes[5].onclick=function(){
abrirResumo();
}

botoes[6].onclick=function(){
abrirHistorico();
}

botoes[7].onclick=function(){
abrirTurmas();
}

botoes[8].onclick=function(){
abrirFavoritosBNCC();
}

botoes[9].onclick=function(){
abrirPainelPedagogico();
}

botoes[10].onclick=function(){
abrirPlanejamento();
}

botoes[11].onclick=function(){
abrirConfiguracoes();
}

}

function abrirTarefas(){

document.body.innerHTML=`
<h1>Tarefas</h1>

<input 
id="novaTarefa" 
placeholder="Digite uma tarefa"
>

<button id="adicionar">
<span class="material-icons-round">add</span>
Adicionar
</button>

<ul id="listaTarefas"></ul>

<button onclick="voltarHome()">
← Voltar
</button>
` + barraInferior();

aplicarTemaSalvo();

let tarefas = JSON.parse(localStorage.getItem("tarefas")) || [];
let lista = document.getElementById("listaTarefas");

function atualizarTarefas(){

lista.innerHTML = "";

tarefas.forEach((tarefa,index)=>{

lista.innerHTML += `
<li>
<span>${tarefa}</span>

<button onclick="excluirTarefa(${index})">
Excluir
</button>
</li>
`;

});

}

window.excluirTarefa = function(index){

tarefas.splice(index,1);

localStorage.setItem(
"tarefas",
JSON.stringify(tarefas)
);

atualizarTarefas();

};

document.getElementById("adicionar").onclick = function(){

let texto = document.getElementById("novaTarefa").value.trim();

if(texto === ""){
return;
}

tarefas.push(texto);

localStorage.setItem(
"tarefas",
JSON.stringify(tarefas)
);

document.getElementById("novaTarefa").value = "";

atualizarTarefas();

};

atualizarTarefas();

}

function abrirPlanejamento(){

document.body.innerHTML=`
<h1>📝 Planejamento de Aula</h1>

<input
id="tituloPlano"
placeholder="Título da aula"
>

<br><br>

<select id="turmaPlano">
<option value="">📚 Selecionar turma</option>
</select>

<br><br>

<input
id="disciplinaPlano"
placeholder="Disciplina"
>

<br><br>

<input
id="anoPlano"
placeholder="Ano/Série"
>

<br><br>

<input
id="habilidadePlano"
placeholder="Código BNCC (ex: EF06MA01)"
>

<br><br>

<button id="escolherBNCCPlano">
📚 Escolher da BNCC
</button>

<br><br>

<button id="buscarHabilidadePlano">
🔍 Buscar habilidade BNCC
</button>

<br><br>

<div id="infoHabilidadePlano"></div>

<br><br>

<input
id="descritorPlano"
placeholder="Descritor. Ex: D1, D2, D5"
>

<br><br>

<button id="escolherDescritorPlano">
📊 Escolher descritor
</button>

<br><br>

<div id="infoDescritorPlano"></div>

<br><br>

<textarea
id="objetivoPlano"
placeholder="Objetivo da aula"
style="
width:90%;
height:100px;
"
></textarea>

<br><br>

<textarea
id="metodologiaPlano"
placeholder="Metodologia"
style="
width:90%;
height:120px;
"
></textarea>

<br><br>

<textarea
id="avaliacaoPlano"
placeholder="Avaliação"
style="
width:90%;
height:100px;
"
></textarea>

<br><br>

<button id="salvarPlano">
💾 Salvar Planejamento
</button>

<br><br>

<div id="listaPlanejamentos"></div>


<button onclick="voltarHome()">
⬅ Voltar
</button>
` + barraInferior();

aplicarTemaSalvo();

let planejamentos=
JSON.parse(localStorage.getItem("planejamentos")) || [];

let habilidadeSelecionadaPlano=null;

let turmasPlano=
JSON.parse(localStorage.getItem("turmas")) || [];

let selectTurmaPlano=document.getElementById("turmaPlano");

turmasPlano.forEach(turma=>{
selectTurmaPlano.innerHTML+=`
<option value="${turma.nome}">
${turma.nome}
</option>
`;
});

function atualizarPlanejamentos(){

let html="";

planejamentos.forEach((plano,index)=>{

html+=`
<div class="card" style="text-align:left;">

<h3>${plano.titulo}</h3>

<p>
🏫 ${plano.turma || "Sem turma"}
</p>

<p>
📘 ${plano.disciplina}
</p>

<p>
🎒 ${plano.ano}
</p>

<p>
📚 ${plano.habilidade}
</p>

<button onclick="verPlanejamento(${index})">
🔎 Ver detalhes
</button>

<button onclick="editarPlanejamento(${index})">
✏️ Editar
</button>

<button onclick="excluirPlanejamento(${index})">
🗑 Excluir
</button>

</div>
`;
});

document.getElementById("listaPlanejamentos").innerHTML=
html || "<div class='card'>Nenhum planejamento salvo.</div>";

}

window.verPlanejamento=function(index){

let plano=planejamentos[index];

document.body.innerHTML=`
<div style="
background:white;
color:#1F2937;
padding:24px;
font-family:Arial,sans-serif;
min-height:100vh;
">

<h1 style="color:#4A6CF7;">
📝 Planejamento de Aula
</h1>

<h2>${plano.titulo}</h2>

<hr>

<p><strong>🏫 Turma:</strong><br>${plano.turma || "Sem turma"}</p>

<p><strong>📘 Disciplina:</strong><br>${plano.disciplina}</p>

<p><strong>🎒 Ano/Série:</strong><br>${plano.ano}</p>

<p><strong>📚 Habilidade BNCC:</strong><br>${plano.habilidade}</p>

<p><strong>📖 Descrição da habilidade:</strong><br>${plano.habilidadeDescricao || "Não informada"}</p>

<p><strong>📊 Descritor:</strong><br>${plano.descritor || "Não informado"}</p>

<p><strong>🎯 Objetivo:</strong><br>${plano.objetivo}</p>

<p><strong>🧭 Metodologia:</strong><br>${plano.metodologia}</p>

<p><strong>✅ Avaliação:</strong><br>${plano.avaliacao}</p>

<br>

<p style="font-size:12px;color:#6B7280;">
Gerado no Ajuda+Prof
</p>

<button onclick="window.print()">
📄 Imprimir / Salvar PDF
</button>

<button onclick="abrirPlanejamento()">
⬅ Voltar
</button>

</div>
`;

}

window.editarPlanejamento=function(index){

let plano=planejamentos[index];

document.getElementById("turmaPlano").value=plano.turma || "";

document.getElementById("tituloPlano").value=plano.titulo;
document.getElementById("disciplinaPlano").value=plano.disciplina;
document.getElementById("anoPlano").value=plano.ano;
document.getElementById("habilidadePlano").value=plano.habilidade;
habilidadeSelecionadaPlano =
bancoBNCC.find(h=>h.codigo===plano.habilidade) || null;
document.getElementById("objetivoPlano").value=plano.objetivo;
document.getElementById("metodologiaPlano").value=plano.metodologia;
document.getElementById("avaliacaoPlano").value=plano.avaliacao;

planejamentos.splice(index,1);

localStorage.setItem(
"planejamentos",
JSON.stringify(planejamentos)
);

atualizarPlanejamentos();

document.getElementById("salvarPlano").innerHTML=
"💾 Salvar Alterações";

window.scrollTo(0,0);

}

window.excluirPlanejamento=function(index){

planejamentos.splice(index,1);

localStorage.setItem(
"planejamentos",
JSON.stringify(planejamentos)
);

atualizarPlanejamentos();

}

document.getElementById("escolherBNCCPlano").onclick=function(){

document.getElementById("infoHabilidadePlano").innerHTML=`
<div class="card" style="text-align:left;">

<h3>📚 Escolher habilidade BNCC</h3>

<input
id="buscaBNCCPlano"
placeholder="Buscar por código ou palavra..."
>

<br><br>

<div id="resultadoBNCCPlano"></div>

</div>
`;

document.getElementById("buscaBNCCPlano").oninput=function(){

let busca=this.value.toUpperCase().trim();

let resultados=bancoBNCC.filter(item=>{

let texto=(
(item.codigo || "")+" "+
(item.disciplina || "")+" "+
(item.habilidade || item.descricao || "")
).toUpperCase();

return busca!=="" && texto.includes(busca);

}).slice(0,20);

let html="";

resultados.forEach(item=>{

html+=`
<div class="card" style="text-align:left;">
<strong>${item.codigo}</strong>
<br>
${item.disciplina || "Disciplina não informada"}
<br><br>
${item.habilidade || item.descricao || "Descrição não encontrada."}

<button onclick="selecionarBNCCPlano('${item.codigo}')">
✅ Selecionar
</button>
</div>
`;

});

document.getElementById("resultadoBNCCPlano").innerHTML=
html || "<p>Digite para pesquisar habilidades.</p>";

};

};

window.selecionarBNCCPlano=function(codigo){

let item=bancoBNCC.find(h=>h.codigo===codigo);

if(!item) return;

habilidadeSelecionadaPlano=item;

document.getElementById("habilidadePlano").value=item.codigo;
document.getElementById("disciplinaPlano").value=item.disciplina || "";
document.getElementById("anoPlano").value=
item.anos ? item.anos.join(", ") : item.ano || "";

document.getElementById("infoHabilidadePlano").innerHTML=`
<div class="card" style="text-align:left;">
<strong>✅ Habilidade selecionada</strong>
<br><br>
<strong>${item.codigo}</strong>
<br><br>
${item.habilidade || item.descricao || "Descrição não encontrada."}
</div>
`;

}

window.selecionarDescritorPlano=function(codigo){

let item=baseDescritores.find(d=>d.codigo===codigo);

if(!item) return;

document.getElementById("descritorPlano").value=item.codigo;

document.getElementById("infoDescritorPlano").innerHTML=`
<div class="card" style="text-align:left;">
<strong>✅ Descritor selecionado</strong>
<br><br>
<strong>${item.codigo}</strong>
<br>
${item.area || "Área não informada"}
<br><br>
${item.descricao || "Descrição não encontrada."}
</div>
`;

}

document.getElementById("buscarHabilidadePlano").onclick=function(){

let codigo=document.getElementById("habilidadePlano").value
.toUpperCase()
.trim();

let item=bancoBNCC.find(h=>h.codigo===codigo);

if(!item){
document.getElementById("infoHabilidadePlano").innerHTML=
"<div class='card'>❌ Habilidade não encontrada.</div>";
return;
}

document.getElementById("disciplinaPlano").value=
item.disciplina || "";

document.getElementById("anoPlano").value=
item.anos ? item.anos.join(", ") : item.ano || "";

document.getElementById("infoHabilidadePlano").innerHTML=`
<div class="card" style="text-align:left;">
<strong>${item.codigo}</strong><br><br>
${item.habilidade || item.descricao || "Descrição não encontrada."}
</div>
`;

};

document.getElementById("escolherDescritorPlano").onclick=function(){

document.getElementById("infoDescritorPlano").innerHTML=`
<div class="card" style="text-align:left;">

<h3>📊 Escolher descritor</h3>

<input
id="buscaDescritorPlano"
placeholder="Buscar por código ou palavra..."
>

<br><br>

<div id="resultadoDescritorPlano"></div>

</div>
`;

document.getElementById("buscaDescritorPlano").oninput=function(){

let busca=this.value.toUpperCase().trim();

let resultados=baseDescritores.filter(item=>{

let texto=(
(item.codigo || "")+" "+
(item.area || "")+" "+
(item.descricao || "")
).toUpperCase();

return busca!=="" && texto.includes(busca);

}).slice(0,20);

let html="";

resultados.forEach(item=>{

html+=`
<div class="card" style="text-align:left;">
<strong>${item.codigo}</strong>
<br>
${item.area || "Área não informada"}
<br><br>
${item.descricao || "Descrição não encontrada."}

<button onclick="selecionarDescritorPlano('${item.codigo}')">
✅ Selecionar
</button>
</div>
`;

});

document.getElementById("resultadoDescritorPlano").innerHTML=
html || "<p>Digite para pesquisar descritores.</p>";

};

};

document.getElementById("salvarPlano").onclick=function(){

let plano={

turma:
document.getElementById("turmaPlano").value,

titulo:
document.getElementById("tituloPlano").value,

disciplina:
document.getElementById("disciplinaPlano").value,

ano:
document.getElementById("anoPlano").value,

habilidade:
document.getElementById("habilidadePlano").value,

objetivo:
document.getElementById("objetivoPlano").value,

habilidadeDescricao:
habilidadeSelecionadaPlano
? (habilidadeSelecionadaPlano.habilidade || habilidadeSelecionadaPlano.descricao || "")
: "",

descritor:
document.getElementById("descritorPlano").value,

metodologia:
document.getElementById("metodologiaPlano").value,

avaliacao:
document.getElementById("avaliacaoPlano").value

};

planejamentos.push(plano);

localStorage.setItem(
"planejamentos",
JSON.stringify(planejamentos)
);

mostrarToast("✅ Planejamento salvo.");

abrirPlanejamento();

};

atualizarPlanejamentos();

}

function abrirAgenda(){

document.body.innerHTML=`
<h1>📅 Agenda</h1>

<input id="evento" placeholder="Digite o compromisso">

<br><br>

<input id="dataEvento" type="date">

<br><br>

<button id="salvarEvento">💾 Salvar Evento</button>

<br><br>

<ul id="listaAgenda"></ul>

<button onclick="voltarHome()">
⬅ Voltar
</button>
` + barraInferior();

aplicarTemaSalvo();

let agenda=JSON.parse(localStorage.getItem("agenda"))||[];
let lista=document.getElementById("listaAgenda");

function atualizarAgenda(){
lista.innerHTML="";

agenda.forEach((item,index)=>{
lista.innerHTML+=`
<li>
📌 ${item.evento} - ${item.data}
<button onclick="excluirEvento(${index})">❌</button>
</li>
`;
});
}

window.excluirEvento=function(index){
agenda.splice(index,1);
localStorage.setItem("agenda",JSON.stringify(agenda));
atualizarAgenda();
}

document.getElementById("salvarEvento").onclick=function(){
let evento=document.getElementById("evento").value;
let data=document.getElementById("dataEvento").value;

if(evento.trim()==="") return;

agenda.push({
evento:evento,
data:data
});

localStorage.setItem("agenda",JSON.stringify(agenda));

document.getElementById("evento").value="";
document.getElementById("dataEvento").value="";

atualizarAgenda();
}

atualizarAgenda();
}

function abrirQRCode(){

document.body.innerHTML=`
<h1>🔍 QR Code</h1>

<input id="textoQR" placeholder="Digite texto ou link">

<br><br>

<button id="gerarQR">📷 Gerar QR</button>

<br><br>

<div id="qrcode"></div>

<button onclick="voltarHome()">
⬅ Voltar
</button>
` + barraInferior();

aplicarTemaSalvo();

document.getElementById("gerarQR").onclick=function(){
let texto=document.getElementById("textoQR").value;

if(texto.trim()==="") return;

document.getElementById("qrcode").innerHTML=`
<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(texto)}">
`;
}
}

function abrirIA(){

document.body.innerHTML=`
<h1>🤖 Assistente IA</h1>

<div id="chatIA" style="
height:350px;
overflow-y:auto;
background:var(--card);
padding:15px;
border-radius:15px;
margin-bottom:15px;
text-align:left;
"></div>

<div style="
display:flex;
gap:10px;
align-items:center;
">

<input
id="pergunta"
placeholder="Digite sua pergunta..."
style="
flex:1;
min-width:0;
padding:15px;
font-size:16px;
text-align:left;
"
>

<button
id="enviarIA"
style="
width:70px;
min-width:70px;
"
>
➤
</button>

</div>

</div>

<br>


<button onclick="voltarHome()">
⬅ Voltar
</button>
` + barraInferior();

aplicarTemaSalvo();

function adicionarMensagem(tipo,texto){

let chat=document.getElementById("chatIA");

chat.innerHTML+=`
<div style="
margin:10px 0;
padding:12px;
border-radius:14px;
background:${tipo==="usuario" ? "#4A6CF7" : "#E5E7EB"};
color:${tipo==="usuario" ? "white" : "#111827"};
text-align:${tipo==="usuario" ? "right" : "left"};
">
${texto}
</div>
`;

chat.scrollTop=chat.scrollHeight;

}

adicionarMensagem(
"ia",
"👋 Olá professor(a)! Posso ajudar com provas, atividades, planejamento, avaliações e organização escolar."
);

document.getElementById("enviarIA").onclick = async function(){

let pergunta =
document.getElementById("pergunta")
.value
.trim();

if(pergunta==="") return;

adicionarMensagem(
"usuario",
pergunta
);

document.getElementById("pergunta").value="";

adicionarMensagem(
"ia",
"⏳ Gerando resposta..."
);

let respostaIA =
await perguntarIA(pergunta);

let chat =
document.getElementById("chatIA");

let mensagens =
chat.querySelectorAll("div");

if(mensagens.length > 0){
mensagens[mensagens.length-1].remove();
}

adicionarMensagem(
"ia",
respostaIA
);

};

}

function abrirPainelPedagogico(){

let historico=
JSON.parse(localStorage.getItem("historico")) || [];

let historicoCompleto=[...historico];

let filtroTurmaSalvo =
localStorage.getItem("filtroTurmaPainel") || "";

if(filtroTurmaSalvo !== ""){
historico = historico.filter(item=>{
return (item.turma || "Sem turma") === filtroTurmaSalvo;
});
}

let aprovados=0;
let recuperacao=0;
let abaixo=0;

historico.forEach(item=>{

let nota=parseFloat(
(item.nota || "0/0").split("/")[0]
);

if(nota>=7){
aprovados++;
}
else if(nota>=5){
recuperacao++;
}
else{
abaixo++;
}

});

let contagemBNCC={};

historico.forEach(item=>{

let codigo=item.habilidadeBNCC || "Não informada";

contagemBNCC[codigo]=(contagemBNCC[codigo] || 0)+1;

});

let dadosBNCC=Object.keys(contagemBNCC).map(codigo=>{
return {
nome:codigo,
valor:contagemBNCC[codigo]
};
});

let contagemDescritor={};

historico.forEach(item=>{

let codigo=item.descritor || "Não informado";

contagemDescritor[codigo]=(contagemDescritor[codigo] || 0)+1;

});

let dadosDescritor=Object.keys(contagemDescritor).map(codigo=>{
return {
nome:codigo,
valor:contagemDescritor[codigo]
};
});

document.body.innerHTML=`
<h1>🥧 Painel Pedagógico</h1>

<select id="filtroTurmaPainel">
<option value="">📚 Todas as turmas</option>
</select>

<br><br>

<div class="card">
<h3>📊 Desempenho geral</h3>

<canvas id="graficoPizza" width="300" height="300"></canvas>

<p>🟢 Aprovados: ${aprovados}</p>
<p>🟡 Recuperação: ${recuperacao}</p>
<p>🔴 Abaixo de 5: ${abaixo}</p>
</div>

<div class="card">
<h3>📚 Avaliações por BNCC</h3>

<canvas id="graficoBNCC" width="300" height="300"></canvas>

<div id="legendaBNCC"></div>
</div>

<div class="card">
<h3>📊 Avaliações por descritor</h3>

<canvas id="graficoDescritor" width="300" height="300"></canvas>

<div id="legendaDescritor"></div>
</div>

<div class="card">
<h3>📊 Média por turma</h3>

<div id="graficoTurmas"></div>
</div>

<div class="card">
<h3>📉 Habilidades com menor desempenho</h3>

<div id="pioresBNCC"></div>
</div>

<div class="card">
<h3>🏆 Habilidades com melhor desempenho</h3>

<div id="melhoresBNCC"></div>
</div>

<div class="card">
<h3>🚨 Alunos que precisam de atenção</h3>

<div id="alunosAtencaoPainel"></div>
</div>

<button onclick="voltarHome()">
⬅ Voltar
</button>
` + barraInferior();

aplicarTemaSalvo();

let selectTurmaPainel=document.getElementById("filtroTurmaPainel");

let turmasUnicas=[...new Set(
historicoCompleto.map(item=>item.turma || "Sem turma")
)].sort();

turmasUnicas.forEach(turma=>{
selectTurmaPainel.innerHTML+=`
<option value="${turma}">
${turma}
</option>
`;
});

let turmaSalva=
localStorage.getItem("filtroTurmaPainel") || "";

selectTurmaPainel.value=turmaSalva;

selectTurmaPainel.onchange=function(){

let turmaSelecionada=this.value;

if(turmaSelecionada===""){
localStorage.removeItem("filtroTurmaPainel");
abrirPainelPedagogico();
return;
}

localStorage.setItem("filtroTurmaPainel",turmaSelecionada);

abrirPainelPedagogico();

};

let canvas=document.getElementById("graficoPizza");
let ctx=canvas.getContext("2d");

let dados=[
{nome:"Aprovados",valor:aprovados,cor:"#22C55E"},
{nome:"Recuperação",valor:recuperacao,cor:"#F59E0B"},
{nome:"Abaixo de 5",valor:abaixo,cor:"#EF4444"}
];

let total=dados.reduce((soma,item)=>soma+item.valor,0);

if(total===0){

ctx.fillStyle="#6B7280";
ctx.font="16px Arial";
ctx.textAlign="center";
ctx.fillText("Sem dados ainda",150,150);

}else{

let inicio=0;

dados.forEach(item=>{

let fatia=(item.valor/total)*Math.PI*2;

ctx.beginPath();
ctx.moveTo(150,150);
ctx.arc(150,150,110,inicio,inicio+fatia);
ctx.closePath();
ctx.fillStyle=item.cor;
ctx.fill();

inicio+=fatia;

});

}

desenharPizzaGenerica(
"graficoBNCC",
dadosBNCC,
"legendaBNCC"
);

desenharPizzaGenerica(
"graficoDescritor",
dadosDescritor,
"legendaDescritor"
);

let turmasMedia={};

historico.forEach(item=>{

let turma=item.turma || "Sem turma";

let nota=parseFloat(
(item.nota || "0/0").split("/")[0]
);

if(!turmasMedia[turma]){
turmasMedia[turma]={
soma:0,
quantidade:0
};
}

turmasMedia[turma].soma+=nota;
turmasMedia[turma].quantidade++;

});

let htmlTurmas="";

Object.keys(turmasMedia).forEach(turma=>{

let media=
turmasMedia[turma].soma /
turmasMedia[turma].quantidade;

let largura=Math.min(media*10,100);

htmlTurmas+=`
<div style="text-align:left;margin-bottom:16px;">

<strong>${turma}</strong>
<br>

<div style="
background:#E5E7EB;
height:24px;
border-radius:999px;
overflow:hidden;
margin-top:6px;
">

<div style="
background:#4A6CF7;
height:100%;
width:${largura}%;
color:white;
font-size:13px;
line-height:24px;
padding-left:8px;
">
${media.toFixed(1)}
</div>

</div>

</div>
`;

});

document.getElementById("graficoTurmas").innerHTML=
htmlTurmas || "Sem dados por turma.";

let desempenhoBNCC={};

historico.forEach(item=>{

let codigo=item.habilidadeBNCC || "Não informada";

let nota=parseFloat(
(item.nota || "0/0").split("/")[0]
);

if(!desempenhoBNCC[codigo]){
desempenhoBNCC[codigo]={
soma:0,
quantidade:0
};
}

desempenhoBNCC[codigo].soma+=nota;
desempenhoBNCC[codigo].quantidade++;

});

let listaBNCC=Object.keys(desempenhoBNCC).map(codigo=>{

let item=desempenhoBNCC[codigo];

return {
codigo:codigo,
media:item.soma/item.quantidade,
quantidade:item.quantidade
};

});

listaBNCC.sort((a,b)=>a.media-b.media);

let htmlPiores="";

listaBNCC.slice(0,5).forEach(item=>{

htmlPiores+=`
<div class="card" style="text-align:left;">
<strong>${item.codigo}</strong>
<br>
📊 Média: ${item.media.toFixed(1)}
<br>
📝 Avaliações: ${item.quantidade}
</div>
`;

});

document.getElementById("pioresBNCC").innerHTML=
htmlPiores || "Sem dados de habilidades ainda.";

let htmlMelhores="";

let rankingMelhores=[...listaBNCC];

rankingMelhores.sort((a,b)=>b.media-a.media);

rankingMelhores.slice(0,5).forEach(item=>{

htmlMelhores+=`
<div class="card" style="
text-align:left;
border-left:8px solid #22C55E;
">
<strong>${item.codigo}</strong>
<br>
📊 Média: ${item.media.toFixed(1)}
<br>
📝 Avaliações: ${item.quantidade}
</div>
`;

});

document.getElementById("melhoresBNCC").innerHTML=
htmlMelhores || "Sem dados de habilidades ainda.";

let desempenhoAlunos={};

historico.forEach(item=>{

let nome=item.nome || "Sem nome";

let nota=parseFloat(
(item.nota || "0/0").split("/")[0]
);

if(!desempenhoAlunos[nome]){
desempenhoAlunos[nome]={
soma:0,
quantidade:0
};
}

desempenhoAlunos[nome].soma+=nota;
desempenhoAlunos[nome].quantidade++;

});

let rankingAlunos=Object.keys(desempenhoAlunos).map(nome=>{

let item=desempenhoAlunos[nome];

return{
nome:nome,
media:item.soma/item.quantidade
};

});

rankingAlunos.sort((a,b)=>a.media-b.media);

let htmlAtencao="";

rankingAlunos
.filter(aluno=>aluno.media<6)
.slice(0,10)
.forEach(aluno=>{

htmlAtencao+=`
<div class="card" style="
text-align:left;
border-left:8px solid #EF4444;
">

<strong>${aluno.nome}</strong>

<br>

📉 Média: ${aluno.media.toFixed(1)}

</div>
`;

});

document.getElementById("alunosAtencaoPainel").innerHTML=
htmlAtencao || "✅ Nenhum aluno em situação de atenção.";

}

function desenharPizzaGenerica(idCanvas,dados,idLegenda){

let canvas=document.getElementById(idCanvas);
let ctx=canvas.getContext("2d");

let total=dados.reduce((soma,item)=>soma+item.valor,0);

let cores=[
"#4A6CF7",
"#22C55E",
"#F59E0B",
"#EF4444",
"#8B5CF6",
"#06B6D4",
"#84CC16",
"#F97316"
];

if(total===0){

ctx.fillStyle="#6B7280";
ctx.font="16px Arial";
ctx.textAlign="center";
ctx.fillText("Sem dados ainda",150,150);

return;

}

let inicio=0;
let legenda="";

dados.forEach((item,index)=>{

let fatia=(item.valor/total)*Math.PI*2;
let cor=cores[index % cores.length];

ctx.beginPath();
ctx.moveTo(150,150);
ctx.arc(150,150,110,inicio,inicio+fatia);
ctx.closePath();
ctx.fillStyle=cor;
ctx.fill();

inicio+=fatia;

legenda+=`
<p>
<span style="
display:inline-block;
width:14px;
height:14px;
background:${cor};
border-radius:50%;
margin-right:6px;
"></span>
${item.nome}: ${item.valor}
</p>
`;

});

document.getElementById(idLegenda).innerHTML=legenda;

}

function abrirBNCC(){

document.body.innerHTML=`
<h1>📚 Biblioteca BNCC</h1>

<button onclick="abrirDescritores()">
📊 Ver descritores
</button>

<br><br>

<input
id="buscaBNCC"
placeholder="Buscar por código ou palavra. Ex: EF06MA01, números, texto"
>

<br><br>

<select id="filtroDisciplinaBNCC">
<option value="">📘 Todas as disciplinas</option>
</select>

<br><br>

<select id="filtroAnoBNCC">
<option value="">🎒 Todos os anos</option>
</select>

<br><br>

<button id="buscarBNCC">
🔍 Buscar
</button>

<button id="limparBNCC">
🧹 Limpar filtros
</button>

<br><br>

<div id="contadorBNCC" class="card">
📚 Carregando habilidades...
</div>

<div id="resultadoBNCC"></div>

<button onclick="abrirFavoritosBNCC()">
⭐ Ver favoritos
</button>


<button onclick="voltarHome()">
⬅ Voltar
</button>
` + barraInferior();

aplicarTemaSalvo();

let disciplinas = [...new Set(
bancoBNCC.map(item => item.disciplina)
)].sort();

let selectDisciplina =
document.getElementById("filtroDisciplinaBNCC");

disciplinas.forEach(d => {

selectDisciplina.innerHTML += `
<option value="${d}">
${d}
</option>
`;

});

let anos = [];

bancoBNCC.forEach(item => {

if(item.anos){

item.anos.forEach(ano => {

if(!anos.includes(ano)){
anos.push(ano);
}

});

}

});

anos.sort();

let selectAno =
document.getElementById("filtroAnoBNCC");

anos.forEach(ano => {

selectAno.innerHTML += `
<option value="${ano}">
${ano}
</option>
`;

});

function renderizarBNCC(){

let busca=document.getElementById("buscaBNCC").value
.toUpperCase()
.trim();

let disciplina=document.getElementById("filtroDisciplinaBNCC").value;
let ano=document.getElementById("filtroAnoBNCC").value;

let resultados=bancoBNCC.filter(item=>{

let textoCompleto=(
(item.codigo || "")+" "+
(item.disciplina || "")+" "+
(item.anos ? item.anos.join(" ") : item.ano || "")+" "+
(item.habilidade || item.descricao || "")
).toUpperCase();

let combinaBusca=
busca==="" || textoCompleto.includes(busca);

let combinaDisciplina=
disciplina==="" || (item.disciplina || "")===disciplina;

let combinaAno=
ano==="" ||
(item.anos && item.anos.includes(ano)) ||
item.ano===ano;

return combinaBusca && combinaDisciplina && combinaAno;

});

let html="";

resultados.forEach(item=>{

html+=`
<div class="card" style="text-align:left;">

<h3>${item.codigo}</h3>

<div style="
display:flex;
gap:8px;
flex-wrap:wrap;
margin-bottom:12px;
">

<span style="
background:#2563EB;
color:white;
padding:6px 10px;
border-radius:999px;
font-size:12px;
">
📘 ${item.disciplina}
</span>

<span style="
background:#059669;
color:white;
padding:6px 10px;
border-radius:999px;
font-size:12px;
">
🎒 ${item.anos ? item.anos.join(", ") : item.ano || "Ano não informado"}
</span>

</div>

<p>
<strong>✅ Habilidade:</strong><br>
${item.habilidade || item.descricao || "Descrição não encontrada."}
</p>

<button onclick="favoritarBNCC('${item.codigo}')">
⭐ Favoritar
</button>

<button onclick="copiarHabilidadeBNCC('${item.codigo}')">
📋 Copiar
</button>

<button onclick="abrirDetalheBNCC('${item.codigo}')">
🔎 Ver detalhes
</button>

</div>
`;

});

document.getElementById("contadorBNCC").innerHTML=
"📚 "+resultados.length+" habilidade(s) encontrada(s).";

document.getElementById("resultadoBNCC").innerHTML=
html || `
<div class="card">
❌ Nenhuma habilidade encontrada.
</div>
`;

}

document.getElementById("buscarBNCC").onclick=function(){
renderizarBNCC();
};

document.getElementById("limparBNCC").onclick=function(){

document.getElementById("buscaBNCC").value="";
document.getElementById("filtroDisciplinaBNCC").value="";
document.getElementById("filtroAnoBNCC").value="";

renderizarBNCC();

};

document.getElementById("buscaBNCC").oninput=function(){
renderizarBNCC();
};

document.getElementById("filtroDisciplinaBNCC").onchange=function(){
renderizarBNCC();
};

document.getElementById("filtroAnoBNCC").onchange=function(){
renderizarBNCC();
};

renderizarBNCC();

}

function copiarHabilidadeBNCC(codigo){

let item=bancoBNCC.find(h=>h.codigo===codigo);

if(!item){
alert("Habilidade não encontrada.");
return;
}

let texto=
item.codigo+" - "+
item.disciplina+" - "+
item.ano+"\n\n"+
item.habilidade;

navigator.clipboard.writeText(texto);

alert("📋 Habilidade copiada.");

}

function favoritarBNCC(codigo){

let favoritos=
JSON.parse(
localStorage.getItem("bnccFavoritos")
)||[];

if(!favoritos.includes(codigo)){

favoritos.push(codigo);

localStorage.setItem(
"bnccFavoritos",
JSON.stringify(favoritos)
);

mostrarToast("⭐ Habilidade adicionada aos favoritos.");

}else{

alert("⭐ Essa habilidade já está salva.");

}

}

function abrirDetalheBNCC(codigo){

let item=bancoBNCC.find(h=>h.codigo===codigo);

if(!item){
alert("Habilidade não encontrada.");
return;
}

document.body.innerHTML=`
<h1>🔎 Detalhes BNCC</h1>

<div class="card" style="text-align:left;">

<h2>${item.codigo}</h2>

<p>
<strong>📘 Disciplina:</strong><br>
${item.disciplina || "Não informada"}
</p>

<p>
<strong>🎒 Ano(s):</strong><br>
${item.anos ? item.anos.join(", ") : item.ano || "Ano não informado"}
</p>

<p>
<strong>✅ Habilidade:</strong><br>
${item.habilidade || item.descricao || "Descrição não encontrada."}
</p>

<button onclick="favoritarBNCC('${item.codigo}')">
⭐ Favoritar
</button>

<button onclick="copiarHabilidadeBNCC('${item.codigo}')">
📋 Copiar
</button>

</div>

<button onclick="abrirBNCC()">
⬅ Voltar para BNCC
</button>
` + barraInferior();

aplicarTemaSalvo();

}

function abrirDescritores(){

document.body.innerHTML=`
<h1>Descritores</h1>

<input
id="buscaDescritor"
placeholder="Buscar: MAT9, LP5, D1, porcentagem..."
>

<br><br>

<div id="resultadoDescritores"></div>

<button onclick="abrirBNCC()">
Voltar para BNCC
</button>
` + barraInferior();

aplicarTemaSalvo();

let descritores = baseDescritores || [];

function renderizarDescritores(){

let busca=document.getElementById("buscaDescritor").value
.toUpperCase()
.trim();

let resultados=descritores.filter(item=>{

let texto=(
(item.codigo || "")+" "+
(item.codigoOriginal || "")+" "+
(item.area || "")+" "+
(item.ano || "")+" "+
(item.descricao || "")
).toUpperCase();

return busca==="" || texto.includes(busca);

});

let html="";

resultados.forEach(item=>{

html+=`
<div class="card" style="text-align:left;">
<h3>${item.codigo}</h3>

<p><strong>Área:</strong> ${item.area || "Não informada"}</p>

<p><strong>Ano:</strong> ${item.ano || "Não informado"}</p>

<p><strong>Descritor:</strong><br>${item.descricao || "Descrição não encontrada."}</p>
</div>
`;

});

document.getElementById("resultadoDescritores").innerHTML=
html || "<div class='card'>Nenhum descritor encontrado.</div>";

}

function renderizarDescritores(){

let busca=document.getElementById("buscaDescritor").value
.toUpperCase()
.trim();

let resultados=descritores.filter(item=>{

let texto=(
item.codigo+" "+
item.area+" "+
item.descricao
).toUpperCase();

return busca==="" || texto.includes(busca);

});

let html="";

resultados.forEach(item=>{

html+=`
<div class="card" style="text-align:left;">
<h3>${item.codigo}</h3>
<p><strong>📘 Área:</strong> ${item.area}</p>
<p><strong>📊 Descritor:</strong><br>${item.descricao}</p>
</div>
`;

});

document.getElementById("resultadoDescritores").innerHTML=
html || "<div class='card'>Nenhum descritor encontrado.</div>";

}

document.getElementById("buscaDescritor").oninput=function(){
renderizarDescritores();
};

renderizarDescritores();

}

function abrirCorrecao(){

document.body.innerHTML=`
<h1>Corrigir Prova</h1>

<input id="foto" type="file" accept="image/*" capture style="display:none;">

<button id="abrirCamera">
<span class="material-icons-round">photo_camera</span>
Tirar ou escolher foto
</button>

<br><br>

<p>Arraste os pontos vermelhos até encaixar no gabarito. Depois ajuste o retângulo azul.</p>

<button id="detectarGrade">
<span class="material-icons-round">center_focus_strong</span>
Auto enquadrar gabarito
</button>

<canvas id="canvas" width="320"></canvas>

<div id="painelCorrecao" style="display:none;">

<select id="turmaSelecionada">
<option value="">Selecionar turma</option>
</select>

<br><br>

<select id="aluno">
<option value="">Selecionar aluno</option>
</select>

<br><br>

<div class="card">
<h3>Configuração da prova</h3>

<input id="totalQuestoes" type="number" min="1" placeholder="Quantidade de questões. Ex: 10">

<input id="valorProva" type="number" min="0" step="0.1" placeholder="Valor da prova. Ex: 10">

<input id="gabarito" placeholder="Gabarito. Ex: A,B,C,D,A">

<input id="habilidadeProva" placeholder="Habilidade BNCC. Ex: EF06MA01">

<input id="descritorProva" placeholder="Descritor. Ex: D1, D2, D5">

<button id="salvarGabarito">Salvar Gabarito</button>
</div>

<br>

<div class="card">
<h3>Modelo de gabarito</h3>

<select id="modeloOMR">
<option value="">Modelo padrão</option>
</select>

<button id="salvarModeloOMR">Salvar modelo ajustado</button>

<button id="excluirModeloOMR">Excluir modelo selecionado</button>
</div>

<button id="debugVisual">Debug Visual: Ligado</button>

<button id="analisar">Analisar Marcações</button>

<p id="resultado"></p>

<button onclick="document.getElementById('foto').click();">
Foto do próximo aluno
</button>

</div>

<button onclick="voltarHome()">Voltar</button>
` + barraInferior("provas");

aplicarTemaSalvo();

let canvas=document.getElementById("canvas");
let ctx=canvas.getContext("2d");
let imagem=new Image();
let turmas=JSON.parse(localStorage.getItem("turmas"))||[];

let pontos=[
{x:60,y:80},
{x:260,y:80},
{x:60,y:360},
{x:260,y:360}
];

let arrastando=null;
let arrastandoAzul=null;
let mostrarDebug=true;

let selectTurma=document.getElementById("turmaSelecionada");

turmas.forEach(turma=>{
selectTurma.innerHTML+=`
<option value="${turma.nome}">${turma.nome}</option>
`;
});

selectTurma.onchange=function(){

let nomeTurma=this.value;
let selectAluno=document.getElementById("aluno");

selectAluno.innerHTML=`
<option value="">👨‍🎓 Selecionar aluno</option>
`;

let turma=turmas.find(t=>t.nome===nomeTurma);

if(!turma) return;

turma.alunos.forEach(aluno=>{
selectAluno.innerHTML+=`
<option value="${aluno}">${aluno}</option>
`;
});

};

let botaoCamera=document.getElementById("abrirCamera");
let inputFoto=document.getElementById("foto");

botaoCamera.onclick=function(){
inputFoto.click();
};

let gabaritoSalvo=localStorage.getItem("gabarito");
let totalQuestoesSalvo=localStorage.getItem("totalQuestoes");
let valorProvaSalvo=localStorage.getItem("valorProva");
let habilidadeProvaSalva=localStorage.getItem("habilidadeProva");
let descritorProvaSalvo=localStorage.getItem("descritorProva");

if(gabaritoSalvo) document.getElementById("gabarito").value=gabaritoSalvo;
if(totalQuestoesSalvo) document.getElementById("totalQuestoes").value=totalQuestoesSalvo;
if(valorProvaSalvo) document.getElementById("valorProva").value=valorProvaSalvo;
if(habilidadeProvaSalva) document.getElementById("habilidadeProva").value=habilidadeProvaSalva;
if(descritorProvaSalvo) document.getElementById("descritorProva").value=descritorProvaSalvo;

document.getElementById("salvarGabarito").onclick=function(){

localStorage.setItem("gabarito",document.getElementById("gabarito").value);
localStorage.setItem("totalQuestoes",document.getElementById("totalQuestoes").value);
localStorage.setItem("valorProva",document.getElementById("valorProva").value);
localStorage.setItem("habilidadeProva",document.getElementById("habilidadeProva").value);
localStorage.setItem("descritorProva",document.getElementById("descritorProva").value);

alert("✅ Configuração da prova salva.");

};

function carregarModelosOMR(){

let modelos=JSON.parse(localStorage.getItem("modelosOMR"))||[];
let select=document.getElementById("modeloOMR");

select.innerHTML=`<option value="">📄 Modelo padrão</option>`;

modelos.forEach((modelo,index)=>{
select.innerHTML+=`
<option value="${index}">${modelo.nome}</option>
`;
});

}

carregarModelosOMR();

document.getElementById("modeloOMR").onchange=function(){

let index=this.value;

if(index==="") return;

let modelos=JSON.parse(localStorage.getItem("modelosOMR"))||[];
let modelo=modelos[index];

if(!modelo) return;

if(modelo.prova){

document.getElementById("totalQuestoes").value=modelo.prova.totalQuestoes || "";
document.getElementById("valorProva").value=modelo.prova.valorProva || "";
document.getElementById("gabarito").value=modelo.prova.gabarito || "";

}

};

document.getElementById("excluirModeloOMR").onclick=function(){

let index=document.getElementById("modeloOMR").value;

if(index===""){
alert("Selecione um modelo para excluir.");
return;
}

let modelos=JSON.parse(localStorage.getItem("modelosOMR"))||[];

if(!confirm("Excluir este modelo?")) return;

modelos.splice(index,1);

localStorage.setItem("modelosOMR",JSON.stringify(modelos));

alert("🗑 Modelo excluído.");

carregarModelosOMR();

};

function desenhar(){

ctx.clearRect(0,0,canvas.width,canvas.height);
ctx.drawImage(imagem,0,0,canvas.width,canvas.height);

ctx.strokeStyle="red";
ctx.lineWidth=3;

ctx.strokeRect(
pontos[0].x,
pontos[0].y,
pontos[3].x-pontos[0].x,
pontos[3].y-pontos[0].y
);

pontos.forEach(p=>{
ctx.fillStyle="red";
ctx.beginPath();
ctx.arc(p.x,p.y,8,0,Math.PI*2);
ctx.fill();
});

if(window.areaTabelaOMR){

ctx.strokeStyle="blue";
ctx.lineWidth=2;

ctx.strokeRect(
window.areaTabelaOMR.x1,
window.areaTabelaOMR.y1,
window.areaTabelaOMR.x2-window.areaTabelaOMR.x1,
window.areaTabelaOMR.y2-window.areaTabelaOMR.y1
);

let cantos=[
{x:window.areaTabelaOMR.x1,y:window.areaTabelaOMR.y1},
{x:window.areaTabelaOMR.x2,y:window.areaTabelaOMR.y1},
{x:window.areaTabelaOMR.x1,y:window.areaTabelaOMR.y2},
{x:window.areaTabelaOMR.x2,y:window.areaTabelaOMR.y2}
];

cantos.forEach(p=>{
ctx.fillStyle="blue";
ctx.beginPath();
ctx.arc(p.x,p.y,7,0,Math.PI*2);
ctx.fill();
});

}

}

function detectarGrade(){

desenhar();

let imgData=ctx.getImageData(0,0,canvas.width,canvas.height);
let data=imgData.data;
let w=canvas.width;
let h=canvas.height;

function brilhoPixel(x,y){
let i=(y*w+x)*4;
return (data[i]+data[i+1]+data[i+2])/3;
}

let candidatos=[];
let tam=26;
let passo=4;

for(let y=0;y<h-tam;y+=passo){
for(let x=0;x<w-tam;x+=passo){

let pretos=0;
let total=0;

for(let yy=0;yy<tam;yy+=2){
for(let xx=0;xx<tam;xx+=2){

if(brilhoPixel(x+xx,y+yy)<90) pretos++;

total++;

}
}

let densidade=pretos/total;

let cx=x+tam/2;
let cy=y+tam/2;

let margemX=w*0.08;
let margemY=h*0.08;

if(
densidade>0.55 &&
cx>margemX &&
cx<w-margemX &&
cy>margemY &&
cy<h-margemY
){
candidatos.push({
x:cx,
y:cy,
densidade:densidade
});
}

}
}

let filtrados=[];

candidatos
.sort((a,b)=>b.densidade-a.densidade)
.forEach(c=>{

let perto=filtrados.some(f=>{
return Math.hypot(f.x-c.x,f.y-c.y)<35;
});

if(!perto) filtrados.push(c);

});

if(filtrados.length<4){
document.getElementById("resultado").innerHTML=
"⚠ Não encontrei os 4 quadrados pretos. Ajuste manualmente.";
return;
}

function canto(tipo){

let melhor=null;

filtrados.forEach(p=>{

let score=0;

if(tipo==="SE") score=p.x+p.y;
if(tipo==="SD") score=(w-p.x)+p.y;
if(tipo==="IE") score=p.x+(h-p.y);
if(tipo==="ID") score=(w-p.x)+(h-p.y);

if(!melhor || score<melhor.score){
melhor={...p,score:score};
}

});

return melhor;

}

let se=canto("SE");
let sd=canto("SD");
let ie=canto("IE");
let id=canto("ID");

pontos=[
{x:se.x,y:se.y},
{x:sd.x,y:sd.y},
{x:ie.x,y:ie.y},
{x:id.x,y:id.y}
];

let xMin=Math.min(se.x,ie.x);
let xMax=Math.max(sd.x,id.x);
let yMin=Math.min(se.y,sd.y);
let yMax=Math.max(ie.y,id.y);

let largura=xMax-xMin;
let altura=yMax-yMin;

let modelos=JSON.parse(localStorage.getItem("modelosOMR"))||[];
let modeloSelecionado=document.getElementById("modeloOMR").value;

let calibracao=modeloSelecionado!=="" ? modelos[modeloSelecionado] : null;

let areaCalibrada=calibracao ? calibracao.area : {
x1:0.28,
x2:0.14,
y1:0.07,
y2:0.10
};

window.areaTabelaOMR={
x1:xMin+largura*areaCalibrada.x1,
x2:xMax-largura*areaCalibrada.x2,
y1:yMin+altura*areaCalibrada.y1,
y2:yMax-altura*areaCalibrada.y2
};

desenhar();

document.getElementById("resultado").innerHTML=
"✅ Área da tabela OMR detectada. Ajuste o retângulo azul se necessário.";

}

document.getElementById("detectarGrade").onclick=function(){
detectarGrade();
};

document.getElementById("foto").onchange=function(e){

let arquivo=e.target.files[0];

if(!arquivo) return;

window.areaTabelaOMR=null;

imagem.src=URL.createObjectURL(arquivo);

imagem.onload=function(){

canvas.height=canvas.width*(imagem.height/imagem.width);

pontos=[
{x:canvas.width*0.20,y:canvas.height*0.15},
{x:canvas.width*0.85,y:canvas.height*0.15},
{x:canvas.width*0.20,y:canvas.height*0.90},
{x:canvas.width*0.85,y:canvas.height*0.90}
];

desenhar();

document.getElementById("painelCorrecao").style.display="block";

};

};

function pegarPosicao(e){

let rect=canvas.getBoundingClientRect();
let toque=e.touches ? e.touches[0] : e;

return {
x:toque.clientX-rect.left,
y:toque.clientY-rect.top
};

}

function iniciarArrasto(e){

let pos=pegarPosicao(e);

arrastandoAzul=null;
arrastando=null;

if(window.areaTabelaOMR){

let cantos=[
{x:window.areaTabelaOMR.x1,y:window.areaTabelaOMR.y1},
{x:window.areaTabelaOMR.x2,y:window.areaTabelaOMR.y1},
{x:window.areaTabelaOMR.x1,y:window.areaTabelaOMR.y2},
{x:window.areaTabelaOMR.x2,y:window.areaTabelaOMR.y2}
];

cantos.forEach((p,i)=>{
if(Math.hypot(pos.x-p.x,pos.y-p.y)<25){
arrastandoAzul=i;
}
});

if(arrastandoAzul!==null) return;

}

pontos.forEach((p,i)=>{
if(Math.hypot(pos.x-p.x,pos.y-p.y)<25){
arrastando=i;
}
});

}

function mover(e){

if(arrastando===null && arrastandoAzul===null) return;

e.preventDefault();

let pos=pegarPosicao(e);

if(arrastandoAzul!==null && window.areaTabelaOMR){

if(arrastandoAzul===0){
window.areaTabelaOMR.x1=pos.x;
window.areaTabelaOMR.y1=pos.y;
}

if(arrastandoAzul===1){
window.areaTabelaOMR.x2=pos.x;
window.areaTabelaOMR.y1=pos.y;
}

if(arrastandoAzul===2){
window.areaTabelaOMR.x1=pos.x;
window.areaTabelaOMR.y2=pos.y;
}

if(arrastandoAzul===3){
window.areaTabelaOMR.x2=pos.x;
window.areaTabelaOMR.y2=pos.y;
}

desenhar();
return;

}

pontos[arrastando].x=pos.x;
pontos[arrastando].y=pos.y;

if(arrastando===0){
pontos[1].y=pos.y;
pontos[2].x=pos.x;
}

if(arrastando===1){
pontos[0].y=pos.y;
pontos[3].x=pos.x;
}

if(arrastando===2){
pontos[0].x=pos.x;
pontos[3].y=pos.y;
}

if(arrastando===3){
pontos[1].x=pos.x;
pontos[2].y=pos.y;
}

desenhar();

}

function pararArrasto(){
arrastando=null;
arrastandoAzul=null;
}

canvas.addEventListener("mousedown",iniciarArrasto);
canvas.addEventListener("mousemove",mover);
canvas.addEventListener("mouseup",pararArrasto);

canvas.addEventListener("touchstart",iniciarArrasto);
canvas.addEventListener("touchmove",mover);
canvas.addEventListener("touchend",pararArrasto);

document.getElementById("debugVisual").onclick=function(){

mostrarDebug=!mostrarDebug;

this.innerHTML=
mostrarDebug
? "👁 Debug Visual: Ligado"
: "👁 Debug Visual: Desligado";

};

document.getElementById("analisar").onclick=function(){

if(document.getElementById("turmaSelecionada").value===""){
alert("📚 Selecione uma turma.");
return;
}

if(document.getElementById("aluno").value===""){
alert("👨‍🎓 Selecione um aluno.");
return;
}

if(document.getElementById("gabarito").value.trim()===""){
alert("📝 Digite um gabarito.");
return;
}

desenhar();

let gabarito=document.getElementById("gabarito").value
.toUpperCase()
.replaceAll(" ","")
.split(",")
.filter(item=>item.trim()!=="");

let totalQuestoes=parseInt(document.getElementById("totalQuestoes").value) || gabarito.length;

let valorProva=parseFloat(document.getElementById("valorProva").value.replace(",", ".")) || 10;

let modelos=JSON.parse(localStorage.getItem("modelosOMR"))||[];
let modeloSelecionado=document.getElementById("modeloOMR").value;

let calibracao=modeloSelecionado!=="" ? modelos[modeloSelecionado] : null;

let configOMR=calibracao ? calibracao.omr : {
alternativas:["A","B","C","D"],
colunas:[0.18,0.40,0.62,0.84],
topoBolhas:0.04,
baixoBolhas:0.04,
raioLeitura:5,
limiteMarcado:0.18,
diferencaMinima:0.05
};

let respostas=[];

function pontoGrade(u,v){

if(window.areaTabelaOMR){

return{
x:window.areaTabelaOMR.x1+(window.areaTabelaOMR.x2-window.areaTabelaOMR.x1)*u,
y:window.areaTabelaOMR.y1+(window.areaTabelaOMR.y2-window.areaTabelaOMR.y1)*v
};

}

let topo={
x:pontos[0].x+(pontos[1].x-pontos[0].x)*u,
y:pontos[0].y+(pontos[1].y-pontos[0].y)*u
};

let baixo={
x:pontos[2].x+(pontos[3].x-pontos[2].x)*u,
y:pontos[2].y+(pontos[3].y-pontos[2].y)*u
};

return{
x:topo.x+(baixo.x-topo.x)*v,
y:topo.y+(baixo.y-topo.y)*v
};

}

let alturaUtil=1-configOMR.topoBolhas-configOMR.baixoBolhas;

for(let linha=0;linha<totalQuestoes;linha++){

let leituras=[];

let v=configOMR.topoBolhas+((linha+0.5)*alturaUtil/totalQuestoes);

for(let col=0;col<configOMR.alternativas.length;col++){

let ponto=pontoGrade(configOMR.colunas[col],v);

let x=ponto.x;
let y=ponto.y;
let raio=configOMR.raioLeitura;

let rx=Math.max(0,Math.floor(x-raio));
let ry=Math.max(0,Math.floor(y-raio));
let rw=raio*2;
let rh=raio*2;

if(rx+rw>canvas.width) rw=canvas.width-rx;
if(ry+rh>canvas.height) rh=canvas.height-ry;

let dados=ctx.getImageData(rx,ry,rw,rh).data;

let escuros=0;
let total=0;

for(let i=0;i<dados.length;i+=4){

let brilho=(dados[i]+dados[i+1]+dados[i+2])/3;

if(brilho<100) escuros++;

total++;

}

let densidade=escuros/total;

leituras.push({
letra:configOMR.alternativas[col],
densidade:densidade
});

if(mostrarDebug){

ctx.strokeStyle="lime";
ctx.lineWidth=2;
ctx.strokeRect(rx,ry,rw,rh);

ctx.fillStyle="red";
ctx.font="12px Arial";
ctx.fillText(configOMR.alternativas[col],x-4,y-13);

}

}

leituras.sort((a,b)=>b.densidade-a.densidade);

let melhor=leituras[0];
let segunda=leituras[1];

let marcada="-";

if(melhor.densidade>=configOMR.limiteMarcado){

if((melhor.densidade-segunda.densidade)<configOMR.diferencaMinima){
marcada="⚠";
}else{
marcada=melhor.letra;
}

}

respostas.push(marcada);

}

let acertos=0;
let detalhes="";
let totalRevisao=0;

for(let i=0;i<totalQuestoes;i++){

let correta=gabarito[i] || "?";
let marcada=respostas[i] || "?";
let revisao="";

if(marcada==="⚠" || marcada==="-"){
revisao=" ⚠ Revisar manualmente";
totalRevisao++;
}

if(correta===marcada){
acertos++;
detalhes+="Questão "+(i+1)+" ✅ marcou "+marcada+revisao+"<br>";
}else{
detalhes+="Questão "+(i+1)+" ❌ marcou "+marcada+" | correto "+correta+revisao+"<br>";
}

}

let percentual=(acertos/totalQuestoes)*100;
let notaFinal=(acertos/totalQuestoes)*valorProva;

let nomeAluno=document.getElementById("aluno").value || "Sem nome";

ctx.fillStyle="green";
ctx.font="bold 18px Arial";
ctx.fillText("NOTA: "+notaFinal.toFixed(1)+"/"+valorProva,20,30);

ctx.fillStyle="blue";
ctx.font="bold 16px Arial";
ctx.fillText(nomeAluno,20,55);

let historico=JSON.parse(localStorage.getItem("historico"))||[];

historico.push({
nome:nomeAluno,
imagem:canvas.toDataURL("image/png"),
turma:document.getElementById("turmaSelecionada").value,
nota:notaFinal.toFixed(1)+"/"+valorProva,
notaBruta:acertos+"/"+totalQuestoes,
valorProva:valorProva,
habilidadeBNCC:document.getElementById("habilidadeProva").value,
descritor:document.getElementById("descritorProva").value,
notaFinal:notaFinal.toFixed(1),
acertos:acertos,
totalQuestoes:totalQuestoes,
percentual:percentual.toFixed(1)+"%",
percentualNumero:percentual,
revisoes:totalRevisao,
data:new Date().toLocaleDateString(),
hora:new Date().toLocaleTimeString(),
respostas:respostas.join(", "),
gabarito:gabarito.join(", "),
detalhes:detalhes
});

localStorage.setItem("historico",JSON.stringify(historico));

let corNota="red";

if(percentual>=70) corNota="green";
else if(percentual>=50) corNota="orange";

document.getElementById("resultado").innerHTML=
"📋 Respostas:<br><br>"+
respostas.join(", ")+
"<br><br>👨‍🎓 Aluno: "+nomeAluno+
"<br>✅ Acertos: "+acertos+"/"+totalQuestoes+
"<br><span style='color:"+corNota+";font-weight:bold;'>📊 Nota: "+
notaFinal.toFixed(1)+" / "+valorProva+
" ("+percentual.toFixed(1)+"%)</span>"+
"<br><br><b>Detalhes:</b><br>"+
detalhes+
"<br><br>⚠ Revisões sugeridas: "+totalRevisao+
"<br><br>💾 Salvo no histórico";

};

}

function abrirResumo(){

let historicoOriginal=JSON.parse(localStorage.getItem("historico"))||[];
let turmas=JSON.parse(localStorage.getItem("turmas"))||[];

document.body.innerHTML=`
<h1>📊 Estatísticas</h1>

<select id="filtroResumoTurma">
<option value="">📚 Todas as turmas</option>
</select>

<br><br>

<div id="areaResumo"></div>

<button onclick="exportarPDF()">📄 Exportar PDF</button>

<button onclick="voltarHome()">
⬅ Voltar
</button>
` + barraInferior("resumo");

aplicarTemaSalvo();

let filtro=document.getElementById("filtroResumoTurma");

turmas.forEach(turma=>{
filtro.innerHTML+=`
<option value="${turma.nome}">
${turma.nome}
</option>
`;
});

function renderizarResumo(){

let turmaSelecionada=filtro.value;

let historico=historicoOriginal.filter(aluno=>{
return turmaSelecionada==="" ||
(aluno.turma || "Sem turma")===turmaSelecionada;
});

let total=historico.length;

let totalRevisoes=historico.reduce((soma,aluno)=>{
return soma+(aluno.revisoes || 0);
},0);

let alunos=historico.map(aluno=>{
let valor=parseFloat((aluno.nota || "0/1").split("/")[0]);

return {
nome:aluno.nome || "Sem nome",
notaTexto:aluno.nota || "0/0",
nota:valor,
percentual:aluno.percentual || "",
data:aluno.data || "",
turma:aluno.turma || "Sem turma"
};
});

alunos.sort((a,b)=>b.nota-a.nota);

let notas=alunos.map(a=>a.nota);

let media=0;
let maior=0;
let menor=0;

if(notas.length>0){

media=
notas.reduce((a,b)=>a+b,0)
/
notas.length;

maior=Math.max(...notas);
menor=Math.min(...notas);

}

let alunosAtencao="";

alunos.forEach(aluno=>{

if(aluno.nota < media){

alunosAtencao+=`
<div class="card" style="
border-left:8px solid var(--erro);
text-align:left;
">
<strong>🚨 ${aluno.nome}</strong>
<br><br>
📊 Nota: ${aluno.notaTexto}
<br>
🏫 Turma: ${aluno.turma}
</div>
`;
}

});

let ranking="";

alunos.forEach((aluno,index)=>{
ranking+=`
<div>
🏆 ${index+1}º - ${aluno.nome} — ${aluno.notaTexto}
<br>
📚 ${aluno.turma}
</div>
<br>
`;
});

let grafico="";

for(let nota=10;nota>=0;nota--){

let quantidade=notas.filter(n=>n===nota).length;

if(quantidade>0){

grafico+=`
<div style="margin:8px 0;text-align:left;">
${nota}

<div style="
height:25px;
background:#4A6CF7;
width:${quantidade*40}px;
border-radius:10px;
display:inline-block;
margin-left:10px;
color:white;
padding-left:10px;
line-height:25px;
">
${quantidade}
</div>
</div>
`;
}

}

let alunosAcima8 = 0;
let alunosAbaixo5 = 0;
let melhorMedia = 0;
let melhorAluno = "-";

alunos.forEach(aluno=>{

if(aluno.nota >= 8){
alunosAcima8++;
}

if(aluno.nota < 5){
alunosAbaixo5++;
}

if(aluno.nota > melhorMedia){
melhorMedia = aluno.nota;
melhorAluno = aluno.nome;
}

});

document.getElementById("areaResumo").innerHTML=`
<div>👨‍🎓 Total corrigidas: ${total}</div>
<br>

<div>⚠ Revisões sugeridas: ${totalRevisoes}</div>
<br>

<div>📈 Média: ${media.toFixed(1)}</div>
<br>

<div>🏆 Maior nota: ${maior}</div>
<br>

<div>📉 Menor nota: ${menor}</div>
<br>

<div>🥇 Melhor média: ${melhorAluno} (${melhorMedia.toFixed(1)})</div>
<br>

<div>⭐ Acima de 8: ${alunosAcima8}</div>
<br>

<div>🚨 Abaixo de 5: ${alunosAbaixo5}</div>
<br>

<h2>🚨 Necessitam Atenção</h2>

${alunosAtencao || "<p>Nenhum aluno abaixo da média.</p>"}

<br>
<h2>🏆 Ranking</h2>
${ranking || "<p>Nenhum aluno corrigido ainda.</p>"}

<h2>📊 Gráfico da Turma</h2>
${grafico || "<p>Sem dados ainda.</p>"}
`;

}

filtro.onchange=function(){
renderizarResumo();
};

renderizarResumo();

}

function abrirHistorico(){

let historico=JSON.parse(localStorage.getItem("historico"))||[];

let lista="";

historico.forEach((aluno,index)=>{

let notaNumero=parseFloat(
(aluno.nota || "0/1").split("/")[0]
);

let corLateral="#EF4444";

if(notaNumero>=7){
corLateral="#22C55E";
}
else if(notaNumero>=5){
corLateral="#F59E0B";
}

lista+=`
<li
class="itemHistorico"
data-turma="${aluno.turma || 'Sem turma'}"
data-nome="${(aluno.nome || 'Sem nome').toLowerCase()}"
onclick="verDetalhes(${index})"
style="
border-left:8px solid ${corLateral};
padding:16px;
border-radius:18px;
margin-bottom:14px;
cursor:pointer;
"
>

<div style="
font-size:16px;
font-weight:600;
margin-bottom:10px;
">
👨‍🎓 ${aluno.nome || "Sem nome"}
</div>

<div>
🏫 Turma: ${aluno.turma || "Sem turma"}
</div>

<br>

<div>
📊 Nota: ${aluno.nota}
</div>

<div>
📅 ${aluno.data}
</div>

<div>
⚠ Revisões: ${aluno.revisoes || 0}
</div>

</li>
`;
});

document.body.innerHTML=`
<h1>👨‍🎓 Histórico</h1>
<input
id="buscaHistorico"
placeholder="🔍 Buscar aluno..."
>

<select id="filtroTurma">
<option value="">📚 Todas as turmas</option>
</select>

<br><br>

<div id="estatisticasTurmaHistorico"></div>

<br>

<ul>
${lista || "<p>Nenhum registro ainda.</p>"}
</ul>

<button onclick="exportarPDF()">📄 Exportar PDF</button>

<button onclick="voltarHome()">
⬅ Voltar
</button>
` + barraInferior("historico");

let filtro=document.getElementById("filtroTurma");

let turmas=JSON.parse(localStorage.getItem("turmas"))||[];

turmas.forEach(turma=>{

filtro.innerHTML+=`
<option value="${turma.nome}">
${turma.nome}
</option>
`;

});

let busca=document.getElementById("buscaHistorico");

function filtrarHistorico(){

let textoBusca=busca.value.toLowerCase();
let turmaSelecionada=filtro.value;

let itens=document.querySelectorAll(".itemHistorico");

let registrosFiltrados=historico.filter(aluno=>{
return turmaSelecionada==="" ||
(aluno.turma || "Sem turma")===turmaSelecionada;
});

itens.forEach(item=>{

let turma=item.dataset.turma;
let nome=item.dataset.nome;

let combinaNome=nome.includes(textoBusca);
let combinaTurma=turmaSelecionada==="" || turma===turmaSelecionada;

if(combinaNome && combinaTurma){
item.style.display="block";
}else{
item.style.display="none";
}

});

let areaEstatisticas=
document.getElementById("estatisticasTurmaHistorico");

if(turmaSelecionada===""){

areaEstatisticas.innerHTML="";

}else{

let notas=registrosFiltrados.map(aluno=>{
return parseFloat((aluno.nota || "0/1").split("/")[0]);
});

let media=0;
let maior=0;
let menor=0;

let aprovados=0;
let recuperacao=0;
let reprovados=0;

if(notas.length>0){

media=notas.reduce((a,b)=>a+b,0)/notas.length;
maior=Math.max(...notas);
menor=Math.min(...notas);

notas.forEach(nota=>{

if(nota>=7){
aprovados++;
}
else if(nota>=5){
recuperacao++;
}
else{
reprovados++;
}

});

}

let ranking=[...registrosFiltrados];

ranking.sort((a,b)=>{

let notaA=parseFloat((a.nota || "0/1").split("/")[0]);
let notaB=parseFloat((b.nota || "0/1").split("/")[0]);

return notaB-notaA;

});

let top3HTML="";

if(ranking[0]){
top3HTML+="🥇 "+(ranking[0].nome || "Aluno")+" — "+(ranking[0].nota || "-")+"<br>";
}

if(ranking[1]){
top3HTML+="🥈 "+(ranking[1].nome || "Aluno")+" — "+(ranking[1].nota || "-")+"<br>";
}

if(ranking[2]){
top3HTML+="🥉 "+(ranking[2].nome || "Aluno")+" — "+(ranking[2].nota || "-");
}

areaEstatisticas.innerHTML=`
<div class="card">
<h3>📚 ${turmaSelecionada}</h3>

<p>👨‍🎓 Correções: ${registrosFiltrados.length}</p>
<p>📈 Média: ${media.toFixed(1)}</p>

<p>🟢 Aprovados: ${aprovados}</p>
<p>🟡 Recuperação: ${recuperacao}</p>
<p>🔴 Reprovados: ${reprovados}</p>

<hr>

<p>
<strong>🏆 Destaques da Turma</strong><br><br>
${top3HTML || "Sem dados suficientes"}
</p>

<p>🏆 Maior nota: ${maior}</p>
<p>📉 Menor nota: ${menor}</p>
</div>
`;

}

}

busca.oninput=filtrarHistorico;

filtro.onchange=function(){
filtrarHistorico();
};

filtrarHistorico();

aplicarTemaSalvo();

}

function verDetalhes(index){

let historico=JSON.parse(localStorage.getItem("historico"))||[];
let aluno=historico[index];

document.body.innerHTML=`
<div class="cabecalho">

<img src="./logo.png" style="
width:90px;
display:block;
margin:auto;
margin-bottom:10px;
box-shadow:none;
">

<h1 style="
color:white;
margin:0;
">
👨‍🎓 Boletim do Aluno
</h1>

<p>
Resultado detalhado da correção
</p>

</div>

<div class="card">
<h2>${aluno.nome || "Sem nome"}</h2>

<div>🏫 Turma: ${aluno.turma || "Sem turma"}</div>
<br>

<div>📊 Nota: ${aluno.nota || "-"}</div>
<br>

<div>📈 Percentual: ${aluno.percentual || "Não salvo"}</div>
<br>

<div>📅 Data: ${aluno.data || "-"}</div>
<br>

<div>⚠ Revisões: ${aluno.revisoes || 0}</div>

<br>

<div>📚 Habilidade BNCC: ${aluno.habilidadeBNCC || "Não informada"}</div>
<br>

<div>📊 Descritor: ${aluno.descritor || "Não informado"}</div>

</div>

<div class="card">
<h2>🖼 Prova Corrigida</h2>

${aluno.imagem ? `
<img src="${aluno.imagem}" style="
width:100%;
max-width:320px;
border-radius:20px;
border:3px solid var(--borda);
">
` : "<p>Imagem não salva.</p>"}
</div>

<div class="card">
<h2>📝 Gabarito</h2>
${aluno.gabarito || "Não salvo"}
</div>

<div class="card">
<h2>✅ Respostas Marcadas</h2>
${aluno.respostas || "Não salvo"}
</div>

<div class="card">
<h2>🔍 Análise das Questões</h2>
${aluno.detalhes || "Detalhes não salvos"}
</div>

<button onclick="excluirRegistro(${index})">🗑 Excluir Registro</button>

<button onclick="abrirHistorico()">⬅ Voltar ao Histórico</button>
` + barraInferior();

aplicarTemaSalvo();

}

function excluirRegistro(index){

let confirmar=confirm("Deseja excluir este registro?");

if(!confirmar) return;

let historico=JSON.parse(localStorage.getItem("historico"))||[];

historico.splice(index,1);

localStorage.setItem("historico",JSON.stringify(historico));

abrirHistorico();
}

function exportarPDF(){

let historico=JSON.parse(localStorage.getItem("historico"))||[];

let filtroTurma=document.getElementById("filtroTurma");
let turmaSelecionada=filtroTurma ? filtroTurma.value : "";

let registros=historico.filter(aluno=>{
return turmaSelecionada==="" ||
(aluno.turma || "Sem turma")===turmaSelecionada;
});

let notas=[];

registros.forEach(aluno=>{
let nota=parseFloat((aluno.nota || "0/1").split("/")[0]);
notas.push(nota);
});

let media=0;
let maior=0;
let menor=0;

if(notas.length>0){
media=notas.reduce((a,b)=>a+b,0)/notas.length;
maior=Math.max(...notas);
menor=Math.min(...notas);
}

let alunos=[...registros];

alunos.sort((a,b)=>{
let notaA=parseFloat((a.nota || "0/1").split("/")[0]);
let notaB=parseFloat((b.nota || "0/1").split("/")[0]);
return notaB-notaA;
});

let linhas="";

alunos.forEach((aluno,index)=>{
linhas+=`
<tr>
<td>${index+1}º</td>
<td>${aluno.nome || "Sem nome"}</td>
<td>${aluno.turma || "Sem turma"}</td>
<td>${aluno.nota || "-"}</td>
<td>${aluno.percentual || ""}</td>
<td>${aluno.revisoes || 0}</td>
<td>${aluno.data || "-"}</td>
</tr>
`;
});

let dataRelatorio=new Date().toLocaleDateString();

document.body.innerHTML=`
<div style="
background:white;
color:#1F2937;
padding:24px;
font-family:Arial,sans-serif;
">

<div style="
text-align:center;
border-bottom:4px solid #4A6CF7;
padding-bottom:18px;
margin-bottom:20px;
">

<img src="logo2.png" style="
width:170px;
display:block;
margin:auto;
box-shadow:none;
border-radius:0;
">

<h1 style="
color:#4A6CF7;
margin:10px 0 5px;
">
Relatório Ajuda+Prof
</h1>

<p style="
color:#6B7280;
margin:0;
">
Corrija provas, organize tarefas e ensine melhor
</p>

</div>

<div style="
background:#F8FAFC;
border:1px solid #E5E7EB;
border-radius:18px;
padding:16px;
margin-bottom:20px;
">

<h2 style="
color:#1F2937;
margin-top:0;
">
📚 ${
turmaSelecionada
? "Turma: "+turmaSelecionada
: "Todas as turmas"
}
</h2>

<div style="
display:grid;
grid-template-columns:repeat(4,1fr);
gap:10px;
text-align:center;
">

<div>
<strong style="font-size:22px;color:#4A6CF7;">${registros.length}</strong>
<br>
<small>Correções</small>
</div>

<div>
<strong style="font-size:22px;color:#4A6CF7;">${media.toFixed(1)}</strong>
<br>
<small>Média</small>
</div>

<div>
<strong style="font-size:22px;color:#22C55E;">${maior}</strong>
<br>
<small>Maior nota</small>
</div>

<div>
<strong style="font-size:22px;color:#EF4444;">${menor}</strong>
<br>
<small>Menor nota</small>
</div>

</div>

</div>

<h2 style="color:#1F2937;">🏆 Ranking</h2>

<table width="100%" cellpadding="8" style="
border-collapse:collapse;
background:white;
font-size:13px;
">

<tr style="
background:#4A6CF7;
color:white;
">
<th>Posição</th>
<th>Aluno</th>
<th>Turma</th>
<th>Nota</th>
<th>%</th>
<th>Revisões</th>
<th>Data</th>
</tr>

${linhas || `
<tr>
<td colspan="7" style="text-align:center;padding:20px;">
Nenhum registro encontrado.
</td>
</tr>
`}

</table>

<br>

<p style="
text-align:right;
color:#6B7280;
font-size:12px;
">
Relatório gerado em ${dataRelatorio}
</p>

<br>

<button onclick="window.print()">🖨 Imprimir / Salvar PDF</button>

<button onclick="abrirHistorico()">⬅ Voltar ao Histórico</button>

</div>
`;

}
function abrirTurmas(){

document.body.innerHTML=`
<h1>📚 Turmas</h1>

<input id="nomeTurma" placeholder="Nome da turma. Ex: 6º Ano A">

<br><br>

<button id="criarTurma">➕ Criar Turma</button>

<br><br>

<div id="listaTurmas"></div>

<button onclick="voltarHome()">
⬅ Voltar
</button>
` + barraInferior();

aplicarTemaSalvo();

let turmas=JSON.parse(localStorage.getItem("turmas"))||[];

function atualizarTurmas(){

let lista=document.getElementById("listaTurmas");
lista.innerHTML="";

let historico=JSON.parse(localStorage.getItem("historico"))||[];

turmas.forEach((turma,index)=>{

let alunosCorrigidos=turma.alunos.filter(aluno=>{
return historico.some(registro=>{
return registro.turma===turma.nome && registro.nome===aluno;
});
}).length;

let alunosPendentes=turma.alunos.length-alunosCorrigidos;

let percentualConcluido=0;

if(turma.alunos.length>0){
percentualConcluido=
Math.round(
(alunosCorrigidos/turma.alunos.length)*100
);
}

let corTurma=alunosPendentes>0
? "var(--a)"
: "var(--sucesso)";

lista.innerHTML+=`
<div class="card" style="
text-align:left;
border-left:8px solid ${corTurma};
">

<div style="
font-size:20px;
font-weight:700;
margin-bottom:10px;
">
📚 ${turma.nome}
</div>

<div style="margin-bottom:8px;">
👨‍🎓 ${turma.alunos.length} alunos cadastrados
</div>

<div style="margin-bottom:8px;">
📷 ${alunosCorrigidos} corrigidos
</div>

<div style="margin-bottom:15px;">
⏳ ${alunosPendentes} pendentes
</div>

<div style="
width:100%;
height:10px;
background:#E5E7EB;
border-radius:999px;
overflow:hidden;
margin-bottom:8px;
">

<div style="
height:100%;
width:${percentualConcluido}%;
background:linear-gradient(
90deg,
#22C55E,
#16A34A
);
">
</div>

</div>

<div style="
font-size:13px;
font-weight:700;
color:var(--textoSuave);
margin-bottom:15px;
">
${percentualConcluido}% concluído
</div>

${alunosPendentes>0 ? `
<button onclick="abrirProximoSemNota(${index})">
📷 Corrigir pendente
</button>
` : `
<div style="
color:var(--sucesso);
font-weight:700;
margin-top:10px;
">
✅ Turma concluída
</div>
`}
</div>

<button onclick="abrirDetalhesTurma(${index})">
📂 Abrir Turma
</button>

<button onclick="renomearTurma(${index})">
✏ Renomear Turma
</button>

<button onclick="excluirTurma(${index})">
🗑 Excluir Turma
</button>

</div>
`;

});

}

document.getElementById("criarTurma").onclick=function(){

let nome=document.getElementById("nomeTurma").value.trim();

if(nome===""){
alert("Digite o nome da turma.");
return;
}

turmas.push({
nome:nome,
alunos:[]
});

localStorage.setItem("turmas",JSON.stringify(turmas));

document.getElementById("nomeTurma").value="";

atualizarTurmas();

};

atualizarTurmas();

}

function excluirTurma(index){

let turmas=JSON.parse(localStorage.getItem("turmas"))||[];

let confirmar=confirm(
"Deseja realmente excluir esta turma?"
);

if(!confirmar) return;

let nomeTurma=turmas[index].nome;

let excluirHistorico=confirm(
"Deseja excluir também os registros históricos desta turma?"
);

if(excluirHistorico){

let historico=JSON.parse(localStorage.getItem("historico"))||[];

historico=historico.filter(registro=>{
return registro.turma!==nomeTurma;
});

localStorage.setItem(
"historico",
JSON.stringify(historico)
);

}

turmas.splice(index,1);

localStorage.setItem(
"turmas",
JSON.stringify(turmas)
);

abrirTurmas();

}

function renomearTurma(index){

let turmas=JSON.parse(localStorage.getItem("turmas"))||[];

let novoNome=prompt(
"Digite o novo nome da turma:",
turmas[index].nome
);

if(!novoNome) return;

novoNome=novoNome.trim();

if(novoNome==="") return;

let nomeAntigo=turmas[index].nome;

turmas[index].nome=novoNome;

let atualizarHistorico=confirm(
"Deseja atualizar também os registros antigos dessa turma no histórico?"
);

if(atualizarHistorico){

let historico=JSON.parse(localStorage.getItem("historico"))||[];

historico.forEach(registro=>{

if(registro.turma===nomeAntigo){
registro.turma=novoNome;
}

});

localStorage.setItem(
"historico",
JSON.stringify(historico)
);

}

localStorage.setItem(
"turmas",
JSON.stringify(turmas)
);

abrirTurmas();

}

function abrirDetalhesTurma(index){

let turmas=JSON.parse(localStorage.getItem("turmas"))||[];
let turma=turmas[index];

document.body.innerHTML=`
<h1>📚 ${turma.nome}</h1>

<input
id="nomeAlunoTurma"
placeholder="👨‍🎓 Nome do aluno"
>
<br><br>

<textarea
id="listaAlunosEmMassa"
placeholder="Cole aqui vários alunos, um por linha"
style="
width:90%;
max-width:500px;
height:160px;
padding:18px;
border-radius:18px;
border:1px solid var(--borda);
background:var(--card);
color:var(--texto);
resize:none;
"
></textarea>

<br><br>

<button id="adicionarListaAlunos">
📋 Adicionar Lista
</button>

<br><br>

<button id="adicionarAlunoTurma">➕ Adicionar Aluno</button>

<br><br>

<div id="listaAlunosTurma"></div>

<button onclick="abrirBoletimTurma(${index})">
📊 Boletim da Turma
</button>

<br><br>
<button onclick="abrirTurmas()">⬅ Voltar para Turmas</button>
` + barraInferior();

aplicarTemaSalvo();

function atualizarAlunos(){

let lista=document.getElementById("listaAlunosTurma");
lista.innerHTML="";

turma.alunos.forEach((aluno,i)=>{

lista.innerHTML+=`
<div class="card" style="
display:flex;
justify-content:space-between;
align-items:center;
gap:10px;
text-align:left;
">

<span>
👨‍🎓 ${aluno}
</span>

<div style="
display:flex;
gap:8px;
">

<button onclick="editarAlunoTurma(${index},${i})" style="
width:auto;
margin:0;
padding:10px 14px;
border-radius:12px;
">
✏
</button>

<button onclick="excluirAlunoTurma(${index},${i})" style="
width:auto;
margin:0;
padding:10px 14px;
border-radius:12px;
">
❌
</button>

</div>

</div>
`;

});

}

window.abrirDetalhesTurma=abrirDetalhesTurma;

window.excluirAlunoTurma=function(indexTurma,indexAluno){
  
window.editarAlunoTurma=function(indexTurma,indexAluno){

let turmas=JSON.parse(localStorage.getItem("turmas"))||[];

let nomeAtual=turmas[indexTurma].alunos[indexAluno];

let novoNome=prompt(
"Editar nome do aluno:",
nomeAtual
);

if(!novoNome) return;

novoNome=novoNome.trim();

if(novoNome==="") return;

let nomeAntigo=nomeAtual;
let nomeTurma=turmas[indexTurma].nome;

turmas[indexTurma].alunos[indexAluno]=novoNome;

let atualizarHistorico=confirm(
"Deseja atualizar também os registros antigos desse aluno no histórico?"
);

if(atualizarHistorico){

let historico=JSON.parse(localStorage.getItem("historico"))||[];

historico.forEach(registro=>{

if(
registro.nome===nomeAntigo &&
registro.turma===nomeTurma
){
registro.nome=novoNome;
}

});

localStorage.setItem(
"historico",
JSON.stringify(historico)
);

}

turmas[indexTurma].alunos.sort((a,b)=>
a.localeCompare(b,'pt-BR')
);

localStorage.setItem(
"turmas",
JSON.stringify(turmas)
);

abrirDetalhesTurma(indexTurma);

};

let turmas=JSON.parse(localStorage.getItem("turmas"))||[];

turmas[indexTurma].alunos.splice(indexAluno,1);

localStorage.setItem("turmas",JSON.stringify(turmas));

abrirDetalhesTurma(indexTurma);

};

document.getElementById("adicionarAlunoTurma").onclick=function(){

let nome=document.getElementById("nomeAlunoTurma").value.trim();

if(nome===""){
alert("Digite o nome do aluno.");
return;
}

if(!turma.alunos.includes(nome)){
turma.alunos.push(nome);
}else{
alert("⚠ Este aluno já está cadastrado.");
return;
}

turma.alunos.sort((a,b)=>
a.localeCompare(b,'pt-BR')
);

turmas[index]=turma;

localStorage.setItem("turmas",JSON.stringify(turmas));

document.getElementById("nomeAlunoTurma").value="";

atualizarAlunos();

};

document.getElementById("adicionarListaAlunos").onclick=function(){

let texto=document.getElementById("listaAlunosEmMassa").value.trim();

if(texto===""){
alert("Cole a lista de alunos.");
return;
}

let novosAlunos=texto
.split("\n")
.map(nome=>nome.trim())
.filter(nome=>nome!=="");

novosAlunos.forEach(nome=>{

if(!turma.alunos.includes(nome)){
turma.alunos.push(nome);
}

});

turma.alunos.sort((a,b)=>
a.localeCompare(b,'pt-BR')
);

turmas[index]=turma;

localStorage.setItem("turmas",JSON.stringify(turmas));

document.getElementById("listaAlunosEmMassa").value="";

atualizarAlunos();

};

atualizarAlunos();

}

function abrirBoletimTurma(index){

let turmas=JSON.parse(localStorage.getItem("turmas"))||[];
let historico=JSON.parse(localStorage.getItem("historico"))||[];

let turma=turmas[index];

let registros=historico.filter(item=>{
return item.turma===turma.nome;
});

let notas=[];

registros.forEach(item=>{
let nota=parseFloat(
(item.nota || "0/1").split("/")[0]
);

notas.push(nota);
});

let media=0;
let maior=0;
let menor=0;

let aprovados=0;
let recuperacao=0;
let reprovados=0;

if(notas.length>0){

media=notas.reduce((a,b)=>a+b,0)/notas.length;
maior=Math.max(...notas);
menor=Math.min(...notas);

notas.forEach(nota=>{

if(nota>=7){
aprovados++;
}
else if(nota>=5){
recuperacao++;
}
else{
reprovados++;
}

});

}

let linhas="";
let alunosAcima8=0;
let alunosAbaixo5=0;
let melhorMedia=0;
let melhorAluno="-";

let alunosAtencao="";

turma.alunos.forEach((aluno,posicao)=>{

let notasAluno=registros.filter(item=>item.nome===aluno);

let ultimaNota=notasAluno.length>0
? notasAluno[notasAluno.length-1].nota
: "Sem nota";

let totalProvasAluno=notasAluno.length;
let mediaAluno="Sem média";
let corAluno="var(--primaria)";

if(mediaAluno!=="Sem média"){

if(parseFloat(mediaAluno)>=8){
corAluno="var(--sucesso)";
}
else if(parseFloat(mediaAluno)<5){
corAluno="var(--erro)";
}
else{
corAluno="var(--a)";
}

}

if(totalProvasAluno>0){

let somaNotas=0;

notasAluno.forEach(item=>{

somaNotas+=parseFloat(
(item.nota || "0/1").split("/")[0]
);

});

mediaAluno=(somaNotas/totalProvasAluno).toFixed(1);

}

if(mediaAluno!=="Sem média"){

let mediaNum=parseFloat(mediaAluno);

if(mediaNum>=8){
alunosAcima8++;
}

if(mediaNum<5){
alunosAbaixo5++;
}

if(mediaNum<5){
alunosAtencao+=`
<div class="card" style="
text-align:left;
border-left:8px solid var(--erro);
">
<strong>🚨 ${aluno}</strong>
<br><br>
📈 Média: ${mediaAluno}
<br>
📝 Provas corrigidas: ${totalProvasAluno}
</div>
`;
}

if(mediaNum>melhorMedia){
melhorMedia=mediaNum;
melhorAluno=aluno;
}

}

linhas+=`
<div class="card" style="
text-align:left;
border-left:8px solid ${corAluno};
">
<strong>🏅 ${posicao+1}º - ${aluno}</strong>
<br><br>
📊 Última nota: ${ultimaNota}
${ultimaNota==="Sem nota" ? "<br>⚠ Pendente de correção" : ""}
<br>
📝 Provas corrigidas: ${totalProvasAluno}
<br>
📈 Média: ${mediaAluno}
${totalProvasAluno===0 ? "<br>⚠ Ainda sem correção" : ""}
</div>
`;

});

document.body.innerHTML=`
<h1>📊 Boletim da Turma</h1>

<div class="card">

<h2>📚 ${turma.nome}</h2>

<div>👨‍🎓 Avaliações: ${registros.length}</div>
<br>

<div>📈 Média da turma: ${media.toFixed(1)}</div>
<br>

<div>🏆 Melhor nota: ${maior}</div>
<br>

<div>📉 Menor nota: ${menor}</div>
<br>

<div>
🥇 Melhor média: ${melhorAluno}
(${melhorMedia.toFixed(1)})
</div>

<br>

<div>
⭐ Acima de 8: ${alunosAcima8}
</div>

<br>

<div>
🚨 Abaixo de 5: ${alunosAbaixo5}
</div>

<div class="card">
<h2>🚨 Alunos que precisam de atenção</h2>
${alunosAtencao || "<p>Nenhum aluno abaixo de 5.</p>"}
</div>

<br>
</div>

<br>

<div class="card" style="
border:3px solid #F59E0B;
background:linear-gradient(
135deg,
rgba(245,158,11,.12),
rgba(245,158,11,.03)
);
">

<div style="
font-size:22px;
font-weight:700;
margin-bottom:10px;
">
🥇 DESTAQUE DA TURMA
</div>

<div style="
font-size:18px;
margin-bottom:8px;
">
👨‍🎓 ${melhorAluno}
</div>

<div>
📈 Média: ${melhorMedia.toFixed(1)}
</div>

</div>

<br>
<h2>🏅 Alunos</h2>

${linhas || "<p>Nenhum aluno cadastrado.</p>"}

<button onclick="abrirProximoSemNota(${index})">
➡ Próximo aluno sem nota
</button>

<br><br>
<button onclick="window.print()">
🖨 Imprimir / Salvar PDF
</button>

<br><br>

<button onclick="abrirDetalhesTurma(${index})">
⬅ Voltar para Turma
</button>
` + barraInferior();

aplicarTemaSalvo();

}

function abrirProximoSemNota(index){

let turmas=JSON.parse(localStorage.getItem("turmas"))||[];
let historico=JSON.parse(localStorage.getItem("historico"))||[];

let turma=turmas[index];

let alunoSemNota=turma.alunos.find(aluno=>{

let temNota=historico.some(item=>{
return item.turma===turma.nome && item.nome===aluno;
});

return !temNota;

});

if(!alunoSemNota){
alert("✅ Todos os alunos dessa turma já possuem nota.");
return;
}

abrirCorrecao();

setTimeout(()=>{

document.getElementById("turmaSelecionada").value=turma.nome;

let selectAluno=document.getElementById("aluno");

selectAluno.innerHTML=`
<option value="">👨‍🎓 Selecionar aluno</option>
`;

turma.alunos.forEach(aluno=>{

selectAluno.innerHTML+=`
<option value="${aluno}">
${aluno}
</option>
`;

});

selectAluno.value=alunoSemNota;

},300);

}

function abrirConfiguracoes(){

document.body.innerHTML=`
<h1>Configurações</h1>

<div class="card cardConfig">
<span class="material-icons-round iconeConfig">dark_mode</span>
<div>
<h2>Aparência</h2>
<p>Alterne entre modo claro e escuro.</p>
</div>
<button onclick="alternarTema()">Alternar</button>
</div>

<div class="card cardConfig">
<span class="material-icons-round iconeConfig">backup</span>
<div>
<h2>Backup</h2>
<p>Salve uma cópia dos dados do aplicativo.</p>
</div>
<button onclick="fazerBackup()">Criar backup</button>
</div>

<div class="card cardConfig">
<span class="material-icons-round iconeConfig">restore</span>
<div>
<h2>Restaurar</h2>
<p>Carregue dados de um backup salvo.</p>
</div>
<button onclick="document.getElementById('arquivoBackupConfig').click()">
Restaurar
</button>

<input
id="arquivoBackupConfig"
type="file"
accept=".json"
style="display:none;"
onchange="restaurarBackup(event)"
>
</div>

<button onclick="voltarHome()">Voltar</button>
` + barraInferior();

aplicarTemaSalvo();

}

function fazerBackup(){

let backup={

historico:
JSON.parse(localStorage.getItem("historico"))||[],

turmas:
JSON.parse(localStorage.getItem("turmas"))||[],

tarefas:
JSON.parse(localStorage.getItem("tarefas"))||[],

agenda:
JSON.parse(localStorage.getItem("agenda"))||[],

gabarito:
localStorage.getItem("gabarito")||""

};

let conteudo=
JSON.stringify(backup,null,2);

let blob=new Blob(
[conteudo],
{type:"application/json"}
);

let url=URL.createObjectURL(blob);

let a=document.createElement("a");

a.href=url;

a.download=
"AjudaProf_Backup_"+new Date().toISOString().split("T")[0]+".json";

a.click();

URL.revokeObjectURL(url);

mostrarToast("✅ Backup criado com sucesso.");

}

function abrirFavoritosBNCC(){

let favoritos=
JSON.parse(localStorage.getItem("bnccFavoritos"))||[];

document.body.innerHTML=`
<h1>⭐ Favoritos BNCC</h1>

<input
id="buscaFavoritosBNCC"
placeholder="🔍 Buscar favorito por código, disciplina ou habilidade..."
>

<br><br>

<button onclick="limparFavoritosBNCC()">
🧹 Limpar Favoritos
</button>

<br><br>

<div id="listaFavoritosBNCC"></div>


<button onclick="voltarHome()">
⬅ Voltar
</button>
` + barraInferior();

aplicarTemaSalvo();

let html="";

favoritos.forEach(codigo=>{

let item=bancoBNCC.find(h=>h.codigo===codigo);

if(item){

html+=`
<div class="card" style="text-align:left;">

<h3>⭐ ${item.codigo}</h3>

<div style="
display:flex;
gap:8px;
flex-wrap:wrap;
margin-bottom:12px;
">

<span style="
background:#2563EB;
color:white;
padding:6px 10px;
border-radius:999px;
font-size:12px;
">
📘 ${item.disciplina || "Disciplina não informada"}
</span>

<span style="
background:#059669;
color:white;
padding:6px 10px;
border-radius:999px;
font-size:12px;
">
🎒 ${item.anos ? item.anos.join(", ") : item.ano || "Ano não informado"}
</span>

</div>

<p>
<strong>✅ Habilidade:</strong><br>
${item.habilidade || item.descricao || "Descrição não encontrada."}
</p>

<button onclick="copiarHabilidadeBNCC('${item.codigo}')">
📋 Copiar
</button>

<button onclick="abrirDetalheBNCC('${item.codigo}')">
🔎 Ver detalhes
</button>

<button onclick="removerFavoritoBNCC('${item.codigo}')">
🗑 Remover
</button>

</div>
`;

}else{

html+=`
<div class="card">
⚠ ${codigo} não foi encontrado no banco BNCC.
</div>
`;

}

});

document.getElementById("listaFavoritosBNCC").innerHTML=
html || "<div class='card'>Nenhum favorito salvo.</div>";

document.getElementById("buscaFavoritosBNCC").oninput=function(){

let busca=this.value.toUpperCase().trim();

let cards=document.querySelectorAll("#listaFavoritosBNCC .card");

cards.forEach(card=>{

let texto=card.innerText.toUpperCase();

if(texto.includes(busca)){
card.style.display="block";
}else{
card.style.display="none";
}

});

};

}

function removerFavoritoBNCC(codigo){

let favoritos =
JSON.parse(localStorage.getItem("bnccFavoritos")) || [];

favoritos = favoritos.filter(item => item !== codigo);

localStorage.setItem(
"bnccFavoritos",
JSON.stringify(favoritos)
);

abrirFavoritosBNCC();

}

function limparFavoritosBNCC(){

let confirmar=confirm(
"Deseja remover todas as habilidades favoritas?"
);

if(!confirmar) return;

localStorage.removeItem("bnccFavoritos");

alert("🧹 Favoritos limpos.");

abrirFavoritosBNCC();

}

function restaurarBackup(event){

let arquivo=event.target.files[0];

if(!arquivo) return;

let leitor=new FileReader();

leitor.onload=function(e){

try{

let backup=JSON.parse(e.target.result);

let confirmar=confirm(
"Restaurar este backup? Os dados atuais serão substituídos."
);

if(!confirmar) return;

localStorage.setItem(
"historico",
JSON.stringify(backup.historico || [])
);

localStorage.setItem(
"turmas",
JSON.stringify(backup.turmas || [])
);

localStorage.setItem(
"tarefas",
JSON.stringify(backup.tarefas || [])
);

localStorage.setItem(
"agenda",
JSON.stringify(backup.agenda || [])
);

localStorage.setItem(
"gabarito",
backup.gabarito || ""
);

localStorage.setItem(
"bnccFavoritos",
JSON.stringify(backup.bnccFavoritos || [])
);

localStorage.setItem(
"planejamentos",
JSON.stringify(backup.planejamentos || [])
);

localStorage.setItem(
"modelosOMR",
JSON.stringify(backup.modelosOMR || [])
);

alert("✅ Backup restaurado com sucesso.");

voltarHome();

}catch(erro){

alert("❌ Arquivo de backup inválido.");

}

};

leitor.readAsText(arquivo);

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

async function carregarBases(){

try{

const respostaBNCC =
await fetch("dados/bncc.json");

baseBNCC =
await respostaBNCC.json();

if(Array.isArray(baseBNCC)){
let codigosUnicos = {};

bancoBNCC = baseBNCC.filter(item => {

if(codigosUnicos[item.codigo]){
return false;
}

codigosUnicos[item.codigo] = true;
return true;

});
let codigosVistos = {};
let duplicados = [];

bancoBNCC.forEach(item => {
  if (codigosVistos[item.codigo]) {
    duplicados.push(item.codigo);
  } else {
    codigosVistos[item.codigo] = true;
  }
});

if (duplicados.length > 0) {
  console.log("⚠️ BNCC duplicadas:", duplicados);
  alert("⚠️ Há " + duplicados.length + " habilidade(s) duplicada(s) no bncc.json.");
}
}
else if(Array.isArray(baseBNCC.habilidades)){
bancoBNCC = baseBNCC.habilidades;
}
else if(Array.isArray(baseBNCC.bncc)){
bancoBNCC = baseBNCC.bncc;
}
else if(Array.isArray(baseBNCC.dados)){
bancoBNCC = baseBNCC.dados;
}
else{
alert("❌ Formato do bncc.json não reconhecido.");
bancoBNCC = [];
}

console.log(baseBNCC);

const respostaDescritores =
await fetch("dados/descritores.json");

const respostaDescritores = await fetch("./dados/descritores.json");

console.log("✅ Descritores carregados");
console.log(baseDescritores);

console.log("✅ BNCC carregada");
console.log(baseBNCC);

}catch(erro){

console.log("❌ Erro ao carregar bases");
console.log(erro);

}

}

async function iniciarApp(){

await carregarBases();

abrirSplash();

}

iniciarApp();
