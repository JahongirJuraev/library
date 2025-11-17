import "./App.css";
import { useState, useEffect } from "react";

// Komponentlar
import Navbar from "../Navbar/Navbar";
import Search from "../Search/SearchBook";
import BookCard from "../BookCard/BookCard";
import BookModal from "../BookModal/BookModal";
import AddBook from "../AddBook/AddBook";

// Toast notifications
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Backend URL
const API_URL = "http://localhost:3001";

function App() {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [books, setBooks] = useState([]); // Barcha kitoblar
  const [selectedBook, setSelectedBook] = useState(null); // Ochilgan kitob (modal)
  const [showAddModal, setShowAddModal] = useState(false); // Kitob qo'shish modali
  const [search, setSearch] = useState(""); // Qidiruv matni
  const [loading, setLoading] = useState(true); // Yuklanish holati
  const [userInteracted, setUserInteracted] = useState(false); // Foydalanuvchi biror narsa bosganmi
  const [favorites, setFavorites] = useState([]); // Sevimli kitoblar ID lari
  const [showFavorites, setShowFavorites] = useState(false); // Faqat sevimlilarni ko'rsatish

  // Theme state - localStorage dan olish (dark default)
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved || "dark";
  });

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  /**
   * Toast notification display
   * @param {string} msg - Message text
   * @param {string} type - "success" or "error"
   */
  const notify = (msg, type = "success") => {
    if (!userInteracted) return; // Don't show toast if user hasn't interacted

    if (type === "success") {
      // Success audio
      const audio = new Audio("/assets/sounds/success.mp3");
      audio.volume = 0.5;
      audio.play().catch((err) => console.log("Audio play error:", err));

      toast.success(msg, {
        theme: "dark",
        autoClose: 2000,
        position: "top-right",
      });
    } else if (type === "error") {
      // Error audio
      const audio = new Audio("/assets/sounds/error.mp3");
      audio.volume = 0.5;
      audio.play().catch((err) => console.log("Audio play error:", err));

      toast.error(msg, {
        theme: "dark",
        autoClose: 2500,
        position: "top-right",
      });
    }
  };

  /**
   * Barcha kitoblarni ko'rsatish
   */
  const showAllBooks = () => setShowFavorites(false);

  /**
   * Faqat sevimli kitoblarni ko'rsatish
   */
  const showOnlyFavorites = () => setShowFavorites(true);

  /**
   * Kitob modalini ochish
   * @param {object} book - Ochilayotgan kitob obyekti
   */
  const openBook = (book) => setSelectedBook(book);

  /**
   * Kitob modalini yopish
   */
  const closeBook = () => setSelectedBook(null);

  /**
   * Theme o'zgartirish (dark <-> light)
   */
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  // ============================================
  // API CALLS
  // ============================================

  /**
   * Serverdan barcha kitoblarni yuklash
   */
  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/books`);
      const data = await response.json();

      if (data.success) {
        setBooks(data.books);
        console.log(`📚 ${data.count} ta kitob yuklandi`);
      } else {
        notify("Kitoblarni yuklashda xatolik", "error");
      }
    } catch (err) {
      console.error("❌ Fetch books error:", err);
      notify("Server bilan bog'lanishda xatolik", "error");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Serverdan sevimli kitoblarni yuklash
   */
  const fetchFavorites = async () => {
    try {
      const response = await fetch(`${API_URL}/favorites`);
      const data = await response.json();

      if (data.success) {
        setFavorites(data.favorites);
        console.log(`❤️ ${data.count} ta sevimli kitob yuklandi`);
      }
    } catch (err) {
      console.error("❌ Fetch favorites error:", err);
    }
  };

  /**
   * Yangi kitob qo'shish
   * @param {object} newBook - Server tomonidan qaytarilgan kitob obyekti
   */
  const handleAddBook = (newBook) => {
    setBooks([newBook, ...books]); // Boshiga qo'shish
    setShowAddModal(false); // Modalni yopish
    notify("📚 Kitob muvaffaqiyatli qo'shildi!", "success");
  };

  /**
   * Kitobni o'chirish
   * @param {string} id - O'chiriladigan kitob ID si
   */
  const handleDeleteBook = async (id) => {
    // Tasdiqlash
    if (!window.confirm("Вы уверены, что хотите удалить эту книгу?")) return;

    try {
      const response = await fetch(`${API_URL}/books/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (result.success) {
        // Local state'dan o'chirish
        setBooks(books.filter((b) => b.id !== id));

        // Agar ochiq bo'lsa, modalni yopish
        if (selectedBook?.id === id) {
          setSelectedBook(null);
        }

        notify("🗑️ Kitob o'chirildi", "success");
      } else {
        notify(result.message || "Kitobni o'chirishda xatolik", "error");
      }
    } catch (err) {
      console.error("❌ Delete book error:", err);
      notify("Server bilan bog'lanishda xatolik", "error");
    }
  };

  /**
   * Sevimli kitobga qo'shish/olib tashlash
   * @param {string} bookId - Kitob ID si
   */
  const toggleFavorite = async (bookId) => {
    try {
      const response = await fetch(`${API_URL}/favorites/${bookId}`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        setFavorites(data.favorites);
      }
    } catch (err) {
      console.error("❌ Toggle favorite error:", err);
      notify("Xatolik yuz berdi", "error");
    }
  };

  // ============================================
  // FILTER & SEARCH
  // ============================================

  /**
   * Qidiruv - nom va muallif bo'yicha
   */
  const filteredBooks = books.filter((book) => {
    const searchLower = search.toLowerCase();
    const titleMatch = (book.title || "").toLowerCase().includes(searchLower);
    const authorMatch = (book.author || "").toLowerCase().includes(searchLower);

    return titleMatch || authorMatch;
  });

  /**
   * Ko'rsatiladigan kitoblar - sevimlilar yoki hammasi
   */
  const visibleBooks = showFavorites
    ? filteredBooks.filter((b) => favorites.includes(b.id))
    : filteredBooks;

  // ============================================
  // SIDE EFFECTS
  // ============================================

  /**
   * Component yuklanganda ma'lumotlarni olish
   */
  useEffect(() => {
    fetchBooks();
    fetchFavorites();
  }, []); // Faqat birinchi marta

  /**
   * Theme o'zgarganda body class ni yangilash
   */
  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  /**
   * Modal ochilganda body scroll ni to'xtatish
   */
  useEffect(() => {
    document.body.style.overflow = selectedBook ? "hidden" : "auto";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [selectedBook]);

  // ============================================
  // RENDER
  // ============================================
  return (
    <div
      className={`app-container ${theme}`}
      onClick={() => setUserInteracted(true)} // Birinchi click uchun
    >
      {/* Navigatsiya */}
      <Navbar
        openAddModal={() => setShowAddModal(true)}
        showFavorites={showFavorites}
        onShowAll={showAllBooks}
        onShowFavorites={showOnlyFavorites}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Yuklanish holati */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Kitoblar yuklanmoqda...</p>
        </div>
      ) : (
        <>
          {/* Qidiruv */}
          <Search value={search} onChange={setSearch} />

          {/* Kitoblar ro'yxati */}
          <BookCard
            books={visibleBooks}
            favorites={favorites}
            onOpen={openBook}
            onToggleFavorite={toggleFavorite}
            onDeleteBook={handleDeleteBook}
          />
        </>
      )}

      {/* Kitob qo'shish modali */}
      {showAddModal && (
        <AddBook onClose={() => setShowAddModal(false)} onAdd={handleAddBook} />
      )}

      {/* Kitob o'qish modali */}
      {selectedBook && <BookModal book={selectedBook} onClose={closeBook} />}

      {/* Toast container */}
      <ToastContainer
        position="top-right"
        theme="dark"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}

export default App;
