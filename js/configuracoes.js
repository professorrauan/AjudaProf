async function abrirConfiguracoes() {
  const usuario =
    window.usuarioAtualAjudaProf || window.auth?.currentUser || null;

  const nomeUsuario = usuario?.displayName || "Professor";

  const emailUsuario = usuario?.email || "E-mail não disponível";

  const statusAtual =
    typeof statusSincronizacaoAjudaProf !== "undefined"
      ? statusSincronizacaoAjudaProf
      : navigator.onLine
      ? "sincronizado"
      : "offline";

  const dadosStatus = {
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

  const statusExibido = dadosStatus[statusAtual] || dadosStatus.aguardando;

  let criterios = {
    avaliacao: {
      mediaAprovacao: 6,
      limiteRecuperacao: 4,
      mediaDestaque: 8,
      casasDecimais: 1,
      arredondamento: "matematico",
    },
  };

  try {
    if (typeof carregarConfiguracoesPedagogicas === "function") {
      criterios = await carregarConfiguracoesPedagogicas();
    }
  } catch (erro) {
    console.error("Erro ao carregar critérios de avaliação:", erro);

    if (typeof obterConfiguracoesPedagogicas === "function") {
      criterios = obterConfiguracoesPedagogicas();
    }
  }

  const avaliacao = criterios.avaliacao;

  document.body.innerHTML =
    `
    <h1>⚙️ Configurações</h1>

    <div class="card cardConfig">

      <span class="material-icons-round iconeConfig">
        account_circle
      </span>

      <div>

        <h2>Minha conta</h2>

        <p>
          <strong>${nomeUsuario}</strong>
          <br>
          ${emailUsuario}
        </p>

      </div>

    </div>

    <div class="card cardConfig">

      <span
        id="iconeSincronizacao"
        class="material-icons-round iconeConfig"
      >
        ${statusExibido.icone}
      </span>

      <div class="conteudoConfig">

        <h2>Conexão com a nuvem</h2>

        <p
          id="statusSincronizacao"
          class="${statusExibido.classe}"
        >
          ${statusExibido.texto}
        </p>

        <p class="textoSecundarioConfig">
          Última verificação:
          <br>

          <strong id="ultimaSincronizacao">
            ${formatarUltimaSincronizacaoAjudaProf()}
          </strong>
        </p>

      </div>

      <button
        type="button"
        class="btnAzul"
        onclick="verificarConexaoNuvemAjudaProf()"
      >
        <span class="material-icons-round">
          sync
        </span>

        Verificar conexão
      </button>

    </div>

    <div class="card textoEsquerda">

      <div class="flexInicio">

        <span class="material-icons-round iconeConfig">
          offline_bolt
        </span>

        <div>

          <h2>Disponibilidade offline</h2>

          <p>
            Mantenha neste dispositivo uma cópia dos dados
            que o aplicativo já acessou.
          </p>

        </div>

      </div>

      <label
        for="cacheOfflineFirestoreConfig"
        style=" display:flex; align-items:center; gap:12px; margin-top:14px; cursor:pointer; "
      >

        <input
          id="cacheOfflineFirestoreConfig"
          type="checkbox"
          ${ ( typeof obterPreferenciaCacheOfflineAjudaProf === "function" ? obterPreferenciaCacheOfflineAjudaProf() : false ) ? "checked" : "" }
          onchange=" alterarCacheOfflineConfiguracoes( this.checked ) "
        >

        <strong>
          Manter dados disponíveis neste dispositivo
        </strong>

      </label>

      <p
        id="mensagemCacheOfflineConfig"
        class="textoSecundarioConfig"
        aria-live="polite"
      >
        ${ window.cacheOfflineFirestoreAtivo ? "✅ Cache offline ativo nesta sessão." : window.erroCacheOfflineFirestore ? "⚠️ Este navegador não conseguiu ativar o cache offline." : "O cache offline está desativado nesta sessão." }
      </p>

      <p class="textoSecundarioConfig">
        A mudança é aplicada depois de recarregar o aplicativo.
        Em aparelhos compartilhados, mantenha esta opção desativada.
      </p>

    </div>

    <div class="card textoEsquerda">

      <div class="flexInicio">

        <span class="material-icons-round iconeConfig">
          grading
        </span>

        <div>

          <h2>Critérios de avaliação</h2>

          <p>
            Defina as médias usadas nos boletins,
            painéis e relatórios.
          </p>

        </div>

      </div>

      <div class="grupoCampo">

        <label for="mediaAprovacaoConfig">
          Média para aprovação
        </label>

        <input
          id="mediaAprovacaoConfig"
          type="number"
          min="0"
          max="10"
          step="0.1"
          inputmode="decimal"
          value="${avaliacao.mediaAprovacao}"
        >

      </div>

      <div class="grupoCampo">

        <label for="limiteRecuperacaoConfig">
          Limite mínimo da recuperação
        </label>

        <input
          id="limiteRecuperacaoConfig"
          type="number"
          min="0"
          max="10"
          step="0.1"
          inputmode="decimal"
          value="${avaliacao.limiteRecuperacao}"
        >

      </div>

      <div class="grupoCampo">

        <label for="mediaDestaqueConfig">
          Média considerada destaque
        </label>

        <input
          id="mediaDestaqueConfig"
          type="number"
          min="0"
          max="10"
          step="0.1"
          inputmode="decimal"
          value="${avaliacao.mediaDestaque}"
        >

      </div>

      <div class="grupoCampo">

        <label for="casasDecimaisConfig">
          Casas decimais
        </label>

        <select id="casasDecimaisConfig">
          <option
            value="0"
            ${avaliacao.casasDecimais === 0 ? "selected" : ""}
          >
            Nenhuma
          </option>

          <option
            value="1"
            ${avaliacao.casasDecimais === 1 ? "selected" : ""}
          >
            Uma casa
          </option>

          <option
            value="2"
            ${avaliacao.casasDecimais === 2 ? "selected" : ""}
          >
            Duas casas
          </option>
        </select>

      </div>

      <div class="grupoCampo">

        <label for="arredondamentoConfig">
          Arredondamento
        </label>

        <select id="arredondamentoConfig">
          <option
            value="matematico"
            ${avaliacao.arredondamento === "matematico" ? "selected" : ""}
          >
            Matemático
          </option>

          <option
            value="cima"
            ${avaliacao.arredondamento === "cima" ? "selected" : ""}
          >
            Sempre para cima
          </option>

          <option
            value="baixo"
            ${avaliacao.arredondamento === "baixo" ? "selected" : ""}
          >
            Sempre para baixo
          </option>
        </select>

      </div>

      <div class="acoes">

        <button
          id="salvarCriteriosAvaliacao"
          type="button"
          class="btnAzul"
          onclick="salvarCriteriosAvaliacaoConfiguracoes()"
        >
          <span class="material-icons-round">
            save
          </span>

          Salvar critérios
        </button>

      </div>

      <p
        id="mensagemCriteriosAvaliacao"
        class="textoSecundarioConfig"
        aria-live="polite"
      ></p>

    </div>

    <div class="card cardConfig">

      <span class="material-icons-round iconeConfig">
        dark_mode
      </span>

      <div>

        <h2>Aparência</h2>

        <p>
          Alterne entre modo claro e escuro.
        </p>

      </div>

      <button
        type="button"
        onclick="alternarTema()"
      >
        Alternar
      </button>

    </div>

    <div class="card cardConfig">

      <span class="material-icons-round iconeConfig">
        logout
      </span>

      <div>

        <h2>Sair da conta</h2>

        <p>
          Encerre sua sessão neste dispositivo.
        </p>

      </div>

      <button
        type="button"
        class="btnVermelho"
        onclick="sairDaConta()"
      >
        <span class="material-icons-round">
          logout
        </span>

        Sair
      </button>

    </div>

    <div class="acoes">

      <button
        type="button"
        class="btnAzul"
        onclick="voltarHome()"
      >
        <span class="material-icons-round">
          arrow_back
        </span>

        Voltar
      </button>

    </div>
  ` + barraInferior();

  aplicarTemaSalvo();

  definirStatusSincronizacaoAjudaProf(statusSincronizacaoAjudaProf);
}

function alterarCacheOfflineConfiguracoes(ativo) {
  const mensagem = document.getElementById("mensagemCacheOfflineConfig");

  if (typeof definirPreferenciaCacheOfflineAjudaProf !== "function") {
    if (mensagem) {
      mensagem.textContent = "❌ O serviço de cache offline não foi carregado.";
    }

    return;
  }

  definirPreferenciaCacheOfflineAjudaProf(Boolean(ativo));

  if (mensagem) {
    mensagem.textContent = ativo
      ? "🔄 O cache offline será ativado ao recarregar."
      : "🔄 O cache offline será desativado ao recarregar.";
  }

  const recarregarAgora = window.confirm(
    "A alteração exige recarregar o aplicativo. Recarregar agora?"
  );

  if (recarregarAgora) {
    window.location.reload();
    return;
  }

  if (typeof mostrarToast === "function") {
    mostrarToast("A alteração será aplicada na próxima abertura.");
  }
}

async function salvarCriteriosAvaliacaoConfiguracoes() {
  const botao = document.getElementById("salvarCriteriosAvaliacao");

  const mensagem = document.getElementById("mensagemCriteriosAvaliacao");

  const lerNumero = (id) => {
    const campo = document.getElementById(id);

    return Number(
      String(campo?.value || "")
        .trim()
        .replace(",", ".")
    );
  };

  const novosDados = {
    avaliacao: {
      mediaAprovacao: lerNumero("mediaAprovacaoConfig"),

      limiteRecuperacao: lerNumero("limiteRecuperacaoConfig"),

      mediaDestaque: lerNumero("mediaDestaqueConfig"),

      casasDecimais: Number(
        document.getElementById("casasDecimaisConfig")?.value
      ),

      arredondamento:
        document.getElementById("arredondamentoConfig")?.value || "matematico",
    },
  };

  try {
    if (botao) {
      botao.disabled = true;
    }

    if (mensagem) {
      mensagem.textContent = "Salvando critérios...";
    }

    if (typeof salvarConfiguracoesPedagogicas !== "function") {
      throw new Error(
        "O serviço de configurações pedagógicas não foi carregado."
      );
    }

    await salvarConfiguracoesPedagogicas(novosDados);

    if (mensagem) {
      mensagem.textContent = "✅ Critérios salvos na nuvem.";
    }

    if (typeof mostrarToast === "function") {
      mostrarToast("✅ Critérios de avaliação salvos.");
    }
  } catch (erro) {
    console.error("Erro ao salvar critérios de avaliação:", erro);

    if (mensagem) {
      mensagem.textContent = `❌ ${erro.message || "Não foi possível salvar."}`;
    }

    if (typeof mostrarToast === "function") {
      mostrarToast(
        `❌ ${erro.message || "Não foi possível salvar os critérios."}`
      );
    }
  } finally {
    if (botao) {
      botao.disabled = false;
    }
  }
}

async function verificarConexaoNuvemAjudaProf() {
  const usuario =
    typeof obterUsuarioFirestoreAjudaProf === "function"
      ? obterUsuarioFirestoreAjudaProf()
      : window.auth?.currentUser || null;

  if (!usuario) {
    mostrarToast("⚠️ Faça login para verificar a nuvem.");
    return;
  }

  if (!navigator.onLine) {
    definirStatusSincronizacaoAjudaProf("offline");
    mostrarToast("📶 Sem conexão com a internet.");
    return;
  }

  if (!window.db || !window.firebaseFirestore) {
    definirStatusSincronizacaoAjudaProf("erro");
    mostrarToast("⚠️ O Firebase ainda não está disponível.");
    return;
  }

  definirStatusSincronizacaoAjudaProf("sincronizando");

  try {
    const { doc, getDoc } = window.firebaseFirestore;

    const referencia = doc(window.db, "usuarios", usuario.uid);

    await getDoc(referencia);

    registrarSincronizacaoAjudaProf();

    mostrarToast("☁️ Conexão com a nuvem verificada.");
  } catch (erro) {
    console.error("Erro ao verificar a conexão com a nuvem:", erro);

    definirStatusSincronizacaoAjudaProf(navigator.onLine ? "erro" : "offline");

    mostrarToast("❌ Não foi possível acessar a nuvem.");
  }
}