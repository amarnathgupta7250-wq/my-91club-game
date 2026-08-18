let balance = 0.00; 
let gameDuration = 30; 
let timeLeft = gameDuration;
let currentPeriod = 2026081810005472;
let activeSelection = '';
let baseAmount = 1;
let multiplier = 1;
let userBetSelection = null;
let userBetAmount = 0;
let userPhone = localStorage.getItem('userPhone') || "9999999999";

// 🎯 आपका असली ऑनलाइन लाइव सर्वर लिंक
const ONLINE_API_URL = "https://glitch.me";

async function fetchLiveBalanceFromServer() {
    if (!userPhone) return;
    try {
        let response = await fetch(`${ONLINE_API_URL}/api/user/get-balance?phone=${userPhone}`);
        let data = await response.json();
        if (data.success) { updateAllBalances(data.balance); }
    } catch (e) { console.log("बैलेंस लोड एरर."); }
}

setInterval(() => {
    if (timeLeft > 0) {
        timeLeft--;
        updateTimerDisplay();
    } else {
        fetchAdminResultAndDeclare();
    }
}, 1000);

setInterval(fetchLiveBalanceFromServer, 3000);

function updateTimerDisplay() {
    let sStr = timeLeft.toString().padStart(2, '0');
    let s1 = document.getElementById('timer-s1');
    let s2 = document.getElementById('timer-s2');
    if (s1 && s2) { s1.innerText = sStr.charAt(0); s2.innerText = sStr.charAt(1); }
}

function switchPage(pageId) {
    let pages = ['home-screen', 'game-screen', 'deposit-screen', 'withdraw-screen'];
    pages.forEach(id => { let el = document.getElementById(id); if (el) el.classList.add('hidden'); });
    let activePage = document.getElementById(pageId); if (activePage) activePage.classList.remove('hidden');
    fetchLiveBalanceFromServer();
}

function openBetPopup(selection) {
    if (timeLeft <= 4) return;
    activeSelection = selection;
    let popSel = document.getElementById('popup-selection'); if (popSel) popSel.innerText = selection;
    let betPopup = document.getElementById('bet-popup'); if (betPopup) betPopup.classList.remove('hidden');
}

function closeBetPopup() { let betPopup = document.getElementById('bet-popup'); if (betPopup) betPopup.classList.add('hidden'); }

async function confirmBet() {
    let total = baseAmount * multiplier;
    if(balance < total) { alert("बैलेंस कम है!"); return; }
    try {
        let response = await fetch(`${ONLINE_API_URL}/api/user/update-balance-bet`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: userPhone, amount: total }) });
        if(response.ok) { updateAllBalances(balance - total); alert(`बेट लग गई!`); closeBetPopup(); }
    } catch (e) { alert("बेट सर्ver एरर!"); }
}

async function fetchAdminResultAndDeclare() {
    let num = Math.floor(Math.random() * 10);
    let bs = num >= 5 ? "Big" : "Small";
    let col = (num === 0 || num === 5) ? "Violet" : (num % 2 === 0 ? "Red" : "Green");
    let colorHex = col === "Green" ? "#4caf50" : (col === "Red" ? "#f44336" : "#b159ff");
    let row = `<tr><td>${currentPeriod}</td><td style="font-weight:bold; color:${colorHex}">${num}</td><td>${bs}</td><td><span style="height:10px; width:10px; background-color:${colorHex}; border-radius:50%; display:inline-block;"></span></td></tr>`;
    let rows = document.getElementById('history-rows'); if (rows) rows.insertAdjacentHTML('afterbegin', row);
    timeLeft = gameDuration; currentPeriod++;
}

async function addMoney() {
    let amtInput = document.getElementById('dep-amount'); if (!amtInput) return;
    let amt = parseFloat(amtInput.value);
    try {
        await fetch(`${ONLINE_API_URL}/api/user/deposit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: userPhone, amount: amt }) });
        alert("💸 डिपॉजिट रिक्वेस्ट एडमिन को भेज दी गई है!");
        switchPage('home-screen');
    } catch (e) { alert("कनेक्शन फेल!"); }
}

function updateAllBalances(newBalance) {
    balance = newBalance;
    let ids = ['user-balance-home', 'user-balance-game', 'user-balance-deposit', 'user-balance-withdraw'];
    ids.forEach(id => { let el = document.getElementById(id); if (el) el.innerText = balance.toFixed(2); });
}
fetchLiveBalanceFromServer();