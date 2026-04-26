// ============================================
// ACCESSIBILITY MODULE
// WCAG 2.1 AA compliance helpers
// ============================================

const Accessibility = {
    /**
     * Initialize accessibility features
     */
    init() {
        this.setupKeyboardNavigation();
        this.setupFocusManagement();
        this.setupAnnouncements();
        this.checkReducedMotion();
        this.setupHighContrast();
    },

    /**
     * Setup keyboard navigation
     */
    setupKeyboardNavigation() {
        // Roving tabindex for lists
        document.addEventListener('keydown', (e) => {
            const list = e.target.closest('[role="listbox"], [role="menu"], [role="grid"]');
            if (!list) return;

            const items = list.querySelectorAll('[role="option"], [role="menuitem"], [role="gridcell"]');
            if (items.length === 0) return;

            const currentIndex = Array.from(items).indexOf(e.target);
            let newIndex = currentIndex;

            switch (e.key) {
                case 'ArrowDown':
                case 'ArrowRight':
                    e.preventDefault();
                    newIndex = (currentIndex + 1) % items.length;
                    break;
                case 'ArrowUp':
                case 'ArrowLeft':
                    e.preventDefault();
                    newIndex = (currentIndex - 1 + items.length) % items.length;
                    break;
                case 'Home':
                    e.preventDefault();
                    newIndex = 0;
                    break;
                case 'End':
                    e.preventDefault();
                    newIndex = items.length - 1;
                    break;
            }

            if (newIndex !== currentIndex) {
                items[currentIndex]?.setAttribute('tabindex', '-1');
                items[newIndex]?.setAttribute('tabindex', '0');
                items[newIndex]?.focus();
            }
        });
    },

    /**
     * Setup focus management
     */
    setupFocusManagement() {
        // Track last focused element before modal opens
        let lastFocusedElement = null;

        document.addEventListener('focusin', (e) => {
            const modal = e.target.closest('.modal-wrapper');
            if (!modal) {
                lastFocusedElement = e.target;
            }
        });

        // Focus trap for modals
        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Tab') return;

            const modal = document.querySelector('.modal-wrapper');
            if (!modal) return;

            const focusable = modal.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            
            if (focusable.length === 0) return;

            const firstFocusable = focusable[0];
            const lastFocusable = focusable[focusable.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    e.preventDefault();
                    lastFocusable.focus();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    e.preventDefault();
                    firstFocusable.focus();
                }
            }
        });

        // Restore focus when modal closes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.removedNodes.forEach((node) => {
                    if (node.classList?.contains('modal-wrapper') && lastFocusedElement) {
                        lastFocusedElement.focus();
                    }
                });
            });
        });

        const modalsContainer = document.getElementById('modals-container');
        if (modalsContainer) {
            observer.observe(modalsContainer, { childList: true });
        }
    },

    /**
     * Setup live announcements for screen readers
     */
    setupAnnouncements() {
        // Create announcement container
        if (!document.getElementById('aria-announcements')) {
            const announcer = document.createElement('div');
            announcer.id = 'aria-announcements';
            announcer.setAttribute('aria-live', 'polite');
            announcer.setAttribute('aria-atomic', 'true');
            announcer.className = 'sr-only';
            announcer.style.cssText = `
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                white-space: nowrap;
                border: 0;
            `;
            document.body.appendChild(announcer);
        }
    },

    /**
     * Announce message to screen readers
     * @param {string} message - Message to announce
     * @param {string} priority - 'polite' or 'assertive'
     */
    announce(message, priority = 'polite') {
        const announcer = document.getElementById('aria-announcements');
        if (!announcer) return;

        announcer.setAttribute('aria-live', priority);
        announcer.textContent = '';
        
        // Use setTimeout to ensure the change is announced
        setTimeout(() => {
            announcer.textContent = message;
        }, 100);
    },

    /**
     * Check and apply reduced motion preference
     */
    checkReducedMotion() {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const userPreference = Store.state.settings.reduceMotion;

        if (prefersReducedMotion || userPreference) {
            document.body.classList.add('reduce-motion');
        } else {
            document.body.classList.remove('reduce-motion');
        }

        // Listen for system preference changes
        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
            if (e.matches || Store.state.settings.reduceMotion) {
                document.body.classList.add('reduce-motion');
            } else {
                document.body.classList.remove('reduce-motion');
            }
        });
    },

    /**
     * Setup high contrast mode
     */
    setupHighContrast() {
        if (Store.state.settings.highContrast) {
            document.body.classList.add('high-contrast');
        }
    },

    /**
     * Toggle high contrast mode
     * @param {boolean} enabled - Enable/disable
     */
    setHighContrast(enabled) {
        if (enabled) {
            document.body.classList.add('high-contrast');
        } else {
            document.body.classList.remove('high-contrast');
        }
        Store.updateSetting('highContrast', enabled);
    },

    /**
     * Toggle reduced motion
     * @param {boolean} enabled - Enable/disable
     */
    setReducedMotion(enabled) {
        if (enabled) {
            document.body.classList.add('reduce-motion');
        } else {
            document.body.classList.remove('reduce-motion');
        }
        Store.updateSetting('reduceMotion', enabled);
    },

    /**
     * Get color contrast ratio
     * @param {string} foreground - Foreground color (hex)
     * @param {string} background - Background color (hex)
     * @returns {number} Contrast ratio
     */
    getContrastRatio(foreground, background) {
        const getLuminance = (hex) => {
            const rgb = this.hexToRgb(hex);
            const [r, g, b] = rgb.map(c => {
                c = c / 255;
                return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
            });
            return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };

        const l1 = getLuminance(foreground);
        const l2 = getLuminance(background);
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);

        return (lighter + 0.05) / (darker + 0.05);
    },

    /**
     * Convert hex to RGB
     * @param {string} hex - Hex color
     * @returns {Array} RGB values
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : [0, 0, 0];
    },

    /**
     * Check if contrast meets WCAG requirements
     * @param {string} foreground - Foreground color
     * @param {string} background - Background color
     * @param {string} level - 'AA' or 'AAA'
     * @param {boolean} largeText - Is large text
     * @returns {boolean}
     */
    meetsContrastRequirements(foreground, background, level = 'AA', largeText = false) {
        const ratio = this.getContrastRatio(foreground, background);
        
        const requirements = {
            AA: { normal: 4.5, large: 3 },
            AAA: { normal: 7, large: 4.5 }
        };

        const required = requirements[level][largeText ? 'large' : 'normal'];
        return ratio >= required;
    },

    /**
     * Generate skip links
     */
    generateSkipLinks() {
        const mainContent = document.getElementById('main-content');
        const navigation = document.getElementById('sidebar');

        if (!document.querySelector('.skip-links')) {
            const skipLinks = document.createElement('div');
            skipLinks.className = 'skip-links';
            skipLinks.innerHTML = `
                <a href="#main-content" class="skip-link">Skip to main content</a>
                <a href="#sidebar" class="skip-link">Skip to navigation</a>
            `;
            document.body.insertBefore(skipLinks, document.body.firstChild);
        }
    },

    /**
     * Set focus to element with announcement
     * @param {HTMLElement} element - Element to focus
     * @param {string} announcement - Optional announcement
     */
    focusWithAnnouncement(element, announcement = '') {
        if (element) {
            element.focus();
            if (announcement) {
                this.announce(announcement);
            }
        }
    }
};