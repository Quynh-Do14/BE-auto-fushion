const { ROLES, MESSAGES } = require('../constants')
const blogModel = require('../models/blog.model')
const userModel = require('../models/user.model')

const getAll = async (req, res) => {
  const news = await blogModel.getAllBLog()
  res.json(news)
}

const getById = async (req, res) => {
  const item = await blogModel.getBLogById(req.params.id)
  if (!item) return res.status(404).json({ message: 'Không tìm thấy tin tức' })
  res.json(item)
}

const create = async (req, res) => {
  try {
    const profile = await userModel.findUserById(req.user.id)
    const allowedRoles = [ROLES.ADMIN, ROLES.WRITTER]

    if (!allowedRoles.includes(profile.role_name)) {
      return res.status(403).json({ message: MESSAGES.UNAUTHORIZED })
    }

    const { title, description } = req.body
    const thumbnail = req.file ? `/uploads/${req.file.filename}` : null

    const blog = await blogModel.createBlog({ title, description, thumbnail })
    res.status(201).json(blog)
  } catch (err) {
    res.status(500).json({ message: 'Lỗi tạo blog', error: err.message })
  }
}

const update = async (req, res) => {
  try {
    const profile = await userModel.findUserById(req.user.id)
    const allowedRoles = [ROLES.ADMIN, ROLES.WRITTER]

    if (!allowedRoles.includes(profile.role_name)) {
      return res.status(403).json({ message: MESSAGES.UNAUTHORIZED })
    }

    const { title, description } = req.body
    const thumbnail = req.file
      ? `/uploads/${req.file.filename}`
      : req.body.thumbnail || null
    const blog = await blogModel.updateBLog(req.params.id, {
      title,
      description,
      thumbnail
    })
    res.status(201).json(blog)
  } catch (err) {
    res
      .status(500)
      .json({ message: 'Lỗi cập nhật tin tức', error: err.message })
  }
}

const remove = async (req, res) => {
  try {
    const profile = await userModel.findUserById(req.user.id)
    const allowedRoles = [ROLES.ADMIN, ROLES.WRITTER]

    if (!allowedRoles.includes(profile.role_name)) {
      return res.status(403).json({ message: MESSAGES.UNAUTHORIZED })
    }

    await blogModel.deleteBLog(req.params.id)
    res.json({ message: 'Đã xoá tin tức' })
  } catch (err) {
    res.status(500).json({ message: 'Lỗi xóa tin tức', error: err.message })
  }
}

module.exports = { getAll, getById, create, update, remove }
