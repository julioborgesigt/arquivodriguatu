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
                
                // Extração do número do procedimento
                try {
                    const url = new URL(qrCodeMessage);
                    const numeroProcedimento = url.searchParams.get("procedimento");
                    
                    if (numeroProcedimento) {
                        if (modoTransferencia) {
                            alert('entrou no if.');
                            if (!procedimentosLidos.includes(qrCodeMessage)) {
                                procedimentosLidos.push(qrCodeMessage);
                                atualizarListaProcedimentos();
                                alert(`Procedimento lido: ${qrCodeMessage}`);
                            }
                            leituraEfetuada = false; // Permitir novas leituras
                        } else {
                            registrarLeitura(numeroProcedimento);
                            html5QrCode.stop();
                            qrReaderElement.style.display = "none";
                        }
                    } else {
                        alert('entrou no else.');
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
    
                } catch (error) {
                    console.error("Erro ao processar QR code:", error);
                    alert("Erro ao processar QR code. Certifique-se de que a URL está correta.");
                }
            }
        },
        errorMessage => console.log(`Erro ao ler QR Code: ${errorMessage}`)
    ).catch(err => console.error(`Erro ao iniciar leitor: ${err}`));
}
