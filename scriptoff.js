function lerQRCode() {
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
        { facingMode: "environment" },  // Câmera traseira
        {
            fps: 10,  // Taxa de quadros
            qrbox: { width: 250, height: 250 },  // Tamanho da caixa de leitura (quadrado central)
            aspectRatio: 1.0  // Força o formato quadrado e a orientação vertical
        },
        qrCodeMessage => {
            if (!leituraEfetuada) {
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
        },
        errorMessage => {
            console.log(`Erro ao ler QR Code: ${errorMessage}`);
        }
    ).catch(err => {
        console.log(`Erro ao iniciar a câmera: ${err}`);
    });
}
