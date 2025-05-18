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

// Função para fazer login
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
            throw new Error('Acesso não autorizado');
        }
        
        currentUser = {
            uid: user.uid,
            email: user.email,
            isAdmin: funcionario.tipo === 'gerente',
            nome: funcionario.nome
        };
        
        // Atualizar UI
        updateUIForUser();
        
        // Carregar dados
        loadData();
        
    } catch (error) {
        console.error('Erro no login:', error);
        loginError.textContent = error.message;
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

// Função para carregar pedidos
function loadPedidos() {
    pedidosRef.on('value', (snapshot) => {
        const pedidosList = document.getElementById('pedidos-list');
        pedidosList.innerHTML = '';
        
        snapshot.forEach((childSnapshot) => {
            const pedido = childSnapshot.val();
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${pedido.idPedido}</td>
                <td>${pedido.status}</td>
                <td>${pedido.descricaoProduto}</td>
                <td>${pedido.quantidade}</td>
                <td>R$ ${pedido.precoUnitario?.toFixed(2) || '0.00'}</td>
                <td>R$ ${pedido.precoDia?.toFixed(2) || '0.00'}</td>
                <td>${pedido.nomeFuncionario || 'N/A'}</td>
                <td>
                    <button class="action-btn edit-btn" data-id="${pedido.idPedido}">Editar</button>
                    ${currentUser.isAdmin ? `<button class="action-btn delete-btn" data-id="${pedido.idPedido}">Excluir</button>` : ''}
                </td>
            `;
            
            pedidosList.appendChild(row);
        });
        
        // Adicionar event listeners para os botões
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => editPedido(btn.dataset.id));
        });
        
        if (currentUser.isAdmin) {
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', () => deletePedido(btn.dataset.id));
            });
        }
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

// Função para mostrar formulário de pedido
function showPedidoForm() {
    document.getElementById('pedido-form-title').textContent = 'Adicionar Pedido';
    document.getElementById('pedido-edit-mode').value = 'false';
    document.getElementById('pedido-id').value = '';
    document.getElementById('pedido-status').value = 'PENDENTE';
    document.getElementById('pedido-quantidade').value = '1';
    
    document.getElementById('pedidos-table-container').classList.add('hidden');
    document.getElementById('pedido-form-container').classList.remove('hidden');
    
    // Garantir que o dropdown de produtos está atualizado
    updateProdutosDropdown();
}

// Função para esconder formulário de pedido
function hidePedidoForm() {
    document.getElementById('pedidos-table-container').classList.remove('hidden');
    document.getElementById('pedido-form-container').classList.add('hidden');
}

// Função para editar pedido
async function editPedido(idPedido) {
    try {
        const snapshot = await pedidosRef.child(idPedido).once('value');
        const pedido = snapshot.val();
        
        if (!pedido) {
            throw new Error('Pedido não encontrado');
        }
        
        document.getElementById('pedido-form-title').textContent = 'Editar Pedido';
        document.getElementById('pedido-edit-mode').value = 'true';
        document.getElementById('pedido-id').value = pedido.idPedido;
        document.getElementById('pedido-status').value = pedido.status;
        document.getElementById('pedido-quantidade').value = pedido.quantidade;
        
        // Aguardar o dropdown de produtos ser carregado
        await updateProdutosDropdown();
        document.getElementById('pedido-produto').value = pedido.idProduto;
        
        document.getElementById('pedidos-table-container').classList.add('hidden');
        document.getElementById('pedido-form-container').classList.remove('hidden');
        
    } catch (error) {
        console.error('Erro ao editar pedido:', error);
        showMessage('Erro ao carregar pedido: ' + error.message, true);
    }
}

// Função para salvar pedido
async function savePedido(e) {
    e.preventDefault();
    
    try {
        const isEditMode = document.getElementById('pedido-edit-mode').value === 'true';
        const idPedido = document.getElementById('pedido-id').value.trim();
        const status = document.getElementById('pedido-status').value;
        const idProduto = document.getElementById('pedido-produto').value;
        const quantidade = parseInt(document.getElementById('pedido-quantidade').value);
        
        // Validar campos
        if (!idPedido) throw new Error('ID do pedido é obrigatório');
        if (!status) throw new Error('Status é obrigatório');
        if (!idProduto) throw new Error('Selecione um produto');
        if (isNaN(quantidade) || quantidade <= 0) throw new Error('Quantidade inválida');
        
        // Obter dados do produto
        const produtoSnapshot = await produtosRef.child(idProduto).once('value');
        const produto = produtoSnapshot.val();
        
        if (!produto) {
            throw new Error('Produto não encontrado');
        }
        
        const precoUnitario = produto.precoAtual;
        const precoDia = precoUnitario * quantidade;
        
        // Criar objeto do pedido
        const pedidoData = {
            idPedido: idPedido,
            status: status,
            idProduto: idProduto,
            descricaoProduto: produto.descricao,
            precoUnitario: precoUnitario,
            quantidade: quantidade,
            precoDia: precoDia,
            nomeFuncionario: currentUser.nome,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };

        // Se for edição, verificar se o pedido pertence ao usuário atual (exceto para admin)
        if (isEditMode && !currentUser.isAdmin) {
            const pedidoExistente = await pedidosRef.child(idPedido).once('value');
            if (pedidoExistente.exists()) {
                const idFuncionarioOriginal = pedidoExistente.val().idFuncionario;
                if (idFuncionarioOriginal !== currentUser.uid) {
                    throw new Error('Você não tem permissão para editar este pedido');
                }
                // Manter o idFuncionario original
                pedidoData.idFuncionario = idFuncionarioOriginal;
            }
        } else {
            // Para novos pedidos ou admin editando, usar o uid atual
            pedidoData.idFuncionario = currentUser.uid;
        }
        
        // Salvar no Firebase
        await pedidosRef.child(idPedido).set(pedidoData);
        
        hidePedidoForm();
        showMessage('Pedido salvo com sucesso!');
        loadPedidos();
        
    } catch (error) {
        console.error('Erro ao salvar pedido:', error);
        showMessage('Erro ao salvar pedido: ' + error.message, true);
    }
}

// Função para deletar pedido
async function deletePedido(idPedido) {
    if (confirm('Tem certeza que deseja excluir este pedido?')) {
        try {
            await pedidosRef.child(idPedido).remove();
            showMessage('Pedido excluído com sucesso!');
        } catch (error) {
            console.error('Erro ao excluir pedido:', error);
            showMessage('Erro ao excluir pedido: ' + error.message, true);
        }
    }
}

// Função para mostrar formulário de produto
function showProdutoForm() {
    document.getElementById('produto-form-title').textContent = 'Adicionar Produto';
    document.getElementById('produto-edit-mode').value = 'false';
    document.getElementById('produto-id').value = '';
    document.getElementById('produto-descricao').value = '';
    document.getElementById('produto-preco').value = '';
    
    document.getElementById('produtos-table-container').classList.add('hidden');
    document.getElementById('produto-form-container').classList.remove('hidden');
}

// Função para esconder formulário de produto
function hideProdutoForm() {
    document.getElementById('produtos-table-container').classList.remove('hidden');
    document.getElementById('produto-form-container').classList.add('hidden');
}

// Função para editar produto
async function editPedido(idPedido) {
    try {
        const snapshot = await pedidosRef.child(idPedido).once('value');
        const pedido = snapshot.val();
        
        if (!pedido) {
            throw new Error('Pedido não encontrado');
        }

        // 🚨 Validar se o garçom é o dono do pedido
        if (!currentUser.isAdmin && pedido.idFuncionario !== currentUser.uid) {
            throw new Error('Você não tem permissão para editar este pedido');
        }
        
        document.getElementById('pedido-form-title').textContent = 'Editar Pedido';
        document.getElementById('pedido-edit-mode').value = 'true';
        document.getElementById('pedido-id').value = pedido.idPedido;
        document.getElementById('pedido-status').value = pedido.status;
        document.getElementById('pedido-quantidade').value = pedido.quantidade;
        
        // Aguardar o dropdown de produtos ser carregado
        await updateProdutosDropdown();
        document.getElementById('pedido-produto').value = pedido.idProduto;
        
        document.getElementById('pedidos-table-container').classList.add('hidden');
        document.getElementById('pedido-form-container').classList.remove('hidden');
        
    } catch (error) {
        console.error('Erro ao editar pedido:', error);
        showMessage('Erro ao editar pedido: ' + error.message, true);
    }
}


// Função para salvar produto
// Função para salvar produto
async function saveProduto(e) {
    e.preventDefault();

    try {
        const isEditMode = document.getElementById('produto-edit-mode').value === 'true';
        const idProduto = document.getElementById('produto-id').value.trim();
        const descricao = document.getElementById('produto-descricao').value.trim();
        const precoAtual = parseFloat(document.getElementById('produto-preco').value);

        // Validações
        if (!descricao) throw new Error('Descrição é obrigatória');
        if (isNaN(precoAtual) || precoAtual <= 0) throw new Error('Preço inválido');

        const produtoData = {
            descricao: descricao,
            precoAtual: precoAtual,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };

        if (isEditMode) {
            if (!idProduto) {
                throw new Error('ID do produto é obrigatório para edição');
            }
            await produtosRef.child(idProduto).update(produtoData);
        } else {
            // Criar um novo produto com ID automático
            const newProdutoRef = produtosRef.push();
            await newProdutoRef.set(produtoData);
        }

        hideProdutoForm();
        showMessage('Produto salvo com sucesso!');
        loadProdutos();

    } catch (error) {
        console.error('Erro ao salvar produto:', error);
        showMessage('Erro ao salvar produto: ' + error.message, true);
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
document.getElementById('add-produto-btn').addEventListener('click', showProdutoForm);
document.getElementById('cancel-produto-btn').addEventListener('click', hideProdutoForm);
document.getElementById('produto-form').addEventListener('submit', saveProduto);

// Inicializar com formulários escondidos
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('pedido-form-container').classList.add('hidden');
    document.getElementById('produto-form-container').classList.add('hidden');
    document.getElementById('register-form').classList.add('hidden');
});