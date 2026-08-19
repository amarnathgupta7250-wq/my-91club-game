const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
app.use(express.json());
app.use(cors());
const PORT = process.env.PORT || 5000;

// 🌐 यहाँ ऑनलाइन क्लाउड डेटाबेस (MongoDB Atlas) का असली लिंक सेट है ताकि इंटरनेट पर डेटा सेव हो सके 🎯
const ONLINE_MONGO_URI = "mongodb+srv://amarnath:club9191@cluster0.v8n2a.mongodb.net/91club_live?retryWrites=true&w=majority";

mongoose.connect('mongodb://127.0.0.1:27017/91club_db')
    .then(() => console.log("ऑनलाइन क्लाउड डेटाबेस सफलतापूर्वक कनेक्टेड! 🚀"))
    .catch((err) => console.log("डेटाबेस एरर: ", err));

const User = mongoose.model('User', new mongoose.Schema({
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    balance: { type: Number, default: 0.00 }
}));

const Transaction = mongoose.model('Transaction', new mongoose.Schema({
    phone: String, amount: Number, type: String, status: { type: String, default: 'pending' }
}));

let nextResultType = 'random'; let nextResultValue = '';

app.get('/api/user/get-balance', async (req, res) => {
    const user = await User.findOne({ phone: req.query.phone });
    if (user) res.json({ success: true, balance: user.balance });
    else res.status(404).json({ success: false });
});

app.post('/api/user/update-balance-bet', async (req, res) => {
    const user = await User.findOne({ phone: req.body.phone });
    if (user && user.balance >= req.body.amount) { user.balance -= req.body.amount; await user.save(); res.json({ success: true }); }
    else { res.status(400).json({ success: false }); }
});

app.post('/api/user/settle-bet', async (req, res) => {
    const user = await User.findOne({ phone: req.body.phone });
    if (user && req.body.isWin) { user.balance += (req.body.betAmount * 2); await user.save(); }
    res.json({ success: true });
});

app.post('/api/register', async (req, res) => {
    try { await new User({ phone: req.body.phone, password: req.body.password }).save(); res.json({ success: true }); }
    catch (err) { res.status(400).json({ success: false, message: "नंबर पहले से मौजूद है!" }); }
});

app.post('/api/login', async (req, res) => {
    const user = await User.findOne({ phone: req.body.phone, password: req.body.password });
    if (user) res.json({ success: true, phone: user.phone, balance: user.balance });
    else res.status(400).json({ success: false, message: "गलत नंबर या पासवर्ड!" });
});

app.post('/api/user/deposit', async (req, res) => {
    await new Transaction({ phone: req.body.phone, amount: req.body.amount, type: 'deposit' }).save();
    res.json({ success: true, message: "डिपॉजिट रिक्वेस्ट भेज दी गई है!" });
});

app.post('/api/admin/handle-request', async (req, res) => {
    const tx = await Transaction.findById(req.body.txId);
    const user = await User.findOne({ phone: tx.phone });
    if (req.body.status === 'pass' && user) { user.balance += tx.amount; await user.save(); }
    tx.status = req.body.status; await tx.save();
    res.json({ message: "सफल!" });
});

app.get('/api/game/get-next-result', (req, res) => { res.json({ type: nextResultType, value: nextResultValue }); nextResultType = 'random'; nextResultValue = ''; });
app.post('/api/admin/set-result', (req, res) => { nextResultType = req.body.type; nextResultValue = Math.floor(Math.random() * 10); res.json({ success: true }); });

app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });