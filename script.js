/**
 * =====================================================
 * DICE PATTERN ANALYZER v1.1
 * Sistem Rekomendasi Multi-Step Berbasis Data & Psikologi
 * =====================================================
 */

// =====================================================
// STATE DEFINITIONS
// =====================================================

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

// =====================================================
// GLOBAL STATE
// =====================================================

let gameData = [];

// =====================================================
// INITIALIZATION
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    loadDataFromStorage();
    setupEventListeners();
    updateAllAnalysis();
});

function setupEventListeners() {
    document.getElementById('roll1').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') document.getElementById('roll2').focus();
    });
    
    document.getElementById('roll2').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addGame();
    });
}

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
    if (diff > 2) return 'naik';
    if (diff < -2) return 'turun';
    return 'stabil';
}

function validateInput(roll1, roll2) {
    const r1 = parseInt(roll1);
    const r2 = parseInt(roll2);
    
    if (isNaN(r1) || isNaN(r2)) {
        alert('❌ Masukkan nilai numerik untuk kedua roll');
        return false;
    }
    
    if (r1 < 6 || r1 > 54 || r2 < 6 || r2 > 54) {
        alert('❌ Nilai harus berada di antara 6-54');
        return false;
    }
    
    return true;
}

// =====================================================
// DATA INPUT & MANAGEMENT
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
    const diff = parseInt(roll2) - parseInt(roll1);
    
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
    if (confirm('⚠️ Yakin ingin menghapus SEMUA data? Tidak dapat dibatalkan!')) {
        gameData = [];
        saveDataToStorage();
        updateAllAnalysis();
    }
}

// =====================================================
// STORAGE MANAGEMENT
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
    URL.revokeObjectURL(url);
}

function importData() {
    document.getElementById('importFile').click();
}

function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            if (!Array.isArray(imported)) throw new Error('Format tidak valid');
            
            gameData = imported;
            saveDataToStorage();
            updateAllAnalysis();
            alert('✅ Data berhasil diimport!');
        } catch (err) {
            alert(`❌ Error import: ${err.message}`);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// =====================================================
// TABLE RENDERING & FILTERING
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
    
    const sortFilter = document.getElementById('sortFilter')?.value || 'desc';
    const searchText = document.getElementById('searchFilter')?.value.toLowerCase() || '';
    
    let displayData = [...gameData];
    
    // Filter
    if (searchText) {
        displayData = displayData.filter(game => {
            const searchStr = `${game.roll1} ${game.roll2} ${game.kb} ${game.state2}`.toLowerCase();
            return searchStr.includes(searchText);
        });
    }
    
    // Sort
    if (sortFilter === 'asc') {
        displayData.reverse();
    }
    
    tbody.innerHTML = displayData.map((game, index) => `
        <tr>
            <td><strong>${gameData.length - gameData.indexOf(game)}</strong></td>
            <td>${game.roll1}</td>
            <td><span class="state-badge ${game.state1.toLowerCase()}">${game.state1}</span></td>
            <td>${game.roll2}</td>
            <td><span class="state-badge ${game.state2.toLowerCase()}">${game.state2}</span></td>
            <td>${game.diff > 0 ? '+' : ''}${game.diff}</td>
            <td><span class="trend-${game.trend}">${game.trend === 'naik' ? '↑' : game.trend === 'turun' ? '↓' : '→'}</span></td>
            <td><span class="kb-${game.kb === 'K' ? 'small' : 'big'}">${game.kb}</span></td>
            <td>${game.timestamp}</td>
            <td>
                <button class="btn-delete" onclick="deleteGame(${game.id})">Hapus</button>
            </td>
        </tr>
    `).join('');
}

function filterTable() {
    renderTable();
}

// =====================================================
// ANALYSIS FUNCTIONS - LEVEL 1 (BASE DATA)
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

function calculateStatistics() {
    if (gameData.length === 0) {
        return {
            total: 0,
            avgRoll1: 0,
            avgRoll2: 0,
            avgDiff: 0,
            minRoll: 0,
            maxRoll: 0,
            medianRoll: 0,
            stdDev: 0,
            volatility: 0
        };
    }
    
    const allRolls = gameData.flatMap(g => [g.roll1, g.roll2]);
    const total = gameData.length;
    
    const avgRoll1 = gameData.reduce((sum, g) => sum + g.roll1, 0) / total;
    const avgRoll2 = gameData.reduce((sum, g) => sum + g.roll2, 0) / total;
    const avgDiff = gameData.reduce((sum, g) => sum + Math.abs(g.diff), 0) / total;
    
    const minRoll = Math.min(...allRolls);
    const maxRoll = Math.max(...allRolls);
    
    const sortedRolls = [...allRolls].sort((a, b) => a - b);
    const medianRoll = sortedRolls.length % 2 === 0 
        ? (sortedRolls[sortedRolls.length / 2 - 1] + sortedRolls[sortedRolls.length / 2]) / 2
        : sortedRolls[Math.floor(sortedRolls.length / 2)];
    
    const avgRoll = (avgRoll1 + avgRoll2) / 2;
    const variance = allRolls.reduce((sum, val) => sum + Math.pow(val - avgRoll, 2), 0) / allRolls.length;
    const stdDev = Math.sqrt(variance);
    
    const volatility = (stdDev / avgRoll * 100).toFixed(1);
    
    return {
        total,
        avgRoll1: avgRoll1.toFixed(1),
        avgRoll2: avgRoll2.toFixed(1),
        avgDiff: avgDiff.toFixed(1),
        minRoll,
        maxRoll,
        medianRoll: medianRoll.toFixed(1),
        stdDev: stdDev.toFixed(1),
        volatility
    };
}

// =====================================================
// ANALYSIS FUNCTIONS - LEVEL 2 (MARKOV & PATTERNS)
// =====================================================

function buildTransitionMatrix() {
    const states = ['LOW', 'MID', 'HIGH', 'EXTREME'];
    const matrix = {};
    
    states.forEach(from => {
        matrix[from] = {};
        states.forEach(to => {
            matrix[from][to] = 0;
        });
    });
    
    for (let i = 0; i < gameData.length; i++) {
        const game = gameData[i];
        matrix[game.state1][game.state2]++;
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

function getRecentPattern(windowSize = 10) {
    const recent = gameData.slice(-windowSize);
    return {
        games: recent,
        kCount: recent.filter(g => g.kb === 'K').length,
        bCount: recent.filter(g => g.kb === 'B').length,
        lastState: recent.length > 0 ? recent[recent.length - 1].state2 : null,
        lastKB: recent.length > 0 ? recent[recent.length - 1].kb : null,
        avgValue: recent.length > 0 
            ? (recent.reduce((sum, g) => sum + g.roll2, 0) / recent.length).toFixed(1)
            : 0
    };
}

function calculateAlternationIndex() {
    if (gameData.length < 2) return 0;
    
    let alternations = 0;
    for (let i = 1; i < gameData.length; i++) {
        if (gameData[i].kb !== gameData[i - 1].kb) {
            alternations++;
        }
    }
    
    const alternationRate = alternations / (gameData.length - 1);
    return (alternationRate * 100).toFixed(1);
}

function calculateDistanceFromCenter(value) {
    const center = 30;
    return Math.abs(value - center);
}

// =====================================================
// PREDICTION SYSTEM - FACTOR CALCULATION
// =====================================================

function calculateFactor1_NumericTrend() {
    // Bobot 20% - Arah pergerakan angka
    if (gameData.length === 0) return { small: 0, big: 0, reason: 'Tidak ada data' };
    
    const trends = analyzeTrends();
    const total = trends.up + trends.down + trends.stable;
    
    const upRate = trends.up / total || 0;
    const downRate = trends.down / total || 0;
    
    let small = 0;
    let big = 0;
    let reason = '';
    
    if (downRate > upRate + 0.1) {
        small = 20;
        reason = `Tren turun dominan: ${trends.down}x (${(downRate * 100).toFixed(0)}%)`;
    } else if (upRate > downRate + 0.1) {
        big = 20;
        reason = `Tren naik dominan: ${trends.up}x (${(upRate * 100).toFixed(0)}%)`;
    } else {
        small = 10;
        big = 10;
        reason = `Tren seimbang (U:D = ${trends.up}:${trends.down})`;
    }
    
    return { small, big, reason };
}

function calculateFactor2_CurrentState() {
    // Bobot 25% - State dari roll terakhir
    if (gameData.length === 0) return { small: 0, big: 0, reason: 'Tidak ada state' };
    
    const lastState = gameData[gameData.length - 1].state2;
    
    let small = 0;
    let big = 0;
    let reason = '';
    
    switch (lastState) {
        case 'LOW':
            small = 25;
            reason = `State terakhir LOW → dominasi K`;
            break;
        case 'MID':
            small = 12;
            big = 13;
            reason = `State terakhir MID → area transisi`;
            break;
        case 'HIGH':
            big = 22;
            small = 3;
            reason = `State terakhir HIGH → dominasi B`;
            break;
        case 'EXTREME':
            big = 25;
            reason = `State terakhir EXTREME → area B`;
            break;
        default:
            small = 12.5;
            big = 12.5;
    }
    
    return { small, big, reason };
}

function calculateFactor3_StateTransition() {
    // Bobot 20% - Probabilitas transisi Markov
    if (gameData.length < 2) return { small: 0, big: 0, reason: 'Data tidak cukup' };
    
    const lastState = gameData[gameData.length - 1].state2;
    const transProb = getTransitionProbabilities(lastState);
    
    const smallStateProb = (transProb['LOW'] || 0) + (transProb['MID'] || 0);
    const bigStateProb = (transProb['HIGH'] || 0) + (transProb['EXTREME'] || 0);
    
    const small = smallStateProb * 20;
    const big = bigStateProb * 20;
    
    const reason = `Transisi dari ${lastState}: K=${(smallStateProb * 100).toFixed(0)}%, B=${(bigStateProb * 100).toFixed(0)}%`;
    
    return { small, big, reason };
}

function calculateFactor4_DistanceFromCenter() {
    // Bobot 15% - Jarak dari titik tengah 30
    if (gameData.length === 0) return { small: 0, big: 0, reason: 'Tidak ada data' };
    
    const lastValue = gameData[gameData.length - 1].roll2;
    const distance = calculateDistanceFromCenter(lastValue);
    const maxDistance = 24;
    const ratio = Math.min(distance / maxDistance, 1);
    
    let small = 0;
    let big = 0;
    let reason = '';
    
    if (lastValue < 30) {
        small = ratio * 15;
        reason = `Nilai ${lastValue} lebih dekat ke KECIL (jarak ${distance} dari center)`;
    } else {
        big = ratio * 15;
        reason = `Nilai ${lastValue} lebih dekat ke BESAR (jarak ${distance} dari center)`;
    }
    
    return { small, big, reason };
}

function calculateFactor5_RecentPattern() {
    // Bobot 15% - Memory window 5-10 game terakhir
    if (gameData.length < 3) return { small: 0, big: 0, reason: 'Data tidak cukup' };
    
    const windowSize = Math.min(10, gameData.length);
    const pattern = getRecentPattern(windowSize);
    const total = pattern.kCount + pattern.bCount;
    
    const kRate = pattern.kCount / total;
    const bRate = pattern.bCount / total;
    
    let small = 0;
    let big = 0;
    let reason = '';
    
    if (kRate > bRate + 0.1) {
        big = 15;
        reason = `${windowSize} game terakhir: K dominan (${pattern.kCount}/${total}) → expect B (balancing)`;
    } else if (bRate > kRate + 0.1) {
        small = 15;
        reason = `${windowSize} game terakhir: B dominan (${pattern.bCount}/${total}) → expect K (balancing)`;
    } else {
        small = 7.5;
        big = 7.5;
        reason = `${windowSize} game terakhir: seimbang (K:B = ${pattern.kCount}:${pattern.bCount})`;
    }
    
    return { small, big, reason };
}

function calculateFactor6_AlternationIndex() {
    // Bobot 5% - Frekuensi alternasi K↔B
    if (gameData.length < 2) return { small: 0, big: 0, reason: 'Data tidak cukup' };
    
    const altIndex = parseFloat(calculateAlternationIndex());
    
    let small = 0;
    let big = 0;
    let reason = '';
    
    if (altIndex > 60) {
        // Banyak alternasi, expect konsolidasi
        const recent = getRecentPattern(5);
        if (recent.lastKB === 'K') {
            big = 5;
            reason = `Alterasi tinggi (${altIndex.toFixed(0)}%) + terakhir K → expect B`;
        } else {
            small = 5;
            reason = `Alterasi tinggi (${altIndex.toFixed(0)}%) + terakhir B → expect K`;
        }
    } else if (altIndex < 30) {
        // Sedikit alternasi, expect kontinuitas
        const recent = getRecentPattern(3);
        if (recent.lastKB === 'K') {
            small = 5;
            reason = `Alterasi rendah (${altIndex.toFixed(0)}%) + momentum K → expect K lanjut`;
        } else {
            big = 5;
            reason = `Alterasi rendah (${altIndex.toFixed(0)}%) + momentum B → expect B lanjut`;
        }
    } else {
        small = 2.5;
        big = 2.5;
        reason = `Alterasi normal (${altIndex.toFixed(0)}%)`;
    }
    
    return { small, big, reason };
}

// =====================================================
// HYBRID PREDICTION ENGINE
// =====================================================

function calculateHybridPrediction(steps = 1) {
    if (gameData.length < 3) {
        return {
            small: 50,
            big: 50,
            confidence: 0,
            factors: []
        };
    }
    
    const factor1 = calculateFactor1_NumericTrend();
    const factor2 = calculateFactor2_CurrentState();
    const factor3 = calculateFactor3_StateTransition();
    const factor4 = calculateFactor4_DistanceFromCenter();
    const factor5 = calculateFactor5_RecentPattern();
    const factor6 = calculateFactor6_AlternationIndex();
    
    // Aggregate semua faktor
    let totalSmall = factor1.small + factor2.small + factor3.small + factor4.small + factor5.small + factor6.small;
    let totalBig = factor1.big + factor2.big + factor3.big + factor4.big + factor5.big + factor6.big;
    
    // Normalize ke 100
    const grandTotal = totalSmall + totalBig;
    const predSmall = Math.round((totalSmall / grandTotal) * 100);
    const predBig = 100 - predSmall;
    
    // Confidence Score (0-100)
    const confidence = calculateConfidenceScore(steps);
    
    const factors = [
        { name: 'Numeric Trend (20%)', small: factor1.small, big: factor1.big, reason: factor1.reason },
        { name: 'Current State (25%)', small: factor2.small, big: factor2.big, reason: factor2.reason },
        { name: 'State Transition (20%)', small: factor3.small, big: factor3.big, reason: factor3.reason },
        { name: 'Distance from Center (15%)', small: factor4.small, big: factor4.big, reason: factor4.reason },
        { name: 'Recent Pattern (15%)', small: factor5.small, big: factor5.big, reason: factor5.reason },
        { name: 'Alternation Index (5%)', small: factor6.small, big: factor6.big, reason: factor6.reason }
    ];
    
    return {
        small: predSmall,
        big: predBig,
        confidence,
        factors
    };
}

function calculateConfidenceScore(steps = 1) {
    if (gameData.length < 3) return 0;
    
    const baseConfidence = Math.min(gameData.length / 30 * 100, 70);
    
    // Adjust based on consistency
    const consistency = measureConsistency();
    
    // Multi-step adjustment
    const stepPenalty = (steps - 1) * 5; // -5% per step ahead
    
    const final = Math.max(0, baseConfidence + consistency - stepPenalty);
    
    return Math.round(final);
}

function measureConsistency() {
    if (gameData.length < 5) return 0;
    
    const recent = gameData.slice(-5);
    const states = recent.map(g => g.state2);
    const stateFreq = {};
    
    states.forEach(state => {
        stateFreq[state] = (stateFreq[state] || 0) + 1;
    });
    
    const maxFreq = Math.max(...Object.values(stateFreq));
    const consistency = (maxFreq / 5) * 30;
    
    return consistency;
}

// =====================================================
// MULTI-STEP PREDICTION
// =====================================================

function predictMultiStep(steps) {
    const predictions = [];
    
    for (let i = 1; i <= steps; i++) {
        const pred = calculateHybridPrediction(i);
        predictions.push({
            step: i,
            small: pred.small,
            big: pred.big,
            confidence: pred.confidence
        });
    }
    
    return predictions;
}

function predictNext2Games() {
    return predictMultiStep(2);
}

function predictNext5Games() {
    return predictMultiStep(5);
}

function predictNext10Games() {
    return predictMultiStep(10);
}

function generatePatternInsights() {
    if (gameData.length < 5) {
        return ['Tunggu minimal 5 data untuk analisis pola jangka panjang'];
    }
    
    const insights = [];
    
    // Insight 1: Trend dominan
    const trends = analyzeTrends();
    const total = trends.up + trends.down + trends.stable;
    const upPct = ((trends.up / total) * 100).toFixed(0);
    const downPct = ((trends.down / total) * 100).toFixed(0);
    
    if (trends.up > trends.down) {
        insights.push(`📈 Tren NAIK dominan: ${upPct}% dari semua game`);
    } else if (trends.down > trends.up) {
        insights.push(`📉 Tren TURUN dominan: ${downPct}% dari semua game`);
    } else {
        insights.push(`➡️ Tren SEIMBANG antara naik dan turun`);
    }
    
    // Insight 2: State distribution
    const stateDist = analyzeStateDistribution();
    const topState = Object.keys(stateDist).reduce((a, b) => 
        stateDist[a] > stateDist[b] ? a : b
    );
    insights.push(`🎯 State ${topState} paling sering muncul (${stateDist[topState]}x)`);
    
    // Insight 3: K/B Balance
    const kbDist = analyzeKBDistribution();
    const total_kb = kbDist.small + kbDist.big;
    const kPct = ((kbDist.small / total_kb) * 100).toFixed(0);
    const bPct = ((kbDist.big / total_kb) * 100).toFixed(0);
    
    insights.push(`⚖️ K:B Ratio = ${kPct}%:${bPct}% (${kbDist.small}:${kbDist.big})`);
    
    // Insight 4: Recent pattern
    const recent = getRecentPattern(10);
    if (recent.kCount > recent.bCount + 2) {
        insights.push(`🔴 10 game terakhir dominasi K → probabilitas B meningkat (balancing)`);
    } else if (recent.bCount > recent.kCount + 2) {
        insights.push(`🔵 10 game terakhir dominasi B → probabilitas K meningkat (balancing)`);
    } else {
        insights.push(`🔄 10 game terakhir relative seimbang → pola volatil`);
    }
    
    // Insight 5: Volatility
    const stats = calculateStatistics();
    if (parseFloat(stats.volatility) > 30) {
        insights.push(`📊 Volatilitas TINGGI (${stats.volatility}%) → pola tidak stabil, prediksi kurang akurat`);
    } else if (parseFloat(stats.volatility) < 15) {
        insights.push(`📊 Volatilitas RENDAH (${stats.volatility}%) → pola stabil, prediksi lebih akurat`);
    } else {
        insights.push(`📊 Volatilitas NORMAL (${stats.volatility}%) → pola wajar`);
    }
    
    // Insight 6: Alternation pattern
    const altIndex = parseFloat(calculateAlternationIndex());
    if (altIndex > 60) {
        insights.push(`🔀 Alternasi sangat tinggi (${altIndex.toFixed(0)}%) → pola alternating, expect stabilisasi`);
    } else if (altIndex < 30) {
        insights.push(`📌 Alternasi rendah (${altIndex.toFixed(0)}%) → pola clustering/momentum → expect kontinuitas`);
    }
    
    return insights;
}

// =====================================================
// UI UPDATE FUNCTIONS
// =====================================================

function updateQuickStats() {
    const totalGames = gameData.length;
    const kbDist = analyzeKBDistribution();
    
    document.getElementById('quickTotal').textContent = totalGames;
    
    if (totalGames > 0) {
        const kPct = ((kbDist.small / (kbDist.small + kbDist.big)) * 100).toFixed(0);
        document.getElementById('quickRatio').textContent = `${kPct}% K`;
    } else {
        document.getElementById('quickRatio').textContent = '-';
    }
    
    if (gameData.length > 0) {
        const lastGame = gameData[gameData.length - 1];
        const trendEmoji = lastGame.trend === 'naik' ? '↑' : lastGame.trend === 'turun' ? '↓' : '→';
        document.getElementById('quickTrend').textContent = `${trendEmoji} ${lastGame.trend}`;
        document.getElementById('quickState').textContent = lastGame.state2;
    } else {
        document.getElementById('quickTrend').textContent = '-';
        document.getElementById('quickState').textContent = '-';
    }
}

function updateTrendAnalysis() {
    const trends = analyzeTrends();
    
    document.getElementById('trendUp').textContent = trends.up;
    document.getElementById('trendDown').textContent = trends.down;
    document.getElementById('trendStable').textContent = trends.stable;
    
    const total = trends.up + trends.down + trends.stable || 1;
    
    document.getElementById('barUpMini').style.width = `${(trends.up / total) * 100}%`;
    document.getElementById('barDownMini').style.width = `${(trends.down / total) * 100}%`;
    document.getElementById('barStableMini').style.width = `${(trends.stable / total) * 100}%`;
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

function updateStatistics() {
    const stats = calculateStatistics();
    
    document.getElementById('totalGames').textContent = stats.total;
    document.getElementById('avgRoll1').textContent = stats.avgRoll1;
    document.getElementById('avgRoll2').textContent = stats.avgRoll2;
    document.getElementById('avgDiff').textContent = stats.avgDiff;
    document.getElementById('minRoll').textContent = stats.minRoll;
    document.getElementById('maxRoll').textContent = stats.maxRoll;
    document.getElementById('medianRoll').textContent = stats.medianRoll;
    document.getElementById('stdDevRoll').textContent = stats.stdDev;
    document.getElementById('volatilityRoll').textContent = `${stats.volatility}%`;
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

// =====================================================
// PREDICTION UI UPDATES
// =====================================================

function updatePredictionNext2() {
    const predictions = predictNext2Games();
    
    for (let i = 0; i < predictions.length; i++) {
        const pred = predictions[i];
        const step = i + 1;
        
        document.getElementById(`pred2_${step}_small`).textContent = `${pred.small}%`;
        document.getElementById(`pred2_${step}_big`).textContent = `${pred.big}%`;
        
        document.getElementById(`predBar2_${step}_small`).style.width = `${pred.small}%`;
        document.getElementById(`predBar2_${step}_big`).style.width = `${pred.big}%`;
        
        document.getElementById(`conf2_${step}`).textContent = `${pred.confidence}%`;
    }
}

function updatePredictionNext5() {
    const predictions = predictNext5Games();
    const container = document.getElementById('pred5Container');
    
    container.innerHTML = predictions.map((pred, idx) => `
        <div class="pred-game-card">
            <div class="pred-game-header">Game +${idx + 1}</div>
            <div class="pred-game-value">
                <div class="pred-mini-item small">
                    <div class="pred-mini-label">KECIL</div>
                    <div class="pred-mini-value">${pred.small}%</div>
                </div>
                <div class="pred-mini-item big">
                    <div class="pred-mini-label">BESAR</div>
                    <div class="pred-mini-value">${pred.big}%</div>
                </div>
            </div>
            <div class="prediction-confidence" style="font-size: 0.85em;">
                Confidence: ${pred.confidence}%
            </div>
        </div>
    `).join('');
}

function updatePredictionNext10() {
    const predictions = predictNext10Games();
    const container = document.getElementById('pred10Container');
    
    container.innerHTML = predictions.map((pred, idx) => `
        <div class="pred-game-card">
            <div class="pred-game-header">Game +${idx + 1}</div>
            <div class="pred-game-value">
                <div class="pred-mini-item small">
                    <div class="pred-mini-label">K</div>
                    <div class="pred-mini-value">${pred.small}%</div>
                </div>
                <div class="pred-mini-item big">
                    <div class="pred-mini-label">B</div>
                    <div class="pred-mini-value">${pred.big}%</div>
                </div>
            </div>
            <div class="prediction-confidence" style="font-size: 0.8em;">
                ${pred.confidence}%
            </div>
        </div>
    `).join('');
    
    const insights = generatePatternInsights();
    const insightsList = document.getElementById('patternInsightsList');
    insightsList.innerHTML = insights.map(insight => `<li>${insight}</li>`).join('');
}

// =====================================================
// TAB SWITCHING
// =====================================================

function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.prediction-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    
    // Add active to clicked button
    event.target.classList.add('active');
    
    // Update the specific prediction
    if (tabName === 'next2') {
        updatePredictionNext2();
    } else if (tabName === 'next5') {
        updatePredictionNext5();
    } else if (tabName === 'next10') {
        updatePredictionNext10();
    }
}

function switchBasisTab(tabName) {
    // Hide all basis tabs
    document.querySelectorAll('.basis-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active from all buttons
    document.querySelectorAll('.basis-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    
    // Add active to clicked button
    event.target.classList.add('active');
}

// =====================================================
// MASTER UPDATE FUNCTION
// =====================================================

function updateAllAnalysis() {
    renderTable();
    updateQuickStats();
    updateTrendAnalysis();
    updateStateDistribution();
    updateKBDistribution();
    updateStatistics();
    updateTransitionMatrix();
    updatePredictionNext2();
    updatePredictionNext5();
    updatePredictionNext10();
}