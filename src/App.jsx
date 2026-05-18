import React from 'react';
import { Camera, Monitor, ArrowLeft, Radio, CheckCircle, RefreshCw, Scan } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react'; 
import { useZetcam } from './useZetcam';

export default function App() {
  const {
    mode, setMode,
    peerId, status, isConnected,
    remoteId, setRemoteId,
    myVideoRef, remoteVideoRef,
    handleGoHome, executeManualConnect
  } = useZetcam();

  return (
    <div className={
      "h-[100dvh] w-full bg-[#0a0510] text-white font-sans antialiased " +
      "p-3 md:p-6 flex flex-col items-center justify-start overflow-hidden selection:bg-pink-500/30 relative"
    }>
      
      <style>{`
        html, body, #root { background-color: #0a0510 !important; margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
        #reader { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
        #reader video { object-fit: cover !important; border-radius: 1rem !important; width: 100% !important; height: 100% !important; }
      `}</style>

      {/* PREMIUM AESTHETICS: Ambient Glowing Orbs (Restored & Enhanced) */}
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-pink-600/15 blur-[120px] pointer-events-none z-0 transition-opacity duration-1000"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-600/15 blur-[120px] pointer-events-none z-0 transition-opacity duration-1000"></div>
      
      <header className={
        "shrink-0 w-full max-w-5xl flex justify-between items-center mb-3 md:mb-6 " +
        "border-b border-white/5 pb-3 z-10 relative"
      }>
        <div className="flex flex-col">
          <div className="text-[9px] md:text-[10px] font-bold text-pink-400 tracking-widest uppercase mb-1 drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]">ZetNet Architecture</div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-[0_0_15px_rgba(236,72,153,1)] animate-pulse" />
            <h1 className="text-lg md:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 drop-shadow-lg">
              ZETCAM PRO <span className="text-[10px] font-normal text-white/30 ml-1 drop-shadow-none">v2.1.1</span>
            </h1>
          </div>
        </div>

        {mode !== 'home' && (
          <button 
            onClick={handleGoHome}
            className={
              "flex items-center gap-1.5 md:gap-2 text-[11px] md:text-xs font-medium text-white/70 hover:text-white " +
              "bg-white/5 backdrop-blur-xl px-3 md:px-4 py-2 rounded-full border border-white/10 hover:border-white/30 hover:bg-white/10 transition-all shadow-[0_4px_15px_rgba(0,0,0,0.5)]"
            }
          >
            <ArrowLeft size={14} /> Exit
          </button>
        )}
      </header>

      {/* HOME SCREEN */}
      {mode === 'home' && (
        <div className="w-full max-w-4xl flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-stretch flex-1 min-h-0 z-10 relative pb-2 md:pb-6">
          <button 
            onClick={() => setMode('camera')}
            className={
              "flex-1 flex flex-col justify-center min-h-0 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[24px] md:rounded-[32px] p-6 md:p-8 text-left " +
              "transition-all duration-300 hover:border-pink-500/40 hover:bg-pink-500/[0.04] hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(236,72,153,0.25)] group relative overflow-hidden"
            }
          >
            <div className="w-12 h-12 md:w-16 md:h-16 shrink-0 rounded-2xl bg-gradient-to-br from-pink-500/20 to-pink-500/5 flex items-center justify-center text-pink-400 mb-4 md:mb-6 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(236,72,153,0.4)] transition-all duration-300 border border-pink-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <Camera className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold mb-2 tracking-tight group-hover:text-pink-100 transition-colors">I am the Camera</h3>
            <p className="text-xs md:text-sm text-white/50 leading-relaxed font-light hidden sm:block">Turn this phone into a high-fidelity streaming lens. Auto-launches the secure QR scanner.</p>
            <div className="absolute -bottom-6 -right-6 text-white/[0.02] group-hover:text-pink-500/[0.05] transition-colors duration-500">
              <Scan size={140} />
            </div>
          </button>

          <button 
            onClick={() => setMode('receiver')}
            className={
              "flex-1 flex flex-col justify-center min-h-0 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[24px] md:rounded-[32px] p-6 md:p-8 text-left " +
              "transition-all duration-300 hover:border-purple-500/40 hover:bg-purple-500/[0.04] hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(168,85,247,0.25)] group relative overflow-hidden"
            }
          >
            <div className="w-12 h-12 md:w-16 md:h-16 shrink-0 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center text-purple-400 mb-4 md:mb-6 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all duration-300 border border-purple-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <Monitor className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold mb-2 tracking-tight group-hover:text-purple-100 transition-colors">I am the PC Monitor</h3>
            <p className="text-xs md:text-sm text-white/50 leading-relaxed font-light hidden sm:block">Host the stream display window. Generates the secure target authentication matrix.</p>
            <div className="absolute -bottom-6 -right-6 text-white/[0.02] group-hover:text-purple-500/[0.05] transition-colors duration-500">
              <CheckCircle size={140} />
            </div>
          </button>
        </div>
      )}

      {/* CAMERA SCREEN */}
      {mode === 'camera' && (
        <div className="w-full max-w-md flex flex-col items-center gap-3 md:gap-4 z-10 relative flex-1 min-h-0 pb-2 md:pb-6">
          
          <div className="shrink-0 w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-3 md:p-4 text-center shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <span className="text-xs md:text-sm font-semibold text-pink-400 flex items-center justify-center gap-2 tracking-wide drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]">
              <Radio size={16} className="animate-pulse shrink-0" /> <span className="truncate">{status}</span>
            </span>
          </div>

          <div className={
            "w-full flex-1 min-h-0 bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[24px] md:rounded-[32px] p-4 md:p-6 flex flex-col gap-3 md:gap-4 shadow-[0_20px_50px_rgba(0,0,0,0.6)] " +
            (isConnected ? 'hidden' : 'flex')
          }>
            <h4 className="shrink-0 text-base md:text-lg font-bold tracking-tight text-center text-white drop-shadow-md">Align Scanner to PC Screen</h4>
            
            <div id="reader" className={
              "flex-1 min-h-0 overflow-hidden rounded-xl md:rounded-3xl bg-black/80 border border-white/10 shadow-[inset_0_4px_30px_rgba(0,0,0,0.8)] " +
              "text-white flex items-center justify-center relative"
            }>
               <span className="text-xs md:text-sm text-white/40 absolute z-0 font-medium tracking-widest uppercase text-center px-4">Activating Lens...</span>
            </div>
            
            <div className="shrink-0 flex items-center gap-3 w-full my-1 opacity-50">
              <div className="h-px bg-white/20 flex-1"></div>
              <span className="text-[9px] md:text-[10px] text-white/50 uppercase tracking-widest font-bold">Manual Override</span>
              <div className="h-px bg-white/20 flex-1"></div>
            </div>
            
            <div className="shrink-0 flex gap-2 md:gap-3 w-full group">
              <input 
                type="text" 
                placeholder="Paste Raw Target ID" 
                value={remoteId} 
                onChange={(e) => setRemoteId(e.target.value)}
                className={
                  "flex-1 min-w-0 bg-black/60 border border-white/10 rounded-xl px-3 md:px-4 py-2 md:py-3 " +
                  "text-xs md:text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/50 transition-all shadow-inner"
                }
              />
              <button 
                onClick={executeManualConnect}
                className={
                  "shrink-0 bg-gradient-to-r from-pink-500 to-pink-600 text-white font-bold text-xs md:text-sm px-4 md:px-6 py-2 md:py-3 " +
                  "rounded-xl hover:shadow-[0_0_25px_rgba(236,72,153,0.6)] active:scale-95 hover:-translate-y-0.5 transition-all"
                }
              >
                Link
              </button>
            </div>
          </div>

          <div className={
            "w-full flex-1 min-h-0 bg-black rounded-[24px] md:rounded-[32px] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.9)] border border-white/10 relative " +
            (!isConnected ? 'hidden' : 'block')
          }>
            <video ref={myVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <div className={
              "absolute top-4 right-4 bg-black/50 backdrop-blur-xl border border-white/10 text-emerald-400 text-[10px] md:text-[11px] font-bold " +
              "uppercase px-3 md:px-4 py-1.5 md:py-2 rounded-full flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            }>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></span>
              Live
            </div>
          </div>
        </div>
      )}

      {/* RECEIVER SCREEN */}
      {mode === 'receiver' && (
        <div className={
          "w-full flex flex-col items-center gap-4 z-10 relative flex-1 min-h-0 pb-2 md:pb-6 " +
          (isConnected ? 'max-w-full px-0 md:px-4' : 'max-w-5xl')
        }>
          <div className="w-full h-full flex flex-col md:flex-row items-stretch justify-center gap-4 flex-1 min-h-0">
            
            {!isConnected && (
              <div className={
                "flex-1 md:flex-none md:w-1/3 flex flex-col items-center justify-center min-h-0 bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[24px] md:rounded-[32px] " +
                "p-5 md:p-8 text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all"
              }>
                <h3 className="shrink-0 text-lg md:text-2xl font-bold mb-1 tracking-tight drop-shadow-md">Pair Device</h3>
                <p className="shrink-0 text-[11px] md:text-sm text-white/50 mb-4 md:mb-8 font-light">Point mobile lens at this matrix</p>
                
                <div className="flex-1 min-h-0 w-full max-h-[240px] bg-white p-3 md:p-5 rounded-[20px] md:rounded-[24px] mb-4 md:mb-8 flex justify-center items-center shadow-[0_0_40px_rgba(255,255,255,0.15)] relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  {peerId ? (
                    <QRCodeSVG value={peerId} style={{ width: '100%', height: '100%', maxWidth: '200px' }} className="relative z-10 drop-shadow-sm" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-black/40 gap-2 h-full relative z-10">
                      <RefreshCw className="animate-spin text-purple-600 w-6 h-6 md:w-8 md:h-8" />
                      <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-center">Generating<br/>Key</span>
                    </div>
                  )}
                </div>

                <div className="shrink-0 w-full bg-black/60 rounded-xl md:rounded-2xl p-3 border border-white/10 overflow-hidden shadow-inner">
                  <code className="text-[9px] md:text-xs text-purple-300 break-all block font-mono drop-shadow-[0_0_5px_rgba(216,180,254,0.4)]">{peerId || 'Awaiting secure token...'}</code>
                </div>
              </div>
            )}

            <div className={
              "flex-1 min-h-0 bg-black rounded-[24px] md:rounded-[32px] border border-white/10 relative overflow-hidden flex items-center justify-center shadow-[0_0_60px_rgba(0,0,0,0.7)] "
            }>
              <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-contain" 
              />
              
              {!isConnected && (
                <div className="absolute inset-0 flex flex-row md:flex-col items-center justify-center bg-black/60 backdrop-blur-xl gap-4 md:gap-6 text-left md:text-center p-4 md:p-8">
                  <div className="shrink-0 p-4 md:p-6 bg-purple-500/10 rounded-full border border-purple-500/30 text-purple-400 animate-pulse shadow-[0_0_40px_rgba(168,85,247,0.3)]">
                    <Monitor className="w-6 h-6 md:w-12 md:h-12 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base md:text-2xl font-bold tracking-tight drop-shadow-md">Awaiting Stream Link</h4>
                    <p className="hidden md:block text-base text-white/60 max-w-md mx-auto leading-relaxed font-light mt-2">
                      Remote video frames will mount directly to this viewport the moment your phone confirms the authentication matrix.
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}