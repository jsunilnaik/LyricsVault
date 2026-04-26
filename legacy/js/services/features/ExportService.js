// ============================================
// EXPORT SERVICE MODULE
// PDF, TXT, JSON, CSV export functionality
// ============================================

const ExportService = {
    /**
     * Export songs to PDF
     * @param {Array} songs - Songs to export
     * @param {Object} options - Export options
     */
    async exportToPDF(songs, options = {}) {
        const {
            includeMetadata = true,
            includeArtwork = false,
            pageSize = 'a4',
            fontSize = 12,
            lineSpacing = 1.5,
            margins = { top: 20, right: 20, bottom: 20, left: 20 },
            filename = 'lyrics-export'
        } = options;

        // Load jsPDF dynamically if not loaded
        if (typeof jspdf === 'undefined') {
            await this.loadJsPDF();
        }

        const { jsPDF } = window.jspdf;
        
        // Page dimensions
        const pageSizes = {
            a4: [210, 297],
            letter: [215.9, 279.4],
            a5: [148, 210]
        };
        
        const [pageWidth, pageHeight] = pageSizes[pageSize] || pageSizes.a4;
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: pageSize
        });

        const contentWidth = pageWidth - margins.left - margins.right;
        let yPosition = margins.top;

        // Helper function to add new page if needed
        const checkNewPage = (requiredSpace) => {
            if (yPosition + requiredSpace > pageHeight - margins.bottom) {
                doc.addPage();
                yPosition = margins.top;
                return true;
            }
            return false;
        };

        // Helper function to wrap text
        const wrapText = (text, maxWidth, fontSize) => {
            doc.setFontSize(fontSize);
            return doc.splitTextToSize(text, maxWidth);
        };

        // Process each song
        for (let i = 0; i < songs.length; i++) {
            const song = songs[i];
            
            // Add page break between songs (except first)
            if (i > 0) {
                doc.addPage();
                yPosition = margins.top;
            }

            // Title
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            const titleLines = wrapText(song.title, contentWidth, 18);
            titleLines.forEach(line => {
                checkNewPage(10);
                doc.text(line, margins.left, yPosition);
                yPosition += 8;
            });

            // Artist
            if (song.artist) {
                doc.setFontSize(14);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(100, 100, 100);
                doc.text(song.artist, margins.left, yPosition);
                yPosition += 7;
            }

            // Metadata
            if (includeMetadata) {
                doc.setFontSize(10);
                doc.setTextColor(128, 128, 128);
                
                const metadata = [];
                if (song.album) metadata.push(`Album: ${song.album}`);
                if (song.year) metadata.push(`Year: ${song.year}`);
                if (song.genre?.length) metadata.push(`Genre: ${song.genre.join(', ')}`);
                if (song.language) metadata.push(`Language: ${song.language}`);
                if (song.key) metadata.push(`Key: ${song.key}`);
                if (song.bpm) metadata.push(`BPM: ${song.bpm}`);
                
                if (metadata.length > 0) {
                    yPosition += 3;
                    const metaText = metadata.join(' • ');
                    const metaLines = wrapText(metaText, contentWidth, 10);
                    metaLines.forEach(line => {
                        checkNewPage(5);
                        doc.text(line, margins.left, yPosition);
                        yPosition += 5;
                    });
                }
            }

            // Separator line
            yPosition += 5;
            doc.setDrawColor(200, 200, 200);
            doc.line(margins.left, yPosition, pageWidth - margins.right, yPosition);
            yPosition += 10;

            // Lyrics
            doc.setFontSize(fontSize);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);

            const lyrics = song.lyrics || '';
            const lines = lyrics.split('\n');

            for (const line of lines) {
                // Check if it's a section marker
                const isSection = line.match(/^\[.*\]$/);
                
                if (isSection) {
                    yPosition += 3;
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(99, 102, 241); // Primary color
                } else {
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(0, 0, 0);
                }

                const wrappedLines = wrapText(line || ' ', contentWidth, fontSize);
                
                for (const wrappedLine of wrappedLines) {
                    checkNewPage(fontSize * lineSpacing * 0.4);
                    doc.text(wrappedLine, margins.left, yPosition);
                    yPosition += fontSize * lineSpacing * 0.4;
                }
            }

            // Notes (if any)
            if (includeMetadata && song.notes) {
                yPosition += 10;
                checkNewPage(20);
                
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(100, 100, 100);
                doc.text('Notes:', margins.left, yPosition);
                yPosition += 5;
                
                doc.setFont('helvetica', 'italic');
                const noteLines = wrapText(song.notes, contentWidth, 10);
                noteLines.forEach(line => {
                    checkNewPage(5);
                    doc.text(line, margins.left, yPosition);
                    yPosition += 5;
                });
            }

            // Chords (if any)
            if (includeMetadata && song.chords) {
                yPosition += 10;
                checkNewPage(20);
                
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(100, 100, 100);
                doc.text('Chords:', margins.left, yPosition);
                yPosition += 5;
                
                doc.setFont('courier', 'normal');
                const chordLines = wrapText(song.chords, contentWidth, 10);
                chordLines.forEach(line => {
                    checkNewPage(5);
                    doc.text(line, margins.left, yPosition);
                    yPosition += 5;
                });
            }

            // Page number
            const pageCount = doc.internal.getNumberOfPages();
            for (let p = 1; p <= pageCount; p++) {
                doc.setPage(p);
                doc.setFontSize(9);
                doc.setTextColor(150, 150, 150);
                doc.text(
                    `Page ${p} of ${pageCount}`,
                    pageWidth / 2,
                    pageHeight - 10,
                    { align: 'center' }
                );
            }
        }

        // Save the PDF
        doc.save(`${filename}.pdf`);
    },

    /**
     * Load jsPDF library dynamically
     */
    async loadJsPDF() {
        return new Promise((resolve, reject) => {
            if (window.jspdf) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },

    /**
     * Export songs to TXT
     * @param {Array} songs - Songs to export
     * @param {Object} options - Export options
     */
    exportToTXT(songs, options = {}) {
        const {
            includeMetadata = true,
            separator = '=',
            filename = 'lyrics-export'
        } = options;

        let content = '';
        const separatorLine = separator.repeat(50);

        songs.forEach((song, index) => {
            if (index > 0) {
                content += `\n\n${separatorLine}\n\n`;
            }

            // Title
            content += `${song.title}\n`;
            
            // Artist
            if (song.artist) {
                content += `by ${song.artist}\n`;
            }

            // Metadata
            if (includeMetadata) {
                const metadata = [];
                if (song.album) metadata.push(`Album: ${song.album}`);
                if (song.year) metadata.push(`Year: ${song.year}`);
                if (song.genre?.length) metadata.push(`Genre: ${song.genre.join(', ')}`);
                if (song.language) metadata.push(`Language: ${song.language}`);
                
                if (metadata.length > 0) {
                    content += metadata.join(' | ') + '\n';
                }
            }

            content += '\n---\n\n';

            // Lyrics
            content += song.lyrics || '';

            // Notes
            if (includeMetadata && song.notes) {
                content += `\n\n[Notes]\n${song.notes}`;
            }

            // Chords
            if (includeMetadata && song.chords) {
                content += `\n\n[Chords]\n${song.chords}`;
            }
        });

        Utils.downloadFile(content, `${filename}.txt`, 'text/plain;charset=utf-8');
    },

    /**
     * Export songs to JSON
     * @param {Array} songs - Songs to export
     * @param {Object} options - Export options
     */
    exportToJSON(songs, options = {}) {
        const {
            pretty = true,
            includeAllFields = true,
            filename = 'lyrics-export'
        } = options;

        const exportData = songs.map(song => {
            if (includeAllFields) {
                return {
                    title: song.title,
                    artist: song.artist,
                    album: song.album,
                    year: song.year,
                    genre: song.genre,
                    mood: song.mood,
                    language: song.language,
                    duration: song.duration,
                    bpm: song.bpm,
                    key: song.key,
                    lyrics: song.lyrics,
                    notes: song.notes,
                    chords: song.chords,
                    is_favorite: song.is_favorite,
                    created_at: song.created_at,
                    updated_at: song.updated_at
                };
            } else {
                return {
                    title: song.title,
                    artist: song.artist,
                    lyrics: song.lyrics
                };
            }
        });

        const jsonContent = pretty 
            ? JSON.stringify(exportData, null, 2)
            : JSON.stringify(exportData);

        Utils.downloadFile(jsonContent, `${filename}.json`, 'application/json');
    },

    /**
     * Export songs to CSV
     * @param {Array} songs - Songs to export
     * @param {Object} options - Export options
     */
    exportToCSV(songs, options = {}) {
        const {
            delimiter = ',',
            includeHeaders = true,
            fields = ['title', 'artist', 'album', 'year', 'genre', 'lyrics'],
            filename = 'lyrics-export'
        } = options;

        const escapeCSV = (value) => {
            if (value === null || value === undefined) return '';
            const str = String(value);
            if (str.includes(delimiter) || str.includes('"') || str.includes('\n')) {
                return '"' + str.replace(/"/g, '""') + '"';
            }
            return str;
        };

        let csv = '';

        // Headers
        if (includeHeaders) {
            csv += fields.join(delimiter) + '\n';
        }

        // Data rows
        songs.forEach(song => {
            const row = fields.map(field => {
                let value = song[field];
                
                if (Array.isArray(value)) {
                    value = value.join('; ');
                } else if (field === 'lyrics') {
                    value = (value || '').replace(/\n/g, '\\n');
                }
                
                return escapeCSV(value);
            });
            
            csv += row.join(delimiter) + '\n';
        });

        Utils.downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8');
    },

    /**
     * Export single song for printing
     * @param {Object} song - Song to print
     */
    printSong(song) {
        const printWindow = window.open('', '_blank');
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${Utils.sanitizeHTML(song.title)} - LyricVault</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: Georgia, 'Times New Roman', serif;
                        padding: 20mm;
                        max-width: 210mm;
                        margin: 0 auto;
                        color: #333;
                        line-height: 1.6;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 20px;
                        padding-bottom: 15px;
                        border-bottom: 2px solid #333;
                    }
                    .title {
                        font-size: 24pt;
                        font-weight: bold;
                        margin-bottom: 5px;
                    }
                    .artist {
                        font-size: 14pt;
                        color: #666;
                    }
                    .metadata {
                        font-size: 10pt;
                        color: #888;
                        margin-top: 10px;
                    }
                    .lyrics {
                        font-size: 12pt;
                        white-space: pre-wrap;
                        line-height: 1.8;
                    }
                    .section-marker {
                        font-weight: bold;
                        color: #6366F1;
                        margin-top: 15px;
                        margin-bottom: 5px;
                    }
                    .notes-section {
                        margin-top: 30px;
                        padding-top: 15px;
                        border-top: 1px solid #ccc;
                    }
                    .notes-title {
                        font-size: 11pt;
                        font-weight: bold;
                        color: #666;
                        margin-bottom: 5px;
                    }
                    .notes-content {
                        font-size: 10pt;
                        font-style: italic;
                        color: #666;
                    }
                    .chords {
                        font-family: 'Courier New', monospace;
                        font-size: 10pt;
                        color: #666;
                    }
                    .footer {
                        margin-top: 30px;
                        text-align: center;
                        font-size: 9pt;
                        color: #999;
                    }
                    @media print {
                        body {
                            padding: 15mm;
                        }
                        .no-print {
                            display: none;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="title">${Utils.sanitizeHTML(song.title)}</div>
                    ${song.artist ? `<div class="artist">${Utils.sanitizeHTML(song.artist)}</div>` : ''}
                    <div class="metadata">
                        ${[
                            song.album ? `Album: ${Utils.sanitizeHTML(song.album)}` : '',
                            song.year ? `Year: ${song.year}` : '',
                            song.genre?.length ? `Genre: ${song.genre.join(', ')}` : '',
                            song.key ? `Key: ${song.key}` : '',
                            song.bpm ? `BPM: ${song.bpm}` : ''
                        ].filter(Boolean).join(' • ')}
                    </div>
                </div>
                
                <div class="lyrics">${this.formatLyricsForPrint(song.lyrics)}</div>
                
                ${song.notes ? `
                    <div class="notes-section">
                        <div class="notes-title">Notes</div>
                        <div class="notes-content">${Utils.sanitizeHTML(song.notes)}</div>
                    </div>
                ` : ''}
                
                ${song.chords ? `
                    <div class="notes-section">
                        <div class="notes-title">Chords</div>
                        <div class="chords">${Utils.sanitizeHTML(song.chords)}</div>
                    </div>
                ` : ''}
                
                <div class="footer">
                    Printed from LyricVault • ${new Date().toLocaleDateString()}
                </div>
                
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() { window.close(); }, 500);
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    },

    /**
     * Format lyrics for print (convert section markers to styled HTML)
     * @param {string} lyrics - Raw lyrics
     * @returns {string} HTML formatted lyrics
     */
    formatLyricsForPrint(lyrics) {
        if (!lyrics) return '';
        
        return Utils.sanitizeHTML(lyrics)
            .replace(/\[([^\]]+)\]/g, '</div><div class="section-marker">[$1]</div><div>')
            .replace(/\n/g, '<br>');
    },

    /**
     * Generate QR Code for song
     * @param {Object} song - Song data
     * @returns {Promise<string>} QR code data URL
     */
    async generateQRCode(song) {
        // Load QRCode library if not loaded
        if (typeof QRCode === 'undefined') {
            await this.loadQRCodeLib();
        }

        // Create minimal shareable data
        const shareData = {
            t: song.title,
            a: song.artist || '',
            l: song.lyrics?.substring(0, 500) || '' // Limit lyrics length for QR
        };

        const qrData = JSON.stringify(shareData);
        
        // Create canvas for QR code
        const canvas = document.createElement('canvas');
        
        await QRCode.toCanvas(canvas, qrData, {
            width: 256,
            margin: 2,
            color: {
                dark: '#1F2937',
                light: '#FFFFFF'
            }
        });

        return canvas.toDataURL('image/png');
    },

    /**
     * Load QRCode library dynamically
     */
    async loadQRCodeLib() {
        return new Promise((resolve, reject) => {
            if (window.QRCode) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode/1.5.3/qrcode.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },

    /**
     * Create full backup
     * @returns {Promise<void>}
     */
    async createBackup() {
        const backup = await Database.backup();
        const filename = `lyricvault-backup-${new Date().toISOString().split('T')[0]}`;
        
        Utils.downloadFile(
            JSON.stringify(backup, null, 2),
            `${filename}.json`,
            'application/json'
        );

        await Store.updateSetting('lastBackup', new Date().toISOString());
        return backup;
    },

    /**
     * Restore from backup file
     * @param {File} file - Backup file
     */
    async restoreFromBackup(file) {
        const content = await Utils.readFileAsText(file);
        const backup = JSON.parse(content);

        if (!backup.data) {
            throw new Error('Invalid backup file format');
        }

        await Database.restore(backup);
        await Store.init();
    }
};