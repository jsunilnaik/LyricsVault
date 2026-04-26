const express = require('express');
const router = express.Router();
const { 
    createSong, 
    getSongs, 
    getSongById, 
    updateSong, 
    deleteSong,
    toggleFavorite
} = require('../controllers/songController');
const auth = require('../middleware/auth');

router.use(auth); // Protect all song routes

router.route('/')
    .post(createSong)
    .get(getSongs);

router.route('/:id')
    .get(getSongById)
    .patch(updateSong)
    .delete(deleteSong);

router.patch('/:id/favorite', toggleFavorite);

module.exports = router;
