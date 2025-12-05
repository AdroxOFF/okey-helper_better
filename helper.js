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
        cartas
