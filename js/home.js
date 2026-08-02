/* ========================================================= AJUDA+PROF — HOME Painel inicial e navegação principal ========================================================= */

/* ========================================================= FUNÇÕES AUXILIARES ========================================================= */

/* Lê dados do armazenamento utilizando o módulo storage.js. Caso lerDados() ainda não esteja disponível, utiliza uma leitura segura diretamente do localStorage. */
async function lerDadosHome(chave, valorPadrao = null) {
  if (typeof window.lerDados === "function") {
    try {
      const resultado = await window.lerDados(chave, valorPadrao);

      return resultado;
    } catch (erro) {
      console.warn(
        `Falha na camada de armazenamento ao ler "${chave}" na Home:`,
        erro
      );
    }
  }

  try {
    const conteudo = localStorage.getItem(chave);

    if (conteudo === null) {
      return valorPadrao;
    }

    return JSON.parse(conteudo);
  } catch (erro) {
    console.error(`Erro ao ler "${chave}" na Home:`, erro);

    return valorPadrao;
  }
}

/* Lê, sem gravar, um documento do usuário atual no Cloud Firestore. Aceita os formatos: - { itens: [...] } - { valor: [...] } O suporte ao campo "valor" existe apenas para compatibilidade com dados antigos. */
async function lerDocumentoUsuarioHome(nomeDocumento, valorPadrao = []) {
  const usuario =
    window.auth?.currentUser || window.usuarioAtualAjudaProf || null;

  if (!usuario || !window.db || !window.firebaseFirestore) {
    return valorPadrao;
  }

  try {
    const { doc, getDoc } = window.firebaseFirestore;

    const referencia = doc(
      window.db,
      "usuarios",
      usuario.uid,
      "dados",
      nomeDocumento
    );

    const snapshot = await getDoc(referencia);

    if (!snapshot.exists()) {
      return valorPadrao;
    }

    const dados = snapshot.data() || {};

    if (Array.isArray(dados.itens)) {
      return dados.itens;
    }

    if (Array.isArray(dados.valor)) {
      return dados.valor;
    }

    return valorPadrao;
  } catch (erro) {
    console.error(`Erro ao ler "${nomeDocumento}" do Firestore na Home:`, erro);

    return valorPadrao;
  }
}

async function carregarTurmasHome() {
  const turmasFirestore = await lerDocumentoUsuarioHome("turmas", []);

  if (Array.isArray(turmasFirestore)) {
    return turmasFirestore;
  }

  if (typeof obterTurmasSalvas === "function") {
    const turmasMemoria = obterTurmasSalvas();

    if (Array.isArray(turmasMemoria)) {
      return turmasMemoria;
    }
  }

  const turmasLegadas = await lerDadosHome("turmas", []);

  return Array.isArray(turmasLegadas) ? turmasLegadas : [];
}

async function carregarHistoricoHome() {
  const usuario =
    window.auth?.currentUser || window.usuarioAtualAjudaProf || null;

  if (
    !usuario ||
    !window.db ||
    !window.firebaseFirestore?.collection ||
    !window.firebaseFirestore?.getDocs
  ) {
    return [];
  }

  try {
    const referencia = window.firebaseFirestore.collection(
      window.db,
      "usuarios",
      usuario.uid,
      "historico"
    );

    const snapshot = await window.firebaseFirestore.getDocs(referencia);

    const registros = [];

    snapshot.forEach((documento) => {
      registros.push({
        id: documento.id,
        ...documento.data(),
      });
    });

    return registros.sort((registroA, registroB) => {
      const dataA =
        registroA.criadoEm?.toDate?.()?.getTime?.() ||
        new Date(registroA.criadoEmISO || 0).getTime() ||
        0;

      const dataB =
        registroB.criadoEm?.toDate?.()?.getTime?.() ||
        new Date(registroB.criadoEmISO || 0).getTime() ||
        0;

      return dataA - dataB;
    });
  } catch (erro) {
    console.error("Erro ao carregar o histórico da Home:", erro);

    return [];
  }
}

async function carregarAgendaHome() {
  const agendaFirestore = await lerDocumentoUsuarioHome("agenda", []);

  if (Array.isArray(agendaFirestore) && agendaFirestore.length > 0) {
    return agendaFirestore;
  }

  const agendaInteligente = await lerDadosHome("agendaInteligente", []);

  if (Array.isArray(agendaInteligente) && agendaInteligente.length > 0) {
    return agendaInteligente;
  }

  const agendaAntiga = await lerDadosHome("agenda", []);

  return Array.isArray(agendaAntiga) ? agendaAntiga : [];
}

/* Converte qualquer valor em texto seguro antes de inseri-lo dentro do HTML. Evita que nomes de turmas, alunos ou eventos sejam interpretados como código HTML. */
function escaparHTMLHome(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* Retorna o estado atual da sincronização. A verificação com typeof evita erro caso o módulo de autenticação ainda esteja carregando. */
function obterStatusSincronizacaoHome() {
  if (typeof statusSincronizacaoAjudaProf !== "undefined") {
    return statusSincronizacaoAjudaProf || "aguardando";
  }

  return "aguardando";
}

/* Centraliza os dados visuais dos estados de sincronização utilizados na Home. */
function obterDadosStatusHome() {
  return {
    aguardando: {
      icone: "cloud_queue",
      texto: "Verificando conexão",
      classe: "statusAguardando",
    },

    sincronizando: {
      icone: "cloud_sync",
      texto: "Verificando conexão...",
      classe: "statusSincronizando",
    },

    sincronizado: {
      icone: "cloud_done",
      texto: "Nuvem disponível",
      classe: "statusSincronizado",
    },

    offline: {
      icone: "cloud_off",
      texto: "Sem conexão",
      classe: "statusOffline",
    },

    erro: {
      icone: "error",
      texto: "Erro de conexão",
      classe: "statusErro",
    },
  };
}

/* ========================================================= ALERTAS DA AGENDA ========================================================= */

function gerarAlertasAgenda(agendaRecebida = []) {
  const agenda = Array.isArray(agendaRecebida) ? agendaRecebida : [];

  const hoje = new Date();

  hoje.setHours(0, 0, 0, 0);

  const alertas = [];

  agenda
    .filter((item) => item && !item.concluido)
    .sort((itemA, itemB) => {
      const dataA = (itemA.data || "") + " " + (itemA.horaInicio || "");

      const dataB = (itemB.data || "") + " " + (itemB.horaInicio || "");

      return dataA.localeCompare(dataB);
    })
    .forEach((item) => {
      if (!item.data) {
        return;
      }

      const dataItem = new Date(item.data + "T00:00:00");

      if (Number.isNaN(dataItem.getTime())) {
        return;
      }

      const diferenca = Math.ceil((dataItem - hoje) / (1000 * 60 * 60 * 24));

      if (diferenca < 0) {
        return;
      }

      const horario = item.horaInicio ? " • " + item.horaInicio : "";

      const titulo = item.titulo || item.evento || "Compromisso";

      if (diferenca === 0) {
        alertas.push("📌 Hoje" + horario + ": " + titulo);

        return;
      }

      if (diferenca === 1) {
        alertas.push("🔔 Amanhã" + horario + ": " + titulo);

        return;
      }

      if (diferenca <= 7) {
        alertas.push("📅 Em " + diferenca + " dias" + horario + ": " + titulo);
      }
    });

  return alertas.slice(0, 3);
}

/* Monta o HTML dos compromissos próximos. */
function criarHTMLAlertasAgendaHome(alertasAgenda) {
  if (!Array.isArray(alertasAgenda) || alertasAgenda.length === 0) {
    return `
      <div class="card textoEsquerda">
        ✅ Nenhum compromisso para os próximos dias.
      </div>
    `;
  }

  return alertasAgenda
    .map(
      (alerta) => `
      <div class="card textoEsquerda">
        ${escaparHTMLHome(alerta)}
      </div>
    `
    )
    .join("");
}

/* ========================================================= HOME ========================================================= */

async function voltarHome() {
  const [historicoCarregado, turmasCarregadas, agendaCarregada] =
    await Promise.all([
      carregarHistoricoHome(),
      carregarTurmasHome(),
      carregarAgendaHome(),
    ]);

  const historicoHome = Array.isArray(historicoCarregado)
    ? historicoCarregado
    : [];

  const turmasHome = Array.isArray(turmasCarregadas) ? turmasCarregadas : [];

  const agendaHome = Array.isArray(agendaCarregada) ? agendaCarregada : [];

  let totalAlunos = 0;
  let totalAtividades = 0;

  turmasHome.forEach((turma) => {
    if (Array.isArray(turma?.alunos)) {
      totalAlunos += turma.alunos.length;
    }

    if (Array.isArray(turma?.avaliacoes)) {
      totalAtividades += turma.avaliacoes.length;
    }
  });

  const ultimoRegistro =
    historicoHome.length > 0 ? historicoHome[historicoHome.length - 1] : null;

  const ultimaTurma = ultimoRegistro
    ? ultimoRegistro.turma || "Sem turma"
    : "Nenhuma turma recente";

  const nomeUltimoAluno = ultimoRegistro
    ? ultimoRegistro.nome || ultimoRegistro.aluno || "Aluno"
    : "";

  const notaUltimaCorrecao = ultimoRegistro ? ultimoRegistro.nota ?? "-" : "";

  const ultimaCorrecao = ultimoRegistro
    ? nomeUltimoAluno + " — Nota " + notaUltimaCorrecao
    : "Nenhuma correção recente";

  const alertasAgenda = gerarAlertasAgenda(agendaHome);

  const htmlAlertasAgenda = criarHTMLAlertasAgendaHome(alertasAgenda);

  const usuarioHome =
    window.usuarioAtualAjudaProf || window.auth?.currentUser || null;

  const nomeProfessorHome =
    usuarioHome?.displayName ||
    usuarioHome?.email?.split("@")[0] ||
    "Professor";

  const dadosStatusHome = obterDadosStatusHome();

  const statusHome = obterStatusSincronizacaoHome();

  const statusExibidoHome =
    dadosStatusHome[statusHome] || dadosStatusHome.aguardando;

  document.body.innerHTML =
    `
    <div class="cabecalho cabecalhoCompacto"></div>

    <div
      id="home"
      class="homeGrid"
    >

      <div class="heroHome">

        <div class="heroTopo">

          <h2>
            👋 Olá, ${escaparHTMLHome(nomeProfessorHome)}!
          </h2>

          <p>
            Corrija provas, organize tarefas e ensine melhor.
          </p>

          <button
            type="button"
            class="statusNuvemHome ${statusExibidoHome.classe}"
            data-acao="configuracoes"
            title="Abrir configurações de sincronização"
          >

            <span
              id="iconeSincronizacaoHome"
              class="material-icons-round"
            >
              ${statusExibidoHome.icone}
            </span>

            <span id="statusSincronizacaoHome">
              ${statusExibidoHome.texto}
            </span>

          </button>

        </div>

        <div class="heroIndicadores">

          <div class="heroItem">

            <span class="material-icons-round">
              groups
            </span>

            <strong>
              ${turmasHome.length}
            </strong>

            <small>
              Turmas
            </small>

          </div>

          <div class="heroItem">

            <span class="material-icons-round">
              school
            </span>

            <strong>
              ${totalAlunos}
            </strong>

            <small>
              Alunos
            </small>

          </div>

          <div class="heroItem">

            <span class="material-icons-round">
              assignment
            </span>

            <strong>
              ${totalAtividades}
            </strong>

            <small>
              Atividades
            </small>

          </div>

        </div>

        <div class="heroResumo">

          <p>

            <strong>
              📚 Última turma
            </strong>

            <br>

            ${escaparHTMLHome(ultimaTurma)}

          </p>

          <p>

            <strong>
              📷 Última correção
            </strong>

            <br>

            ${escaparHTMLHome(ultimaCorrecao)}

          </p>

          <p>

            <strong>
              📊 Registros salvos
            </strong>

            <br>

            ${historicoHome.length} correção(ões)

          </p>

          <h2>
            🔔 Próximos compromissos
          </h2>

          ${htmlAlertasAgenda}

        </div>

      </div>

      <button
        type="button"
        data-acao="correcao"
      >

        <span class="iconeHome material-icons-round">
          photo_camera
        </span>

        <span>
          Corrigir Prova
        </span>

        <small>
          Corrija cartões-resposta
        </small>

      </button>

      <button
        type="button"
        data-acao="atividades"
      >

        <span class="iconeHome material-icons-round">
          fact_check
        </span>

        <span>
          Controle de Atividades
        </span>

        <small>
          Lance exercícios por turma
        </small>

      </button>

      <button
        type="button"
        data-acao="turmas"
      >

        <span class="iconeHome material-icons-round">
          groups
        </span>

        <span>
          Turmas
        </span>

        <small>
          Gerencie alunos
        </small>

      </button>

      <button
        type="button"
        data-acao="agenda"
      >

        <span class="iconeHome material-icons-round">
          calendar_month
        </span>

        <span>
          Agenda
        </span>

        <small>
          Compromissos escolares
        </small>

      </button>

      <button
        type="button"
        data-acao="tarefas"
      >

        <span class="iconeHome material-icons-round">
          task_alt
        </span>

        <span>
          Tarefas
        </span>

        <small>
          Organize atividades
        </small>

      </button>

      <button
        type="button"
        data-acao="bncc"
      >

        <span class="iconeHome material-icons-round">
          menu_book
        </span>

        <span>
          BNCC
        </span>

        <small>
          Consultar habilidades
        </small>

      </button>

      <button
        type="button"
        data-acao="resumo"
      >

        <span class="iconeHome material-icons-round">
          analytics
        </span>

        <span>
          Resumo
        </span>

        <small>
          Veja estatísticas
        </small>

      </button>

      <button
        type="button"
        data-acao="historico"
      >

        <span class="iconeHome material-icons-round">
          history
        </span>

        <span>
          Histórico
        </span>

        <small>
          Correções salvas
        </small>

      </button>

      <button
        type="button"
        data-acao="qrcode"
      >

        <span class="iconeHome material-icons-round">
          qr_code_scanner
        </span>

        <span>
          QR Code
        </span>

        <small>
          Crie códigos rápidos
        </small>

      </button>

      <button
        type="button"
        data-acao="favoritosBNCC"
      >

        <span class="iconeHome material-icons-round">
          bookmark
        </span>

        <span>
          Favoritos BNCC
        </span>

        <small>
          Habilidades salvas
        </small>

      </button>

      <button
        type="button"
        data-acao="painelPedagogico"
      >

        <span class="iconeHome material-icons-round">
          dashboard
        </span>

        <span>
          Painel Pedagógico
        </span>

        <small>
          Gráficos e desempenho
        </small>

      </button>

      <button
        type="button"
        data-acao="planejamento"
      >

        <span class="iconeHome material-icons-round">
          edit_note
        </span>

        <span>
          Planejamento
        </span>

        <small>
          Planos de aula
        </small>

      </button>

      <button
        type="button"
        class="botaoOculto"
        data-acao="restaurarBackup"
      >

        <span class="iconeHome material-icons-round">
          restore
        </span>

        <span>
          Restaurar Backup
        </span>

        <small>
          Carregar dados salvos
        </small>

      </button>

      <button
        type="button"
        data-acao="configuracoes"
      >

        <span class="iconeHome material-icons-round">
          settings
        </span>

        <span>
          Configurações
        </span>

        <small>
          Ajustes e backup
        </small>

      </button>

      <input
        id="arquivoBackup"
        type="file"
        accept=".json,application/json"
        class="oculto"
      >

    </div>
  ` + (typeof barraInferior === "function" ? barraInferior("home") : "");

  iniciarBotoes();

  if (typeof aplicarTemaSalvo === "function") {
    aplicarTemaSalvo();
  }

  atualizarStatusSincronizacaoHomeAjudaProf();
}

/* ========================================================= STATUS DA SINCRONIZAÇÃO ========================================================= */

function atualizarStatusSincronizacaoHomeAjudaProf() {
  const elementoStatus = document.getElementById("statusSincronizacaoHome");

  const elementoIcone = document.getElementById("iconeSincronizacaoHome");

  const botaoStatus = document.querySelector(".statusNuvemHome");

  /* Se a Home não estiver aberta, os elementos não existirão. */
  if (!elementoStatus || !elementoIcone || !botaoStatus) {
    return;
  }

  const dadosStatus = obterDadosStatusHome();

  const nomeStatusAtual = obterStatusSincronizacaoHome();

  const statusAtual = dadosStatus[nomeStatusAtual] || dadosStatus.aguardando;

  elementoStatus.textContent = statusAtual.texto;

  elementoIcone.textContent = statusAtual.icone;

  botaoStatus.classList.remove(
    "statusAguardando",
    "statusSincronizando",
    "statusSincronizado",
    "statusOffline",
    "statusErro"
  );

  botaoStatus.classList.add(statusAtual.classe);
}

/* ========================================================= NAVEGAÇÃO ========================================================= */

function abrirHome() {
  voltarHome();
}

/* Exibe um aviso quando um módulo não estiver disponível. */
function informarModuloIndisponivelHome(nomeModulo) {
  console.warn("Função não encontrada para o módulo:", nomeModulo);

  if (typeof mostrarAlerta === "function") {
    mostrarAlerta({
      titulo: "Função indisponível",

      mensagem: `Não foi possível abrir ${nomeModulo}. Recarregue a página e tente novamente.`,

      icone: "error",

      textoBotao: "Entendi",
    });

    return;
  }

  if (typeof mostrarToast === "function") {
    mostrarToast(`Não foi possível abrir ${nomeModulo}.`);
  }
}

/* Executa uma função global pelo nome. Isso evita ReferenceError caso algum arquivo JavaScript não tenha sido carregado. */
function executarAcaoHome(nomeFuncao, nomeModulo) {
  const funcao = window[nomeFuncao];

  if (typeof funcao !== "function") {
    informarModuloIndisponivelHome(nomeModulo);

    return;
  }

  try {
    const resultado = funcao();

    if (resultado && typeof resultado.then === "function") {
      resultado.catch((erro) => {
        console.error(`Erro ao abrir ${nomeModulo}:`, erro);

        informarModuloIndisponivelHome(nomeModulo);
      });
    }
  } catch (erro) {
    console.error(`Erro ao abrir ${nomeModulo}:`, erro);

    informarModuloIndisponivelHome(nomeModulo);
  }
}

function iniciarBotoes() {
  const acoesHome = {
    correcao: {
      funcao: "abrirCorrecao",
      modulo: "Correção de provas",
    },

    atividades: {
      funcao: "abrirControleAtividadesHome",
      modulo: "Controle de atividades",
    },

    turmas: {
      funcao: "abrirTurmas",
      modulo: "Turmas",
    },

    agenda: {
      funcao: "abrirAgenda",
      modulo: "Agenda",
    },

    tarefas: {
      funcao: "abrirTarefas",
      modulo: "Tarefas",
    },

    bncc: {
      funcao: "abrirBNCC",
      modulo: "BNCC",
    },

    resumo: {
      funcao: "abrirResumo",
      modulo: "Resumo",
    },

    historico: {
      funcao: "abrirHistorico",
      modulo: "Histórico",
    },

    qrcode: {
      funcao: "abrirQRCode",
      modulo: "QR Code",
    },

    favoritosBNCC: {
      funcao: "abrirFavoritosBNCC",
      modulo: "Favoritos da BNCC",
    },

    painelPedagogico: {
      funcao: "abrirPainelPedagogico",
      modulo: "Painel Pedagógico",
    },

    planejamento: {
      funcao: "abrirPlanejamento",
      modulo: "Planejamento",
    },

    configuracoes: {
      funcao: "abrirConfiguracoes",
      modulo: "Configurações",
    },
  };

  const botoes = document.querySelectorAll("#home button[data-acao]");

  botoes.forEach((botao) => {
    const nomeAcao = botao.dataset.acao;

    /* O botão de restaurar backup apenas abre o seletor de arquivo. */
    if (nomeAcao === "restaurarBackup") {
      botao.addEventListener("click", () => {
        const campoArquivo = document.getElementById("arquivoBackup");

        if (campoArquivo) {
          campoArquivo.click();
        }
      });

      return;
    }

    const configuracaoAcao = acoesHome[nomeAcao];

    if (!configuracaoAcao) {
      console.warn("Ação da Home não configurada:", nomeAcao);

      return;
    }

    botao.addEventListener("click", () => {
      executarAcaoHome(configuracaoAcao.funcao, configuracaoAcao.modulo);
    });
  });

  const campoBackup = document.getElementById("arquivoBackup");

  if (campoBackup) {
    campoBackup.addEventListener("change", (evento) => {
      if (typeof window.restaurarBackup !== "function") {
        informarModuloIndisponivelHome("Restauração de backup");

        /* Permite selecionar novamente o mesmo arquivo posteriormente. */
        evento.target.value = "";

        return;
      }

      try {
        window.restaurarBackup(evento);
      } catch (erro) {
        console.error("Erro ao restaurar backup:", erro);

        informarModuloIndisponivelHome("Restauração de backup");

        evento.target.value = "";
      }
    });
  }
}