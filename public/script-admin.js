// Função para pré-cadastrar um usuário
function preCadastrarUsuario() {
    const username = document.getElementById("pre-username").value;

    if (!/^[a-zA-Z0-9]{8}$/.test(username)) {
        alert("O nome de usuário deve ter exatamente 8 caracteres alfanuméricos.");
        return;
    }

    fetch('/preCadastro', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username })
    })
    .then(response => response.json())
    .then(data => {
        const mensagem = document.getElementById("mensagem-admin");
        if (data.success) {
            mensagem.innerHTML = `<p>Usuário ${username} pré-cadastrado com sucesso!</p>`;
        } else {
            mensagem.innerHTML = `<p>${data.message}</p>`;
        }
    })
    .catch(error => {
        console.error('Erro ao pré-cadastrar usuário:', error);
        alert('Erro ao pré-cadastrar usuário. Tente novamente.');
    });
}

// Função para resetar a senha do usuário
function resetarSenha() {
    const username = document.getElementById("reset-username").value;

    fetch('/resetSenha', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username })
    })
    .then(response => response.json())
    .then(data => {
        const mensagem = document.getElementById("mensagem-admin");
        if (data.success) {
            mensagem.innerHTML = `<p>Senha do usuário ${username} resetada com sucesso!</p>`;
        } else {
            mensagem.innerHTML = `<p>${data.message}</p>`;
        }
    })
    .catch(error => {
        console.error('Erro ao resetar a senha:', error);
        alert('Erro ao resetar a senha. Tente novamente.');
    });
}
