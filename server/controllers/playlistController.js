const Playlist = require('../models/Playlist');

exports.createPlaylist = async (req, res) => {
    try {
        const playlist = new Playlist({
            ...req.body,
            owner_id: req.user._id
        });
        await playlist.save();
        res.status(201).json(playlist);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getPlaylists = async (req, res) => {
    try {
        const playlists = await Playlist.find({ owner_id: req.user._id })
            .populate('song_ids', 'title artist artwork_url')
            .sort({ updatedAt: -1 });
        res.json(playlists);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getPlaylistById = async (req, res) => {
    try {
        const playlist = await Playlist.findOne({ _id: req.params.id, owner_id: req.user._id })
            .populate('song_ids', 'title artist artwork_url lyrics duration');
        if (!playlist) return res.status(404).json({ message: 'Playlist not found' });
        res.json(playlist);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updatePlaylist = async (req, res) => {
    try {
        const playlist = await Playlist.findOneAndUpdate(
            { _id: req.params.id, owner_id: req.user._id },
            req.body,
            { new: true, runValidators: true }
        );
        if (!playlist) return res.status(404).json({ message: 'Playlist not found' });
        res.json(playlist);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.addSongs = async (req, res) => {
    try {
        const playlist = await Playlist.findOne({ _id: req.params.id, owner_id: req.user._id });
        if (!playlist) return res.status(404).json({ message: 'Playlist not found' });
        
        const { songIds } = req.body;
        const existing = new Set(playlist.song_ids.map(id => id.toString()));
        const newIds = songIds.filter(id => !existing.has(id));
        playlist.song_ids.push(...newIds);
        await playlist.save();
        res.json(playlist);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.removeSong = async (req, res) => {
    try {
        const playlist = await Playlist.findOne({ _id: req.params.id, owner_id: req.user._id });
        if (!playlist) return res.status(404).json({ message: 'Playlist not found' });
        
        playlist.song_ids = playlist.song_ids.filter(id => id.toString() !== req.params.songId);
        await playlist.save();
        res.json(playlist);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deletePlaylist = async (req, res) => {
    try {
        const playlist = await Playlist.findOneAndDelete({ _id: req.params.id, owner_id: req.user._id });
        if (!playlist) return res.status(404).json({ message: 'Playlist not found' });
        res.json({ message: 'Playlist deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
