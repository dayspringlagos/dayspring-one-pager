require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function resetDatabase() {
  try {
    console.log('Resetting database...');

    // Drop existing tables
    await pool.query(`
      DROP TABLE IF EXISTS posts CASCADE;
      DROP TABLE IF EXISTS categories CASCADE;
    `);

    console.log('✓ Old tables dropped');

    // Create new tables
    await pool.query(`
      CREATE TABLE categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL UNIQUE,
        slug VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE posts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        excerpt TEXT NOT NULL,
        content TEXT NOT NULL,
        image VARCHAR(500),
        author VARCHAR(100),
        category_id UUID REFERENCES categories(id),
        highlights TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
      CREATE INDEX idx_posts_category_id ON posts(category_id);
    `);

    console.log('✓ New tables created successfully');

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
         RETURNING id, name`,
        [cat.name, slug, cat.description]
      );
      if (result.rows.length > 0) {
        categoryIds[cat.name] = result.rows[0].id;
      }
    }

    console.log('✓ Sample categories inserted');

    // Insert sample posts
    const samplePosts = [
      {
        title: 'Welcome to Dayspring Blog',
        slug: 'welcome-to-dayspring-blog',
        excerpt: 'Your source for spiritual insights, teachings, and stories from our community.',
        content: '<h2>Welcome</h2><p>Welcome to the Dayspring Lagos blog where we share teachings, devotionals, and testimonies.</p>',
        image: 'https://via.placeholder.com/800x400?text=Welcome',
        author: 'Dayspring Team',
        highlights: JSON.stringify([
          { type: 'quote', content: 'Welcome to our community of believers.' },
          { type: 'verse', content: '1 John 1:7 - "But if we walk in the light, as he is in the light, we have fellowship with one another"' }
        ]),
        category_id: categoryIds['News']
      },
      {
        title: 'The Power of Prayer',
        slug: 'the-power-of-prayer',
        excerpt: 'Discover how prayer transforms lives and deepens your relationship with God.',
        content: '<h2>The Power of Prayer</h2><p>Prayer is the foundation of our faith. Through prayer, we connect with God and experience His guidance.</p>',
        image: 'https://via.placeholder.com/800x400?text=Prayer',
        author: 'Pastor Caleb Leo',
        highlights: JSON.stringify([
          { type: 'quote', content: 'Prayer is the foundation of our faith.' },
          { type: 'verse', content: 'Philippians 4:6 - "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God."' }
        ]),
        category_id: categoryIds['Teaching']
      },
      {
        title: 'Daily Devotional: Faith in Action',
        slug: 'daily-devotional-faith-in-action',
        excerpt: 'A short reflection on living out your faith in daily life.',
        content: '<h2>Faith in Action</h2><p>True faith is demonstrated through our actions. Let us walk in obedience to God\'s word.</p>',
        image: 'https://via.placeholder.com/800x400?text=Devotional',
        author: 'Favour Caleb Leo',
        highlights: JSON.stringify([
          { type: 'quote', content: 'True faith is demonstrated through our actions.' },
          { type: 'verse', content: 'James 2:26 - "As the body without the spirit is dead, so faith without deeds is dead."' }
        ]),
        category_id: categoryIds['Devotional']
      }
    ];

    for (const post of samplePosts) {
      await pool.query(
        `INSERT INTO posts (title, slug, excerpt, content, image, author, category_id, highlights)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [post.title, post.slug, post.excerpt, post.content, post.image, post.author, post.category_id, post.highlights]
      );
    }

    console.log('✓ Sample posts inserted');
    console.log('\n✨ Database reset complete!\n');

  } catch (err) {
    console.error('❌ Error resetting database:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

resetDatabase();
