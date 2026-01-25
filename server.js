require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to database:', err.stack);
  } else {
    console.log('✓ Connected to Neon PostgreSQL');
    release();
  }
});

// Initialize database tables
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL UNIQUE,
        slug VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS posts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        excerpt TEXT NOT NULL,
        content TEXT NOT NULL,
        image VARCHAR(500),
        author VARCHAR(100),
        category_id UUID REFERENCES categories(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_posts_category_id ON posts(category_id);
    `);
    console.log('✓ Database tables initialized');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

// Initialize on startup
initializeDatabase();

// Routes

// GET all posts with optional filtering
app.get('/api/posts', async (req, res) => {
  try {
    const { category, limit = 50 } = req.query;
    let query = `SELECT p.*, c.name as category_name FROM posts p 
                 LEFT JOIN categories c ON p.category_id = c.id
                 ORDER BY p.created_at DESC`;
    const params = [];

    if (category) {
      query = `SELECT p.*, c.name as category_name FROM posts p 
               LEFT JOIN categories c ON p.category_id = c.id
               WHERE c.slug = $1 
               ORDER BY p.created_at DESC`;
      params.push(category);
    }

    query += ` LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));

    const result = await pool.query(query, params);
    res.json({ posts: result.rows, total: result.rows.length });
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// GET single post by ID
app.get('/api/posts/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, c.name as category_name FROM posts p 
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching post:', err);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// CREATE new post
app.post('/api/posts', async (req, res) => {
  try {
    const { title, excerpt, content, image, author, category_id, highlights } = req.body;

    // Validation
    if (!title || !excerpt || !content) {
      return res.status(400).json({ error: 'Title, excerpt, and content are required' });
    }

    // Generate slug from title
    const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO posts (id, title, slug, excerpt, content, image, author, category_id, highlights, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [id, title, slug, excerpt, content, image || null, author || 'Dayspring', category_id || null, highlights || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// UPDATE post by ID
app.put('/api/posts/:id', async (req, res) => {
  try {
    const { title, excerpt, content, image, author, category_id, highlights } = req.body;

    // Generate slug from title if title is being updated
    let slug = null;
    if (title) {
      slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    }

    const result = await pool.query(
      `UPDATE posts
       SET title = COALESCE($1, title),
           slug = COALESCE($2, slug),
           excerpt = COALESCE($3, excerpt),
           content = COALESCE($4, content),
           image = COALESCE($5, image),
           author = COALESCE($6, author),
           category_id = COALESCE($7, category_id),
           highlights = COALESCE($8, highlights),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [title, slug, excerpt, content, image, author, category_id, highlights, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating post:', err);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// DELETE post by ID
app.delete('/api/posts/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM posts WHERE id = $1 RETURNING id', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (err) {
    console.error('Error deleting post:', err);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// GET posts by category
app.get('/api/categories/:category', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM posts WHERE category = $1 ORDER BY created_at DESC',
      [req.params.category]
    );
    res.json({ posts: result.rows, total: result.rows.length });
  } catch (err) {
    console.error('Error fetching posts by category:', err);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// SEARCH posts
app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const searchTerm = `%${q}%`;
    const result = await pool.query(
      `SELECT p.*, c.name as category_name FROM posts p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.title ILIKE $1 OR p.excerpt ILIKE $1 OR p.content ILIKE $1
       ORDER BY p.created_at DESC`,
      [searchTerm]
    );
    res.json({ posts: result.rows, total: result.rows.length });
  } catch (err) {
    console.error('Error searching posts:', err);
    res.status(500).json({ error: 'Failed to search posts' });
  }
});

// ========== CATEGORY ENDPOINTS ==========

// GET all categories
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json({ categories: result.rows });
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// CREATE new category
app.post('/api/categories', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const id = uuidv4();

    const result = await pool.query(
      `INSERT INTO categories (id, name, slug, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, name, slug, description || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating category:', err);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// UPDATE category
app.put('/api/categories/:id', async (req, res) => {
  try {
    const { name, description } = req.body;
    const slug = name ? name.toLowerCase().replace(/\s+/g, '-') : null;

    const result = await pool.query(
      `UPDATE categories
       SET name = COALESCE($1, name),
           slug = COALESCE($2, slug),
           description = COALESCE($3, description)
       WHERE id = $4
       RETURNING *`,
      [name, slug, description, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating category:', err);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE category
app.delete('/api/categories/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING id', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Dayspring Blog API is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Dayspring Blog API running on http://localhost:${PORT}`);
  console.log(`📚 Blog endpoint: http://localhost:${PORT}/api/posts`);
  console.log(`❤️  Health check: http://localhost:${PORT}/api/health\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  pool.end(() => {
    console.log('Database connection closed');
    process.exit(0);
  });
});
