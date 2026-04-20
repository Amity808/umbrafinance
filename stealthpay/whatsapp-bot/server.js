const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const { MessagingResponse } = require('twilio').twiml;

dotenv.config();

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Dummy database mapping WhatsApp numbers to Freelancer Wallets
const userWallets = {
    // Example: 'whatsapp:+1234567890': '0xFb3...45B'
    default: '0x0000000000000000000000000000000000000000'
};

app.post('/whatsapp', (req, res) => {
    const incomingMsg = req.body.Body ? req.body.Body.trim().toLowerCase() : '';
    const sender = req.body.From;

    console.log(`[WHATSAPP MESSAGE] From ${sender}: ${incomingMsg}`);
    
    // MVP Bot Logic
    let replyText = "Welcome to StealthPay Bot 🕵️‍♂️\n\nTo generate a confidential FHE payment link, reply with:\n*invoice [amount] [description]*\n\nExample: *invoice 500 logo design*";

    if (incomingMsg.startsWith('invoice')) {
        const parts = incomingMsg.split(' ');
        if (parts.length >= 3) {
            const amount = parts[1];
            // Encode the description to make it URL safe
            const description = encodeURIComponent(parts.slice(2).join(' '));
            
            // Get wallet or use a default mock
            const walletAddress = userWallets[sender] || userWallets.default;
            
            // Link to the frontend we will build
            const link = `http://localhost:3001/pay/${walletAddress}?amount=${amount}&desc=${description}`;
            
            replyText = `⛓️ *Link Generated!*\n\nHere is your confidential payment link for $${amount}:\n${link}\n\n_When your client pays, the amount is encrypted via Fhenix and your total balance remains completely hidden on-chain._`;
        } else {
            replyText = "❌ Invalid format.\nTry: *invoice 500 logo design*";
        }
    }

    // Send Twilio XML Reply
    const twiml = new MessagingResponse();
    twiml.message(replyText);

    res.type('text/xml');
    res.send(twiml.toString());
});

app.get('/', (req, res) => {
    res.send("StealthPay WhatsApp Bot is active.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🤖 StealthPay WhatsApp Bot running on port ${PORT}`);
    console.log(`Ready to receive Twilio Webhooks at http://localhost:${PORT}/whatsapp`);
});
