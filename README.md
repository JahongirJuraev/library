# 📚 Offline Library - Shaxsiy Kutubxona

Mahalliy kitoblar kutubxonasini boshqarish uchun web-ilova. Kitoblarni qo'shish, o'qish, sevimlilarга qo'shish va qidirish imkoniyatlari.

## ✨ Xususiyatlar

- ✅ **Kitob qo'shish** - PDF, EPUB, DOC, TXT formatlarini qo'llab-quvvatlash
- ✅ **Kitob o'qish** - Brauzerda to'g'ridan-to'g'ri o'qish (PDF)
- ✅ **Cover yuklash** - Kitob muqovasi rasmini qo'shish
- ✅ **Qidiruv** - Nom va muallif bo'yicha qidirish
- ✅ **Sevimlilar** - Kitoblarni sevimlilar ro'yxatiga qo'shish
- ✅ **Dark/Light theme** - Ko'z qulayligi uchun
- ✅ **Responsive design** - Barcha qurilmalarda ishlaydi
- ✅ **Xavfsiz** - File validation va CORS himoyasi

## 🛠️ Texnologiyalar

### Frontend
- **React 19** - UI library
- **Vite** - Build tool
- **Axios** - HTTP client
- **React Toastify** - Notifications
- **CSS Variables** - Theming

### Backend
- **Node.js** - Runtime
- **Express 5** - Web framework
- **Multer** - File upload
- **UUID** - Unique IDs
- **CORS** - Cross-origin protection

## 📦 O'rnatish

### 1. Repositoriyani clone qilish
```bash
git clone <repository-url>
cd off_library_web
```

### 2. Dependencies o'rnatish
```bash
npm install
```

### 3. Papkalar yaratish
```bash
mkdir -p public/assets/books
mkdir -p public/assets/image
```

### 4. Placeholder rasm qo'shish
`public/assets/image/placeholder.png` - cover yo'q bo'lgan kitoblar uchun

### 5. Logo qo'shish
`public/assets/image/logo.png` - navbar logosi

## 🚀 Ishga tushirish

### Variant 1: Har ikkalasini bitta commandada
```bash
npm start
```

### Variant 2: Alohida terminallarda
**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - Backend:**
```bash
npm run server
```

## 🌐 URL Manzillar

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3001

## 📁 Papkalar Strukturasi

```
off_library_web/
├── public/
│   └── assets/
│       ├── books/          # Kitob fayllari
│       ├── image/          # Cover rasmlar
│       │   ├── logo.png
│       │   └── placeholder.png
│       └── sounds/         # (optional) Toast tovushlari
├── src/
│   ├── components/
│   │   ├── App/
│   │   │   ├── App.jsx
│   │   │   └── App.css
│   │   ├── Navbar/
│   │   │   ├── Navbar.jsx
│   │   │   └── Navbar.css
│   │   ├── Search/
│   │   │   ├── SearchBook.jsx
│   │   │   └── SearchBook.css
│   │   ├── BookCard/
│   │   │   ├── BookCard.jsx
│   │   │   └── BookCard.css
│   │   ├── AddBook/
│   │   │   ├── AddBook.jsx
│   │   │   └── AddBook.css
│   │   └── BookModal/
│   │       ├── BookModal.jsx
│   │       └── BookModal.css
│   ├── index.css
│   └── main.jsx
├── server.js              # Backend server
├── metadata.json          # Kitoblar ma'lumotlari
├── favorites.json         # Sevimli kitoblar
├── package.json
└── README.md
```

## 🎨 Themalar

Ilovada 2 ta tema mavjud:
- 🌙 **Dark Mode** (default)
- ☀️ **Light Mode**

Navbar'dagi theme tugmasi orqali o'zgartirish mumkin.

## 📖 Qo'llab-quvvatlanadigan Formatlar

### Kitoblar:
- PDF
- EPUB
- DOC / DOCX
- TXT
- FB2

### Cover rasmlar:
- JPG / JPEG
- PNG
- WEBP

## 🔧 Konfiguratsiya

### File Limits
**server.js**da o'zgartirish mumkin:
```javascript
limits: { 
  fileSize: 50 * 1024 * 1024 // 50MB (kitoblar)
}
```

### CORS
Agar boshqa portdan ishlatmoqchi bo'lsangiz:
```javascript
app.use(cors({
  origin: 'http://localhost:YANGI_PORT',
  // ...
}));
```

## 🐛 Muammolarni Hal Qilish

### 1. "Cannot GET /books" xatosi
✅ Backend ishga tushmagan - `npm run server` ni ishga tushiring

### 2. Cover rasm ko'rinmayapti
✅ `public/assets/image/placeholder.png` faylini qo'shing

### 3. CORS xatosi
✅ Backend va frontend bir xil domendan ishlashini tekshiring

### 4. File upload ishlamayapti
✅ `public/assets/books` va `public/assets/image` papkalarini yarating

## 📝 API Endpoints

| Method | Endpoint | Tavsif |
|--------|----------|--------|
| GET | `/books` | Barcha kitoblar |
| POST | `/books` | Yangi kitob qo'shish |
| DELETE | `/books/:id` | Kitobni o'chirish |
| GET | `/favorites` | Sevimli kitoblar |
| POST | `/favorites/:id` | Sevimlilarni toggle |

## 🤝 Hissa Qo'shish

1. Fork qiling
2. Feature branch yarating (`git checkout -b feature/AmazingFeature`)
3. Commit qiling (`git commit -m 'Add some AmazingFeature'`)
4. Push qiling (`git push origin feature/AmazingFeature`)
5. Pull Request oching

## 📄 Litsenziya

MIT License - batafsil [LICENSE](LICENSE) faylida

## 👨‍💻 Muallif

Sizning ismingiz - [@yourusername](https://github.com/yourusername)

## 🙏 Minnatdorchilik

- React jamoasi
- Express jamoasi
- Barcha open-source contributors

---

**Savol yoki muammo bo'lsa:** [Issues](https://github.com/yourusername/off_library_web/issues) sahifasida yozing