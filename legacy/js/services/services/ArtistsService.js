// ============================================
// ARTISTS SERVICE MODULE
// ============================================

const ArtistsService = {
    /**
     * Get all artists
     * @returns {Promise<Array>}
     */
    async getAll() {
        // Artists are derived from songs
        const songs = await SongsService.getAll();
        const artistsMap = new Map();

        songs.forEach(song => {
            if (song.artist) {
                const id = Utils.slugify(song.artist);
                if (!artistsMap.has(id)) {
                    artistsMap.set(id, {
                        id,
                        name: song.artist,
                        image_url: null,
                        genres: new Set(),
                        song_ids: [],
                        album_ids: new Set()
                    });
                }
                
                const artist = artistsMap.get(id);
                artist.song_ids.push(song.id);
                
                if (song.genre) {
                    song.genre.forEach(g => artist.genres.add(g));
                }
                
                if (song.album_id) {
                    artist.album_ids.add(song.album_id);
                }
            }
        });

        // Convert sets to arrays
        const artists = Array.from(artistsMap.values()).map(a => ({
            ...a,
            genres: Array.from(a.genres),
            album_ids: Array.from(a.album_ids),
            song_count: a.song_ids.length
        }));

        return artists.sort((a, b) => a.name.localeCompare(b.name));
    },

    /**
     * Get artist by ID
     * @param {string} id - Artist ID (slug)
     * @returns {Promise<Object|null>}
     */
    async getById(id) {
        const artists = await this.getAll();
        return artists.find(a => a.id === id) || null;
    },

    /**
     * Get artist by name
     * @param {string} name - Artist name
     * @returns {Promise<Object|null>}
     */
    async getByName(name) {
        const id = Utils.slugify(name);
        return this.getById(id);
    },

    /**
     * Get songs by artist
     * @param {string} id - Artist ID
     * @returns {Promise<Array>}
     */
    async getSongs(id) {
        const artist = await this.getById(id);
        if (!artist) return [];

        const songs = [];
        for (const songId of artist.song_ids) {
            const song = await SongsService.getById(songId);
            if (song) songs.push(song);
        }
        return songs;
    },

    /**
     * Get albums by artist
     * @param {string} id - Artist ID
     * @returns {Promise<Array>}
     */
    async getAlbums(id) {
        const artist = await this.getById(id);
        if (!artist) return [];

        return AlbumsService.getByArtist(artist.name);
    },

    /**
     * Get artist statistics
     * @param {string} id - Artist ID
     * @returns {Promise<Object>}
     */
    async getStatistics(id) {
        const artist = await this.getById(id);
        if (!artist) return null;

        const songs = await this.getSongs(id);
        const albums = await this.getAlbums(id);

        const totalWords = songs.reduce((sum, s) => sum + Utils.countWords(s.lyrics || ''), 0);
        
        const years = songs.map(s => s.year).filter(Boolean);
        const firstYear = years.length > 0 ? Math.min(...years) : null;
        const lastYear = years.length > 0 ? Math.max(...years) : null;

        return {
            songCount: songs.length,
            albumCount: albums.length,
            totalWords,
            averageWordsPerSong: songs.length > 0 ? Math.round(totalWords / songs.length) : 0,
            genres: artist.genres,
            yearRange: firstYear && lastYear ? `${firstYear} - ${lastYear}` : null,
            favoriteCount: songs.filter(s => s.is_favorite).length
        };
    },

    /**
     * Search artists
     * @param {string} query - Search query
     * @returns {Promise<Array>}
     */
    async search(query) {
        const artists = await this.getAll();
        const searchTerm = query.toLowerCase();
        
        return artists.filter(a => 
            a.name.toLowerCase().includes(searchTerm)
        );
    },

    /**
     * Get top artists by song count
     * @param {number} limit - Number of artists
     * @returns {Promise<Array>}
     */
    async getTopArtists(limit = 10) {
        const artists = await this.getAll();
        return artists
            .sort((a, b) => b.song_count - a.song_count)
            .slice(0, limit);
    }
};