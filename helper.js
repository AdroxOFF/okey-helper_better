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
let jatekVege = false; // ÚJ VÁLTOZÓ: Jelzi, ha matematikailag vége

function iniciarJogo() {
    for (let cor = 0; cor < 3; cor++) {
        cartas_descartadas.push([])
        for (let carta = 0; carta < 8; carta++)
        cartas_descartadas[cor].push(false)
    }
    
    jatekVege = false; // Új játék indulásakor reset
    adicionarAoHistorico()
    ellenorizdAPontokat(); // Első ellenőrzés
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
    // Inicializar a framework Vue.js
    window.app = new Vue({
        el: '#app',
        data: {
            a: 0,
            pontszamInfo: "Hajrá!" // ÚJ: Kiírhatjuk ide az infót
        },
        methods: {
            combinacaoDisponivel(a, b, c, d=-1) {
                this.a
                return combinacaoDisponivel(a, b, c, d)
            }
        }
    })

    // Criar uma tela para desenhar o jogo
    let canvas = createCanvas(750, ((750/8) * RA_CARTA) * 3 +1)
    canvas.parent('game')
}

function draw() {
    // Limpar canvas
    clear()
    //background(16, 16, 21)

    // Desenhar todas as cartas para selecionar
    let LARGURA_CARTA = width/8
    let ALTURA_CARTA = LARGURA_CARTA * RA_CARTA
    for (let cor = 0; cor < 3; cor++) {

        for (let carta = 1; carta <= 8; carta++) {
            // Calcular posição onde a carta deve ser desenhada
            let x, y
            
            x = LARGURA_CARTA * (carta-1)
            y = ALTURA_CARTA * cor;
        
            fill(CORES[cor])

            // Verificar se a carta ja foi utilizada
            if (cartas_descartadas[cor][carta-1]) fill(70)

            stroke(0)
            strokeWeight(1)
            rect(x, y, LARGURA_CARTA, ALTURA_CARTA)

            // Desenhar valor da carta
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

            // --- ÚJ RÉSZ: X RAJZOLÁSA ---
            // Ha a játék véget ért (nincs meg a 300), és a kártya még nincs kiválasztva (nem szürke),
            // akkor húzzuk át pirossal, jelezve, hogy felesleges.
            if (jatekVege && !cartas_descartadas[cor][carta-1]) {
                stroke(255, 0, 0); // Piros szín
                strokeWeight(5);
                line(x, y, x + LARGURA_CARTA, y + ALTURA_CARTA);
                line(x + LARGURA_CARTA, y, x, y + ALTURA_CARTA);
            }
        }
    }
}


function mousePressed() {
    // Ha vége a lehetőségnek, ne engedjen kattintani (kivéve ha undo gombra kattintunk, de az HTML-ben van)
    // if (jatekVege) return; // Ezt kiveheted, ha azt akarod, hogy kattinthassanak még, csak lássák az X-et.

    // Verificar se o utilizador carregou fora do canvas
    if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height)
        return

    let LARGURA_CARTA = width / 8
    let ALTURA_CARTA = LARGURA_CARTA * RA_CARTA

    // Verificar se o utilizador escolheu uma carta
    if (mouseY < ALTURA_CARTA * 3) {
        // Obter carta escolhida pelo utilizador
        let cor = ~~(mouseY / (height/3)) 
        
        let x = floor(mouseX / LARGURA_CARTA)
        let carta = x % 8 + 1

        // Csak akkor engedjük, ha még nincs kiválasztva
        if (!cartas_descartadas[cor][carta-1]) {
             cartas_descartadas[cor][carta-1] = true
             adicionarAoHistorico()
             app.a++
             ellenorizdAPontokat() // Minden kattintás után újraszámolunk!
        }
    }
}

/* Funções relativas ao historico */
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
    ellenorizdAPontokat() // Undo/Redo után is ellenőrizni kell
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
    // Ordenar cartas pelos valores
    let ord = [a, b, c].sort()
    a = ord[0]
    b = ord[1]
    c = ord[2]

    // Verificar se a combinação são de cartas com o mesmo valor (Szettek)
    if (a == b && b == c) {
        return cartaDisponivel(a, 0) && cartaDisponivel(a, 1) && cartaDisponivel(a, 2)
    }

    // Verificar se é uma sequencia (Sorok)
    if (a + 1 == b && b + 1 == c) {
        // Verificar se a sequencia pode ser de qualquer cor (Vegyes szín)
        if (cor == -1) {
            return (cartaDisponivel(a, 0) || cartaDisponivel(a, 1) || cartaDisponivel(a, 2)) 
                && (cartaDisponivel(b, 0) || cartaDisponivel(b, 1) || cartaDisponivel(b, 2))
                && (cartaDisponivel(c, 0) || cartaDisponivel(c, 1) || cartaDisponivel(c, 2))
        }

        // Azonos szín
        return cartaDisponivel(a, cor) && cartaDisponivel(b, cor) && cartaDisponivel(c, cor)
    }
    return false;
}


// --- ÚJ FÜGGVÉNY: EZ SZÁMOLJA KI A MATEMATIKÁT ---
function ellenorizdAPontokat() {
    let maxPont = 0;

    // 1. SZETTEK (Egyforma számok: 1-1-1 ... 8-8-8)
    // Pontok: 20, 30, 40, 50, 60, 70, 80, 90
    for (let i = 1; i <= 8; i++) {
        if (combinacaoDisponivel(i, i, i)) {
            maxPont += (i * 10) + 10; // Pl: 1-esek: 20 pont, 2-esek: 30 pont
        }
    }

    // 2. VEGYES SZÍNŰ SOROK (1-2-3 ... 6-7-8)
    // Pontok: 10, 20, 30, 40, 50, 60
    for (let i = 1; i <= 6; i++) {
        if (combinacaoDisponivel(i, i+1, i+2)) { // cor=-1 alapértelmezett
            maxPont += (i * 10); // Pl: 1-2-3: 10 pont
        }
    }

    // 3. AZONOS SZÍNŰ SOROK (Kék 1-2-3, Piros 1-2-3...)
    // Pontok: 50, 60, 70, 80, 90, 100
    for (let c = 0; c < 3; c++) { // 3 szín
        for (let i = 1; i <= 6; i++) { // 1-től 6-ig kezdődhet a sor
            if (combinacaoDisponivel(i, i+1, i+2, c)) {
                maxPont += (i * 10) + 40; // Pl: 1-2-3: 50 pont, 2-3-4: 60 pont
            }
        }
    }

    console.log("Jelenleg elérhető max pontszám:", maxPont);

    // HA KEVESEBB MINT 300, akkor GAME OVER
    if (maxPont < 300) {
        jatekVege = true;
    } else {
        jatekVege = false;
    }
}
