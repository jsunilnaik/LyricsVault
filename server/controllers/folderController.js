const Folder = require('../models/Folder');

exports.createFolder = async (req, res) => {
    try {
        const folder = new Folder({
            ...req.body,
            owner_id: req.user._id
        });
        await folder.save();
        res.status(201).json(folder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getFolders = async (req, res) => {
    try {
        const folders = await Folder.find({ owner_id: req.user._id }).sort({ name: 1 });
        res.json(folders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateFolder = async (req, res) => {
    try {
        const folder = await Folder.findOneAndUpdate(
            { _id: req.params.id, owner_id: req.user._id },
            req.body,
            { new: true, runValidators: true }
        );
        if (!folder) return res.status(404).json({ message: 'Folder not found' });
        res.json(folder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteFolder = async (req, res) => {
    try {
        const folder = await Folder.findOneAndDelete({ _id: req.params.id, owner_id: req.user._id });
        if (!folder) return res.status(404).json({ message: 'Folder not found' });
        res.json({ message: 'Folder deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
