const db = require('../config/database')

const getAllProducts = async ({
  page = 1,
  limit = 10,
  search = '',
  category_id,
  brand_id,
  min_price,
  max_price
}) => {
  const offset = (page - 1) * limit
  const queryParams = []
  let query = `
    SELECT p.*, c.name AS category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN brands b ON p.brand_id = b.id
  `
  let countQuery = `SELECT COUNT(*) FROM products p`
  const conditions = []

  if (search) {
    queryParams.push(`%${search}%`)
    conditions.push(`LOWER(p.name) LIKE LOWER($${queryParams.length})`)
  }

  if (category_id) {
    queryParams.push(category_id)
    conditions.push(`p.category_id = $${queryParams.length}`)
  }

  if (brand_id) {
    queryParams.push(brand_id)
    conditions.push(`p.brand_id = $${queryParams.length}`)
  }

  if (min_price) {
    queryParams.push(min_price)
    conditions.push(`p.price >= $${queryParams.length}`)
  }

  if (max_price) {
    queryParams.push(max_price)
    conditions.push(`p.price <= $${queryParams.length}`)
  }

  if (conditions.length > 0) {
    const whereClause = ` WHERE ${conditions.join(' AND ')}`
    query += whereClause
    countQuery += whereClause
  }

  queryParams.push(limit, offset)
  query += ` ORDER BY p.id DESC LIMIT $${queryParams.length - 1} OFFSET $${
    queryParams.length
  }`

  const result = await db.query(query, queryParams)
  const count = await db.query(
    countQuery,
    queryParams.slice(0, queryParams.length - 2)
  )

  for (let product of result.rows) {
    const imgs = await db.query(
      `SELECT image_url FROM product_images WHERE product_id = $1`,
      [product.id]
    )
    product.images = imgs.rows.map(r => r.image_url)
  }

  return {
    data: result.rows,
    total: parseInt(count.rows[0].count),
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(count.rows[0].count / limit)
  }
}

const getProductById = async id => {
  const productRes = await db.query(
    `
    SELECT p.*, c.name AS category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = $1`,
    [id]
  )

  const imageRes = await db.query(
    `SELECT image_url FROM product_images WHERE product_id = $1`,
    [id]
  )

  const product = productRes.rows[0]
  if (!product) return null

  product.images = imageRes.rows.map(r => r.image_url)
  return product
}

const createProduct = async (data, imageUrls = []) => {
  const {
    name,
    description,
    price,
    sale_price,
    year,
    warranty,
    category_id,
    brand_id
  } = data
  const result = await db.query(
    `
    INSERT INTO products(name, description, price, sale_price, year, warranty, category_id, brand_id)
    VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [
      name,
      description,
      price,
      sale_price,
      year,
      warranty,
      category_id,
      brand_id
    ]
  )
  const product = result.rows[0]

  for (const url of imageUrls) {
    await db.query(
      `INSERT INTO product_images (product_id, image_url) VALUES ($1, $2)`,
      [product.id, url]
    )
  }

  return product
}

const updateProduct = async (id, data, imageUrls = []) => {
  const {
    name,
    description,
    price,
    sale_price,
    year,
    warranty,
    category_id,
    brand_id
  } = data

  const result = await db.query(
    `
    UPDATE products SET name=$1, description=$2, price=$3, sale_price=$4,
      year=$5, warranty=$6, category_id=$7, brand_id=$8
    WHERE id=$9 RETURNING *`,
    [
      name,
      description,
      price,
      sale_price,
      year,
      warranty,
      category_id,
      brand_id,
      id
    ]
  )

  if (imageUrls.length > 0) {
    await db.query(`DELETE FROM product_images WHERE product_id = $1`, [id])
    for (const url of imageUrls) {
      await db.query(
        `INSERT INTO product_images (product_id, image_url) VALUES ($1, $2)`,
        [id, url]
      )
    }
  }

  return result.rows[0]
}

const deleteProduct = async id => {
  await db.query(`DELETE FROM products WHERE id = $1`, [id])
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
}
