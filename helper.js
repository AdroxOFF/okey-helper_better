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
    vezerloGombokLetrehozasa(); // <-- ÚJ: Középső gombok létrehozása

    iniciarJogo();

    // Vue kompatibilitás (ha van)
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
    
    // Töröljük a history-t új játéknál
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

            // Ha nincs több lehetőség és ez a kártya megmaradt, jelöljük meg
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
                 
                 // Kézi kattintásnál is mentünk history-t (pont nem változik, de állapot igen)
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
    else if (tipus === 'szett') { // Szett (1-1-1)
        let val = p1;
        cartas_descartadas[0][val-1] = true;
        cartas_descartadas[1][val-1] = true;
        cartas_descartadas[2][val-1] = true;
        pont = (val * 10) + 10;
    }
    
    let input = document.getElementById("sajat-pont-input");
    let jelenlegi = parseInt(input.value) || 0;
    input.value = jelenlegi + pont;
    
    // Először frissítjük a pontot, majd MENTJÜK a history-ba
    input.dispatchEvent(new Event('input')); 
    adicionarAoHistorico();

    if (window.app) app.a++;
    
    ellenorizdAPontokat();
}

// =============================================================
// ALAP LOGIKA (HISTORY - JAVÍTOTT PONTKEZELÉSSEL)
// =============================================================
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
    
    // 1. Kártyák visszaállítása
    cartas_descartadas = dados.cartas_descartadas;
    
    // 2. PONT VISSZAÁLLÍTÁSA (Ez hiányzott eddig)
    let input = document.getElementById("sajat-pont-input");
    if(input) {
        input.value = dados.pont || 0;
        input.dispatchEvent(new Event('input')); // Ez frissíti a színeket (bronz/ezüst/arany)
    }

    if (window.app) app.a++;
    ellenorizdAPontokat();
}

function adicionarAoHistorico() {
    if (historico.pos + 1 < historico.dados.length) {
        historico.dados.splice(historico.pos + 1, historico.dados.length - historico.pos);
    }
    
    // Jelenlegi pont megszerzése
    let pont = 0;
    let input = document.getElementById("sajat-pont-input");
    if(input) pont = parseInt(input.value) || 0;

    // Mentés: Kártyák + Pont
    historico.dados.push(JSON.parse(JSON.stringify({ 
        cartas_descartadas: cartas_descartadas,
        pont: pont
    })));
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

// =============================================================
// ÚJ ALGORITMUS (REKURZIÓ + ÚTVONAL KERESÉS)
// =============================================================
function calculateMaxDisjointScore(candidates, usedCardsMap) {
    if (candidates.length === 0) return { score: 0, moves: [] };

    // Belső rekurzív függvény
    function solve(index, currentUsed) {
        // Alapeset: elfogytak a jelöltek
        if (index >= candidates.length) return { score: 0, moves: [] };

        let move = candidates[index];

        // 1. opció: KIPÖRGETJÜK (NEM választjuk ki ezt a lépést)
        let resSkip = solve(index + 1, currentUsed);

        // 2. opció: KIVÁLASZTJUK ezt a lépést (ha nem ütközik)
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
            
            // Eredmény összeállítása (pont + lépés lista)
            resPick = {
                score: move.points + remaining.score,
                moves: [move, ...remaining.moves]
            };
        }

        // A jobbikat adjuk vissza
        if (resPick.score > resSkip.score) {
            return resPick;
        } else {
            return resSkip;
        }
    }

    return solve(0, new Set());
}

// =============================================================
// FŐ ELLENŐRZŐ LOGIKA (UI + KALKULÁCIÓ ÖSSZEKÖTÉSE)
// =============================================================
function ellenorizdAPontokat() {
    let baseBtnStyle = "cursor:pointer; padding:6px 12px; margin:3px; display:inline-block; border-radius:6px; font-weight:bold; border:1px solid rgba(255,255,255,0.3); text-align:center; vertical-align:middle;";
    let html = "<h4 style='margin:0 0 10px 0; text-align:center; color:white;'>Még kirakható:</h4>";

    let allCandidates = [];

    try {
        // --- ADATGYŰJTÉS ---

        // 0. Vegyes Sorok
        let vanVegyes = false;
        let vegyesHtml = `<div style="border-bottom:1px solid #444; padding-bottom:5px; margin-bottom:5px;"><strong>Vegyes sorok:</strong><br>`;
        for (let i = 1; i <= 6; i++) {
             if (combinacaoDisponivel(i, i + 1, i + 2)) {
                let pont = (i * 10);
                
                // Megkeressük az első elérhető kártyákat az optimalizálóhoz
                let mixedCards = [];
                let nums = [i, i+1, i+2];
                for(let n of nums) {
                    for(let c=0; c<3; c++) {
                        if(!cartas_descartadas[c][n-1]) {
                            mixedCards.push({c:c, v:n});
                            break; // Megvan a szám, ugrás a következő számra
                        }
                    }
                }
                
                if(mixedCards.length === 3) {
                    allCandidates.push({ points: pont, cards: mixedCards, name: `Vegyes ${i}-${i+2}` });
                }

                vegyesHtml += `<span style='padding:6px 12px; margin:3px; display:inline-block; border-radius:6px; font-weight:bold; border:1px solid transparent; text-align:center; background:#2e5e4e; color:#eee; cursor:default; opacity:0.8;'>
                                    ${i}-${i+1}-${i+2} <span style="font-size:0.8em; color:#bbb">(${pont}p)</span>
                                 </span>`;
                vanVegyes = true;
            }
        }
        vegyesHtml += "</div>";
        if(vanVegyes) html += vegyesHtml;

        // 1. SZÍNES CSOPORTOK
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

                    szinHtml += `<span style='${baseBtnStyle} ${CSS_BTN_SZINEK[c]}' onclick='leadKombinaciot("szin_sor", ${i}, ${i+1}, ${i+2}, ${c})'>
                                        ${i}-${i+1}-${i+2} <span style="font-size:0.8em; opacity:0.8">(${pont}p)</span>
                                     </span>`;
                    vanEbbenSzinben = true;
                }
            }
            szinHtml += `</div>`;
            if (vanEbbenSzinben) html += szinHtml;
        }

        // 2. SZETTEK
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

                szettHtml += `<span style='${baseBtnStyle} background:#555; color:white;' onclick='leadKombinaciot("szett", ${i}, ${i}, ${i})'>
                            ${i}-${i}-${i} <span style="font-size:0.8em; color:#ddd">(${pont}p)</span>
                          </span>`;
                vanSzett = true;
            }
        }
        szettHtml += "</div>";
        if(vanSzett) html += szettHtml;

        // --- OPTIMALIZÁLÁS FUTTATÁSA ---
        
        let resultObj = calculateMaxDisjointScore(allCandidates, new Set());
        let realMaxPoints = resultObj.score;
        let bestMoves = resultObj.moves;

        // --- UI FRISSÍTÉS ---
        let tablazat = document.getElementById("kombinacio-tablazat");
        if (tablazat) tablazat.innerHTML = html;

        if (allCandidates.length === 0) nincsTobbLehetoseg = true;
        else nincsTobbLehetoseg = false;

        // --- JOBB FELSŐ KIJELZŐ ---
        let kijelzo = document.getElementById("pont-kijelzo");
        let sajatPont = parseInt(document.getElementById("sajat-pont-input").value) || 0;
        let osszesPotencial = sajatPont + realMaxPoints;

        if (kijelzo) {
            kijelzo.style.display = "none"; 
            
            // Akkor is mutassa, ha van még lehetőség, vagy ha már van pontunk
            if (!nincsTobbLehetoseg || osszesPotencial > 0) {
                let statuszText = "";
                let statuszColor = "white";

                if (osszesPotencial >= 400) {
                    statuszText = "ARANY 🏆";
                    statuszColor = "#ffd700";
                } 
                else if (osszesPotencial >= 300) {
                    statuszText = "EZÜST 🥈";
                    statuszColor = "#c0c0c0";
                } else {
                    statuszText = "BRONZ 🥉";
                    statuszColor = "#cd7f32";
                }

                // Kalkuláció részletezése
                let reszletek = "";
                if (bestMoves.length > 0) {
                    reszletek = "<div style='margin-top:5px; font-size:12px; text-align:right; color:#ddd; border-top:1px solid #555; padding-top:3px;'>";
                    bestMoves.forEach(m => {
                        reszletek += `+ ${m.name} <span style="color:#aaa">(${m.points})</span><br>`;
                    });
                    reszletek += "</div>";
                }

                kijelzo.style.display = "block";
                kijelzo.style.borderColor = statuszColor;
                kijelzo.style.color = statuszColor;
                
                kijelzo.innerHTML = `
                    <div style="font-size:18px; margin-bottom:2px; text-align:right;">${statuszText}</div>
                    <div style="font-size:14px; color:white; text-align:right;">Max pont: ${osszesPotencial}</div>
                    ${reszletek}
                `;
            }
        }

    } catch (e) { console.error("Hiba az ellenorizdAPontokat-ban:", e); }
}

// =============================================================
// UI ELEMEK LÉTREHOZÁSA (INJEKTÁLÁS)
// =============================================================

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

function vezerloGombokLetrehozasa() {
    if (document.getElementById("kozepso-vezerlok")) return;

    let div = document.createElement("div");
    div.id = "kozepso-vezerlok";
    
    // Stílus: Középre igazítva, alul
    div.style.position = "fixed";
    div.style.bottom = "20px";
    div.style.left = "50%";
    div.style.transform = "translateX(-50%)"; // Ez húzza pontosan középre
    div.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    div.style.padding = "10px 20px";
    div.style.borderRadius = "50px"; 
    div.style.border = "2px solid #555";
    div.style.zIndex = "10000";
    div.style.display = "flex";
    div.style.gap = "15px";

    // Gombok stílusa
    const btnStyle = "cursor:pointer; width:50px; height:50px; border-radius:50%; border:none; font-size:24px; font-weight:bold; color:white; display:flex; align-items:center; justify-content:center; transition: background 0.2s;";

    div.innerHTML = `
        <button id="btn-vissza" title="Visszavonás" style="${btnStyle} background-color: #f0ad4e;">
            &#8678;
        </button>
        
        <button id="btn-torles" title="Teljes törlés (Új játék)" style="${btnStyle} background-color: #d9534f;">
            &#128465;
        </button>
        
        <button id="btn-elore" title="Mégis (Előre)" style="${btnStyle} background-color: #5bc0de;">
            &#8680;
        </button>
    `;

    document.body.appendChild(div);

    // Eseménykezelők
    document.getElementById("btn-vissza").onclick = function() {
        desfazer();
    };
    
    document.getElementById("btn-torles").onclick = function() {
        if(confirm("Biztosan mindent törölni akarsz?")) {
            location.reload(); 
        }
    };
    
    document.getElementById("btn-elore").onclick = function() {
        refazer();
    };
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
        
        <hr style="margin: 15px 0; border-color: #555;">
        
        <div style="font-size:12px; color:#aaa;">(A középső gombokkal léphetsz vissza)</div>
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
