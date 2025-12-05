// =============================================================
// MÓDOSÍTOTT LOGIKA: PONT SZINKRONIZÁLÁS
// =============================================================

function carregarDoHistorico(pos) {
    let dados = JSON.parse(JSON.stringify(historico.dados[pos]));
    
    // 1. Kártyák visszaállítása
    cartas_descartadas = dados.cartas_descartadas;
    
    // 2. Pontszám visszaállítása (Ez hiányzott)
    let input = document.getElementById("sajat-pont-input");
    if(input) {
        // Ha van mentett pont, azt állítjuk be, ha nincs (régi állapot), akkor 0-t
        input.value = dados.pont || 0; 
        // Frissítjük a színeket (bronz/ezüst/arany)
        input.dispatchEvent(new Event('input')); 
    }

    if (window.app) app.a++;
    ellenorizdAPontokat();
}

function adicionarAoHistorico() {
    // Ha "visszaléptünk" és újat lépünk, töröljük a jövőt
    if (historico.pos + 1 < historico.dados.length) {
        historico.dados.splice(historico.pos + 1, historico.dados.length - historico.pos);
    }

    // Jelenlegi pontszám megszerzése
    let jelenlegiPont = 0;
    let input = document.getElementById("sajat-pont-input");
    if(input) jelenlegiPont = parseInt(input.value) || 0;

    // Mentés az előzményekbe (Kártyák + Pontszám)
    historico.dados.push(JSON.parse(JSON.stringify({ 
        cartas_descartadas: cartas_descartadas,
        pont: jelenlegiPont 
    })));
    
    historico.pos++;
}
