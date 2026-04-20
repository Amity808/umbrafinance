import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useAccount } from 'wagmi';

const Home: NextPage = () => {
    const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-purple-900 overflow-hidden relative">
      <Head>
        <title>StealthPay | FHE Confidential Payments</title>
        <meta name="description" content="Privacy-native payment flow using Fhenix." />
      </Head>

      {/* Decorative background blurs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900 rounded-full blur-[150px] opacity-30 pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900 rounded-full blur-[150px] opacity-30 pointer-events-none"></div>

      <header className="p-6 flex justify-between items-center max-w-7xl mx-auto relative z-10 border-b border-gray-900/50">
        <div className="text-2xl font-black tracking-tighter flex items-center gap-1">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                Stealth
            </span>
            Pay
        </div>
        <ConnectButton />
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-20 pb-32 flex flex-col lg:flex-row items-center justify-between relative z-10">
        <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/20 border border-purple-500/30 text-purple-300 text-xs font-mono mb-6">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
                Powered by Fhenix FHE
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
                Confidential <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-500">
                    Payment Rails
                </span>
            </h1>
            
            <p className="text-xl text-gray-400 mb-10 leading-relaxed font-light max-w-xl">
                Generate shareable payment links from WhatsApp. Receive stablecoins confidentially.
                Protect your income history from public blockchain transparency.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/dashboard">
                    <button className="px-8 py-4 w-full sm:w-auto bg-white text-black font-bold rounded-lg hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all flex items-center justify-center gap-2">
                        {isConnected ? "Go to Dashboard" : "Connect to Dashboard"}
                        <span>→</span>
                    </button>
                </Link>
                <button onClick={() => alert('Demo: Start the WhatsApp server (`node server.js`) and text "invoice 500 web design" to generate a FHE secure link!')} className="px-8 py-4 w-full sm:w-auto bg-transparent border border-gray-700 hover:border-gray-500 text-white rounded-lg transition-colors font-medium">
                    Try on WhatsApp (Coming soon)
                </button>
            </div>
        </div>

        {/* Visual Graphic */}
        <div className="mt-20 lg:mt-0 w-full max-w-lg relative group">
            {/* The Glassmorphic Card */}
            <div className="relative text-left p-8 rounded-2xl bg-[#0a0a0a]/80 border border-white/10 backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-transform transform hover:-translate-y-2 duration-500">
                <h3 className="text-gray-400 text-sm font-mono uppercase tracking-widest mb-6">FHE Encryption Flow</h3>
                
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">1</div>
                        <div>
                            <p className="text-white font-medium">Input Amount</p>
                            <p className="text-gray-500 text-xs font-mono">$500 USDC</p>
                        </div>
                    </div>
                    
                    <div className="w-0.5 h-8 bg-gradient-to-b from-blue-500/30 to-purple-500/30 mx-6"></div>
                    
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-purple-500/20 flex flex-shrink-0 items-center justify-center text-purple-400 border border-purple-500/40 relative">
                            {/* Inner pulse */}
                            <div className="absolute inset-0 rounded-full bg-purple-400/20 animate-ping"></div>
                            <span className="relative z-10">2</span>
                        </div>
                        <div>
                            <p className="text-white font-medium">Fhenix Encryption</p>
                            <p className="text-purple-300 text-xs font-mono tracking-tighter truncate max-w-[200px]">0x289f81a7b3...e7a4b8</p>
                        </div>
                    </div>

                    <div className="w-0.5 h-8 bg-gradient-to-b from-purple-500/30 to-green-500/30 mx-6"></div>

                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-400 border border-green-500/20">3</div>
                        <div>
                            <p className="text-white font-medium">StealthPay Vault</p>
                            <p className="text-gray-500 text-xs">Zero-Knowledge Settled</p>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Ambient glowing effect strictly behind the card */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-500/20 rounded-3xl blur-3xl -z-10 group-hover:blur-[60px] group-hover:from-purple-600/30 group-hover:to-blue-500/30 transition-all duration-700"></div>
        </div>
      </main>

      <footer className="text-center py-8 text-gray-600 text-xs tracking-widest font-mono uppercase bg-black relative z-10">
        Built for the Fhenix Buildathon 2026
      </footer>
    </div>
  );
};

export default Home;
