// ============================================
// DETAIL PAGES CONTROLLERS
// Album, Artist, Folder, Playlist detail pages
// ============================================

const DetailPages = {
    /**
     * Initialize Album Detail Page
     * @param {Object} params - Route params
     */
    async initAlbumDetail(params) {
        const albumId = params.id;
        const album = await AlbumsService.getById(albumId);

        if (!album) {
            UI.showToast('Album not found', 'error');
            Router.navigate('/albums');
            return;
        }

        // Get album songs
        const songs = await AlbumsService.getSongs(albumId);
        const stats = await AlbumsService.getStatistics(albumId);

        // Elements
        const artworkEl = document.getElementById('album-artwork');
        const titleEl = document.getElementById('album-title');
        const artistEl = document.getElementById('album-artist');
        const yearEl = document.getElementById('album-year');
        const trackCountEl = document.getElementById('album-track-count');
        const durationEl = document.getElementById('album-duration');
        const songsListEl = document.getElementById('album-songs-list');
        const emptyEl = document.getElementById('album-songs-empty');

        // Populate data
        if (album.artwork_url) {
            artworkEl.innerHTML = `<img src="${album.artwork_url}" alt="${Utils.sanitizeHTML(album.title)}" class="w-full h-full object-cover">`;
        }

        titleEl.textContent = album.title;
        artistEl.textContent = album.artist;
        
        if (album.year) yearEl.textContent = album.year;
        if (stats) {
            trackCountEl.textContent = `${stats.trackCount} tracks`;
            if (stats.totalDuration) durationEl.textContent = stats.totalDuration;
        }

        // Render songs
        if (songs.length > 0) {
            songsListEl.innerHTML = songs.map((song, index) => `
                <div class="song-item flex items-center gap-4 p-4 hover:bg-dark-50 dark:hover:bg-dark-750 transition-colors" data-song-id="${song.id}">
                    <span class="w-6 text-center text-dark-400 text-sm">${index + 1}</span>
                    <a href="#/song/${song.id}" class="flex-1 min-w-0">
                        <p class="font-medium text-dark-900 dark:text-white truncate">${Utils.sanitizeHTML(song.title)}</p>
                    </a>
                    <span class="text-sm text-dark-500">${song.duration || '-'}</span>
                    <button class="favorite-btn p-2 hover:bg-dark-100 dark:hover:bg-dark-700 rounded transition-colors ${song.is_favorite ? 'text-red-500' : 'text-dark-400'}" data-song-id="${song.id}">
                        <svg class="w-4 h-4" fill="${song.is_favorite ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                        </svg>
                    </button>
                </div>
            `).join('');
            emptyEl.classList.add('hidden');
            App.setupFavoriteButtons();
        } else {
            songsListEl.innerHTML = '';
            emptyEl.classList.remove('hidden');
        }

        // Event listeners
        document.getElementById('album-back-btn')?.addEventListener('click', () => Router.back());
        
        document.getElementById('album-edit-btn')?.addEventListener('click', () => {
            App.showAlbumModal(album);
        });

        document.getElementById('album-delete-btn')?.addEventListener('click', async () => {
            const confirmed = await UI.showConfirm(
                'Delete Album',
                `Are you sure you want to delete "${album.title}"?`,
                { confirmText: 'Delete' }
            );
            if (confirmed) {
                await AlbumsService.delete(albumId);
                UI.showToast('Album deleted', 'success');
                Router.navigate('/albums');
            }
        });

        document.getElementById('album-add-song-btn')?.addEventListener('click', () => {
            // Show add song modal
            this.showAddToAlbumModal(albumId);
        });
    },

    /**
     * Initialize Artist Detail Page
     * @param {Object} params - Route params
     */
    async initArtistDetail(params) {
        const artistId = params.id;
        const artist = await ArtistsService.getById(artistId);

        if (!artist) {
            UI.showToast('Artist not found', 'error');
            Router.navigate('/artists');
            return;
        }

        // Get data
        const songs = await ArtistsService.getSongs(artistId);
        const albums = await ArtistsService.getAlbums(artistId);
        const stats = await ArtistsService.getStatistics(artistId);

        // Elements
        const imageEl = document.getElementById('artist-image');
        const nameEl = document.getElementById('artist-name');
        const songCountEl = document.getElementById('artist-song-count');
        const albumCountEl = document.getElementById('artist-album-count');
        const genresEl = document.getElementById('artist-genres');
        const albumsGridEl = document.getElementById('artist-albums-grid');
        const albumsEmptyEl = document.getElementById('artist-albums-empty');
        const albumsSectionEl = document.getElementById('artist-albums-section');
        const songsListEl = document.getElementById('artist-songs-list');
        const songsEmptyEl = document.getElementById('artist-songs-empty');

        // Populate data
        if (artist.image_url) {
            imageEl.innerHTML = `<img src="${artist.image_url}" alt="${Utils.sanitizeHTML(artist.name)}" class="w-full h-full object-cover">`;
        }

        nameEl.textContent = artist.name;
        songCountEl.innerHTML = `
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z"/>
            </svg>
            ${songs.length} song${songs.length !== 1 ? 's' : ''}
        `;
        albumCountEl.innerHTML = `
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>
            ${albums.length} album${albums.length !== 1 ? 's' : ''}
        `;

        // Genres
        if (stats?.genres?.length > 0) {
            genresEl.innerHTML = stats.genres.map(g => `
                <span class="px-3 py-1 bg-dark-100 dark:bg-dark-700 rounded-full text-sm">${Utils.sanitizeHTML(g)}</span>
            `).join('');
        }

        // Albums
        if (albums.length > 0) {
            albumsGridEl.innerHTML = albums.map(album => {
                const card = Components.createAlbumCard(album);
                return card.outerHTML;
            }).join('');
            albumsEmptyEl.classList.add('hidden');
        } else {
            albumsSectionEl.classList.add('hidden');
        }

        // Songs
        if (songs.length > 0) {
            songsListEl.innerHTML = songs.map(song => {
                const tr = Components.createSongListItem(song, {
                    showArtist: false,
                    showAlbum: true,
                    showDuration: true
                });
                return tr.outerHTML;
            }).join('');
            songsEmptyEl.classList.add('hidden');
            App.setupFavoriteButtons();
        } else {
            songsListEl.innerHTML = '';
            songsEmptyEl.classList.remove('hidden');
        }

        // Event listeners
        document.getElementById('artist-back-btn')?.addEventListener('click', () => Router.back());
    },

    /**
     * Initialize Folder Detail Page
     * @param {Object} params - Route params
     */
    async initFolderDetail(params) {
        const folderId = params.id;
        const folder = await FoldersService.getWithSongCount(folderId);

        if (!folder) {
            UI.showToast('Folder not found', 'error');
            Router.navigate('/folders');
            return;
        }

        // Get songs
        const songs = await FoldersService.getSongs(folderId);
        const path = await FoldersService.getPath(folderId);

        // Elements
        const iconEl = document.getElementById('folder-icon');
        const nameEl = document.getElementById('folder-name');
        const songCountEl = document.getElementById('folder-song-count');
        const breadcrumbEl = document.getElementById('folder-breadcrumb');
        const songsGridEl = document.getElementById('folder-songs-grid');
        const emptyEl = document.getElementById('folder-empty');
        const dropZoneEl = document.getElementById('folder-drop-zone');

        // Populate data
        iconEl.style.backgroundColor = `${folder.color}20`;
        iconEl.querySelector('svg').style.color = folder.color;
        nameEl.textContent = folder.name;
        songCountEl.textContent = `${songs.length} song${songs.length !== 1 ? 's' : ''}`;

        // Breadcrumb
        breadcrumbEl.innerHTML = `
            <a href="#/folders" class="hover:text-primary-500 transition-colors">Folders</a>
            ${path.map(f => `
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
                <a href="#/folders/${f.id}" class="hover:text-primary-500 transition-colors ${f.id === folderId ? 'text-dark-900 dark:text-white font-medium' : ''}">${Utils.sanitizeHTML(f.name)}</a>
            `).join('')}
        `;

        // Songs
        if (songs.length > 0) {
            songsGridEl.innerHTML = songs.map(song => UI.renderSongCard(song)).join('');
            emptyEl.classList.add('hidden');
            App.setupFavoriteButtons();
        } else {
            songsGridEl.innerHTML = '';
            emptyEl.classList.remove('hidden');
        }

        // Setup drop zone for adding songs
        DragDrop.registerDropZone(dropZoneEl, {
            accept: 'song',
            onDrop: async (data) => {
                if (data.songId) {
                    await SongsService.moveToFolder(data.songId, folderId);
                    UI.showToast('Song added to folder', 'success');
                    Router.handleRouteChange(); // Refresh
                }
            }
        });

        // Show drop zone on drag
        document.addEventListener('dragstart', (e) => {
            if (e.target.closest('[data-song-id]')) {
                dropZoneEl.classList.remove('hidden');
            }
        });
        document.addEventListener('dragend', () => {
            dropZoneEl.classList.add('hidden');
        });

        // Event listeners
        document.getElementById('folder-back-btn')?.addEventListener('click', () => Router.back());

        document.getElementById('folder-edit-btn')?.addEventListener('click', () => {
            App.showFolderModal(folder);
        });

        document.getElementById('folder-delete-btn')?.addEventListener('click', async () => {
            const confirmed = await UI.showConfirm(
                'Delete Folder',
                `Are you sure you want to delete "${folder.name}"? Songs will be moved out of this folder.`,
                { confirmText: 'Delete' }
            );
            if (confirmed) {
                await FoldersService.delete(folderId, false);
                UI.showToast('Folder deleted', 'success');
                Router.navigate('/folders');
            }
        });
    },

    /**
     * Initialize Playlist Detail Page
     * @param {Object} params - Route params
     */
    async initPlaylistDetail(params) {
        const playlistId = params.id;
        const playlist = await PlaylistsService.getById(playlistId);

        if (!playlist) {
            UI.showToast('Playlist not found', 'error');
            Router.navigate('/playlists');
            return;
        }

        // Get songs and stats
        const songs = await PlaylistsService.getSongs(playlistId);
        const stats = await PlaylistsService.getStatistics(playlistId);

        // Elements
        const coverEl = document.getElementById('playlist-cover');
        const nameEl = document.getElementById('playlist-name');
        const descriptionEl = document.getElementById('playlist-description');
        const songCountEl = document.getElementById('playlist-song-count');
        const durationEl = document.getElementById('playlist-duration');
        const songsListEl = document.getElementById('playlist-songs-list');
        const emptyEl = document.getElementById('playlist-songs-empty');

        // Populate data
        if (playlist.cover_url) {
            coverEl.innerHTML = `<img src="${playlist.cover_url}" alt="${Utils.sanitizeHTML(playlist.name)}" class="w-full h-full object-cover">`;
        }

        nameEl.textContent = playlist.name;
        if (playlist.description) {
            descriptionEl.textContent = playlist.description;
        }
        songCountEl.textContent = `${songs.length} song${songs.length !== 1 ? 's' : ''}`;
        if (stats?.totalDuration) {
            durationEl.textContent = stats.totalDuration;
        }

        // Songs
        if (songs.length > 0) {
            songsListEl.innerHTML = songs.map((song, index) => `
                <div class="playlist-song-item flex items-center gap-4 p-4 hover:bg-dark-50 dark:hover:bg-dark-750 transition-colors cursor-move" data-song-id="${song.id}" data-index="${index}" draggable="true">
                    <div class="drag-handle text-dark-400">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"/>
                        </svg>
                    </div>
                    <span class="w-6 text-center text-dark-400 text-sm">${index + 1}</span>
                    <div class="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                        ${Components.renderArtwork(song.artwork_url, song.title, 'w-full h-full', true)}
                    </div>
                    <a href="#/song/${song.id}" class="flex-1 min-w-0">
                        <p class="font-medium text-dark-900 dark:text-white truncate">${Utils.sanitizeHTML(song.title)}</p>
                        <p class="text-sm text-dark-500 truncate">${Utils.sanitizeHTML(song.artist || 'Unknown Artist')}</p>
                    </a>
                    <span class="text-sm text-dark-500 hidden sm:block">${song.duration || '-'}</span>
                    <button class="remove-from-playlist p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors text-dark-400 hover:text-red-500" data-song-id="${song.id}">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
            `).join('');
            emptyEl.classList.add('hidden');

            // Setup sortable list
            this.setupPlaylistSortable(playlistId, songsListEl);

            // Remove from playlist handlers
            songsListEl.querySelectorAll('.remove-from-playlist').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const songId = btn.dataset.songId;
                    await PlaylistsService.removeSong(playlistId, songId);
                    UI.showToast('Song removed from playlist', 'success');
                    Router.handleRouteChange(); // Refresh
                });
            });
        } else {
            songsListEl.innerHTML = '';
            emptyEl.classList.remove('hidden');
        }

        // Event listeners
        document.getElementById('playlist-back-btn')?.addEventListener('click', () => Router.back());

        const addSongsHandler = () => this.showAddToPlaylistModal(playlistId);
        document.getElementById('playlist-add-songs-btn')?.addEventListener('click', addSongsHandler);
        document.getElementById('playlist-add-first-btn')?.addEventListener('click', addSongsHandler);

        document.getElementById('playlist-edit-btn')?.addEventListener('click', () => {
            App.showPlaylistModal(playlist);
        });

        document.getElementById('playlist-delete-btn')?.addEventListener('click', async () => {
            const confirmed = await UI.showConfirm(
                'Delete Playlist',
                `Are you sure you want to delete "${playlist.name}"?`,
                { confirmText: 'Delete' }
            );
            if (confirmed) {
                await PlaylistsService.delete(playlistId);
                UI.showToast('Playlist deleted', 'success');
                Router.navigate('/playlists');
            }
        });
    },

    /**
     * Setup sortable playlist
     * @param {string} playlistId - Playlist ID
     * @param {HTMLElement} container - Songs container
     */
    setupPlaylistSortable(playlistId, container) {
        let draggedItem = null;
        let placeholder = null;

        container.addEventListener('dragstart', (e) => {
            const item = e.target.closest('.playlist-song-item');
            if (!item) return;

            draggedItem = item;
            placeholder = document.createElement('div');
            placeholder.className = 'h-16 bg-primary-100 dark:bg-primary-900/30 rounded-lg border-2 border-dashed border-primary-300 dark:border-primary-700 mx-4';

            setTimeout(() => {
                item.classList.add('opacity-50');
            }, 0);
        });

        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            const item = e.target.closest('.playlist-song-item');
            
            if (item && item !== draggedItem) {
                const rect = item.getBoundingClientRect();
                const midY = rect.top + rect.height / 2;
                
                if (e.clientY < midY) {
                    item.parentNode.insertBefore(placeholder, item);
                } else {
                    item.parentNode.insertBefore(placeholder, item.nextSibling);
                }
            }
        });

        container.addEventListener('dragend', async () => {
            if (!draggedItem) return;

            draggedItem.classList.remove('opacity-50');
            
            if (placeholder && placeholder.parentNode) {
                placeholder.parentNode.insertBefore(draggedItem, placeholder);
                placeholder.remove();
            }

            // Get new order
            const newOrder = Array.from(container.querySelectorAll('.playlist-song-item'))
                .map(item => item.dataset.songId);

            try {
                await PlaylistsService.reorderSongs(playlistId, newOrder);
            } catch (error) {
                console.error('Failed to reorder:', error);
                Router.handleRouteChange(); // Refresh to restore order
            }

            draggedItem = null;
            placeholder = null;
        });
    },

    /**
     * Show Add to Playlist Modal
     * @param {string} playlistId - Playlist ID
     */
    async showAddToPlaylistModal(playlistId) {
        const modal = UI.showModal('template-modal-add-to-playlist');
        if (!modal) return;

        const playlist = await PlaylistsService.getById(playlistId);
        const allSongs = Store.state.songs;
        const existingSongIds = new Set(playlist.song_ids || []);
        const availableSongs = allSongs.filter(s => !existingSongIds.has(s.id));

        const searchInput = modal.querySelector('#playlist-modal-search');
        const songsContainer = modal.querySelector('#playlist-modal-songs');
        const selectedCountEl = modal.querySelector('#playlist-modal-selected');
        const addBtn = modal.querySelector('#playlist-modal-add-btn');

        let selectedSongs = new Set();

        const renderSongs = (songs) => {
            if (songs.length === 0) {
                songsContainer.innerHTML = '<p class="text-center text-dark-500 py-8">No songs available to add</p>';
                return;
            }

            songsContainer.innerHTML = songs.map(song => `
                <label class="song-select-item flex items-center gap-3 p-3 rounded-lg hover:bg-dark-50 dark:hover:bg-dark-750 cursor-pointer transition-colors ${selectedSongs.has(song.id) ? 'bg-primary-50 dark:bg-primary-900/20' : ''}" data-song-id="${song.id}">
                    <input type="checkbox" class="w-5 h-5 rounded border-dark-300 text-primary-500 focus:ring-primary-500" ${selectedSongs.has(song.id) ? 'checked' : ''}>
                    <div class="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                        ${Components.renderArtwork(song.artwork_url, song.title, 'w-full h-full', true)}
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="font-medium text-dark-900 dark:text-white truncate">${Utils.sanitizeHTML(song.title)}</p>
                        <p class="text-sm text-dark-500 truncate">${Utils.sanitizeHTML(song.artist || 'Unknown Artist')}</p>
                    </div>
                </label>
            `).join('');

            // Checkbox handlers
            songsContainer.querySelectorAll('.song-select-item input').forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    const songId = e.target.closest('.song-select-item').dataset.songId;
                    if (e.target.checked) {
                        selectedSongs.add(songId);
                    } else {
                        selectedSongs.delete(songId);
                    }
                    updateSelection();
                });
            });
        };

        const updateSelection = () => {
            selectedCountEl.textContent = selectedSongs.size;
            addBtn.disabled = selectedSongs.size === 0;

            songsContainer.querySelectorAll('.song-select-item').forEach(item => {
                if (selectedSongs.has(item.dataset.songId)) {
                    item.classList.add('bg-primary-50', 'dark:bg-primary-900/20');
                } else {
                    item.classList.remove('bg-primary-50', 'dark:bg-primary-900/20');
                }
            });
        };

        // Search
        searchInput?.addEventListener('input', Utils.debounce((e) => {
            const term = e.target.value.toLowerCase();
            const filtered = availableSongs.filter(s => 
                s.title?.toLowerCase().includes(term) ||
                s.artist?.toLowerCase().includes(term)
            );
            renderSongs(filtered);
        }, 300));

        // Add button
        addBtn?.addEventListener('click', async () => {
            if (selectedSongs.size === 0) return;

            await PlaylistsService.addSongs(playlistId, Array.from(selectedSongs));
            UI.hideModal(modal);
            UI.showToast(`Added ${selectedSongs.size} song(s) to playlist`, 'success');
            Router.handleRouteChange(); // Refresh
        });

        // Initial render
        renderSongs(availableSongs);
    },

    /**
     * Show Move to Folder Modal
     * @param {string} songId - Song ID
     */
    async showMoveToFolderModal(songId) {
        const modal = UI.showModal('template-modal-move-to-folder');
        if (!modal) return;

        const folders = await FoldersService.getAll();
        const song = await SongsService.getById(songId);
        const optionsList = modal.querySelector('#folder-options-list');

        // Render folder options
        optionsList.innerHTML = folders.map(folder => `
            <button class="folder-option w-full flex items-center gap-3 p-3 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors text-left ${song?.folder_id === folder.id ? 'bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-500' : ''}" data-folder-id="${folder.id}">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background-color: ${folder.color}20">
                    <svg class="w-5 h-5" style="color: ${folder.color}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                    </svg>
                </div>
                <span class="font-medium text-dark-900 dark:text-white">${Utils.sanitizeHTML(folder.name)}</span>
                ${song?.folder_id === folder.id ? '<span class="ml-auto text-primary-500 text-sm">Current</span>' : ''}
            </button>
        `).join('');

        // Folder selection handlers
        modal.querySelectorAll('.folder-option').forEach(btn => {
            btn.addEventListener('click', async () => {
                const folderId = btn.dataset.folderId || null;
                await SongsService.moveToFolder(songId, folderId);
                UI.hideModal(modal);
                UI.showToast(folderId ? 'Song moved to folder' : 'Song removed from folder', 'success');
                
                // Refresh if on a page that shows this data
                if (Router.currentRoute?.includes('/folders/') || Router.currentRoute?.includes('/library')) {
                    Router.handleRouteChange();
                }
            });
        });

        // Create new folder
        modal.querySelector('#create-folder-from-modal')?.addEventListener('click', () => {
            UI.hideModal(modal);
            App.showFolderModal();
        });
    },

    /**
     * Show Add to Album Modal
     * @param {string} albumId - Album ID
     */
    async showAddToAlbumModal(albumId) {
        // Similar to showAddToPlaylistModal but for albums
        // Implementation follows same pattern
        UI.showToast('Add to album feature coming soon', 'info');
    }
};