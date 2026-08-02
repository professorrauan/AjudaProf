async function iniciarApp(){

    if(typeof aplicarTemaSalvo==="function"){
        aplicarTemaSalvo();
    }

    let resultadoBases;

    try{

        resultadoBases = await carregarBases();

    }catch(erro){

        console.error(
            "❌ Falha inesperada durante a inicialização:",
            erro
        );

        resultadoBases={
            bnccCarregada:false,
            descritoresCarregados:false,
            erros:[
                erro.message ||
                "Erro desconhecido na inicialização."
            ]
        };

    }

    if(typeof abrirSplash==="function"){
        abrirSplash();
    }

    if(
        resultadoBases.erros &&
        resultadoBases.erros.length>0
    ){

        console.warn(
            "⚠️ O aplicativo foi iniciado com bases incompletas:",
            resultadoBases.erros
        );

    }

}

iniciarApp().catch(erro => {

    console.error(
        "Erro fatal na inicialização:",
        erro
    );

});