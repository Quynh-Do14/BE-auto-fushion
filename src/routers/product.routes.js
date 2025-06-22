const express = require('express')
const router = express.Router()
const productController = require('../controllers/product.controller')
const upload = require('../middlewares/upload.middleware')

router.get('/', productController.getAll)
router.get('/:id', productController.getById)
router.post('/', upload.array('images', 5), productController.create)
router.put('/:id', upload.array('images', 5), productController.update)
router.delete('/:id', productController.remove)

module.exports = router
