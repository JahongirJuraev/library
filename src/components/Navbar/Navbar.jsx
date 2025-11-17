import "./Navbar.css";
import logo from "/assets/image/logo.png";

/**
 * Navbar Component
 *
 * @param {function} openAddModal - Open add book modal
 * @param {boolean} showFavorites - Are favorites displayed
 * @param {function} onShowAll - Show all books
 * @param {function} onShowFavorites - Show only favorites
 * @param {string} theme - Current theme (dark/light)
 * @param {function} toggleTheme - Toggle theme
 */
function Navbar({
  openAddModal,
  showFavorites,
  onShowAll,
  onShowFavorites,
  theme,
  toggleTheme,
}) {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-logo">
          <img src={logo} alt="Library Logo" />
          <h1 className="navbar-title">Оффлайн <br /> БИБЛИОТЕКА</h1>
        </div>

        {/* Navigation Buttons */}
        <ul className="navbar-menu">
          {/* All books */}
          <li>
            <button
              className={`nav-btn ${!showFavorites ? "active" : ""}`}
              onClick={onShowAll}
              aria-label="Show all books"
            >
              📚 All Books
            </button>
          </li>

          {/* Favorite books */}
          <li>
            <button
              className={`nav-btn ${showFavorites ? "active" : ""}`}
              onClick={onShowFavorites}
              aria-label="Show favorite books"
            >
              ❤️ Favorites
            </button>
          </li>

          {/* Add book */}
          <li>
            <button
              className="nav-btn btn-add"
              onClick={openAddModal}
              aria-label="Add new book"
            >
              ➕ Add Book
            </button>
          </li>

          {/* Theme toggle */}
          <li>
            <button
              className="nav-btn btn-theme"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title={theme === "dark" ? "Light Mode" : "Dark Mode"}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
