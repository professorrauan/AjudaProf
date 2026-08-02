async function abrirCorrecao() {
  let turmasPrecarregadas = [];

  try {
    if (typeof carregarTurmasFirebase === "function") {
      turmasPrecarregadas = await carregarTurmasFirebase();
    } else if (typeof obterTurmasSalvas === "function") {
      turmasPrecarregadas = obterTurmasSalvas();
    }
  } catch (erroTurmas) {
    console.error("Erro ao carregar turmas antes da correção:", erroTurmas);

    turmasPrecarregadas = [];
  }

  if (!Array.isArray(turmasPrecarregadas)) {
    turmasPrecarregadas = [];
  }

  document.body.innerHTML =
    ` <h1>Corrigir Prova</h1> <input id="foto" type="file" accept="image/*" capture style="display:none;"> <button id="abrirCamera"> <span class="material-icons-round">photo_camera</span> Tirar ou escolher foto </button> <br><br> <p>Arraste os pontos vermelhos até encaixar no gabarito. Depois ajuste o retângulo azul.</p> <button id="detectarGrade"> <span class="material-icons-round">center_focus_strong</span> Auto enquadrar gabarito </button> <canvas id="canvas" width="320"></canvas> <div id="painelCorrecao" style="display:none;"> <select id="turmaSelecionada"> <option value="">Selecionar turma</option> </select> <br><br> <select id="aluno"> <option value="">Selecionar aluno</option> </select> <br><br> <div class="card"> <h3>Configuração da prova</h3> <input id="totalQuestoes" type="number" min="1" placeholder="Quantidade de questões. Ex: 10"> <input id="valorProva" type="number" min="0" step="0.1" placeholder="Valor da prova. Ex: 10"> <input id="gabarito" placeholder="Gabarito. Ex: A,B,C,D,A"> <input id="habilidadeProva" placeholder="Habilidade BNCC. Ex: EF06MA01"> <input id="descritorProva" placeholder="Descritor. Ex: D1, D2, D5"> <button id="salvarGabarito">Salvar Gabarito</button> </div> <br> <div class="card"> <h3>Modelo de gabarito</h3> <select id="modeloOMR"> <option value="">Modelo padrão</option> </select> <button id="salvarModeloOMR">Salvar modelo ajustado</button> <button id="excluirModeloOMR">Excluir modelo selecionado</button> </div> <button id="debugVisual">Debug Visual: Ligado</button> <button id="analisar">Analisar Marcações</button> <p id="resultado"></p> <button onclick="document.getElementById('foto').click();"> Foto do próximo aluno </button> </div> <button onclick="voltarHome()">Voltar</button> ` + barraInferior("provas");

  aplicarTemaSalvo();

  let canvas = document.getElementById("canvas");
  let ctx = canvas.getContext("2d");
  let imagem = new Image();
  let turmas = Array.isArray(turmasPrecarregadas) ? turmasPrecarregadas : [];

  let pontos = [
    { x: 60, y: 80 },
    { x: 260, y: 80 },
    { x: 60, y: 360 },
    { x: 260, y: 360 },
  ];

  let arrastando = null;
  let arrastandoAzul = null;
  let mostrarDebug = true;

  let selectTurma = document.getElementById("turmaSelecionada");

  turmas.forEach((turma) => {
    selectTurma.innerHTML += ` <option value="${turma.nome}">${turma.nome}</option> `;
  });

  selectTurma.onchange = function () {
    let nomeTurma = this.value;
    let selectAluno = document.getElementById("aluno");

    selectAluno.innerHTML = ` <option value="">👨‍🎓 Selecionar aluno</option> `;

    let turma = turmas.find((t) => t.nome === nomeTurma);

    if (!turma) return;

    turma.alunos.forEach((aluno) => {
      let nomeAlunoOpcao =
        typeof aluno === "string"
          ? aluno
          : aluno?.nome || aluno?.nomeAluno || "";

      if (!nomeAlunoOpcao) {
        return;
      }

      selectAluno.innerHTML += ` <option value="${nomeAlunoOpcao}">${nomeAlunoOpcao}</option> `;
    });
  };

  let botaoCamera = document.getElementById("abrirCamera");
  let inputFoto = document.getElementById("foto");

  botaoCamera.onclick = function () {
    inputFoto.click();
  };

  let gabaritoSalvo = localStorage.getItem("gabarito");
  let totalQuestoesSalvo = localStorage.getItem("totalQuestoes");
  let valorProvaSalvo = localStorage.getItem("valorProva");
  let habilidadeProvaSalva = localStorage.getItem("habilidadeProva");
  let descritorProvaSalvo = localStorage.getItem("descritorProva");

  if (gabaritoSalvo) document.getElementById("gabarito").value = gabaritoSalvo;
  if (totalQuestoesSalvo)
    document.getElementById("totalQuestoes").value = totalQuestoesSalvo;
  if (valorProvaSalvo)
    document.getElementById("valorProva").value = valorProvaSalvo;
  if (habilidadeProvaSalva)
    document.getElementById("habilidadeProva").value = habilidadeProvaSalva;
  if (descritorProvaSalvo)
    document.getElementById("descritorProva").value = descritorProvaSalvo;

  document.getElementById("salvarGabarito").onclick = function () {
    localStorage.setItem("gabarito", document.getElementById("gabarito").value);
    localStorage.setItem(
      "totalQuestoes",
      document.getElementById("totalQuestoes").value
    );
    localStorage.setItem(
      "valorProva",
      document.getElementById("valorProva").value
    );
    localStorage.setItem(
      "habilidadeProva",
      document.getElementById("habilidadeProva").value
    );
    localStorage.setItem(
      "descritorProva",
      document.getElementById("descritorProva").value
    );

    alert("✅ Configuração da prova salva.");
  };

  function carregarModelosOMR() {
    let modelos = JSON.parse(localStorage.getItem("modelosOMR")) || [];
    let select = document.getElementById("modeloOMR");

    select.innerHTML = `<option value="">📄 Modelo padrão</option>`;

    modelos.forEach((modelo, index) => {
      select.innerHTML += ` <option value="${index}">${modelo.nome}</option> `;
    });
  }

  carregarModelosOMR();

  document.getElementById("modeloOMR").onchange = function () {
    let index = this.value;

    if (index === "") return;

    let modelos = JSON.parse(localStorage.getItem("modelosOMR")) || [];
    let modelo = modelos[index];

    if (!modelo) return;

    if (modelo.prova) {
      document.getElementById("totalQuestoes").value =
        modelo.prova.totalQuestoes || "";
      document.getElementById("valorProva").value =
        modelo.prova.valorProva || "";
      document.getElementById("gabarito").value = modelo.prova.gabarito || "";
    }
  };

  document.getElementById("excluirModeloOMR").onclick = function () {
    let index = document.getElementById("modeloOMR").value;

    if (index === "") {
      alert("Selecione um modelo para excluir.");
      return;
    }

    let modelos = JSON.parse(localStorage.getItem("modelosOMR")) || [];

    if (!confirm("Excluir este modelo?")) return;

    modelos.splice(index, 1);

    localStorage.setItem("modelosOMR", JSON.stringify(modelos));

    alert("🗑 Modelo excluído.");

    carregarModelosOMR();
  };

  function desenhar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imagem, 0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "red";
    ctx.lineWidth = 3;

    ctx.strokeRect(
      pontos[0].x,
      pontos[0].y,
      pontos[3].x - pontos[0].x,
      pontos[3].y - pontos[0].y
    );

    pontos.forEach((p) => {
      ctx.fillStyle = "red";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
      ctx.fill();
    });

    if (window.areaTabelaOMR) {
      ctx.strokeStyle = "blue";
      ctx.lineWidth = 2;

      ctx.strokeRect(
        window.areaTabelaOMR.x1,
        window.areaTabelaOMR.y1,
        window.areaTabelaOMR.x2 - window.areaTabelaOMR.x1,
        window.areaTabelaOMR.y2 - window.areaTabelaOMR.y1
      );

      let cantos = [
        { x: window.areaTabelaOMR.x1, y: window.areaTabelaOMR.y1 },
        { x: window.areaTabelaOMR.x2, y: window.areaTabelaOMR.y1 },
        { x: window.areaTabelaOMR.x1, y: window.areaTabelaOMR.y2 },
        { x: window.areaTabelaOMR.x2, y: window.areaTabelaOMR.y2 },
      ];

      cantos.forEach((p) => {
        ctx.fillStyle = "blue";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }

  function detectarGrade() {
    desenhar();

    let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let data = imgData.data;
    let w = canvas.width;
    let h = canvas.height;

    function brilhoPixel(x, y) {
      let i = (y * w + x) * 4;
      return (data[i] + data[i + 1] + data[i + 2]) / 3;
    }

    let candidatos = [];
    let tam = 26;
    let passo = 4;

    for (let y = 0; y < h - tam; y += passo) {
      for (let x = 0; x < w - tam; x += passo) {
        let pretos = 0;
        let total = 0;

        for (let yy = 0; yy < tam; yy += 2) {
          for (let xx = 0; xx < tam; xx += 2) {
            if (brilhoPixel(x + xx, y + yy) < 90) pretos++;

            total++;
          }
        }

        let densidade = pretos / total;

        let cx = x + tam / 2;
        let cy = y + tam / 2;

        let margemX = w * 0.08;
        let margemY = h * 0.08;

        if (
          densidade > 0.55 &&
          cx > margemX &&
          cx < w - margemX &&
          cy > margemY &&
          cy < h - margemY
        ) {
          candidatos.push({
            x: cx,
            y: cy,
            densidade: densidade,
          });
        }
      }
    }

    let filtrados = [];

    candidatos
      .sort((a, b) => b.densidade - a.densidade)
      .forEach((c) => {
        let perto = filtrados.some((f) => {
          return Math.hypot(f.x - c.x, f.y - c.y) < 35;
        });

        if (!perto) filtrados.push(c);
      });

    if (filtrados.length < 4) {
      document.getElementById("resultado").innerHTML =
        "⚠ Não encontrei os 4 quadrados pretos. Ajuste manualmente.";
      return;
    }

    function canto(tipo) {
      let melhor = null;

      filtrados.forEach((p) => {
        let score = 0;

        if (tipo === "SE") score = p.x + p.y;
        if (tipo === "SD") score = w - p.x + p.y;
        if (tipo === "IE") score = p.x + (h - p.y);
        if (tipo === "ID") score = w - p.x + (h - p.y);

        if (!melhor || score < melhor.score) {
          melhor = { ...p, score: score };
        }
      });

      return melhor;
    }

    let se = canto("SE");
    let sd = canto("SD");
    let ie = canto("IE");
    let id = canto("ID");

    pontos = [
      { x: se.x, y: se.y },
      { x: sd.x, y: sd.y },
      { x: ie.x, y: ie.y },
      { x: id.x, y: id.y },
    ];

    let xMin = Math.min(se.x, ie.x);
    let xMax = Math.max(sd.x, id.x);
    let yMin = Math.min(se.y, sd.y);
    let yMax = Math.max(ie.y, id.y);

    let largura = xMax - xMin;
    let altura = yMax - yMin;

    let modelos = JSON.parse(localStorage.getItem("modelosOMR")) || [];
    let modeloSelecionado = document.getElementById("modeloOMR").value;

    let calibracao =
      modeloSelecionado !== "" ? modelos[modeloSelecionado] : null;

    let areaCalibrada = calibracao
      ? calibracao.area
      : {
          x1: 0.28,
          x2: 0.14,
          y1: 0.07,
          y2: 0.1,
        };

    window.areaTabelaOMR = {
      x1: xMin + largura * areaCalibrada.x1,
      x2: xMax - largura * areaCalibrada.x2,
      y1: yMin + altura * areaCalibrada.y1,
      y2: yMax - altura * areaCalibrada.y2,
    };

    desenhar();

    document.getElementById("resultado").innerHTML =
      "✅ Área da tabela OMR detectada. Ajuste o retângulo azul se necessário.";
  }

  document.getElementById("detectarGrade").onclick = function () {
    detectarGrade();
  };

  document.getElementById("foto").onchange = function (e) {
    let arquivo = e.target.files[0];

    if (!arquivo) return;

    window.areaTabelaOMR = null;

    imagem.src = URL.createObjectURL(arquivo);

    imagem.onload = function () {
      canvas.height = canvas.width * (imagem.height / imagem.width);

      pontos = [
        { x: canvas.width * 0.2, y: canvas.height * 0.15 },
        { x: canvas.width * 0.85, y: canvas.height * 0.15 },
        { x: canvas.width * 0.2, y: canvas.height * 0.9 },
        { x: canvas.width * 0.85, y: canvas.height * 0.9 },
      ];

      desenhar();

      document.getElementById("painelCorrecao").style.display = "block";
    };
  };

  function pegarPosicao(e) {
    let rect = canvas.getBoundingClientRect();
    let toque = e.touches ? e.touches[0] : e;

    return {
      x: toque.clientX - rect.left,
      y: toque.clientY - rect.top,
    };
  }

  function iniciarArrasto(e) {
    let pos = pegarPosicao(e);

    arrastandoAzul = null;
    arrastando = null;

    if (window.areaTabelaOMR) {
      let cantos = [
        { x: window.areaTabelaOMR.x1, y: window.areaTabelaOMR.y1 },
        { x: window.areaTabelaOMR.x2, y: window.areaTabelaOMR.y1 },
        { x: window.areaTabelaOMR.x1, y: window.areaTabelaOMR.y2 },
        { x: window.areaTabelaOMR.x2, y: window.areaTabelaOMR.y2 },
      ];

      cantos.forEach((p, i) => {
        if (Math.hypot(pos.x - p.x, pos.y - p.y) < 25) {
          arrastandoAzul = i;
        }
      });

      if (arrastandoAzul !== null) return;
    }

    pontos.forEach((p, i) => {
      if (Math.hypot(pos.x - p.x, pos.y - p.y) < 25) {
        arrastando = i;
      }
    });
  }

  function mover(e) {
    if (arrastando === null && arrastandoAzul === null) return;

    e.preventDefault();

    let pos = pegarPosicao(e);

    if (arrastandoAzul !== null && window.areaTabelaOMR) {
      if (arrastandoAzul === 0) {
        window.areaTabelaOMR.x1 = pos.x;
        window.areaTabelaOMR.y1 = pos.y;
      }

      if (arrastandoAzul === 1) {
        window.areaTabelaOMR.x2 = pos.x;
        window.areaTabelaOMR.y1 = pos.y;
      }

      if (arrastandoAzul === 2) {
        window.areaTabelaOMR.x1 = pos.x;
        window.areaTabelaOMR.y2 = pos.y;
      }

      if (arrastandoAzul === 3) {
        window.areaTabelaOMR.x2 = pos.x;
        window.areaTabelaOMR.y2 = pos.y;
      }

      desenhar();
      return;
    }

    pontos[arrastando].x = pos.x;
    pontos[arrastando].y = pos.y;

    if (arrastando === 0) {
      pontos[1].y = pos.y;
      pontos[2].x = pos.x;
    }

    if (arrastando === 1) {
      pontos[0].y = pos.y;
      pontos[3].x = pos.x;
    }

    if (arrastando === 2) {
      pontos[0].x = pos.x;
      pontos[3].y = pos.y;
    }

    if (arrastando === 3) {
      pontos[1].x = pos.x;
      pontos[2].y = pos.y;
    }

    desenhar();
  }

  function pararArrasto() {
    arrastando = null;
    arrastandoAzul = null;
  }

  canvas.addEventListener("mousedown", iniciarArrasto);
  canvas.addEventListener("mousemove", mover);
  canvas.addEventListener("mouseup", pararArrasto);

  canvas.addEventListener("touchstart", iniciarArrasto);
  canvas.addEventListener("touchmove", mover);
  canvas.addEventListener("touchend", pararArrasto);

  document.getElementById("debugVisual").onclick = function () {
    mostrarDebug = !mostrarDebug;

    this.innerHTML = mostrarDebug
      ? "👁 Debug Visual: Ligado"
      : "👁 Debug Visual: Desligado";
  };

  document.getElementById("analisar").onclick = async function () {
    if (document.getElementById("turmaSelecionada").value === "") {
      alert("📚 Selecione uma turma.");
      return;
    }

    if (document.getElementById("aluno").value === "") {
      alert("👨‍🎓 Selecione um aluno.");
      return;
    }

    if (document.getElementById("gabarito").value.trim() === "") {
      alert("📝 Digite um gabarito.");
      return;
    }

    desenhar();

    let gabarito = document
      .getElementById("gabarito")
      .value.toUpperCase()
      .replaceAll(" ", "")
      .split(",")
      .filter((item) => item.trim() !== "");

    let totalQuestoes =
      parseInt(document.getElementById("totalQuestoes").value) ||
      gabarito.length;

    let valorProva =
      parseFloat(
        document.getElementById("valorProva").value.replace(",", ".")
      ) || 10;

    let modelos = JSON.parse(localStorage.getItem("modelosOMR")) || [];
    let modeloSelecionado = document.getElementById("modeloOMR").value;

    let calibracao =
      modeloSelecionado !== "" ? modelos[modeloSelecionado] : null;

    let configOMR = calibracao
      ? calibracao.omr
      : {
          alternativas: ["A", "B", "C", "D"],
          colunas: [0.18, 0.4, 0.62, 0.84],
          topoBolhas: 0.04,
          baixoBolhas: 0.04,
          raioLeitura: 5,
          limiteMarcado: 0.18,
          diferencaMinima: 0.05,
        };

    let respostas = [];

    function pontoGrade(u, v) {
      if (window.areaTabelaOMR) {
        return {
          x:
            window.areaTabelaOMR.x1 +
            (window.areaTabelaOMR.x2 - window.areaTabelaOMR.x1) * u,
          y:
            window.areaTabelaOMR.y1 +
            (window.areaTabelaOMR.y2 - window.areaTabelaOMR.y1) * v,
        };
      }

      let topo = {
        x: pontos[0].x + (pontos[1].x - pontos[0].x) * u,
        y: pontos[0].y + (pontos[1].y - pontos[0].y) * u,
      };

      let baixo = {
        x: pontos[2].x + (pontos[3].x - pontos[2].x) * u,
        y: pontos[2].y + (pontos[3].y - pontos[2].y) * u,
      };

      return {
        x: topo.x + (baixo.x - topo.x) * v,
        y: topo.y + (baixo.y - topo.y) * v,
      };
    }

    let alturaUtil = 1 - configOMR.topoBolhas - configOMR.baixoBolhas;

    for (let linha = 0; linha < totalQuestoes; linha++) {
      let leituras = [];

      let v =
        configOMR.topoBolhas + ((linha + 0.5) * alturaUtil) / totalQuestoes;

      for (let col = 0; col < configOMR.alternativas.length; col++) {
        let ponto = pontoGrade(configOMR.colunas[col], v);

        let x = ponto.x;
        let y = ponto.y;
        let raio = configOMR.raioLeitura;

        let rx = Math.max(0, Math.floor(x - raio));
        let ry = Math.max(0, Math.floor(y - raio));
        let rw = raio * 2;
        let rh = raio * 2;

        if (rx + rw > canvas.width) rw = canvas.width - rx;
        if (ry + rh > canvas.height) rh = canvas.height - ry;

        let dados = ctx.getImageData(rx, ry, rw, rh).data;

        let escuros = 0;
        let total = 0;

        for (let i = 0; i < dados.length; i += 4) {
          let brilho = (dados[i] + dados[i + 1] + dados[i + 2]) / 3;

          if (brilho < 100) escuros++;

          total++;
        }

        let densidade = escuros / total;

        leituras.push({
          letra: configOMR.alternativas[col],
          densidade: densidade,
        });

        if (mostrarDebug) {
          ctx.strokeStyle = "lime";
          ctx.lineWidth = 2;
          ctx.strokeRect(rx, ry, rw, rh);

          ctx.fillStyle = "red";
          ctx.font = "12px Arial";
          ctx.fillText(configOMR.alternativas[col], x - 4, y - 13);
        }
      }

      leituras.sort((a, b) => b.densidade - a.densidade);

      let melhor = leituras[0];
      let segunda = leituras[1];

      let marcada = "-";

      if (melhor.densidade >= configOMR.limiteMarcado) {
        if (melhor.densidade - segunda.densidade < configOMR.diferencaMinima) {
          marcada = "⚠";
        } else {
          marcada = melhor.letra;
        }
      }

      respostas.push(marcada);
    }

    let acertos = 0;
    let detalhes = "";
    let totalRevisao = 0;

    for (let i = 0; i < totalQuestoes; i++) {
      let correta = gabarito[i] || "?";
      let marcada = respostas[i] || "?";
      let revisao = "";

      if (marcada === "⚠" || marcada === "-") {
        revisao = " ⚠ Revisar manualmente";
        totalRevisao++;
      }

      if (correta === marcada) {
        acertos++;
        detalhes +=
          "Questão " + (i + 1) + " ✅ marcou " + marcada + revisao + "<br>";
      } else {
        detalhes +=
          "Questão " +
          (i + 1) +
          " ❌ marcou " +
          marcada +
          " | correto " +
          correta +
          revisao +
          "<br>";
      }
    }

    let percentual = (acertos / totalQuestoes) * 100;
    let notaFinal = (acertos / totalQuestoes) * valorProva;

    let nomeAluno = document.getElementById("aluno").value || "Sem nome";

    ctx.fillStyle = "green";
    ctx.font = "bold 18px Arial";
    ctx.fillText("NOTA: " + notaFinal.toFixed(1) + "/" + valorProva, 20, 30);

    ctx.fillStyle = "blue";
    ctx.font = "bold 16px Arial";
    ctx.fillText(nomeAluno, 20, 55);

    const botaoAnalisar = document.getElementById("analisar");

    if (botaoAnalisar) {
      botaoAnalisar.disabled = true;

      botaoAnalisar.innerHTML =
        "<span class='material-icons-round'>cloud_upload</span> Salvando...";
    }

    try {
      const usuario =
        window.auth?.currentUser || window.usuarioAtualAjudaProf || null;

      if (!usuario) {
        throw new Error("Faça login novamente para salvar a correção.");
      }

      if (!window.db || !window.firebaseFirestore) {
        throw new Error("O Firestore ainda não está disponível.");
      }

      const registroId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : Date.now().toString(36) +
            "-" +
            Math.random().toString(36).slice(2, 10);

      const agora = new Date();

      const imagemLocal = canvas.toDataURL("image/png");

      const turmaSelecionada =
        document.getElementById("turmaSelecionada").value;

      const registroNuvem = {
        id: registroId,

        nome: nomeAluno,

        turma: turmaSelecionada,

        nota: notaFinal.toFixed(1) + "/" + valorProva,

        notaBruta: acertos + "/" + totalQuestoes,

        valorProva: valorProva,

        habilidadeBNCC: document.getElementById("habilidadeProva").value,

        descritor: document.getElementById("descritorProva").value,

        notaFinal: Number(notaFinal.toFixed(2)),

        acertos: acertos,

        totalQuestoes: totalQuestoes,

        percentual: percentual.toFixed(1) + "%",

        percentualNumero: Number(percentual.toFixed(2)),

        revisoes: totalRevisao,

        data: agora.toLocaleDateString(),

        hora: agora.toLocaleTimeString(),

        criadoEmISO: agora.toISOString(),

        respostas: respostas.join(", "),

        gabarito: gabarito.join(", "),

        detalhes: detalhes,

        temImagemLocal: true,

        imagemNaNuvem: false,

        origem: "correcao-omr",

        criadoEm: window.firebaseFirestore.serverTimestamp(),
      };

      await window.firebaseFirestore.setDoc(
        window.firebaseFirestore.doc(
          window.db,
          "usuarios",
          usuario.uid,
          "historico",
          registroId
        ),

        registroNuvem
      );

      /* Compatibilidade temporária: A imagem continua apenas neste aparelho, pois o plano atual não permite Firebase Storage. O histórico textual já está salvo na nuvem. */
      const chaveHistoricoLocal = `ajudaprof_historico_local_${usuario.uid}`;

      let historicoLocal = [];

      try {
        const dadosLocais = JSON.parse(
          localStorage.getItem(chaveHistoricoLocal)
        );

        historicoLocal = Array.isArray(dadosLocais) ? dadosLocais : [];
      } catch (erroLocal) {
        console.warn(
          "Não foi possível ler o cache local de imagens:",
          erroLocal
        );

        historicoLocal = [];
      }

      historicoLocal.push({
        ...registroNuvem,

        imagem: imagemLocal,

        id: registroId,
      });

      try {
        localStorage.setItem(
          chaveHistoricoLocal,

          JSON.stringify(historicoLocal)
        );
      } catch (erroLocal) {
        console.warn(
          "Os dados foram salvos na nuvem, mas a imagem não pôde ser mantida neste aparelho:",
          erroLocal
        );
      }

      let corNota = "red";

      if (percentual >= 70) {
        corNota = "green";
      } else if (percentual >= 50) {
        corNota = "orange";
      }

      document.getElementById("resultado").innerHTML =
        "📋 Respostas:<br><br>" +
        respostas.join(", ") +
        "<br><br>👨‍🎓 Aluno: " +
        nomeAluno +
        "<br>✅ Acertos: " +
        acertos +
        "/" +
        totalQuestoes +
        "<br><span style='color:" +
        corNota +
        ";font-weight:bold;'>📊 Nota: " +
        notaFinal.toFixed(1) +
        " / " +
        valorProva +
        " (" +
        percentual.toFixed(1) +
        "%)</span>" +
        "<br><br><b>Detalhes:</b><br>" +
        detalhes +
        "<br><br>⚠ Revisões sugeridas: " +
        totalRevisao +
        "<br><br>☁️ Dados salvos na nuvem" +
        "<br>📱 Imagem mantida somente neste aparelho";

      if (typeof mostrarToast === "function") {
        mostrarToast("☁️ Correção salva na nuvem.");
      }
    } catch (erro) {
      console.error("Erro ao salvar a correção no Firestore:", erro);

      document.getElementById("resultado").innerHTML =
        "❌ A correção foi calculada, mas não foi possível confirmar o salvamento na nuvem.<br><br>" +
        "Verifique sua conexão e tente novamente.";

      if (typeof mostrarToast === "function") {
        mostrarToast("❌ Não foi possível salvar a correção.");
      }
    } finally {
      if (botaoAnalisar) {
        botaoAnalisar.disabled = false;

        botaoAnalisar.innerHTML = "Analisar Marcações";
      }
    }
  };
}