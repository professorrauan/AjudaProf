/* ========================================================= AJUDA+PROF — TURMAS Gerenciamento de turmas, alunos, avaliações e boletins Versão integrada ao Firebase ========================================================= */

/* ========================================================= ESTADO DO MÓDULO ========================================================= */

let turmasFirebase = [];

let usuarioTurmasAtual = null;
let referenciaDocumentoTurmas = null;
let cancelarEscutaTurmas = null;
let uidEscutaTurmas = null;

let filaSalvamentoTurmas = Promise.resolve();
let salvamentosTurmasPendentes = 0;

let estadoConfirmadoTurmas = [];

let versaoEstadoTurmas = 0;

/* ========================================================= FUNÇÕES AUXILIARES ========================================================= */

function clonarDadosTurmas(valor) {
  if (valor === null || valor === undefined) {
    return valor;
  }

  if (typeof structuredClone === "function") {
    try {
      return structuredClone(valor);
    } catch (erro) {
      console.warn("Falha ao clonar turmas com structuredClone:", erro);
    }
  }

  return JSON.parse(JSON.stringify(valor));
}

function escaparHTMLTurmas(texto) {
  return String(texto ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizarNomeTurmas(texto) {
  return String(texto || "")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

async function garantirConfiguracoesPedagogicasTurmas() {
  if (typeof carregarConfiguracoesPedagogicas !== "function") {
    return;
  }

  try {
    await carregarConfiguracoesPedagogicas();
  } catch (erro) {
    console.warn(
      "Não foi possível carregar os critérios pedagógicos para Turmas:",
      erro
    );
  }
}

function obterCriteriosAvaliacaoTurmas() {
  if (typeof obterConfiguracoesPedagogicas === "function") {
    const configuracoes = obterConfiguracoesPedagogicas();

    if (configuracoes?.avaliacao) {
      return configuracoes.avaliacao;
    }
  }

  return {
    mediaAprovacao: 6,
    limiteRecuperacao: 4,
    mediaDestaque: 8,
    casasDecimais: 1,
    arredondamento: "matematico",
  };
}

function classificarMediaTurmas(media) {
  if (typeof classificarMediaPedagogica === "function") {
    return classificarMediaPedagogica(media);
  }

  const numero = Number(media);

  if (!Number.isFinite(numero)) {
    return {
      codigo: "sem-media",
      texto: "Sem média",
      icone: "schedule",
      cor: "var(--primaria)",
    };
  }

  const criterios = obterCriteriosAvaliacaoTurmas();

  if (numero >= criterios.mediaDestaque) {
    return {
      codigo: "destaque",
      texto: "Destaque",
      icone: "star",
      cor: "var(--info, var(--primaria))",
    };
  }

  if (numero >= criterios.mediaAprovacao) {
    return {
      codigo: "aprovado",
      texto: "Aprovado",
      icone: "check_circle",
      cor: "var(--sucesso)",
    };
  }

  if (numero >= criterios.limiteRecuperacao) {
    return {
      codigo: "recuperacao",
      texto: "Em recuperação",
      icone: "warning",
      cor: "var(--alerta)",
    };
  }

  return {
    codigo: "critico",
    texto: "Precisa de atenção",
    icone: "error",
    cor: "var(--erro)",
  };
}

function formatarNotaTurmas(valor) {
  if (typeof formatarNotaPedagogica === "function") {
    return formatarNotaPedagogica(valor);
  }

  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return "—";
  }

  return numero.toFixed(1).replace(".", ",");
}

/* ========================================================= AVISOS DO MÓDULO DE TURMAS ========================================================= */

function mostrarAvisoTurmas(mensagem, configuracao = {}) {
  if (typeof mostrarAlerta === "function") {
    mostrarAlerta({
      titulo: configuracao.titulo || "Atenção",

      mensagem: configuracao.mensagem || mensagem,

      icone: configuracao.icone || "warning",
    });

    return;
  }

  if (typeof mostrarToast === "function") {
    mostrarToast(mensagem);

    return;
  }

  console.warn(mensagem);
}

function ordenarNomesTurmas(lista) {
  if (!Array.isArray(lista)) {
    return [];
  }

  return [...lista].sort((a, b) =>
    String(a).localeCompare(String(b), "pt-BR", {
      sensitivity: "base",
    })
  );
}

function normalizarAvaliacaoTurma(avaliacao) {
  if (!avaliacao || typeof avaliacao !== "object" || Array.isArray(avaliacao)) {
    return null;
  }

  const avaliacaoNormalizada = {
    ...avaliacao,

    nome: String(avaliacao.nome || "Avaliação sem nome").trim(),

    tipo: String(avaliacao.tipo || "prova").trim(),

    valor: Number.isFinite(Number(avaliacao.valor))
      ? Number(avaliacao.valor)
      : 10,

    bimestre: String(avaliacao.bimestre || "1B").trim(),

    notas:
      avaliacao.notas &&
      typeof avaliacao.notas === "object" &&
      !Array.isArray(avaliacao.notas)
        ? avaliacao.notas
        : {},
  };

  if (
    avaliacao.controleAtividades &&
    typeof avaliacao.controleAtividades === "object" &&
    !Array.isArray(avaliacao.controleAtividades)
  ) {
    avaliacaoNormalizada.controleAtividades = {
      quantidadeExercicios: Number.isFinite(
        Number(avaliacao.controleAtividades.quantidadeExercicios)
      )
        ? Math.min(
            100,
            Math.max(
              1,
              Math.trunc(
                Number(avaliacao.controleAtividades.quantidadeExercicios)
              )
            )
          )
        : 10,

      registros:
        avaliacao.controleAtividades.registros &&
        typeof avaliacao.controleAtividades.registros === "object" &&
        !Array.isArray(avaliacao.controleAtividades.registros)
          ? avaliacao.controleAtividades.registros
          : {},

      exercicios: Array.isArray(avaliacao.controleAtividades.exercicios)
        ? avaliacao.controleAtividades.exercicios
        : [],
    };
  }

  return avaliacaoNormalizada;
}

function normalizarTurmaFirebase(turma) {
  if (!turma || typeof turma !== "object" || Array.isArray(turma)) {
    return null;
  }

  const alunos = Array.isArray(turma.alunos)
    ? turma.alunos
        .filter((aluno) => typeof aluno === "string" && aluno.trim() !== "")
        .map((aluno) => aluno.trim())
    : [];

  const avaliacoes = Array.isArray(turma.avaliacoes)
    ? turma.avaliacoes.map(normalizarAvaliacaoTurma).filter(Boolean)
    : [];

  return {
    ...turma,

    nome: String(turma.nome || "Turma sem nome").trim(),

    alunos: ordenarNomesTurmas(alunos),

    avaliacoes,
  };
}

function normalizarListaTurmas(lista) {
  if (!Array.isArray(lista)) {
    return [];
  }

  return lista.map(normalizarTurmaFirebase).filter(Boolean);
}

/* ========================================================= LEITURA DAS TURMAS ========================================================= */

function obterTurmasSalvas() {
  return clonarDadosTurmas(turmasFirebase);
}

function obterTurmaPorIndice(index) {
  const turmas = obterTurmasSalvas();

  if (
    !Number.isInteger(Number(index)) ||
    Number(index) < 0 ||
    Number(index) >= turmas.length
  ) {
    return null;
  }

  return turmas[Number(index)];
}

/* ========================================================= FIREBASE — CARREGAMENTO ========================================================= */

function aplicarSnapshotTurmas(snapshot) {
  let dadosNormalizados = [];

  if (snapshot.exists()) {
    const dados = snapshot.data();

    dadosNormalizados = normalizarListaTurmas(
      Array.isArray(dados.itens) ? dados.itens : []
    );
  }

  turmasFirebase = clonarDadosTurmas(dadosNormalizados);

  estadoConfirmadoTurmas = clonarDadosTurmas(dadosNormalizados);
}

async function carregarTurmasFirebase() {
  if (!window.auth || !window.firebaseFirestore || !window.db) {
    console.error("Firebase não está disponível no módulo de turmas.");

    turmasFirebase = [];

    return [];
  }

  const usuario = window.auth.currentUser;

  if (!usuario) {
    if (cancelarEscutaTurmas) {
      cancelarEscutaTurmas();
    }

    cancelarEscutaTurmas = null;
    uidEscutaTurmas = null;
    usuarioTurmasAtual = null;
    referenciaDocumentoTurmas = null;
    turmasFirebase = [];

    return [];
  }

  const { doc, getDoc, onSnapshot } = window.firebaseFirestore;

  usuarioTurmasAtual = usuario;

  referenciaDocumentoTurmas = doc(
    window.db,
    "usuarios",
    usuario.uid,
    "dados",
    "turmas"
  );

  try {
    const snapshotInicial = await getDoc(referenciaDocumentoTurmas);

    if (salvamentosTurmasPendentes === 0) {
      aplicarSnapshotTurmas(snapshotInicial);
    }
  } catch (erro) {
    console.error("Erro ao carregar turmas do Firebase:", erro);
  }

  if (cancelarEscutaTurmas && uidEscutaTurmas !== usuario.uid) {
    cancelarEscutaTurmas();
    cancelarEscutaTurmas = null;
  }

  if (!cancelarEscutaTurmas) {
    uidEscutaTurmas = usuario.uid;

    cancelarEscutaTurmas = onSnapshot(
      referenciaDocumentoTurmas,

      (snapshot) => {
        if (salvamentosTurmasPendentes > 0) {
          return;
        }

        aplicarSnapshotTurmas(snapshot);
      },

      (erro) => {
        console.error("Erro na escuta das turmas:", erro);
      }
    );
  }

  return obterTurmasSalvas();
}

/* ========================================================= FIREBASE — SALVAMENTO ========================================================= */

async function salvarTurmasFirebase() {
  if (!window.auth || !window.firebaseFirestore || !window.db) {
    throw new Error("Firebase não está disponível.");
  }

  const usuario = window.auth.currentUser;

  if (!usuario) {
    throw new Error("Usuário não autenticado.");
  }

  const { doc, setDoc, serverTimestamp } = window.firebaseFirestore;

  if (!referenciaDocumentoTurmas || usuarioTurmasAtual?.uid !== usuario.uid) {
    usuarioTurmasAtual = usuario;

    referenciaDocumentoTurmas = doc(
      window.db,
      "usuarios",
      usuario.uid,
      "dados",
      "turmas"
    );
  }

  const referenciaGravacao = referenciaDocumentoTurmas;

  const dadosGravacao = clonarDadosTurmas(
    normalizarListaTurmas(turmasFirebase)
  );

  salvamentosTurmasPendentes++;

  const operacao = filaSalvamentoTurmas

    .catch(() => {
      // Um erro anterior não bloqueia a próxima gravação.
    })

    .then(() =>
      setDoc(
        referenciaGravacao,
        {
          itens: dadosGravacao,
          atualizadoEm: serverTimestamp(),
        },
        {
          merge: true,
        }
      )
    );

  filaSalvamentoTurmas = operacao;

  try {
    await operacao;

    return true;
  } finally {
    salvamentosTurmasPendentes = Math.max(0, salvamentosTurmasPendentes - 1);

    /* Quando toda a fila terminar, fazemos uma sincronização para garantir que nenhum snapshot recebido durante o salvamento seja perdido. */

    if (salvamentosTurmasPendentes === 0 && referenciaDocumentoTurmas) {
      try {
        const { getDoc } = window.firebaseFirestore;

        const snapshot = await getDoc(referenciaDocumentoTurmas);

        aplicarSnapshotTurmas(snapshot);
      } catch (erro) {
        console.warn(
          "Não foi possível sincronizar as turmas após o salvamento:",
          erro
        );
      }
    }
  }
}

async function salvarDadosTurmas(novaLista) {
  const novaVersao = ++versaoEstadoTurmas;

  const dadosNormalizados = normalizarListaTurmas(
    Array.isArray(novaLista) ? novaLista : []
  );

  const estadoAtualSerializado = JSON.stringify(
    normalizarListaTurmas(turmasFirebase)
  );

  const novoEstadoSerializado = JSON.stringify(dadosNormalizados);

  if (estadoAtualSerializado === novoEstadoSerializado) {
    return true;
  }

  turmasFirebase = clonarDadosTurmas(dadosNormalizados);

  try {
    await salvarTurmasFirebase();

    estadoConfirmadoTurmas = clonarDadosTurmas(dadosNormalizados);

    return true;
  } catch (erro) {
    /* Só restaura a tela quando esta ainda é a alteração local mais recente. Se outra alteração já tiver sido feita, ela não pode ser apagada por uma falha pertencente a um salvamento anterior. */

    if (versaoEstadoTurmas === novaVersao) {
      turmasFirebase = clonarDadosTurmas(estadoConfirmadoTurmas);
    }

    console.error("Erro ao salvar dados das turmas:", erro);

    mostrarAvisoTurmas("❌ Não foi possível salvar as turmas.", {
      titulo: "Erro ao salvar",

      mensagem:
        "As alterações não foram gravadas. Verifique sua conexão e tente novamente.",

      icone: "error",
    });

    return false;
  }
}

/* ========================================================= OUTROS DADOS DO APP ========================================================= */

async function lerDadosExternosTurmas(chave, valorPadrao = []) {
  if (typeof window.lerDados === "function") {
    try {
      const resultado = await window.lerDados(chave, valorPadrao);

      return resultado ?? valorPadrao;
    } catch (erro) {
      console.error(`Erro ao ler "${chave}":`, erro);
    }
  }

  return valorPadrao;
}

async function salvarDadosExternosTurmas(chave, valor) {
  if (typeof window.salvarDados === "function") {
    return await window.salvarDados(chave, valor);
  }

  console.error(`salvarDados() não está disponível para "${chave}".`);

  return false;
}

/* ========================================================= TELA PRINCIPAL DE TURMAS ========================================================= */

async function abrirTurmas() {
  await carregarTurmasFirebase();

  document.body.innerHTML =
    ` <div class="cabecalhoTela"> <div> <h1>📚 Turmas</h1> <p> Cadastre suas turmas, alunos e avaliações. </p> </div> </div> <main class="secaoApp"> <section class="card textoEsquerda"> <h2>➕ Nova turma</h2> <div class="grupoCampo"> <label for="nomeTurma"> Nome da turma </label> <input id="nomeTurma" type="text" placeholder="Ex.: 6º Ano A" autocomplete="off" > </div> <div class="acoes"> <button id="criarTurma" class="btnAzul" type="button" > <span class="material-icons-round"> group_add </span> Criar turma </button> </div> </section> <section class="painel"> <div class="painelBlocoCabecalho"> <div> <h2>📋 Turmas cadastradas</h2> <p id="contadorTurmas"> Nenhuma turma cadastrada. </p> </div> </div> <div id="listaTurmas"></div> </section> <div class="acoes"> <button class="btnAzul" type="button" onclick="voltarHome()" > <span class="material-icons-round"> arrow_back </span> Voltar </button> </div> </main> ` +
    (typeof barraInferior === "function" ? barraInferior() : "");

  if (typeof aplicarTemaSalvo === "function") {
    aplicarTemaSalvo();
  }

  const campoNomeTurma = document.getElementById("nomeTurma");

  const botaoCriarTurma = document.getElementById("criarTurma");

  const listaTurmas = document.getElementById("listaTurmas");

  const contadorTurmas = document.getElementById("contadorTurmas");

  async function atualizarTurmas() {
    const turmas = obterTurmasSalvas();

    if (!listaTurmas || !contadorTurmas) {
      return;
    }

    if (turmas.length === 0) {
      contadorTurmas.textContent = "Nenhuma turma cadastrada.";

      listaTurmas.innerHTML = ` <div class="estadoVazioApp"> <span class="estadoVazioIcone material-icons-round"> groups </span> <h3>Nenhuma turma cadastrada</h3> <p> Crie uma turma para cadastrar alunos, avaliações e acompanhar as correções. </p> </div> `;

      return;
    }

    contadorTurmas.textContent =
      turmas.length === 1
        ? "1 turma cadastrada."
        : `${turmas.length} turmas cadastradas.`;

    let historico = await lerDadosExternosTurmas("historico", []);

    if (!Array.isArray(historico)) {
      historico = [];
    }

    let html = "";

    turmas.forEach((turma, index) => {
      const alunos = Array.isArray(turma.alunos) ? turma.alunos : [];

      const avaliacoes = Array.isArray(turma.avaliacoes)
        ? turma.avaliacoes
        : [];

      const totalAlunos = alunos.length;

      const totalAvaliacoes = avaliacoes.length;

      const nomesCorrigidos = new Set();

      historico.forEach((registro) => {
        if (!registro) {
          return;
        }

        const turmaRegistro = normalizarNomeTurmas(registro.turma);

        const nomeAluno = registro.nome || registro.aluno || "";

        if (turmaRegistro === normalizarNomeTurmas(turma.nome) && nomeAluno) {
          nomesCorrigidos.add(normalizarNomeTurmas(nomeAluno));
        }
      });

      const alunosCorrigidos = alunos.filter((aluno) =>
        nomesCorrigidos.has(normalizarNomeTurmas(aluno))
      ).length;

      const alunosPendentes = Math.max(totalAlunos - alunosCorrigidos, 0);

      const percentualConcluido =
        totalAlunos > 0
          ? Math.round((alunosCorrigidos / totalAlunos) * 100)
          : 0;

      const corTurma =
        totalAlunos === 0
          ? "var(--primaria)"
          : alunosPendentes > 0
          ? "var(--alerta)"
          : "var(--sucesso)";

      const nomeSeguro = escaparHTMLTurmas(turma.nome);

      html += ` <div class="card cardTurma" style=" border-left:8px solid ${corTurma}; " > <div class="turmaTitulo"> 📚 ${nomeSeguro} </div> <div class="turmaInfo"> <div> 👨‍🎓 <br> <strong> ${totalAlunos} </strong> <br> Alunos </div> <div> 📝 <br> <strong> ${totalAvaliacoes} </strong> <br> Avaliações </div> <div> 📷 <br> <strong> ${alunosCorrigidos} </strong> <br> Corrigidos </div> </div> <div class="barraProgresso"> <div style=" width:${percentualConcluido}%; " ></div> </div> <div class="percentualTurma"> ${percentualConcluido}% concluído • ${alunosPendentes} pendente(s) </div> ${
        totalAlunos === 0
          ? ` <div style=" margin-top:10px; font-weight:700; " > 👨‍🎓 Cadastre os alunos da turma. </div> `
          : alunosPendentes > 0
          ? ` <button type="button" onclick="abrirProximoSemNota(${index})" > 📷 Corrigir pendente </button> `
          : ` <div style=" color:var(--sucesso); font-weight:800; margin-top:10px; " > ✅ Turma concluída </div> `
      } <button type="button" onclick="abrirDetalhesTurma(${index})" > 📂 Abrir turma </button> <button type="button" onclick="renomearTurma(${index})" > ✏ Renomear turma </button> <button type="button" class="btnVermelho" onclick="excluirTurma(${index})" > 🗑 Excluir turma </button> </div> `;
    });

    listaTurmas.innerHTML = html;
  }

  async function criarTurma() {
    const nome = campoNomeTurma.value.trim();

    if (nome === "") {
      campoNomeTurma.focus();

      if (typeof mostrarToast === "function") {
        mostrarToast("⚠️ Digite o nome da turma.");
      }

      return;
    }

    const turmas = obterTurmasSalvas();

    const turmaDuplicada = turmas.some(
      (turma) => normalizarNomeTurmas(turma.nome) === normalizarNomeTurmas(nome)
    );

    if (turmaDuplicada) {
      campoNomeTurma.focus();

      if (typeof mostrarToast === "function") {
        mostrarToast("⚠️ Essa turma já está cadastrada.");
      }

      return;
    }

    turmas.push({
      nome,

      alunos: [],

      avaliacoes: [],
    });

    const salvou = await salvarDadosTurmas(turmas);

    if (!salvou) {
      return;
    }

    campoNomeTurma.value = "";
    campoNomeTurma.focus();

    await atualizarTurmas();

    if (typeof mostrarToast === "function") {
      mostrarToast("✅ Turma criada.");
    }
  }

  botaoCriarTurma.onclick = criarTurma;

  campoNomeTurma.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter") {
      evento.preventDefault();

      criarTurma();
    }
  });

  await atualizarTurmas();
}

/* ========================================================= FIM DA PARTE 1 COLE A PARTE 2 IMEDIATAMENTE ABAIXO ========================================================= */

/* ========================================================= EXCLUIR TURMA ========================================================= */

/* ========================================================= EXCLUIR TURMA ========================================================= */

async function excluirTurma(index) {
  index = Number(index);

  const turmas = obterTurmasSalvas();

  if (!Number.isInteger(index) || index < 0 || index >= turmas.length) {
    mostrarAvisoTurmas("⚠️ A turma selecionada não foi encontrada.", {
      titulo: "Turma não encontrada",

      mensagem: "A turma selecionada não existe ou já foi removida.",

      icone: "error",
    });

    return;
  }

  const turma = turmas[index];

  const nomeTurma = String(turma.nome || "Turma").trim();

  if (typeof mostrarConfirmacao !== "function") {
    mostrarAvisoTurmas("⚠️ A janela de confirmação não está disponível.", {
      titulo: "Exclusão indisponível",

      mensagem: "Não foi possível abrir a confirmação para excluir esta turma.",

      icone: "warning",
    });

    return;
  }

  mostrarConfirmacao({
    titulo: "Excluir turma",

    mensagem: `Deseja realmente excluir a turma "${nomeTurma}"?`,

    icone: "delete",

    textoConfirmar: "Continuar",

    textoCancelar: "Cancelar",

    classeConfirmar: "btnVermelho",

    aoConfirmar: function () {
      mostrarConfirmacao({
        titulo: "Excluir dados vinculados",

        mensagem:
          "Deseja excluir também os registros do histórico e os compromissos da Agenda vinculados a esta turma?",

        icone: "warning",

        textoConfirmar: "Excluir tudo",

        textoCancelar: "Manter vinculados",

        classeConfirmar: "btnVermelho",

        aoConfirmar: async function () {
          await finalizarExclusaoTurma(true);
        },

        aoCancelar: async function () {
          await finalizarExclusaoTurma(false);
        },
      });
    },
  });

  async function finalizarExclusaoTurma(excluirVinculados) {
    let historicoOriginal = null;

    let agendaOriginal = null;

    let historicoAlterado = false;

    let agendaAlterada = false;

    try {
      /* Primeiro preparamos os dados vinculados, mas preservamos cópias para restauração caso alguma etapa posterior falhe. */

      if (excluirVinculados) {
        let historico = await lerDadosExternosTurmas("historico", []);

        if (!Array.isArray(historico)) {
          historico = [];
        }

        historicoOriginal = clonarDadosTurmas(historico);

        const historicoAtualizado = historico.filter((registro) => {
          if (!registro || typeof registro !== "object") {
            /* Preserva registros inválidos em vez de apagá-los silenciosamente. */

            return true;
          }

          return (
            normalizarNomeTurmas(registro.turma) !==
            normalizarNomeTurmas(nomeTurma)
          );
        });

        let agenda = await lerDadosExternosTurmas("agendaInteligente", []);

        if (!Array.isArray(agenda)) {
          agenda = [];
        }

        agendaOriginal = clonarDadosTurmas(agenda);

        const agendaAtualizada = agenda.filter((item) => {
          if (!item || typeof item !== "object") {
            return true;
          }

          return (
            normalizarNomeTurmas(item.turma) !== normalizarNomeTurmas(nomeTurma)
          );
        });

        const historicoSalvo = await salvarDadosExternosTurmas(
          "historico",
          historicoAtualizado
        );

        if (historicoSalvo === false) {
          throw new Error("Não foi possível atualizar o histórico.");
        }

        historicoAlterado = true;

        const agendaSalva = await salvarDadosExternosTurmas(
          "agendaInteligente",
          agendaAtualizada
        );

        if (agendaSalva === false) {
          throw new Error("Não foi possível atualizar a Agenda.");
        }

        agendaAlterada = true;
      }

      /* A turma somente é retirada da cópia local depois que os dados vinculados foram preparados e salvos. */

      const turmasAtualizadas = clonarDadosTurmas(turmas);

      turmasAtualizadas.splice(index, 1);

      const turmaSalva = await salvarDadosTurmas(turmasAtualizadas);

      if (!turmaSalva) {
        throw new Error("Não foi possível excluir a turma.");
      }

      if (typeof mostrarToast === "function") {
        mostrarToast(
          excluirVinculados
            ? "🗑 Turma e dados vinculados excluídos."
            : "🗑 Turma excluída."
        );
      }

      await abrirTurmas();
    } catch (erro) {
      console.error("Erro ao excluir turma:", erro);

      /* Se a exclusão da turma falhar depois de histórico ou Agenda terem sido alterados, tenta restaurar os conteúdos originais. */

      if (agendaAlterada && Array.isArray(agendaOriginal)) {
        try {
          await salvarDadosExternosTurmas("agendaInteligente", agendaOriginal);
        } catch (erroRestauracao) {
          console.error("Erro ao restaurar a Agenda:", erroRestauracao);
        }
      }

      if (historicoAlterado && Array.isArray(historicoOriginal)) {
        try {
          await salvarDadosExternosTurmas("historico", historicoOriginal);
        } catch (erroRestauracao) {
          console.error("Erro ao restaurar o histórico:", erroRestauracao);
        }
      }

      mostrarAvisoTurmas("❌ Não foi possível concluir a exclusão.", {
        titulo: "Erro ao excluir",

        mensagem:
          "A exclusão não foi concluída. Os dados vinculados foram restaurados quando possível. Verifique sua conexão e tente novamente.",

        icone: "error",
      });
    }
  }
}

/* ========================================================= FIM DA PARTE 2A COLE A PARTE 2B IMEDIATAMENTE ABAIXO ========================================================= */

/* ========================================================= RENOMEAR TURMA ========================================================= */

async function renomearTurma(index) {
  const turmas = obterTurmasSalvas();

  index = Number(index);

  if (!Number.isInteger(index) || index < 0 || index >= turmas.length) {
    return;
  }

  const nomeAntigo = turmas[index].nome || "";

  mostrarPrompt({
    titulo: "Renomear turma",

    mensagem: "Digite o novo nome da turma.",

    label: "Nome da turma",

    valor: nomeAntigo,

    placeholder: "Ex.: 6º Ano A",

    tipo: "text",

    icone: "edit",

    textoConfirmar: "Continuar",

    textoCancelar: "Cancelar",

    obrigatorio: true,

    aoConfirmar: async function (novoNome) {
      novoNome = String(novoNome || "").trim();

      if (novoNome === "") {
        if (typeof mostrarToast === "function") {
          mostrarToast("⚠️ O nome da turma não pode ficar vazio.");
        } else if (typeof mostrarAlerta === "function") {
          mostrarAlerta({
            titulo: "Nome obrigatório",

            mensagem: "O nome da turma não pode ficar vazio.",

            icone: "warning",
          });
        }

        return;
      }

      const nomeNormalizado = normalizarNomeTurmas(novoNome);

      const turmaDuplicada = turmas.some(
        (turma, i) =>
          i !== index && normalizarNomeTurmas(turma.nome) === nomeNormalizado
      );

      if (turmaDuplicada) {
        if (typeof mostrarToast === "function") {
          mostrarToast("⚠️ Já existe uma turma com esse nome.");
        } else if (typeof mostrarAlerta === "function") {
          mostrarAlerta({
            titulo: "Turma já cadastrada",

            mensagem: "Já existe uma turma com esse nome.",

            icone: "warning",
          });
        }

        return;
      }

      if (normalizarNomeTurmas(novoNome) === normalizarNomeTurmas(nomeAntigo)) {
        if (typeof mostrarToast === "function") {
          mostrarToast("ℹ️ O nome da turma não foi alterado.");
        }

        return;
      }

      mostrarConfirmacao({
        titulo: "Atualizar dados vinculados",

        mensagem:
          "Deseja atualizar também o histórico e os compromissos da Agenda com o novo nome da turma?",

        icone: "sync",

        textoConfirmar: "Atualizar tudo",

        textoCancelar: "Somente a turma",

        classeConfirmar: "btnAzul",

        aoConfirmar: async function () {
          await finalizarRenomeacaoTurma(true);
        },

        aoCancelar: async function () {
          await finalizarRenomeacaoTurma(false);
        },
      });

      async function finalizarRenomeacaoTurma(atualizarVinculados) {
        try {
          const turmasAtualizadas = clonarDadosTurmas(turmas);

          turmasAtualizadas[index].nome = novoNome;

          if (atualizarVinculados) {
            let historico = await lerDadosExternosTurmas("historico", []);

            if (!Array.isArray(historico)) {
              historico = [];
            }

            historico.forEach((registro) => {
              if (!registro || typeof registro !== "object") {
                return;
              }

              if (
                normalizarNomeTurmas(registro.turma) ===
                normalizarNomeTurmas(nomeAntigo)
              ) {
                registro.turma = novoNome;
              }
            });

            const historicoSalvo = await salvarDadosExternosTurmas(
              "historico",
              historico
            );

            if (historicoSalvo === false) {
              throw new Error("Não foi possível atualizar o histórico.");
            }

            let agenda = await lerDadosExternosTurmas("agendaInteligente", []);

            if (!Array.isArray(agenda)) {
              agenda = [];
            }

            agenda.forEach((item) => {
              if (!item || typeof item !== "object") {
                return;
              }

              if (
                normalizarNomeTurmas(item.turma) ===
                normalizarNomeTurmas(nomeAntigo)
              ) {
                item.turma = novoNome;
              }
            });

            const agendaSalva = await salvarDadosExternosTurmas(
              "agendaInteligente",
              agenda
            );

            if (agendaSalva === false) {
              throw new Error("Não foi possível atualizar a Agenda.");
            }
          }

          const turmaSalva = await salvarDadosTurmas(turmasAtualizadas);

          if (!turmaSalva) {
            throw new Error("Não foi possível renomear a turma.");
          }

          if (typeof mostrarToast === "function") {
            mostrarToast("✅ Turma renomeada.");
          }

          await abrirTurmas();
        } catch (erro) {
          console.error("Erro ao renomear turma:", erro);

          if (typeof mostrarToast === "function") {
            mostrarToast("❌ Não foi possível renomear a turma.");
          } else if (typeof mostrarAlerta === "function") {
            mostrarAlerta({
              titulo: "Erro ao renomear",

              mensagem:
                "Não foi possível renomear a turma. Verifique sua conexão e tente novamente.",

              icone: "error",
            });
          }
        }
      }
    },
  });
}

/* ========================================================= FIM DA PARTE 2B COLE A PARTE 3 IMEDIATAMENTE ABAIXO ========================================================= */

/* ========================================================= DETALHES DA TURMA ========================================================= */

async function abrirDetalhesTurma(index) {
  index = Number(index);

  let turmas = obterTurmasSalvas();

  if (!Number.isInteger(index) || index < 0 || index >= turmas.length) {
    await abrirTurmas();
    return;
  }

  let turma = turmas[index];

  if (!Array.isArray(turma.alunos)) {
    turma.alunos = [];
  }

  if (!Array.isArray(turma.avaliacoes)) {
    turma.avaliacoes = [];
  }

  document.body.innerHTML =
    ` <div class="cabecalhoTela"> <div> <h1> 📚 <span id="nomeTurmaDetalhes"></span> </h1> <p> Gerencie os alunos e as avaliações desta turma. </p> </div> </div> <main class="secaoApp"> <section class="card textoEsquerda"> <h2>➕ Adicionar aluno</h2> <div class="grupoCampo"> <label for="nomeAlunoTurma"> Nome do aluno </label> <input id="nomeAlunoTurma" type="text" placeholder="Ex.: Maria Silva" autocomplete="off" > </div> <div class="acoes"> <button id="adicionarAlunoTurma" class="btnAzul" type="button" > <span class="material-icons-round"> person_add </span> Adicionar aluno </button> </div> </section> <section class="card textoEsquerda"> <h2>📋 Adicionar vários alunos</h2> <div class="grupoCampo"> <label for="listaAlunosEmMassa"> Um aluno por linha </label> <textarea id="listaAlunosEmMassa" placeholder="Maria Silva&#10;João Pereira&#10;Ana Souza" style=" width:90%; max-width:500px; height:160px; padding:18px; border-radius:18px; border:1px solid var(--borda); background:var(--card); color:var(--texto); resize:vertical; " ></textarea> </div> <div class="acoes"> <button id="adicionarListaAlunos" class="btnAzul" type="button" > <span class="material-icons-round"> playlist_add </span> Adicionar lista </button> </div> </section> <section class="painel"> <div class="painelBlocoCabecalho"> <div> <h2>👨‍🎓 Alunos</h2> <p id="contadorAlunosTurma"> Nenhum aluno cadastrado. </p> </div> </div> <div id="listaAlunosTurma"></div> </section> <section class="card"> <h2>📊 Ferramentas da turma</h2> <div class="acoes"> <button type="button" onclick="abrirAvaliacoesTurma(${index})" > 📝 Avaliações </button> <button type="button" onclick="abrirLivroNotas(${index})" > 📚 Livro de Notas </button> <button type="button" onclick="abrirBoletimTurma(${index})" > 📊 Boletim da turma </button> <button type="button" onclick="abrirBoletimBimestralTurma(${index})" > 📊 Boletim bimestral </button> </div> </section> <div class="acoes"> <button class="btnAzul" type="button" onclick="abrirTurmas()" > <span class="material-icons-round"> arrow_back </span> Voltar para Turmas </button> </div> </main> ` +
    (typeof barraInferior === "function" ? barraInferior() : "");

  if (typeof aplicarTemaSalvo === "function") {
    aplicarTemaSalvo();
  }

  const nomeTurmaDetalhes = document.getElementById("nomeTurmaDetalhes");

  const campoNomeAluno = document.getElementById("nomeAlunoTurma");

  const campoListaAlunos = document.getElementById("listaAlunosEmMassa");

  const botaoAdicionarAluno = document.getElementById("adicionarAlunoTurma");

  const botaoAdicionarLista = document.getElementById("adicionarListaAlunos");

  const listaAlunos = document.getElementById("listaAlunosTurma");

  const contadorAlunos = document.getElementById("contadorAlunosTurma");

  if (nomeTurmaDetalhes) {
    nomeTurmaDetalhes.textContent = turma.nome;
  }

  function alunoJaExiste(nome, indexIgnorado = -1) {
    const nomeNormalizado = normalizarNomeTurmas(nome);

    return turma.alunos.some(
      (aluno, i) =>
        i !== indexIgnorado && normalizarNomeTurmas(aluno) === nomeNormalizado
    );
  }

  async function salvarTurmaAtual() {
    turmas[index] = turma;

    const salvou = await salvarDadosTurmas(turmas);

    return salvou;
  }

  function atualizarAlunos() {
    if (!listaAlunos || !contadorAlunos) {
      return;
    }

    const total = turma.alunos.length;

    contadorAlunos.textContent =
      total === 0
        ? "Nenhum aluno cadastrado."
        : total === 1
        ? "1 aluno cadastrado."
        : `${total} alunos cadastrados.`;

    if (total === 0) {
      listaAlunos.innerHTML = ` <div class="estadoVazioApp"> <span class="estadoVazioIcone material-icons-round"> person_off </span> <h3>Nenhum aluno cadastrado</h3> <p> Adicione um aluno ou cole uma lista com vários nomes. </p> </div> `;

      return;
    }

    let html = "";

    turma.alunos.forEach((aluno, i) => {
      html += ` <div class="card textoEsquerda"> <div class="flexEntre"> <div class="flexInicio"> <span class="material-icons-round"> person </span> <strong> ${escaparHTMLTurmas(
        aluno
      )} </strong> </div> <div class="acoes"> <button type="button" onclick="editarAlunoTurma(${index},${i})" aria-label="Editar aluno" > <span class="material-icons-round"> edit </span> Editar </button> <button type="button" class="btnVermelho" onclick="excluirAlunoTurma(${index},${i})" aria-label="Excluir aluno" > <span class="material-icons-round"> delete </span> Excluir </button> </div> </div> </div> `;
    });

    listaAlunos.innerHTML = html;
  }

  async function adicionarAluno() {
    const nome = String(campoNomeAluno?.value || "").trim();

    if (nome === "") {
      campoNomeAluno?.focus();

      if (typeof mostrarToast === "function") {
        mostrarToast("⚠️ Digite o nome do aluno.");
      } else if (typeof mostrarAlerta === "function") {
        mostrarAlerta({
          titulo: "Nome obrigatório",

          mensagem: "Digite o nome do aluno.",

          icone: "warning",
        });
      }

      return;
    }

    if (alunoJaExiste(nome)) {
      campoNomeAluno?.focus();

      if (typeof mostrarToast === "function") {
        mostrarToast("⚠️ Este aluno já está cadastrado.");
      } else if (typeof mostrarAlerta === "function") {
        mostrarAlerta({
          titulo: "Aluno já cadastrado",

          mensagem: "Este aluno já está cadastrado nesta turma.",

          icone: "warning",
        });
      }

      return;
    }

    turma.alunos.push(nome);

    turma.alunos = ordenarNomesTurmas(turma.alunos);

    const salvou = await salvarTurmaAtual();

    if (!salvou) {
      turma.alunos = turma.alunos.filter(
        (aluno) => normalizarNomeTurmas(aluno) !== normalizarNomeTurmas(nome)
      );

      return;
    }

    campoNomeAluno.value = "";
    campoNomeAluno.focus();

    atualizarAlunos();

    if (typeof mostrarToast === "function") {
      mostrarToast("✅ Aluno adicionado.");
    }
  }

  async function adicionarListaAlunos() {
    const texto = String(campoListaAlunos?.value || "").trim();

    if (texto === "") {
      campoListaAlunos?.focus();

      if (typeof mostrarToast === "function") {
        mostrarToast("⚠️ Cole a lista de alunos.");
      } else if (typeof mostrarAlerta === "function") {
        mostrarAlerta({
          titulo: "Lista vazia",

          mensagem: "Cole ou digite uma lista com um aluno por linha.",

          icone: "warning",
        });
      }

      return;
    }

    const nomesInformados = texto
      .split(/\r?\n/)
      .map((nome) => nome.trim())
      .filter((nome) => nome !== "");

    let adicionados = 0;
    let ignorados = 0;

    nomesInformados.forEach((nome) => {
      if (alunoJaExiste(nome)) {
        ignorados++;
        return;
      }

      turma.alunos.push(nome);

      adicionados++;
    });

    if (adicionados === 0) {
      if (typeof mostrarToast === "function") {
        mostrarToast("⚠️ Todos os alunos da lista já estavam cadastrados.");
      }

      return;
    }

    turma.alunos = ordenarNomesTurmas(turma.alunos);

    const salvou = await salvarTurmaAtual();

    if (!salvou) {
      await abrirDetalhesTurma(index);

      return;
    }

    campoListaAlunos.value = "";

    atualizarAlunos();

    if (typeof mostrarToast === "function") {
      if (ignorados > 0) {
        mostrarToast(
          `✅ ${adicionados} aluno(s) adicionado(s) • ${ignorados} duplicado(s) ignorado(s).`
        );
      } else {
        mostrarToast(`✅ ${adicionados} aluno(s) adicionado(s).`);
      }
    }
  }

  if (botaoAdicionarAluno) {
    botaoAdicionarAluno.onclick = adicionarAluno;
  }

  if (botaoAdicionarLista) {
    botaoAdicionarLista.onclick = adicionarListaAlunos;
  }

  if (campoNomeAluno) {
    campoNomeAluno.addEventListener("keydown", (evento) => {
      if (evento.key === "Enter") {
        evento.preventDefault();

        adicionarAluno();
      }
    });
  }

  atualizarAlunos();
}

/* ========================================================= FIM DA PARTE 3 COLE A PARTE 4 IMEDIATAMENTE ABAIXO ========================================================= */

/* ========================================================= EDITAR ALUNO ========================================================= */

window.editarAlunoTurma = async function (indexTurma, indexAluno) {
  indexTurma = Number(indexTurma);

  indexAluno = Number(indexAluno);

  let turmasSalvas = obterTurmasSalvas();

  if (!Array.isArray(turmasSalvas)) {
    return;
  }

  if (
    !Number.isInteger(indexTurma) ||
    !Number.isInteger(indexAluno) ||
    !turmasSalvas[indexTurma] ||
    !Array.isArray(turmasSalvas[indexTurma].alunos) ||
    indexAluno < 0 ||
    indexAluno >= turmasSalvas[indexTurma].alunos.length
  ) {
    return;
  }

  const nomeAtual = turmasSalvas[indexTurma].alunos[indexAluno];

  mostrarPrompt({
    titulo: "Editar aluno",

    mensagem: "Digite o novo nome do aluno.",

    label: "Nome do aluno",

    valor: nomeAtual,

    placeholder: "Ex.: Maria Silva",

    tipo: "text",

    icone: "person_edit",

    textoConfirmar: "Continuar",

    textoCancelar: "Cancelar",

    obrigatorio: true,

    aoConfirmar: async function (novoNome) {
      novoNome = String(novoNome || "").trim();

      if (novoNome === "") {
        if (typeof mostrarToast === "function") {
          mostrarToast("⚠️ O nome do aluno não pode ficar vazio.");
        } else if (typeof mostrarAlerta === "function") {
          mostrarAlerta({
            titulo: "Nome obrigatório",

            mensagem: "O nome do aluno não pode ficar vazio.",

            icone: "warning",
          });
        }

        return;
      }

      const duplicado = turmasSalvas[indexTurma].alunos.some(
        (aluno, i) =>
          i !== indexAluno &&
          normalizarNomeTurmas(aluno) === normalizarNomeTurmas(novoNome)
      );

      if (duplicado) {
        if (typeof mostrarToast === "function") {
          mostrarToast("⚠️ Esse aluno já está cadastrado.");
        } else if (typeof mostrarAlerta === "function") {
          mostrarAlerta({
            titulo: "Aluno já cadastrado",

            mensagem: "Esse aluno já está cadastrado nesta turma.",

            icone: "warning",
          });
        }

        return;
      }

      if (normalizarNomeTurmas(novoNome) === normalizarNomeTurmas(nomeAtual)) {
        if (typeof mostrarToast === "function") {
          mostrarToast("ℹ️ O nome do aluno não foi alterado.");
        }

        return;
      }

      mostrarConfirmacao({
        titulo: "Atualizar histórico",

        mensagem:
          "Deseja atualizar também os registros antigos desse aluno no histórico?",

        icone: "history",

        textoConfirmar: "Atualizar histórico",

        textoCancelar: "Somente o cadastro",

        classeConfirmar: "btnAzul",

        aoConfirmar: async function () {
          await finalizarEdicaoAluno(true);
        },

        aoCancelar: async function () {
          await finalizarEdicaoAluno(false);
        },
      });

      async function finalizarEdicaoAluno(atualizarHistorico) {
        try {
          const nomeAntigo = nomeAtual;

          const nomeTurma = turmasSalvas[indexTurma].nome;

          turmasSalvas[indexTurma].alunos[indexAluno] = novoNome;

          /* Atualiza as notas das avaliações. As notas são armazenadas usando o nome do aluno como chave. */

          if (Array.isArray(turmasSalvas[indexTurma].avaliacoes)) {
            turmasSalvas[indexTurma].avaliacoes.forEach((avaliacao) => {
              if (
                avaliacao &&
                avaliacao.notas &&
                typeof avaliacao.notas === "object" &&
                Object.prototype.hasOwnProperty.call(
                  avaliacao.notas,
                  nomeAntigo
                )
              ) {
                avaliacao.notas[novoNome] = avaliacao.notas[nomeAntigo];

                delete avaliacao.notas[nomeAntigo];
              }

              if (
                avaliacao &&
                avaliacao.controleAtividades &&
                avaliacao.controleAtividades.registros &&
                typeof avaliacao.controleAtividades.registros === "object" &&
                Object.prototype.hasOwnProperty.call(
                  avaliacao.controleAtividades.registros,
                  nomeAntigo
                )
              ) {
                avaliacao.controleAtividades.registros[novoNome] =
                  avaliacao.controleAtividades.registros[nomeAntigo];

                delete avaliacao.controleAtividades.registros[nomeAntigo];
              }
            });
          }

          if (atualizarHistorico) {
            let historico = await lerDadosExternosTurmas("historico", []);

            if (!Array.isArray(historico)) {
              historico = [];
            }

            historico.forEach((registro) => {
              if (
                !registro ||
                normalizarNomeTurmas(registro.turma) !==
                  normalizarNomeTurmas(nomeTurma)
              ) {
                return;
              }

              if (
                normalizarNomeTurmas(registro.nome) ===
                normalizarNomeTurmas(nomeAntigo)
              ) {
                registro.nome = novoNome;
              }

              if (
                normalizarNomeTurmas(registro.aluno) ===
                normalizarNomeTurmas(nomeAntigo)
              ) {
                registro.aluno = novoNome;
              }
            });

            const historicoSalvo = await salvarDadosExternosTurmas(
              "historico",
              historico
            );

            if (historicoSalvo === false) {
              throw new Error("Não foi possível atualizar o histórico.");
            }
          }

          turmasSalvas[indexTurma].alunos = ordenarNomesTurmas(
            turmasSalvas[indexTurma].alunos
          );

          const turmasSalvasComSucesso = await salvarDadosTurmas(turmasSalvas);

          if (!turmasSalvasComSucesso) {
            throw new Error("Não foi possível salvar o novo nome do aluno.");
          }

          if (typeof mostrarToast === "function") {
            mostrarToast("✅ Nome do aluno atualizado.");
          }

          await abrirDetalhesTurma(indexTurma);
        } catch (erro) {
          console.error("Erro ao editar aluno:", erro);

          if (typeof mostrarToast === "function") {
            mostrarToast("❌ Não foi possível atualizar o aluno.");
          } else if (typeof mostrarAlerta === "function") {
            mostrarAlerta({
              titulo: "Erro ao atualizar",

              mensagem:
                "Não foi possível atualizar o aluno. Verifique sua conexão e tente novamente.",

              icone: "error",
            });
          }
        }
      }
    },
  });
};

/* ========================================================= EXCLUIR ALUNO ========================================================= */

window.excluirAlunoTurma = async function (indexTurma, indexAluno) {
  indexTurma = Number(indexTurma);

  indexAluno = Number(indexAluno);

  let turmasSalvas = obterTurmasSalvas();

  if (!Array.isArray(turmasSalvas)) {
    return;
  }

  if (
    !Number.isInteger(indexTurma) ||
    !Number.isInteger(indexAluno) ||
    !turmasSalvas[indexTurma] ||
    !Array.isArray(turmasSalvas[indexTurma].alunos) ||
    indexAluno < 0 ||
    indexAluno >= turmasSalvas[indexTurma].alunos.length
  ) {
    return;
  }

  const turma = turmasSalvas[indexTurma];

  const nomeAluno = turma.alunos[indexAluno];

  const possuiNotas =
    Array.isArray(turma.avaliacoes) &&
    turma.avaliacoes.some(
      (avaliacao) =>
        avaliacao &&
        avaliacao.notas &&
        Object.prototype.hasOwnProperty.call(avaliacao.notas, nomeAluno)
    );

  const mensagem = possuiNotas
    ? `Deseja excluir o aluno "${nomeAluno}"? As notas vinculadas a ele nesta turma também serão removidas.`
    : `Deseja excluir o aluno "${nomeAluno}" desta turma?`;

  mostrarConfirmacao({
    titulo: "Excluir aluno",

    mensagem: mensagem,

    icone: "person_remove",

    textoConfirmar: "Excluir aluno",

    textoCancelar: "Cancelar",

    classeConfirmar: "btnVermelho",

    aoConfirmar: async function () {
      try {
        if (Array.isArray(turma.avaliacoes)) {
          turma.avaliacoes.forEach((avaliacao) => {
            if (
              avaliacao &&
              avaliacao.notas &&
              typeof avaliacao.notas === "object"
            ) {
              delete avaliacao.notas[nomeAluno];
            }

            if (
              avaliacao &&
              avaliacao.controleAtividades &&
              avaliacao.controleAtividades.registros &&
              typeof avaliacao.controleAtividades.registros === "object"
            ) {
              delete avaliacao.controleAtividades.registros[nomeAluno];
            }
          });
        }

        turma.alunos.splice(indexAluno, 1);

        const salvou = await salvarDadosTurmas(turmasSalvas);

        if (!salvou) {
          throw new Error("Não foi possível excluir o aluno.");
        }

        if (typeof mostrarToast === "function") {
          mostrarToast("🗑 Aluno excluído.");
        }

        await abrirDetalhesTurma(indexTurma);
      } catch (erro) {
        console.error("Erro ao excluir aluno:", erro);

        if (typeof mostrarToast === "function") {
          mostrarToast("❌ Não foi possível excluir o aluno.");
        } else if (typeof mostrarAlerta === "function") {
          mostrarAlerta({
            titulo: "Erro ao excluir",

            mensagem:
              "Não foi possível excluir o aluno. Verifique sua conexão e tente novamente.",

            icone: "error",
          });
        }
      }
    },
  });
};

/* ========================================================= FIM DA PARTE 4 COLE A PARTE 5 IMEDIATAMENTE ABAIXO ========================================================= */

/* ========================================================= BOLETIM DA TURMA ========================================================= */

async function abrirBoletimTurma(index) {
  await garantirConfiguracoesPedagogicasTurmas();

  index = Number(index);

  const turmas = obterTurmasSalvas();

  if (!Number.isInteger(index) || index < 0 || index >= turmas.length) {
    mostrarAvisoTurmas("⚠️ A turma selecionada não foi encontrada.", {
      titulo: "Turma não encontrada",

      mensagem: "A turma selecionada não existe ou foi removida.",

      icone: "error",
    });

    await abrirTurmas();

    return;
  }

  let historico = await lerDadosExternosTurmas("historico", []);

  if (!Array.isArray(historico)) {
    historico = [];
  }

  const turma = turmas[index];

  if (!Array.isArray(turma.alunos)) {
    turma.alunos = [];
  }

  const registros = historico.filter((item) => {
    return item && item.turma === turma.nome;
  });

  const notas = [];

  registros.forEach((item) => {
    const nota = parseFloat(
      (item.nota || "0/1").split("/")[0].replace(",", ".")
    );

    if (Number.isFinite(nota)) {
      notas.push(nota);
    }
  });

  let media = 0;
  let maior = 0;
  let menor = 0;

  let aprovados = 0;
  let recuperacao = 0;
  let reprovados = 0;

  if (notas.length > 0) {
    media = notas.reduce((a, b) => a + b, 0) / notas.length;

    maior = Math.max(...notas);

    menor = Math.min(...notas);
  }

  let linhas = "";

  let alunosDestaque = 0;
  let alunosCriticos = 0;

  let melhorMedia = 0;
  let melhorAluno = "-";

  let alunosAtencao = "";

  turma.alunos.forEach((aluno, posicao) => {
    const notasAluno = registros.filter((item) => {
      return item && (item.nome === aluno || item.aluno === aluno);
    });

    const ultimaNota =
      notasAluno.length > 0
        ? notasAluno[notasAluno.length - 1].nota
        : "Sem nota";

    const totalProvasAluno = notasAluno.length;

    let mediaAluno = "Sem média";

    let corAluno = "var(--primaria)";

    if (totalProvasAluno > 0) {
      let somaNotas = 0;
      let quantidadeNotasValidas = 0;

      notasAluno.forEach((item) => {
        const nota = parseFloat(
          (item.nota || "0/1").split("/")[0].replace(",", ".")
        );

        if (Number.isFinite(nota)) {
          somaNotas += nota;
          quantidadeNotasValidas++;
        }
      });

      if (quantidadeNotasValidas > 0) {
        mediaAluno = (somaNotas / quantidadeNotasValidas).toFixed(1);
      }
    }

    if (mediaAluno !== "Sem média") {
      const mediaNum = parseFloat(mediaAluno);

      const situacaoAluno = classificarMediaTurmas(mediaNum);

      corAluno = situacaoAluno.cor;

      if (situacaoAluno.codigo === "destaque") {
        alunosDestaque++;
        aprovados++;
      } else if (situacaoAluno.codigo === "aprovado") {
        aprovados++;
      } else if (situacaoAluno.codigo === "recuperacao") {
        recuperacao++;
      } else if (situacaoAluno.codigo === "critico") {
        reprovados++;
        alunosCriticos++;
      }

      if (
        situacaoAluno.codigo === "recuperacao" ||
        situacaoAluno.codigo === "critico"
      ) {
        alunosAtencao += ` <div class="card" style=" text-align:left; border-left:8px solid ${ situacaoAluno.cor }; " > <strong> ${
          situacaoAluno.icone === "error" ? "🚨" : "⚠️"
        } ${escaparHTMLTurmas(
          aluno
        )} </strong> <br><br> 📈 Média: ${formatarNotaTurmas(
          mediaNum
        )} <br> 📌 Situação: ${escaparHTMLTurmas(
          situacaoAluno.texto
        )} <br> 📝 Provas corrigidas: ${totalProvasAluno} </div> `;
      }

      if (mediaNum > melhorMedia) {
        melhorMedia = mediaNum;

        melhorAluno = aluno;
      }
    }

    linhas += ` <div class="card" style=" text-align:left; border-left:8px solid ${corAluno}; " > <strong> 🏅 ${
      posicao + 1
    }º - ${escaparHTMLTurmas(
      aluno
    )} </strong> <br><br> 📊 Última nota: ${escaparHTMLTurmas(ultimaNota)} ${
      ultimaNota === "Sem nota" ? "<br>⚠ Pendente de correção" : ""
    } <br> 📝 Provas corrigidas: ${totalProvasAluno} <br> 📈 Média: ${
      mediaAluno === "Sem média"
        ? "Sem média"
        : formatarNotaTurmas(Number(mediaAluno))
    } ${
      mediaAluno !== "Sem média"
        ? ` <br> 📌 Situação: ${escaparHTMLTurmas(
            classificarMediaTurmas(Number(mediaAluno)).texto
          )} `
        : ""
    } ${totalProvasAluno === 0 ? "<br>⚠ Ainda sem correção" : ""} </div> `;
  });

  const criteriosAvaliacao = obterCriteriosAvaliacaoTurmas();

  const textoMediaAprovacao = formatarNotaTurmas(
    criteriosAvaliacao.mediaAprovacao
  );

  const textoLimiteRecuperacao = formatarNotaTurmas(
    criteriosAvaliacao.limiteRecuperacao
  );

  const textoMediaDestaque = formatarNotaTurmas(
    criteriosAvaliacao.mediaDestaque
  );

  document.body.innerHTML =
    ` <h1> 📊 Boletim da Turma </h1> <div class="card"> <h2> 📚 ${escaparHTMLTurmas(
      turma.nome
    )} </h2> <div> 👨‍🎓 Avaliações: ${
      registros.length
    } </div> <br> <div> 📈 Média da turma: ${formatarNotaTurmas(
      media
    )} </div> <br> <div> 🏆 Melhor nota: ${maior} </div> <br> <div> 📉 Menor nota: ${menor} </div> <br> <div> ✅ Aprovados: ${aprovados} <br> <small> Média ${textoMediaAprovacao} ou mais </small> </div> <br> <div> ⚠ Em recuperação: ${recuperacao} <br> <small> De ${textoLimiteRecuperacao} até abaixo de ${textoMediaAprovacao} </small> </div> <br> <div> 🚨 Situação crítica: ${reprovados} <br> <small> Abaixo de ${textoLimiteRecuperacao} </small> </div> <br> <div> 🥇 Melhor média: ${escaparHTMLTurmas(
      melhorAluno
    )} (${formatarNotaTurmas(
      melhorMedia
    )}) </div> <br> <div> ⭐ Destaques: ${alunosDestaque} <br> <small> Média ${textoMediaDestaque} ou mais </small> </div> <br> <div> 🚨 Em situação crítica: ${alunosCriticos} </div> <div class="card"> <h2> 🚨 Alunos que precisam de atenção </h2> ${
      alunosAtencao || "<p>Nenhum aluno abaixo de 5.</p>"
    } </div> </div> <br> <div class="card" style=" border:3px solid #F59E0B; background:linear-gradient( 135deg, rgba(245,158,11,.12), rgba(245,158,11,.03) ); " > <div style=" font-size:22px; font-weight:700; margin-bottom:10px; " > 🥇 DESTAQUE DA TURMA </div> <div style=" font-size:18px; margin-bottom:8px; " > 👨‍🎓 ${escaparHTMLTurmas(
      melhorAluno
    )} </div> <div> 📈 Média: ${formatarNotaTurmas(
      melhorMedia
    )} </div> </div> <br> <h2>🏅 Alunos</h2> ${
      linhas || "<p>Nenhum aluno cadastrado.</p>"
    } <button type="button" onclick="abrirProximoSemNota(${index})" > ➡ Próximo aluno sem nota </button> <br><br> <button type="button" onclick="window.print()" > 🖨 Imprimir / Salvar PDF </button> <br><br> <button type="button" onclick="abrirDetalhesTurma(${index})" > ⬅ Voltar para Turma </button> ` +
    (typeof barraInferior === "function" ? barraInferior() : "");

  if (typeof aplicarTemaSalvo === "function") {
    aplicarTemaSalvo();
  }
}

/* ========================================================= FIM DA PARTE 6 A PRÓXIMA FUNÇÃO ORIGINAL É abrirProximoSemNota() ========================================================= */

/* ========================================================= PRÓXIMO ALUNO SEM NOTA ========================================================= */

async function abrirProximoSemNota(index) {
  index = Number(index);

  const turmas = obterTurmasSalvas();

  if (!Number.isInteger(index) || index < 0 || index >= turmas.length) {
    mostrarAvisoTurmas("⚠️ A turma selecionada não foi encontrada.", {
      titulo: "Turma não encontrada",

      mensagem: "A turma selecionada não foi encontrada.",

      icone: "error",
    });

    await abrirTurmas();

    return;
  }

  const turma = turmas[index];

  const alunos = Array.isArray(turma.alunos) ? turma.alunos : [];

  if (alunos.length === 0) {
    mostrarAvisoTurmas("⚠️ Nenhum aluno cadastrado nesta turma.", {
      titulo: "Nenhum aluno cadastrado",

      mensagem: "Cadastre alunos nesta turma antes de iniciar uma correção.",

      icone: "person_off",
    });

    return;
  }

  let historico = await lerDadosExternosTurmas("historico", []);

  if (!Array.isArray(historico)) {
    historico = [];
  }

  const nomeTurmaNormalizado = normalizarNomeTurmas(turma.nome);

  const alunoSemNota = alunos.find((aluno) => {
    const nomeAlunoNormalizado = normalizarNomeTurmas(aluno);

    const possuiCorrecao = historico.some((registro) => {
      if (!registro || typeof registro !== "object") {
        return false;
      }

      const nomeRegistro = registro.nome || registro.aluno || "";

      return (
        normalizarNomeTurmas(registro.turma) === nomeTurmaNormalizado &&
        normalizarNomeTurmas(nomeRegistro) === nomeAlunoNormalizado
      );
    });

    return !possuiCorrecao;
  });

  if (!alunoSemNota) {
    mostrarAvisoTurmas("✅ Todos os alunos já possuem uma correção.", {
      titulo: "Turma concluída",

      mensagem:
        "Todos os alunos desta turma já possuem pelo menos uma correção registrada.",

      icone: "check_circle",
    });

    return;
  }

  if (typeof abrirCorrecao !== "function") {
    mostrarAvisoTurmas("❌ A tela de correção não está disponível.", {
      titulo: "Correção indisponível",

      mensagem:
        "A função responsável por abrir a tela de correção não foi encontrada.",

      icone: "error",
    });

    return;
  }

  abrirCorrecao();

  const MAX_TENTATIVAS = 10;

  const INTERVALO_TENTATIVA = 150;

  const prepararTelaCorrecao = function (tentativa = 0) {
    const campoTurma = document.getElementById("turmaSelecionada");

    const campoAluno = document.getElementById("aluno");

    if (!campoTurma || !campoAluno) {
      if (tentativa < MAX_TENTATIVAS) {
        setTimeout(
          () => prepararTelaCorrecao(tentativa + 1),
          INTERVALO_TENTATIVA
        );

        return;
      }

      console.warn(
        "Os campos turmaSelecionada e aluno não foram encontrados na tela de correção."
      );

      mostrarAvisoTurmas(
        "⚠️ Não foi possível selecionar automaticamente o aluno.",
        {
          titulo: "Tela não carregada",

          mensagem:
            "A tela de correção foi aberta, mas os campos de turma e aluno não foram encontrados. Selecione-os manualmente.",

          icone: "warning",
        }
      );

      return;
    }

    campoTurma.value = turma.nome;

    campoTurma.dispatchEvent(
      new Event("change", {
        bubbles: true,
      })
    );

    /* Algumas telas atualizam a lista de alunos depois do evento change. Por isso fazemos a seleção do aluno em uma etapa posterior. */

    setTimeout(() => {
      const selectAlunoAtualizado = document.getElementById("aluno");

      if (!selectAlunoAtualizado) {
        mostrarAvisoTurmas(
          "⚠️ Não foi possível selecionar automaticamente o aluno.",
          {
            titulo: "Campo do aluno não encontrado",

            mensagem:
              "Selecione manualmente o próximo aluno na tela de correção.",

            icone: "warning",
          }
        );

        return;
      }

      const existeOpcaoAluno = Array.from(selectAlunoAtualizado.options).some(
        (opcao) =>
          normalizarNomeTurmas(opcao.value) ===
          normalizarNomeTurmas(alunoSemNota)
      );

      if (!existeOpcaoAluno) {
        const opcao = document.createElement("option");

        opcao.value = alunoSemNota;

        opcao.textContent = alunoSemNota;

        selectAlunoAtualizado.appendChild(opcao);
      }

      selectAlunoAtualizado.value = alunoSemNota;

      selectAlunoAtualizado.dispatchEvent(
        new Event("change", {
          bubbles: true,
        })
      );

      if (typeof mostrarToast === "function") {
        mostrarToast(`📷 Próximo aluno: ${alunoSemNota}`);
      }
    }, 300);
  };

  prepararTelaCorrecao();
}

/* ========================================================= AVALIAÇÕES DA TURMA ========================================================= */

async function abrirAvaliacoesTurma(index) {
  index = Number(index);

  const turmas = obterTurmasSalvas();

  if (!Number.isInteger(index) || index < 0 || index >= turmas.length) {
    mostrarAvisoTurmas("⚠️ A turma selecionada não foi encontrada.", {
      titulo: "Turma não encontrada",

      mensagem: "A turma selecionada não existe ou foi removida.",

      icone: "error",
    });

    await abrirTurmas();

    return;
  }

  const turma = turmas[index];

  if (!Array.isArray(turma.avaliacoes)) {
    turma.avaliacoes = [];
  }

  document.body.innerHTML =
    ` <div class="cabecalhoTela"> <div> <h1> 📝 Avaliações </h1> <p> Gerencie as avaliações da turma <strong id="nomeTurmaAvaliacoes"></strong>. </p> </div> </div> <main class="secaoApp"> <section class="card textoEsquerda"> <h2> ➕ Nova avaliação </h2> <div class="grupoCampo"> <label for="nomeAvaliacao"> Nome da avaliação </label> <input id="nomeAvaliacao" type="text" placeholder="Ex.: Prova de Língua Portuguesa" autocomplete="off" > </div> <div class="grupoCampo"> <label for="tipoAvaliacao"> Tipo </label> <select id="tipoAvaliacao"> <option value="prova"> Prova </option> <option value="atividade"> Atividade </option> <option value="trabalho"> Trabalho </option> </select> </div> <div class="grupoCampo"> <label for="bimestre"> Bimestre </label> <select id="bimestre"> <option value="1B"> 1º Bimestre </option> <option value="2B"> 2º Bimestre </option> <option value="3B"> 3º Bimestre </option> <option value="4B"> 4º Bimestre </option> </select> </div> <div class="grupoCampo"> <label for="valorAvaliacao"> Valor da avaliação </label> <input id="valorAvaliacao" type="number" min="0.1" step="0.1" value="10" > </div> <div class="acoes"> <button id="criarAvaliacao" class="btnAzul" type="button" > <span class="material-icons-round"> add </span> Criar avaliação </button> </div> </section> <section class="painel"> <div class="painelBlocoCabecalho"> <div> <h2> 📋 Avaliações cadastradas </h2> <p id="contadorAvaliacoes"> Nenhuma avaliação cadastrada. </p> </div> </div> <div id="listaAvaliacoes"></div> </section> <div class="acoes"> <button class="btnAzul" type="button" onclick="abrirDetalhesTurma(${index})" > <span class="material-icons-round"> arrow_back </span> Voltar para a turma </button> </div> </main> ` +
    (typeof barraInferior === "function" ? barraInferior() : "");

  if (typeof aplicarTemaSalvo === "function") {
    aplicarTemaSalvo();
  }

  const nomeTurmaAvaliacoes = document.getElementById("nomeTurmaAvaliacoes");

  const campoNome = document.getElementById("nomeAvaliacao");

  const campoTipo = document.getElementById("tipoAvaliacao");

  const campoBimestre = document.getElementById("bimestre");

  const campoValor = document.getElementById("valorAvaliacao");

  const botaoCriar = document.getElementById("criarAvaliacao");

  const contador = document.getElementById("contadorAvaliacoes");

  const lista = document.getElementById("listaAvaliacoes");

  if (nomeTurmaAvaliacoes) {
    nomeTurmaAvaliacoes.textContent = turma.nome;
  }

  function renderizarAvaliacoes() {
    const avaliacoes = turma.avaliacoes;

    if (!contador || !lista) {
      return;
    }

    contador.textContent =
      avaliacoes.length === 0
        ? "Nenhuma avaliação cadastrada."
        : avaliacoes.length === 1
        ? "1 avaliação cadastrada."
        : `${avaliacoes.length} avaliações cadastradas.`;

    if (avaliacoes.length === 0) {
      lista.innerHTML = ` <div class="estadoVazioApp"> <span class="estadoVazioIcone material-icons-round"> assignment </span> <h3> Nenhuma avaliação cadastrada </h3> <p> Crie uma avaliação para lançar notas e acompanhar o desempenho da turma. </p> </div> `;

      return;
    }

    let html = "";

    avaliacoes.forEach((avaliacao, indexAvaliacao) => {
      const nomeSeguro = escaparHTMLTurmas(avaliacao.nome);

      const tipoSeguro = escaparHTMLTurmas(avaliacao.tipo);

      const bimestreSeguro = escaparHTMLTurmas(avaliacao.bimestre);

      const valor = Number(avaliacao.valor) || 0;

      html += ` <div class="card textoEsquerda"> <h3> 📝 ${nomeSeguro} </h3> <p> <strong>Tipo:</strong> ${tipoSeguro} </p> <p> <strong>Bimestre:</strong> ${bimestreSeguro} </p> <p> <strong>Valor:</strong> ${valor.toFixed(
        1
      )} </p> <div class="acoes"> <button type="button" onclick=" abrirLancamentoNotas( ${index}, ${indexAvaliacao} ) " > <span class="material-icons-round"> edit_note </span> Lançar notas </button> ${
        avaliacao.tipo === "atividade"
          ? ` <button type="button" onclick=" abrirControleAtividades( ${index}, ${indexAvaliacao} ) " > <span class="material-icons-round"> checklist </span> Controle de atividades </button> `
          : ""
      } <button type="button" class="btnVermelho" onclick=" excluirAvaliacao( ${index}, ${indexAvaliacao} ) " > <span class="material-icons-round"> delete </span> Excluir </button> </div> </div> `;
    });

    lista.innerHTML = html;
  }

  async function criarNovaAvaliacao() {
    const nome = String(campoNome?.value || "").trim();

    const tipo = String(campoTipo?.value || "prova");

    const bimestre = String(campoBimestre?.value || "1B");

    const valor = Number(campoValor?.value);

    if (nome === "") {
      campoNome?.focus();

      mostrarAvisoTurmas("⚠️ Digite o nome da avaliação.", {
        titulo: "Nome obrigatório",

        mensagem: "Digite um nome para criar a avaliação.",

        icone: "warning",
      });

      return;
    }

    if (!Number.isFinite(valor) || valor <= 0) {
      campoValor?.focus();

      mostrarAvisoTurmas("⚠️ Informe um valor válido.", {
        titulo: "Valor inválido",

        mensagem: "O valor da avaliação deve ser maior que zero.",

        icone: "warning",
      });

      return;
    }

    const duplicada = turma.avaliacoes.some(
      (avaliacao) =>
        normalizarNomeTurmas(avaliacao.nome) === normalizarNomeTurmas(nome) &&
        avaliacao.bimestre === bimestre
    );

    if (duplicada) {
      campoNome?.focus();

      mostrarAvisoTurmas("⚠️ Essa avaliação já está cadastrada.", {
        titulo: "Avaliação duplicada",

        mensagem: "Já existe uma avaliação com esse nome no mesmo bimestre.",

        icone: "warning",
      });

      return;
    }

    const novaAvaliacao = {
      nome,

      tipo,

      valor,

      bimestre,

      notas: {},
    };

    if (tipo === "atividade") {
      novaAvaliacao.controleAtividades = {
        quantidadeExercicios: 10,

        registros: {},

        exercicios: [],
      };
    }

    turma.avaliacoes.push(novaAvaliacao);

    turmas[index] = turma;

    const salvou = await salvarDadosTurmas(turmas);

    if (!salvou) {
      turma.avaliacoes.pop();

      return;
    }

    campoNome.value = "";
    campoTipo.value = "prova";
    campoBimestre.value = "1B";
    campoValor.value = "10";

    campoNome.focus();

    renderizarAvaliacoes();

    if (typeof mostrarToast === "function") {
      mostrarToast("✅ Avaliação criada.");
    }
  }

  if (botaoCriar) {
    botaoCriar.onclick = criarNovaAvaliacao;
  }

  if (campoNome) {
    campoNome.addEventListener("keydown", (evento) => {
      if (evento.key === "Enter") {
        evento.preventDefault();

        criarNovaAvaliacao();
      }
    });
  }

  renderizarAvaliacoes();
}

/* ========================================================= LANÇAMENTO DE NOTAS ========================================================= */

async function abrirLancamentoNotas(indexTurma, indexAvaliacao) {
  indexTurma = Number(indexTurma);

  indexAvaliacao = Number(indexAvaliacao);

  const turmas = obterTurmasSalvas();

  if (
    !Number.isInteger(indexTurma) ||
    indexTurma < 0 ||
    indexTurma >= turmas.length
  ) {
    mostrarAvisoTurmas("⚠️ A turma selecionada não foi encontrada.", {
      titulo: "Turma não encontrada",

      mensagem: "A turma selecionada não existe ou foi removida.",

      icone: "error",
    });

    await abrirTurmas();

    return;
  }

  const turma = turmas[indexTurma];

  if (
    !Array.isArray(turma.avaliacoes) ||
    !Number.isInteger(indexAvaliacao) ||
    indexAvaliacao < 0 ||
    indexAvaliacao >= turma.avaliacoes.length
  ) {
    mostrarAvisoTurmas("⚠️ A avaliação selecionada não foi encontrada.", {
      titulo: "Avaliação não encontrada",

      mensagem: "A avaliação selecionada não existe ou foi removida.",

      icone: "error",
    });

    await abrirAvaliacoesTurma(indexTurma);

    return;
  }

  const alunos = Array.isArray(turma.alunos) ? turma.alunos : [];

  const avaliacao = turma.avaliacoes[indexAvaliacao];

  if (
    !avaliacao.notas ||
    typeof avaliacao.notas !== "object" ||
    Array.isArray(avaliacao.notas)
  ) {
    avaliacao.notas = {};
  }

  let valorMaximo = Number(avaliacao.valor);

  if (!Number.isFinite(valorMaximo) || valorMaximo <= 0) {
    valorMaximo = 10;
  }

  const nomesBimestres = {
    "1B": "1º Bimestre",

    "2B": "2º Bimestre",

    "3B": "3º Bimestre",

    "4B": "4º Bimestre",
  };

  const nomeAvaliacaoSeguro = escaparHTMLTurmas(
    avaliacao.nome || "Avaliação sem nome"
  );

  const nomeTurmaSeguro = escaparHTMLTurmas(turma.nome || "Turma sem nome");

  const tipoSeguro = escaparHTMLTurmas(String(avaliacao.tipo || "avaliação"));

  const bimestreSeguro = escaparHTMLTurmas(
    nomesBimestres[avaliacao.bimestre] || avaliacao.bimestre || "Sem bimestre"
  );

  let htmlAlunos = "";

  alunos.forEach((aluno, indexAluno) => {
    const notaSalva = avaliacao.notas[aluno];

    const notaAtual =
      notaSalva !== undefined && notaSalva !== null && notaSalva !== ""
        ? notaSalva
        : "";

    htmlAlunos += ` <div class="card textoEsquerda"> <div class="grupoCampo"> <label for="notaAvaliacao_${indexAluno}" > <strong> 👨‍🎓 ${escaparHTMLTurmas(
      aluno
    )} </strong> </label> <input id="notaAvaliacao_${indexAluno}" class="campoNotaAvaliacao" data-index-aluno="${indexAluno}" type="number" min="0" max="${valorMaximo}" step="0.1" value="${escaparHTMLTurmas( notaAtual )}" placeholder="Nota de 0 a ${valorMaximo}" inputmode="decimal" autocomplete="off" > </div> </div> `;
  });

  document.body.innerHTML =
    ` <div class="cabecalhoTela"> <div> <h1> 📋 ${nomeAvaliacaoSeguro} </h1> <p> 📚 ${nomeTurmaSeguro} • ${tipoSeguro} • ${bimestreSeguro} </p> <p> Valor máximo: <strong> ${valorMaximo.toLocaleString(
      "pt-BR",
      { maximumFractionDigits: 2 }
    )} </strong> </p> </div> </div> <main class="secaoApp"> <section class="painel"> <div class="painelBlocoCabecalho"> <div> <h2> ✏️ Notas dos alunos </h2> <p> Deixe o campo vazio quando ainda não houver nota. </p> </div> </div> <div id="listaNotasAvaliacao"> ${
      alunos.length > 0
        ? htmlAlunos
        : ` <div class="estadoVazioApp"> <span class="estadoVazioIcone material-icons-round"> person_off </span> <h3> Nenhum aluno cadastrado </h3> <p> Cadastre alunos nesta turma antes de lançar notas. </p> </div> `
    } </div> </section> ${
      alunos.length > 0
        ? ` <div class="acoes"> <button id="salvarNotasAvaliacao" class="btnVerde" type="button" > <span class="material-icons-round"> save </span> Salvar notas </button> </div> `
        : ""
    } <div class="acoes"> <button class="btnAzul" type="button" onclick="abrirAvaliacoesTurma(${indexTurma})" > <span class="material-icons-round"> arrow_back </span> Voltar para avaliações </button> </div> </main> ` +
    (typeof barraInferior === "function" ? barraInferior() : "");

  if (typeof aplicarTemaSalvo === "function") {
    aplicarTemaSalvo();
  }

  const botaoSalvar = document.getElementById("salvarNotasAvaliacao");

  if (botaoSalvar) {
    botaoSalvar.addEventListener("click", function () {
      salvarNotasTurma(indexTurma, indexAvaliacao);
    });
  }
}

/* ========================================================= SALVAR NOTAS DA TURMA ========================================================= */

async function salvarNotasTurma(indexTurma, indexAvaliacao) {
  indexTurma = Number(indexTurma);

  indexAvaliacao = Number(indexAvaliacao);

  const turmas = obterTurmasSalvas();

  if (
    !Number.isInteger(indexTurma) ||
    indexTurma < 0 ||
    indexTurma >= turmas.length
  ) {
    mostrarAvisoTurmas("⚠️ A turma selecionada não foi encontrada.", {
      titulo: "Turma não encontrada",

      mensagem: "Não foi possível salvar as notas porque a turma não existe.",

      icone: "error",
    });

    return;
  }

  const turma = turmas[indexTurma];

  if (
    !Array.isArray(turma.avaliacoes) ||
    !Number.isInteger(indexAvaliacao) ||
    indexAvaliacao < 0 ||
    indexAvaliacao >= turma.avaliacoes.length
  ) {
    mostrarAvisoTurmas("⚠️ A avaliação selecionada não foi encontrada.", {
      titulo: "Avaliação não encontrada",

      mensagem:
        "Não foi possível salvar as notas porque a avaliação não existe.",

      icone: "error",
    });

    return;
  }

  const avaliacao = turma.avaliacoes[indexAvaliacao];

  const alunos = Array.isArray(turma.alunos) ? turma.alunos : [];

  if (
    !avaliacao.notas ||
    typeof avaliacao.notas !== "object" ||
    Array.isArray(avaliacao.notas)
  ) {
    avaliacao.notas = {};
  }

  let valorMaximo = Number(avaliacao.valor);

  if (!Number.isFinite(valorMaximo) || valorMaximo <= 0) {
    valorMaximo = 10;
  }

  const novasNotas = {
    ...avaliacao.notas,
  };

  for (let indexAluno = 0; indexAluno < alunos.length; indexAluno++) {
    const aluno = alunos[indexAluno];

    const campo = document.getElementById(`notaAvaliacao_${indexAluno}`);

    if (!campo) {
      continue;
    }

    const textoNota = String(campo.value || "")
      .trim()
      .replace(",", ".");

    if (textoNota === "") {
      delete novasNotas[aluno];

      continue;
    }

    const nota = Number(textoNota);

    if (!Number.isFinite(nota) || nota < 0 || nota > valorMaximo) {
      campo.focus();

      mostrarAvisoTurmas(`⚠️ Nota inválida para ${aluno}.`, {
        titulo: "Nota inválida",

        mensagem: `A nota de ${aluno} deve estar entre 0 e ${valorMaximo}.`,

        icone: "warning",
      });

      return;
    }

    novasNotas[aluno] = Number(nota.toFixed(2));
  }

  avaliacao.notas = novasNotas;

  turma.avaliacoes[indexAvaliacao] = avaliacao;

  turmas[indexTurma] = turma;

  const salvou = await salvarDadosTurmas(turmas);

  if (!salvou) {
    mostrarAvisoTurmas("❌ Não foi possível salvar as notas.", {
      titulo: "Erro ao salvar",

      mensagem: "Verifique sua conexão e tente novamente.",

      icone: "error",
    });

    return;
  }

  if (typeof mostrarToast === "function") {
    mostrarToast("✅ Notas salvas.");
  }

  await abrirAvaliacoesTurma(indexTurma);
}

/* ========================================================= EXCLUIR AVALIAÇÃO ========================================================= */

async function excluirAvaliacao(indexTurma, indexAvaliacao) {
  indexTurma = Number(indexTurma);

  indexAvaliacao = Number(indexAvaliacao);

  const turmas = obterTurmasSalvas();

  if (
    !Number.isInteger(indexTurma) ||
    indexTurma < 0 ||
    indexTurma >= turmas.length
  ) {
    mostrarAvisoTurmas("⚠️ A turma selecionada não foi encontrada.", {
      titulo: "Turma não encontrada",

      mensagem:
        "Não foi possível excluir a avaliação porque a turma não existe.",

      icone: "error",
    });

    return;
  }

  const turma = turmas[indexTurma];

  if (
    !Array.isArray(turma.avaliacoes) ||
    !Number.isInteger(indexAvaliacao) ||
    indexAvaliacao < 0 ||
    indexAvaliacao >= turma.avaliacoes.length
  ) {
    mostrarAvisoTurmas("⚠️ A avaliação selecionada não foi encontrada.", {
      titulo: "Avaliação não encontrada",

      mensagem: "A avaliação selecionada não existe ou já foi removida.",

      icone: "error",
    });

    await abrirAvaliacoesTurma(indexTurma);

    return;
  }

  const avaliacao = turma.avaliacoes[indexAvaliacao];

  const nomeAvaliacao = String(avaliacao.nome || "Avaliação sem nome");

  const quantidadeNotas =
    avaliacao.notas &&
    typeof avaliacao.notas === "object" &&
    !Array.isArray(avaliacao.notas)
      ? Object.keys(avaliacao.notas).length
      : 0;

  let possuiControleAtividades = false;

  if (
    avaliacao.controleAtividades &&
    typeof avaliacao.controleAtividades === "object"
  ) {
    const registros = avaliacao.controleAtividades.registros;

    possuiControleAtividades =
      registros &&
      typeof registros === "object" &&
      Object.keys(registros).length > 0;
  }

  let mensagemConfirmacao = `Deseja excluir a avaliação "${nomeAvaliacao}"?`;

  if (quantidadeNotas > 0 || possuiControleAtividades) {
    mensagemConfirmacao =
      `Deseja excluir a avaliação "${nomeAvaliacao}"? ` +
      "As notas e os registros de atividades vinculados também serão apagados.";
  }

  const confirmarExclusao = async function () {
    try {
      turma.avaliacoes.splice(indexAvaliacao, 1);

      turmas[indexTurma] = turma;

      const salvou = await salvarDadosTurmas(turmas);

      if (!salvou) {
        throw new Error("Não foi possível salvar a exclusão da avaliação.");
      }

      if (typeof mostrarToast === "function") {
        mostrarToast("🗑 Avaliação excluída.");
      }

      await abrirAvaliacoesTurma(indexTurma);
    } catch (erro) {
      console.error("Erro ao excluir avaliação:", erro);

      mostrarAvisoTurmas("❌ Não foi possível excluir a avaliação.", {
        titulo: "Erro ao excluir",

        mensagem: "Verifique sua conexão e tente novamente.",

        icone: "error",
      });
    }
  };

  if (typeof mostrarConfirmacao === "function") {
    mostrarConfirmacao({
      titulo: "Excluir avaliação",

      mensagem: mensagemConfirmacao,

      icone: "delete",

      textoConfirmar: "Excluir avaliação",

      textoCancelar: "Cancelar",

      classeConfirmar: "btnVermelho",

      aoConfirmar: confirmarExclusao,
    });

    return;
  }

  const confirmou = window.confirm(mensagemConfirmacao);

  if (confirmou) {
    await confirmarExclusao();
  }
}

/* ========================================================= LIVRO DE NOTAS ========================================================= */

async function abrirLivroNotas(indexTurma) {
  await garantirConfiguracoesPedagogicasTurmas();

  indexTurma = Number(indexTurma);

  const turmas = obterTurmasSalvas();

  if (
    !Number.isInteger(indexTurma) ||
    indexTurma < 0 ||
    indexTurma >= turmas.length
  ) {
    mostrarAvisoTurmas("⚠️ A turma selecionada não foi encontrada.", {
      titulo: "Turma não encontrada",

      mensagem: "A turma selecionada não existe ou foi removida.",

      icone: "error",
    });

    await abrirTurmas();

    return;
  }

  const turma = turmas[indexTurma];

  const alunos = Array.isArray(turma.alunos) ? turma.alunos : [];

  const avaliacoes = Array.isArray(turma.avaliacoes) ? turma.avaliacoes : [];

  const nomeTurmaSeguro = escaparHTMLTurmas(turma.nome || "Turma sem nome");

  const nomesBimestres = {
    TODOS: "Todos os bimestres",

    "1B": "1º Bimestre",

    "2B": "2º Bimestre",

    "3B": "3º Bimestre",

    "4B": "4º Bimestre",
  };

  document.body.innerHTML =
    ` <div class="cabecalhoTela"> <div> <h1> 📘 Livro de Notas </h1> <p> Consulte as notas e o desempenho dos alunos. </p> </div> </div> <main class="secaoApp"> <section class="card textoEsquerda"> <h2> 📚 ${nomeTurmaSeguro} </h2> <div style=" display:grid; grid-template-columns: repeat(auto-fit,minmax(130px,1fr)); gap:14px; margin-top:16px; " > <div class="card"> <h3> ${alunos.length} </h3> <p> 👨‍🎓 Alunos </p> </div> <div class="card"> <h3> ${avaliacoes.length} </h3> <p> 📝 Avaliações </p> </div> <div class="card"> <h3 id="mediaGeralLivroNotas"> - </h3> <p> 📈 Média geral </p> </div> </div> </section> <section class="card textoEsquerda"> <h2> 🔎 Filtros </h2> <div class="grupoCampo"> <label for="buscaAlunoLivroNotas"> Buscar aluno </label> <input id="buscaAlunoLivroNotas" type="search" placeholder="Digite o nome do aluno" autocomplete="off" > </div> <div class="grupoCampo"> <label for="bimestreLivroNotas"> Bimestre </label> <select id="bimestreLivroNotas"> <option value="TODOS"> Todos os bimestres </option> <option value="1B"> 1º Bimestre </option> <option value="2B"> 2º Bimestre </option> <option value="3B"> 3º Bimestre </option> <option value="4B"> 4º Bimestre </option> </select> </div> </section> <section class="painel"> <div class="painelBlocoCabecalho"> <div> <h2> 📊 Notas da turma </h2> <p id="resumoLivroNotas"> Carregando informações... </p> </div> </div> <div id="conteudoLivroNotas" style=" width:100%; overflow:auto; " ></div> </section> <div class="acoes"> <button type="button" onclick="window.print()" > <span class="material-icons-round"> print </span> Imprimir / Salvar PDF </button> <button class="btnAzul" type="button" onclick="abrirDetalhesTurma(${indexTurma})" > <span class="material-icons-round"> arrow_back </span> Voltar para a turma </button> </div> </main> ` +
    (typeof barraInferior === "function" ? barraInferior() : "");

  if (typeof aplicarTemaSalvo === "function") {
    aplicarTemaSalvo();
  }

  const campoBusca = document.getElementById("buscaAlunoLivroNotas");

  const campoBimestre = document.getElementById("bimestreLivroNotas");

  const conteudo = document.getElementById("conteudoLivroNotas");

  const resumo = document.getElementById("resumoLivroNotas");

  const mediaGeralElemento = document.getElementById("mediaGeralLivroNotas");

  function normalizarBuscaLivroNotas(texto) {
    return String(texto || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR")
      .trim();
  }

  function obterNotaValida(avaliacao, aluno) {
    if (!avaliacao || !avaliacao.notas || typeof avaliacao.notas !== "object") {
      return null;
    }

    const valor = avaliacao.notas[aluno];

    if (valor === undefined || valor === null || valor === "") {
      return null;
    }

    const numero = Number(valor);

    return Number.isFinite(numero) ? numero : null;
  }

  function calcularMediaAluno(aluno, avaliacoesExibidas) {
    let totalObtido = 0;
    let totalPossivel = 0;
    let quantidadeNotas = 0;

    avaliacoesExibidas.forEach((avaliacao) => {
      const nota = obterNotaValida(avaliacao, aluno);

      const valorMaximo = Number(avaliacao.valor);

      if (nota === null || !Number.isFinite(valorMaximo) || valorMaximo <= 0) {
        return;
      }

      totalObtido += nota;

      totalPossivel += valorMaximo;

      quantidadeNotas++;
    });

    if (quantidadeNotas === 0 || totalPossivel <= 0) {
      return null;
    }

    return Number(((totalObtido / totalPossivel) * 10).toFixed(2));
  }

  function obterSituacaoMedia(media) {
    return classificarMediaTurmas(media);
  }

  function formatarNumeroLivroNotas(valor) {
    if (
      valor === null ||
      valor === undefined ||
      !Number.isFinite(Number(valor))
    ) {
      return "-";
    }

    return formatarNotaTurmas(Number(valor));
  }

  function renderizarLivroNotas() {
    if (!conteudo || !resumo || !mediaGeralElemento) {
      return;
    }

    const busca = normalizarBuscaLivroNotas(campoBusca?.value);

    const bimestreSelecionado = String(campoBimestre?.value || "TODOS");

    const avaliacoesExibidas = avaliacoes.filter(
      (avaliacao) =>
        bimestreSelecionado === "TODOS" ||
        avaliacao.bimestre === bimestreSelecionado
    );

    const alunosExibidos = alunos.filter((aluno) =>
      normalizarBuscaLivroNotas(aluno).includes(busca)
    );

    resumo.textContent =
      `${nomesBimestres[bimestreSelecionado]} • ` +
      (avaliacoesExibidas.length === 1
        ? "1 avaliação"
        : `${avaliacoesExibidas.length} avaliações`) +
      " • " +
      (alunosExibidos.length === 1
        ? "1 aluno"
        : `${alunosExibidos.length} alunos`);

    if (alunos.length === 0) {
      mediaGeralElemento.textContent = "-";

      conteudo.innerHTML = ` <div class="estadoVazioApp"> <span class="estadoVazioIcone material-icons-round"> person_off </span> <h3> Nenhum aluno cadastrado </h3> <p> Cadastre alunos nesta turma para utilizar o Livro de Notas. </p> </div> `;

      return;
    }

    if (avaliacoesExibidas.length === 0) {
      mediaGeralElemento.textContent = "-";

      conteudo.innerHTML = ` <div class="estadoVazioApp"> <span class="estadoVazioIcone material-icons-round"> assignment_late </span> <h3> Nenhuma avaliação encontrada </h3> <p> Não existem avaliações cadastradas no período selecionado. </p> </div> `;

      return;
    }

    if (alunosExibidos.length === 0) {
      mediaGeralElemento.textContent = "-";

      conteudo.innerHTML = ` <div class="estadoVazioApp"> <span class="estadoVazioIcone material-icons-round"> search_off </span> <h3> Nenhum aluno encontrado </h3> <p> Tente pesquisar por outro nome. </p> </div> `;

      return;
    }

    const mediasValidas = [];

    let cabecalhoAvaliacoes = "";

    avaliacoesExibidas.forEach((avaliacao) => {
      cabecalhoAvaliacoes += ` <th style=" min-width:130px; padding:12px; " > ${escaparHTMLTurmas(
        avaliacao.nome || "Avaliação"
      )} <br> <small> Valor: ${formatarNumeroLivroNotas(
        avaliacao.valor
      )} </small> </th> `;
    });

    let linhas = "";

    alunosExibidos.forEach((aluno) => {
      const media = calcularMediaAluno(aluno, avaliacoesExibidas);

      if (media !== null) {
        mediasValidas.push(media);
      }

      const situacao = obterSituacaoMedia(media);

      let celulasNotas = "";

      avaliacoesExibidas.forEach((avaliacao) => {
        const nota = obterNotaValida(avaliacao, aluno);

        const valorMaximo = Number(avaliacao.valor);

        const percentual =
          nota !== null && Number.isFinite(valorMaximo) && valorMaximo > 0
            ? Math.round((nota / valorMaximo) * 100)
            : null;

        celulasNotas += ` <td style=" text-align:center; padding:12px; " > <strong> ${formatarNumeroLivroNotas(
          nota
        )} </strong> ${
          percentual !== null
            ? ` <br> <small> ${percentual}% </small> `
            : ` <br> <small> Sem nota </small> `
        } </td> `;
      });

      linhas += ` <tr> <td style=" position:sticky; left:0; z-index:1; background:var(--card); min-width:180px; padding:12px; text-align:left; " > <strong> ${escaparHTMLTurmas(
        aluno
      )} </strong> </td> ${celulasNotas} <td style=" text-align:center; padding:12px; " > <strong> ${formatarNumeroLivroNotas(
        media
      )} </strong> </td> <td style=" text-align:center; padding:12px; color:${ situacao.cor }; font-weight:700; " > <span class="material-icons-round" style=" vertical-align:middle; " > ${
        situacao.icone
      } </span> <br> ${situacao.texto} </td> </tr> `;
    });

    const mediaGeral =
      mediasValidas.length > 0
        ? mediasValidas.reduce((total, media) => total + media, 0) /
          mediasValidas.length
        : null;

    mediaGeralElemento.textContent = formatarNumeroLivroNotas(mediaGeral);

    conteudo.innerHTML = ` <table style=" width:100%; min-width:max-content; border-collapse:collapse; " > <thead> <tr> <th style=" position:sticky; left:0; z-index:2; background:var(--card); min-width:180px; padding:12px; " > Aluno </th> ${cabecalhoAvaliacoes} <th style=" min-width:110px; padding:12px; " > Média /10 </th> <th style=" min-width:150px; padding:12px; " > Situação </th> </tr> </thead> <tbody> ${linhas} </tbody> </table> `;
  }

  campoBusca?.addEventListener("input", renderizarLivroNotas);

  campoBimestre?.addEventListener("change", renderizarLivroNotas);

  renderizarLivroNotas();
}

/* ========================================================= BOLETIM BIMESTRAL DA TURMA ========================================================= */

async function abrirBoletimBimestralTurma(indexTurma) {
  await garantirConfiguracoesPedagogicasTurmas();

  indexTurma = Number(indexTurma);

  const turmas = obterTurmasSalvas();

  if (
    !Number.isInteger(indexTurma) ||
    indexTurma < 0 ||
    indexTurma >= turmas.length
  ) {
    mostrarAvisoTurmas("⚠️ A turma selecionada não foi encontrada.", {
      titulo: "Turma não encontrada",

      mensagem: "A turma selecionada não existe ou foi removida.",

      icone: "error",
    });

    await abrirTurmas();

    return;
  }

  const turma = turmas[indexTurma];

  const alunos = Array.isArray(turma.alunos) ? turma.alunos : [];

  const avaliacoes = Array.isArray(turma.avaliacoes) ? turma.avaliacoes : [];

  const nomeTurmaSeguro = escaparHTMLTurmas(turma.nome || "Turma sem nome");

  const nomesBimestres = {
    "1B": "1º Bimestre",

    "2B": "2º Bimestre",

    "3B": "3º Bimestre",

    "4B": "4º Bimestre",
  };

  document.body.innerHTML =
    ` <div class="cabecalhoTela"> <div> <h1> 📊 Boletim Bimestral </h1> <p> Acompanhe o desempenho dos alunos por bimestre. </p> </div> </div> <main class="secaoApp"> <section class="card textoEsquerda"> <h2> 📚 ${nomeTurmaSeguro} </h2> <div class="grupoCampo"> <label for="bimestreBoletimTurma"> Selecione o bimestre </label> <select id="bimestreBoletimTurma"> <option value="1B"> 1º Bimestre </option> <option value="2B"> 2º Bimestre </option> <option value="3B"> 3º Bimestre </option> <option value="4B"> 4º Bimestre </option> </select> </div> </section> <section class="painel"> <div class="painelBlocoCabecalho"> <div> <h2 id="tituloResumoBimestral"> 📈 Resumo do bimestre </h2> <p id="descricaoResumoBimestral"> Carregando informações... </p> </div> </div> <div id="estatisticasBoletimBimestral" style=" display:grid; grid-template-columns: repeat(auto-fit,minmax(145px,1fr)); gap:14px; " ></div> </section> <section class="painel"> <div class="painelBlocoCabecalho"> <div> <h2> 👨‍🎓 Desempenho dos alunos </h2> <p> Médias proporcionais convertidas para a escala de 0 a 10. </p> </div> </div> <div id="listaBoletimBimestral" style=" width:100%; " ></div> </section> <div class="acoes"> <button type="button" onclick="window.print()" > <span class="material-icons-round"> print </span> Imprimir / Salvar PDF </button> <button class="btnAzul" type="button" onclick="abrirDetalhesTurma(${indexTurma})" > <span class="material-icons-round"> arrow_back </span> Voltar para a turma </button> </div> </main> ` +
    (typeof barraInferior === "function" ? barraInferior() : "");

  if (typeof aplicarTemaSalvo === "function") {
    aplicarTemaSalvo();
  }

  const campoBimestre = document.getElementById("bimestreBoletimTurma");

  const tituloResumo = document.getElementById("tituloResumoBimestral");

  const descricaoResumo = document.getElementById("descricaoResumoBimestral");

  const estatisticas = document.getElementById("estatisticasBoletimBimestral");

  const lista = document.getElementById("listaBoletimBimestral");

  function obterNotaBimestral(avaliacao, aluno) {
    if (
      !avaliacao ||
      !avaliacao.notas ||
      typeof avaliacao.notas !== "object" ||
      Array.isArray(avaliacao.notas)
    ) {
      return null;
    }

    const nota = avaliacao.notas[aluno];

    if (nota === undefined || nota === null || nota === "") {
      return null;
    }

    const notaNumerica = Number(nota);

    return Number.isFinite(notaNumerica) ? notaNumerica : null;
  }

  function calcularMediaBimestralAluno(aluno, avaliacoesBimestre) {
    let totalObtido = 0;
    let totalPossivel = 0;
    let quantidadeNotas = 0;

    avaliacoesBimestre.forEach((avaliacao) => {
      const nota = obterNotaBimestral(avaliacao, aluno);

      const valorMaximo = Number(avaliacao.valor);

      if (nota === null || !Number.isFinite(valorMaximo) || valorMaximo <= 0) {
        return;
      }

      totalObtido += nota;

      totalPossivel += valorMaximo;

      quantidadeNotas++;
    });

    if (quantidadeNotas === 0 || totalPossivel <= 0) {
      return {
        media: null,

        totalObtido: 0,

        totalPossivel: 0,

        quantidadeNotas: 0,
      };
    }

    const media = Number(((totalObtido / totalPossivel) * 10).toFixed(2));

    return {
      media,

      totalObtido,

      totalPossivel,

      quantidadeNotas,
    };
  }

  function obterSituacaoBimestral(media) {
    return classificarMediaTurmas(media);
  }

  function formatarNotaBimestral(valor) {
    if (
      valor === null ||
      valor === undefined ||
      !Number.isFinite(Number(valor))
    ) {
      return "-";
    }

    return formatarNotaTurmas(Number(valor));
  }

  function renderizarBoletimBimestral() {
    if (
      !campoBimestre ||
      !tituloResumo ||
      !descricaoResumo ||
      !estatisticas ||
      !lista
    ) {
      return;
    }

    const bimestre = String(campoBimestre.value || "1B");

    const avaliacoesBimestre = avaliacoes.filter(
      (avaliacao) => avaliacao && avaliacao.bimestre === bimestre
    );

    tituloResumo.textContent = `📈 ${nomesBimestres[bimestre]}`;

    descricaoResumo.textContent =
      (avaliacoesBimestre.length === 1
        ? "1 avaliação cadastrada"
        : `${avaliacoesBimestre.length} avaliações cadastradas`) +
      " • " +
      (alunos.length === 1 ? "1 aluno" : `${alunos.length} alunos`);

    if (alunos.length === 0) {
      estatisticas.innerHTML = "";

      lista.innerHTML = ` <div class="estadoVazioApp"> <span class="estadoVazioIcone material-icons-round"> person_off </span> <h3> Nenhum aluno cadastrado </h3> <p> Cadastre alunos nesta turma para gerar o boletim bimestral. </p> </div> `;

      return;
    }

    if (avaliacoesBimestre.length === 0) {
      estatisticas.innerHTML = "";

      lista.innerHTML = ` <div class="estadoVazioApp"> <span class="estadoVazioIcone material-icons-round"> assignment_late </span> <h3> Nenhuma avaliação cadastrada </h3> <p> Não existem avaliações cadastradas no ${nomesBimestres[bimestre]}. </p> </div> `;

      return;
    }

    const resultados = alunos.map((aluno) => {
      const calculo = calcularMediaBimestralAluno(aluno, avaliacoesBimestre);

      return {
        aluno,

        ...calculo,
      };
    });

    const mediasValidas = resultados
      .filter((resultado) => resultado.media !== null)
      .map((resultado) => resultado.media);

    const mediaTurma =
      mediasValidas.length > 0
        ? mediasValidas.reduce((total, media) => total + media, 0) /
          mediasValidas.length
        : null;

    const aprovados = resultados.filter((resultado) => {
      if (resultado.media === null) {
        return false;
      }

      const codigo = obterSituacaoBimestral(resultado.media).codigo;

      return codigo === "aprovado" || codigo === "destaque";
    }).length;

    const recuperacao = resultados.filter(
      (resultado) =>
        resultado.media !== null &&
        obterSituacaoBimestral(resultado.media).codigo === "recuperacao"
    ).length;

    const atencao = resultados.filter(
      (resultado) =>
        resultado.media !== null &&
        obterSituacaoBimestral(resultado.media).codigo === "critico"
    ).length;

    const semNotas = resultados.filter(
      (resultado) => resultado.media === null
    ).length;

    let melhorAluno = null;

    resultados.forEach((resultado) => {
      if (resultado.media === null) {
        return;
      }

      if (!melhorAluno || resultado.media > melhorAluno.media) {
        melhorAluno = resultado;
      }
    });

    const criterios = obterCriteriosAvaliacaoTurmas();

    const mediaAprovacaoTexto = formatarNotaBimestral(criterios.mediaAprovacao);

    const limiteRecuperacaoTexto = formatarNotaBimestral(
      criterios.limiteRecuperacao
    );

    estatisticas.innerHTML = ` <div class="card"> <h3> ${formatarNotaBimestral(
      mediaTurma
    )} </h3> <p> 📈 Média da turma </p> </div> <div class="card"> <h3> ${aprovados} </h3> <p> ✅ Aprovados <br> <small> Média ${mediaAprovacaoTexto} ou mais </small> </p> </div> <div class="card"> <h3> ${recuperacao} </h3> <p> ⚠ Em recuperação <br> <small> De ${limiteRecuperacaoTexto} até abaixo de ${mediaAprovacaoTexto} </small> </p> </div> <div class="card"> <h3> ${atencao} </h3> <p> 🚨 Situação crítica <br> <small> Abaixo de ${limiteRecuperacaoTexto} </small> </p> </div> <div class="card"> <h3> ${semNotas} </h3> <p> 🕒 Sem notas </p> </div> <div class="card"> <h3> ${
      melhorAluno ? escaparHTMLTurmas(melhorAluno.aluno) : "-"
    } </h3> <p> 🥇 Destaque ${
      melhorAluno ? `(${formatarNotaBimestral(melhorAluno.media)})` : ""
    } </p> </div> `;

    const resultadosOrdenados = [...resultados].sort((a, b) => {
      if (a.media === null && b.media === null) {
        return a.aluno.localeCompare(b.aluno, "pt-BR", {
          sensitivity: "base",
        });
      }

      if (a.media === null) {
        return 1;
      }

      if (b.media === null) {
        return -1;
      }

      if (b.media !== a.media) {
        return b.media - a.media;
      }

      return a.aluno.localeCompare(b.aluno, "pt-BR", {
        sensitivity: "base",
      });
    });

    let htmlAlunos = "";

    resultadosOrdenados.forEach((resultado, posicao) => {
      const situacao = obterSituacaoBimestral(resultado.media);

      let notasDetalhadas = "";

      avaliacoesBimestre.forEach((avaliacao) => {
        const nota = obterNotaBimestral(avaliacao, resultado.aluno);

        notasDetalhadas += ` <div style=" display:flex; justify-content:space-between; gap:12px; padding:8px 0; border-bottom: 1px solid var(--borda); " > <span> ${escaparHTMLTurmas(
          avaliacao.nome || "Avaliação"
        )} </span> <strong> ${formatarNotaBimestral(
          nota
        )} / ${formatarNotaBimestral(avaliacao.valor)} </strong> </div> `;
      });

      htmlAlunos += ` <div class="card textoEsquerda" style=" border-left: 8px solid ${ situacao.cor }; " > <div style=" display:flex; justify-content:space-between; gap:15px; align-items:flex-start; flex-wrap:wrap; " > <div> <h3> ${
        resultado.media !== null ? `${posicao + 1}º` : "—"
      } ${escaparHTMLTurmas(resultado.aluno)} </h3> <p style=" color:${ situacao.cor }; font-weight:700; " > <span class="material-icons-round" style=" vertical-align:middle; " > ${
        situacao.icone
      } </span> ${
        situacao.texto
      } </p> </div> <div style=" text-align:center; " > <strong style=" font-size:24px; " > ${formatarNotaBimestral(
        resultado.media
      )} </strong> <div> Média /10 </div> </div> </div> <div style=" margin-top:14px; " > ${notasDetalhadas} </div> <p> <strong> Total: </strong> ${formatarNotaBimestral(
        resultado.totalObtido
      )} de ${formatarNotaBimestral(resultado.totalPossivel)} • ${
        resultado.quantidadeNotas
      } nota(s) lançada(s) </p> </div> `;
    });

    lista.innerHTML = htmlAlunos;
  }

  campoBimestre.addEventListener("change", renderizarBoletimBimestral);

  renderizarBoletimBimestral();
}

/* ========================================================= PREPARAR CONTROLE DE ATIVIDADES ========================================================= */

function garantirControleAtividadesTurma(avaliacao) {
  if (!avaliacao || typeof avaliacao !== "object") {
    return null;
  }

  if (
    !avaliacao.notas ||
    typeof avaliacao.notas !== "object" ||
    Array.isArray(avaliacao.notas)
  ) {
    avaliacao.notas = {};
  }

  if (
    !avaliacao.controleAtividades ||
    typeof avaliacao.controleAtividades !== "object" ||
    Array.isArray(avaliacao.controleAtividades)
  ) {
    avaliacao.controleAtividades = {
      quantidadeExercicios: 10,

      registros: {},

      exercicios: [],
    };
  }

  const controle = avaliacao.controleAtividades;

  let quantidade = parseInt(controle.quantidadeExercicios, 10);

  if (!Number.isInteger(quantidade) || quantidade < 1) {
    quantidade = 10;
  }

  if (quantidade > 100) {
    quantidade = 100;
  }

  controle.quantidadeExercicios = quantidade;

  if (
    !controle.registros ||
    typeof controle.registros !== "object" ||
    Array.isArray(controle.registros)
  ) {
    controle.registros = {};
  }

  if (!Array.isArray(controle.exercicios)) {
    controle.exercicios = [];
  }

  return controle;
}

/* ========================================================= RECALCULAR NOTAS DA ATIVIDADE ========================================================= */

function recalcularNotasAtividade(avaliacao, turma) {
  if (
    !avaliacao ||
    !turma ||
    typeof avaliacao !== "object" ||
    typeof turma !== "object"
  ) {
    return;
  }

  const controle = garantirControleAtividadesTurma(avaliacao);

  if (!controle) {
    return;
  }

  const alunos = Array.isArray(turma.alunos) ? turma.alunos : [];

  const quantidade = controle.quantidadeExercicios;

  let valorAtividade = Number(avaliacao.valor);

  if (!Number.isFinite(valorAtividade) || valorAtividade < 0) {
    valorAtividade = 0;
  }

  alunos.forEach((aluno) => {
    const registrosAluno =
      controle.registros[aluno] &&
      typeof controle.registros[aluno] === "object" &&
      !Array.isArray(controle.registros[aluno])
        ? controle.registros[aluno]
        : {};

    let feitos = 0;

    for (let numero = 1; numero <= quantidade; numero++) {
      if (registrosAluno[numero] === true) {
        feitos++;
      }
    }

    const nota = quantidade > 0 ? (feitos / quantidade) * valorAtividade : 0;

    avaliacao.notas[aluno] = Number(nota.toFixed(2));
  });

  /* Remove notas e registros de alunos que não pertencem mais à turma. */

  const alunosValidos = new Set(alunos);

  Object.keys(avaliacao.notas).forEach((nomeAluno) => {
    if (!alunosValidos.has(nomeAluno)) {
      delete avaliacao.notas[nomeAluno];
    }
  });

  Object.keys(controle.registros).forEach((nomeAluno) => {
    if (!alunosValidos.has(nomeAluno)) {
      delete controle.registros[nomeAluno];
    }
  });
}

/* ========================================================= MARCAR OU DESMARCAR EXERCÍCIO ========================================================= */

async function alternarAtividade(
  indexTurma,
  indexAvaliacao,
  aluno,
  numeroExercicio
) {
  indexTurma = Number(indexTurma);

  indexAvaliacao = Number(indexAvaliacao);

  numeroExercicio = Number(numeroExercicio);

  aluno = String(aluno || "").trim();

  const turmas = obterTurmasSalvas();

  if (
    !Number.isInteger(indexTurma) ||
    indexTurma < 0 ||
    indexTurma >= turmas.length
  ) {
    mostrarAvisoTurmas("⚠️ A turma selecionada não foi encontrada.", {
      titulo: "Turma não encontrada",

      mensagem:
        "Não foi possível atualizar o exercício porque a turma não existe.",

      icone: "error",
    });

    return;
  }

  const turma = turmas[indexTurma];

  if (
    !Array.isArray(turma.avaliacoes) ||
    !Number.isInteger(indexAvaliacao) ||
    indexAvaliacao < 0 ||
    indexAvaliacao >= turma.avaliacoes.length
  ) {
    mostrarAvisoTurmas("⚠️ A atividade selecionada não foi encontrada.", {
      titulo: "Atividade não encontrada",

      mensagem: "A atividade selecionada não existe ou foi removida.",

      icone: "error",
    });

    return;
  }

  if (
    aluno === "" ||
    !Array.isArray(turma.alunos) ||
    !turma.alunos.includes(aluno)
  ) {
    mostrarAvisoTurmas("⚠️ O aluno selecionado não foi encontrado.", {
      titulo: "Aluno não encontrado",

      mensagem: "Não foi possível atualizar o exercício desse aluno.",

      icone: "error",
    });

    return;
  }

  const avaliacao = turma.avaliacoes[indexAvaliacao];

  const controle = garantirControleAtividadesTurma(avaliacao);

  if (
    !Number.isInteger(numeroExercicio) ||
    numeroExercicio < 1 ||
    numeroExercicio > controle.quantidadeExercicios
  ) {
    mostrarAvisoTurmas("⚠️ O exercício selecionado é inválido.", {
      titulo: "Exercício inválido",

      mensagem: "O exercício não pertence à atividade atual.",

      icone: "warning",
    });

    return;
  }

  if (
    !controle.registros[aluno] ||
    typeof controle.registros[aluno] !== "object" ||
    Array.isArray(controle.registros[aluno])
  ) {
    controle.registros[aluno] = {};
  }

  controle.registros[aluno][numeroExercicio] =
    controle.registros[aluno][numeroExercicio] !== true;

  recalcularNotasAtividade(avaliacao, turma);

  turma.avaliacoes[indexAvaliacao] = avaliacao;

  turmas[indexTurma] = turma;

  const salvou = await salvarDadosTurmas(turmas);

  if (!salvou) {
    mostrarAvisoTurmas("❌ Não foi possível atualizar o exercício.", {
      titulo: "Erro ao salvar",

      mensagem: "Verifique sua conexão e tente novamente.",

      icone: "error",
    });

    return;
  }

  await abrirControleAtividades(indexTurma, indexAvaliacao);
}

/* ========================================================= CONTROLE DE ATIVIDADES PARTE 1 — VALIDAÇÕES E PREPARAÇÃO DOS DADOS ========================================================= */

async function abrirControleAtividades(indexTurma, indexAvaliacao) {
  indexTurma = Number(indexTurma);

  indexAvaliacao = Number(indexAvaliacao);

  const turmas = obterTurmasSalvas();

  /* ======================================================= VALIDAR TURMA ======================================================= */

  if (
    !Number.isInteger(indexTurma) ||
    indexTurma < 0 ||
    indexTurma >= turmas.length
  ) {
    mostrarAvisoTurmas("⚠️ A turma selecionada não foi encontrada.", {
      titulo: "Turma não encontrada",

      mensagem: "A turma selecionada não existe ou foi removida.",

      icone: "error",
    });

    await abrirTurmas();

    return;
  }

  const turma = turmas[indexTurma];

  if (!Array.isArray(turma.alunos)) {
    turma.alunos = [];
  }

  if (!Array.isArray(turma.avaliacoes)) {
    turma.avaliacoes = [];
  }

  /* ======================================================= VALIDAR AVALIAÇÃO ======================================================= */

  if (
    !Number.isInteger(indexAvaliacao) ||
    indexAvaliacao < 0 ||
    indexAvaliacao >= turma.avaliacoes.length
  ) {
    mostrarAvisoTurmas("⚠️ A atividade selecionada não foi encontrada.", {
      titulo: "Atividade não encontrada",

      mensagem: "A atividade selecionada não existe ou foi removida.",

      icone: "error",
    });

    await abrirAvaliacoesTurma(indexTurma);

    return;
  }

  const avaliacao = turma.avaliacoes[indexAvaliacao];

  if (String(avaliacao.tipo || "").toLocaleLowerCase("pt-BR") !== "atividade") {
    mostrarAvisoTurmas("⚠️ Esta avaliação não é do tipo atividade.", {
      titulo: "Controle indisponível",

      mensagem:
        "O Controle de Atividades está disponível somente para avaliações cadastradas como atividade.",

      icone: "warning",
    });

    await abrirAvaliacoesTurma(indexTurma);

    return;
  }

  /* ======================================================= PREPARAR CONTROLE E NOTAS ======================================================= */

  const controle = garantirControleAtividadesTurma(avaliacao);

  if (!controle) {
    mostrarAvisoTurmas(
      "❌ Não foi possível preparar o controle de atividades.",
      {
        titulo: "Erro no controle",

        mensagem: "Os dados desta atividade não puderam ser preparados.",

        icone: "error",
      }
    );

    return;
  }

  let quantidadeExercicios = parseInt(controle.quantidadeExercicios, 10);

  if (!Number.isInteger(quantidadeExercicios) || quantidadeExercicios < 1) {
    quantidadeExercicios = 10;
  }

  if (quantidadeExercicios > 100) {
    quantidadeExercicios = 100;
  }

  controle.quantidadeExercicios = quantidadeExercicios;

  if (
    !avaliacao.notas ||
    typeof avaliacao.notas !== "object" ||
    Array.isArray(avaliacao.notas)
  ) {
    avaliacao.notas = {};
  }

  /* ======================================================= REMOVER EXERCÍCIOS QUE NÃO EXISTEM MAIS ======================================================= */

  Object.keys(controle.registros).forEach((nomeAluno) => {
    const registrosAluno = controle.registros[nomeAluno];

    if (
      !registrosAluno ||
      typeof registrosAluno !== "object" ||
      Array.isArray(registrosAluno)
    ) {
      controle.registros[nomeAluno] = {};

      return;
    }

    Object.keys(registrosAluno).forEach((numero) => {
      const numeroConvertido = Number(numero);

      if (
        !Number.isInteger(numeroConvertido) ||
        numeroConvertido < 1 ||
        numeroConvertido > quantidadeExercicios
      ) {
        delete registrosAluno[numero];
      }
    });
  });

  /* O índice zero não representa exercício. Os exercícios são armazenados de 1 até quantidadeExercicios. */

  if (controle.exercicios.length > quantidadeExercicios + 1) {
    controle.exercicios.length = quantidadeExercicios + 1;
  }

  /* ======================================================= REMOVER ALUNOS QUE NÃO PERTENCEM MAIS À TURMA ======================================================= */

  const alunosValidos = new Set(turma.alunos);

  Object.keys(controle.registros).forEach((nomeAluno) => {
    if (!alunosValidos.has(nomeAluno)) {
      delete controle.registros[nomeAluno];
    }
  });

  Object.keys(avaliacao.notas).forEach((nomeAluno) => {
    if (!alunosValidos.has(nomeAluno)) {
      delete avaliacao.notas[nomeAluno];
    }
  });

  /* ======================================================= RECALCULAR NOTAS ATUAIS ======================================================= */

  recalcularNotasAtividade(avaliacao, turma);

  let valorAtividade = Number(avaliacao.valor);

  if (!Number.isFinite(valorAtividade) || valorAtividade < 0) {
    valorAtividade = 0;
  }

  /* ======================================================= FUNÇÕES INTERNAS AUXILIARES ======================================================= */

  function normalizarBuscaAtividade(texto) {
    return String(texto || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR")
      .trim();
  }

  function obterRegistrosAluno(aluno) {
    if (
      !controle.registros[aluno] ||
      typeof controle.registros[aluno] !== "object" ||
      Array.isArray(controle.registros[aluno])
    ) {
      controle.registros[aluno] = {};
    }

    return controle.registros[aluno];
  }

  function contarExerciciosFeitos(aluno) {
    const registrosAluno = obterRegistrosAluno(aluno);

    let feitos = 0;

    for (let numero = 1; numero <= quantidadeExercicios; numero++) {
      if (registrosAluno[numero] === true) {
        feitos++;
      }
    }

    return feitos;
  }

  function obterNotaAtividade(aluno) {
    const nota = Number(avaliacao.notas[aluno]);

    return Number.isFinite(nota) ? nota : 0;
  }

  function obterPercentualAluno(aluno) {
    if (quantidadeExercicios <= 0) {
      return 0;
    }

    return Math.round(
      (contarExerciciosFeitos(aluno) / quantidadeExercicios) * 100
    );
  }

  function obterPendenciasAluno(aluno) {
    return Math.max(quantidadeExercicios - contarExerciciosFeitos(aluno), 0);
  }

  function formatarNumeroAtividade(valor) {
    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
      return "0";
    }

    return numero.toLocaleString("pt-BR", {
      minimumFractionDigits: 0,

      maximumFractionDigits: 2,
    });
  }

  /* ======================================================= ORDENAÇÃO SALVA ======================================================= */

  const chaveOrdenacao = `ordenacaoAtividade_${indexTurma}_${indexAvaliacao}`;

  const ordenacoesValidas = ["nome", "nota", "percentual", "pendencias"];

  let ordenacaoAtual = localStorage.getItem(chaveOrdenacao) || "nome";

  if (!ordenacoesValidas.includes(ordenacaoAtual)) {
    ordenacaoAtual = "nome";

    localStorage.setItem(chaveOrdenacao, ordenacaoAtual);
  }

  /* ======================================================= PREPARAR ALUNOS ORDENADOS ======================================================= */

  const alunosOrdenados = [...turma.alunos];

  alunosOrdenados.sort((alunoA, alunoB) => {
    const feitosA = contarExerciciosFeitos(alunoA);

    const feitosB = contarExerciciosFeitos(alunoB);

    const notaA = obterNotaAtividade(alunoA);

    const notaB = obterNotaAtividade(alunoB);

    const percentualA = obterPercentualAluno(alunoA);

    const percentualB = obterPercentualAluno(alunoB);

    const pendenciasA = quantidadeExercicios - feitosA;

    const pendenciasB = quantidadeExercicios - feitosB;

    if (ordenacaoAtual === "nota" && notaB !== notaA) {
      return notaB - notaA;
    }

    if (ordenacaoAtual === "percentual" && percentualB !== percentualA) {
      return percentualB - percentualA;
    }

    if (ordenacaoAtual === "pendencias" && pendenciasB !== pendenciasA) {
      return pendenciasB - pendenciasA;
    }

    return String(alunoA).localeCompare(String(alunoB), "pt-BR", {
      sensitivity: "base",
    });
  });

  /* ======================================================= SALVAR LIMPEZA E RECÁLCULO NO ESTADO LOCAL ======================================================= */

  turma.avaliacoes[indexAvaliacao] = avaliacao;

  turmas[indexTurma] = turma;

  const totalAlunos = turma.alunos.length;

  let concluidos = 0;

  let emAndamento = 0;

  let naoIniciaram = 0;

  let somaNotas = 0;

  turma.alunos.forEach((aluno) => {
    const feitos = contarExerciciosFeitos(aluno);

    const nota = obterNotaAtividade(aluno);

    somaNotas += nota;

    if (feitos === 0) {
      naoIniciaram++;

      return;
    }

    if (feitos >= quantidadeExercicios) {
      concluidos++;

      return;
    }

    emAndamento++;
  });

  const mediaAtividade = totalAlunos > 0 ? somaNotas / totalAlunos : 0;

  const percentualConclusao =
    totalAlunos > 0 ? Math.round((concluidos / totalAlunos) * 100) : 0;

  const totalMarcacoes = turma.alunos.reduce(
    (total, aluno) => total + contarExerciciosFeitos(aluno),
    0
  );

  const totalPossivelMarcacoes = totalAlunos * quantidadeExercicios;

  const percentualGeralRealizado =
    totalPossivelMarcacoes > 0
      ? Math.round((totalMarcacoes / totalPossivelMarcacoes) * 100)
      : 0;

  /* ======================================================= RANKING ======================================================= */

  const ranking = turma.alunos.map((aluno) => {
    const feitos = contarExerciciosFeitos(aluno);

    return {
      nome: aluno,

      nota: obterNotaAtividade(aluno),

      feitos,

      percentual:
        quantidadeExercicios > 0
          ? Math.round((feitos / quantidadeExercicios) * 100)
          : 0,

      pendencias: Math.max(quantidadeExercicios - feitos, 0),
    };
  });

  ranking.sort((alunoA, alunoB) => {
    if (alunoB.nota !== alunoA.nota) {
      return alunoB.nota - alunoA.nota;
    }

    if (alunoB.feitos !== alunoA.feitos) {
      return alunoB.feitos - alunoA.feitos;
    }

    return String(alunoA.nome).localeCompare(String(alunoB.nome), "pt-BR", {
      sensitivity: "base",
    });
  });

  /* ======================================================= IDENTIFICAR DESTAQUES ======================================================= */

  const melhorAluno = ranking.length > 0 ? ranking[0] : null;

  const alunosComPendencias = ranking.filter(
    (aluno) => aluno.pendencias > 0
  ).length;

  const alunosSemPendencias = ranking.filter(
    (aluno) => aluno.pendencias === 0
  ).length;

  /* ======================================================= MONTAR HTML DO RANKING ======================================================= */

  let htmlRanking = "";

  if (ranking.length === 0) {
    htmlRanking = ` <div class="estadoVazioApp"> <span class="estadoVazioIcone material-icons-round"> person_off </span> <h3> Nenhum aluno cadastrado </h3> <p> Cadastre alunos nesta turma para visualizar o ranking e utilizar a planilha. </p> </div> `;
  } else {
    let linhasRanking = "";

    ranking.forEach((aluno, posicao) => {
      const posicaoExibida =
        posicao === 0
          ? "🥇"
          : posicao === 1
          ? "🥈"
          : posicao === 2
          ? "🥉"
          : `${posicao + 1}º`;

      linhasRanking += ` <tr> <td style=" text-align:center; padding:12px; white-space:nowrap; " > <strong> ${posicaoExibida} </strong> </td> <td style=" padding:12px; min-width:180px; " > <strong> ${escaparHTMLTurmas(
        aluno.nome
      )} </strong> </td> <td style=" text-align:center; padding:12px; " > ${
        aluno.feitos
      } / ${quantidadeExercicios} </td> <td style=" text-align:center; padding:12px; " > ${
        aluno.percentual
      }% </td> <td style=" text-align:center; padding:12px; " > <strong> ${formatarNumeroAtividade(
        aluno.nota
      )} </strong> / ${formatarNumeroAtividade(
        valorAtividade
      )} </td> <td style=" text-align:center; padding:12px; " > ${
        aluno.pendencias === 0
          ? ` <span style=" color:var(--sucesso); font-weight:700; " > ✅ Completo </span> `
          : ` <span style=" color:var(--alerta); font-weight:700; " > ${aluno.pendencias} </span> `
      } </td> </tr> `;
    });

    htmlRanking = ` <div style=" width:100%; overflow:auto; " > <table style=" width:100%; min-width:720px; border-collapse:collapse; " > <thead> <tr> <th style=" padding:12px; " > Posição </th> <th style=" padding:12px; " > Aluno </th> <th style=" padding:12px; " > Feitos </th> <th style=" padding:12px; " > Conclusão </th> <th style=" padding:12px; " > Nota </th> <th style=" padding:12px; " > Pendências </th> </tr> </thead> <tbody> ${linhasRanking} </tbody> </table> </div> `;
  }

  /* ======================================================= CABEÇALHO E ESTATÍSTICAS VISUAIS ======================================================= */

  const nomeAvaliacaoSeguro = escaparHTMLTurmas(
    avaliacao.nome || "Atividade sem nome"
  );

  const nomeTurmaSeguro = escaparHTMLTurmas(turma.nome || "Turma sem nome");

  let html = ` <div class="cabecalhoTela"> <div> <h1> 📋 ${nomeAvaliacaoSeguro} </h1> <p> 📚 ${nomeTurmaSeguro} • ${quantidadeExercicios} exercício(s) • Valor ${formatarNumeroAtividade(
    valorAtividade
  )} </p> </div> </div> <main class="secaoApp"> <section class="painel"> <div class="painelBlocoCabecalho"> <div> <h2> 📊 Estatísticas da atividade </h2> <p> Acompanhe a realização dos exercícios e o desempenho dos alunos. </p> </div> </div> <div style=" display:grid; grid-template-columns: repeat(auto-fit,minmax(145px,1fr)); gap:14px; " > <div class="card"> <h3> ${totalAlunos} </h3> <p> 👨‍🎓 Alunos </p> </div> <div class="card"> <h3> ${concluidos} </h3> <p> ✅ Concluíram </p> </div> <div class="card"> <h3> ${emAndamento} </h3> <p> 🟡 Em andamento </p> </div> <div class="card"> <h3> ${naoIniciaram} </h3> <p> 🔴 Não iniciaram </p> </div> <div class="card"> <h3> ${formatarNumeroAtividade(
    mediaAtividade
  )} </h3> <p> 📈 Média da turma </p> </div> <div class="card"> <h3> ${percentualGeralRealizado}% </h3> <p> 📚 Exercícios realizados </p> </div> <div class="card"> <h3> ${alunosSemPendencias} </h3> <p> 🏁 Sem pendências </p> </div> <div class="card"> <h3> ${alunosComPendencias} </h3> <p> 🚨 Com pendências </p> </div> </div> <div class="card textoEsquerda" style=" margin-top:16px; " > <div style=" width:100%; height:18px; background:var(--borda); border-radius:999px; overflow:hidden; " > <div style=" width:${percentualConclusao}%; height:100%; background:var(--sucesso); transition:width .3s ease; " ></div> </div> <p> <strong> ${percentualConclusao}% dos alunos concluíram todos os exercícios. </strong> </p> </div> ${
    melhorAluno
      ? ` <div class="card textoEsquerda" style=" margin-top:16px; border-left: 8px solid var(--alerta); " > <h3> 🥇 Destaque da atividade </h3> <p> <strong> ${escaparHTMLTurmas(
          melhorAluno.nome
        )} </strong> • ${
          melhorAluno.feitos
        } de ${quantidadeExercicios} exercícios • Nota ${formatarNumeroAtividade(
          melhorAluno.nota
        )} </p> </div> `
      : ""
  } </section> <section class="painel"> <div class="painelBlocoCabecalho"> <div> <h2> 🏆 Ranking da atividade </h2> <p> Classificação por nota e quantidade de exercícios concluídos. </p> </div> </div> <div class="card textoEsquerda"> ${htmlRanking} </div> </section> <section class="painel"> <div class="painelBlocoCabecalho"> <div> <h2> 🔎 Pesquisa e organização </h2> <p> Encontre alunos e escolha como a planilha deve ser ordenada. </p> </div> </div> <div class="card textoEsquerda"> <div class="grupoCampo"> <label for="buscaAlunoAtividade"> <strong> 🔍 Pesquisar aluno </strong> </label> <input id="buscaAlunoAtividade" type="search" placeholder="Digite o nome do aluno..." autocomplete="off" > </div> <div class="grupoCampo"> <label for="ordenacaoAtividade"> <strong> 📋 Ordenar alunos por </strong> </label> <select id="ordenacaoAtividade"> <option value="nome" ${
    ordenacaoAtual === "nome" ? "selected" : ""
  } > Nome </option> <option value="nota" ${
    ordenacaoAtual === "nota" ? "selected" : ""
  } > Maior nota </option> <option value="percentual" ${
    ordenacaoAtual === "percentual" ? "selected" : ""
  } > Maior conclusão </option> <option value="pendencias" ${
    ordenacaoAtual === "pendencias" ? "selected" : ""
  } > Mais pendências </option> </select> </div> </div> </section> <section class="painel"> <div class="painelBlocoCabecalho"> <div> <h2> ⚙️ Configurações da atividade </h2> <p> Ajuste o valor e gerencie os exercícios cadastrados. </p> </div> </div> <div class="card textoEsquerda"> <div class="grupoCampo"> <label for="valorAtividadeControle"> Valor da atividade </label> <input id="valorAtividadeControle" type="number" min="0.1" step="0.1" value="${valorAtividade}" inputmode="decimal" > </div> <div class="acoes"> <button id="salvarValorAtividade" class="btnVerde" type="button" > <span class="material-icons-round"> save </span> Salvar valor </button> </div> <div class="grupoCampo"> <label for="exercicioSelecionadoAtividade"> Exercício selecionado </label> <select id="exercicioSelecionadoAtividade"> ${Array.from(
    { length: quantidadeExercicios },
    (_, indice) => {
      const numero = indice + 1;
      const exercicio = controle.exercicios[numero] || {};
      const nome = String(exercicio.nome || `Exercício ${numero}`).trim();
      return ` <option value="${numero}"> ${numero} — ${escaparHTMLTurmas(
        nome
      )} </option> `;
    }
  ).join(
    ""
  )} </select> <p class="textoSecundarioConfig"> Selecione um exercício para editá-lo na tabela ou excluí-lo. </p> </div> <div class="acoes"> <button id="adicionarExercicioAtividade" class="btnAzul" type="button" > <span class="material-icons-round"> add </span> Novo exercício </button> <button id="excluirExercicioAtividade" class="btnVermelho" type="button" > <span class="material-icons-round"> delete </span> Excluir selecionado </button> <button id="abrirPendenciasAtividadeBotao" class="btnLaranja" type="button" > <span class="material-icons-round"> warning </span> Ver pendências </button> </div> </div> </section> <section class="painel painelPlanilhaAtividades"> <div class="painelBlocoCabecalho"> <div> <h2> 📋 Planilha de exercícios </h2> <p> Toque em uma célula para marcar ou desmarcar o exercício do aluno. </p> </div> </div> <div class="planilhaAtividadesScroll"> <table class="tabelaAtividades"> <thead> <tr> <th class="colAluno"> Aluno </th> `;

  /* ======================================================= CABEÇALHOS DOS EXERCÍCIOS ======================================================= */

  for (let numero = 1; numero <= quantidadeExercicios; numero++) {
    const exercicio =
      controle.exercicios[numero] &&
      typeof controle.exercicios[numero] === "object"
        ? controle.exercicios[numero]
        : {};

    const nomeExercicio = escaparHTMLTurmas(
      exercicio.nome || "Toque para editar"
    );

    const dataExercicio = escaparHTMLTurmas(exercicio.data || "");

    html += ` <th class="colExercicio"> <button type="button" class="btnExercicio editarExercicioAtividade" data-exercicio="${numero}" aria-label="Editar exercício ${numero}" > <div class="numeroExercicio"> 📘 ${numero} </div> <div class="nomeExercicio"> ${nomeExercicio} </div> <div class="dataExercicio"> ${dataExercicio} </div> </button> </th> `;
  }

  html += ` <th class="colResumo"> % </th> <th class="colResumo"> Nota </th> <th class="colResumo"> Pendências </th> </tr> </thead> <tbody id="corpoTabelaAtividades"> `;

  /* ======================================================= CONTINUA NA PARTE 4 ======================================================= */
  /* ======================================================= LINHAS DOS ALUNOS ======================================================= */

  alunosOrdenados.forEach((aluno, indexAlunoOrdenado) => {
    const registrosAluno = obterRegistrosAluno(aluno);

    const feitosAluno = contarExerciciosFeitos(aluno);

    const percentualAluno = obterPercentualAluno(aluno);

    const notaAluno = obterNotaAtividade(aluno);

    const pendenciasAluno = obterPendenciasAluno(aluno);

    let classeLinha = "linhaEmAndamento";

    if (feitosAluno === 0) {
      classeLinha = "linhaNaoIniciou";
    } else if (feitosAluno >= quantidadeExercicios) {
      classeLinha = "linhaConcluida";
    }

    html += ` <tr class="linhaAlunoAtividade ${classeLinha}" data-index-aluno="${indexAlunoOrdenado}" data-aluno="${escaparHTMLTurmas( normalizarBuscaAtividade(aluno) )}" > <td class="nomeAlunoTabela abrirPainelAlunoAtividadeBotao" data-index-aluno="${indexAlunoOrdenado}" tabindex="0" role="button" aria-label="Abrir informações de ${escaparHTMLTurmas( aluno )}" > <strong> ${escaparHTMLTurmas(
      aluno
    )} </strong> <br> <small> ${feitosAluno} de ${quantidadeExercicios} realizados </small> </td> `;

    for (let numero = 1; numero <= quantidadeExercicios; numero++) {
      const realizado = registrosAluno[numero] === true;

      html += ` <td class="${ realizado ? "celulaFeita" : "celulaPendente" } alternarAtividadeCelula" data-index-aluno="${indexAlunoOrdenado}" data-exercicio="${numero}" tabindex="0" role="button" aria-label="${ realizado ? "Desmarcar" : "Marcar" } exercício ${numero} de ${escaparHTMLTurmas( aluno )}" > <span class="material-icons-round" aria-hidden="true" > ${
        realizado ? "check" : "remove"
      } </span> </td> `;
    }

    html += ` <td class="resumoTabela"> <strong> ${percentualAluno}% </strong> </td> <td class="resumoTabela"> <strong> ${formatarNumeroAtividade(
      notaAluno
    )} </strong> <br> <small> de ${formatarNumeroAtividade(
      valorAtividade
    )} </small> </td> <td class="resumoTabela"> ${
      pendenciasAluno === 0
        ? ` <span style=" color:var(--sucesso); font-weight:700; " > ✅ 0 </span> `
        : ` <span style=" color:var(--alerta); font-weight:700; " > 🚨 ${pendenciasAluno} </span> `
    } </td> </tr> `;
  });

  /* ======================================================= ESTADO VAZIO DA PLANILHA ======================================================= */

  if (alunosOrdenados.length === 0) {
    html += ` <tr> <td colspan="${ quantidadeExercicios + 4 }" style=" padding:35px; text-align:center; " > <span class="material-icons-round" style=" font-size:48px; opacity:.65; " > person_off </span> <h3> Nenhum aluno cadastrado </h3> <p> Cadastre alunos nesta turma para utilizar a planilha de atividades. </p> </td> </tr> `;
  }

  /* ======================================================= FECHAR PLANILHA E TELA ======================================================= */

  html += ` </tbody> </table> </div> </section> <div class="acoes"> <button id="salvarControleAtividades" class="btnVerde" type="button" > <span class="material-icons-round"> save </span> Salvar alterações </button> <button type="button" onclick="window.print()" > <span class="material-icons-round"> print </span> Imprimir planilha </button> <button class="btnAzul" type="button" onclick="abrirAvaliacoesTurma(${indexTurma})" > <span class="material-icons-round"> arrow_back </span> Voltar para avaliações </button> </div> </main> `;

  const barraInferiorControle =
    typeof barraInferior === "function" ? barraInferior() : "";

  document.body.innerHTML = html + barraInferiorControle;

  if (typeof aplicarTemaSalvo === "function") {
    aplicarTemaSalvo();
  }

  /* ======================================================= REFERÊNCIAS DOS ELEMENTOS ======================================================= */

  const campoBuscaAtividade = document.getElementById("buscaAlunoAtividade");

  const campoOrdenacaoAtividade = document.getElementById("ordenacaoAtividade");

  const campoValorAtividade = document.getElementById("valorAtividadeControle");

  const seletorExercicioAtividade = document.getElementById(
    "exercicioSelecionadoAtividade"
  );

  const botaoSalvarValor = document.getElementById("salvarValorAtividade");

  const botaoAdicionarExercicio = document.getElementById(
    "adicionarExercicioAtividade"
  );

  const botaoExcluirExercicio = document.getElementById(
    "excluirExercicioAtividade"
  );

  const botaoAbrirPendencias = document.getElementById(
    "abrirPendenciasAtividadeBotao"
  );

  const botaoSalvarControle = document.getElementById(
    "salvarControleAtividades"
  );

  /* ======================================================= PESQUISA DE ALUNOS ======================================================= */

  if (campoBuscaAtividade) {
    campoBuscaAtividade.addEventListener("input", function () {
      const busca = normalizarBuscaAtividade(campoBuscaAtividade.value);

      const linhas = document.querySelectorAll(".linhaAlunoAtividade");

      linhas.forEach((linha) => {
        const nomeAluno = linha.dataset.aluno || "";

        linha.style.display = nomeAluno.includes(busca) ? "" : "none";
      });
    });
  }

  /* ======================================================= ALTERAR ORDENAÇÃO ======================================================= */

  if (campoOrdenacaoAtividade) {
    campoOrdenacaoAtividade.addEventListener("change", function () {
      const novaOrdenacao = String(campoOrdenacaoAtividade.value || "nome");

      if (!ordenacoesValidas.includes(novaOrdenacao)) {
        return;
      }

      localStorage.setItem(chaveOrdenacao, novaOrdenacao);

      abrirControleAtividades(indexTurma, indexAvaliacao);
    });
  }

  /* ======================================================= SALVAR VALOR DA ATIVIDADE ======================================================= */

  if (botaoSalvarValor) {
    botaoSalvarValor.addEventListener("click", async function () {
      const novoValor = Number(
        String(campoValorAtividade?.value || "")
          .trim()
          .replace(",", ".")
      );

      if (!Number.isFinite(novoValor) || novoValor <= 0) {
        campoValorAtividade?.focus();

        mostrarAvisoTurmas("⚠️ Informe um valor válido.", {
          titulo: "Valor inválido",

          mensagem: "O valor da atividade deve ser maior que zero.",

          icone: "warning",
        });

        return;
      }

      avaliacao.valor = Number(novoValor.toFixed(2));

      recalcularNotasAtividade(avaliacao, turma);

      turma.avaliacoes[indexAvaliacao] = avaliacao;

      turmas[indexTurma] = turma;

      const salvou = await salvarDadosTurmas(turmas);

      if (!salvou) {
        mostrarAvisoTurmas("❌ Não foi possível atualizar o valor.", {
          titulo: "Erro ao salvar",

          mensagem: "Verifique sua conexão e tente novamente.",

          icone: "error",
        });

        return;
      }

      if (typeof mostrarToast === "function") {
        mostrarToast("✅ Valor da atividade atualizado.");
      }

      await abrirControleAtividades(indexTurma, indexAvaliacao);
    });
  }

  /* ======================================================= ADICIONAR NOVO EXERCÍCIO ======================================================= */

  if (botaoAdicionarExercicio) {
    botaoAdicionarExercicio.addEventListener("click", async function () {
      const quantidadeAtual = parseInt(controle.quantidadeExercicios, 10);

      if (quantidadeAtual >= 100) {
        mostrarAvisoTurmas("⚠️ O limite é de 100 exercícios.", {
          titulo: "Limite atingido",

          mensagem: "Uma atividade pode ter no máximo 100 exercícios.",

          icone: "warning",
        });

        return;
      }

      const novaQuantidade = quantidadeAtual + 1;

      controle.quantidadeExercicios = novaQuantidade;

      if (!controle.exercicios[novaQuantidade]) {
        controle.exercicios[novaQuantidade] = {
          nome: "",

          data: "",
        };
      }

      recalcularNotasAtividade(avaliacao, turma);

      turma.avaliacoes[indexAvaliacao] = avaliacao;

      turmas[indexTurma] = turma;

      const salvou = await salvarDadosTurmas(turmas);

      if (!salvou) {
        controle.quantidadeExercicios = quantidadeAtual;

        return;
      }

      if (typeof mostrarToast === "function") {
        mostrarToast(`✅ Exercício ${novaQuantidade} adicionado.`);
      }

      await abrirControleAtividades(indexTurma, indexAvaliacao);
    });
  }

  /* ======================================================= EXCLUIR EXERCÍCIO SELECIONADO ======================================================= */

  if (botaoExcluirExercicio) {
    botaoExcluirExercicio.addEventListener("click", function () {
      const quantidadeAtual = parseInt(controle.quantidadeExercicios, 10);

      if (quantidadeAtual <= 1) {
        mostrarAvisoTurmas(
          "⚠️ A atividade precisa manter pelo menos um exercício.",
          {
            titulo: "Exclusão indisponível",

            mensagem: "Não é possível excluir o único exercício da atividade.",

            icone: "warning",
          }
        );

        return;
      }

      const numeroSelecionado = Number(seletorExercicioAtividade?.value);

      if (
        !Number.isInteger(numeroSelecionado) ||
        numeroSelecionado < 1 ||
        numeroSelecionado > quantidadeAtual
      ) {
        mostrarAvisoTurmas("⚠️ Selecione um exercício válido.", {
          titulo: "Exercício não selecionado",

          mensagem: "Escolha na lista o exercício que deseja excluir.",

          icone: "warning",
        });

        return;
      }

      const exercicioSelecionado = controle.exercicios[numeroSelecionado] || {};

      const nomeExercicio = String(
        exercicioSelecionado.nome || `Exercício ${numeroSelecionado}`
      ).trim();

      const confirmarExclusao = async function () {
        const copiaControle = clonarDadosTurmas(controle);

        /* Reorganiza os registros de todos os alunos após a remoção do exercício. */

        Object.keys(controle.registros).forEach((nomeAluno) => {
          const registrosAntigos = controle.registros[nomeAluno];

          if (
            !registrosAntigos ||
            typeof registrosAntigos !== "object" ||
            Array.isArray(registrosAntigos)
          ) {
            controle.registros[nomeAluno] = {};

            return;
          }

          const registrosNovos = {};

          for (let numero = 1; numero <= quantidadeAtual; numero++) {
            if (numero === numeroSelecionado) {
              continue;
            }

            const novoNumero = numero > numeroSelecionado ? numero - 1 : numero;

            if (
              Object.prototype.hasOwnProperty.call(registrosAntigos, numero)
            ) {
              registrosNovos[novoNumero] = Boolean(registrosAntigos[numero]);
            }
          }

          controle.registros[nomeAluno] = registrosNovos;
        });

        /* Reorganiza nomes e datas dos exercícios mantendo índice inicial 1. */

        const exerciciosNovos = [];

        for (let numero = 1; numero <= quantidadeAtual; numero++) {
          if (numero === numeroSelecionado) {
            continue;
          }

          exerciciosNovos.push(
            clonarDadosTurmas(
              controle.exercicios[numero] || {
                nome: "",
                data: "",
              }
            )
          );
        }

        controle.exercicios = [null];

        exerciciosNovos.forEach((exercicio, indice) => {
          controle.exercicios[indice + 1] = exercicio;
        });

        controle.quantidadeExercicios = quantidadeAtual - 1;

        recalcularNotasAtividade(avaliacao, turma);

        turma.avaliacoes[indexAvaliacao] = avaliacao;

        turmas[indexTurma] = turma;

        const salvou = await salvarDadosTurmas(turmas);

        if (!salvou) {
          avaliacao.controleAtividades = copiaControle;

          return;
        }

        if (typeof mostrarToast === "function") {
          mostrarToast(`🗑 ${nomeExercicio} excluído.`);
        }

        await abrirControleAtividades(indexTurma, indexAvaliacao);
      };

      if (typeof mostrarConfirmacao === "function") {
        mostrarConfirmacao({
          titulo: "Excluir exercício",

          mensagem: `Deseja excluir "${nomeExercicio}"? Os registros desse exercício serão removidos e os exercícios seguintes serão reorganizados.`,

          icone: "delete",

          textoConfirmar: "Excluir exercício",

          textoCancelar: "Cancelar",

          classeConfirmar: "btnVermelho",

          aoConfirmar: confirmarExclusao,
        });

        return;
      }

      if (window.confirm(`Deseja excluir "${nomeExercicio}"?`)) {
        confirmarExclusao();
      }
    });
  }

  /* ======================================================= SALVAMENTO MANUAL ======================================================= */

  if (botaoSalvarControle) {
    botaoSalvarControle.addEventListener("click", async function () {
      recalcularNotasAtividade(avaliacao, turma);

      turma.avaliacoes[indexAvaliacao] = avaliacao;

      turmas[indexTurma] = turma;

      const salvou = await salvarDadosTurmas(turmas);

      if (!salvou) {
        mostrarAvisoTurmas("❌ Não foi possível salvar a planilha.", {
          titulo: "Erro ao salvar",

          mensagem: "Verifique sua conexão e tente novamente.",

          icone: "error",
        });

        return;
      }

      if (typeof mostrarToast === "function") {
        mostrarToast("✅ Planilha salva.");
      }
    });
  }

  /* ======================================================= OBTER ALUNO PELO ÍNDICE DA LISTA ORDENADA ======================================================= */

  function obterAlunoPeloIndiceOrdenado(indice) {
    indice = Number(indice);

    if (
      !Number.isInteger(indice) ||
      indice < 0 ||
      indice >= alunosOrdenados.length
    ) {
      return null;
    }

    return alunosOrdenados[indice];
  }

  /* ======================================================= MARCAR OU DESMARCAR CÉLULAS ======================================================= */

  document.querySelectorAll(".alternarAtividadeCelula").forEach((celula) => {
    async function executarAlternancia() {
      const indiceAluno = Number(celula.dataset.indexAluno);

      const numeroExercicio = Number(celula.dataset.exercicio);

      const aluno = obterAlunoPeloIndiceOrdenado(indiceAluno);

      if (aluno === null || !Number.isInteger(numeroExercicio)) {
        return;
      }

      /* Impede vários cliques enquanto a alteração está sendo salva. */

      if (celula.dataset.salvando === "true") {
        return;
      }

      celula.dataset.salvando = "true";

      celula.style.opacity = ".55";

      try {
        await alternarAtividade(
          indexTurma,
          indexAvaliacao,
          aluno,
          numeroExercicio
        );
      } finally {
        celula.dataset.salvando = "false";

        celula.style.opacity = "";
      }
    }

    celula.addEventListener("click", executarAlternancia);

    celula.addEventListener("keydown", (evento) => {
      if (evento.key === "Enter" || evento.key === " ") {
        evento.preventDefault();

        executarAlternancia();
      }
    });
  });

  /* ======================================================= PAINEL RESUMIDO DO ALUNO ======================================================= */

  document
    .querySelectorAll(".abrirPainelAlunoAtividadeBotao")
    .forEach((celulaAluno) => {
      function abrirResumoAluno() {
        const indiceAluno = Number(celulaAluno.dataset.indexAluno);

        const aluno = obterAlunoPeloIndiceOrdenado(indiceAluno);

        if (aluno === null) {
          return;
        }

        const feitos = contarExerciciosFeitos(aluno);

        const percentual = obterPercentualAluno(aluno);

        const nota = obterNotaAtividade(aluno);

        const pendencias = obterPendenciasAluno(aluno);

        let listaPendencias = "";

        for (let numero = 1; numero <= quantidadeExercicios; numero++) {
          const registrosAluno = obterRegistrosAluno(aluno);

          if (registrosAluno[numero] === true) {
            continue;
          }

          const exercicio =
            controle.exercicios[numero] &&
            typeof controle.exercicios[numero] === "object"
              ? controle.exercicios[numero]
              : {};

          const nomeExercicio = exercicio.nome || `Exercício ${numero}`;

          const dataExercicio = exercicio.data ? ` — ${exercicio.data}` : "";

          listaPendencias += ` <li> ${escaparHTMLTurmas(
            nomeExercicio
          )} ${escaparHTMLTurmas(dataExercicio)} </li> `;
        }

        const mensagemPendencias =
          pendencias === 0
            ? ` <p style=" color:var(--sucesso); font-weight:700; " > ✅ Todos os exercícios foram concluídos. </p> `
            : ` <p> <strong> Exercícios pendentes: </strong> </p> <ul> ${listaPendencias} </ul> `;

        if (typeof mostrarAlerta === "function") {
          mostrarAlerta({
            titulo: aluno,

            mensagem: ` <div style=" text-align:left; " > <p> ✅ Realizados: <strong> ${feitos}/${quantidadeExercicios} </strong> </p> <p> 📊 Conclusão: <strong> ${percentual}% </strong> </p> <p> ⭐ Nota: <strong> ${formatarNumeroAtividade(
              nota
            )} / ${formatarNumeroAtividade(
              valorAtividade
            )} </strong> </p> <p> 🚨 Pendências: <strong> ${pendencias} </strong> </p> ${mensagemPendencias} </div> `,

            icone: pendencias === 0 ? "check_circle" : "assignment_late",
          });

          return;
        }

        if (typeof mostrarToast === "function") {
          mostrarToast(
            `${aluno}: ${feitos}/${quantidadeExercicios} realizados • Nota ${formatarNumeroAtividade(
              nota
            )}`
          );
        }
      }

      celulaAluno.addEventListener("click", abrirResumoAluno);

      celulaAluno.addEventListener("keydown", (evento) => {
        if (evento.key === "Enter" || evento.key === " ") {
          evento.preventDefault();

          abrirResumoAluno();
        }
      });
    });

  /* ======================================================= EDITAR NOME E DATA DO EXERCÍCIO ======================================================= */

  document
    .querySelectorAll(".editarExercicioAtividade")
    .forEach((botaoExercicio) => {
      botaoExercicio.addEventListener("click", function () {
        const numeroExercicio = Number(botaoExercicio.dataset.exercicio);

        if (
          !Number.isInteger(numeroExercicio) ||
          numeroExercicio < 1 ||
          numeroExercicio > quantidadeExercicios
        ) {
          return;
        }

        const exercicioAtual =
          controle.exercicios[numeroExercicio] &&
          typeof controle.exercicios[numeroExercicio] === "object"
            ? controle.exercicios[numeroExercicio]
            : {
                nome: "",
                data: "",
              };

        if (typeof mostrarPrompt !== "function") {
          mostrarAvisoTurmas("⚠️ A janela de edição não está disponível.", {
            titulo: "Edição indisponível",

            mensagem: "Não foi possível abrir o editor deste exercício.",

            icone: "warning",
          });

          return;
        }

        mostrarPrompt({
          titulo: `Editar exercício ${numeroExercicio}`,

          mensagem: "Informe o nome ou a descrição do exercício.",

          label: "Nome do exercício",

          valor: exercicioAtual.nome || "",

          placeholder: "Ex.: Exercícios da página 25",

          tipo: "text",

          icone: "edit_note",

          textoConfirmar: "Continuar",

          textoCancelar: "Cancelar",

          obrigatorio: false,

          aoConfirmar: function (nomeInformado) {
            const nome = String(nomeInformado || "").trim();

            mostrarPrompt({
              titulo: `Editar exercício ${numeroExercicio}`,

              mensagem:
                "Informe a data do exercício. O campo pode ficar vazio.",

              label: "Data da atividade",

              valor: exercicioAtual.data || "",

              placeholder: "Ex.: 31/07/2026",

              tipo: "text",

              icone: "calendar_month",

              textoConfirmar: "Salvar",

              textoCancelar: "Voltar",

              obrigatorio: false,

              aoConfirmar: async function (dataInformada) {
                const data = String(dataInformada || "").trim();

                controle.exercicios[numeroExercicio] = {
                  nome,

                  data,
                };

                turma.avaliacoes[indexAvaliacao] = avaliacao;

                turmas[indexTurma] = turma;

                const salvou = await salvarDadosTurmas(turmas);

                if (!salvou) {
                  mostrarAvisoTurmas(
                    "❌ Não foi possível editar o exercício.",
                    {
                      titulo: "Erro ao salvar",

                      mensagem: "Verifique sua conexão e tente novamente.",

                      icone: "error",
                    }
                  );

                  return;
                }

                if (typeof mostrarToast === "function") {
                  mostrarToast(`✅ Exercício ${numeroExercicio} atualizado.`);
                }

                await abrirControleAtividades(indexTurma, indexAvaliacao);
              },
            });
          },
        });
      });
    });

  /* ======================================================= ABRIR RELATÓRIO DE PENDÊNCIAS ======================================================= */

  if (botaoAbrirPendencias) {
    botaoAbrirPendencias.addEventListener("click", function () {
      let alunosComPendencias = 0;

      let htmlPendencias = "";

      turma.alunos.forEach((aluno) => {
        const registrosAluno = obterRegistrosAluno(aluno);

        const feitos = contarExerciciosFeitos(aluno);

        const pendentes = Math.max(quantidadeExercicios - feitos, 0);

        if (pendentes === 0) {
          return;
        }

        alunosComPendencias++;

        let itensPendentes = "";

        for (let numero = 1; numero <= quantidadeExercicios; numero++) {
          if (registrosAluno[numero] === true) {
            continue;
          }

          const exercicio =
            controle.exercicios[numero] &&
            typeof controle.exercicios[numero] === "object"
              ? controle.exercicios[numero]
              : {};

          const nomeExercicio = exercicio.nome || `Exercício ${numero}`;

          const dataExercicio = exercicio.data ? ` — ${exercicio.data}` : "";

          itensPendentes += ` <li> ${escaparHTMLTurmas(
            nomeExercicio
          )} ${escaparHTMLTurmas(dataExercicio)} </li> `;
        }

        const percentualAlunoPendencias =
          quantidadeExercicios > 0
            ? Math.round((feitos / quantidadeExercicios) * 100)
            : 0;

        htmlPendencias += `
          <article class="fichaPendenciaAtividade">
            <div class="fichaPendenciaTopo">
              <div class="fichaPendenciaIdentidade">
                <span class="material-icons-round fichaPendenciaAvatar">person</span>
                <div>
                  <span class="fichaPendenciaRotulo">Estudante</span>
                  <h3>${escaparHTMLTurmas(aluno)}</h3>
                </div>
              </div>

              <div class="fichaPendenciaStatus">
                <span class="statusPendenciaChip">
                  ${pendentes} pendente${pendentes === 1 ? "" : "s"}
                </span>
              </div>
            </div>

            <div class="fichaPendenciaResumo">
              <div>
                <span>Realizados</span>
                <strong>${feitos}/${quantidadeExercicios}</strong>
              </div>
              <div>
                <span>Conclusão</span>
                <strong>${percentualAlunoPendencias}%</strong>
              </div>
              <div>
                <span>Pendências</span>
                <strong>${pendentes}</strong>
              </div>
            </div>

            <div class="fichaPendenciaProgresso" aria-hidden="true">
              <span style="width:${percentualAlunoPendencias}%"></span>
            </div>

            <div class="fichaPendenciaLista">
              <h4>
                <span class="material-icons-round">assignment_late</span>
                Atividades que precisam ser realizadas
              </h4>
              <ul>${itensPendentes}</ul>
            </div>

            <div class="fichaPendenciaOrientacao">
              <span class="material-icons-round">info</span>
              <p>
                O(a) estudante deverá realizar as atividades acima e devolvê-las
                ao(à) professor(a) para atualização do registro.
              </p>
            </div>

            <div class="fichaPendenciaCampos">
              <div class="campoPendenciaData">
                <span>Data da devolução</span>
                <div class="linhaPreenchimento">____/____/________</div>
              </div>

              <div class="campoPendenciaAssinatura">
                <span>Assinatura do responsável</span>
                <div class="linhaAssinatura"></div>
              </div>

              <div class="campoPendenciaAssinatura">
                <span>Nome do responsável</span>
                <div class="linhaAssinatura"></div>
              </div>
            </div>

            <div class="acoes fichaPendenciaAcoes">
              <button
                type="button"
                class="btnSecundario"
                onclick="imprimirFichaPendenciaAtividade(this)"
              >
                <span class="material-icons-round">print</span>
                Imprimir este aluno
              </button>
            </div>
          </article>
        `;
      });

      const percentualComPendencias =
        totalAlunos > 0
          ? Math.round((alunosComPendencias / totalAlunos) * 100)
          : 0;

      document.body.innerHTML =
        `
          <div class="cabecalhoTela cabecalhoPendenciasAtividade">
            <div>
              <span class="etiquetaTela">Controle de atividades</span>
              <h1>
                <span class="material-icons-round">assignment_late</span>
                Pendências da Atividade
              </h1>
              <p>📚 ${nomeTurmaSeguro} • ${nomeAvaliacaoSeguro}</p>
            </div>
          </div>

          <main class="secaoApp telaPendenciasAtividade">
            <section class="resumoPendenciasAtividade">
              <div class="resumoPendenciaCard destaque">
                <span class="material-icons-round">warning_amber</span>
                <div>
                  <strong>${alunosComPendencias}</strong>
                  <span>alunos com pendências</span>
                </div>
              </div>

              <div class="resumoPendenciaCard">
                <span class="material-icons-round">groups</span>
                <div>
                  <strong>${totalAlunos}</strong>
                  <span>alunos na turma</span>
                </div>
              </div>

              <div class="resumoPendenciaCard">
                <span class="material-icons-round">percent</span>
                <div>
                  <strong>${percentualComPendencias}%</strong>
                  <span>da turma com pendências</span>
                </div>
              </div>
            </section>

            <section class="painel painelPendenciasAtividade">
              <div class="painelBlocoCabecalho">
                <div>
                  <h2>
                    <span class="material-icons-round">fact_check</span>
                    Fichas de recuperação
                  </h2>
                  <p>
                    Cada aluno possui uma ficha pronta para impressão e
                    assinatura do responsável.
                  </p>
                </div>
              </div>

              <div class="listaFichasPendenciaAtividade">
                ${
                  alunosComPendencias > 0
                    ? htmlPendencias
                    : `
                      <div class="estadoVazioApp">
                        <span class="estadoVazioIcone material-icons-round">
                          task_alt
                        </span>
                        <h3>Nenhuma pendência</h3>
                        <p>
                          Todos os alunos concluíram os exercícios desta atividade.
                        </p>
                      </div>
                    `
                }
              </div>
            </section>

            <div class="acoes acoesPendenciasAtividade">
              ${
                alunosComPendencias > 0
                  ? `
                    <button
                      type="button"
                      class="btnAzul"
                      onclick="window.print()"
                    >
                      <span class="material-icons-round">print</span>
                      Imprimir todos
                    </button>
                  `
                  : ""
              }

              <button
                class="btnSecundario"
                type="button"
                onclick="abrirControleAtividades(${indexTurma},${indexAvaliacao})"
              >
                <span class="material-icons-round">arrow_back</span>
                Voltar para a planilha
              </button>
            </div>
          </main>
        ` + (typeof barraInferior === "function" ? barraInferior() : "");

      if (typeof aplicarTemaSalvo === "function") {
        aplicarTemaSalvo();
      }
    });
  }

  /* ======================================================= FIM DA FUNÇÃO ======================================================= */
}

function imprimirFichaPendenciaAtividade(botao) {
  if (!botao) {
    return;
  }

  const ficha = botao.closest(".fichaPendenciaAtividade");

  if (!ficha) {
    return;
  }

  const janela = window.open("", "_blank");

  if (!janela) {
    if (typeof mostrarAlerta === "function") {
      mostrarAlerta({
        titulo: "Impressão bloqueada",
        mensagem:
          "O navegador bloqueou a janela de impressão. Autorize pop-ups para o Ajuda+Prof e tente novamente.",
        icone: "print_disabled",
      });
    }

    return;
  }

  const conteudo = ficha.cloneNode(true);
  const acoes = conteudo.querySelector(".fichaPendenciaAcoes");

  if (acoes) {
    acoes.remove();
  }

  janela.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ficha de recuperação</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            color: #172033;
            font-family: Arial, sans-serif;
            line-height: 1.45;
          }

          .fichaPendenciaAtividade {
            border: 1px solid #d7dce6;
            border-radius: 16px;
            padding: 22px;
          }

          .fichaPendenciaTopo {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            padding-bottom: 14px;
            border-bottom: 1px solid #e5e7eb;
          }

          .fichaPendenciaIdentidade {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .fichaPendenciaAvatar,
          .material-icons-round {
            display: none;
          }

          .fichaPendenciaRotulo,
          .fichaPendenciaResumo span,
          .fichaPendenciaCampos span {
            display: block;
            color: #64748b;
            font-size: 12px;
          }

          h3, h4, p {
            margin-top: 0;
          }

          h3 {
            margin-bottom: 0;
            font-size: 20px;
          }

          .statusPendenciaChip {
            display: inline-block;
            padding: 6px 10px;
            border: 1px solid #f59e0b;
            border-radius: 999px;
            font-weight: 700;
          }

          .fichaPendenciaResumo {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin: 16px 0 8px;
          }

          .fichaPendenciaResumo > div {
            padding: 10px;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
          }

          .fichaPendenciaResumo strong {
            display: block;
            margin-top: 3px;
            font-size: 17px;
          }

          .fichaPendenciaProgresso {
            height: 8px;
            margin-bottom: 18px;
            overflow: hidden;
            border-radius: 999px;
            background: #e5e7eb;
          }

          .fichaPendenciaProgresso span {
            display: block;
            height: 100%;
            background: #16a34a;
          }

          .fichaPendenciaLista {
            margin: 16px 0;
            padding: 14px 16px;
            border-radius: 12px;
            background: #fff7ed;
          }

          .fichaPendenciaLista ul {
            margin-bottom: 0;
          }

          .fichaPendenciaOrientacao {
            margin: 16px 0;
            padding: 12px 14px;
            border-left: 4px solid #4f46e5;
            background: #eef2ff;
          }

          .fichaPendenciaOrientacao p {
            margin: 0;
          }

          .fichaPendenciaCampos {
            display: grid;
            gap: 18px;
            margin-top: 22px;
          }

          .linhaPreenchimento {
            margin-top: 6px;
          }

          .linhaAssinatura {
            height: 26px;
            border-bottom: 1px solid #111827;
          }
        </style>
      </head>
      <body>
        ${conteudo.outerHTML}
        <script>
          window.onload = function () {
            window.print();
            window.onafterprint = function () {
              window.close();
            };
          };
        <\/script>
      </body>
    </html>
  `);

  janela.document.close();
}
