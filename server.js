const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = 5000;

// 🔌 डेटाबेस कनेक्शन
mongoose.connect('mongodb://127.0.0.1:27017/91club_db')
    .then(() => console.log("डेटाबेस (MongoDB) सफलतापूर्वक कनेक्ट हो गया है! 🔌"))
    .catch((err) => console.log("डेटाबेस कनेक्शन एरर: ", err));

// 👤 यूजर मॉडल (डिफ़ॉल्ट बैलेंस यहाँ ₹0.00 कर दिया गया है 🎯)
const User = mongoose.model('User', new mongoose.Schema({
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    balance: { type: Number, default: 0.00 } 
}));

// 🗂️ ट्रांजैक्शन मॉडल
const Transaction = mongoose.model('Transaction', new mongoose.Schema({
    phone: String,
    amount: Number,
    type: String, 
    status: { type: String, default: 'pending' } 
}));

let nextResultType = 'random'; 
let nextResultValue = '';

// ==================== ग्राहकों के लिए रूट्स ====================

app.get('/api/user/get-balance', async (req, res) => {
    const { phone } = req.query;
    const user = await User.findOne({ phone });
    if (user) res.json({ success: true, balance: user.balance });
    else res.status(404).json({ success: false });
});

app.post('/api/user/update-balance-bet', async (req, res) => {
    const { phone, amount } = req.body;
    const user = await User.findOne({ phone });
    if (user && user.balance >= amount) {
        user.balance -= amount;
        await user.save();
        res.json({ success: true });
    } else { res.status(400).json({ success: false }); }
});

app.post('/api/user/settle-bet', async (req, res) => {
    const { phone, isWin, betAmount } = req.body;
    const user = await User.findOne({ phone });
    if (user && isWin) {
        user.balance += (betAmount * 2); 
        await user.save();
    }
    res.json({ success: true });
});

app.post('/api/register', async (req, res) => {
    const { phone, password, otp } = req.body;
    if (otp !== "5566") return res.status(400).json({ success: false, message: "गलत OTP!" });
    try {
        await new User({ phone, password }).save();
        res.json({ success: true });
    } catch (err) { res.status(400).json({ success: false, message: "नंबर पहले से रजिस्टर्ड है!" }); }
});

app.post('/api/login', async (req, res) => {
    const { phone, password } = req.body;
    const user = await User.findOne({ phone, password });
    if (user) res.json({ success: true, phone: user.phone, balance: user.balance });
    else res.status(400).json({ success: false, message: "गलत नंबर या पासवर्ड!" });
});

app.post('/api/user/deposit', async (req, res) => {
    const { phone, amount } = req.body;
    await new Transaction({ phone, amount, type: 'deposit' }).save();
    res.json({ success: true, message: "डिपॉजिट रिक्वेस्ट एडमिन को भेज दी गई है!" });
});

app.post('/api/user/withdraw', async (req, res) => {
    const { phone, amount } = req.body;
    const user = await User.findOne({ phone });
    if(user.balance < amount) return res.status(400).json({ success: false, message: "बैलेंस कम है!" });
    
    user.balance -= amount;
    await user.save();
    await new Transaction({ phone, amount, type: 'withdraw' }).save();
    res.json({ success: true, message: "विथड्रॉल रिक्वेस्ट एडमिन को भेज दी गई है!" });
});

// ==================== एडमिन रूट्स ====================

app.post('/api/admin/set-result', (req, res) => {
    const { type, value } = req.body;
    nextResultType = type; nextResultValue = value;
    res.json({ success: true });
});

app.get('/api/game/get-next-result', (req, res) => {
    res.json({ type: nextResultType, value: nextResultValue });
    nextResultType = 'random'; nextResultValue = '';
});

app.get('/api/admin/get-requests', async (req, res) => {
    const deposits = await Transaction.find({ type: 'deposit', status: 'pending' });
    const withdraws = await Transaction.find({ type: 'withdraw', status: 'pending' });
    res.json({ deposits, withdraws });
});

app.post('/api/admin/handle-request', async (req, res) => {
    const { type, txId, status } = req.body;
    const tx = await Transaction.findById(txId);
    if (!tx) return res.status(404).json({ message: "रिक्वेस्ट नहीं मिली!" });

    const user = await User.findOne({ phone: tx.phone });

    if (type === 'deposit') {
        if (status === 'pass' && user) {
            user.balance += tx.amount; 
            await user.save();
            tx.status = 'pass';
        } else { tx.status = 'fail'; }
    } else if (type === 'withdraw') {
        if (status === 'pass') { tx.status = 'pass'; } 
        else if (user) {
            user.balance += tx.amount; 
            await user.save();
            tx.status = 'fail';
        }
    }
    await tx.save();
    res.json({ message: `रिक्वेस्ट सफलतापूर्वक ${status === 'pass' ? 'पास' : 'फेल'} कर दी गई है!` });
});

app.listen(PORT, () => { console.log(`Server is running on port ${PORT}`); });