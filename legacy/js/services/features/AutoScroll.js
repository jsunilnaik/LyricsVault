// ============================================
// AUTO-SCROLL MODULE
// Smooth auto-scrolling for lyrics display
// ============================================

const AutoScroll = {
    isScrolling: false,
    scrollSpeed: 5,
    animationId: null,
    container: null,
    startTime: null,
    pausedAt: null,

    /**
     * Initialize auto-scroll for a container
     * @param {HTMLElement} container - Scrollable container
     * @param {Object} options - Options
     */
    init(container, options = {}) {
        const {
            speed = 5,
            onStart = null,
            onStop = null,
            onComplete = null
        } = options;

        this.container = container;
        this.scrollSpeed = speed;
        this.onStart = onStart;
        this.onStop = onStop;
        this.onComplete = onComplete;
    },

    /**
     * Start scrolling
     */
    start() {
        if (this.isScrolling || !this.container) return;

        this.isScrolling = true;
        this.startTime = performance.now() - (this.pausedAt || 0);
        this.pausedAt = null;

        if (this.onStart) this.onStart();

        this.scroll();
    },

    /**
     * Stop scrolling
     */
    stop() {
        if (!this.isScrolling) return;

        this.isScrolling = false;
        this.pausedAt = performance.now() - this.startTime;

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        if (this.onStop) this.onStop();
    },

    /**
     * Toggle scrolling
     */
    toggle() {
        if (this.isScrolling) {
            this.stop();
        } else {
            this.start();
        }
    },

    /**
     * Reset scrolling
     */
    reset() {
        this.stop();
        this.pausedAt = null;
        if (this.container) {
            this.container.scrollTop = 0;
        }
    },

    /**
     * Perform scroll animation
     */
    scroll() {
        if (!this.isScrolling || !this.container) return;

        const maxScroll = this.container.scrollHeight - this.container.clientHeight;
        
        if (this.container.scrollTop >= maxScroll) {
            this.stop();
            if (this.onComplete) this.onComplete();
            return;
        }

        // Calculate scroll amount based on speed
        const pixelsPerFrame = (this.scrollSpeed * 0.5) / 60; // Smooth 60fps
        this.container.scrollTop += pixelsPerFrame;

        this.animationId = requestAnimationFrame(() => this.scroll());
    },

    /**
     * Set scroll speed
     * @param {number} speed - Speed 1-10
     */
    setSpeed(speed) {
        this.scrollSpeed = Math.max(1, Math.min(10, speed));
    },

    /**
     * Scroll to specific position
     * @param {number} position - Scroll position
     * @param {boolean} smooth - Use smooth scroll
     */
    scrollTo(position, smooth = true) {
        if (!this.container) return;

        if (smooth) {
            this.container.scrollTo({
                top: position,
                behavior: 'smooth'
            });
        } else {
            this.container.scrollTop = position;
        }
    },

    /**
     * Scroll to element
     * @param {HTMLElement} element - Element to scroll to
     * @param {string} position - 'start', 'center', 'end'
     */
    scrollToElement(element, position = 'center') {
        if (!this.container || !element) return;

        element.scrollIntoView({
            behavior: 'smooth',
            block: position
        });
    },

    /**
     * Get scroll progress (0-1)
     * @returns {number}
     */
    getProgress() {
        if (!this.container) return 0;
        
        const maxScroll = this.container.scrollHeight - this.container.clientHeight;
        if (maxScroll <= 0) return 1;
        
        return this.container.scrollTop / maxScroll;
    },

    /**
     * Set scroll progress (0-1)
     * @param {number} progress - Progress value
     */
    setProgress(progress) {
        if (!this.container) return;
        
        const maxScroll = this.container.scrollHeight - this.container.clientHeight;
        this.container.scrollTop = maxScroll * Math.max(0, Math.min(1, progress));
    }
};