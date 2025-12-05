// =============================================================
// KONFIGURÁCIÓ
// =============================================================
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

// Képfájlok nevei (Ezek legyenek a html fájl mellett!)
const IMG_BRONZ = "image_96b33a.png";
const IMG_EZUST = "image_96b35a.png";
const IMG_ARANY = "image_96b37d.png";

// =============================================================
// JÁTÉK ÁLLAPOT
// =============================================================
let historico = {
    pos: -1,
    dados: []
};

let cartas_descartadas = [];
let nincsTobbLehetoseg = false;

// =============================================================
// INDÍTÁS (SETUP)
// =============================================================
function setup() {
    kijelzoLetrehozasa();        
    tablazatLetrehozasa();       
    sajatPontKalkulatorLetrehozasa(); 

    iniciarJogo();

    // Vue kompatibilitás (ha van az oldalon)
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

    // Canvas létrehozása a HTML-ben lévő 'game' div-be
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
    
    historico = { pos: -1, dados: [] };
    
    adicionarAoHistorico();
    setTimeout(ellenorizdAPontokat, 500);
}

// =============================================================
// RAJZOLÁS (DRAW)
// =============================================================
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

// =============================================================
// INTERAKCIÓ (INPUT)
// =============================================================
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

window.leadKombinaciot = function(tipus, p1, p2, p3, extraInfo) {
    let pont = 0;
    
    if (tipus === 'szin_sor') { 
        let cor = extraInfo; 
        cartas_descartadas[cor][p1-1] = true;
        cartas_descartadas[cor][p2-1] = true;
        cartas_descartadas[cor][p3-1] = true;
        pont = (p1 * 10) + 40; 
    } 
    else if (tipus === 'szett') { 
        let val = p1;
        cartas_descartadas[0][val-1] = true;
        cartas_descartadas[1][val-1] = true;
        cartas_descartadas[2][val-1] = true;
        pont = (val * 10) + 10;
    }
    
    let input = document.getElementById("sajat-pont-input");
    let jelenlegi = parseInt(input.value) || 0;
    input.value = jelenlegi + pont;
    
    input.dispatchEvent(new Event('input')); 
    adicionarAoHistorico(); 

    if (window.app) app.a++;
    
    ellenorizdAPontokat();
}

// History funkciók
window.limpar = function() {
    historico.pos = 1;
    desfazer();
}

window.desfazer = function() {
    if (historico.pos < 1) return;
    carregarDoHistorico(--historico.pos);
}

window.refazer = function() {
    if (historico.pos >= historico.dados.length - 1) return;
    carregarDoHistorico(++historico.pos);
}

function carregarDoHistorico(pos) {
    let dados = JSON.parse(JSON.stringify(historico.dados[pos]));
    cartas_descartadas = dados.cartas_descartadas;
    
    let input = document.getElementById("sajat-pont-input");
    if(input) {
        input.value = dados.pont || 0;
        input.dispatchEvent(new Event('input')); 
    }

    if (window.app) app.a++;
    ellenorizdAPontokat();
}

function adicionarAoHistorico() {
    if (historico.pos + 1 < historico.dados.length) {
        historico.dados.splice(historico.pos + 1, historico.dados.length - historico.pos);
    }
    
    let pont = 0;
    let input = document.getElementById("sajat-pont-input");
    if(input) pont = parseInt(input.value) || 0;

    historico.dados.push(JSON.parse(JSON.stringify({ 
        cartas_descartadas: cartas_descartadas,
        pont: pont
    })));
    historico.pos++;
}

// Segédfüggvények
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

// Algoritmus
function calculateMaxDisjointScore(candidates, usedCardsMap) {
    if (candidates.length === 0) return { score: 0, moves: [] };
    function solve(index, currentUsed) {
        if (index >= candidates.length) return { score: 0, moves: [] };
        let move = candidates[index];
        let resSkip = solve(index + 1, currentUsed);
        let canPick = true;
        for (let card of move.cards) {
            let key = card.c + "-" + card.v;
            if (currentUsed.has(key)) {
                canPick = false;
                break;
            }
        }
        let resPick = { score: -1, moves: [] };
        if (canPick) {
            let newUsed = new Set(currentUsed);
            for (let card of move.cards) {
                newUsed.add(card.c + "-" + card.v);
            }
            let remaining = solve(index + 1, newUsed);
            resPick = {
                score: move.points + remaining.score,
                moves: [move, ...remaining.moves]
            };
        }
        if (resPick.score > resSkip.score) return resPick;
        else return resSkip;
    }
    return solve(0, new Set());
}

// UI Frissítés
function ellenorizdAPontokat() {
    let baseBtnStyle = "cursor:pointer; padding:6px 12px; margin:3px; display:inline-block; border-radius:6px; font-weight:bold; border:1px solid rgba(255,255,255,0.3); text-align:center; vertical-align:middle;";
    let html = "<h4 style='margin:0 0 10px 0; text-align:center; color:white;'>Még kirakható:</h4>";
    let allCandidates = [];

    try {
        let vanVegyes = false;
        let vegyesHtml = `<div style="border-bottom:1px solid #444; padding-bottom:5px; margin-bottom:5px;"><strong>Vegyes sorok:</strong><br>`;
        for (let i = 1; i <= 6; i++) {
             if (combinacaoDisponivel(i, i + 1, i + 2)) {
                let pont = (i * 10);
                let mixedCards = [];
                let nums = [i, i+1, i+2];
                for(let n of nums) {
                    for(let c=0; c<3; c++) {
                        if(!cartas_descartadas[c][n-1]) {
                            mixedCards.push({c:c, v:n});
                            break; 
                        }
                    }
                }
                if(mixedCards.length === 3) {
                    allCandidates.push({ points: pont, cards: mixedCards, name: `Vegyes ${i}-${i+2}` });
                }
                vegyesHtml += `<span style='padding:6px 12px; margin:3px; display:inline-block; border-radius:6px; font-weight:bold; border:1px solid transparent; text-align:center; background:#2e5e4e; color:#eee; cursor:default; opacity:0.8;'>${i}-${i+1}-${i+2} <span style="font-size:0.8em; color:#bbb">(${pont}p)</span></span>`;
                vanVegyes = true;
            }
        }
        vegyesHtml += "</div>";
        if(vanVegyes) html += vegyesHtml;

        for (let c = 0; c < 3; c++) {
            let vanEbbenSzinben = false;
            let szinHtml = `<div style="border-bottom:1px solid #444; padding:5px 0; margin-bottom:5px;">`; 
            szinHtml += `<strong style="color:${CSS_BTN_SZINEK[c].split(';')[1]}">${SZIN_NEVEK[c]}:</strong><br>`;
            for (let i = 1; i <= 6; i++) {
                if (combinacaoDisponivel(i, i + 1, i + 2, c)) {
                    let pont = (i * 10) + 40;
                    allCandidates.push({
                        points: pont,
                        cards: [{c:c, v:i}, {c:c, v:i+1}, {c:c, v:i+2}],
                        name: `${SZIN_NEVEK[c]} ${i}-${i+2}`
                    });
                    szinHtml += `<span style='${baseBtnStyle} ${CSS_BTN_SZINEK[c]}' onclick='leadKombinaciot("szin_sor", ${i}, ${i+1}, ${i+2}, ${c})'>${i}-${i+1}-${i+2} <span style="font-size:0.8em; opacity:0.8">(${pont}p)</span></span>`;
                    vanEbbenSzinben = true;
                }
            }
            szinHtml += `</div>`;
            if (vanEbbenSzinben) html += szinHtml;
        }

        let vanSzett = false;
        let szettHtml = `<div style="padding-top:5px;"><strong>Szettek:</strong><br>`;
        for (let i = 1; i <= 8; i++) {
            if (combinacaoDisponivel(i, i, i)) {
                let pont = (i * 10) + 10;
                allCandidates.push({
                    points: pont,
                    cards: [{c:0, v:i}, {c:1, v:i}, {c:2, v:i}],
                    name: `Szett ${i}`
                });
                szettHtml += `<span style='${baseBtnStyle} background:#555; color:white;' onclick='leadKombinaciot("szett", ${i}, ${i}, ${i})'>${i}-${i}-${i} <span style="font-size:0.8em; color:#ddd">(${pont}p)</span></span>`;
                vanSzett = true;
            }
        }
        szettHtml += "</div>";
        if(vanSzett) html += szettHtml;

        let resultObj = calculateMaxDisjointScore(allCandidates, new Set());
        let realMaxPoints = resultObj.score;
        let bestMoves = resultObj.moves;

        let tablazat = document.getElementById("kombinacio-tablazat");
        if (tablazat) tablazat.innerHTML = html;

        if (allCandidates.length === 0) nincsTobbLehetoseg = true;
        else nincsTobbLehetoseg = false;

        let kijelzo = document.getElementById("pont-kijelzo");
        let sajatPont = parseInt(document.getElementById("sajat-pont-input").value) || 0;
        let osszesPotencial = sajatPont + realMaxPoints;

        if (kijelzo) {
            kijelzo.style.display = "none"; 
            if (!nincsTobbLehetoseg || osszesPotencial > 0) {
                let statuszText = "";
                let statuszColor = "white";
                if (osszesPotencial >= 400) { statuszText = "ARANY 🏆"; statuszColor = "#ffd700"; } 
                else if (osszesPotencial >= 300) { statuszText = "EZÜST 🥈"; statuszColor = "#c0c0c0"; } 
                else { statuszText = "BRONZ 🥉"; statuszColor = "#cd7f32"; }

                let reszletek = "";
                if (bestMoves.length > 0) {
                    reszletek = "<div style='margin-top:5px; font-size:12px; text-align:right; color:#ddd; border-top:1px solid #555; padding-top:3px;'>";
                    bestMoves.forEach(m => { reszletek += `+ ${m.name} <span style="color:#aaa">(${m.points})</span><br>`; });
                    reszletek += "</div>";
                }

                kijelzo.style.display = "block";
                kijelzo.style.borderColor = statuszColor;
                kijelzo.style.color = statuszColor;
                kijelzo.innerHTML = `<div style="font-size:18px; margin-bottom:2px; text-align:right;">${statuszText}</div><div style="font-size:14px; color:white; text-align:right;">Max pont: ${osszesPotencial}</div>${reszletek}`;
            }
        }

    } catch (e) { console.error("Hiba az ellenorizdAPontokat-ban:", e); }
}

// UI Elemek létrehozása
function kijelzoLetrehozasa() {
    if (document.getElementById("pont-kijelzo")) return;
    let div = document.createElement("div");
    div.id = "pont-kijelzo";
    div.style.position = "fixed";
    div.style.top = "10px";
    div.style.right = "10px";
    div.style.backgroundColor = "rgba(0,0,0,0.9)";
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
        
        <div style="margin: 15px auto; height: 80px; display:flex; align-items:center; justify-content:center;">
            <img id="lada-kep" src="${IMG_BRONZ}" style="max-height: 100%; max-width: 100%; object-fit: contain;">
        </div>

        <div id="lada-eredmeny" style="margin-top:5px; font-weight:bold; font-size:20px; color:#cd7f32;">
            BRONZ láda
        </div>
        
        <hr style="margin: 15px 0; border-color: #555;">
        
        <button onclick="location.reload()" style="background-color: #c9302c; color: white; border: none; padding: 10px 20px; font-size: 14px; font-weight: bold; border-radius: 5px; cursor: pointer; width: 100%;">
            TÖRLÉS (ÚJ JÁTÉK)
        </button>
    `;

    document.body.appendChild(div);

    let inputMezo = document.getElementById("sajat-pont-input");
    let eredmenyMezo = document.getElementById("lada-eredmeny");
    let kepMezo = document.getElementById("lada-kep");

    inputMezo.addEventListener("input", function() {
        let pont = parseInt(this.value) || 0;
        
        if (pont >= 400) {
            eredmenyMezo.innerHTML = "ARANY láda";
            eredmenyMezo.style.color = "#ffd700"; 
            div.style.border = "2px solid #ffd700";
            kepMezo.src = IMG_ARANY;
        } else if (pont >= 300) {
            eredmenyMezo.innerHTML = "EZÜST láda";
            eredmenyMezo.style.color = "#c0c0c0"; 
            div.style.border = "2px solid #c0c0c0";
            kepMezo.src = IMG_EZUST;
        } else {
            eredmenyMezo.innerHTML = "BRONZ láda";
            eredmenyMezo.style.color = "#cd7f32"; 
            div.style.border = "2px solid #cd7f32";
            kepMezo.src = IMG_BRONZ;
        }
        ellenorizdAPontokat(); 
    });
}
