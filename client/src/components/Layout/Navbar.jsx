import React from 'react';
import { Link } from 'react-router-dom';
import { Music, LogOut, User, Search, Plus } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/authSlice';

const Navbar = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  return (
    <nav className="glass sticky top-0 z-50 border-b border-dark-100 dark:border-dark-800 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center text-white shadow-glow">
            <Music size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight gradient-text">LyricVault</span>
        </Link>

        <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={18} />
            <input
              type="text"
              placeholder="Search songs, artists, lyrics..."
              className="w-full bg-dark-50 dark:bg-dark-800 border-none rounded-full py-2 pl-10 pr-4 focus:ring-2 focus:ring-primary-500 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link 
            to="/new-song" 
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-full transition-all shadow-soft"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">New Song</span>
          </Link>
          
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-dark-50 dark:bg-dark-800 pl-1 pr-3 py-1 rounded-full border border-dark-100 dark:border-dark-700">
                <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white text-xs font-bold">
                  {user.username?.[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium hidden lg:inline">{user.username}</span>
              </div>
              <button 
                onClick={() => dispatch(logout())}
                className="text-dark-500 hover:text-secondary-600 transition-colors"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="text-primary-600 font-medium hover:underline">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
