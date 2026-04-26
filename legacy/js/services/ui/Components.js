// ============================================
// UI COMPONENTS MODULE
// Reusable UI component generators
// ============================================

const Components = {
    /**
     * Create a song card element
     * @param {Object} song - Song data
     * @param {Object} options - Options
     * @returns {HTMLElement}
     */
    createSongCard(song, options = {}) {
        const {
            showArtist = true,
            showAlbum = true,
            showFavorite = true,
            showMenu = false,
            onClick = null,
            size = 'normal' // 'small', 'normal', 'large'
        } = options;

        const card = document.createElement('div');
        card.className = `song-card bg-white dark:bg-dark-800 rounded-xl shadow-soft overflow-hidden card-hover group`;
        card.dataset.songId = song.id;

        const sizeClasses = {
            small: 'p-2',
            normal: 'p-0',
            large: 'p-0'
        };

        card.innerHTML = `
            <a href="#/song/${song.id}" class="block">
                <div class="aspect-square overflow-hidden relative">
                    ${this.renderArtwork(song.artwork_url, song.title, 'w-full h-full')}
                    <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div class="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                            <svg class="w-6 h-6 text-primary-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                            </svg>
                        </div>
                    </div>
                    ${song.is_favorite ? `
                        <div class="absolute top-2 right-2">
                            <svg class="w-5 h-5 text-red-500 drop-shadow" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                            </svg>
                        </div>
                    ` : ''}
                </div>
                <div class="p-4">
                    <h3 class="font-semibold text-dark-900 dark:text-white truncate" title="${Utils.sanitizeHTML(song.title)}">${Utils.sanitizeHTML(song.title)}</h3>
                    ${showArtist ? `<p class="text-sm text-dark-500 truncate">${Utils.sanitizeHTML(song.artist || 'Unknown Artist')}</p>` : ''}
                    ${showAlbum && song.album ? `<p class="text-xs text-dark-400 truncate mt-1">${Utils.sanitizeHTML(song.album)}</p>` : ''}
                </div>
            </a>
            ${showFavorite || showMenu ? `
                <div class="px-4 pb-4 flex items-center justify-between">
                    <div class="flex items-center gap-1 flex-wrap">
                        ${(song.genre || []).slice(0, 2).map(g => `
                            <span class="px-2 py-0.5 bg-dark-100 dark:bg-dark-700 rounded-full text-xs text-dark-600 dark:text-dark-300">${Utils.sanitizeHTML(g)}</span>
                        `).join('')}
                    </div>
                    <div class="flex items-center gap-1">
                        ${showFavorite ? `
                            <button class="favorite-btn p-2 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-full transition-colors ${song.is_favorite ? 'text-red-500' : 'text-dark-400'}" data-song-id="${song.id}" aria-label="Toggle favorite">
                                <svg class="w-5 h-5" fill="${song.is_favorite ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                                </svg>
                            </button>
                        ` : ''}
                        ${showMenu ? `
                            <button class="menu-btn p-2 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-full transition-colors text-dark-400" data-song-id="${song.id}" aria-label="More options">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
                                </svg>
                            </button>
                        ` : ''}
                    </div>
                </div>
            ` : ''}
        `;

        if (onClick) {
            card.querySelector('a').addEventListener('click', (e) => {
                e.preventDefault();
                onClick(song);
            });
        }

        return card;
    },

    /**
     * Create a song list item
     * @param {Object} song - Song data
     * @param {Object} options - Options
     * @returns {HTMLElement}
     */
    createSongListItem(song, options = {}) {
        const {
            showArtist = true,
            showAlbum = true,
            showDuration = true,
            showActions = true,
            draggable = false,
            index = null
        } = options;

        const tr = document.createElement('tr');
        tr.className = 'song-row hover:bg-dark-50 dark:hover:bg-dark-750 transition-colors';
        tr.dataset.songId = song.id;
        
        if (draggable) {
            tr.draggable = true;
            tr.classList.add('cursor-move');
        }

        tr.innerHTML = `
            ${index !== null ? `<td class="px-4 py-3 text-dark-400 text-sm w-12">${index + 1}</td>` : ''}
            <td class="px-4 py-3">
                <a href="#/song/${song.id}" class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                        ${this.renderArtwork(song.artwork_url, song.title, 'w-full h-full', true)}
                    </div>
                    <div class="min-w-0">
                        <p class="font-medium text-dark-900 dark:text-white truncate">${Utils.sanitizeHTML(song.title)}</p>
                        ${showArtist ? `<p class="text-sm text-dark-500 truncate md:hidden">${Utils.sanitizeHTML(song.artist || 'Unknown')}</p>` : ''}
                    </div>
                </a>
            </td>
            ${showArtist ? `<td class="px-4 py-3 text-dark-600 dark:text-dark-400 hidden md:table-cell">${Utils.sanitizeHTML(song.artist || '-')}</td>` : ''}
            ${showAlbum ? `<td class="px-4 py-3 text-dark-600 dark:text-dark-400 hidden lg:table-cell">${Utils.sanitizeHTML(song.album || '-')}</td>` : ''}
            ${showDuration ? `<td class="px-4 py-3 text-dark-500 text-sm hidden lg:table-cell">${song.duration || '-'}</td>` : ''}
            ${showActions ? `
                <td class="px-4 py-3 text-right">
                    <div class="flex items-center justify-end gap-1">
                        <button class="favorite-btn p-2 hover:bg-dark-100 dark:hover:bg-dark-700 rounded transition-colors ${song.is_favorite ? 'text-red-500' : 'text-dark-400'}" data-song-id="${song.id}">
                            <svg class="w-4 h-4" fill="${song.is_favorite ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                            </svg>
                        </button>
                        <button class="menu-btn p-2 hover:bg-dark-100 dark:hover:bg-dark-700 rounded transition-colors text-dark-500" data-song-id="${song.id}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
                            </svg>
                        </button>
                    </div>
                </td>
            ` : ''}
        `;

        return tr;
    },

    /**
     * Render artwork or placeholder
     * @param {string} artworkUrl - Artwork URL
     * @param {string} alt - Alt text
     * @param {string} className - CSS classes
     * @param {boolean} small - Small placeholder icon
     * @returns {string} HTML
     */
    renderArtwork(artworkUrl, alt, className = '', small = false) {
        if (artworkUrl) {
            return `<img src="${artworkUrl}" alt="${Utils.sanitizeHTML(alt)}" class="${className} object-cover" loading="lazy">`;
        }
        
        const iconSize = small ? 'w-5 h-5' : 'w-12 h-12';
        return `
            <div class="${className} bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center">
                <svg class="${iconSize} text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
                </svg>
            </div>
        `;
    },

    /**
     * Create folder card
     * @param {Object} folder - Folder data
     * @param {number} songCount - Number of songs
     * @returns {HTMLElement}
     */
    createFolderCard(folder, songCount = 0) {
        const card = document.createElement('a');
        card.href = `#/folders/${folder.id}`;
        card.className = 'block bg-white dark:bg-dark-800 rounded-xl shadow-soft p-4 card-hover';
        card.dataset.folderId = folder.id;

        card.innerHTML = `
            <div class="w-12 h-12 rounded-lg flex items-center justify-center mb-3" style="background-color: ${folder.color}20">
                <svg class="w-6 h-6" style="color: ${folder.color}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                </svg>
            </div>
            <h3 class="font-semibold text-dark-900 dark:text-white truncate">${Utils.sanitizeHTML(folder.name)}</h3>
            <p class="text-sm text-dark-500">${songCount} song${songCount !== 1 ? 's' : ''}</p>
        `;

        return card;
    },

    /**
     * Create playlist card
     * @param {Object} playlist - Playlist data
     * @returns {HTMLElement}
     */
    createPlaylistCard(playlist) {
        const songCount = (playlist.song_ids || []).length;
        const card = document.createElement('a');
        card.href = `#/playlists/${playlist.id}`;
        card.className = 'block bg-white dark:bg-dark-800 rounded-xl shadow-soft overflow-hidden card-hover';
        card.dataset.playlistId = playlist.id;

        card.innerHTML = `
            <div class="aspect-square overflow-hidden">
                ${playlist.cover_url 
                    ? `<img src="${playlist.cover_url}" alt="${Utils.sanitizeHTML(playlist.name)}" class="w-full h-full object-cover">`
                    : `<div class="w-full h-full bg-gradient-to-br from-primary-400 via-secondary-400 to-accent-400 flex items-center justify-center">
                         <svg class="w-16 h-16 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                         </svg>
                       </div>`
                }
            </div>
            <div class="p-4">
                <h3 class="font-semibold text-dark-900 dark:text-white truncate">${Utils.sanitizeHTML(playlist.name)}</h3>
                <p class="text-sm text-dark-500">${songCount} song${songCount !== 1 ? 's' : ''}</p>
                ${playlist.description ? `<p class="text-xs text-dark-400 truncate mt-1">${Utils.sanitizeHTML(playlist.description)}</p>` : ''}
            </div>
        `;

        return card;
    },

    /**
     * Create album card
     * @param {Object} album - Album data
     * @param {number} songCount - Number of songs
     * @returns {HTMLElement}
     */
    createAlbumCard(album, songCount = 0) {
        const card = document.createElement('a');
        card.href = `#/albums/${album.id}`;
        card.className = 'block bg-white dark:bg-dark-800 rounded-xl shadow-soft overflow-hidden card-hover';
        card.dataset.albumId = album.id;

        card.innerHTML = `
            <div class="aspect-square overflow-hidden">
                ${album.artwork_url 
                    ? `<img src="${album.artwork_url}" alt="${Utils.sanitizeHTML(album.title)}" class="w-full h-full object-cover">`
                    : `<div class="w-full h-full bg-gradient-to-br from-accent-400 to-primary-500 flex items-center justify-center">
                         <svg class="w-16 h-16 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                         </svg>
                       </div>`
                }
            </div>
            <div class="p-4">
                <h3 class="font-semibold text-dark-900 dark:text-white truncate">${Utils.sanitizeHTML(album.title)}</h3>
                <p class="text-sm text-dark-500 truncate">${Utils.sanitizeHTML(album.artist)}</p>
                <p class="text-xs text-dark-400 mt-1">${album.year || ''} ${album.year && songCount ? '•' : ''} ${songCount ? `${songCount} song${songCount !== 1 ? 's' : ''}` : ''}</p>
            </div>
        `;

        return card;
    },

    /**
     * Create artist card
     * @param {Object} artist - Artist data
     * @returns {HTMLElement}
     */
    createArtistCard(artist) {
        const card = document.createElement('a');
        card.href = `#/artists/${artist.id}`;
        card.className = 'block bg-white dark:bg-dark-800 rounded-xl shadow-soft p-4 text-center card-hover';
        card.dataset.artistId = artist.id;

        card.innerHTML = `
            <div class="w-20 h-20 mx-auto rounded-full overflow-hidden mb-3">
                ${artist.image_url 
                    ? `<img src="${artist.image_url}" alt="${Utils.sanitizeHTML(artist.name)}" class="w-full h-full object-cover">`
                    : `<div class="w-full h-full bg-gradient-to-br from-secondary-400 to-primary-500 flex items-center justify-center">
                         <svg class="w-10 h-10 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                         </svg>
                       </div>`
                }
            </div>
            <h3 class="font-semibold text-dark-900 dark:text-white truncate">${Utils.sanitizeHTML(artist.name)}</h3>
            <p class="text-sm text-dark-500">${artist.song_count || 0} song${artist.song_count !== 1 ? 's' : ''}</p>
        `;

        return card;
    },

    /**
     * Create search suggestion item
     * @param {Object} suggestion - Suggestion data
     * @returns {HTMLElement}
     */
    createSearchSuggestion(suggestion) {
        const item = document.createElement('button');
        item.className = 'w-full flex items-center gap-3 px-4 py-2 hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors text-left';
        item.dataset.type = suggestion.type;
        item.dataset.id = suggestion.id;

        const icons = {
            song: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg>`,
            artist: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>`,
            album: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>`
        };

        item.innerHTML = `
            <span class="text-dark-400">${icons[suggestion.type] || icons.song}</span>
            <div class="flex-1 min-w-0">
                <p class="font-medium text-dark-900 dark:text-white truncate">${Utils.sanitizeHTML(suggestion.text)}</p>
                ${suggestion.subtext ? `<p class="text-xs text-dark-500 truncate">${Utils.sanitizeHTML(suggestion.subtext)}</p>` : ''}
            </div>
            <span class="text-xs text-dark-400 capitalize">${suggestion.type}</span>
        `;

        return item;
    },

    /**
     * Create empty state
     * @param {Object} options - Options
     * @returns {HTMLElement}
     */
    createEmptyState(options = {}) {
        const {
            icon = 'music',
            title = 'No items',
            description = '',
            actionText = '',
            actionHref = '',
            onAction = null
        } = options;

        const icons = {
            music: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>`,
            search: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>`,
            heart: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>`,
            folder: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>`,
            playlist: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>`
        };

        const container = document.createElement('div');
        container.className = 'text-center py-16 bg-white dark:bg-dark-800 rounded-xl';

        container.innerHTML = `
            <svg class="w-20 h-20 mx-auto text-dark-300 dark:text-dark-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                ${icons[icon] || icons.music}
            </svg>
            <h3 class="text-xl font-medium text-dark-900 dark:text-white mb-2">${Utils.sanitizeHTML(title)}</h3>
            ${description ? `<p class="text-dark-500 dark:text-dark-400 mb-6">${Utils.sanitizeHTML(description)}</p>` : ''}
            ${actionText ? `
                <${actionHref ? 'a href="' + actionHref + '"' : 'button'} class="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors font-medium">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                    </svg>
                    ${Utils.sanitizeHTML(actionText)}
                </${actionHref ? 'a' : 'button'}>
            ` : ''}
        `;

        if (onAction && !actionHref) {
            const button = container.querySelector('button');
            if (button) {
                button.addEventListener('click', onAction);
            }
        }

        return container;
    },

    /**
     * Create loading skeleton
     * @param {string} type - Skeleton type
     * @param {number} count - Number of skeletons
     * @returns {string} HTML
     */
    createSkeletons(type = 'card', count = 4) {
        const skeletons = {
            card: `
                <div class="bg-white dark:bg-dark-800 rounded-xl shadow-soft overflow-hidden">
                    <div class="aspect-square skeleton"></div>
                    <div class="p-4 space-y-2">
                        <div class="h-5 skeleton rounded w-3/4"></div>
                        <div class="h-4 skeleton rounded w-1/2"></div>
                    </div>
                </div>
            `,
            listItem: `
                <tr>
                    <td class="px-4 py-3">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded skeleton"></div>
                            <div class="h-4 skeleton rounded w-32"></div>
                        </div>
                    </td>
                    <td class="px-4 py-3 hidden md:table-cell"><div class="h-4 skeleton rounded w-24"></div></td>
                    <td class="px-4 py-3 hidden lg:table-cell"><div class="h-4 skeleton rounded w-20"></div></td>
                    <td class="px-4 py-3"><div class="h-4 skeleton rounded w-12 ml-auto"></div></td>
                </tr>
            `,
            artist: `
                <div class="bg-white dark:bg-dark-800 rounded-xl shadow-soft p-4 text-center">
                    <div class="w-20 h-20 mx-auto rounded-full skeleton mb-3"></div>
                    <div class="h-5 skeleton rounded w-24 mx-auto mb-2"></div>
                    <div class="h-4 skeleton rounded w-16 mx-auto"></div>
                </div>
            `
        };

        return Array(count).fill(skeletons[type] || skeletons.card).join('');
    },

    /**
     * Create context menu
     * @param {Array} items - Menu items
     * @param {Object} position - Position { x, y }
     * @returns {HTMLElement}
     */
    createContextMenu(items, position) {
        // Remove existing context menus
        document.querySelectorAll('.context-menu').forEach(m => m.remove());

        const menu = document.createElement('div');
        menu.className = 'context-menu fixed bg-white dark:bg-dark-800 rounded-lg shadow-xl border border-dark-200 dark:border-dark-700 py-1 z-100 animate-scale-in';
        menu.style.left = `${position.x}px`;
        menu.style.top = `${position.y}px`;

        items.forEach(item => {
            if (item.divider) {
                const divider = document.createElement('hr');
                divider.className = 'my-1 border-dark-200 dark:border-dark-700';
                menu.appendChild(divider);
            } else {
                const button = document.createElement('button');
                button.className = `w-full px-4 py-2 text-left text-sm flex items-center gap-3 hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors ${item.danger ? 'text-red-500' : 'text-dark-700 dark:text-dark-300'}`;
                button.innerHTML = `
                    ${item.icon || ''}
                    <span>${Utils.sanitizeHTML(item.label)}</span>
                `;
                button.addEventListener('click', () => {
                    menu.remove();
                    if (item.action) item.action();
                });
                menu.appendChild(button);
            }
        });

        // Adjust position if off-screen
        document.body.appendChild(menu);
        const rect = menu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            menu.style.left = `${position.x - rect.width}px`;
        }
        if (rect.bottom > window.innerHeight) {
            menu.style.top = `${position.y - rect.height}px`;
        }

        // Close on click outside
        const closeHandler = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeHandler);
            }
        };
        setTimeout(() => document.addEventListener('click', closeHandler), 0);

        return menu;
    },

    /**
     * Create tag input component
     * @param {HTMLElement} container - Container element
     * @param {Array} initialTags - Initial tags
     * @param {Object} options - Options
     * @returns {Object} Tag input API
     */
    createTagInput(container, initialTags = [], options = {}) {
        const {
            placeholder = 'Add tag...',
            suggestions = [],
            maxTags = 10,
            onChange = null
        } = options;

        let tags = [...initialTags];

        const render = () => {
            container.innerHTML = `
                ${tags.map(tag => `
                    <span class="tag inline-flex items-center gap-1 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm">
                        ${Utils.sanitizeHTML(tag)}
                        <button type="button" class="hover:text-red-500 transition-colors" data-tag="${Utils.sanitizeHTML(tag)}">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </span>
                `).join('')}
                <input type="text" class="flex-1 min-w-[100px] bg-transparent border-none outline-none text-sm" placeholder="${tags.length >= maxTags ? 'Max tags reached' : placeholder}" ${tags.length >= maxTags ? 'disabled' : ''}>
            `;

            // Remove tag handlers
            container.querySelectorAll('.tag button').forEach(btn => {
                btn.addEventListener('click', () => {
                    const tag = btn.dataset.tag;
                    tags = tags.filter(t => t !== tag);
                    render();
                    if (onChange) onChange(tags);
                });
            });

            // Input handler
            const input = container.querySelector('input');
            input.addEventListener('keydown', (e) => {
                if ((e.key === 'Enter' || e.key === ',') && input.value.trim()) {
                    e.preventDefault();
                    const newTag = input.value.trim().replace(',', '');
                    if (newTag && !tags.includes(newTag) && tags.length < maxTags) {
                        tags.push(newTag);
                        input.value = '';
                        render();
                        if (onChange) onChange(tags);
                    }
                } else if (e.key === 'Backspace' && !input.value && tags.length > 0) {
                    tags.pop();
                    render();
                    if (onChange) onChange(tags);
                }
            });
        };

        render();

        return {
            getTags: () => [...tags],
            setTags: (newTags) => {
                tags = [...newTags];
                render();
            },
            addTag: (tag) => {
                if (!tags.includes(tag) && tags.length < maxTags) {
                    tags.push(tag);
                    render();
                    if (onChange) onChange(tags);
                }
            },
            removeTag: (tag) => {
                tags = tags.filter(t => t !== tag);
                render();
                if (onChange) onChange(tags);
            },
            clear: () => {
                tags = [];
                render();
                if (onChange) onChange(tags);
            }
        };
    }
};