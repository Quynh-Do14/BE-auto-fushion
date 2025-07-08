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
    SELECT p.*, c.name AS category_name, b.name AS brand_name
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
  // 1. Truy vấn thông tin sản phẩm chính
  const productRes = await db.query(
    `
    SELECT p.*, c.name AS category_name, b.name AS brand_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN brands b ON p.brand_id = b.id
    WHERE p.id = $1
    `,
    [id]
  )

  const product = productRes.rows[0]
  if (!product) return null

  // 2. Lấy ảnh sản phẩm
  const imageRes = await db.query(
    `SELECT image_url FROM product_images WHERE product_id = $1`,
    [id]
  )
  product.images = imageRes.rows.map(r => r.image_url)

  // 3. Lấy danh sách thông số kỹ thuật (figures)
  const figureRes = await db.query(
    `SELECT id, key, value FROM product_figures WHERE product_id = $1`,
    [id]
  )
  product.productFigure = figureRes.rows

  // 4. Lấy các sản phẩm cùng danh mục (trừ chính nó)
  const sameCategoryRes = await db.query(
    `
    SELECT * FROM products
    WHERE category_id = $1 AND id != $2
    ORDER BY created_at DESC
    LIMIT 6
    `,
    [product.category_id, id]
  )
  product.sameCategoryProducts = sameCategoryRes.rows

  // 5. Lấy các sản phẩm cùng thương hiệu (trừ chính nó)
  const sameBrandRes = await db.query(
    `
    SELECT * FROM products
    WHERE brand_id = $1 AND id != $2
    ORDER BY created_at DESC
    LIMIT 6
    `,
    [product.brand_id, id]
  )
  product.sameBrandProducts = sameBrandRes.rows

  return product
}

const createProduct = async (
  data,
  imageUrls = [],
  productFigure = [],
  image = null
) => {
  const {
    name,
    description,
    short_description,
    more_infomation,
    price,
    percent_sale,
    year,
    warranty,
    category_id,
    brand_id
  } = data

  // 1. Insert sản phẩm
  const result = await db.query(
    `INSERT INTO products (
      name, description, short_description, more_infomation,
      price, percent_sale, year, warranty, category_id, brand_id, image
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING id`,
    [
      name,
      description,
      short_description,
      more_infomation,
      price,
      percent_sale,
      year,
      warranty,
      category_id,
      brand_id,
      image
    ]
  )

  const productId = result.rows[0].id

  // 2. Insert ảnh phụ
  for (const url of imageUrls) {
    await db.query(
      `INSERT INTO product_images (product_id, image_url) VALUES ($1, $2)`,
      [productId, url]
    )
  }

  // 3. Insert thông số kỹ thuật
  for (const figure of productFigure) {
    await db.query(
      `INSERT INTO product_figures (product_id, key, value) VALUES ($1, $2, $3)`,
      [productId, figure.key, figure.value]
    )
  }

  return { id: productId }
}

const updateProduct = async (
  id,
  data,
  newImageUrls = [],
  remainingImages = [],
  productFigure = [],
  image = null // ảnh chính (thumbnail)
) => {
  const {
    name,
    description,
    short_description,
    more_infomation,
    price,
    percent_sale,
    year,
    warranty,
    category_id,
    brand_id
  } = data

  let updateQuery = `
    UPDATE products SET 
      name=$1, 
      description=$2, 
      short_description=$3, 
      more_infomation=$4, 
      price=$5, 
      percent_sale=$6,
      year=$7, 
      warranty=$8, 
      category_id=$9, 
      brand_id=$10`
  const params = [
    name,
    description,
    short_description,
    more_infomation,
    price,
    percent_sale,
    year,
    warranty,
    category_id,
    brand_id
  ]

  if (image) {
    updateQuery += `, image=$11`
    params.push(image)
    updateQuery += ` WHERE id=$12 RETURNING *`
    params.push(id)
  } else {
    updateQuery += ` WHERE id=$11 RETURNING *`
    params.push(id)
  }

  const result = await db.query(updateQuery, params)

  // Cập nhật ảnh phụ
  const oldImagesRes = await db.query(
    `SELECT image_url FROM product_images WHERE product_id = $1`,
    [id]
  )
  const oldImages = oldImagesRes.rows.map(row => row.image_url)

  const imagesToDelete = oldImages.filter(url => !remainingImages.includes(url))
  for (const url of imagesToDelete) {
    await db.query(
      `DELETE FROM product_images WHERE product_id = $1 AND image_url = $2`,
      [id, url]
    )
  }
  console.log('oldImages', oldImages)
  console.log('imagesToDelete', imagesToDelete)
  console.log('remainingImages', remainingImages)

  for (const url of newImageUrls) {
    await db.query(
      `INSERT INTO product_images (product_id, image_url) VALUES ($1, $2)`,
      [id, url]
    )
  }

  // Cập nhật thông số kỹ thuật
  await db.query(`DELETE FROM product_figures WHERE product_id = $1`, [id])
  for (const figure of productFigure) {
    await db.query(
      `INSERT INTO product_figures (product_id, key, value) VALUES ($1, $2, $3)`,
      [id, figure.key, figure.value]
    )
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
