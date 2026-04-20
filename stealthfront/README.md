# StealthPay // FHE-Powered Confidential Payments

**StealthPay** is a revolutionary confidential payment protocol built on **Fhenix**. It leverages Fully Homomorphic Encryption (FHE) to bring institutional-grade financial privacy to on-chain settlements, enabling freelancers and businesses to transact without exposing their balances or payment history to the public.

---

## 🔐 What it does?

StealthPay provides a seamless, privacy-first financial layer for the decentralized economy:
*   **Confidential Settlements**: Vault balances and transaction amounts remain entirely encrypted on-chain, visible only to authorized parties.
*   **Stealth Identities**: Replaces transparent wallet addresses with human-readable, on-chain usernames (e.g., `@amity`) for secure, private payment routing.
*   **Conditional Escrow**: A secure three-stage settlement system (Pay -> Mark Done -> Release) ensuring funds are only released after mutual confirmation.
*   **Client-Side Unsealing**: Integrates the CoFHE SDK allowing users to safely decrypt and view their plaintext balances directly in their browser.
*   **Identity Shielding**: Incorporates Privara (ReineiraOS) for multi-chain identity-secured conditional escrow.

## 🧱 The Problem it Solves

Public blockchains face a "transparency trap" that prevents real-world commercial adoption. 
*   **Financial Surveillance**: Standard transactions expose your wealth and income to everyone. StealthPay encrypts this data natively.
*   **Address Friction**: Complex wallet addresses lead to errors. StealthPay uses private, human-readable usernames.
*   **Trust Gap**: Freelance work often suffers from payment delays or counterparty risk. Our FHE-powered escrow ensures funds are committed before work begins and released only upon completion.
*   **Privacy UX**: Most privacy tools are complex. StealthPay makes privacy feel as simple as using PayPal.

## 🛠️ How we built it

StealthPay leverages a state-of-the-art privacy stack:
*   **Fhenix (Sepolia/Helium)**: Core settlement logic using `euint64` encrypted integers and FHE-native operations.
*   **CoFHE SDK (cofhejs)**: Threshold decryption primitives for off-chain unsealing using EIP-712 permits.
*   **ReineiraOS SDK (Privara)**: Multi-chain identity-shielding and conditional settlement demo.
*   **Frontend Stack**: Next.js 14, Wagmi, Viem, and RainbowKit.
*   **Dual-Resolution Architecture**: A robust fallback system that aggregates on-chain payment records to ensure accurate balance displays even when threshold nodes are under high load.

## 🚀 Challenges we ran into

*   **WASM & Webpack**: Integrating FHE-native WASM libraries (`cofhejs`, `tfhe`) into a modern Next.js environment required custom Webpack configurations to handle circular dependencies.
*   **Threshold Stability**: Sepolia’s CoFHE nodes are experimental; we engineered a "Dual-Sync" architecture to provide a seamless backup source of truth for balances.
*   **EIP-712 Complexity**: Coordinating secure permits for threshold unsealing across diverse FHE types required a precise implementation of signing and authentication flows.

## 📂 Getting Started

### Prerequisites
*   Node.js 18+
*   Sepolia Testnet ETH

### Installation
```bash
git clone https://github.com/your-repo/stealthpay.git
cd stealthfront
pnpm install
```

### Run Locally
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) to access the dashboard.

---

**Built for the Fhenix Buildathon** 🛡️
Confidentiality is the final frontier for Web3. StealthPay makes it accessible today.