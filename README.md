# Dayspring Lagos Blog System

Complete blog management system with database-driven content, admin dashboard, and REST API.

## 🚀 System Architecture

```
├── web.html              # Main website (landing page + blog link)
├── blog.html             # Public blog (displays posts from database)
├── dashboard.html        # Admin dashboard (create/edit/delete posts & categories)
├── server.js             # Express API backend
├── package.json          # Node.js dependencies
├── .env                  # Environment variables (DATABASE_URL, PORT)
└── scripts/
    ├── init-db.js        # Initialize database schema
    └── reset-db.js       # Reset database (development only)
```

## 🗄️ Database Schema

All blog content is stored in Neon PostgreSQL. No hardcoded content.

### Posts Table
```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  image VARCHAR(500),
  author VARCHAR(100),
  category_id UUID REFERENCES categories(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Categories Table
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 📋 Files in This Project

### Frontend Files (3 files)
- **web.html** - Main website homepage with navigation to blog
- **blog.html** - Public-facing blog that fetches all posts from database
- **dashboard.html** - Admin dashboard for managing posts and categories

### Backend Files (4 files)
- **server.js** - Express.js API server with CORS enabled
- **package.json** - Node.js project configuration
- **.env** - Environment variables (git-ignored, DATABASE_URL, PORT)
- **.gitignore** - Git configuration to exclude sensitive files

### Database Scripts (2 files)
- **scripts/init-db.js** - Creates tables and inserts sample data
- **scripts/reset-db.js** - Drops and recreates all tables (development only)

### Static Assets (4 images)
- **dayspring-logo.png** - Church logo
- **caleb.jpg** - Pastor Caleb Leo image
- **favour.jpg** - Pastor Favour image
- **daddy.jpg** - Rev. Leo N. Ezidi image

**Total**: 13 files (no unnecessary/hardcoded files)

## 🔄 Data Flow

```
User visits web.html → Clicks "Blog" → Opens blog.html
                           ↓
blog.html executes JavaScript
                           ↓
JavaScript: fetch('/api/posts')
                           ↓
Express server (server.js) queries Neon database
                           ↓
Returns posts with category_name
                           ↓
blog.html displays posts dynamically
                           
---

Admin: Open dashboard.html
                           ↓
Create/Edit/Delete posts via dashboard UI
                           ↓
Dashboard makes API calls (POST/PUT/DELETE)
                           ↓
server.js updates Neon database
                           ↓
Blog automatically shows updated content
```

## 🚀 Quick Start

### 1. Start Development Server
```bash
npm run dev
```
Server runs on `http://localhost:3001`

### 2. Access Application
- **Main Website**: Open `web.html` in browser
- **Public Blog**: Click "Blog" link on web.html (or open `blog.html`)
- **Admin Dashboard**: Open `dashboard.html`

### 3. Reset Database (if needed)
```bash
npm run db:reset
```

## 📡 API Endpoints

### Posts (Database-Driven)
- `GET /api/posts` - Fetch all posts **with category names**
- `GET /api/posts/:id` - Fetch single post
- `POST /api/posts` - Create new post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `GET /api/search?q=keyword` - Search posts

### Categories (Database-Driven)
- `GET /api/categories` - Fetch all categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Health
- `GET /api/health` - Check API status

## 🔧 Configuration

### Environment Variables (.env)
```
DATABASE_URL=postgresql://neondb_owner:npg_xxx@ep-xxx.aws.neon.tech/neondb?sslmode=require
PORT=3001
NODE_ENV=development
```

### Change API Endpoint (for Production)
Update in both `blog.html` and `dashboard.html`:
```javascript
// Line 267 in blog.html
const API_BASE = 'https://api.dayspringlagos.com/api'; // Production URL

// Line 224 in dashboard.html
const API_BASE = 'https://api.dayspringlagos.com/api'; // Production URL
```

## 📊 Current Database Content

### Categories
- Teaching - Scripture-based teachings and lessons
- Devotional - Daily devotionals and reflections
- News - Church news and updates
- Testimony - Member testimonies and faith stories

### Posts
All posts are stored in database and fetched dynamically:
- Welcome to Dayspring Blog
- The Power of Prayer
- Daily Devotional: Faith in Action

## ✨ Features

✅ **100% Database-Driven** - All blog content comes from Neon PostgreSQL
✅ **Admin Dashboard** - Create, edit, delete posts and categories
✅ **Rich Text Editor** - Quill.js for formatting blog content
✅ **Category Management** - Organize posts by category
✅ **Search Functionality** - Search posts by title, excerpt, or content
✅ **Responsive Design** - Works on desktop, tablet, mobile
✅ **Image Support** - Add featured images to posts
✅ **Author Attribution** - Track who wrote each post
✅ **REST API** - Full API for content management
✅ **CORS Enabled** - API can be accessed from separate domain

## 🚀 Deployment

### Local Development
```bash
npm run dev
# Server on http://localhost:3001
# Open web.html, blog.html, or dashboard.html in browser
```

### Production Deployment

#### Option 1: Heroku
```bash
heroku create dayspring-blog-api
heroku config:set DATABASE_URL="your_neon_url"
git push heroku main
```

#### Option 2: Railway.app
1. Connect GitHub repo
2. Add DATABASE_URL environment variable
3. Deploy automatically

#### Option 3: Render
1. Create Web Service
2. Connect GitHub
3. Add DATABASE_URL environment
4. Deploy

## 📝 Creating Posts

### Method 1: Admin Dashboard (Recommended)
1. Open `dashboard.html`
2. Click "New Post"
3. Fill in: Title, Excerpt, Content, Author, Category, Image
4. Click "Publish Post"
5. ✅ Post appears on blog immediately

### Method 2: API (cURL)
```bash
curl -X POST http://localhost:3001/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Post",
    "excerpt": "Summary",
    "content": "<h2>HTML Content</h2>",
    "author": "Pastor Name",
    "category_id": "uuid",
    "image": "https://example.com/image.jpg"
  }'
```

## 🛡️ Security

- ✅ No hardcoded content (all from database)
- ✅ Environment variables for sensitive data
- ✅ CORS enabled for cross-domain access
- ✅ SQL injection prevention (parameterized queries)
- ✅ Images hosted externally (no server storage needed)

**Recommendation**: Add authentication/password to dashboard.html for production.

## 🐛 Troubleshooting

### Blog shows no posts
```bash
# Check if API is running
curl http://localhost:3001/api/health

# Check posts exist
curl http://localhost:3001/api/posts

# Reset database
npm run db:reset
```

### API connection error
- Verify DATABASE_URL in .env
- Check Neon console for active connections
- Verify port 3001 is not in use

### Dashboard not updating
- Check browser console (F12)
- Verify API_BASE URL is correct
- Check Network tab for failed requests

## 📚 NPM Scripts

```bash
npm run dev       # Start with auto-reload (nodemon)
npm start        # Start server
npm run db:init  # Initialize database
npm run db:reset # Reset database (drop & recreate)
```

## 🔗 Resources

- [Neon Database Console](https://console.neon.tech)
- [Express.js Documentation](https://expressjs.com)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Quill Rich Text Editor](https://quilljs.com)

---

**System**: Database-Driven Blog
**Database**: Neon PostgreSQL
**Backend**: Express.js / Node.js
**Frontend**: HTML, Tailwind CSS, Vanilla JavaScript
**Status**: ✅ Fully Functional
