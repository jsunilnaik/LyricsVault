// ============================================
// SONGS SERVICE MODULE
// Complete CRUD operations for songs
// ============================================

const SongsService = {
    /**
     * Get all songs
     * @returns {Promise<Array>}
     */
    async getAll() {
        try {
            const songs = await Database.getAll(Database.STORES.SONGS);
            return songs.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        } catch (error) {
            console.error('Failed to get songs:', error);
            return [];
        }
    },

    /**
     * Get a song by ID
     * @param {string} id - Song ID
     * @returns {Promise<Object|null>}
     */
    async getById(id) {
        try {
            return await Database.get(Database.STORES.SONGS, id);
        } catch (error) {
            console.error('Failed to get song:', error);
            return null;
        }
    },

    /**
     * Create a new song
     * @param {Object} data - Song data
     * @returns {Promise<Object>}
     */
    async create(data) {
        const validation = Validators.validateSong(data);
        if (!validation.valid) {
            throw new Error(validation.errors[0]);
        }

        const song = {
            id: Utils.generateUUID(),
            title: data.title.trim(),
            artist: data.artist?.trim() || null,
            album: data.album?.trim() || null,
            album_id: data.album_id || null,
            lyrics: data.lyrics,
            formatted_lyrics: Utils.formatLyrics(data.lyrics),
            genre: data.genre || [],
            tags: data.tags || [],
            mood: data.mood || [],
            language: data.language || null,
            year: data.year ? parseInt(data.year) : null,
            duration: data.duration || null,
            bpm: data.bpm ? parseInt(data.bpm) : null,
            key: data.key || null,
            artwork_url: data.artwork_url || null,
            notes: data.notes?.trim() || null,
            chords: data.chords?.trim() || null,
            sections: data.sections || [],
            is_favorite: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            view_count: 0,
            folder_id: data.folder_id || null,
            playlist_ids: []
        };

        await Database.put(Database.STORES.SONGS, song);
        
        // Update store
        Store.state.songs.push(song);
        Store.notify('songs', Store.state.songs);

        // Update artist if new
        if (song.artist) {
            await this.updateArtistFromSong(song);
        }

        return song;
    },

    /**
     * Update an existing song
     * @param {string} id - Song ID
     * @param {Object} data - Updated data
     * @returns {Promise<Object>}
     */
    async update(id, data) {
        const existing = await this.getById(id);
        if (!existing) {
            throw new Error('Song not found');
        }

        const validation = Validators.validateSong({ ...existing, ...data });
        if (!validation.valid) {
            throw new Error(validation.errors[0]);
        }

        const song = {
            ...existing,
            title: data.title?.trim() ?? existing.title,
            artist: data.artist?.trim() ?? existing.artist,
            album: data.album?.trim() ?? existing.album,
            album_id: data.album_id ?? existing.album_id,
            lyrics: data.lyrics ?? existing.lyrics,
            formatted_lyrics: data.lyrics ? Utils.formatLyrics(data.lyrics) : existing.formatted_lyrics,
            genre: data.genre ?? existing.genre,
            tags: data.tags ?? existing.tags,
            mood: data.mood ?? existing.mood,
            language: data.language ?? existing.language,
            year: data.year !== undefined ? (data.year ? parseInt(data.year) : null) : existing.year,
            duration: data.duration ?? existing.duration,
            bpm: data.bpm !== undefined ? (data.bpm ? parseInt(data.bpm) : null) : existing.bpm,
            key: data.key ?? existing.key,
            artwork_url: data.artwork_url ?? existing.artwork_url,
            notes: data.notes !== undefined ? (data.notes?.trim() || null) : existing.notes,
            chords: data.chords !== undefined ? (data.chords?.trim() || null) : existing.chords,
            sections: data.sections ?? existing.sections,
            folder_id: data.folder_id !== undefined ? data.folder_id : existing.folder_id,
            updated_at: new Date().toISOString()
        };

        await Database.put(Database.STORES.SONGS, song);

        // Update store
        const index = Store.state.songs.findIndex(s => s.id === id);
        if (index >= 0) {
            Store.state.songs[index] = song;
            Store.notify('songs', Store.state.songs);
        }

        // Update artist if changed
        if (song.artist !== existing.artist) {
            await this.updateArtistFromSong(song);
        }

        return song;
    },

    /**
     * Delete a song
     * @param {string} id - Song ID
     * @returns {Promise<void>}
     */
    async delete(id) {
        const song = await this.getById(id);
        if (!song) {
            throw new Error('Song not found');
        }

        await Database.delete(Database.STORES.SONGS, id);

        // Update store
        Store.state.songs = Store.state.songs.filter(s => s.id !== id);
        Store.notify('songs', Store.state.songs);

        // Remove from playlists
        for (const playlist of Store.state.playlists) {
            if (playlist.song_ids?.includes(id)) {
                playlist.song_ids = playlist.song_ids.filter(sid => sid !== id);
                await Database.put(Database.STORES.PLAYLISTS, playlist);
            }
        }

        // Update recent songs
        const recentSongs = Store.state.settings.recentSongs || [];
        if (recentSongs.includes(id)) {
            await Store.updateSetting('recentSongs', recentSongs.filter(sid => sid !== id));
        }
    },

    /**
     * Delete multiple songs
     * @param {Array<string>} ids - Song IDs
     * @returns {Promise<void>}
     */
    async deleteMany(ids) {
        for (const id of ids) {
            await this.delete(id);
        }
    },

    /**
     * Toggle favorite status
     * @param {string} id - Song ID
     * @returns {Promise<boolean>} New favorite status
     */
    async toggleFavorite(id) {
        const song = await this.getById(id);
        if (!song) {
            throw new Error('Song not found');
        }

        song.is_favorite = !song.is_favorite;
        song.updated_at = new Date().toISOString();
        
        await Database.put(Database.STORES.SONGS, song);

        // Update store
        const index = Store.state.songs.findIndex(s => s.id === id);
        if (index >= 0) {
            Store.state.songs[index] = song;
            Store.notify('songs', Store.state.songs);
        }

        return song.is_favorite;
    },

    /**
     * Get favorite songs
     * @returns {Promise<Array>}
     */
    async getFavorites() {
        const songs = await this.getAll();
        return songs.filter(s => s.is_favorite);
    },

    /**
     * Get recent songs
     * @param {number} limit - Number of songs
     * @returns {Promise<Array>}
     */
    async getRecent(limit = 10) {
        const recentIds = Store.state.settings.recentSongs || [];
        const songs = [];
        
        for (const id of recentIds.slice(0, limit)) {
            const song = await this.getById(id);
            if (song) songs.push(song);
        }
        
        return songs;
    },

    /**
     * Get songs by folder
     * @param {string} folderId - Folder ID
     * @returns {Promise<Array>}
     */
    async getByFolder(folderId) {
        const songs = await this.getAll();
        return songs.filter(s => s.folder_id === folderId);
    },

    /**
     * Get songs by artist
     * @param {string} artistName - Artist name
     * @returns {Promise<Array>}
     */
    async getByArtist(artistName) {
        const songs = await this.getAll();
        return songs.filter(s => s.artist?.toLowerCase() === artistName.toLowerCase());
    },

    /**
     * Get songs by album
     * @param {string} albumName - Album name
     * @param {string} artistName - Artist name (optional)
     * @returns {Promise<Array>}
     */
    async getByAlbum(albumName, artistName = null) {
        const songs = await this.getAll();
        return songs.filter(s => {
            const albumMatch = s.album?.toLowerCase() === albumName.toLowerCase();
            if (artistName) {
                return albumMatch && s.artist?.toLowerCase() === artistName.toLowerCase();
            }
            return albumMatch;
        });
    },

    /**
     * Get songs by genre
     * @param {string} genre - Genre name
     * @returns {Promise<Array>}
     */
    async getByGenre(genre) {
        const songs = await this.getAll();
        return songs.filter(s => s.genre?.some(g => g.toLowerCase() === genre.toLowerCase()));
    },

    /**
     * Get songs by mood
     * @param {string} mood - Mood name
     * @returns {Promise<Array>}
     */
    async getByMood(mood) {
        const songs = await this.getAll();
        return songs.filter(s => s.mood?.some(m => m.toLowerCase() === mood.toLowerCase()));
    },

    /**
     * Get songs by playlist
     * @param {string} playlistId - Playlist ID
     * @returns {Promise<Array>}
     */
    async getByPlaylist(playlistId) {
        const playlist = await Database.get(Database.STORES.PLAYLISTS, playlistId);
        if (!playlist) return [];

        const songs = [];
        for (const songId of (playlist.song_ids || [])) {
            const song = await this.getById(songId);
            if (song) songs.push(song);
        }
        return songs;
    },

    /**
     * Search songs
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @returns {Promise<Array>}
     */
    async search(query, options = {}) {
        const {
            fields = ['title', 'artist', 'album', 'lyrics', 'genre'],
            limit = 50,
            caseSensitive = false
        } = options;

        const songs = await this.getAll();
        const searchTerm = caseSensitive ? query : query.toLowerCase();

        const results = songs.filter(song => {
            for (const field of fields) {
                let value = song[field];
                
                if (Array.isArray(value)) {
                    value = value.join(' ');
                }
                
                if (value) {
                    const compareValue = caseSensitive ? value : value.toLowerCase();
                    if (compareValue.includes(searchTerm)) {
                        return true;
                    }
                }
            }
            return false;
        });

        // Sort by relevance (title matches first, then artist, then others)
        results.sort((a, b) => {
            const aTitle = (a.title || '').toLowerCase();
            const bTitle = (b.title || '').toLowerCase();
            const aArtist = (a.artist || '').toLowerCase();
            const bArtist = (b.artist || '').toLowerCase();

            const aInTitle = aTitle.includes(searchTerm);
            const bInTitle = bTitle.includes(searchTerm);
            const aInArtist = aArtist.includes(searchTerm);
            const bInArtist = bArtist.includes(searchTerm);

            if (aInTitle && !bInTitle) return -1;
            if (!aInTitle && bInTitle) return 1;
            if (aInArtist && !bInArtist) return -1;
            if (!aInArtist && bInArtist) return 1;

            return 0;
        });

        return results.slice(0, limit);
    },

    /**
     * Advanced search with filters
     * @param {Object} filters - Search filters
     * @returns {Promise<Array>}
     */
    async advancedSearch(filters) {
        const {
            query = '',
            artist = '',
            album = '',
            genre = '',
            mood = '',
            language = '',
            yearFrom = null,
            yearTo = null,
            isFavorite = null,
            folderId = null,
            sortBy = 'updated_at',
            sortOrder = 'desc',
            limit = 100
        } = filters;

        let songs = await this.getAll();

        // Apply filters
        if (query) {
            const q = query.toLowerCase();
            songs = songs.filter(s => 
                s.title?.toLowerCase().includes(q) ||
                s.artist?.toLowerCase().includes(q) ||
                s.lyrics?.toLowerCase().includes(q)
            );
        }

        if (artist) {
            songs = songs.filter(s => s.artist?.toLowerCase() === artist.toLowerCase());
        }

        if (album) {
            songs = songs.filter(s => s.album?.toLowerCase() === album.toLowerCase());
        }

        if (genre) {
            songs = songs.filter(s => s.genre?.some(g => g.toLowerCase() === genre.toLowerCase()));
        }

        if (mood) {
            songs = songs.filter(s => s.mood?.some(m => m.toLowerCase() === mood.toLowerCase()));
        }

        if (language) {
            songs = songs.filter(s => s.language?.toLowerCase() === language.toLowerCase());
        }

        if (yearFrom !== null) {
            songs = songs.filter(s => s.year && s.year >= yearFrom);
        }

        if (yearTo !== null) {
            songs = songs.filter(s => s.year && s.year <= yearTo);
        }

        if (isFavorite !== null) {
            songs = songs.filter(s => s.is_favorite === isFavorite);
        }

        if (folderId) {
            songs = songs.filter(s => s.folder_id === folderId);
        }

        // Sort
        songs.sort((a, b) => {
            let aVal, bVal;

            switch (sortBy) {
                case 'title':
                    aVal = a.title?.toLowerCase() || '';
                    bVal = b.title?.toLowerCase() || '';
                    break;
                case 'artist':
                    aVal = a.artist?.toLowerCase() || '';
                    bVal = b.artist?.toLowerCase() || '';
                    break;
                case 'album':
                    aVal = a.album?.toLowerCase() || '';
                    bVal = b.album?.toLowerCase() || '';
                    break;
                case 'year':
                    aVal = a.year || 0;
                    bVal = b.year || 0;
                    break;
                case 'created_at':
                    aVal = new Date(a.created_at);
                    bVal = new Date(b.created_at);
                    break;
                case 'updated_at':
                default:
                    aVal = new Date(a.updated_at);
                    bVal = new Date(b.updated_at);
                    break;
            }

            if (sortOrder === 'asc') {
                return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            } else {
                return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
            }
        });

        return songs.slice(0, limit);
    },

    /**
     * Move song to folder
     * @param {string} songId - Song ID
     * @param {string|null} folderId - Folder ID (null to remove from folder)
     * @returns {Promise<Object>}
     */
    async moveToFolder(songId, folderId) {
        return this.update(songId, { folder_id: folderId });
    },

    /**
     * Move multiple songs to folder
     * @param {Array<string>} songIds - Song IDs
     * @param {string|null} folderId - Folder ID
     * @returns {Promise<void>}
     */
    async moveManyToFolder(songIds, folderId) {
        for (const id of songIds) {
            await this.moveToFolder(id, folderId);
        }
    },

    /**
     * Add song to playlist
     * @param {string} songId - Song ID
     * @param {string} playlistId - Playlist ID
     * @returns {Promise<void>}
     */
    async addToPlaylist(songId, playlistId) {
        const playlist = await Database.get(Database.STORES.PLAYLISTS, playlistId);
        if (!playlist) {
            throw new Error('Playlist not found');
        }

        if (!playlist.song_ids) {
            playlist.song_ids = [];
        }

        if (!playlist.song_ids.includes(songId)) {
            playlist.song_ids.push(songId);
            playlist.updated_at = new Date().toISOString();
            await Database.put(Database.STORES.PLAYLISTS, playlist);

            // Update store
            const index = Store.state.playlists.findIndex(p => p.id === playlistId);
            if (index >= 0) {
                Store.state.playlists[index] = playlist;
            }

            // Update song's playlist_ids
            const song = await this.getById(songId);
            if (song) {
                if (!song.playlist_ids) song.playlist_ids = [];
                if (!song.playlist_ids.includes(playlistId)) {
                    song.playlist_ids.push(playlistId);
                    await Database.put(Database.STORES.SONGS, song);
                }
            }
        }
    },

    /**
     * Remove song from playlist
     * @param {string} songId - Song ID
     * @param {string} playlistId - Playlist ID
     * @returns {Promise<void>}
     */
    async removeFromPlaylist(songId, playlistId) {
        const playlist = await Database.get(Database.STORES.PLAYLISTS, playlistId);
        if (!playlist) {
            throw new Error('Playlist not found');
        }

        playlist.song_ids = (playlist.song_ids || []).filter(id => id !== songId);
        playlist.updated_at = new Date().toISOString();
        await Database.put(Database.STORES.PLAYLISTS, playlist);

        // Update store
        const index = Store.state.playlists.findIndex(p => p.id === playlistId);
        if (index >= 0) {
            Store.state.playlists[index] = playlist;
        }

        // Update song's playlist_ids
        const song = await this.getById(songId);
        if (song && song.playlist_ids) {
            song.playlist_ids = song.playlist_ids.filter(id => id !== playlistId);
            await Database.put(Database.STORES.SONGS, song);
        }
    },

    /**
     * Increment view count
     * @param {string} id - Song ID
     * @returns {Promise<void>}
     */
    async incrementViewCount(id) {
        const song = await this.getById(id);
        if (song) {
            song.view_count = (song.view_count || 0) + 1;
            await Database.put(Database.STORES.SONGS, song);

            // Update store
            const index = Store.state.songs.findIndex(s => s.id === id);
            if (index >= 0) {
                Store.state.songs[index].view_count = song.view_count;
            }
        }
    },

    /**
     * Get unique genres from all songs
     * @returns {Promise<Array<string>>}
     */
    async getAllGenres() {
        const songs = await this.getAll();
        const genres = new Set();
        songs.forEach(s => {
            (s.genre || []).forEach(g => genres.add(g));
        });
        return Array.from(genres).sort();
    },

    /**
     * Get unique moods from all songs
     * @returns {Promise<Array<string>>}
     */
    async getAllMoods() {
        const songs = await this.getAll();
        const moods = new Set();
        songs.forEach(s => {
            (s.mood || []).forEach(m => moods.add(m));
        });
        return Array.from(moods).sort();
    },

    /**
     * Get unique languages from all songs
     * @returns {Promise<Array<string>>}
     */
    async getAllLanguages() {
        const songs = await this.getAll();
        const languages = new Set();
        songs.forEach(s => {
            if (s.language) languages.add(s.language);
        });
        return Array.from(languages).sort();
    },

    /**
     * Get song statistics
     * @returns {Promise<Object>}
     */
    async getStatistics() {
        const songs = await this.getAll();
        
        const totalWords = songs.reduce((sum, s) => sum + Utils.countWords(s.lyrics || ''), 0);
        const totalCharacters = songs.reduce((sum, s) => sum + Utils.countCharacters(s.lyrics || ''), 0);
        
        const genreCounts = {};
        const artistCounts = {};
        const languageCounts = {};
        const yearCounts = {};
        
        songs.forEach(song => {
            // Genres
            (song.genre || []).forEach(g => {
                genreCounts[g] = (genreCounts[g] || 0) + 1;
            });
            
            // Artists
            if (song.artist) {
                artistCounts[song.artist] = (artistCounts[song.artist] || 0) + 1;
            }
            
            // Languages
            if (song.language) {
                languageCounts[song.language] = (languageCounts[song.language] || 0) + 1;
            }
            
            // Years
            if (song.year) {
                yearCounts[song.year] = (yearCounts[song.year] || 0) + 1;
            }
        });

        return {
            totalSongs: songs.length,
            totalFavorites: songs.filter(s => s.is_favorite).length,
            totalWords,
            totalCharacters,
            averageWordsPerSong: songs.length > 0 ? Math.round(totalWords / songs.length) : 0,
            genreCounts,
            artistCounts,
            languageCounts,
            yearCounts,
            topGenres: Object.entries(genreCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([name, count]) => ({ name, count })),
            topArtists: Object.entries(artistCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([name, count]) => ({ name, count }))
        };
    },

    /**
     * Update artist record from song
     * @param {Object} song - Song object
     */
    async updateArtistFromSong(song) {
        if (!song.artist) return;

        const artistId = Utils.slugify(song.artist);
        let artist = Store.state.artists.find(a => a.id === artistId);

        if (!artist) {
            artist = {
                id: artistId,
                name: song.artist,
                song_ids: [song.id],
                created_at: new Date().toISOString()
            };
            Store.state.artists.push(artist);
        } else if (!artist.song_ids.includes(song.id)) {
            artist.song_ids.push(song.id);
        }
    },

    /**
     * Duplicate a song
     * @param {string} id - Song ID to duplicate
     * @returns {Promise<Object>} New song
     */
    async duplicate(id) {
        const original = await this.getById(id);
        if (!original) {
            throw new Error('Song not found');
        }

        const duplicate = {
            ...original,
            id: Utils.generateUUID(),
            title: `${original.title} (Copy)`,
            is_favorite: false,
            view_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        await Database.put(Database.STORES.SONGS, duplicate);
        Store.state.songs.push(duplicate);
        Store.notify('songs', Store.state.songs);

        return duplicate;
    }
};