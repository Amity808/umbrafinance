# 🚀 StealthPay: Confidential Escrow & Payments for the Modern Freelancer

**Live on Sepolia Testnet | Powered by Fhenix & Privara**

StealthPay is a privacy-first, fully homomorphically encrypted (FHE) payment and escrow platform built for freelancers, contractors, and their clients. By leveraging the Fhenix network and Privara SDK, StealthPay ensures that sensitive financial data—such as invoice amounts and wallet balances—remains completely confidential on a public blockchain.

Users can generate secure invoices, manage encrypted escrows, and decrypt their balances via a sleek React dashboard or directly on the go using our custom WhatsApp Bot.

---

## 🛑 The Problem
In the Web3 economy, public blockchains expose all financial history. When a freelancer accepts a crypto payment, their clients, competitors, and the public can view exactly how much they were paid, how much they hold, and who their other clients are. This transparency is a massive blocker for professional adoption of crypto payments.

## 💡 Our Solution
StealthPay brings **programmable privacy** to payments. Instead of transparent stablecoin transfers, StealthPay routes funds through FHE-encrypted vaults and conditional escrow contracts. 
* **Privacy:** Payment amounts and total balances are encrypted as `ctHash` handles. Only the authorized wallet owner can "deseal" and view the plaintext balance.
* **Trustless Escrow:** Funds are held in a decentralized escrow until the freelancer completes the work and the client approves it, eliminating counterparty risk.
* **Omnichannel Access:** Manage payments through our Web3 dashboard or send a simple WhatsApp message to our FHE-enabled bot to create or check an escrow.

---

## 🏗️ Technical Architecture & How We Built It

To bring StealthPay to life, we heavily utilized the tools, SDKs, and communities provided by both Fhenix and Privara:

### 1. Smart Contracts (Fhenix & CoFHE Integration)
* We leveraged the [Fhenix Documentation](https://docs.fhenix.io) and [Awesome Fhenix Examples](https://github.com/FhenixProtocol/awesome-fhenix) to build our encrypted smart contracts.
* Our `StealthPay` contract manages encrypted deposits and balances on the Ethereum Sepolia Testnet.
* We seamlessly integrated `@cofhe/sdk` and `@cofhe/react` into our frontend to handle the secure decryption and desealing of the user's FHE vault balances directly in the browser.

### 2. Programmable Escrow (Privara / ReineiraOS)
* We implemented the entire conditional payment lifecycle (Create, Fund, Redeem) using the [Privara SDK](https://www.npmjs.com/package/@reineira-os/sdk) (`@reineira-os/sdk`).
* The [Privara Docs](https://reineira.xyz/docs) and [Dev Toolkit](https://github.com/ReineiraOS/reineira-code) were critical in helping us orchestrate our cross-platform escrow logic.
* The SDK powers both our React Web App and our Node.js WhatsApp Bot, ensuring real-time syncing of escrow events (funded, redeemed) across all interfaces via Arbitrum Sepolia.

### 3. Community Support
A huge shoutout to the Fhenix Telegram/Discord and the [Privara Builder Support](https://t.me/ReineiraOS) channels for their invaluable help in debugging and optimizing our implementation along the way.

---

## ✨ Key Features
* **Encrypted Ledgers:** Invoice creation, funding, and settlement amounts are hidden from the public.
* **WhatsApp Bot Integration:** Interact with on-chain FHE smart contracts simply by messaging a WhatsApp bot.
* **Stealth Identities:** Register a unique username (e.g. `@amity`) mapped to your wallet to receive private payments seamlessly.
* **CoFHE Desealing:** Request decryption permits via the Fhenix Threshold Network to view your actual balances.

---

## 🚀 Status & Deployment
**Testnet Deployment Complete.** 
Our core smart contracts are deployed on the **Sepolia Testnet**, utilizing **Arbitrum Sepolia** RPCs for FHE data routing. The frontend React components and the backend Node.js WhatsApp bot are fully synced and operational.