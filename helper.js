const RA_CARTA = 1.39 
const CORES = [
    [35, 85, 172], // Kék (RGB)
    [163, 12, 19], // Piros (RGB)
    [225, 182, 21] // Sárga (RGB)
]

// CSS színek a szöveges kiíráshoz (hogy jól látsszon a fekete háttéren)
const CSS_SZINEK = [
    "#4da6ff", // Világos kék
    "#ff4d4d", // Világos piros
    "#ffd700"  // Arany sárga
];

const SZIN_NEVEK = ["Kék", "Piros", "Sárga"];

let historico = {
    pos: -1,
    dados: []
}

let cartas_descartadas = []       
let jatekVege = false; 

function iniciarJogo() {
    for (let cor = 0; cor < 3; cor++) {
        cartas_descartadas.push([])
        for (let carta = 0; carta < 8; carta++)
        cartas_descartadas[cor].push(false)
    }
    
    jatekVege = false; 
    adicionarAoHistorico()
    ellenorizdAPontokat(); 
}

function setup() {
    let d = new Date()
    if (d.getMonth() > 10 || d.getMonth() < 2) {
        let head = document.querySelector('head')
        let script = document.createElement('script')
        script.src = 'snow.js'
        script.type = 'text/javascript'
        head.appendChild(script)
    }

    iniciarJogo()
    
    // Létrehozzuk a két kijelzőt
    kijelzoLetrehozasa();   // Jobb oldal (Pontok)
    tablazatLetrehozasa();  // Bal oldal (Kombinációk)

    window.app = new Vue({
        el: '#app',
        data: {
            a: 0
        },
        methods: {
            combinacaoDisponivel(a, b, c, d=-1) {
                this.a
                return combinacaoDisponivel(a, b, c, d)
            }
        }
    })

    let canvas = createCanvas(750, ((750/8) * RA_CARTA) * 3 +1)
    canvas.parent('game')
}

function draw() {
    clear()
    
    let LARGURA_CARTA = width/8
    let ALTURA_CARTA = LARGURA_CARTA * RA_CARTA
    for (let cor = 0; cor < 3; cor++) {

        for (let carta = 1; carta <= 8; carta++) {
            let x, y
            x = LARGURA_CARTA * (carta-1)
            y = ALTURA_CARTA * cor;
        
            fill(CORES[cor])
            if (cartas_descartadas[cor][carta-1]) fill(70) 

            stroke(0)
            strokeWeight(1)
            rect(x, y, LARGURA_CARTA, ALTURA_CARTA)

            let centro = {
                x: x + (LARGURA_CARTA / 2),
                y: y + (ALTURA_CARTA / 2)
            }

            fill(255)
            textAlign(CENTER, CENTER)
            textSize(24)
            stroke(0)
            strokeWeight(3)
            text(carta, centro.x, centro.y)

            if (jatekVege && !cartas_descartadas[cor][carta-1]) {
                stroke(255, 0, 0); 
                strokeWeight(5);
                line(x, y, x + LARGURA_CARTA, y + ALTURA_CARTA);
                line(x + LARGURA_CARTA, y, x, y + ALTURA_CARTA);
            }
        }
    }
}


function mousePressed() {
    if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height)
        return

    let LARGURA_CARTA = width / 8
    let ALTURA_CARTA = LARGURA_CARTA * RA_CARTA

    if (mouseY < ALTURA_CARTA * 3) {
        let cor = ~~(mouseY / (height/3)) 
        
        let x = floor(mouseX / LARGURA_CARTA)
        let carta = x % 8 + 1

        if (!cartas_descartadas[cor][carta-1]) {
             cartas_descartadas[cor][carta-1] = true
             adicionarAoHistorico()
             app.a++
             ellenorizdAPontokat() 
        }
    }
}

function limpar() {
    historico.pos = 1
    desfazer()
}

function desfazer() {
    if (historico.pos < 1)
        return

    carregarDoHistorico(--historico.pos)
}

function refazer() {
    if (historico.pos >= historico.dados.length - 1)
        return
    
    carregarDoHistorico(++historico.pos)
}

function carregarDoHistorico(pos) {
    let dados = JSON.parse(JSON.stringify(historico.dados[pos]))

    cartas_descartadas = dados.cartas_descartadas
    app.a++
    ellenorizdAPontokat() 
}

function adicionarAoHistorico() {
    if (historico.pos + 1 < historico.dados.length)
        historico.dados.splice(historico.pos + 1, historico.dados.length - historico.pos)
    
    historico.dados.push(
        JSON.parse(
            JSON.stringify(
                {
                    cartas_descartadas
                }
            )
        )
    )

    historico.pos++
}

function cartaDisponivel(carta, cor) {
    return !cartas_descartadas[cor][carta-1]
}


function combinacaoDisponivel(a, b, c, cor=-1) {
    let ord = [a, b, c].sort()
    a = ord[0]
    b = ord[1]
    c = ord[2]

    if (a == b && b == c) {
        return cartaDisponivel(a, 0) && cartaDisponivel(a, 1) && cartaDisponivel(a, 2)
    }

    if (a + 1 == b && b + 1 == c) {
        if (cor == -1) {
            return (cartaDisponivel(a, 0) || cartaDisponivel(a, 1) || cartaDisponivel(a, 2)) 
                && (cartaDisponivel(b, 0) || cartaDisponivel(b, 1) || cartaDisponivel(b, 2))
                && (cartaDisponivel(c, 0) || cartaDisponivel(c, 1) || cartaDisponivel(c, 2))
        }
        return cartaDisponivel(a, cor) && cartaDisponivel(b, cor) && cartaDisponivel(c, cor)
    }
    return false;
}

// --- JOBB OLDALI KIJELZŐ (PONTOK) ---
function kijelzoLetrehozasa() {
    let div = document.createElement("div");
    div.id = "pont-kijelzo";
    div.style.position = "fixed";
    div.style.top = "20px";
    div.style.right = "20px";
    div.style.backgroundColor = "rgba(0, 0, 0, 0.85)";
    div.style.color = "white";
    div.style.padding = "15px 25px";
    div.style.borderRadius = "12px";
    div.style.fontFamily = "Arial, sans-serif";
    div.style.fontSize = "22px";
    div.style.fontWeight = "bold";
    div.style.border = "3px solid #ffd700";
    div.style.boxShadow = "0 4px 8px rgba(0,0,0,0.5)";
    div.style.zIndex = "9999";
    div.innerHTML = "Számolás...";
    document.body.appendChild(div);
}

// --- ÚJ: BAL OLDALI TÁBLÁZAT (KOMBINÁCIÓK) ---
function tablazatLetrehozasa() {
    let div = document.createElement("div");
    div.id = "kombinacio-tablazat";
    div.style.position = "fixed";
    div.style.top = "20px";
    div.style.left = "20px"; // Bal oldal
    div.style.backgroundColor = "rgba(0, 0, 0, 0.9)";
    div.style.color = "white";
    div.style.padding = "15px";
    div.style.borderRadius = "12px";
    div.style.fontFamily = "Consolas, monospace"; // Hogy szépen igazodjon
    div.style.fontSize = "16px";
    div.style.border = "2px solid #555";
    div.style.boxShadow = "0 4px 8px rgba(0,0,0,0.5)";
    div.style.zIndex = "9999";
    div.style.maxWidth = "350px";
    div.innerHTML = "Betöltés...";
    document.body.appendChild(div);
}

// --- FŐ LOGIKA: PONTOK ÉS TÁBLÁZAT FRISSÍTÉSE ---
function ellenorizdAPontokat() {
    let maxPont = 0;
    
    // HTML tartalom előkészítése a bal oldali táblázathoz
    let tablazatHTML = "<h3 style='margin:0 0 10px 0; text-align:center;'>Még kirakható sorok:</h3>";

    // 1. SZETTEK (Ezt nem írjuk ki a táblázatba, csak a pontot számoljuk, hogy ne legyen zsúfolt)
    for (let i = 1; i <= 8; i++) {
        if (combinacaoDisponivel(i, i, i)) {
            maxPont += (i * 10) + 10; 
        }
    }

    // 2. VEGYES SZÍNŰ SOROK (Szintén csak pont)
    for (let i = 1; i <= 6; i++) {
        if (combinacaoDisponivel(i, i+1, i+2)) { 
            maxPont += (i * 10); 
        }
    }

    // 3. AZONOS SZÍNŰ SOROK (Ezeket listázzuk ki!)
    for (let c = 0; c < 3; c++) { 
        // Szín fejléc (pl. Kék:)
        tablazatHTML += `<div style='margin-bottom:5
