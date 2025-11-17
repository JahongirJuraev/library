import "./BookCard.css";

/**
 * BookCard Component
 * Display books list in grid format
 * 
 * @param {array} books - Array of books to display
 * @param {array} favorites - Favorite book IDs
 * @param {function} onToggleFavorite - Add/remove favorite
 * @param {function} onOpen - Open book (modal)
 * @param {function} onDeleteBook - Delete book
 */
function BookCard({ 
  books, 
  favorites = [], 
  onToggleFavorite, 
  onOpen, 
  onDeleteBook 
}) {
  
  /**
   * Placeholder image - if book has no cover
   */
  const PLACEHOLDER_IMAGE = "/assets/image/placeholder.png";

  /**
   * Empty state - if no books found
   */
  if (books.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📚</div>
        <h2>No Books Found</h2>
        <p>Try changing your search parameters or add a new book</p>
      </div>
    );
  }

  return (
    <div className="books-container">
      {books.map((book) => {
        // Check if in favorites
        const isFavorite = favorites.includes(book.id);

        return (
          <div 
            key={book.id} 
            className="book-item"
          >
            {/* Cover wrapper */}
            <div 
              className="cover-wrap"
              onClick={() => onOpen(book)}
              role="button"
              tabIndex={0}
              aria-label={`Open ${book.title}`}
            >
              {/* Cover image */}
              <img
                src={book.image || PLACEHOLDER_IMAGE}
                alt={`${book.title} cover`}
                className="book-cover"
                loading="lazy"
                onError={(e) => {
                  e.target.src = PLACEHOLDER_IMAGE;
                }}
              />

              {/* Format badge */}
              <span className="format-badge">
                {book.format || "PDF"}
              </span>

              {/* Favorite button */}
              <button
                className={`heart-btn ${isFavorite ? "active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(book.id);
                }}
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                title={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                {isFavorite ? "❤️" : "🤍"}
              </button>

              {/* Delete button */}
              <button
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteBook(book.id);
                }}
                aria-label="Delete book"
                title="Delete"
              >
                🗑️
              </button>

              {/* Hover overlay */}
              <div className="book-overlay">
                <span className="overlay-text">📖 Read</span>
              </div>
            </div>

            {/* Book metadata */}
            <div className="book-meta">
              <h3 className="book-title" title={book.title}>
                {book.title}
              </h3>
              
              <p className="book-author" title={book.author}>
                {book.author || "Unknown Author"}
              </p>
              
              <span className="book-year">
                {book.year || "—"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default BookCard;