// ===== INICIALIZAÇÃO =====
if(!localStorage.getItem('users')) localStorage.setItem('users', JSON.stringify([]));
let users = JSON.parse(localStorage.getItem('users'));

// Cria admin se não existir
if(!users.some(u => u.isAdmin)){
    users.push({
        name:'Kleyster',
        email:'admin@konekt.com',
        number:'000',
        password:'123456',
        isAdmin:true,
        plan:'Pro',
        planExpire:null
    });
    localStorage.setItem('users', JSON.stringify(users));
}

// ===== REGISTRO =====
function registerUser(){
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const number = document.getElementById('signupNumber').value.trim();
    const password = document.getElementById('signupPassword').value.trim();
    if(!name || !email || !number || !password){ alert('Preencha todos os campos!'); return; }
    if(users.some(u => u.name === name)){ alert('Usuário já existe!'); return; }
    const expire = new Date(new Date().getTime() + 3*24*60*60*1000);
    const newUser = {name, email, number, password, isAdmin:false, plan:'Teste Grátis', planExpire:expire.toISOString()};
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    alert('Cadastro realizado! 3 dias de teste grátis.');
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    showDashboard();
}

// ===== LOGIN =====
function loginUser(){
    const name = document.getElementById('loginName').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const user = users.find(u => u.name === name && u.password === password);
    if(!user){ alert('Usuário ou senha incorretos!'); return; }
    localStorage.setItem('currentUser', JSON.stringify(user));
    showDashboard();
}

// ===== LOGOUT =====
function logout(){
    localStorage.removeItem('currentUser');
    location.reload();
}

// ===== DASHBOARD =====
function showDashboard(){
    const authContainer = document.querySelector('.auth-container');
    const dashboard = document.querySelector('.dashboard');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if(!currentUser){ authContainer.style.display = 'block'; dashboard.style.display = 'none'; return; }

    authContainer.style.display = 'none';
    dashboard.style.display = 'block';

    document.querySelector('.greeting').innerText = `Bem-vindo ${currentUser.name}`;
    document.getElementById('planName').innerText = currentUser.plan;

    updatePlanCountdown(currentUser);

    // ADMIN PANEL
    const adminPanel = document.getElementById('adminPanel');
    if(currentUser.isAdmin){
        adminPanel.style.display = 'block';
        refreshUserList();
    } else {
        adminPanel.style.display = 'none';
    }

    renderOrders();
}

// ===== CONTAGEM DO PLANO =====
function updatePlanCountdown(user){
    const countdownEl = document.getElementById('planCountdown');
    if(user.planExpire){
        const interval = setInterval(() => {
            const now = new Date();
            const expire = new Date(user.planExpire);
            const diff = expire - now;
            if(diff <= 0){
                countdownEl.innerText = 'Expirado';
                clearInterval(interval);
            } else {
                const days = Math.floor(diff / (1000*60*60*24));
                const hours = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
                const minutes = Math.floor((diff % (1000*60*60)) / (1000*60));
                countdownEl.innerText = `${days}d ${hours}h ${minutes}m`;
            }
        }, 1000);
    } else {
        countdownEl.innerText = '';
    }
}

// ===== PEDIDOS =====
if(!localStorage.getItem('orders')) localStorage.setItem('orders', JSON.stringify([]));
let orders = JSON.parse(localStorage.getItem('orders'));

function createOrderFromInput(){
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const product = document.getElementById('productInput').value.trim();
    const userNumber = document.getElementById('userNumberInput').value.trim();
    const clientNumber = document.getElementById('clientNumberInput').value.trim();
    const province = document.getElementById('provinceInput').value.trim();
    const deliveryDate = document.getElementById('deliveryDateInput').value;

    if(!product || !userNumber || !clientNumber || !province || !deliveryDate){
        alert('Preencha todos os campos!');
        return;
    }

    orders.push({name:currentUser.name, product, userNumber, clientNumber, province, deliveryDate, status:'pendente'});
    localStorage.setItem('orders', JSON.stringify(orders));
    renderOrders();

    document.getElementById('productInput').value='';
    document.getElementById('userNumberInput').value='';
    document.getElementById('clientNumberInput').value='';
    document.getElementById('provinceInput').value='';
    document.getElementById('deliveryDateInput').value='';
}

function renderOrders(){
    const ordersList = document.getElementById('ordersList');
    ordersList.innerHTML='';
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    orders.forEach((order, index) => {
        if(!currentUser.isAdmin && order.name !== currentUser.name) return;

        const card = document.createElement('div');
        card.classList.add('order-card');

        const info = document.createElement('div');
        info.classList.add('order-info');
        info.innerHTML = `
            <strong>${order.product}</strong><br>
            Seu número: ${order.userNumber}<br>
            Número do cliente: ${order.clientNumber}<br>
            Província: ${order.province}<br>
            Data entrega: ${order.deliveryDate}<br>
            Status: <span class="status ${order.status}">${order.status}</span>
        `;
        card.appendChild(info);

        if(currentUser.isAdmin){
            if(order.status==='pendente'){
                const acceptBtn = document.createElement('button');
                acceptBtn.innerText = 'Aceitar';
                acceptBtn.onclick = () => {
                    orders[index].status='entregue';
                    localStorage.setItem('orders', JSON.stringify(orders));
                    renderOrders();
                };
                card.appendChild(acceptBtn);

                const rejectBtn = document.createElement('button');
                rejectBtn.innerText = 'Recusar';
                rejectBtn.onclick = () => {
                    orders.splice(index,1); // remove pedido recusado
                    localStorage.setItem('orders', JSON.stringify(orders));
                    renderOrders();
                };
                card.appendChild(rejectBtn);
            } else if(order.status==='entregue'){
                const deleteBtn = document.createElement('button');
                deleteBtn.innerText = 'Apagar';
                deleteBtn.onclick = () => {
                    orders.splice(index,1);
                    localStorage.setItem('orders', JSON.stringify(orders));
                    renderOrders();
                };
                card.appendChild(deleteBtn);
            }
        }
        ordersList.appendChild(card);
    });
}

// ===== ADMIN: DAR/TIRAR PRO =====
function refreshUserList(){
    const userSelect = document.getElementById('userSelect');
    const usersListEl = document.getElementById('usersList');
    userSelect.innerHTML='';
    usersListEl.innerHTML='';

    users.forEach(u => {
        if(!u.isAdmin){
            const option = document.createElement('option');
            option.value = u.name;
            option.innerText = u.name;
            userSelect.appendChild(option);

            const li = document.createElement('li');
            li.innerText = `${u.name} - ${u.password} - ${u.plan}`;
            usersListEl.appendChild(li);
        }
    });
}

function giveProPlan(){
    const selectedName = document.getElementById('userSelect').value;
    const user = users.find(u => u.name===selectedName);
    if(!user) return;
    const expire = new Date(new Date().getTime() + 30*24*60*60*1000);
    user.plan='Pro';
    user.planExpire=expire.toISOString();
    localStorage.setItem('users', JSON.stringify(users));
    alert(`${user.name} agora tem plano Pro por 1 mês`);
    refreshUserList();
}

function removeProPlan(){
    const selectedName = document.getElementById('userSelect').value;
    const user = users.find(u => u.name===selectedName);
    if(!user) return;
    user.plan='Grátis';
    user.planExpire=null;
    localStorage.setItem('users', JSON.stringify(users));
    alert(`${user.name} teve o Pro removido`);
    refreshUserList();
}

// ===== TABS =====
document.getElementById('loginTab').onclick = ()=>{
    document.getElementById('loginForm').style.display='flex';
    document.getElementById('signupForm').style.display='none';
    document.getElementById('loginTab').classList.add('active');
    document.getElementById('signupTab').classList.remove('active');
};

document.getElementById('signupTab').onclick = ()=>{
    document.getElementById('loginForm').style.display='none';
    document.getElementById('signupForm').style.display='flex';
    document.getElementById('loginTab').classList.remove('active');
    document.getElementById('signupTab').classList.add('active');
};

// ===== BOTÕES =====
document.getElementById('loginBtn').onclick = loginUser;
document.getElementById('signupBtn').onclick = registerUser;
document.getElementById('sendOrderBtn').onclick = createOrderFromInput;
document.getElementById('logoutBtn').onclick = logout;
document.getElementById('giveProBtn').onclick = giveProPlan;
document.getElementById('removeProBtn').onclick = removeProPlan;

// ===== INICIALIZAÇÃO AO CARREGAR =====
window.onload = () => {
    showDashboard();
};