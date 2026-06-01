const API = window.location.origin;

// ========================
// Utilitários
// ========================

function badgeStatus(status) {
    const map = {
        'Pendente':     'badge-pendente',
        'Em andamento': 'badge-andamento',
        'Concluída':    'badge-concluida'
    };
    const cls = map[status] || 'badge-pendente';
    return `<span class="badge ${cls}">${status}</span>`;
}

function msgVazia(texto) {
    return `<li class="empty-msg">${texto}</li>`;
}

// ========================
// Selects dinâmicos
// ========================

function carregarSelectEquipes() {
    fetch(`${API}/equipes`)
        .then(r => r.json())
        .then(data => {
            const sel = document.getElementById('selectEquipeUsuario');
            const val = sel.value;
            sel.innerHTML = '<option value="">Selecione a Equipe</option>';
            data.forEach(e => {
                const opt = document.createElement('option');
                opt.value = e._id;
                opt.textContent = e.nome;
                sel.appendChild(opt);
            });
            if (val) sel.value = val;
        });
}

function carregarSelectProjetos() {
    fetch(`${API}/projetos`)
        .then(r => r.json())
        .then(data => {
            const sel = document.getElementById('selectProjetoTarefa');
            const val = sel.value;
            sel.innerHTML = '<option value="">Selecione o Projeto</option>';
            data.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p._id;
                opt.textContent = p.nome;
                sel.appendChild(opt);
            });
            if (val) sel.value = val;
        });
}

// ========================
// Projetos
// ========================

document.getElementById('formProjeto').addEventListener('submit', e => {
    e.preventDefault();
    const id       = document.getElementById('idProjeto').value;
    const nome     = document.getElementById('nomeProjeto').value;
    const descricao = document.getElementById('descricaoProjeto').value;
    const method   = id ? 'PUT' : 'POST';
    const url      = id ? `${API}/projetos/${id}` : `${API}/projetos`;

    fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, descricao })
    }).then(() => {
        resetForm('formProjeto', 'idProjeto', 'btnSubmitProjeto', 'cancelarEdicaoProjeto', 'Adicionar Projeto');
        listarProjetos();
        carregarSelectProjetos();
    });
});

document.getElementById('cancelarEdicaoProjeto').addEventListener('click', () => {
    resetForm('formProjeto', 'idProjeto', 'btnSubmitProjeto', 'cancelarEdicaoProjeto', 'Adicionar Projeto');
});

function listarProjetos() {
    fetch(`${API}/projetos`)
        .then(r => r.json())
        .then(data => {
            const lista = document.getElementById('listaProjetos');
            if (!data.length) { lista.innerHTML = msgVazia('Nenhum projeto cadastrado.'); return; }
            lista.innerHTML = '';
            data.forEach(p => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div class="conteudo"><strong>${p.nome}</strong> — ${p.descricao || 'Sem descrição'}</div>
                    <div class="botoes">
                        <button class="edit" onclick="editarProjeto('${p._id}','${esc(p.nome)}','${esc(p.descricao || '')}')">Editar</button>
                        <button class="delete" onclick="deletarProjeto('${p._id}')">Deletar</button>
                    </div>`;
                lista.appendChild(li);
            });
        });
}

function editarProjeto(id, nome, descricao) {
    document.getElementById('idProjeto').value = id;
    document.getElementById('nomeProjeto').value = nome;
    document.getElementById('descricaoProjeto').value = descricao;
    document.getElementById('btnSubmitProjeto').textContent = 'Atualizar Projeto';
    document.getElementById('cancelarEdicaoProjeto').style.display = 'inline-block';
}

function deletarProjeto(id) {
    if (!confirm('Deletar este projeto?')) return;
    fetch(`${API}/projetos/${id}`, { method: 'DELETE' }).then(() => {
        listarProjetos();
        carregarSelectProjetos();
    });
}

// ========================
// Equipes
// ========================

document.getElementById('formEquipe').addEventListener('submit', e => {
    e.preventDefault();
    const id   = document.getElementById('idEquipe').value;
    const nome = document.getElementById('nomeEquipe').value;
    const method = id ? 'PUT' : 'POST';
    const url    = id ? `${API}/equipes/${id}` : `${API}/equipes`;

    fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome })
    }).then(() => {
        resetForm('formEquipe', 'idEquipe', 'btnSubmitEquipe', 'cancelarEdicaoEquipe', 'Adicionar Equipe');
        listarEquipes();
        carregarSelectEquipes();
    });
});

document.getElementById('cancelarEdicaoEquipe').addEventListener('click', () => {
    resetForm('formEquipe', 'idEquipe', 'btnSubmitEquipe', 'cancelarEdicaoEquipe', 'Adicionar Equipe');
});

function listarEquipes() {
    fetch(`${API}/equipes`)
        .then(r => r.json())
        .then(data => {
            const lista = document.getElementById('listaEquipes');
            if (!data.length) { lista.innerHTML = msgVazia('Nenhuma equipe cadastrada.'); return; }
            lista.innerHTML = '';
            data.forEach(e => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div class="conteudo"><strong>${e.nome}</strong></div>
                    <div class="botoes">
                        <button class="edit" onclick="editarEquipe('${e._id}','${esc(e.nome)}')">Editar</button>
                        <button class="delete" onclick="deletarEquipe('${e._id}')">Deletar</button>
                    </div>`;
                lista.appendChild(li);
            });
        });
}

function editarEquipe(id, nome) {
    document.getElementById('idEquipe').value = id;
    document.getElementById('nomeEquipe').value = nome;
    document.getElementById('btnSubmitEquipe').textContent = 'Atualizar Equipe';
    document.getElementById('cancelarEdicaoEquipe').style.display = 'inline-block';
}

function deletarEquipe(id) {
    if (!confirm('Deletar esta equipe?')) return;
    fetch(`${API}/equipes/${id}`, { method: 'DELETE' }).then(() => {
        listarEquipes();
        carregarSelectEquipes();
    });
}

// ========================
// Usuários
// ========================

document.getElementById('formUsuario').addEventListener('submit', e => {
    e.preventDefault();
    const id       = document.getElementById('idUsuario').value;
    const nome     = document.getElementById('nomeUsuario').value;
    const email    = document.getElementById('emailUsuario').value;
    const id_equipe = document.getElementById('selectEquipeUsuario').value;
    const method   = id ? 'PUT' : 'POST';
    const url      = id ? `${API}/usuarios/${id}` : `${API}/usuarios`;

    fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, _id_equipe: id_equipe || null })
    }).then(() => {
        resetForm('formUsuario', 'idUsuario', 'btnSubmitUsuario', 'cancelarEdicaoUsuario', 'Adicionar Usuário');
        listarUsuarios();
    });
});

document.getElementById('cancelarEdicaoUsuario').addEventListener('click', () => {
    resetForm('formUsuario', 'idUsuario', 'btnSubmitUsuario', 'cancelarEdicaoUsuario', 'Adicionar Usuário');
});

function listarUsuarios() {
    fetch(`${API}/usuarios`)
        .then(r => r.json())
        .then(data => {
            const lista = document.getElementById('listaUsuarios');
            if (!data.length) { lista.innerHTML = msgVazia('Nenhum usuário cadastrado.'); return; }
            lista.innerHTML = '';
            data.forEach(u => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div class="conteudo">
                        <strong>${u.nome}</strong> — ${u.email}
                        ${u._id_equipe ? `<span class="badge badge-andamento">Equipe</span>` : ''}
                    </div>
                    <div class="botoes">
                        <button class="edit" onclick="editarUsuario('${u._id}','${esc(u.nome)}','${esc(u.email)}','${u._id_equipe || ''}')">Editar</button>
                        <button class="delete" onclick="deletarUsuario('${u._id}')">Deletar</button>
                    </div>`;
                lista.appendChild(li);
            });
        });
}

function editarUsuario(id, nome, email, id_equipe) {
    document.getElementById('idUsuario').value = id;
    document.getElementById('nomeUsuario').value = nome;
    document.getElementById('emailUsuario').value = email;
    document.getElementById('selectEquipeUsuario').value = id_equipe || '';
    document.getElementById('btnSubmitUsuario').textContent = 'Atualizar Usuário';
    document.getElementById('cancelarEdicaoUsuario').style.display = 'inline-block';
}

function deletarUsuario(id) {
    if (!confirm('Deletar este usuário?')) return;
    fetch(`${API}/usuarios/${id}`, { method: 'DELETE' }).then(() => listarUsuarios());
}

// ========================
// Tarefas
// ========================

document.getElementById('formTarefa').addEventListener('submit', e => {
    e.preventDefault();
    const id         = document.getElementById('idTarefa').value;
    const titulo     = document.getElementById('tituloTarefa').value;
    const descricao  = document.getElementById('descricaoTarefa').value;
    const dt_criacao = document.getElementById('dataCriacao').value;
    const id_projeto = document.getElementById('selectProjetoTarefa').value;
    const status     = document.getElementById('selectStatusTarefa').value;
    const method     = id ? 'PUT' : 'POST';
    const url        = id ? `${API}/tarefas/${id}` : `${API}/tarefas`;

    fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo, descricao, dt_criacao, _id_projeto: id_projeto || null, status_atual: status })
    }).then(() => {
        resetForm('formTarefa', 'idTarefa', 'btnSubmitTarefa', 'cancelarEdicaoTarefa', 'Adicionar Tarefa');
        listarTarefas();
    });
});

document.getElementById('cancelarEdicaoTarefa').addEventListener('click', () => {
    resetForm('formTarefa', 'idTarefa', 'btnSubmitTarefa', 'cancelarEdicaoTarefa', 'Adicionar Tarefa');
});

function listarTarefas() {
    fetch(`${API}/tarefas`)
        .then(r => r.json())
        .then(data => {
            const lista = document.getElementById('listaTarefas');
            if (!data.length) { lista.innerHTML = msgVazia('Nenhuma tarefa cadastrada.'); return; }
            lista.innerHTML = '';
            data.forEach(t => {
                const li = document.createElement('li');
                const dt = t.dt_criacao ? ` — ${t.dt_criacao}` : '';
                li.innerHTML = `
                    <div class="conteudo">
                        <strong>${t.titulo}</strong>${dt} ${badgeStatus(t.status_atual)}
                        <br><small>${t.descricao || ''}</small>
                    </div>
                    <div class="botoes">
                        <button class="edit" onclick="editarTarefa('${t._id}','${esc(t.titulo)}','${esc(t.descricao || '')}','${t.dt_criacao || ''}','${t._id_projeto || ''}','${t.status_atual}')">Editar</button>
                        <button class="delete" onclick="deletarTarefa('${t._id}')">Deletar</button>
                    </div>`;
                lista.appendChild(li);
            });
        });
}

function editarTarefa(id, titulo, descricao, dt, id_projeto, status) {
    document.getElementById('idTarefa').value = id;
    document.getElementById('tituloTarefa').value = titulo;
    document.getElementById('descricaoTarefa').value = descricao;
    document.getElementById('dataCriacao').value = dt;
    document.getElementById('selectProjetoTarefa').value = id_projeto || '';
    document.getElementById('selectStatusTarefa').value = status;
    document.getElementById('btnSubmitTarefa').textContent = 'Atualizar Tarefa';
    document.getElementById('cancelarEdicaoTarefa').style.display = 'inline-block';
}

function deletarTarefa(id) {
    if (!confirm('Deletar esta tarefa?')) return;
    fetch(`${API}/tarefas/${id}`, { method: 'DELETE' }).then(() => listarTarefas());
}

// ========================
// Reset de formulário
// ========================

function resetForm(formId, hiddenId, btnId, cancelId, btnLabel) {
    document.getElementById(hiddenId).value = '';
    document.getElementById(formId).reset();
    document.getElementById(btnId).textContent = btnLabel;
    document.getElementById(cancelId).style.display = 'none';
}

function esc(str) {
    return String(str).replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// ========================
// Inicialização
// ========================

window.onload = () => {
    listarProjetos();
    listarEquipes();
    listarUsuarios();
    listarTarefas();
    carregarSelectEquipes();
    carregarSelectProjetos();
};
