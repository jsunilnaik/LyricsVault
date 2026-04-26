const Song = require('../models/Song');

exports.createSong = async (req, res) => {
    try {
        const song = new Song({
            ...req.body,
            owner_id: req.user._id
        });
        await song.save();
        res.status(201).json(song);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getSongs = async (req, res) => {
    try {
        const songs = await Song.find({ owner_id: req.user._id }).sort({ updatedAt: -1 });
        res.json(songs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getSongById = async (req, res) => {
    try {
        const song = await Song.findOne({ _id: req.params.id, owner_id: req.user._id });
        if (!song) {
            return res.status(404).json({ message: 'Song not found' });
        }
        res.json(song);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateSong = async (req, res) => {
    try {
        const song = await Song.findOneAndUpdate(
            { _id: req.params.id, owner_id: req.user._id },
            req.body,
            { new: true, runValidators: true }
        );
        if (!song) {
            return res.status(404).json({ message: 'Song not found' });
        }
        res.json(song);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteSong = async (req, res) => {
    try {
        const song = await Song.findOneAndDelete({ _id: req.params.id, owner_id: req.user._id });
        if (!song) {
            return res.status(404).json({ message: 'Song not found' });
        }
        res.json({ message: 'Song deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.toggleFavorite = async (req, res) => {
    try {
        const song = await Song.findOne({ _id: req.params.id, owner_id: req.user._id });
        if (!song) {
            return res.status(404).json({ message: 'Song not found' });
        }
        song.is_favorite = !song.is_favorite;
        await song.save();
        res.json(song);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
