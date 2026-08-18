let balance = 0.00; // 🎯 डिफ़ॉल्ट बैलेंस यहाँ भी ₹0.00 कर दिया गया है!
let gameDuration = 30; 
let timeLeft = gameDuration;
let currentPeriod = 2026081810005472;
let activeSelection = '';
let baseAmount = 1;
let multiplier = 1;

let userBetSelection = null;
let userBetAmount = 0;

let userPhone = localStorage.getItem('userPhone') || "9999999999";

async function fetchLiveBalanceFromServer() {
    if (!userPhone) return;
    try {
        let response = await fetch(` https://my-91club-game.onrender.com${userPhone}`);
        let data = await response.json();
        if (data.success) {
            updateAllBalances(data.balance);
        }
    } catch (e) {
        console.log("बैलेंस लोड नहीं हो सका.");
    }
}

setInterval(() => {
    let s1 = document.getElementById('timer-s1');
    let s2 = document.getElementById('timer-s2');
    
    if (s1 && s2) {
        if (timeLeft > 0) {
            timeLeft--;
            updateTimerDisplay();
            
            let overlay = document.getElementById('big-countdown-overlay');
            let bigNumber = document.getElementById('big-timer-number');
            if (timeLeft <= 4 && overlay && bigNumber) {
                overlay.classList.remove('hidden');
                bigNumber.innerText = "0" + timeLeft;
                closeBetPopup();
            } else if (overlay) {
                overlay.classList.add('hidden');
            }
        } else {
            fetchAdminResultAndDeclare();
        }
    }
}, 1000);

setInterval(fetchLiveBalanceFromServer, 3000);

function updateTimerDisplay() {
    let sStr = timeLeft.toString().padStart(2, '0');
    let s1 = document.getElementById('timer-s1');
    let s2 = document.getElementById('timer-s2');
    if (s1 && s2) {
        s1.innerText = sStr.charAt(0);
        s2.innerText = sStr.charAt(1);
    }
}

function changeGameMode(seconds, modeText) {
    gameDuration = seconds;
    timeLeft = gameDuration;
    let titleMode = document.getElementById('game-title-mode');
    if (titleMode) titleMode.innerText = modeText;
    document.querySelectorAll('.time-modes-bar .mode-tab-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
    updateTimerDisplay();
}

function switchPage(pageId) {
    let pages = ['home-screen', 'game-screen', 'deposit-screen', 'withdraw-screen'];
    pages.forEach(id => {
        let el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
    let activePage = document.getElementById(pageId);
    if (activePage) activePage.classList.remove('hidden');

    document.querySelectorAll('.bottom-nav .nav-item').forEach(nav => nav.classList.remove('active'));
    if(pageId === 'home-screen') document.getElementById('nav-home').classList.add('active');
    if(pageId === 'game-screen') document.getElementById('nav-game').classList.add('active');
    if(pageId === 'deposit-screen') document.getElementById('nav-deposit').classList.add('active');
    if(pageId === 'withdraw-screen') document.getElementById('nav-withdraw').classList.add('active');
    
    fetchLiveBalanceFromServer();
}

function openBetPopup(selection) {
    if (timeLeft <= 4) return;
    activeSelection = selection;
    let popSel = document.getElementById('popup-selection');
    if (popSel) popSel.innerText = selection;
    
    let banner = document.getElementById('popup-header-banner');
    if (banner) {
        if(selection === 'Green' || selection === 'Big') banner.style.background = '#4caf50';
        else if(selection === 'Red' || selection === 'Small') banner.style.background = '#f44336';
        else banner.style.background = '#b159ff';
    }
    let betPopup = document.getElementById('bet-popup');
    if (betPopup) betPopup.classList.remove('hidden');
    calculateTotal();
}

function closeBetPopup() { 
    let betPopup = document.getElementById('bet-popup');
    if (betPopup) betPopup.classList.add('hidden'); 
}

function setBaseAmount(amt) { 
    baseAmount = amt; 
    document.querySelectorAll('.text-options button').forEach(b => b.classList.remove('active'));
    let btn = document.getElementById('am-' + amt);
    if (btn) btn.classList.add('active');
    calculateTotal(); 
}

function setMultiplier(mult) { 
    multiplier = mult; 
    document.querySelectorAll('.mult-options button').forEach(b => b.classList.remove('active'));
    let btn = document.getElementById('mu-' + mult);
    if (btn) btn.classList.add('active');
    calculateTotal(); 
}

function calculateTotal() { 
    let totalAmt = document.getElementById('total-bet-amount');
    if (totalAmt) totalAmt.innerText = (baseAmount * multiplier).toFixed(2); 
}

async function confirmBet() {
    let total = baseAmount * multiplier;
    if(balance < total) { alert("बैलेंस कम है!"); return; }
    userBetSelection = activeSelection;
    userBetAmount = total;
    
    try {
        let response = await fetch(' https://my-91club-game.onrender.com', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: userPhone, amount: total })
        });
        if(response.ok) {
            updateAllBalances(balance - total);
            alert(`सफलतापूर्वक ₹${total} की बेट लग गई!`);
            closeBetPopup();
        }
    } catch (e) { alert("बेट सर्वर एरर!"); }
}

async function fetchAdminResultAndDeclare() {
    let num = Math.floor(Math.random() * 10);
    let bs = num >= 5 ? "Big" : "Small";
    let col = (num === 0 || num === 5) ? "Violet" : (num % 2 === 0 ? "Red" : "Green");

    try {
        let response = await fetch(' https://my-91club-game.onrender.com');
        let adminData = await response.json();

        if (adminData.type === 'color' && adminData.value !== '') {
            col = adminData.value;
            if (col === 'Red') num =[Math.floor(Math.random() * 5)] * 2;
            if (col === 'Green') num =[Math.floor(Math.random() * 5)] * 2 + 1;
            if (col === 'Violet') num = Math.random() > 0.5 ? 0 : 5;
            bs = num >= 5 ? "Big" : "Small";
        }
        else if (adminData.type === 'number' && adminData.value !== '') {
            num = parseInt(adminData.value);
            bs = num >= 5 ? "Big" : "Small";
            col = (num === 0 || num === 5) ? "Violet" : (num % 2 === 0 ? "Red" : "Green");
        }
    } catch (error) { console.log("रैंडम मोड एक्टिव है."); }

    let colorHex = col === "Green" ? "#4caf50" : (col === "Red" ? "#f44336" : "#b159ff");

    if (userBetSelection !== null) {
        let isWin = (userBetSelection === col || userBetSelection === bs || userBetSelection === num.toString());
        try {
            await fetch(' https://my-91club-game.onrender.com', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: userPhone, isWin: isWin, betAmount: userBetAmount })
            });
            if (isWin) { alert(`🎉 परिणाम ${col} (${num}) आया. आप जीत गए!`); } 
            else { alert(`❌ परिणाम ${col} (${num}) आया. आप हार गए.`); }
            fetchLiveBalanceFromServer();
        } catch(e) { console.log("सैटलमेंट फेल"); }
    }

    userBetSelection = null; userBetAmount = 0;
    let row = `<tr><td>${currentPeriod}</td><td style="font-weight:bold; color:${colorHex}">${num}</td><td>${bs}</td><td><span style="height:10px; width:10px; background-color:${colorHex}; border-radius:50%; display:inline-block;"></span></td></tr>`;
    let rows = document.getElementById('history-rows');
    if (rows) rows.insertAdjacentHTML('afterbegin', row);

    timeLeft = gameDuration; currentPeriod++;
    let periodBox = document.getElementById('period-number');
    if (periodBox) periodBox.innerText = currentPeriod;
}

function setDepAmt(amt) {
    let depInput = document.getElementById('dep-amount');
    if (depInput) depInput.value = amt;
}

async function addMoney() {
    let amtInput = document.getElementById('dep-amount');
    if (!amtInput) return;
    let amt = parseFloat(amtInput.value);
    if(isNaN(amt) || amt <= 0) { alert("कृपया सही राशि डालें"); return; }
    try {
        let response = await fetch(' https://my-91club-game.onrender.com', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: userPhone, amount: amt })
        });
        let data = await response.json();
        alert(data.message);
        amtInput.value = '';
        switchPage('home-screen');
    } catch (e) { alert("सर्वर कनेक्शन फेल!"); }
}

async function takeMoney() {
    let amtInput = document.getElementById('wit-amount');
    let otpInput = document.getElementById('wit-otp');
    if (!amtInput || !otpInput) return;
    let amt = parseFloat(amtInput.value);
    let otp = otpInput.value;
    if(isNaN(amt) || amt <= 0 || amt > balance) { alert("गलत राशि या कम बैलेंस!"); return; }
    if(otp !== "5566") { alert("गलत विथड्रॉल OTP!"); return; }
    try {
        let response = await fetch(' https://my-91club-game.onrender.com', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: userPhone, amount: amt })
        });
        let data = await response.json();
        if(response.ok) {
            alert(data.message);
            amtInput.value = ''; otpInput.value = '';
            switchPage('home-screen');
            setTimeout(fetchLiveBalanceFromServer, 1000);
        } else { alert(data.message); }
    } catch (e) { alert("सर्वर कनेक्शन फेल!"); }
}

function updateAllBalances(newBalance) {
    balance = newBalance;
    let ids = ['user-balance-home', 'user-balance-game', 'user-balance-deposit', 'user-balance-withdraw'];
    ids.forEach(id => {
        let el = document.getElementById(id);
        if (el) el.innerText = balance.toFixed(2);
    });
}