import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSongs } from '../store/songSlice';
import { Music, Heart, Clock, LayoutGrid, List } from 'lucide-react';

const Home = () => {
  const dispatch = useDispatch();
  const { items: songs, loading } = useSelector((state) => state.songs);

  useEffect(() => {
    dispatch(fetchSongs());
  }, [dispatch]);

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Library</h1>
          <p className="text-dark-500 mt-1">Manage and access all your lyrics in one place.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-dark-50 dark:bg-dark-900 p-1 rounded-lg">
          <button className="p-2 bg-white dark:bg-dark-800 rounded-md shadow-sm text-primary-600">
            <LayoutGrid size={20} />
          </button>
          <button className="p-2 text-dark-400 hover:text-dark-600 transition-colors">
            <List size={20} />
          </button>
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-64 bg-dark-100 dark:bg-dark-900 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : songs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {songs.map((song) => (
            <div key={song._id} className="group bg-white dark:bg-dark-900 rounded-2xl border border-dark-100 dark:border-dark-800 p-4 hover:shadow-soft-lg transition-all cursor-pointer">
              <div className="aspect-square gradient-bg rounded-xl mb-4 flex items-center justify-center text-white/20 group-hover:text-white/40 transition-colors">
                <Music size={64} />
              </div>
              <h3 className="font-semibold text-lg truncate">{song.title}</h3>
              <p className="text-dark-500 text-sm truncate">{song.artist}</p>
              
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-3 text-dark-400">
                  <span className="flex items-center gap-1 text-xs">
                    <Clock size={14} />
                    {new Date(song.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <button className={`p-2 rounded-full transition-colors ${song.is_favorite ? 'text-secondary-500 bg-secondary-50 dark:bg-secondary-900/20' : 'text-dark-300 hover:bg-dark-50'}`}>
                  <Heart size={18} fill={song.is_favorite ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-dark-50 dark:bg-dark-900/50 rounded-3xl border-2 border-dashed border-dark-100 dark:border-dark-800">
          <div className="w-16 h-16 bg-dark-100 dark:bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4 text-dark-400">
            <Music size={32} />
          </div>
          <h2 className="text-xl font-semibold">No songs found</h2>
          <p className="text-dark-500 mt-2">Start by creating your first song lyrics.</p>
          <button className="mt-6 bg-primary-600 text-white px-6 py-2 rounded-full font-medium hover:bg-primary-700 transition-all">
            Add New Song
          </button>
        </div>
      )}
    </div>
  );
};

export default Home;
