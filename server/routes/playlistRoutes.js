const express = require('express');
const router = express.Router();
const {
    createPlaylist,
    getPlaylists,
    getPlaylistById,
    updatePlaylist,
    addSongs,
    removeSong,
    deletePlaylist
} = require('../controllers/playlistController');
const auth = require('../middleware/auth');

router.use(auth);

router.route('/')
    .post(createPlaylist)
    .get(getPlaylists);

router.route('/:id')
    .get(getPlaylistById)
    .patch(updatePlaylist)
    .delete(deletePlaylist);

router.post('/:id/songs', addSongs);
router.delete('/:id/songs/:songId', removeSong);

module.exports = router;
