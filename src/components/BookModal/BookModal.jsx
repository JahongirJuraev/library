import { useEffect, useState, useRef } from "react";
import "./BookModal.css";

/**
 * BookModal Component
 * Book information and reading modal
 * Supports: PDF (PDF.js), EPUB, DOC, DOCX, TXT, FB2
 *
 * @param {object} book - Book object to display
 * @param {function} onClose - Function to close modal
 */
function BookModal({ book, onClose }) {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [isReading, setIsReading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [textContent, setTextContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pdfError, setPdfError] = useState(null);

  // PDF.js canvas ref
  const canvasRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.5);

  if (!book) return null;

  const PLACEHOLDER_IMAGE = "/assets/image/placeholder.png";

  // ============================================
  // PDF.JS INTEGRATION
  // ============================================

  /**
   * Load PDF.js library
   */
  const loadPDFJS = () => {
    return new Promise((resolve, reject) => {
      if (window.pdfjsLib) {
        resolve(window.pdfjsLib);
        return;
      }

      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve(window.pdfjsLib);
      };
      script.onerror = reject;
      document.body.appendChild(script);
    });
  };

  /**
   * Load and render PDF
   */
  const loadPDF = async (url) => {
    try {
      setIsLoading(true);
      setPdfError(null);

      const pdfjsLib = await loadPDFJS();

      // Create full URL with proper origin
      const fullUrl = url.startsWith("http")
        ? url
        : `${window.location.origin}${url}`;

      console.log("Loading PDF from:", fullUrl);

      const loadingTask = pdfjsLib.getDocument({
        url: fullUrl,
        withCredentials: false,
        isEvalSupported: false,
      });

      const pdf = await loadingTask.promise;

      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);

      await renderPage(pdf, 1);
    } catch (err) {
      console.error("Error loading PDF:", err);
      setPdfError("Failed to load PDF. Please try downloading instead.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Render specific PDF page
   */
  const renderPage = async (pdf, pageNum) => {
    try {
      const page = await pdf.getPage(pageNum);
      const canvas = canvasRef.current;

      if (!canvas) return;

      const context = canvas.getContext("2d");
      const viewport = page.getViewport({ scale });

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
    } catch (err) {
      console.error("Error rendering page:", err);
    }
  };

  /**
   * Navigate to previous page
   */
  const goToPrevPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      renderPage(pdfDoc, newPage);
    }
  };

  /**
   * Navigate to next page
   */
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      renderPage(pdfDoc, newPage);
    }
  };

  /**
   * Zoom in
   */
  const zoomIn = () => {
    const newScale = Math.min(scale + 0.25, 3);
    setScale(newScale);
    if (pdfDoc) renderPage(pdfDoc, currentPage);
  };

  /**
   * Zoom out
   */
  const zoomOut = () => {
    const newScale = Math.max(scale - 0.25, 0.5);
    setScale(newScale);
    if (pdfDoc) renderPage(pdfDoc, currentPage);
  };

  // ============================================
  // OTHER FILE READERS
  // ============================================

  const readTextFile = async (url) => {
    try {
      setIsLoading(true);
      const response = await fetch(url);
      const text = await response.text();
      setTextContent(text);
    } catch (err) {
      console.error("Error reading TXT:", err);
      setTextContent("❌ Error reading file.");
    } finally {
      setIsLoading(false);
    }
  };

  const readFB2File = async (url) => {
    try {
      setIsLoading(true);
      const response = await fetch(url);
      const text = await response.text();

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "text/xml");
      const bodyElements = xmlDoc.getElementsByTagName("body")[0];
      let extractedText = "";

      if (bodyElements) {
        const paragraphs = bodyElements.getElementsByTagName("p");
        for (let p of paragraphs) {
          extractedText += p.textContent + "\n\n";
        }
      }

      setTextContent(extractedText || text);
    } catch (err) {
      console.error("Error reading FB2:", err);
      setTextContent("❌ Error reading file.");
    } finally {
      setIsLoading(false);
    }
  };

  const startReading = () => {
    setIsReading(true);
    const format = book.format?.toUpperCase();

    if (format === "PDF") {
      loadPDF(book.file);
    } else if (format === "TXT") {
      readTextFile(book.file);
    } else if (format === "FB2") {
      readFB2File(book.file);
    }
  };

  // ============================================
  // FULLSCREEN HANDLERS
  // ============================================

  const handleFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
      setIsFullscreen(true);
    }
  };

  const handleExitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // ============================================
  // SIDE EFFECTS
  // ============================================

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        if (isReading) {
          setIsReading(false);
          setTextContent("");
          setPdfDoc(null);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isReading, onClose]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow || "auto";
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Re-render PDF when scale changes
  useEffect(() => {
    if (pdfDoc && canvasRef.current) {
      renderPage(pdfDoc, currentPage);
    }
  }, [scale]);

  // ============================================
  // RENDER VIEWER
  // ============================================

  const renderBookViewer = () => {
    const format = book.format?.toUpperCase() || "PDF";

    // PDF - with PDF.js
    if (format === "PDF") {
      if (isLoading) {
        return (
          <div className="pdf-loading">
            <div className="loading-spinner"></div>
            <p>Loading PDF...</p>
          </div>
        );
      }

      if (pdfError) {
        return (
          <div className="pdf-error">
            <div className="error-icon">⚠️</div>
            <h3>PDF Loading Error</h3>
            <p>{pdfError}</p>
            <a href={book.file} download className="btn btn-primary">
              ⬇️ Download PDF
            </a>
          </div>
        );
      }

      return (
        <div className="pdf-viewer-container">
          <div className="pdf-canvas-wrapper">
            <canvas ref={canvasRef} className="pdf-canvas" />
          </div>
        </div>
      );
    }

    // TXT
    if (format === "TXT") {
      if (isLoading) {
        return (
          <div className="text-loading">
            <div className="loading-spinner"></div>
            <p>Loading file...</p>
          </div>
        );
      }
      return (
        <div className="text-reader">
          <pre className="text-content">{textContent}</pre>
        </div>
      );
    }

    // FB2
    if (format === "FB2") {
      if (isLoading) {
        return (
          <div className="text-loading">
            <div className="loading-spinner"></div>
            <p>Loading file...</p>
          </div>
        );
      }
      return (
        <div className="text-reader fb2-reader">
          <pre className="text-content">{textContent}</pre>
        </div>
      );
    }

    // EPUB, DOC, DOCX - Download only
    if (["EPUB", "DOC", "DOCX"].includes(format)) {
      return (
        <div className="unsupported-format">
          <div className="unsupported-icon">📄</div>
          <h3>Browser Reading Not Available</h3>
          <p>
            <strong>{format}</strong> files cannot be read directly in browser.
          </p>
          <p>Please download the book to read it.</p>
          <a href={book.file} download className="btn btn-primary">
            ⬇️ Download {format}
          </a>
        </div>
      );
    }

    // Unknown format
    return (
      <div className="unsupported-format">
        <div className="unsupported-icon">📄</div>
        <h3>Format Not Supported</h3>
        <p>
          <strong>{format}</strong> format cannot be read in browser.
        </p>
        <a href={book.file} download className="btn btn-primary">
          ⬇️ Download
        </a>
      </div>
    );
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="modal-overlay book-modal-overlay" onClick={onClose}>
      <div
        className={`modal-content book-modal-content ${
          isReading ? "reading-mode" : ""
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Close modal"
          title="Close (ESC)"
        >
          ✕
        </button>

        {!isReading ? (
          <div className="modal-body">
            <div className="modal-cover-wrapper">
              <img
                src={book.image || PLACEHOLDER_IMAGE}
                alt={`${book.title} cover`}
                className="modal-cover"
                onError={(e) => {
                  e.target.src = PLACEHOLDER_IMAGE;
                }}
              />
            </div>

            <div className="modal-meta">
              <h2 className="modal-book-title">{book.title}</h2>

              <div className="meta-info">
                <p>
                  <strong>📖 Author:</strong> {book.author || "Unknown"}
                </p>
                <p>
                  <strong>📅 Year:</strong> {book.year || "—"}
                </p>
                <p>
                  <strong>📄 Format:</strong> {book.format || "PDF"}
                </p>
              </div>

              <div className="format-support">
                {["PDF", "TXT", "FB2"].includes(book.format?.toUpperCase()) ? (
                  <span className="support-badge supported">
                    ✅ Can read in browser
                  </span>
                ) : (
                  <span className="support-badge unsupported">
                    ⚠️ Format not supported
                  </span>
                )}
              </div>

              <div className="modal-actions">
                <button
                  className="btn btn-primary"
                  onClick={startReading}
                  aria-label="Read book"
                >
                  📖 Read
                </button>

                <a
                  href={book.file}
                  download
                  className="btn btn-secondary"
                  aria-label="Download book"
                >
                  ⬇️ Download
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="reader-wrapper">
            <div className="reader-controls">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setIsReading(false);
                  setTextContent("");
                  setPdfDoc(null);
                }}
                aria-label="Stop reading"
              >
                ← Back
              </button>


              <div className="pdf-controls">
                <button
                  className="pdf-btn"
                  onClick={goToPrevPage}
                  disabled={currentPage <= 1}
                  title="Previous page"
                >
                  ◀️
                </button>

                <span className="pdf-page-info">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  className="pdf-btn"
                  onClick={goToNextPage}
                  disabled={currentPage >= totalPages}
                  title="Next page"
                >
                  ▶️
                </button>

                <div className="pdf-zoom-controls">
                  <button
                    className="pdf-btn"
                    onClick={zoomOut}
                    disabled={scale <= 0.5}
                    title="Zoom out"
                  >
                    ➖
                  </button>
                  <span className="pdf-zoom-level">
                    {Math.round(scale * 100)}%
                  </span>
                  <button
                    className="pdf-btn"
                    onClick={zoomIn}
                    disabled={scale >= 3}
                    title="Zoom in"
                  >
                    ➕
                  </button>
                </div>
              </div>



              <h3 className="reader-title">{book.title}</h3>



              <div className="reader-actions">
                <a
                  href={book.file}
                  download
                  className="btn btn-secondary btn-icon"
                  title="Download"
                >
                  ⬇️
                </a>

                {!isFullscreen ? (
                  <button
                    className="btn btn-secondary btn-icon"
                    onClick={handleFullscreen}
                    title="Fullscreen"
                  >
                    ⛶
                  </button>
                ) : (
                  <button
                    className="btn btn-secondary btn-icon"
                    onClick={handleExitFullscreen}
                    title="Exit Fullscreen"
                  >
                    ⛶
                  </button>
                )}
              </div>
            </div>

            {renderBookViewer()}
          </div>
        )}
      </div>
    </div>
  );
}

export default BookModal;
