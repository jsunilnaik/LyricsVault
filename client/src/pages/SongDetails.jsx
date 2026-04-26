import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { songsAPI } from '../services/api';
import { setCurrentSong, fetchSongs } from '../store/songSlice';
import { 
  Music, Heart, Edit, Trash2, ChevronLeft, MoreVertical, 
  Copy, Printer, Maximize2, Monitor, Minus, Plus, 
  Calendar, Clock, Globe, Zap, Hash
} from 'lucide-react';
import { clsx } from 'clsx';

const SongDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentSong: song, loading } = useSelector((state) => state.songs);
  const [showMenu, setShowMenu] = useState(false);
  const [fontSize, setFontSize] = useState(18);

  useEffect(() => {
    const getSong = async () => {
      try {
        const response = await songsAPI.getById(id);
        dispatch(setCurrentSong(response.data));
      } catch (error) {
        console.error('Failed to fetch song:', error);
        navigate('/');
      }
    };
    getSong();
  }, [id, dispatch, navigate]);

  if (loading || !song) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const handleFavorite = async () => {
    try {
      const response = await songsAPI.toggleFavorite(song._id);
      dispatch(setCurrentSong(response.data));
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${song.title}"?`)) {
      try {
        await songsAPI.delete(song._id);
        dispatch(fetchSongs());
        navigate('/');
      } catch (error) {
        console.error('Failed to delete song:', error);
      }
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(song.lyrics);
    alert('Lyrics copied to clipboard!');
    setShowMenu(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-dark-500 hover:text-dark-900 dark:hover:text-dark-100 transition-colors"
        >
          <ChevronLeft size={20} />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleFavorite}
            className={clsx(
              "p-2 rounded-full transition-all",
              song.is_favorite ? "bg-secondary-50 dark:bg-secondary-900/20 text-secondary-500" : "bg-dark-50 dark:bg-dark-900 text-dark-400 hover:text-dark-600"
            )}
          >
            <Heart size={20} fill={song.is_favorite ? "currentColor" : "none"} />
          </button>
          
          <Link 
            to={`/song/${song._id}/edit`}
            className="p-2 bg-dark-50 dark:bg-dark-900 text-dark-400 hover:text-primary-600 rounded-full transition-all"
          >
            <Edit size={20} />
          </Link>

          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 bg-dark-50 dark:bg-dark-900 text-dark-400 hover:text-dark-600 rounded-full transition-all"
            >
              <MoreVertical size={20} />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 glass border border-dark-100 dark:border-dark-800 rounded-xl shadow-soft-lg overflow-hidden z-10">
                <button onClick={handleCopy} className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-dark-50 dark:hover:bg-dark-800 transition-colors">
                  <Copy size={16} /> Copy Lyrics
                </button>
                <button onClick={() => window.print()} className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-dark-50 dark:hover:bg-dark-800 transition-colors">
                  <Printer size={16} /> Print
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-dark-50 dark:hover:bg-dark-800 transition-colors text-secondary-600" onClick={handleDelete}>
                  <Trash2 size={16} /> Delete Song
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Info */}
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="w-full md:w-64 aspect-square gradient-bg rounded-3xl flex items-center justify-center text-white/20 shadow-glow-lg overflow-hidden shrink-0">
          {song.artwork_url ? (
            <img src={song.artwork_url} alt={song.title} className="w-full h-full object-cover" />
          ) : (
            <Music size={120} />
          )}
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">{song.title}</h1>
            <p className="text-xl text-dark-500 mt-1">{song.artist}</p>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-dark-400">
            {song.album && (
              <span className="flex items-center gap-1.5 bg-dark-50 dark:bg-dark-900 px-3 py-1.5 rounded-full">
                <Music size={14} /> {song.album}
              </span>
            )}
            {song.year && (
              <span className="flex items-center gap-1.5 bg-dark-50 dark:bg-dark-900 px-3 py-1.5 rounded-full">
                <Calendar size={14} /> {song.year}
              </span>
            )}
            {song.duration && (
              <span className="flex items-center gap-1.5 bg-dark-50 dark:bg-dark-900 px-3 py-1.5 rounded-full">
                <Clock size={14} /> {song.duration}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {[...(song.genre || []), ...(song.mood || [])].map((tag, i) => (
              <span key={i} className="px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-full text-xs font-medium uppercase tracking-wider">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Lyrics Section */}
      <div className="bg-white dark:bg-dark-900 rounded-3xl border border-dark-100 dark:border-dark-800 overflow-hidden shadow-soft">
        <div className="border-b border-dark-100 dark:border-dark-800 p-4 flex items-center justify-between bg-dark-50/50 dark:bg-dark-800/50">
          <div className="flex items-center gap-4">
            <h2 className="font-semibold">Lyrics</h2>
            <div className="flex items-center gap-2 text-dark-400">
              <button onClick={() => setFontSize(Math.max(12, fontSize - 2))} className="p-1 hover:text-dark-900 dark:hover:text-dark-100 transition-colors">
                <Minus size={16} />
              </button>
              <span className="text-xs font-mono w-8 text-center">{fontSize}px</span>
              <button onClick={() => setFontSize(Math.min(32, fontSize + 2))} className="p-1 hover:text-dark-900 dark:hover:text-dark-100 transition-colors">
                <Plus size={16} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to={`/present/${song._id}`} className="p-2 hover:bg-dark-100 dark:hover:bg-dark-750 rounded-lg transition-colors text-dark-500" title="Presentation Mode">
              <Monitor size={20} />
            </Link>
            <button className="p-2 hover:bg-dark-100 dark:hover:bg-dark-750 rounded-lg transition-colors text-dark-500" title="Fullscreen">
              <Maximize2 size={20} />
            </button>
          </div>
        </div>
        
        <div 
          className="p-8 md:p-12 font-lyrics whitespace-pre-wrap leading-relaxed transition-all"
          style={{ fontSize: `${fontSize}px` }}
        >
          {song.lyrics}
        </div>
      </div>

      {/* Footer Meta */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-dark-100 dark:border-dark-800">
        <div className="space-y-1">
          <p className="text-xs text-dark-400 uppercase tracking-widest font-semibold">Language</p>
          <p className="flex items-center gap-2 font-medium"><Globe size={16} className="text-dark-400" /> {song.language || 'English'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-dark-400 uppercase tracking-widest font-semibold">BPM / Key</p>
          <p className="flex items-center gap-2 font-medium"><Zap size={16} className="text-dark-400" /> {song.bpm || '-'} / {song.key || '-'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-dark-400 uppercase tracking-widest font-semibold">Word Count</p>
          <p className="flex items-center gap-2 font-medium"><Hash size={16} className="text-dark-400" /> {song.lyrics.split(/\s+/).length} words</p>
        </div>
        <div className="space-y-1 text-right md:text-left">
          <p className="text-xs text-dark-400 uppercase tracking-widest font-semibold">Last Updated</p>
          <p className="font-medium">{new Date(song.updatedAt).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
};

export default SongDetails;
