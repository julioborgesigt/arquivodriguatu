function lerQRCode(modoTransferencia = false) {
    const qrReaderElement = document.getElementById("qr-reader");
    qrReaderElement.style.display = "flex";

    const html5QrCode = new Html5Qrcode("qr-reader");
    let leituraEfetuada = false;

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
                        if (modoTransferencia) {
                            // Modo de transferência: verificar pendências
                            fetch(`/verificarSolicitacaoPendente?procedimento=${numeroProcedimento}`)
                                .then(response => response.json())
                                .then(data => {
                                    if (data.pendente) {
                                        alert(`O procedimento ${numeroProcedimento} possui transferência pendente e será desconsiderado.`);
                                    } else {
                                        alert(`Número do procedimento lido: ${numeroProcedimento}`);
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
                                        
                                    }
                                    leituraEfetuada = false; // Permitir nova leitura
                                })
                                .catch(error => {
                                    console.error('Erro ao verificar pendência:', error);
                                    alert('Erro ao verificar pendência. Tente novamente.');
                                    leituraEfetuada = false; // Permitir nova leitura
                                });
                        } else {
                            // Modo regular: registrar leitura
                            alert('entrou no else da rotina ler qrcode.');
                            alert(`qrCodeMessage lido no else: ${qrCodeMessage}`);
                            alert(`Número do procedimento lido no else: ${numeroProcedimento}`);
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
                                    pararLeitorQRCode(html5QrCode); // Para o leitor
                                })
                                .catch(error => {
                                    console.error('Erro ao registrar leitura:', error);
                                    alert('Erro ao registrar leitura. Tente novamente.');
                                    pararLeitorQRCode(html5QrCode); // Para o leitor
                                })
                                .finally(() => {
                                    leituraEfetuada = false; // Permitir nova leitura
                                });
                        }
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