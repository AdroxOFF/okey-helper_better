function ellenorizdAPontokat() {
    let baseBtnStyle = "cursor:pointer; padding:6px 12px; margin:3px; display:inline-block; border-radius:6px; font-weight:bold; border:1px solid rgba(255,255,255,0.3); text-align:center; vertical-align:middle;";
    let html = "<h4 style='margin:0 0 10px 0; text-align:center; color:white;'>Még kirakható:</h4>";

    let allCandidates = [];

    try {
        // -----------------------------------------------------------
        // 1. GENERÁLÁS (Ez a rész változatlan, csak a gyűjtés)
        // -----------------------------------------------------------

        // 0. Vegyes Sorok
        let vanVegyes = false;
        let vegyesHtml = `<div style="border-bottom:1px solid #444; padding-bottom:5px; margin-bottom:5px;"><strong>Vegyes sorok:</strong><br>`;
        for (let i = 1; i <= 6; i++) {
             if (combinacaoDisponivel(i, i + 1, i + 2)) {
                let pont = (i * 10);
                
                let mixedCards = [];
                let colorsFound = [];
                let nums = [i, i+1, i+2];
                for(let n of nums) {
                    for(let c=0; c<3; c++) {
                        if(!cartas_descartadas[c][n-1] && !colorsFound.includes(c)) {
                            mixedCards.push({c:c, v:n});
                            colorsFound.push(c);
                            break;
                        }
                    }
                }
                
                if(mixedCards.length === 3) {
                    // Megjelöljük a nevet is a kijelzőhöz
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

        // -----------------------------------------------------------
        // 2. OPTIMALIZÁLÁS ÉS KIJELZÉS FRISSÍTÉSE
        // -----------------------------------------------------------
        
        // Itt kapjuk meg az objektumot: { score: 150, moves: [...] }
        let resultObj = calculateMaxDisjointScore(allCandidates, new Set());
        let realMaxPoints = resultObj.score;
        let bestMoves = resultObj.moves;

        // Táblázat (bal oldali menü) frissítése
        let tablazat = document.getElementById("kombinacio-tablazat");
        if (tablazat) tablazat.innerHTML = html;

        if (allCandidates.length === 0) nincsTobbLehetoseg = true;
        else nincsTobbLehetoseg = false;

        // --- JOBB FELSŐ KIJELZŐ LOGIKA ---
        let kijelzo = document.getElementById("pont-kijelzo");
        let sajatPont = parseInt(document.getElementById("sajat-pont-input").value) || 0;
        let osszesPotencial = sajatPont + realMaxPoints;

        if (kijelzo) {
            kijelzo.style.display = "none"; 
            
            if (!nincsTobbLehetoseg && allCandidates.length > 0) {
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
                    reszletek = "<div style='margin-top:5px; font-size:11px; text-align:right; color:#ddd; border-top:1px solid #555; padding-top:3px;'>";
                    bestMoves.forEach(m => {
                        reszletek += `+ ${m.name} (${m.points})<br>`;
                    });
                    reszletek += "</div>";
                }

                kijelzo.style.display = "block";
                kijelzo.style.borderColor = statuszColor;
                kijelzo.style.color = statuszColor;
                
                // HTML Összeállítása
                kijelzo.innerHTML = `
                    <div style="font-size:18px; margin-bottom:2px;">Elérhető: ${statuszText}</div>
                    <div style="font-size:14px; color:white;">Max pont: ${osszesPotencial}</div>
                    ${reszletek}
                `;
            }
        }

    } catch (e) { console.error(e); }
}
