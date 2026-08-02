let baseBNCC = [];
let baseDescritores = [];

let bancoBNCC = [];

async function carregarBases(){

let resultado={

bnccCarregada:false,

descritoresCarregados:false,

erros:[]

};

function extrairListaBase(
conteudo,
possiveisChaves=[]
){

if(Array.isArray(conteudo)){

return conteudo;

}

if(
!conteudo ||
typeof conteudo!=="object"
){

return [];

}

for(
let chave of possiveisChaves
){

if(Array.isArray(conteudo[chave])){

return conteudo[chave];

}

}

return [];

}

function normalizarTexto(valor){

return String(valor ?? "")
.trim();

}

function prepararBNCC(listaOriginal){

if(!Array.isArray(listaOriginal)){

return{

lista:[],

duplicados:[],

invalidos:0

};

}

let codigosEncontrados=
new Set();

let duplicados=
new Set();

let invalidos=0;

let lista=[];

listaOriginal.forEach(item=>{

if(
!item ||
typeof item!=="object"
){

invalidos++;

return;

}

let codigo=
normalizarTexto(item.codigo)
.toUpperCase();

if(codigo===""){

invalidos++;

return;

}

if(codigosEncontrados.has(codigo)){

duplicados.add(codigo);

return;

}

codigosEncontrados.add(codigo);

let anos=[];

if(Array.isArray(item.anos)){

anos=item.anos
.map(ano=>normalizarTexto(ano))
.filter(ano=>ano!=="");

}else if(item.ano){

anos=[
normalizarTexto(item.ano)
];

}

lista.push({

...item,

codigo:codigo,

disciplina:
normalizarTexto(
item.disciplina ||
item.componente ||
item.area ||
""
),

anos:anos,

ano:
normalizarTexto(
item.ano ||
""
),

habilidade:
normalizarTexto(
item.habilidade ||
item.descricao ||
item.texto ||
""
),

descricao:
normalizarTexto(
item.descricao ||
item.habilidade ||
item.texto ||
""
)

});

});

return{

lista:lista,

duplicados:[
...duplicados
],

invalidos:invalidos

};

}

function prepararDescritores(
listaOriginal
){

if(!Array.isArray(listaOriginal)){

return{

lista:[],

duplicados:[],

invalidos:0

};

}

let codigosEncontrados=
new Set();

let duplicados=
new Set();

let invalidos=0;

let lista=[];

listaOriginal.forEach(item=>{

if(
!item ||
typeof item!=="object"
){

invalidos++;

return;

}

let codigo=
normalizarTexto(
item.codigo ||
item.codigoOriginal
)
.toUpperCase();

if(codigo===""){

invalidos++;

return;

}

if(codigosEncontrados.has(codigo)){

duplicados.add(codigo);

return;

}

codigosEncontrados.add(codigo);

lista.push({

...item,

codigo:codigo,

codigoOriginal:
normalizarTexto(
item.codigoOriginal ||
item.codigo
),

area:
normalizarTexto(
item.area ||
item.disciplina ||
""
),

ano:
normalizarTexto(
item.ano ||
""
),

descricao:
normalizarTexto(
item.descricao ||
item.habilidade ||
item.texto ||
""
)

});

});

return{

lista:lista,

duplicados:[
...duplicados
],

invalidos:invalidos

};

}

/*
CARREGAMENTO DA BNCC
*/

try{

let respostaBNCC=
await fetch(
"dados/bncc.json",
{
cache:"no-store"
}
);

if(!respostaBNCC.ok){

throw newr(
`Erro HTTP ${respostaBNCC.status} ao carregar bncc.json.`
);

}

let conteudoBNCC=
await respostaBNCC.json();

baseBNCC=
conteudoBNCC;

let listaBNCC=
extrairListaBase(
conteudoBNCC,
[
"habilidades",
"bncc",
"dados",
"itens"
]
);

if(listaBNCC.length===0){

throw newr(
"O bncc.json não contém uma lista de habilidades reconhecida."
);

}

let preparacaoBNCC=
prepararBNCC(
listaBNCC
);

bancoBNCC=
preparacaoBNCC.lista;

resultado.bnccCarregada=
bancoBNCC.length>0;

console.log(
`✅ BNCC carregada: ${bancoBNCC.length} habilidade(s).`
);

if(
preparacaoBNCC.duplicados.length>0
){

console.warn(
"⚠️ Códigos BNCC duplicados removidos:",
preparacaoBNCC.duplicados
);

}

if(
preparacaoBNCC.invalidos>0
){

console.warn(
`⚠️ ${preparacaoBNCC.invalidos} registro(s) inválido(s) foram ignorados na BNCC.`
);

}

}catch(erro){

baseBNCC=[];
bancoBNCC=[];

resultado.erros.push(
"BNCC: "+erro.message
);

console.error(
"❌ ao carregar a BNCC:",
erro
);

}

/*
CARREGAMENTO DOS DESCRITORES

É separado da BNCC para que uma base possa
funcionar mesmo que a outra apresente.
*/

try{

let respostaDescritores=
await fetch(
"dados/descritores.json",
{
cache:"no-store"
}
);

if(!respostaDescritores.ok){

throw newr(
`Erro HTTP ${respostaDescritores.status} ao carregar descritores.json.`
);

}

let conteudoDescritores=
await respostaDescritores.json();

let listaDescritores=
extrairListaBase(
conteudoDescritores,
[
"descritores",
"dados",
"itens"
]
);

if(listaDescritores.length===0){

throw newr(
"O descritores.json não contém uma lista reconhecida."
);

}

let preparacaoDescritores=
prepararDescritores(
listaDescritores
);

baseDescritores=
preparacaoDescritores.lista;

resultado.descritoresCarregados=
baseDescritores.length>0;

console.log(
`✅ Descritores carregados: ${baseDescritores.length} registro(s).`
);

if(
preparacaoDescritores.duplicados.length>0
){

console.warn(
"⚠️ Descritores duplicados removidos:",
preparacaoDescritores.duplicados
);

}

if(
preparacaoDescritores.invalidos>0
){

console.warn(
`⚠️ ${preparacaoDescritores.invalidos} registro(s) inválido(s) foram ignorados nos descritores.`
);

}

}catch(erro){

baseDescritores=[];

resultado.erros.push(
"Descritores: "+erro.message
);

console.error(
"❌ ao carregar os descritores:",
erro
);

}

window.statusBasesAjudaProf=
resultado;

window.baseBNCC = baseBNCC;
window.baseDescritores = baseDescritores;
window.bancoBNCC = bancoBNCC;

return resultado;

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

document.getElementById("buscaDescritor").oninput=function(){
renderizarDescritores();
};

renderizarDescritores();

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

