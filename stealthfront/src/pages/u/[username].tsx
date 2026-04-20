import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { parseUnits } from 'viem';
import { useRouter } from 'next/router';
import { STEALTH_PAY_ABI, MOCK_STEALTHPAY_ADDRESS, MOCK_TOKEN_ADDRESS } from '../../config/contracts';
import { Toaster, toast } from 'react-hot-toast';

export default function UsernamePayPage() {
    const router = useRouter();
    const { username } = router.query;
    const linkIndex = router.query.index !== undefined ? Number(router.query.index) : null;
    const { address, isConnected } = useAccount();

    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [senderName, setSenderName] = useState('');

    // 1. Resolve username to address on-chain
    const { data: resolvedAddress, isLoading: resolving } = useReadContract({
        address: MOCK_STEALTHPAY_ADDRESS,
        abi: STEALTH_PAY_ABI,
        functionName: 'resolveUsername',
        args: username ? [username as string] : undefined,
        query: { enabled: !!username }
    });

    const freelancerAddress = resolvedAddress as `0x${string}` | undefined;
    const isValidUser = freelancerAddress && freelancerAddress !== '0x0000000000000000000000000000000000000000';

    // 2. If index provided, fetch link details
    const { data: linkData, isLoading: loadingLink } = useReadContract({
        address: MOCK_STEALTHPAY_ADDRESS,
        abi: STEALTH_PAY_ABI,
        functionName: 'getLink',
        args: freelancerAddress && linkIndex !== null ? [freelancerAddress, BigInt(linkIndex)] : undefined,
        query: { enabled: !!freelancerAddress && linkIndex !== null }
    });

    useEffect(() => {
        if (linkData) {
            const [desc, amt] = linkData as [string, bigint, bigint, boolean, boolean, boolean, string];
            setAmount(amt.toString());
            setDescription(desc);
        }
    }, [linkData]);

    // 3. Payment write
    const { data: payHash, isPending, isError, error, writeContract } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: payHash });

    useEffect(() => {
        if (isError) {
            toast.error(error?.message?.split('\n')[0] || "Payment failed");
        }
    }, [isError, error]);

    const handlePay = () => {
        if (!amount || !freelancerAddress) return;
        
        if (linkIndex !== null) {
            toast("Sending to Escrow via FHE...", { icon: '🛡️' });
            writeContract({
                address: MOCK_STEALTHPAY_ADDRESS,
                abi: STEALTH_PAY_ABI,
                functionName: 'payWithEscrow',
                args: [freelancerAddress, BigInt(linkIndex), MOCK_TOKEN_ADDRESS]
            });
        } else {
            toast("Encrypting direct payment via FHE...", { icon: '🔐' });
            writeContract({
                address: MOCK_STEALTHPAY_ADDRESS,
                abi: STEALTH_PAY_ABI,
                functionName: 'pay',
                args: [
                    freelancerAddress,
                    MOCK_TOKEN_ADDRESS,
                    parseUnits(amount, 0),
                    senderName || "Anonymous",
                    description || "Payment"
                ]
            });
        }
    };

    if (isConfirmed) {
        return (
            <div className="min-h-screen bg-[#0d0d0d] text-green-400 flex items-center justify-center font-mono p-4">
                <Head><title>Payment Secured | StealthPay</title></Head>
                <Toaster position="top-right" toastOptions={{ style: { background: '#1a1a1a', color: '#fff', border: '1px solid #333' } }} />
                <div className="text-center max-w-md">
                    <div className="text-6xl mb-6">{linkIndex !== null ? '🛡️' : '✅'}</div>
                    <h1 className="text-2xl font-bold mb-2">
                        {linkIndex !== null ? 'Escrow Created 🛡️' : 'Payment Secured 🔐'}
                    </h1>
                    <p className="text-gray-400 mb-4">
                        Your <span className="text-green-300 font-bold">$ {amount}</span> payment to
                        <span className="text-purple-400 font-bold"> @{username}</span>
                        {linkIndex !== null 
                            ? ' is now held in escrow. Release it once work is complete.' 
                            : ' was homomorphically encrypted and routed safely on-chain.'}
                    </p>
                    <p className="text-xs text-gray-600 mb-6 break-all">Resolved to: {freelancerAddress}</p>
                    <a href={`https://sepolia.etherscan.io/tx/${payHash}`} target="_blank" rel="noreferrer"
                       className="text-blue-400 text-xs hover:underline block mb-4">
                        View on Etherscan →
                    </a>
                    <button onClick={() => router.push('/dashboard')}
                        className="bg-green-900/30 text-green-400 border border-green-800 px-6 py-2 rounded hover:bg-green-900/50 transition text-sm">
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans flex items-center justify-center p-4">
            <Head><title>Pay @{username} | StealthPay</title></Head>
            <Toaster position="top-right" toastOptions={{ style: { background: '#1a1a1a', color: '#fff', border: '1px solid #333' } }} />

            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                        StealthPay
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">FHE-powered confidential payments</p>
                </div>

                <div className="bg-[#0a0a0a] border border-gray-900 rounded-2xl p-8">
                    {resolving || loadingLink ? (
                        <div className="text-center py-12">
                            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p className="text-gray-500">Syncing on-chain details...</p>
                        </div>
                    ) : !isValidUser ? (
                        <div className="text-center py-12">
                            <div className="text-5xl mb-4">❌</div>
                            <h2 className="text-xl font-bold text-red-400 mb-2">User Not Found</h2>
                            <p className="text-gray-500 text-sm">
                                <span className="text-white font-bold">@{username}</span> has not registered on StealthPay yet.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-800">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-xl font-bold">
                                    {(username as string)?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-purple-300">@{username}</h2>
                                    <p className="text-xs text-gray-600 font-mono">{freelancerAddress?.slice(0, 10)}...{freelancerAddress?.slice(-8)}</p>
                                </div>
                            </div>

                            {!isConnected ? (
                                <div className="text-center py-6">
                                    <p className="text-gray-500 text-sm mb-4">Connect your wallet to send a payment</p>
                                    <ConnectButton />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {linkIndex !== null && (
                                        <div className="bg-blue-900/20 border border-blue-900/40 p-3 rounded-lg mb-4">
                                            <p className="text-[10px] text-blue-400 uppercase font-bold tracking-widest mb-1">Escrow Invoice Detected</p>
                                            <p className="text-xs text-gray-400">Funds will be held securely until work is confirmed by both parties.</p>
                                        </div>
                                    )}

                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">Amount (eUSDT)</label>
                                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                                            disabled={linkIndex !== null}
                                            placeholder="0.00"
                                            className="w-full bg-black border border-gray-800 rounded-lg p-3 outline-none focus:border-purple-500 text-lg font-mono disabled:opacity-50" />
                                    </div>
                                    
                                    {linkIndex === null && (
                                        <div>
                                            <label className="text-xs text-gray-500 block mb-1">Your Name (optional)</label>
                                            <input type="text" value={senderName} onChange={e => setSenderName(e.target.value)}
                                                placeholder="Anonymous"
                                                className="w-full bg-black border border-gray-800 rounded-lg p-3 outline-none focus:border-purple-500 text-sm" />
                                        </div>
                                    )}

                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">Description</label>
                                        <input type="text" value={description} onChange={e => setDescription(e.target.value)}
                                            disabled={linkIndex !== null}
                                            placeholder="Payment for..."
                                            className="w-full bg-black border border-gray-800 rounded-lg p-3 outline-none focus:border-purple-500 text-sm disabled:opacity-50" />
                                    </div>
                                    
                                    <button onClick={handlePay} disabled={isPending || isConfirming || !amount}
                                        className={`w-full font-bold py-3 rounded-xl transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(100,0,250,0.3)] ${linkIndex !== null ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500'} text-white`}>
                                        {isConfirming ? "⏳ Confirming..." : isPending ? "Signing..." : linkIndex !== null ? `Pay into Escrow for @${username}` : `Pay @${username} Confidentially`}
                                    </button>
                                    <p className="text-[10px] text-gray-700 text-center">
                                        Payments are encrypted via Fhenix FHE before settlement on Sepolia
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
