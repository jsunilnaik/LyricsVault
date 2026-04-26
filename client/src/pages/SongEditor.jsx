import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { songsAPI } from '../services/api';
import { fetchSongs } from '../store/songSlice';
import { 
  ChevronLeft, Save, Clock, Music, User, BookOpen, 
  Settings, Type, Zap, Globe, FileText, PlusCircle 
} from 'lucide-react';
import { clsx } from 'clsx';

const SongEditor = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    album: '',
    year: '',
    bpm: '',
    key: '',
    duration: '',
    language: 'English',
    lyrics: '',
    notes: '',
    chords: '',
    genre: [],
    mood: [],
    artwork_url: ''
  });

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('');

  useEffect(() => {
    if (isEdit) {
      const getSong = async () => {
        try {
          const response = await songsAPI.getById(id);
          const song = response.data;
          setFormData({
            ...song,
            year: song.year || '',
            bpm: song.bpm || '',
          });
          setLoading(false);
        } catch (error) {
          console.error('Failed to fetch song:', error);
          navigate('/');
        }
      };
      getSong();
    }
  }, [id, isEdit, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!formData.title.trim() || !formData.lyrics.trim()) {
      alert('Title and Lyrics are required');
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await songsAPI.update(id, formData);
      } else {
        await songsAPI.create(formData);
      }
      dispatch(fetchSongs());
      navigate(isEdit ? `/song/${id}` : '/');
    } catch (error) {
      console.error('Failed to save song:', error);
    } finally {
      setSaving(false);
    }
  };

  const addMarker = (marker) => {
    const textarea = document.getElementById('lyrics-input');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.lyrics;
    const markerText = `[${marker}]\n`;
    const newLyrics = text.substring(0, start) + markerText + text.substring(end);
    setFormData(prev => ({ ...prev, lyrics: newLyrics }));
    
    // Focus back and set cursor
    setTimeout(() => {
      textarea.focus();
      const pos = start + markerText.length;
      textarea.setSelectionRange(pos, pos);
    }, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto animate-fade-in pb-20">
      <form onSubmit={handleSave} className="space-y-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-[73px] z-40 bg-white/80 dark:bg-dark-950/80 backdrop-blur-md py-4 border-b border-dark-100 dark:border-dark-800 -mx-4 px-4">
          <div className="flex items-center gap-4">
            <button 
              type="button"
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-dark-100 dark:hover:bg-dark-800 rounded-full transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold tracking-tight">
              {isEdit ? 'Edit Song' : 'Create New Song'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-dark-400 font-medium">{autoSaveStatus}</span>
            <button 
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white px-6 py-2.5 rounded-full font-semibold transition-all shadow-glow"
            >
              {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={20} />}
              {isEdit ? 'Save Changes' : 'Create Song'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-dark-900 rounded-3xl border border-dark-100 dark:border-dark-800 p-6 md:p-8 space-y-6 shadow-soft">
              <div className="space-y-4">
                <div className="group">
                  <label className="text-xs font-bold text-dark-400 uppercase tracking-widest ml-1 mb-2 block">Song Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter song title..."
                    className="w-full text-3xl font-bold bg-transparent border-none focus:ring-0 placeholder:text-dark-200 dark:placeholder:text-dark-700 p-0"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-300" size={18} />
                    <input
                      type="text"
                      name="artist"
                      value={formData.artist}
                      onChange={handleChange}
                      placeholder="Artist / Composer"
                      className="w-full bg-dark-50 dark:bg-dark-800 border-none rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-primary-500 transition-all"
                    />
                  </div>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-300" size={18} />
                    <input
                      type="text"
                      name="album"
                      value={formData.album}
                      onChange={handleChange}
                      placeholder="Album Name"
                      className="w-full bg-dark-50 dark:bg-dark-800 border-none rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-primary-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-dark-100 dark:border-dark-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-dark-400 uppercase tracking-widest ml-1 block">Lyrics *</label>
                  <div className="flex gap-2">
                    {['Verse', 'Chorus', 'Bridge', 'Outro'].map(m => (
                      <button 
                        key={m}
                        type="button"
                        onClick={() => addMarker(m)}
                        className="text-[10px] font-bold bg-dark-50 dark:bg-dark-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 px-2 py-1 rounded transition-colors uppercase tracking-wider"
                      >
                        +{m}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  id="lyrics-input"
                  name="lyrics"
                  value={formData.lyrics}
                  onChange={handleChange}
                  placeholder="Paste or write your lyrics here..."
                  className="w-full min-h-[500px] bg-dark-50/50 dark:bg-dark-800/30 border-dark-100 dark:border-dark-800 rounded-2xl p-6 focus:ring-2 focus:ring-primary-500 font-lyrics text-lg leading-relaxed transition-all resize-none"
                />
              </div>
            </div>

            <div className="bg-white dark:bg-dark-900 rounded-3xl border border-dark-100 dark:border-dark-800 p-6 md:p-8 space-y-4 shadow-soft">
               <label className="text-xs font-bold text-dark-400 uppercase tracking-widest ml-1 block">Additional Notes</label>
               <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any extra info, performance notes, or context..."
                  className="w-full h-32 bg-dark-50/50 dark:bg-dark-800/30 border-dark-100 dark:border-dark-800 rounded-2xl p-4 focus:ring-2 focus:ring-primary-500 transition-all"
                />
            </div>
          </div>

          {/* Right Column - Metadata */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-dark-900 rounded-3xl border border-dark-100 dark:border-dark-800 p-6 space-y-6 shadow-soft">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Settings size={20} className="text-primary-500" />
                Song Metadata
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-dark-400 uppercase tracking-widest ml-1">Year</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-300" size={16} />
                      <input type="number" name="year" value={formData.year} onChange={handleChange} className="w-full bg-dark-50 dark:bg-dark-800 border-none rounded-xl py-2.5 pl-10 pr-3 text-sm focus:ring-2 focus:ring-primary-500" placeholder="2024" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-dark-400 uppercase tracking-widest ml-1">Duration</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-300" size={16} />
                      <input type="text" name="duration" value={formData.duration} onChange={handleChange} className="w-full bg-dark-50 dark:bg-dark-800 border-none rounded-xl py-2.5 pl-10 pr-3 text-sm focus:ring-2 focus:ring-primary-500" placeholder="3:45" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-dark-400 uppercase tracking-widest ml-1">BPM</label>
                    <div className="relative">
                      <Zap className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-300" size={16} />
                      <input type="number" name="bpm" value={formData.bpm} onChange={handleChange} className="w-full bg-dark-50 dark:bg-dark-800 border-none rounded-xl py-2.5 pl-10 pr-3 text-sm focus:ring-2 focus:ring-primary-500" placeholder="120" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-dark-400 uppercase tracking-widest ml-1">Key</label>
                    <div className="relative">
                      <Music className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-300" size={16} />
                      <input type="text" name="key" value={formData.key} onChange={handleChange} className="w-full bg-dark-50 dark:bg-dark-800 border-none rounded-xl py-2.5 pl-10 pr-3 text-sm focus:ring-2 focus:ring-primary-500" placeholder="C Maj" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-dark-400 uppercase tracking-widest ml-1">Language</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-300" size={16} />
                    <select name="language" value={formData.language} onChange={handleChange} className="w-full bg-dark-50 dark:bg-dark-800 border-none rounded-xl py-2.5 pl-10 pr-3 text-sm focus:ring-2 focus:ring-primary-500 appearance-none">
                      <option>English</option>
                      <option>Spanish</option>
                      <option>French</option>
                      <option>German</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-dark-900 rounded-3xl border border-dark-100 dark:border-dark-800 p-6 space-y-6 shadow-soft">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Type size={20} className="text-secondary-500" />
                Chords (Optional)
              </h3>
              <textarea
                name="chords"
                value={formData.chords}
                onChange={handleChange}
                placeholder="A - E - F#m - D"
                className="w-full h-24 bg-dark-50/50 dark:bg-dark-800/30 border-dark-100 dark:border-dark-800 rounded-2xl p-4 focus:ring-2 focus:ring-primary-500 font-mono text-sm transition-all"
              />
            </div>

            <div className="bg-white dark:bg-dark-900 rounded-3xl border border-dark-100 dark:border-dark-800 p-6 space-y-4 shadow-soft">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <FileText size={20} className="text-accent-500" />
                Artwork URL
              </h3>
              <input
                type="text"
                name="artwork_url"
                value={formData.artwork_url}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                className="w-full bg-dark-50 dark:bg-dark-800 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary-500 text-sm transition-all"
              />
              {formData.artwork_url && (
                <div className="mt-4 aspect-square rounded-2xl overflow-hidden border border-dark-100 dark:border-dark-800">
                  <img src={formData.artwork_url} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SongEditor;
