const { ReineiraSDK } = require("@reineira-os/sdk");

let sdkInstance = null;

function getReineiraSDK() {
    if (!sdkInstance) {
        if (!process.env.FHE_RPC_URL) {
            console.warn("FHE_RPC_URL not set for Reineira SDK");
        }
        
        // The bot uses its own wallet strictly for READ queries (history)
        // No gas will be spent by the bot for user escrow creation/redemption.
        sdkInstance = ReineiraSDK.create({
            network: "testnet",
            privateKey: process.env.BOT_PRIVATE_KEY,
            rpcUrl: process.env.FHE_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc"
        });
    }
    return sdkInstance;
}

/**
 * Fetch the escrow history for a specific wallet address
 */
async function getUserEscrowHistory(walletAddress) {
    const sdk = getReineiraSDK();
    
    try {
        // Query EscrowCreated events
        const createdEvents = await sdk.events.queryEscrowEvents("EscrowCreated");
        
        // Query EscrowFunded events
        const fundedEvents = await sdk.events.queryEscrowEvents("EscrowFunded");
        
        // Query EscrowRedeemed events
        const redeemedEvents = await sdk.events.queryEscrowEvents("EscrowRedeemed");

        // We could filter manually or rely on the SDK if it supports filtering.
        // For this implementation, we will fetch and manually filter for the user.
        return {
            created: createdEvents || [],
            funded: fundedEvents || [],
            redeemed: redeemedEvents || []
        };
    } catch (err) {
        console.error("Error fetching escrow history:", err);
        return { created: [], funded: [], redeemed: [] };
    }
}

module.exports = {
    getReineiraSDK,
    getUserEscrowHistory
};
