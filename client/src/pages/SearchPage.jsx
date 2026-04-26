import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchSongs } from '../store/songSlice';
import { Search as SearchIcon, Music, Heart, Clock, Filter, X } from 'lucide-react';
import { songsAPI } from '../services/api';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'title', label: 'Title' },
  { key: 'artist', label: 'Artist' },
  { key: 'album', label: 'Album' },
  { key: 'lyrics', label: 'Lyrics' },
];

const SearchPage = () => {
  const dispatch = useDispatch();
  const { items: songs, loading } = useSelector((state) => state.songs);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    if (songs.length === 0) dispatch(fetchSongs());
  }, [dispatch, songs.length]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const term = query.toLowerCase();
    return songs.filter((song) => {
      switch (activeFilter) {
        case 'title':
          return song.title?.toLowerCase().includes(term);
        case 'artist':
          return song.artist?.toLowerCase().includes(term);
        case 'album':
          return song.album?.toLowerCase().includes(term);
        case 'lyrics':
          return song.lyrics?.toLowerCase().includes(term);
        default:
          return (
            song.title?.toLowerCase().includes(term) ||
            song.artist?.toLowerCase().includes(term) ||
            song.album?.toLowerCase().includes(term) ||
            song.lyrics?.toLowerCase().includes(term) ||
            (song.genre || []).some(g => g.toLowerCase().includes(term))
          );
      }
    });
  }, [query, activeFilter, songs]);

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

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Search Bar */}
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="relative">
          <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-dark-400" size={22} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search songs, artists, lyrics..."
            autoFocus
            className="w-full bg-dark-50 dark:bg-dark-900 border border-dark-100 dark:border-dark-800 rounded-2xl py-4 pl-14 pr-12 text-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-soft"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-dark-400 hover:text-dark-600 transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 justify-center">
          <Filter size={16} className="text-dark-400" />
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeFilter === f.key
                  ? 'bg-primary-600 text-white shadow-glow'
                  : 'bg-dark-100 dark:bg-dark-800 text-dark-500 hover:bg-dark-200 dark:hover:bg-dark-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {query.trim() ? (
        results.length > 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-dark-500 font-medium">
              {results.length} result{results.length !== 1 ? 's' : ''} found
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((song) => (
                <Link
                  to={`/song/${song._id}`}
                  key={song._id}
                  className="group flex gap-4 p-4 bg-white dark:bg-dark-900 border border-dark-100 dark:border-dark-800 rounded-2xl hover:shadow-soft-lg transition-all"
                >
                  <div className="w-16 h-16 gradient-bg rounded-xl flex items-center justify-center text-white/30 shrink-0 overflow-hidden">
                    {song.artwork_url ? (
                      <img src={song.artwork_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Music size={28} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate group-hover:text-primary-600 transition-colors">{song.title}</h3>
                    <p className="text-sm text-dark-500 truncate">{song.artist || 'Unknown Artist'}</p>
                    {song.album && (
                      <p className="text-xs text-dark-400 truncate mt-1">{song.album}</p>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleToggleFavorite(e, song._id)}
                    className={`p-2 rounded-full self-center transition-colors shrink-0 ${
                      song.is_favorite
                        ? 'text-secondary-500 bg-secondary-50 dark:bg-secondary-900/20'
                        : 'text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-800'
                    }`}
                  >
                    <Heart size={16} fill={song.is_favorite ? 'currentColor' : 'none'} />
                  </button>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-dark-100 dark:bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4 text-dark-400">
              <SearchIcon size={32} />
            </div>
            <h2 className="text-xl font-semibold">No results found</h2>
            <p className="text-dark-500 mt-2">Try a different search term or filter.</p>
          </div>
        )
      ) : (
        <div className="text-center py-16 text-dark-400">
          <SearchIcon size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Start typing to search your library</p>
          <p className="text-sm mt-1">Search by title, artist, album, or lyrics content</p>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
