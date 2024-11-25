// Variável de bloqueio (lock)
let lock = false;

// Rota para solicitar transferência
app.post('/solicitar-transferencia', (req, res) => {
    const { loginDestinatario, numeroProcedimento, usuarioAtivo } = req.body;

    // Ler o banco de dados existente
    let banco;
    try {
        banco = JSON.parse(fs.readFileSync(bancoFilePath, 'utf8'));
        console.log('Banco de dados lido com sucesso!');
    } catch (error) {
        console.error('Erro ao ler o banco de dados:', error);
        return res.status(500).json({ success: false, message: "Erro ao ler o banco de dados." });
    }

    // Verificar se o número do procedimento está no novo formato
    const regex = /^[A-Z]{2}-\d{3}-\d{5}\/\d{4}$/;
    if (!regex.test(numeroProcedimento)) {
        return res.status(400).json({ success: false, message: "Formato inválido para o número do procedimento." });
    }

    // Verificar se o processo e o login destinatário existem
    const procedimento = banco.procedimentos.find(p => p.numero === numeroProcedimento);
    const destinatarioExiste = banco.usuarios.find(user => user.username === loginDestinatario);

    if (!procedimento || !destinatarioExiste) {
        return res.status(400).json({ success: false, message: "Processo ou login inválido." });
    }

    // Adicionar solicitação de transferência ao banco
    banco.solicitacoes.push({
        id: Math.random().toString(36).substr(2, 9),  // ID único
        loginRemetente: usuarioAtivo,
        loginDestinatario,
        numeroProcedimento,
        status: "pendente"
    });

    // Gravar o banco de dados atualizado
    try {
        fs.writeFileSync(bancoFilePath, JSON.stringify(banco, null, 2));
        console.log('Solicitação de transferência enviada e banco de dados atualizado!');
        res.json({ success: true, message: "Solicitação de transferência enviada." });
    } catch (error) {
        console.error('Erro ao salvar o banco de dados:', error);
        res.status(500).json({ success: false, message: "Erro ao salvar o banco de dados." });
    }
});
