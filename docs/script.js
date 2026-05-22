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
    const rx = 360 * 3 + Math.floor(Math.random() * 360);
    const ry = 360 * 4 + Math.floor(Math.random() * 360);
    const rz = 360 * 2 + Math.floor(Math.random() * 360);
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
        conteudo.innerHTML = `
            <div class="ficha-scroll-container" style="height: 100%; overflow-y: auto; padding-right: 10px;">
                <div class="ficha-container" style="display: flex; flex-direction: column; gap: 15px; padding: 10px;">
                    
                    <div class="ficha-header ficha-secao" style="display: flex; flex-wrap: wrap; gap: 10px;">
                        <input type="text" placeholder="Nome do Personagem" id="nome-char" style="flex: 3; min-width: 200px;">
                        <input type="number" placeholder="Nível" id="nivel-char" value="1" style="flex: 0.5; min-width: 60px;">
                        <input type="text" placeholder="Raça" style="flex: 1; min-width: 100px;">
                        <input type="text" placeholder="Classe" style="flex: 1; min-width: 100px;">
                        <input type="text" placeholder="Divindade" style="flex: 1; min-width: 100px;">
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
                        <div class="status-box pv" style="background: #741b1b; padding: 10px; border-radius: 5px; text-align: center;">
                            <span style="font-size: 0.8rem;">PONTOS DE VIDA</span><br>
                            <input type="number" value="0" style="width: 50px;"> / <input type="number" value="0" style="width: 50px;">
                        </div>
                        <div class="status-box pm" style="background: #1b4d74; padding: 10px; border-radius: 5px; text-align: center;">
                            <span style="font-size: 0.8rem;">PONTOS DE MANA</span><br>
                            <input type="number" value="0" style="width: 50px;"> / <input type="number" value="0" style="width: 50px;">
                        </div>
                        <div class="ficha-secao" style="text-align: center; display: flex; flex-direction: column; justify-content: center;">
                            <span style="font-size: 0.8rem;">🛡️ DEFESA</span>
                            <input type="number" value="10" style="width: 60px; margin: 0 auto; font-size: 1.2rem; background: none; border: 1px solid #ffd700; color: white; text-align: center;">
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        <div class="ficha-secao">
                            <h4 style="margin-bottom:10px; border-bottom:1px solid #555;">Atributos</h4>
                            <div class="atributo-row"><span>FOR</span><input type="number" id="for-val" value="10" oninput="atualizarMod()"> <small id="for-mod">+0</small></div>
                            <div class="atributo-row"><span>DES</span><input type="number" id="des-val" value="10" oninput="atualizarMod()"> <small id="des-mod">+0</small></div>
                            <div class="atributo-row"><span>CON</span><input type="number" id="con-val" value="10" oninput="atualizarMod()"> <small id="con-mod">+0</small></div>
                            <div class="atributo-row"><span>INT</span><input type="number" id="int-val" value="10" oninput="atualizarMod()"> <small id="int-mod">+0</small></div>
                            <div class="atributo-row"><span>SAB</span><input type="number" id="sab-val" value="10" oninput="atualizarMod()"> <small id="sab-mod">+0</small></div>
                            <div class="atributo-row"><span>CAR</span><input type="number" id="car-val" value="10" oninput="atualizarMod()"> <small id="car-mod">+0</small></div>
                        </div>
                        <div class="ficha-secao">
                            <h4 style="margin-bottom:10px; border-bottom:1px solid #555;">Resistências</h4>
                            <div style="display: flex; flex-direction: column; gap: 10px;">
                                <button class="nav-button" onclick="rolarPericia('Fortitude', 'fortitude')">🛡️ Fortitude (CON)</button>
                                <button class="nav-button" onclick="rolarPericia('Reflexos', 'reflexos')">🏃 Reflexos (DES)</button>
                                <button class="nav-button" onclick="rolarPericia('Vontade', 'vontade')">🧠 Vontade (SAB)</button>
                            </div>
                        </div>
                    </div>

                    <div class="ficha-secao">
                        <h4 style="margin-bottom:10px; border-bottom:1px solid #555;">Ataques</h4>
                        <table style="width: 100%; font-size: 0.8rem; text-align: left;">
                            <thead>
                                <tr>
                                    <th>Arma/Ataque</th>
                                    <th>Teste</th>
                                    <th>Dano</th>
                                    <th>Crítico</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><input type="text" placeholder="Ex: Espada" style="width: 90%;"></td>
                                    <td><button class="nav-button" onclick="rolarFormula('1d20', 'Ataque')">⚔️ Atacar</button></td>
                                    <td><button class="nav-button" onclick="rolarFormula('1d6', 'Dano')">💥 Dano</button></td>
                                    <td><input type="text" placeholder="19/x2" style="width: 40px;"></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="ficha-secao">
                        <h4 style="margin-bottom:10px; border-bottom:1px solid #555;">Perícias</h4>
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.75rem;">
                            <thead>
                                <tr style="text-align: left; color: #aaa; border-bottom: 1px solid #444;">
                                    <th>T</th>
                                    <th>Perícia</th>
                                    <th>Atributo</th>
                                    <th>Outros</th>
                                    <th>Rolar</th>
                                </tr>
                            </thead>
                            <tbody id="pericias-body"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        const pericias = [
            {nome: 'Acrobacia', attr: 'des'}, {nome: 'Adestramento', attr: 'car'}, {nome: 'Atletismo', attr: 'for'},
            {nome: 'Atuação', attr: 'car'}, {nome: 'Cavalgar', attr: 'des'}, {nome: 'Conhecimento', attr: 'int'},
            {nome: 'Cura', attr: 'sab'}, {nome: 'Diplomacia', attr: 'car'}, {nome: 'Enganação', attr: 'car'},
            {nome: 'Fortitude', attr: 'con'}, {nome: 'Furtividade', attr: 'des'}, {nome: 'Guerra', attr: 'int'},
            {nome: 'Iniciativa', attr: 'des'}, {nome: 'Intimidação', attr: 'car'}, {nome: 'Intuição', attr: 'sab'},
            {nome: 'Investigação', attr: 'int'}, {nome: 'Jogatina', attr: 'car'}, {nome: 'Ladinagem', attr: 'des'},
            {nome: 'Luta', attr: 'for'}, {nome: 'Misticismo', attr: 'int'}, {nome: 'Nobreza', attr: 'int'},
            {nome: 'Ofício', attr: 'int'}, {nome: 'Percepção', attr: 'sab'}, {nome: 'Pilotagem', attr: 'des'},
            {nome: 'Pontaria', attr: 'des'}, {nome: 'Reflexos', attr: 'des'}, {nome: 'Religião', attr: 'sab'},
            {nome: 'Sobrevivência', attr: 'sab'}, {nome: 'Vontade', attr: 'sab'}
        ];

        const tbody = document.getElementById('pericias-body');
        pericias.forEach(p => {
            const idLower = p.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ /g, '-');
            tbody.innerHTML += `
                <tr style="border-bottom: 1px solid #222;">
                    <td><input type="checkbox" id="treino-${idLower}"></td>
                    <td title="Clique no dado para rolar">${p.nome}</td>
                    <td>
                        <select id="attr-select-${idLower}" style="background:#111; color:white; border:none; font-size:0.7rem;">
                            <option value="for" ${p.attr === 'for' ? 'selected' : ''}>FOR</option>
                            <option value="des" ${p.attr === 'des' ? 'selected' : ''}>DES</option>
                            <option value="con" ${p.attr === 'con' ? 'selected' : ''}>CON</option>
                            <option value="int" ${p.attr === 'int' ? 'selected' : ''}>INT</option>
                            <option value="sab" ${p.attr === 'sab' ? 'selected' : ''}>SAB</option>
                            <option value="car" ${p.attr === 'car' ? 'selected' : ''}>CAR</option>
                        </select>
                    </td>
                    <td><input type="number" id="outros-${idLower}" value="0" style="width:30px; background:none; border:1px solid #444; color:white;"></td>
                    <td><button class="nav-button btn-rolar-pericia" onclick="rolarPericia('${p.nome}', '${idLower}')">🎲</button></td>
                </tr>
            `;
        });

        atualizarMod();

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