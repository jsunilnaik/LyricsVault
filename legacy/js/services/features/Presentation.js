// ============================================
// PRESENTATION MODE MODULE
// Karaoke/Presentation mode for lyrics
// ============================================

const PresentationMode = {
    isActive: false,
    currentSong: null,
    currentLine: 0,
    lines: [],
    autoScrollInterval: null,
    scrollSpeed: 5,
    container: null,

    /**
     * Enter presentation mode
     * @param {Object} song - Song to present
     */
    async enter(song) {
        if (!song) return;

        this.currentSong = song;
        this.currentLine = 0;
        this.lines = this.parseLines(song.lyrics);
        this.isActive = true;

        // Create presentation container
        this.container = document.createElement('div');
        this.container.id = 'presentation-container';
        this.container.className = 'fixed inset-0 z-100 bg-dark-900 flex flex-col';

        this.container.innerHTML = `
            <!-- Header -->
            <div class="presentation-header flex items-center justify-between px-6 py-4 bg-dark-800/50 backdrop-blur">
                <div>
                    <h1 class="text-xl font-bold text-white">${Utils.sanitizeHTML(song.title)}</h1>
                    <p class="text-dark-400">${Utils.sanitizeHTML(song.artist || 'Unknown Artist')}</p>
                </div>
                <button id="presentation-exit" class="p-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-white transition-colors">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>
            
            <!-- Lyrics Display -->
            <div id="presentation-lyrics" class="flex-1 overflow-hidden flex items-center justify-center px-8">
                <div class="text-center max-w-4xl">
                    <p id="presentation-prev-line" class="text-2xl text-dark-500 mb-4 transition-all duration-300"></p>
                    <p id="presentation-current-line" class="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 transition-all duration-300"></p>
                    <p id="presentation-next-line" class="text-2xl text-dark-500 transition-all duration-300"></p>
                </div>
            </div>
            
            <!-- Controls -->
            <div class="presentation-controls px-6 py-4 bg-dark-800/50 backdrop-blur">
                <div class="flex items-center justify-center gap-4">
                    <!-- Previous -->
                    <button id="presentation-prev" class="p-3 rounded-full bg-dark-700 hover:bg-dark-600 text-white transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                        </svg>
                    </button>
                    
                    <!-- Play/Pause Auto-scroll -->
                    <button id="presentation-play" class="p-4 rounded-full bg-primary-500 hover:bg-primary-600 text-white transition-colors">
                        <svg class="w-8 h-8 play-icon" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                        <svg class="w-8 h-8 pause-icon hidden" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                        </svg>
                    </button>
                    
                    <!-- Next -->
                    <button id="presentation-next" class="p-3 rounded-full bg-dark-700 hover:bg-dark-600 text-white transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                        </svg>
                    </button>
                </div>
                
                <!-- Progress -->
                <div class="mt-4 flex items-center justify-center gap-4">
                    <span class="text-dark-400 text-sm" id="presentation-progress">1 / ${this.lines.length}</span>
                    <input type="range" id="presentation-speed" min="1" max="10" value="${this.scrollSpeed}" class="w-32">
                    <span class="text-dark-400 text-sm">Speed</span>
                </div>
            </div>
        `;

        document.body.appendChild(this.container);
        document.body.classList.add('overflow-hidden');

        this.setupEventListeners();
        this.updateDisplay();

        // Request fullscreen
        if (this.container.requestFullscreen) {
            try {
                                await this.container.requestFullscreen();
            } catch (err) {
                console.log('Fullscreen not available');
            }
        }
    },

    /**
     * Exit presentation mode
     */
    exit() {
        this.isActive = false;
        this.stopAutoScroll();

        if (document.fullscreenElement) {
            document.exitFullscreen();
        }

        if (this.container) {
            this.container.remove();
            this.container = null;
        }

        document.body.classList.remove('overflow-hidden');
        this.currentSong = null;
        this.currentLine = 0;
        this.lines = [];
    },

    /**
     * Parse lyrics into lines
     * @param {string} lyrics - Lyrics text
     * @returns {Array}
     */
    parseLines(lyrics) {
        if (!lyrics) return [];
        
        return lyrics
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Exit button
        this.container.querySelector('#presentation-exit')?.addEventListener('click', () => {
            this.exit();
        });

        // Previous line
        this.container.querySelector('#presentation-prev')?.addEventListener('click', () => {
            this.prevLine();
        });

        // Next line
        this.container.querySelector('#presentation-next')?.addEventListener('click', () => {
            this.nextLine();
        });

        // Play/Pause
        this.container.querySelector('#presentation-play')?.addEventListener('click', () => {
            this.toggleAutoScroll();
        });

        // Speed control
        this.container.querySelector('#presentation-speed')?.addEventListener('input', (e) => {
            this.scrollSpeed = parseInt(e.target.value);
            if (this.autoScrollInterval) {
                this.stopAutoScroll();
                this.startAutoScroll();
            }
        });

        // Keyboard controls
        this.keyHandler = (e) => {
            if (!this.isActive) return;

            switch (e.key) {
                case 'Escape':
                    this.exit();
                    break;
                case 'ArrowLeft':
                case 'ArrowUp':
                    this.prevLine();
                    break;
                case 'ArrowRight':
                case 'ArrowDown':
                case ' ':
                    e.preventDefault();
                    this.nextLine();
                    break;
                case 'p':
                case 'P':
                    this.toggleAutoScroll();
                    break;
            }
        };
        document.addEventListener('keydown', this.keyHandler);

        // Touch swipe support
        let touchStartY = 0;
        this.container.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
        });

        this.container.addEventListener('touchend', (e) => {
            const touchEndY = e.changedTouches[0].clientY;
            const diff = touchStartY - touchEndY;

            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    this.nextLine();
                } else {
                    this.prevLine();
                }
            }
        });

        // Click on lyrics to advance
        this.container.querySelector('#presentation-lyrics')?.addEventListener('click', () => {
            this.nextLine();
        });
    },

    /**
     * Update the display
     */
    updateDisplay() {
        const prevLineEl = this.container?.querySelector('#presentation-prev-line');
        const currentLineEl = this.container?.querySelector('#presentation-current-line');
        const nextLineEl = this.container?.querySelector('#presentation-next-line');
        const progressEl = this.container?.querySelector('#presentation-progress');

        if (!currentLineEl) return;

        // Get lines
        const prevLine = this.lines[this.currentLine - 1] || '';
        const currentLine = this.lines[this.currentLine] || '';
        const nextLine = this.lines[this.currentLine + 1] || '';

        // Check if it's a section marker
        const isSection = currentLine.match(/^\[.*\]$/);

        // Update display with animation
        currentLineEl.classList.add('scale-95', 'opacity-0');
        
        setTimeout(() => {
            if (prevLineEl) prevLineEl.textContent = prevLine;
            currentLineEl.textContent = currentLine;
            if (nextLineEl) nextLineEl.textContent = nextLine;

            // Style section markers differently
            if (isSection) {
                currentLineEl.classList.add('text-primary-400');
                currentLineEl.classList.remove('text-white');
            } else {
                currentLineEl.classList.remove('text-primary-400');
                currentLineEl.classList.add('text-white');
            }

            currentLineEl.classList.remove('scale-95', 'opacity-0');
        }, 150);

        // Update progress
        if (progressEl) {
            progressEl.textContent = `${this.currentLine + 1} / ${this.lines.length}`;
        }
    },

    /**
     * Go to next line
     */
    nextLine() {
        if (this.currentLine < this.lines.length - 1) {
            this.currentLine++;
            this.updateDisplay();
        } else if (this.autoScrollInterval) {
            this.stopAutoScroll();
        }
    },

    /**
     * Go to previous line
     */
    prevLine() {
        if (this.currentLine > 0) {
            this.currentLine--;
            this.updateDisplay();
        }
    },

    /**
     * Go to specific line
     * @param {number} index - Line index
     */
    goToLine(index) {
        if (index >= 0 && index < this.lines.length) {
            this.currentLine = index;
            this.updateDisplay();
        }
    },

    /**
     * Start auto-scroll
     */
    startAutoScroll() {
        if (this.autoScrollInterval) return;

        const interval = Math.max(500, 3000 - (this.scrollSpeed * 250));
        
        this.autoScrollInterval = setInterval(() => {
            this.nextLine();
        }, interval);

        // Update UI
        const playBtn = this.container?.querySelector('#presentation-play');
        if (playBtn) {
            playBtn.querySelector('.play-icon')?.classList.add('hidden');
            playBtn.querySelector('.pause-icon')?.classList.remove('hidden');
        }
    },

    /**
     * Stop auto-scroll
     */
    stopAutoScroll() {
        if (this.autoScrollInterval) {
            clearInterval(this.autoScrollInterval);
            this.autoScrollInterval = null;
        }

        // Update UI
        const playBtn = this.container?.querySelector('#presentation-play');
        if (playBtn) {
            playBtn.querySelector('.play-icon')?.classList.remove('hidden');
            playBtn.querySelector('.pause-icon')?.classList.add('hidden');
        }
    },

    /**
     * Toggle auto-scroll
     */
    toggleAutoScroll() {
        if (this.autoScrollInterval) {
            this.stopAutoScroll();
        } else {
            this.startAutoScroll();
        }
    },

    /**
     * Set scroll speed
     * @param {number} speed - Speed 1-10
     */
    setSpeed(speed) {
        this.scrollSpeed = Math.max(1, Math.min(10, speed));
        const speedInput = this.container?.querySelector('#presentation-speed');
        if (speedInput) {
            speedInput.value = this.scrollSpeed;
        }

        if (this.autoScrollInterval) {
            this.stopAutoScroll();
            this.startAutoScroll();
        }
    }
};