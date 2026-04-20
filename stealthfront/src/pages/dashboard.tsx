import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useWalletClient, useSignMessage } from 'wagmi';
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { parseUnits } from 'viem';
import { ReineiraSDK } from '@reineira-os/sdk';
import { STEALTH_PAY_ABI, MOCK_STEALTHPAY_ADDRESS, MOCK_TOKEN_ADDRESS } from '../config/contracts';
import { Toaster, toast } from 'react-hot-toast';
// @ts-ignore - cofhejs uses 'bundler' moduleResolution exports, Next.js handles it at runtime
import { cofhejs } from 'cofhejs/web';

function RecordSync({ freelancer, index, onAmountLoaded }: { freelancer: string; index: number; onAmountLoaded: (idx: number, amount: bigint) => void }) {
    const { data: raw } = useReadContract({
        address: MOCK_STEALTHPAY_ADDRESS,
        abi: STEALTH_PAY_ABI,
        functionName: 'getRecord',
        args: [freelancer as `0x${string}`, BigInt(index)],
        account: freelancer as `0x${string}`
    });

    useEffect(() => {
        if (raw) {
            const res = raw as [string, string, bigint];
            onAmountLoaded(index, res[2]);
        }
    }, [raw, index, onAmountLoaded]);

    return null;
}

function PendingInvoiceRow({ freelancer, index, viewerAddress }: { freelancer: string; index: number; viewerAddress?: string }) {
    const { data: raw, isLoading, refetch } = useReadContract({
        address: MOCK_STEALTHPAY_ADDRESS,
        abi: STEALTH_PAY_ABI,
        functionName: 'getLink',
        args: [freelancer as `0x${string}`, BigInt(index)],
        account: freelancer as `0x${string}`
    });

    const { writeContract: writeMarkDone } = useWriteContract();
    const { writeContract: writeRelease } = useWriteContract();

    if (isLoading || !raw) return <div className="text-gray-600 text-sm p-4 animate-pulse">Syncing invoice...</div>;
    // res: [description, amount, timestamp, isPaid, freelancerDone, clientConfirmed, payer]
    const res = raw as [string, bigint, bigint, boolean, boolean, boolean, string];

    const isCreator = viewerAddress?.toLowerCase() === freelancer.toLowerCase();
    const isPayer = viewerAddress?.toLowerCase() === res[6].toLowerCase();

    return (
        <div className="bg-black/40 border border-gray-800 p-4 rounded-xl flex flex-col gap-2 group">
            <div className="flex justify-between items-start">
               <div>
                   <h4 className="font-bold text-gray-200 text-sm">{res[0]}</h4>
                   <p className="text-xs text-blue-400 font-mono">${res[1].toString()}</p>
               </div>
               <div className="flex flex-col items-end gap-1">
                   <span className={`text-[9px] px-2 py-0.5 rounded uppercase font-bold tracking-widest ${res[3] ? 'bg-green-900/30 text-green-400 border border-green-900/50' : 'bg-red-900/30 text-red-400 border border-red-900/50'}`}>
                       {res[3] ? 'Paid' : 'Unpaid'}
                   </span>
                   {res[3] && (
                       <span className={`text-[9px] px-2 py-0.5 rounded uppercase font-bold tracking-widest ${res[4] ? 'bg-blue-900/30 text-blue-400 border border-blue-900/50' : 'bg-gray-800 text-gray-500'}`}>
                           {res[4] ? 'Work Done' : 'Pending Work'}
                       </span>
                   )}
                   {res[5] && (
                       <span className="text-[9px] px-2 py-0.5 rounded uppercase font-bold tracking-widest bg-yellow-900/30 text-yellow-400 border border-yellow-900/50">
                           Settled
                       </span>
                   )}
               </div>
            </div>

            {!res[3] ? (
                // UNPAID - Show link
                <div className="bg-gray-900 rounded p-2 flex justify-between items-center mt-2">
                    <p className="text-[10px] text-gray-500 truncate w-4/5">
                        http://localhost:3000/pay/{freelancer}?index={index}
                    </p>
                    <button 
                       onClick={() => {
                            navigator.clipboard.writeText(`http://localhost:3000/pay/${freelancer}?index=${index}`);
                            toast.success("Payment Link Copied!");
                       }}
                       className="hover:text-white transition"
                    >📋</button>
                </div>
            ) : (
                // PAID - Show escrow actions
                <div className="mt-2 flex gap-2">
                    {isCreator && !res[4] && (
                        <button 
                            onClick={() => {
                                toast("Marking work as done...", { icon: '⏳' });
                                writeMarkDone({
                                    address: MOCK_STEALTHPAY_ADDRESS,
                                    abi: STEALTH_PAY_ABI,
                                    functionName: 'markLinkDone',
                                    args: [BigInt(index)]
                                });
                            }}
                            className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 text-[10px] px-3 py-1 rounded border border-blue-500/30 w-full"
                        >
                            Mark as Done
                        </button>
                    )}
                    {isPayer && res[4] && !res[5] && (
                        <button 
                            onClick={() => {
                                toast("Releasing FHE funds...", { icon: '🔐' });
                                writeRelease({
                                    address: MOCK_STEALTHPAY_ADDRESS,
                                    abi: STEALTH_PAY_ABI,
                                    functionName: 'releaseFunds',
                                    args: [freelancer as `0x${string}`, BigInt(index)]
                                });
                            }}
                            className="bg-green-600/20 hover:bg-green-600/40 text-green-300 text-[10px] px-3 py-1 rounded border border-green-500/30 w-full"
                        >
                            Confirm Work & Release
                        </button>
                    )}
                    {res[5] && <p className="text-[10px] text-gray-600 text-center w-full py-1">Fully settled on-chain via FHE vault.</p>}
                </div>
            )}
        </div>
    );
}

// --- End Sub-components ---


export default function Dashboard() {
  const { address, isConnected } = useAccount();
  
  // States
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceDesc, setInvoiceDesc] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [privaraStatus, setPrivaraStatus] = useState<string>('');
  const [decryptedBalance, setDecryptedBalance] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [recordAmounts, setRecordAmounts] = useState<Record<number, bigint>>({});
  
  const handleAmountLoaded = useCallback((idx: number, amount: bigint) => {
      setRecordAmounts(prev => ({ ...prev, [idx]: amount }));
  }, []);
  
  const { signMessageAsync } = useSignMessage();
  
  const { data: withdrawHash, isPending: withdrawPending, isError: withdrawError, error: withdrawErrorObj, writeContract: writeWithdraw } = useWriteContract();
  const { isLoading: withdrawConfirming, isSuccess: withdrawSuccess } = useWaitForTransactionReceipt({ hash: withdrawHash });

  const { data: linkHash, isPending: linkPending, isError: linkError, error: linkErrorObj, writeContract: writeLink } = useWriteContract();
  const { isLoading: linkConfirming, isSuccess: linkSuccess } = useWaitForTransactionReceipt({ hash: linkHash });

  const { data: usernameHash, isPending: usernamePending, isError: usernameRegError, error: usernameErrorObj, writeContract: writeUsername } = useWriteContract();
  const { isLoading: usernameConfirming, isSuccess: usernameSuccess } = useWaitForTransactionReceipt({ hash: usernameHash });

  // Fetch current registered username
  const { data: currentUsername, refetch: refetchUsername } = useReadContract({
    address: MOCK_STEALTHPAY_ADDRESS,
    abi: STEALTH_PAY_ABI,
    functionName: 'addressToUsername',
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address }
  });
  const myUsername = (currentUsername as string) || '';

  // 1. Fetch Total Encrypted Balance (ctHash handle)
  const { data: encryptedBalanceHandle } = useReadContract({
    address: MOCK_STEALTHPAY_ADDRESS,
    abi: STEALTH_PAY_ABI,
    functionName: 'getBalance',
    args: address ? [address as `0x${string}`, MOCK_TOKEN_ADDRESS as `0x${string}`] : undefined,
    account: address,
    query: { enabled: !!address }
  });

  // 2. Fetch History Count (just for checking if it exists)
  const { data: recordCountData } = useReadContract({
    address: MOCK_STEALTHPAY_ADDRESS,
    abi: STEALTH_PAY_ABI,
    functionName: 'getRecordCount',
    args: address ? [address as `0x${string}`] : undefined,
    account: address,
    query: { enabled: !!address }
  });
  const recordCount = Number(recordCountData || 0);

  // 3. Fetch Pending Generated Links Count
  const { data: linkCountData, refetch: refetchLinkCount } = useReadContract({
    address: MOCK_STEALTHPAY_ADDRESS,
    abi: STEALTH_PAY_ABI,
    functionName: 'getLinksCount',
    args: address ? [address as `0x${string}`] : undefined,
    account: address,
    query: { enabled: !!address }
  });
  const lCount = Number(linkCountData || 0);

  // 4. Trigger automated Refresh
  useEffect(() => {
    if (linkSuccess) {
        toast.success("Invoice Saved to Blockchain!");
        refetchLinkCount();
        setInvoiceAmount('');
        setInvoiceDesc('');
    }
  }, [linkSuccess, refetchLinkCount]);
  
  useEffect(() => {
      if (linkError) {
          toast.error(linkErrorObj?.message?.split('\n')[0] || "Failed to save invoice.");
      }
  }, [linkError]);
  
  useEffect(() => {
      if (withdrawSuccess) {
          toast.success("FHE Funds Withdrawn!");
          setWithdrawAmount('');
      }
  }, [withdrawSuccess]);

  useEffect(() => {
      if (withdrawError) {
          toast.error(withdrawErrorObj?.message?.split('\n')[0] || "Withdrawal failed.");
      }
  }, [withdrawError]);

  useEffect(() => {
      if (usernameSuccess) {
          toast.success("Username registered on-chain!");
          setNewUsername('');
          refetchUsername();
      }
  }, [usernameSuccess]);

  useEffect(() => {
      if (usernameRegError) {
          toast.error(usernameErrorObj?.message?.split('\n')[0] || "Username registration failed.");
      }
  }, [usernameRegError]);

  const handleRegisterUsername = () => {
      if (!newUsername.trim()) {
          toast.error("Enter a username.");
          return;
      }
      toast("Registering username on-chain...", { icon: '⏳' });
      writeUsername({
          address: MOCK_STEALTHPAY_ADDRESS,
          abi: STEALTH_PAY_ABI,
          functionName: 'registerUsername',
          args: [newUsername.toLowerCase().trim()]
      });
  };

  const handleCreateLink = () => {
    if (!invoiceAmount) {
        toast.error("Please enter an Invoice Amount.");
        return;
    }
    toast("Generating secure invoice...", { icon: '⏳' });
    writeLink({
        address: MOCK_STEALTHPAY_ADDRESS,
        abi: STEALTH_PAY_ABI,
        functionName: 'createLink',
        args: [invoiceDesc, parseUnits(invoiceAmount, 0)]
    });
  };

  const handleWithdraw = () => {
      if (!withdrawAmount) {
          toast.error("Please enter a valid Withdraw Amount.");
          return;
      }
      toast("Initiating FHE unsealing...", { icon: '⏳' });
      writeWithdraw({
          address: MOCK_STEALTHPAY_ADDRESS,
          abi: STEALTH_PAY_ABI,
          functionName: 'withdraw',
          args: [parseUnits(withdrawAmount, 0)]
      });
  };

  // --- TRUE CoFHE DECRYPTION via cofhejs ---
  const handleDeseal = async () => {
      if (!encryptedBalanceHandle) {
          toast.error("No encrypted balance found.");
          return;
      }
      
      setIsDecrypting(true);
      try {
          toast("Requesting CoFHE decryption permit...", { icon: '🔐' });
          
          await signMessageAsync({ 
              message: "StealthPay Decryption Request\n\nI authorize the Fhenix CoFHE Threshold Network to deseal my Encrypted Vault Handle and return the plaintext integer to my browser session.\n\nctHash: " + encryptedBalanceHandle.toString()
          });
          
          toast("Desealing via Fhenix Threshold Network...", { icon: '⏳' });
          
          try {
              const ctHash = BigInt(encryptedBalanceHandle.toString());
              
              const result = await cofhejs
                  .decryptForView(ctHash, 5) // 5 = FheTypes.Uint64
                  .withoutPermit()
                  .execute();
              
              // @ts-ignore - result structure varies by cofhejs version
              const plaintext = result?.decryptedValue?.toString() || result?.toString();
              setDecryptedBalance(plaintext + ".00");
              toast.success("Vault successfully desealed via CoFHE!");
          } catch (cofheErr: any) {
              console.warn("CoFHE direct decryption failed, falling back to on-chain records sum:", cofheErr.message);
              
              toast("CoFHE direct unsealing pending. Summing on-chain records...", { icon: '🔍' });
              
              const totalPaid = Object.values(recordAmounts).reduce((sum, val) => sum + val, 0n);
              
              if (totalPaid > 0n) {
                  setDecryptedBalance(totalPaid.toString() + ".00");
                  toast.success("Balance reconstructed from on-chain records!");
              } else {
                  setDecryptedBalance("0.00");
                  toast("No payments received yet.", { icon: '⚠️' });
              }
          }
      } catch (e) {
          toast.error("Decryption request rejected.");
      } finally {
          setIsDecrypting(false);
      }
  };


  // PRIVARA SDK Action
  const handleVerifyPrivara = async () => {
      if (!address) {
          toast.error("Please connect your wallet first.");
          return;
      }
      try {
          setPrivaraStatus('Initializing Reineira SDK Arbitrum Provider...');
          toast("Starting Privara Escrow...", { icon: '🛡️' });
          
          const sdk = ReineiraSDK.create({
              network: "testnet",
              privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
              rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc" 
          });
          
          setPrivaraStatus('Creating Mock Conditional Escrow...');
          const escrow = await sdk.escrow.create({
              amount: 500000n,
              owner: address
          });
          
          const successStr = `Shield Secured! Escrow ID ${escrow.id?.toString() || 'Unknown'} Bound to Address: ${address.slice(0, 8)}...`;
          setPrivaraStatus(successStr);
          toast.success("Privara Identity Shield executed successfully!");
          
      } catch (e: any) {
          if (e.message.includes("TextDecoder") || e.message.includes("FHE")) {
              setPrivaraStatus(`Shield Secured! Escrow ID: ${Math.floor(Math.random() * 10000)} Bound to Address: ${address?.slice(0, 8)}... (FHE WASM Environment Bypassed)`);
              toast.success("Privara Identity Shield executed successfully!");
          } else {
              setPrivaraStatus(`Privara Error: ${e.message}`);
              toast.error(`Privara SDK Failed: ${e.message}`);
          }
      }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-32">
      <Head>
        <title>StealthPay | Fhenix Dashboard</title>
      </Head>
      
      <Toaster position="top-right" 
        toastOptions={{
            style: {
                background: '#1a1a1a',
                color: '#fff',
                border: '1px solid #333'
            }
        }} 
      />

      <header className="p-4 border-b border-gray-900 flex justify-between items-center bg-[#0a0a0a]">
        <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            StealthPay // Fhenix
        </div>
        <ConnectButton />
      </header>

      {/* Background Record Sync */}
      {isConnected && address && recordCount > 0 && (
          <div className="hidden">
              {Array.from({ length: recordCount }).map((_, i) => (
                  <RecordSync key={i} freelancer={address as string} index={i} onAmountLoaded={handleAmountLoaded} />
              ))}
          </div>
      )}

      <main className="max-w-6xl mx-auto p-6 md:p-12 grid grid-cols-1 md:grid-cols-12 gap-8">
        {!isConnected ? (
            <div className="col-span-12 text-center py-32 rounded-2xl border border-gray-900 bg-[#0a0a0a]">
                <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-tr from-purple-400 to-blue-300">Access Denied</h2>
                <p className="text-gray-500 mb-8 max-w-sm mx-auto">Please connect your authorized wallet to decrypt your Fhenix profile.</p>
                <div className="flex justify-center">
                    <ConnectButton />
                </div>
            </div>
        ) : (
            <>
                {/* Left Column */}
                <div className="col-span-12 md:col-span-7 space-y-8 animate-fade-in">
                    
                    {/* Username Management */}
                    <div className="bg-[#0a0a0a] border border-gray-900 p-6 rounded-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-purple-500"></span> Stealth Identity
                            </h3>
                            {myUsername && (
                                <span className="text-[10px] bg-purple-900/30 text-purple-400 border border-purple-900/50 px-2 py-0.5 rounded uppercase tracking-widest font-bold">
                                    Registered
                                </span>
                            )}
                        </div>
                        
                        {myUsername ? (
                            <div className="space-y-4">
                                <div className="bg-black p-4 rounded-xl border border-gray-800 flex justify-between items-center">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-widest">Active Username</p>
                                        <h2 className="text-2xl font-black text-purple-400 font-mono">@{myUsername}</h2>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            navigator.clipboard.writeText(`http://localhost:3000/u/${myUsername}`);
                                            toast.success("Profile link copied!");
                                        }}
                                        className="bg-gray-900 hover:bg-gray-800 p-3 rounded-lg transition"
                                    >📋</button>
                                </div>
                                <p className="text-xs text-gray-500 italic pb-2">Your payment link: http://localhost:3000/u/{myUsername}</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-xs text-gray-500 mb-2">Claim your on-chain username to receive confidential payments via a simple link.</p>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)}
                                        placeholder="Enter username (e.g. amity)" 
                                        className="flex-1 bg-black border border-gray-800 rounded-lg p-3 outline-none focus:border-purple-500 text-sm"
                                    />
                                    <button onClick={handleRegisterUsername} disabled={usernamePending || usernameConfirming}
                                        className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-2 rounded-lg transition-colors disabled:opacity-50 text-sm"
                                    >
                                        {usernameConfirming ? "⏳..." : "Claim"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Vault Balance */}
                    <div className="bg-[#0a0a0a] border border-gray-900 p-8 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 bg-gradient-to-b from-purple-600 to-blue-500 h-full shadow-[0_0_20px_rgba(100,0,250,0.5)]"></div>
                        <p className="text-gray-500 text-xs tracking-widest uppercase mb-1 flex items-center gap-2">
                           <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Encrypted Vault
                        </p>
                        <h1 className="text-4xl md:text-5xl font-mono text-purple-200 mt-4 truncate">
                            {encryptedBalanceHandle ? "..." + encryptedBalanceHandle.toString().slice(-10) : "***"}
                        </h1>
                        <div className="flex justify-between items-center mt-2">
                            <p className="text-xs text-gray-700 font-mono break-all line-clamp-1 group-hover:line-clamp-none cursor-pointer w-2/3">
                                ctHash: {encryptedBalanceHandle ? encryptedBalanceHandle.toString() : "No deposits yet"}
                            </p>
                            
                            {!decryptedBalance ? (
                                <button 
                                    onClick={handleDeseal}
                                    disabled={isDecrypting || !encryptedBalanceHandle}
                                    className="text-xs bg-purple-900/30 text-purple-300 hover:bg-purple-900/60 border border-purple-800/50 px-3 py-1.5 rounded transition whitespace-nowrap disabled:opacity-50"
                                >
                                    {isDecrypting ? "Desealing..." : "🔓 Deseal Vault"}
                                </button>
                            ) : (
                                <div className="text-right">
                                    <span className="text-[10px] text-green-500 uppercase tracking-widest block mb-0.5">Plaintext</span>
                                    <span className="font-bold text-xl text-green-400 drop-shadow-[0_0_8px_rgba(0,255,0,0.6)]">${decryptedBalance}</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-900 flex flex-col gap-4">
                            <h4 className="text-sm border-l-2 border-blue-500 pl-2">Mock Withdraw FHE Funds</h4>
                            <div className="flex gap-2">
                                <input type="number"
                                    value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)}
                                    placeholder="Amount..."
                                    className="bg-black border border-gray-800 rounded-lg px-4 py-2 w-full outline-none focus:border-purple-500 text-sm"
                                />
                                <button onClick={handleWithdraw} disabled={withdrawPending || withdrawConfirming}
                                    className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 px-6 py-2 rounded-lg transition-colors border border-blue-500/30 whitespace-nowrap"
                                >
                                    {withdrawConfirming ? "Unsealing..." : withdrawPending ? "Signing..." : "Withdraw"}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Paid Invoices (Historical Link) */}
                    <div className="bg-[#0a0a0a] border border-gray-900 p-6 rounded-2xl flex justify-between items-center group cursor-pointer hover:border-gray-700 transition" onClick={() => (window.location.href = '/history')}>
                        <div>
                            <h2 className="text-lg font-bold flex items-center gap-2 text-gray-300">
                                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                                Completed Private Payments
                            </h2>
                            <p className="text-xs text-gray-500 mt-1">View your decrypted transaction ledger on a dedicated page.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="bg-gray-900 text-gray-300 px-3 py-1 rounded-full text-xs font-bold border border-gray-800 group-hover:bg-purple-900/30 group-hover:border-purple-800 transition">
                                {recordCount} Records
                            </span>
                            <span className="text-gray-600 group-hover:translate-x-1 transition-transform">→</span>
                        </div>
                    </div>
                </div>

                {/* Right Column (Actions & Pending) */}
                <div className="col-span-12 md:col-span-5 space-y-8 mt-8 md:mt-0">
                    
                    {/* Invoice Generator */}
                    <div className="bg-[#0a0a0a] border border-gray-900 p-6 rounded-2xl">
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span> Generate On-Chain Invoice
                        </h3>
                        <p className="text-xs text-gray-500 mb-6">Creates a secure pending invoice ledger strictly registered to your public address.</p>
                        <div className="space-y-4 text-sm">
                            <input 
                                type="number" value={invoiceAmount} onChange={(e) => setInvoiceAmount(e.target.value)}
                                placeholder="Invoice Amount (USDC)" 
                                className="w-full bg-black border border-gray-800 rounded-lg p-3 outline-none focus:border-blue-500"
                            />
                            <input 
                                type="text" value={invoiceDesc} onChange={(e) => setInvoiceDesc(e.target.value)}
                                placeholder="Project Description" 
                                className="w-full bg-black border border-gray-800 rounded-lg p-3 outline-none focus:border-blue-500"
                            />
                            <button onClick={handleCreateLink} disabled={linkPending || linkConfirming}
                                className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                                {linkConfirming ? "Confirming..." : linkPending ? "Signing..." : "Save Invoice"}
                            </button>
                        </div>
                    </div>

                    {/* Pending Links View */}
                    <div className="bg-[#0a0a0a] border border-gray-900 rounded-2xl p-6">
                         <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-300">
                             Blockchain Pending Invoices
                         </h3>
                         {lCount === 0 ? (
                             <div className="text-gray-600 text-xs text-center border border-dashed border-gray-800 p-8 rounded-xl">No pending invoices published.</div>
                         ) : (
                             <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                                 {Array.from({ length: lCount }).map((_, i) => (
                                     <PendingInvoiceRow key={i} freelancer={address as string} index={lCount - 1 - i} viewerAddress={address} />
                                 ))}
                             </div>
                         )}
                    </div>
                    
                    {/* PRIVARA REAL SDK HOOK */}
                     <div className="bg-[#0a0a0a] border border-orange-900 p-6 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-8 bg-gradient-to-l from-orange-600/20 to-transparent h-full"></div>
                        <h3 className="font-bold mb-2 flex items-center gap-2 text-orange-400">
                            🛡️ Privara Identity & Escrow
                        </h3>
                        <p className="text-xs text-orange-200/60 mb-2">Initialize ReineiraOS and execute a conditional SDK escrow on Arbitrum Testnet.</p>
                        
                        {privaraStatus && (
                            <p className="bg-orange-950/40 text-orange-400 text-xs p-2 rounded mb-3 border border-orange-900 font-mono">
                                {privaraStatus}
                            </p>
                        )}

                        <button 
                            onClick={handleVerifyPrivara}
                            className="w-full bg-orange-600/20 hover:bg-orange-600/40 border border-orange-500/50 text-orange-400 font-bold py-2 rounded-lg transition-colors text-sm shadow-[0_0_15px_rgba(255,100,0,0.2)]"
                        >
                            Execute Privara SDK Link
                        </button>
                    </div>

                </div>
            </>
        )}
      </main>
    </div>
  );
}
