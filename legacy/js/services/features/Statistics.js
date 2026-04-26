// ============================================
// STATISTICS MODULE
// Dashboard statistics and analytics
// ============================================

const Statistics = {
    /**
     * Get comprehensive statistics
     * @returns {Promise<Object>}
     */
    async getAll() {
        const songs = Store.state.songs;
        const albums = Store.state.albums;
        const folders = Store.state.folders;
        const playlists = Store.state.playlists;
        const artists = Store.state.artists;

        return {
            overview: this.getOverview(songs, albums, folders, playlists, artists),
            songStats: await this.getSongStatistics(songs),
            genreDistribution: this.getGenreDistribution(songs),
            moodDistribution: this.getMoodDistribution(songs),
            languageDistribution: this.getLanguageDistribution(songs),
            yearDistribution: this.getYearDistribution(songs),
            topArtists: this.getTopArtists(songs),
            recentActivity: await this.getRecentActivity(songs),
            storageUsage: await this.getStorageUsage()
        };
    },

    /**
     * Get overview statistics
     */
    getOverview(songs, albums, folders, playlists, artists) {
        return {
            totalSongs: songs.length,
            totalAlbums: albums.length,
            totalFolders: folders.length,
            totalPlaylists: playlists.length,
            totalArtists: artists.length,
            totalFavorites: songs.filter(s => s.is_favorite).length,
            songsWithLyrics: songs.filter(s => s.lyrics && s.lyrics.length > 0).length,
            songsWithArtwork: songs.filter(s => s.artwork_url).length
        };
    },

    /**
     * Get detailed song statistics
     */
    async getSongStatistics(songs) {
        let totalWords = 0;
        let totalCharacters = 0;
        let totalDuration = 0;
        let longestSong = null;
        let shortestSong = null;
        let maxWords = 0;
        let minWords = Infinity;

        songs.forEach(song => {
            const wordCount = Utils.countWords(song.lyrics || '');
            const charCount = Utils.countCharacters(song.lyrics || '');
            
            totalWords += wordCount;
            totalCharacters += charCount;

            if (wordCount > maxWords) {
                maxWords = wordCount;
                longestSong = song;
            }
            if (wordCount < minWords && wordCount > 0) {
                minWords = wordCount;
                shortestSong = song;
            }

            if (song.duration) {
                const parts = song.duration.split(':');
                totalDuration += parseInt(parts[0]) * 60 + parseInt(parts[1]);
            }
        });

        return {
            totalWords,
            totalCharacters,
            totalDuration: Utils.formatDuration(totalDuration),
            averageWordsPerSong: songs.length > 0 ? Math.round(totalWords / songs.length) : 0,
            averageCharactersPerSong: songs.length > 0 ? Math.round(totalCharacters / songs.length) : 0,
            longestSong: longestSong ? { 
                title: longestSong.title, 
                wordCount: maxWords,
                id: longestSong.id 
            } : null,
            shortestSong: shortestSong ? { 
                title: shortestSong.title, 
                wordCount: minWords,
                id: shortestSong.id 
            } : null,
            estimatedReadingTime: Utils.estimateReadingTime(
                songs.map(s => s.lyrics || '').join(' ')
            )
        };
    },

    /**
     * Get genre distribution
     */
    getGenreDistribution(songs) {
        const genreCounts = {};
        
        songs.forEach(song => {
            (song.genre || []).forEach(genre => {
                genreCounts[genre] = (genreCounts[genre] || 0) + 1;
            });
        });

        return Object.entries(genreCounts)
            .map(([name, count]) => ({
                name,
                count,
                percentage: songs.length > 0 ? Math.round((count / songs.length) * 100) : 0
            }))
            .sort((a, b) => b.count - a.count);
    },

    /**
     * Get mood distribution
     */
    getMoodDistribution(songs) {
        const moodCounts = {};
        
        songs.forEach(song => {
            (song.mood || []).forEach(mood => {
                moodCounts[mood] = (moodCounts[mood] || 0) + 1;
            });
        });

        return Object.entries(moodCounts)
            .map(([name, count]) => ({
                name,
                count,
                percentage: songs.length > 0 ? Math.round((count / songs.length) * 100) : 0
            }))
            .sort((a, b) => b.count - a.count);
    },

    /**
     * Get language distribution
     */
    getLanguageDistribution(songs) {
        const langCounts = {};
        
        songs.forEach(song => {
            const lang = song.language || 'Unknown';
            langCounts[lang] = (langCounts[lang] || 0) + 1;
        });

        return Object.entries(langCounts)
            .map(([name, count]) => ({
                name,
                count,
                percentage: songs.length > 0 ? Math.round((count / songs.length) * 100) : 0
            }))
            .sort((a, b) => b.count - a.count);
    },

    /**
     * Get year distribution
     */
    getYearDistribution(songs) {
        const yearCounts = {};
        
        songs.forEach(song => {
            if (song.year) {
                yearCounts[song.year] = (yearCounts[song.year] || 0) + 1;
            }
        });

        return Object.entries(yearCounts)
            .map(([year, count]) => ({
                year: parseInt(year),
                count
            }))
            .sort((a, b) => b.year - a.year);
    },

    /**
     * Get top artists
     */
    getTopArtists(songs, limit = 10) {
        const artistCounts = {};
        
        songs.forEach(song => {
            if (song.artist) {
                artistCounts[song.artist] = (artistCounts[song.artist] || 0) + 1;
            }
        });

        return Object.entries(artistCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    },

    /**
     * Get recent activity
     */
    async getRecentActivity(songs, limit = 10) {
        const recentlyAdded = [...songs]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, limit)
            .map(s => ({
                type: 'added',
                song: { id: s.id, title: s.title, artist: s.artist },
                date: s.created_at
            }));

        const recentlyUpdated = [...songs]
            .filter(s => s.updated_at !== s.created_at)
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
            .slice(0, limit)
            .map(s => ({
                type: 'updated',
                song: { id: s.id, title: s.title, artist: s.artist },
                date: s.updated_at
            }));

        const recentlyViewed = (Store.state.settings.recentSongs || [])
            .slice(0, limit)
            .map(id => {
                const song = songs.find(s => s.id === id);
                return song ? {
                    type: 'viewed',
                    song: { id: song.id, title: song.title, artist: song.artist },
                    date: null
                } : null;
            })
            .filter(Boolean);

        return {
            recentlyAdded,
            recentlyUpdated,
            recentlyViewed
        };
    },

    /**
     * Get storage usage
     */
    async getStorageUsage() {
        const usage = await Database.getStorageUsage();
        
        return {
            used: Utils.formatFileSize(usage.usage),
            quota: Utils.formatFileSize(usage.quota),
            percentage: usage.percentage,
            available: Utils.formatFileSize(usage.quota - usage.usage)
        };
    },

    /**
     * Generate word frequency analysis
     * @param {Array} songs - Songs to analyze
     * @param {number} limit - Number of top words
     */
    getWordFrequency(songs, limit = 50) {
        const wordCounts = {};
        const stopWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
            'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
            'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought',
            'used', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her',
            'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their', 'this', 'that',
            'these', 'those', 'am', 'im', 'dont', 'wont', 'cant', 'oh', 'yeah', 'na',
            'la', 'da', 'uh', 'ah', 'ooh', 'hey', 'yo'
        ]);

        songs.forEach(song => {
            if (!song.lyrics) return;
            
            const words = song.lyrics
                .toLowerCase()
                .replace(/[^\w\s]/g, '')
                .split(/\s+/)
                .filter(word => word.length > 2 && !stopWords.has(word));

            words.forEach(word => {
                wordCounts[word] = (wordCounts[word] || 0) + 1;
            });
        });

        return Object.entries(wordCounts)
            .map(([word, count]) => ({ word, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }
};