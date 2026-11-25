import React, { useRef, useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw, Download, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { triggerHaptic } from '../utils/device';

interface LogoRevealModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogoRevealModal: React.FC<LogoRevealModalProps> = ({ isOpen, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [useFallback, setUseFallback] = useState<boolean>(false);
  const [animKey, setAnimKey] = useState<number>(Date.now());

  useEffect(() => {
    if (isOpen) {
      setAnimKey(Date.now());
      if (videoRef.current && !useFallback) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {
          // If video playback fails (e.g. browser codec restriction), instantly switch to high-res animated WebP
          setUseFallback(true);
        });
      }
    }
  }, [isOpen, useFallback]);

  if (!isOpen) return null;

  const togglePlay = () => {
    triggerHaptic();
    if (!useFallback && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleReplay = () => {
    triggerHaptic();
    setAnimKey(Date.now());
    if (!useFallback && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => setUseFallback(true));
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    triggerHaptic();
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-2xl animate-fade-in">
      {/* Stadium ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-sport-500/15 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative w-full max-w-4xl bg-[#0c1410] border border-sport-500/40 rounded-2xl sm:rounded-3xl shadow-[0_0_50px_rgba(34,197,94,0.25)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-[#1b2b21] bg-[#080d0a]/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-sport-400 animate-ping"></div>
            <span className="text-xs sm:text-sm font-black tracking-wider uppercase text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-sport-400" />
              Book My Game • Broadcast Logo Reveal
            </span>
          </div>
          <button
            onClick={() => {
              triggerHaptic();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video / Animated Player Container (Cinematic 16:9 Letterboxed) */}
        <div className="relative bg-black aspect-video flex items-center justify-center overflow-hidden group select-none">
          {!useFallback ? (
            <video
              ref={videoRef}
              src="/book-my-game-reveal.mp4"
              className="w-full h-full object-contain"
              playsInline
              autoPlay
              loop
              onError={() => {
                console.warn('Video tag codec error, switching to Animated WebP fallback.');
                setUseFallback(true);
              }}
              onTimeUpdate={handleTimeUpdate}
              onClick={togglePlay}
            />
          ) : (
            <img
              key={animKey}
              src={`/book-my-game-reveal.webp?t=${animKey}`}
              alt="Book My Game Broadcast Logo Reveal"
              className="w-full h-full object-contain cursor-pointer"
              onClick={handleReplay}
              title="Click to replay animation"
            />
          )}

          {/* Video scrub line */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-sport-500 to-emerald-300 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Controls Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 bg-[#080d0a] border-t border-[#1b2b21]">
          {/* Playback Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleReplay}
              className="p-2 px-3 rounded-xl bg-sport-500/15 hover:bg-sport-500/25 text-sport-400 border border-sport-500/30 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="Replay animation from start"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Replay Intro</span>
            </button>

            {!useFallback && (
              <button
                onClick={toggleMute}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            )}
          </div>

          {/* Info & Download Action */}
          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-slate-400 hidden md:inline">
              Zero Watermarks • 25 FPS Broadcast Motion
            </span>
            <a
              href="/book-my-game-reveal.mp4"
              download="book-my-game-logo-reveal.mp4"
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-sport-500 to-emerald-600 text-black font-black text-xs flex items-center gap-1.5 shadow-lg shadow-sport-500/20 hover:scale-105 transition"
            >
              <Download className="w-4 h-4" />
              <span>Download MP4</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
