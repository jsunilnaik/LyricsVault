import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSongs } from '../store/songSlice';
import { songsAPI } from '../services/api';
import { Music, Heart, Clock, LayoutGrid, List, TrendingUp, Star, FolderOpen } from 'lucide-react';

const Home = () => {
  const dispatch = useDispatch();
  const { items: songs, loading } = useSelector((state) => state.songs);
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    dispatch(fetchSongs());
  }, [dispatch]);

  const recentSongs = [...songs].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 4);
  const favoriteSongs = songs.filter(s => s.is_favorite);

  const handleToggleFavorite = async (e, songId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await songsAPI.toggleFavorite(songId);
      dispatch(fetchSongs());
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const SongCard = ({ song }) => (
    <Link to={`/song/${song._id}`} className="group bg-white dark:bg-dark-900 rounded-2xl border border-dark-100 dark:border-dark-800 p-4 hover:shadow-soft-lg transition-all">
      <div className="aspect-square gradient-bg rounded-xl mb-4 flex items-center justify-center text-white/20 group-hover:text-white/40 transition-colors overflow-hidden">
        {song.artwork_url ? (
          <img src={song.artwork_url} alt={song.title} className="w-full h-full object-cover" />
        ) : (
          <Music size={64} />
        )}
      </div>
      <h3 className="font-semibold text-lg truncate">{song.title}</h3>
      <p className="text-dark-500 text-sm truncate">{song.artist || 'Unknown Artist'}</p>

      <div className="mt-4 flex items-center justify-between">
        <span className="flex items-center gap-1 text-xs text-dark-400">
          <Clock size={14} />
          {new Date(song.updatedAt).toLocaleDateString()}
        </span>
        <button
          onClick={(e) => handleToggleFavorite(e, song._id)}
          className={`p-2 rounded-full transition-colors ${
            song.is_favorite
              ? 'text-secondary-500 bg-secondary-50 dark:bg-secondary-900/20'
              : 'text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-800'
          }`}
        >
          <Heart size={18} fill={song.is_favorite ? 'currentColor' : 'none'} />
        </button>
      </div>
    </Link>
  );

  const SongListItem = ({ song }) => (
    <Link to={`/song/${song._id}`} className="group flex items-center gap-4 p-4 bg-white dark:bg-dark-900 border border-dark-100 dark:border-dark-800 rounded-xl hover:shadow-soft transition-all">
      <div className="w-12 h-12 gradient-bg rounded-lg flex items-center justify-center text-white/30 shrink-0 overflow-hidden">
        {song.artwork_url ? (
          <img src={song.artwork_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <Music size={20} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold truncate group-hover:text-primary-600 transition-colors">{song.title}</h3>
        <p className="text-sm text-dark-500 truncate">{song.artist || 'Unknown Artist'}</p>
      </div>
      <span className="text-xs text-dark-400 hidden sm:block">{song.album || ''}</span>
      <span className="text-xs text-dark-400 hidden md:block">{new Date(song.updatedAt).toLocaleDateString()}</span>
      <button
        onClick={(e) => handleToggleFavorite(e, song._id)}
        className={`p-2 rounded-full transition-colors shrink-0 ${
          song.is_favorite ? 'text-secondary-500' : 'text-dark-300 hover:text-dark-500'
        }`}
      >
        <Heart size={16} fill={song.is_favorite ? 'currentColor' : 'none'} />
      </button>
    </Link>
  );

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-primary-500 to-primary-700 text-white p-5 rounded-2xl shadow-glow">
          <Music size={24} className="mb-2 opacity-70" />
          <p className="text-3xl font-bold">{songs.length}</p>
          <p className="text-sm opacity-70">Total Songs</p>
        </div>
        <Link to="/favorites" className="bg-gradient-to-br from-secondary-500 to-secondary-700 text-white p-5 rounded-2xl hover:shadow-glow-lg transition-all">
          <Heart size={24} className="mb-2 opacity-70" />
          <p className="text-3xl font-bold">{favoriteSongs.length}</p>
          <p className="text-sm opacity-70">Favorites</p>
        </Link>
        <div className="bg-gradient-to-br from-accent-500 to-accent-700 text-white p-5 rounded-2xl">
          <TrendingUp size={24} className="mb-2 opacity-70" />
          <p className="text-3xl font-bold">{new Set(songs.map(s => s.artist).filter(Boolean)).size}</p>
          <p className="text-sm opacity-70">Artists</p>
        </div>
        <div className="bg-gradient-to-br from-dark-600 to-dark-800 text-white p-5 rounded-2xl">
          <FolderOpen size={24} className="mb-2 opacity-70" />
          <p className="text-3xl font-bold">{new Set(songs.map(s => s.album).filter(Boolean)).size}</p>
          <p className="text-sm opacity-70">Albums</p>
        </div>
      </div>

      {/* Recently Updated */}
      {recentSongs.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Star className="text-yellow-500" size={22} />
              Recently Updated
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentSongs.map(song => <SongCard key={song._id} song={song} />)}
          </div>
        </section>
      )}

      {/* Full Library */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Your Library</h2>
            <p className="text-dark-500 text-sm mt-1">{songs.length} song{songs.length !== 1 ? 's' : ''}</p>
          </div>

          <div className="flex items-center gap-2 bg-dark-50 dark:bg-dark-900 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-dark-800 shadow-sm text-primary-600' : 'text-dark-400 hover:text-dark-600'}`}
            >
              <LayoutGrid size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-dark-800 shadow-sm text-primary-600' : 'text-dark-400 hover:text-dark-600'}`}
            >
              <List size={20} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-64 bg-dark-100 dark:bg-dark-900 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : songs.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {songs.map((song) => <SongCard key={song._id} song={song} />)}
            </div>
          ) : (
            <div className="space-y-2">
              {songs.map((song) => <SongListItem key={song._id} song={song} />)}
            </div>
          )
        ) : (
          <div className="text-center py-20 bg-dark-50 dark:bg-dark-900/50 rounded-3xl border-2 border-dashed border-dark-100 dark:border-dark-800">
            <div className="w-16 h-16 bg-dark-100 dark:bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4 text-dark-400">
              <Music size={32} />
            </div>
            <h2 className="text-xl font-semibold">No songs yet</h2>
            <p className="text-dark-500 mt-2">Start by adding your first song lyrics.</p>
            <Link to="/new-song" className="mt-6 inline-block bg-primary-600 text-white px-6 py-2 rounded-full font-medium hover:bg-primary-700 transition-all shadow-glow">
              Add New Song
            </Link>
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
