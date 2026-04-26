// ============================================
// DRAG AND DROP MODULE
// ============================================

const DragDrop = {
    draggedElement: null,
    draggedData: null,
    dropZones: new Map(),

    /**
     * Initialize drag and drop
     */
    init() {
        document.addEventListener('dragstart', this.handleDragStart.bind(this));
        document.addEventListener('dragend', this.handleDragEnd.bind(this));
        document.addEventListener('dragover', this.handleDragOver.bind(this));
        document.addEventListener('drop', this.handleDrop.bind(this));
        document.addEventListener('dragleave', this.handleDragLeave.bind(this));
    },

    /**
     * Make an element draggable
     * @param {HTMLElement} element - Element to make draggable
     * @param {Object} data - Data to associate with drag
     */
    makeDraggable(element, data) {
        element.draggable = true;
        element.dataset.dragData = JSON.stringify(data);
        element.classList.add('cursor-move');
    },

    /**
     * Register a drop zone
     * @param {HTMLElement} element - Drop zone element
     * @param {Object} options - Options { accept, onDrop, onDragOver }
     */
    registerDropZone(element, options) {
        element.dataset.dropZone = 'true';
        this.dropZones.set(element, options);
    },

    /**
     * Unregister a drop zone
     * @param {HTMLElement} element - Drop zone element
     */
    unregisterDropZone(element) {
        element.removeAttribute('data-drop-zone');
        this.dropZones.delete(element);
    },

    /**
     * Handle drag start
     * @param {DragEvent} e - Drag event
     */
    handleDragStart(e) {
        const target = e.target.closest('[draggable="true"]');
        if (!target) return;

        this.draggedElement = target;
        
        try {
            this.draggedData = JSON.parse(target.dataset.dragData || '{}');
        } catch {
            this.draggedData = {};
        }

        // Set drag image
        if (target.dataset.dragImage) {
            const img = new Image();
            img.src = target.dataset.dragImage;
            e.dataTransfer.setDragImage(img, 20, 20);
        }

        // Set data transfer
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', JSON.stringify(this.draggedData));

        // Add dragging class
        target.classList.add('opacity-50', 'scale-95');
        
        // Highlight valid drop zones
        this.dropZones.forEach((options, zone) => {
            if (this.canDrop(zone, this.draggedData)) {
                zone.classList.add('ring-2', 'ring-primary-500', 'ring-dashed');
            }
        });
    },

    /**
     * Handle drag end
     * @param {DragEvent} e - Drag event
     */
    handleDragEnd(e) {
        if (this.draggedElement) {
            this.draggedElement.classList.remove('opacity-50', 'scale-95');
        }

        // Remove highlights from drop zones
        this.dropZones.forEach((options, zone) => {
            zone.classList.remove('ring-2', 'ring-primary-500', 'ring-dashed', 'bg-primary-50', 'dark:bg-primary-900/20');
        });

        this.draggedElement = null;
        this.draggedData = null;
    },

    /**
     * Handle drag over
     * @param {DragEvent} e - Drag event
     */
    handleDragOver(e) {
        const dropZone = e.target.closest('[data-drop-zone="true"]');
        if (!dropZone) return;

        const options = this.dropZones.get(dropZone);
        if (!options) return;

        if (this.canDrop(dropZone, this.draggedData)) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            dropZone.classList.add('bg-primary-50', 'dark:bg-primary-900/20');

            if (options.onDragOver) {
                options.onDragOver(e, this.draggedData);
            }
        }
    },

    /**
     * Handle drag leave
     * @param {DragEvent} e - Drag event
     */
    handleDragLeave(e) {
        const dropZone = e.target.closest('[data-drop-zone="true"]');
        if (!dropZone) return;

        // Check if we're leaving the drop zone entirely
        const rect = dropZone.getBoundingClientRect();
        if (e.clientX < rect.left || e.clientX > rect.right ||
            e.clientY < rect.top || e.clientY > rect.bottom) {
            dropZone.classList.remove('bg-primary-50', 'dark:bg-primary-900/20');
        }
    },

    /**
     * Handle drop
     * @param {DragEvent} e - Drag event
     */
    handleDrop(e) {
        const dropZone = e.target.closest('[data-drop-zone="true"]');
        if (!dropZone) return;

        const options = this.dropZones.get(dropZone);
        if (!options) return;

        if (this.canDrop(dropZone, this.draggedData)) {
            e.preventDefault();
            
            dropZone.classList.remove('bg-primary-50', 'dark:bg-primary-900/20');

            if (options.onDrop) {
                options.onDrop(this.draggedData, dropZone, e);
            }
        }
    },

    /**
     * Check if data can be dropped on zone
     * @param {HTMLElement} zone - Drop zone
     * @param {Object} data - Drag data
     * @returns {boolean}
     */
    canDrop(zone, data) {
        const options = this.dropZones.get(zone);
        if (!options) return false;

        if (options.accept) {
            if (Array.isArray(options.accept)) {
                return options.accept.includes(data.type);
            }
            return options.accept === data.type;
        }

        return true;
    },

    /**
     * Create sortable list
     * @param {HTMLElement} container - Container element
     * @param {Object} options - Options { onReorder, itemSelector }
     */
    createSortableList(container, options = {}) {
        const {
            onReorder = null,
            itemSelector = '[data-sortable-item]',
            handleSelector = '[data-sortable-handle]'
        } = options;

        let draggedItem = null;
        let placeholder = null;

        const items = container.querySelectorAll(itemSelector);
        items.forEach((item, index) => {
            item.dataset.sortableIndex = index;

            const handle = handleSelector ? item.querySelector(handleSelector) : item;
            if (handle) {
                handle.draggable = true;
                handle.classList.add('cursor-move');
            } else {
                item.draggable = true;
                item.classList.add('cursor-move');
            }
        });

        container.addEventListener('dragstart', (e) => {
            const item = e.target.closest(itemSelector);
            if (!item) return;

            draggedItem = item;
            
            // Create placeholder
            placeholder = document.createElement('div');
            placeholder.className = 'sortable-placeholder h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg border-2 border-dashed border-primary-300 dark:border-primary-700';

            setTimeout(() => {
                item.classList.add('opacity-50');
            }, 0);
        });

        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            const item = e.target.closest(itemSelector);
            
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

        container.addEventListener('dragend', (e) => {
            if (!draggedItem) return;

            draggedItem.classList.remove('opacity-50');
            
            if (placeholder && placeholder.parentNode) {
                placeholder.parentNode.insertBefore(draggedItem, placeholder);
                placeholder.remove();
            }

            // Get new order
            const newOrder = Array.from(container.querySelectorAll(itemSelector))
                .map(item => item.dataset.sortableIndex);

            if (onReorder) {
                onReorder(newOrder);
            }

            draggedItem = null;
            placeholder = null;
        });
    },

    /**
     * Create file drop zone
     * @param {HTMLElement} element - Drop zone element
     * @param {Object} options - Options { accept, onFiles, multiple }
     */
    createFileDropZone(element, options = {}) {
        const {
            accept = '*',
            onFiles = null,
            multiple = true,
            maxSize = 10 * 1024 * 1024 // 10MB default
        } = options;

        element.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            element.classList.add('border-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20');
        });

        element.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            element.classList.remove('border-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20');
        });

        element.addEventListener('drop', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            element.classList.remove('border-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20');

            const files = Array.from(e.dataTransfer.files);
            
            // Filter by accept type
            const filteredFiles = files.filter(file => {
                if (accept === '*') return true;
                const acceptTypes = accept.split(',').map(t => t.trim());
                return acceptTypes.some(type => {
                    if (type.startsWith('.')) {
                        return file.name.toLowerCase().endsWith(type.toLowerCase());
                    }
                    if (type.endsWith('/*')) {
                        return file.type.startsWith(type.replace('/*', '/'));
                    }
                    return file.type === type;
                });
            });

            // Filter by size
            const validFiles = filteredFiles.filter(file => file.size <= maxSize);

            if (validFiles.length === 0) {
                UI.showToast('No valid files to import', 'warning');
                return;
            }

            if (!multiple && validFiles.length > 1) {
                validFiles.length = 1;
            }

            if (onFiles) {
                onFiles(validFiles);
            }
        });

        // Also handle click to browse
        element.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = accept;
            input.multiple = multiple;
            
            input.addEventListener('change', () => {
                const files = Array.from(input.files).filter(f => f.size <= maxSize);
                if (files.length > 0 && onFiles) {
                    onFiles(files);
                }
            });
            
            input.click();
        });
    }
};