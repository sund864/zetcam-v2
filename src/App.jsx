import React, { useState, useEffect } from 'react';
import { Camera, Monitor, ArrowLeft, Radio, CheckCircle, RefreshCw, Scan, Settings, Zap, Repeat, Sun, LogOut, Maximize, Minimize, PictureInPicture, Video, Smartphone, Battery } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react'; 
import { useZetcam } from './useZetcam';
import { SplashScreen } from '@capacitor/splash-screen'; 
import { Capacitor } from '@capacitor/core';

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
    batterySaver, toggleBatterySaver,
    isNativeApp
  } = useZetcam();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [uiRotation, setUiRotation] = useState(0); 
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fsControlsVisible, setFsControlsVisible] = useState(true);
  
  const isStreamActive = isConnected;
  const displayTorch = mode === 'camera' ? isTorchOn : remoteTorch;
  const displayExposure = mode === 'camera' ? exposureLevel : remoteExposure;

  useEffect(() => {
    const setupNative = async () => {
      if (isNativeApp) {
        try {
          await SplashScreen.hide();
          if (Capacitor.isPluginAvailable('StatusBar')) {
            await Capacitor.Plugins.StatusBar.setOverlaysWebView({ overlay: true });
            await Capacitor.Plugins.StatusBar.hide();
          }
        } catch (err) {}
      }
    };
    setTimeout(setupNative, 500);
  }, [isNativeApp]);

  useEffect(() => {
    const videoElement = mode === 'camera' ? myVideoRef.current : remoteVideoRef.current;
    if (videoElement && isConnected) {
      const playPromise = videoElement.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log("Video stream interrupted by mode switch. Safe to ignore.");
        });
      }
    }
  }, [isConnected, mode, myVideoRef, remoteVideoRef]);

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
    <div className="absolute top-12 right-0 w-64 bg-black/90 backdrop-blur-3xl border border-white/10 rounded-2xl p-2 shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col gap-1 z-50 max-h-[80dvh] overflow-y-auto custom-scrollbar text-left">
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
            <Repeat size={14} className="text-blue-400" /> Switch Lens
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
              <Smartphone size={14} className={stayAwake ? "text-emerald-400" : "text-white/40"} /> Stay Awake
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
          
          {!isFullscreen ? (
            <button 
              onClick={() => { setIsSettingsOpen(false); setIsFullscreen(true); }}
              className="flex items-center justify-between w-full px-3 py-3 rounded-xl hover:bg-white/5 transition-colors group"
            >
              <div className="flex items-center gap-3 text-xs font-medium text-white/80 group-hover:text-white">
                <Maximize size={14} className="text-pink-400" /> Theater Mode
              </div>
              <span className="text-[10px] text-white/40 group-hover:text-white/70">Full Screen</span>
            </button>
          ) : (
            <button 
              onClick={() => { setIsSettingsOpen(false); setIsFullscreen(false); }}
              className="flex items-center justify-between w-full px-3 py-3 rounded-xl hover:bg-white/5 transition-colors group"
            >
              <div className="flex items-center gap-3 text-xs font-medium text-white/80 group-hover:text-white">
                <Minimize size={14} className="text-pink-400" /> Exit Theater
              </div>
              <span className="text-[10px] text-white/40 group-hover:text-white/70">Close</span>
            </button>
          )}
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
          
          {(!isNativeApp) && (
            <button 
              onClick={() => { setIsSettingsOpen(false); togglePiP(); }}
              className="flex items-center justify-between w-full px-3 py-3 rounded-xl hover:bg-white/5 transition-colors group"
            >
              <div className="flex items-center gap-3 text-xs font-medium text-white/80 group-hover:text-white">
                <PictureInPicture size={14} className="text-blue-400" /> Pop-out Player
              </div>
              <span className="text-[10px] text-white/40 group-hover:text-white/70">PiP Mode</span>
            </button>
          )}

          {!isFullscreen ? (
            <button 
              onClick={() => { setIsSettingsOpen(false); setIsFullscreen(true); }}
              className="flex items-center justify-between w-full px-3 py-3 rounded-xl hover:bg-white/5 transition-colors group"
            >
              <div className="flex items-center gap-3 text-xs font-medium text-white/80 group-hover:text-white">
                <Maximize size={14} className="text-pink-400" /> Theater Mode
              </div>
              <span className="text-[10px] text-white/40 group-hover:text-white/70">Full Screen</span>
            </button>
          ) : (
            <button 
              onClick={() => { setIsSettingsOpen(false); setIsFullscreen(false); }}
              className="flex items-center justify-between w-full px-3 py-3 rounded-xl hover:bg-white/5 transition-colors group"
            >
              <div className="flex items-center gap-3 text-xs font-medium text-white/80 group-hover:text-white">
                <Minimize size={14} className="text-pink-400" /> Exit Theater
              </div>
              <span className="text-[10px] text-white/40 group-hover:text-white/70">Close</span>
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
          className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-400 touch-none custom-range-slider" 
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

  const iosCustomStyles = `
    html, body, #root { background-color: #0a0510 !important; margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
    #reader { width: 100% !important; height: 100% !important; border: none !important; padding: 0 !important; background: transparent !important; display: flex; align-items: center; justify-content: center; }
    #reader > div { width: 100% !important; height: 100% !important; }
    #reader video { object-fit: cover !important; border-radius: 24px !important; width: 100% !important; height: 100% !important; position: absolute !important; inset: 0 !important; }
    #reader img, #reader svg { display: none !important; }
    #reader__dashboard_section_csr { display: none !important; }
    video::-webkit-media-controls { display: none !important; }
    video::-webkit-media-controls-enclosure { display: none !important; }
    video::-webkit-media-controls-play-button { display: none !important; }
    video::-webkit-media-controls-start-playback-button { display: none !important; }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }

    /* --- iOS IPAD LAYOUT PATCH --- */
    @supports (-webkit-touch-callout: none) {
      
      /* FIX iOS RANGE SLIDER THUMB WHEN APPEARANCE IS NONE */
      .custom-range-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        background: #fb923c;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0px 0px 5px rgba(0,0,0,0.5);
      }

      /* 1. iPad Portrait Fixes */
      @media (orientation: portrait) and (min-width: 768px) {
        .md\\:flex-row { flex-direction: column !important; }
        .md\\:w-1\\/3 { width: 100% !important; max-width: 450px !important; }
        .max-w-sm.backdrop-blur-2xl { max-width: 450px !important; padding: 1.25rem !important; border-radius: 32px !important; }
        .max-w-\\[260px\\] { max-width: 350px !important; }
        .aspect-square { min-height: 350px !important; }

        /* Match portrait Left/Right tiles perfectly */
        .left-card-tile, .right-card-tile, .portrait-status-pill {
          width: 70% !important;
          max-width: 70% !important;
          margin-left: auto !important;
          margin-right: auto !important;
        }
        .left-card-tile, .right-card-tile {
          aspect-ratio: 1 / 1 !important;
          height: auto !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: center !important;
          align-items: center !important;
          gap: 1.5rem !important;
          padding: 1.5rem !important;
        }

        /* HOME SCREEN VERTICAL LAYOUT UPGRADES */
        .home-logo-text {
          font-size: 2.5rem !important; 
          line-height: 1.2 !important;
          margin-top: 2rem !important; 
          margin-bottom: 0 !important;
        }
        .home-tile-container {
          max-width: 70% !important; 
          width: 100% !important;
          gap: 4.5rem !important; 
          margin-top: -5vh !important; 
        }
        .home-tile {
          width: 100% !important;
          max-width: 100% !important;
          min-height: 220px !important; 
          border-radius: 32px !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: center !important;
          align-items: center !important;
        }
        .home-tile .icon-wrapper {
          width: 4.5rem !important; 
          height: 4.5rem !important;
          margin-bottom: 1rem !important; 
          border-radius: 1.2rem !important;
        }
        .home-tile .icon-wrapper svg {
          width: 2.2rem !important;
          height: 2.2rem !important;
        }
        .home-tile h3 {
          font-size: 1.5rem !important;
        }
      }

      /* 2. iPad Landscape Fixes */
      @media (orientation: landscape) {
        .landscape\\:pt-4 { padding-top: 3.5rem !important; }
        .top-6 { top: 3.5rem !important; }
        .top-4 { top: 3.5rem !important; }

        .landscape\\:w-\\[70\\%\\] {
          width: 100% !important;
          max-width: 100% !important;
          height: 100% !important;
          flex: 1 1 0% !important;
          margin: 0 !important;
        }

        .landscape\\:w-\\[25\\%\\] {
          display: none !important;
        }

        header.landscape\\:hidden {
          display: flex !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          padding: 3.5rem 2rem 1.5rem !important;
          z-index: 50 !important;
          background: linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%) !important;
        }

        .home-tile {
          height: calc(200px + 5rem) !important;
          min-height: calc(200px + 5rem) !important;
        }
        
        .landscape-disconnected-container {
           width: 100% !important;
           max-width: 56rem !important; 
           margin-left: auto !important;
           margin-right: auto !important;
           justify-content: center !important;
           flex-direction: row !important;
           gap: 3rem !important; 
           padding-left: 1.5rem !important;
           padding-right: 1.5rem !important;
        }

        .left-card-tile, .right-card-tile {
          flex: 1 1 0% !important;
          width: 100% !important;
          max-width: 100% !important; 
          height: auto !important;    
          aspect-ratio: 1 / 1 !important;
          margin: auto 0 !important; 
          display: flex !important;
          flex-direction: column !important;
          justify-content: center !important;
          align-items: center !important;
          gap: 1.5rem !important;
          padding: 1.5rem !important;
        }

        .landscape\\:aspect-auto {
          max-width: 320px !important;
          max-height: 320px !important;
          aspect-ratio: 1 / 1 !important;
          margin-left: auto !important;
          margin-right: auto !important;
          flex: none !important;
        }
        .landscape\\:flex-1 { max-width: 500px !important; }
      }
    }
  `;

  return (
    <div className={
      "h-[100dvh] w-full bg-[#0a0510] text-white font-sans antialiased " +
      "p-3 md:p-6 flex flex-col items-center justify-start overflow-hidden selection:bg-pink-500/30 relative"
    }>
      
      <style dangerouslySetInnerHTML={{ __html: iosCustomStyles }} />

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
          `shrink-0 w-full max-w-5xl flex z-20 relative transition-all duration-300 ` +
          (mode === 'home' 
            ? (isNativeApp ? "flex-col justify-center items-center pt-16 landscape:pt-4 pb-8 border-none" : "flex-col justify-center items-center pt-16 pb-8 border-none")
            : "flex-row justify-between items-start pt-10 md:pt-4 mb-3 md:mb-6 border-b border-white/5 pb-3")
        }>
          <div className={`flex flex-col ${mode === 'home' ? 'text-center w-full' : 'text-left'}`}>
            <div className={`flex items-center gap-2 mb-0.5 ${mode === 'home' ? 'justify-center' : 'justify-start'}`}>
              <h1 className={`font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 drop-shadow-lg ${mode === 'home' ? 'home-logo-text text-2xl md:text-3xl' : 'text-xl md:text-2xl'}`}>
                ZETCAM PRO
              </h1>
            </div>
            {mode !== 'home' && (
              <div className="text-[10px] font-bold tracking-widest uppercase text-white/40 mt-0.5">
                V2.0 by ZetNet Architecture
              </div>
            )}
          </div>

          {mode !== 'home' && (
            <div className="relative">
              {!isStreamActive ? (
                <button 
                  onClick={executeExit}
                  className={
                    "flex items-center justify-center text-white/70 hover:text-white " +
                    "bg-white/5 backdrop-blur-xl w-10 h-10 rounded-full border border-white/10 hover:border-white/30 hover:bg-white/20 transition-all shadow-[0_4px_15px_rgba(0,0,0,0.5)] active:scale-95"
                  }
                  title="Exit"
                >
                  <ArrowLeft size={18} />
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

      {/* --- ZERO TOUCH HOME SCREEN --- */}
      {mode === 'home' && (
        <div className="home-tile-container w-full max-w-sm md:max-w-md landscape:max-w-4xl mx-auto flex flex-col landscape:flex-row gap-4 md:gap-6 justify-center items-center flex-1 min-h-[60vh] z-10 relative pb-28 landscape:pb-0 landscape:h-full landscape:absolute landscape:inset-0 landscape:justify-center landscape:items-center landscape:my-auto landscape:px-6 transition-all duration-700 ease-in-out">
          <button 
            onClick={() => setMode('camera')}
            className={
              "home-tile w-full landscape:flex-1 flex flex-col landscape:flex-row items-center justify-center landscape:justify-start min-h-[140px] landscape:min-h-[200px] landscape:h-[200px] bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[24px] md:rounded-[32px] p-5 landscape:p-0 landscape:px-8 text-center landscape:text-left " +
              "transition-all duration-700 ease-in-out hover:border-pink-500/40 hover:bg-pink-500/[0.04] hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(236,72,153,0.25)] group relative overflow-hidden"
            }
          >
            <div className="icon-wrapper w-12 h-12 md:w-14 md:h-14 landscape:w-12 landscape:h-12 shrink-0 rounded-2xl bg-gradient-to-br from-pink-500/20 to-pink-500/5 flex items-center justify-center text-pink-400 mb-3 landscape:mb-0 landscape:mr-5 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(236,72,153,0.4)] transition-all duration-500 border border-pink-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <Camera className="w-6 h-6 md:w-7 md:h-7 landscape:w-6 landscape:h-6 transition-all duration-500" />
            </div>
            <h3 className="text-lg md:text-xl landscape:text-xl font-bold tracking-tight group-hover:text-pink-100 transition-colors duration-500">I am the Camera</h3>
            <div className="absolute -bottom-6 -right-6 text-white/[0.02] group-hover:text-pink-500/[0.05] transition-colors duration-500 pointer-events-none">
              <Scan className="w-[120px] h-[120px] landscape:w-[140px] landscape:h-[140px] transition-all duration-700" />
            </div>
          </button>

          <button 
            onClick={() => setMode('receiver')}
            className={
              "home-tile w-full landscape:flex-1 flex flex-col landscape:flex-row items-center justify-center landscape:justify-start min-h-[140px] landscape:min-h-[200px] landscape:h-[200px] bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[24px] md:rounded-[32px] p-5 landscape:p-0 landscape:px-8 text-center landscape:text-left " +
              "transition-all duration-700 ease-in-out hover:border-purple-500/40 hover:bg-purple-500/[0.04] hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(168,85,247,0.25)] group relative overflow-hidden"
            }
          >
            <div className="icon-wrapper w-12 h-12 md:w-14 md:h-14 landscape:w-12 landscape:h-12 shrink-0 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center text-purple-400 mb-3 landscape:mb-0 landscape:mr-5 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all duration-500 border border-purple-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <Monitor className="w-6 h-6 md:w-7 md:h-7 landscape:w-6 landscape:h-6 transition-all duration-500" />
            </div>
            <h3 className="text-lg md:text-xl landscape:text-xl font-bold tracking-tight group-hover:text-purple-100 transition-colors duration-500">I am the PC Monitor</h3>
            <div className="absolute -bottom-6 -right-6 text-white/[0.02] group-hover:text-purple-500/[0.05] transition-colors duration-500 pointer-events-none">
              <CheckCircle className="w-[120px] h-[120px] landscape:w-[140px] landscape:h-[140px] transition-all duration-700" />
            </div>
          </button>
        </div>
      )}

      {/* --- CAMERA SCREEN --- */}
      {mode === 'camera' && (
        <div className="w-full z-10 relative flex-1 min-h-0 flex flex-col items-center justify-center">
          
          {/* NON-DESTRUCTIVE DOM PERSISTENCE WRAPPER */}
          <div className={`w-full z-10 relative flex flex-col items-center justify-center gap-4 md:gap-6 pb-24 landscape-disconnected-container md:flex-row ${isConnected ? 'hidden' : 'flex'}`}>
            <div className="hidden landscape:flex flex-col justify-center items-center text-center bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[24px] md:rounded-[32px] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative left-card-tile">
              {/* Top Inner Card */}
              <div className="flex flex-col items-center text-center gap-2 justify-center bg-black/40 border border-white/10 rounded-[24px] p-4 w-full max-w-[260px] shadow-[inset_0_4px_30px_rgba(0,0,0,0.4)]">
                <h3 className="text-xl font-bold tracking-tight drop-shadow-md">Scan Screen</h3>
                <p className="text-xs text-white/50 font-light max-w-[240px]">Align scanner to your PC monitor</p>
              </div>

              {/* Bottom Inner Card */}
              <div className="flex flex-col items-center justify-center gap-3 bg-black/60 border border-white/10 rounded-[24px] p-4 w-full max-w-[260px] shadow-[inset_0_4px_30px_rgba(0,0,0,0.6)]">
                  <div className="flex items-center justify-center gap-3 w-full opacity-50">
                    <div className="h-px bg-white/20 flex-1"></div>
                    <span className="text-[9px] text-white/50 uppercase tracking-widest font-bold">Manual Override</span>
                    <div className="h-px bg-white/20 flex-1"></div>
                  </div>
                  <div className="flex flex-col gap-3 w-full group justify-center">
                    <input 
                      type="text" placeholder="Target PIN" value={remoteId} onChange={(e) => setRemoteId(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white placeholder:text-white/30 text-center focus:outline-none focus:border-pink-500/50 shadow-inner font-mono tracking-widest"
                    />
                    <button 
                      onClick={executeManualConnect}
                      className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white font-bold text-xs px-6 py-3.5 rounded-xl hover:shadow-[0_0_25px_rgba(236,72,153,0.6)] active:scale-95 transition-all"
                    >
                      Link
                    </button>
                  </div>
              </div>
            </div>

            {/* Disconnected Camera (Scanner Box) - Right Tile */}
            <div className="flex flex-col items-center justify-center min-h-0 bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[24px] md:rounded-[32px] p-5 text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all w-full right-card-tile">
              <h3 className="shrink-0 text-xl font-bold mb-1 tracking-tight drop-shadow-md landscape:hidden">Scan Matrix</h3>
              <p className="shrink-0 text-[11px] text-white/50 mb-4 font-light landscape:hidden">Align PC matrix inside the frame</p>
              
              <div className="w-full max-w-[260px] aspect-square mx-auto bg-black/80 border border-white/10 rounded-[24px] mb-4 shadow-[inset_0_4px_30px_rgba(0,0,0,0.8)] relative overflow-hidden flex justify-center items-center landscape:w-full landscape:h-full landscape:max-w-none landscape:mb-0 landscape:rounded-[24px] landscape:p-0 landscape:border-none landscape:bg-transparent landscape:shadow-none landscape:aspect-auto">
                 <div id="reader" className="absolute inset-0 w-full h-full z-10 flex items-center justify-center"></div>
                 <span className="text-[10px] text-white/40 absolute z-0 font-medium tracking-widest uppercase text-center px-4 pointer-events-none">Activating Lens...</span>
              </div>
            </div>
          </div>

          {/* Active Live Stream Video Previews (Never Unmounted) */}
          <div className={`w-full h-full flex flex-col landscape:flex-row landscape:p-4 md:landscape:p-6 landscape:gap-4 md:landscape:gap-6 landscape:justify-center flex-1 min-h-0 pb-2 md:pb-6 justify-center items-center gap-3 md:gap-4 ${!isConnected ? 'hidden' : 'flex'}`}>
            <div className="portrait-status-pill shrink-0 w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-3 md:p-4 text-center shadow-[0_10px_30px_rgba(0,0,0,0.5)] order-first landscape:w-[25%] landscape:order-last landscape:h-full landscape:rounded-[32px] landscape:bg-[#05020a] landscape:p-4 landscape:flex landscape:flex-col landscape:overflow-hidden">
              <span className="text-xs md:text-sm font-semibold text-pink-400 flex items-center justify-center gap-2 tracking-wide drop-shadow-[0_0_8px_rgba(236,72,153,0.8)] shrink-0">
                <Radio size={16} className="animate-pulse shrink-0" /> <span className="truncate">{status}</span>
              </span>

              <div className="hidden landscape:flex flex-col gap-2 mt-4 flex-1 overflow-y-auto custom-scrollbar pr-1 pb-2">
                <div className="flex flex-col gap-2 px-3 py-3 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-2 text-xs font-medium text-white/80"><Video size={14} className="text-indigo-400" /> Resolution</div>
                  <select value={videoQuality} onChange={(e) => changeQuality(e.target.value)} className="bg-black/60 border border-white/10 rounded-lg text-[10px] text-white/80 font-bold px-2 py-1.5 outline-none focus:border-indigo-500/50 cursor-pointer">
                    <option value="720p">720p</option>
                    <option value="1080p">1080p (HD)</option>
                    <option value="1440p">1440p (2K)</option>
                    <option value="4K">4K (Ultra)</option>
                  </select>
                </div>

                <button onClick={toggleLens} className="flex items-center justify-between gap-3 px-3 py-3 bg-white/5 rounded-xl text-white/80 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-2"><Repeat size={14} className="text-blue-400" /> <span className="text-xs font-medium">Lens</span></div>
                  <span className="text-[9px] text-white/40 uppercase font-bold">{facingMode === 'environment' ? 'Back' : 'Front'}</span>
                </button>

                <button onClick={handleTorchToggle} className="flex items-center justify-between px-3 py-3 bg-white/5 rounded-xl text-white/80 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-2"><Zap size={14} className={displayTorch ? "text-yellow-400" : "text-white/40"} /> <span className="text-xs font-medium">Light</span></div>
                  <div className={`w-7 h-3.5 rounded-full border border-white/5 relative transition-colors ${displayTorch ? 'bg-pink-500' : 'bg-white/10'}`}>
                    <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[-1px] transition-all shadow-md ${displayTorch ? 'left-3.5' : 'left-0 bg-white/40'}`}></div>
                  </div>
                </button>

                <div className="flex flex-col gap-2 px-3 py-3 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-2 text-xs font-medium text-white/80"><Sun size={14} className={displayExposure > 50 ? "text-orange-400" : "text-white/40"} /> Exposure</div>
                  <input type="range" min="0" max="100" value={displayExposure} onChange={(e) => handleExposureChange(e.target.value)} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-400 touch-none custom-range-slider" />
                </div>

                <button onClick={toggleStayAwake} className="flex items-center justify-between px-3 py-3 bg-white/5 rounded-xl text-white/80 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-2"><Smartphone size={14} className={stayAwake ? "text-emerald-400" : "text-white/40"} /> <span className="text-xs font-medium">Awake</span></div>
                  <div className={`w-7 h-3.5 rounded-full border border-white/5 relative transition-colors ${stayAwake ? 'bg-emerald-500' : 'bg-white/10'}`}>
                    <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[-1px] transition-all shadow-md ${stayAwake ? 'left-3.5' : 'left-0 bg-white/40'}`}></div>
                  </div>
                </button>

                <button onClick={toggleBatterySaver} className="flex items-center justify-between px-3 py-3 bg-white/5 rounded-xl text-white/80 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-2"><Battery size={14} className="text-gray-400" /> <span className="text-xs font-medium">Battery</span></div>
                </button>

                {!isFullscreen && (
                  <button onClick={() => { setIsSettingsOpen(false); setIsFullscreen(true); }} className="flex items-center gap-2 px-3 py-3 bg-white/5 rounded-xl text-white/80 hover:bg-white/10 transition-colors mt-2">
                    <Maximize size={14} className="text-pink-400 shrink-0" /> <span className="text-xs font-medium truncate">Full Screen</span>
                  </button>
                )}
              </div>
              
              <div className="hidden landscape:flex shrink-0 pt-3 border-t border-white/10 mt-auto">
                <button onClick={executeExit} className="flex items-center justify-center gap-2 w-full px-3 py-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 font-bold text-xs transition-colors border border-red-500/20">
                  <LogOut size={14} /> Terminate
                </button>
              </div>
            </div>

            <div 
              className={
                isFullscreen 
                  ? "fixed inset-0 z-[100] bg-[#05020a] flex items-center justify-center cursor-default h-full w-full"
                  : "w-full flex-1 min-h-0 bg-black rounded-[24px] md:rounded-[32px] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.9)] border border-white/10 relative landscape:w-[70%] landscape:flex-none"
              }
              onMouseMove={handleFsInteraction}
              onClick={handleFsInteraction}
            >
              <video ref={myVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              
              {isFullscreen && (
                <div className={`absolute top-6 right-6 flex items-center gap-3 transition-opacity duration-500 ${fsControlsVisible || isSettingsOpen ? 'opacity-100' : 'opacity-0'}`}>
                  <div className="relative">
                    <button onClick={(e) => { e.stopPropagation(); setIsSettingsOpen(!isSettingsOpen); }} className="flex items-center justify-center w-10 h-10 text-white bg-black/60 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/10 transition-all shadow-lg active:scale-95">
                      <Settings size={18} className={isSettingsOpen ? "animate-spin-slow" : ""} />
                    </button>
                    {isSettingsOpen && renderSettingsDropdown()}
                  </div>
                </div>
              )}

              {!isFullscreen && (
                <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-xl border border-white/10 text-emerald-400 text-[10px] md:text-[11px] font-bold uppercase px-3 md:px-4 py-1.5 md:py-2 rounded-full flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] landscape:hidden">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></span>
                  Live
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- RECEIVER SCREEN --- */}
      {mode === 'receiver' && (
        <div className="w-full z-10 relative flex-1 min-h-0 flex flex-col items-center justify-center">
            
          {/* NON-DESTRUCTIVE DOM PERSISTENCE WRAPPER */}
          <div className={`w-full z-10 relative flex flex-col items-center justify-center gap-4 md:gap-6 pb-24 landscape-disconnected-container md:flex-row ${isConnected ? 'hidden' : 'flex'}`}>
            <div className="hidden landscape:flex flex-col justify-center items-center text-center bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[24px] md:rounded-[32px] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative left-card-tile">
              
              {/* Top Inner Card */}
              <div className="flex flex-col items-center text-center gap-2 justify-center bg-black/40 border border-white/10 rounded-[24px] p-6 w-full max-w-[260px] shadow-[inset_0_4px_30px_rgba(0,0,0,0.4)]">
                <h3 className="text-xl font-bold tracking-tight drop-shadow-md">Pair Device</h3>
                <p className="text-xs text-white/50 font-light max-w-[240px]">Point mobile lens at this matrix</p>
              </div>

              {/* Bottom Inner Card */}
              <div className="flex flex-col items-center justify-center gap-2 bg-black/60 border border-white/10 rounded-[24px] p-4 w-full max-w-[260px] shadow-[inset_0_4px_30px_rgba(0,0,0,0.6)]">
                <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-1">Secure PIN</span>
                <code className="text-2xl text-pink-400 break-all block font-mono font-bold tracking-[0.3em] drop-shadow-[0_0_5px_rgba(236,72,153,0.4)]">{peerId || '...'}</code>
              </div>
            </div>

            {/* Disconnected Receiver (QR Code Box) - Right Tile */}
            <div className="flex flex-col items-center justify-center min-h-0 bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[24px] md:rounded-[32px] p-5 text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all w-full right-card-tile">
              <div className="w-full max-w-[260px] aspect-square mx-auto bg-white p-4 rounded-[24px] shadow-[0_0_40px_rgba(255,255,255,0.15)] relative overflow-hidden group flex justify-center items-center landscape:w-full landscape:h-full landscape:max-w-none landscape:mb-0 landscape:rounded-[24px] landscape:p-6 landscape:aspect-auto">
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                {peerId ? (
                  <QRCodeSVG value={peerId} className="w-full h-full max-w-[240px] landscape:max-w-none aspect-square relative z-10 drop-shadow-sm" />
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-full max-w-[240px] aspect-square text-black/40 gap-2 relative z-10">
                    <RefreshCw className="animate-spin text-purple-600 w-6 h-6 landscape:w-10 landscape:h-10" />
                    <span className="text-[10px] landscape:text-xs font-bold uppercase tracking-wider text-center">Generating<br/>Key</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active Live Receiver Output Panel Container (Never Unmounted) */}
          <div className={`w-full h-full flex flex-col landscape:flex-row landscape:p-4 md:landscape:p-6 landscape:gap-4 md:landscape:gap-6 landscape:justify-center flex-1 min-h-0 pb-2 md:pb-6 justify-center items-center gap-3 md:gap-4 ${!isConnected ? 'hidden' : 'flex'}`}>
            <div className="portrait-status-pill shrink-0 w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-3 md:p-4 text-center shadow-[0_10px_30px_rgba(0,0,0,0.5)] order-first landscape:w-[25%] landscape:order-last landscape:h-full landscape:rounded-[32px] landscape:bg-[#05020a] landscape:p-4 landscape:flex landscape:flex-col landscape:overflow-hidden">
              <span className="text-xs md:text-sm font-semibold text-purple-400 flex items-center justify-center gap-2 tracking-wide drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] shrink-0">
                <Monitor size={16} className="animate-pulse shrink-0" /> <span className="truncate">Awaiting Stream Link</span>
              </span>
              
              <div className="hidden landscape:flex flex-col gap-2 mt-2 flex-1 overflow-y-auto custom-scrollbar pr-1 pb-2 text-left">
                <button onClick={() => setUiRotation((prev) => (prev + 90) % 360)} className="flex items-center justify-between px-3 py-3 bg-white/5 rounded-xl text-white/80 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-2"><Monitor size={14} className="text-emerald-400" /> <span className="text-xs font-medium">Rotate UI</span></div>
                  <span className="text-[10px] text-white/50">{uiRotation}°</span>
                </button>
                
                {(!isNativeApp) && (
                  <button onClick={togglePiP} className="flex items-center gap-2 px-3 py-3 bg-white/5 rounded-xl text-white/80 hover:bg-white/10 transition-colors">
                    <PictureInPicture size={14} className="text-blue-400 shrink-0" /> <span className="text-xs font-medium truncate">Pop-out Player</span>
                  </button>
                )}

                <button onClick={() => setIsFullscreen(true)} className="flex items-center gap-2 px-3 py-3 bg-white/5 rounded-xl text-white/80 hover:bg-white/10 transition-colors">
                  <Maximize size={14} className="text-pink-400 shrink-0" /> <span className="text-xs font-medium truncate">Full Screen</span>
                </button>

                <div className="flex flex-col gap-2 px-3 py-3 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-2 text-xs font-medium text-white/80"><Sun size={14} className={displayExposure > 50 ? "text-orange-400" : "text-white/40"} /> Remote Exp</div>
                  <input type="range" min="0" max="100" value={displayExposure} onChange={(e) => handleExposureChange(e.target.value)} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-400 touch-none custom-range-slider" />
                </div>
              </div>

              <div className="hidden landscape:flex shrink-0 pt-3 border-t border-white/10 mt-auto">
                <button onClick={executeExit} className="flex items-center justify-center gap-2 w-full px-3 py-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 font-bold text-xs transition-colors border border-red-500/20">
                  <LogOut size={14} /> Terminate
                </button>
              </div>
            </div>

            <div 
              className={
                isFullscreen 
                  ? "fixed inset-0 z-[100] bg-[#05020a] flex items-center justify-center cursor-default h-full w-full" 
                  : "w-full flex-1 min-h-0 bg-black rounded-[24px] md:rounded-[32px] border border-white/10 relative overflow-hidden flex items-center justify-center shadow-[0_0_60px_rgba(0,0,0,0.7)] landscape:w-[70%] landscape:flex-none"
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
                <div className={`absolute top-6 right-6 flex items-center gap-3 transition-opacity duration-500 ${fsControlsVisible || isSettingsOpen ? 'opacity-100' : 'opacity-0'}`}>
                  <div className="relative">
                    <button onClick={(e) => { e.stopPropagation(); setIsSettingsOpen(!isSettingsOpen); }} className="flex items-center justify-center w-10 h-10 text-white bg-black/60 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/10 transition-all shadow-lg active:scale-95">
                      <Settings size={18} className={isSettingsOpen ? "animate-spin-slow" : ""} />
                    </button>
                    {isSettingsOpen && renderSettingsDropdown()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RE-ANCHORED UNIVERSAL HOME SCREEN FOOTER */}
      {mode === 'home' && (
        <div className="absolute bottom-10 left-0 w-full flex justify-center pointer-events-none z-50">
          <div className="text-[9px] md:text-[10px] font-bold tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-white to-gray-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] opacity-60">
            V2.0 by ZetNet Architecture
          </div>
        </div>
      )}

    </div>
  );
}