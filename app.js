// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBALTio5D2MT-1Kbuzzu47h2EY0102OO4M",
    authDomain: "appcurso-41fe5.firebaseapp.com",
    databaseURL: "https://appcurso-41fe5-default-rtdb.firebaseio.com",
    projectId: "appcurso-41fe5",
    storageBucket: "appcurso-41fe5.firebasestorage.app",
    messagingSenderId: "194370805325",
    appId: "1:194370805325:web:ecb45ea9d173d7e9f3c604"
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
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Obter informações adicionais do funcionário
        const snapshot = await funcionariosRef.child(user.uid).once('value');
        const funcionario = snapshot.val();
        
        if (!funcionario || !funcionario.ativo) {
            await auth.signOut();
            throw new Error('Acesso não autorizado. Sua conta pode estar desativada ou você não tem permissão para acessar o sistema.');
        }
        
        currentUser = {
            uid: user.uid,
            email: user.email,
            isAdmin: funcionario.tipo === 'gerente',
            nome: funcionario.nome
        };
        
        updateUIForUser();
        loadData();
        
    } catch (error) {
        console.error('Erro no login:', error);
        
        let errorMessage = 'Erro ao fazer login';
        
        // Verifica se é um erro do Firebase Authentication
        if (error instanceof Error && error.message.includes('auth/')) {
            const errorCode = error.message.split('auth/')[1].split(')')[0];
            
            switch (errorCode) {
                case 'invalid-email':
                    errorMessage = 'E-mail inválido. Por favor, verifique o formato.';
                    break;
                case 'user-disabled':
                    errorMessage = 'Esta conta foi desativada.';
                    break;
                case 'user-not-found':
                case 'wrong-password':
                    errorMessage = 'E-mail ou senha incorretos.';
                    break;
                case 'too-many-requests':
                    errorMessage = 'Muitas tentativas falhas. Tente novamente mais tarde.';
                    break;
                case 'network-request-failed':
                    errorMessage = 'Problema de conexão. Verifique sua internet.';
                    break;
                default:
                    errorMessage = 'E-mail ou senha incorretos.';
            }
        } else {
            // Para outros erros (como o seu throw new Error)
            errorMessage = error.message || 'Erro ao fazer login.';
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
function updateProdutosDropdown() {
    produtosRef.once('value').then((snapshot) => {
        const dropdown = document.getElementById('pedido-produto');
        dropdown.innerHTML = '<option value="">Selecione um produto</option>';
        
        snapshot.forEach((childSnapshot) => {
            const produto = childSnapshot.val();
            const option = document.createElement('option');
            option.value = childSnapshot.key;
            option.textContent = `${produto.descricao} (R$ ${produto.precoAtual?.toFixed(2) || '0.00'})`;
            dropdown.appendChild(option);
        });
    }).catch(error => {
        console.error('Erro ao carregar produtos para dropdown:', error);
    });
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
        return (currentValue || 1000) + 1; // Começa do 1000 se não existir
    });
    return transaction.snapshot.val();
}
async function showPedidoForm() {
    try {
        // Gera um ID numérico automático
        const nextId = await getNextPedidoId();
        document.getElementById('pedido-id').value = nextId;

        // Restante do código
        document.getElementById('pedido-form-title').textContent = 'Adicionar Pedido';
        document.getElementById('pedido-edit-mode').value = 'false';
        document.getElementById('pedido-status').value = 'PENDENTE';
        document.getElementById('pedido-quantidade').value = '1';
        document.getElementById('pedido-mesa').value = '';

        document.getElementById('pedidos-table-container').classList.add('hidden');
        document.getElementById('pedido-form-container').classList.remove('hidden');

        await updateProdutosDropdown();

    } catch (error) {
        console.error('Erro ao gerar ID do pedido:', error);
        showMessage('Erro ao preparar formulário: ' + error.message, true);
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

        // 3. Preenche os campos do formulário
        document.getElementById('pedido-form-title').textContent = 'Editar Pedido';
        document.getElementById('pedido-edit-mode').value = 'true';
        document.getElementById('pedido-id').value = idPedido;
        document.getElementById('pedido-mesa').value = pedido.mesa || '';
        document.getElementById('pedido-status').value = pedido.status || 'PENDENTE';

        // 4. Carrega produtos e ESPERA finalizar
        await updateProdutosDropdown();
        console.log("✅ Dropdown de produtos carregado");

        // 5. Preenche itens (compatível com formato novo e antigo)
        const produtoSelect = document.getElementById('pedido-produto');
        const quantidadeInput = document.getElementById('pedido-quantidade');

        // Verifica formato dos itens
        if (pedido.itens && pedido.itens.length > 0) {
            // Formato NOVO (com array de itens)
            produtoSelect.value = pedido.itens[0].idProduto || '';
            quantidadeInput.value = pedido.itens[0].quantidade || 1;
        } else if (pedido.idProduto) {
            // Formato ANTIGO (campos diretos)
            produtoSelect.value = pedido.idProduto;
            quantidadeInput.value = pedido.quantidade || 1;
        } else {
            // Sem itens definidos
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
        // 1. Coleta dos valores do formulário
        const idPedido = document.getElementById('pedido-id').value;
        const mesa = document.getElementById('pedido-mesa').value.trim();
        const status = document.getElementById('pedido-status').value;
        const idProduto = document.getElementById('pedido-produto').value;
        const quantidade = parseInt(document.getElementById('pedido-quantidade').value);

        // 2. Validações
        if (!mesa) throw new Error("Número da mesa é obrigatório");
        if (!status) throw new Error("Status é obrigatório");
        if (!idProduto) throw new Error('Selecione um produto');
        if (isNaN(quantidade) || quantidade <= 0) throw new Error('Quantidade inválida');

        // 3. Busca o produto no Firebase
        const produtoSnapshot = await produtosRef.child(idProduto).once('value');
        const produto = produtoSnapshot.val();
        if (!produto) throw new Error('Produto não encontrado');

        // 4. Calcula o total
        const total = produto.precoAtual * quantidade;

        // 5. Monta o objeto do pedido
        const pedidoData = {
            idPedido: idPedido,
            mesa: mesa,
            status: status, // Usando a constante já declarada
            itens: [{
                idProduto: idProduto,
                descricao: produto.descricao,
                quantidade: quantidade,
                precoUnitario: produto.precoAtual
            }],
            total: total,
            idFuncionario: currentUser.uid,
            nomeFuncionario: currentUser.nome,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };

        // 6. Salva no Firebase
        await pedidosRef.child(idPedido).set(pedidoData);

        // 7. Feedback e reset
        showMessage(`Pedido #${idPedido} salvo com sucesso!`);
        hidePedidoForm();
        loadPedidos();

    } catch (error) {
        console.error('Erro ao salvar pedido:', error);
        showMessage('Erro: ' + error.message, true);
    }
}
async function getNextPedidoId() {
    const counterRef = database.ref('counters/pedidos');
    const transaction = await counterRef.transaction(currentValue => {
        return (currentValue || 1000) + 1; // Começa do 1000 se não existir
    });
    return transaction.snapshot.val();
}

// Função para deletar pedido
async function deletePedido(idPedido) {
    try {
        // Verifica se o pedido pertence ao usuário ou se é admin
        const snapshot = await pedidosRef.child(idPedido).once('value');
        const pedido = snapshot.val();

        if (!pedido) throw new Error('Pedido não encontrado');

        if (!currentUser.isAdmin && pedido.idFuncionario !== currentUser.uid) {
            throw new Error('Você só pode excluir seus próprios pedidos');
        }

        if (confirm('Tem certeza que deseja excluir este pedido?')) {
            await pedidosRef.child(idPedido).remove();
            showMessage('Pedido excluído com sucesso!');
        }
    } catch (error) {
        console.error('Erro ao excluir pedido:', error);
        showMessage('Erro: ' + error.message, true);
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
        const descricaoInput = document.getElementById('produto-descricao');
        const precoInput = document.getElementById('produto-preco');
        
        const descricao = descricaoInput.value.trim();
        const precoAtual = parseFloat(precoInput.value);
        const isEditMode = document.getElementById('produto-edit-mode').value === 'true';
        const idProduto = document.getElementById('produto-id').value;

        // Validações
        if (!descricao) throw new Error('Descrição é obrigatória');
        if (isNaN(precoAtual) || precoAtual <= 0) throw new Error('Preço inválido');

        const produtoData = {
            descricao: descricao,
            precoAtual: precoAtual,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };

        if (isEditMode) {
            if (!idProduto) throw new Error('ID do produto é obrigatório para edição');
            await produtosRef.child(idProduto).update(produtoData);
        } else {
            // Modo criação - gera novo ID numérico
            const newId = await getNextProdutoId();
            await produtosRef.child(newId).set(produtoData);
            
            // Atualiza o campo ID no formulário
            document.getElementById('produto-id').value = newId;
        }

        hideProdutoForm();
        showMessage('Produto salvo com sucesso!');
        loadProdutos();

    } catch (error) {
        console.error('Erro ao salvar produto:', error);
        showMessage('Erro ao salvar produto: ' + error.message, true);
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