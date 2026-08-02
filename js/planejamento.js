function abrirPlanejamento(){

document.body.innerHTML=`
<div class="cabecalhoTela">

<div>

<h1>📝 Planejamento de Aula</h1>

<p>
Crie e organize seus planejamentos pedagógicos.
</p>

</div>

</div>

<main class="secaoApp">

<section class="card textoEsquerda">

<h2 id="tituloFormularioPlano">
➕ Novo planejamento
</h2>

<div class="grupoCampo">

<label for="tituloPlano">
Título da aula *
</label>

<input
id="tituloPlano"
type="text"
placeholder="Ex.: Introdução aos advérbios"
autocomplete="off"
>

</div>

<div class="grid2">

<div class="grupoCampo">

<label for="turmaPlano">
Turma
</label>

<select id="turmaPlano">

<option value="">
📚 Sem turma específica
</option>

</select>

</div>

<div class="grupoCampo">

<label for="disciplinaPlano">
Disciplina *
</label>

<input
id="disciplinaPlano"
type="text"
placeholder="Ex.: Língua Portuguesa"
autocomplete="off"
>

</div>

</div>

<div class="grid2">

<div class="grupoCampo">

<label for="anoPlano">
Ano/Série
</label>

<input
id="anoPlano"
type="text"
placeholder="Ex.: 6º ano"
autocomplete="off"
>

</div>

<div class="grupoCampo">

<label for="habilidadePlano">
Código BNCC
</label>

<input
id="habilidadePlano"
type="text"
placeholder="Ex.: EF06LP08"
autocomplete="off"
>

</div>

</div>

<div class="acoes">

<button
id="escolherBNCCPlano"
type="button"
class="btnAzul"
>

<span class="material-icons-round">
menu_book
</span>

Escolher da BNCC

</button>

<button
id="buscarHabilidadePlano"
type="button"
>

<span class="material-icons-round">
search
</span>

Buscar código

</button>

</div>

<div id="infoHabilidadePlano"></div>

<div class="grupoCampo espacoTopo">

<label for="descritorPlano">
Descritor
</label>

<input
id="descritorPlano"
type="text"
placeholder="Ex.: D1, D2 ou D5"
autocomplete="off"
>

</div>

<div class="acoes">

<button
id="escolherDescritorPlano"
type="button"
>

<span class="material-icons-round">
analytics
</span>

Escolher descritor

</button>

</div>

<div id="infoDescritorPlano"></div>

<div class="grupoCampo espacoTopo">

<label for="objetivoPlano">
Objetivo da aula *
</label>

<textarea
id="objetivoPlano"
placeholder="Descreva o que os alunos deverão aprender."
></textarea>

</div>

<div class="grupoCampo">

<label for="metodologiaPlano">
Metodologia *
</label>

<textarea
id="metodologiaPlano"
placeholder="Explique como a aula será desenvolvida."
></textarea>

</div>

<div class="grupoCampo">

<label for="avaliacaoPlano">
Avaliação
</label>

<textarea
id="avaliacaoPlano"
placeholder="Explique como a aprendizagem será avaliada."
></textarea>

</div>

<div class="acoes">

<button
id="salvarPlano"
type="button"
class="btnVerde"
>

<span class="material-icons-round">
save
</span>

<span id="textoSalvarPlano">
Salvar planejamento
</span>

</button>

<button
id="cancelarEdicaoPlano"
type="button"
class="oculto"
>

<span class="material-icons-round">
close
</span>

Cancelar edição

</button>

</div>

</section>

<section class="painel">

<div class="painelBlocoCabecalho">

<div>

<h2>📚 Planejamentos salvos</h2>

<p id="contadorPlanejamentos">
Nenhum planejamento cadastrado.
</p>

</div>

</div>

<div class="barraPesquisa">

<input
id="buscaPlanejamento"
type="search"
placeholder="Buscar por título, turma, disciplina ou BNCC..."
autocomplete="off"
>

</div>

<div id="listaPlanejamentos"></div>

</section>

<div class="acoes">

<button
type="button"
class="btnAzul"
onclick="voltarHome()"
>

<span class="material-icons-round">
arrow_back
</span>

Voltar

</button>

</div>

</main>
`+barraInferior();

aplicarTemaSalvo();

let planejamentos=[];

try{

let dadosSalvos=
JSON.parse(
localStorage.getItem(
"planejamentos"
)
);

planejamentos=
Array.isArray(dadosSalvos)
? dadosSalvos
:[];

}catch(erro){

console.warn(
"Não foi possível carregar os planejamentos:",
erro
);

planejamentos=[];

}

planejamentos=
planejamentos.map(plano=>({

id:
plano?.id ||
criarIdPlanejamento(),

turma:
String(
plano?.turma ?? ""
),

titulo:
String(
plano?.titulo ?? ""
),

disciplina:
String(
plano?.disciplina ?? ""
),

ano:
String(
plano?.ano ?? ""
),

habilidade:
String(
plano?.habilidade ?? ""
).toUpperCase(),

habilidadeDescricao:
String(
plano?.habilidadeDescricao ?? ""
),

descritor:
String(
plano?.descritor ?? ""
).toUpperCase(),

descritorDescricao:
String(
plano?.descritorDescricao ?? ""
),

objetivo:
String(
plano?.objetivo ?? ""
),

metodologia:
String(
plano?.metodologia ?? ""
),

avaliacao:
String(
plano?.avaliacao ?? ""
),

criadoEm:
plano?.criadoEm ||
new Date().toISOString(),

atualizadoEm:
plano?.atualizadoEm ||
plano?.criadoEm ||
new Date().toISOString()

}));

let turmasPlano=[];

try{

let turmasSalvas=
JSON.parse(
localStorage.getItem("turmas")
);

turmasPlano=
Array.isArray(turmasSalvas)
? turmasSalvas
:[];

}catch(erro){

turmasPlano=[];

}

let indiceEdicao=null;

let habilidadeSelecionadaPlano=null;

let descritorSelecionadoPlano=null;

const tituloFormulario=
document.getElementById(
"tituloFormularioPlano"
);

const tituloPlano=
document.getElementById(
"tituloPlano"
);

const turmaPlano=
document.getElementById(
"turmaPlano"
);

const disciplinaPlano=
document.getElementById(
"disciplinaPlano"
);

const anoPlano=
document.getElementById(
"anoPlano"
);

const habilidadePlano=
document.getElementById(
"habilidadePlano"
);

const descritorPlano=
document.getElementById(
"descritorPlano"
);

const objetivoPlano=
document.getElementById(
"objetivoPlano"
);

const metodologiaPlano=
document.getElementById(
"metodologiaPlano"
);

const avaliacaoPlano=
document.getElementById(
"avaliacaoPlano"
);

const infoHabilidadePlano=
document.getElementById(
"infoHabilidadePlano"
);

const infoDescritorPlano=
document.getElementById(
"infoDescritorPlano"
);

const listaPlanejamentos=
document.getElementById(
"listaPlanejamentos"
);

const contadorPlanejamentos=
document.getElementById(
"contadorPlanejamentos"
);

const buscaPlanejamento=
document.getElementById(
"buscaPlanejamento"
);

const textoSalvarPlano=
document.getElementById(
"textoSalvarPlano"
);

const cancelarEdicaoPlano=
document.getElementById(
"cancelarEdicaoPlano"
);

function criarIdPlanejamento(){

return "plano_"+
Date.now()+"_"+
Math.random()
.toString(36)
.slice(2,9);

}

function escaparHTML(valor){

return String(valor ?? "")
.replaceAll("&","&amp;")
.replaceAll("<","&lt;")
.replaceAll(">","&gt;")
.replaceAll('"',"&quot;")
.replaceAll("'","&#039;");

}

function normalizarBusca(valor){

return String(valor ?? "")
.normalize("NFD")
.replace(
/[\u0300-\u036f]/g,
""
)
.toLowerCase()
.trim();

}

function salvarPlanejamentos(){

localStorage.setItem(
"planejamentos",
JSON.stringify(
planejamentos
)
);

}

function mostrarMensagem(
mensagem
){

if(
typeof mostrarToast==="function"
){

mostrarToast(mensagem);

}else{

alert(mensagem);

}

}

function preencherTurmas(){

turmaPlano.innerHTML="";

let opcaoInicial=
document.createElement("option");

opcaoInicial.value="";
opcaoInicial.textContent=
"📚 Sem turma específica";

turmaPlano.appendChild(
opcaoInicial
);

turmasPlano.forEach(turma=>{

if(
!turma ||
!String(turma.nome ?? "").trim()
){

return;

}

let opcao=
document.createElement("option");

opcao.value=
String(turma.nome).trim();

opcao.textContent=
String(turma.nome).trim();

turmaPlano.appendChild(
opcao
);

});

}

function limparFormulario(){

indiceEdicao=null;

habilidadeSelecionadaPlano=null;

descritorSelecionadoPlano=null;

tituloPlano.value="";
turmaPlano.value="";
disciplinaPlano.value="";
anoPlano.value="";
habilidadePlano.value="";
descritorPlano.value="";
objetivoPlano.value="";
metodologiaPlano.value="";
avaliacaoPlano.value="";

infoHabilidadePlano.innerHTML="";
infoDescritorPlano.innerHTML="";

tituloFormulario.textContent=
"➕ Novo planejamento";

textoSalvarPlano.textContent=
"Salvar planejamento";

cancelarEdicaoPlano.classList.add(
"oculto"
);

tituloPlano.focus();

}

function mostrarHabilidadeSelecionada(
item
){

if(!item){

infoHabilidadePlano.innerHTML="";

return;

}

let codigo=
escaparHTML(
item.codigo || ""
);

let disciplina=
escaparHTML(
item.disciplina ||
"Disciplina não informada"
);

let descricao=
escaparHTML(
item.habilidade ||
item.descricao ||
"Descrição não encontrada."
);

infoHabilidadePlano.innerHTML=`
<div class="card textoEsquerda">

<strong>
✅ Habilidade selecionada
</strong>

<p>
<strong>${codigo}</strong>
</p>

<p>${disciplina}</p>

<p>${descricao}</p>

</div>
`;

}

function mostrarDescritorSelecionado(
item
){

if(!item){

infoDescritorPlano.innerHTML="";

return;

}

let codigo=
escaparHTML(
item.codigo || ""
);

let area=
escaparHTML(
item.area ||
"Área não informada"
);

let descricao=
escaparHTML(
item.descricao ||
"Descrição não encontrada."
);

infoDescritorPlano.innerHTML=`
<div class="card textoEsquerda">

<strong>
✅ Descritor selecionado
</strong>

<p>
<strong>${codigo}</strong>
</p>

<p>${area}</p>

<p>${descricao}</p>

</div>
`;

}

function atualizarPlanejamentos(){

let termo=
normalizarBusca(
buscaPlanejamento.value
);

let resultados=
planejamentos
.map((plano,index)=>({
plano,
index
}))
.filter(({plano})=>{

if(termo===""){
return true;
}

let texto=
normalizarBusca(
[
plano.titulo,
plano.turma,
plano.disciplina,
plano.ano,
plano.habilidade,
plano.descritor,
plano.objetivo
].join(" ")
);

return texto.includes(termo);

})
.sort((a,b)=>{

return String(
b.plano.atualizadoEm || ""
).localeCompare(
String(
a.plano.atualizadoEm || ""
)
);

});

let total=
planejamentos.length;

contadorPlanejamentos.textContent=
total===0
? "Nenhum planejamento cadastrado."
: `${total} planejamento(s) salvo(s).`;

if(resultados.length===0){

listaPlanejamentos.innerHTML=`
<div class="estadoVazioApp">

<span class="estadoVazioIcone material-icons-round">
edit_note
</span>

<h3>
${
total===0
? "Nenhum planejamento salvo"
: "Nenhum resultado encontrado"
}
</h3>

<p>
${
total===0
? "Crie seu primeiro planejamento de aula."
: "Tente utilizar outro termo de pesquisa."
}
</p>

</div>
`;

return;

}

let html="";

resultados.forEach(
({plano,index})=>{

html+=`
<div class="card textoEsquerda">

<div class="flexEntre">

<div>

<h3>
${escaparHTML(
plano.titulo ||
"Planejamento sem título"
)}
</h3>

<p>
🏫 ${
escaparHTML(
plano.turma ||
"Sem turma específica"
)
}
</p>

<p>
📘 ${
escaparHTML(
plano.disciplina ||
"Disciplina não informada"
)
}
</p>

<p>
🎒 ${
escaparHTML(
plano.ano ||
"Ano/Série não informado"
)
}
</p>

${
plano.habilidade
? `
<p>
📚 ${escaparHTML(
plano.habilidade
)}
</p>
`
: ""
}

${
plano.descritor
? `
<p>
📊 ${escaparHTML(
plano.descritor
)}
</p>
`
: ""
}

</div>

</div>

<div class="acoes">

<button
type="button"
data-acao-plano="ver"
data-indice-plano="${index}"
>

<span class="material-icons-round">
visibility
</span>

Ver detalhes

</button>

<button
type="button"
data-acao-plano="editar"
data-indice-plano="${index}"
>

<span class="material-icons-round">
edit
</span>

Editar

</button>

<button
type="button"
class="btnVermelho"
data-acao-plano="excluir"
data-indice-plano="${index}"
>

<span class="material-icons-round">
delete
</span>

Excluir

</button>

</div>

</div>
`;

});

listaPlanejamentos.innerHTML=html;

listaPlanejamentos
.querySelectorAll(
"[data-acao-plano]"
)
.forEach(botao=>{

botao.addEventListener(
"click",
function(){

let indice=
Number(
this.dataset.indicePlano
);

let acao=
this.dataset.acaoPlano;

if(acao==="ver"){

verPlanejamento(indice);

}

if(acao==="editar"){

editarPlanejamento(indice);

}

if(acao==="excluir"){

excluirPlanejamento(indice);

}

}
);

});

}

function verPlanejamento(index){

let plano=
planejamentos[index];

if(!plano){

mostrarMensagem(
"⚠️ Planejamento não encontrado."
);

return;

}

document.body.innerHTML=`
<div class="cabecalhoTela">

<div>

<h1>
📝 Planejamento de Aula
</h1>

<p>
Visualização completa do planejamento.
</p>

</div>

</div>

<main class="secaoApp">

<section class="card textoEsquerda">

<h2>
${escaparHTML(
plano.titulo ||
"Planejamento sem título"
)}
</h2>

<hr>

<p>
<strong>🏫 Turma:</strong><br>
${escaparHTML(
plano.turma ||
"Sem turma específica"
)}
</p>

<p>
<strong>📘 Disciplina:</strong><br>
${escaparHTML(
plano.disciplina ||
"Não informada"
)}
</p>

<p>
<strong>🎒 Ano/Série:</strong><br>
${escaparHTML(
plano.ano ||
"Não informado"
)}
</p>

<p>
<strong>📚 Habilidade BNCC:</strong><br>
${escaparHTML(
plano.habilidade ||
"Não informada"
)}
</p>

<p>
<strong>📖 Descrição da habilidade:</strong><br>
${escaparHTML(
plano.habilidadeDescricao ||
"Não informada"
)}
</p>

<p>
<strong>📊 Descritor:</strong><br>
${escaparHTML(
plano.descritor ||
"Não informado"
)}
</p>

<p>
<strong>📋 Descrição do descritor:</strong><br>
${escaparHTML(
plano.descritorDescricao ||
"Não informada"
)}
</p>

<p>
<strong>🎯 Objetivo:</strong><br>
${escaparHTML(
plano.objetivo ||
"Não informado"
)}
</p>

<p>
<strong>🧭 Metodologia:</strong><br>
${escaparHTML(
plano.metodologia ||
"Não informada"
)}
</p>

<p>
<strong>✅ Avaliação:</strong><br>
${escaparHTML(
plano.avaliacao ||
"Não informada"
)}
</p>

<hr>

<small>
Gerado no Ajuda+Prof
</small>

<div class="acoes">

<button
id="imprimirPlanejamento"
type="button"
class="btnVerde"
>

<span class="material-icons-round">
print
</span>

Imprimir / Salvar PDF

</button>

<button
id="voltarPlanejamentos"
type="button"
class="btnAzul"
>

<span class="material-icons-round">
arrow_back
</span>

Voltar

</button>

</div>

</section>

</main>
`;

aplicarTemaSalvo();

document.getElementById(
"imprimirPlanejamento"
).onclick=function(){

window.print();

};

document.getElementById(
"voltarPlanejamentos"
).onclick=function(){

abrirPlanejamento();

};

}

function editarPlanejamento(index){

let plano=
planejamentos[index];

if(!plano){

mostrarMensagem(
"⚠️ Planejamento não encontrado."
);

return;

}

indiceEdicao=index;

tituloPlano.value=
plano.titulo || "";

turmaPlano.value=
plano.turma || "";

disciplinaPlano.value=
plano.disciplina || "";

anoPlano.value=
plano.ano || "";

habilidadePlano.value=
plano.habilidade || "";

descritorPlano.value=
plano.descritor || "";

objetivoPlano.value=
plano.objetivo || "";

metodologiaPlano.value=
plano.metodologia || "";

avaliacaoPlano.value=
plano.avaliacao || "";

habilidadeSelecionadaPlano=
bancoBNCC.find(item=>
String(item.codigo || "")
.toUpperCase()===
String(
plano.habilidade || ""
).toUpperCase()
) || null;

descritorSelecionadoPlano=
baseDescritores.find(item=>
String(item.codigo || "")
.toUpperCase()===
String(
plano.descritor || ""
).toUpperCase()
) || null;

if(
habilidadeSelecionadaPlano
){

mostrarHabilidadeSelecionada(
habilidadeSelecionadaPlano
);

}else if(
plano.habilidadeDescricao
){

infoHabilidadePlano.innerHTML=`
<div class="card textoEsquerda">

<strong>
📚 Habilidade salva
</strong>

<p>
${escaparHTML(
plano.habilidade ||
"Sem código"
)}
</p>

<p>
${escaparHTML(
plano.habilidadeDescricao
)}
</p>

</div>
`;

}

if(
descritorSelecionadoPlano
){

mostrarDescritorSelecionado(
descritorSelecionadoPlano
);

}else if(
plano.descritorDescricao
){

infoDescritorPlano.innerHTML=`
<div class="card textoEsquerda">

<strong>
📊 Descritor salvo
</strong>

<p>
${escaparHTML(
plano.descritor ||
"Sem código"
)}
</p>

<p>
${escaparHTML(
plano.descritorDescricao
)}
</p>

</div>
`;

}

tituloFormulario.textContent=
"✏ Editar planejamento";

textoSalvarPlano.textContent=
"Salvar alterações";

cancelarEdicaoPlano.classList.remove(
"oculto"
);

window.scrollTo({
top:0,
behavior:"smooth"
});

tituloPlano.focus();

}

function excluirPlanejamento(index){

let plano=
planejamentos[index];

if(!plano){
return;
}

let confirmarExclusao=
confirm(
`Deseja excluir o planejamento "${plano.titulo || "Sem título"}"?`
);

if(!confirmarExclusao){
return;
}

planejamentos.splice(
index,
1
);

if(indiceEdicao===index){

limparFormulario();

}else if(
indiceEdicao!==null &&
index<indiceEdicao
){

indiceEdicao--;

}

salvarPlanejamentos();

atualizarPlanejamentos();

mostrarMensagem(
"🗑 Planejamento excluído."
);

}

function selecionarBNCCPlano(
codigo
){

let item=
bancoBNCC.find(h=>
String(h.codigo || "")
.toUpperCase()===
String(codigo || "")
.toUpperCase()
);

if(!item){

mostrarMensagem(
"⚠️ Habilidade não encontrada."
);

return;

}

habilidadeSelecionadaPlano=
item;

habilidadePlano.value=
item.codigo || "";

if(item.disciplina){

disciplinaPlano.value=
item.disciplina;

}

if(
Array.isArray(item.anos) &&
item.anos.length>0
){

anoPlano.value=
item.anos.join(", ");

}else if(item.ano){

anoPlano.value=
item.ano;

}

mostrarHabilidadeSelecionada(
item
);

}

function selecionarDescritorPlano(
codigo
){

let item=
baseDescritores.find(d=>
String(d.codigo || "")
.toUpperCase()===
String(codigo || "")
.toUpperCase()
);

if(!item){

mostrarMensagem(
"⚠️ Descritor não encontrado."
);

return;

}

descritorSelecionadoPlano=
item;

descritorPlano.value=
item.codigo || "";

mostrarDescritorSelecionado(
item
);

}

document.getElementById(
"escolherBNCCPlano"
).onclick=function(){

if(
!Array.isArray(bancoBNCC) ||
bancoBNCC.length===0
){

infoHabilidadePlano.innerHTML=`
<div class="card textoEsquerda">

<strong>
⚠️ Base BNCC indisponível
</strong>

<p>
Verifique se o arquivo dados/bncc.json
foi carregado corretamente.
</p>

</div>
`;

return;

}

infoHabilidadePlano.innerHTML=`
<div class="card textoEsquerda">

<h3>
📚 Escolher habilidade BNCC
</h3>

<div class="barraPesquisa">

<input
id="buscaBNCCPlano"
type="search"
placeholder="Buscar por código, disciplina ou palavra..."
autocomplete="off"
>

</div>

<div id="resultadoBNCCPlano">

<p>
Digite para pesquisar habilidades.
</p>

</div>

</div>
`;

let campoBusca=
document.getElementById(
"buscaBNCCPlano"
);

let resultado=
document.getElementById(
"resultadoBNCCPlano"
);

campoBusca.addEventListener(
"input",
function(){

let busca=
normalizarBusca(
this.value
);

if(busca===""){

resultado.innerHTML=`
<p>
Digite para pesquisar habilidades.
</p>
`;

return;

}

let resultados=
bancoBNCC
.filter(item=>{

let texto=
normalizarBusca(
[
item.codigo,
item.disciplina,
item.habilidade,
item.descricao,
Array.isArray(item.anos)
? item.anos.join(" ")
: item.ano
].join(" ")
);

return texto.includes(busca);

})
.slice(0,30);

if(resultados.length===0){

resultado.innerHTML=`
<p>
Nenhuma habilidade encontrada.
</p>
`;

return;

}

resultado.innerHTML=
resultados.map((item,index)=>`
<div class="card textoEsquerda">

<strong>
${escaparHTML(
item.codigo || ""
)}
</strong>

<p>
${escaparHTML(
item.disciplina ||
"Disciplina não informada"
)}
</p>

<p>
${escaparHTML(
item.habilidade ||
item.descricao ||
"Descrição não encontrada."
)}
</p>

<button
type="button"
data-selecionar-bncc="${index}"
>

<span class="material-icons-round">
check
</span>

Selecionar

</button>

</div>
`).join("");

resultado
.querySelectorAll(
"[data-selecionar-bncc]"
)
.forEach(botao=>{

botao.addEventListener(
"click",
function(){

let item=
resultados[
Number(
this.dataset.selecionarBncc
)
];

if(item){

selecionarBNCCPlano(
item.codigo
);

}

}
);

});

}
);

campoBusca.focus();

};

document.getElementById(
"buscarHabilidadePlano"
).onclick=function(){

let codigo=
habilidadePlano.value
.trim()
.toUpperCase();

habilidadePlano.value=
codigo;

if(codigo===""){

mostrarMensagem(
"⚠️ Digite um código BNCC."
);

habilidadePlano.focus();

return;

}

let item=
bancoBNCC.find(h=>
String(h.codigo || "")
.toUpperCase()===
codigo
);

if(!item){

habilidadeSelecionadaPlano=null;

infoHabilidadePlano.innerHTML=`
<div class="card textoEsquerda">

<strong>
❌ Habilidade não encontrada
</strong>

<p>
Confira o código informado ou escolha
uma habilidade pela pesquisa.
</p>

</div>
`;

return;

}

selecionarBNCCPlano(
item.codigo
);

};

document.getElementById(
"escolherDescritorPlano"
).onclick=function(){

if(
!Array.isArray(baseDescritores) ||
baseDescritores.length===0
){

infoDescritorPlano.innerHTML=`
<div class="card textoEsquerda">

<strong>
⚠️ Base de descritores indisponível
</strong>

<p>
Verifique o arquivo
dados/descritores.json.
</p>

</div>
`;

return;

}

infoDescritorPlano.innerHTML=`
<div class="card textoEsquerda">

<h3>
📊 Escolher descritor
</h3>

<div class="barraPesquisa">

<input
id="buscaDescritorPlano"
type="search"
placeholder="Buscar por código, área ou palavra..."
autocomplete="off"
>

</div>

<div id="resultadoDescritorPlano">

<p>
Digite para pesquisar descritores.
</p>

</div>

</div>
`;

let campoBusca=
document.getElementById(
"buscaDescritorPlano"
);

let resultado=
document.getElementById(
"resultadoDescritorPlano"
);

campoBusca.addEventListener(
"input",
function(){

let busca=
normalizarBusca(
this.value
);

if(busca===""){

resultado.innerHTML=`
<p>
Digite para pesquisar descritores.
</p>
`;

return;

}

let resultados=
baseDescritores
.filter(item=>{

let texto=
normalizarBusca(
[
item.codigo,
item.area,
item.ano,
item.descricao
].join(" ")
);

return texto.includes(busca);

})
.slice(0,30);

if(resultados.length===0){

resultado.innerHTML=`
<p>
Nenhum descritor encontrado.
</p>
`;

return;

}

resultado.innerHTML=
resultados.map((item,index)=>`
<div class="card textoEsquerda">

<strong>
${escaparHTML(
item.codigo || ""
)}
</strong>

<p>
${escaparHTML(
item.area ||
"Área não informada"
)}
</p>

<p>
${escaparHTML(
item.descricao ||
"Descrição não encontrada."
)}
</p>

<button
type="button"
data-selecionar-descritor="${index}"
>

<span class="material-icons-round">
check
</span>

Selecionar

</button>

</div>
`).join("");

resultado
.querySelectorAll(
"[data-selecionar-descritor]"
)
.forEach(botao=>{

botao.addEventListener(
"click",
function(){

let item=
resultados[
Number(
this.dataset.selecionarDescritor
)
];

if(item){

selecionarDescritorPlano(
item.codigo
);

}

}
);

});

}
);

campoBusca.focus();

};

habilidadePlano.addEventListener(
"input",
function(){

let codigoAtual=
this.value
.trim()
.toUpperCase();

if(
habilidadeSelecionadaPlano &&
String(
habilidadeSelecionadaPlano.codigo || ""
).toUpperCase()!==
codigoAtual
){

habilidadeSelecionadaPlano=null;

infoHabilidadePlano.innerHTML="";

}

}
);

descritorPlano.addEventListener(
"input",
function(){

let codigoAtual=
this.value
.trim()
.toUpperCase();

if(
descritorSelecionadoPlano &&
String(
descritorSelecionadoPlano.codigo || ""
).toUpperCase()!==
codigoAtual
){

descritorSelecionadoPlano=null;

infoDescritorPlano.innerHTML="";

}

}
);

document.getElementById(
"salvarPlano"
).onclick=function(){

let titulo=
tituloPlano.value.trim();

let disciplina=
disciplinaPlano.value.trim();

let objetivo=
objetivoPlano.value.trim();

let metodologia=
metodologiaPlano.value.trim();

if(titulo===""){

mostrarMensagem(
"⚠️ Informe o título da aula."
);

tituloPlano.focus();

return;

}

if(disciplina===""){

mostrarMensagem(
"⚠️ Informe a disciplina."
);

disciplinaPlano.focus();

return;

}

if(objetivo===""){

mostrarMensagem(
"⚠️ Informe o objetivo da aula."
);

objetivoPlano.focus();

return;

}

if(metodologia===""){

mostrarMensagem(
"⚠️ Informe a metodologia."
);

metodologiaPlano.focus();

return;

}

let codigoBNCC=
habilidadePlano.value
.trim()
.toUpperCase();

let codigoDescritor=
descritorPlano.value
.trim()
.toUpperCase();

let habilidadeCorrespondente=
bancoBNCC.find(item=>
String(item.codigo || "")
.toUpperCase()===
codigoBNCC
);

let descritorCorrespondente=
baseDescritores.find(item=>
String(item.codigo || "")
.toUpperCase()===
codigoDescritor
);

let agora=
new Date().toISOString();

let planejamento={

id:
indiceEdicao!==null &&
planejamentos[indiceEdicao]
? planejamentos[indiceEdicao].id
: criarIdPlanejamento(),

turma:
turmaPlano.value,

titulo:titulo,

disciplina:disciplina,

ano:
anoPlano.value.trim(),

habilidade:
codigoBNCC,

habilidadeDescricao:
habilidadeCorrespondente
? (
habilidadeCorrespondente.habilidade ||
habilidadeCorrespondente.descricao ||
""
)
: "",

descritor:
codigoDescritor,

descritorDescricao:
descritorCorrespondente
? (
descritorCorrespondente.descricao ||
""
)
: "",

objetivo:objetivo,

metodologia:metodologia,

avaliacao:
avaliacaoPlano.value.trim(),

criadoEm:
indiceEdicao!==null &&
planejamentos[indiceEdicao]
? planejamentos[indiceEdicao].criadoEm
: agora,

atualizadoEm:
agora

};

let estavaEditando=
indiceEdicao!==null;

if(estavaEditando){

planejamentos[indiceEdicao]=
planejamento;

}else{

planejamentos.push(
planejamento
);

}

salvarPlanejamentos();

limparFormulario();

atualizarPlanejamentos();

mostrarMensagem(
estavaEditando
? "✅ Planejamento atualizado."
: "✅ Planejamento salvo."
);

};

cancelarEdicaoPlano.onclick=
function(){

limparFormulario();

mostrarMensagem(
"↩ Edição cancelada."
);

};

buscaPlanejamento.addEventListener(
"input",
atualizarPlanejamentos
);

tituloPlano.addEventListener(
"keydown",
function(evento){

if(evento.key==="Enter"){

evento.preventDefault();

disciplinaPlano.focus();

}

if(
evento.key==="Escape" &&
indiceEdicao!==null
){

limparFormulario();

}

}
);

preencherTurmas();

salvarPlanejamentos();

atualizarPlanejamentos();

}