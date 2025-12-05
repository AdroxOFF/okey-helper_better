const RA_CARTA = 1.39 // Relação de aspeto da carta (64:89)
const CORES = [
    [35, 85, 172], // Kék
    [163, 12, 19], // Piros
    [225, 182, 21] // Sárga
]

let historico = {
    pos: -1,
    dados: []
}

let cartas_descartadas = []       // Cartas que já foram utilizadas
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
    // Add snow
    let d = new Date()
    if (d.getMonth() > 10 || d.getMonth() < 2) {
        let head = document.querySelector('head')
        let script = document.createElement('script')
        script.src = 'snow.js'
        script.type = 'text/javascript'
        head.appendChild(script)
    }

    iniciarJogo()
    
    // --- ÚJ: Kijelző létrehozása az oldal betöltésekor ---
    kijelzoLetrehozasa();

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
            if (cartas_descartadas[cor][carta-1]) fill(70) // Szürke, ha kiválasztva

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

            // Piros X rajzolása, ha már nincs meg a 300 pont
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

// --- ÚJ FUNKCIÓ: Létrehozza a vizuális ablakot a jobb felső sarokban ---
function kijelzoLetrehozasa() {
    let div = document.createElement("div");
    div.id = "pont-kijelzo";
    // Stílus beállítások (Fekete háttér, fehér szöveg, jobb felül fixen)
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
    div.style.border = "3px solid #ffd700"; // Arany keret
    div.style.boxShadow = "0 4px 8px rgba(0,0,0,0.5)";
    div.style.zIndex = "9999"; // Hogy biztosan minden felett legyen
    div.innerHTML = "Számolás...";
    
    document.body.appendChild(div);
}

// --- MÓDOSÍTOTT SZÁMOLÓ: Kiírja az eredményt az ablakba ---
function ellenorizdAPontokat() {
    let maxPont = 0;

    // 1. SZETTEK
    for (let i = 1; i <= 8; i++) {
        if (combinacaoDisponivel(i, i, i)) {
            maxPont += (i * 10) + 10; 
        }
    }

    // 2. VEGYES SZÍNŰ SOROK
    for (let i = 1; i <= 6; i++) {
        if (combinacaoDisponivel(i, i+1, i+2)) { 
            maxPont += (i * 10); 
        }
    }

    // 3. AZONOS SZÍNŰ SOROK
    for (let c = 0; c < 3; c++) { 
        for (let i = 1; i <= 6; i++) { 
            if (combinacaoDisponivel(i, i+1, i+2, c)) {
                maxPont += (i * 10) + 40; 
            }
        }
    }

    // --- FRISSÍTJÜK A KIJELZŐT ---
    let kijelzo = document.getElementById("pont-kijelzo");
    if (kijelzo) {
        kijelzo.innerHTML = "Még elérhető: " + maxPont;
        
        // Ha kevesebb, mint 300, legyen PIROS a keret és a szöveg
        if (maxPont < 300) {
            kijelzo.style.borderColor = "red";
            kijelzo.style.color = "#ff6666";
            kijelzo.innerHTML += "<br><span style='font-size:16px'>(Nincs meg a 300!)</span>";
            jatekVege = true;
        } else {
            // Ha még jó, legyen ARANY/ZÖLD
            kijelzo.style.borderColor = "#ffd700";
            kijelzo.style.color = "white";
            jatekVege = false;
        }
    }
}
