/* ========================================================= AJUDA+PROF — AVALIAÇÕES Integração complementar com o módulo Firebase de turmas ========================================================= */

async function salvarTurmasAvaliacoes(turmas) {
  if (typeof window.salvarDadosTurmas !== "function") {
    console.error(
      "salvarDadosTurmas() não está disponível no módulo de avaliações."
    );

    if (typeof mostrarToast === "function") {
      mostrarToast("❌ Não foi possível salvar as alterações.");
    }

    return false;
  }

  try {
    return await window.salvarDadosTurmas(Array.isArray(turmas) ? turmas : []);
  } catch (erro) {
    console.error("Erro ao salvar turmas pelo módulo de avaliações:", erro);

    if (typeof mostrarToast === "function") {
      mostrarToast("❌ Não foi possível salvar as alterações.");
    }

    return false;
  }
}

window.salvarTurmasAvaliacoes = salvarTurmasAvaliacoes;

/* Versão legada preservada temporariamente; a versão oficial está em turmas.js. */
function abrirAvaliacoesTurmaLegadoAvaliacoes(index) {
  let turmas = obterTurmasSalvas();

  if (!Array.isArray(turmas)) {
    turmas = [];
  }

  if (index < 0 || index >= turmas.length) {
    abrirTurmas();

    return;
  }

  let turma = turmas[index];

  if (!Array.isArray(turma.avaliacoes)) {
    turma.avaliacoes = [];
  }

  if (!Array.isArray(turma.alunos)) {
    turma.alunos = [];
  }

  salvarTurmasAvaliacoes(turmas);

  document.body.innerHTML =
    ` <div class="cabecalhoTela"> <div> <h1>📝 Avaliações</h1> <p id="nomeTurmaAvaliacoes"></p> </div> </div> <main class="secaoApp"> <section class="card textoEsquerda"> <h2 id="tituloFormularioAvaliacao"> ➕ Nova avaliação </h2> <div class="grupoCampo"> <label for="bimestre"> Bimestre </label> <select id="bimestre"> <option value="1B"> 1º Bimestre </option> <option value="2B"> 2º Bimestre </option> <option value="3B"> 3º Bimestre </option> <option value="4B"> 4º Bimestre </option> </select> </div> <div class="grupoCampo"> <label for="nomeAvaliacao"> Nome da avaliação </label> <input id="nomeAvaliacao" type="text" placeholder="Ex.: Prova de Língua Portuguesa" autocomplete="off" > </div> <div class="grupoCampo"> <label for="tipoAvaliacao"> Tipo da avaliação </label> <select id="tipoAvaliacao"> <option value="atividade"> 📝 Atividade </option> <option value="trabalho"> 🎤 Trabalho </option> <option value="prova"> 📷 Prova </option> </select> </div> <div class="grupoCampo"> <label for="valorAvaliacao"> Valor da avaliação </label> <input id="valorAvaliacao" type="number" min="0.1" step="0.1" placeholder="Ex.: 10" inputmode="decimal" > </div> <div class="acoes"> <button id="criarAvaliacao" class="btnAzul" type="button" > <span class="material-icons-round"> add </span> Criar avaliação </button> </div> </section> <section class="painel"> <div class="painelBlocoCabecalho"> <div> <h2>📋 Avaliações cadastradas</h2> <p id="contadorAvaliacoes"> Nenhuma avaliação cadastrada. </p> </div> </div> <div id="listaAvaliacoes"></div> </section> <div class="acoes"> <button class="btnAzul" type="button" onclick="abrirDetalhesTurma(${index})" > <span class="material-icons-round"> arrow_back </span> Voltar para a turma </button> </div> </main> ` +
    barraInferior();

  aplicarTemaSalvo();

  document.getElementById("nomeTurmaAvaliacoes").textContent =
    "Turma: " + (turma.nome || "Sem nome");

  document.getElementById("criarAvaliacao").onclick = function () {
    criarAvaliacao(index);
  };

  document
    .getElementById("nomeAvaliacao")
    .addEventListener("keydown", function (evento) {
      if (evento.key === "Enter") {
        evento.preventDefault();

        criarAvaliacao(index);
      }
    });

  renderizarAvaliacoes(index);
}

function renderizarAvaliacoes(index) {
  let turmas = obterTurmasSalvas();

  if (!Array.isArray(turmas)) {
    return;
  }

  if (!turmas[index] || !Array.isArray(turmas[index].avaliacoes)) {
    return;
  }

  let turma = turmas[index];

  let lista = document.getElementById("listaAvaliacoes");

  let contador = document.getElementById("contadorAvaliacoes");

  if (!lista) {
    return;
  }

  function escaparHTML(texto) {
    return String(texto ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function nomeTipoAvaliacao(tipo) {
    if (tipo === "atividade") {
      return "📝 Atividade";
    }

    if (tipo === "trabalho") {
      return "🎤 Trabalho";
    }

    if (tipo === "prova") {
      return "📷 Prova";
    }

    return "📌 Avaliação";
  }

  function nomeBimestre(bimestre) {
    if (bimestre === "1B") {
      return "1º Bimestre";
    }

    if (bimestre === "2B") {
      return "2º Bimestre";
    }

    if (bimestre === "3B") {
      return "3º Bimestre";
    }

    if (bimestre === "4B") {
      return "4º Bimestre";
    }

    return bimestre || "Sem bimestre";
  }

  let total = turma.avaliacoes.length;

  if (contador) {
    contador.textContent =
      total === 0
        ? "Nenhuma avaliação cadastrada."
        : total === 1
        ? "1 avaliação cadastrada."
        : `${total} avaliações cadastradas.`;
  }

  if (total === 0) {
    lista.innerHTML = criarMensagemVazia({
      titulo: "Nenhuma avaliação cadastrada",

      descricao:
        "Crie uma avaliação para lançar notas e acompanhar o desempenho da turma.",

      icone: "assignment",
    });

    return;
  }

  let html = "";

  turma.avaliacoes.forEach((avaliacao, i) => {
    let alunosTurma = Array.isArray(turma.alunos) ? turma.alunos : [];

    let totalNotas =
      avaliacao.notas && typeof avaliacao.notas === "object"
        ? alunosTurma.filter((aluno) =>
            Object.prototype.hasOwnProperty.call(avaliacao.notas, aluno)
          ).length
        : 0;

    let totalAlunos = alunosTurma.length;

    let notasPendentes = Math.max(totalAlunos - totalNotas, 0);

    let valor = Number(avaliacao.valor);

    let valorFormatado = Number.isFinite(valor)
      ? valor.toLocaleString("pt-BR", {
          maximumFractionDigits: 2,
        })
      : "0";

    html += ` <div class="card textoEsquerda"> <div class="flexEntre"> <div> <h3> ${escaparHTML( avaliacao.nome || "Avaliação sem nome" )} </h3> <p> ${nomeTipoAvaliacao( avaliacao.tipo )} </p> <p> 📅 ${nomeBimestre( avaliacao.bimestre )} </p> <p> ⭐ Valor: ${valorFormatado} </p> <p> 👨‍🎓 ${totalNotas} nota(s) lançada(s) • ${notasPendentes} pendente(s) </p> </div> </div> <div class="acoes"> <button type="button" class="btnAzul" onclick="abrirLancamentoNotas(${index},${i})" > <span class="material-icons-round"> grading </span> Lançar notas </button> ${ avaliacao.tipo === "atividade" ? ` <button type="button" onclick="abrirControleAtividades(${index},${i})" > <span class="material-icons-round"> fact_check </span> Controle de atividades </button> ` : "" } <button type="button" onclick="editarAvaliacao(${index},${i})" > <span class="material-icons-round"> edit </span> Editar </button> <button type="button" class="btnVermelho" onclick="excluirAvaliacao(${index},${i})" > <span class="material-icons-round"> delete </span> Excluir </button> </div> </div> `;
  });

  lista.innerHTML = html;
}

function editarAvaliacao(indexTurma, indexAvaliacao) {
  let turmas = obterTurmasSalvas();

  if (!Array.isArray(turmas)) {
    return;
  }

  let turma = turmas[indexTurma];

  if (
    !turma ||
    !Array.isArray(turma.avaliacoes) ||
    !turma.avaliacoes[indexAvaliacao]
  ) {
    return;
  }

  let avaliacao = turma.avaliacoes[indexAvaliacao];

  mostrarPrompt({
    titulo: "Editar avaliação",

    mensagem: "Informe o novo nome da avaliação.",

    label: "Nome da avaliação",

    valor: avaliacao.nome || "",

    placeholder: "Ex.: Prova de Língua Portuguesa",

    tipo: "text",

    icone: "edit",

    textoConfirmar: "Continuar",

    textoCancelar: "Cancelar",

    obrigatorio: true,

    aoConfirmar: function (novoNome) {
      novoNome = novoNome.trim();

      if (novoNome === "") {
        if (typeof mostrarToast === "function") {
          mostrarToast("⚠️ O nome não pode ficar vazio.");
        }

        return;
      }

      mostrarPrompt({
        titulo: "Editar avaliação",

        mensagem: "Informe o novo valor da avaliação.",

        label: "Valor da avaliação",

        valor: avaliacao.valor ?? "",

        placeholder: "Ex.: 10",

        tipo: "number",

        icone: "edit",

        textoConfirmar: "Salvar alterações",

        textoCancelar: "Voltar",

        obrigatorio: true,

        aoConfirmar: function (novoValorTexto) {
          let novoValor = parseFloat(String(novoValorTexto).replace(",", "."));

          if (!Number.isFinite(novoValor) || novoValor <= 0) {
            if (typeof mostrarToast === "function") {
              mostrarToast("⚠️ Digite um valor válido.");
            } else {
              mostrarAlerta({
                titulo: "Valor inválido",
                mensagem: "Digite um valor válido.",
                icone: "warning",
              });
            }

            return;
          }

          let duplicada = turma.avaliacoes.some(
            (item, i) =>
              i !== indexAvaliacao &&
              String(item.nome || "")
                .trim()
                .toLocaleLowerCase("pt-BR") ===
                novoNome.toLocaleLowerCase("pt-BR") &&
              item.bimestre === avaliacao.bimestre
          );

          if (duplicada) {
            if (typeof mostrarToast === "function") {
              mostrarToast(
                "⚠️ Já existe uma avaliação com esse nome neste bimestre."
              );
            }

            return;
          }

          let valorAntigo = parseFloat(avaliacao.valor) || 0;

          avaliacao.nome = novoNome;

          avaliacao.valor = novoValor;

          /* As notas do Controle de Atividades são proporcionais ao valor da avaliação. */

          if (avaliacao.tipo === "atividade" && avaliacao.controleAtividades) {
            recalcularNotasAtividade(avaliacao, turma);
          } else if (valorAntigo > 0 && novoValor < valorAntigo) {
            Object.keys(avaliacao.notas || {}).forEach((aluno) => {
              let nota = parseFloat(avaliacao.notas[aluno]);

              if (Number.isFinite(nota) && nota > novoValor) {
                avaliacao.notas[aluno] = novoValor;
              }
            });
          }

          salvarTurmasAvaliacoes(turmas);

          if (typeof mostrarToast === "function") {
            mostrarToast("✅ Avaliação atualizada.");
          }

          abrirAvaliacoesTurma(indexTurma);
        },
      });
    },
  });
}

function criarAvaliacao(index) {
  let turmas = obterTurmasSalvas();

  if (!Array.isArray(turmas)) {
    turmas = [];
  }

  if (index < 0 || index >= turmas.length) {
    return;
  }

  let turma = turmas[index];

  if (!Array.isArray(turma.avaliacoes)) {
    turma.avaliacoes = [];
  }

  let campoNome = document.getElementById("nomeAvaliacao");

  let campoValor = document.getElementById("valorAvaliacao");

  let nome = campoNome.value.trim();

  let valorTexto = String(campoValor.value || "").replace(",", ".");

  let valor = parseFloat(valorTexto);

  let tipo = document.getElementById("tipoAvaliacao").value;

  let bimestre = document.getElementById("bimestre").value;

  if (nome === "") {
    campoNome.focus();

    if (typeof mostrarToast === "function") {
      mostrarToast("⚠️ Digite o nome da avaliação.");
    } else {
      mostrarAlerta({
        titulo: "Nome obrigatório",
        mensagem: "Digite o nome da avaliação.",
        icone: "warning",
      });
    }

    return;
  }

  if (!Number.isFinite(valor) || valor <= 0 || valor > 1000) {
    campoValor.focus();

    if (typeof mostrarToast === "function") {
      mostrarToast("⚠️ Digite um valor válido.");
    } else {
      mostrarAlerta({
        titulo: "Valor inválido",
        mensagem: "Digite um valor válido.",
        icone: "warning",
      });
    }

    return;
  }

  let avaliacaoDuplicada = turma.avaliacoes.some(
    (avaliacao) =>
      String(avaliacao.nome || "")
        .trim()
        .toLocaleLowerCase("pt-BR") === nome.toLocaleLowerCase("pt-BR") &&
      avaliacao.bimestre === bimestre
  );

  if (avaliacaoDuplicada) {
    campoNome.focus();

    if (typeof mostrarToast === "function") {
      mostrarToast("⚠️ Já existe uma avaliação com esse nome neste bimestre.");
    } else {
      mostrarAlerta({
        titulo: "Avaliação duplicada",
        mensagem: "Já existe uma avaliação com esse nome neste bimestre.",
        icone: "warning",
      });
    }

    return;
  }

  turma.avaliacoes.push({
    id:
      "avaliacao_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9),

    nome: nome,

    tipo: tipo,

    valor: valor,

    bimestre: bimestre,

    notas: {},

    controleAtividades: {
      quantidadeExercicios: 10,

      registros: {},

      exercicios: [],
    },
  });

  turmas[index] = turma;

  salvarTurmasAvaliacoes(turmas);

  if (typeof mostrarToast === "function") {
    mostrarToast("✅ Avaliação criada.");
  }

  abrirAvaliacoesTurma(index);
}
function editarExercicio(indexTurma, indexAvaliacao, numeroExercicio) {
  indexTurma = Number(indexTurma);

  indexAvaliacao = Number(indexAvaliacao);

  numeroExercicio = Number(numeroExercicio);

  let turmas = obterTurmasSalvas();

  if (!Array.isArray(turmas)) {
    turmas = [];
  }

  if (
    !Number.isInteger(indexTurma) ||
    indexTurma < 0 ||
    indexTurma >= turmas.length
  ) {
    if (typeof mostrarToast === "function") {
      mostrarToast("⚠️ Turma não encontrada.");
    }

    return;
  }

  let turma = turmas[indexTurma];

  if (
    !Array.isArray(turma.avaliacoes) ||
    !Number.isInteger(indexAvaliacao) ||
    indexAvaliacao < 0 ||
    indexAvaliacao >= turma.avaliacoes.length
  ) {
    if (typeof mostrarToast === "function") {
      mostrarToast("⚠️ Avaliação não encontrada.");
    }

    return;
  }

  let avaliacao = turma.avaliacoes[indexAvaliacao];

  if (!Number.isInteger(numeroExercicio) || numeroExercicio < 1) {
    return;
  }

  if (
    !avaliacao.controleAtividades ||
    typeof avaliacao.controleAtividades !== "object"
  ) {
    avaliacao.controleAtividades = {
      quantidadeExercicios: 10,

      registros: {},

      exercicios: [],
    };
  }

  if (!Array.isArray(avaliacao.controleAtividades.exercicios)) {
    avaliacao.controleAtividades.exercicios = [];
  }

  let exercicioAtual = avaliacao.controleAtividades.exercicios[numeroExercicio];

  if (!exercicioAtual || typeof exercicioAtual !== "object") {
    exercicioAtual = {
      nome: "",

      data: "",
    };
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

    aoConfirmar: function (nome) {
      nome = String(nome || "").trim();

      mostrarPrompt({
        titulo: `Editar exercício ${numeroExercicio}`,

        mensagem: "Informe a data do exercício.",

        label: "Data da atividade",

        valor: exercicioAtual.data || "",

        placeholder: "Ex.: 30/07/2026",

        tipo: "text",

        icone: "calendar_month",

        textoConfirmar: "Salvar",

        textoCancelar: "Voltar",

        obrigatorio: false,

        aoConfirmar: function (data) {
          data = String(data || "").trim();

          avaliacao.controleAtividades.exercicios[numeroExercicio] = {
            nome: nome,

            data: data,
          };

          salvarTurmasAvaliacoes(turmas);

          if (typeof mostrarToast === "function") {
            mostrarToast("✅ Exercício atualizado.");
          }

          abrirControleAtividades(indexTurma, indexAvaliacao);
        },
      });
    },
  });
}

function abrirLivroNotasLegadoAvaliacoes(indexTurma) {
  let turmas = obterTurmasSalvas();

  if (!Array.isArray(turmas)) {
    turmas = [];
  }

  if (indexTurma < 0 || indexTurma >= turmas.length) {
    abrirTurmas();

    return;
  }

  let turma = turmas[indexTurma];

  if (!Array.isArray(turma.alunos)) {
    turma.alunos = [];
  }

  if (!Array.isArray(turma.avaliacoes)) {
    turma.avaliacoes = [];
  }

  function escaparHTMLLivroNotas(texto) {
    return String(texto ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function obterNumeroLivroNotas(valor) {
    if (valor === null || valor === undefined || valor === "") {
      return null;
    }

    if (typeof valor === "number") {
      return Number.isFinite(valor) ? valor : null;
    }

    let texto = String(valor).trim().replace(",", ".");

    if (texto.includes("/")) {
      texto = texto.split("/")[0];
    }

    let numero = parseFloat(texto);

    return Number.isFinite(numero) ? numero : null;
  }

  function formatarNotaLivroNotas(valor) {
    let numero = obterNumeroLivroNotas(valor);

    if (numero === null) {
      return "—";
    }

    return numero.toFixed(1).replace(".", ",");
  }

  function nomeTipoLivroNotas(tipo) {
    if (tipo === "atividade") {
      return "Atividade";
    }

    if (tipo === "trabalho") {
      return "Trabalho";
    }

    if (tipo === "prova") {
      return "Prova";
    }

    return "Avaliação";
  }

  function obterSituacaoLivroNotas(media) {
    if (media === null) {
      return {
        codigo: "sem-nota",
        texto: "Sem média",
        icone: "⚪",
        fundo: "rgba(127,127,127,.14)",
        cor: "var(--texto)",
      };
    }

    if (media >= 6) {
      return {
        codigo: "aprovado",
        texto: "Aprovado",
        icone: "🟢",
        fundo: "rgba(34,197,94,.16)",
        cor: "var(--texto)",
      };
    }

    if (media >= 4) {
      return {
        codigo: "recuperacao",
        texto: "Recuperação",
        icone: "🟡",
        fundo: "rgba(234,179,8,.18)",
        cor: "var(--texto)",
      };
    }

    return {
      codigo: "atencao",
      texto: "Atenção",
      icone: "🔴",
      fundo: "rgba(239,68,68,.16)",
      cor: "var(--texto)",
    };
  }

  function ordenarBimestreLivroNotas(bimestre) {
    let texto = String(bimestre || "").toLowerCase();

    if (texto.includes("1")) {
      return 1;
    }

    if (texto.includes("2")) {
      return 2;
    }

    if (texto.includes("3")) {
      return 3;
    }

    if (texto.includes("4")) {
      return 4;
    }

    return 99;
  }

  let avaliacoesOrdenadas = turma.avaliacoes
    .map((avaliacao, indexOriginal) => ({
      avaliacao,
      indexOriginal,
    }))
    .sort((a, b) => {
      let ordemA = ordenarBimestreLivroNotas(a.avaliacao.bimestre);

      let ordemB = ordenarBimestreLivroNotas(b.avaliacao.bimestre);

      if (ordemA !== ordemB) {
        return ordemA - ordemB;
      }

      return a.indexOriginal - b.indexOriginal;
    });

  let resultadosAlunos = turma.alunos.map((aluno) => {
    let somaNotas = 0;
    let somaValores = 0;
    let quantidadeNotas = 0;
    let notasValidas = [];

    avaliacoesOrdenadas.forEach((item) => {
      let avaliacao = item.avaliacao;

      if (!avaliacao.notas || typeof avaliacao.notas !== "object") {
        return;
      }

      if (!Object.prototype.hasOwnProperty.call(avaliacao.notas, aluno)) {
        return;
      }

      let nota = obterNumeroLivroNotas(avaliacao.notas[aluno]);

      let valorMaximo = obterNumeroLivroNotas(avaliacao.valor);

      if (nota === null || valorMaximo === null || valorMaximo <= 0) {
        return;
      }

      somaNotas += nota;
      somaValores += valorMaximo;
      quantidadeNotas++;

      notasValidas.push({
        nota,
        valorMaximo,
        percentual: (nota / valorMaximo) * 100,
      });
    });

    let percentualGeral =
      somaValores > 0 ? (somaNotas / somaValores) * 100 : null;

    let mediaDez = percentualGeral !== null ? percentualGeral / 10 : null;

    let melhorNota =
      notasValidas.length > 0
        ? Math.max(...notasValidas.map((item) => item.percentual / 10))
        : null;

    let piorNota =
      notasValidas.length > 0
        ? Math.min(...notasValidas.map((item) => item.percentual / 10))
        : null;

    let situacao = obterSituacaoLivroNotas(mediaDez);

    return {
      aluno,
      somaNotas,
      somaValores,
      quantidadeNotas,
      percentualGeral,
      mediaDez,
      melhorNota,
      piorNota,
      situacao,
    };
  });

  let alunosComMedia = resultadosAlunos.filter(
    (item) => item.mediaDez !== null
  );

  let totalAprovados = resultadosAlunos.filter(
    (item) => item.situacao.codigo === "aprovado"
  ).length;

  let totalRecuperacao = resultadosAlunos.filter(
    (item) => item.situacao.codigo === "recuperacao"
  ).length;

  let totalAtencao = resultadosAlunos.filter(
    (item) => item.situacao.codigo === "atencao"
  ).length;

  let totalSemMedia = resultadosAlunos.filter(
    (item) => item.situacao.codigo === "sem-nota"
  ).length;

  let mediaGeralTurma =
    alunosComMedia.length > 0
      ? alunosComMedia.reduce((soma, item) => soma + item.mediaDez, 0) /
        alunosComMedia.length
      : null;

  let melhorMediaTurma =
    alunosComMedia.length > 0
      ? Math.max(...alunosComMedia.map((item) => item.mediaDez))
      : null;

  let menorMediaTurma =
    alunosComMedia.length > 0
      ? Math.min(...alunosComMedia.map((item) => item.mediaDez))
      : null;

  let totalNotasLancadas = resultadosAlunos.reduce(
    (soma, item) => soma + item.quantidadeNotas,
    0
  );

  let totalNotasPossiveis = turma.alunos.length * avaliacoesOrdenadas.length;

  let percentualPreenchimento =
    totalNotasPossiveis > 0
      ? Math.round((totalNotasLancadas / totalNotasPossiveis) * 100)
      : 0;

  let html = ` <div class="cabecalhoTela"> <div> <h1> 📚 Livro de Notas </h1> <p> ${escaparHTMLLivroNotas( turma.nome )} </p> </div> </div> <main class="secaoApp"> <section class="card textoEsquerda"> <div style=" display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; " > <div> <h2>📊 Visão geral</h2> <p> Acompanhe as avaliações e as médias provisórias da turma. </p> </div> <div class="acoes"> <button type="button" onclick="abrirAvaliacoesTurma(${indexTurma})" > <span class="material-icons-round"> assignment </span> Gerenciar avaliações </button> </div> </div> <div style=" display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:14px; margin-top:20px; " > <div class="card"> <strong> 👨‍🎓 Alunos </strong> <div style=" font-size:1.7rem; font-weight:800; margin-top:8px; " > ${ turma.alunos.length } </div> </div> <div class="card"> <strong> 📝 Avaliações </strong> <div style=" font-size:1.7rem; font-weight:800; margin-top:8px; " > ${ avaliacoesOrdenadas.length } </div> </div> <div class="card"> <strong> 📊 Média da turma </strong> <div style=" font-size:1.7rem; font-weight:800; margin-top:8px; " > ${ mediaGeralTurma === null ? "—" : mediaGeralTurma.toFixed(1).replace(".", ",") } </div> </div> <div class="card"> <strong> ✅ Notas lançadas </strong> <div style=" font-size:1.7rem; font-weight:800; margin-top:8px; " > ${percentualPreenchimento}% </div> </div> </div> </section> `;

  if (turma.alunos.length === 0) {
    html += ` <section class="card"> ${criarMensagemVazia({ titulo: "Nenhum aluno cadastrado", descricao: "Cadastre os alunos desta turma para visualizar o Livro de Notas.", icone: "person_off", acao: criarBotao({ texto: "Cadastrar alunos", icone: "person_add", classe: "btnAzul", onclick: `abrirDetalhesTurma(${indexTurma})`, }), })} </section> `;
  } else if (avaliacoesOrdenadas.length === 0) {
    html += ` <section class="card"> ${criarMensagemVazia({ titulo: "Nenhuma avaliação cadastrada", descricao: "Crie uma avaliação para iniciar o Livro de Notas.", icone: "assignment_add", acao: criarBotao({ texto: "Criar avaliação", icone: "add_task", classe: "btnAzul", onclick: `abrirAvaliacoesTurma(${indexTurma})`, }), })} </section> `;
  } else {
    html += ` <section class="painel"> <div class="painelBlocoCabecalho"> <div> <h2>📋 Notas da turma</h2> <p> Toque no nome de uma avaliação para lançar ou editar notas. </p> </div> </div> <div style=" width:100%; overflow-x:auto; padding-bottom:10px; " > <table style=" width:100%; min-width:${ 350 + avaliacoesOrdenadas.length * 135 }px; border-collapse:separate; border-spacing:0; " > <thead> <tr> <th style=" position:sticky; left:0; z-index:3; background:var(--card); padding:14px; text-align:left; border-bottom:1px solid var(--borda); min-width:190px; " > Aluno </th> `;

    avaliacoesOrdenadas.forEach((item) => {
      let avaliacao = item.avaliacao;

      let valorMaximo = obterNumeroLivroNotas(avaliacao.valor) || 0;

      html += ` <th style=" padding:12px; text-align:center; border-bottom:1px solid var(--borda); min-width:125px; " > <button type="button" onclick="abrirLancamentoNotas(${indexTurma},${ item.indexOriginal })" style=" border:none; background:transparent; color:var(--texto); padding:4px; font:inherit; cursor:pointer; width:100%; " > <strong> ${escaparHTMLLivroNotas( avaliacao.nome )} </strong> <small style=" display:block; margin-top:5px; opacity:.75; " > ${escaparHTMLLivroNotas( avaliacao.bimestre || "Sem bimestre" )} <br> ${nomeTipoLivroNotas( avaliacao.tipo )} • ${valorMaximo} </small> </button> </th> `;
    });

    html += ` <th style=" padding:14px; text-align:center; border-bottom:1px solid var(--borda); min-width:100px; " > Média </th> <th style=" padding:14px; text-align:center; border-bottom:1px solid var(--borda); min-width:120px; " > Lançamentos </th> </tr> </thead> <tbody> `;

    resultadosAlunos.forEach((resultado, indexAluno) => {
      let fundoLinha =
        indexAluno % 2 === 0 ? "transparent" : "rgba(127,127,127,.05)";

      html += ` <tr style=" background:${fundoLinha}; " > <td style=" position:sticky; left:0; z-index:2; background:var(--card); padding:14px; border-bottom:1px solid var(--borda); font-weight:700; " > 👨‍🎓 ${escaparHTMLLivroNotas( resultado.aluno )} </td> `;

      avaliacoesOrdenadas.forEach((item) => {
        let avaliacao = item.avaliacao;

        let possuiNota =
          avaliacao.notas &&
          typeof avaliacao.notas === "object" &&
          Object.prototype.hasOwnProperty.call(
            avaliacao.notas,
            resultado.aluno
          );

        let nota = possuiNota
          ? obterNumeroLivroNotas(avaliacao.notas[resultado.aluno])
          : null;

        let valorMaximo = obterNumeroLivroNotas(avaliacao.valor);

        let percentual =
          nota !== null && valorMaximo !== null && valorMaximo > 0
            ? (nota / valorMaximo) * 100
            : null;

        let iconeNota = "";

        if (percentual !== null) {
          if (percentual >= 70) {
            iconeNota = "🟢";
          } else if (percentual >= 50) {
            iconeNota = "🟡";
          } else {
            iconeNota = "🔴";
          }
        }

        html += ` <td style=" padding:14px; text-align:center; border-bottom:1px solid var(--borda); " > ${ nota === null ? ` <span style="opacity:.55;"> — </span> ` : ` <strong> ${iconeNota} ${formatarNotaLivroNotas( nota )} </strong> <small style=" display:block; margin-top:4px; opacity:.65; " > de ${formatarNotaLivroNotas( valorMaximo )} </small> ` } </td> `;
      });

      let corMedia = "";

      if (resultado.mediaDez !== null) {
        if (resultado.mediaDez >= 7) {
          corMedia = "🟢";
        } else if (resultado.mediaDez >= 5) {
          corMedia = "🟡";
        } else {
          corMedia = "🔴";
        }
      }

      html += ` <td style=" padding:14px; text-align:center; border-bottom:1px solid var(--borda); font-size:1.05rem; " > <strong> ${ resultado.mediaDez === null ? "—" : ` ${corMedia} ${resultado.mediaDez.toFixed(1).replace(".", ",")} ` } </strong> </td> <td style=" padding:14px; text-align:center; border-bottom:1px solid var(--borda); " > ${ resultado.quantidadeNotas } de ${avaliacoesOrdenadas.length} </td> </tr> `;
    });

    html += ` </tbody> </table> </div> </section> <section class="card textoEsquerda"> <h2>📈 Resumo das médias</h2> <div style=" display:grid; grid-template-columns:repeat(auto-fit,minmax(170px,1fr)); gap:14px; margin-top:18px; " > <div class="card"> <strong> 🏆 Maior média </strong> <p style=" font-size:1.5rem; font-weight:800; margin-bottom:0; " > ${ melhorMediaTurma === null ? "—" : melhorMediaTurma.toFixed(1).replace(".", ",") } </p> </div> <div class="card"> <strong> 📊 Média geral </strong> <p style=" font-size:1.5rem; font-weight:800; margin-bottom:0; " > ${ mediaGeralTurma === null ? "—" : mediaGeralTurma.toFixed(1).replace(".", ",") } </p> </div> <div class="card"> <strong> ⚠️ Menor média </strong> <p style=" font-size:1.5rem; font-weight:800; margin-bottom:0; " > ${ menorMediaTurma === null ? "—" : menorMediaTurma.toFixed(1).replace(".", ",") } </p> </div> </div> <p style=" margin-top:18px; opacity:.75; " > As médias são provisórias e calculadas proporcionalmente ao valor máximo de cada avaliação. </p> </section> `;
  }

  html += ` <div class="acoes"> <button class="btnAzul" type="button" onclick="abrirDetalhesTurma(${indexTurma})" > <span class="material-icons-round"> arrow_back </span> Voltar para a turma </button> </div> </main> `;

  document.body.innerHTML = html + barraInferior();

  aplicarTemaSalvo();
}

function abrirLancamentoNotasLegadoAvaliacoes(indexTurma, indexAvaliacao) {
  let turmas = obterTurmasSalvas();

  if (!Array.isArray(turmas)) {
    return;
  }

  let turma = turmas[indexTurma];

  if (
    !turma ||
    !Array.isArray(turma.avaliacoes) ||
    !turma.avaliacoes[indexAvaliacao]
  ) {
    return;
  }

  let avaliacao = turma.avaliacoes[indexAvaliacao];

  if (!Array.isArray(turma.alunos)) {
    turma.alunos = [];
  }

  if (!avaliacao.notas || typeof avaliacao.notas !== "object") {
    avaliacao.notas = {};
  }

  salvarTurmasAvaliacoes(turmas);

  function escaparHTML(texto) {
    return String(texto ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function nomeTipo(tipo) {
    if (tipo === "atividade") {
      return "Atividade";
    }

    if (tipo === "trabalho") {
      return "Trabalho";
    }

    if (tipo === "prova") {
      return "Prova";
    }

    return "Avaliação";
  }

  let valorAvaliacao = parseFloat(avaliacao.valor) || 0;

  let html = ` <div class="cabecalhoTela"> <div> <h1> 📋 ${escaparHTML( avaliacao.nome )} </h1> <p> ${nomeTipo(avaliacao.tipo)} • ${escaparHTML( avaliacao.bimestre )} • Valor máximo: ${valorAvaliacao} </p> </div> </div> <main class="secaoApp"> <section class="painel"> <div class="painelBlocoCabecalho"> <div> <h2>👨‍🎓 Notas dos alunos</h2> <p> Digite as notas e salve as alterações. </p> </div> </div> <div id="listaNotasTurma"> `;

  if (turma.alunos.length === 0) {
    html += criarMensagemVazia({
      titulo: "Nenhum aluno cadastrado",

      descricao: "Cadastre os alunos da turma antes de lançar as notas.",

      icone: "person_off",
    });
  } else {
    turma.alunos.forEach((aluno, indexAluno) => {
      let possuiNota = Object.prototype.hasOwnProperty.call(
        avaliacao.notas,
        aluno
      );

      let notaAtual = possuiNota ? avaliacao.notas[aluno] : "";

      html += ` <div class="card textoEsquerda"> <div class="grupoCampo"> <label for="notaAluno_${indexAluno}"> 👨‍🎓 ${escaparHTML( aluno )} </label> <input type="number" step="0.1" max="${valorAvaliacao}" min="0" value="${notaAtual}" id="notaAluno_${indexAluno}" data-index-aluno="${indexAluno}" placeholder="Nota de 0 a ${valorAvaliacao}" inputmode="decimal" > </div> </div> `;
    });
  }

  html += ` </div> </section> <div class="acoes"> ${ turma.alunos.length > 0 ? ` <button class="btnVerde" type="button" onclick="salvarNotasTurma(${indexTurma},${indexAvaliacao})" > <span class="material-icons-round"> save </span> Salvar notas </button> ` : "" } <button class="btnAzul" type="button" onclick="abrirAvaliacoesTurma(${indexTurma})" > <span class="material-icons-round"> arrow_back </span> Voltar </button> </div> </main> `;

  document.body.innerHTML = html + barraInferior();

  aplicarTemaSalvo();
}

function salvarNotasTurmaLegadoAvaliacoes(indexTurma, indexAvaliacao) {
  let turmas = obterTurmasSalvas();

  if (!Array.isArray(turmas)) {
    return;
  }

  let turma = turmas[indexTurma];

  if (
    !turma ||
    !Array.isArray(turma.avaliacoes) ||
    !turma.avaliacoes[indexAvaliacao]
  ) {
    return;
  }

  let avaliacao = turma.avaliacoes[indexAvaliacao];

  if (!Array.isArray(turma.alunos)) {
    turma.alunos = [];
  }

  if (!avaliacao.notas || typeof avaliacao.notas !== "object") {
    avaliacao.notas = {};
  }

  /* Remove notas pertencentes a alunos que não fazem mais parte da turma. */

  let alunosAtuais = new Set(turma.alunos.map((aluno) => String(aluno)));

  Object.keys(avaliacao.notas).forEach((nomeAluno) => {
    if (!alunosAtuais.has(nomeAluno)) {
      delete avaliacao.notas[nomeAluno];
    }
  });

  let valorMaximo = parseFloat(avaliacao.valor) || 0;

  let notasInvalidas = [];

  turma.alunos.forEach((aluno, indexAluno) => {
    let campo = document.getElementById("notaAluno_" + indexAluno);

    if (!campo) {
      return;
    }

    let texto = String(campo.value || "")
      .trim()
      .replace(",", ".");

    if (texto === "") {
      delete avaliacao.notas[aluno];

      return;
    }

    let nota = parseFloat(texto);

    if (!Number.isFinite(nota) || nota < 0 || nota > valorMaximo) {
      notasInvalidas.push(aluno);

      return;
    }

    avaliacao.notas[aluno] = parseFloat(nota.toFixed(2));
  });

  if (notasInvalidas.length > 0) {
    let nomes = notasInvalidas.slice(0, 3).join(", ");

    let complemento =
      notasInvalidas.length > 3 ? ` e mais ${notasInvalidas.length - 3}` : "";

    mostrarAlerta({
      titulo: "Notas inválidas",
      mensagem: `Verifique as notas de: ${nomes}${complemento}. As notas devem ficar entre 0 e ${valorMaximo}.`,
      icone: "warning",
    });

    return;
  }

  salvarTurmasAvaliacoes(turmas);

  if (typeof mostrarToast === "function") {
    mostrarToast("✅ Notas salvas.");
  } else {
    mostrarAlerta({
      titulo: "Notas salvas",
      mensagem: "As notas dos alunos foram salvas com sucesso.",
      icone: "check_circle",
    });
  }

  abrirAvaliacoesTurma(indexTurma);
}

function excluirAvaliacaoLegadoAvaliacoes(indexTurma, indexAvaliacao) {
  let turmas = obterTurmasSalvas();

  if (!Array.isArray(turmas)) {
    return;
  }

  let turma = turmas[indexTurma];

  if (
    !turma ||
    !Array.isArray(turma.avaliacoes) ||
    !turma.avaliacoes[indexAvaliacao]
  ) {
    return;
  }

  let avaliacao = turma.avaliacoes[indexAvaliacao];

  mostrarConfirmacao({
    titulo: "Excluir avaliação",

    mensagem: `Deseja excluir a avaliação "${avaliacao.nome || "Sem nome"}"?`,

    icone: "delete",

    textoConfirmar: "Continuar",

    textoCancelar: "Cancelar",

    classeConfirmar: "btnVermelho",

    aoConfirmar: function () {
      mostrarConfirmacao({
        titulo: "Confirmar exclusão",

        mensagem:
          "Todas as notas e todos os registros do Controle de Atividades desta avaliação também serão excluídos. Essa ação não poderá ser desfeita.",

        icone: "warning",

        textoConfirmar: "Excluir definitivamente",

        textoCancelar: "Voltar",

        classeConfirmar: "btnVermelho",

        aoConfirmar: function () {
          turma.avaliacoes.splice(indexAvaliacao, 1);

          salvarTurmasAvaliacoes(turmas);

          let chaveOrdenacao =
            "ordenacaoAtividade_" + indexTurma + "_" + indexAvaliacao;

          removerDados(chaveOrdenacao);

          if (typeof mostrarToast === "function") {
            mostrarToast("🗑 Avaliação excluída.");
          }

          abrirAvaliacoesTurma(indexTurma);
        },
      });
    },
  });
}

function alternarAtividadeLegadoAvaliacoes( indexTurma, indexAvaliacao, aluno, exercicio ) {
  indexTurma = Number(indexTurma);

  indexAvaliacao = Number(indexAvaliacao);

  exercicio = Number(exercicio);

  let turmas = obterTurmasSalvas();

  if (!Array.isArray(turmas)) {
    turmas = [];
  }

  if (
    !Number.isInteger(indexTurma) ||
    indexTurma < 0 ||
    indexTurma >= turmas.length
  ) {
    console.warn("Índice de turma inválido:", indexTurma);

    return;
  }

  if (
    !Number.isInteger(indexTurma) ||
    indexTurma < 0 ||
    indexTurma >= turmas.length
  ) {
    console.warn("Índice de turma inválido:", indexTurma);

    return;
  }

  let turma = turmas[indexTurma];

  if (
    !Array.isArray(turma.avaliacoes) ||
    !Number.isInteger(indexAvaliacao) ||
    indexAvaliacao < 0 ||
    indexAvaliacao >= turma.avaliacoes.length
  ) {
    console.warn("Índice de avaliação inválido:", indexAvaliacao);

    return;
  }

  let avaliacao = turma.avaliacoes[indexAvaliacao];

  if (typeof aluno !== "string" || aluno.trim() === "") {
    console.warn("Aluno inválido:", aluno);

    return;
  }

  if (!Number.isInteger(exercicio) || exercicio < 1) {
    console.warn("Número de exercício inválido:", exercicio);

    return;
  }

  if (
    !avaliacao.controleAtividades ||
    typeof avaliacao.controleAtividades !== "object"
  ) {
    avaliacao.controleAtividades = {
      quantidade: exercicio,
      valor: 10,
      registros: {},
    };
  }

  if (
    !avaliacao.controleAtividades.registros ||
    typeof avaliacao.controleAtividades.registros !== "object" ||
    Array.isArray(avaliacao.controleAtividades.registros)
  ) {
    avaliacao.controleAtividades.registros = {};
  }

  if (
    !avaliacao.controleAtividades.registros[aluno] ||
    typeof avaliacao.controleAtividades.registros[aluno] !== "object"
  ) {
    avaliacao.controleAtividades.registros[aluno] = {};
  }

  avaliacao.controleAtividades.registros[aluno][exercicio] = !Boolean(
    avaliacao.controleAtividades.registros[aluno][exercicio]
  );

  recalcularNotasAtividade(avaliacao, turma);

  salvarTurmasAvaliacoes(turmas);

  abrirControleAtividades(indexTurma, indexAvaliacao);
}

function recalcularNotasAtividadeLegadoAvaliacoes(avaliacao, turma) {
  if (!avaliacao || !turma) {
    return;
  }

  if (!avaliacao.notas || typeof avaliacao.notas !== "object") {
    avaliacao.notas = {};
  }

  if (
    !avaliacao.controleAtividades ||
    typeof avaliacao.controleAtividades !== "object"
  ) {
    avaliacao.controleAtividades = {
      quantidadeExercicios: 1,

      registros: {},

      exercicios: [],
    };
  }

  if (
    !avaliacao.controleAtividades.registros ||
    typeof avaliacao.controleAtividades.registros !== "object"
  ) {
    avaliacao.controleAtividades.registros = {};
  }

  let quantidade = parseInt(
    avaliacao.controleAtividades.quantidadeExercicios,
    10
  );

  if (!Number.isInteger(quantidade) || quantidade < 1) {
    quantidade = 1;

    avaliacao.controleAtividades.quantidadeExercicios = 1;
  }

  let valor = parseFloat(avaliacao.valor);

  if (!Number.isFinite(valor) || valor < 0) {
    valor = 0;
  }

  let alunos = Array.isArray(turma.alunos) ? turma.alunos : [];

  alunos.forEach((aluno) => {
    let registros = avaliacao.controleAtividades.registros[aluno];

    if (!registros || typeof registros !== "object") {
      registros = {};
    }

    let feitos = 0;

    for (let numero = 1; numero <= quantidade; numero++) {
      if (registros[numero] === true) {
        feitos++;
      }
    }

    let nota = quantidade > 0 ? (feitos / quantidade) * valor : 0;

    avaliacao.notas[aluno] = Number(nota.toFixed(2));
  });
}

function abrirControleAtividadesHome() {
  let turmas = obterTurmasSalvas();

  if (!Array.isArray(turmas)) {
    turmas = [];
  }

  function escaparHtml(texto) {
    return String(texto ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  let html = ` <h1>📋 Controle de Atividades</h1> <p>Selecione a turma:</p> `;

  if (turmas.length === 0) {
    html += ` <div class="card"> <p>Nenhuma turma cadastrada.</p> <button onclick="abrirTurmas()"> ➕ Cadastrar turma </button> </div> `;
  } else {
    turmas.forEach((turma, index) => {
      const nomeTurma = escaparHtml(turma?.nome || `Turma ${index + 1}`);

      html += ` <button onclick="abrirListaAtividadesControle(${index})"> 📚 ${nomeTurma} </button> <br><br> `;
    });
  }

  html += ` <button onclick="voltarHome()"> ⬅ Voltar </button> `;

  document.body.innerHTML =
    html + (typeof barraInferior === "function" ? barraInferior() : "");

  if (typeof aplicarTemaSalvo === "function") {
    aplicarTemaSalvo();
  }
}

function abrirListaAtividadesControle(indexTurma) {
  let turmas = obterTurmasSalvas();

  if (!Array.isArray(turmas)) {
    turmas = [];
  }

  const indiceTurma = Number(indexTurma);

  if (
    !Number.isInteger(indiceTurma) ||
    indiceTurma < 0 ||
    indiceTurma >= turmas.length
  ) {
    if (typeof mostrarToast === "function") {
      mostrarToast("⚠️ Turma não encontrada.");
    } else {
      mostrarAlerta({
        titulo: "Turma não encontrada",
        mensagem: "A turma selecionada não foi encontrada.",
        icone: "error",
      });
    }

    abrirControleAtividadesHome();

    return;
  }

  const turma = turmas[indiceTurma];

  function escaparHtml(texto) {
    return String(texto ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  const nomeTurma = escaparHtml(turma.nome || `Turma ${indiceTurma + 1}`);

  const avaliacoes = Array.isArray(turma.avaliacoes) ? turma.avaliacoes : [];

  const atividades = avaliacoes
    .map((avaliacao, indexOriginal) => ({
      avaliacao,
      indexOriginal,
    }))
    .filter((item) => item.avaliacao && item.avaliacao.tipo === "atividade");

  let html = ` <h1>📋 Controle de Atividades</h1> <h2>📚 ${nomeTurma}</h2> <p> Escolha uma atividade ${ atividades.length > 0 ? `(${atividades.length} cadastrada${atividades.length === 1 ? "" : "s"})` : "" }: </p> `;

  if (atividades.length === 0) {
    html += ` <div class="card"> <p> Nenhuma atividade cadastrada ainda. </p> <p> Crie uma avaliação do tipo <strong>atividade</strong> em Turmas → Avaliações. </p> </div> `;
  } else {
    atividades.forEach((item) => {
      const avaliacao = item.avaliacao;

      const indexAvaliacao = item.indexOriginal;

      const nomeAvaliacao = escaparHtml(
        avaliacao.nome || `Atividade ${indexAvaliacao + 1}`
      );

      const bimestre = escaparHtml(avaliacao.bimestre || "Sem bimestre");

      const valorNumerico = Number(avaliacao.valor);

      const valorExibido = Number.isFinite(valorNumerico)
        ? valorNumerico.toLocaleString("pt-BR", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          })
        : "Não informado";

      html += ` <div class="card"> <h3> 📝 ${nomeAvaliacao} </h3> <p> 📅 ${bimestre} </p> <p> ⭐ Valor atual: ${valorExibido} </p> <button type="button" onclick="abrirControleAtividades(${indiceTurma},${indexAvaliacao})" > 📋 Abrir planilha </button> </div> `;
    });
  }

  html += ` <button type="button" onclick="abrirControleAtividadesHome()" > ⬅ Voltar </button> `;

  const rodape = typeof barraInferior === "function" ? barraInferior() : "";

  document.body.innerHTML = html + rodape;

  if (typeof aplicarTemaSalvo === "function") {
    aplicarTemaSalvo();
  }
}

function abrirControleAtividadesLegadoAvaliacoes(indexTurma, indexAvaliacao) {
  indexTurma = Number(indexTurma);

  indexAvaliacao = Number(indexAvaliacao);

  let turmas = obterTurmasSalvas();

  if (!Array.isArray(turmas)) {
    turmas = [];
  }

  if (
    !Number.isInteger(indexTurma) ||
    indexTurma < 0 ||
    indexTurma >= turmas.length
  ) {
    abrirControleAtividadesHome();

    return;
  }

  if (
    !Number.isInteger(indexTurma) ||
    indexTurma < 0 ||
    indexTurma >= turmas.length
  ) {
    abrirControleAtividadesHome();

    return;
  }

  let turma = turmas[indexTurma];

  if (!Array.isArray(turma.alunos)) {
    turma.alunos = [];
  }

  if (
    !Array.isArray(turma.avaliacoes) ||
    !Number.isInteger(indexAvaliacao) ||
    indexAvaliacao < 0 ||
    indexAvaliacao >= turma.avaliacoes.length
  ) {
    abrirListaAtividadesControle(indexTurma);

    return;
  }

  let avaliacao = turma.avaliacoes[indexAvaliacao];

  if (
    !avaliacao.controleAtividades ||
    typeof avaliacao.controleAtividades !== "object"
  ) {
    avaliacao.controleAtividades = {
      quantidadeExercicios: 10,

      registros: {},

      exercicios: [],
    };
  }

  if (
    !avaliacao.controleAtividades.registros ||
    typeof avaliacao.controleAtividades.registros !== "object"
  ) {
    avaliacao.controleAtividades.registros = {};
  }

  if (!Array.isArray(avaliacao.controleAtividades.exercicios)) {
    avaliacao.controleAtividades.exercicios = [];
  }

  if (!avaliacao.notas || typeof avaliacao.notas !== "object") {
    avaliacao.notas = {};
  }

  let quantidade = parseInt(
    avaliacao.controleAtividades.quantidadeExercicios,
    10
  );

  if (!Number.isInteger(quantidade) || quantidade < 1) {
    quantidade = 10;
  }

  avaliacao.controleAtividades.quantidadeExercicios = quantidade;

  /* Remove registros de exercícios que estão acima da quantidade atual. Exemplo: A atividade tinha 15 exercícios e passou a ter 10. Os registros 11 a 15 não devem continuar afetando a nota. */

  Object.keys(avaliacao.controleAtividades.registros).forEach((nomeAluno) => {
    let registrosAluno = avaliacao.controleAtividades.registros[nomeAluno];

    if (!registrosAluno || typeof registrosAluno !== "object") {
      avaliacao.controleAtividades.registros[nomeAluno] = {};

      return;
    }

    Object.keys(registrosAluno).forEach((numero) => {
      let numeroExercicio = parseInt(numero, 10);

      if (
        !Number.isInteger(numeroExercicio) ||
        numeroExercicio < 1 ||
        numeroExercicio > quantidade
      ) {
        delete registrosAluno[numero];
      }
    });
  });

  /* Remove registros de alunos que não existem mais na turma. */

  let alunosAtuais = new Set(turma.alunos);

  Object.keys(avaliacao.controleAtividades.registros).forEach((nomeAluno) => {
    if (!alunosAtuais.has(nomeAluno)) {
      delete avaliacao.controleAtividades.registros[nomeAluno];
    }
  });

  /* Recalcula as notas considerando somente os exercícios atualmente existentes. */

  let valorAvaliacao = parseFloat(avaliacao.valor);

  if (!Number.isFinite(valorAvaliacao) || valorAvaliacao < 0) {
    valorAvaliacao = 0;
  }

  turma.alunos.forEach((aluno) => {
    let registros = avaliacao.controleAtividades.registros[aluno] || {};

    let feitos = 0;

    for (let numero = 1; numero <= quantidade; numero++) {
      if (registros[numero] === true) {
        feitos++;
      }
    }

    let nota = quantidade > 0 ? (feitos / quantidade) * valorAvaliacao : 0;

    avaliacao.notas[aluno] = parseFloat(nota.toFixed(2));
  });

  let chaveOrdenacao =
    "ordenacaoAtividade_" + indexTurma + "_" + indexAvaliacao;

  let ordenacoesValidas = ["nome", "nota", "percentual", "pendencias"];

  let ordenacaoAtual = localStorage.getItem(chaveOrdenacao) || "nome";

  if (!ordenacoesValidas.includes(ordenacaoAtual)) {
    ordenacaoAtual = "nome";

    localStorage.setItem(chaveOrdenacao, ordenacaoAtual);
  }

  function escaparHTML(texto) {
    return String(texto ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalizarBusca(texto) {
    return String(texto || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR")
      .trim();
  }

  function contarFeitos(aluno) {
    let registros = avaliacao.controleAtividades.registros[aluno] || {};

    let feitos = 0;

    for (let numero = 1; numero <= quantidade; numero++) {
      if (registros[numero] === true) {
        feitos++;
      }
    }

    return feitos;
  }

  let totalAlunos = turma.alunos.length;

  let concluidos = 0;
  let emAndamento = 0;
  let naoIniciaram = 0;
  let somaNotas = 0;

  turma.alunos.forEach((aluno) => {
    let feitos = contarFeitos(aluno);

    let nota = parseFloat(avaliacao.notas[aluno]);

    if (!Number.isFinite(nota)) {
      nota = 0;
    }

    somaNotas += nota;

    if (feitos === 0) {
      naoIniciaram++;
    } else if (feitos >= quantidade) {
      concluidos++;
    } else {
      emAndamento++;
    }
  });

  let mediaAtividade = totalAlunos > 0 ? somaNotas / totalAlunos : 0;

  let percentualConclusao =
    totalAlunos > 0 ? Math.round((concluidos / totalAlunos) * 100) : 0;

  let ranking = turma.alunos.map((aluno) => ({
    nome: aluno,

    nota: Number.isFinite(parseFloat(avaliacao.notas[aluno]))
      ? parseFloat(avaliacao.notas[aluno])
      : 0,

    feitos: contarFeitos(aluno),
  }));

  ranking.sort((a, b) => {
    if (b.nota !== a.nota) {
      return b.nota - a.nota;
    }

    if (b.feitos !== a.feitos) {
      return b.feitos - a.feitos;
    }

    return a.nome.localeCompare(b.nome, "pt-BR", {
      sensitivity: "base",
    });
  });

  let alunosOrdenados = [...turma.alunos];

  alunosOrdenados.sort((a, b) => {
    let feitosA = contarFeitos(a);

    let feitosB = contarFeitos(b);

    let notaA = parseFloat(avaliacao.notas[a]);

    let notaB = parseFloat(avaliacao.notas[b]);

    if (!Number.isFinite(notaA)) {
      notaA = 0;
    }

    if (!Number.isFinite(notaB)) {
      notaB = 0;
    }

    let percentualA = quantidade > 0 ? (feitosA / quantidade) * 100 : 0;

    let percentualB = quantidade > 0 ? (feitosB / quantidade) * 100 : 0;

    let pendenciasA = quantidade - feitosA;

    let pendenciasB = quantidade - feitosB;

    if (ordenacaoAtual === "nota") {
      if (notaB !== notaA) {
        return notaB - notaA;
      }
    }

    if (ordenacaoAtual === "percentual") {
      if (percentualB !== percentualA) {
        return percentualB - percentualA;
      }
    }

    if (ordenacaoAtual === "pendencias") {
      if (pendenciasB !== pendenciasA) {
        return pendenciasB - pendenciasA;
      }
    }

    return a.localeCompare(b, "pt-BR", {
      sensitivity: "base",
    });
  });

  salvarTurmasAvaliacoes(turmas);

  let nomeAvaliacaoSeguro = escaparHTML(avaliacao.nome || "Atividade sem nome");

  let nomeTurmaSeguro = escaparHTML(turma.nome || "Turma sem nome");

  let html = ` <div class="cabecalhoTela"> <div> <h1> 📋 ${nomeAvaliacaoSeguro} </h1> <p> 📚 ${nomeTurmaSeguro} • ${quantidade} exercício(s) • Valor ${valorAvaliacao.toLocaleString( "pt-BR", { maximumFractionDigits: 2 } )} </p> </div> </div> <main class="secaoApp"> <section class="painel"> <div class="painelBlocoCabecalho"> <div> <h2>📊 Estatísticas da atividade</h2> <p> Acompanhe a realização dos exercícios e o desempenho dos alunos. </p> </div> </div> <div style=" display:grid; grid-template-columns: repeat(auto-fit,minmax(150px,1fr)); gap:15px; "> <div class="card"> <h2>👨‍🎓</h2> <h3>${totalAlunos}</h3> <p>Alunos</p> </div> <div class="card"> <h2>✅</h2> <h3>${concluidos}</h3> <p>Concluíram</p> </div> <div class="card"> <h2>🟡</h2> <h3>${emAndamento}</h3> <p>Em andamento</p> </div> <div class="card"> <h2>🔴</h2> <h3>${naoIniciaram}</h3> <p>Não iniciaram</p> </div> <div class="card"> <h2>📈</h2> <h3> ${mediaAtividade.toFixed( 1 )} </h3> <p>Média da turma</p> </div> </div> <div class="card textoEsquerda"> <label for="buscaAlunoAtividade"> <strong> 🔍 Pesquisar aluno </strong> </label> <input id="buscaAlunoAtividade" type="search" placeholder="Digite o nome do aluno..." autocomplete="off" > </div> <div class="card textoEsquerda"> <label for="ordenacaoAtividade"> <strong> 📋 Ordenar por </strong> </label> <select id="ordenacaoAtividade"> <option value="nome" ${ ordenacaoAtual === "nome" ? "selected" : "" } > Nome </option> <option value="nota" ${ ordenacaoAtual === "nota" ? "selected" : "" } > Maior nota </option> <option value="percentual" ${ ordenacaoAtual === "percentual" ? "selected" : "" } > Maior conclusão </option> <option value="pendencias" ${ ordenacaoAtual === "pendencias" ? "selected" : "" } > Mais pendências </option> </select> </div> <div class="card textoEsquerda"> <div style=" width:100%; height:18px; background:var(--borda); border-radius:999px; overflow:hidden; "> <div style=" width:${percentualConclusao}%; height:100%; background:var(--sucesso); transition:width .3s ease; "> </div> </div> <p> <strong> ${percentualConclusao}% dos alunos concluíram todos os exercícios. </strong> </p> </div> </section> <section class="card textoEsquerda"> <h2>🏆 Ranking da atividade</h2> `;

  if (ranking.length === 0) {
    html += criarMensagemVazia({
      titulo: "Nenhum aluno cadastrado",

      descricao:
        "Cadastre alunos nesta turma para visualizar o ranking e a planilha.",

      icone: "person_off",
    });
  } else {
    html += ` <div style=" width:100%; overflow:auto; "> <table style=" width:100%; border-collapse:collapse; "> <thead> <tr> <th>Posição</th> <th>Aluno</th> <th>Feitos</th> <th>Nota</th> </tr> </thead> <tbody> `;

    ranking.forEach((aluno, posicao) => {
      let medalha =
        posicao === 0
          ? "🥇"
          : posicao === 1
          ? "🥈"
          : posicao === 2
          ? "🥉"
          : posicao + 1 + "º";

      html += ` <tr> <td> ${medalha} </td> <td> ${escaparHTML( aluno.nome )} </td> <td> ${ aluno.feitos }/${quantidade} </td> <td> ${aluno.nota.toFixed(1)} </td> </tr> `;
    });

    html += ` </tbody> </table> </div> `;
  }

  html += ` </section> <section class="card textoEsquerda"> <h2>⚙️ Configurações da atividade</h2> <div class="grupoCampo"> <label for="valorAtividadeControle"> Valor da atividade </label> <input id="valorAtividadeControle" type="number" min="0.1" step="0.1" value="${valorAvaliacao}" inputmode="decimal" > </div> <div class="acoes"> <button id="salvarValorAtividade" class="btnVerde" type="button" > <span class="material-icons-round"> save </span> Salvar valor </button> </div> <div class="grupoCampo"> <label for="quantidadeExercicios"> Quantidade de exercícios </label> <input id="quantidadeExercicios" type="number" min="1" step="1" value="${quantidade}" inputmode="numeric" > </div> <div class="acoes"> <button id="salvarQuantidadeAtividade" class="btnAzul" type="button" > <span class="material-icons-round"> library_add </span> Atualizar exercícios </button> <button id="adicionarExercicioAtividade" class="btnAzul" type="button" > <span class="material-icons-round"> add </span> Novo exercício </button> <button id="excluirExercicioAtividade" class="btnVermelho" type="button" > <span class="material-icons-round"> delete </span> Excluir último </button> <button id="abrirPendenciasAtividadeBotao" class="btnLaranja" type="button" > <span class="material-icons-round"> warning </span> Pendências </button> </div> </section> <section class="painel"> <div class="painelBlocoCabecalho"> <div> <h2>📋 Planilha de exercícios</h2> <p> Toque em uma célula para marcar ou desmarcar o exercício. </p> </div> </div> <div style=" overflow:auto; width:100%; "> <table class="tabelaAtividades"> <thead> <tr> <th class="colAluno"> Aluno </th> `;

  for (let numero = 1; numero <= quantidade; numero++) {
    let exercicio = avaliacao.controleAtividades.exercicios[numero] || {};

    html += ` <th class="colExercicio"> <button type="button" class="btnExercicio editarExercicioAtividade" data-exercicio="${numero}" aria-label="Editar exercício ${numero}" > <div class="numeroExercicio"> 📘 ${numero} </div> <div class="nomeExercicio"> ${escaparHTML( exercicio.nome || "Clique para editar" )} </div> <div class="dataExercicio"> ${escaparHTML( exercicio.data || "" )} </div> </button> </th> `;
  }

  html += ` <th class="colResumo"> % </th> <th class="colResumo"> Nota </th> </tr> </thead> <tbody id="corpoTabelaAtividades"> `;

  alunosOrdenados.forEach((aluno, indexAlunoOrdenado) => {
    let registrosAluno = avaliacao.controleAtividades.registros[aluno] || {};

    let feitosAluno = contarFeitos(aluno);

    let classeLinha = "";

    if (feitosAluno === 0) {
      classeLinha = "linhaNaoIniciou";
    } else if (feitosAluno >= quantidade) {
      classeLinha = "linhaConcluida";
    } else {
      classeLinha = "linhaEmAndamento";
    }

    let percentual =
      quantidade > 0 ? Math.round((feitosAluno / quantidade) * 100) : 0;

    let nota = parseFloat(avaliacao.notas[aluno]);

    if (!Number.isFinite(nota)) {
      nota = 0;
    }

    html += ` <tr class="linhaAlunoAtividade ${classeLinha}" data-index-aluno="${indexAlunoOrdenado}" data-aluno="${escaparHTML( normalizarBusca(aluno) )}" > <td class="nomeAlunoTabela abrirPainelAlunoAtividadeBotao" data-index-aluno="${indexAlunoOrdenado}" tabindex="0" role="button" aria-label="Abrir painel de ${escaparHTML( aluno )}" > ${escaparHTML(aluno)} </td> `;

    for (let numero = 1; numero <= quantidade; numero++) {
      let feito = registrosAluno[numero] === true;

      html += ` <td class="${ feito ? "celulaFeita" : "celulaPendente" } alternarAtividadeCelula" data-index-aluno="${indexAlunoOrdenado}" data-exercicio="${numero}" tabindex="0" role="button" aria-label="${ feito ? "Desmarcar" : "Marcar" } exercício ${numero} de ${escaparHTML(aluno)}" > ${ feito ? "+" : "" } </td> `;
    }

    html += ` <td class="resumoTabela"> ${percentual}% </td> <td class="resumoTabela"> ${nota.toFixed( 1 )} </td> </tr> `;
  });

  if (alunosOrdenados.length === 0) {
    html += ` <tr> <td colspan="${ quantidade + 3 }" style=" padding:30px; text-align:center; " > Nenhum aluno cadastrado nesta turma. </td> </tr> `;
  }

  html += ` </tbody> </table> </div> </section> <div class="acoes"> <button class="btnAzul" type="button" onclick="abrirListaAtividadesControle(${indexTurma})" > <span class="material-icons-round"> arrow_back </span> Voltar </button> </div> </main> `;

  const barra = typeof barraInferior === "function" ? barraInferior() : "";

  document.body.innerHTML = html + barra;

  if (typeof aplicarTemaSalvo === "function") {
    aplicarTemaSalvo();
  }

  const campoBusca = document.getElementById("buscaAlunoAtividade");

  const campoOrdenacao = document.getElementById("ordenacaoAtividade");

  const botaoSalvarValor = document.getElementById("salvarValorAtividade");

  const botaoSalvarQuantidade = document.getElementById(
    "salvarQuantidadeAtividade"
  );

  const botaoAdicionarExercicio = document.getElementById(
    "adicionarExercicioAtividade"
  );

  const botaoExcluirExercicio = document.getElementById(
    "excluirExercicioAtividade"
  );

  const botaoPendencias = document.getElementById(
    "abrirPendenciasAtividadeBotao"
  );

  campoBusca.addEventListener("input", function () {
    let busca = normalizarBusca(campoBusca.value);

    let linhas = document.querySelectorAll(".linhaAlunoAtividade");

    linhas.forEach((linha) => {
      let nome = linha.dataset.aluno || "";

      linha.style.display = nome.includes(busca) ? "" : "none";
    });
  });

  campoOrdenacao.addEventListener("change", function () {
    localStorage.setItem(chaveOrdenacao, campoOrdenacao.value);

    abrirControleAtividades(indexTurma, indexAvaliacao);
  });

  botaoSalvarValor.addEventListener("click", function () {
    atualizarValorAtividadeControle(indexTurma, indexAvaliacao);
  });

  botaoSalvarQuantidade.addEventListener("click", function () {
    salvarQuantidadeExercicios(indexTurma, indexAvaliacao);
  });

  botaoAdicionarExercicio.addEventListener("click", function () {
    adicionarExercicioControle(indexTurma, indexAvaliacao);
  });

  botaoExcluirExercicio.addEventListener("click", function () {
    excluirUltimoExercicioControle(indexTurma, indexAvaliacao);
  });

  botaoPendencias.addEventListener("click", function () {
    abrirPendenciasAtividade(indexTurma, indexAvaliacao);
  });

  document.querySelectorAll(".editarExercicioAtividade").forEach((botao) => {
    botao.addEventListener("click", function () {
      let numero = parseInt(botao.dataset.exercicio, 10);

      if (!Number.isInteger(numero)) {
        return;
      }

      editarExercicio(indexTurma, indexAvaliacao, numero);
    });
  });

  function obterAlunoPeloIndiceOrdenado(indice) {
    if (indice < 0 || indice >= alunosOrdenados.length) {
      return null;
    }

    return alunosOrdenados[indice];
  }

  document
    .querySelectorAll(".abrirPainelAlunoAtividadeBotao")
    .forEach((celula) => {
      function abrirPainel() {
        let indice = parseInt(celula.dataset.indexAluno, 10);

        let aluno = obterAlunoPeloIndiceOrdenado(indice);

        if (aluno === null) {
          return;
        }

        abrirPainelAlunoAtividade(indexTurma, indexAvaliacao, aluno);
      }

      celula.addEventListener("click", abrirPainel);

      celula.addEventListener("keydown", function (evento) {
        if (evento.key === "Enter" || evento.key === " ") {
          evento.preventDefault();

          abrirPainel();
        }
      });
    });

  document.querySelectorAll(".alternarAtividadeCelula").forEach((celula) => {
    function alternar() {
      let indice = parseInt(celula.dataset.indexAluno, 10);

      let numero = parseInt(celula.dataset.exercicio, 10);

      let aluno = obterAlunoPeloIndiceOrdenado(indice);

      if (aluno === null || !Number.isInteger(numero)) {
        return;
      }

      alternarAtividade(indexTurma, indexAvaliacao, aluno, numero);
    }

    celula.addEventListener("click", alternar);

    celula.addEventListener("keydown", function (evento) {
      if (evento.key === "Enter" || evento.key === " ") {
        evento.preventDefault();

        alternar();
      }
    });
  });
}

function atualizarValorAtividadeControle(indexTurma, indexAvaliacao) {
  let turmas = obterTurmasSalvas();

  if (!Array.isArray(turmas)) {
    return;
  }

  let turma = turmas[indexTurma];
  let avaliacao = turma.avaliacoes[indexAvaliacao];

  let novoValor =
    parseFloat(
      document.getElementById("valorAtividadeControle").value.replace(",", ".")
    ) || 0;

  if (novoValor <= 0) {
    mostrarAlerta({
      titulo: "Valor inválido",
      mensagem: "Digite um valor maior que zero.",
      icone: "warning",
    });

    return;
  }

  avaliacao.valor = novoValor;

  recalcularNotasAtividade(avaliacao, turma);

  salvarTurmasAvaliacoes(turmas);

  mostrarToast("✅ Valor atualizado e notas recalculadas.");

  abrirControleAtividades(indexTurma, indexAvaliacao);
}

function abrirBoletimBimestralTurmaLegadoAvaliacoes(indexTurma) {
  let turmas = obterTurmasSalvas();
  let turma = turmas[indexTurma];

  document.body.innerHTML =
    ` <h1>📊 Boletim Bimestral</h1> <h2>📚 ${turma.nome}</h2> <select id="bimestreBoletim"> <option value="1B">1º Bimestre</option> <option value="2B">2º Bimestre</option> <option value="3B">3º Bimestre</option> <option value="4B">4º Bimestre</option> </select> <br><br> <div id="resultadoBoletimBimestral"></div> <button onclick="window.print()"> 📄 Imprimir / Salvar PDF </button> <button onclick="abrirDetalhesTurma(${indexTurma})"> ⬅ Voltar </button> ` +
    barraInferior();

  aplicarTemaSalvo();

  function renderizarBoletim() {
    let bimestre = document.getElementById("bimestreBoletim").value;

    let avaliacoes = (turma.avaliacoes || []).filter((av) => {
      return av.bimestre === bimestre;
    });

    avaliacoes.forEach((av) => {
      if (av.tipo === "atividade" && av.controleAtividades) {
        recalcularNotasAtividade(av, turma);
      }
    });

    let valorTotal = avaliacoes.reduce((soma, av) => {
      return soma + (parseFloat(av.valor) || 0);
    }, 0);

    let cabecalho = "";

    avaliacoes.forEach((av) => {
      cabecalho += ` <th> ${av.nome} <br> <small>${av.tipo} - ${av.valor}</small> </th> `;
    });

    let linhas = "";

    let mediasTurma = [];
    let aprovados = 0;
    let recuperacao = 0;
    let abaixo = 0;

    turma.alunos.forEach((aluno) => {
      let totalAluno = 0;
      let colunasNotas = "";

      avaliacoes.forEach((av) => {
        let nota = parseFloat(av.notas?.[aluno]) || 0;
        totalAluno += nota;

        colunasNotas += ` <td>${nota.toFixed(1)}</td> `;
      });

      let media = valorTotal > 0 ? (totalAluno / valorTotal) * 10 : 0;

      let situacao = "🔴 Abaixo";
      let cor = "#EF4444";

      mediasTurma.push(media);

      if (media >= 7) {
        situacao = "🟢 Aprovado";
        cor = "#22C55E";
        aprovados++;
      } else if (media >= 5) {
        situacao = "🟡 Recuperação";
        cor = "#F59E0B";
        recuperacao++;
      } else {
        abaixo++;
      }

      linhas += ` <tr style="border-left:6px solid ${cor};"> <td> <button onclick="abrirPainelAluno(${indexTurma},'${aluno}')" style=" border:none; background:none; font-weight:bold; cursor:pointer; color:#2563EB; " > ${aluno} </button> </td> ${colunasNotas} <td><strong>${totalAluno.toFixed( 1 )}</strong></td> <td><strong>${media.toFixed( 1 )}</strong></td> <td><strong>${situacao}</strong></td> </tr> `;
    });

    document.getElementById(
      "resultadoBoletimBimestral"
    ).innerHTML = ` <div style="overflow:auto;"> <table border="1" style=" border-collapse:collapse; width:100%; background:white; color:#111827; text-align:center; font-size:13px; "> <tr style=" background:#4A6CF7; color:white; "> <th>Aluno</th> ${cabecalho} <th>Total</th> <th>Média</th> <th>Situação</th> </tr> ${ linhas || ` <tr> <td colspan="5"> Nenhuma avaliação cadastrada neste bimestre. </td> </tr> ` } </table> </div> <br> <div class="card"> <strong>Valor total do bimestre:</strong> ${valorTotal.toFixed( 1 )} <br><br> <strong>Média da turma:</strong> ${ mediasTurma.length > 0 ? (mediasTurma.reduce((a, b) => a + b, 0) / mediasTurma.length).toFixed( 1 ) : "0.0" } <br> <strong>Maior média:</strong> ${ mediasTurma.length > 0 ? Math.max(...mediasTurma).toFixed(1) : "0.0" } <br> <strong>Menor média:</strong> ${ mediasTurma.length > 0 ? Math.min(...mediasTurma).toFixed(1) : "0.0" } <br><br> 🟢 Aprovados: ${aprovados} <br> 🟡 Recuperação: ${recuperacao} <br> 🔴 Abaixo: ${abaixo} </div> `;

    salvarTurmasAvaliacoes(turmas);
  }

  document.getElementById("bimestreBoletim").onchange = renderizarBoletim;

  renderizarBoletim();
}

function salvarQuantidadeExercicios(indexTurma, indexAvaliacao) {
  indexTurma = Number(indexTurma);

  indexAvaliacao = Number(indexAvaliacao);

  let turmas = obterTurmasSalvas();

  if (!Array.isArray(turmas)) {
    turmas = [];
  }

  if (
    !Number.isInteger(indexTurma) ||
    indexTurma < 0 ||
    indexTurma >= turmas.length
  ) {
    console.warn("Turma inválida:", indexTurma);

    return;
  }

  let turma = turmas[indexTurma];

  if (
    !Array.isArray(turma.avaliacoes) ||
    !Number.isInteger(indexAvaliacao) ||
    indexAvaliacao < 0 ||
    indexAvaliacao >= turma.avaliacoes.length
  ) {
    console.warn("Avaliação inválida:", indexAvaliacao);

    return;
  }

  let avaliacao = turma.avaliacoes[indexAvaliacao];

  let campoQuantidade = document.getElementById("quantidadeExercicios");

  if (!campoQuantidade) {
    console.warn("Campo quantidadeExercicios não encontrado.");

    return;
  }

  let quantidade = parseInt(campoQuantidade.value, 10);

  if (!Number.isInteger(quantidade) || quantidade < 1) {
    quantidade = 1;
  }

  if (quantidade > 100) {
    quantidade = 100;
  }

  campoQuantidade.value = quantidade;

  if (
    !avaliacao.controleAtividades ||
    typeof avaliacao.controleAtividades !== "object"
  ) {
    avaliacao.controleAtividades = {
      quantidadeExercicios: quantidade,
      registros: {},
      exercicios: [],
    };
  }

  if (
    !avaliacao.controleAtividades.registros ||
    typeof avaliacao.controleAtividades.registros !== "object"
  ) {
    avaliacao.controleAtividades.registros = {};
  }

  if (!Array.isArray(avaliacao.controleAtividades.exercicios)) {
    avaliacao.controleAtividades.exercicios = [];
  }

  avaliacao.controleAtividades.quantidadeExercicios = quantidade;

  /* Remove registros de exercícios que ficaram acima da nova quantidade. */

  Object.keys(avaliacao.controleAtividades.registros).forEach((nomeAluno) => {
    let registrosAluno = avaliacao.controleAtividades.registros[nomeAluno];

    if (!registrosAluno || typeof registrosAluno !== "object") {
      return;
    }

    Object.keys(registrosAluno).forEach((numero) => {
      if (Number(numero) > quantidade) {
        delete registrosAluno[numero];
      }
    });
  });

  avaliacao.controleAtividades.exercicios.length = quantidade + 1;

  recalcularNotasAtividade(avaliacao, turma);

  salvarTurmasAvaliacoes(turmas);

  if (typeof mostrarToast === "function") {
    mostrarToast("✅ Quantidade atualizada.");
  }

  abrirControleAtividades(indexTurma, indexAvaliacao);
}

function adicionarExercicioControle(indexTurma, indexAvaliacao) {
  indexTurma = Number(indexTurma);

  indexAvaliacao = Number(indexAvaliacao);

  let turmas = obterTurmasSalvas();

  if (!Array.isArray(turmas)) {
    turmas = [];
  }

  if (
    !Number.isInteger(indexTurma) ||
    indexTurma < 0 ||
    indexTurma >= turmas.length
  ) {
    console.warn("Turma inválida:", indexTurma);

    return;
  }

  if (
    !Number.isInteger(indexTurma) ||
    indexTurma < 0 ||
    indexTurma >= turmas.length
  ) {
    console.warn("Turma inválida:", indexTurma);

    return;
  }

  let turma = turmas[indexTurma];

  if (
    !Array.isArray(turma.avaliacoes) ||
    !Number.isInteger(indexAvaliacao) ||
    indexAvaliacao < 0 ||
    indexAvaliacao >= turma.avaliacoes.length
  ) {
    console.warn("Avaliação inválida:", indexAvaliacao);

    return;
  }

  let avaliacao = turma.avaliacoes[indexAvaliacao];

  if (
    !avaliacao.controleAtividades ||
    typeof avaliacao.controleAtividades !== "object"
  ) {
    avaliacao.controleAtividades = {
      quantidadeExercicios: 10,
      registros: {},
      exercicios: [],
    };
  }

  if (
    !avaliacao.controleAtividades.registros ||
    typeof avaliacao.controleAtividades.registros !== "object" ||
    Array.isArray(avaliacao.controleAtividades.registros)
  ) {
    avaliacao.controleAtividades.registros = {};
  }

  if (!Array.isArray(avaliacao.controleAtividades.exercicios)) {
    avaliacao.controleAtividades.exercicios = [];
  }

  let quantidadeAtual = parseInt(
    avaliacao.controleAtividades.quantidadeExercicios,
    10
  );

  if (!Number.isInteger(quantidadeAtual) || quantidadeAtual < 0) {
    quantidadeAtual = 0;
  }

  if (quantidadeAtual >= 100) {
    if (typeof mostrarToast === "function") {
      mostrarToast("⚠️ O limite é de 100 exercícios.");
    }

    return;
  }

  avaliacao.controleAtividades.quantidadeExercicios = quantidadeAtual + 1;

  salvarTurmasAvaliacoes(turmas);

  if (typeof mostrarToast === "function") {
    mostrarToast("✅ Exercício adicionado.");
  }

  abrirControleAtividades(indexTurma, indexAvaliacao);
}

function excluirUltimoExercicioControle(indexTurma, indexAvaliacao) {
  mostrarConfirmacao({
    titulo: "Excluir último exercício",

    mensagem:
      "Deseja excluir o último exercício desta atividade? Os registros associados a ele também serão removidos.",

    icone: "delete",

    textoConfirmar: "Excluir exercício",

    textoCancelar: "Cancelar",

    classeConfirmar: "btnVermelho",

    aoConfirmar: function () {
      indexTurma = Number(indexTurma);

      indexAvaliacao = Number(indexAvaliacao);

      let turmas = obterTurmasSalvas();

      if (!Array.isArray(turmas)) {
        turmas = [];
      }

      let turma = turmas[indexTurma];

      if (!turma || !Array.isArray(turma.avaliacoes)) {
        console.warn("Turma não encontrada.");

        return;
      }

      let avaliacao = turma.avaliacoes[indexAvaliacao];

      if (!avaliacao || !avaliacao.controleAtividades) {
        console.warn("Controle de atividades não encontrado.");

        return;
      }

      let controle = avaliacao.controleAtividades;

      let quantidade = parseInt(controle.quantidadeExercicios, 10);

      if (!Number.isInteger(quantidade) || quantidade < 1) {
        quantidade = 1;
      }

      if (quantidade <= 1) {
        mostrarAlerta({
          titulo: "Não é possível excluir",
          mensagem: "A atividade precisa ter pelo menos 1 exercício.",
          icone: "warning",
        });

        return;
      }

      if (!controle.registros || typeof controle.registros !== "object") {
        controle.registros = {};
      }

      /* Remove o último exercício de todos os registros existentes. */

      Object.keys(controle.registros).forEach((aluno) => {
        let registrosAluno = controle.registros[aluno];

        if (registrosAluno && typeof registrosAluno === "object") {
          delete registrosAluno[quantidade];
        }
      });

      /* Remove também o nome e a data do último exercício. */

      if (Array.isArray(controle.exercicios)) {
        delete controle.exercicios[quantidade];
      }

      controle.quantidadeExercicios = quantidade - 1;

      recalcularNotasAtividade(avaliacao, turma);

      salvarTurmasAvaliacoes(turmas);

      if (typeof mostrarToast === "function") {
        mostrarToast("🗑 Último exercício excluído.");
      }

      abrirControleAtividades(indexTurma, indexAvaliacao);
    },
  });
}

function abrirPendenciasAtividade(indexTurma, indexAvaliacao) {
  indexTurma = Number(indexTurma);

  indexAvaliacao = Number(indexAvaliacao);

  let turmas = obterTurmasSalvas();

  if (!Array.isArray(turmas)) {
    turmas = [];
  }

  let turma = turmas[indexTurma];

  if (!turma || !Array.isArray(turma.avaliacoes)) {
    console.warn("Turma não encontrada.");

    return;
  }

  let avaliacao = turma.avaliacoes[indexAvaliacao];

  if (!avaliacao || !avaliacao.controleAtividades) {
    console.warn("Controle de atividades não encontrado.");

    return;
  }

  let controle = avaliacao.controleAtividades;

  let quantidade = parseInt(controle.quantidadeExercicios, 10);

  if (!Number.isInteger(quantidade) || quantidade < 0) {
    quantidade = 0;
  }

  if (!controle.registros || typeof controle.registros !== "object") {
    controle.registros = {};
  }

  if (!Array.isArray(controle.exercicios)) {
    controle.exercicios = [];
  }

  let alunos = Array.isArray(turma.alunos) ? turma.alunos : [];

  function escaparHTML(valor) {
    return String(valor ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  let nomeAvaliacaoSeguro = escaparHTML(avaliacao.nome || "Atividade sem nome");

  let nomeTurmaSeguro = escaparHTML(turma.nome || "Turma sem nome");

  let html = ` <h1>🚨 Pendências</h1> <h2>${nomeAvaliacaoSeguro}</h2> <button type="button" onclick="window.print()" > 🖨 Imprimir todas / Salvar PDF </button> `;

  let totalAlunosComPendencias = 0;

  alunos.forEach((aluno) => {
    let registros = controle.registros[aluno];

    if (!registros || typeof registros !== "object") {
      registros = {};
    }

    /* Conta somente os exercícios que ainda existem atualmente. */

    let feitos = 0;

    for (let numero = 1; numero <= quantidade; numero++) {
      if (registros[numero] === true) {
        feitos++;
      }
    }

    let pendentes = Math.max(quantidade - feitos, 0);

    if (pendentes <= 0) {
      return;
    }

    totalAlunosComPendencias++;

    let listaPendentes = "";

    for (let numero = 1; numero <= quantidade; numero++) {
      if (registros[numero] === true) {
        continue;
      }

      let exercicio = controle.exercicios[numero];

      if (!exercicio || typeof exercicio !== "object") {
        exercicio = {};
      }

      let nomeExercicio = escaparHTML(exercicio.nome || "Exercício " + numero);

      let dataExercicio = exercicio.data
        ? " — " + escaparHTML(exercicio.data)
        : "";

      listaPendentes += ` <li> ${nomeExercicio}${dataExercicio} </li> `;
    }

    let nomeAlunoSeguro = escaparHTML(aluno);

    html += ` <div class="card fichaPendencia" style=" text-align:left; page-break-inside:avoid; " > <h2 style="text-align:center;"> RECUPERAÇÃO DE ATIVIDADES </h2> <p> <strong>Escola:</strong> ________________________________ </p> <p> <strong>Professor(a):</strong> Rauan </p> <p> <strong>Data:</strong> ____/____/________ </p> <hr> <p> <strong>Aluno:</strong> ${nomeAlunoSeguro} </p> <p> <strong>Turma:</strong> ${nomeTurmaSeguro} </p> <p> <strong>Atividade:</strong> ${nomeAvaliacaoSeguro} </p> <hr> <p> <strong>Pendências:</strong> </p> <ul> ${listaPendentes} </ul> <p> ✅ Feitos: ${feitos} </p> <p> 🚨 Pendentes: ${pendentes} </p> <br> <p> O(a) estudante deverá realizar as atividades pendentes e devolvê-las ao professor(a). </p> <br> <p> <strong>Data da devolução:</strong> ____/____/________ </p> <br><br> <p> <strong>Assinatura do responsável:</strong> </p> <br> <div style=" border-bottom:1px solid #000; width:100%; height:30px; "></div> <br> <button type="button" onclick="imprimirFichaAlunoPendencia(this)" > 🖨 Imprimir este aluno </button> </div> `;
  });

  if (totalAlunosComPendencias === 0) {
    html += ` <div class="card" style="text-align:center;"> <h3>✅ Nenhuma pendência encontrada</h3> <p> Todos os alunos concluíram os exercícios desta atividade. </p> </div> `;
  }

  html += ` <button type="button" onclick="abrirControleAtividades(${indexTurma},${indexAvaliacao})" > ⬅ Voltar </button> `;

  document.body.innerHTML = html + barraInferior();

  aplicarTemaSalvo();
}

function imprimirFichaAlunoPendencia(botao) {
  if (!botao) {
    console.warn("Botão não informado.");

    return;
  }

  let ficha = botao.closest(".fichaPendencia");

  if (!ficha) {
    console.warn("Ficha não encontrada.");

    return;
  }

  let janela = window.open("", "_blank");

  if (!janela) {
    mostrarAlerta({
      titulo: "Impressão bloqueada",

      mensagem:
        "O navegador bloqueou a abertura da janela de impressão. Autorize os pop-ups deste site e tente novamente.",

      icone: "print_disabled",
    });

    return;
  }

  let conteudo = ficha.innerHTML;

  janela.document.write(
    ` <!DOCTYPE html> <html lang="pt-BR"> <head> <meta charset="UTF-8"> <title>Ficha de Pendência</title> <style> body{ font-family:Arial,sans-serif; padding:30px; color:#111827; line-height:1.5; } button{ display:none; } </style> </head> <body> ${conteudo} <script> window.onload=function(){ window.print(); window.onafterprint=function(){ window.close(); }; }; </script> </body> </html> `
  );

  janela.document.close();
}

function abrirPainelAlunoAtividade(indexTurma, indexAvaliacao, nomeAluno) {
  indexTurma = Number(indexTurma);

  indexAvaliacao = Number(indexAvaliacao);

  let turmas = obterTurmasSalvas();

  if (!Array.isArray(turmas)) {
    turmas = [];
  }

  if (
    !Number.isInteger(indexTurma) ||
    indexTurma < 0 ||
    indexTurma >= turmas.length
  ) {
    console.warn("Turma inválida:", indexTurma);

    return;
  }

  if (
    !Number.isInteger(indexTurma) ||
    indexTurma < 0 ||
    indexTurma >= turmas.length
  ) {
    console.warn("Turma inválida:", indexTurma);

    return;
  }

  let turma = turmas[indexTurma];

  if (
    !Array.isArray(turma.avaliacoes) ||
    !Number.isInteger(indexAvaliacao) ||
    indexAvaliacao < 0 ||
    indexAvaliacao >= turma.avaliacoes.length
  ) {
    console.warn("Avaliação inválida:", indexAvaliacao);

    return;
  }

  let avaliacao = turma.avaliacoes[indexAvaliacao];

  if (typeof nomeAluno !== "string" || nomeAluno.trim() === "") {
    console.warn("Aluno inválido:", nomeAluno);

    return;
  }

  let controle = avaliacao.controleAtividades;

  if (!controle || typeof controle !== "object") {
    console.warn("Controle de atividades não encontrado.");

    return;
  }

  let quantidade = parseInt(controle.quantidadeExercicios, 10);

  if (!Number.isInteger(quantidade) || quantidade < 0) {
    quantidade = 0;
  }

  let registros = controle.registros?.[nomeAluno];

  if (!registros || typeof registros !== "object" || Array.isArray(registros)) {
    registros = {};
  }

  /* Conta somente os exercícios que ainda fazem parte da atividade atual. */

  let feitos = 0;

  for (let numero = 1; numero <= quantidade; numero++) {
    if (registros[numero] === true) {
      feitos++;
    }
  }

  let pendentes = Math.max(quantidade - feitos, 0);

  let percentual = quantidade > 0 ? Math.round((feitos / quantidade) * 100) : 0;

  let nota = parseFloat(avaliacao.notas?.[nomeAluno]);

  if (!Number.isFinite(nota)) {
    nota = 0;
  }

  let valor = parseFloat(avaliacao.valor);

  if (!Number.isFinite(valor)) {
    valor = 0;
  }

  function escaparHTML(valor) {
    return String(valor ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  let nomeAlunoSeguro = escaparHTML(nomeAluno);

  let nomeTurmaSeguro = escaparHTML(turma.nome || "Turma sem nome");

  let nomeAvaliacaoSeguro = escaparHTML(avaliacao.nome || "Atividade sem nome");

  let listaFeitos = "";
  let listaPendentes = "";

  for (let numero = 1; numero <= quantidade; numero++) {
    let exercicio = controle.exercicios?.[numero];

    if (!exercicio || typeof exercicio !== "object") {
      exercicio = {};
    }

    let nomeExercicio = escaparHTML(exercicio.nome || "Exercício " + numero);

    let dataExercicio = exercicio.data
      ? " — " + escaparHTML(exercicio.data)
      : "";

    if (registros[numero] === true) {
      listaFeitos += ` <li> ✅ ${nomeExercicio}${dataExercicio} </li> `;
    } else {
      listaPendentes += ` <li> ❌ ${nomeExercicio}${dataExercicio} </li> `;
    }
  }

  document.body.innerHTML =
    ` <h1>👨‍🎓 Painel do Aluno</h1> <div class="card" style="text-align:left;" > <h2>${nomeAlunoSeguro}</h2> <p> 📚 Turma: ${nomeTurmaSeguro} </p> <p> 📋 Atividade: ${nomeAvaliacaoSeguro} </p> <hr> <p> 📊 Nota: <strong> ${nota.toFixed( 1 )} / ${valor} </strong> </p> <p> 📈 Conclusão: <strong>${percentual}%</strong> </p> <p> ✅ Feitos: ${feitos} </p> <p> 🚨 Pendentes: ${pendentes} </p> </div> <div class="card" style="text-align:left;" > <h3>✅ Exercícios feitos</h3> <ul> ${ listaFeitos || "<li>Nenhum exercício feito.</li>" } </ul> </div> <div class="card" style="text-align:left;" > <h3>🚨 Exercícios pendentes</h3> <ul> ${ listaPendentes || "<li>Nenhuma pendência.</li>" } </ul> </div> <button type="button" onclick="window.print()" > 🖨 Imprimir ficha </button> <button type="button" onclick="abrirControleAtividades(${indexTurma},${indexAvaliacao})" > ⬅ Voltar </button> ` +
    barraInferior();

  aplicarTemaSalvo();
}

function filtrarAlunosAtividade() {
  let busca = document.getElementById("buscaAlunoAtividade");

  if (!busca) return;

  let texto = busca.value.toLowerCase().trim();

  let linhas = document.querySelectorAll(".linhaAlunoAtividade");

  linhas.forEach((linha) => {
    let aluno = linha.dataset.aluno || "";

    if (aluno.includes(texto)) {
      linha.style.display = "";
    } else {
      linha.style.display = "none";
    }
  });
}

function abrirPainelAluno(indexTurma, nomeAluno) {
  let turmas = obterTurmasSalvas();

  let turma = turmas[indexTurma];
  let avaliacoes = turma.avaliacoes || [];

  let bimestres = ["1B", "2B", "3B", "4B"];

  let html = ` <h1>👨‍🎓 Ficha do Aluno</h1> <h2>${nomeAluno}</h2> <p>📚 ${turma.nome}</p> `;

  let mediasAnuais = [];

  bimestres.forEach((bim) => {
    let avaliacoesBim = avaliacoes.filter((av) => av.bimestre === bim);

    let totalAluno = 0;
    let valorTotal = 0;
    let detalhes = "";

    avaliacoesBim.forEach((av) => {
      if (av.tipo === "atividade" && av.controleAtividades) {
        recalcularNotasAtividade(av, turma);
      }

      let nota = parseFloat(av.notas?.[nomeAluno]) || 0;
      let valor = parseFloat(av.valor) || 0;

      totalAluno += nota;
      valorTotal += valor;

      detalhes += ` <p> <strong>${av.nome}</strong> <br> ${ av.tipo } — ${nota.toFixed(1)} / ${valor.toFixed(1)} </p> `;
    });

    let mediaBim = valorTotal > 0 ? (totalAluno / valorTotal) * 10 : 0;

    if (valorTotal > 0) {
      mediasAnuais.push(mediaBim);
    }

    let situacao = "🔴 Sem dados";

    if (valorTotal > 0) {
      if (mediaBim >= 7) {
        situacao = "🟢 Aprovado";
      } else if (mediaBim >= 5) {
        situacao = "🟡 Recuperação";
      } else {
        situacao = "🔴 Atenção";
      }
    }

    html += ` <div class="card" style="text-align:left;"> <h3>${bim.replace( "B", "º Bimestre" )}</h3> <p><strong>Total:</strong> ${totalAluno.toFixed( 1 )} / ${valorTotal.toFixed( 1 )}</p> <p><strong>Média:</strong> ${mediaBim.toFixed( 1 )}</p> <p><strong>Situação:</strong> ${situacao}</p> <hr> ${ detalhes || "<p>Nenhuma avaliação cadastrada.</p>" } </div> `;
  });

  let mediaAnual =
    mediasAnuais.length > 0
      ? mediasAnuais.reduce((a, b) => a + b, 0) / mediasAnuais.length
      : 0;

  html += ` <div class="card"> <h3>📊 Resumo Anual</h3> <p><strong>Média anual atual:</strong> ${mediaAnual.toFixed( 1 )}</p> <p><strong>Bimestres com nota:</strong> ${ mediasAnuais.length }</p> </div> <button onclick="window.print()"> 📄 Imprimir Relatório </button> <br><br> <button onclick="abrirBoletimBimestralTurma(${indexTurma})"> ⬅ Voltar </button> `;

  document.body.innerHTML = html + barraInferior();

  aplicarTemaSalvo();
}
