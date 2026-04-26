const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Song title is required'],
        trim: true
    },
    artist: {
        type: String,
        trim: true,
        default: 'Unknown Artist'
    },
    album: {
        type: String,
        trim: true,
        default: 'Unknown Album'
    },
    lyrics: {
        type: String,
        required: [true, 'Lyrics are required']
    },
    formatted_lyrics: String,
    genre: [String],
    tags: [String],
    mood: [String],
    language: String,
    year: Number,
    duration: String,
    bpm: Number,
    key: String,
    artwork_url: String,
    notes: String,
    chords: String,
    sections: [mongoose.Schema.Types.Mixed],
    is_favorite: {
        type: Boolean,
        default: false
    },
    view_count: {
        type: Number,
        default: 0
    },
    owner_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    folder_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Song', songSchema);
