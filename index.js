// src/index.js hoặc app.js
const express = require('express')
const cors = require('cors')
require('dotenv').config()
const fs = require('fs')

if (!fs.existsSync('./src/uploads')) {
  fs.mkdirSync('./src/uploads', { recursive: true })
}

const authRoutes = require('./src/routers/auth.routes')
const userRoutes = require('./src/routers/user.routes')
const categoryRoutes = require('./src/routers/category.routes')
const productRoutes = require('./src/routers/product.routes')
const blogRoutes = require('./src/routers/blog.routes')

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/category', categoryRoutes)
app.use('/api/product', productRoutes)
app.use('/api/blog', blogRoutes)
app.use('/api/uploads', express.static('src/uploads'))
// Health check
app.get('/', (req, res) => {
  res.send('API is running...')
})

// Global error handler (tùy chọn, đơn giản)
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Something went wrong!' })
})

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`)
})
