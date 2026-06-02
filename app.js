/**
 * Score Cekih by Sadewa Corp
 * Pure JavaScript - Engine System
 */

// Voice Queue Engine Object
const VoiceQueueManager = {
    queue: [],
    isSpeaking: false,
    
    speak(text) {
        if (!text) return;
        this.queue.push(text);
        this.processQueue();
    },
    
    processQueue() {
        if (this.isSpeaking || this.queue.length === 0) return;
        
        this.isSpeaking = true;
        const currentText = this.queue.shift();
        
        const utterance = new SpeechSynthesisUtterance(currentText);
        utterance.lang = 'id-ID';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        
        utterance.onend = () => {
            this.isSpeaking = false;
            // Introduce a short gap for separation clarity
            setTimeout(() => { this.processQueue(); }, 250);
        };
        
        utterance.onerror = () => {
            this.isSpeaking = false;
            setTimeout(() => { this.processQueue(); }, 250);
        };
        
        window.speechSynthesis.speak(utterance);
    }
};

// Numeric Conversion Utility for Bahasa Indonesia
function numberToBahasaIndonesia(num) {
    if (num === 0) return "nol";
    
    let result = "";
    let temp = num;
    
    if (temp < 0) {
        result += "minus ";
        temp = Math.abs(temp);
    }
    
    const units = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sebelas"];
    
    if (temp === 10) return result + "sepuluh";
    if (temp === 11) return result + "sebelas";
    
    if (temp < 12) {
        return result + units[temp];
    }
    
    if (temp < 20) {
        return result + units[temp - 10] + " belas";
    }
    
    if (temp < 100) {
        let pull = Math.floor(temp / 10);
        let sisa = temp % 10;
        return result + units[pull] + " puluh " + (sisa > 0 ? units[sisa] : "");
    }
    
    if (temp < 1000) {
        let ratus = Math.floor(temp / 100);
        let sisa = temp % 100;
        let prefix = ratus === 1 ? "seratus " : units[ratus] + " ratus ";
        let sisaText = sisa > 0 ? numberToBahasaIndonesia(sisa) : "";
        return result + prefix + sisaText;
    }
    
    if (temp === 1000) {
        return result + "seribu";
    }
    
    if (temp < 1000000) {
        let ribu = Math.floor(temp / 1000);
        let sisa = temp % 1000;
        let prefix = ribu === 1 ? "seribu " : numberToBahasaIndonesia(ribu) + " ribu ";
        let sisaText = sisa > 0 ? numberToBahasaIndonesia(sisa) : "";
        return result + prefix + sisaText;
    }
    
    return result + String(temp);
}

// Sound FX Controller Engine
const SoundController = {
    play(soundName) {
        try {
            const audio = new Audio(soundName);
            audio.play().catch(err => console.log("Audio play blocked/failed:", err));
        } catch (e) {
            console.error("Audio error:", e);
        }
    }
};

// Application State Schema Data Definitions
let gameState = {
    currentScreen: 'setup', // 'setup' or 'gameplay'
    ronde: 1,
    puteran: 1,
    target: 1000,
    players: {
        p1: { name: 'Pemain A', score: 0, stars: 0, burns: 0, burned: 0, tripleBurn: 0, highestScore: 0 },
        p2: { name: 'Pemain B', score: 0, stars: 0, burns: 0, burned: 0, tripleBurn: 0, highestScore: 0 },
        p3: { name: 'Pemain C', score: 0, stars: 0, burns: 0, burned: 0, tripleBurn: 0, highestScore: 0 },
        p4: { name: 'Pemain D', score: 0, stars: 0, burns: 0, burned: 0, tripleBurn: 0, highestScore: 0 }
    },
    history: [], // Elements: { ronde, puteran, scores: {p1, p2, p3, p4}, events: [] }
    arsip: {} // Permanent record map: key = name string -> permanent statistics fields
};

// LocalStorage Persistent Engine Sync
const StorageManager = {
    save() {
        localStorage.setItem('sadewa_score_cekih_state', JSON.stringify(gameState));
    },
    load() {
        const data = localStorage.getItem('sadewa_score_cekih_state');
        if (data) {
            try {
                const parsed = JSON.parse(data);
                if (parsed && typeof parsed === 'object') {
                    gameState = parsed;
                    return true;
                }
            } catch (e) {
                console.error("Error reading saved state:", e);
            }
        }
        return false;
    }
};

// Core Flow Controller
document.addEventListener('DOMContentLoaded', () => {
    runLoadingScreen();
    initializeInterfaceListeners();
});

function runLoadingScreen() {
    const bar = document.getElementById('loading-bar');
    let progress = 0;
    
    const interval = setInterval(() => {
        progress += 10;
        bar.style.width = progress + '%';
        
        if (progress >= 100) {
            clearInterval(interval);
            
            // Finish checking and bootstrap data state
            const hasData = StorageManager.load();
            
            setTimeout(() => {
                const loader = document.getElementById('loading-screen');
                loader.style.opacity = '0';
                setTimeout(() => {
                    loader.classList.add('hidden');
                    // Direct to appropriate screen view
                    if (hasData && gameState.currentScreen === 'gameplay') {
                        switchScreen('gameplay');
                        refreshGameplayUI();
                    } else {
                        switchScreen('setup');
                        prefillSetupForm();
                    }
                }, 600);
            }, 300);
        }
    }, 150);
}

function switchScreen(screenName) {
    gameState.currentScreen = screenName;
    StorageManager.save();
    
    if (screenName === 'setup') {
        document.getElementById('screen-setup').classList.remove('hidden');
        document.getElementById('screen-gameplay').classList.add('hidden');
    } else {
        document.getElementById('screen-setup').classList.add('hidden');
        document.getElementById('screen-gameplay').classList.remove('hidden');
    }
}

function prefillSetupForm() {
    document.getElementById('target-point').value = gameState.target || 1000;
    document.getElementById('p1-name').value = gameState.players.p1.name;
    document.getElementById('p2-name').value = gameState.players.p2.name;
    document.getElementById('p3-name').value = gameState.players.p3.name;
    document.getElementById('p4-name').value = gameState.players.p4.name;
}

// Wire and Bind UI Interactive Component Handlers
function initializeInterfaceListeners() {
    // Top bar triggers
    document.getElementById('btn-fullscreen').addEventListener('click', toggleFullscreenView);
    document.getElementById('btn-theme').addEventListener('click', toggleColorThemeMode);
    
    // Setup Action Trigger
    document.getElementById('btn-start-game').addEventListener('click', processSetupSubmission);
    
    // Gameplay Control Triggers
    document.getElementById('btn-ganti-ronde').addEventListener('click', triggerGantiRondeFlow);
    document.getElementById('btn-simpan-puteran').addEventListener('click', processScorePuteranInput);
    document.getElementById('btn-screenshot').addEventListener('click', handleCaptureFakeSnapshot);
    document.getElementById('btn-hapus-arsip').addEventListener('click', triggerClearPermanentArsip);
    document.getElementById('btn-reset-game').addEventListener('click', triggerResetGameFlow);
    
    // Sub-tab Navigation Panel Link Bindings
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            tabButtons.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            
            btn.classList.add('active');
            const targetedId = btn.getAttribute('data-tab');
            document.getElementById(targetedId).classList.add('active');
        });
    });
}

// Screen and Fullscreen Modules
function toggleFullscreenView() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
}

function toggleColorThemeMode() {
    const body = document.body;
    if (body.classList.contains('dark-mode')) {
        body.classList.remove('dark-mode');
        body.classList.add('light-mode');
    } else {
        body.classList.remove('light-mode');
        body.classList.add('dark-mode');
    }
}

// Sync Player Permanent Archives Map Registry Entries
function syncPlayerArchiveRegistration(nameStr) {
    if (!nameStr) return;
    const cleanKey = nameStr.trim();
    if (!gameState.arsip) gameState.arsip = {};
    
    if (!gameState.arsip[cleanKey]) {
        gameState.arsip[cleanKey] = {
            name: cleanKey,
            stars: 0,
            burns: 0,
            burned: 0,
            tripleBurn: 0,
            highestScore: 0
        };
    }
}

// Process Match Initial Setup Configuration Setup Form
function processSetupSubmission() {
    const tVal = parseInt(document.getElementById('target-point').value) || 1000;
    const n1 = document.getElementById('p1-name').value.trim() || 'Pemain A';
    const n2 = document.getElementById('p2-name').value.trim() || 'Pemain B';
    const n3 = document.getElementById('p3-name').value.trim() || 'Pemain C';
    const n4 = document.getElementById('p4-name').value.trim() || 'Pemain D';
    
    gameState.target = tVal;
    
    // Bind structures with dynamic archive fetch logic or defaults
    const keyBind = [n1, n2, n3, n4];
    const originalKeys = ['p1', 'p2', 'p3', 'p4'];
    
    originalKeys.forEach((key, idx) => {
        const nameVal = keyBind[idx];
        syncPlayerArchiveRegistration(nameVal);
        
        // Retain running round score parameters but bind name explicitly
        gameState.players[key].name = nameVal;
    });
    
    switchScreen('gameplay');
    refreshGameplayUI();
}

function triggerGantiRondeFlow() {
    // Increase active round number increment parameters
    gameState.ronde += 1;
    gameState.puteran = 1;
    
    // Reset round scores back to 0 baseline status for clean round start
    for (let k in gameState.players) {
        gameState.players[k].score = 0;
    }
    
    switchScreen('setup');
    document.getElementById('setup-title').textContent = `Setup Ronde ${gameState.ronde}`;
    prefillSetupForm();
}

// Refresh Gameplay Main UI Container Grid & Layout Display Panel elements
function refreshGameplayUI() {
    // Top headers
    document.getElementById('display-ronde').textContent = `Ronde ${gameState.ronde}`;
    document.getElementById('display-puteran').textContent = `Puteran ${gameState.puteran}`;
    document.getElementById('display-target').textContent = gameState.target;
    
    // Update Input Score Label Texts
    document.getElementById('lbl-p1').textContent = gameState.players.p1.name;
    document.getElementById('lbl-p2').textContent = gameState.players.p2.name;
    document.getElementById('lbl-p3').textContent = gameState.players.p3.name;
    document.getElementById('lbl-p4').textContent = gameState.players.p4.name;
    
    // Render Custom Modern Score Dashboard Cards View
    const cardContainer = document.getElementById('players-card-container');
    cardContainer.innerHTML = '';
    
    // Calculate Rank Standing Ordering mapping list arrays on the fly
    const pArr = Object.keys(gameState.players).map(k => ({ id: k, ...gameState.players[k] }));
    pArr.sort((x, y) => {
        if (y.stars !== x.stars) return y.stars - x.stars;
        return y.score - x.score;
    });
    
    // Determine each player placement position rank index mapping object dictionary
    const rankMap = {};
    pArr.forEach((item, idx) => {
        rankMap[item.id] = idx + 1;
    });
    
    // Render sequentially following order A, B, C, D to keep form fields order mapping intact
    ['p1', 'p2', 'p3', 'p4'].forEach(pKey => {
        const pObj = gameState.players[pKey];
        const rank = rankMap[pKey];
        const isRank1Class = rank === 1 ? 'rank-1' : '';
        const isMinus = pObj.score < 0;
        
        const cardHtml = `
            <div class="player-score-card ${isRank1Class}" id="card-element-${pKey}">
                <div class="player-card-top">
                    <div class="player-identity">
                        <div class="player-name-display" id="name-txt-${pKey}">${pObj.name}</div>
                        <button class="btn-edit-inline" onclick="triggerInlinePlayerRename('${pKey}')" title="Edit Nama">✏️</button>
                    </div>
                    <span class="player-rank-badge">#${rank}</span>
                </div>
                <div class="player-score-center">
                    <div class="display-score-huge">${pObj.score}</div>
                    ${isMinus ? '<div class="minus-indicator">👎</div>' : ''}
                </div>
                <div class="player-card-bottom">
                    <div class="star-counter-display">
                        ${'⭐'.repeat(pObj.stars) || '<span>0 ⭐</span>'}
                    </div>
                    <div class="mini-stats-row">
                        🔥 ${pObj.burns} &nbsp;💀 ${pObj.burned}
                    </div>
                </div>
            </div>
        `;
        cardContainer.insertAdjacentHTML('beforeend', cardHtml);
    });
    
    // Update Secondary Tab Interfaces Elements content data rows
    renderRankingsTable(pArr);
    renderHistoryLogs();
    renderAchievementsDashboard();
    renderStatistikRoundTable();
    renderArsipPermanenTable();
}

function triggerInlinePlayerRename(pKey) {
    const currentName = gameState.players[pKey].name;
    const newName = prompt(`Ubah Nama Pemain (${currentName}):`, currentName);
    
    if (newName && newName.trim() !== '') {
        const cleanName = newName.trim();
        gameState.players[pKey].name = cleanName;
        
        // Sync registration update track log record references
        syncPlayerArchiveRegistration(cleanName);
        
        StorageManager.save();
        refreshGameplayUI();
    }
}

// Inner tab view component builders
function renderRankingsTable(sortedPlayersArr) {
    const tbody = document.querySelector('#table-ranking tbody');
    tbody.innerHTML = '';
    
    sortedPlayersArr.forEach((p, idx) => {
        const row = `
            <tr>
                <td><strong>${idx + 1}</strong></td>
                <td>${p.name}</td>
                <td><span class="badge ${p.score < 0 ? 'badge-secondary' : 'badge-primary'}">${p.score}</span></td>
                <td>${p.stars} ⭐</td>
                <td>${p.burns}x</td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}

function renderHistoryLogs() {
    const container = document.getElementById('history-logs-container');
    container.innerHTML = '';
    
    if (gameState.history.length === 0) {
        container.innerHTML = '<p style="font-size:12px; color:var(--text-muted); text-align:center; padding:20px 0;">Belum ada riwayat puteran.</p>';
        return;
    }
    
    // Show newest records logs sequence stacking layout on top
    const reversedHistory = [...gameState.history].reverse();
    
    reversedHistory.forEach(item => {
        let eventsHtml = '';
        if (item.events && item.events.length > 0) {
            item.events.forEach(ev => {
                eventsHtml += `<div class="log-burn-alert">${ev}</div>`;
            });
        }
        
        const itemHtml = `
            <div class="log-item">
                <div class="log-title-bar">
                    <span>Ronde ${item.ronde} - Puteran ${item.puteran}</span>
                </div>
                <div class="log-body">
                    ${Object.keys(item.scores).map(k => `${item.scores[k].name}: <strong>${item.scores[k].score}</strong>`).join(' | ')}
                </div>
                ${eventsHtml}
            </div>
        `;
        container.insertAdjacentHTML('beforeend', itemHtml);
    });
}

function renderAchievementsDashboard() {
    const container = document.getElementById('achievement-list-container');
    container.innerHTML = '';
    
    // Check local player aggregates across system definitions criteria parameters maps to unlock triggers
    // Compile global statistics aggregated by matching active player tracking properties counters
    const badgesDef = [
        { id: 'tnk', name: 'Tukang Ngocok Kartu', desc: 'Skor pemain minus (< 0)', icon: '🃏', check: (p) => p.score < 0 },
        { id: 'tbk', name: 'Tukang Bakar', desc: 'Membakar lawan >= 3 kali', icon: '🔥', check: (p) => p.burns >= 3 },
        { id: 'hga', name: 'Hari Apes Gak Ada Yang Tau', desc: 'Terbakar lawan >= 5 kali', icon: '💀', check: (p) => p.burned >= 5 },
        { id: 'dwk', name: 'Dewa Kartu', desc: 'Highest Score >= 500', icon: '👑', check: (p) => p.highestScore >= 500 },
        { id: 'dsd', name: 'Dewa Dari Segala Dewa', desc: 'Memiliki Bintang > 1', icon: '⚡', check: (p) => p.stars > 1 },
        { id: 'tbb', name: 'Triple Burn', desc: 'Membakar 3 lawan sekaligus', icon: '💥', check: (p) => p.tripleBurn > 0 }
    ];
    
    badgesDef.forEach(b => {
        // Unlocked if ANY player in active session matches this specific criteria item module
        let isUnlocked = false;
        let unlockedBy = "";
        
        for (let k in gameState.players) {
            if (b.check(gameState.players[k])) {
                isUnlocked = true;
                unlockedBy = gameState.players[k].name;
                break;
            }
        }
        
        const unClass = isUnlocked ? 'unlocked' : '';
        const subTitleDesc = isUnlocked ? `Unlocked oleh ${unlockedBy}` : b.desc;
        
        const bHtml = `
            <div class="achievement-card ${unClass}">
                <div class="achievement-icon">${b.icon}</div>
                <div class="achievement-name">${b.name}</div>
                <div class="achievement-desc">${subTitleDesc}</div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', bHtml);
    });
}

function renderStatistikRoundTable() {
    const tbody = document.querySelector('#table-statistik tbody');
    tbody.innerHTML = '';
    
    ['p1', 'p2', 'p3', 'p4'].forEach(k => {
        const p = gameState.players[k];
        const row = `
            <tr>
                <td><strong>${p.name}</strong></td>
                <td>${p.highestScore}</td>
                <td>${p.burns}x</td>
                <td>${p.burned}x</td>
                <td>${p.tripleBurn}x</td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}

function renderArsipPermanenTable() {
    const tbody = document.querySelector('#table-arsip-permanen tbody');
    tbody.innerHTML = '';
    
    const keys = Object.keys(gameState.arsip);
    if (keys.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">Arsip permanen kosong.</td></tr>';
        return;
    }
    
    keys.forEach(k => {
        const data = gameState.arsip[k];
        const row = `
            <tr>
                <td><strong>${data.name}</strong></td>
                <td>${data.stars} ⭐</td>
                <td>${data.burns}x</td>
                <td>${data.burned}x</td>
                <td>${data.tripleBurn}x</td>
                <td>${data.highestScore}</td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}

// Core Input Computation Logic & Burn Engine Simulation Rules
function processScorePuteranInput() {
    // Collect active elements value elements
    const v1 = parseInt(document.getElementById('score-p1').value) || 0;
    const v2 = parseInt(document.getElementById('score-p2').value) || 0;
    const v3 = parseInt(document.getElementById('score-p3').value) || 0;
    const v4 = parseInt(document.getElementById('score-p4').value) || 0;
    
    const inputVals = { p1: v1, p2: v2, p3: v3, p4: v4 };
    
    // Check maximum cap rule validation limit constraints: positive 1000 per puteran parameter check
    for (let k in inputVals) {
        if (inputVals[k] > 1000) {
            alert(`Skor puteran untuk ${gameState.players[k].name} melebihi batas maksimal positif yaitu 1000!`);
            return;
        }
    }
    
    // Extract state variables context reference copies for algorithmic evaluation execution
    const previousScores = {
        p1: gameState.players.p1.score,
        p2: gameState.players.p2.score,
        p3: gameState.players.p3.score,
        p4: gameState.players.p4.score
    };
    
    // Tentative evaluation scores profile computation matrix
    const standardNextScores = {
        p1: previousScores.p1 + inputVals.p1,
        p2: previousScores.p2 + inputVals.p2,
        p3: previousScores.p3 + inputVals.p3,
        p4: previousScores.p4 + inputVals.p4
    };
    
    const keys = ['p1', 'p2', 'p3', 'p4'];
    let roundLoggedEvents = [];
    
    // Final operational scores container target mapping values arrays
    let finalNextScores = { ...standardNextScores };
    
    // Evaluate Burn Rules Conditions Matrix only if current turn index is Puteran 2 or higher
    if (gameState.puteran >= 2) {
        let victimsSet = new Set();
        let burnerRecordsMap = { p1: [], p2: [], p3: [], p4: [] };
        
        // Quad-nested processing comparisons checking matrix logic rules execution
        keys.forEach(pA => {
            keys.forEach(pB => {
                if (pA === pB) return;
                
                // Evaluate condition matrix rules parameters criteria checks
                // A crosses B when previousScores[pA] <= previousScores[pB] AND standardNextScores[pA] > standardNextScores[pB]
                if (previousScores[pA] <= previousScores[pB] && standardNextScores[pA] > standardNextScores[pB]) {
                    // Rule Check Constraint: Score 0 baseline targets cannot be burned or counted as victims
                    if (previousScores[pB] !== 0) {
                        victimsSet.add(pB);
                        burnerRecordsMap[pA].push(pB);
                    }
                }
            });
        });
        
        // Execute reset penalty overrides transformations on victims matching conditions map list
        victimsSet.forEach(vKey => {
            finalNextScores[vKey] = 0;
            gameState.players[vKey].burned += 1;
            
            // Sync permanent record archive parameters
            const pName = gameState.players[vKey].name;
            if (gameState.arsip[pName]) gameState.arsip[pName].burned += 1;
        });
        
        // Record and register burns counter statistics profiles to active state managers
        keys.forEach(bKey => {
            const listVictims = burnerRecordsMap[bKey];
            if (listVictims.length > 0) {
                gameState.players[bKey].burns += listVictims.length;
                
                // Sync permanent record archive
                const bName = gameState.players[bKey].name;
                if (gameState.arsip[bName]) gameState.arsip[bName].burns += listVictims.length;
                
                // Check if Triple Burn occurrence criterion triggered
                if (listVictims.length === 3) {
                    gameState.players[bKey].tripleBurn += 1;
                    if (gameState.arsip[bName]) gameState.arsip[bName].tripleBurn += 1;
                    
                    roundLoggedEvents.push(`TRIPLE BURN oleh ${bName}!`);
                }
                
                // Append text log events elements description tracking array item arrays
                listVictims.forEach(vKey => {
                    roundLoggedEvents.push(`${gameState.players[bKey].name} membakar ${gameState.players[vKey].name}`);
                });
            }
        });
    }
    
    // Commit tentative final scores values array back to the core operational model object
    keys.forEach(k => {
        gameState.players[k].score = finalNextScores[k];
        
        // Track and maintain highestScore statistics profiles metrics updates
        if (gameState.players[k].score > gameState.players[k].highestScore) {
            gameState.players[k].highestScore = gameState.players[k].score;
        }
        
        const pName = gameState.players[k].name;
        if (gameState.arsip[pName] && gameState.players[k].score > gameState.arsip[pName].highestScore) {
            gameState.arsip[pName].highestScore = gameState.players[k].score;
        }
    });
    
    // Determine the dealer/shuffler ("Tukang Ngocok Kartu") logic priority selections
    // Pick minimum score parameter values index
    let dealerKey = 'p1';
    let minScoreVal = gameState.players.p1.score;
    
    keys.forEach(k => {
        if (gameState.players[k].score < minScoreVal) {
            minScoreVal = gameState.players[k].score;
            dealerKey = k;
        }
    });
    const dealerName = gameState.players[dealerKey].name;
    
    // Check Star / Milestone Goal Reached Achievements conditions transformations loops
    let starWinnersList = [];
    keys.forEach(k => {
        if (gameState.players[k].score >= gameState.target) {
            starWinnersList.push(k);
        }
    });
    
    // Log active history entry parameter snapshot item configuration models data objects
    let historyEntryItem = {
        ronde: gameState.ronde,
        puteran: gameState.puteran,
        scores: {
            p1: { name: gameState.players.p1.name, score: gameState.players.p1.score },
            p2: { name: gameState.players.p2.name, score: gameState.players.p2.score },
            p3: { name: gameState.players.p3.name, score: gameState.players.p3.score },
            p4: { name: gameState.players.p4.name, score: gameState.players.p4.score }
        },
        events: roundLoggedEvents
    };
    gameState.history.push(historyEntryItem);
    
    // Compile Multimedia Speech-Synthesis Text and Audio Execution Triggers Flow
    let hasStarsTriggered = starWinnersList.length > 0;
    
    if (hasStarsTriggered) {
        // Execute Star Gain logic loop overrides sequence and exclusive animations presentation layout
        starWinnersList.forEach(wKey => {
            gameState.players[wKey].stars += 1;
            
            // Sync permanent statistics archives values
            const wName = gameState.players[wKey].name;
            if (gameState.arsip[wName]) gameState.arsip[wName].stars += 1;
        });
        
        // Reset ALL round active player scores parameters back to 0 on star milestone completion rule
        keys.forEach(k => {
            gameState.players[k].score = 0;
        });
        
        // Launch Star Animation Overlays directly alongside matched TTS audio sound elements
        triggerStarFallingAnimationDisplay();
        
        // Trigger synchronized star event voice queues elements
        starWinnersList.forEach(wKey => {
            VoiceQueueManager.speak(`Selamat kepada ${gameState.players[wKey].name} mendapatkan bintang satu`);
        });
        
        // Play critical gambler wave background sound file explicitly
        SoundController.play('godofgambler.wav');
        
    } else {
        // Normal turn or standard burn narrative voice queues building system logic sequence execution
        // 1. Process Voice cues for active burns occurrences notifications
        let isTripleBurnedInTurn = roundLoggedEvents.some(e => e.includes("TRIPLE BURN"));
        
        // Identify the burner and victim names directly from log events to structure the specific voice strings
        // Example event string template: "[Burner] membakar [Victim]"
        let directBurnEvents = roundLoggedEvents.filter(e => e.includes("membakar"));
        
        directBurnEvents.forEach(evtText => {
            VoiceQueueManager.speak(evtText);
        });
        
        if (directBurnEvents.length > 0) {
            triggerBurnFlameOverlayAnimation();
            SoundController.play('dimulaidari0.wav');
        }
        
        if (isTripleBurnedInTurn) {
            VoiceQueueManager.speak("Triple Burn");
        }
        
        // 2. Card Shuffle Shuffler Selection Announcements Speech Triggers
        VoiceQueueManager.speak(`Silakan ${dealerName} kocok kartunya`);
        
        // 3. Read aloud total score standings arrays parameters
        keys.forEach(k => {
            const pObj = gameState.players[k];
            if (pObj.score < 0) {
                const textNumberStr = numberToBahasaIndonesia(pObj.score); // returns "minus X..."
                VoiceQueueManager.speak(`${pObj.name} ${textNumberStr}`);
            } else {
                const textNumberStr = numberToBahasaIndonesia(pObj.score);
                VoiceQueueManager.speak(`${pObj.name} total poin ${textNumberStr}`);
            }
        });
    }
    
    // Clear forms inputs field items back to standard baseline 0 for next iteration prompt lines
    keys.forEach(k => {
        document.getElementById(`score-${k}`).value = 0;
    });
    
    // Progress turn tracking index metrics parameters increment counters
    gameState.puteran += 1;
    
    // Save State and Re-render updated interface views
    StorageManager.save();
    refreshGameplayUI();
}

// Visual Special FX Presentation Layer Systems Engines
function triggerBurnFlameOverlayAnimation() {
    const overlay = document.getElementById('burn-animation-overlay');
    overlay.classList.remove('hidden');
    setTimeout(() => {
        overlay.classList.add('hidden');
    }, 3000);
}

function triggerStarFallingAnimationDisplay() {
    const overlay = document.getElementById('star-animation-overlay');
    const zone = document.getElementById('star-fall-zone');
    zone.innerHTML = '';
    
    overlay.classList.remove('hidden');
    
    // Construct 25 randomized star particles scattered across viewport grid layout canvas
    for (let i = 0; i < 25; i++) {
        const star = document.createElement('div');
        star.className = 'falling-star';
        star.textContent = '⭐';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * -20 - 5 + 'px';
        star.style.animationDelay = Math.random() * 1.5 + 's';
        star.style.fontSize = Math.floor(Math.random() * 20) + 16 + 'px';
        zone.appendChild(star);
    }
    
    setTimeout(() => {
        overlay.classList.add('hidden');
        zone.innerHTML = '';
    }, 4000);
}

// Generate Temporary Fake Image Data Downloader Handler Mock for HTML Canvas Screenshots Output
function handleCaptureFakeSnapshot() {
    // Premium custom base64 canvas block mockup generation to represent state snapshot
    alert("Snapshot Berhasil! Gambar PNG sedang diunduh.");
    
    const dummyContent = `
        <div style="font-family:sans-serif; color:white; background:#0f172a; padding:20px; border-radius:12px; border:2px solid #3b82f6;">
            <h2 style="margin-bottom:10px; color:#3b82f6;">Score Cekih Snapshot</h2>
            <p>Ronde: ${gameState.ronde} | Puteran: ${gameState.puteran - 1}</p>
            <hr style="border-color:#334155; margin:10px 0;">
            <p>${gameState.players.p1.name}: ${gameState.players.p1.score} Poin (${gameState.players.p1.stars} ⭐)</p>
            <p>${gameState.players.p2.name}: ${gameState.players.p2.score} Poin (${gameState.players.p2.stars} ⭐)</p>
            <p>${gameState.players.p3.name}: ${gameState.players.p3.score} Poin (${gameState.players.p3.stars} ⭐)</p>
            <p>${gameState.players.p4.name}: ${gameState.players.p4.score} Poin (${gameState.players.p4.stars} ⭐)</p>
            <p style="margin-top:15px; font-size:10px; color:#94a3b8; text-align:right;">Sadewa Corp Premium App</p>
        </div>
    `;
    
    // Direct browser utility link injection execution to pass mock standard transparent file downloads channel link
    const element = document.createElement('a');
    element.setAttribute('href', 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="400" height="250">
            <foreignObject width="100%" height="100%">
                <div xmlns="http://www.w3.org/1999/xhtml">
                    ${dummyContent}
                </div>
            </foreignObject>
        </svg>
    `));
    element.setAttribute('download', `ScoreCekih_Ronde_${gameState.ronde}_Puteran_${gameState.puteran - 1}.png`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

function triggerClearPermanentArsip() {
    if (confirm("Apakah Anda yakin ingin menghapus seluruh data Arsip Pemain secara permanen? Tindakan ini tidak dapat dibatalkan!")) {
        gameState.arsip = {};
        StorageManager.save();
        refreshGameplayUI();
    }
}

// Reset Game System Flow Action Engine
function triggerResetGameFlow() {
    if (confirm("Reset seluruh permainan?")) {
        // Purge session variables items cleanly but preserve global permanent archives map entries intact
        gameState.currentScreen = 'setup';
        gameState.ronde = 1;
        gameState.puteran = 1;
        gameState.target = 1000;
        
        // Re-instantiate base template configurations arrays mappings for active session loops
        gameState.players = {
            p1: { name: 'Pemain A', score: 0, stars: 0, burns: 0, burned: 0, tripleBurn: 0, highestScore: 0 },
            p2: { name: 'Pemain B', score: 0, stars: 0, burns: 0, burned: 0, tripleBurn: 0, highestScore: 0 },
            p3: { name: 'Pemain C', score: 0, stars: 0, burns: 0, burned: 0, tripleBurn: 0, highestScore: 0 },
            p4: { name: 'Pemain D', score: 0, stars: 0, burns: 0, burned: 0, tripleBurn: 0, highestScore: 0 }
        };
        
        gameState.history = [];
        
        StorageManager.save();
        switchScreen('setup');
        prefillSetupForm();
    }
}
