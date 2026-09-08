require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function initializeDatabase() {
  try {
    console.log('Initializing database...');

    // Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        excerpt TEXT NOT NULL,
        content TEXT NOT NULL,
        image VARCHAR(500),
        author VARCHAR(100),
        category VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
    `);

    console.log('✓ Database tables created successfully');

    // Insert sample categories
    const sampleCategories = [
      { name: 'Teaching', description: 'Scripture-based teachings and lessons' },
      { name: 'Devotional', description: 'Daily devotionals and reflections' },
      { name: 'News', description: 'Church news and updates' },
      { name: 'Testimony', description: 'Member testimonies and faith stories' }
    ];

    let categoryIds = {};
    for (const cat of sampleCategories) {
      const slug = cat.name.toLowerCase();
      const result = await pool.query(
        `INSERT INTO categories (name, slug, description)
         VALUES ($1, $2, $3)
         ON CONFLICT (slug) DO UPDATE SET description = EXCLUDED.description
         RETURNING id, name`,
        [cat.name, slug, cat.description]
      );
      if (result.rows.length > 0) {
        categoryIds[cat.name] = result.rows[0].id;
      }
    }

    console.log('✓ Sample categories inserted');

    // Insert sample posts for testing
    const samplePosts = [
      {
        title: 'Welcome to Dayspring Blog',
        excerpt: 'Your source for spiritual insights, teachings, and stories from our community.',
        content: '<h2>Welcome</h2><p>Welcome to the Dayspring Lagos blog where we share teachings, devotionals, and testimonies.</p>',
        image: 'https://via.placeholder.com/800x400?text=Welcome',
        author: 'Dayspring Team',
        category_id: categoryIds['News']
      },
      {
        title: 'The Power of Prayer',
        excerpt: 'Discover how prayer transforms lives and deepens your relationship with God.',
        content: '<h2>The Power of Prayer</h2><p>Prayer is the foundation of our faith. Through prayer, we connect with God and experience His guidance.</p>',
        image: 'https://via.placeholder.com/800x400?text=Prayer',
        author: 'Pastor Caleb Leo',
        category_id: categoryIds['Teaching']
      },
      {
        title: 'Daily Devotional: Faith in Action',
        excerpt: 'A short reflection on living out your faith in daily life.',
        content: '<h2>Faith in Action</h2><p>True faith is demonstrated through our actions. Let us walk in obedience to God\'s word.</p>',
        image: 'https://via.placeholder.com/800x400?text=Devotional',
        author: 'Favour Caleb Leo',
        category_id: categoryIds['Devotional']
      }
    ];

    for (const post of samplePosts) {
      await pool.query(
        `INSERT INTO posts (title, excerpt, content, image, author, category_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING`,
        [post.title, post.excerpt, post.content, post.image, post.author, post.category_id]
      );
    }

    console.log('✓ Sample posts inserted');
    console.log('\n✨ Database initialization complete!');
    console.log('You can now use the API to manage blog posts.\n');

  } catch (err) {
    console.error('❌ Error initializing database:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initializeDatabase();
