function abrirQRCode(){

document.body.innerHTML=`
<h1>🔍 QR Code</h1>

<input id="textoQR" placeholder="Digite texto ou link">

<br><br>

<button id="gerarQR">📷 Gerar QR</button>

<br><br>

<div id="qrcode"></div>

<div id="acoesQR" style="display:none; margin-top:16px;">
  <button id="imprimirQR">🖨 Imprimir QR Code</button>
</div>

<br><br>

<button onclick="voltarHome()">
⬅ Voltar
</button>
` + barraInferior();

aplicarTemaSalvo();

document.getElementById("gerarQR").onclick=function(){
  let texto=document.getElementById("textoQR").value;

  if(texto.trim()==="") return;

  const urlQR =
    "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" +
    encodeURIComponent(texto);

  const textoSeguro=texto
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;");

  document.getElementById("qrcode").innerHTML=`
    <div style="
      display:inline-flex;
      flex-direction:column;
      align-items:center;
      gap:10px;
      padding:16px;
      border-radius:16px;
      background:#fff;
    ">
      <img
        id="imagemQRCode"
        src="${urlQR}"
        alt="QR Code gerado"
        style="
          width:220px;
          height:220px;
          object-fit:contain;
          display:block;
        "
      >

      <div
        id="textoQRCodeGerado"
        style="
          max-width:300px;
          color:#111827;
          font-size:14px;
          line-height:1.35;
          text-align:center;
          overflow-wrap:anywhere;
        "
      >
        ${textoSeguro}
      </div>
    </div>
  `;

  document.getElementById("acoesQR").style.display="block";
};

document.getElementById("imprimirQR").onclick=function(){
  const imagem=document.getElementById("imagemQRCode");
  const texto=document.getElementById("textoQR").value.trim();

  if(!imagem || !imagem.src){
    if(typeof mostrarToast==="function"){
      mostrarToast("⚠️ Gere o QR Code antes de imprimir.");
    }
    return;
  }

  const janela=window.open("","_blank","width=700,height=800");

  if(!janela){
    if(typeof mostrarToast==="function"){
      mostrarToast("⚠️ Permita pop-ups para imprimir o QR Code.");
    }
    return;
  }

  const textoSeguro=texto
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;");

  janela.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Imprimir QR Code</title>
      <style>
        @page{
          size:A4;
          margin:18mm;
        }

        *{
          box-sizing:border-box;
        }

        body{
          margin:0;
          font-family:Arial,Helvetica,sans-serif;
          color:#111827;
          background:#fff;
        }

        .pagina{
          min-height:250mm;
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          text-align:center;
        }

        h1{
          margin:0 0 24px;
          font-size:24px;
        }

        img{
          width:300px;
          height:300px;
          object-fit:contain;
        }

        .texto{
          max-width:520px;
          margin-top:22px;
          font-size:15px;
          line-height:1.5;
          overflow-wrap:anywhere;
        }

        .rodape{
          margin-top:30px;
          font-size:11px;
          color:#6b7280;
        }

        @media print{
          body{
            -webkit-print-color-adjust:exact;
            print-color-adjust:exact;
          }
        }
      </style>
    </head>
    <body>
      <main class="pagina">
        <h1>QR Code</h1>

        <img
          src="${imagem.src}"
          alt="QR Code"
        >

        ${textoSeguro ? `<div class="texto">${textoSeguro}</div>` : ""}

        <div class="rodape">
          Gerado pelo Ajuda+Prof
        </div>
      </main>

      <script>
        window.onload = function(){
          setTimeout(function(){
            window.print();
          }, 250);
        };
      <\/script>
    </body>
    </html>
  `);

  janela.document.close();
};
}
