const db = require('../config/database')

const getAllUsers = async () => {
  const result = await db.query(
    `
    SELECT u.id, u.name, u.email, u.role_id, r.name AS role_name, u.created_at
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    ORDER BY u.created_at DESC
    `
  )
  return result.rows
}

const createUser = async ({ name, email, password }) => {
  const result = await db.query(
    'INSERT INTO users(name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
    [name, email, password]
  )
  return result.rows[0]
}

const updateUser = async (id, { name, email, role_id }) => {
  const result = await db.query(
    `
    UPDATE users SET name = $1, email = $2, role_id = $3
    WHERE id = $4 RETURNING id, name, email, role_id
    `,
    [name, email, role_id, id]
  )
  return result.rows[0]
}

const deleteUser = async id => {
  await db.query('DELETE FROM users WHERE id = $1', [id])
}

const findUserByEmail = async email => {
  const result = await db.query('SELECT * FROM users WHERE email = $1', [email])
  return result.rows[0]
}

const findUserById = async id => {
  const result = await db.query(
    `
      SELECT 
        u.id, u.name, u.email, u.role_id, u.created_at,
        r.name AS role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1
      `,
    [id]
  )

  return result.rows[0]
}

module.exports = {
  getAllUsers,
  updateUser,
  deleteUser,
  createUser,
  findUserByEmail,
  findUserById
}
