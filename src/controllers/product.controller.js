const { ROLES, MESSAGES } = require('../constants')
const productModel = require('../models/product.model')
const userModel = require('../models/user.model')

const getAll = async (req, res) => {
  try {
    const { page, limit, search, category_id, min_price, max_price } = req.query
    const result = await productModel.getAllProducts({
      page,
      limit,
      search,
      category_id,
      min_price,
      max_price
    })
    res.json(result)
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message })
  }
}

const getById = async (req, res) => {
  const product = await productModel.getProductById(req.params.id)
  if (!product)
    return res.status(404).json({ message: 'Không tìm thấy sản phẩm' })
  res.json(product)
}

const create = async (req, res) => {
  try {
    const profile = await userModel.findUserById(req.user.id)
    const allowedRoles = [ROLES.ADMIN, ROLES.SELLER]

    if (!allowedRoles.includes(profile.role_name))
      return res.status(403).json({ message: MESSAGES.UNAUTHORIZED })

    const imageUrls = req.files?.map(file => `/uploads/${file.filename}`) || []
    const product = await productModel.createProduct(req.body, imageUrls)
    res.status(201).json(product)
  } catch (err) {
    res
      .status(500)
      .json({ message: 'Tạo sản phẩm thất bại', error: err.message })
  }
}

const update = async (req, res) => {
  try {
    const profile = await userModel.findUserById(req.user.id)
    const allowedRoles = [ROLES.ADMIN, ROLES.SELLER]

    if (!allowedRoles.includes(profile.role_name))
      return res.status(403).json({ message: MESSAGES.UNAUTHORIZED })

    const imageUrls = req.files?.map(file => `/uploads/${file.filename}`) || []
    console.log('imageUrls', imageUrls)

    const product = await productModel.updateProduct(
      req.params.id,
      req.body,
      imageUrls
    )
    if (!product)
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' })
    res.json(product)
  } catch (err) {
    res.status(500).json({ message: 'Cập nhật thất bại', error: err.message })
  }
}

const remove = async (req, res) => {
  try {
    const profile = await userModel.findUserById(req.user.id)
    const allowedRoles = [ROLES.ADMIN, ROLES.SELLER]

    if (!allowedRoles.includes(profile.role_name))
      return res.status(403).json({ message: MESSAGES.UNAUTHORIZED })

    await productModel.deleteProduct(req.params.id)
    res.json({ message: 'Đã xoá sản phẩm' })
  } catch (err) {
    res.status(500).json({ message: 'Lỗi xóa sản phẩm', error: err.message })
  }
}

module.exports = { getAll, getById, create, update, remove }
