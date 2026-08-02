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