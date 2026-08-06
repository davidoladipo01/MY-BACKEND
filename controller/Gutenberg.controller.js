const Book = require("../model/Book.model");
const { importGutenbergBooks } = require("../services/gutenberg.service");

const importGutenberg = async (req, res) => {
  try {
    const books = await importGutenbergBooks();

    let imported = 0;

    for (const book of books) {
      const exists = await Book.findOne({
        gutenbergId: book.gutenbergId,
      });

      if (exists) continue;

      await Book.create(book);

      imported++;
    }

    return res.status(200).json({
      success: true,
      imported,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  importGutenberg,
};
