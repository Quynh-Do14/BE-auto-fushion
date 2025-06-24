const { ROLES, MESSAGES } = require('../constants')
const userModel = require('../models/user.model')

const getAll = async (req, res) => {
  try {
    const profile = await userModel.findUserById(req.user.id)
    const allowedRoles = [ROLES.ADMIN]

    if (!allowedRoles.includes(profile.role_name))
      return res.status(403).json({ message: MESSAGES.UNAUTHORIZED })
    const users = await userModel.getAllUsers()
    res.json(users)
  } catch (error) {
    res.status(500).json({ message: MESSAGES.SERVER_ERROR, error })
  }
}

const getById = async (req, res) => {
  try {
    const profile = await userModel.findUserById(req.user.id)
    const allowedRoles = [ROLES.ADMIN]

    if (!allowedRoles.includes(profile.role_name))
      return res.status(403).json({ message: MESSAGES.UNAUTHORIZED })

    const user = await userModel.findUserById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: MESSAGES.SERVER_ERROR, error })
  }
}

const create = async (req, res) => {
  try {
    const profile = await userModel.findUserById(req.user.id)
    const allowedRoles = [ROLES.ADMIN]

    if (!allowedRoles.includes(profile.role_name))
      return res.status(403).json({ message: MESSAGES.UNAUTHORIZED })

    const { name, email, password, role_id } = req.body

    const existing = await userModel.findUserByEmail(email)
    if (existing) {
      return res.status(400).json({ message: 'Email đã tồn tại' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await userModel.createUser({
      name,
      email,
      password: hashedPassword,
      role_id
    })

    res.status(201).json(user)
  } catch (error) {
    res.status(500).json({ message: MESSAGES.SERVER_ERROR, error })
  }
}

const update = async (req, res) => {
  try {
    const profile = await userModel.findUserById(req.user.id)
    const allowedRoles = [ROLES.ADMIN]

    if (!allowedRoles.includes(profile.role_name))
      return res.status(403).json({ message: MESSAGES.UNAUTHORIZED })

    const { name, email, role_id } = req.body
    const user = await userModel.updateUser(req.params.id, {
      name,
      email,
      role_id
    })
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: MESSAGES.SERVER_ERROR, error })
  }
}

const remove = async (req, res) => {
  try {
    const profile = await userModel.findUserById(req.user.id)
    const allowedRoles = [ROLES.ADMIN]

    if (!allowedRoles.includes(profile.role_name))
      return res.status(403).json({ message: MESSAGES.UNAUTHORIZED })

    await userModel.deleteUser(req.params.id)
    res.json({ message: 'User deleted' })
  } catch (error) {
    res.status(500).json({ message: MESSAGES.SERVER_ERROR, error })
  }
}

const getProfile = async (req, res) => {
  try {
    const user = await userModel.findUserById(req.user.id)

    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error })
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  getProfile
}
