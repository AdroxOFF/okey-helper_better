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

let cartas_descartadas = []; // Ezek már kimentek (Szürke)
let kijelolt_kartyak = [];   // Ezeket most jelölted ki (Zöld)
let jatekVege = false;

// --- INDÍTÁS ---
function setup() {
    // 1. Kijelzők létrehozása
    kijelzoLetrehozasa();       
    tablazatLetrehozasa();      
    sajatPontKalkulatorLetrehozasa(); 
    gombokLetrehozasa(); // ÚJ: Vezérlő gombok

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

    let canvasWidth = 950; 
    let canvasHeight = ((canvasWidth/8) * RA_CARTA) * 3 + 1;
    let canvas = createCanvas(canvasWidth, canvasHeight);
    canvas.parent('game');
}

function iniciarJogo() {
    cartas_descartadas = [];
    kijelolt_kartyak = [];
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
        
            // Alap kártya
            fill(CORES[cor]);
            
            // Ha már eldobták (Végleges)
            if (cartas_descartadas[cor][carta - 1]) fill(50); 
            
            stroke(0);
            strokeWeight(1);
            
            // Ha KI VAN JELÖLVE (Zöld keret)
            if (isKijelolve(cor, carta)) {
                stroke(0, 255, 0); // Zöld
                strokeWeight(5);
            }

            rect(x, y, LARGURA_CARTA, ALTURA_CARTA);

            let centroX = x + (LARGURA_CARTA / 2);
            let centroY = y + (ALTURA_CARTA / 2);

            fill(255);
            textAlign(CENTER, CENTER);
            textSize(28); 
            stroke(0);
            strokeWeight(3);
            text(carta, centroX, centroY);

            // Game Over X
            if (jatekVege && !cartas_descartadas[cor][carta - 1] && !isKijelolve(cor, carta)) {
                stroke(255, 0, 0);
                strokeWeight(5);
                line(x, y, x + LARGURA_CARTA, y + ALTURA_CARTA);
                line(x + LARGURA_CARTA, y, x, y + ALTURA_CARTA);
            }
        }
    }
}

// Segédfüggvény: Benne van-e a kijelöltek között?
function isKijelolve(cor, carta) {
    for(let k of kijelolt_kartyak) {
        if (k.cor === cor && k.carta === carta) return true;
    }
    return false;
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
            // Ha már eldobott (szürke), nem csinálunk semmit
            if (cartas_descartadas[cor][carta - 1]) return;

            // KIJELÖLÉS LOGIKA
            if (isKijelolve(cor, carta)) {
                // Ha már ki volt jelölve, vegyük le a kijelölést
                kijelolt_kartyak = kijelolt_kartyak.filter(k => !(k.cor === cor && k.carta === carta));
            } else {
                // Ha még nincs, adjuk hozzá
                if (kijelolt_kartyak.length < 3) { // Max 3-at engedjünk egyszerre (opcionális)
                     kijelolt_kartyak.push({cor: cor, carta: carta});
                } else {
                    // Ha már 3 van, a legrégebbit kivesszük, és berakjuk az újat (hogy gördülékeny legyen)
                    kijelolt_kartyak.shift();
                    kijelolt_kartyak.push({cor: cor, carta: carta});
                }
            }
        }
    }
}

// --- ÚJ GOMBOK VEZÉRLÉSE ---

function gombokLetrehozasa() {
    if (document.getElementById("vezerlo-gombok")) return;

    let container = document.createElement("div");
    container.id = "vezerlo-gombok";
    container.style.position = "fixed";
    container.style.bottom = "20px";
    container.style.left = "50%";
    container.style.transform = "translateX(-50%)";
    container.style.display = "flex";
    container.style.gap = "20px";
    container.style.zIndex = "9999";

    // GOMB 1: Kombináció Lerakása
    let btnLerakas = document.createElement("button");
    btnLerakas.innerHTML = "✅ Kombináció Lerakása";
    btnLerakas.style.padding = "15px 25px";
    btnLerakas.style.fontSize = "18px";
    btnLerakas.style.fontWeight = "bold";
    btnLerakas.style.backgroundColor = "#28a745"; // Zöld
    btnLerakas.style.color = "white";
    btnLerakas.style.border = "none";
    btnLerakas.style.borderRadius = "8px";
    btnLerakas.style.cursor = "pointer";
    btnLerakas.onclick = function() {
        if (kijelolt_kartyak.length !== 3) {
            alert("Kérlek jelölj ki pontosan 3 kártyát a kombinációhoz!");
            return;
        }
        feldolgozKombinacio();
    };

    // GOMB 2: Eldobás (Kuka)
    let btnEldobas = document.createElement("button");
    btnEldobas.innerHTML = "🗑️ Eldobás (Kuka)";
    btnEldobas.style.padding = "15px 25px";
    btnEldobas.style.fontSize = "18px";
    btnEldobas.style.fontWeight = "bold";
    btnEldobas.style.backgroundColor = "#dc3545"; // Piros
    btnEldobas.style.color = "white";
    btnEldobas.style.border = "none";
    btnEldobas.style.borderRadius = "8px";
    btnEldobas.style.cursor = "pointer";
    btnEldobas.onclick = function() {
        if (kijelolt_kartyak.length === 0) {
            alert("Nincs kijelölve kártya!");
            return;
        }
        veglegesitEldobas();
    };

    container.appendChild(btnLerakas);
    container.appendChild(btnEldobas);
    document.body.appendChild(container);
}

// --- PONT SZÁMÍTÁSI LOGIKA ---

function feldolgozKombinacio() {
    // 1. Kártyák sorbarendezése érték szerint
    let k = kijelolt_kartyak.sort((x, y) => x.carta - y.carta);
    
    let a = k[0].carta;
    let b = k[1].carta;
    let c = k[2].carta;
    
    let pont = 0;
    let valid = false;
    let uzenet = "";

    // ESET A: Egyforma számok (SZETT) - pl. 1-1-1
    if (a === b && b === c) {
        // Ellenőrizzük, hogy különböző színek-e
        let szinek = [k[0].cor, k[1].cor, k[2].cor].sort();
        // A te szabályaid szerint a szett lehet 20, 30...90 pont
        // Függetlenül attól hogy milyen színek, ha 3 egyforma szám van, az érvényes
        pont = (a * 10) + 10; 
        valid = true;
        uzenet = "Szett (+ " + pont + " pont)";
    }
    // ESET B: Sorozat (SOR) - pl. 1-2-3
    else if (a + 1 === b && b + 1 === c) {
        // Megnézzük a színeket
        let szinA = k[0].cor;
        let szinB = k[1].cor;
        let szinC = k[2].cor;

        if (szinA === szinB && szinB === szinC) {
            // AZONOS SZÍNŰ SOR
            pont = (a * 10) + 40; // pl 1-2-3 = 50 pont
            valid = true;
            uzenet = "Színes Sor (+ " + pont + " pont)";
        } else {
            // VEGYES SZÍNŰ SOR
            pont = (a * 10); // pl 1-2-3 = 10 pont
            valid = true;
            uzenet = "Vegyes Sor (+ " + pont + " pont)";
        }
    }

    if (valid) {
        // Pont hozzáadása a számlálóhoz
        hozzaadPontot(pont);
        // Alert helyett Console log vagy kis értesítés
        console.log(uzenet); 
        // Kártyák véglegesítése
        veglegesitEldobas();
    } else {
        alert("Ez nem érvényes kombináció! (Sem szett, sem sor)");
    }
}

function hozzaadPontot(pont) {
    let input = document.getElementById("sajat-pont-input");
    let jelenlegi = parseInt(input.value) || 0;
    input.value = jelenlegi + pont;
    // Triggereljük az eseményt, hogy a láda színe frissüljön
    input.dispatchEvent(new Event('input'));
}

function veglegesitEldobas() {
    // Átrakjuk a kijelölteket a 'cartas_descartadas' tömbbe
    for (let k of kijelolt_kartyak) {
        cartas_descartadas[k.cor][k.carta - 1] = true;
    }
    // Töröljük a kijelölést
    kijelolt_kartyak = [];
    
    adicionarAoHistorico();
    if (window.app) app.a++;
    ellenorizdAPontokat(); // Újraszámolja a maradék lehetőségeket
}

// --- LOGIKA (UNDO/HISTORY) ---
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
    kijelolt_kartyak = []; // History töltéskor töröljük a kijelölést
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

    div.innerHTML = `
        <div style="margin-bottom:8px; font-weight:bold;">Saját Pontom:</div>
        <input type="number" id="sajat-pont-input" style="width:80px; padding:5px; font-size:18px; text-align:center; border-radius:5px; border:none;" value="0">
        <div id="lada-eredmeny" style="margin-top:10px; font-weight:bold; font-size:18px; color:#cd7f32;">
            Vidám BRONZ láda
        </div>
    `;

    document.body.appendChild(div);

    let inputMezo = document.getElementById("sajat-pont-input");
    let eredmenyMezo = document.getElementById("lada-eredmeny");

    inputMezo.addEventListener("input", function() {
        let pont = parseInt(this.value) || 0;
        
        if (pont >= 400) {
            eredmenyMezo.innerHTML = "Vidám ARANY láda";
            eredmenyMezo.style.color = "#ffd700"; 
            div.style.border = "2px solid #ffd700";
        } else if (pont >= 300) {
            eredmenyMezo.innerHTML = "Vidám EZÜST láda";
            eredmenyMezo.style.color = "#c0c0c0"; 
            div.style.border = "2px solid #c0c0c0";
        } else {
            eredmenyMezo.innerHTML = "Vidám BRONZ láda";
            eredmenyMezo.style.color = "#cd7f32"; 
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
