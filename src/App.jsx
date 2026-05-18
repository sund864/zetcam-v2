import React, { useState, useEffect } from 'react';
import { Camera, Monitor, ArrowLeft, Radio, CheckCircle, RefreshCw, Scan, Settings, Zap, Repeat, Sun, LogOut, Maximize, Minimize, PictureInPicture, Video, Smartphone, Battery } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react'; 
import { useZetcam } from './useZetcam';

export default function App() {
  const {
    mode, setMode,
    peerId, status, isConnected,
    remoteId, setRemoteId,
    myVideoRef, remoteVideoRef,
    handleGoHome, executeManualConnect,
    isTorchOn, toggleTorch,
    facingMode, toggleLens,
    exposureLevel, adjustExposure,
    remoteTorch, remoteExposure, sendRemoteCommand,
    togglePiP,
    videoQuality, changeQuality,
    stayAwake, toggleStayAwake,
    batterySaver, toggleBatterySaver
  } = useZetcam();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [uiRotation, setUiRotation] = useState(0); 
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fsControlsVisible, setFsControlsVisible] = useState(true);
  
  const isStreamActive = isConnected;
  const displayTorch = mode === 'camera' ? isTorchOn : remoteTorch;
  const displayExposure = mode === 'camera' ? exposureLevel : remoteExposure;

  useEffect(() => {
    let timeout;
    if (isFullscreen && fsControlsVisible && !isSettingsOpen) {
      timeout = setTimeout(() => {
        setFsControlsVisible(false);
      }, 5000);
    }
    return () => clearTimeout(timeout);
  }, [isFullscreen, fsControlsVisible, isSettingsOpen]);

  const handleFsInteraction = () => {
    if (isFullscreen) {
      setFsControlsVisible(true);
    }
  };

  const handleTorchToggle = () => {
    if (mode === 'camera') toggleTorch();
    else sendRemoteCommand('CMD_TORCH');
  };

  const handleExposureChange = (val) => {
    if (mode === 'camera') adjustExposure(val);
    else sendRemoteCommand('CMD_EXPOSURE', val);
  };

  const executeExit = () => {
    setIsSettingsOpen(false);
    setUiRotation(0);
    setIsFullscreen(false);
    handleGoHome();
  };

  const renderSettingsDropdown = () => (
    <div className="absolute top-12 right-0 w-64 bg-black/90 backdrop-blur-3xl border border-white/10 rounded-2xl p-2 shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col gap-1 z-50 max-h-[80dvh] overflow-y-auto custom-scrollbar">
      <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-white/40 font-bold border-b border-white/5 mb-1">
        {mode === 'camera' ? 'Local Controls' : 'Remote Controls'}
      </div>

      {mode === 'camera' && (
        <div className="flex items-center justify-between w-full px-3 py-3 rounded-xl hover:bg-white/5 transition-colors group">
          <div className="flex items-center gap-3 text-xs font-medium text-white/80 group-hover:text-white">
            <Video size={14} className="text-indigo-400" /> Resolution
          </div>
          <select 
            value={videoQuality}
            onChange={(e) => changeQuality(e.target.value)}
            className="bg-black/60 border border-white/10 rounded-lg text-[10px] text-white/80 font-bold px-2 py-1 outline-none focus:border-indigo-500/50 cursor-pointer"
          >
            <option value="720p">720p</option>
            <option value="1080p">1080p (HD)</option>
            <option value="1440p">1440p (2K)</option>
            <option value="4K">4K (Ultra)</option>
          </select>
        </div>
      )}
      
      <button 
        onClick={handleTorchToggle}
        className="flex items-center justify-between w-full px-3 py-3 rounded-xl hover:bg-white/5 transition-colors group"
      >
        <div className="flex items-center gap-3 text-xs font-medium text-white/80 group-hover:text-white">
          <Zap size={14} className={displayTorch ? "text-yellow-400" : "text-white/40 group-hover:text-yellow-400/50"} /> Flashlight
        </div>
        <div className={`w-8 h-4 rounded-full border border-white/5 relative transition-colors ${displayTorch ? 'bg-pink-500' : 'bg-white/10'}`}>
          <div className={`w-4 h-4 bg-white rounded-full absolute top-[-1px] transition-all shadow-md ${displayTorch ? 'left-4' : 'left-0 bg-white/40'}`}></div>
        </div>
      </button>

      {mode === 'camera' && (
        <button 
          onClick={toggleLens}
          className="flex items-center justify-between w-full px-3 py-3 rounded-xl hover:bg-white/5 transition-colors group active:scale-95"
        >
          <div className="flex items-center gap-3 text-xs font-medium text-white/80 group-hover:text-white">
            <Repeat size={14} className="text-blue-400 group-hover:rotate-180 transition-transform duration-500" /> Switch Lens
          </div>
          <span className="text-[10px] text-white/40 group-hover:text-white/70 uppercase font-bold tracking-wider">
            {facingMode === 'environment' ? 'Back' : 'Front'}
          </span>
        </button>
      )}

      {mode === 'camera' && (
        <>
          <div className="h-px bg-white/5 w-full my-1"></div>
          <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-white/40 font-bold border-b border-white/5 mb-1">Advanced Mode</div>
          
          <button 
            onClick={toggleStayAwake}
            className="flex items-center justify-between w-full px-3 py-3 rounded-xl hover:bg-white/5 transition-colors group"
          >
            <div className="flex items-center gap-3 text-xs font-medium text-white/80 group-hover:text-white">
              <Smartphone size={14} className={stayAwake ? "text-emerald-400" : "text-white/40 group-hover:text-emerald-400/50"} /> Stay Awake
            </div>
            <div className={`w-8 h-4 rounded-full border border-white/5 relative transition-colors ${stayAwake ? 'bg-emerald-500' : 'bg-white/10'}`}>
              <div className={`w-4 h-4 bg-white rounded-full absolute top-[-1px] transition-all shadow-md ${stayAwake ? 'left-4' : 'left-0 bg-white/40'}`}></div>
            </div>
          </button>

          <button 
            onClick={() => { setIsSettingsOpen(false); toggleBatterySaver(); }}
            className="flex items-center justify-between w-full px-3 py-3 rounded-xl hover:bg-white/5 transition-colors group"
          >
            <div className="flex items-center gap-3 text-xs font-medium text-white/80 group-hover:text-white">
              <Battery size={14} className="text-gray-400 group-hover:text-white" /> Battery Saver
            </div>
            <span className="text-[10px] text-white/40 group-hover:text-white/70">OLED Blackout</span>
          </button>
        </>
      )}

      {mode === 'receiver' && (
        <>
          <button 
            onClick={() => setUiRotation((prev) => (prev + 90) % 360)}
            className="flex items-center justify-between w-full px-3 py-3 rounded-xl hover:bg-white/5 transition-colors group"
          >
            <div className="flex items-center gap-3 text-xs font-medium text-white/80 group-hover:text-white">
              <Monitor size={14} className="text-emerald-400" /> UI Rotation
            </div>
            <span className="text-[10px] text-white/40 group-hover:text-white/70">{uiRotation}°</span>
          </button>
          
          <button 
            onClick={() => { setIsSettingsOpen(false); togglePiP(); }}
            className="flex items-center justify-between w-full px-3 py-3 rounded-xl hover:bg-white/5 transition-colors group"
          >
            <div className="flex items-center gap-3 text-xs font-medium text-white/80 group-hover:text-white">
              <PictureInPicture size={14} className="text-blue-400" /> Pop-out Player
            </div>
            <span className="text-[10px] text-white/40 group-hover:text-white/70">PiP Mode</span>
          </button>

          {!isFullscreen && (
            <button 
              onClick={() => { setIsSettingsOpen(false); setIsFullscreen(true); }}
              className="flex items-center justify-between w-full px-3 py-3 rounded-xl hover:bg-white/5 transition-colors group"
            >
              <div className="flex items-center gap-3 text-xs font-medium text-white/80 group-hover:text-white">
                <Maximize size={14} className="text-pink-400" /> Theater Mode
              </div>
              <span className="text-[10px] text-white/40 group-hover:text-white/70">Full Screen</span>
            </button>
          )}
        </>
      )}

      <div className="h-px bg-white/5 w-full my-1"></div>

      <div className="flex flex-col gap-2 w-full px-3 py-3 rounded-xl hover:bg-white/5 transition-colors group">
        <div className="flex items-center gap-3 text-xs font-medium text-white/80 group-hover:text-white">
          <Sun size={14} className={displayExposure > 50 ? "text-orange-400" : "text-white/40"} /> Exposure
        </div>
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={displayExposure}
          onChange={(e) => handleExposureChange(e.target.value)}
          className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-400" 
        />
      </div>

      <div className="h-px bg-white/5 w-full my-1"></div>

      <button 
        onClick={executeExit}
        className="flex items-center gap-3 w-full px-3 py-3 rounded-xl hover:bg-red-500/10 text-red-400 transition-colors group"
      >
        <LogOut size={14} /> <span className="text-xs font-bold">Terminate Connection</span>
      </button>
    </div>
  );

  return (
    <div className={
      "h-[100dvh] w-full bg-[#0a0510] text-white font-sans antialiased " +
      "p-3 md:p-6 flex flex-col items-center justify-start overflow-hidden selection:bg-pink-500/30 relative"
    }>
      
      <style>{`
        html, body, #root { background-color: #0a0510 !important; margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
        #reader { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
        #reader video { object-fit: cover !important; border-radius: 1rem !important; width: 100% !important; height: 100% !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>

      {/* OLED BLACKOUT OVERLAY */}
      {batterySaver && (
        <div 
          className="fixed inset-0 bg-black z-[999] flex flex-col items-center justify-center text-white/10 cursor-pointer"
          onClick={toggleBatterySaver}
        >
          <Battery size={48} className="mb-4 opacity-20" />
          <p className="text-xs uppercase tracking-widest opacity-20 font-bold mb-2">Battery Saver Active</p>
          <p className="text-[10px] opacity-10">Tap anywhere to wake screen</p>
        </div>
      )}

      {!isFullscreen && (
        <>
          <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-pink-600/15 blur-[120px] pointer-events-none z-0 transition-opacity duration-1000"></div>
          <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-600/15 blur-[120px] pointer-events-none z-0 transition-opacity duration-1000"></div>
        </>
      )}
      
      {!isFullscreen && (
        <header className={
          "shrink-0 w-full max-w-5xl flex justify-between items-center mb-3 md:mb-6 " +
          "border-b border-white/5 pb-3 z-20 relative"
        }>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-[0_0_15px_rgba(236,72,153,1)] animate-pulse" />
              <h1 className="text-lg md:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 drop-shadow-lg">
                ZETCAM PRO <span className="text-[10px] font-normal text-white/30 ml-1 drop-shadow-none">v2.1.1</span>
              </h1>
            </div>
            <div className="text-[9px] md:text-[10px] font-bold tracking-widest uppercase ml-[18px] text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-white to-gray-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              ZetNet Architecture
            </div>
          </div>

          {mode !== 'home' && (
            <div className="relative">
              {!isStreamActive ? (
                <button 
                  onClick={executeExit}
                  className={
                    "flex items-center gap-1.5 md:gap-2 text-[11px] md:text-xs font-medium text-white/70 hover:text-white " +
                    "bg-white/5 backdrop-blur-xl px-3 md:px-4 py-2 rounded-full border border-white/10 hover:border-white/30 hover:bg-white/10 transition-all shadow-[0_4px_15px_rgba(0,0,0,0.5)]"
                  }
                >
                  <ArrowLeft size={14} /> Exit
                </button>
              ) : (
                <button 
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className={
                    "flex items-center gap-1.5 md:gap-2 text-[11px] md:text-xs font-bold text-white " +
                    "bg-pink-500/20 backdrop-blur-xl px-3 md:px-4 py-2 rounded-full border border-pink-500/30 hover:border-pink-400 hover:bg-pink-500/30 transition-all shadow-[0_0_15px_rgba(236,72,153,0.3)]"
                  }
                >
                  <Settings size={14} className={isSettingsOpen ? "animate-spin-slow" : ""} /> Settings
                </button>
              )}

              {isSettingsOpen && renderSettingsDropdown()}
            </div>
          )}
        </header>
      )}

      {mode === 'home' && (
        <div className="w-full max-w-4xl flex flex-col sm:flex-row gap-8 md:gap-10 justify-center items-center flex-1 min-h-0 z-10 relative pb-2 md:pb-6">
          <button 
            onClick={() => setMode('camera')}
            className={
              "w-full sm:flex-1 h-fit flex flex-col justify-center min-h-0 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[24px] md:rounded-[32px] p-6 md:p-8 text-left " +
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
              "w-full sm:flex-1 h-fit flex flex-col justify-center min-h-0 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[24px] md:rounded-[32px] p-6 md:p-8 text-left " +
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
                placeholder="Paste Target PIN" 
                value={remoteId} 
                onChange={(e) => setRemoteId(e.target.value)}
                className={
                  "flex-1 min-w-0 bg-black/60 border border-white/10 rounded-xl px-3 md:px-4 py-2 md:py-3 " +
                  "text-xs md:text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/50 transition-all shadow-inner font-mono tracking-widest"
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

                <div className="shrink-0 w-full bg-black/60 rounded-xl md:rounded-2xl p-3 border border-white/10 overflow-hidden shadow-inner flex flex-col items-center gap-1">
                  <span className="text-[8px] text-white/30 uppercase tracking-widest font-bold">Secure PIN</span>
                  <code className="text-sm md:text-base text-pink-400 break-all block font-mono font-bold tracking-[0.3em] drop-shadow-[0_0_5px_rgba(236,72,153,0.4)]">{peerId || '...'}</code>
                </div>
              </div>
            )}

            <div 
              className={
                isFullscreen 
                  ? "fixed inset-0 z-[100] bg-[#05020a] flex items-center justify-center cursor-default" 
                  : "flex-1 min-h-0 bg-black rounded-[24px] md:rounded-[32px] border border-white/10 relative overflow-hidden flex items-center justify-center shadow-[0_0_60px_rgba(0,0,0,0.7)] "
              }
              onMouseMove={handleFsInteraction}
              onClick={handleFsInteraction}
            >
              <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-contain" 
                style={{ transform: `rotate(${uiRotation}deg)`, transition: 'transform 0.3s ease-in-out' }}
              />

              {isFullscreen && (
                <div 
                  className={`absolute top-6 right-6 flex items-center gap-3 transition-opacity duration-500 ${fsControlsVisible || isSettingsOpen ? 'opacity-100' : 'opacity-0'}`}
                >
                  <div className="relative">
                    <button 
                      onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                      className="flex items-center gap-2 text-xs font-bold text-white bg-black/60 backdrop-blur-md px-4 py-3 rounded-xl border border-white/20 hover:bg-white/10 transition-all shadow-lg"
                    >
                      <Settings size={16} className={isSettingsOpen ? "animate-spin-slow" : ""} /> Settings
                    </button>
                    {isSettingsOpen && renderSettingsDropdown()}
                  </div>

                  <button 
                    onClick={() => setIsFullscreen(false)}
                    className="flex items-center gap-2 text-xs font-bold text-white bg-red-500/20 backdrop-blur-md px-4 py-3 rounded-xl border border-red-500/30 hover:bg-red-500/40 hover:border-red-400 transition-all shadow-lg"
                  >
                    <Minimize size={16} /> Exit Theater
                  </button>
                </div>
              )}
              
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