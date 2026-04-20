# StealthPay // Smart Contract Protocol (Fhenix)

This repository contains the core smart contract logic for **StealthPay**, a confidential payment protocol utilizing Fully Homomorphic Encryption (FHE) on the **Fhenix** blockchain.

---

## 🛰️ Core Protocol Features

### 1. FHE-Encrypted Vaults
The contract maintains `EncryptedVault` structs for every freelancer and supported token. All balance updates are performed homomorphically:
*   **Balance Privacy**: Total balances are stored as `euint64` ciphertexts.
*   **Public Unsealing**: Uses `FHE.allowPublic()` to enable client-side threshold decryption via the CoFHE SDK without exposing the freelancer's private data to the public RPC.

### 2. Multi-Party Escrow Settlement
A built-in conditional payment system that prevents funds from being deposited until work is verified:
*   **Stage 1: PayWithEscrow**: Client commits funds to a pending link state.
*   **Stage 2: MarkDone**: Freelancer signals work completion on-chain.
*   **Stage 3: ReleaseFunds**: Client releases the escrow, triggered an atomic FHE encryption of the funds into the freelancer's vault.

### 3. Stealth Identity Registry
A native on-chain mapping service allowing human-readable usernames to resolve to confidential payment destinations.

---

## 🛠️ Technical Implementation

### FHE Logic Snippet
```solidity
function _internalPay(address freelancer, address token, uint256 rawAmount, ...) internal {
    // Encrypt plaintext on-chain
    euint64 amount = FHE.asEuint64(rawAmount);
    
    // Homomorphic addition
    vaults[freelancer][token].totalEncryptedBalance = FHE.add(
        vaults[freelancer][token].totalEncryptedBalance, 
        amount
    );

    // Grant threshold decryption permission
    FHE.allowPublic(vaults[freelancer][token].totalEncryptedBalance);
}
```

---

## 🚀 Deployment (Sepolia)

The contracts are deployed on the **Fhenix Sepolia/Helium** testnet.

*   **StealthPay**: `0x62e85C8cb59F62BdB07689c3813163277cCf171c`
*   **Mock eUSDT**: `0x3378f7798d63Dd6B605706ccb298b999EF323168`

### Prerequisites
*   [Foundry](https://getfoundry.sh/)
*   Fhenix Helium RPC

### Build
```bash
forge build
```

### Deploy Script
```bash
forge script script/DeployAll.s.sol:DeployAll --rpc-url <RPC_URL> --broadcast --legacy
```

---

**Confidentiality by Design** 🛡️
StealthPay smart contracts ensure your finances stay private, even on a public ledger.
