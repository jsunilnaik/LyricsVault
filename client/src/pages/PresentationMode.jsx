import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { songsAPI } from '../services/api';
import { 
  X, ChevronLeft, ChevronRight, Play, Pause, 
  Settings, Maximize2, Minimize2, Sliders 
} from 'lucide-react';

const PresentationMode = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [song, setSong] = useState(null);
  const [lines, setLines] = useState([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(5);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    const getSong = async () => {
      try {
        const response = await songsAPI.getById(id);
        setSong(response.data);
        const parsedLines = response.data.lyrics.split('\n').filter(line => line.trim());
        setLines(parsedLines);
      } catch (error) {
        console.error('Failed to fetch song:', error);
        navigate(`/song/${id}`);
      }
    };
    getSong();
  }, [id, navigate]);

  const nextLine = useCallback(() => {
    setCurrentLine(prev => {
      if (prev < lines.length - 1) return prev + 1;
      setIsPlaying(false);
      return prev;
    });
  }, [lines.length]);

  const prevLine = useCallback(() => {
    setCurrentLine(prev => Math.max(0, prev - 1));
  }, []);

  const togglePlay = () => setIsPlaying(!isPlaying);

  useEffect(() => {
    let interval;
    if (isPlaying) {
      const duration = Math.max(500, 3000 - (speed * 250));
      interval = setInterval(nextLine, duration);
    }
    return () => clearInterval(interval);
  }, [isPlaying, speed, nextLine]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          document.exitFullscreen();
        } else {
          navigate(`/song/${id}`);
        }
      } else if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextLine();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevLine();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [id, navigate, nextLine, prevLine, isFullscreen]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  if (!song) return null;

  return (
    <div className="fixed inset-0 bg-dark-950 text-white z-[100] flex flex-col items-center justify-center overflow-hidden">
      {/* Top Header */}
      <div className={`absolute top-0 inset-x-0 p-6 flex items-center justify-between transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/song/${id}`)}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold">{song.title}</h1>
            <p className="text-sm text-white/50">{song.artist}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={toggleFullscreen}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        </div>
      </div>

      {/* Lyrics Display */}
      <div className="w-full max-w-6xl px-8 text-center space-y-12">
        <div className="space-y-4 opacity-30 blur-[2px] transition-all">
          <p className="text-2xl md:text-3xl font-lyrics italic truncate">
            {currentLine > 0 ? lines[currentLine - 1] : ''}
          </p>
        </div>

        <div className="py-12 relative">
          <div className="absolute inset-0 bg-primary-500/10 blur-3xl rounded-full" />
          <p className="text-4xl md:text-6xl lg:text-7xl font-bold font-lyrics relative z-10 animate-slide-up">
            {lines[currentLine]}
          </p>
        </div>

        <div className="space-y-4 opacity-30 blur-[2px] transition-all">
          <p className="text-2xl md:text-3xl font-lyrics italic truncate">
            {currentLine < lines.length - 1 ? lines[currentLine + 1] : ''}
          </p>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className={`absolute bottom-0 inset-x-0 p-8 flex flex-col items-center gap-6 transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center gap-8">
          <button onClick={prevLine} className="p-3 hover:bg-white/10 rounded-full transition-colors">
            <ChevronLeft size={32} />
          </button>
          
          <button 
            onClick={togglePlay}
            className="w-20 h-20 rounded-full gradient-bg flex items-center justify-center shadow-glow-lg hover:scale-105 active:scale-95 transition-all"
          >
            {isPlaying ? <Pause size={40} fill="white" /> : <Play size={40} fill="white" className="ml-2" />}
          </button>

          <button onClick={nextLine} className="p-3 hover:bg-white/10 rounded-full transition-colors">
            <ChevronRight size={32} />
          </button>
        </div>

        <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center gap-6">
          <div className="flex items-center gap-3 shrink-0">
            <Sliders size={18} className="text-white/50" />
            <span className="text-xs font-bold uppercase tracking-widest text-white/50">Speed</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="10" 
            value={speed}
            onChange={(e) => setSpeed(parseInt(e.target.value))}
            className="flex-1 accent-primary-500 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-sm font-mono w-4 text-center">{speed}</span>
        </div>

        <div className="text-white/30 text-sm font-medium">
          Line {currentLine + 1} of {lines.length}
        </div>
      </div>

      {/* Mouse movement listener to show/hide controls */}
      <div 
        className="absolute inset-0 z-0" 
        onMouseMove={() => {
          setShowControls(true);
          clearTimeout(window.controlsTimeout);
          window.controlsTimeout = setTimeout(() => setShowControls(false), 3000);
        }}
      />
    </div>
  );
};

export default PresentationMode;
