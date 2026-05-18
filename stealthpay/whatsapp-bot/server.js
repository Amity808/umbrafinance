const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');
const { getUserEscrowHistory } = require('./services/reineira');
dotenv.config();

const STEALTH_PAY_ABI = [
    "function getBalance(address freelancer, address token) external view returns (uint256)",
    "function getRecordCount(address freelancer) external view returns (uint256)",
    "function getRecord(address freelancer, uint256 index) external view returns (string memory, string memory, uint256)",
    "function getLink(address freelancer, uint256 index) external view returns (string memory description, uint256 amount, uint256 timestamp, bool isPaid, bool freelancerDone, bool clientConfirmed, address payer)",
    "function botAuthorized(address user, address bot) external view returns (bool)",
    "function authorizeBot(address bot, bool status) external",
    "function botWithdraw(address freelancer, address token, uint256 amount, uint256 fee, address to) external",
    "function getLinksCount(address freelancer) external view returns (uint256)"
];

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const VERSION = 'v25.0'; // Updated to match your dashboard
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';
const STEALTH_PAY_ADDRESS = process.env.STEALTH_PAY_ADDRESS;
const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS;

// Ethers Setup
const provider = new ethers.JsonRpcProvider(process.env.FHE_RPC_URL);
const botWallet = new ethers.Wallet(process.env.BOT_PRIVATE_KEY, provider);
const stealthPayContract = new ethers.Contract(STEALTH_PAY_ADDRESS, STEALTH_PAY_ABI, botWallet);

// Helper to derive a deterministic wallet for a phone number
function getUserWallet(phoneNumber) {
    const seed = process.env.MASTER_SECRET + phoneNumber;
    const privateKey = ethers.id(seed); // Deterministic hash
    const wallet = new ethers.Wallet(privateKey, provider);
    return { address: wallet.address, privateKey, wallet };
}

// Local Mock DB (now just stores preferences, not the wallet itself)
const DB_PATH = path.join(__dirname, 'users.json');
if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({}));
}

function getUsers() {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function saveUser(whatsappId, walletAddress) {
    const users = getUsers();
    users[whatsappId] = walletAddress;
    fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2));
}

// Helper to send standard WhatsApp messages
async function sendWhatsAppMessage(to, text) {
    try {
        console.log(`[OUTGOING TEXT] To ${to}...`);
        const url = `https://graph.facebook.com/${VERSION}/${PHONE_NUMBER_ID}/messages`;
        await axios.post(url, {
            messaging_product: "whatsapp",
            to: to,
            type: "text",
            text: { body: text }
        }, { headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}` } });
    } catch (error) {
        console.error('[ERROR] WhatsApp API Error:', error.response ? error.response.data : error.message);
    }
}

// Helper to send Interactive Button Menu
async function sendInteractiveMenu(to, walletAddress, privateKey) {
    try {
        console.log(`[OUTGOING MENU] To ${to}...`);
        const url = `https://graph.facebook.com/${VERSION}/${PHONE_NUMBER_ID}/messages`;
        
        // Zero-gas architecture: Give the user their key
        const welcomeText = `Welcome to StealthPay.\n\nYour vault address is:\n*${walletAddress}*\n\n*IMPORTANT*: Your Vault Private Key is:\n${privateKey}\n\nImport it into MetaMask to securely withdraw your funds on stealthfront.com without platform gas fees.\n\n*Commands:*\n/escrow [amount] [address]\n/invoice [amount] [desc]\n/withdraw\n/history`;

        await axios.post(url, {
            messaging_product: "whatsapp",
            to: to,
            type: "interactive",
            interactive: {
                type: "button",
                body: { text: welcomeText },
                action: {
                    buttons: [
                        { type: "reply", reply: { id: "btn_balance", title: "Balance" } },
                        { type: "reply", reply: { id: "btn_links", title: "Link Status" } },
                        { type: "reply", reply: { id: "btn_invoice", title: "New Invoice" } }
                    ]
                }
            }
        }, { headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}` } });
    } catch (error) {
        console.error('❌ [ERROR] WhatsApp Interactive Error:', error.response ? error.response.data : error.message);
    }
}

// Webhook Verification (GET)
app.get('/whatsapp', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    }
});

// Webhook Event Handling (POST)
app.post('/whatsapp', async (req, res) => {
    const body = req.body;

    if (body.object === 'whatsapp_business_account') {
        if (body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages) {
            const message = body.entry[0].changes[0].value.messages[0];
            const sender = message.from; // Phone number
            
            let text = '';
            
            // Handle standard text
            if (message.type === 'text') {
                text = message.text.body.trim().toLowerCase();
                console.log(`[MESSAGE] From ${sender}: ${text}`);
            } 
            // Handle interactive button clicks
            else if (message.type === 'interactive') {
                const buttonId = message.interactive.button_reply.id;
                console.log(`[BUTTON CLICK] From ${sender}: ${buttonId}`);
                
                if (buttonId === 'btn_balance') text = '/balance';
                if (buttonId === 'btn_links') text = '/links';
                if (buttonId === 'btn_invoice') text = 'btn_invoice';
                if (buttonId === 'btn_withdraw') text = 'btn_withdraw';
            }

            if (text) {
                await handleCommand(sender, text);
            }
        }
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
});

async function handleCommand(sender, rawText) {
    const userWalletInfo = getUserWallet(sender);
    const walletAddress = userWalletInfo.address;
    const privateKey = userWalletInfo.privateKey;
    const userWallet = userWalletInfo.wallet;

    // Strip leading slash for command parsing
    const text = rawText.startsWith('/') ? rawText.slice(1) : rawText;

    if (text === 'hi' || text === 'hello' || text === 'start' || text === 'help' || text === '') {
        await sendInteractiveMenu(sender, walletAddress, privateKey);
        return;
    }

    if (text === 'btn_invoice') {
        await sendWhatsAppMessage(sender, `*To generate an invoice link, type:*\n\n/invoice [amount] [description]\n\nExample:\n/invoice 150 website design`);
        return;
    }

    if (text === 'btn_withdraw') {
        await sendWhatsAppMessage(sender, `*To withdraw funds, type:*\n\n/withdraw\n\nYou will receive a link to securely redeem your funds on the dashboard.`);
        return;
    }

    if (text.startsWith('register')) {
        await sendWhatsAppMessage(sender, `✅ You are already registered!\nYour auto-generated vault address is:\n*${walletAddress}*`);
        return;
    }

    if (text.startsWith('invoice')) {
        const parts = text.split(' ');
        if (parts.length >= 3) {
            const amount = parts[1];
            const description = encodeURIComponent(parts.slice(2).join(' '));
            const link = `${FRONTEND_URL}/pay/${walletAddress}?amount=${amount}&desc=${description}`;
            
            const reply = `*Link Generated*\n\nInvoice: $${amount}\nDescription: ${decodeURIComponent(description)}\n\nLink: ${link}`;
            await sendWhatsAppMessage(sender, reply);
        } else {
            await sendWhatsAppMessage(sender, "Invalid format. Try: /invoice 500 logo design");
        }
        return;
    }

    if (text.startsWith('escrow')) {
        const parts = text.split(' ');
        if (parts.length >= 3) {
            const amount = parts[1];
            const address = parts[2];
            const link = `${FRONTEND_URL}/pay/${address}?amount=${amount}&desc=Insured_Escrow`;
            
            const reply = `*Escrow Link Generated*\n\nSend this link to your client to securely fund an escrow for ${address}:\n${link}`;
            await sendWhatsAppMessage(sender, reply);
        } else {
            await sendWhatsAppMessage(sender, "Invalid format. Try: /escrow 500 0xYourAddress");
        }
        return;
    }

    if (text === 'balance' || text === 'history') {
        try {
            await sendWhatsAppMessage(sender, `Fetching Escrow history from Reineira OS...`);
            
            const history = await getUserEscrowHistory(walletAddress);
            
            let report = `*Reineira Escrow Report*\n\n`;
            report += `Created Escrows: ${history.created.length}\n`;
            report += `Funded Escrows: ${history.funded.length}\n`;
            report += `Redeemed Escrows: ${history.redeemed.length}\n\n`;
            
            report += `Note: To view your exact balances and decrypt them, please import your Private Key into MetaMask and visit stealthfront.com.`;
            
            await sendWhatsAppMessage(sender, report);
        } catch (error) {
            console.error('On-chain error:', error);
            await sendWhatsAppMessage(sender, "Error fetching from Reineira OS.");
        }
        return;
    }

    if (text === 'links' || text === 'status') {
        try {
            await sendWhatsAppMessage(sender, `Fetching invoice status...`);
            
            const linksCount = await stealthPayContract.getLinksCount(walletAddress);
            const count = Number(linksCount);

            if (count === 0) {
                await sendWhatsAppMessage(sender, "No invoices have been generated.");
            } else {
                let report = `*Invoice Link Status*\nTotal Links Generated: ${count}\n\n*Recent Invoices:*\n`;
                
                // Fetch last 5 links
                for (let i = Math.max(0, count - 5); i < count; i++) {
                    const link = await stealthPayContract.getLink(walletAddress, i);
                    const desc = link[0];
                    const amount = link[1];
                    const isPaid = link[3];
                    
                    const statusText = isPaid ? "PAID" : "PENDING";
                    report += `\n- $${amount} - "${desc}"\n  Status: ${statusText}\n`;
                }
                
                await sendWhatsAppMessage(sender, report);
            }
        } catch (error) {
            console.error('Link fetch error:', error);
            await sendWhatsAppMessage(sender, "Error fetching links from the network.");
        }
        return;
    }

    if (text.startsWith('withdraw') || text.startsWith('redeem')) {
        await sendWhatsAppMessage(sender, `*Zero-Gas Architecture Active*\n\nTo withdraw your Escrow funds securely:\n1. Import your generated Private Key into MetaMask.\n2. Visit stealthfront.com dashboard.\n3. Connect your wallet and click *Redeem* on your active escrows.\n\nYou control your gas and your funds.`);
        return;
    }

    await sendWhatsAppMessage(sender, "Unknown command. Type /help for options.");
}

app.get('/', (req, res) => {
    res.send("StealthPay Meta Bot is active.");
});

app.listen(PORT, () => {
    console.log(`🤖 StealthPay Meta Bot running on port ${PORT}`);
});
