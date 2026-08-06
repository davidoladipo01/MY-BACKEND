const { importBooks } = require("../services/googleBooks.service");
const { importOpenLibraryBooks } = require("../services/openLibrary.service");
const { allQueries } = require("../config/discoveryQueries");
const Book = require("../model/Book.model");

// | /*                                                                         |
// | -------------------------------------------------------------------------- |
// | REJECTION PATTERNS                                                         |
// | -------------------------------------------------------------------------- |
// | Prevent low-quality academic noise from entering AfriReadCo.               |
// | */                                                                         |

const REJECT_PATTERNS = [
    /handbook/i,
    /guide/i,
    /companion/i,
    /reader/i,
    /anthology/i,
    /textbook/i,
    /introduction to/i,
    /history of.*literature/i,
    /critical/i,
    /theory/i,
    /methodology/i,
    /dissertation/i,
    /bibliography/i,
    /catalog/i,
    /reference/i,
    /dictionary/i,
    /encyclopedia/i,
    /journal/i,
    /proceedings/i,
    /workbook/i,
    /study guide/i,
    /cliffsnotes/i,
    /sparknotes/i,
    /analysis of/i,
    /notes on/i,
    /oxford/i,
    /cambridge/i,
    /routledge/i,
    /pearson/i,
    /mcgraw/i,
    /research/i,
    /curriculum/i,
    /lecture/i,
    /seminar/i,
    /syllabus/i,
];

// | /*                                                                         |
// | -------------------------------------------------------------------------- |
// | QUALITY FILTER                                                             |
// | -------------------------------------------------------------------------- |
// | */                                                                         |

const isPremiumBook = (book) => {
    const volume = book.volumeInfo || book;

    const title = volume.title || "";

    const description =
        volume.description || "";

    const categories =
        volume.categories ||
        volume.subjects ||
        [];

    const pageCount =
        volume.pageCount || 0;

    const publishedDate =
        volume.publishedDate ||
        volume.first_publish_year ||
        "";

    const fullText = `     ${title}
    ${description}
    ${categories.join(" ")}
  `.toLowerCase();

    if (
        REJECT_PATTERNS.some((pattern) =>
            pattern.test(fullText)
        )
    ) {
        return false;
    }

    if (pageCount && pageCount < 80) {
        return false;
    }

    if (
        description &&
        description.length < 50
    ) {
        return false;
    }

    if (publishedDate) {
        const year = parseInt(
            String(publishedDate).substring(0, 4)
        );

        if (!isNaN(year) && year < 1900) {
            return false;
        }
    }

    return true;
};

// | /*                                                                         |
// | -------------------------------------------------------------------------- |
// | IMPORT CONTROLLER                                                          |
// | -------------------------------------------------------------------------- |
// | */                                                                         |

const saveBooksToDatabase = async (books = []) => {
    let savedCount = 0;

    for (const book of books) {
        try {
            const query = book.googleBookId
                ? { googleBookId: book.googleBookId }
                : { openLibraryId: book.openLibraryId };

            const existingBook = await Book.findOne(query);

            if (existingBook) {
                continue;
            }

            await Book.create({
                ...book,
                authors: Array.isArray(book.authors)
                    ? book.authors
                    : [book.authors].filter(Boolean),
                categories: Array.isArray(book.categories)
                    ? book.categories
                    : [book.categories].filter(Boolean),
            });

            savedCount += 1;
        } catch (error) {
            console.error("Failed to save imported book:", error.message);
        }
    }

    return savedCount;
};

const importAfricanBooks = async (
    req,
    res
) => {
    try {
        // /*
        // |--------------------------------------------------------------------------
        // | AFRICAN DISCOVERY
        // |--------------------------------------------------------------------------
        // */

let totalImported = 0;
let totalRejected = 0;
let googleImported = 0;
let openLibraryImported = 0;

for (const query of allQueries) {
  console.log(
    `\nImporting => ${ query } `
  );

  /*
  |--------------------------------------------------------------------------
  | GOOGLE BOOKS
  |--------------------------------------------------------------------------
  */

  try {
    const googleBooks =
      await importBooks(query);

    const filteredGoogle =
      googleBooks.filter(
        isPremiumBook
      );

    const savedGoogle = await saveBooksToDatabase(filteredGoogle);

    googleImported += savedGoogle;
    totalImported += savedGoogle;
    totalRejected +=
      googleBooks.length -
      filteredGoogle.length;
  } catch (error) {
    console.log(
      `Google failed => ${ query } `
    );
  }

  /*
  |--------------------------------------------------------------------------
  | OPEN LIBRARY
  |--------------------------------------------------------------------------
  */

  try {
    const openBooks =
      await importOpenLibraryBooks(
        query
      );

    const filteredOpen =
      openBooks.filter(
        isPremiumBook
      );

    const savedOpen = await saveBooksToDatabase(filteredOpen);

    openLibraryImported += savedOpen;
    totalImported += savedOpen;
    totalRejected +=
      openBooks.length -
      filteredOpen.length;
  } catch (error) {
    console.log(
      `OpenLibrary failed => ${ query } `
    );
  }

  /*
  |--------------------------------------------------------------------------
  | THROTTLE
  |--------------------------------------------------------------------------
  */

  await new Promise((resolve) =>
    setTimeout(resolve, 1500)
  );
}

return res.status(200).json({
  success: true,
  imported: totalImported,
  rejected: totalRejected,
  googleImported,
  openLibraryImported,
  queriesProcessed:
    allQueries.length,
});

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    importAfricanBooks,
};
