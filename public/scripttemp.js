// Rota para salvar o procedimento no banco de dados
app.post('/salvarProcedimento', (req, res) => {
    const { numero, usuario } = req.body;
    const banco = JSON.parse(fs.readFileSync('banco.json', 'utf8'));

    // Verificar se o número do procedimento está no novo formato
    if (!/^\d{3}-\d{5}\/\d{4}$/.test(numero)) {
        return res.status(400).json({ success: false, message: "Formato inválido para o número do procedimento." });
    }

    // Verificar se o procedimento já existe
    const procedimentoExistente = banco.procedimentos.find(p => p.numero === numero);

    if (procedimentoExistente) {
        return res.json({ success: true, message: "Procedimento já existe." });
    }

    // Obter a data e hora atuais formatadas
    const dataAtual = new Date();
    const dataFormatada = formatarData(dataAtual); // Formato dd/mm/aaaa
    const horaFormatada = ajustarHoraGMT3(dataAtual); // Hora ajustada para GMT -3

    // Adicionar o novo procedimento com o usuário que o registrou
    banco.procedimentos.push({
        numero: numero,
        usuario: usuario, // Salvar o nome do usuário logado
        leituras: [{
            data: dataFormatada, // Data formatada corretamente
            hora: horaFormatada // Hora ajustada para GMT -3
        }]
    });

    // Salvar no banco de dados
    fs.writeFileSync('banco.json', JSON.stringify(banco, null, 2));

    res.json({ success: true, message: "Procedimento salvo com sucesso." });
});