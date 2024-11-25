app.post('/leitura', (req, res) => {
    console.log("Entrou na rota /leitura");
    const { qrCodeMessage, usuario } = req.body; // Receber o usuário logado junto com o QR code
    const banco = JSON.parse(fs.readFileSync('banco.json', 'utf8'));

    // Captura a hora atual e ajusta para GMT-3
    const dataAtual = new Date();
    dataAtual.setHours(dataAtual.getHours() - 3);
    const horaAjustada = dataAtual.toTimeString().split(' ')[0]; // Formato HH:MM:SS
    console.log("Hora ajustada para GMT-3:", horaAjustada);

    // Tentar extrair o número do procedimento da URL ou usar o valor diretamente
    let numeroProcedimento;
    try {
        const url = new URL(qrCodeMessage);
        numeroProcedimento = url.searchParams.get('procedimento');
    } catch (error) {
        numeroProcedimento = qrCodeMessage; // Caso não seja uma URL, usar o valor diretamente
    }

    console.log("Número do procedimento:", numeroProcedimento);

    if (!numeroProcedimento) {
        return res.status(400).json({ success: false, message: "Número do procedimento não encontrado na URL ou no QR code." });
    }

    // Procurar o procedimento correspondente no banco de dados
    const procedimento = banco.procedimentos.find(p => p.numero === numeroProcedimento);

    if (procedimento) {
        // Adicionar a leitura ao procedimento
        procedimento.leituras.push({
            usuario, // Nome do usuário logado
            data: dataAtual.toISOString().split('T')[0], // Data no formato YYYY-MM-DD
            hora: horaAjustada // Hora ajustada para GMT-3
        });

        // Salvar o banco de dados atualizado
        fs.writeFileSync('banco.json', JSON.stringify(banco, null, 2));
        console.log("Leitura registrada com sucesso para o procedimento:", numeroProcedimento);

        res.json({ success: true, message: "Leitura registrada com sucesso!", procedimento: numeroProcedimento });
    } else {
        console.log("Procedimento não encontrado:", numeroProcedimento);
        res.status(404).json({ success: false, message: "Procedimento não encontrado!" });
    }
});
