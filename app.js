// Configuração do Firebase

const firebaseConfig = {
  apiKey: "AIzaSyBVIRDO3ByxlYNZlHSFslPelEK0fvFCbW0",
  authDomain: "restaurante-15f51.firebaseapp.com",
  databaseURL: "https://restaurante-15f51-default-rtdb.firebaseio.com",
  projectId: "restaurante-15f51",
  storageBucket: "restaurante-15f51.firebasestorage.app",
  messagingSenderId: "218407221507",
  appId: "1:218407221507:web:08db038a19f04d01b2d136"
};


// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();

// Referências do Database
const pedidosRef = database.ref('pedidos');
const produtosRef = database.ref('produtos');
const funcionariosRef = database.ref('funcionarios');

// Elementos da interface
const loginScreen = document.getElementById('login-screen');
const mainContent = document.getElementById('main-content');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const showRegisterBtn = document.getElementById('show-register-btn');
const cancelRegisterBtn = document.getElementById('cancel-register-btn');
const logoutBtn = document.getElementById('logout-btn');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginError = document.getElementById('login-error');
const registerError = document.getElementById('register-error');
const userNameDisplay = document.getElementById('user-name');

// Variáveis de estado
let currentUser = null;

// Função para mostrar mensagem
function showMessage(message, isError = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isError ? 'error' : 'success'}`;
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// Funções auxiliares para mostrar/esconder formulários
function showLoginForm() {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    loginError.textContent = '';
    registerError.textContent = '';
}

function showRegisterForm() {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    loginError.textContent = '';
    registerError.textContent = '';
}

// Função para registrar novo funcionário
async function registerFuncionario() {
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const name = document.getElementById('reg-name').value.trim();
    const type = document.getElementById('reg-type').value;
    
    try {
        // Validações
        if (!email || !password || !name) {
            throw new Error('Preencha todos os campos');
        }
        
        if (password.length < 6) {
            throw new Error('A senha deve ter pelo menos 6 caracteres');
        }
        
        // Criar usuário no Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Salvar informações adicionais no Realtime Database
        await funcionariosRef.child(user.uid).set({
            nome: name,
            email: email,
            tipo: type,
            ativo: true
        });
        
        showMessage('Funcionário cadastrado com sucesso!');
        showLoginForm();
        
    } catch (error) {
        console.error('Erro no cadastro:', error);
        registerError.textContent = error.message;
    }
}
async function login() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    try {
        console.log("Tentando login com:", email);

        // 1. Autenticação no Firebase Auth
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        console.log("Autenticação OK. UID:", user.uid);

        // 2. Buscar dados do funcionário
        const snapshot = await funcionariosRef.child(user.uid).once('value');
        const funcionario = snapshot.val();
        console.log("Dados do funcionário:", funcionario);

        if (!funcionario) {
            throw new Error('Cadastro de funcionário não encontrado');
        }

        if (funcionario.ativo === false) {
            throw new Error('Sua conta está desativada');
        }

        // 3. Atualizar estado do usuário
        currentUser = {
            uid: user.uid,
            email: user.email,
            isAdmin: funcionario.tipo === 'gerente',
            nome: funcionario.nome
        };

        console.log("Usuário logado:", currentUser);
        updateUIForUser();
        loadData();

    } catch (error) {
        console.error('Erro detalhado no login:', {
            message: error.message,
            code: error.code,
            stack: error.stack
        });

        let errorMessage = 'E-mail ou senha incorretos.';
        if (error.code) {
            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage = 'E-mail inválido';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'Conta desativada';
                    break;
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    errorMessage = 'E-mail ou senha incorretos';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Muitas tentativas. Tente mais tarde';
                    break;
            }
        } else {
            errorMessage = error.message || error;
        }

        loginError.textContent = errorMessage;
        loginError.style.display = 'block';
    }
}
// Função para fazer logout
async function logout() {
    try {
        await auth.signOut();
        currentUser = null;
        loginScreen.style.display = 'flex';
        mainContent.style.display = 'none';
        emailInput.value = '';
        passwordInput.value = '';
        loginError.textContent = '';
        showLoginForm();
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
    }
}

// Função para atualizar a UI com base no tipo de usuário
function updateUIForUser() {
    loginScreen.style.display = 'none';
    mainContent.style.display = 'block';
    userNameDisplay.textContent = currentUser.nome;
    
    if (currentUser.isAdmin) {
        document.querySelectorAll('.admin-only').forEach(el => {
            el.classList.remove('hidden');
        });
    } else {
        document.querySelectorAll('.admin-only').forEach(el => {
            el.classList.add('hidden');
        });
    }
}

// Função para carregar dados iniciais
function loadData() {
    loadPedidos();
    if (currentUser.isAdmin) {
        loadProdutos();
    }
}

function loadPedidos() {
    pedidosRef.on('value', (snapshot) => {
        const pedidosList = document.getElementById('pedidos-list');
        pedidosList.innerHTML = ''; // Limpa a tabela

        snapshot.forEach((childSnapshot) => {
            const pedido = childSnapshot.val();
            const row = document.createElement('tr');

            // Formata os itens para exibição
            const itensFormatados = pedido.itens 
                ? pedido.itens.map(item => `${item.quantidade}x ${item.descricao}`).join(', ')
                : 'Nenhum item';

            row.innerHTML = `
                <td>${childSnapshot.key}</td>
                <td>${pedido.mesa || 'N/D'}</td>
                <td>${pedido.status || 'PENDENTE'}</td>
                <td>${itensFormatados}</td>
                <td>R$ ${pedido.total?.toFixed(2) || '0.00'}</td>
                <td>${pedido.nomeFuncionario || 'N/A'}</td>
                <td>
                    <button class="action-btn edit-btn" data-id="${childSnapshot.key}">Editar</button>
                    ${(currentUser.isAdmin || pedido.idFuncionario === currentUser.uid) ? 
                        `<button class="action-btn delete-btn" data-id="${childSnapshot.key}">Excluir</button>` : ''}
                </td>
            `;

            pedidosList.appendChild(row);
        });

        // Adiciona listeners para TODOS os botões (tanto de edição quanto exclusão)
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => editPedido(btn.dataset.id));
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => deletePedido(btn.dataset.id));
        });

    }, (error) => {
        console.error('Erro ao carregar pedidos:', error);
    });
}

// Função para carregar produtos
function loadProdutos() {
    produtosRef.on('value', (snapshot) => {
        const produtosList = document.getElementById('produtos-list');
        produtosList.innerHTML = '';
        
        if (!snapshot.exists()) {
            console.log('Nenhum produto encontrado');
            return;
        }

        snapshot.forEach((childSnapshot) => {
            const produto = childSnapshot.val();
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${childSnapshot.key}</td>
                <td>${produto.descricao}</td>
                <td>R$ ${produto.precoAtual?.toFixed(2) || '0.00'}</td>
                <td>
                    <button class="action-btn edit-btn" data-id="${childSnapshot.key}">Editar</button>
                    <button class="action-btn delete-btn" data-id="${childSnapshot.key}">Excluir</button>
                </td>
            `;
            
            produtosList.appendChild(row);
        });
        
        // Atualizar dropdown de produtos
        updateProdutosDropdown();
        
        // Adicionar event listeners para os botões
        document.querySelectorAll('#produtos-table .edit-btn').forEach(btn => {
            btn.addEventListener('click', () => editProduto(btn.dataset.id));
        });
        
        document.querySelectorAll('#produtos-table .delete-btn').forEach(btn => {
            btn.addEventListener('click', () => deleteProduto(btn.dataset.id));
        });
        
    }, (error) => {
        console.error('Erro ao carregar produtos:', error);
    });
}

// Função para atualizar dropdown de produtos
async function updateProdutosDropdown() {
    try {
        const snapshot = await produtosRef.once('value');
        const dropdown = document.getElementById('pedido-produto');
        dropdown.innerHTML = '<option value="">Selecione um produto</option>';

        snapshot.forEach((childSnapshot) => {
            const produto = childSnapshot.val();
            const option = document.createElement('option');
            option.value = childSnapshot.key;
            option.textContent = `${produto.descricao} (R$ ${produto.precoAtual?.toFixed(2) || '0.00'})`;
            dropdown.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar produtos para dropdown:', error);
        throw error; // opcional, para propagar erro
    }
}

function showProdutoForm(produto = null) {
    console.log('Função showProdutoForm executada'); // Debug 1
    
    const formTitle = document.getElementById('produto-form-title');
    const idInput = document.getElementById('produto-id');
    const descricaoInput = document.getElementById('produto-descricao');
    const precoInput = document.getElementById('produto-preco');
    const editModeInput = document.getElementById('produto-edit-mode');

    console.log('Elementos obtidos:', {formTitle, idInput, descricaoInput, precoInput, editModeInput}); // Debug 2

    if (produto) {
        console.log('Modo edição ativado'); // Debug 3
        formTitle.textContent = 'Editar Produto';
        editModeInput.value = 'true';
        idInput.value = produto.id || '';
        descricaoInput.value = produto.descricao || '';
        precoInput.value = produto.precoAtual || '';
    } else {
        console.log('Modo novo produto ativado'); // Debug 4
        formTitle.textContent = 'Adicionar Produto';
        editModeInput.value = 'false';
        idInput.value = '';
        descricaoInput.value = '';
        precoInput.value = '';
    }

    const tableContainer = document.getElementById('produtos-table-container');
    const formContainer = document.getElementById('produto-form-container');
    
    console.log('Elementos de UI:', {tableContainer, formContainer}); // Debug 5

    tableContainer.classList.add('hidden');
    formContainer.classList.remove('hidden');
    
    if (produto) {
        descricaoInput.focus();
    } else {
        document.getElementById('produto-descricao').focus();
    }
}
async function getNextProdutoId() {
    const counterRef = database.ref('counters/produtos');
    const transaction = await counterRef.transaction(currentValue => {
        return (currentValue || 1000) + 1;
    });
    return transaction.snapshot.val();
}
async function showPedidoForm() {
    try {
        // Verifica se o usuário tem permissão
        if (!currentUser) throw new Error("Usuário não autenticado");

        // Preenche os campos básicos
        document.getElementById('pedido-form-title').textContent = 'Novo Pedido';
        document.getElementById('pedido-edit-mode').value = 'false';
        document.getElementById('pedido-status').value = 'PENDENTE';
        document.getElementById('pedido-quantidade').value = '1';
        document.getElementById('pedido-mesa').value = '';

        // Gera um ID temporário (será substituído pelo push() do Firebase)
        document.getElementById('pedido-id').value = "GERANDO...";

        // Carrega produtos (AGUARDA a conclusão)
        await updateProdutosDropdown();

        // Exibe o formulário
        document.getElementById('pedidos-table-container').classList.add('hidden');
        document.getElementById('pedido-form-container').classList.remove('hidden');

    } catch (error) {
        console.error("Erro ao preparar formulário:", error);
        showMessage("Erro: " + error.message, true);
    }
}
// Função para esconder formulário de pedido
function hidePedidoForm() {
    document.getElementById('pedidos-table-container').classList.remove('hidden');
    document.getElementById('pedido-form-container').classList.add('hidden');
}

async function editPedido(idPedido) {
    try {
        console.log("🔍 Iniciando edição do pedido:", idPedido);

        // 1. Busca o pedido no Firebase
        const snapshot = await pedidosRef.child(idPedido).once('value');
        const pedido = snapshot.val();

        console.log("📦 Dados brutos do pedido:", pedido);

        if (!pedido) {
            throw new Error("Pedido não encontrado no banco de dados");
        }

        // 2. Verifica se o usuário tem permissão
        if (!currentUser.isAdmin && pedido.idFuncionario !== currentUser.uid) {
            throw new Error("Você só pode editar seus próprios pedidos");
        }

        document.getElementById('pedido-form-title').textContent = 'Editar Pedido';
        document.getElementById('pedido-edit-mode').value = 'true';
        document.getElementById('pedido-id').value = idPedido;
        document.getElementById('pedido-mesa').value = pedido.mesa || '';
        document.getElementById('pedido-status').value = pedido.status || 'PENDENTE';

        // 4. Carrega produtos e ESPERA finalizar
        await updateProdutosDropdown();
        console.log("✅ Dropdown de produtos carregado");

        // 5. Preenche itens (produto e quantidade)
        const produtoSelect = document.getElementById('pedido-produto');
        const quantidadeInput = document.getElementById('pedido-quantidade');

        if (pedido.itens && pedido.itens.length > 0) {
            produtoSelect.value = pedido.itens[0].idProduto || '';
            quantidadeInput.value = pedido.itens[0].quantidade || 1;
        } else if (pedido.idProduto) {
            produtoSelect.value = pedido.idProduto;
            quantidadeInput.value = pedido.quantidade || 1;
        } else {
            produtoSelect.value = '';
            quantidadeInput.value = 1;
        }


        // 6. Exibe o formulário
        document.getElementById('pedidos-table-container').classList.add('hidden');
        document.getElementById('pedido-form-container').classList.remove('hidden');

        console.log("✨ Formulário carregado com:", {
            produto: produtoSelect.value,
            quantidade: quantidadeInput.value,
            mesa: pedido.mesa,
            status: pedido.status
        });

    } catch (error) {
        console.error("💥 Erro detalhado:", {
            message: error.message,
            stack: error.stack
        });
        showMessage(`Falha ao carregar pedido: ${error.message}`, true);
    }
}
async function savePedido(e) {
    e.preventDefault();

    try {
        // 1. Verificação de autenticação
        if (!currentUser) {
            throw new Error("Usuário não autenticado");
        }

        // 2. Coletar e validar dados do formulário
        const mesaInput = document.getElementById('pedido-mesa').value.trim();
        const mesa = parseInt(mesaInput);
        if (isNaN(mesa) || mesa <= 0) throw new Error("Número da mesa inválido");

        const status = document.getElementById('pedido-status').value;
        const idProduto = document.getElementById('pedido-produto').value;

        const quantidadeInput = document.getElementById('pedido-quantidade').value;
        const quantidade = parseInt(quantidadeInput);
        if (isNaN(quantidade) || quantidade <= 0) throw new Error("Quantidade deve ser um número positivo");

        const isEditMode = document.getElementById('pedido-edit-mode').value === 'true';
        const idPedido = document.getElementById('pedido-id').value;

        // 3. Buscar informações do produto com tratamento de erro
        const produtoSnapshot = await produtosRef.child(idProduto).once('value');
        if (!produtoSnapshot.exists()) throw new Error("Produto não encontrado");

        const produto = produtoSnapshot.val();
        if (!produto || !produto.precoAtual) throw new Error("Dados do produto inválidos");

        // Converter preço para número com segurança
        const precoUnitario = parseFloat(produto.precoAtual);
        if (isNaN(precoUnitario)) throw new Error("Preço do produto inválido");

        // 4. Calcular totais garantindo que são números
        const subtotal = precoUnitario * quantidade;
        const total = subtotal; // Pode ser expandido para múltiplos itens depois

        // 5. Montar objeto do pedido com valores numéricos garantidos
        const pedidoData = {
            mesa: mesa,
            status: status || 'pendente',
            itens: [{
                idProduto: idProduto,
                descricao: produto.descricao || 'Produto sem descrição',
                quantidade: quantidade,
                precoUnitario: precoUnitario,
                subtotal: subtotal
            }],
            total: total,
            idFuncionario: currentUser.uid,
                nomeFuncionario: currentUser.nome || currentUser.email.split('@')[0],
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            atualizadoEm: firebase.database.ServerValue.TIMESTAMP
        };

        // 6. Salvar no Firebase
        if (isEditMode) {
            if (!idPedido) throw new Error("ID do pedido não informado para edição");

            const pedidoExistente = await pedidosRef.child(idPedido).once('value');
            if (pedidoExistente.exists()) {
                pedidoData.criadoEm = pedidoExistente.val().criadoEm || firebase.database.ServerValue.TIMESTAMP;
            }

            await pedidosRef.child(idPedido).update(pedidoData);
            showMessage(`Pedido #${idPedido} atualizado com sucesso!`);
        } else {
            const novoId = await getNextPedidoId();
            pedidoData.criadoEm = firebase.database.ServerValue.TIMESTAMP;

            await pedidosRef.child(novoId).set(pedidoData);
            showMessage(`Pedido #${novoId} cadastrado com sucesso!`);
        }

        // 7. Atualizar interface
        hidePedidoForm();
        loadPedidos();

    } catch (error) {
        console.error("Erro ao salvar pedido:", error);
        showMessage("Erro: " + error.message, true);
    }
}

// Função auxiliar para gerar IDs sequenciais
async function getNextPedidoId() {
    try {
        const snapshot = await pedidosRef.orderByKey().limitToLast(1).once('value');
        let lastId = 0;

        snapshot.forEach(childSnapshot => {
            const id = parseInt(childSnapshot.key);
            if (!isNaN(id)) lastId = id;
        });

        return lastId + 1;
    } catch (error) {
        console.error("Erro ao gerar novo ID de pedido:", error);
        return new Date().getTime(); // Fallback seguro
    }
}
async function deletePedido(idPedido) {
    try {
        // 1. Verificar autenticação
        if (!currentUser) {
            throw new Error("Faça login para continuar");
        }

        // 2. Buscar o pedido e verificar permissões
        const pedidoRef = firebase.database().ref(`pedidos/${idPedido}`);
        const snapshot = await pedidoRef.once('value');

        if (!snapshot.exists()) {
            throw new Error("Pedido não encontrado");
        }

        const pedido = snapshot.val();
        const isAdmin = currentUser.isAdmin;
        const isOwner = pedido.idFuncionario === currentUser.uid;

        // 3. Verificar se é admin OU dono do pedido pendente
        if (!isAdmin && (!isOwner || !['entregue', 'ENTREGUE'].includes(pedido.status))) {
            throw new Error("Você só pode excluir seus próprios pedidos com status 'entregue'");
        }


        // 4. Confirmação explícita
        if (!confirm(`Tem certeza que deseja EXCLUIR PERMANENTEMENTE o pedido #${idPedido}?`)) {
            return;
        }

        // 5. Exclusão definitiva
        await pedidoRef.remove();

        // 6. Feedback e atualização
        showMessage(`Pedido #${idPedido} excluído com sucesso!`);
        loadPedidos(); // Atualiza a lista na tela

    } catch (error) {
        console.error("Erro ao excluir pedido:", error);
        showMessage(`Erro: ${error.message}`, true);
    }
}
// Função para esconder formulário de produto
function hideProdutoForm() {
    document.getElementById('produtos-table-container').classList.remove('hidden');
    document.getElementById('produto-form-container').classList.add('hidden');
}

// Função para editar produto

async function saveProduto(e) {
    e.preventDefault();

    try {
        // 1. Verificar se é admin
        if (!currentUser.isAdmin) {
            throw new Error("Apenas administradores podem cadastrar produtos");
        }

        // 2. Coletar dados do formulário
        const descricao = document.getElementById('produto-descricao').value.trim();
        const preco = parseFloat(document.getElementById('produto-preco').value);
        const isEditMode = document.getElementById('produto-edit-mode').value === 'true';
        const idProduto = document.getElementById('produto-id').value;

        // 3. Validações
        if (!descricao) throw new Error("Descrição é obrigatória");
        if (isNaN(preco) || preco <= 0) throw new Error("Preço inválido");

        // 4. Montar objeto do produto
        const produtoData = {
            descricao: descricao,
            precoAtual: preco,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };

        // 5. Salvar no Firebase
        if (isEditMode) {
            await produtosRef.child(idProduto).update(produtoData);
            showMessage("Produto atualizado com sucesso!");
        } else {
            const novoId = await getNextProdutoId();
            await produtosRef.child(novoId).set(produtoData);
            showMessage(`Produto #${novoId} cadastrado!`);
        }

        hideProdutoForm();
        loadProdutos();

    } catch (error) {
        console.error("Erro ao salvar produto:", error);
        showMessage("Erro: " + error.message, true);
    }
}

async function editProduto(idProduto) {
    try {
        console.log("[DEBUG] Iniciando edição do produto:", idProduto);

        // 1. Busca o produto no Firebase
        const snapshot = await produtosRef.child(idProduto).once('value');
        const produto = snapshot.val();

        console.log("[DEBUG] Dados do produto:", produto);

        if (!produto) {
            throw new Error('Produto não encontrado');
        }

        // 2. Preenche o formulário
        document.getElementById('produto-form-title').textContent = 'Editar Produto';
        document.getElementById('produto-edit-mode').value = 'true';
        document.getElementById('produto-id').value = idProduto;
        document.getElementById('produto-descricao').value = produto.descricao || '';
        document.getElementById('produto-preco').value = produto.precoAtual || '0.00';

        // 3. Exibe o formulário
        document.getElementById('produtos-table-container').classList.add('hidden');
        document.getElementById('produto-form-container').classList.remove('hidden');

        console.log("[DEBUG] Formulário de produto pronto para edição");

    } catch (error) {
        console.error('[ERRO] Ao editar produto:', error);
        showMessage('Erro ao carregar produto: ' + error.message, true);
    }
}

// Função para deletar produto
async function deleteProduto(idProduto) {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
        try {
            await produtosRef.child(idProduto).remove();
            showMessage('Produto excluído com sucesso!');
            loadProdutos();
            updateProdutosDropdown();
        } catch (error) {
            console.error('Erro ao excluir produto:', error);
            showMessage('Erro ao excluir produto: ' + error.message, true);
        }
    }
}

// Verificar estado de autenticação ao carregar a página
auth.onAuthStateChanged(async (user) => {
    if (user) {
        try {
            const snapshot = await funcionariosRef.child(user.uid).once('value');
            const funcionario = snapshot.val();
            
            if (funcionario && funcionario.ativo) {
                currentUser = {
                    uid: user.uid,
                    email: user.email,
                    isAdmin: funcionario.tipo === 'gerente',
                    nome: funcionario.nome
                };
                
                updateUIForUser();
                loadData();
            } else {
                await auth.signOut();
                showLoginForm();
            }
        } catch (error) {
            console.error('Erro ao verificar usuário:', error);
            await auth.signOut();
            showLoginForm();
        }
    } else {
        showLoginForm();
    }
});

// Event Listeners
loginBtn.addEventListener('click', login);
registerBtn.addEventListener('click', registerFuncionario);
showRegisterBtn.addEventListener('click', showRegisterForm);
cancelRegisterBtn.addEventListener('click', showLoginForm);
logoutBtn.addEventListener('click', logout);

// Permitir login com Enter
passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        login();
    }
});

document.getElementById('reg-password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        registerFuncionario();
    }
});

// Pedidos
document.getElementById('add-pedido-btn').addEventListener('click', showPedidoForm);
document.getElementById('cancel-pedido-btn').addEventListener('click', hidePedidoForm);
document.getElementById('pedido-form').addEventListener('submit', savePedido);

// Produtos
// Adicione isso na seção de event listeners (geralmente no final do arquivo)
document.getElementById('add-produto-btn').addEventListener('click', function() {
    console.log('Botão add-produto-btn clicado!'); // Debug 6
    showProdutoForm();
});
document.getElementById('cancel-produto-btn').addEventListener('click', hideProdutoForm);
document.getElementById('produto-form').addEventListener('submit', saveProduto);

// Inicializar com formulários escondidos
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('pedido-form-container').classList.add('hidden');
    document.getElementById('produto-form-container').classList.add('hidden');
    document.getElementById('register-form').classList.add('hidden');
    
    // Listener para edição de produtos
    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('edit-produto-btn')) {
            const produtoId = e.target.dataset.id;
            const snapshot = await produtosRef.child(produtoId).once('value');
            const produtoData = snapshot.val();
            
            if (produtoData) {
                showProdutoForm({
                    id: produtoId,
                    descricao: produtoData.descricao,
                    precoAtual: produtoData.precoAtual
                });
            }
        }
    });
});