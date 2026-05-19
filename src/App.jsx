import React, { useState, useEffect } from 'react';
import { Camera, Monitor, ArrowLeft, Radio, CheckCircle, RefreshCw, Settings, Zap, Repeat, Sun, LogOut, Maximize, Minimize, PictureInPicture, Video, Smartphone, Battery, EyeOff, Lock } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react'; 
import { useZetcam } from './useZetcam';

export default function App() {
  const {
    mode, setMode, peerId, status, isConnected, remoteId, setRemoteId,
    myVideoRef, remoteVideoRef, handleGoHome, executeManualConnect,
    isTorchOn, toggleTorch, facingMode, toggleLens, exposureLevel,
    adjustExposure, remoteTorch, remoteExposure, sendRemoteCommand,
    togglePiP, videoQuality, changeQuality, stayAwake,
    toggleStayAwake, batterySaver, toggleBatterySaver,
    isNativeApp, runInBackground, toggleBackgroundMode 
  } = useZetcam();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const isStreamActive = isConnected;

  return (
    <div className="min-h-screen w-full bg-[#0a0510] text-white font-sans p-3 md:p-6 flex flex-col items-center justify-start overflow-hidden">
      {/* Basic Layout - Stable Baseline */}
      <header className="shrink-0 w-full max-w-5xl flex justify-between items-center mb-6 border-b border-white/10 pb-3">
        <h1 className="text-xl font-black tracking-wider text-pink-500">ZETCAM PRO</h1>
        {mode !== 'home' && (
          <button onClick={handleGoHome} className="bg-white/5 px-4 py-2 rounded-full text-xs font-medium">Exit</button>
        )}
      </header>
      
      {mode === 'home' && (
        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl justify-center">
            <button onClick={() => setMode('camera')} className="bg-white/5 p-8 rounded-3xl border border-white/10">I am the Camera</button>
            <button onClick={() => setMode('receiver')} className="bg-white/5 p-8 rounded-3xl border border-white/10">I am the PC Monitor</button>
        </div>
      )}

      {mode === 'camera' && (
        <div className="w-full max-w-md">
           {!isConnected && <div id="reader" className="w-full h-[300px] bg-black rounded-xl"></div>}
           {isConnected && <video ref={myVideoRef} autoPlay playsInline muted className="w-full rounded-xl" />}
        </div>
      )}
    </div>
  );
}