// =============================================================================
// JANELA DE COMBATE (independente)
// =============================================================================
const combateEl = document.getElementById('combate-screen');
const combateHeader = document.getElementById('combate-header');

function abrirCombate() {
    const win = document.getElementById('combate-screen');
    win.classList.remove('hidden');
    // Injeta funções do chat no iframe
    const iframe = document.getElementById('combateIframe');
    if (iframe) {
        iframe.addEventListener('load', () => {
            try {
                const iw = iframe.contentWindow;
                iw.adicionarMensagemChat = adicionarMensagemChat;
                iw.animarDado3D = animarDado3D;
            } catch(e) {}
        });
        // Se já carregou, injeta agora
        try {
            const iw = iframe.contentWindow;
            if (iw.document.readyState === 'complete') {
                iw.adicionarMensagemChat = adicionarMensagemChat;
                iw.animarDado3D = animarDado3D;
            }
        } catch(e) {}
    }
}

function fecharCombate() {
    document.getElementById('combate-screen').classList.add('hidden');
}

// Arrastar a janela de combate
document.addEventListener('DOMContentLoaded', () => {
    const win = document.getElementById('combate-screen');
    const hdr = document.getElementById('combate-header');
    if (!win || !hdr) return;

    function prepCombate() {
        const rect = win.getBoundingClientRect();
        win.style.transform = 'none';
        win.style.top  = rect.top  + 'px';
        win.style.left = rect.left + 'px';
        win.style.width  = win.offsetWidth  + 'px';
        win.style.height = win.offsetHeight + 'px';
    }

    hdr.onmousedown = function(e) {
        if (e.target.tagName === 'BUTTON') return;
        prepCombate();
        let p1=0,p2=0,p3=e.clientX,p4=e.clientY;
        document.onmousemove = function(e) {
            p1 = p3 - e.clientX; p2 = p4 - e.clientY;
            p3 = e.clientX;      p4 = e.clientY;
            win.style.top  = (win.offsetTop  - p2) + 'px';
            win.style.left = (win.offsetLeft - p1) + 'px';
        };
        document.onmouseup = () => { document.onmousemove = null; };
    };

    // Redimensionar
    win.querySelectorAll('.resizer').forEach(resizer => {
        resizer.onmousedown = function(e) {
            e.preventDefault();
            prepCombate();
            let px = e.clientX, py = e.clientY;
            window.onmousemove = function(e) {
                const rect = win.getBoundingClientRect();
                if (resizer.classList.contains('e'))  { win.style.width  = rect.width  + (e.clientX - px) + 'px'; }
                if (resizer.classList.contains('s'))  { win.style.height = rect.height + (e.clientY - py) + 'px'; }
                if (resizer.classList.contains('w'))  { win.style.width  = rect.width  - (e.clientX - px) + 'px'; win.style.left = rect.left + (e.clientX - px) + 'px'; }
                if (resizer.classList.contains('n'))  { win.style.height = rect.height - (e.clientY - py) + 'px'; win.style.top  = rect.top  + (e.clientY - py) + 'px'; }
                if (resizer.classList.contains('se')) { win.style.width  = rect.width  + (e.clientX - px) + 'px'; win.style.height = rect.height + (e.clientY - py) + 'px'; }
                if (resizer.classList.contains('sw')) { win.style.width  = rect.width  - (e.clientX - px) + 'px'; win.style.left = rect.left + (e.clientX - px) + 'px'; win.style.height = rect.height + (e.clientY - py) + 'px'; }
                if (resizer.classList.contains('ne')) { win.style.width  = rect.width  + (e.clientX - px) + 'px'; win.style.height = rect.height - (e.clientY - py) + 'px'; win.style.top = rect.top + (e.clientY - py) + 'px'; }
                if (resizer.classList.contains('nw')) { win.style.width  = rect.width  - (e.clientX - px) + 'px'; win.style.left = rect.left + (e.clientX - px) + 'px'; win.style.height = rect.height - (e.clientY - py) + 'px'; win.style.top = rect.top + (e.clientY - py) + 'px'; }
                px = e.clientX; py = e.clientY;
            };
            window.onmouseup = () => { window.onmousemove = null; };
        };
    });
});


// =============================================================================
// 1. ESTADO GLOBAL
// =============================================================================
const el = document.getElementById("overlay-screen");
const header = document.getElementById("window-header");

// Histórico global de rolagens (persiste entre janelas)
let rollHistory = [];

// =============================================================================
// 2. CHAT / LOG GLOBAL DE ROLAGENS
// =============================================================================
function toggleChat() {
    const chat = document.getElementById('chat-panel');
    chat.classList.toggle('chat-open');
}

function adicionarMensagemChat(html, tipo = 'roll') {
    const log = document.getElementById('chat-log');
    if (!log) return;
    const entry = document.createElement('div');
    entry.className = `chat-entry chat-${tipo}`;
    entry.innerHTML = html;
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
    rollHistory.push({ html, tipo, ts: Date.now() });
}

// =============================================================================
// 3. PARSER DE FÓRMULAS DE DADOS (ex: 2d6+3, 1d20, d8-1)
// =============================================================================
function parsearFormula(formula) {
    formula = formula.trim().toLowerCase().replace(/\s+/g, '');
    // Aceita formatos: 2d6+3, 1d20, d8, 3d4-2, d20+5
    const regex = /^(\d*)d(\d+)([+-]\d+)?$/;
    const match = formula.match(regex);
    if (!match) return null;

    const qtd = parseInt(match[1] || '1');
    const lados = parseInt(match[2]);
    const bonus = parseInt(match[3] || '0');

    if (qtd < 1 || qtd > 20 || lados < 2 || lados > 100) return null;
    return { qtd, lados, bonus, raw: formula };
}

function rolarFormula(formula, label = null, corLabel = '#ffd700') {
    const parsed = parsearFormula(formula);
    if (!parsed) {
        adicionarMensagemChat(`<span class="chat-error">❌ Fórmula inválida: "${formula}"<br><small>Use: 2d6+3, 1d20, d8-1</small></span>`, 'error');
        return;
    }

    const resultados = [];
    for (let i = 0; i < parsed.qtd; i++) {
        resultados.push(Math.floor(Math.random() * parsed.lados) + 1);
    }
    const soma = resultados.reduce((a, b) => a + b, 0) + parsed.bonus;

    // Anima o dado 3D
    animarDado3D(parsed.lados, soma);

    // Formata o resultado no chat
    const nomeLabel = label || formula.toUpperCase();
    const bonusStr = parsed.bonus !== 0 ? ` ${parsed.bonus > 0 ? '+' : ''}${parsed.bonus}` : '';
    const detalhes = parsed.qtd > 1 ? `[${resultados.join(', ')}]` : `[${resultados[0]}]`;

    const isCrit = parsed.lados === 20 && resultados[0] === 20;
    const isFumble = parsed.lados === 20 && resultados[0] === 1;
    const classeTotal = isCrit ? 'chat-crit' : isFumble ? 'chat-fumble' : '';

    adicionarMensagemChat(`
        <div class="roll-entry">
            <span class="roll-label" style="color: ${corLabel}">🎲 ${nomeLabel}</span>
            <span class="roll-dice">${formula.toUpperCase()}: ${detalhes}${bonusStr}</span>
            <span class="roll-total ${classeTotal}">${soma}${isCrit ? ' ✨ CRÍTICO!' : isFumble ? ' 💀 FALHA!' : ''}</span>
        </div>
    `);
}

// Entrada manual no chat
function enviarMensagemChat() {
    const input = document.getElementById('chat-input');
    if (!input) return;
    const val = input.value.trim();
    if (!val) return;
    input.value = '';
    rolarFormula(val);
}

// =============================================================================
// 4. DADO 3D ANIMADO
// =============================================================================
function animarDado3D(lados, resultado) {
    const container = document.getElementById('dice3d-container');
    if (!container) return;

    container.style.display = 'flex';
    container.classList.remove('dice-rolling');

    // Força reflow para reiniciar animação
    void container.offsetWidth;
    container.classList.add('dice-rolling');

    const face = document.getElementById('dice3d-face');
    const diceEl = document.getElementById('dice3d');

    // Randomiza rotações para parecer que está girando de verdade
    const rx = 360 * 3 ;
    const ry = 360 * 4 ;
    const rz = 360 * 2 ;
    diceEl.style.transition = 'none';
    diceEl.style.transform = 'rotateX(0deg) rotateY(0deg) rotateZ(0deg)';
    void diceEl.offsetWidth;
    diceEl.style.transition = 'transform 0.8s cubic-bezier(0.17, 0.67, 0.35, 1)';
    diceEl.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`;

    face.textContent = '?';
    document.getElementById('dice3d-label').textContent = `D${lados}`;

    setTimeout(() => {
        face.textContent = resultado;
        // Pisca o resultado
        face.classList.add('dice-result-flash');
        setTimeout(() => face.classList.remove('dice-result-flash'), 400);

        // Esconde após 3s de ociosidade
        clearTimeout(window._diceHideTimer);
        window._diceHideTimer = setTimeout(() => {
            container.classList.add('dice-fade-out');
            setTimeout(() => {
                container.style.display = 'none';
                container.classList.remove('dice-fade-out', 'dice-rolling');
            }, 500);
        }, 3000);
    }, 850);
}

// =============================================================================
// 5. LÓGICA DE ABRIR E FECHAR JANELAS
// =============================================================================
function prepararMovimentacao() {
    const rect = el.getBoundingClientRect();
    el.style.transform = "none";
    el.style.top = rect.top + "px";
    el.style.left = rect.left + "px";
    el.style.width = el.offsetWidth + "px";
    el.style.height = el.offsetHeight + "px";
}

function abrirJanela(tipo) {
    const overlay = document.getElementById('overlay-screen');
    const conteudo = document.getElementById('conteudo-dinamico');
    const titulo = document.getElementById('window-title');

    el.style.top = "50%";
    el.style.left = "50%";
    el.style.transform = "translate(-50%, -50%)";

    overlay.classList.remove('hidden');
    titulo.innerText = tipo.toUpperCase();

    if (tipo === 'fichas') {
        // Ficha completa T20 carregada via iframe
        conteudo.innerHTML = `
            <iframe
                id="fichaIframe"
                src="ficha_t20.html"
                style="width:100%;height:100%;border:none;background:transparent;"
                title="Ficha de Personagem T20">
            </iframe>
        `;
        // Injeta funções do chat principal no iframe após carregamento
        const iframe = document.getElementById('fichaIframe');
        iframe.addEventListener('load', () => {
            try {
                const iw = iframe.contentWindow;
                iw.adicionarMensagemChat = adicionarMensagemChat;
                iw.animarDado3D = animarDado3D;
                iw.toggleChat = toggleChat;
            } catch(e) { /* cross-origin em produção */ }
        });

    } else if (tipo === 'dados') {
        conteudo.innerHTML = `
            <div class="dice-panel">
                <h4 style="color:#ffd700; margin:0 0 12px 0;">Rolar Dados Rápido</h4>
                <div class="quick-dice-grid">
                    <button class="dice-btn" onclick="rolarFormula('1d4',  'D4')">D4</button>
                    <button class="dice-btn" onclick="rolarFormula('1d6',  'D6')">D6</button>
                    <button class="dice-btn" onclick="rolarFormula('1d8',  'D8')">D8</button>
                    <button class="dice-btn" onclick="rolarFormula('1d10', 'D10')">D10</button>
                    <button class="dice-btn" onclick="rolarFormula('1d12', 'D12')">D12</button>
                    <button class="dice-btn" onclick="rolarFormula('1d20', 'D20')">D20</button>
                    <button class="dice-btn" onclick="rolarFormula('1d100','D100')">D100</button>
                    <button class="dice-btn" onclick="rolarFormula('2d6',  '2D6')">2D6</button>
                </div>
                <p style="color:#aaa; font-size:0.75rem; margin-top:16px;">💡 Digite fórmulas no chat: <strong style="color:#ffd700">2d6+3</strong>, <strong style="color:#ffd700">1d20</strong>, <strong style="color:#ffd700">3d4-1</strong></p>
            </div>
        `;
    } else if (tipo === 'docs') {
        titulo.innerText = '📖 DOCUMENTOS & LORE';
        el.style.width  = Math.min(window.innerWidth  * 0.88, 960) + 'px';
        el.style.height = Math.min(window.innerHeight * 0.88, 640) + 'px';
        el.style.top = '50%';
        el.style.left = '50%';
        el.style.transform = 'translate(-50%, -50%)';
        conteudo.innerHTML = `
            <iframe
                id="docsIframe"
                src="docs_player.html"
                style="width:100%;height:100%;border:none;background:transparent;"
                title="Documentos e Lore">
            </iframe>
        `;
    }
}

function fecharJanela() {
    document.getElementById('overlay-screen').classList.add('hidden');
}

// =============================================================================
// 6. ARRASTAR E REDIMENSIONAR
// =============================================================================
header.onmousedown = function(e) {
    prepararMovimentacao();
    let pos1 = 0, pos2 = 0, pos3 = e.clientX, pos4 = e.clientY;
    document.onmousemove = function(e) {
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        el.style.top = (el.offsetTop - pos2) + "px";
        el.style.left = (el.offsetLeft - pos1) + "px";
    };
    document.onmouseup = () => { document.onmousemove = null; };
};

const resizers = document.querySelectorAll(".resizer");
for (let resizer of resizers) {
    resizer.onmousedown = function(e) {
        e.preventDefault();
        prepararMovimentacao();
        let prevX = e.clientX;
        let prevY = e.clientY;
        window.onmousemove = function(e) {
            const rect = el.getBoundingClientRect();
            if (resizer.classList.contains("e")) {
                el.style.width = rect.width + (e.clientX - prevX) + "px";
            } else if (resizer.classList.contains("s")) {
                el.style.height = rect.height + (e.clientY - prevY) + "px";
            } else if (resizer.classList.contains("w")) {
                el.style.width = rect.width - (e.clientX - prevX) + "px";
                el.style.left = rect.left + (e.clientX - prevX) + "px";
            } else if (resizer.classList.contains("n")) {
                el.style.height = rect.height - (e.clientY - prevY) + "px";
                el.style.top = rect.top + (e.clientY - prevY) + "px";
            } else if (resizer.classList.contains("se")) {
                el.style.width = rect.width + (e.clientX - prevX) + "px";
                el.style.height = rect.height + (e.clientY - prevY) + "px";
            }
            prevX = e.clientX;
            prevY = e.clientY;
        };
        window.onmouseup = () => { window.onmousemove = null; };
    };
}

// =============================================================================
// 7. MODIFICADORES E PERÍCIAS (T20)
// =============================================================================
function atualizarMod() {
    const atributos = ['for', 'des', 'con', 'int', 'sab', 'car'];
    atributos.forEach(attr => {
        const input = document.getElementById(`${attr}-val`);
        if (input) {
            const mod = Math.floor((parseInt(input.value) - 10) / 2);
            const modEl = document.getElementById(`${attr}-mod`);
            if (modEl) modEl.innerText = (mod >= 0 ? "+" : "") + mod;
        }
    });
}

function rolarPericia(nome, id) {
    const treinoEl = document.getElementById(`treino-${id}`);
    const attrEl   = document.getElementById(`attr-select-${id}`);
    const outrosEl = document.getElementById(`outros-${id}`);
    const nivelEl  = document.getElementById('nivel-char');

    if (!treinoEl || !attrEl || !outrosEl) {
        // fallback: abre janela de dados antes
        adicionarMensagemChat(`<span class="chat-error">⚠️ Abra a janela de Fichas para rolar perícias.</span>`, 'error');
        return;
    }

    const treinado = treinoEl.checked;
    const attrEscolhido = attrEl.value;
    const outros = parseInt(outrosEl.value) || 0;
    const nivel = parseInt(nivelEl ? nivelEl.value : 1) || 1;

    const attrValEl = document.getElementById(`${attrEscolhido}-val`);
    const attrVal = attrValEl ? parseInt(attrValEl.value) : 10;
    const modAttr = Math.floor((attrVal - 10) / 2);
    const bonusTreino = treinado ? 2 : 0;
    const metadeNivel = Math.floor(nivel / 2);
    const totalMod = metadeNivel + modAttr + bonusTreino + outros;

    const dado = Math.floor(Math.random() * 20) + 1;
    const total = dado + totalMod;

    animarDado3D(20, dado);

    const isCrit   = dado === 20;
    const isFumble = dado === 1;
    const classeTotal = isCrit ? 'chat-crit' : isFumble ? 'chat-fumble' : '';
    const bonusStr = totalMod >= 0 ? `+${totalMod}` : `${totalMod}`;

    adicionarMensagemChat(`
        <div class="roll-entry">
            <span class="roll-label" style="color:#c9a0ff">📜 ${nome}</span>
            <span class="roll-dice">D20[${dado}] ${bonusStr} <small style="color:#888">(½Nív:${metadeNivel} Attr:${modAttr >= 0 ? '+' : ''}${modAttr} Treino:${bonusTreino} Outros:${outros >= 0 ? '+' : ''}${outros})</small></span>
            <span class="roll-total ${classeTotal}">${total}${isCrit ? ' ✨ CRÍTICO!' : isFumble ? ' 💀 FALHA!' : ''}</span>
        </div>
    `);
}

// =============================================================================
// 8. INICIALIZAÇÃO DO CHAT
// =============================================================================
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('chat-input');
    if (input) {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') enviarMensagemChat();
        });
    }

    // Mensagem de boas-vindas
    adicionarMensagemChat(`
        <div class="roll-entry">
            <span class="roll-label" style="color:#ffd700">🎲 Bem-vindo à Mesa!</span>
            <span class="roll-dice" style="color:#aaa">Digite uma fórmula no campo abaixo</span>
            <span class="roll-dice" style="color:#666; font-size:0.7rem;">Ex: 1d20, 2d6+3, d8-1</span>
        </div>
    `, 'system');
});