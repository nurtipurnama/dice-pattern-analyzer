// =====================================================
// DICE PATTERN ANALYZER - Core Logic
// =====================================================

// State Definitions
const STATE_RANGES = {
    LOW: { min: 6, max: 18, color: '#3b82f6' },
    MID: { min: 19, max: 31, color: '#8b5cf6' },
    HIGH: { min: 32, max: 43, color: '#f59e0b' },
    EXTREME: { min: 44, max: 54, color: '#ef4444' }
};

const KB_RANGES = {
    SMALL: { min: 6, max: 31 },
    BIG: { min: 32, max: 54 }
};

// Data Management
let gameData = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadDataFromStorage();
    updateAllAnalysis();
});

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

function getState(value) {
    if (value >= STATE_RANGES.LOW.min && value <= STATE_RANGES.LOW.max) return 'LOW';
    if (value >= STATE_RANGES.MID.min && value <= STATE_RANGES.MID.max) return 'MID';
    if (value >= STATE_RANGES.HIGH.min && value <= STATE_RANGES.HIGH.max) return 'HIGH';
    if (value >= STATE_RANGES.EXTREME.min && value <= STATE_RANGES.EXTREME.max) return 'EXTREME';
    return null;
}

function getKB(value) {
    return value >= KB_RANGES.SMALL.min && value <= KB_RANGES.SMALL.max ? 'K' : 'B';
}

function getTrend(roll1, roll2) {
    const diff = roll2 - roll1;
    if (diff > 0) return 'naik';
    if (diff < 0) return 'turun';
    return 'stabil';
}

function validateInput(roll1, roll2) {
    const r1 = parseInt(roll1);
    const r2 = parseInt(roll2);
    
    if (isNaN(r1) || isNaN(r2)) {
        alert('Masukkan nilai numerik untuk kedua roll');
        return false;
    }
    
    if (r1 < 6 || r1 > 54 || r2 < 6 || r2 > 54) {
        alert('Nilai harus berada di antara 6-54');
        return false;
    }
    
    return true;
}

// =====================================================
// DATA INPUT
// =====================================================

function addGame() {
    const roll1Input = document.getElementById('roll1');
    const roll2Input = document.getElementById('roll2');
    
    const roll1 = roll1Input.value;
    const roll2 = roll2Input.value;
    
    if (!validateInput(roll1, roll2)) return;
    
    const state1 = getState(parseInt(roll1));
    const state2 = getState(parseInt(roll2));
    const kb = getKB(parseInt(roll2));
    const trend = getTrend(parseInt(roll1), parseInt(roll2));
    const diff = Math.abs(parseInt(roll2) - parseInt(roll1));
    
    gameData.push({
        id: Date.now(),
        roll1: parseInt(roll1),
        state1,
        roll2: parseInt(roll2),
        state2,
        diff,
        trend,
        kb,
        timestamp: new Date().toLocaleString('id-ID')
    });
    
    saveDataToStorage();
    updateAllAnalysis();
    
    // Clear inputs
    roll1Input.value = '';
    roll2Input.value = '';
    roll1Input.focus();
}

function deleteGame(id) {
    gameData = gameData.filter(game => game.id !== id);
    saveDataToStorage();
    updateAllAnalysis();
}

function clearAllData() {
    if (confirm('Yakin ingin menghapus semua data? Tindakan ini tidak dapat dibatalkan.')) {
        gameData = [];
        saveDataToStorage();
        updateAllAnalysis();
    }
}

// =====================================================
// STORAGE
// =====================================================

function saveDataToStorage() {
    localStorage.setItem('dicePatternData', JSON.stringify(gameData));
}

function loadDataFromStorage() {
    const stored = localStorage.getItem('dicePatternData');
    gameData = stored ? JSON.parse(stored) : [];
}

function downloadData() {
    const dataStr = JSON.stringify(gameData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dice-pattern-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

// =====================================================
// TABLE RENDERING
// =====================================================

function renderTable() {
    const tbody = document.getElementById('tableBody');
    const emptyMsg = document.getElementById('emptyMessage');
    
    if (gameData.length === 0) {
        tbody.innerHTML = '';
        emptyMsg.style.display = 'block';
        return;
    }
    
    emptyMsg.style.display = 'none';
    
    tbody.innerHTML = gameData.map((game, index) => `
        <tr>
            <td><strong>${index + 1}</strong></td>
            <td>${game.roll1}</td>
            <td><span class="state-badge ${game.state1.toLowerCase()}">${game.state1}</span></td>
            <td>${game.roll2}</td>
            <td><span class="state-badge ${game.state2.toLowerCase()}">${game.state2}</span></td>
            <td>${game.diff}</td>
            <td><span class="trend-${game.trend}">${game.trend}</span></td>
            <td><span class="kb-${game.kb === 'K' ? 'small' : 'big'}">${game.kb}</span></td>
            <td>
                <button class="btn-delete" onclick="deleteGame(${game.id})">Hapus</button>
            </td>
        </tr>
    `).join('');
}

// =====================================================
// ANALYSIS FUNCTIONS
// =====================================================

function analyzeTrends() {
    const analysis = {
        up: 0,
        down: 0,
        stable: 0
    };
    
    gameData.forEach(game => {
        if (game.trend === 'naik') analysis.up++;
        else if (game.trend === 'turun') analysis.down++;
        else analysis.stable++;
    });
    
    return analysis;
}

function analyzeStateDistribution() {
    const distribution = {
        LOW: 0,
        MID: 0,
        HIGH: 0,
        EXTREME: 0
    };
    
    gameData.forEach(game => {
        distribution[game.state2]++;
    });
    
    return distribution;
}

function analyzeKBDistribution() {
    return {
        small: gameData.filter(g => g.kb === 'K').length,
        big: gameData.filter(g => g.kb === 'B').length
    };
}

function buildTransitionMatrix() {
    const states = ['LOW', 'MID', 'HIGH', 'EXTREME'];
    const matrix = {};
    
    states.forEach(from => {
        matrix[from] = {};
        states.forEach(to => {
            matrix[from][to] = 0;
        });
    });
    
    // Count transitions from roll1 state to roll2 state
    for (let i = 0; i < gameData.length; i++) {
        const game = gameData[i];
        matrix[game.state1][game.state2]++;
        
        // Also count transition from previous roll2 to current roll1
        if (i > 0) {
            const prevGame = gameData[i - 1];
            // Already counted above for continuity
        }
    }
    
    return matrix;
}

function getTransitionProbabilities(fromState) {
    const matrix = buildTransitionMatrix();
    const transitions = matrix[fromState];
    const total = Object.values(transitions).reduce((a, b) => a + b, 0);
    
    const probabilities = {};
    Object.keys(transitions).forEach(toState => {
        probabilities[toState] = total > 0 ? (transitions[toState] / total) : 0;
    });
    
    return probabilities;
}

function getRecentTrend() {
    const recent = gameData.slice(-10);
    return recent.map(game => ({
        trend: game.trend,
        state: game.state2
    }));
}

// =====================================================
// HYBRID PREDICTION
// =====================================================

function predictNext() {
    if (gameData.length < 3) {
        return {
            small: 50,
            big: 50,
            basis: ['Tunggu minimal 3 data untuk analisis yang akurat']
        };
    }
    
    const lastGame = gameData[gameData.length - 1];
    const lastState = lastGame.state2;
    const recentGames = gameData.slice(-10);
    
    let scoreSmall = 0;
    let scoreBig = 0;
    const basis = [];
    
    // 1. TREN NUMERIK (20%)
    const trends = analyzeTrends();
    const totalTrends = trends.up + trends.down + trends.stable;
    
    if (trends.down > trends.up) {
        scoreSmall += 20;
        basis.push(`Tren menurun dominan (${trends.down} kali)`);
    } else if (trends.up > trends.down) {
        scoreBig += 20;
        basis.push(`Tren naik dominan (${trends.up} kali)`);
    } else {
        scoreSmall += 10;
        scoreBig += 10;
        basis.push(`Tren seimbang`);
    }
    
    // 2. STATE TERAKHIR (25%)
    switch (lastState) {
        case 'LOW':
            scoreSmall += 25;
            basis.push(`State terakhir LOW (dominasi area KECIL)`);
            break;
        case 'MID':
            scoreSmall += 15;
            scoreBig += 10;
            basis.push(`State terakhir MID (batas K/B)`);
            break;
        case 'HIGH':
            scoreBig += 22;
            scoreSmall += 3;
            basis.push(`State terakhir HIGH (dominasi area BESAR)`);
            break;
        case 'EXTREME':
            scoreBig += 25;
            basis.push(`State terakhir EXTREME (area BESAR)`);
            break;
    }
    
    // 3. STATE TRANSITION (25%)
    const transProb = getTransitionProbabilities(lastState);
    const nextStateProb = {};
    
    ['LOW', 'MID'].forEach(state => {
        nextStateProb[state] = transProb[state];
    });
    
    const smallStateProb = nextStateProb['LOW'] + nextStateProb['MID'];
    const bigStateProb = transProb['HIGH'] + transProb['EXTREME'];
    
    scoreSmall += smallStateProb * 25;
    scoreBig += bigStateProb * 25;
    
    if (smallStateProb > 0.4) {
        basis.push(`Transisi ke state KECIL: ${(smallStateProb * 100).toFixed(0)}%`);
    }
    if (bigStateProb > 0.4) {
        basis.push(`Transisi ke state BESAR: ${(bigStateProb * 100).toFixed(0)}%`);
    }
    
    // 4. DISTANCE FROM CENTER (30%)
    const centerDistance = Math.abs(lastGame.roll2 - 30); // 30 adalah titik tengah K/B
    const distanceRatio = centerDistance / 24; // Max distance dari center
    
    if (lastGame.roll2 < 30) {
        scoreSmall += distanceRatio * 30;
        basis.push(`Nilai ${lastGame.roll2} lebih dekat ke KECIL`);
    } else {
        scoreBig += distanceRatio * 30;
        basis.push(`Nilai ${lastGame.roll2} lebih dekat ke BESAR`);
    }
    
    // 5. RECENT GAME PATTERN (10%)
    const recentKB = recentGames.map(g => g.kb);
    const recentSmall = recentKB.filter(kb => kb === 'K').length;
    const recentBig = recentKB.filter(kb => kb === 'B').length;
    
    if (recentSmall > recentBig) {
        scoreSmall += 10;
    } else if (recentBig > recentSmall) {
        scoreBig += 10;
    }
    
    // Normalize scores
    const totalScore = scoreSmall + scoreBig;
    const predSmall = Math.round((scoreSmall / totalScore) * 100);
    const predBig = 100 - predSmall;
    
    return {
        small: predSmall,
        big: predBig,
        basis
    };
}

// =====================================================
// UI UPDATES
// =====================================================

function updateTrendAnalysis() {
    const trends = analyzeTrends();
    
    document.getElementById('trendUp').textContent = trends.up;
    document.getElementById('trendDown').textContent = trends.down;
    document.getElementById('trendStable').textContent = trends.stable;
    
    const total = trends.up + trends.down + trends.stable || 1;
    
    document.getElementById('barUp').style.width = `${(trends.up / total) * 100}%`;
    document.getElementById('barDown').style.width = `${(trends.down / total) * 100}%`;
    document.getElementById('barStable').style.width = `${(trends.stable / total) * 100}%`;
}

function updateStateDistribution() {
    const distribution = analyzeStateDistribution();
    
    document.getElementById('stateLow').textContent = distribution.LOW;
    document.getElementById('stateMid').textContent = distribution.MID;
    document.getElementById('stateHigh').textContent = distribution.HIGH;
    document.getElementById('stateExtreme').textContent = distribution.EXTREME;
}

function updateKBDistribution() {
    const kbDist = analyzeKBDistribution();
    
    document.getElementById('countSmall').textContent = kbDist.small;
    document.getElementById('countBig').textContent = kbDist.big;
    
    const total = kbDist.small + kbDist.big || 1;
    
    document.getElementById('barSmall').style.width = `${(kbDist.small / total) * 100}%`;
    document.getElementById('barBig').style.width = `${(kbDist.big / total) * 100}%`;
}

function updateRecentTrendDisplay() {
    const recent = getRecentTrend();
    const container = document.getElementById('recentTrend');
    
    if (recent.length === 0) {
        container.textContent = '-';
        return;
    }
    
    container.innerHTML = recent.map(item => {
        const trendEmoji = {
            'naik': '↑',
            'turun': '↓',
            'stabil': '→'
        };
        
        return `<div class="trend-dot ${item.trend}">${trendEmoji[item.trend]}</div>`;
    }).join('');
}

function updateTransitionMatrix() {
    const matrix = buildTransitionMatrix();
    const states = ['LOW', 'MID', 'HIGH', 'EXTREME'];
    
    states.forEach(from => {
        states.forEach(to => {
            const cellId = `t-${from.toLowerCase()}-${to.toLowerCase()}`;
            const element = document.getElementById(cellId);
            if (element) {
                element.textContent = matrix[from][to];
            }
        });
    });
}

function updatePrediction() {
    const prediction = predictNext();
    
    document.getElementById('predSmall').textContent = `${prediction.small}%`;
    document.getElementById('predBig').textContent = `${prediction.big}%`;
    
    document.getElementById('predBarSmall').style.width = `${prediction.small}%`;
    document.getElementById('predBarBig').style.width = `${prediction.big}%`;
    
    const basisList = document.getElementById('analysisBasis');
    basisList.innerHTML = prediction.basis
        .map(item => `<li>${item}</li>`)
        .join('');
}

function updateStatistics() {
    const totalGames = gameData.length;
    
    document.getElementById('totalGames').textContent = totalGames;
    
    if (totalGames === 0) {
        document.getElementById('avgRoll1').textContent = '0';
        document.getElementById('avgRoll2').textContent = '0';
        document.getElementById('avgDiff').textContent = '0';
        return;
    }
    
    const avgRoll1 = (gameData.reduce((sum, g) => sum + g.roll1, 0) / totalGames).toFixed(1);
    const avgRoll2 = (gameData.reduce((sum, g) => sum + g.roll2, 0) / totalGames).toFixed(1);
    const avgDiff = (gameData.reduce((sum, g) => sum + g.diff, 0) / totalGames).toFixed(1);
    
    document.getElementById('avgRoll1').textContent = avgRoll1;
    document.getElementById('avgRoll2').textContent = avgRoll2;
    document.getElementById('avgDiff').textContent = avgDiff;
}

function updateAllAnalysis() {
    renderTable();
    updateTrendAnalysis();
    updateStateDistribution();
    updateKBDistribution();
    updateRecentTrendDisplay();
    updateTransitionMatrix();
    updatePrediction();
    updateStatistics();
}

// Allow Enter key to add game
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && (e.target.id === 'roll1' || e.target.id === 'roll2')) {
        addGame();
    }
});