var RA_CARTA = 1.39; // Relação de aspeto da carta (64:89)
var CORES = [
    [35, 85, 172], // Kék
    [163, 12, 19], // Piros
    [225, 182, 21] // Sárga
];

var CSS_SZINEK = ["#4da6ff", "#ff4d4d", "#ffd700"];
var SZIN_NEVEK = ["Kék", "Piros", "Sárga"];

var historico = {
    pos: -1,
    dados: []
};

var cartas_descartadas = [];
var jatekVege = false;

function iniciarJogo() {
    cartas_descartadas = [];
    for (var cor = 0; cor < 3; cor++) {
        cartas_descartadas.push([]);
        for (var carta = 0; carta < 8; carta++) {
            cartas_descartadas[cor].push(false);
        }
    }
    
    jatekVege = false;
    adicionarAoHistorico();
    // Csak akkor számolunk, ha már létezik a kijelző
    setTimeout(ellenorizdAPontokat, 100); 
}

function setup() {
    // Kijelzők létrehozása LEGFELÜL, hogy biztosan meglegyenek
    kijelzoLetrehozasa();
    tablazatLetrehozasa();

    // Hóesés effekt (opcionális)
    var d = new Date();
    if (d.getMonth() > 10 || d.getMonth() < 2) {
        var head = document.querySelector('head');
        var script = document.createElement('script');
        script.src = 'snow.js';
        script.type = 'text/javascript';
        head.appendChild(script);
    }

    iniciarJogo();

    // Vue.js inicializálás
    window.app = new Vue({
        el: '#app',
        data: {
            a: 0
        },
        methods: {
            combinacaoDisponivel: function(a, b, c, d) {
                if (d === undefined) d = -1;
                this.a;
                return combinacaoDisponivel(a, b, c, d);
            }
        }
    });

    // Canvas létrehozása
    var canvas = createCanvas(750, ((750/8) * RA_CARTA) * 3 + 1);
    canvas.parent('game');
}

function draw() {
    clear();
    
    var LARGURA_CARTA = width / 8;
    var ALTURA_CARTA = LARGURA_CARTA * RA_CARTA;

    for (var cor = 0; cor < 3; cor++) {
        for (var carta = 1; carta <= 8; carta++) {
            var x = LARGURA_CARTA * (carta - 1);
            var y = ALTURA_CARTA * cor;
        
            fill(CORES[cor]);
            
            // Ha ki van választva, legyen szürke
            if (cartas_descartadas[cor][carta - 1]) {
                fill(70);
            }

            stroke(0);
            strokeWeight(1);
            rect(x, y, LARGURA_CARTA, ALTURA_CARTA);

            // Számok
            var centroX = x + (LARGURA_CARTA / 2);
            var centroY = y + (ALTURA_CARTA / 2);

            fill(255);
            textAlign(CENTER, CENTER);
            textSize(24);
            stroke(0);
            strokeWeight(3);
            text(carta, centroX, centroY);

            // Piros X, ha vége a játéknak és a kártya még nincs kiválasztva
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

    var LARGURA_CARTA = width / 8;
    var ALTURA_CARTA = LARGURA_CARTA * RA_CARTA;

    if (mouseY < ALTURA_CARTA * 3) {
        var cor = Math.floor(mouseY / (height / 3));
        var x = Math.floor(mouseX / LARGURA_CARTA);
        var carta = (x % 8) + 1;

        // Hibakezelés, ha véletlen rossz helyre kattintanánk
        if (cor >= 0 && cor < 3 && carta >= 1 && carta <= 8) {
            if (!cartas_descartadas[cor][carta - 1]) {
                 cartas_descartadas[cor][carta - 1] = true;
                 adicionarAoHistorico();
                 app.a++;
                 ellenorizdAPontokat();
            }
        }
    }
}

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
    var dados = JSON.parse(JSON.stringify(historico.dados[pos]));
    cartas_descartadas = dados.cartas_descartadas;
    app.a++;
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
    return !cartas_descartadas[cor][carta - 1];
}

function combinacaoDisponivel(a, b, c, cor) {
    if (cor === undefined) cor = -1;
    
    var ord = [a, b, c].sort();
    a = ord[0];
    b = ord[1];
    c = ord[2];

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

// --- KIJELZŐK (Egyszerűsített stílus) ---
function kijelzoLetrehozasa() {
    var div = document.createElement("div");
    div.id = "pont-kijelzo";
    div.style.position = "fixed";
    div.style.top = "10px";
    div.style.right = "10px";
    div.style.backgroundColor = "rgba(0,0,0,0.9)";
    div.style.color = "white";
    div.style.padding = "10px";
    div.style.borderRadius = "8px";
    div.style.fontFamily = "Arial";
    div.style.fontWeight = "bold";
    div.style.border = "2px solid gold";
    div.style.zIndex = "1000";
    div.innerHTML = "Számolás...";
    document.body.appendChild(div);
}

function tablazatLetrehozasa() {
    var div = document.createElement("div");
    div.id = "kombinacio-tablazat";
    div.style.position = "fixed";
    div.style.top = "10px";
    div.style.left = "10px";
    div.style.backgroundColor = "rgba(0,0,0,0.9)";
    div.style.color = "white";
    div.style.padding = "10px";
    div.style.borderRadius = "8px";
    div.style.fontFamily = "monospace";
    div.style.border = "1px solid #555";
    div.style.zIndex = "1000";
    div.style.maxWidth = "300px";
    div.innerHTML = "Betöltés...";
    document.body.appendChild(div);
}

function ellenorizdAPontokat() {
    var maxPont = 0;
    var html = "<h4 style='margin:0 0 10px 0'>Még kirakható:</h4>";

    // 1. SZETTEK
    for (var i = 1; i <= 8; i++) {
        if (combinacaoDisponivel(i, i, i)) {
            maxPont += (i * 10) + 10;
        }
    }

    // 2. VEGYES SZÍN
    for (var i = 1; i <= 6; i++) {
        if (combinacaoDisponivel(i, i + 1, i + 2)) {
            maxPont += (i * 10);
        }
    }

    // 3. AZONOS SZÍN (Táblázat építése hagyományos módszerrel)
    for (var c = 0; c < 3; c++) {
        html += "<div style='color:" + CSS_SZINEK[c] + "'><strong>" + SZIN_NEVEK[c] + ": </strong>";
        var vanSor = false;
        
        for (var i = 1; i <= 6; i++) {
            if (combinacaoDisponivel(i, i + 1, i + 2, c)) {
                maxPont += (i * 10) + 40;
                html += " [" + i + "-" + (i + 1) + "-" + (i + 2) + "] ";
                vanSor = true;
            }
        }
        
        if (!vanSor) html += " - ";
        html += "</div>";
    }

    // Frissítés
    var tablazat = document.getElementById("kombinacio-tablazat");
    if (tablazat) tablazat.innerHTML = html;

    var kijelzo = document.getElementById("pont-kijelzo");
    if (kijelzo) {
        kijelzo.innerHTML = "Max pont: " + maxPont;
        if (maxPont < 300) {
            kijelzo.style.borderColor = "red";
            kijelzo.style.color = "#ff8888";
            kijelzo.innerHTML += "<br>(Nincs meg a 300!)";
            jatekVege = true;
        } else {
            kijelzo.style.borderColor = "gold";
            kijelzo.style.color = "white";
            jatekVege = false;
        }
    }
}
