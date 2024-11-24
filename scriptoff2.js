function lerQRCode(modoTransferencia = false) {
    const qrReaderElement = document.getElementById("qr-reader");
    const usuarioAtivo = localStorage.getItem('usuarioAtivo'); // Pega o usuário logado

    if (!usuarioAtivo) {
        alert("Usuário não está logado. Por favor, faça o login novamente.");
        return;
    }

    qrReaderElement.style.display = "flex"; // Mostrar o leitor de QR code
    qrReaderElement.style.justifyContent = "center"; // Centralizar o leitor
    qrReaderElement.style.alignItems = "center"; // Centralizar verticalmente
    qrReaderElement.style.height = "100vh"; // Ocupa toda a altura da tela
    qrReaderElement.style.width = "100vw"; // Ocupa toda a largura da tela
    qrReaderElement.style.backgroundColor = "#000"; // Fundo preto para destaque

    const html5QrCode = new Html5Qrcode("qr-reader");
    let leituraEfetuada = false; // Flag para garantir que só uma leitura seja registrada

    html5QrCode.start(
        { facingMode: "environment" },  // Câmera traseira
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 }, // Tamanho da caixa de leitura
        qrCodeMessage => {
            if (!leituraEfetuada) {
                leituraEfetuada = true; // Marca como já lido para evitar múltiplas leituras

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

                                            const continuar = confirm(
                                                "Deseja ler outro código ou finalizar as leituras?\n\n" +
                                                "OK: Ler outro código\n" +
                                                "Cancelar: Finalizar leituras"
                                            );

                                            if (!continuar) {
                                                pararLeitorQRCode(html5QrCode); // Para o leitor
                                                finalizarTransferencia(usuarioAtivo); // Passa o remetente ao finalizar
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
                            // Modo regular: verificar pendência de transferência antes de registrar leitura
                            fetch(`/verificarSolicitacaoPendente?procedimento=${numeroProcedimento}`)
                                .then(response => response.json())
                                .then(data => {
                                    if (data.pendente) {
                                        alert(`O procedimento ${numeroProcedimento} possui transferência pendente e não pode ser registrado.`);
                                        location.reload(true);
                                    } else {
                                        // Registrar a leitura se não houver pendência
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
                                                } else {
                                                    alert("Erro: " + data.message); // Exibe mensagem de erro
                                                }
                                                pararLeitorQRCode(html5QrCode); // Para o leitor
                                                window.history.back();
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
                                })
                                .catch(error => {
                                    console.error('Erro ao verificar pendência:', error);
                                    alert('Erro ao verificar pendência. Tente novamente.');
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
        errorMessage => {
            console.log(`Erro ao ler QR Code: ${errorMessage}`);
        }
    ).catch(err => {
        console.log(`Erro ao iniciar a câmera: ${err}`);
    });
}