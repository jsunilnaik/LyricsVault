import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register, clearError } from '../store/authSlice';
import { Music, Mail, Lock, User, ArrowRight, CheckCircle2 } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, token } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token) {
      navigate('/');
    }
    return () => dispatch(clearError());
  }, [token, navigate, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords don't match");
      return;
    }
    dispatch(register({
      username: formData.username,
      email: formData.email,
      password: formData.password
    }));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center animate-fade-in">
      <div className="w-full max-w-lg grid grid-cols-1 md:grid-cols-2 bg-white dark:bg-dark-900 rounded-3xl border border-dark-100 dark:border-dark-800 shadow-soft-xl overflow-hidden">
        {/* Left Side - Info */}
        <div className="hidden md:flex flex-col justify-between p-8 gradient-bg text-white">
          <div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6">
              <Music size={24} />
            </div>
            <h2 className="text-2xl font-bold leading-tight">Join the vault of creators</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={18} className="mt-1 shrink-0" />
              <p className="text-sm text-white/80">Cloud sync across all your devices</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 size={18} className="mt-1 shrink-0" />
              <p className="text-sm text-white/80">Advanced presentation mode</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 size={18} className="mt-1 shrink-0" />
              <p className="text-sm text-white/80">Infinite songs and playlists</p>
            </div>
          </div>

          <p className="text-xs text-white/50">© 2026 LyricVault Pro</p>
        </div>

        {/* Right Side - Form */}
        <div className="p-8 space-y-6">
          <div className="md:hidden text-center mb-6">
            <div className="w-12 h-12 gradient-bg rounded-xl flex items-center justify-center text-white mx-auto mb-4">
              <Music size={24} />
            </div>
            <h1 className="text-2xl font-bold">Create Account</h1>
          </div>

          <h1 className="hidden md:block text-2xl font-bold tracking-tight">Create Account</h1>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-xs font-medium border border-red-100 dark:border-red-900/30">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-dark-400 uppercase tracking-widest ml-1">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={16} />
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full bg-dark-50 dark:bg-dark-800 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary-500 transition-all"
                  placeholder="johndoe"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-dark-400 uppercase tracking-widest ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={16} />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-dark-50 dark:bg-dark-800 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary-500 transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-dark-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={16} />
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-dark-50 dark:bg-dark-800 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-dark-400 uppercase tracking-widest ml-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={16} />
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full bg-dark-50 dark:bg-dark-800 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3.5 rounded-xl font-bold transition-all shadow-glow flex items-center justify-center gap-2 group mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign Up <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-dark-500 text-xs">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-bold hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
