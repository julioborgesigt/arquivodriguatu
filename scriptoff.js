function lerQRCode(modoTransferencia = false) {
    const qrReaderElement = document.getElementById("qr-reader");
    qrReaderElement.style.display = "flex";

    const html5QrCode = new Html5Qrcode("qr-reader");
    let leituraEfetuada = false;

    // Funções para formatar a data e ajustar o horário
    function formatarData(data) {
        const dia = String(data.getDate()).padStart(2, '0');
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const ano = data.getFullYear();
        return `${dia}/${mes}/${ano}`;
    }

    function ajustarHoraGMT3(data) {
        const novaData = new Date(data.getTime() - 3 * 60 * 60 * 1000); // Ajuste de 3 horas para GMT -3
        const hora = String(novaData.getHours()).padStart(2, '0');
        const minutos = String(novaData.getMinutes()).padStart(2, '0');
        const segundos = String(novaData.getSeconds()).padStart(2, '0');
        return `${hora}:${minutos}:${segundos}`;
    }


    html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        qrCodeMessage => {
            if (!leituraEfetuada) {
                leituraEfetuada = true; // Evitar múltiplas leituras simultâneas

                try {
                    const url = new URL(qrCodeMessage);
                    const numeroProcedimento = url.searchParams.get("procedimento");

                    if (numeroProcedimento) {
                        // Verificar pendência do procedimento
                        fetch(`/verificarSolicitacaoPendente?procedimento=${numeroProcedimento}`)
                            .then(response => response.json())
                            .then(data => {
                                if (data.pendente) {
                                    alert(`O procedimento ${numeroProcedimento} possui transferência pendente e será desconsiderado.`);
                                } else {
                                    alert(`Número do procedimento lido: ${numeroProcedimento}`);
                                    if (modoTransferencia) {
                                        alert("entrou no if do leitor qr");
                                        if (!procedimentosLidos.includes(numeroProcedimento)) {
                                            procedimentosLidos.push(numeroProcedimento);
                                            atualizarListaProcedimentos();

                                            // Alerta com opções para o usuário
                                            const continuar = confirm(
                                                "Deseja ler outro código ou finalizar as leituras?\n\n" +
                                                "OK: Ler outro código\n" +
                                                "Cancelar: Finalizar leituras"
                                            );

                                            if (!continuar) {
                                                pararLeitorQRCode(html5QrCode); // Para o leitor
                                                finalizarTransferencia(); // Finaliza as transferências
                                                
                                            }
                                        }
                                    } else {

                                        alert('entrou no else.');
                                        leituraEfetuada = true; // Marca como já lido para evitar múltiplas leituras

                                        fetch('/leitura', {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                            },
                                            body: JSON.stringify({ qrCodeMessage, usuario: usuarioAtivo })
                                        })
                                        .then(response => response.json())
                                        .then(data => {
                                            if (data.success) {
                                                alert(data.message); // Exibe mensagem de sucesso
                                                window.location.href = `/comprovante?procedimento=${data.procedimento}`;
                                            } else {
                                                alert("Erro: " + data.message); // Exibe mensagem de erro
                                            }
                                            html5QrCode.stop(); // Para o leitor de QR code
                                            qrReaderElement.style.display = "none"; // Esconder o leitor
                                        })
                                        .catch(error => {
                                            console.error('Erro ao registrar leitura:', error);
                                            alert('Erro ao registrar leitura. Tente novamente.');
                                            html5QrCode.stop();
                                            qrReaderElement.style.display = "none";
                                        });
                                       
                                    }
                                }
                                leituraEfetuada = false; // Permitir nova leitura
                            })
                            .catch(error => {
                                console.error('Erro ao verificar pendência:', error);
                                alert('Erro ao verificar pendência. Tente novamente.');
                                leituraEfetuada = false; // Permitir nova leitura
                            });
                    } else {
                        alert("Nenhum número de procedimento encontrado. Por favor, tente novamente.");
                        leituraEfetuada = false; // Permitir nova leitura
                    }
                } catch (error) {
                    console.error("Erro ao processar QR code:", error);
                    alert("Erro ao processar QR code. Certifique-se de que a URL está correta.");
                    leituraEfetuada = false; // Permitir nova leitura
                }
            }
        },
        errorMessage => console.log(`Erro ao ler QR Code: ${errorMessage}`)
    ).catch(err => console.error(`Erro ao iniciar leitor: ${err}`));
}