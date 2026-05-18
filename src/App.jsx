import React from 'react';
import { Camera, Monitor, ArrowLeft, Radio, CheckCircle, RefreshCw, Scan } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react'; 
import { useZetcam } from './useZetcam';

export default function App() {
  // Pull all the engine logic from our untouchable Vault
  const {
    mode, setMode,
    peerId, status, isConnected,
    remoteId, setRemoteId,
    myVideoRef, remoteVideoRef,
    handleGoHome, executeManualConnect
  } = useZetcam();

  return (
    <div className={
      "min-h-screen w-full bg-[#0a0510] text-white font-sans antialiased " +
      "p-4 md:p-6 flex flex-col items-center justify-start overflow-x-hidden selection:bg-pink-500/30 relative"
    }>
      
      {/* GLOBAL CSS OVERRIDES */}
      <style>{`
        html, body, #root { background-color: #0a0510 !important; margin: 0; padding: 0; width: 100%; overflow-x: hidden; }
        #reader video { object-fit: cover !important; border-radius: 1.5rem !important; width: 100% !important; }
      `}</style>

      {/* PREMIUM AESTHETICS: Ambient Glowing Orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-pink-600/10 blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none z-0"></div>
      
      {/* TOP NAVIGATION */}
      <header className={
        "w-full max-w-5xl flex justify-between items-center mb-8 " +
        "border-b border-white/5 pb-4 z-10 relative"
      }>
        <div className="flex flex-col">
          <div className="text-[10px] font-bold text-pink-400 tracking-widest uppercase mb-1">ZetNet Architecture</div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-[0_0_12px_rgba(236,72,153,0.8)] animate-pulse" />
            <h1 className="text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
              ZETCAM PRO <span className="text-[10px] font-normal text-white/30 ml-1">v2.1.1</span>
            </h1>
          </div>
        </div>

        {mode !== 'home' && (
          <button 
            onClick={handleGoHome}
            className={
              "flex items-center gap-2 text-xs font-medium text-white/70 hover:text-white " +
              "bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 hover:border-white/20 transition-all shadow-lg"
            }
          >
            <ArrowLeft size={16} /> Exit Mode
          </button>
        )}
      </header>

      {/* HOME SCREEN */}
      {mode === 'home' && (
        <div className="w-full max-w-4xl flex flex-col sm:flex-row gap-6 justify-center items-stretch my-auto py-10 z-10 relative">
          <button 
            onClick={() => setMode('camera')}
            className={
              "flex-1 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[32px] p-8 text-left " +
              "transition-all duration-300 hover:border-pink-500/40 hover:bg-pink-500/[0.02] hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(236,72,153,0.15)] group relative overflow-hidden"
            }
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500/20 to-pink-500/5 flex items-center justify-center text-pink-400 mb-6 group-hover:scale-110 transition-transform duration-300 border border-pink-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <Camera size={32} />
            </div>
            <h3 className="text-2xl font-bold mb-3 tracking-tight">I am the Camera</h3>
            <p className="text-sm text-white/50 leading-relaxed font-light">Turn this phone into a high-fidelity streaming lens. Auto-launches the secure QR scanner.</p>
            <div className="absolute -bottom-6 -right-6 text-white/[0.01] group-hover:text-pink-500/[0.03] transition-colors duration-500">
              <Scan size={140} />
            </div>
          </button>

          <button 
            onClick={() => setMode('receiver')}
            className={
              "flex-1 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[32px] p-8 text-left " +
              "transition-all duration-300 hover:border-purple-500/40 hover:bg-purple-500/[0.02] hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(168,85,247,0.15)] group relative overflow-hidden"
            }
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform duration-300 border border-purple-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <Monitor size={32} />
            </div>
            <h3 className="text-2xl font-bold mb-3 tracking-tight">I am the PC Monitor</h3>
            <p className="text-sm text-white/50 leading-relaxed font-light">Host the stream display window. Generates the secure target authentication matrix.</p>
            <div className="absolute -bottom-6 -right-6 text-white/[0.01] group-hover:text-purple-500/[0.03] transition-colors duration-500">
              <CheckCircle size={140} />
            </div>
          </button>
        </div>
      )}

      {/* CAMERA SCREEN */}
      {mode === 'camera' && (
        <div className="w-full max-w-md flex flex-col items-center gap-6 z-10 relative mt-4">
          
          <div className="w-full bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-center shadow-xl">
            <span className="text-sm font-semibold text-pink-400 flex items-center justify-center gap-2 tracking-wide">
              <Radio size={16} className="animate-pulse" /> {status}
            </span>
          </div>

          <div className={
            "w-full bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[32px] p-6 text-center flex flex-col gap-4 shadow-2xl " +
            (isConnected ? 'hidden' : 'block')
          }>
            <h4 className="text-lg font-bold tracking-tight">Align Scanner to PC Screen</h4>
            
            <div id="reader" className={
              "overflow-hidden rounded-3xl bg-black/60 border border-white/10 shadow-[inset_0_4px_20px_rgba(0,0,0,0.5)] " +
              "text-white max-w-full min-h-[300px] flex items-center justify-center relative"
            }>
               <span className="text-sm text-white/40 absolute z-0 font-medium tracking-widest uppercase">Activating Lens...</span>
            </div>
            
            <div className="flex items-center gap-3 w-full my-2">
              <div className="h-px bg-white/10 flex-1"></div>
              <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Manual Override</span>
              <div className="h-px bg-white/10 flex-1"></div>
            </div>
            
            <div className="flex gap-3 w-full">
              <input 
                type="text" 
                placeholder="Paste Raw Target ID" 
                value={remoteId} 
                onChange={(e) => setRemoteId(e.target.value)}
                className={
                  "flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 " +
                  "text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/50 transition-all"
                }
              />
              <button 
                onClick={executeManualConnect}
                className={
                  "bg-gradient-to-r from-pink-500 to-pink-600 text-white font-bold text-sm px-6 py-3 " +
                  "rounded-xl hover:shadow-[0_0_20px_rgba(236,72,153,0.4)] active:scale-95 transition-all"
                }
              >
                Link
              </button>
            </div>
          </div>

          <div className={
            "w-full bg-black rounded-[32px] overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)] border border-white/10 relative aspect-[3/4] " +
            (!isConnected ? 'hidden' : 'block')
          }>
            <video ref={myVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <div className={
              "absolute top-5 right-5 bg-black/50 backdrop-blur-md border border-white/10 text-emerald-400 text-[11px] font-bold " +
              "uppercase px-4 py-2 rounded-full flex items-center gap-2 shadow-lg"
            }>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live
            </div>
          </div>
        </div>
      )}

      {/* RECEIVER SCREEN */}
      {mode === 'receiver' && (
        <div className={
          "w-full flex flex-col items-center gap-6 z-10 relative " +
          (isConnected ? 'max-w-full px-0 md:px-4' : 'max-w-5xl')
        }>
          <div className="w-full flex flex-col md:flex-row items-stretch justify-center gap-8">
            
            {!isConnected && (
              <div className={
                "w-full md:w-1/3 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[32px] " +
                "p-8 text-center flex flex-col items-center justify-center shrink-0 shadow-2xl"
              }>
                <h3 className="text-2xl font-bold mb-2 tracking-tight">Pair Device</h3>
                <p className="text-sm text-white/50 mb-8 font-light">Point your mobile lens at this matrix</p>
                
                <div className="bg-white p-5 rounded-[24px] mb-8 flex justify-center items-center min-h-[200px] min-w-[200px] shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                  {peerId ? (
                    <QRCodeSVG value={peerId} size={180} />
                  ) : (
                    <div className="w-40 h-40 flex flex-col items-center justify-center text-black/40 gap-3">
                      <RefreshCw className="animate-spin text-purple-600" size={28} />
                      <span className="text-xs font-bold uppercase tracking-wider">Generating Key</span>
                    </div>
                  )}
                </div>

                <div className="w-full bg-black/50 rounded-2xl p-4 border border-white/10 max-w-full overflow-hidden shadow-inner">
                  <code className="text-xs text-purple-300 break-all block font-mono">{peerId || 'Awaiting secure token...'}</code>
                </div>
              </div>
            )}

            <div className={
              "bg-black rounded-[32px] border border-white/10 relative overflow-hidden flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.5)] " +
              (isConnected ? 'w-full h-[calc(100vh-140px)]' : 'w-full md:w-2/3 min-h-[500px]')
            }>
              <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-contain" 
              />
              
              {!isConnected && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-lg gap-6 text-center p-8">
                  <div className="p-6 bg-purple-500/10 rounded-full border border-purple-500/20 text-purple-400 animate-pulse shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                    <Monitor size={48} />
                  </div>
                  <h4 className="text-2xl font-bold tracking-tight">Awaiting Stream Link</h4>
                  <p className="text-base text-white/50 max-w-md leading-relaxed font-light">
                    Remote video frames will mount directly to this viewport the moment your phone confirms the authentication matrix.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}