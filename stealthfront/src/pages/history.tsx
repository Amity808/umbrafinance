import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract } from 'wagmi';
import Head from 'next/head';
import Link from 'next/link';
import { STEALTH_PAY_ABI, MOCK_STEALTHPAY_ADDRESS } from '../config/contracts';
import { Toaster } from 'react-hot-toast';

function HistoryRecordRow({ freelancer, index }: { freelancer: string; index: number }) {
    const { data: raw, isLoading } = useReadContract({
        address: MOCK_STEALTHPAY_ADDRESS,
        abi: STEALTH_PAY_ABI,
        functionName: 'getRecord',
        args: [freelancer as `0x${string}`, BigInt(index)],
        account: freelancer as `0x${string}`
    });

    if (isLoading || !raw) return <div className="bg-[#0a0a0a] p-5 rounded-xl border border-gray-900 animate-pulse h-20"></div>;
    const res = raw as [string, string, bigint];

    return (
        <div className="bg-[#0a0a0a] p-5 rounded-xl border border-gray-900 flex justify-between items-center group hover:border-gray-700 transition">
            <div className="flex flex-col">
                <span className="font-bold text-gray-200">{res[0]}</span>
                <span className="text-gray-500 text-sm">{decodeURIComponent(res[1])}</span>
            </div>
            <div className="text-right">
                <p className="text-xs text-gray-600 uppercase mb-1">Amount</p>
                <p className="font-mono text-green-400 text-sm font-bold">
                    ${res[2].toString()}.00
                </p>
            </div>
        </div>
    );
}

export default function History() {
    const { address, isConnected } = useAccount();

    const { data: recordCountData } = useReadContract({
        address: MOCK_STEALTHPAY_ADDRESS,
        abi: STEALTH_PAY_ABI,
        functionName: 'getRecordCount',
        args: address ? [address as `0x${string}`] : undefined,
        account: address,
        query: { enabled: !!address }
    });
    const recordCount = Number(recordCountData || 0);

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans pb-32">
            <Head>
                <title>StealthPay | Payment History</title>
            </Head>
            
            <Toaster position="top-right" />

            <header className="p-4 border-b border-gray-900 flex justify-between items-center bg-[#0a0a0a]">
                <Link href="/dashboard" className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                    StealthPay // Fhenix
                </Link>
                <ConnectButton />
            </header>

            <main className="max-w-4xl mx-auto p-6 md:p-12">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Confidential Payment History</h1>
                    <Link href="/dashboard" className="text-sm bg-gray-900 text-gray-400 px-4 py-2 rounded-lg border border-gray-800 hover:text-white hover:border-gray-700 transition">
                        Back to Dashboard
                    </Link>
                </div>

                {!isConnected ? (
                    <div className="text-center py-32 rounded-2xl border border-gray-900 bg-[#0a0a0a]">
                        <h2 className="text-xl font-bold mb-4">Please connect your wallet</h2>
                        <ConnectButton />
                    </div>
                ) : (
                    <div>
                        {recordCount === 0 ? (
                            <div className="text-center py-20 bg-[#0a0a0a] rounded-2xl border border-dashed border-gray-800">
                                <p className="text-gray-500">No payment records found on-chain.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {Array.from({ length: recordCount }).map((_, i) => (
                                    <HistoryRecordRow key={i} freelancer={address as string} index={recordCount - 1 - i} />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
