import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const app = express();

// ============================================
// CORS - Accept requests only from frontend
// ============================================
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Support multiple origins
  methods: ['GET', 'POST', 'DELETE'],
  credentials: true
}));

app.use(express.json());

// ============================================
// DIRECTORIES FOR FILES AND METADATA
// ============================================
const BOOKS_DIR = path.join(process.cwd(), "public", "assets", "books");
const IMAGES_DIR = path.join(process.cwd(), "public", "assets", "image");
const META_FILE = path.join(process.cwd(), "metadata.json");
const FAVORITES_FILE = path.join(process.cwd(), "favorites.json");

// Create directories if they don't exist
if (!fs.existsSync(BOOKS_DIR)) fs.mkdirSync(BOOKS_DIR, { recursive: true });
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

// Create metadata and favorites files (with empty array)
if (!fs.existsSync(META_FILE)) fs.writeFileSync(META_FILE, JSON.stringify([], null, 2));
if (!fs.existsSync(FAVORITES_FILE)) fs.writeFileSync(FAVORITES_FILE, JSON.stringify([], null, 2));

// ============================================
// MULTER CONFIGURATION (File Upload)
// ============================================
const storage = multer.diskStorage({
  // Where to save the file
  destination: (req, file, cb) => {
    if (file.fieldname === "book") {
      cb(null, BOOKS_DIR);
    } else if (file.fieldname === "cover") {
      cb(null, IMAGES_DIR);
    } else {
      cb(new Error("Unknown file field"));
    }
  },
  
  // Make filename unique
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

// File validation - only allowed files
const upload = multer({
  storage,
  limits: { 
    fileSize: 50 * 1024 * 1024 // 50MB max size
  },
  fileFilter: (req, file, cb) => {
    // Allowed formats - ONLY SUPPORTED FORMATS
    const allowedBooks = ['.pdf', '.txt', '.fb2']; // Removed: .epub, .doc, .docx
    const allowedImages = ['.jpg', '.jpeg', '.png', '.webp'];
    
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (file.fieldname === 'book' && allowedBooks.includes(ext)) {
      cb(null, true);
    } else if (file.fieldname === 'cover' && allowedImages.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${ext}. Only PDF, TXT, FB2 are supported.`));
    }
  }
});

// ============================================
// API ENDPOINTS
// ============================================

/**
 * GET /books
 * Get all books
 */
app.get("/books", (req, res) => {
  try {
    const meta = JSON.parse(fs.readFileSync(META_FILE, 'utf-8'));
    res.json({ 
      success: true, 
      books: meta,
      count: meta.length 
    });
  } catch (err) {
    console.error("Error reading books:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error occurred" 
    });
  }
});

/**
 * POST /books
 * Add new book
 */
app.post("/books", upload.fields([
  { name: "book", maxCount: 1 },
  { name: "cover", maxCount: 1 }
]), (req, res) => {
  try {
    const { title, author, year } = req.body;
    const bookFile = req.files["book"]?.[0];
    const coverFile = req.files["cover"]?.[0];

    // Validation
    if (!title || !bookFile) {
      return res.status(400).json({ 
        success: false, 
        message: "Please provide book title and file!" 
      });
    }

    // Read metadata
    const meta = JSON.parse(fs.readFileSync(META_FILE, 'utf-8'));
    
    // New book object
    const newBook = {
      id: uuidv4(), // Unique ID
      title: title.trim(),
      author: author?.trim() || "Unknown",
      year: year?.trim() || "",
      format: path.extname(bookFile.originalname).slice(1).toUpperCase(),
      file: `/assets/books/${bookFile.filename}`,
      image: coverFile ? `/assets/image/${coverFile.filename}` : null,
      addedAt: new Date().toISOString()
    };
    
    // Add to metadata (at beginning)
    meta.unshift(newBook);
    fs.writeFileSync(META_FILE, JSON.stringify(meta, null, 2));

    console.log("✅ New book added:", newBook.title);
    
    res.json({ 
      success: true, 
      book: newBook,
      message: "Book added successfully!" 
    });
  } catch (err) {
    console.error("Error adding book:", err);
    res.status(500).json({ 
      success: false, 
      message: err.message || "Server error" 
    });
  }
});

/**
 * DELETE /books/:id
 * Delete book (file + metadata)
 */
app.delete("/books/:id", (req, res) => {
  try {
    const { id } = req.params;
    
    // Read metadata
    const meta = JSON.parse(fs.readFileSync(META_FILE, 'utf-8'));
    const book = meta.find(b => b.id === id);
    
    if (!book) {
      return res.status(404).json({ 
        success: false, 
        message: "Book not found" 
      });
    }
    
    // Delete book file
    if (book.file) {
      const bookPath = path.join(process.cwd(), "public", book.file);
      if (fs.existsSync(bookPath)) {
        fs.unlinkSync(bookPath);
        console.log("🗑️ Book file deleted:", book.file);
      }
    }
    
    // Delete cover file
    if (book.image) {
      const coverPath = path.join(process.cwd(), "public", book.image);
      if (fs.existsSync(coverPath)) {
        fs.unlinkSync(coverPath);
        console.log("🗑️ Cover file deleted:", book.image);
      }
    }
    
    // Delete from metadata
    const updatedMeta = meta.filter(b => b.id !== id);
    fs.writeFileSync(META_FILE, JSON.stringify(updatedMeta, null, 2));
    
    // Delete from favorites too
    const favorites = JSON.parse(fs.readFileSync(FAVORITES_FILE, 'utf-8'));
    const updatedFavorites = favorites.filter(fId => fId !== id);
    fs.writeFileSync(FAVORITES_FILE, JSON.stringify(updatedFavorites, null, 2));
    
    console.log("✅ Book completely deleted:", book.title);
    
    res.json({ 
      success: true, 
      message: "Book deleted successfully" 
    });
  } catch (err) {
    console.error("Error deleting book:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});

/**
 * GET /favorites
 * Get all favorites
 */
app.get("/favorites", (req, res) => {
  try {
    const favorites = JSON.parse(fs.readFileSync(FAVORITES_FILE, 'utf-8'));
    res.json({ 
      success: true, 
      favorites,
      count: favorites.length 
    });
  } catch (err) {
    console.error("Error reading favorites:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});

/**
 * POST /favorites/:id
 * Toggle favorite (add or remove)
 */
app.post("/favorites/:id", (req, res) => {
  try {
    const { id } = req.params;
    
    // Read favorites
    let favorites = JSON.parse(fs.readFileSync(FAVORITES_FILE, 'utf-8'));
    
    // Toggle: remove if exists, add if not
    if (favorites.includes(id)) {
      favorites = favorites.filter(fId => fId !== id);
      console.log("💔 Removed from favorites:", id);
    } else {
      favorites.push(id);
      console.log("❤️ Added to favorites:", id);
    }
    
    // Save
    fs.writeFileSync(FAVORITES_FILE, JSON.stringify(favorites, null, 2));
    
    res.json({ 
      success: true, 
      favorites,
      message: "Favorites updated" 
    });
  } catch (err) {
    console.error("Error updating favorites:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});

// ============================================
// STATIC FILES (Books and Images)
// ============================================
// Add CORS headers for static files
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
  res.header('Access-Control-Expose-Headers', 'Accept-Ranges, Content-Length, Content-Range');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Static files with proper MIME types
app.use("/assets/books", express.static(BOOKS_DIR, {
  setHeaders: (res, path) => {
    if (path.endsWith('.pdf')) {
      res.set('Content-Type', 'application/pdf');
      res.set('Accept-Ranges', 'bytes');
    }
  }
}));

app.use("/assets/image", express.static(IMAGES_DIR));

// Serve public directory for all assets
app.use(express.static('public'));

// ============================================
// GLOBAL ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err);
  res.status(500).json({ 
    success: false, 
    message: err.message || "Server error occurred" 
  });
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running at: http://localhost:${PORT}`);
  console.log(`📚 Books directory: ${BOOKS_DIR}`);
  console.log(`🖼️ Images directory: ${IMAGES_DIR}`);
  console.log(`📄 Metadata file: ${META_FILE}`);
  console.log(`❤️ Favorites file: ${FAVORITES_FILE}\n`);
});