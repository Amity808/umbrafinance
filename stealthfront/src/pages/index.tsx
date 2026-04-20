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

      {/* How it Works Section */}
      <section className="py-24 relative z-10 border-t border-gray-900/50 bg-[#070707] overflow-hidden">
        {/* Subtle background glow for section */}
        <div className="absolute top-0 right-[-10%] w-[40%] h-[100%] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[100%] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-20">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                    How <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">StealthPay</span> Works
                </h2>
                <p className="text-gray-400 max-w-2xl mx-auto text-lg font-light leading-relaxed">
                    The underlying infrastructure leverages the <strong className="text-purple-300 font-normal">Fhenix homomorphic encryption network</strong> to process payments. Transactions compute on-chain without exposing the underlying values or user mappings.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Card 1 */}
                <div className="bg-gradient-to-b from-[#111] to-[#0a0a0a] border border-gray-800/80 rounded-3xl p-8 hover:border-purple-500/40 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-[0_10px_40px_rgba(168,85,247,0.15)] group">
                    <div className="w-14 h-14 rounded-2xl bg-purple-900/20 flex items-center justify-center border border-purple-500/20 mb-8 group-hover:scale-110 transition-transform duration-300 group-hover:bg-purple-900/40">
                        <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-100 mb-4">1. Generate Payment Link</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        Create an invoice alias securely registered to your true EVM address. Share your link or alias via WhatsApp, email, or any messenger without ever exposing your sensitive crypto wallet address to the public.
                    </p>
                </div>

                {/* Card 2 */}
                <div className="bg-gradient-to-b from-[#111] to-[#0a0a0a] border border-gray-800/80 rounded-3xl p-8 hover:border-blue-500/40 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-[0_10px_40px_rgba(59,130,246,0.15)] group">
                    <div className="w-14 h-14 rounded-2xl bg-blue-900/20 flex items-center justify-center border border-blue-500/20 mb-8 group-hover:scale-110 transition-transform duration-300 group-hover:bg-blue-900/40">
                        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-100 mb-4">2. FHE Encrypted Routing</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        The sender pays the invoice. Transaction amounts and mappings are fully homomorphically encrypted. The Fhenix network computations verify and route the transfer cleanly without seeing the plaintext data.
                    </p>
                </div>

                {/* Card 3 */}
                <div className="bg-gradient-to-b from-[#111] to-[#0a0a0a] border border-gray-800/80 rounded-3xl p-8 hover:border-green-500/40 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-[0_10px_40px_rgba(34,197,94,0.15)] group">
                    <div className="w-14 h-14 rounded-2xl bg-green-900/20 flex items-center justify-center border border-green-500/20 mb-8 group-hover:scale-110 transition-transform duration-300 group-hover:bg-green-900/40">
                        <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-100 mb-4">3. Stealth Vault Settlement</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        Funds permanently settle into your encrypted StealthPay vault. Use the Fhenix CoFHE network to securely deseal your live balance directly into your browser session, or withdraw anytime confidentially.
                    </p>
                </div>
            </div>
        </div>
      </section>

      <footer className="text-center py-8 text-gray-600 text-xs tracking-widest font-mono uppercase bg-[#020202] border-t border-gray-900/50 relative z-10">
        Built for the Fhenix Buildathon 2026
      </footer>
    </div>
  );
};

export default Home;
