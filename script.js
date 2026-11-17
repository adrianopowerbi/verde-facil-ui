const HOST_API = 'verde-facil-api' + '.onrender.com';
const API_URL = 'https://' + HOST_API + '/api';


let usuarioLogado = null;
let listaDenuncias = [];
let bairrosLocais = [];
let timerBuscaRua = null;

document.addEventListener('DOMContentLoaded', function() {
    carregarBairrosDaAPI();
    carregarEcopontosDaAPI();
    carregarDenunciasDaAPI();
});

async function carregarBairrosDaAPI() {
    try {
        const resposta = await fetch(API_URL + '/bairros');
        if (resposta.ok) {
            bairrosLocais = await resposta.json();
        }
    } catch (erro) {
        console.error('Erro ao carregar bairros:', erro);
    }
}

function mostrarSugestoesEndereco() {
    const dropdown = document.getElementById('dropdown-enderecos');
    if (dropdown && bairrosLocais.length > 0) {
        atualizarSugestoesEndereco(bairrosLocais);
        dropdown.style.display = 'block';
    }
}

function atualizarSugestoesEndereco(lista) {
    const dropdown = document.getElementById('dropdown-enderecos');
    const inputLocal = document.getElementById('local');
    if (!dropdown) return;

    dropdown.innerHTML = '';
    if (lista.length === 0) {
        dropdown.style.display = 'none';
        return;
    }

    lista.forEach(function(item) {
        const div = document.createElement('div');
        div.textContent = '📍 ' + item;
        div.style.padding = '10px 12px';
        div.style.fontSize = '13px';
        div.style.color = '#1e293b';
        div.style.cursor = 'pointer';
        div.style.borderBottom = '1px solid #f1f5f9';

        div.onmouseover = function() { div.style.background = '#f0fdf4'; };
        div.onmouseout = function() { div.style.background = '#ffffff'; };
        div.onclick = function() {
            inputLocal.value = item;
            dropdown.style.display = 'none';
        };

        dropdown.appendChild(div);
    });
    dropdown.style.display = 'block';
}

document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('dropdown-enderecos');
    const inputLocal = document.getElementById('local');
    if (dropdown && e.target !== inputLocal && !dropdown.contains(e.target)) {
        dropdown.style.display = 'none';
    }
});

function buscarRuasJuazeiro(texto) {
    clearTimeout(timerBuscaRua);
    const termo = texto.trim();

    if (termo.length === 0) {
        atualizarSugestoesEndereco(bairrosLocais);
        return;
    }

    const filtradosLocais = bairrosLocais.filter(function(b) {
        return b.toLowerCase().includes(termo.toLowerCase());
    });
    atualizarSugestoesEndereco(filtradosLocais);

    if (termo.length < 3) return;

    timerBuscaRua = setTimeout(async function() {
        try {
            const baseOsm = "https://" + "nominatim." + "openstreetmap.org/search";
            const url = new URL(baseOsm);
            url.searchParams.set("q", termo + ", Juazeiro do Piauí, PI, Brasil");
            url.searchParams.set("format", "json");
            url.searchParams.set("addressdetails", "1");
            url.searchParams.set("limit", "6");

            const resposta = await fetch(url.toString());
            const resultados = await resposta.json();

            const ruasEncontradas = resultados.map(function(r) {
                const rua = r.address.road || r.address.suburb || r.address.village || r.name;
                const bairro = r.address.suburb || r.address.neighbourhood || "Juazeiro do Piauí";
                return rua ? (rua + " - " + bairro) : r.display_name.split(',');
            });

            const combinados = Array.from(new Set(filtradosLocais.concat(ruasEncontradas)));
            atualizarSugestoesEndereco(combinados);
        } catch (erro) {
            atualizarSugestoesEndereco(filtradosLocais);
        }
    }, 400);
}

function alternarVisibilidadeSenha() {
    const inputSenha = document.getElementById('senha-login');
    const botaoOlho = document.getElementById('btn-toggle-senha');

    if (inputSenha.type === 'password') {
        inputSenha.type = 'text';
        botaoOlho.textContent = '🙈';
    } else {
        inputSenha.type = 'password';
        botaoOlho.textContent = '👁️';
    }
}

function navegar(idTelaAlvo) {
    const telas = document.querySelectorAll('.tela');
    telas.forEach(function(tela) { tela.classList.remove('ativa'); });

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

    if (idTelaAlvo === 'tela-principal') {
        carregarDenunciasDaAPI();
    }

    atualizarMenuAtivo(idTelaAlvo);
}

function atualizarMenuAtivo(idTela) {
    const botoesNav = document.querySelectorAll('nav button');
    botoesNav.forEach(function(btn) { btn.classList.remove('ativo'); });

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

    setTimeout(function() {
        toast.classList.add('oculto');
    }, 3000);
}

async function fazerLogin(event) {
    event.preventDefault();
    const emailInput = document.getElementById('email-login').value.trim();
    const senhaInput = document.getElementById('senha-login').value.trim();

    const regexSenhaForte = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;
    if (!regexSenhaForte.test(senhaInput)) {
        mostrarToast("⚠️ Use maiúscula, minúscula, número e símbolo!");
        return;
    }

    try {
        const resposta = await fetch(API_URL + '/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: emailInput,
                senha: senhaInput,
                tipo: 'registrado'
            })
        });
        const dados = await resposta.json();

        if (!resposta.ok) {
            mostrarToast("⚠️ " + dados.erro);
            return;
        }

        usuarioLogado = dados.usuario;
        atualizarInterfaceUsuario();
        mostrarToast("✅ Conectado como: " + usuarioLogado);
        document.getElementById('email-login').value = '';
        document.getElementById('senha-login').value = '';
        document.getElementById('senha-login').type = 'password';
        document.getElementById('btn-toggle-senha').textContent = '👁️';
        navegar('tela-principal');
    } catch (erro) {
        mostrarToast("❌ Erro ao conectar com a API");
    }
}

async function entrarComoConvidado() {
    try {
        const resposta = await fetch(API_URL + '/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tipo: 'convidado' })
        });
        const dados = await resposta.json();

        usuarioLogado = dados.usuario;
        atualizarInterfaceUsuario();
        mostrarToast("👤 Entrou como Convidado");
        navegar('tela-principal');
    } catch (erro) {
        mostrarToast("❌ Erro ao conectar com a API");
    }
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

async function carregarDenunciasDaAPI() {
    try {
        const resposta = await fetch(API_URL + '/denuncias');
        if (resposta.ok) {
            listaDenuncias = await resposta.json();
            atualizarListaDenuncias();
        }
    } catch (erro) {
        console.error('Erro ao buscar denúncias:', erro);
    }
}

async function enviarDenuncia(event) {
    event.preventDefault();

    const local = document.getElementById('local').value.trim();
    const descricao = document.getElementById('descricao').value.trim();

    if (local && descricao) {
        try {
            const resposta = await fetch(API_URL + '/denuncias', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    local: local,
                    descricao: descricao,
                    autor: usuarioLogado || "Anônimo"
                })
            });

            if (!resposta.ok) {
                const erro = await resposta.json();
                mostrarToast("⚠️ " + erro.erro);
                return;
            }

            await carregarDenunciasDaAPI();
            mostrarToast("🚨 Denúncia salva no banco!");
            event.target.reset();
            navegar('tela-principal');
        } catch (erro) {
            mostrarToast("❌ Falha ao enviar denúncia");
        }
    }
}

async function excluirDenuncia(id) {
    try {
        const resposta = await fetch(API_URL + '/denuncias/' + id, {
            method: 'DELETE'
        });
        if (resposta.ok) {
            mostrarToast("🗑️ Denúncia removida");
            await carregarDenunciasDaAPI();
        }
    } catch (erro) {
        mostrarToast("❌ Erro ao excluir");
    }
}

function atualizarListaDenuncias() {
    const container = document.getElementById('lista-denuncias');
    container.innerHTML = '';

    if (listaDenuncias.length === 0) {
        const pVazio = document.createElement('p');
        pVazio.className = 'sem-denuncias';
        pVazio.textContent = 'Nenhuma denúncia registrada ainda.';
        container.appendChild(pVazio);
        return;
    }

    listaDenuncias.forEach(function(d) {
        const item = document.createElement('div');
        item.className = 'item-denuncia';

        const header = document.createElement('div');
        header.className = 'ponto-header';

        const titulo = document.createElement('h5');
        titulo.textContent = '📍 ' + d.local;

        const badge = document.createElement('span');
        badge.className = 'badge-status';
        badge.style.background = '#fef3c7';
        badge.style.color = '#92400e';
        badge.textContent = d.status;

        header.appendChild(titulo);
        header.appendChild(badge);

        const desc = document.createElement('p');
        desc.textContent = d.descricao;

        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.style.display = 'flex';
        meta.style.justifyContent = 'space-between';
        meta.style.alignItems = 'center';

        const info = document.createElement('span');
        info.textContent = 'Por: ' + d.autor + ' • ' + (d.data || '') + ' às ' + d.hora;

        const btnExcluir = document.createElement('button');
        btnExcluir.textContent = 'Excluir';
        btnExcluir.style.background = 'none';
        btnExcluir.style.border = 'none';
        btnExcluir.style.color = '#ef4444';
        btnExcluir.style.cursor = 'pointer';
        btnExcluir.style.fontSize = '10px';
        btnExcluir.onclick = function() { excluirDenuncia(d.id); };

        meta.appendChild(info);
        meta.appendChild(btnExcluir);

        item.appendChild(header);
        item.appendChild(desc);
        item.appendChild(meta);
        container.appendChild(item);
    });
}

async function carregarEcopontosDaAPI(filtro = '') {
    const container = document.getElementById('container-ecopontos');
    if (!container) return;

    try {
        const url = filtro ? API_URL + '/ecopontos?q=' + encodeURIComponent(filtro) : API_URL + '/ecopontos';
        const resposta = await fetch(url);
        const pontos = await resposta.json();

        container.innerHTML = '';
        pontos.forEach(function(p) {
            const caixa = document.createElement('div');
            caixa.className = 'caixa-ponto';
            caixa.setAttribute('data-busca', p.busca);

            const header = document.createElement('div');
            header.className = 'ponto-header';

            const tituloBox = document.createElement('div');
            tituloBox.className = 'ponto-titulo';

            const pin = document.createElement('span');
            pin.textContent = '📍';

            const h4 = document.createElement('h4');
            h4.textContent = p.nome;

            tituloBox.appendChild(pin);
            tituloBox.appendChild(h4);

            const badge = document.createElement('span');
            badge.className = 'badge-status';
            badge.textContent = p.horario;

            header.appendChild(tituloBox);
            header.appendChild(badge);

            const desc = document.createElement('p');
            desc.className = 'ponto-desc';
            desc.textContent = p.materiais;

            const btnRota = document.createElement('button');
            btnRota.className = 'btn-acao-ponto';
            btnRota.textContent = '📍 Como Chegar';
            btnRota.onclick = function() { verRotas(p.nome); };

            caixa.appendChild(header);
            caixa.appendChild(desc);
            caixa.appendChild(btnRota);
            container.appendChild(caixa);
        });
    } catch (erro) {
        console.error('Erro ao carregar ecopontos:', erro);
    }
}

function filtrarEcopontos() {
    const termo = document.getElementById('busca-ecoponto').value.trim();
    carregarEcopontosDaAPI(termo);
}

function verRotas(nomePonto) {
    mostrarToast("🗺️ Abrindo rota em Juazeiro do Piauí...");
    let localBusca = "Juazeiro do Piauí, PI";

    if (nomePonto.includes("Centro")) {
        localBusca = "Centro, Juazeiro do Piauí - PI";
    } else if (nomePonto.includes("Pimenta")) {
        localBusca = "Bairro Pimenta, Juazeiro do Piauí - PI";
    } else if (nomePonto.includes("Visgueirão")) {
        localBusca = "Visgueirão, Juazeiro do Piauí - PI";
    }

    const base = "https://" + "maps." + "google.com";
    const urlMaps = new URL(base);
    urlMaps.searchParams.set("q", localBusca);
    window.open(urlMaps.toString(), "_blank");
}
