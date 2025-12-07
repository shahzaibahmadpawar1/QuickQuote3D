require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const xlsx = require('xlsx');
const Item = require('./models/Item');
const { scrapeProduct } = require('./utils/scraper');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

// Database Connection (Cached for Serverless)
let cachedDb = null;
async function connectToDatabase() {
  if (cachedDb) return cachedDb;
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quickquote3d';
  const client = await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  cachedDb = client;
  return client;
}

// Middleware to ensure DB is connected
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    console.error("DB Connection Error:", error);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// Routes
// 1. Get All Items (with optional filter)
app.get('/api/items', async (req, res) => {
  // ... existing logic ...
  try {
    const { category } = req.query;
    const query = category ? { category } : {};
    const items = await Item.find(query);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ... (other routes remain similar, just ensuring they use the middleware implicitly)

// 2. Create Single Item
app.post('/api/items', async (req, res) => {
  try {
    const newItem = new Item(req.body);
    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 3. Import Excel
app.post('/api/items/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    // Assume Excel columns match schema keys roughly
    // Map data to schema if necessary. For now expecting matching keys.
    const itemsToInsert = data.map(row => ({
      name: row.Name,
      price: row.Price,
      dimensions: {
        length: row.Length || 0,
        width: row.Width || 0,
        height: row.Height || 0
      },
      category: row.Category,
      modelUrl: row.Model_URL,
      thumbnailUrl: row.Thumbnail_URL,
      sourceLink: row.Source_Link
    }));

    await Item.insertMany(itemsToInsert);
    res.json({ message: `${itemsToInsert.length} items imported successfully` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Scrape Product
app.post('/api/scrape', async (req, res) => {
  try {
    const { url } = req.body; // Simplified scrape logic
    const data = await scrapeProduct(url);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;

// Export for Vercel
module.exports = app;

// Start server only if run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
  module.exports = app;
