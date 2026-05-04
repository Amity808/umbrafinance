const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

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
    return new ethers.Wallet(privateKey, provider);
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
        console.error('❌ [ERROR] WhatsApp API Error:', error.response ? error.response.data : error.message);
    }
}

// Helper to send Interactive Button Menu
async function sendInteractiveMenu(to, walletAddress) {
    try {
        console.log(`[OUTGOING MENU] To ${to}...`);
        const url = `https://graph.facebook.com/${VERSION}/${PHONE_NUMBER_ID}/messages`;
        await axios.post(url, {
            messaging_product: "whatsapp",
            to: to,
            type: "interactive",
            interactive: {
                type: "button",
                body: { text: `Welcome to StealthPay.\n\nYour confidential vault address is:\n*${walletAddress}*\n\nSelect an action below or use slash commands (e.g. /invoice 100).` },
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
    const userWallet = getUserWallet(sender);
    const walletAddress = userWallet.address;

    // Strip leading slash for command parsing
    const text = rawText.startsWith('/') ? rawText.slice(1) : rawText;

    if (text === 'hi' || text === 'hello' || text === 'start' || text === 'help' || text === '') {
        await sendInteractiveMenu(sender, walletAddress);
        return;
    }

    if (text === 'btn_invoice') {
        await sendWhatsAppMessage(sender, `*To generate an invoice link, type:*\n\n/invoice [amount] [description]\n\nExample:\n/invoice 150 website design`);
        return;
    }

    if (text === 'btn_withdraw') {
        await sendWhatsAppMessage(sender, `*To withdraw funds, type:*\n\n/withdraw [amount] [0xYourAddress]\n\nExample:\n/withdraw 50 0x123...abc`);
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

    if (text === 'balance' || text === 'history') {
        try {
            await sendWhatsAppMessage(sender, `Accessing network for wallet ${walletAddress}...`);
            
            const isAuthorized = await stealthPayContract.botAuthorized(walletAddress, botWallet.address);
            
            if (!isAuthorized) {
                await sendWhatsAppMessage(sender, `*Setup Required*\n\nInitializing vault authorization. This will take approximately 15 seconds.`);
                try {
                    // 1. Send gas from Master to User
                    console.log(`Funding user ${walletAddress} for gas...`);
                    const fundTx = await botWallet.sendTransaction({
                        to: walletAddress,
                        value: ethers.parseEther("0.002") // small gas amount
                    });
                    await fundTx.wait();

                    // 2. User authorizes Bot
                    console.log(`Authorizing bot for ${walletAddress}...`);
                    const userContract = new ethers.Contract(STEALTH_PAY_ADDRESS, STEALTH_PAY_ABI, userWallet);
                    const authTx = await userContract.authorizeBot(botWallet.address, true);
                    await authTx.wait();

                    await sendWhatsAppMessage(sender, `*Setup Complete*\n\nAuthorization successful. Please request your balance again.`);
                } catch (setupError) {
                    console.error('Setup Error:', setupError);
                    await sendWhatsAppMessage(sender, `Setup failed. Transaction could not be processed.`);
                }
                return;
            }

            const recordCount = await stealthPayContract.getRecordCount(walletAddress);
            const count = Number(recordCount);

            if (count === 0) {
                await sendWhatsAppMessage(sender, "No payments received in your vault.");
            } else {
                let report = `*Payout Report*\nTotal Payments: ${count}\n\n*Recent Activity:*\n`;
                
                // Fetch last 3 records
                for (let i = Math.max(0, count - 3); i < count; i++) {
                    const [name, desc, amount] = await stealthPayContract.getRecord(walletAddress, i);
                    report += `\n- $${amount} from ${name}\n  "${desc}"\n`;
                }

                report += `\nNote: Encrypted balance is hidden.`;
                await sendWhatsAppMessage(sender, report);
            }
        } catch (error) {
            console.error('On-chain error:', error);
            await sendWhatsAppMessage(sender, "Error connecting to the network. Please try again later.");
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

    if (text.startsWith('withdraw')) {
        const parts = text.split(' ');
        if (parts.length >= 3) {
            const amountStr = parts[1];
            const toAddress = parts[2];
            const amount = parseFloat(amountStr);

            if (isNaN(amount) || !ethers.isAddress(toAddress)) {
                await sendWhatsAppMessage(sender, "Invalid format. Try: /withdraw 100 0xAddress");
                return;
            }

            const fee = Math.max(1, Math.floor(amount * 0.02)); // 2% fee, min $1
            const netAmount = amount - fee;

            await sendWhatsAppMessage(sender, `*Withdrawal Initiated*\n\nRequested: $${amount}\nPlatform Fee: $${fee}\nNet to receive: $${netAmount}\n\nProcessing transaction...`);
            
            try {
                const tx = await stealthPayContract.botWithdraw(
                    walletAddress,
                    TOKEN_ADDRESS,
                    BigInt(netAmount),
                    BigInt(fee),
                    toAddress
                );
                
                await sendWhatsAppMessage(sender, `Transaction submitted. Waiting for confirmation...`);
                
                const receipt = await tx.wait();
                
                await sendWhatsAppMessage(sender, `*Withdrawal Successful*\n\nFunds sent to:\n${toAddress}\n\nTransaction Hash: ${receipt.hash}`);
            } catch (txError) {
                console.error('Withdrawal TX Error:', txError);
                await sendWhatsAppMessage(sender, "Transaction failed. Please verify your balance.");
            }
        } else {
            await sendWhatsAppMessage(sender, "Invalid format. Try: /withdraw 50 0xRecipientAddress");
        }
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
