/*
==========================================================
AJUDA+PROF — COMPONENTES DE INTERFACE
==========================================================

Funções responsáveis por gerar estruturas HTML reutilizáveis.

Neste primeiro momento, os componentes não substituem
automaticamente nenhuma tela existente.
*/


/**
 * Escapa conteúdo textual antes de inseri-lo no HTML.
 * Evita que textos informados pelo usuário sejam
 * interpretados como código HTML.
 */
function escaparHTMLComponente(valor){

    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/**
 * Cria o cabeçalho padrão de uma página.
 */
function criarCabecalhoPagina({
    titulo = "",
    descricao = "",
    icone = "",
    acao = ""
} = {}){

    const tituloSeguro =
        escaparHTMLComponente(titulo);

    const descricaoSegura =
        escaparHTMLComponente(descricao);

    const iconeSeguro =
        escaparHTMLComponente(icone);

    return `
        <div class="topoPagina">

            <div>

                <h1>
                    ${
                        iconeSeguro
                        ? `<span class="material-icons-round">${iconeSeguro}</span>`
                        : ""
                    }

                    ${tituloSeguro}
                </h1>

                ${
                    descricaoSegura
                    ? `<p>${descricaoSegura}</p>`
                    : ""
                }

            </div>

            ${
                acao
                ? `<div class="acoesTopoPagina">${acao}</div>`
                : ""
            }

        </div>
    `;

}


/**
 * Cria um card utilizando as classes atuais do projeto.
 */
function criarCard({
    titulo = "",
    subtitulo = "",
    conteudo = "",
    icone = "",
    classe = ""
} = {}){

    const tituloSeguro =
        escaparHTMLComponente(titulo);

    const subtituloSeguro =
        escaparHTMLComponente(subtitulo);

    const iconeSeguro =
        escaparHTMLComponente(icone);

    const classeSegura =
        String(classe ?? "")
            .replace(/[^a-zA-Z0-9 _-]/g, "");

    return `
        <div class="card ${classeSegura}">

            ${
                tituloSeguro || subtituloSeguro || iconeSeguro
                ? `
                    <div class="cardCabecalho">

                        ${
                            iconeSeguro
                            ? `
                                <span class="material-icons-round">
                                    ${iconeSeguro}
                                </span>
                            `
                            : ""
                        }

                        <div>

                            ${
                                tituloSeguro
                                ? `<h3>${tituloSeguro}</h3>`
                                : ""
                            }

                            ${
                                subtituloSeguro
                                ? `<p>${subtituloSeguro}</p>`
                                : ""
                            }

                        </div>

                    </div>
                `
                : ""
            }

            <div class="cardConteudo">
                ${conteudo}
            </div>

        </div>
    `;

}


/**
 * Cria um botão padrão do aplicativo.
 */
function criarBotao({
    texto = "",
    icone = "",
    onclick = "",
    classe = "btnAzul",
    tipo = "button",
    desabilitado = false,
    id = ""
} = {}){

    const textoSeguro =
        escaparHTMLComponente(texto);

    const iconeSeguro =
        escaparHTMLComponente(icone);

    const idSeguro =
        String(id ?? "")
            .replace(/[^a-zA-Z0-9_-]/g, "");

    const classeSegura =
        String(classe ?? "")
            .replace(/[^a-zA-Z0-9 _-]/g, "");

    const tipoSeguro =
        tipo === "submit"
            ? "submit"
            : "button";

    /*
    O atributo onclick é usado porque o aplicativo ainda
    utiliza eventos diretamente no HTML das telas.
    */

    return `
        <button
            ${idSeguro ? `id="${idSeguro}"` : ""}
            type="${tipoSeguro}"
            class="${classeSegura}"
            ${onclick ? `onclick="${onclick}"` : ""}
            ${desabilitado ? "disabled" : ""}
        >

            ${
                iconeSeguro
                ? `
                    <span class="material-icons-round">
                        ${iconeSeguro}
                    </span>
                `
                : ""
            }

            <span>${textoSeguro}</span>

        </button>
    `;

}


/**
 * Cria uma mensagem para listas ou áreas sem registros.
 */
function criarMensagemVazia({
    titulo = "Nenhum registro encontrado",
    descricao = "",
    icone = "inbox",
    acao = ""
} = {}){

    const tituloSeguro =
        escaparHTMLComponente(titulo);

    const descricaoSegura =
        escaparHTMLComponente(descricao);

    const iconeSeguro =
        escaparHTMLComponente(icone);

    return `
        <div class="estadoVazio">

            <span class="material-icons-round estadoVazioIcone">
                ${iconeSeguro}
            </span>

            <h3>${tituloSeguro}</h3>

            ${
                descricaoSegura
                ? `<p>${descricaoSegura}</p>`
                : ""
            }

            ${
                acao
                ? `<div class="estadoVazioAcao">${acao}</div>`
                : ""
            }

        </div>
    `;

}


/**
 * Cria uma pequena informação estatística.
 */
function criarCardEstatistica({
    titulo = "",
    valor = 0,
    icone = "analytics",
    descricao = "",
    classe = ""
} = {}){

    const tituloSeguro =
        escaparHTMLComponente(titulo);

    const valorSeguro =
        escaparHTMLComponente(valor);

    const iconeSeguro =
        escaparHTMLComponente(icone);

    const descricaoSegura =
        escaparHTMLComponente(descricao);

    const classeSegura =
        String(classe ?? "")
            .replace(/[^a-zA-Z0-9 _-]/g, "");

    return `
        <div class="card estatisticaCard ${classeSegura}">

            <div class="estatisticaIcone material-icons-round">
                ${iconeSeguro}
            </div>

            <div class="estatisticaConteudo">

                <span class="estatisticaTitulo">
                    ${tituloSeguro}
                </span>

                <strong class="estatisticaValor">
                    ${valorSeguro}
                </strong>

                ${
                    descricaoSegura
                    ? `
                        <small class="estatisticaDescricao">
                            ${descricaoSegura}
                        </small>
                    `
                    : ""
                }

            </div>

        </div>
    `;

}


/*
Disponibilização global.

O Ajuda+Prof ainda utiliza funções chamadas por onclick
e módulos JavaScript tradicionais.
*/

window.escaparHTMLComponente =
escaparHTMLComponente;

window.criarCabecalhoPagina =
criarCabecalhoPagina;

window.criarCard =
criarCard;

window.criarBotao =
criarBotao;

window.criarMensagemVazia =
criarMensagemVazia;

window.criarCardEstatistica =
criarCardEstatistica;