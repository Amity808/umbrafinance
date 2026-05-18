import { ReineiraSDK, walletClientToSigner } from "@reineira-os/sdk";

let sdkInstance: ReineiraSDK | null = null;

export async function getReineiraSDK(walletClient?: any) {
    if (!walletClient) {
        throw new Error("WalletClient required to initialize ReineiraSDK");
    }
    
    // We create a new instance when the wallet client is provided
    if (!sdkInstance) {
        const signer = await walletClientToSigner(walletClient);
        sdkInstance = ReineiraSDK.create({
            network: "testnet",
            signer: signer
        });
    }
    return sdkInstance;
}

export async function createAndFundEscrow(walletClient: any, amount: bigint, ownerAddress: string) {
    const sdk = await getReineiraSDK(walletClient);
    
    console.log("Creating Reineira Escrow for:", ownerAddress, "Amount:", amount);
    const escrow = await sdk.escrow.create({
        amount: amount,
        owner: ownerAddress
    });
    
    console.log("Escrow Created:", escrow.id);
    
    // Fund it
    console.log("Funding Escrow...");
    await escrow.fund(amount, { autoApprove: true });
    
    return escrow;
}

export async function redeemEscrow(walletClient: any, escrowId: bigint) {
    const sdk = await getReineiraSDK(walletClient);
    
    console.log("Redeeming Escrow ID:", escrowId);
    const escrow = sdk.escrow.get(escrowId);
    
    // Redeem to connected wallet
    await escrow.redeem();
    return true;
}

export async function getUserEscrows(walletClient: any, ownerAddress: string) {
    const sdk = await getReineiraSDK(walletClient);
    
    try {
        const createdEvents = await sdk.events.queryEscrowEvents("EscrowCreated");
        const fundedEvents = await sdk.events.queryEscrowEvents("EscrowFunded");
        const redeemedEvents = await sdk.events.queryEscrowEvents("EscrowRedeemed");
        
        // Return structured history
        return {
            created: createdEvents || [],
            funded: fundedEvents || [],
            redeemed: redeemedEvents || []
        };
    } catch (e) {
        console.error("Failed to fetch escrow history", e);
        return { created: [], funded: [], redeemed: [] };
    }
}
