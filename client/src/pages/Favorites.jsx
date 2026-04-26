import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchSongs } from '../store/songSlice';
import { songsAPI } from '../services/api';
import { Heart, Music, Clock, ArrowLeft } from 'lucide-react';

const Favorites = () => {
  const dispatch = useDispatch();
  const { items: songs, loading } = useSelector((state) => state.songs);
  const favorites = songs.filter(s => s.is_favorite);

  useEffect(() => {
    if (songs.length === 0) dispatch(fetchSongs());
  }, [dispatch, songs.length]);

  const handleToggleFavorite = async (songId) => {
    try {
      await songsAPI.toggleFavorite(songId);
      dispatch(fetchSongs());
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex items-center gap-4">
        <Link to="/" className="p-2 hover:bg-dark-100 dark:hover:bg-dark-800 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Heart className="text-secondary-500" size={28} fill="currentColor" />
            Favorites
          </h1>
          <p className="text-dark-500 mt-1">{favorites.length} song{favorites.length !== 1 ? 's' : ''} in your favorites</p>
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 bg-dark-100 dark:bg-dark-900 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : favorites.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {favorites.map((song) => (
            <Link to={`/song/${song._id}`} key={song._id} className="group bg-white dark:bg-dark-900 rounded-2xl border border-dark-100 dark:border-dark-800 p-4 hover:shadow-soft-lg transition-all">
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
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleToggleFavorite(song._id);
                  }}
                  className="p-2 rounded-full text-secondary-500 bg-secondary-50 dark:bg-secondary-900/20 transition-colors"
                >
                  <Heart size={18} fill="currentColor" />
                </button>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-dark-50 dark:bg-dark-900/50 rounded-3xl border-2 border-dashed border-dark-100 dark:border-dark-800">
          <div className="w-16 h-16 bg-dark-100 dark:bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4 text-dark-400">
            <Heart size={32} />
          </div>
          <h2 className="text-xl font-semibold">No favorites yet</h2>
          <p className="text-dark-500 mt-2">Songs you favorite will appear here.</p>
          <Link to="/" className="mt-6 inline-block bg-primary-600 text-white px-6 py-2 rounded-full font-medium hover:bg-primary-700 transition-all">
            Browse Library
          </Link>
        </div>
      )}
    </div>
  );
};

export default Favorites;
