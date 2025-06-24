const db = require('../config/database')

const getAllBLog = async () => {
  const res = await db.query('SELECT * FROM blog ORDER BY created_at DESC')
  return res.rows
}

const getBLogById = async id => {
  const res = await db.query('SELECT * FROM blog WHERE id = $1', [id])
  return res.rows[0]
}

const createBLog = async ({ title, description, thumbnail }) => {
  const res = await db.query(
    'INSERT INTO blog (title, description, thumbnail) VALUES ($1, $2, $3) RETURNING *',
    [title, description, thumbnail]
  )
  return res.rows[0]
}

const updateBLog = async (id, { title, description, thumbnail }) => {
  const res = await db.query(
    'UPDATE blog SET title = $1, description = $2, thumbnail = $3 WHERE id = $4 RETURNING *',
    [title, description, thumbnail, id]
  )
  return res.rows[0]
}

const deleteBLog = async id => {
  await db.query('DELETE FROM blog WHERE id = $1', [id])
}

module.exports = {
  getAllBLog,
  getBLogById,
  createBLog,
  updateBLog,
  deleteBLog
}
