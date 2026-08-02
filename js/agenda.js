async function abrirAgenda() {
  if (typeof window.encerrarEscutaAgendaFirebase === "function") {
    try {
      window.encerrarEscutaAgendaFirebase();
    } catch (erroEncerramento) {
      console.warn(
        "Não foi possível encerrar a instância anterior da Agenda:",
        erroEncerramento
      );
    }
  }
  document.body.innerHTML =
    ` <h1>📅 Agenda Inteligente</h1> <div class="card" style="text-align:left;"> <h3 id="tituloFormularioAgenda"> ➕ Novo compromisso </h3> <input id="eventoAgenda" placeholder="Título. Ex.: Prova de Português" > <br><br> <select id="tipoAgenda"> <option value="Aula">📖 Aula</option> <option value="Prova">📝 Prova</option> <option value="Trabalho">🎤 Trabalho</option> <option value="Reunião">👥 Reunião</option> <option value="Correção">📷 Correção</option> <option value="Tarefa">✅ Tarefa</option> <option value="Outro">📌 Outro</option> </select> <br><br> <select id="turmaAgenda"> <option value="">📚 Sem turma</option> </select> <br><br> <input id="disciplinaAgenda" placeholder="Disciplina" > <br><br> <input id="dataAgenda" type="date" > <br><br> <input id="horaInicioAgenda" type="time" > <br><br> <input id="horaFimAgenda" type="time" > <br><br> <select id="lembreteAgenda"> <option value="0">Sem lembrete</option> <option value="5">🔔 5 minutos antes</option> <option value="15">🔔 15 minutos antes</option> <option value="30">🔔 30 minutos antes</option> <option value="60">🔔 1 hora antes</option> <option value="1440">🔔 1 dia antes</option> </select> <br><br> <select id="repeticaoAgenda"> <option value="nenhuma">Não repetir</option> <option value="diaria">Repetir todos os dias</option> <option value="semanal">Repetir toda semana</option> <option value="mensal">Repetir todo mês</option> </select> <br><br> <textarea id="observacaoAgenda" placeholder="Observações" style=" width:90%; min-height:90px; resize:vertical; " ></textarea> <br><br> <button type="button" id="salvarAgendaInteligente" > 💾 Salvar compromisso </button> <button type="button" id="cancelarEdicaoAgenda" class="oculto" > ✖ Cancelar edição </button> </div> <div class="card" style="text-align:left;"> <h3>🔎 Buscar e filtrar</h3> <input id="buscaAgenda" placeholder="Buscar por título, turma ou disciplina..." style="width:90%;" > <br><br> <select id="filtroAgenda"> <option value="todos">📋 Todos</option> <option value="hoje">📅 Hoje</option> <option value="semana">📆 Esta semana</option> <option value="pendentes">⏳ Pendentes</option> <option value="atrasados">🚨 Atrasados</option> <option value="concluidos">✅ Concluídos</option> </select> <br><br> <select id="filtroTurmaAgenda"> <option value="todas">📚 Todas as turmas</option> <option value="">Sem turma</option> </select> </div> <div id="estatisticasAgenda"></div> <div class="card"> <h3>🎨 Visualização</h3> <button type="button" id="verSemanaAgenda"> 📖 Semana </button> <button type="button" id="verMesAgenda"> 📅 Mês </button> <button type="button" id="verListaAgenda"> 📋 Lista </button> </div> <div id="painelAgenda"></div> <div id="modalAgenda" class="oculto" style=" position:fixed; inset:0; z-index:9999; display:flex; align-items:center; justify-content:center; padding:20px; background:rgba(0,0,0,.55); " > <div class="card" style=" width:min(430px,92vw); text-align:left; " > <h3 id="tituloModalAgenda"> Aviso </h3> <p id="mensagemModalAgenda"></p> <div id="acoesModalAgenda" style=" display:flex; justify-content:flex-end; flex-wrap:wrap; gap:10px; margin-top:20px; " ></div> </div> </div> <br> <button type="button" onclick="voltarHome()"> ⬅ Voltar </button> ` + barraInferior("agenda");

  aplicarTemaSalvo();

  const porId = (id) => document.getElementById(id);

  let turmas = [];
  let agenda = [];
  let usuarioAtual = null;
  let referenciaAgenda = null;
  let referenciaTurmas = null;
  let cancelarEscutaAgenda = null;
  let controladorTurmasAgenda = null;
  let uidAgendaAtual = null;
  let recursosAgendaEncerrados = false;

  let indiceEdicao = null;
  let visualizacaoAtual = "lista";
  let filtroAtual = "todos";
  let filtroTurmaAtual = "todas";
  let termoBusca = "";

  const selectTurma = porId("turmaAgenda");

  const filtroTurma = porId("filtroTurmaAgenda");

  function encerrarRecursosAgenda() {
    if (recursosAgendaEncerrados) {
      return;
    }

    recursosAgendaEncerrados = true;

    if (typeof cancelarEscutaAgenda === "function") {
      try {
        cancelarEscutaAgenda();
      } catch (erro) {
        console.warn("Não foi possível encerrar a escuta da Agenda:", erro);
      }
    }

    cancelarEscutaAgenda = null;

    if (controladorTurmasAgenda) {
      controladorTurmasAgenda.abort();

      controladorTurmasAgenda = null;
    }

    if (window.intervaloLembretesAgenda) {
      clearInterval(window.intervaloLembretesAgenda);

      window.intervaloLembretesAgenda = null;
    }

    if (window.encerrarEscutaAgendaFirebase === encerrarRecursosAgenda) {
      window.encerrarEscutaAgendaFirebase = null;
    }
  }

  window.encerrarEscutaAgendaFirebase = encerrarRecursosAgenda;

  function usuarioDaAgendaContinuaAtivo() {
    const usuario =
      window.auth?.currentUser || window.usuarioAtualAjudaProf || null;

    return Boolean(
      usuario &&
        uidAgendaAtual &&
        usuario.uid === uidAgendaAtual &&
        !recursosAgendaEncerrados
    );
  }

  function renderizarOpcoesTurmas() {
    const turmaSelecionada = selectTurma.value;

    const filtroSelecionado = filtroTurma.value;

    selectTurma.innerHTML = '<option value="">📚 Sem turma</option>';

    filtroTurma.innerHTML =
      '<option value="todas">📚 Todas as turmas</option>' +
      '<option value="">Sem turma</option>';

    turmas.forEach((turma) => {
      if (!turma || !turma.nome) {
        return;
      }

      const opcaoFormulario = document.createElement("option");

      opcaoFormulario.value = turma.nome;

      opcaoFormulario.textContent = turma.nome;

      selectTurma.appendChild(opcaoFormulario);

      const opcaoFiltro = document.createElement("option");

      opcaoFiltro.value = turma.nome;

      opcaoFiltro.textContent = turma.nome;

      filtroTurma.appendChild(opcaoFiltro);
    });

    if (
      [...selectTurma.options].some((opcao) => opcao.value === turmaSelecionada)
    ) {
      selectTurma.value = turmaSelecionada;
    }

    if (
      [...filtroTurma.options].some(
        (opcao) => opcao.value === filtroSelecionado
      )
    ) {
      filtroTurma.value = filtroSelecionado;
    } else {
      filtroTurma.value = "todas";

      filtroTurmaAtual = "todas";
    }
  }

  function escaparHTML(valor) {
    return String(valor ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function criarIdAgenda() {
    return (
      "agenda_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9)
    );
  }

  function corTipo(tipo) {
    if (tipo === "Aula") {
      return "#2563EB";
    }

    if (tipo === "Prova") {
      return "#EF4444";
    }

    if (tipo === "Trabalho") {
      return "#F59E0B";
    }

    if (tipo === "Reunião") {
      return "#8B5CF6";
    }

    if (tipo === "Correção") {
      return "#06B6D4";
    }

    if (tipo === "Tarefa") {
      return "#22C55E";
    }

    return "#6B7280";
  }

  function criarDataLocal(dataISO) {
    if (!dataISO) {
      return null;
    }

    const partes = dataISO.split("-");

    if (partes.length !== 3) {
      return null;
    }

    const ano = Number(partes[0]);

    const mes = Number(partes[1]) - 1;

    const dia = Number(partes[2]);

    const data = new Date(ano, mes, dia, 0, 0, 0, 0);

    if (Number.isNaN(data.getTime())) {
      return null;
    }

    return data;
  }

  function dataLocalISO(data) {
    const ano = data.getFullYear();

    const mes = String(data.getMonth() + 1).padStart(2, "0");

    const dia = String(data.getDate()).padStart(2, "0");

    return ano + "-" + mes + "-" + dia;
  }

  function hojeISO() {
    return dataLocalISO(new Date());
  }

  function dataBR(data) {
    if (!data) {
      return "";
    }

    const partes = data.split("-");

    if (partes.length !== 3) {
      return data;
    }

    return partes[2] + "/" + partes[1] + "/" + partes[0];
  }

  function normalizarAgenda(lista) {
    if (!Array.isArray(lista)) {
      return [];
    }

    return lista
      .filter((item) => item && typeof item === "object")
      .map((item) => ({
        ...item,

        id: item.id || criarIdAgenda(),

        titulo: String(item.titulo || "Compromisso").trim(),

        tipo: item.tipo || "Outro",

        turma: item.turma || "",

        disciplina: item.disciplina || "",

        data: item.data || "",

        horaInicio: item.horaInicio || "",

        horaFim: item.horaFim || "",

        lembrete: String(item.lembrete ?? "0"),

        repeticao: item.repeticao || "nenhuma",

        observacao: item.observacao || "",

        ocorrenciasConcluidas: Array.isArray(item.ocorrenciasConcluidas)
          ? item.ocorrenciasConcluidas
          : item.concluido && item.data
          ? [item.data]
          : [],

        ocorrenciasExcluidas: Array.isArray(item.ocorrenciasExcluidas)
          ? item.ocorrenciasExcluidas
          : [],
      }));
  }

  async function carregarTurmasAgenda() {
    if (typeof window.iniciarEscutaTurmasFirebase === "function") {
      try {
        await window.iniciarEscutaTurmasFirebase();
      } catch (erro) {
        console.error(
          "Erro ao iniciar a sincronização de turmas na Agenda:",
          erro
        );
      }
    }

    if (typeof obterTurmasSalvas === "function") {
      const turmasAtuais = obterTurmasSalvas();

      turmas = Array.isArray(turmasAtuais) ? turmasAtuais : [];
    } else {
      turmas = [];
    }

    renderizarOpcoesTurmas();

    controladorTurmasAgenda = new AbortController();

    window.addEventListener(
      "turmasAtualizadasAjudaProf",
      (evento) => {
        if (!usuarioDaAgendaContinuaAtivo()) {
          return;
        }

        if (evento.detail?.uid !== uidAgendaAtual) {
          return;
        }

        turmas = Array.isArray(evento.detail?.turmas)
          ? evento.detail.turmas
          : [];

        renderizarOpcoesTurmas();
      },
      {
        signal: controladorTurmasAgenda.signal,
      }
    );
  }

  async function carregarAgendaFirebase() {
    const { doc, getDoc, onSnapshot } = window.firebaseFirestore;

    usuarioAtual =
      window.auth?.currentUser || window.usuarioAtualAjudaProf || null;

    if (!usuarioAtual) {
      mostrarAvisoAgenda(
        "Login necessário",
        "Faça login para acessar sua agenda."
      );

      return;
    }

    uidAgendaAtual = usuarioAtual.uid;

    referenciaAgenda = doc(
      window.db,
      "usuarios",
      uidAgendaAtual,
      "dados",
      "agenda"
    );

    const documento = await getDoc(referenciaAgenda);

    if (documento.exists()) {
      const dados = documento.data();

      agenda = normalizarAgenda(dados.itens);
    } else {
      agenda = [];
    }

    cancelarEscutaAgenda = onSnapshot(
      referenciaAgenda,
      (snapshot) => {
        if (!usuarioDaAgendaContinuaAtivo()) {
          return;
        }

        if (snapshot.exists()) {
          const dados = snapshot.data();

          agenda = normalizarAgenda(dados.itens);
        } else {
          agenda = [];
        }

        renderizarVisualizacaoAtual();

        window.dispatchEvent(
          new CustomEvent("agendaAtualizadaAjudaProf", {
            detail: {
              uid: uidAgendaAtual,
              agenda: [...agenda],
              origem: snapshot.metadata?.fromCache ? "cache" : "tempo-real",
            },
          })
        );
      },
      (erro) => {
        if (!usuarioDaAgendaContinuaAtivo()) {
          return;
        }

        console.error("Erro ao acompanhar a agenda:", erro);

        mostrarAvisoAgenda(
          "Erro de sincronização",
          "Não foi possível acompanhar as alterações da agenda."
        );
      }
    );
  }

  async function salvarAgendaFirebase() {
    if (!referenciaAgenda || !usuarioDaAgendaContinuaAtivo()) {
      throw new Error("A sessão da Agenda não está mais ativa.");
    }

    const { setDoc, serverTimestamp } = window.firebaseFirestore;

    await setDoc(
      referenciaAgenda,
      {
        itens: agenda,
        atualizadoEm: serverTimestamp(),
      },
      {
        merge: true,
      }
    );
  }

  function textoLembrete(lembrete) {
    if (!lembrete || lembrete === "0") {
      return "Sem lembrete";
    }

    const minutos = parseInt(lembrete, 10);

    if (minutos === 1440) {
      return "1 dia antes";
    }

    if (minutos === 60) {
      return "1 hora antes";
    }

    return minutos + " minuto(s) antes";
  }

  function textoRepeticao(repeticao) {
    if (repeticao === "diaria") {
      return "Todos os dias";
    }

    if (repeticao === "semanal") {
      return "Toda semana";
    }

    if (repeticao === "mensal") {
      return "Todo mês";
    }

    return "Não repetir";
  }

  function mostrarModalAgenda(titulo, mensagem, botoes) {
    const modal = porId("modalAgenda");

    const tituloModal = porId("tituloModalAgenda");

    const mensagemModal = porId("mensagemModalAgenda");

    const acoes = porId("acoesModalAgenda");

    tituloModal.textContent = titulo;

    mensagemModal.textContent = mensagem;

    acoes.innerHTML = "";

    botoes.forEach((botao) => {
      const elemento = document.createElement("button");

      elemento.type = "button";

      elemento.textContent = botao.texto;

      if (botao.classe) {
        elemento.className = botao.classe;
      }

      elemento.onclick = async () => {
        modal.classList.add("oculto");

        if (typeof botao.acao === "function") {
          await botao.acao();
        }
      };

      acoes.appendChild(elemento);
    });

    modal.classList.remove("oculto");
  }

  function mostrarAvisoAgenda(titulo, mensagem, aoFechar) {
    mostrarModalAgenda(titulo, mensagem, [
      {
        texto: "Entendi",
        acao: aoFechar,
      },
    ]);
  }

  function confirmarAgenda(titulo, mensagem, aoConfirmar) {
    mostrarModalAgenda(titulo, mensagem, [
      {
        texto: "Cancelar",
      },
      {
        texto: "Confirmar",
        acao: aoConfirmar,
      },
    ]);
  }

  function limparFormularioAgenda() {
    indiceEdicao = null;

    porId("eventoAgenda").value = "";
    porId("tipoAgenda").value = "Aula";
    porId("turmaAgenda").value = "";
    porId("disciplinaAgenda").value = "";
    porId("dataAgenda").value = "";
    porId("horaInicioAgenda").value = "";
    porId("horaFimAgenda").value = "";
    porId("lembreteAgenda").value = "0";
    porId("repeticaoAgenda").value = "nenhuma";
    porId("observacaoAgenda").value = "";

    porId("tituloFormularioAgenda").textContent = "➕ Novo compromisso";

    porId("salvarAgendaInteligente").textContent = "💾 Salvar compromisso";

    porId("cancelarEdicaoAgenda").classList.add("oculto");
  }

  function adicionarDias(data, quantidade) {
    const resultado = new Date(data);

    resultado.setDate(resultado.getDate() + quantidade);

    return resultado;
  }

  function adicionarMes(dataBase, quantidade) {
    const diaOriginal = dataBase.getDate();

    const resultado = new Date(
      dataBase.getFullYear(),
      dataBase.getMonth() + quantidade,
      1
    );

    const ultimoDiaMes = new Date(
      resultado.getFullYear(),
      resultado.getMonth() + 1,
      0
    ).getDate();

    resultado.setDate(Math.min(diaOriginal, ultimoDiaMes));

    return resultado;
  }

  function gerarOcorrencias(inicioISO, fimISO) {
    const inicio = criarDataLocal(inicioISO);

    const fim = criarDataLocal(fimISO);

    if (!inicio || !fim) {
      return [];
    }

    const ocorrencias = [];

    agenda.forEach((item) => {
      const dataInicial = criarDataLocal(item.data);

      if (!dataInicial) {
        return;
      }

      let datas = [];

      if (!item.repeticao || item.repeticao === "nenhuma") {
        datas = [dataInicial];
      } else if (item.repeticao === "diaria") {
        let atual = new Date(dataInicial);

        let seguranca = 0;

        while (atual <= fim && seguranca < 1000) {
          if (atual >= inicio) {
            datas.push(new Date(atual));
          }

          atual = adicionarDias(atual, 1);

          seguranca++;
        }
      } else if (item.repeticao === "semanal") {
        let atual = new Date(dataInicial);

        let seguranca = 0;

        while (atual <= fim && seguranca < 500) {
          if (atual >= inicio) {
            datas.push(new Date(atual));
          }

          atual = adicionarDias(atual, 7);

          seguranca++;
        }
      } else if (item.repeticao === "mensal") {
        let contadorMes = 0;

        let atual = new Date(dataInicial);

        while (atual <= fim && contadorMes < 120) {
          if (atual >= inicio) {
            datas.push(new Date(atual));
          }

          contadorMes++;

          atual = adicionarMes(dataInicial, contadorMes);
        }
      }

      datas.forEach((dataOcorrencia) => {
        const dataISO = dataLocalISO(dataOcorrencia);

        if (item.ocorrenciasExcluidas.includes(dataISO)) {
          return;
        }

        ocorrencias.push({
          ...item,

          dataOriginal: item.data,

          data: dataISO,

          idSerie: item.id,

          concluido: item.ocorrenciasConcluidas.includes(dataISO),

          recorrente: item.repeticao !== "nenhuma",
        });
      });
    });

    ocorrencias.sort((a, b) => {
      const valorA = a.data + " " + (a.horaInicio || "");

      const valorB = b.data + " " + (b.horaInicio || "");

      return valorA.localeCompare(valorB);
    });

    return ocorrencias;
  }

  function limitesAmpliados() {
    const hoje = new Date();

    const inicio = new Date(hoje);

    inicio.setFullYear(inicio.getFullYear() - 1);

    const fim = new Date(hoje);

    fim.setFullYear(fim.getFullYear() + 1);

    return {
      inicio: dataLocalISO(inicio),

      fim: dataLocalISO(fim),
    };
  }

  function obterOcorrenciasGerais() {
    const limites = limitesAmpliados();

    return gerarOcorrencias(limites.inicio, limites.fim);
  }

  function obterInicioFimSemana() {
    const hoje = new Date();

    hoje.setHours(0, 0, 0, 0);

    const inicio = new Date(hoje);

    inicio.setDate(hoje.getDate() - hoje.getDay());

    const fim = new Date(inicio);

    fim.setDate(inicio.getDate() + 6);

    return {
      inicio: dataLocalISO(inicio),

      fim: dataLocalISO(fim),
    };
  }

  function correspondeBusca(item) {
    if (!termoBusca) {
      return true;
    }

    const texto = [
      item.titulo,
      item.tipo,
      item.turma,
      item.disciplina,
      item.observacao,
    ]
      .join(" ")
      .toLowerCase();

    return texto.includes(termoBusca);
  }

  function aplicarFiltros(ocorrencias) {
    const hoje = hojeISO();

    const semana = obterInicioFimSemana();

    return ocorrencias.filter((item) => {
      if (!correspondeBusca(item)) {
        return false;
      }

      if (
        filtroTurmaAtual !== "todas" &&
        (item.turma || "") !== filtroTurmaAtual
      ) {
        return false;
      }

      if (filtroAtual === "hoje") {
        return item.data === hoje;
      }

      if (filtroAtual === "semana") {
        return item.data >= semana.inicio && item.data <= semana.fim;
      }

      if (filtroAtual === "pendentes") {
        return !item.concluido;
      }

      if (filtroAtual === "atrasados") {
        return item.data < hoje && !item.concluido;
      }

      if (filtroAtual === "concluidos") {
        return item.concluido;
      }

      return true;
    });
  }

  function obterStatusOcorrencia(item) {
    const hoje = hojeISO();

    if (item.concluido) {
      return {
        texto: "Concluído",
        icone: "✅",
        cor: "#22C55E",
      };
    }

    if (item.data < hoje) {
      return {
        texto: "Atrasado",
        icone: "🚨",
        cor: "#EF4444",
      };
    }

    if (item.data === hoje) {
      return {
        texto: "Hoje",
        icone: "📅",
        cor: "#F59E0B",
      };
    }

    return {
      texto: "Pendente",
      icone: "⏳",
      cor: corTipo(item.tipo),
    };
  }

  function renderizarEstatisticas() {
    const ocorrencias = obterOcorrenciasGerais();

    const hoje = hojeISO();

    const total = ocorrencias.length;

    const concluidos = ocorrencias.filter((item) => item.concluido).length;

    const pendentes = ocorrencias.filter((item) => !item.concluido).length;

    const atrasados = ocorrencias.filter(
      (item) => item.data < hoje && !item.concluido
    ).length;

    const eventosHoje = ocorrencias.filter((item) => item.data === hoje).length;

    porId("estatisticasAgenda").innerHTML = ` <div style=" display:grid; grid-template-columns: repeat(auto-fit,minmax(145px,1fr)); gap:12px; margin:16px 0; " > <div class="card"> <div style="font-size:26px;">📌</div> <strong>${total}</strong> <br> <small>Total</small> </div> <div class="card"> <div style="font-size:26px;">⏳</div> <strong>${pendentes}</strong> <br> <small>Pendentes</small> </div> <div class="card"> <div style="font-size:26px;">🚨</div> <strong>${atrasados}</strong> <br> <small>Atrasados</small> </div> <div class="card"> <div style="font-size:26px;">✅</div> <strong>${concluidos}</strong> <br> <small>Concluídos</small> </div> <div class="card"> <div style="font-size:26px;">📅</div> <strong>${eventosHoje}</strong> <br> <small>Hoje</small> </div> </div> `;
  }

  function botaoAcaoAgenda(acao, item, texto) {
    return ` <button type="button" data-acao-agenda="${acao}" data-id-serie="${escaparHTML(item.idSerie)}" data-data-ocorrencia="${escaparHTML(item.data)}" > ${texto} </button> `;
  }

  function renderizarLista() {
    const painel = porId("painelAgenda");

    if (!painel) {
      return;
    }

    const ocorrencias = aplicarFiltros(obterOcorrenciasGerais());

    const hoje = hojeISO();

    const proximos = ocorrencias.filter(
      (item) => item.data >= hoje && !item.concluido
    );

    const atrasados = ocorrencias.filter(
      (item) => item.data < hoje && !item.concluido
    );

    let html = ` <h2>📋 Compromissos</h2> <div class="card"> <strong>📌 Próximos:</strong> ${proximos.length} <br> <strong>🚨 Atrasados:</strong> ${atrasados.length} </div> `;

    if (ocorrencias.length === 0) {
      html += ` <div class="card"> 📭 Nenhum compromisso encontrado. </div> `;

      painel.innerHTML = html;
      return;
    }

    ocorrencias.forEach((item) => {
      const status = obterStatusOcorrencia(item);

      const titulo = escaparHTML(item.titulo || "Compromisso");

      const tipo = escaparHTML(item.tipo || "Outro");

      const turma = escaparHTML(item.turma || "Sem turma");

      const disciplina = escaparHTML(item.disciplina || "Sem disciplina");

      const observacao = escaparHTML(item.observacao || "");

      html += ` <div class="card" style=" text-align:left; border-left: 8px solid ${status.cor}; opacity: ${item.concluido ? ".62" : "1"}; " > <div style=" display:flex; justify-content:space-between; align-items:flex-start; gap:12px; flex-wrap:wrap; " > <h3 style="margin:0;"> ${status.icone} ${titulo} </h3> <span style=" display:inline-block; padding:6px 10px; border-radius:999px; background:${status.cor}; color:white; font-size:12px; font-weight:800; " > ${status.texto} </span> </div> <p>🏷 ${tipo}</p> <p>📚 ${turma}</p> <p>📘 ${disciplina}</p> <p> 📅 ${dataBR(item.data)} </p> <p> ⏰ ${item.horaInicio || "--:--"} até ${item.horaFim || "--:--"} </p> <p> 🔔 ${textoLembrete(item.lembrete)} </p> <p> 🔄 ${textoRepeticao(item.repeticao)} </p> ${ item.recorrente ? ` <p> 🔗 Ocorrência de um compromisso recorrente </p> ` : "" } ${observacao ? `<p>📝 ${observacao}</p>` : ""} ${botaoAcaoAgenda( "concluir", item, item.concluido ? "↩ Desmarcar" : "✅ Concluir" )} ${botaoAcaoAgenda("editar", item, "✏ Editar")} ${botaoAcaoAgenda( "excluir", item, item.recorrente ? "🗑 Excluir série" : "🗑 Excluir" )} </div> `;
    });

    painel.innerHTML = html;
  }

  function renderizarSemana() {
    const semana = obterInicioFimSemana();

    const ocorrencias = aplicarFiltros(
      gerarOcorrencias(semana.inicio, semana.fim)
    );

    const inicio = criarDataLocal(semana.inicio);

    let html = ` <h2>📖 Planejamento semanal</h2> `;

    for (let i = 0; i < 7; i++) {
      const dia = adicionarDias(inicio, i);

      const iso = dataLocalISO(dia);

      const eventosDia = ocorrencias.filter((item) => item.data === iso);

      html += ` <div class="card" style="text-align:left;" > <h3> 📅 ${dataBR(iso)} </h3> `;

      if (eventosDia.length === 0) {
        html += ` <p>Nenhum compromisso.</p> `;
      }

      eventosDia.forEach((item) => {
        const status = obterStatusOcorrencia(item);

        html += ` <div style=" border-left: 6px solid ${status.cor}; padding:10px; margin:10px 0; background:rgba(127,127,127,.08); border-radius:12px; opacity: ${item.concluido ? ".6" : "1"}; " > <strong> ${status.icone} ${escaparHTML(item.titulo)} </strong> <br> ${item.horaInicio || "--:--"} • ${escaparHTML(item.tipo || "Outro")} <br> ${escaparHTML(item.turma || "Sem turma")} </div> `;
      });

      html += "</div>";
    }

    porId("painelAgenda").innerHTML = html;
  }

  function renderizarMes() {
    const hoje = new Date();

    const ano = hoje.getFullYear();

    const mes = hoje.getMonth();

    const primeiro = new Date(ano, mes, 1);

    const ultimo = new Date(ano, mes + 1, 0);

    const inicioISO = dataLocalISO(primeiro);

    const fimISO = dataLocalISO(ultimo);

    const ocorrencias = aplicarFiltros(gerarOcorrencias(inicioISO, fimISO));

    let html = ` <h2> 📅 Calendário mensal </h2> <div style=" display:grid; grid-template-columns: repeat(7,minmax(90px,1fr)); gap:6px; font-size:13px; overflow-x:auto; " > `;

    ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].forEach((dia) => {
      html += ` <div style=" font-weight:800; text-align:center; " > ${dia} </div> `;
    });

    for (let vazio = 0; vazio < primeiro.getDay(); vazio++) {
      html += "<div></div>";
    }

    for (let numeroDia = 1; numeroDia <= ultimo.getDate(); numeroDia++) {
      const dataAtual = new Date(ano, mes, numeroDia);

      const iso = dataLocalISO(dataAtual);

      const eventosDia = ocorrencias.filter((item) => item.data === iso);

      html += ` <div class="card" style=" min-height:100px; padding:8px; text-align:left; " > <strong> ${numeroDia} </strong> <br> `;

      eventosDia.slice(0, 3).forEach((item) => {
        const status = obterStatusOcorrencia(item);

        html += ` <div style=" margin-top:5px; padding:5px; border-radius:8px; background:${status.cor}; color:white; font-size:11px; opacity: ${item.concluido ? ".65" : "1"}; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; " title="${escaparHTML(item.titulo)}" > ${item.concluido ? "✓ " : ""} ${escaparHTML(item.titulo)} </div> `;
      });

      if (eventosDia.length > 3) {
        html += ` <small> +${eventosDia.length - 3} evento(s) </small> `;
      }

      html += "</div>";
    }

    html += "</div>";

    porId("painelAgenda").innerHTML = html;
  }

  function renderizarVisualizacaoAtual() {
    renderizarEstatisticas();

    if (visualizacaoAtual === "semana") {
      renderizarSemana();
      return;
    }

    if (visualizacaoAtual === "mes") {
      renderizarMes();
      return;
    }

    renderizarLista();
  }

  function localizarItemSerie(idSerie) {
    return agenda.find((item) => item.id === idSerie);
  }

  async function alternarConclusao(idSerie, dataOcorrencia) {
    const item = localizarItemSerie(idSerie);

    if (!item) {
      return;
    }

    const posicao = item.ocorrenciasConcluidas.indexOf(dataOcorrencia);

    if (posicao >= 0) {
      item.ocorrenciasConcluidas.splice(posicao, 1);
    } else {
      item.ocorrenciasConcluidas.push(dataOcorrencia);
    }

    try {
      await salvarAgendaFirebase();

      renderizarVisualizacaoAtual();
    } catch (erro) {
      console.error("Erro ao atualizar compromisso:", erro);

      mostrarAvisoAgenda(
        "Erro ao salvar",
        "Não foi possível atualizar o compromisso."
      );
    }
  }

  function excluirSerie(idSerie) {
    const index = agenda.findIndex((item) => item.id === idSerie);

    if (index < 0) {
      return;
    }

    confirmarAgenda(
      "Excluir compromisso",
      agenda[index].repeticao !== "nenhuma"
        ? "Esse compromisso é recorrente. Toda a série será excluída."
        : "Deseja excluir este compromisso?",
      async () => {
        const itemRemovido = agenda[index];

        agenda.splice(index, 1);

        try {
          await salvarAgendaFirebase();

          if (indiceEdicao === index) {
            limparFormularioAgenda();
          } else if (indiceEdicao !== null && index < indiceEdicao) {
            indiceEdicao--;
          }

          renderizarVisualizacaoAtual();

          mostrarToast("🗑 Compromisso excluído.");
        } catch (erro) {
          console.error("Erro ao excluir compromisso:", erro);

          agenda.splice(index, 0, itemRemovido);

          renderizarVisualizacaoAtual();

          mostrarAvisoAgenda(
            "Erro ao excluir",
            "Não foi possível excluir o compromisso."
          );
        }
      }
    );
  }

  function editarSerie(idSerie) {
    const index = agenda.findIndex((item) => item.id === idSerie);

    if (index < 0) {
      return;
    }

    const item = agenda[index];

    indiceEdicao = index;

    porId("eventoAgenda").value = item.titulo || "";

    porId("tipoAgenda").value = item.tipo || "Outro";

    porId("turmaAgenda").value = item.turma || "";

    porId("disciplinaAgenda").value = item.disciplina || "";

    porId("dataAgenda").value = item.data || "";

    porId("horaInicioAgenda").value = item.horaInicio || "";

    porId("horaFimAgenda").value = item.horaFim || "";

    porId("lembreteAgenda").value = item.lembrete || "0";

    porId("repeticaoAgenda").value = item.repeticao || "nenhuma";

    porId("observacaoAgenda").value = item.observacao || "";

    porId("tituloFormularioAgenda").textContent =
      item.repeticao !== "nenhuma"
        ? "✏ Editar série recorrente"
        : "✏ Editar compromisso";

    porId("salvarAgendaInteligente").textContent = "💾 Salvar alterações";

    porId("cancelarEdicaoAgenda").classList.remove("oculto");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  porId("painelAgenda").addEventListener("click", (evento) => {
    const botao = evento.target.closest("[data-acao-agenda]");

    if (!botao) {
      return;
    }

    const acao = botao.dataset.acaoAgenda;

    const idSerie = botao.dataset.idSerie;

    const dataOcorrencia = botao.dataset.dataOcorrencia;

    if (acao === "concluir") {
      alternarConclusao(idSerie, dataOcorrencia);

      return;
    }

    if (acao === "editar") {
      editarSerie(idSerie);

      return;
    }

    if (acao === "excluir") {
      excluirSerie(idSerie);
    }
  });

  function solicitarPermissaoNotificacao() {
    if (!("Notification" in window)) {
      return;
    }

    if (Notification.permission === "default") {
      Notification.requestPermission().catch((erro) => {
        console.warn("Não foi possível solicitar notificações:", erro);
      });
    }
  }

  function verificarLembretes() {
    if (!usuarioDaAgendaContinuaAtivo()) {
      return;
    }

    if (!("Notification" in window)) {
      return;
    }

    if (Notification.permission !== "granted") {
      return;
    }

    const agora = new Date();

    const hoje = hojeISO();

    const amanha = dataLocalISO(adicionarDias(new Date(), 1));

    const ocorrencias = gerarOcorrencias(hoje, amanha);

    ocorrencias.forEach((item) => {
      if (!item.lembrete || item.lembrete === "0" || item.concluido) {
        return;
      }

      const horaEvento = item.horaInicio || "00:00";

      const momentoEvento = new Date(item.data + "T" + horaEvento + ":00");

      if (Number.isNaN(momentoEvento.getTime())) {
        return;
      }

      const minutosAntes = parseInt(item.lembrete, 10);

      if (Number.isNaN(minutosAntes)) {
        return;
      }

      const momentoLembrete = new Date(
        momentoEvento.getTime() - minutosAntes * 60000
      );

      const chave =
        "lembreteAgenda_" +
        usuarioAtual.uid +
        "_" +
        item.idSerie +
        "_" +
        item.data +
        "_" +
        horaEvento;

      if (
        agora >= momentoLembrete &&
        agora <= momentoEvento &&
        localStorage.getItem(chave) !== "ok"
      ) {
        new Notification("🔔 Ajuda+Prof", {
          body: (item.titulo || "Compromisso") + " às " + horaEvento,
        });

        localStorage.setItem(chave, "ok");
      }
    });
  }

  porId("cancelarEdicaoAgenda").onclick = function () {
    limparFormularioAgenda();

    mostrarToast("↩ Edição cancelada.");
  };

  porId("salvarAgendaInteligente").onclick = async function () {
    const campoTitulo = porId("eventoAgenda");

    const campoData = porId("dataAgenda");

    const campoHoraInicio = porId("horaInicioAgenda");

    const campoHoraFim = porId("horaFimAgenda");

    const titulo = campoTitulo.value.trim();

    const data = campoData.value;

    const horaInicio = campoHoraInicio.value;

    const horaFim = campoHoraFim.value;

    if (titulo === "") {
      mostrarAvisoAgenda(
        "Título obrigatório",
        "Digite o título do compromisso.",
        () => campoTitulo.focus()
      );

      return;
    }

    if (data === "") {
      mostrarAvisoAgenda(
        "Data obrigatória",
        "Escolha a data do compromisso.",
        () => campoData.focus()
      );

      return;
    }

    if (horaInicio && horaFim && horaFim < horaInicio) {
      mostrarAvisoAgenda(
        "Horário inválido",
        "O horário de término não pode ser anterior ao horário de início.",
        () => campoHoraFim.focus()
      );

      return;
    }

    const itemAnterior = indiceEdicao !== null ? agenda[indiceEdicao] : null;

    const item = {
      id: itemAnterior?.id || criarIdAgenda(),

      titulo: titulo,

      tipo: porId("tipoAgenda").value,

      turma: porId("turmaAgenda").value,

      disciplina: porId("disciplinaAgenda").value.trim(),

      data: data,

      horaInicio: horaInicio,

      horaFim: horaFim,

      lembrete: porId("lembreteAgenda").value,

      repeticao: porId("repeticaoAgenda").value,

      observacao: porId("observacaoAgenda").value.trim(),

      ocorrenciasConcluidas: itemAnterior?.ocorrenciasConcluidas || [],

      ocorrenciasExcluidas: itemAnterior?.ocorrenciasExcluidas || [],
    };

    const estavaEditando = indiceEdicao !== null;

    let copiaAnterior = null;

    if (estavaEditando) {
      copiaAnterior = agenda[indiceEdicao];

      agenda[indiceEdicao] = item;
    } else {
      agenda.push(item);
    }

    try {
      await salvarAgendaFirebase();

      solicitarPermissaoNotificacao();

      limparFormularioAgenda();

      renderizarVisualizacaoAtual();

      mostrarToast(
        estavaEditando ? "✅ Alterações salvas." : "✅ Compromisso salvo."
      );
    } catch (erro) {
      console.error("Erro ao salvar compromisso:", erro);

      if (estavaEditando) {
        agenda[indiceEdicao] = copiaAnterior;
      } else {
        agenda.pop();
      }

      renderizarVisualizacaoAtual();

      mostrarAvisoAgenda(
        "Erro ao salvar",
        "Não foi possível salvar o compromisso."
      );
    }
  };

  porId("buscaAgenda").addEventListener("input", (evento) => {
    termoBusca = evento.target.value.trim().toLowerCase();

    renderizarVisualizacaoAtual();
  });

  porId("filtroAgenda").addEventListener("change", (evento) => {
    filtroAtual = evento.target.value;

    renderizarVisualizacaoAtual();
  });

  porId("filtroTurmaAgenda").addEventListener("change", (evento) => {
    filtroTurmaAtual = evento.target.value;

    renderizarVisualizacaoAtual();
  });

  porId("verListaAgenda").onclick = function () {
    visualizacaoAtual = "lista";

    renderizarVisualizacaoAtual();
  };

  porId("verSemanaAgenda").onclick = function () {
    visualizacaoAtual = "semana";

    renderizarVisualizacaoAtual();
  };

  porId("verMesAgenda").onclick = function () {
    visualizacaoAtual = "mes";

    renderizarVisualizacaoAtual();
  };

  try {
    await carregarAgendaFirebase();

    await carregarTurmasAgenda();

    renderizarVisualizacaoAtual();
  } catch (erro) {
    console.error("Erro ao carregar a agenda:", erro);

    mostrarAvisoAgenda(
      "Erro ao carregar",
      "Não foi possível carregar os dados da agenda."
    );
  }

  if (window.intervaloLembretesAgenda) {
    clearInterval(window.intervaloLembretesAgenda);

    window.intervaloLembretesAgenda = null;
  }

  window.intervaloLembretesAgenda = setInterval(verificarLembretes, 60000);

  verificarLembretes();
}