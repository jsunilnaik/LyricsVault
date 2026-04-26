// ============================================
// SEARCH MODULE
// Advanced search functionality
// ============================================

const SearchModule = {
    searchHistory: [],
    maxHistorySize: 20,

    /**
     * Initialize search module
     */
    init() {
        this.searchHistory = Store.state.settings.searchHistory || [];
    },

    /**
     * Perform global search
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @returns {Promise<Object>}
     */
    async search(query, options = {}) {
        const {
            types = ['songs', 'artists', 'albums', 'playlists', 'folders'],
            limit = 20
        } = options;

        const results = {
            songs: [],
            artists: [],
            albums: [],
            playlists: [],
            folders: [],
            total: 0
        };

        if (!query.trim()) return results;

        const searchTerm = query.toLowerCase().trim();

        // Search songs
        if (types.includes('songs')) {
            results.songs = await SongsService.search(searchTerm, { limit });
        }

        // Search artists
        if (types.includes('artists')) {
            results.artists = await ArtistsService.search(searchTerm);
            results.artists = results.artists.slice(0, limit);
        }

        // Search albums
        if (types.includes('albums')) {
            const albums = await AlbumsService.getAll();
            results.albums = albums.filter(a => 
                a.title?.toLowerCase().includes(searchTerm) ||
                a.artist?.toLowerCase().includes(searchTerm)
            ).slice(0, limit);
        }

        // Search playlists
        if (types.includes('playlists')) {
            results.playlists = await PlaylistsService.search(searchTerm);
            results.playlists = results.playlists.slice(0, limit);
        }

        // Search folders
        if (types.includes('folders')) {
            results.folders = await FoldersService.search(searchTerm);
            results.folders = results.folders.slice(0, limit);
        }

        // Calculate total
        results.total = results.songs.length + 
                       results.artists.length + 
                       results.albums.length + 
                       results.playlists.length + 
                       results.folders.length;

        return results;
    },

    /**
     * Get search suggestions
     * @param {string} query - Partial query
     * @returns {Promise<Array>}
     */
    async getSuggestions(query) {
        if (!query.trim() || query.length < 2) return [];

        const searchTerm = query.toLowerCase().trim();
        const suggestions = [];

        // Get songs
        const songs = Store.state.songs;
        
        // Title suggestions
        songs.forEach(song => {
            if (song.title?.toLowerCase().includes(searchTerm)) {
                suggestions.push({
                    type: 'song',
                    text: song.title,
                    subtext: song.artist,
                    id: song.id,
                    icon: 'music'
                });
            }
        });

        // Artist suggestions
        const artists = await ArtistsService.getAll();
        artists.forEach(artist => {
            if (artist.name.toLowerCase().includes(searchTerm)) {
                suggestions.push({
                    type: 'artist',
                    text: artist.name,
                    subtext: `${artist.song_count} songs`,
                    id: artist.id,
                    icon: 'user'
                });
            }
        });

        // Album suggestions
        const albums = Store.state.albums;
        albums.forEach(album => {
            if (album.title?.toLowerCase().includes(searchTerm)) {
                suggestions.push({
                    type: 'album',
                    text: album.title,
                    subtext: album.artist,
                    id: album.id,
                    icon: 'album'
                });
            }
        });

        // Sort by relevance and limit
        suggestions.sort((a, b) => {
            const aStartsWith = a.text.toLowerCase().startsWith(searchTerm);
            const bStartsWith = b.text.toLowerCase().startsWith(searchTerm);
            if (aStartsWith && !bStartsWith) return -1;
            if (!aStartsWith && bStartsWith) return 1;
            return a.text.localeCompare(b.text);
        });

        return suggestions.slice(0, 10);
    },

    /**
     * Add to search history
     * @param {string} query - Search query
     */
    async addToHistory(query) {
        if (!query.trim()) return;

        // Remove if exists
        this.searchHistory = this.searchHistory.filter(
            q => q.toLowerCase() !== query.toLowerCase()
        );

        // Add to beginning
        this.searchHistory.unshift(query);

        // Limit size
        if (this.searchHistory.length > this.maxHistorySize) {
            this.searchHistory = this.searchHistory.slice(0, this.maxHistorySize);
        }

        // Save
        await Store.updateSetting('searchHistory', this.searchHistory);
    },

    /**
     * Get search history
     * @param {number} limit - Number of items
     * @returns {Array}
     */
    getHistory(limit = 10) {
        return this.searchHistory.slice(0, limit);
    },

    /**
     * Clear search history
     */
    async clearHistory() {
        this.searchHistory = [];
        await Store.updateSetting('searchHistory', []);
    },

    /**
     * Remove item from history
     * @param {string} query - Query to remove
     */
    async removeFromHistory(query) {
        this.searchHistory = this.searchHistory.filter(
            q => q.toLowerCase() !== query.toLowerCase()
        );
        await Store.updateSetting('searchHistory', this.searchHistory);
    },

    /**
     * Highlight search term in text
     * @param {string} text - Text to highlight
     * @param {string} term - Search term
     * @returns {string} HTML with highlights
     */
    highlightTerm(text, term) {
        if (!term) return Utils.sanitizeHTML(text);
        return Utils.highlightText(text, term);
    },

    /**
     * Get popular search terms from song data
     * @param {number} limit - Number of terms
     * @returns {Promise<Array>}
     */
    async getPopularTerms(limit = 10) {
        const songs = Store.state.songs;
        const terms = {};

        // Count genres
        songs.forEach(song => {
            (song.genre || []).forEach(g => {
                terms[g] = (terms[g] || 0) + 1;
            });
        });

        // Count artists
        songs.forEach(song => {
            if (song.artist) {
                terms[song.artist] = (terms[song.artist] || 0) + 1;
            }
        });

        // Sort and return top terms
        return Object.entries(terms)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([term, count]) => ({ term, count }));
    }
};