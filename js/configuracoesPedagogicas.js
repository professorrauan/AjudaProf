/* ========================================================= AJUDA+PROF — CONFIGURAÇÕES PEDAGÓGICAS Critérios de avaliação salvos no Cloud Firestore ========================================================= */

const CONFIGURACOES_PEDAGOGICAS_PADRAO = Object.freeze({
  avaliacao: Object.freeze({
    mediaAprovacao: 6,
    limiteRecuperacao: 4,
    mediaDestaque: 8,
    casasDecimais: 1,
    arredondamento: "matematico",
  }),
});

let configuracoesPedagogicasAtuais = clonarConfiguracoesPedagogicas(
  CONFIGURACOES_PEDAGOGICAS_PADRAO
);

let uidConfiguracoesPedagogicas = null;
let referenciaConfiguracoesPedagogicas = null;
let cancelarEscutaConfiguracoesPedagogicas = null;
let promessaCarregamentoConfiguracoesPedagogicas = null;

function clonarConfiguracoesPedagogicas(valor) {
  if (typeof structuredClone === "function") {
    try {
      return structuredClone(valor);
    } catch (erro) {
      console.warn("Falha ao clonar configurações pedagógicas:", erro);
    }
  }

  return JSON.parse(JSON.stringify(valor));
}

function numeroPedagogico(valor) {
  if (typeof valor === "string") {
    valor = valor.trim().replace(",", ".");
  }

  const numero = Number(valor);

  return Number.isFinite(numero) ? numero : NaN;
}

function normalizarConfiguracoesPedagogicas(dados) {
  const origem =
    dados && typeof dados === "object" && !Array.isArray(dados) ? dados : {};

  const avaliacaoOrigem =
    origem.avaliacao &&
    typeof origem.avaliacao === "object" &&
    !Array.isArray(origem.avaliacao)
      ? origem.avaliacao
      : origem;

  const padrao = CONFIGURACOES_PEDAGOGICAS_PADRAO.avaliacao;

  const mediaAprovacao = numeroPedagogico(avaliacaoOrigem.mediaAprovacao);

  const limiteRecuperacao = numeroPedagogico(avaliacaoOrigem.limiteRecuperacao);

  const mediaDestaque = numeroPedagogico(avaliacaoOrigem.mediaDestaque);

  const casasDecimaisInformadas = Number(avaliacaoOrigem.casasDecimais);

  const casasDecimais = Number.isInteger(casasDecimaisInformadas)
    ? Math.min(2, Math.max(0, casasDecimaisInformadas))
    : padrao.casasDecimais;

  const arredondamentosPermitidos = new Set(["matematico", "cima", "baixo"]);

  const arredondamento = arredondamentosPermitidos.has(
    avaliacaoOrigem.arredondamento
  )
    ? avaliacaoOrigem.arredondamento
    : padrao.arredondamento;

  return {
    avaliacao: {
      mediaAprovacao: Number.isFinite(mediaAprovacao)
        ? mediaAprovacao
        : padrao.mediaAprovacao,

      limiteRecuperacao: Number.isFinite(limiteRecuperacao)
        ? limiteRecuperacao
        : padrao.limiteRecuperacao,

      mediaDestaque: Number.isFinite(mediaDestaque)
        ? mediaDestaque
        : padrao.mediaDestaque,

      casasDecimais,

      arredondamento,
    },
  };
}

function validarConfiguracoesPedagogicas(dados) {
  const normalizadas = normalizarConfiguracoesPedagogicas(dados);

  const { limiteRecuperacao, mediaAprovacao, mediaDestaque } =
    normalizadas.avaliacao;

  if (
    limiteRecuperacao < 0 ||
    mediaAprovacao < 0 ||
    mediaDestaque < 0 ||
    limiteRecuperacao > 10 ||
    mediaAprovacao > 10 ||
    mediaDestaque > 10
  ) {
    return {
      valido: false,
      mensagem: "Os valores devem estar entre 0 e 10.",
    };
  }

  if (limiteRecuperacao >= mediaAprovacao) {
    return {
      valido: false,
      mensagem:
        "O limite de recuperação deve ser menor que a média para aprovação.",
    };
  }

  if (mediaAprovacao > mediaDestaque) {
    return {
      valido: false,
      mensagem:
        "A média de destaque deve ser igual ou maior que a média para aprovação.",
    };
  }

  return {
    valido: true,
    dados: normalizadas,
  };
}

function obterUsuarioConfiguracoesPedagogicas() {
  return window.auth?.currentUser || window.usuarioAtualAjudaProf || null;
}

function obterConfiguracoesPedagogicas() {
  return clonarConfiguracoesPedagogicas(configuracoesPedagogicasAtuais);
}

function aplicarSnapshotConfiguracoesPedagogicas(snapshot) {
  if (!snapshot.exists()) {
    return;
  }

  const dados = snapshot.data();

  configuracoesPedagogicasAtuais = normalizarConfiguracoesPedagogicas(dados);

  window.dispatchEvent(
    new CustomEvent("configuracoesPedagogicasAtualizadas", {
      detail: obterConfiguracoesPedagogicas(),
    })
  );
}

async function carregarConfiguracoesPedagogicas(forcar = false) {
  const usuario = obterUsuarioConfiguracoesPedagogicas();

  if (!usuario) {
    configuracoesPedagogicasAtuais = clonarConfiguracoesPedagogicas(
      CONFIGURACOES_PEDAGOGICAS_PADRAO
    );

    return obterConfiguracoesPedagogicas();
  }

  if (!window.db || !window.firebaseFirestore) {
    throw new Error("Firebase ainda não está disponível.");
  }

  if (
    !forcar &&
    uidConfiguracoesPedagogicas === usuario.uid &&
    promessaCarregamentoConfiguracoesPedagogicas
  ) {
    return promessaCarregamentoConfiguracoesPedagogicas;
  }

  if (
    cancelarEscutaConfiguracoesPedagogicas &&
    uidConfiguracoesPedagogicas !== usuario.uid
  ) {
    cancelarEscutaConfiguracoesPedagogicas();
    cancelarEscutaConfiguracoesPedagogicas = null;
  }

  const { doc, getDoc, setDoc, serverTimestamp } = window.firebaseFirestore;

  if (
    uidConfiguracoesPedagogicas &&
    uidConfiguracoesPedagogicas !== usuario.uid
  ) {
    configuracoesPedagogicasAtuais = clonarConfiguracoesPedagogicas(
      CONFIGURACOES_PEDAGOGICAS_PADRAO
    );

    referenciaConfiguracoesPedagogicas = null;
  }

  uidConfiguracoesPedagogicas = usuario.uid;

  referenciaConfiguracoesPedagogicas = doc(
    window.db,
    "usuarios",
    usuario.uid,
    "dados",
    "perfilPedagogico"
  );

  promessaCarregamentoConfiguracoesPedagogicas = (async () => {
    const snapshot = await getDoc(referenciaConfiguracoesPedagogicas);

    if (snapshot.exists()) {
      aplicarSnapshotConfiguracoesPedagogicas(snapshot);
    } else {
      const padrao = clonarConfiguracoesPedagogicas(
        CONFIGURACOES_PEDAGOGICAS_PADRAO
      );

      await setDoc(
        referenciaConfiguracoesPedagogicas,
        {
          ...padrao,
          criadoEm: serverTimestamp(),
          atualizadoEm: serverTimestamp(),
        },
        {
          merge: true,
        }
      );

      configuracoesPedagogicasAtuais = padrao;
    }

    return obterConfiguracoesPedagogicas();
  })();

  try {
    return await promessaCarregamentoConfiguracoesPedagogicas;
  } catch (erro) {
    throw erro;
  } finally {
    promessaCarregamentoConfiguracoesPedagogicas = null;
  }
}

async function salvarConfiguracoesPedagogicas(novosDados) {
  const validacao = validarConfiguracoesPedagogicas(novosDados);

  if (!validacao.valido) {
    throw new Error(validacao.mensagem);
  }

  const usuario = obterUsuarioConfiguracoesPedagogicas();

  if (!usuario) {
    throw new Error("Usuário não autenticado.");
  }

  if (!window.db || !window.firebaseFirestore) {
    throw new Error("Firebase ainda não está disponível.");
  }

  const { doc, setDoc, serverTimestamp } = window.firebaseFirestore;

  const referencia =
    referenciaConfiguracoesPedagogicas ||
    doc(window.db, "usuarios", usuario.uid, "dados", "perfilPedagogico");

  await setDoc(
    referencia,
    {
      ...validacao.dados,
      atualizadoEm: serverTimestamp(),
    },
    {
      merge: true,
    }
  );

  configuracoesPedagogicasAtuais = clonarConfiguracoesPedagogicas(
    validacao.dados
  );

  return obterConfiguracoesPedagogicas();
}

function arredondarNotaPedagogica( valor, criterios = configuracoesPedagogicasAtuais.avaliacao ) {
  const numero = numeroPedagogico(valor);

  if (!Number.isFinite(numero)) {
    return NaN;
  }

  const casas = Math.min(2, Math.max(0, Number(criterios.casasDecimais) || 0));

  const fator = 10 ** casas;

  if (criterios.arredondamento === "cima") {
    return Math.ceil(numero * fator) / fator;
  }

  if (criterios.arredondamento === "baixo") {
    return Math.floor(numero * fator) / fator;
  }

  return Math.round((numero + Number.EPSILON) * fator) / fator;
}

function formatarNotaPedagogica(valor) {
  const criterios = configuracoesPedagogicasAtuais.avaliacao;

  const arredondada = arredondarNotaPedagogica(valor, criterios);

  if (!Number.isFinite(arredondada)) {
    return "—";
  }

  return arredondada.toFixed(criterios.casasDecimais).replace(".", ",");
}

function classificarMediaPedagogica(media) {
  const numero = numeroPedagogico(media);

  if (!Number.isFinite(numero)) {
    return {
      codigo: "sem-media",
      texto: "Sem média",
      icone: "schedule",
      cor: "var(--primaria)",
    };
  }

  const criterios = configuracoesPedagogicasAtuais.avaliacao;

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

function encerrarConfiguracoesPedagogicas() {
  if (cancelarEscutaConfiguracoesPedagogicas) {
    cancelarEscutaConfiguracoesPedagogicas();
  }

  cancelarEscutaConfiguracoesPedagogicas = null;
  uidConfiguracoesPedagogicas = null;
  referenciaConfiguracoesPedagogicas = null;
  promessaCarregamentoConfiguracoesPedagogicas = null;

  configuracoesPedagogicasAtuais = clonarConfiguracoesPedagogicas(
    CONFIGURACOES_PEDAGOGICAS_PADRAO
  );
}

window.CONFIGURACOES_PEDAGOGICAS_PADRAO = CONFIGURACOES_PEDAGOGICAS_PADRAO;

window.carregarConfiguracoesPedagogicas = carregarConfiguracoesPedagogicas;

window.obterConfiguracoesPedagogicas = obterConfiguracoesPedagogicas;

window.salvarConfiguracoesPedagogicas = salvarConfiguracoesPedagogicas;

window.validarConfiguracoesPedagogicas = validarConfiguracoesPedagogicas;

window.classificarMediaPedagogica = classificarMediaPedagogica;

window.formatarNotaPedagogica = formatarNotaPedagogica;

window.arredondarNotaPedagogica = arredondarNotaPedagogica;

window.encerrarConfiguracoesPedagogicas = encerrarConfiguracoesPedagogicas;