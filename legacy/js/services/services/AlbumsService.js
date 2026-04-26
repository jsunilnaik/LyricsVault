// ============================================
// ALBUMS SERVICE MODULE
// ============================================

const AlbumsService = {
    /**
     * Get all albums
     * @returns {Promise<Array>}
     */
    async getAll() {
        try {
            const albums = await Database.getAll(Database.STORES.ALBUMS);
            return albums.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        } catch (error) {
            console.error('Failed to get albums:', error);
            return [];
        }
    },

    /**
     * Get album by ID
     * @param {string} id - Album ID
     * @returns {Promise<Object|null>}
     */
    async getById(id) {
        try {
            return await Database.get(Database.STORES.ALBUMS, id);
        } catch (error) {
            console.error('Failed to get album:', error);
            return null;
        }
    },

    /**
     * Create a new album
     * @param {Object} data - Album data
     * @returns {Promise<Object>}
     */
    async create(data) {
        const validation = Validators.validateAlbum(data);
        if (!validation.valid) {
            throw new Error(validation.errors[0]);
        }

        const album = {
            id: Utils.generateUUID(),
            title: data.title.trim(),
            artist: data.artist.trim(),
            year: data.year ? parseInt(data.year) : null,
            genre: data.genre || [],
            artwork_url: data.artwork_url || null,
            total_tracks: data.total_tracks || 0,
            song_ids: data.song_ids || [],
            notes: data.notes?.trim() || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        await Database.put(Database.STORES.ALBUMS, album);
        
        Store.state.albums.push(album);
        Store.notify('albums', Store.state.albums);

        return album;
    },

    /**
     * Update an album
     * @param {string} id - Album ID
     * @param {Object} data - Updated data
     * @returns {Promise<Object>}
     */
    async update(id, data) {
        const existing = await this.getById(id);
        if (!existing) {
            throw new Error('Album not found');
        }

        const album = {
            ...existing,
            title: data.title?.trim() ?? existing.title,
            artist: data.artist?.trim() ?? existing.artist,
            year: data.year !== undefined ? (data.year ? parseInt(data.year) : null) : existing.year,
            genre: data.genre ?? existing.genre,
            artwork_url: data.artwork_url ?? existing.artwork_url,
            total_tracks: data.total_tracks ?? existing.total_tracks,
            song_ids: data.song_ids ?? existing.song_ids,
            notes: data.notes !== undefined ? (data.notes?.trim() || null) : existing.notes,
            updated_at: new Date().toISOString()
        };

        await Database.put(Database.STORES.ALBUMS, album);

        const index = Store.state.albums.findIndex(a => a.id === id);
        if (index >= 0) {
            Store.state.albums[index] = album;
            Store.notify('albums', Store.state.albums);
        }

        return album;
    },

    /**
     * Delete an album
     * @param {string} id - Album ID
     * @returns {Promise<void>}
     */
    async delete(id) {
        await Database.delete(Database.STORES.ALBUMS, id);
        
        Store.state.albums = Store.state.albums.filter(a => a.id !== id);
        Store.notify('albums', Store.state.albums);

        // Remove album reference from songs
        const songs = Store.state.songs.filter(s => s.album_id === id);
        for (const song of songs) {
            song.album_id = null;
            await Database.put(Database.STORES.SONGS, song);
        }
    },

    /**
     * Get albums by artist
     * @param {string} artistName - Artist name
     * @returns {Promise<Array>}
     */
    async getByArtist(artistName) {
        const albums = await this.getAll();
        return albums.filter(a => a.artist?.toLowerCase() === artistName.toLowerCase());
    },

    /**
     * Get songs in album
     * @param {string} albumId - Album ID
     * @returns {Promise<Array>}
     */
    async getSongs(albumId) {
        const album = await this.getById(albumId);
        if (!album) return [];

        // First check song_ids
        if (album.song_ids?.length > 0) {
            const songs = [];
            for (const songId of album.song_ids) {
                const song = await SongsService.getById(songId);
                if (song) songs.push(song);
            }
            return songs;
        }

        // Fall back to matching by album name and artist
        return SongsService.getByAlbum(album.title, album.artist);
    },

    /**
     * Add song to album
     * @param {string} albumId - Album ID
     * @param {string} songId - Song ID
     * @returns {Promise<void>}
     */
    async addSong(albumId, songId) {
        const album = await this.getById(albumId);
        if (!album) {
            throw new Error('Album not found');
        }

        if (!album.song_ids) album.song_ids = [];
        
        if (!album.song_ids.includes(songId)) {
            album.song_ids.push(songId);
            album.total_tracks = album.song_ids.length;
            await this.update(albumId, album);

            // Update song's album reference
            const song = await SongsService.getById(songId);
            if (song) {
                await SongsService.update(songId, {
                    album: album.title,
                    album_id: albumId
                });
            }
        }
    },

    /**
     * Remove song from album
     * @param {string} albumId - Album ID
     * @param {string} songId - Song ID
     * @returns {Promise<void>}
     */
    async removeSong(albumId, songId) {
        const album = await this.getById(albumId);
        if (!album) {
            throw new Error('Album not found');
        }

        album.song_ids = (album.song_ids || []).filter(id => id !== songId);
        album.total_tracks = album.song_ids.length;
        await this.update(albumId, album);

        // Update song's album reference
        const song = await SongsService.getById(songId);
        if (song && song.album_id === albumId) {
            await SongsService.update(songId, {
                album_id: null
            });
        }
    },

    /**
     * Get or create album
     * @param {string} title - Album title
     * @param {string} artist - Artist name
     * @returns {Promise<Object>}
     */
    async getOrCreate(title, artist) {
        const albums = await this.getAll();
        const existing = albums.find(a => 
            a.title.toLowerCase() === title.toLowerCase() &&
            a.artist.toLowerCase() === artist.toLowerCase()
        );

        if (existing) return existing;

        return this.create({ title, artist });
    },

    /**
     * Update album artwork
     * @param {string} id - Album ID
     * @param {string} artworkUrl - Artwork data URL
     * @returns {Promise<Object>}
     */
    async updateArtwork(id, artworkUrl) {
        return this.update(id, { artwork_url: artworkUrl });
    },

    /**
     * Get album statistics
     * @param {string} id - Album ID
     * @returns {Promise<Object>}
     */
    async getStatistics(id) {
        const album = await this.getById(id);
        if (!album) return null;

        const songs = await this.getSongs(id);
        const totalDuration = songs.reduce((sum, s) => {
            if (s.duration) {
                const parts = s.duration.split(':');
                return sum + parseInt(parts[0]) * 60 + parseInt(parts[1]);
            }
            return sum;
        }, 0);

        return {
            trackCount: songs.length,
            totalDuration: Utils.formatDuration(totalDuration),
            genres: [...new Set(songs.flatMap(s => s.genre || []))],
            totalWords: songs.reduce((sum, s) => sum + Utils.countWords(s.lyrics || ''), 0)
        };
    }
};