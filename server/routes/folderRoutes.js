const express = require('express');
const router = express.Router();
const { createFolder, getFolders, updateFolder, deleteFolder } = require('../controllers/folderController');
const auth = require('../middleware/auth');

router.use(auth);

router.route('/')
    .post(createFolder)
    .get(getFolders);

router.route('/:id')
    .patch(updateFolder)
    .delete(deleteFolder);

module.exports = router;
