const API = 'http://localhost:3000';

function escapar(texto) {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}

let usuarioLogado = null;
let listaDenuncias = [];

function navegar(idTelaAlvo) {
    const telas = document.querySelectorAll('.tela');
    telas.forEach(tela => tela.classList.remove('ativa'));

    const telaAlvo = document.getElementById(idTelaAlvo);
    if (telaAlvo) {
        telaAlvo.classList.add('ativa');
    }

    const menu = document.getElementById('menu-navegacao');
    const header = document.getElementById('top-header');

    if (idTelaAlvo === 'tela-inicial') {
        menu.classList.add('oculto');
        header.classList.add('oculto');
    } else {
        menu.classList.remove('oculto');
        header.classList.remove('oculto');
    }

    atualizarMenuAtivo(idTelaAlvo);
}

function atualizarMenuAtivo(idTela) {
    const botoesNav = document.querySelectorAll('nav button');
    botoesNav.forEach(btn => btn.classList.remove('ativo'));

    if (idTela === 'tela-principal') {
        document.getElementById('nav-principal')?.classList.add('ativo');
    } else if (idTela === 'tela-coleta') {
        document.getElementById('nav-coleta')?.classList.add('ativo');
    } else if (idTela === 'tela-denuncia') {
        document.getElementById('nav-denuncia')?.classList.add('ativo');
    }
}

function mostrarToast(mensagem) {
    const toast = document.getElementById('toast-alerta');
    toast.textContent = mensagem;
    toast.classList.remove('oculto');

    setTimeout(() => {
        toast.classList.add('oculto');
    }, 2500);
}

async function fazerLogin(event) {
    event.preventDefault();
    const email = document.getElementById('email-login').value.trim();
    try {
        const resp = await fetch(API + '/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const dados = await resp.json();
        usuarioLogado = dados.usuario;
        atualizarInterfaceUsuario();
        mostrarToast("✅ Conectado como: " + usuarioLogado);
        document.getElementById('email-login').value = '';
        navegar('tela-principal');
        carregarDenuncias();
    } catch (e) {
        mostrarToast("❌ API fora do ar");
    }
}

function entrarComoConvidado() {
    usuarioLogado = "Convidado";
    atualizarInterfaceUsuario();
    mostrarToast("👤 Entrou como Convidado");
    navegar('tela-principal');
    carregarDenuncias();
}

function sair() {
    usuarioLogado = null;
    mostrarToast("🚪 Sessão encerrada");
    navegar('tela-inicial');
}

function atualizarInterfaceUsuario() {
    const nomeUsuarioSpan = document.getElementById('nome-usuario');
    const mensagemBoasVindas = document.getElementById('mensagem-boas-vindas');

    if (usuarioLogado) {
        const nomeExibicao = usuarioLogado.length > 15
            ? usuarioLogado.substring(0, 12) + "..."
            : usuarioLogado;

        nomeUsuarioSpan.textContent = nomeExibicao;
        mensagemBoasVindas.textContent = "Olá, " + usuarioLogado + "!";
    }
}

async function enviarDenuncia(event) {
    event.preventDefault();
    const local = document.getElementById('local').value.trim();
    const descricao = document.getElementById('descricao').value.trim();
    try {
        const resp = await fetch(API + '/denuncias', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ local, descricao, autor: usuarioLogado || 'Anônimo' })
        });
        if (!resp.ok) throw new Error('Falha ao enviar');
        mostrarToast("🚨 Denúncia enviada com sucesso!");
        event.target.reset();
        navegar('tela-principal');
        carregarDenuncias();
    } catch (e) {
        mostrarToast("❌ Não foi possível enviar");
    }
}

async function carregarDenuncias() {
    try {
        const resp = await fetch(API + '/denuncias');
        listaDenuncias = await resp.json();
        atualizarListaDenuncias();
    } catch (e) {
        mostrarToast("❌ Erro ao carregar denúncias");
    }
}

function atualizarListaDenuncias() {
    const container = document.getElementById('lista-denuncias');

    if (listaDenuncias.length === 0) {
        container.innerHTML = '<p class="sem-denuncias">Nenhuma denúncia registrada ainda.</p>';
        return;
    }

    container.innerHTML = listaDenuncias.map(d => `
        <div class="item-denuncia">
            <div class="ponto-header">
                <h5>📍 ${escapar(d.local)}</h5>
                <span class="badge-status" style="background:#fef3c7; color:#92400e;">${escapar(d.status)}</span>
            </div>
            <p>${escapar(d.descricao)}</p>
            <div class="meta">Enviado por: ${escapar(d.autor)}</div>
        </div>
    `).join('');
}

async function filtrarEcopontos() {
    const termo = document.getElementById('busca-ecoponto').value.trim();
    const container = document.getElementById('container-ecopontos');
    try {
        const resp = await fetch(API + '/ecopontos?busca=' + encodeURIComponent(termo));
        const pontos = await resp.json();
        container.innerHTML = pontos.map(p => `
            <div class="caixa-ponto">
                <div class="ponto-header">
                    <div class="ponto-titulo"><span>📍</span><h4>${escapar(p.nome)}</h4></div>
                    <span class="badge-status">hoje às 9h</span>
                </div>
                <p class="ponto-desc">${escapar(p.materiais)}</p>
                <button class="btn-acao-ponto" onclick="verRotas('${escapar(p.nome)}')">📍 Como Chegar</button>
            </div>
        `).join('');
    } catch (e) {
        mostrarToast("❌ Erro ao carregar ecopontos");
    }
}

function verRotas(nomePonto) {
    mostrarToast("📍 Traçando rota para: " + nomePonto);
}

filtrarEcopontos();
carregarDenuncias();
