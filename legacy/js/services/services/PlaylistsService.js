// ============================================
// PLAYLISTS SERVICE MODULE
// ============================================

const PlaylistsService = {
    /**
     * Get all playlists
     * @returns {Promise<Array>}
     */
    async getAll() {
        try {
            const playlists = await Database.getAll(Database.STORES.PLAYLISTS);
            return playlists.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        } catch (error) {
            console.error('Failed to get playlists:', error);
            return [];
        }
    },

    /**
     * Get playlist by ID
     * @param {string} id - Playlist ID
     * @returns {Promise<Object|null>}
     */
    async getById(id) {
        try {
            return await Database.get(Database.STORES.PLAYLISTS, id);
        } catch (error) {
            console.error('Failed to get playlist:', error);
            return null;
        }
    },

    /**
     * Create a new playlist
     * @param {Object} data - Playlist data
     * @returns {Promise<Object>}
     */
    async create(data) {
        const validation = Validators.validatePlaylist(data);
        if (!validation.valid) {
            throw new Error(validation.errors[0]);
        }

        const playlist = {
            id: Utils.generateUUID(),
            name: data.name.trim(),
            description: data.description?.trim() || null,
            cover_url: data.cover_url || null,
            song_ids: data.song_ids || [],
            is_public: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        await Database.put(Database.STORES.PLAYLISTS, playlist);
        
        Store.state.playlists.push(playlist);
        Store.notify('playlists', Store.state.playlists);

        return playlist;
    },

    /**
     * Update a playlist
     * @param {string} id - Playlist ID
     * @param {Object} data - Updated data
     * @returns {Promise<Object>}
     */
    async update(id, data) {
        const existing = await this.getById(id);
        if (!existing) {
            throw new Error('Playlist not found');
        }

        const playlist = {
            ...existing,
            name: data.name?.trim() ?? existing.name,
            description: data.description !== undefined ? (data.description?.trim() || null) : existing.description,
            cover_url: data.cover_url ?? existing.cover_url,
            song_ids: data.song_ids ?? existing.song_ids,
            updated_at: new Date().toISOString()
        };

        await Database.put(Database.STORES.PLAYLISTS, playlist);

        const index = Store.state.playlists.findIndex(p => p.id === id);
        if (index >= 0) {
            Store.state.playlists[index] = playlist;
            Store.notify('playlists', Store.state.playlists);
        }

        return playlist;
    },

    /**
     * Delete a playlist
     * @param {string} id - Playlist ID
     * @returns {Promise<void>}
     */
    async delete(id) {
        const playlist = await this.getById(id);
        if (!playlist) {
            throw new Error('Playlist not found');
        }

        // Remove playlist reference from songs
        for (const songId of (playlist.song_ids || [])) {
            const song = await SongsService.getById(songId);
            if (song && song.playlist_ids) {
                song.playlist_ids = song.playlist_ids.filter(pid => pid !== id);
                await Database.put(Database.STORES.SONGS, song);
            }
        }

        await Database.delete(Database.STORES.PLAYLISTS, id);
        
        Store.state.playlists = Store.state.playlists.filter(p => p.id !== id);
        Store.notify('playlists', Store.state.playlists);
    },

    /**
     * Get songs in playlist
     * @param {string} playlistId - Playlist ID
     * @returns {Promise<Array>}
     */
    async getSongs(playlistId) {
        const playlist = await this.getById(playlistId);
        if (!playlist) return [];

        const songs = [];
        for (const songId of (playlist.song_ids || [])) {
            const song = await SongsService.getById(songId);
            if (song) songs.push(song);
        }
        return songs;
    },

    /**
     * Add song to playlist
     * @param {string} playlistId - Playlist ID
     * @param {string} songId - Song ID
     * @param {number} position - Position (optional, adds to end if not specified)
     * @returns {Promise<void>}
     */
    async addSong(playlistId, songId, position = null) {
        const playlist = await this.getById(playlistId);
        if (!playlist) {
            throw new Error('Playlist not found');
        }

        if (!playlist.song_ids) playlist.song_ids = [];
        
        if (!playlist.song_ids.includes(songId)) {
            if (position !== null && position >= 0 && position < playlist.song_ids.length) {
                playlist.song_ids.splice(position, 0, songId);
            } else {
                playlist.song_ids.push(songId);
            }
            
            await this.update(playlistId, { song_ids: playlist.song_ids });

            // Update song's playlist_ids
            const song = await SongsService.getById(songId);
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
     * Add multiple songs to playlist
     * @param {string} playlistId - Playlist ID
     * @param {Array<string>} songIds - Song IDs
     * @returns {Promise<void>}
     */
    async addSongs(playlistId, songIds) {
        for (const songId of songIds) {
            await this.addSong(playlistId, songId);
        }
    },

    /**
     * Remove song from playlist
     * @param {string} playlistId - Playlist ID
     * @param {string} songId - Song ID
     * @returns {Promise<void>}
     */
    async removeSong(playlistId, songId) {
        const playlist = await this.getById(playlistId);
        if (!playlist) {
            throw new Error('Playlist not found');
        }

        playlist.song_ids = (playlist.song_ids || []).filter(id => id !== songId);
        await this.update(playlistId, { song_ids: playlist.song_ids });

        // Update song's playlist_ids
        const song = await SongsService.getById(songId);
        if (song && song.playlist_ids) {
            song.playlist_ids = song.playlist_ids.filter(id => id !== playlistId);
            await Database.put(Database.STORES.SONGS, song);
        }
    },

    /**
     * Reorder songs in playlist
     * @param {string} playlistId - Playlist ID
     * @param {Array<string>} newOrder - New order of song IDs
     * @returns {Promise<void>}
     */
    async reorderSongs(playlistId, newOrder) {
        const playlist = await this.getById(playlistId);
        if (!playlist) {
            throw new Error('Playlist not found');
        }

        // Validate that all song IDs are in the playlist
        const currentIds = new Set(playlist.song_ids || []);
        const newIds = new Set(newOrder);
        
        if (currentIds.size !== newIds.size || 
            ![...currentIds].every(id => newIds.has(id))) {
            throw new Error('Invalid song order');
        }

        await this.update(playlistId, { song_ids: newOrder });
    },

    /**
     * Move song within playlist
     * @param {string} playlistId - Playlist ID
     * @param {number} fromIndex - Current index
     * @param {number} toIndex - New index
     * @returns {Promise<void>}
     */
    async moveSong(playlistId, fromIndex, toIndex) {
        const playlist = await this.getById(playlistId);
        if (!playlist || !playlist.song_ids) {
            throw new Error('Playlist not found');
        }

        const songIds = [...playlist.song_ids];
        const [removed] = songIds.splice(fromIndex, 1);
        songIds.splice(toIndex, 0, removed);

        await this.update(playlistId, { song_ids: songIds });
    },

    /**
     * Duplicate a playlist
     * @param {string} id - Playlist ID
     * @returns {Promise<Object>}
     */
    async duplicate(id) {
        const original = await this.getById(id);
        if (!original) {
            throw new Error('Playlist not found');
        }

        return this.create({
            name: `${original.name} (Copy)`,
            description: original.description,
            song_ids: [...(original.song_ids || [])]
        });
    },

    /**
     * Clear all songs from playlist
     * @param {string} id - Playlist ID
     * @returns {Promise<void>}
     */
    async clearSongs(id) {
        const playlist = await this.getById(id);
        if (!playlist) {
            throw new Error('Playlist not found');
        }

        // Remove playlist reference from songs
        for (const songId of (playlist.song_ids || [])) {
            await this.removeSong(id, songId);
        }
    },

    /**
     * Get playlist statistics
     * @param {string} id - Playlist ID
     * @returns {Promise<Object>}
     */
    async getStatistics(id) {
        const playlist = await this.getById(id);
        if (!playlist) return null;

        const songs = await this.getSongs(id);
        
        const totalDuration = songs.reduce((sum, s) => {
            if (s.duration) {
                const parts = s.duration.split(':');
                return sum + parseInt(parts[0]) * 60 + parseInt(parts[1]);
            }
            return sum;
        }, 0);

        const genres = new Set();
        const artists = new Set();
        
        songs.forEach(s => {
            (s.genre || []).forEach(g => genres.add(g));
            if (s.artist) artists.add(s.artist);
        });

        return {
            songCount: songs.length,
            totalDuration: Utils.formatDuration(totalDuration),
            totalWords: songs.reduce((sum, s) => sum + Utils.countWords(s.lyrics || ''), 0),
            genres: Array.from(genres),
            artists: Array.from(artists),
            artistCount: artists.size
        };
    },

    /**
     * Search playlists
     * @param {string} query - Search query
     * @returns {Promise<Array>}
     */
    async search(query) {
        const playlists = await this.getAll();
        const searchTerm = query.toLowerCase();
        
        return playlists.filter(p => 
            p.name.toLowerCase().includes(searchTerm) ||
            p.description?.toLowerCase().includes(searchTerm)
        );
    },

    /**
     * Update playlist cover
     * @param {string} id - Playlist ID
     * @param {string} coverUrl - Cover image data URL
     * @returns {Promise<Object>}
     */
    async updateCover(id, coverUrl) {
        return this.update(id, { cover_url: coverUrl });
    },

    /**
     * Generate auto cover from songs
     * @param {string} id - Playlist ID
     * @returns {Promise<string|null>} Cover data URL
     */
    async generateAutoCover(id) {
        const songs = await this.getSongs(id);
        const songsWithArtwork = songs.filter(s => s.artwork_url);
        
        if (songsWithArtwork.length === 0) return null;

        // For now, just use the first song's artwork
        // Could be enhanced to create a collage
        return songsWithArtwork[0].artwork_url;
    }
};