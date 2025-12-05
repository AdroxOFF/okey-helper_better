// --- KONFIGURÁCIÓ ---
const RA_CARTA = 1.39; 
const CORES = [
    [35, 85, 172], // Kék
    [163, 12, 19], // Piros
    [225, 182, 21] // Sárga
];

const CSS_SZINEK = ["#4da6ff", "#ff4d4d", "#ffd700"];
const SZIN_NEVEK = ["Kék", "Piros", "Sárga"];

// --- JÁTÉK ÁLLAPOT ---
let historico = {
    pos: -1,
    dados: []
};

let cartas_descartadas = [];
let jatekVege = false;

// --- INDÍTÁS ---
function setup() {
    // Kijelzők létrehozása
    kijelzoLetrehozasa();       // Jobb felül: Max pont
    tablazatLetrehozasa();      // Bal felül: Kombinációk
    sajatPontKalkulatorLetrehozasa(); // ÚJ: Jobb alul: Saját pont/Láda

    iniciarJogo();

    // Vue.js
    if (typeof Vue !== 'undefined') {
        window.app = new Vue({
            el: '#app',
            data: { a: 0 },
            methods: {
                combinacaoDisponivel(a, b, c, d=-1) {
                    this.a; 
                    return combinacaoDisponivel(a, b, c, d);
                }
            }
        });
    }

    // --- ITT NÖVELTEM MEG A SZÉLESSÉGET 950-RE ---
    let canvasWidth = 950; 
    let canvasHeight = ((canvasWidth/8) * RA_CARTA) * 3 + 1;
    let canvas = createCanvas(canvasWidth, canvasHeight);
    canvas.parent('game');
}

function iniciarJogo() {
    cartas_descartadas = [];
    for (let cor = 0; cor < 3; cor++) {
        cartas_descartadas.push([]);
        for (let carta = 0; carta < 8; carta++) {
            cartas_descartadas[cor].push(false);
        }
    }
    jatekVege = false;
    adicionarAoHistorico();
    setTimeout(ellenorizdAPontokat, 500);
}

// --- RAJZOLÁS ---
function draw() {
    clear(); 
    if (!width || !height) return;

    let LARGURA_CARTA = width / 8;
    let ALTURA_CARTA = LARGURA_CARTA * RA_CARTA;

    for (let cor = 0; cor < 3; cor++) {
        for (let carta = 1; carta <= 8; carta++) {
            let x = LARGURA_CARTA * (carta - 1);
            let y = ALTURA_CARTA * cor;
        
            fill(CORES[cor]);
            if (cartas_descartadas[cor][carta - 1]) fill(70); 
            stroke(0);
            strokeWeight(1);
            rect(x, y, LARGURA_CARTA, ALTURA_CARTA);

            let centroX = x + (LARGURA_CARTA / 2);
            let centroY = y + (ALTURA_CARTA / 2);

            fill(255);
            textAlign(CENTER, CENTER);
            textSize(28); // Kicsit nagyobb betűméret a szélesebb kártyákhoz
            stroke(0);
            strokeWeight(3);
            text(carta, centroX, centroY);

            if (jatekVege && !cartas_descartadas[cor][carta - 1]) {
                stroke(255, 0, 0);
                strokeWeight(5);
                line(x, y, x + LARGURA_CARTA, y + ALTURA_CARTA);
                line(x + LARGURA_CARTA, y, x, y + ALTURA_CARTA);
            }
        }
    }
}

function mousePressed() {
    if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return;

    let LARGURA_CARTA = width / 8;
    let ALTURA_CARTA = LARGURA_CARTA * RA_CARTA;

    if (mouseY < ALTURA_CARTA * 3) {
        let cor = Math.floor(mouseY / ALTURA_CARTA);
        let x = Math.floor(mouseX / LARGURA_CARTA);
        let carta = (x % 8) + 1;

        if (cor >= 0 && cor < 3 && carta >= 1 && carta <= 8) {
            if (!cartas_descartadas[cor][carta - 1]) {
                 cartas_descartadas[cor][carta - 1] = true;
                 adicionarAoHistorico();
                 if (window.app) app.a++;
                 ellenorizdAPontokat();
            }
        }
    }
}

// --- LOGIKA ---
function limpar() {
    historico.pos = 1;
    desfazer();
}

function desfazer() {
    if (historico.pos < 1) return;
    carregarDoHistorico(--historico.pos);
}

function refazer() {
    if (historico.pos >= historico.dados.length - 1) return;
    carregarDoHistorico(++historico.pos);
}

function carregarDoHistorico(pos) {
    let dados = JSON.parse(JSON.stringify(historico.dados[pos]));
    cartas_descartadas = dados.cartas_descartadas;
    if (window.app) app.a++;
    ellenorizdAPontokat();
}

function adicionarAoHistorico() {
    if (historico.pos + 1 < historico.dados.length) {
        historico.dados.splice(historico.pos + 1, historico.dados.length - historico.pos);
    }
    historico.dados.push(JSON.parse(JSON.stringify({ cartas_descartadas: cartas_descartadas })));
    historico.pos++;
}

function cartaDisponivel(carta, cor) {
    if (!cartas_descartadas[cor]) return false;
    return !cartas_descartadas[cor][carta - 1];
}

function combinacaoDisponivel(a, b, c, cor = -1) {
    let ord = [a, b, c].sort((x, y) => x - y);
    a = ord[0]; b = ord[1]; c = ord[2];

    if (a == b && b == c) {
        return cartaDisponivel(a, 0) && cartaDisponivel(a, 1) && cartaDisponivel(a, 2);
    }

    if (a + 1 == b && b + 1 == c) {
        if (cor == -1) { 
            return (cartaDisponivel(a, 0) || cartaDisponivel(a, 1) || cartaDisponivel(a, 2)) &&
                   (cartaDisponivel(b, 0) || cartaDisponivel(b, 1) || cartaDisponivel(b, 2)) &&
                   (cartaDisponivel(c, 0) || cartaDisponivel(c, 1) || cartaDisponivel(c, 2));
        }
        return cartaDisponivel(a, cor) && cartaDisponivel(b, cor) && cartaDisponivel(c, cor);
    }
    return false;
}

// --- KIJELZŐK ---

// 1. Jobb felső: Max pontszám
function kijelzoLetrehozasa() {
    if (document.getElementById("pont-kijelzo")) return;
    let div = document.createElement("div");
    div.id = "pont-kijelzo";
    div.style.position = "fixed";
    div.style.top = "10px";
    div.style.right = "10px";
    div.style.backgroundColor = "rgba(0,0,0,0.9)";
    div.style.color = "white";
    div.style.padding = "10px 20px";
    div.style.borderRadius = "8px";
    div.style.fontFamily = "Arial, sans-serif";
    div.style.fontWeight = "bold";
    div.style.border = "2px solid gold";
    div.style.zIndex = "9999";
    div.innerHTML = "Számolás...";
    document.body.appendChild(div);
}

// 2. Bal felső: Kombinációk
function tablazatLetrehozasa() {
    if (document.getElementById("kombinacio-tablazat")) return;
    let div = document.createElement("div");
    div.id = "kombinacio-tablazat";
    div.style.position = "fixed";
    div.style.top = "10px";
    div.style.left = "10px";
    div.style.backgroundColor = "rgba(0,0,0,0.9)";
    div.style.color = "white";
    div.style.padding = "10px";
    div.style.borderRadius = "8px";
    div.style.fontFamily = "monospace";
    div.style.fontSize = "14px";
    div.style.border = "1px solid #555";
    div.style.zIndex = "9999";
    div.style.maxWidth = "350px";
    div.innerHTML = "Betöltés...";
    document.body.appendChild(div);
}

// 3. ÚJ: Jobb alsó: Saját Pont / Láda Kalkulátor
function sajatPontKalkulatorLetrehozasa() {
    if (document.getElementById("sajat-pont-doboz")) return;

    let div = document.createElement("div");
    div.id = "sajat-pont-doboz";
    div.style.position = "fixed";
    div.style.bottom = "20px";
    div.style.right = "20px";
    div.style.backgroundColor = "rgba(0,0,0,0.95)";
    div.style.color = "white";
    div.style.padding = "15px";
    div.style.borderRadius = "10px";
    div.style.fontFamily = "Arial, sans-serif";
    div.style.border = "2px solid #aaa";
    div.style.zIndex = "9999";
    div.style.textAlign = "center";
    div.style.minWidth = "200px";

    // HTML tartalom: Beviteli mező és Eredmény
    div.innerHTML = `
        <div style="margin-bottom:8px; font-weight:bold;">Saját Pontom:</div>
        <input type="number" id="sajat-pont-input" style="width:80px; padding:5px; font-size:18px; text-align:center; border-radius:5px; border:none;" placeholder="0">
        <div id="lada-eredmeny" style="margin-top:10px; font-weight:bold; font-size:18px; color:#cd7f32;">
            Vidám BRONZ láda
        </div>
    `;

    document.body.appendChild(div);

    // Eseményfigyelő: Ha írnak a mezőbe, frissüljön a szöveg
    let inputMezo = document.getElementById("sajat-pont-input");
    let eredmenyMezo = document.getElementById("lada-eredmeny");

    inputMezo.addEventListener("input", function() {
        let pont = parseInt(this.value) || 0;
        
        if (pont >= 400) {
            eredmenyMezo.innerHTML = "Vidám ARANY láda";
            eredmenyMezo.style.color = "#ffd700"; // Arany
            div.style.border = "2px solid #ffd700";
        } else if (pont >= 300) {
            eredmenyMezo.innerHTML = "Vidám EZÜST láda";
            eredmenyMezo.style.color = "#c0c0c0"; // Ezüst
            div.style.border = "2px solid #c0c0c0";
        } else {
            eredmenyMezo.innerHTML = "Vidám BRONZ láda";
            eredmenyMezo.style.color = "#cd7f32"; // Bronz
            div.style.border = "2px solid #cd7f32";
        }
    });
}

function ellenorizdAPontokat() {
    let maxPont = 0;
    let html = "<h4 style='margin:0 0 5px 0; text-align:center; color:white;'>Még kirakható:</h4>";

    try {
        for (let i = 1; i <= 8; i++) {
            if (combinacaoDisponivel(i, i, i)) maxPont += (i * 10) + 10;
        }
        for (let i = 1; i <= 6; i++) {
            if (combinacaoDisponivel(i, i + 1, i + 2)) maxPont += (i * 10);
        }
        for (let c = 0; c < 3; c++) {
            let sorTalalt = false;
            let szinHtml = `<div style='margin-bottom:2px; color:${CSS_SZINEK[c]}'><strong>${SZIN_NEVEK[c]}: </strong>`;
            for (let i = 1; i <= 6; i++) {
                if (combinacaoDisponivel(i, i + 1, i + 2, c)) {
                    maxPont += (i * 10) + 40;
                    szinHtml += `<span style='border:1px solid #444; padding:0 3px; margin:0 2px; display:inline-block;'>${i}-${i+1}-${i+2}</span>`;
                    sorTalalt = true;
                }
            }
            if (!sorTalalt) szinHtml += "<span style='opacity:0.3'>-</span>";
            szinHtml += "</div>";
            html += szinHtml;
        }

        let tablazat = document.getElementById("kombinacio-tablazat");
        if (tablazat) tablazat.innerHTML = html;

        let kijelzo = document.getElementById("pont-kijelzo");
        if (kijelzo) {
            kijelzo.innerHTML = "Max elérhető: " + maxPont;
            if (maxPont < 300) {
                kijelzo.style.borderColor = "red";
                kijelzo.style.color = "#ff6666";
                kijelzo.innerHTML += "<br><span style='font-size:0.8em'>(Nincs meg a 300!)</span>";
                jatekVege = true;
            } else {
                kijelzo.style.borderColor = "gold";
                kijelzo.style.color = "white";
                jatekVege = false;
            }
        }
    } catch (e) { console.error(e); }
}
