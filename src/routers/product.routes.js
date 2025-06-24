const express = require('express')
const router = express.Router()
const productController = require('../controllers/product.controller')
const upload = require('../middlewares/upload.middleware')
const { authenticate } = require('../middlewares/auth.middleware')

router.get('/', productController.getAll)
router.get('/:id', productController.getById)
router.post(
  '/',
  upload.array('images', 5),
  authenticate,
  productController.create
)
router.put(
  '/:id',
  upload.array('images', 5),
  authenticate,
  productController.update
)
router.delete('/:id', authenticate, productController.remove)

module.exports = router
