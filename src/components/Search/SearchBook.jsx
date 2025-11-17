import "./SearchBook.css";

/**
 * SearchBook Component
 * Search books by title and author
 * 
 * @param {string} value - Search text
 * @param {function} onChange - Function to change search text
 */
function SearchBook({ value, onChange }) {

  return (
    <div className="search-container">
      <div className="search-bar">

        {/* Input field */}
        <input
          type="text"
          // className="search-input"
          placeholder="Search by title or author..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Search books"
        />
      </div>

      {/* Results count (if search exists) */}
      {value && (
        <p className="search-hint text-3xl mx-auto max-w-sm items-center gap-x-4 rounded-xl">
          Searching: <strong>"{value}"</strong>
        </p>
      )}
    </div>
  );
}

export default SearchBook;