// --- KONFIGURÁCIÓ ---
const RA_CARTA = 1.39; 
const CORES = [
    [35, 85, 172], // Kék
    [163, 12, 19], // Piros
    [225, 182, 21] // Sárga
];

const CSS_BTN_SZINEK = [
    "background-color: #234ca0; color: white;", // Kék gomb
    "background-color: #bd1c24; color: white;", // Piros gomb
    "background-color: #f2c916; color: black; text-shadow: 0px 0px 1px white;"  // Sárga gomb
];

const SZIN_NEVEK = ["Kék", "Piros", "Sárga"];

// --- JÁTÉK ÁLLAPOT ---
let historico = {
    pos: -1,
    dados: []
};

let cartas_descartadas = [];
let nincsTobbLehetoseg = false;

// --- INDÍTÁS ---
function setup() {
    kijelzoLetrehozasa();       
    tablazatLetrehozasa();      
    sajatPontKalkulatorLetrehozasa(); 

    iniciarJogo();

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

    let canvasWidth = 750; 
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
    nincsTobbLehetoseg = false;
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
            textSize(24); 
            stroke(0);
            strokeWeight(3);
            text(carta, centroX, centroY);

            if (nincsTobbLehetoseg && !cartas_descartadas[cor][carta - 1]) {
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

// --- KATTINTÁS A GOMBOKON ---
window.leadKombinaciot = function(tipus, p1, p2, p3, extraInfo) {
    let pont = 0;
    
    if (tipus === 'szin_sor') { 
        let cor = extraInfo; 
        cartas_descartadas[cor][p1-1] = true;
        cartas_descartadas[cor][p2-1] = true;
        cartas_descartadas[cor][p3-1] = true;
        pont = (p1 * 10) + 40; 
    } 
    else if (tipus === 'vegyes_sor') { 
        let lapok = [p1, p2, p3];
        for(let val of lapok) {
            for(let c=0; c<3; c++) {
                if(!cartas_descartadas[c][val-1]) {
                    cartas_descartadas[c][val-1] = true;
                    break; 
                }
            }
        }
        pont = (p1 * 10);
    }
    else if (tipus === 'szett') { // Szett (1-1-1)
        let val = p1;
        // Kivesszük mindhárom színből
        cartas_descartadas[0][val-1] = true;
        cartas_descartadas[1][val-1] = true;
        cartas_descartadas[2][val-1] = true;
        pont = (val * 10) + 10;
    }
    
    let input = document.getElementById("sajat-pont-input");
    let jelenlegi = parseInt(input.value) || 0;
    input.value = jelenlegi + pont;
    
    adicionarAoHistorico();
    if (window.app) app.a++;
    
    input.dispatchEvent(new Event('input')); 
    ellenorizdAPontokat();
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

function kijelzoLetrehozasa() {
    if (document.getElementById("pont-kijelzo")) return;
    let div = document.createElement("div");
    div.id = "pont-kijelzo";
    div.style.position = "fixed";
    div.style.top = "10px";
    div.style.right = "10px";
    div.style.backgroundColor = "rgba(0,0,0,0.85)";
    div.style.color = "white";
    div.style.padding = "10px 15px";
    div.style.borderRadius = "8px";
    div.style.fontFamily = "Arial, sans-serif";
    div.style.fontWeight = "bold";
    div.style.border = "2px solid white";
    div.style.zIndex = "9999";
    div.innerHTML = "...";
    document.body.appendChild(div);
}

function tablazatLetrehozasa() {
    if (document.getElementById("kombinacio-tablazat")) return;
    let div = document.createElement("div");
    div.id = "kombinacio-tablazat";
    div.style.position = "fixed";
    div.style.top = "10px";
    div.style.left = "10px";
    div.style.backgroundColor = "rgba(0,0,0,0.95)";
    div.style.color = "white";
    div.style.padding = "10px";
    div.style.borderRadius = "8px";
    div.style.fontFamily = "Arial, sans-serif"; 
    div.style.fontSize = "15px"; 
    div.style.border = "1px solid #777";
    div.style.zIndex = "9999";
    div.style.maxWidth = "480px"; 
    div.style.maxHeight = "90vh"; 
    div.style.overflowY = "auto";
    div.innerHTML = "Betöltés...";
    document.body.appendChild(div);
}

function sajatPontKalkulatorLetrehozasa() {
    if (document.getElementById("sajat-pont-doboz")) return;

    let div = document.createElement("div");
    div.id = "sajat-pont-doboz";
    div.style.position = "fixed";
    div.style.bottom = "20px";
    div.style.right = "20px";
    div.style.backgroundColor = "rgba(0,0,0,0.9)";
    div.style.color = "white";
    div.style.padding = "15px";
    div.style.borderRadius = "10px";
    div.style.fontFamily = "Arial, sans-serif";
    div.style.border = "2px solid #aaa";
    div.style.zIndex = "9999";
    div.style.textAlign = "center";
    div.style.minWidth = "200px";

    div.innerHTML = `
        <div style="margin-bottom:8px; font-weight:bold;">Saját Pontom:</div>
        <input type="number" id="sajat-pont-input" style="width:80px; padding:5px; font-size:24px; text-align:center; border-radius:5px; border:none;" value="0">
        <div id="lada-eredmeny" style="margin-top:10px; font-weight:bold; font-size:20px; color:#cd7f32;">
            BRONZ
        </div>
    `;

    document.body.appendChild(div);

    let inputMezo = document.getElementById("sajat-pont-input");
    let eredmenyMezo = document.getElementById("lada-eredmeny");

    inputMezo.addEventListener("input", function() {
        let pont = parseInt(this.value) || 0;
        
        if (pont >= 400) {
            eredmenyMezo.innerHTML = "ARANY láda";
            eredmenyMezo.style.color = "#ffd700"; 
            div.style.border = "2px solid #ffd700";
        } else if (pont >= 300) {
            eredmenyMezo.innerHTML = "EZÜST láda";
            eredmenyMezo.style.color = "#c0c0c0"; 
            div.style.border = "2px solid #c0c0c0";
        } else {
            eredmenyMezo.innerHTML = "BRONZ láda";
            eredmenyMezo.style.color = "#cd7f32"; 
            div.style.border = "2px solid #cd7f32";
        }
        ellenorizdAPontokat(); 
    });
}

// --- FŐ LOGIKA: ÚJ SORREND ---
function ellenorizdAPontokat() {
    let maxPontMaradek = 0;
    
    let baseBtnStyle = "cursor:pointer; padding:6px 12px; margin:3px; display:inline-block; border-radius:6px; font-weight:bold; border:1px solid rgba(255,255,255,0.3); text-align:center; vertical-align:middle;";
    
    let html = "<h4 style='margin:0 0 10px 0; text-align:center; color:white;'>Még kirakható:</h4>";

    try {
        // 0. Vegyes Sorok (1-2-3) - Ez marad felül (vagy elhagyható, ha zavar, de a pontszámítás miatt jobb ha itt van)
        let vanVegyes = false;
        let vegyesHtml = `<div style="border-bottom:1px solid #444; padding-bottom:5px; margin-bottom:5px;"><strong>Vegyes sorok:</strong><br>`;
        for (let i = 1; i <= 6; i++) {
             if (combinacaoDisponivel(i, i + 1, i + 2)) {
                let pont = (i * 10);
                maxPontMaradek += pont;
                vegyesHtml += `<span style='${baseBtnStyle} background:#2e5e4e; color:white;' onclick='leadKombinaciot("vegyes_sor", ${i}, ${i+1}, ${i+2})'>
                            ${i}-${i+1}-${i+2} <span style="font-size:0.8em; color:#bbb">(${pont}p)</span>
                         </span>`;
                vanVegyes = true;
            }
        }
        vegyesHtml += "</div>";
        if(vanVegyes) html += vegyesHtml;


        // 1. SZÍNES CSOPORTOK (KÉK, PIROS, SÁRGA) - FELSŐ RÉSZ
        for (let c = 0; c < 3; c++) {
            let vanEbbenSzinben = false;
            let szinHtml = `<div style="border-bottom:1px solid #444; padding:5px 0; margin-bottom:5px;">`; 
            szinHtml += `<strong style="color:${CSS_BTN_SZINEK[c].split(';')[1]}">${SZIN_NEVEK[c]}:</strong><br>`;

            for (let i = 1; i <= 6; i++) {
                if (combinacaoDisponivel(i, i + 1, i + 2, c)) {
                    let pont = (i * 10) + 40;
                    maxPontMaradek += pont;
                    szinHtml += `<span style='${baseBtnStyle} ${CSS_BTN_SZINEK[c]}' onclick='leadKombinaciot("szin_sor", ${i}, ${i+1}, ${i+2}, ${c})'>
                                    ${i}-${i+1}-${i+2} <span style="font-size:0.8em; opacity:0.8">(${pont}p)</span>
                                 </span>`;
                    vanEbbenSzinben = true;
                }
            }
            szinHtml += `</div>`;
            if (vanEbbenSzinben) html += szinHtml;
        }

        // 2. SZETTEK (1-1-1, 2-2-2) - EZ KERÜL ALULRA, A SÁRGA UTÁN
        let vanSzett = false;
        let szettHtml = `<div style="padding-top:5px;"><strong>Szettek:</strong><br>`;
        for (let i = 1; i <= 8; i++) {
            if (combinacaoDisponivel(i, i, i)) {
                let pont = (i * 10) + 10;
                maxPontMaradek += pont;
                // Szürke/Semleges gomb
                szettHtml += `<span style='${baseBtnStyle} background:#555; color:white;' onclick='leadKombinaciot("szett", ${i}, ${i}, ${i})'>
                            ${i}-${i}-${i} <span style="font-size:0.8em; color:#ddd">(${pont}p)</span>
                         </span>`;
                vanSzett = true;
            }
        }
        szettHtml += "</div>";
        // Csak akkor írjuk ki, ha van benne elem
        if(vanSzett) html += szettHtml;


        // --- VÉGE ELLENŐRZÉS ---
        if (maxPontMaradek === 0) {
            nincsTobbLehetoseg = true;
        } else {
            nincsTobbLehetoseg = false;
        }

        // TÁBLÁZAT FRISSÍTÉSE
        let tablazat = document.getElementById("kombinacio-tablazat");
        if (tablazat) tablazat.innerHTML = html;

        // --- JOBB FELSŐ KIJELZŐ LOGIKA ---
        let kijelzo = document.getElementById("pont-kijelzo");
        let sajatPont = parseInt(document.getElementById("sajat-pont-input").value) || 0;
        let osszesPotencial = sajatPont + maxPontMaradek;

        if (kijelzo) {
            kijelzo.style.display = "none"; 
            
            if (!nincsTobbLehetoseg) {
                if (osszesPotencial >= 400) {
                    kijelzo.style.display = "block";
                    kijelzo.innerHTML = "Elérhető: ARANY 🏆";
                    kijelzo.style.borderColor = "#ffd700";
                    kijelzo.style.color = "#ffd700";
                } 
                else if (osszesPotencial >= 300) {
                    kijelzo.style.display = "block";
                    kijelzo.innerHTML = "Elérhető: EZÜST 🥈";
                    kijelzo.style.borderColor = "#c0c0c0";
                    kijelzo.style.color = "#c0c0c0";
                }
            }
        }

    } catch (e) { console.error(e); }
}
