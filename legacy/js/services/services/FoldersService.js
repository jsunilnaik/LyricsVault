// ============================================
// FOLDERS SERVICE MODULE
// ============================================

const FoldersService = {
    /**
     * Get all folders
     * @returns {Promise<Array>}
     */
    async getAll() {
        try {
            const folders = await Database.getAll(Database.STORES.FOLDERS);
            return folders.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        } catch (error) {
            console.error('Failed to get folders:', error);
            return [];
        }
    },

    /**
     * Get folder by ID
     * @param {string} id - Folder ID
     * @returns {Promise<Object|null>}
     */
    async getById(id) {
        try {
            return await Database.get(Database.STORES.FOLDERS, id);
        } catch (error) {
            console.error('Failed to get folder:', error);
            return null;
        }
    },

    /**
     * Create a new folder
     * @param {Object} data - Folder data
     * @returns {Promise<Object>}
     */
    async create(data) {
        const validation = Validators.validateFolder(data);
        if (!validation.valid) {
            throw new Error(validation.errors[0]);
        }

        const folder = {
            id: Utils.generateUUID(),
            name: data.name.trim(),
            color: data.color || '#6366F1',
            icon: data.icon || 'folder',
            parent_id: data.parent_id || null,
            song_ids: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        await Database.put(Database.STORES.FOLDERS, folder);
        
        Store.state.folders.push(folder);
        Store.notify('folders', Store.state.folders);

        return folder;
    },

    /**
     * Update a folder
     * @param {string} id - Folder ID
     * @param {Object} data - Updated data
     * @returns {Promise<Object>}
     */
    async update(id, data) {
        const existing = await this.getById(id);
        if (!existing) {
            throw new Error('Folder not found');
        }

        const folder = {
            ...existing,
            name: data.name?.trim() ?? existing.name,
            color: data.color ?? existing.color,
            icon: data.icon ?? existing.icon,
            parent_id: data.parent_id !== undefined ? data.parent_id : existing.parent_id,
            updated_at: new Date().toISOString()
        };

        await Database.put(Database.STORES.FOLDERS, folder);

        const index = Store.state.folders.findIndex(f => f.id === id);
        if (index >= 0) {
            Store.state.folders[index] = folder;
            Store.notify('folders', Store.state.folders);
        }

        return folder;
    },

    /**
     * Delete a folder
     * @param {string} id - Folder ID
     * @param {boolean} moveSongs - Whether to move songs to parent or remove folder reference
     * @returns {Promise<void>}
     */
    async delete(id, moveSongs = false) {
        const folder = await this.getById(id);
        if (!folder) {
            throw new Error('Folder not found');
        }

        // Handle songs in folder
        const songs = await this.getSongs(id);
        for (const song of songs) {
            if (moveSongs && folder.parent_id) {
                await SongsService.update(song.id, { folder_id: folder.parent_id });
            } else {
                await SongsService.update(song.id, { folder_id: null });
            }
        }

        // Handle child folders
        const children = await this.getChildren(id);
        for (const child of children) {
            if (moveSongs && folder.parent_id) {
                await this.update(child.id, { parent_id: folder.parent_id });
            } else {
                await this.update(child.id, { parent_id: null });
            }
        }

        await Database.delete(Database.STORES.FOLDERS, id);
        
        Store.state.folders = Store.state.folders.filter(f => f.id !== id);
        Store.notify('folders', Store.state.folders);
    },

    /**
     * Get songs in folder
     * @param {string} folderId - Folder ID
     * @returns {Promise<Array>}
     */
    async getSongs(folderId) {
        return SongsService.getByFolder(folderId);
    },

    /**
     * Get child folders
     * @param {string} parentId - Parent folder ID
     * @returns {Promise<Array>}
     */
    async getChildren(parentId) {
        const folders = await this.getAll();
        return folders.filter(f => f.parent_id === parentId);
    },

    /**
     * Get root folders (no parent)
     * @returns {Promise<Array>}
     */
    async getRootFolders() {
        const folders = await this.getAll();
        return folders.filter(f => !f.parent_id);
    },

    /**
     * Get folder tree
     * @returns {Promise<Array>}
     */
    async getTree() {
        const folders = await this.getAll();
        const songs = await SongsService.getAll();

        const buildTree = (parentId = null) => {
            return folders
                .filter(f => f.parent_id === parentId)
                .map(folder => ({
                    ...folder,
                    song_count: songs.filter(s => s.folder_id === folder.id).length,
                    children: buildTree(folder.id)
                }));
        };

        return buildTree();
    },

    /**
     * Get folder path (breadcrumb)
     * @param {string} folderId - Folder ID
     * @returns {Promise<Array>}
     */
    async getPath(folderId) {
        const path = [];
        let currentId = folderId;

        while (currentId) {
            const folder = await this.getById(currentId);
            if (folder) {
                path.unshift(folder);
                currentId = folder.parent_id;
            } else {
                break;
            }
        }

        return path;
    },

    /**
     * Move folder
     * @param {string} folderId - Folder ID
     * @param {string|null} newParentId - New parent folder ID
     * @returns {Promise<Object>}
     */
    async move(folderId, newParentId) {
        // Prevent moving to self or descendant
        if (folderId === newParentId) {
            throw new Error('Cannot move folder to itself');
        }

        if (newParentId) {
            const descendants = await this.getDescendants(folderId);
            if (descendants.some(d => d.id === newParentId)) {
                throw new Error('Cannot move folder to its descendant');
            }
        }

        return this.update(folderId, { parent_id: newParentId });
    },

    /**
     * Get all descendants of a folder
     * @param {string} folderId - Folder ID
     * @returns {Promise<Array>}
     */
    async getDescendants(folderId) {
        const descendants = [];
        const children = await this.getChildren(folderId);

        for (const child of children) {
            descendants.push(child);
            const childDescendants = await this.getDescendants(child.id);
            descendants.push(...childDescendants);
        }

        return descendants;
    },

    /**
     * Get folder with song count
     * @param {string} id - Folder ID
     * @returns {Promise<Object|null>}
     */
    async getWithSongCount(id) {
        const folder = await this.getById(id);
        if (!folder) return null;

        const songs = await this.getSongs(id);
        return {
            ...folder,
            song_count: songs.length
        };
    },

    /**
     * Search folders
     * @param {string} query - Search query
     * @returns {Promise<Array>}
     */
    async search(query) {
        const folders = await this.getAll();
        const searchTerm = query.toLowerCase();
        
        return folders.filter(f => 
            f.name.toLowerCase().includes(searchTerm)
        );
    }
};