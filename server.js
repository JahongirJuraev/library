import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const app = express();

// ======================================================
// UNIVERSAL PATHS (работает в ZIP, на флешке, в dist)
// ======================================================
const ROOT = path.dirname(new URL(import.meta.url).pathname);
const PUBLIC_DIR = path.join(ROOT, "public");
const DIST_DIR = path.join(ROOT, "dist");

const BOOKS_DIR = path.join(PUBLIC_DIR, "assets", "books");
const IMAGES_DIR = path.join(PUBLIC_DIR, "assets", "image");

const META_FILE = path.join(ROOT, "metadata.json");
const FAVORITES_FILE = path.join(ROOT, "favorites.json");

// Создаём директории
fs.mkdirSync(BOOKS_DIR, { recursive: true });
fs.mkdirSync(IMAGES_DIR, { recursive: true });

if (!fs.existsSync(META_FILE)) fs.writeFileSync(META_FILE, "[]");
if (!fs.existsSync(FAVORITES_FILE)) fs.writeFileSync(FAVORITES_FILE, "[]");

// ======================================================
// CORS — разрешаем file:// и любой локальный доступ
// ======================================================
app.use(cors({
  origin: (origin, callback) => {
    callback(null, true); // разрешаем всё (локальное приложение)
  },
  methods: ["GET", "POST", "DELETE"],
  credentials: true
}));

app.use(express.json());

// ======================================================
// Multer — загрузка файлов
// ======================================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, file.fieldname === "book" ? BOOKS_DIR : IMAGES_DIR);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    const bookExt = [".pdf", ".txt", ".fb2"];
    const imageExt = [".jpg", ".jpeg", ".png", ".webp"];

    if (file.fieldname === "book" && bookExt.includes(ext)) return cb(null, true);
    if (file.fieldname === "cover" && imageExt.includes(ext)) return cb(null, true);

    cb(new Error("Unsupported file type"));
  }
});

// ======================================================
// API
// ======================================================
app.get("/books", (req, res) => {
  const data = JSON.parse(fs.readFileSync(META_FILE));
  res.json({ success: true, books: data });
});

app.post("/books",
  upload.fields([{ name: "book", maxCount: 1 }, { name: "cover", maxCount: 1 }]),
  (req, res) => {
    try {
      const { title, author, year } = req.body;
      const book = req.files.book?.[0];

      if (!title || !book) {
        return res.status(400).json({ success: false, message: "No title or file" });
      }

      const meta = JSON.parse(fs.readFileSync(META_FILE));

      const newBook = {
        id: uuidv4(),
        title,
        author: author || "Unknown",
        year: year || "",
        format: path.extname(book.originalname).substring(1).toUpperCase(),
        file: `/assets/books/${book.filename}`,
        image: req.files.cover?.[0] ? `/assets/image/${req.files.cover[0].filename}` : null,
        addedAt: new Date().toISOString()
      };

      meta.unshift(newBook);
      fs.writeFileSync(META_FILE, JSON.stringify(meta, null, 2));

      res.json({ success: true, book: newBook });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  }
);

app.delete("/books/:id", (req, res) => {
  const id = req.params.id;

  const meta = JSON.parse(fs.readFileSync(META_FILE));
  const book = meta.find(b => b.id === id);
  if (!book) return res.status(404).json({ success: false });

  if (book.file) {
    const p = path.join(PUBLIC_DIR, book.file);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }

  if (book.image) {
    const p = path.join(PUBLIC_DIR, book.image);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }

  const updated = meta.filter(b => b.id !== id);
  fs.writeFileSync(META_FILE, JSON.stringify(updated, null, 2));

  let fav = JSON.parse(fs.readFileSync(FAVORITES_FILE));
  fav = fav.filter(f => f !== id);
  fs.writeFileSync(FAVORITES_FILE, JSON.stringify(fav, null, 2));

  res.json({ success: true });
});

// Favorites
app.get("/favorites", (req, res) => {
  res.json({ success: true, favorites: JSON.parse(fs.readFileSync(FAVORITES_FILE)) });
});

app.post("/favorites/:id", (req, res) => {
  const id = req.params.id;
  let fav = JSON.parse(fs.readFileSync(FAVORITES_FILE));

  fav = fav.includes(id) ? fav.filter(f => f !== id) : [...fav, id];

  fs.writeFileSync(FAVORITES_FILE, JSON.stringify(fav, null, 2));
  res.json({ success: true, favorites: fav });
});

// Static files (books + images)
app.use("/assets/books", express.static(BOOKS_DIR));
app.use("/assets/image", express.static(IMAGES_DIR));
app.use("/public", express.static(PUBLIC_DIR));

// ======================================================
// SERVE FRONTEND (React build)
// ======================================================
app.use(express.static(DIST_DIR));

app.get("*", (req, res) => {
  res.sendFile(path.join(DIST_DIR, "index.html"));
});

// ======================================================
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running → http://localhost:${PORT}`);
});
