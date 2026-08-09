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
    ` <h1>Corrigir Prova</h1> <input id="foto" type="file" accept="image/*" capture style="display:none;"> <button id="abrirCamera"> <span class="material-icons-round">photo_camera</span> Tirar ou escolher foto </button> <br><br> <p>Arraste os pontos vermelhos até encaixar no gabarito. Depois ajuste o retângulo azul.</p> <button id="detectarGrade"> <span class="material-icons-round">center_focus_strong</span> Auto enquadrar gabarito </button> <canvas id="canvas" width="320"></canvas> <div id="painelCorrecao" style="display:none;"> <select id="turmaSelecionada"> <option value="">Selecionar turma</option> </select> <br><br> <select id="aluno"> <option value="">Selecionar aluno</option> </select> <br><br> <div class="card"> <h3>Configuração da prova</h3> <input id="totalQuestoes" type="number" min="1" placeholder="Quantidade de questões. Ex: 10"> <input id="valorProva" type="number" min="0" step="0.1" placeholder="Valor da prova. Ex: 10"> <input id="gabarito" type="hidden"> <div class="editor-gabarito"> <p class="editor-gabarito-ajuda">Defina a alternativa correta de cada questão.</p> <div id="listaGabaritoQuestoes" class="lista-gabarito-questoes"></div> </div> <input id="habilidadeProva" placeholder="Habilidade BNCC. Ex: EF06MA01"> <input id="descritorProva" placeholder="Descritor. Ex: D1, D2, D5"> <button id="salvarGabarito">Salvar Gabarito</button> </div> <br> <div class="card"> <h3>Modelo de gabarito</h3> <select id="modeloOMR"> <option value="">Modelo padrão</option> <option value="marcadores4">Gabarito com 4 marcadores (10 questões)</option> </select> <button id="salvarModeloOMR">Salvar modelo ajustado</button> <button id="excluirModeloOMR">Excluir modelo selecionado</button> </div> <button id="debugVisual">Debug Visual: Ligado</button> <button id="analisar" class="botao-analisar-destaque"> <span class="material-icons-round">fact_check</span> Analisar Marcações </button> <p id="resultado"></p> <button onclick="document.getElementById('foto').click();"> Foto do próximo aluno </button> </div> <button onclick="voltarHome()">Voltar</button> ` +
    barraInferior("provas");

  aplicarTemaSalvo();

  // Destaque visual do botão principal da correção.
  // O CSS é inserido aqui para que o arquivo funcione sem exigir alteração no style.css.
  if (!document.getElementById("estilo-correcao-omr")) {
    const estiloCorrecao = document.createElement("style");
    estiloCorrecao.id = "estilo-correcao-omr";
    estiloCorrecao.textContent = ` .editor-gabarito { margin: 12px 0 14px; padding: 12px; border: 1px solid rgba(100, 116, 139, .28); border-radius: 14px; background: rgba(148, 163, 184, .08); } .editor-gabarito-ajuda { margin: 0 0 10px; font-size: .92rem; opacity: .82; } .lista-gabarito-questoes { display: grid; gap: 8px; max-height: 360px; overflow-y: auto; padding-right: 2px; } .linha-gabarito-questao { display: grid; grid-template-columns: minmax(92px, 1fr) minmax(110px, 150px); align-items: center; gap: 10px; padding: 8px 10px; border-radius: 11px; background: rgba(255, 255, 255, .72); border: 1px solid rgba(100, 116, 139, .18); } .linha-gabarito-questao label { margin: 0; font-weight: 700; } .linha-gabarito-questao select { width: 100%; margin: 0; min-height: 42px; font-weight: 800; text-align: center; } .linha-gabarito-questao.incompleta { border-color: #ef4444; box-shadow: 0 0 0 2px rgba(239, 68, 68, .12); } body.darkMode .editor-gabarito, body.dark-mode .editor-gabarito { background: rgba(15, 23, 42, .45); border-color: rgba(148, 163, 184, .25); } body.darkMode .linha-gabarito-questao, body.dark-mode .linha-gabarito-questao { background: rgba(30, 41, 59, .82); border-color: rgba(148, 163, 184, .2); } @media (max-width: 420px) { .linha-gabarito-questao { grid-template-columns: 1fr 112px; } } .botao-analisar-destaque { width: min(100%, 520px); min-height: 54px; margin: 18px auto 10px; padding: 14px 20px; display: flex; align-items: center; justify-content: center; gap: 10px; border: 0; border-radius: 16px; background: linear-gradient(135deg, #1565c0, #3949ab); color: #fff; font-size: 1.05rem; font-weight: 800; letter-spacing: .2px; box-shadow: 0 8px 22px rgba(21, 101, 192, .32); cursor: pointer; transition: transform .18s ease, box-shadow .18s ease, filter .18s ease; } .botao-analisar-destaque .material-icons-round { font-size: 25px; } .botao-analisar-destaque:hover { transform: translateY(-1px); box-shadow: 0 10px 26px rgba(21, 101, 192, .4); filter: brightness(1.04); } .botao-analisar-destaque:active { transform: translateY(1px); } .botao-analisar-destaque:disabled { opacity: .72; cursor: wait; transform: none; } @media (prefers-color-scheme: dark) { .botao-analisar-destaque { background: linear-gradient(135deg, #42a5f5, #7e57c2); color: #ffffff; box-shadow: 0 8px 22px rgba(66, 165, 245, .28); } } `;
    document.head.appendChild(estiloCorrecao);
  }

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

  let gabaritoSalvo = localStorage.getItem("gabarito") || "";
  let totalQuestoesSalvo = localStorage.getItem("totalQuestoes");
  let valorProvaSalvo = localStorage.getItem("valorProva");
  let habilidadeProvaSalva = localStorage.getItem("habilidadeProva");
  let descritorProvaSalvo = localStorage.getItem("descritorProva");

  const campoTotalQuestoes = document.getElementById("totalQuestoes");
  const campoGabarito = document.getElementById("gabarito");
  const listaGabaritoQuestoes = document.getElementById(
    "listaGabaritoQuestoes"
  );

  function normalizarGabarito(valor) {
    if (Array.isArray(valor)) {
      return valor
        .map((letra) =>
          String(letra || "")
            .trim()
            .toUpperCase()
        )
        .filter((letra) => ["A", "B", "C", "D"].includes(letra));
    }

    return String(valor || "")
      .toUpperCase()
      .replaceAll(" ", "")
      .split(",")
      .map((letra) => letra.trim())
      .filter((letra) => ["A", "B", "C", "D"].includes(letra));
  }

  function obterRespostasGabaritoVisual() {
    return [
      ...listaGabaritoQuestoes.querySelectorAll("select[data-questao]"),
    ].map((select) => String(select.value || "").toUpperCase());
  }

  function sincronizarCampoGabarito() {
    const respostas = obterRespostasGabaritoVisual();
    campoGabarito.value = respostas.join(",");
    return respostas;
  }

  function renderizarEditorGabarito(respostasIniciais = null) {
    const total = Math.max(0, parseInt(campoTotalQuestoes.value, 10) || 0);
    const respostasAtuais = respostasIniciais
      ? normalizarGabarito(respostasIniciais)
      : obterRespostasGabaritoVisual();

    listaGabaritoQuestoes.innerHTML = "";

    if (!total) {
      listaGabaritoQuestoes.innerHTML =
        '<p style="margin:0;opacity:.75;">Informe a quantidade de questões para montar o gabarito.</p>';
      campoGabarito.value = "";
      return;
    }

    const fragmento = document.createDocumentFragment();

    for (let indice = 0; indice < total; indice++) {
      const linha = document.createElement("div");
      linha.className = "linha-gabarito-questao";

      const rotulo = document.createElement("label");
      rotulo.htmlFor = `gabaritoQuestao${indice + 1}`;
      rotulo.textContent = `Questão ${indice + 1}`;

      const select = document.createElement("select");
      select.id = `gabaritoQuestao${indice + 1}`;
      select.dataset.questao = String(indice + 1);
      select.innerHTML =
        '<option value="">Selecione</option>' +
        '<option value="A">A</option>' +
        '<option value="B">B</option>' +
        '<option value="C">C</option>' +
        '<option value="D">D</option>';
      select.value = respostasAtuais[indice] || "";

      select.addEventListener("change", () => {
        linha.classList.remove("incompleta");
        sincronizarCampoGabarito();
      });

      linha.append(rotulo, select);
      fragmento.appendChild(linha);
    }

    listaGabaritoQuestoes.appendChild(fragmento);
    sincronizarCampoGabarito();
  }

  function validarGabaritoVisual() {
    const total = parseInt(campoTotalQuestoes.value, 10) || 0;

    if (total < 1) {
      alert("📝 Informe a quantidade de questões.");
      campoTotalQuestoes.focus();
      return null;
    }

    const selects = [
      ...listaGabaritoQuestoes.querySelectorAll("select[data-questao]"),
    ];
    const incompleto = selects.find((select) => !select.value);

    listaGabaritoQuestoes
      .querySelectorAll(".linha-gabarito-questao")
      .forEach((linha) => linha.classList.remove("incompleta"));

    if (incompleto) {
      const numero = incompleto.dataset.questao;
      incompleto
        .closest(".linha-gabarito-questao")
        ?.classList.add("incompleta");
      incompleto.scrollIntoView({ behavior: "smooth", block: "center" });
      incompleto.focus();
      alert(`📝 Selecione a resposta da questão ${numero}.`);
      return null;
    }

    const respostas = sincronizarCampoGabarito();

    if (respostas.length !== total) {
      alert("📝 Complete todas as respostas do gabarito.");
      return null;
    }

    return respostas;
  }

  const respostasSalvas = normalizarGabarito(gabaritoSalvo);

  if (totalQuestoesSalvo) {
    campoTotalQuestoes.value = totalQuestoesSalvo;
  } else if (respostasSalvas.length) {
    campoTotalQuestoes.value = respostasSalvas.length;
  }

  campoGabarito.value = respostasSalvas.join(",");

  if (valorProvaSalvo)
    document.getElementById("valorProva").value = valorProvaSalvo;
  if (habilidadeProvaSalva)
    document.getElementById("habilidadeProva").value = habilidadeProvaSalva;
  if (descritorProvaSalvo)
    document.getElementById("descritorProva").value = descritorProvaSalvo;

  renderizarEditorGabarito(respostasSalvas);

  campoTotalQuestoes.addEventListener("input", () => {
    renderizarEditorGabarito();
  });

  document.getElementById("salvarGabarito").onclick = function () {
    const respostas = validarGabaritoVisual();

    if (!respostas) return;

    localStorage.setItem("gabarito", respostas.join(","));
    localStorage.setItem("totalQuestoes", campoTotalQuestoes.value);
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

  const MODELO_MARCADORES_4 = {
    nome: "Gabarito com 4 marcadores (10 questões)",
    prova: { totalQuestoes: 10 },
    area: {
      // Limites da grade de respostas em relação ao retângulo formado
      // pelos centros dos quatro quadrados pretos.
      x1: 0.22,
      x2: 0.06,
      y1: 0.09,
      // V9.5: posição intermediária — deixa uma pequena margem
      // abaixo das bolhas da questão 10, sem cortar a última linha.
      y2: 0.075,
    },
    omr: {
      alternativas: ["A", "B", "C", "D"],
      // No modelo impresso, as bolhas têm posições estáveis em relação
      // aos centros dos quatro marcadores. Usar essas proporções evita
      // perder a questão 10 quando o retângulo azul é ajustado.
      usarMarcadoresDiretos: true,
      colunasMarcadores: [0.33, 0.5, 0.67, 0.84],
      primeiraLinhaMarcadores: 0.145,
      // V9.5: distribuição intermediária entre as versões 9.3 e 9.4.
      // Mantém a questão 10 centralizada e evita comprimir as linhas finais.
      ultimaLinhaMarcadores: 0.885,
      colunas: [0.15, 0.39, 0.64, 0.88],
      topoBolhas: 0.04,
      baixoBolhas: 0.04,
      raioLeitura: 8,
      // Limites conservadores: uma bolha só vira resposta quando existe
      // evidência real de preenchimento. Isso evita transformar uma linha
      // em branco na alternativa ligeiramente mais escura.
      limiteMarcado: 0.145,
      contrasteMinimo: 0.16,
      fracaoEscuraMinima: 0.27,
      destaqueMinimo: 0.04,
      diferencaMinima: 0.032,
    },
  };

  function obterModeloSelecionado() {
    const valor = document.getElementById("modeloOMR").value;

    if (valor === "marcadores4") {
      return MODELO_MARCADORES_4;
    }

    if (valor === "") {
      return null;
    }

    const modelos = JSON.parse(localStorage.getItem("modelosOMR")) || [];
    const index = Number(valor);

    return Number.isInteger(index) ? modelos[index] || null : null;
  }

  function carregarModelosOMR() {
    const modelos = JSON.parse(localStorage.getItem("modelosOMR")) || [];
    const select = document.getElementById("modeloOMR");
    const valorAtual = select.value;

    select.innerHTML =
      `<option value="">📄 Modelo padrão</option>` +
      `<option value="marcadores4">⬛ Gabarito com 4 marcadores (10 questões)</option>`;

    modelos.forEach((modelo, index) => {
      select.innerHTML += ` <option value="${index}">${modelo.nome}</option> `;
    });

    if ([...select.options].some((opcao) => opcao.value === valorAtual)) {
      select.value = valorAtual;
    }
  }

  carregarModelosOMR();

  document.getElementById("modeloOMR").onchange = function () {
    const modelo = obterModeloSelecionado();

    if (!modelo) return;

    if (modelo.prova) {
      if (modelo.prova.totalQuestoes) {
        campoTotalQuestoes.value = modelo.prova.totalQuestoes;
        renderizarEditorGabarito(modelo.prova.gabarito || campoGabarito.value);
      }

      if (modelo.prova.valorProva) {
        document.getElementById("valorProva").value = modelo.prova.valorProva;
      }

      if (modelo.prova.gabarito) {
        campoGabarito.value = normalizarGabarito(modelo.prova.gabarito).join(
          ","
        );
        renderizarEditorGabarito(modelo.prova.gabarito);
      }
    }

    if (
      this.value === "marcadores4" &&
      imagem.complete &&
      imagem.naturalWidth
    ) {
      detectarGrade();
    }
  };

  document.getElementById("excluirModeloOMR").onclick = function () {
    let index = document.getElementById("modeloOMR").value;

    if (index === "") {
      alert("Selecione um modelo para excluir.");
      return;
    }

    if (index === "marcadores4") {
      alert(
        "O modelo de 4 marcadores é padrão do aplicativo e não pode ser excluído."
      );
      return;
    }

    index = Number(index);

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

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    const w = canvas.width;
    const h = canvas.height;
    const limiteEscuro = 105;

    function pixelEscuro(x, y) {
      const i = (y * w + x) * 4;
      const brilho = (data[i] + data[i + 1] + data[i + 2]) / 3;
      return brilho < limiteEscuro;
    }

    // Localiza componentes escuros conectados. Os marcadores são grandes,
    // aproximadamente quadrados e muito mais preenchidos que textos e linhas.
    const visitado = new Uint8Array(w * h);
    const componentes = [];
    const minLado = Math.max(7, Math.round(w * 0.022));
    const maxLado = Math.max(34, Math.round(w * 0.16));

    for (let y = 2; y < h - 2; y++) {
      for (let x = 2; x < w - 2; x++) {
        const inicio = y * w + x;

        if (visitado[inicio] || !pixelEscuro(x, y)) continue;

        const fila = [inicio];
        visitado[inicio] = 1;
        let cursor = 0;
        let quantidade = 0;
        let minX = x;
        let maxX = x;
        let minY = y;
        let maxY = y;

        while (cursor < fila.length) {
          const atual = fila[cursor++];
          const px = atual % w;
          const py = Math.floor(atual / w);

          quantidade++;
          if (px < minX) minX = px;
          if (px > maxX) maxX = px;
          if (py < minY) minY = py;
          if (py > maxY) maxY = py;

          const vizinhos = [atual - 1, atual + 1, atual - w, atual + w];

          for (const vizinho of vizinhos) {
            if (vizinho < 0 || vizinho >= w * h || visitado[vizinho]) continue;

            const vx = vizinho % w;
            const vy = Math.floor(vizinho / w);

            if (Math.abs(vx - px) + Math.abs(vy - py) !== 1) continue;
            if (!pixelEscuro(vx, vy)) continue;

            visitado[vizinho] = 1;
            fila.push(vizinho);
          }
        }

        const largura = maxX - minX + 1;
        const altura = maxY - minY + 1;
        const proporcao = largura / altura;
        const preenchimento = quantidade / (largura * altura);

        if (
          largura >= minLado &&
          altura >= minLado &&
          largura <= maxLado &&
          altura <= maxLado &&
          proporcao >= 0.62 &&
          proporcao <= 1.55 &&
          preenchimento >= 0.48
        ) {
          componentes.push({
            x: (minX + maxX) / 2,
            y: (minY + maxY) / 2,
            largura,
            altura,
            preenchimento,
            area: quantidade,
          });
        }
      }
    }

    // Remove candidatos muito próximos, mantendo o mais sólido.
    const candidatos = [];

    componentes
      .sort((a, b) => b.area * b.preenchimento - a.area * a.preenchimento)
      .forEach((componente) => {
        const distanciaMinima = Math.max(
          18,
          Math.min(componente.largura, componente.altura) * 1.8
        );
        const repetido = candidatos.some(
          (outro) =>
            Math.hypot(outro.x - componente.x, outro.y - componente.y) <
            distanciaMinima
        );

        if (!repetido) candidatos.push(componente);
      });

    if (candidatos.length < 4) {
      document.getElementById("resultado").innerHTML =
        "⚠ Não encontrei os 4 quadrados pretos. Aproxime a câmera, evite sombras e ajuste manualmente os pontos vermelhos.";
      return;
    }

    // Testa combinações de quatro candidatos e escolhe o retângulo mais amplo
    // com dois pontos na parte superior e dois na parte inferior.
    const limiteCandidatos = candidatos.slice(0, 14);
    let melhorConjunto = null;
    let melhorPontuacao = -Infinity;

    for (let a = 0; a < limiteCandidatos.length - 3; a++) {
      for (let b = a + 1; b < limiteCandidatos.length - 2; b++) {
        for (let c = b + 1; c < limiteCandidatos.length - 1; c++) {
          for (let d = c + 1; d < limiteCandidatos.length; d++) {
            const grupo = [
              limiteCandidatos[a],
              limiteCandidatos[b],
              limiteCandidatos[c],
              limiteCandidatos[d],
            ];

            const ordenadosY = [...grupo].sort((p1, p2) => p1.y - p2.y);
            const superiores = ordenadosY
              .slice(0, 2)
              .sort((p1, p2) => p1.x - p2.x);
            const inferiores = ordenadosY
              .slice(2)
              .sort((p1, p2) => p1.x - p2.x);
            const se = superiores[0];
            const sd = superiores[1];
            const ie = inferiores[0];
            const id = inferiores[1];

            const larguraTopo = Math.hypot(sd.x - se.x, sd.y - se.y);
            const larguraBaixo = Math.hypot(id.x - ie.x, id.y - ie.y);
            const alturaEsquerda = Math.hypot(ie.x - se.x, ie.y - se.y);
            const alturaDireita = Math.hypot(id.x - sd.x, id.y - sd.y);

            if (larguraTopo < w * 0.28 || larguraBaixo < w * 0.28) continue;
            if (alturaEsquerda < h * 0.3 || alturaDireita < h * 0.3) continue;

            const diferencaLargura =
              Math.abs(larguraTopo - larguraBaixo) /
              Math.max(larguraTopo, larguraBaixo);
            const diferencaAltura =
              Math.abs(alturaEsquerda - alturaDireita) /
              Math.max(alturaEsquerda, alturaDireita);
            const alinhamentoTopo = Math.abs(se.y - sd.y) / h;
            const alinhamentoBaixo = Math.abs(ie.y - id.y) / h;
            const alinhamentoEsquerda = Math.abs(se.x - ie.x) / w;
            const alinhamentoDireita = Math.abs(sd.x - id.x) / w;

            const areaRetangulo =
              ((larguraTopo + larguraBaixo) / 2) *
              ((alturaEsquerda + alturaDireita) / 2);
            const penalidade =
              (diferencaLargura + diferencaAltura) * 2 +
              alinhamentoTopo +
              alinhamentoBaixo +
              alinhamentoEsquerda +
              alinhamentoDireita;
            const solidez = grupo.reduce(
              (soma, item) => soma + item.preenchimento,
              0
            );
            const pontuacao =
              areaRetangulo / (w * h) + solidez * 0.08 - penalidade;

            if (pontuacao > melhorPontuacao) {
              melhorPontuacao = pontuacao;
              melhorConjunto = { se, sd, ie, id };
            }
          }
        }
      }
    }

    if (!melhorConjunto) {
      document.getElementById("resultado").innerHTML =
        "⚠ Encontrei áreas escuras, mas não consegui formar os quatro cantos do gabarito. Ajuste os pontos vermelhos manualmente.";
      return;
    }

    const { se, sd, ie, id } = melhorConjunto;

    pontos = [
      { x: se.x, y: se.y },
      { x: sd.x, y: sd.y },
      { x: ie.x, y: ie.y },
      { x: id.x, y: id.y },
    ];

    const xMin = Math.min(se.x, ie.x);
    const xMax = Math.max(sd.x, id.x);
    const yMin = Math.min(se.y, sd.y);
    const yMax = Math.max(ie.y, id.y);
    const largura = xMax - xMin;
    const altura = yMax - yMin;
    // Ao localizar quatro marcadores, ativa automaticamente o modelo
    // correspondente. Assim o usuário não precisa selecioná-lo novamente
    // e a leitura não cai por engano no modelo padrão.
    const seletorModelo = document.getElementById("modeloOMR");
    if (seletorModelo && seletorModelo.value === "") {
      seletorModelo.value = "marcadores4";
      campoTotalQuestoes.value = 10;
      renderizarEditorGabarito(campoGabarito.value);
    }

    const calibracao = obterModeloSelecionado();
    const areaCalibrada = calibracao?.area || {
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
      document.getElementById("modeloOMR").value === "marcadores4"
        ? "✅ Quatro marcadores encontrados e grade de 10 questões enquadrada. Confira o retângulo azul antes de analisar."
        : "✅ Área da tabela OMR detectada. Ajuste o retângulo azul se necessário.";
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

      if (document.getElementById("modeloOMR").value === "marcadores4") {
        setTimeout(detectarGrade, 80);
      }
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

    const gabarito = validarGabaritoVisual();

    if (!gabarito) {
      return;
    }

    desenhar();

    let totalQuestoes =
      parseInt(campoTotalQuestoes.value, 10) || gabarito.length;

    let valorProva =
      parseFloat(
        document.getElementById("valorProva").value.replace(",", ".")
      ) || 10;

    const calibracao = obterModeloSelecionado();

    const configOMR = calibracao?.omr || {
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

    /* * A leitura é feita em um canvas limpo, sem os retângulos vermelhos, * azuis, verdes e letras do modo Debug. Isso evita que os desenhos da * interface sejam confundidos com marcações do aluno. */
    const canvasLeitura = document.createElement("canvas");
    canvasLeitura.width = canvas.width;
    canvasLeitura.height = canvas.height;

    const ctxLeitura = canvasLeitura.getContext("2d", {
      willReadFrequently: true,
    });

    ctxLeitura.drawImage(imagem, 0, 0, canvas.width, canvas.height);

    function brilhoPercebido(r, g, b) {
      return r * 0.299 + g * 0.587 + b * 0.114;
    }

    /* * Mede o contraste entre o miolo da bolha e o papel ao redor. * Uma bolha vazia possui centro claro, mesmo tendo contorno impresso. * Uma bolha preenchida possui centro escuro. Essa comparação local é * muito mais estável que um limite fixo de pixels escuros. */
    function medirMarcacao(x, y, raio) {
      const raioCentro = Math.max(2.4, raio * 0.46);
      const raioFundoMin = raio * 1.18;
      const raioFundoMax = raio * 1.75;
      const alcance = Math.ceil(raioFundoMax);
      const xInicial = Math.max(0, Math.floor(x - alcance));
      const yInicial = Math.max(0, Math.floor(y - alcance));
      const xFinal = Math.min(canvas.width - 1, Math.ceil(x + alcance));
      const yFinal = Math.min(canvas.height - 1, Math.ceil(y + alcance));
      const largura = Math.max(1, xFinal - xInicial + 1);
      const altura = Math.max(1, yFinal - yInicial + 1);
      const pixels = ctxLeitura.getImageData(
        xInicial,
        yInicial,
        largura,
        altura
      ).data;

      let somaCentro = 0;
      let somaFundo = 0;
      let centroTotal = 0;
      let fundoTotal = 0;
      let centroMuitoEscuro = 0;
      let centroColorido = 0;

      for (let py = 0; py < altura; py++) {
        for (let px = 0; px < largura; px++) {
          const dx = xInicial + px - x;
          const dy = yInicial + py - y;
          const distancia2 = dx * dx + dy * dy;
          const i = (py * largura + px) * 4;
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const brilho = brilhoPercebido(r, g, b);
          const saturacao = Math.max(r, g, b) - Math.min(r, g, b);

          if (distancia2 <= raioCentro * raioCentro) {
            somaCentro += brilho;
            centroTotal++;

            if (brilho < 145) centroMuitoEscuro++;
            if (saturacao > 24 && brilho < 205) centroColorido++;
          } else if (
            distancia2 >= raioFundoMin * raioFundoMin &&
            distancia2 <= raioFundoMax * raioFundoMax
          ) {
            somaFundo += brilho;
            fundoTotal++;
          }
        }
      }

      if (!centroTotal) {
        return { pontuacao: 0, contraste: 0, fracaoEscura: 0 };
      }

      const mediaCentro = somaCentro / centroTotal;
      const mediaFundo = fundoTotal ? somaFundo / fundoTotal : 230;
      const contraste = Math.max(0, (mediaFundo - mediaCentro) / 255);
      const fracaoEscura = centroMuitoEscuro / centroTotal;
      const fracaoColorida = centroColorido / centroTotal;

      // O contraste local é o componente principal. As frações de pixels
      // escuros/coloridos reforçam marcações de caneta azul, roxa ou preta.
      const pontuacao =
        contraste * 0.64 + fracaoEscura * 0.26 + fracaoColorida * 0.1;

      return {
        pontuacao,
        contraste,
        fracaoEscura,
        mediaCentro,
        mediaFundo,
      };
    }

    /* * V9.3 — detector geométrico das linhas reais. * O retângulo azul passa a ser apenas uma referência aproximada. Para cada * questão, procuramos nas proximidades da posição esperada o alinhamento que * contém os quatro contornos circulares impressos. Isso reduz perdas causadas * por perspectiva, inclinação ou pequenos deslocamentos do retângulo azul. */
    function medirEstruturaBolha(x, y, raio) {
      const raioMin = Math.max(2.2, raio * 0.58);
      const raioMax = Math.max(3.2, raio * 1.18);
      const alcance = Math.ceil(raioMax);
      const xInicial = Math.max(0, Math.floor(x - alcance));
      const yInicial = Math.max(0, Math.floor(y - alcance));
      const xFinal = Math.min(canvas.width - 1, Math.ceil(x + alcance));
      const yFinal = Math.min(canvas.height - 1, Math.ceil(y + alcance));
      const largura = Math.max(1, xFinal - xInicial + 1);
      const altura = Math.max(1, yFinal - yInicial + 1);
      const pixels = ctxLeitura.getImageData(
        xInicial,
        yInicial,
        largura,
        altura
      ).data;

      let somaEscuridao = 0;
      let pixelsEscuros = 0;
      let total = 0;

      for (let py = 0; py < altura; py++) {
        for (let px = 0; px < largura; px++) {
          const dx = xInicial + px - x;
          const dy = yInicial + py - y;
          const distancia2 = dx * dx + dy * dy;

          if (
            distancia2 < raioMin * raioMin ||
            distancia2 > raioMax * raioMax
          ) {
            continue;
          }

          const i = (py * largura + px) * 4;
          const brilho = brilhoPercebido(
            pixels[i],
            pixels[i + 1],
            pixels[i + 2]
          );
          const escuridao = Math.max(0, (225 - brilho) / 225);

          somaEscuridao += escuridao;
          if (brilho < 185) pixelsEscuros++;
          total++;
        }
      }

      if (!total) return 0;

      const mediaEscuridao = somaEscuridao / total;
      const fracaoEscura = pixelsEscuros / total;
      return mediaEscuridao * 0.68 + fracaoEscura * 0.32;
    }

    function pontoEntreMarcadores(u, v) {
      const topo = {
        x: pontos[0].x + (pontos[1].x - pontos[0].x) * u,
        y: pontos[0].y + (pontos[1].y - pontos[0].y) * u,
      };
      const baixo = {
        x: pontos[2].x + (pontos[3].x - pontos[2].x) * u,
        y: pontos[2].y + (pontos[3].y - pontos[2].y) * u,
      };

      return {
        x: topo.x + (baixo.x - topo.x) * v,
        y: topo.y + (baixo.y - topo.y) * v,
      };
    }

    const usarMarcadoresDiretos =
      configOMR.usarMarcadoresDiretos &&
      document.getElementById("modeloOMR").value === "marcadores4";

    /* * V7 — leitura adaptativa por coluna, fotografia e comparação por linha. * Primeiro medimos todas as 40 bolhas. Depois calibramos cada coluna * separadamente, porque iluminação, perspectiva e impressão podem deixar * A, B, C e D com níveis diferentes. Isso evita que marcações verdadeiras * em uma coluna mais clara sejam confundidas com respostas em branco. * Também reconhecemos duas ou mais marcações na mesma linha. */
    const matrizLeituras = [];
    const todasPontuacoes = [];
    const posicoesLinhasDetectadas = [];

    function obterPosicaoEsperadaLinha(linha) {
      if (usarMarcadoresDiretos) {
        const inicio = configOMR.primeiraLinhaMarcadores;
        const fim = configOMR.ultimaLinhaMarcadores;
        return totalQuestoes > 1
          ? inicio + (linha * (fim - inicio)) / (totalQuestoes - 1)
          : (inicio + fim) / 2;
      }

      return (
        configOMR.topoBolhas + ((linha + 0.5) * alturaUtil) / totalQuestoes
      );
    }

    function detectarPosicaoRealLinha(linha) {
      const esperado = obterPosicaoEsperadaLinha(linha);
      const passoVertical = usarMarcadoresDiretos
        ? (configOMR.ultimaLinhaMarcadores -
            configOMR.primeiraLinhaMarcadores) /
          Math.max(1, totalQuestoes - 1)
        : alturaUtil / Math.max(1, totalQuestoes);

      // A busca fica restrita a menos de meia linha para nunca saltar para a
      // questão vizinha. O centro esperado continua servindo como leve âncora.
      const alcance = passoVertical * 0.34;
      const amostras = 17;
      let melhorV = esperado;
      let melhorPontuacao = -Infinity;

      for (let indice = 0; indice < amostras; indice++) {
        const proporcao = indice / (amostras - 1);
        const deslocamento = -alcance + proporcao * alcance * 2;
        const candidatoV = esperado + deslocamento;
        let estrutura = 0;

        for (let col = 0; col < configOMR.alternativas.length; col++) {
          const u = usarMarcadoresDiretos
            ? configOMR.colunasMarcadores[col]
            : configOMR.colunas[col];
          const ponto = usarMarcadoresDiretos
            ? pontoEntreMarcadores(u, candidatoV)
            : pontoGrade(u, candidatoV);
          estrutura += medirEstruturaBolha(
            ponto.x,
            ponto.y,
            configOMR.raioLeitura
          );
        }

        estrutura /= configOMR.alternativas.length;
        const penalidadeCentro =
          (Math.abs(deslocamento) / Math.max(0.0001, alcance)) * 0.018;
        const pontuacao = estrutura - penalidadeCentro;

        if (pontuacao > melhorPontuacao) {
          melhorPontuacao = pontuacao;
          melhorV = candidatoV;
        }
      }

      return { v: melhorV, esperado, qualidade: melhorPontuacao };
    }

    for (let linha = 0; linha < totalQuestoes; linha++) {
      const leituras = [];
      const geometriaLinha = detectarPosicaoRealLinha(linha);
      const v = geometriaLinha.v;
      posicoesLinhasDetectadas.push(geometriaLinha);

      for (let col = 0; col < configOMR.alternativas.length; col++) {
        const u = usarMarcadoresDiretos
          ? configOMR.colunasMarcadores[col]
          : configOMR.colunas[col];
        const ponto = usarMarcadoresDiretos
          ? pontoEntreMarcadores(u, v)
          : pontoGrade(u, v);
        const medicao = medirMarcacao(ponto.x, ponto.y, configOMR.raioLeitura);

        const leitura = {
          letra: configOMR.alternativas[col],
          densidade: medicao.pontuacao,
          contraste: medicao.contraste,
          fracaoEscura: medicao.fracaoEscura,
          x: ponto.x,
          y: ponto.y,
        };

        leituras.push(leitura);
        todasPontuacoes.push(leitura.densidade);
      }

      matrizLeituras.push(leituras);
    }

    function calcularLimiteAdaptativo(valores, opcoes = {}) {
      const numeros = valores
        .filter((valor) => Number.isFinite(valor))
        .sort((a, b) => a - b);

      const limiteMinimo = opcoes.limiteMinimo ?? 0.07;
      const limiteMaximo = opcoes.limiteMaximo ?? 0.42;
      const pesoSeparacao = opcoes.pesoSeparacao ?? 0.48;

      if (numeros.length < 2) {
        return {
          limite: 0.16,
          centroVazio: 0.08,
          centroMarcado: 0.28,
          separacao: 0.2,
          confiavel: false,
        };
      }

      // Inicialização robusta: parte baixa representa bolhas vazias e parte
      // alta representa possíveis preenchimentos.
      let centroVazio = numeros[Math.floor(numeros.length * 0.3)];
      let centroMarcado = numeros[Math.floor(numeros.length * 0.82)];

      if (centroMarcado <= centroVazio) {
        centroMarcado = numeros[numeros.length - 1];
      }

      // K-means simples com dois grupos.
      for (let rodada = 0; rodada < 16; rodada++) {
        const grupoVazio = [];
        const grupoMarcado = [];

        numeros.forEach((valor) => {
          const distanciaVazio = Math.abs(valor - centroVazio);
          const distanciaMarcado = Math.abs(valor - centroMarcado);
          (distanciaVazio <= distanciaMarcado ? grupoVazio : grupoMarcado).push(
            valor
          );
        });

        if (!grupoVazio.length || !grupoMarcado.length) break;

        centroVazio =
          grupoVazio.reduce((soma, valor) => soma + valor, 0) /
          grupoVazio.length;
        centroMarcado =
          grupoMarcado.reduce((soma, valor) => soma + valor, 0) /
          grupoMarcado.length;
      }

      if (centroVazio > centroMarcado) {
        [centroVazio, centroMarcado] = [centroMarcado, centroVazio];
      }

      const separacao = centroMarcado - centroVazio;
      const confiavel = separacao >= 0.028;

      let limite;
      if (confiavel) {
        // O limite fica perto do meio dos grupos. Por coluna, isso permite
        // reconhecer tinta real mesmo quando a coluna inteira ficou mais clara.
        limite = centroVazio + separacao * pesoSeparacao;
      } else {
        // Sem dois grupos claros, usamos a dispersão das bolhas mais vazias.
        const base = numeros.slice(
          0,
          Math.max(3, Math.ceil(numeros.length * 0.65))
        );
        const media =
          base.reduce((soma, valor) => soma + valor, 0) / base.length;
        const variancia =
          base.reduce((soma, valor) => soma + (valor - media) ** 2, 0) /
          base.length;
        const desvio = Math.sqrt(variancia);
        limite = media + Math.max(0.035, desvio * 2.6);
      }

      limite = Math.max(limiteMinimo, Math.min(limiteMaximo, limite));

      return {
        limite,
        centroVazio,
        centroMarcado,
        separacao,
        confiavel,
      };
    }

    // Calibração global serve de proteção e de informação no Debug.
    const calibracaoFoto = calcularLimiteAdaptativo(todasPontuacoes, {
      limiteMinimo: 0.08,
      pesoSeparacao: 0.52,
    });

    // A principal calibração da V6 é feita por coluna. Assim, uma marcação em D
    // não precisa atingir o mesmo valor absoluto de uma marcação em A/B/C.
    const calibracoesColuna = configOMR.alternativas.map((_, col) => {
      const valoresColuna = matrizLeituras.map((linha) => linha[col].densidade);
      const calibracao = calcularLimiteAdaptativo(valoresColuna, {
        limiteMinimo: 0.065,
        pesoSeparacao: 0.44,
      });

      // Nunca deixe a calibração local ficar excessivamente permissiva.
      // Ela pode baixar em relação ao limite global, mas somente quando existe
      // separação real entre vazias e preenchidas naquela coluna.
      if (!calibracao.confiavel) {
        calibracao.limite = Math.max(
          calibracao.limite,
          Math.min(calibracaoFoto.limite, calibracao.centroVazio + 0.045)
        );
      }

      return calibracao;
    });

    function sinalNormalizado(item, col) {
      const calibracao = calibracoesColuna[col];
      const divisor = Math.max(0.035, calibracao.separacao || 0.08);
      return (item.densidade - calibracao.centroVazio) / divisor;
    }

    /* * V7 — decisão híbrida por coluna + comparação dentro da própria linha. * * A calibração por coluna continua protegendo contra diferenças de luz, * perspectiva e impressão entre A/B/C/D. A decisão final, porém, também * compara as quatro bolhas da mesma questão. Isso resolve dois casos que a * V6 ainda confundia: * 1) uma terceira bolha fraca virar marcação múltipla fantasma; * 2) uma marca verdadeira, mas abaixo do limite absoluto da coluna, * ser classificada como em branco. */
    const margemQuaseMarcada = 0.02;
    const diferencaAmbiguaNormalizada = 0.2;

    for (let linha = 0; linha < matrizLeituras.length; linha++) {
      const leituras = matrizLeituras[linha].slice();
      const densidadesOrdenadas = leituras
        .map((item) => item.densidade)
        .sort((a, b) => a - b);
      const baseLinha = (densidadesOrdenadas[1] + densidadesOrdenadas[2]) / 2;

      const avaliadas = leituras
        .map((item) => {
          const col = configOMR.alternativas.indexOf(item.letra);
          const calibracao = calibracoesColuna[col];
          const sinal = sinalNormalizado(item, col);
          const elevacaoLinha = item.densidade - baseLinha;

          return {
            ...item,
            col,
            limiteLocal: calibracao.limite,
            centroVazioLocal: calibracao.centroVazio,
            separacaoLocal: Math.max(0.035, calibracao.separacao || 0.08),
            sinal,
            elevacaoLinha,
            preenchida: item.densidade >= calibracao.limite,
            quasePreenchida:
              item.densidade >= calibracao.limite - margemQuaseMarcada,
          };
        })
        .sort((a, b) => b.sinal - a.sinal);

      const melhor = avaliadas[0];
      const segunda = avaliadas[1];
      const melhorElevacao = Math.max(0, melhor.elevacaoLinha);

      // Uma bolha só entra como candidata múltipla se, além de ultrapassar o
      // limite da coluna, também se destacar do fundo da própria linha e não
      // ficar muito abaixo da marca mais forte daquela questão.
      const candidatasFortes = avaliadas.filter((item) => {
        if (!item.preenchida) return false;

        const elevacaoMinima = Math.max(0.016, melhorElevacao * 0.34);
        const pertoDaMelhor = item.sinal >= melhor.sinal - 0.4;
        const destaqueNaLinha =
          item.elevacaoLinha >= elevacaoMinima || item.sinal >= 0.78;

        return pertoDaMelhor && destaqueNaLinha;
      });

      let marcada = "-";

      // V9.6 — múltipla marcação: além das candidatas que ultrapassam o limite
      // absoluto, aceita uma segunda bolha quase preenchida quando ela também
      // apresenta evidência real dentro da própria linha. Isso recupera casos
      // como B+C sem tornar linhas em branco mais permissivas.
      const candidatasMultiplas = avaliadas.filter((item) => {
        if (item.preenchida) {
          return candidatasFortes.includes(item);
        }

        if (!item.quasePreenchida) return false;

        const proximidade = melhor.sinal - item.sinal;
        const elevacaoMinima = Math.max(0.02, melhorElevacao * 0.48);
        const evidenciaCentro =
          item.contraste >= 0.055 || item.fracaoEscura >= 0.1;

        return (
          proximidade < 0.3 &&
          item.elevacaoLinha >= elevacaoMinima &&
          item.sinal >= 0.28 &&
          evidenciaCentro
        );
      });

      /* * V9.7 — dupla marcação relativa. * * Em algumas fotos, duas bolhas realmente preenchidas ficam ambas abaixo * do limite absoluto da respectiva coluna. Nesse caso, a V9.6 descartava * as duas e devolvia "Em branco". * * Aqui comparamos as quatro bolhas da própria questão: as duas melhores * precisam apresentar ganho real sobre o padrão vazio e se separar das * outras duas. Uma linha totalmente vazia continua protegida porque não * possui esse ganho duplo nem a separação entre o segundo e o terceiro. */
      const terceira = avaliadas[2];
      const duplaRelativa = [melhor, segunda];
      const duplaAbaixoDoLimite =
        candidatasMultiplas.length < 2 &&
        duplaRelativa.every((item) => {
          const ganhoSobreVazio = item.densidade - item.centroVazioLocal;
          const ganhoMinimoDupla = Math.max(0.014, item.separacaoLocal * 0.14);
          const evidenciaCentro =
            item.contraste >= 0.05 || item.fracaoEscura >= 0.09;

          return (
            ganhoSobreVazio >= ganhoMinimoDupla &&
            item.elevacaoLinha >= 0.016 &&
            item.sinal >= 0.12 &&
            evidenciaCentro
          );
        }) &&
        (segunda.sinal - terceira.sinal >= 0.2 ||
          segunda.densidade - terceira.densidade >= 0.018) &&
        Math.abs(melhor.sinal - segunda.sinal) <= 0.58;

      if (candidatasMultiplas.length >= 2) {
        marcada =
          "MULTI:" + candidatasMultiplas.map((item) => item.letra).join("+");
      } else if (duplaAbaixoDoLimite) {
        marcada = "MULTI:" + duplaRelativa.map((item) => item.letra).join("+");
      } else if (candidatasFortes.length === 1) {
        const unica = candidatasFortes[0];
        const concorrente = avaliadas.find(
          (item) => item.letra !== unica.letra
        );

        if (
          concorrente &&
          concorrente.quasePreenchida &&
          unica.sinal - concorrente.sinal < diferencaAmbiguaNormalizada &&
          concorrente.elevacaoLinha >=
            Math.max(0.018, unica.elevacaoLinha * 0.55)
        ) {
          marcada = "⚠";
        } else {
          marcada = unica.letra;
        }
      } else {
        /* * Nenhuma bolha ultrapassou o limite absoluto. Ainda aceitamos uma * resposta quando ela domina claramente as outras três na própria * linha e possui ganho real sobre o padrão vazio da sua coluna. * Isso recupera marcações verdadeiras claras (como D na última linha) * sem transformar uma linha realmente vazia em uma letra arbitrária. */
        const diferencaDensidade = melhor.densidade - segunda.densidade;
        const diferencaSinal = melhor.sinal - segunda.sinal;
        const ganhoSobreVazio = melhor.densidade - melhor.centroVazioLocal;
        /* * V9.2 — recuperação conservadora de marcações leves. * Algumas marcações reais feitas com pouca pressão podem ficar logo abaixo * do limite adaptativo. Reduzimos apenas a exigência desta etapa de * recuperação; a detecção principal e a proteção contra múltiplas * marcações permanecem inalteradas. */
        const ganhoMinimo = Math.max(0.016, melhor.separacaoLocal * 0.18);

        const dominaLinha =
          diferencaDensidade >= 0.026 || diferencaSinal >= 0.36;
        const evidenciaReal =
          ganhoSobreVazio >= ganhoMinimo &&
          melhor.elevacaoLinha >= 0.018 &&
          melhor.sinal >= 0.15 &&
          (melhor.contraste >= 0.055 || melhor.fracaoEscura >= 0.1);

        if (dominaLinha && evidenciaReal) {
          marcada = melhor.letra;
        } else {
          const quaseAmbigua =
            melhor.quasePreenchida &&
            segunda.quasePreenchida &&
            Math.abs(melhor.sinal - segunda.sinal) < 0.18 &&
            melhor.elevacaoLinha >= 0.02;

          if (quaseAmbigua) marcada = "⚠";
        }
      }

      if (mostrarDebug) {
        leituras.forEach((item) => {
          const avaliada = avaliadas.find((a) => a.letra === item.letra);
          const selecionada =
            marcada === item.letra ||
            (marcada.startsWith("MULTI:") &&
              marcada.replace("MULTI:", "").split("+").includes(item.letra));

          ctx.strokeStyle = selecionada ? "#00c853" : "lime";
          ctx.lineWidth = selecionada ? 3 : 2;
          ctx.beginPath();
          ctx.arc(
            item.x,
            item.y,
            Math.max(4, configOMR.raioLeitura * 0.52),
            0,
            Math.PI * 2
          );
          ctx.stroke();

          ctx.fillStyle = "#e53935";
          ctx.font = "bold 9px Arial";
          ctx.fillText(
            item.letra +
              " " +
              item.densidade.toFixed(2) +
              " Δ" +
              avaliada.elevacaoLinha.toFixed(2),
            item.x - 16,
            item.y - 10
          );
        });

        if (linha === 0) {
          ctx.fillStyle = "#1565c0";
          ctx.font = "bold 10px Arial";
          ctx.fillText(
            "limites A-D: " +
              calibracoesColuna.map((c) => c.limite.toFixed(2)).join("/"),
            8,
            canvas.height - 8
          );
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
      const ehMultipla = marcada.startsWith("MULTI:");
      const letrasMultiplas = ehMultipla
        ? marcada.replace("MULTI:", "").replaceAll("+", " e ")
        : "";
      const textoMarcada =
        marcada === "-"
          ? "⬜ deixou em branco"
          : marcada === "⚠"
          ? "⚠ marcação incerta"
          : ehMultipla
          ? "⚠ marcou " + letrasMultiplas + " (múltipla marcação)"
          : "marcou " + marcada;

      if (marcada === "⚠" || ehMultipla) {
        revisao = " ⚠ Revisar manualmente";
        totalRevisao++;
      }

      if (correta === marcada) {
        acertos++;
        detalhes +=
          "Questão " + (i + 1) + " ✅ " + textoMarcada + revisao + "<br>";
      } else {
        detalhes +=
          "Questão " +
          (i + 1) +
          " ❌ " +
          textoMarcada +
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
        respostas
          .map((resposta) =>
            resposta === "-"
              ? "Em branco"
              : resposta === "⚠"
              ? "Revisar"
              : resposta.startsWith("MULTI:")
              ? "Múltipla: " +
                resposta.replace("MULTI:", "").replaceAll("+", " e ")
              : resposta
          )
          .join(", ") +
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

        botaoAnalisar.innerHTML =
          "<span class='material-icons-round'>fact_check</span> Analisar Marcações";
      }
    }
  };
}
