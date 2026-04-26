const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Playlist name is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    song_ids: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Song'
    }],
    owner_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Playlist', playlistSchema);
