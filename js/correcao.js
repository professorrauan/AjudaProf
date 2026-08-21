async function abrirCorrecao() {
  /*
   * CORREÇÃO — TURMAS IMEDIATAS
   *
   * A tela não deve esperar uma consulta ao Firestore para aparecer.
   * Primeiro usamos o estado que o módulo Turmas já mantém em memória;
   * depois sincronizamos a nuvem em segundo plano.
   */
  let turmasPrecarregadas = [];

  try {
    if (typeof obterTurmasSalvas === "function") {
      const cacheTurmas = obterTurmasSalvas();

      if (Array.isArray(cacheTurmas)) {
        turmasPrecarregadas = cacheTurmas;
      }
    }
  } catch (erroCacheTurmas) {
    console.warn(
      "Não foi possível usar o cache imediato de turmas na correção:",
      erroCacheTurmas
    );
  }

  if (!Array.isArray(turmasPrecarregadas)) {
    turmasPrecarregadas = [];
  }

  document.body.innerHTML =
    ` <h1>Corrigir Prova</h1> <input id="foto" type="file" accept="image/*" capture style="display:none;"> <button id="abrirCamera"> <span class="material-icons-round">photo_camera</span> Tirar ou escolher foto </button> <br><br> <p>Arraste os pontos vermelhos até encaixar no gabarito. Depois ajuste o retângulo azul.</p> <button id="detectarGrade"> <span class="material-icons-round">center_focus_strong</span> Auto enquadrar gabarito </button> <canvas id="canvas" width="320"></canvas> <div id="painelCorrecao" style="display:none;"> <select id="turmaSelecionada"> <option value="">Selecionar turma</option> </select> <br><br> <select id="aluno"> <option value="">Selecionar aluno</option> </select> <br><br> <div class="card"> <h3>Configuração da prova</h3>
<div class="grupoCampo">
<label for="avaliacaoVinculada"><strong>📚 Avaliação cadastrada</strong></label>
<select id="avaliacaoVinculada">
<option value="">Selecione a turma primeiro</option>
</select>
<small id="ajudaAvaliacaoVinculada" style="display:block;margin-top:6px;opacity:.75;">
A nota confirmada será lançada automaticamente no Livro de Notas e no Boletim.
</small>
</div>
<input id="totalQuestoes" type="number" min="1" placeholder="Quantidade de questões. Ex: 10"> <input id="valorProva" type="number" min="0" step="0.1" placeholder="Valor da prova. Ex: 10"> <input id="gabarito" type="hidden"> <div class="editor-gabarito"> <p class="editor-gabarito-ajuda">Defina a alternativa correta de cada questão.</p> <div id="listaGabaritoQuestoes" class="lista-gabarito-questoes"></div> </div> <input id="habilidadeProva" placeholder="Habilidade BNCC. Ex: EF06MA01"> <input id="descritorProva" placeholder="Descritor. Ex: D1, D2, D5"> <button id="salvarGabarito">Salvar Gabarito</button> </div> <br> <div class="card"> <h3>Modelo de gabarito</h3> <select id="modeloOMR"> <option value="">Modelo padrão</option> <option value="marcadores4">Gabarito com 4 marcadores (10 questões)</option> </select> <button id="salvarModeloOMR">Salvar modelo ajustado</button> <button id="excluirModeloOMR">Excluir modelo selecionado</button> </div> <button id="debugVisual">Debug Visual: Ligado</button> <button id="analisar" class="botao-analisar-destaque"> <span class="material-icons-round">fact_check</span> Analisar Marcações </button> <p id="resultado"></p> <div id="revisaoRespostasOMR"></div> <button id="proximoAluno">Foto do próximo aluno</button> </div> <button onclick="voltarHome()">Voltar</button> ` +
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

  function preencherTurmasCorrecao(lista, preservarSelecao = true) {
    if (!selectTurma || !Array.isArray(lista)) {
      return;
    }

    const selecaoAtual = preservarSelecao
      ? selectTurma.value ||
        localStorage.getItem("correcaoTurmaAtiva") ||
        ""
      : "";

    selectTurma.innerHTML =
      '<option value="">Selecionar turma</option>';

    lista.forEach((turma) => {
      const nomeTurma =
        typeof turma?.nome === "string"
          ? turma.nome.trim()
          : "";

      if (!nomeTurma) {
        return;
      }

      const opcao = document.createElement("option");
      opcao.value = nomeTurma;
      opcao.textContent = nomeTurma;
      selectTurma.appendChild(opcao);
    });

    if (
      selecaoAtual &&
      [...selectTurma.options].some(
        (opcao) => opcao.value === selecaoAtual
      )
    ) {
      selectTurma.value = selecaoAtual;
    }
  }

  preencherTurmasCorrecao(turmas);

  function normalizarTextoVinculoCorrecao(valor) {
    return String(valor ?? "")
      .trim()
      .toLocaleLowerCase("pt-BR");
  }

  function obterProvasCadastradasCorrecao(turma) {
    const avaliacoes = Array.isArray(turma?.avaliacoes)
      ? turma.avaliacoes
      : [];

    return avaliacoes
      .map((avaliacao, indice) => ({ avaliacao, indice }))
      .filter(({ avaliacao }) => {
        const tipo = normalizarTextoVinculoCorrecao(
          avaliacao?.tipo || "prova"
        );

        return tipo === "prova";
      });
  }

  function chaveAvaliacaoCorrecao(avaliacao, indice) {
    if (avaliacao?.id) {
      return "id:" + String(avaliacao.id);
    }

    return [
      "legado",
      indice,
      normalizarTextoVinculoCorrecao(avaliacao?.nome),
      normalizarTextoVinculoCorrecao(avaliacao?.bimestre),
    ].join(":");
  }

  function preencherAvaliacoesCorrecao(turma) {
    const select = document.getElementById("avaliacaoVinculada");
    const ajuda = document.getElementById("ajudaAvaliacaoVinculada");

    if (!select) return;

    const provas = obterProvasCadastradasCorrecao(turma);
    const chaveSalva =
      localStorage.getItem("correcaoAvaliacaoAtiva") || "";

    select.innerHTML = "";

    if (!turma) {
      select.innerHTML =
        '<option value="">Selecione a turma primeiro</option>';
      select.disabled = true;
      return;
    }

    if (provas.length === 0) {
      select.innerHTML =
        '<option value="">Nenhuma prova cadastrada nesta turma</option>';
      select.disabled = true;

      if (ajuda) {
        ajuda.textContent =
          "Cadastre uma avaliação do tipo Prova na turma para que a nota seja enviada ao Livro de Notas e ao Boletim.";
      }

      localStorage.removeItem("correcaoAvaliacaoAtiva");
      return;
    }

    select.disabled = false;
    select.innerHTML =
      '<option value="">Selecione a avaliação</option>';

    provas.forEach(({ avaliacao, indice }) => {
      const option = document.createElement("option");
      const chave = chaveAvaliacaoCorrecao(avaliacao, indice);
      const valor = Number(avaliacao?.valor);
      const bimestre = avaliacao?.bimestre
        ? " • " + avaliacao.bimestre
        : "";
      const valorTexto = Number.isFinite(valor)
        ? " • valor " + valor.toLocaleString("pt-BR", {
            maximumFractionDigits: 2,
          })
        : "";

      option.value = chave;
      option.dataset.indice = String(indice);
      option.textContent =
        (avaliacao?.nome || "Prova sem nome") +
        bimestre +
        valorTexto;

      select.appendChild(option);
    });

    let chaveParaSelecionar = "";

    if (
      chaveSalva &&
      [...select.options].some(
        (option) => option.value === chaveSalva
      )
    ) {
      chaveParaSelecionar = chaveSalva;
    } else if (provas.length === 1) {
      chaveParaSelecionar = chaveAvaliacaoCorrecao(
        provas[0].avaliacao,
        provas[0].indice
      );
    }

    if (chaveParaSelecionar) {
      select.value = chaveParaSelecionar;
      select.dispatchEvent(
        new Event("change", { bubbles: true })
      );
    }

    if (ajuda) {
      ajuda.textContent =
        provas.length === 1
          ? "Esta prova foi vinculada automaticamente. A nota confirmada irá para o Livro de Notas e o Boletim."
          : "Escolha em qual avaliação cadastrada esta correção deve lançar a nota.";
    }
  }

  function obterAvaliacaoVinculadaCorrecao() {
    const select = document.getElementById("avaliacaoVinculada");
    const nomeTurma = document.getElementById("turmaSelecionada")?.value || "";
    const turma = turmas.find(
      (item) =>
        normalizarTextoVinculoCorrecao(item?.nome) ===
        normalizarTextoVinculoCorrecao(nomeTurma)
    );

    if (!select?.value || !turma) {
      return null;
    }

    const provas = obterProvasCadastradasCorrecao(turma);

    const encontrado = provas.find(({ avaliacao, indice }) => {
      return chaveAvaliacaoCorrecao(avaliacao, indice) === select.value;
    });

    if (!encontrado) return null;

    return {
      turma,
      avaliacao: encontrado.avaliacao,
      indiceAvaliacao: encontrado.indice,
      chave: select.value,
    };
  }

  async function lancarNotaNaAvaliacaoCorrecao({
    nomeTurma,
    nomeAluno,
    notaFinal,
    vinculacao,
  }) {
    if (!vinculacao?.avaliacao) {
      return { vinculada: false, motivo: "sem-avaliacao" };
    }

    const usuario =
      window.auth?.currentUser ||
      window.usuarioAtualAjudaProf ||
      null;

    if (
      !usuario?.uid ||
      !window.db ||
      !window.firebaseFirestore?.doc ||
      !window.firebaseFirestore?.getDoc ||
      !window.firebaseFirestore?.setDoc
    ) {
      throw new Error(
        "Firebase indisponível para atualizar a avaliação da turma."
      );
    }

    const { doc, getDoc, setDoc, serverTimestamp } =
      window.firebaseFirestore;

    const referenciaTurmas = doc(
      window.db,
      "usuarios",
      usuario.uid,
      "dados",
      "turmas"
    );

    const snapshot = await getDoc(referenciaTurmas);

    if (!snapshot.exists()) {
      throw new Error("O documento de turmas não foi encontrado.");
    }

    const dados = snapshot.data() || {};
    const listaAtualizada = Array.isArray(dados.itens)
      ? JSON.parse(JSON.stringify(dados.itens))
      : [];

    const normalizar = (valor) =>
      String(valor ?? "")
        .trim()
        .toLocaleLowerCase("pt-BR");

    const indiceTurma = listaAtualizada.findIndex(
      (item) => normalizar(item?.nome) === normalizar(nomeTurma)
    );

    if (indiceTurma < 0) {
      throw new Error("A turma da correção não foi encontrada.");
    }

    const turmaAtual = listaAtualizada[indiceTurma];

    if (!Array.isArray(turmaAtual.avaliacoes)) {
      turmaAtual.avaliacoes = [];
    }

    let indiceAvaliacao = -1;

    if (vinculacao.avaliacao.id) {
      indiceAvaliacao = turmaAtual.avaliacoes.findIndex(
        (avaliacao) =>
          String(avaliacao?.id || "") ===
          String(vinculacao.avaliacao.id)
      );
    }

    if (indiceAvaliacao < 0) {
      indiceAvaliacao = turmaAtual.avaliacoes.findIndex(
        (avaliacao) =>
          normalizar(avaliacao?.nome) ===
            normalizar(vinculacao.avaliacao.nome) &&
          normalizar(avaliacao?.bimestre) ===
            normalizar(vinculacao.avaliacao.bimestre) &&
          normalizar(avaliacao?.tipo || "prova") === "prova"
      );
    }

    if (indiceAvaliacao < 0) {
      throw new Error("A avaliação vinculada não foi encontrada.");
    }

    const avaliacaoAtual = turmaAtual.avaliacoes[indiceAvaliacao];

    if (
      !avaliacaoAtual.notas ||
      typeof avaliacaoAtual.notas !== "object" ||
      Array.isArray(avaliacaoAtual.notas)
    ) {
      avaliacaoAtual.notas = {};
    }

    const alunos = Array.isArray(turmaAtual.alunos)
      ? turmaAtual.alunos
      : [];

    const alunoOficial =
      alunos.find((aluno) =>
        normalizar(
          typeof aluno === "string"
            ? aluno
            : aluno?.nome || aluno?.nomeAluno || ""
        ) === normalizar(nomeAluno)
      ) || nomeAluno;

    const chaveAluno =
      typeof alunoOficial === "string"
        ? alunoOficial
        : alunoOficial?.nome ||
          alunoOficial?.nomeAluno ||
          nomeAluno;

    const nota = Number(notaFinal);

    if (!Number.isFinite(nota)) {
      throw new Error("A nota calculada é inválida.");
    }

    avaliacaoAtual.notas[chaveAluno] =
      Number(nota.toFixed(2));

    turmaAtual.avaliacoes[indiceAvaliacao] = avaliacaoAtual;
    listaAtualizada[indiceTurma] = turmaAtual;

    await setDoc(
      referenciaTurmas,
      {
        itens: listaAtualizada,
        atualizadoEm: serverTimestamp(),
      },
      { merge: true }
    );

    try {
      if (typeof carregarTurmasModuloFirebase === "function") {
        await carregarTurmasModuloFirebase();
      }
    } catch (erroSincronizacao) {
      console.warn(
        "Nota salva, mas o cache das turmas não foi recarregado:",
        erroSincronizacao
      );
    }

    turmas = listaAtualizada;

    return {
      vinculada: true,
      avaliacaoId: avaliacaoAtual.id || null,
      avaliacaoNome: avaliacaoAtual.nome || "",
      avaliacaoBimestre: avaliacaoAtual.bimestre || "",
      indiceAvaliacao,
      nomeAluno: chaveAluno,
    };
  }

  selectTurma.onchange = function () {
    let nomeTurma = this.value;
    let selectAluno = document.getElementById("aluno");

    localStorage.setItem("correcaoTurmaAtiva", nomeTurma || "");
    selectAluno.innerHTML = ` <option value="">👨‍🎓 Selecionar aluno</option> `;

    let turma = turmas.find((t) => t.nome === nomeTurma);

    preencherAvaliacoesCorrecao(turma || null);

    if (!turma) {
      localStorage.removeItem("correcaoAlunoAtivo");
      return;
    }

    const alunosTurmaCorrecao = Array.isArray(turma.alunos)
      ? turma.alunos
      : [];

    alunosTurmaCorrecao.forEach((aluno) => {
      let nomeAlunoOpcao =
        typeof aluno === "string"
          ? aluno
          : aluno?.nome || aluno?.nomeAluno || "";

      if (!nomeAlunoOpcao) {
        return;
      }

      selectAluno.innerHTML += ` <option value="${nomeAlunoOpcao}">${nomeAlunoOpcao}</option> `;
    });

    const alunoSalvo = localStorage.getItem("correcaoAlunoAtivo") || "";
    if ([...selectAluno.options].some((opcao) => opcao.value === alunoSalvo)) {
      selectAluno.value = alunoSalvo;
    }
  };

  const selectAlunoCorrecao = document.getElementById("aluno");
  selectAlunoCorrecao.onchange = function () {
    localStorage.setItem("correcaoAlunoAtivo", this.value || "");
  };

  const selectAvaliacaoCorrecao =
    document.getElementById("avaliacaoVinculada");

  if (selectAvaliacaoCorrecao) {
    selectAvaliacaoCorrecao.onchange = function () {
      const vinculacao = obterAvaliacaoVinculadaCorrecao();

      localStorage.setItem(
        "correcaoAvaliacaoAtiva",
        this.value || ""
      );

      if (!vinculacao?.avaliacao) {
        return;
      }

      const valor = Number(vinculacao.avaliacao.valor);
      const campoValor = document.getElementById("valorProva");

      if (campoValor && Number.isFinite(valor) && valor > 0) {
        campoValor.value = String(valor);
        localStorage.setItem("valorProva", String(valor));
      }
    };
  }

  async function aguardarUsuarioCorrecao(timeout = 6000) {
    if (window.auth?.currentUser) {
      return window.auth.currentUser;
    }

    if (
      !window.auth ||
      typeof window.firebaseAuth?.onAuthStateChanged !== "function"
    ) {
      return null;
    }

    return await new Promise((resolve) => {
      let terminou = false;
      let cancelar = null;

      const finalizar = (usuario) => {
        if (terminou) return;
        terminou = true;
        clearTimeout(timer);

        try {
          if (typeof cancelar === "function") cancelar();
        } catch (erro) {}

        resolve(usuario || null);
      };

      const timer = setTimeout(
        () => finalizar(window.auth?.currentUser || null),
        timeout
      );

      cancelar = window.firebaseAuth.onAuthStateChanged(
        window.auth,
        (usuario) => finalizar(usuario),
        () => finalizar(null)
      );
    });
  }

  async function carregarTurmasDiretoParaCorrecao() {
    /*
     * Fonte de verdade da tela Corrigir Prova.
     * Lê diretamente o mesmo documento usado pelo módulo Turmas:
     * usuarios/{uid}/dados/turmas
     *
     * Assim a correção deixa de depender da ordem de carregamento dos
     * arquivos turmas.js/tarefas.js e também não consulta antes do login
     * estar restaurado.
     */
    const usuario = await aguardarUsuarioCorrecao();

    if (
      !usuario?.uid ||
      !window.db ||
      !window.firebaseFirestore?.doc ||
      !window.firebaseFirestore?.getDoc
    ) {
      return null;
    }

    const { doc, getDoc } = window.firebaseFirestore;

    const referencia = doc(
      window.db,
      "usuarios",
      usuario.uid,
      "dados",
      "turmas"
    );

    const snapshot = await getDoc(referencia);

    if (!snapshot.exists()) {
      return [];
    }

    const dados = snapshot.data() || {};

    if (Array.isArray(dados.itens)) {
      return dados.itens;
    }

    /*
     * Compatibilidade com versões antigas do documento.
     */
    if (Array.isArray(dados.turmas)) {
      return dados.turmas;
    }

    if (Array.isArray(dados.valor)) {
      return dados.valor;
    }

    return [];
  }

  function restaurarTurmaEAlunoCorrecao() {
    const turmaSalva =
      localStorage.getItem("correcaoTurmaAtiva") || "";

    if (
      turmaSalva &&
      [...selectTurma.options].some(
        (opcao) => opcao.value === turmaSalva
      )
    ) {
      selectTurma.value = turmaSalva;
      selectTurma.dispatchEvent(
        new Event("change", { bubbles: true })
      );
    }
  }

  async function sincronizarTurmasCorrecaoEmSegundoPlano() {
    try {
      let listaAtualizada = await carregarTurmasDiretoParaCorrecao();

      /*
       * Se a leitura direta não pôde acontecer, usa o estado do módulo
       * Turmas como fallback, sem apagar o que já estiver na tela.
       */
      if (!Array.isArray(listaAtualizada)) {
        if (typeof obterTurmasSalvas === "function") {
          const cache = obterTurmasSalvas();
          if (Array.isArray(cache)) {
            listaAtualizada = cache;
          }
        }
      }

      if (!Array.isArray(listaAtualizada)) {
        return;
      }

      turmas = listaAtualizada;
      preencherTurmasCorrecao(turmas, true);
      restaurarTurmaEAlunoCorrecao();

      if (!turmas.length) {
        console.warn(
          "Corrigir Prova: o documento de turmas foi carregado, mas não contém turmas."
        );
      }
    } catch (erroTurmas) {
      console.error(
        "Erro ao carregar turmas diretamente para Corrigir Prova:",
        erroTurmas
      );

      /*
       * Último fallback: não deixa uma falha de rede apagar uma lista
       * que já estava disponível em memória.
       */
      try {
        if (!turmas.length && typeof obterTurmasSalvas === "function") {
          const cache = obterTurmasSalvas();

          if (Array.isArray(cache) && cache.length) {
            turmas = cache;
            preencherTurmasCorrecao(turmas, true);
            restaurarTurmaEAlunoCorrecao();
          }
        }
      } catch (erroCache) {
        console.warn(
          "Também não foi possível recuperar o cache de turmas:",
          erroCache
        );
      }
    }
  }

  sincronizarTurmasCorrecaoEmSegundoPlano();

  let botaoCamera = document.getElementById("abrirCamera");
  let inputFoto = document.getElementById("foto");

  botaoCamera.onclick = function () {
    inputFoto.value = "";
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

    localStorage.setItem(
      "modeloOMRAtivo",
      document.getElementById("modeloOMR").value || "marcadores4"
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
      const ajusteSalvo = JSON.parse(
        localStorage.getItem("modeloMarcadores4Ajustado") || "null"
      );

      if (!ajusteSalvo) {
        return MODELO_MARCADORES_4;
      }

      return {
        ...MODELO_MARCADORES_4,
        ...ajusteSalvo,
        prova: {
          ...(MODELO_MARCADORES_4.prova || {}),
          ...(ajusteSalvo.prova || {}),
        },
        area: {
          ...(MODELO_MARCADORES_4.area || {}),
          ...(ajusteSalvo.area || {}),
        },
        omr: {
          ...(MODELO_MARCADORES_4.omr || {}),
          ...(ajusteSalvo.omr || {}),
        },
      };
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

    const modeloSalvo = localStorage.getItem("modeloOMRAtivo") || "marcadores4";
    const valorParaRestaurar = valorAtual || modeloSalvo;

    if (
      [...select.options].some((opcao) => opcao.value === valorParaRestaurar)
    ) {
      select.value = valorParaRestaurar;
    } else {
      select.value = "marcadores4";
    }
  }

  carregarModelosOMR();

  document.getElementById("modeloOMR").onchange = function () {
    localStorage.setItem("modeloOMRAtivo", this.value || "marcadores4");
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

  function salvarEstadoAtualDaCorrecao() {
    const respostas = sincronizarCampoGabarito();

    localStorage.setItem("gabarito", respostas.join(","));
    localStorage.setItem("totalQuestoes", campoTotalQuestoes.value || "");
    localStorage.setItem(
      "valorProva",
      document.getElementById("valorProva").value || ""
    );
    localStorage.setItem(
      "habilidadeProva",
      document.getElementById("habilidadeProva").value || ""
    );
    localStorage.setItem(
      "descritorProva",
      document.getElementById("descritorProva").value || ""
    );
    localStorage.setItem(
      "modeloOMRAtivo",
      document.getElementById("modeloOMR").value || "marcadores4"
    );
    localStorage.setItem(
      "correcaoTurmaAtiva",
      document.getElementById("turmaSelecionada").value || ""
    );
    localStorage.setItem(
      "correcaoAlunoAtivo",
      document.getElementById("aluno").value || ""
    );
  }

  document.getElementById("salvarModeloOMR").onclick = function () {
    const seletor = document.getElementById("modeloOMR");

    if (seletor.value !== "marcadores4") {
      alert("Selecione o modelo de 4 marcadores para salvar este ajuste.");
      return;
    }

    if (!window.areaTabelaOMR) {
      alert("Escolha uma foto e enquadre a grade antes de salvar o modelo.");
      return;
    }

    const xMin = Math.min(pontos[0].x, pontos[2].x);
    const xMax = Math.max(pontos[1].x, pontos[3].x);
    const yMin = Math.min(pontos[0].y, pontos[1].y);
    const yMax = Math.max(pontos[2].y, pontos[3].y);
    const largura = Math.max(1, xMax - xMin);
    const altura = Math.max(1, yMax - yMin);

    const area = {
      x1: Math.max(
        0,
        Math.min(0.95, (window.areaTabelaOMR.x1 - xMin) / largura)
      ),
      x2: Math.max(
        0,
        Math.min(0.95, (xMax - window.areaTabelaOMR.x2) / largura)
      ),
      y1: Math.max(
        0,
        Math.min(0.95, (window.areaTabelaOMR.y1 - yMin) / altura)
      ),
      y2: Math.max(
        0,
        Math.min(0.95, (yMax - window.areaTabelaOMR.y2) / altura)
      ),
    };

    const ajuste = {
      nome: MODELO_MARCADORES_4.nome,
      prova: {
        totalQuestoes: parseInt(campoTotalQuestoes.value, 10) || 10,
        gabarito: sincronizarCampoGabarito().join(","),
        valorProva: document.getElementById("valorProva").value || "",
      },
      area,
    };

    localStorage.setItem("modeloMarcadores4Ajustado", JSON.stringify(ajuste));
    localStorage.setItem("modeloOMRAtivo", "marcadores4");
    salvarEstadoAtualDaCorrecao();

    alert("✅ Modelo de 10 questões e enquadramento salvos neste aparelho.");
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
    const resultado = document.getElementById("resultado");

    /* * V10.1 — autoenquadramento multiescala com prioridade aos 4 marcadores reais. * * Detecta os quatro quadrados pretos tanto em fotos próximas quanto * distantes. A busca não depende de um único tamanho mínimo: * * 1. cria mapas de pixels escuros em vários níveis; * 2. procura regiões quadradas em vários tamanhos; * 3. exige centro escuro e entorno mais claro; * 4. agrupa candidatos repetidos; * 5. escolhe quatro candidatos que formem o retângulo dos marcadores; * 6. rejeita bolhas, bordas da folha e combinações exageradamente grandes. */

    const cinza = new Uint8Array(w * h);

    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      cinza[p] = Math.round(
        data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
      );
    }

    function criarIntegral(limite) {
      const larguraIntegral = w + 1;
      const integral = new Uint32Array((w + 1) * (h + 1));

      for (let y = 1; y <= h; y++) {
        let somaLinha = 0;
        const baseImagem = (y - 1) * w;
        const baseIntegral = y * larguraIntegral;
        const baseAnterior = (y - 1) * larguraIntegral;

        for (let x = 1; x <= w; x++) {
          somaLinha += cinza[baseImagem + x - 1] < limite ? 1 : 0;
          integral[baseIntegral + x] = integral[baseAnterior + x] + somaLinha;
        }
      }

      return integral;
    }

    function somaRetangulo(integral, x1, y1, x2, y2) {
      x1 = Math.max(0, Math.min(w, Math.floor(x1)));
      y1 = Math.max(0, Math.min(h, Math.floor(y1)));
      x2 = Math.max(0, Math.min(w, Math.ceil(x2)));
      y2 = Math.max(0, Math.min(h, Math.ceil(y2)));

      if (x2 <= x1 || y2 <= y1) return 0;

      const iw = w + 1;

      return (
        integral[y2 * iw + x2] -
        integral[y1 * iw + x2] -
        integral[y2 * iw + x1] +
        integral[y1 * iw + x1]
      );
    }

    const limites = [72, 92, 112, 132, 152];
    const integrais = limites.map(criarIntegral);
    const candidatosBrutos = [];

    const menorDimensao = Math.min(w, h);
    const tamanhoMinimo = Math.max(7, Math.round(menorDimensao * 0.01));
    const tamanhoMaximo = Math.max(
      tamanhoMinimo + 4,
      Math.round(menorDimensao * 0.08)
    );

    const tamanhos = [];
    let tamanho = tamanhoMinimo;

    while (tamanho <= tamanhoMaximo) {
      tamanhos.push(Math.round(tamanho));
      tamanho *= 1.24;
    }

    for (let indiceLimite = 0; indiceLimite < limites.length; indiceLimite++) {
      const integral = integrais[indiceLimite];
      const limite = limites[indiceLimite];

      for (const lado of tamanhos) {
        const passo = Math.max(2, Math.round(lado * 0.3));
        const margem = Math.max(3, Math.round(lado * 0.62));
        const areaCentro = lado * lado;

        for (let y = margem; y + lado + margem < h; y += passo) {
          for (let x = margem; x + lado + margem < w; x += passo) {
            const escurosCentro = somaRetangulo(
              integral,
              x,
              y,
              x + lado,
              y + lado
            );
            const densidadeCentro = escurosCentro / areaCentro;

            if (densidadeCentro < 0.53) continue;

            const ox1 = x - margem;
            const oy1 = y - margem;
            const ox2 = x + lado + margem;
            const oy2 = y + lado + margem;
            const areaExterna = (ox2 - ox1) * (oy2 - oy1) - areaCentro;

            const escurosExternos =
              somaRetangulo(integral, ox1, oy1, ox2, oy2) - escurosCentro;

            const densidadeEntorno = escurosExternos / Math.max(1, areaExterna);

            // O marcador é um bloco escuro relativamente isolado.
            if (densidadeCentro - densidadeEntorno < 0.24) continue;
            if (densidadeEntorno > 0.38) continue;

            // Confere também um miolo menor, evitando linhas e bordas.
            const recuo = lado * 0.18;
            const miolo = somaRetangulo(
              integral,
              x + recuo,
              y + recuo,
              x + lado - recuo,
              y + lado - recuo
            );
            const ladoMiolo = lado - recuo * 2;
            const densidadeMiolo = miolo / Math.max(1, ladoMiolo * ladoMiolo);

            if (densidadeMiolo < 0.58) continue;

            candidatosBrutos.push({
              x: x + lado / 2,
              y: y + lado / 2,
              lado,
              densidadeCentro,
              densidadeEntorno,
              densidadeMiolo,
              limite,
              scoreLocal:
                densidadeCentro * 1.25 +
                densidadeMiolo * 0.95 -
                densidadeEntorno * 1.15 +
                lado / menorDimensao,
            });
          }
        }
      }
    }

    // Fusão multiescala: mantém uma única ocorrência por marcador.
    candidatosBrutos.sort((a, b) => b.scoreLocal - a.scoreLocal);

    const candidatos = [];

    for (const candidato of candidatosBrutos) {
      const repetido = candidatos.find((existente) => {
        const distancia = Math.hypot(
          existente.x - candidato.x,
          existente.y - candidato.y
        );
        const tolerancia = Math.max(existente.lado, candidato.lado) * 0.72;

        return distancia <= tolerancia;
      });

      if (!repetido) {
        candidatos.push(candidato);
      } else if (candidato.scoreLocal > repetido.scoreLocal) {
        Object.assign(repetido, candidato);
      }

      if (candidatos.length >= 36) break;
    }

    if (candidatos.length < 4) {
      resultado.innerHTML =
        "⚠ Não encontrei os quatro marcadores pretos. Tente uma foto mais reta, com os quatro quadrados visíveis, ou ajuste os pontos manualmente.";
      desenhar();
      return;
    }

    let melhorConjunto = null;
    let melhorPontuacao = -Infinity;
    const lista = candidatos.slice(0, 28);

    for (let a = 0; a < lista.length - 3; a++) {
      for (let b = a + 1; b < lista.length - 2; b++) {
        for (let c = b + 1; c < lista.length - 1; c++) {
          for (let d = c + 1; d < lista.length; d++) {
            const grupo = [lista[a], lista[b], lista[c], lista[d]];
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

            const larguraTopo = sd.x - se.x;
            const larguraBaixo = id.x - ie.x;
            const alturaEsquerda = ie.y - se.y;
            const alturaDireita = id.y - sd.y;

            if (
              larguraTopo <= 0 ||
              larguraBaixo <= 0 ||
              alturaEsquerda <= 0 ||
              alturaDireita <= 0
            ) {
              continue;
            }

            const larguraMedia = (larguraTopo + larguraBaixo) / 2;
            const alturaMedia = (alturaEsquerda + alturaDireita) / 2;
            const razao = larguraMedia / Math.max(1, alturaMedia);

            // Abrange fotos próximas e distantes sem aceitar a folha inteira.
            if (larguraMedia < w * 0.2 || larguraMedia > w * 0.64) continue;
            if (alturaMedia < h * 0.25 || alturaMedia > h * 0.76) continue;

            /*
             * Os quatro marcadores do gabarito formam um retângulo
             * claramente mais alto do que largo. Combinações quase
             * quadradas costumam ser bordas/textos da folha e eram a
             * principal causa do enquadramento mostrado no teste.
             */
            if (razao < 0.44 || razao > 0.86) continue;

            const lados = grupo.map((item) => item.lado);
            const ladoMin = Math.min(...lados);
            const ladoMax = Math.max(...lados);
            const ladoMedio =
              lados.reduce((soma, valor) => soma + valor, 0) / lados.length;

            if (ladoMin / Math.max(1, ladoMax) < 0.54) continue;

            /* * Relação marcador/retângulo: * bolhas são pequenas demais; bordas e blocos da folha são grandes. */
            const proporcaoLargura = ladoMedio / larguraMedia;
            const proporcaoAltura = ladoMedio / alturaMedia;

            if (
              proporcaoLargura < 0.035 ||
              proporcaoLargura > 0.19 ||
              proporcaoAltura < 0.022 ||
              proporcaoAltura > 0.13
            ) {
              continue;
            }

            const diferencaLargura =
              Math.abs(larguraTopo - larguraBaixo) /
              Math.max(larguraTopo, larguraBaixo);
            const diferencaAltura =
              Math.abs(alturaEsquerda - alturaDireita) /
              Math.max(alturaEsquerda, alturaDireita);

            const desalinhamentoTopo =
              Math.abs(se.y - sd.y) / Math.max(1, alturaMedia);
            const desalinhamentoBaixo =
              Math.abs(ie.y - id.y) / Math.max(1, alturaMedia);
            const desalinhamentoEsquerda =
              Math.abs(se.x - ie.x) / Math.max(1, larguraMedia);
            const desalinhamentoDireita =
              Math.abs(sd.x - id.x) / Math.max(1, larguraMedia);

            if (
              diferencaLargura > 0.34 ||
              diferencaAltura > 0.34 ||
              desalinhamentoTopo > 0.16 ||
              desalinhamentoBaixo > 0.16 ||
              desalinhamentoEsquerda > 0.19 ||
              desalinhamentoDireita > 0.19
            ) {
              continue;
            }

            const centroX = (se.x + sd.x + ie.x + id.x) / 4;
            const centroY = (se.y + sd.y + ie.y + id.y) / 4;

            if (
              centroX < w * 0.15 ||
              centroX > w * 0.85 ||
              centroY < h * 0.15 ||
              centroY > h * 0.86
            ) {
              continue;
            }

            const qualidadeLocal =
              grupo.reduce((soma, item) => soma + item.scoreLocal, 0) / 4;
            const consistenciaTamanho = ladoMin / Math.max(1, ladoMax);
            const areaNormalizada =
              (larguraMedia * alturaMedia) / Math.max(1, w * h);

            /*
             * V10.1
             * Antes a área maior recebia bônus (areaNormalizada * 1.5).
             * Isso favorecia um retângulo externo grande mesmo quando os
             * quatro quadrados pretos corretos tinham sido encontrados.
             *
             * Agora a geometria típica do gabarito recebe prioridade:
             * - retângulo mais alto que largo;
             * - área moderada da foto;
             * - quatro marcadores de tamanho semelhante.
             */
            if (areaNormalizada < 0.08 || areaNormalizada > 0.42) {
              continue;
            }

            const penalidadeGeometria =
              Math.abs(razao - 0.64) * 3.2 +
              Math.abs(areaNormalizada - 0.24) * 2.8;

            const penalidade =
              diferencaLargura * 3.5 +
              diferencaAltura * 3.5 +
              desalinhamentoTopo * 2.8 +
              desalinhamentoBaixo * 2.8 +
              desalinhamentoEsquerda * 2.4 +
              desalinhamentoDireita * 2.4 +
              penalidadeGeometria;

            const pontuacao =
              qualidadeLocal * 1.15 +
              consistenciaTamanho * 1.35 -
              penalidade;

            if (pontuacao > melhorPontuacao) {
              melhorPontuacao = pontuacao;
              melhorConjunto = { se, sd, ie, id };
            }
          }
        }
      }
    }

    if (!melhorConjunto) {
      resultado.innerHTML =
        "⚠ Os quatro marcadores não formaram um conjunto confiável. Evite cortar os quadrados, incline menos a câmera ou ajuste manualmente.";
      desenhar();
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

    const seletorModelo = document.getElementById("modeloOMR");

    if (seletorModelo) {
      seletorModelo.value = "marcadores4";
      localStorage.setItem("modeloOMRAtivo", "marcadores4");
      campoTotalQuestoes.value = 10;
      renderizarEditorGabarito(campoGabarito.value);
    }

    const calibracao = obterModeloSelecionado();
    const areaCalibrada = calibracao?.area || {
      x1: 0.28,
      x2: 0.14,
      y1: 0.07,
      y2: 0.075,
    };

    window.areaTabelaOMR = {
      x1: xMin + largura * areaCalibrada.x1,
      x2: xMax - largura * areaCalibrada.x2,
      y1: yMin + altura * areaCalibrada.y1,
      y2: yMax - altura * areaCalibrada.y2,
    };

    desenhar();

    resultado.innerHTML =
      "✅ Marcadores encontrados. Antes de analisar, confira se os 4 pontos vermelhos estão exatamente sobre os 4 quadrados pretos e se a grade azul cobre as linhas 1 a 10.";
  }

  document.getElementById("detectarGrade").onclick = function () {
    detectarGrade();
  };

  document.getElementById("foto").onchange = function (e) {
    let arquivo = e.target.files[0];

    if (!arquivo) return;

    const seletorModelo = document.getElementById("modeloOMR");
    const modeloAtivoSalvo =
      localStorage.getItem("modeloOMRAtivo") || "marcadores4";

    if (
      [...seletorModelo.options].some(
        (opcao) => opcao.value === modeloAtivoSalvo
      )
    ) {
      seletorModelo.value = modeloAtivoSalvo;
    } else {
      seletorModelo.value = "marcadores4";
    }

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
        setTimeout(detectarGrade, 120);
      }

      e.target.value = "";
    };
  };

  const turmaAtivaSalva = localStorage.getItem("correcaoTurmaAtiva") || "";
  if (
    turmaAtivaSalva &&
    [...selectTurma.options].some(
      (opcao) => opcao.value === turmaAtivaSalva
    )
  ) {
    selectTurma.value = turmaAtivaSalva;
    selectTurma.dispatchEvent(
      new Event("change", { bubbles: true })
    );
  }

  const modeloAtivoInicial =
    localStorage.getItem("modeloOMRAtivo") || "marcadores4";
  const seletorModeloInicial = document.getElementById("modeloOMR");
  seletorModeloInicial.value = [...seletorModeloInicial.options].some(
    (opcao) => opcao.value === modeloAtivoInicial
  )
    ? modeloAtivoInicial
    : "marcadores4";

  document.getElementById("proximoAluno").onclick = function () {
    const selectAluno = document.getElementById("aluno");
    const opcoesValidas = [...selectAluno.options].filter(
      (opcao) => opcao.value
    );

    if (!opcoesValidas.length) {
      alert("Selecione uma turma com alunos cadastrados.");
      return;
    }

    const indiceAtual = opcoesValidas.findIndex(
      (opcao) => opcao.value === selectAluno.value
    );
    const proximoIndice = indiceAtual < 0 ? 0 : indiceAtual + 1;

    if (proximoIndice >= opcoesValidas.length) {
      alert("✅ Este já é o último aluno da turma.");
      return;
    }

    salvarEstadoAtualDaCorrecao();

    selectAluno.value = opcoesValidas[proximoIndice].value;
    selectAluno.dispatchEvent(new Event("change"));

    document.getElementById("resultado").innerHTML = "";

    const revisaoAnterior = document.getElementById("revisaoRespostasOMR");
    if (revisaoAnterior) {
      revisaoAnterior.innerHTML = "";
    }

    window.areaTabelaOMR = null;

    const modeloAtivo = localStorage.getItem("modeloOMRAtivo") || "marcadores4";
    const seletorModelo = document.getElementById("modeloOMR");
    seletorModelo.value = [...seletorModelo.options].some(
      (opcao) => opcao.value === modeloAtivo
    )
      ? modeloAtivo
      : "marcadores4";

    inputFoto.value = "";
    inputFoto.click();
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

    const turmaParaVinculo = turmas.find(
      (item) =>
        normalizarTextoVinculoCorrecao(item?.nome) ===
        normalizarTextoVinculoCorrecao(
          document.getElementById("turmaSelecionada")?.value || ""
        )
    );

    const provasDisponiveisVinculo =
      obterProvasCadastradasCorrecao(turmaParaVinculo);

    const avaliacaoVinculadaAntesDaLeitura =
      obterAvaliacaoVinculadaCorrecao();

    if (
      provasDisponiveisVinculo.length > 0 &&
      !avaliacaoVinculadaAntesDaLeitura
    ) {
      if (typeof mostrarToast === "function") {
        mostrarToast(
          "⚠️ Selecione a avaliação cadastrada antes de analisar."
        );
      }

      document.getElementById("avaliacaoVinculada")?.focus();
      return;
    }

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

    /*
     * ETAPA DE CONFERÊNCIA MANUAL
     * A leitura automática vira uma prévia. Nada é salvo antes de o
     * professor confirmar as respostas.
     */
    const respostasLidasAutomaticamente = [...respostas];
    const painelRevisao = document.getElementById("revisaoRespostasOMR");
    const resultadoLeitura = document.getElementById("resultado");

    function respostaParaSelecao(valor) {
      if (["A", "B", "C", "D", "-"].includes(valor)) {
        return valor;
      }

      // Incerta ou múltipla fica sem alternativa pré-selecionada,
      // obrigando uma conferência consciente.
      return "";
    }

    function contarAcertosPrevia(lista) {
      return lista.reduce(
        (total, resposta, indice) =>
          total + (resposta === gabarito[indice] ? 1 : 0),
        0
      );
    }

    function atualizarResumoRevisao() {
      const seletores = [
        ...painelRevisao.querySelectorAll(".revisao-omr-select")
      ];

      const atuais = seletores.map((select) => select.value);
      const pendentes = atuais.filter((valor) => !valor).length;
      const acertosPrevios = contarAcertosPrevia(atuais);
      const percentualPrevio =
        totalQuestoes > 0
          ? (acertosPrevios / totalQuestoes) * 100
          : 0;
      const notaPrevia =
        totalQuestoes > 0
          ? (acertosPrevios / totalQuestoes) * valorProva
          : 0;

      const resumo = painelRevisao.querySelector(".revisao-omr-resumo");

      if (resumo) {
        resumo.innerHTML = `
          <span><strong>${acertosPrevios}/${totalQuestoes}</strong> acertos</span>
          <span><strong>${notaPrevia.toFixed(1)}/${valorProva}</strong> nota</span>
          <span class="${pendentes ? "tem-pendencia" : ""}">
            <strong>${pendentes}</strong> para revisar
          </span>
        `;
      }

      const confirmar = painelRevisao.querySelector("#confirmarRevisaoOMR");

      if (confirmar) {
        confirmar.disabled = pendentes > 0;
      }
    }

    const respostasConfirmadas = await new Promise((resolve) => {
      const linhas = respostas
        .map((resposta, indice) => {
          const valorSelecionado = respostaParaSelecao(resposta);
          const precisaRevisao =
            resposta === "⚠" ||
            resposta.startsWith("MULTI:") ||
            !valorSelecionado;

          const textoLeitura =
            resposta === "-"
              ? "Leitura: em branco"
              : resposta === "⚠"
              ? "Leitura incerta"
              : resposta.startsWith("MULTI:")
              ? "Leitura múltipla: " +
                resposta.replace("MULTI:", "").replaceAll("+", " e ")
              : "Leitura: " + resposta;

          return `
            <div class="revisao-omr-linha ${precisaRevisao ? "revisao-necessaria" : ""}">
              <div class="revisao-omr-numero">
                <strong>Q${indice + 1}</strong>
                <small>${textoLeitura}</small>
              </div>

              <select
                class="revisao-omr-select"
                data-indice="${indice}"
                aria-label="Resposta da questão ${indice + 1}"
              >
                <option value="" ${valorSelecionado === "" ? "selected" : ""}>
                  Revisar
                </option>
                <option value="A" ${valorSelecionado === "A" ? "selected" : ""}>A</option>
                <option value="B" ${valorSelecionado === "B" ? "selected" : ""}>B</option>
                <option value="C" ${valorSelecionado === "C" ? "selected" : ""}>C</option>
                <option value="D" ${valorSelecionado === "D" ? "selected" : ""}>D</option>
                <option value="-" ${valorSelecionado === "-" ? "selected" : ""}>Em branco</option>
              </select>

              <span class="revisao-omr-gabarito">
                Gabarito: <strong>${gabarito[indice] || "?"}</strong>
              </span>
            </div>
          `;
        })
        .join("");

      resultadoLeitura.innerHTML =
        "🔎 Leitura concluída. Confira as respostas abaixo antes de salvar.";

      painelRevisao.innerHTML = `
        <section class="revisao-omr-card">
          <div class="revisao-omr-cabecalho">
            <div>
              <span class="revisao-omr-etiqueta">Conferência</span>
              <h3>Revisar respostas</h3>
              <p>
                A leitura automática ainda não foi salva.
                Corrija qualquer questão necessária e confirme.
              </p>
            </div>
            <span class="material-icons-round">fact_check</span>
          </div>

          <div class="revisao-omr-resumo"></div>

          <div class="revisao-omr-lista">
            ${linhas}
          </div>

          <div class="revisao-omr-aviso">
            <span class="material-icons-round">info</span>
            <span>
              Questões incertas ou com múltiplas marcações precisam ser
              escolhidas manualmente antes do salvamento.
            </span>
          </div>

          <button
            type="button"
            id="confirmarRevisaoOMR"
            class="botao-confirmar-revisao"
          >
            <span class="material-icons-round">cloud_done</span>
            Confirmar e salvar correção
          </button>
        </section>
      `;

      const seletores = [
        ...painelRevisao.querySelectorAll(".revisao-omr-select")
      ];

      seletores.forEach((select) => {
        select.addEventListener("change", () => {
          const linha = select.closest(".revisao-omr-linha");

          if (linha) {
            linha.classList.toggle(
              "revisao-necessaria",
              !select.value
            );
          }

          atualizarResumoRevisao();
        });
      });

      atualizarResumoRevisao();

      painelRevisao
        .querySelector("#confirmarRevisaoOMR")
        .addEventListener("click", () => {
          const finais = seletores.map((select) => select.value);

          if (finais.some((valor) => !valor)) {
            if (typeof mostrarToast === "function") {
              mostrarToast("⚠️ Revise todas as questões antes de salvar.");
            }
            return;
          }

          resolve(finais);
        });

      painelRevisao.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });

    respostas = respostasConfirmadas;

    if (painelRevisao) {
      painelRevisao.innerHTML = "";
    }

    let acertos = 0;
    let detalhes = "";
    let totalRevisao = respostasLidasAutomaticamente.filter(
      (resposta) =>
        resposta === "⚠" ||
        resposta.startsWith("MULTI:")
    ).length;

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

      const vinculacaoAvaliacao =
        obterAvaliacaoVinculadaCorrecao();

      const registroNuvem = {
        id: registroId,

        nome: nomeAluno,

        turma: turmaSelecionada,

        avaliacaoId:
          vinculacaoAvaliacao?.avaliacao?.id || null,

        avaliacaoNome:
          vinculacaoAvaliacao?.avaliacao?.nome || "",

        avaliacaoBimestre:
          vinculacaoAvaliacao?.avaliacao?.bimestre || "",

        avaliacaoTipo:
          vinculacaoAvaliacao?.avaliacao?.tipo || "prova",

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

      let resultadoVinculoAvaliacao = {
        vinculada: false,
        motivo: "sem-avaliacao",
      };

      if (vinculacaoAvaliacao?.avaliacao) {
        try {
          resultadoVinculoAvaliacao =
            await lancarNotaNaAvaliacaoCorrecao({
              nomeTurma: turmaSelecionada,
              nomeAluno,
              notaFinal,
              vinculacao: vinculacaoAvaliacao,
            });

          /*
           * Atualiza também o documento do Histórico com a confirmação
           * do lançamento. Isso permitirá auditoria e sincronizações
           * futuras sem depender apenas de nome/valor.
           */
          await window.firebaseFirestore.setDoc(
            window.firebaseFirestore.doc(
              window.db,
              "usuarios",
              usuario.uid,
              "historico",
              registroId
            ),
            {
              notaLancadaNaAvaliacao: true,
              avaliacaoId:
                resultadoVinculoAvaliacao.avaliacaoId ||
                vinculacaoAvaliacao.avaliacao.id ||
                null,
              avaliacaoNome:
                resultadoVinculoAvaliacao.avaliacaoNome ||
                vinculacaoAvaliacao.avaliacao.nome ||
                "",
              avaliacaoBimestre:
                resultadoVinculoAvaliacao.avaliacaoBimestre ||
                vinculacaoAvaliacao.avaliacao.bimestre ||
                "",
            },
            { merge: true }
          );
        } catch (erroVinculo) {
          console.error(
            "A correção foi salva no Histórico, mas a nota não foi lançada na avaliação:",
            erroVinculo
          );

          await window.firebaseFirestore.setDoc(
            window.firebaseFirestore.doc(
              window.db,
              "usuarios",
              usuario.uid,
              "historico",
              registroId
            ),
            {
              notaLancadaNaAvaliacao: false,
              erroLancamentoAvaliacao:
                erroVinculo?.message ||
                "Falha ao lançar nota na avaliação.",
            },
            { merge: true }
          );

          if (typeof mostrarToast === "function") {
            mostrarToast(
              "⚠️ Histórico salvo, mas houve falha ao atualizar o Livro de Notas."
            );
          }
        }
      }

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
        (resultadoVinculoAvaliacao?.vinculada
          ? "<br>📚 Nota lançada no Livro de Notas e no Boletim"
          : vinculacaoAvaliacao?.avaliacao
          ? "<br>⚠️ Nota ainda não confirmada no Livro de Notas"
          : "<br>ℹ️ Correção sem avaliação cadastrada vinculada") +
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