

document.addEventListener('DOMContentLoaded', function() {
    const resultadoPesquisaDiv = document.getElementById('resultado-pesquisa');

    // Limpar a div de resultados de pesquisa ao carregar a página se a flag estiver ativa
    if (sessionStorage.getItem('limparResultado') === 'true') {
        if (resultadoPesquisaDiv) {
            resultadoPesquisaDiv.innerHTML = '';
        }
        sessionStorage.setItem('limparResultado', 'false');  // Reseta a flag
    }


    exibirFormulario('gerarPDF-form');
});



// Função para verificar se o usuário já está logado
document.addEventListener('DOMContentLoaded', () => {
    const usuarioAtivo = localStorage.getItem('usuarioAtivo');
    
    if (usuarioAtivo) {
        // Se o usuário já estiver logado, mostrar a interface do app
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('app-container').style.display = 'block';
        document.getElementById('user-name').textContent = usuarioAtivo;
    } else {
        // Se não estiver logado, mostrar a interface de login
        document.getElementById('auth-container').style.display = 'block';
        document.getElementById('app-container').style.display = 'none';
    }
});


// Função para realizar o login
function login() {
    sessionStorage.setItem('limparResultado', 'true');
    //location.reload(true);
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === "Login realizado com sucesso") {
            alert(data.message);

            // Notificar o usuário se houver solicitações pendentes
            if (data.possuiPendentes) {
                alert("Você possui solicitações de transferência pendentes.");
            }

            // Armazenar o nome de usuário no localStorage
            localStorage.setItem('usuarioAtivo', username);
            // Exibir a interface do app
            document.getElementById('auth-container').style.display = 'none';
            document.getElementById('app-container').style.display = 'block';
            document.getElementById('user-name').textContent = username;
        } else {
            alert(data.message);
        }
    })
    .catch(error => console.error('Erro ao realizar login:', error));
}



// Função para realizar o logout
function logout() {
    localStorage.removeItem('usuarioAtivo');
    document.getElementById('auth-container').style.display = 'block';
    document.getElementById('app-container').style.display = 'none';
    limparSolicitacoesPendentes(); // Limpa solicitações na interface
    sessionStorage.clear();
    location.reload();
}




// Função para validar o formato do nome de usuário (8 caracteres alfanuméricos)
function validarUsername(username) {
    const regex = /^[a-zA-Z0-9]{8}$/; // Exatamente 8 caracteres alfanuméricos
    return regex.test(username);
}

// Função para validar o formato da senha (6 dígitos numéricos)
function validarSenha(senha) {
    const regex = /^\d{6}$/; // Exatamente 6 dígitos numéricos
    return regex.test(senha);
}

// Função para realizar o cadastro
function register() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    // Validar formato do usuário
    if (!validarUsername(username)) {
        alert("O nome de usuário deve ter exatamente 8 caracteres alfanuméricos.");
        return;
    }

    // Validar formato da senha
    if (!validarSenha(password)) {
        alert("A senha deve ter exatamente 6 dígitos numéricos.");
        return;
    }

    // Verificar se o usuário está pré-registrado pelo administrador
    fetch(`/verificarUsuario?username=${username}`)
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Usuário está pré-registrado, continuar com o cadastro
            fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert("Cadastro realizado com sucesso!");
                } else {
                    alert("Erro ao cadastrar usuário.");
                }
            });
        } else {
            alert("Usuário não pré-registrado. Por favor, contacte o administrador.");
        }
    })
    .catch(error => {
        console.error('Erro ao verificar o usuário:', error);
        alert("Erro ao verificar o usuário. Tente novamente.");
    });
}



// Função para validar o formato do número de procedimento
function validarProcedimento(numero) {
    const regex = /^[A-Z]{2}-\d{3}-\d{5}\/\d{4}$/; // Novo formato: xx-xxx-xxxxx/xxxx
    return regex.test(numero);
}



// Função para gerar o PDF
function gerarPDF() {
    const tipoProcedimento = document.getElementById("tipo-procedimento").value; // Captura as letras
    const numeroProcedimento = document.getElementById("procedimento").value;
    const autorInvestigado = document.getElementById("autor-investigado").value || "";
    const assunto = document.getElementById("assunto").value || "";
    const vitima = document.getElementById("vitima").value || "";
    const usuarioAtivo = localStorage.getItem('usuarioAtivo'); // Pega o usuário logado

    // Combinar o tipo de procedimento com o restante do número
    const numeroCompleto = `${tipoProcedimento}-${numeroProcedimento}`;

    if (!validarProcedimento(numeroCompleto)) {
        alert("O número do procedimento deve estar no formato xx-xxx-xxxxx/xxxx");
        return;
    }

    if (!usuarioAtivo) {
        alert("Usuário não está logado. Por favor, faça o login novamente.");
        return;
    }

    // Salvar o número do procedimento no banco de dados com o usuário ativo
    fetch('/salvarProcedimento', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ numero: numeroCompleto, usuario: usuarioAtivo })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Gera o PDF se o procedimento foi salvo
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            
            
            
            // Configurar o estilo do PDF
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(16);

            // Título principal
            doc.text("Capa de Procedimento para uso e controle interno.", 105, 20, { align: 'center' });

            // Adicionar conteúdo
            doc.setFontSize(12);
            doc.text(`Tipo de Procedimento: ${tipoProcedimento}`, 10, 40);
            doc.text(`Número do Procedimento: ${numeroProcedimento}`, 10, 50);

            if (autorInvestigado) doc.text(`Autor/Investigado: ${autorInvestigado}`, 10, 60);
            if (assunto) doc.text(`Assunto: ${assunto}`, 10, 70);
            if (vitima) doc.text(`Vítima: ${vitima}`, 10, 80);



            const qrCodeUrl = `https://arquivo-driguatu-production.up.railway.app/leitura?procedimento=${numeroCompleto}`;
            const qrCodeImg = generateQRCode(qrCodeUrl);
            // Reduza o tamanho do QR Code ao mínimo desejado
            doc.addImage(qrCodeImg, 'PNG', doc.internal.pageSize.getWidth() - 50, 30, 40, 40); // Ajuste largura e altura (40x40)


            doc.save(`procedimento_${numeroCompleto}.pdf`);
        } else {
            alert("Erro ao salvar o procedimento: " + data.message);
        }
    })
    .catch(error => {
        console.error('Erro ao salvar o procedimento:', error);
        alert('Erro ao salvar o procedimento. Tente novamente.');
    });
}

// Função para consultar movimentação
function consultarMovimentacao() {
    const tipoProcedimento = document.getElementById("consulta-tipo-procedimento").value; // Pega o tipo
    const numeroProcedimento = document.getElementById("consulta-procedimento").value;

    // Combinar tipo e número
    const numeroCompleto = `${tipoProcedimento}-${numeroProcedimento}`;

    if (!validarProcedimento(numeroCompleto)) {
        alert("O número do procedimento deve estar no formato xx-xxx-xxxxx/xxxx.");
        return;
    }

    fetch(`/consultaMovimentacao?procedimento=${numeroCompleto}`)
        .then(response => response.json())
        .then(data => {
            const resultadoDiv = document.getElementById('resultado-consulta');
            if (data.success) {
                let html = `<h3>Movimentações para o procedimento ${numeroCompleto}:</h3><ul>`;
                data.leituras.forEach(leitura => {
                    html += `<li>${leitura.usuario}, Data: ${leitura.data}, Hora: ${leitura.hora}</li>`;
                });
                html += `</ul>`;
                resultadoDiv.innerHTML = html;
            } else {
                resultadoDiv.innerHTML = `<p>${data.message}</p>`;
            }
        })
        .catch(error => {
            console.error('Erro ao consultar movimentação:', error);
            document.getElementById('resultado-consulta').innerHTML = `<p>Erro ao consultar movimentação. Tente novamente.</p>`;
        });
}


// Função para gerar QR Code
function generateQRCode(text) {
    const qr = qrcode(0, 'L');
    qr.addData(text);
    qr.make();
    return qr.createDataURL();
}

let procedimentosLidos = [];

function iniciarLeituraTransferencia() {
    const loginDestinatario = document.getElementById('login-destinatario').value;
    if (!loginDestinatario) {
        alert('Por favor, insira o login do destinatário.');
        return;
    }

    procedimentosLidos = []; // Reiniciar a lista de procedimentos
    document.getElementById('procedimentos-lista').innerHTML = ''; // Limpar a lista exibida
    document.getElementById('finalizarLeitura').style.display = 'block'; // Mostrar botão de finalizar

    lerQRCode(true); // Iniciar o leitor em modo transferência
}














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
                    alert('este é o qrcode lido antes: ' , qrCodeMessage);
                            alert('este é o numeroProcedimento lido antes: ' , numeroProcedimento);

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
                            alert('este é o qrcode lido: ' , qrCodeMessage);
                            alert('este é o numeroProcedimento lido: ' , numeroProcedimento);
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







function pararLeitorQRCode(html5QrCode) {
    alert("entrou na funçao parar leitor.");
    if (html5QrCode) {
        html5QrCode.stop()
            .then(() => {
                alert("Leitor de QR Code parado com sucesso.");
                const qrReaderElement = document.getElementById("qr-reader");
                qrReaderElement.style.display = "none"; // Ocultar o leitor
            })
            .catch(err => {
                console.error("Erro ao parar o leitor de QR Code:", err);
                alert("Erro ao encerrar o leitor. Tente novamente.");
            });
    } else {
        console.warn("Leitor de QR Code não foi inicializado ou já foi parado.");
        alert("Leitor de QR Code não foi inicializado ou já foi parado.");
    }
}



function atualizarListaProcedimentos() {
    const lista = document.getElementById('procedimentos-lista');
    lista.innerHTML = '';
    procedimentosLidos.forEach(proc => {
        const li = document.createElement('li');
        li.textContent = proc;
        lista.appendChild(li);
    });
}

function finalizarTransferencia() {
    const loginDestinatario = document.getElementById('login-destinatario').value;
    const usuarioAtivo = localStorage.getItem('usuarioAtivo'); // Login de quem solicita

    if (!loginDestinatario) {
        alert('Por favor, insira o login do destinatário.');
        return;
    }

    
    if (procedimentosLidos.length === 0) {
        alert('Nenhum procedimento foi lido.');
        pararLeitorQRCode(html5QrCode);
        //return;
    }

    fetch('/transferencias-em-massa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            loginDestinatario, 
            loginRemetente: usuarioAtivo, 
            procedimentos: procedimentosLidos 
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Transferências registradas com sucesso!');

            // Encerrar o leitor de QR Code
            //pararLeitorQRCode();
            procedimentosLidos = []; // Limpar a lista de procedimentos
            atualizarListaProcedimentos(); // Atualizar a interface
            document.getElementById('finalizarLeitura').style.display = 'none'; // Esconder botão
        } else {
            alert(`Erro ao registrar transferências: ${data.message}`);
        }
    })
    .catch(error => console.error('Erro ao registrar transferências:', error));
}



function lerQRCodePage() {
    window.location.href = "/leitor_qrcode.html";
}

// Função para pesquisar processos pelo login
function pesquisarPorLogin() {
    const loginPesquisa = document.getElementById('login-pesquisa').value;
    
    if (!loginPesquisa) {
        alert('Por favor, insira o número de login para pesquisar.');
        return;
    }

    // Buscar os dados no banco.json
    fetch('/dados')
        .then(response => response.json())
        .then(data => {
            const resultados = data.procedimentos.filter(procedimento => {
                // Verificar se a última leitura foi feita pelo login informado
                const ultimaLeitura = procedimento.leituras[procedimento.leituras.length - 1];
                return ultimaLeitura && ultimaLeitura.usuario === loginPesquisa;
            });

            // Exibir os resultados
            const resultadoDiv = document.getElementById('resultado-pesquisa');
            resultadoDiv.innerHTML = ''; // Limpar resultados anteriores

            if (resultados.length > 0) {
                resultados.forEach(procedimento => {
                    const div = document.createElement('div');
                    div.innerHTML = `
                        <p><strong>Número do Procedimento:</strong> ${procedimento.numero}</p>
                        <p><strong>Última Leitura:</strong> ${procedimento.leituras[procedimento.leituras.length - 1].data} às ${procedimento.leituras[procedimento.leituras.length - 1].hora}</p>
                    `;
                    resultadoDiv.appendChild(div);
                });
            } else {
                resultadoDiv.innerHTML = '<p>Nenhum processo encontrado para este login.</p>';
            }
        })
        .catch(error => {
            console.error('Erro ao carregar os dados:', error);
            alert('Erro ao buscar processos. Tente novamente.');
        });
}



// Função para solicitar a transferência de processo para outro login
function solicitarTransferencia() {
    const loginDestinatario = document.getElementById('login-transferencia').value;
    const tipoProcedimento = document.getElementById('tipo-transferencia').value; // Pega o tipo de procedimento
    const numeroProcedimento = document.getElementById('procedimento-transferencia').value;
    const usuarioAtivo = localStorage.getItem('usuarioAtivo'); // Usuário logado

    // Combinar o tipo de procedimento com o número inserido
    const numeroCompleto = `${tipoProcedimento}-${numeroProcedimento}`;

    if (!loginDestinatario || !numeroProcedimento) {
        alert('Por favor, preencha todos os campos.');
        return;
    }

    // Verificar se já existe uma solicitação pendente para o procedimento
    fetch(`/verificarSolicitacaoPendente?procedimento=${numeroCompleto}`)
        .then(response => response.json())
        .then(data => {
            if (data.pendente) {
                alert('Já existe uma solicitação pendente para este procedimento.');
                return;
            }

            // Caso não haja pendência, enviar a nova solicitação
            fetch('/solicitar-transferencia', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ loginDestinatario, numeroProcedimento: numeroCompleto, usuarioAtivo })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert('Solicitação enviada com sucesso!');
                    } else {
                        alert('Erro ao enviar solicitação: ' + data.message);
                    }
                })
                .catch(error => {
                    console.error('Erro ao solicitar transferência:', error);
                    alert('Erro ao solicitar transferência. Tente novamente.');
                });
        })
        .catch(error => {
            console.error('Erro ao verificar solicitação pendente:', error);
            alert('Erro ao verificar solicitação pendente. Tente novamente.');
        });
}


/*
// Função para solicitar a transferência de processo para outro login
function solicitarTransferencia() {
    const tipoProcedimento = document.getElementById('tipo-transferencia').value; // Pega o tipo de procedimento
    const numeroProcedimento = document.getElementById('procedimento-transferencia').value;
    const loginDestinatario = document.getElementById('login-transferencia').value;
    const usuarioAtivo = localStorage.getItem('usuarioAtivo'); // Usuário logado

    // Combinar o tipo de procedimento com o número inserido
    const numeroCompleto = `${tipoProcedimento}-${numeroProcedimento}`;

    if (!loginDestinatario || !numeroCompleto) {
        alert('Por favor, preencha todos os campos.');
        return;
    }

    fetch('/solicitar-transferencia', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ loginDestinatario, numeroProcedimento: numeroCompleto, usuarioAtivo })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Solicitação enviada com sucesso!');
        } else {
            alert('Erro ao enviar solicitação: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Erro ao solicitar transferência:', error);
        alert('Erro ao solicitar transferência. Tente novamente.');
    });
}

*/



// Função para carregar as solicitações pendentes para o usuário logado
function carregarSolicitacoesPendentes() {
    const usuarioAtivo = localStorage.getItem('usuarioAtivo'); // Usuário logado

    fetch('/dados')
        .then(response => response.json())
        .then(data => {
            const solicitacoes = data.solicitacoes.filter(solicitacao => solicitacao.loginDestinatario === usuarioAtivo && solicitacao.status === 'pendente');

            const solicitacoesDiv = document.getElementById('solicitacoes-pendentes');
            solicitacoesDiv.innerHTML = ''; // Limpar solicitações anteriores

            if (solicitacoes.length > 0) {
                solicitacoes.forEach((solicitacao) => {
                    const div = document.createElement('div');
                    div.id = `solicitacao-${solicitacao.id}`;  // Usar o ID único da solicitação
                    div.innerHTML = `
                        <p><strong>Processo:</strong> ${solicitacao.numeroProcedimento}</p>
                        <p><strong>De:</strong> ${solicitacao.loginRemetente}</p>
                        <button onclick="responderTransferencia('${solicitacao.id}', 'aceitar', this)">Aceitar</button>
                        <button onclick="responderTransferencia('${solicitacao.id}', 'recusar', this)">Recusar</button>
                    `;
                    solicitacoesDiv.appendChild(div);
                });
            } else {
                solicitacoesDiv.innerHTML = '<p>Nenhuma solicitação pendente.</p>';
            }
        })
        .catch(error => {
            console.error('Erro ao carregar as solicitações pendentes:', error);
        });
}





function responderTransferencia(solicitacaoId, acao, botao) {
    botao.disabled = true;  // Evitar múltiplos cliques

    fetch(`/responder-transferencia/${solicitacaoId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ acao })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Solicitação ' + (acao === 'aceitar' ? 'aceita' : 'recusada') + ' com sucesso!');
            document.getElementById(`solicitacao-${solicitacaoId}`).remove();  // Remove da lista
        } else {
            alert('Erro ao processar solicitação: ' + data.message);
        }
    })
    .catch(error => {
        console.error(`Erro ao processar solicitação ${solicitacaoId}:`, error);
        botao.disabled = false;  // Reabilita o botão se houver erro
    });
}




 // Função para testar leitura do banco de dados
 function testeLeitura() {
    fetch('/teste-leitura')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Leitura do banco de dados realizada com sucesso!\nDados: ' + JSON.stringify(data.banco, null, 2));
                console.log('Leitura do banco de dados:', data.banco);
            } else {
                alert('Erro ao ler banco de dados: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Erro ao testar leitura:', error);
            alert('Erro ao testar leitura do banco de dados.');
        });
}

// Função para testar gravação no banco de dados
function testeGravacao() {
    const dadosTeste = {
        test: "dados de teste"
    };

    fetch('/teste-gravacao', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosTeste)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Gravação no banco de dados realizada com sucesso!');
            console.log('Gravação no banco de dados realizada.');
        } else {
            alert('Erro ao gravar no banco de dados: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Erro ao testar gravação:', error);
        alert('Erro ao testar gravação no banco de dados.');
    });
}


function verificarSolicitacoes() {
    
    // Reutilizar a função de carregar as solicitações pendentes
    carregarSolicitacoesPendentes();
    
}


function mostrarConversor() {
    document.getElementById("conversor-container").style.display = "block";
}


/*
// Função para carregar o tipo antigo com base no número do procedimento
function carregarTipoAntigo() {
    const numero = document.getElementById("numero-converter").value;
    

    if (numero) {
        fetch(`/obterTipoAntigo?numero=${numero}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    document.getElementById("antigo-tipo").value = data.tipoAntigo;
                } else {
                    alert("Tipo antigo não encontrado. Verifique o número do procedimento.");
                }
            })
            .catch(error => console.error("Erro ao carregar o tipo antigo:", error));
    }
}
*/


function converterProcedimento() {
    const tipoSelecionado = document.getElementById("novo-tipo").value; // Tipo do procedimento (ex.: BO, TC)
    const numeroDigitado = document.getElementById("novo-numero").value; // Número no formato xxx-xxxxx/xxxx
    const tipoSelecionadoAntigo = document.getElementById("antigo-tipo").value; // Tipo do procedimento (ex.: BO, TC)
    const numeroOriginal = document.getElementById("numero-converter").value; // Número original do procedimento com tipo

    if (!numeroOriginal || !tipoSelecionado || !numeroDigitado) {
        alert("Preencha todos os campos para converter o procedimento.");
        return;
    }
    

    const novoNumeroCompleto = `${tipoSelecionado}-${numeroDigitado}`; // Concatenar tipo e número
    const antigoNumeroCompleto = `${tipoSelecionadoAntigo}-${numeroOriginal}`; // Concatenar tipo e número


    console.log("tipoSelecionado:", tipoSelecionado);
    console.log("numeroDigitado", numeroDigitado);
    console.log("Número original recebido:", numeroOriginal);
    console.log("novoNumeroCompleto", novoNumeroCompleto);
    console.log("antigoNumeroCompleto", antigoNumeroCompleto);
    

    fetch('/converterProcedimento', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ antigoNumeroCompleto, novoTipo: tipoSelecionado, novoNumero: novoNumeroCompleto })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
            // Limpar o formulário ou atualizar a página, conforme necessário
        } else {
            alert("Erro ao converter o procedimento: " + data.message);
        }
    })
    .catch(error => console.error("Erro ao converter procedimento:", error));
}


 // Função para mostrar o formulário selecionado e esconder os outros
 function mostrarFormulario(formularioId) {
    const formularios = document.querySelectorAll('.formulario');
    formularios.forEach(form => {
        form.style.display = 'none';
    });
    document.getElementById(formularioId).style.display = 'block';

}

// Função para exibir o formulário selecionado e ocultar os outros
function exibirFormulario(formularioId) {
    const formularios = ['gerarPDF-form', 'lerQRCode-form', 'consultarMovimentacao-form', 'transferirProcesso-form', 'solicitacoesTransferencia-form', 'conversao-form'];
    
    formularios.forEach(id => {
        document.getElementById(id).style.display = id === formularioId ? 'block' : 'none';
    });

    
}


function limparSolicitacoesPendentes() {
    const solicitacoesDiv = document.getElementById('solicitacoes-pendentes');
    if (solicitacoesDiv) {
        solicitacoesDiv.innerHTML = ''; // Limpa o conteúdo da div
    }
}
