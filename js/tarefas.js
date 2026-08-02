let cancelarEscutaTarefasFirebase = null;
let uidEscutaTarefasFirebase = null;
let cancelarEventosTelaTarefas = null;

function encerrarEscutaTarefasFirebase() {
  if (typeof cancelarEscutaTarefasFirebase === "function") {
    try {
      cancelarEscutaTarefasFirebase();
    } catch (erro) {
      console.warn("Não foi possível encerrar a escuta das tarefas:", erro);
    }
  }

  cancelarEscutaTarefasFirebase = null;
  uidEscutaTarefasFirebase = null;

  if (typeof cancelarEventosTelaTarefas === "function") {
    cancelarEventosTelaTarefas();
  }

  cancelarEventosTelaTarefas = null;
}

window.encerrarEscutaTarefasFirebase = encerrarEscutaTarefasFirebase;

async function abrirTarefas() {
  /* Encerra a instância anterior antes de criar novos listeners da tela. */

  encerrarEscutaTarefasFirebase();

  document.body.innerHTML =
    ` <div class="cabecalhoTela"> <div> <h1>✅ Tarefas</h1> <p> Organize suas atividades e compromissos escolares. </p> </div> </div> <main class="secaoApp"> <section class="card textoEsquerda"> <h2 id="tituloFormularioTarefa"> ➕ Nova tarefa </h2> <div class="grupoCampo"> <label for="novaTarefa"> Descrição da tarefa </label> <input id="novaTarefa" type="text" placeholder="Ex.: Corrigir avaliações do 7º ano" autocomplete="off" > </div> <div style=" display:grid; grid-template-columns:repeat(auto-fit,minmax(170px,1fr)); gap:12px; margin-top:16px; " > <div class="grupoCampo"> <label for="prioridadeTarefa"> Prioridade </label> <select id="prioridadeTarefa"> <option value="media"> 🟡 Média </option> <option value="alta"> 🔴 Alta </option> <option value="baixa"> 🟢 Baixa </option> </select> </div> <div class="grupoCampo"> <label for="statusTarefa"> Etapa </label> <select id="statusTarefa"> <option value="afazer"> 📌 A fazer </option> <option value="andamento"> 🚧 Em andamento </option> <option value="concluida"> ✅ Concluída </option> </select> </div> <div class="grupoCampo"> <label for="dataTarefa"> Prazo </label> <input id="dataTarefa" type="date" > </div> <div class="grupoCampo"> <label for="horaTarefa"> Horário </label> <input id="horaTarefa" type="time" > </div> <div class="grupoCampo"> <label for="turmaTarefa"> Turma </label> <select id="turmaTarefa"> <option value=""> 📚 Sem turma </option> </select> </div> <div class="grupoCampo"> <label for="disciplinaTarefa"> Disciplina </label> <input id="disciplinaTarefa" type="text" placeholder="Ex.: Língua Portuguesa" autocomplete="off" > </div> </div> <div class="acoes"> <button id="adicionarTarefa" class="btnAzul" type="button" > <span class="material-icons-round"> add_task </span> <span id="textoBotaoTarefa"> Adicionar tarefa </span> </button> <button id="cancelarEdicaoTarefa" type="button" class="oculto" > <span class="material-icons-round"> close </span> Cancelar edição </button> </div> </section> <section style=" display:grid; grid-template-columns:repeat(auto-fit,minmax(130px,1fr)); gap:12px; margin-bottom:16px; " > <div class="card textoEsquerda"> <small>Total</small> <strong id="estatisticaTotalTarefas" style="display:block;font-size:25px;margin-top:5px;" > 0 </strong> </div> <div class="card textoEsquerda"> <small>A fazer</small> <strong id="estatisticaAFazerTarefas" style="display:block;font-size:25px;margin-top:5px;" > 0 </strong> </div> <div class="card textoEsquerda"> <small>Em andamento</small> <strong id="estatisticaAndamentoTarefas" style="display:block;font-size:25px;margin-top:5px;" > 0 </strong> </div> <div class="card textoEsquerda"> <small>Concluídas</small> <strong id="estatisticaConcluidasTarefas" style="display:block;font-size:25px;margin-top:5px;" > 0 </strong> </div> <div class="card textoEsquerda"> <small>Para hoje</small> <strong id="estatisticaHojeTarefas" style="display:block;font-size:25px;margin-top:5px;" > 0 </strong> </div> <div class="card textoEsquerda"> <small>Atrasadas</small> <strong id="estatisticaAtrasadasTarefas" style="display:block;font-size:25px;margin-top:5px;" > 0 </strong> </div> </section> <section class="painel"> <div class="painelBlocoCabecalho"> <div> <h2>📋 Quadro de tarefas</h2> <p id="contadorTarefas"> Carregando suas tarefas... </p> </div> </div> <div style=" display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:12px; margin-bottom:18px; " > <div class="grupoCampo"> <label for="buscaTarefa"> Buscar tarefa </label> <input id="buscaTarefa" type="search" placeholder="Digite parte da tarefa..." autocomplete="off" > </div> <div class="grupoCampo"> <label for="filtroStatusTarefa"> Status </label> <select id="filtroStatusTarefa"> <option value="todas"> Todas </option> <option value="afazer"> 📌 A fazer </option> <option value="andamento"> 🚧 Em andamento </option> <option value="concluida"> ✅ Concluídas </option> <option value="hoje"> 🔥 Para hoje </option> <option value="atrasadas"> 🚨 Atrasadas </option> <option value="semPrazo"> 📍 Sem prazo </option> </select> </div> <div class="grupoCampo"> <label for="filtroPrioridadeTarefa"> Prioridade </label> <select id="filtroPrioridadeTarefa"> <option value="todas"> Todas </option> <option value="alta"> 🔴 Alta </option> <option value="media"> 🟡 Média </option> <option value="baixa"> 🟢 Baixa </option> </select> </div> <div class="grupoCampo"> <label for="filtroTurmaTarefa"> Turma </label> <select id="filtroTurmaTarefa"> <option value="todas"> Todas as turmas </option> <option value="semTurma"> Sem turma </option> </select> </div> <div class="grupoCampo"> <label for="ordenacaoTarefa"> Ordenar por </label> <select id="ordenacaoTarefa"> <option value="prioridade"> Prioridade e prazo </option> <option value="prazo"> Prazo mais próximo </option> <option value="recentes"> Mais recentes </option> <option value="antigas"> Mais antigas </option> <option value="alfabetica"> Ordem alfabética </option> </select> </div> </div> <div id="resumoFiltrosTarefas" style=" display:none; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:15px; padding:10px 12px; border-radius:12px; background:var(--fundoSecundario); " > <span id="textoResumoFiltrosTarefas"></span> <button id="limparFiltrosTarefas" type="button" > <span class="material-icons-round"> filter_alt_off </span> Limpar filtros </button> </div> <div id="kanbanTarefas" style=" display:grid; grid-template-columns:repeat(3,minmax(270px,1fr)); gap:14px; overflow-x:auto; padding-bottom:6px; " > <div class="card textoEsquerda colunaKanbanTarefa" data-status="afazer" style=" min-width:270px; padding:12px; align-self:start; " > <div class="flexEntre" style="margin-bottom:12px;" > <strong>📌 A fazer</strong> <span id="contadorColunaAFazer"> 0 </span> </div> <div id="colunaTarefasAFazer" class="areaSoltarTarefa" data-status="afazer" style="min-height:130px;" ></div> </div> <div class="card textoEsquerda colunaKanbanTarefa" data-status="andamento" style=" min-width:270px; padding:12px; align-self:start; " > <div class="flexEntre" style="margin-bottom:12px;" > <strong>🚧 Em andamento</strong> <span id="contadorColunaAndamento"> 0 </span> </div> <div id="colunaTarefasAndamento" class="areaSoltarTarefa" data-status="andamento" style="min-height:130px;" ></div> </div> <div class="card textoEsquerda colunaKanbanTarefa" data-status="concluida" style=" min-width:270px; padding:12px; align-self:start; " > <div class="flexEntre" style="margin-bottom:12px;" > <strong>✅ Concluídas</strong> <span id="contadorColunaConcluidas"> 0 </span> </div> <div id="colunaTarefasConcluidas" class="areaSoltarTarefa" data-status="concluida" style="min-height:130px;" ></div> </div> </div> </section> <div class="acoes"> <button class="btnAzul" type="button" onclick="voltarHome()" > <span class="material-icons-round"> arrow_back </span> Voltar </button> </div> </main> <div id="modalExcluirTarefa" class="oculto" style=" position:fixed; inset:0; z-index:9999; background:rgba(0,0,0,.55); display:none; align-items:center; justify-content:center; padding:20px; " > <div class="card textoEsquerda" style=" width:min(430px,100%); margin:0; " > <h2>🗑 Excluir tarefa</h2> <p id="textoModalExcluirTarefa"> Deseja realmente excluir esta tarefa? </p> <div class="acoes"> <button id="cancelarExclusaoTarefa" type="button" > <span class="material-icons-round"> close </span> Cancelar </button> <button id="confirmarExclusaoTarefa" class="btnVermelho" type="button" > <span class="material-icons-round"> delete </span> Excluir </button> </div> </div> </div> ` + barraInferior("tarefas");

  aplicarTemaSalvo();

  const campoNovaTarefa = document.getElementById("novaTarefa");

  const campoPrioridade = document.getElementById("prioridadeTarefa");

  const campoStatus = document.getElementById("statusTarefa");

  const campoData = document.getElementById("dataTarefa");

  const campoHora = document.getElementById("horaTarefa");

  const campoTurma = document.getElementById("turmaTarefa");

  const campoDisciplina = document.getElementById("disciplinaTarefa");

  const botaoAdicionar = document.getElementById("adicionarTarefa");

  const botaoCancelarEdicao = document.getElementById("cancelarEdicaoTarefa");

  const textoBotaoTarefa = document.getElementById("textoBotaoTarefa");

  const tituloFormulario = document.getElementById("tituloFormularioTarefa");

  const campoBusca = document.getElementById("buscaTarefa");

  const filtroStatus = document.getElementById("filtroStatusTarefa");

  const filtroPrioridade = document.getElementById("filtroPrioridadeTarefa");

  const filtroTurma = document.getElementById("filtroTurmaTarefa");

  const campoOrdenacao = document.getElementById("ordenacaoTarefa");

  const contadorTarefas = document.getElementById("contadorTarefas");

  const resumoFiltros = document.getElementById("resumoFiltrosTarefas");

  const textoResumoFiltros = document.getElementById(
    "textoResumoFiltrosTarefas"
  );

  const botaoLimparFiltros = document.getElementById("limparFiltrosTarefas");

  const colunaAFazer = document.getElementById("colunaTarefasAFazer");

  const colunaAndamento = document.getElementById("colunaTarefasAndamento");

  const colunaConcluidas = document.getElementById("colunaTarefasConcluidas");

  const modalExcluir = document.getElementById("modalExcluirTarefa");

  const textoModalExcluir = document.getElementById("textoModalExcluirTarefa");

  const botaoCancelarExclusao = document.getElementById(
    "cancelarExclusaoTarefa"
  );

  const botaoConfirmarExclusao = document.getElementById(
    "confirmarExclusaoTarefa"
  );

  let tarefas = [];

  let turmas = [];

  let idEdicao = null;

  let idExclusao = null;

  let usuarioAtual = null;

  let referenciaTarefas = null;

  let salvandoTarefas = false;
  let uidTarefasAtual = null;

  const controladorEventosTarefas = new AbortController();

  cancelarEventosTelaTarefas = function () {
    controladorEventosTarefas.abort();
  };

  /* ================================================== FIREBASE ================================================== */

  function sessaoTarefasContinuaAtiva() {
    const usuario =
      window.auth?.currentUser || window.usuarioAtualAjudaProf || null;

    return Boolean(
      usuario &&
        uidTarefasAtual &&
        usuario.uid === uidTarefasAtual &&
        uidEscutaTarefasFirebase === uidTarefasAtual
    );
  }

  function notificarAtualizacaoTarefas(origem = "tempo-real") {
    window.dispatchEvent(
      new CustomEvent("tarefasAtualizadasAjudaProf", {
        detail: {
          uid: uidTarefasAtual,
          tarefas: [...tarefas],
          origem,
        },
      })
    );
  }

  async function aguardarFirebaseTarefas() {
    if (window.auth && window.db && window.firebaseFirestore) {
      return;
    }

    await new Promise((resolve, reject) => {
      const tempoLimite = setTimeout(() => {
        window.removeEventListener("firebasePronto", firebaseCarregado);

        reject(new Error("O Firebase demorou para carregar."));
      }, 10000);

      function firebaseCarregado() {
        clearTimeout(tempoLimite);

        resolve();
      }

      window.addEventListener("firebasePronto", firebaseCarregado, {
        once: true,
      });
    });
  }

  function obterUsuarioTarefas() {
    return window.auth ? window.auth.currentUser : null;
  }

  async function carregarTurmasTarefas() {
    if (typeof window.iniciarEscutaTurmasFirebase === "function") {
      try {
        await window.iniciarEscutaTurmasFirebase();
      } catch (erro) {
        console.error(
          "Erro ao iniciar sincronização de turmas nas Tarefas:",
          erro
        );
      }
    }

    if (typeof obterTurmasSalvas === "function") {
      const lista = obterTurmasSalvas();
      turmas = Array.isArray(lista) ? lista : [];
    } else {
      turmas = [];
    }

    preencherTurmas();

    window.addEventListener(
      "turmasAtualizadasAjudaProf",
      (evento) => {
        if (!sessaoTarefasContinuaAtiva()) {
          return;
        }

        if (evento.detail?.uid !== uidTarefasAtual) {
          return;
        }

        turmas = Array.isArray(evento.detail?.turmas)
          ? evento.detail.turmas
          : [];

        preencherTurmas();
      },
      {
        signal: controladorEventosTarefas.signal,
      }
    );
  }

  async function migrarTarefasLocais() {
    const tarefasLocais = JSON.parse(localStorage.getItem("tarefas") || "[]");

    if (!Array.isArray(tarefasLocais) || tarefasLocais.length === 0) {
      return false;
    }

    const tarefasConvertidas = tarefasLocais
      .map(normalizarTarefa)
      .filter((tarefa) => tarefa.texto);

    const { setDoc, serverTimestamp } = window.firebaseFirestore;

    await setDoc(
      referenciaTarefas,
      {
        itens: tarefasConvertidas,
        atualizadoEm: serverTimestamp(),
        migradoDoLocalStorage: true,
      },
      {
        merge: true,
      }
    );

    localStorage.removeItem("tarefas");

    mostrarMensagemTarefa("☁️ Tarefas antigas transferidas para sua conta.");

    return true;
  }

  async function salvarTarefasFirebase() {
    if (
      !referenciaTarefas ||
      !sessaoTarefasContinuaAtiva() ||
      salvandoTarefas
    ) {
      return;
    }

    salvandoTarefas = true;

    try {
      const { setDoc, serverTimestamp } = window.firebaseFirestore;

      await setDoc(
        referenciaTarefas,
        {
          itens: tarefas,
          atualizadoEm: serverTimestamp(),
        },
        {
          merge: true,
        }
      );
    } catch (erro) {
      console.error("Erro ao salvar tarefas:", erro);

      mostrarMensagemTarefa("❌ Não foi possível salvar as tarefas.");

      throw erro;
    } finally {
      salvandoTarefas = false;
    }
  }

  async function iniciarTarefasFirebase() {
    try {
      await aguardarFirebaseTarefas();

      usuarioAtual = obterUsuarioTarefas();

      if (!usuarioAtual) {
        contadorTarefas.textContent =
          "Entre na sua conta para acessar as tarefas.";

        mostrarMensagemTarefa("⚠️ Faça login para acessar suas tarefas.");

        return;
      }

      const { doc, getDoc, onSnapshot } = window.firebaseFirestore;

      uidTarefasAtual = usuarioAtual.uid;
      uidEscutaTarefasFirebase = uidTarefasAtual;

      referenciaTarefas = doc(
        window.db,
        "usuarios",
        uidTarefasAtual,
        "dados",
        "tarefas"
      );

      await carregarTurmasTarefas();

      const documentoInicial = await getDoc(referenciaTarefas);

      if (!documentoInicial.exists()) {
        await migrarTarefasLocais();
      }

      const uidDaEscuta = uidTarefasAtual;

      cancelarEscutaTarefasFirebase = onSnapshot(
        referenciaTarefas,
        (snapshot) => {
          const usuario =
            window.auth?.currentUser || window.usuarioAtualAjudaProf || null;

          if (
            !usuario ||
            usuario.uid !== uidDaEscuta ||
            uidEscutaTarefasFirebase !== uidDaEscuta
          ) {
            return;
          }

          if (!snapshot.exists()) {
            tarefas = [];
            atualizarTelaTarefas();

            notificarAtualizacaoTarefas(
              snapshot.metadata?.fromCache ? "cache" : "tempo-real"
            );

            return;
          }

          const dados = snapshot.data() || {};

          const lista = Array.isArray(dados.itens) ? dados.itens : [];

          tarefas = lista
            .map(normalizarTarefa)
            .filter((tarefa) => tarefa.texto);

          atualizarTelaTarefas();

          notificarAtualizacaoTarefas(
            snapshot.metadata?.fromCache ? "cache" : "tempo-real"
          );
        },
        (erro) => {
          const usuario =
            window.auth?.currentUser || window.usuarioAtualAjudaProf || null;

          if (!usuario || usuario.uid !== uidDaEscuta) {
            return;
          }

          console.error("Erro na sincronização das tarefas:", erro);

          contadorTarefas.textContent =
            "Não foi possível sincronizar as tarefas.";

          mostrarMensagemTarefa("❌ Erro ao sincronizar tarefas.");
        }
      );
    } catch (erro) {
      console.error("Erro ao iniciar tarefas:", erro);

      contadorTarefas.textContent = "Não foi possível carregar as tarefas.";

      mostrarMensagemTarefa("❌ Não foi possível abrir suas tarefas.");
    }
  }

  /* ================================================== DADOS E UTILIDADES ================================================== */

  function criarIdTarefa() {
    return (
      "tarefa_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9)
    );
  }

  function normalizarTarefa(tarefa) {
    if (typeof tarefa === "string") {
      return {
        id: criarIdTarefa(),

        texto: tarefa.trim(),

        status: "afazer",

        concluida: false,

        prioridade: "media",

        data: "",

        hora: "",

        turma: "",

        disciplina: "",

        criadaEm: new Date().toISOString(),

        atualizadaEm: new Date().toISOString(),

        concluidaEm: "",
      };
    }

    const concluida = Boolean(
      tarefa && (tarefa.concluida || tarefa.status === "concluida")
    );

    let status =
      tarefa && tarefa.status
        ? tarefa.status
        : concluida
        ? "concluida"
        : "afazer";

    if (!["afazer", "andamento", "concluida"].includes(status)) {
      status = concluida ? "concluida" : "afazer";
    }

    return {
      id: tarefa.id || criarIdTarefa(),

      texto: String(tarefa.texto || tarefa.descricao || "").trim(),

      status: status,

      concluida: status === "concluida",

      prioridade: ["alta", "media", "baixa"].includes(tarefa.prioridade)
        ? tarefa.prioridade
        : "media",

      data: tarefa.data || tarefa.prazo || "",

      hora: tarefa.hora || "",

      turma: tarefa.turma || "",

      disciplina: tarefa.disciplina || "",

      criadaEm: tarefa.criadaEm || new Date().toISOString(),

      atualizadaEm:
        tarefa.atualizadaEm || tarefa.criadaEm || new Date().toISOString(),

      concluidaEm:
        status === "concluida"
          ? tarefa.concluidaEm || new Date().toISOString()
          : "",
    };
  }

  function escaparHTML(texto) {
    return String(texto ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function mostrarMensagemTarefa(mensagem) {
    if (typeof mostrarToast === "function") {
      mostrarToast(mensagem);
    } else {
      console.log(mensagem);
    }
  }

  function hojeISO() {
    const agora = new Date();

    const ano = agora.getFullYear();

    const mes = String(agora.getMonth() + 1).padStart(2, "0");

    const dia = String(agora.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
  }

  function formatarDataBR(data) {
    if (!data) {
      return "";
    }

    const partes = data.split("-");

    if (partes.length !== 3) {
      return data;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  function dadosPrioridade(prioridade) {
    if (prioridade === "alta") {
      return {
        icone: "🔴",
        texto: "Alta",
        cor: "#EF4444",
        peso: 1,
      };
    }

    if (prioridade === "baixa") {
      return {
        icone: "🟢",
        texto: "Baixa",
        cor: "#22C55E",
        peso: 3,
      };
    }

    return {
      icone: "🟡",
      texto: "Média",
      cor: "#F59E0B",
      peso: 2,
    };
  }

  function dadosPrazo(tarefa) {
    if (tarefa.status === "concluida") {
      return {
        icone: "✅",
        texto: "Concluída",
        cor: "#22C55E",
      };
    }

    if (!tarefa.data) {
      return {
        icone: "📍",
        texto: "Sem prazo",
        cor: "#6B7280",
      };
    }

    const hoje = hojeISO();

    if (tarefa.data < hoje) {
      return {
        icone: "🚨",
        texto: "Atrasada",
        cor: "#EF4444",
      };
    }

    if (tarefa.data === hoje) {
      return {
        icone: "🔥",
        texto: "Vence hoje",
        cor: "#F59E0B",
      };
    }

    return {
      icone: "⏳",
      texto: "Pendente",
      cor: "#2563EB",
    };
  }

  function preencherTurmas() {
    const valorFormulario = campoTurma.value;

    const valorFiltro = filtroTurma.value;

    campoTurma.innerHTML = ` <option value=""> 📚 Sem turma </option> `;

    filtroTurma.innerHTML = ` <option value="todas"> Todas as turmas </option> <option value="semTurma"> Sem turma </option> `;

    turmas.forEach((turma) => {
      const nome = typeof turma === "string" ? turma : turma.nome;

      if (!nome) {
        return;
      }

      const opcaoFormulario = document.createElement("option");

      opcaoFormulario.value = nome;

      opcaoFormulario.textContent = nome;

      campoTurma.appendChild(opcaoFormulario);

      const opcaoFiltro = document.createElement("option");

      opcaoFiltro.value = nome;

      opcaoFiltro.textContent = nome;

      filtroTurma.appendChild(opcaoFiltro);
    });

    campoTurma.value = Array.from(campoTurma.options).some(
      (opcao) => opcao.value === valorFormulario
    )
      ? valorFormulario
      : "";

    filtroTurma.value = Array.from(filtroTurma.options).some(
      (opcao) => opcao.value === valorFiltro
    )
      ? valorFiltro
      : "todas";
  }

  /* ================================================== FORMULÁRIO ================================================== */

  function limparFormulario() {
    idEdicao = null;

    campoNovaTarefa.value = "";

    campoPrioridade.value = "media";

    campoStatus.value = "afazer";

    campoData.value = "";

    campoHora.value = "";

    campoTurma.value = "";

    campoDisciplina.value = "";

    tituloFormulario.textContent = "➕ Nova tarefa";

    textoBotaoTarefa.textContent = "Adicionar tarefa";

    botaoCancelarEdicao.classList.add("oculto");
  }

  function editarTarefaPorId(id) {
    const tarefa = tarefas.find((item) => item.id === id);

    if (!tarefa) {
      return;
    }

    idEdicao = id;

    campoNovaTarefa.value = tarefa.texto;

    campoPrioridade.value = tarefa.prioridade;

    campoStatus.value = tarefa.status;

    campoData.value = tarefa.data;

    campoHora.value = tarefa.hora;

    campoTurma.value = tarefa.turma;

    campoDisciplina.value = tarefa.disciplina;

    tituloFormulario.textContent = "✏ Editar tarefa";

    textoBotaoTarefa.textContent = "Salvar alterações";

    botaoCancelarEdicao.classList.remove("oculto");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    campoNovaTarefa.focus();
  }

  async function salvarFormularioTarefa() {
    const texto = campoNovaTarefa.value.trim();

    if (!texto) {
      mostrarMensagemTarefa("⚠️ Digite a descrição da tarefa.");

      campoNovaTarefa.focus();

      return;
    }

    const duplicada = tarefas.some(
      (tarefa) =>
        tarefa.texto.trim().toLowerCase() === texto.toLowerCase() &&
        tarefa.id !== idEdicao
    );

    if (duplicada) {
      mostrarMensagemTarefa("⚠️ Essa tarefa já está cadastrada.");

      campoNovaTarefa.focus();

      return;
    }

    const status = campoStatus.value;

    const agora = new Date().toISOString();

    if (idEdicao) {
      const indice = tarefas.findIndex((tarefa) => tarefa.id === idEdicao);

      if (indice < 0) {
        return;
      }

      tarefas[indice] = {
        ...tarefas[indice],

        texto: texto,

        prioridade: campoPrioridade.value,

        status: status,

        concluida: status === "concluida",

        data: campoData.value,

        hora: campoHora.value,

        turma: campoTurma.value,

        disciplina: campoDisciplina.value.trim(),

        atualizadaEm: agora,

        concluidaEm:
          status === "concluida" ? tarefas[indice].concluidaEm || agora : "",
      };

      await salvarTarefasFirebase();

      mostrarMensagemTarefa("✅ Alterações salvas.");
    } else {
      tarefas.push({
        id: criarIdTarefa(),

        texto: texto,

        prioridade: campoPrioridade.value,

        status: status,

        concluida: status === "concluida",

        data: campoData.value,

        hora: campoHora.value,

        turma: campoTurma.value,

        disciplina: campoDisciplina.value.trim(),

        criadaEm: agora,

        atualizadaEm: agora,

        concluidaEm: status === "concluida" ? agora : "",
      });

      await salvarTarefasFirebase();

      mostrarMensagemTarefa("✅ Tarefa adicionada.");
    }

    limparFormulario();

    atualizarTelaTarefas();
  }

  /* ================================================== FILTROS E ORDENAÇÃO ================================================== */

  function obterTarefasFiltradas() {
    const busca = campoBusca.value.trim().toLowerCase();

    const status = filtroStatus.value;

    const prioridade = filtroPrioridade.value;

    const turma = filtroTurma.value;

    const hoje = hojeISO();

    return tarefas.filter((tarefa) => {
      const textoPesquisa = [tarefa.texto, tarefa.turma, tarefa.disciplina]
        .join(" ")
        .toLowerCase();

      if (busca && !textoPesquisa.includes(busca)) {
        return false;
      }

      if (prioridade !== "todas" && tarefa.prioridade !== prioridade) {
        return false;
      }

      if (turma === "semTurma") {
        if (tarefa.turma) {
          return false;
        }
      } else if (turma !== "todas" && tarefa.turma !== turma) {
        return false;
      }

      if (
        ["afazer", "andamento", "concluida"].includes(status) &&
        tarefa.status !== status
      ) {
        return false;
      }

      if (
        status === "hoje" &&
        (tarefa.status === "concluida" || tarefa.data !== hoje)
      ) {
        return false;
      }

      if (
        status === "atrasadas" &&
        (tarefa.status === "concluida" || !tarefa.data || tarefa.data >= hoje)
      ) {
        return false;
      }

      if (
        status === "semPrazo" &&
        (tarefa.status === "concluida" || tarefa.data)
      ) {
        return false;
      }

      return true;
    });
  }

  function ordenarTarefas(lista) {
    const criterio = campoOrdenacao.value;

    return [...lista].sort((a, b) => {
      if (criterio === "prazo") {
        const dataA = a.data || "9999-12-31";

        const dataB = b.data || "9999-12-31";

        return dataA.localeCompare(dataB);
      }

      if (criterio === "recentes") {
        return String(b.criadaEm || "").localeCompare(String(a.criadaEm || ""));
      }

      if (criterio === "antigas") {
        return String(a.criadaEm || "").localeCompare(String(b.criadaEm || ""));
      }

      if (criterio === "alfabetica") {
        return a.texto.localeCompare(b.texto, "pt-BR", {
          sensitivity: "base",
        });
      }

      const prioridadeA = dadosPrioridade(a.prioridade).peso;

      const prioridadeB = dadosPrioridade(b.prioridade).peso;

      if (prioridadeA !== prioridadeB) {
        return prioridadeA - prioridadeB;
      }

      const dataA = a.data || "9999-12-31";

      const dataB = b.data || "9999-12-31";

      return dataA.localeCompare(dataB);
    });
  }

  function limparFiltros() {
    campoBusca.value = "";

    filtroStatus.value = "todas";

    filtroPrioridade.value = "todas";

    filtroTurma.value = "todas";

    campoOrdenacao.value = "prioridade";

    atualizarTelaTarefas();

    campoBusca.focus();
  }

  /* ================================================== KANBAN ================================================== */

  function criarHTMLCardTarefa(tarefa) {
    const prioridade = dadosPrioridade(tarefa.prioridade);

    const prazo = dadosPrazo(tarefa);

    const texto = escaparHTML(tarefa.texto);

    const turma = escaparHTML(tarefa.turma);

    const disciplina = escaparHTML(tarefa.disciplina);

    let detalhes = "";

    if (tarefa.turma) {
      detalhes += ` <span> 📚 ${turma} </span> `;
    }

    if (tarefa.disciplina) {
      detalhes += ` <span> 📘 ${disciplina} </span> `;
    }

    if (tarefa.data) {
      detalhes += ` <span> 📅 ${formatarDataBR(tarefa.data)} ${tarefa.hora ? ` às ${escaparHTML(tarefa.hora)}` : ""} </span> `;
    }

    const podeVoltar = tarefa.status !== "afazer";

    const podeAvancar = tarefa.status !== "concluida";

    return ` <article class="card textoEsquerda itemKanbanTarefa" draggable="true" data-id="${escaparHTML(tarefa.id)}" style=" margin:0 0 10px; padding:12px; border-left:6px solid ${prazo.cor}; opacity:${tarefa.status === "concluida" ? ".72" : "1"}; cursor:grab; " > <div style=" display:flex; align-items:flex-start; justify-content:space-between; gap:8px; " > <strong style=" overflow-wrap:anywhere; ${tarefa.status === "concluida" ? "text-decoration:line-through;" : ""} " > ${texto} </strong> <span style=" display:inline-flex; align-items:center; padding:4px 7px; border-radius:999px; background:${prioridade.cor}; color:white; font-size:11px; font-weight:800; white-space:nowrap; " > ${prioridade.icone} ${prioridade.texto} </span> </div> <div style=" display:flex; gap:6px; flex-wrap:wrap; margin-top:9px; " > <span style=" display:inline-flex; padding:4px 7px; border-radius:999px; background:${prazo.cor}; color:white; font-size:11px; font-weight:800; " > ${prazo.icone} ${prazo.texto} </span> </div> ${ detalhes ? ` <div style=" display:flex; flex-direction:column; gap:5px; margin-top:10px; font-size:12px; color:var(--textoSecundario); " > ${detalhes} </div> ` : "" } <div class="acoes" style=" margin-top:11px; gap:5px; " > ${ podeVoltar ? ` <button type="button" onclick="moverTarefaKanban('${tarefa.id}','voltar')" aria-label="Mover tarefa para a etapa anterior" > <span class="material-icons-round"> arrow_back </span> </button> ` : "" } ${ podeAvancar ? ` <button type="button" onclick="moverTarefaKanban('${tarefa.id}','avancar')" aria-label="Mover tarefa para a próxima etapa" > <span class="material-icons-round"> arrow_forward </span> </button> ` : "" } <button type="button" onclick="editarTarefaKanban('${tarefa.id}')" aria-label="Editar tarefa" > <span class="material-icons-round"> edit </span> </button> <button class="btnVermelho" type="button" onclick="pedirExclusaoTarefa('${tarefa.id}')" aria-label="Excluir tarefa" > <span class="material-icons-round"> delete </span> </button> </div> </article> `;
  }

  function mensagemColunaVazia(texto) {
    return ` <div style=" padding:20px 10px; text-align:center; color:var(--textoSecundario); font-size:13px; " > <span class="material-icons-round" style=" display:block; font-size:30px; margin-bottom:5px; " > inbox </span> ${texto} </div> `;
  }

  function configurarArrastarESoltar() {
    document.querySelectorAll(".itemKanbanTarefa").forEach((card) => {
      card.addEventListener("dragstart", (evento) => {
        evento.dataTransfer.setData("text/plain", card.dataset.id);

        evento.dataTransfer.effectAllowed = "move";

        card.style.opacity = ".45";
      });

      card.addEventListener("dragend", () => {
        card.style.opacity = "";

        document.querySelectorAll(".areaSoltarTarefa").forEach((area) => {
          area.style.outline = "";
        });
      });
    });

    document.querySelectorAll(".areaSoltarTarefa").forEach((area) => {
      area.addEventListener("dragover", (evento) => {
        evento.preventDefault();

        evento.dataTransfer.dropEffect = "move";

        area.style.outline = "2px dashed var(--corPrimaria)";

        area.style.outlineOffset = "4px";
      });

      area.addEventListener("dragleave", () => {
        area.style.outline = "";
      });

      area.addEventListener("drop", async (evento) => {
        evento.preventDefault();

        area.style.outline = "";

        const id = evento.dataTransfer.getData("text/plain");

        const novoStatus = area.dataset.status;

        await alterarStatusTarefa(id, novoStatus);
      });
    });
  }

  async function alterarStatusTarefa(id, novoStatus) {
    if (!["afazer", "andamento", "concluida"].includes(novoStatus)) {
      return;
    }

    const indice = tarefas.findIndex((tarefa) => tarefa.id === id);

    if (indice < 0) {
      return;
    }

    if (tarefas[indice].status === novoStatus) {
      return;
    }

    const agora = new Date().toISOString();

    tarefas[indice] = {
      ...tarefas[indice],

      status: novoStatus,

      concluida: novoStatus === "concluida",

      atualizadaEm: agora,

      concluidaEm: novoStatus === "concluida" ? agora : "",
    };

    await salvarTarefasFirebase();

    atualizarTelaTarefas();

    mostrarMensagemTarefa(
      novoStatus === "concluida"
        ? "✅ Tarefa concluída."
        : novoStatus === "andamento"
        ? "🚧 Tarefa movida para Em andamento."
        : "📌 Tarefa movida para A fazer."
    );
  }

  window.moverTarefaKanban = async function (id, direcao) {
    const tarefa = tarefas.find((item) => item.id === id);

    if (!tarefa) {
      return;
    }

    const etapas = ["afazer", "andamento", "concluida"];

    const indiceAtual = etapas.indexOf(tarefa.status);

    const novoIndice =
      direcao === "avancar"
        ? Math.min(indiceAtual + 1, etapas.length - 1)
        : Math.max(indiceAtual - 1, 0);

    await alterarStatusTarefa(id, etapas[novoIndice]);
  };

  window.editarTarefaKanban = function (id) {
    editarTarefaPorId(id);
  };

  window.pedirExclusaoTarefa = function (id) {
    const tarefa = tarefas.find((item) => item.id === id);

    if (!tarefa) {
      return;
    }

    idExclusao = id;

    textoModalExcluir.textContent = `Deseja excluir a tarefa "${tarefa.texto}"?`;

    modalExcluir.classList.remove("oculto");

    modalExcluir.style.display = "flex";
  };

  function fecharModalExclusao() {
    idExclusao = null;

    modalExcluir.style.display = "none";

    modalExcluir.classList.add("oculto");
  }

  async function excluirTarefaConfirmada() {
    if (!idExclusao) {
      return;
    }

    const indice = tarefas.findIndex((tarefa) => tarefa.id === idExclusao);

    if (indice < 0) {
      fecharModalExclusao();

      return;
    }

    tarefas.splice(indice, 1);

    if (idEdicao === idExclusao) {
      limparFormulario();
    }

    await salvarTarefasFirebase();

    fecharModalExclusao();

    atualizarTelaTarefas();

    mostrarMensagemTarefa("🗑 Tarefa excluída.");
  }

  /* ================================================== ATUALIZAÇÃO DA TELA ================================================== */

  function atualizarEstatisticas() {
    const hoje = hojeISO();

    const total = tarefas.length;

    const aFazer = tarefas.filter(
      (tarefa) => tarefa.status === "afazer"
    ).length;

    const andamento = tarefas.filter(
      (tarefa) => tarefa.status === "andamento"
    ).length;

    const concluidas = tarefas.filter(
      (tarefa) => tarefa.status === "concluida"
    ).length;

    const paraHoje = tarefas.filter(
      (tarefa) => tarefa.status !== "concluida" && tarefa.data === hoje
    ).length;

    const atrasadas = tarefas.filter(
      (tarefa) =>
        tarefa.status !== "concluida" && tarefa.data && tarefa.data < hoje
    ).length;

    document.getElementById("estatisticaTotalTarefas").textContent = total;

    document.getElementById("estatisticaAFazerTarefas").textContent = aFazer;

    document.getElementById("estatisticaAndamentoTarefas").textContent =
      andamento;

    document.getElementById("estatisticaConcluidasTarefas").textContent =
      concluidas;

    document.getElementById("estatisticaHojeTarefas").textContent = paraHoje;

    document.getElementById("estatisticaAtrasadasTarefas").textContent =
      atrasadas;
  }

  function atualizarResumoFiltros(quantidade) {
    const ativos = [];

    const busca = campoBusca.value.trim();

    if (busca) {
      ativos.push(`Busca: "${busca}"`);
    }

    if (filtroStatus.value !== "todas") {
      ativos.push(
        filtroStatus.options[filtroStatus.selectedIndex].textContent.trim()
      );
    }

    if (filtroPrioridade.value !== "todas") {
      ativos.push(
        filtroPrioridade.options[
          filtroPrioridade.selectedIndex
        ].textContent.trim()
      );
    }

    if (filtroTurma.value !== "todas") {
      ativos.push(
        filtroTurma.options[filtroTurma.selectedIndex].textContent.trim()
      );
    }

    if (ativos.length === 0) {
      resumoFiltros.style.display = "none";

      textoResumoFiltros.textContent = "";

      return;
    }

    resumoFiltros.style.display = "flex";

    textoResumoFiltros.textContent =
      `${quantidade} resultado(s) • ` + ativos.join(" • ");
  }

  function atualizarTelaTarefas() {
    atualizarEstatisticas();

    let filtradas = obterTarefasFiltradas();

    filtradas = ordenarTarefas(filtradas);

    const tarefasAFazer = filtradas.filter(
      (tarefa) => tarefa.status === "afazer"
    );

    const tarefasAndamento = filtradas.filter(
      (tarefa) => tarefa.status === "andamento"
    );

    const tarefasConcluidas = filtradas.filter(
      (tarefa) => tarefa.status === "concluida"
    );

    document.getElementById("contadorColunaAFazer").textContent =
      tarefasAFazer.length;

    document.getElementById("contadorColunaAndamento").textContent =
      tarefasAndamento.length;

    document.getElementById("contadorColunaConcluidas").textContent =
      tarefasConcluidas.length;

    colunaAFazer.innerHTML = tarefasAFazer.length
      ? tarefasAFazer.map(criarHTMLCardTarefa).join("")
      : mensagemColunaVazia("Nenhuma tarefa a fazer.");

    colunaAndamento.innerHTML = tarefasAndamento.length
      ? tarefasAndamento.map(criarHTMLCardTarefa).join("")
      : mensagemColunaVazia("Nenhuma tarefa em andamento.");

    colunaConcluidas.innerHTML = tarefasConcluidas.length
      ? tarefasConcluidas.map(criarHTMLCardTarefa).join("")
      : mensagemColunaVazia("Nenhuma tarefa concluída.");

    const total = tarefas.length;

    const visiveis = filtradas.length;

    if (total === 0) {
      contadorTarefas.textContent = "Nenhuma tarefa cadastrada.";
    } else if (visiveis === 0) {
      contadorTarefas.textContent =
        "Nenhuma tarefa encontrada com os filtros selecionados.";
    } else {
      const pendentes = tarefas.filter(
        (tarefa) => tarefa.status !== "concluida"
      ).length;

      contadorTarefas.textContent =
        `${pendentes} pendente(s) • ` +
        `${total - pendentes} concluída(s) • ` +
        `${total} no total`;
    }

    atualizarResumoFiltros(visiveis);

    configurarArrastarESoltar();
  }

  /* ================================================== EVENTOS ================================================== */

  botaoAdicionar.addEventListener("click", salvarFormularioTarefa, {
    signal: controladorEventosTarefas.signal,
  });

  botaoCancelarEdicao.addEventListener(
    "click",
    () => {
      limparFormulario();

      mostrarMensagemTarefa("↩ Edição cancelada.");
    },
    { signal: controladorEventosTarefas.signal }
  );

  campoNovaTarefa.addEventListener(
    "keydown",
    (evento) => {
      if (evento.key === "Enter") {
        evento.preventDefault();

        salvarFormularioTarefa();
      }

      if (evento.key === "Escape" && idEdicao) {
        limparFormulario();
      }
    },
    { signal: controladorEventosTarefas.signal }
  );

  campoBusca.addEventListener("input", atualizarTelaTarefas, {
    signal: controladorEventosTarefas.signal,
  });

  filtroStatus.addEventListener("change", atualizarTelaTarefas, {
    signal: controladorEventosTarefas.signal,
  });

  filtroPrioridade.addEventListener("change", atualizarTelaTarefas, {
    signal: controladorEventosTarefas.signal,
  });

  filtroTurma.addEventListener("change", atualizarTelaTarefas, {
    signal: controladorEventosTarefas.signal,
  });

  campoOrdenacao.addEventListener("change", atualizarTelaTarefas, {
    signal: controladorEventosTarefas.signal,
  });

  botaoLimparFiltros.addEventListener("click", limparFiltros, {
    signal: controladorEventosTarefas.signal,
  });

  botaoCancelarExclusao.addEventListener("click", fecharModalExclusao, {
    signal: controladorEventosTarefas.signal,
  });

  botaoConfirmarExclusao.addEventListener("click", excluirTarefaConfirmada, {
    signal: controladorEventosTarefas.signal,
  });

  modalExcluir.addEventListener(
    "click",
    (evento) => {
      if (evento.target === modalExcluir) {
        fecharModalExclusao();
      }
    },
    { signal: controladorEventosTarefas.signal }
  );

  function fecharModalTarefaComEscape(evento) {
    if (evento.key === "Escape" && modalExcluir.style.display === "flex") {
      fecharModalExclusao();
    }
  }

  document.addEventListener("keydown", fecharModalTarefaComEscape, {
    signal: controladorEventosTarefas.signal,
  });

  await iniciarTarefasFirebase();
}