const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const auth = require('../middleware/auth')
const Service = require('../models/service')

const router = new express.Router()

router.post("/service", auth, async (req, res) => {
    const service = new Service(req.body);
    if (req.user.isAdmin) {
        try {
            await service.save();
            res.status(201).send({
                service
            });
        } catch (e) {
            res.status(400).send(e);
        }
    }else{
        res.status(401).send();
    }

});

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload an image'))
        }

        cb(undefined, true)
    }
})

router.post('/service/picture', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({
        width: 250,
        height: 250
    }).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({
        error: error.message
    })
})


module.exports = router