const { importGutenbergBooks } = require("../services/gutenberg.service");
const { importOpenLibraryBooks } = require("../services/openLibrary.service");
const { allQueries } = require("../config/discoveryQueries");
const Book = require("../model/Book.model");

const dedupeBooks = (books) => {
  const seen = new Set();

  return books.filter((book) => {
    const key =
      book.gutenbergId ||
      book.openLibraryId ||
      book.googleBookId ||
      book.isbn;

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const importReadableBooks = async (req, res) => {
  try {
    let gutenberg = [];
    let openlibrary = [];

    for (const query of allQueries) {
      console.log(`Importing => ${query}`);

      try {
        const books = await importGutenbergBooks(query);
        gutenberg.push(...books);
        console.log(`Gutenberg => ${books.length} books`);
      } catch (error) {
        console.error(`Gutenberg failed => ${query}:`, error.message);
      }

      try {
        const books = await importOpenLibraryBooks(query);
        openlibrary.push(...books);
        console.log(`OpenLibrary => ${books.length} books`);
      } catch (error) {
        console.error(`OpenLibrary failed => ${query}:`, error.message);
      }

      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    gutenberg = dedupeBooks(gutenberg);
    openlibrary = dedupeBooks(openlibrary);

    console.log(`Gutenberg complete: ${gutenberg.length} books`);
    console.log(`OpenLibrary complete: ${openlibrary.length} books`);

    const books = [...gutenberg, ...openlibrary];

    console.log(`Total books: ${books.length}`);

    let saved = 0;

    for (const book of books) {
      const conditions = [];

      if (book.googleBookId) {
        conditions.push({ googleBookId: book.googleBookId });
      }

      if (book.openLibraryId) {
        conditions.push({ openLibraryId: book.openLibraryId });
      }

      if (book.gutenbergId) {
        conditions.push({ gutenbergId: book.gutenbergId });
      }

      if (book.isbn) {
        conditions.push({
          isbn: book.isbn,
        });
      }

      const exists =
        conditions.length > 0 ? await Book.findOne({ $or: conditions }) : null;

      if (exists) {
        continue;
      }

      await Book.create(book);

      saved++;
    }

    return res.status(200).json({
      success: true,
      imported: saved,
      gutenbergFound: gutenberg.length,
      openLibraryFound: openlibrary.length,
      queriesProcessed: allQueries.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  importReadableBooks,
};
