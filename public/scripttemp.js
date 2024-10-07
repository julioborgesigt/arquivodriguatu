// Função para ler QR Code e registrar a leitura
function lerQRCode() {
    const qrReaderElement = document.getElementById("qr-reader");
    const usuarioAtivo = localStorage.getItem('usuarioAtivo'); // Usuário logado

    if (!usuarioAtivo) {
        alert("Usuário não está logado. Por favor, faça o login novamente.");
        return;
    }

    const html5QrCode = new Html5Qrcode("qr-reader");
    html5QrCode.start({ facingMode: "environment" }, {
        fps: 10, 
        qrbox: { width: 250, height: 250 }
    }, qrCodeMessage => {
        const dataAtual = new Date();
        const dataFormatada = formatarData(dataAtual);
        const horaFormatada = ajustarHoraGMT3(dataAtual);

        // Enviar leitura para o backend
        fetch('/leitura', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ qrCodeMessage, usuario: usuarioAtivo, data: dataFormatada, hora: horaFormatada })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
                window.location.href = `/comprovante?procedimento=${data.procedimento}`;
            } else {
                alert("Erro: " + data.message);
            }
        })
        .catch(error => {
            console.error('Erro ao registrar leitura:', error);
            alert('Erro ao registrar leitura. Tente novamente.');
        });
    }, errorMessage => {
        console.log(`Erro ao ler QR Code: ${errorMessage}`);
    }).catch(err => {
        console.log(`Erro ao iniciar a câmera: ${err}`);
    });
}
