import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "./AddBook.css";

/**
 * AddBook Component
 * Modal for adding new book
 * 
 * @param {function} onAdd - Callback called after book is added
 * @param {function} onClose - Function to close modal
 */
function AddBook({ onAdd, onClose }) {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [year, setYear] = useState("");
  const [bookFile, setBookFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [coverPreview, setCoverPreview] = useState(null);

  // ============================================
  // AUDIO FUNCTIONS
  // ============================================
  
  /**
   * Play success audio
   */
  const playSuccessSound = () => {
    const audio = new Audio('/assets/sounds/success.mp3');
    audio.volume = 0.5;
    audio.play().catch(err => console.log('Audio play error:', err));
  };

  /**
   * Play error audio
   */
  const playErrorSound = () => {
    const audio = new Audio('/assets/sounds/error.mp3');
    audio.volume = 0.5;
    audio.play().catch(err => console.log('Audio play error:', err));
  };

  // ============================================
  // FILE HANDLERS
  // ============================================

  /**
   * Select book file
   */
  const handleBookFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error("❌ File size must not exceed 50MB!");
        playErrorSound();
        return;
      }
      setBookFile(file);
    }
  };

  /**
   * Validate year input (only numbers, max 4 digits)
   */
  const handleYearChange = (e) => {
    const value = e.target.value;
    // Only numbers and max 4 digits
    if (/^\d{0,4}$/.test(value)) {
      setYear(value);
    }
  };

  /**
   * Select cover image and show preview
   */
  const handleCoverFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("❌ Image size must not exceed 5MB!");
        playErrorSound();
        return;
      }
      
      setCoverFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Remove cover image
   */
  const handleRemoveCover = () => {
    setCoverFile(null);
    setCoverPreview(null);
  };

  // ============================================
  // FORM SUBMISSION
  // ============================================

  /**
   * Submit form
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!title.trim()) {
      toast.error("❌ Please enter book title!");
      playErrorSound();
      return;
    }

    if (!bookFile) {
      toast.error("❌ Please select a book file!");
      playErrorSound();
      return;
    }

    if (!coverFile) {
      toast.error("❌ Please select a cover image!");
      playErrorSound();
      return;
    }

    setIsLoading(true);

    // Create FormData
    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("author", author.trim() || "Unknown");
    formData.append("year", year.trim() || "");
    formData.append("book", bookFile);
    if (coverFile) formData.append("cover", coverFile);

    try {
      // Send to server
      const response = await axios.post("http://localhost:3001/books", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`⬆️ Uploading: ${percentCompleted}%`);
        },
      });

      if (response.data.success) {
        // Send new book to parent component
        onAdd(response.data.book);
        
        toast.success("📚 Book added successfully!");
        playSuccessSound();
        
        // Close modal
        onClose();
      } else {
        toast.error(response.data.message || "❌ An error occurred");
        playErrorSound();
      }
    } catch (err) {
      console.error("❌ Add book error:", err);
      
      playErrorSound();
      
      if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else if (err.code === "ERR_NETWORK") {
        toast.error("❌ Connection error with server");
      } else {
        toast.error("❌ An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Close modal (ESC key)
   */
  const handleKeyDown = (e) => {
    if (e.key === "Escape" && !isLoading) {
      onClose();
    }
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div 
        className="modal-content add-book-modal" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          className="modal-close"
          onClick={onClose}
          disabled={isLoading}
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Modal title */}
        <h2 className="modal-title">➕ Add New Book</h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="addbook-form">
          
          {/* Title & Author - in one row */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="book-title">
                Book Title <span className="required">*</span>
              </label>
              <input
                id="book-title"
                type="text"
                placeholder="e.g. War and Peace"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isLoading}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="book-author">Author</label>
              <input
                id="book-author"
                type="text"
                placeholder="e.g. Leo Tolstoy"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Year */}
          <div className="form-group">
            <label htmlFor="book-year">Year</label>
            <input
              id="book-year"
              type="text"
              placeholder="e.g. 1869"
              value={year}
              onChange={handleYearChange}
              maxLength="4"
              disabled={isLoading}
            />
          </div>

          {/* Book file */}
          <div className="form-group">
            <label htmlFor="book-file">
              Book File (PDF, TXT, FB2 only) <span className="required">*</span>
            </label>
            <input
              id="book-file"
              type="file"
              accept=".pdf,.txt,.fb2"
              onChange={handleBookFileChange}
              disabled={isLoading}
            />
            {bookFile && (
              <p className="file-info">
                📄 {bookFile.name} ({(bookFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {/* Cover file */}
          <div className="form-group">
            <label htmlFor="cover-file">
              Cover Image (JPG, PNG) <span className="required">*</span>
            </label>
            <input
              id="cover-file"
              type="file"
              accept="image/*"
              onChange={handleCoverFileChange}
              disabled={isLoading}
            />
            
            {/* Cover preview - small view */}
            {coverPreview && (
              <div className="cover-preview-small">
                <img src={coverPreview} alt="Cover preview" />
                <span className="cover-preview-text">Selected image</span>
                <button
                  type="button"
                  className="btn-remove-cover-small"
                  onClick={handleRemoveCover}
                  disabled={isLoading}
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Submit buttons */}
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || !title.trim() || !bookFile || !coverFile}
            >
              {isLoading ? "⏳ Uploading..." : "➕ Add Book"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddBook;