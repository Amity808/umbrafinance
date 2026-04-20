import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import Head from 'next/head';
import { Toaster, toast } from 'react-hot-toast';
import { STEALTH_PAY_ABI, MOCK_STEALTHPAY_ADDRESS, MOCK_TOKEN_ADDRESS } from '../../config/contracts';

export default function PaymentPage() {
  const router = useRouter();
  const { address: freelancerAddress } = router.query;
  const linkIndex = router.query.index !== undefined ? Number(router.query.index) : null;
  const { isConnected } = useAccount();

  const [amount, setAmount] = useState((router.query.amount as string) || '0');
  const [desc, setDesc] = useState((router.query.desc as string) || 'No description');

  // 1. If index provided, fetch link details on-chain
  const { data: linkData, isLoading: loadingLink } = useReadContract({
    address: MOCK_STEALTHPAY_ADDRESS,
    abi: STEALTH_PAY_ABI,
    functionName: 'getLink',
    args: freelancerAddress && linkIndex !== null ? [freelancerAddress as `0x${string}`, BigInt(linkIndex)] : undefined,
    query: { enabled: !!freelancerAddress && linkIndex !== null }
  });

  useEffect(() => {
    if (linkData) {
        const [description, amt] = linkData as [string, bigint, bigint, boolean, boolean, boolean, string];
        setAmount(amt.toString());
        setDesc(description);
    }
  }, [linkData]);

  const { data: hash, isPending, isError, error, writeContract } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const handlePay = () => {
    if (!freelancerAddress) return;
    
    if (linkIndex !== null) {
        toast("Sending to Escrow via FHE...", { icon: '🛡️' });
        writeContract({
            address: MOCK_STEALTHPAY_ADDRESS,
            abi: STEALTH_PAY_ABI,
            functionName: 'payWithEscrow',
            args: [freelancerAddress as `0x${string}`, BigInt(linkIndex), MOCK_TOKEN_ADDRESS]
        });
    } else {
        toast("Encrypting direct payment via FHE...", { icon: '🔐' });
        writeContract({
          address: MOCK_STEALTHPAY_ADDRESS,
          abi: STEALTH_PAY_ABI,
          functionName: 'pay',
          args: [
            freelancerAddress as `0x${string}`, 
            MOCK_TOKEN_ADDRESS, 
            parseUnits(amount, 0), 
            "Anonymous Client", 
            desc
          ]
        });
    }
  };

  useEffect(() => {
     if (isError) {
         toast.error(error?.message?.split('\n')[0] || "Payment failed");
     }
  }, [isError, error]);

  if (isConfirmed) {
      return (
          <div className="min-h-screen bg-[#0d0d0d] text-green-400 flex items-center justify-center font-mono p-4">
              <Toaster position="top-center" />
              <div className="text-center">
                  <h1 className="text-4xl mb-4 font-bold">{linkIndex !== null ? 'Escrow Created 🛡️' : 'Payment Secured 🔐'}</h1>
                  <p className="text-gray-300">
                      Your $ {amount} payment to <br/><span className="text-white text-sm break-all">{freelancerAddress}</span><br/>
                      {linkIndex !== null ? ' is held in escrow.' : ' was homomorphically encrypted and routed safely on-chain.'}
                  </p>
                  <p className="mt-8 text-xs text-green-700">Powered by Fhenix FHE</p>
                  <a href={`https://sepolia.etherscan.io/tx/${hash}`} target="_blank" className="text-blue-500 underline text-sm mt-4 inline-block">View Tx Explorer Log</a>
                  <button onClick={() => router.push('/dashboard')} className="block mx-auto mt-6 bg-green-900/40 border border-green-800 px-6 py-2 rounded text-sm hover:bg-green-800 transition">Return to Dashboard</button>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col font-sans">
      <Head>
        <title>StealthPay | Checkout</title>
      </Head>
      
      <Toaster position="top-center" />

      <header className="p-4 border-b border-gray-800 flex justify-end">
        <ConnectButton />
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="bg-[#1a1a1a] border border-gray-800 p-8 rounded-xl shadow-[0_0_40px_rgba(40,10,120,0.4)] max-w-md w-full relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 via-blue-500 to-indigo-600"></div>

          <h1 className="text-2xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-300">StealthPay Checkout</h1>
          
          <div className="mb-5 bg-black/40 p-4 rounded-lg border border-gray-900">
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Paying Freelancer</p>
            <p className="font-mono text-sm text-gray-300 truncate">{freelancerAddress ? freelancerAddress : "Loading..."}</p>
          </div>
          
          <div className="mb-5 bg-black/40 p-4 rounded-lg border border-gray-900 flex justify-between items-center">
            <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Invoice Amount</p>
                <p className="font-bold text-4xl">${amount}</p>
            </div>
            <div className="text-right">
                <span className="bg-blue-900/40 border border-blue-800 text-blue-300 px-2 py-1 rounded text-xs font-mono">eUSDT</span>
            </div>
          </div>

          <div className="mb-8 p-1">
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Description</p>
            <p className="text-gray-300 italic">"{desc ? decodeURIComponent(desc) : ""}"</p>
          </div>

          {!isConnected ? (
             <div className="flex justify-center"><ConnectButton /></div>
          ) : (
            <button 
                onClick={handlePay}
                disabled={isPending || isConfirming || !freelancerAddress || loadingLink}
                className={`w-full ${linkIndex !== null ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gradient-to-r from-purple-600 to-blue-600'} text-white font-bold py-4 rounded-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50`}
            >
                {isPending || isConfirming ? "Processing Tx..." : linkIndex !== null ? "Pay into Escrow" : "Pay Confidentially"}
            </button>
          )}
        </div>
      </main>
      
      <div className="pb-8 flex justify-center opacity-50">
        <span className="text-xs font-mono tracking-widest uppercase">Secured by Fully Homomorphic Encryption</span>
      </div>
    </div>
  );
}
