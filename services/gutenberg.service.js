const axios = require("axios");

const parseGutenbergQuery = (query) => {
  const subjectMatch = query.match(/^subject:"(.+)"$/);
  if (subjectMatch) {
    return { topic: subjectMatch[1] };
  }

  const authorMatch = query.match(/^inauthor:"(.+)"$/);
  if (authorMatch) {
    return { search: authorMatch[1] };
  }

  const publisherMatch = query.match(/^inpublisher:"(.+)"$/);
  if (publisherMatch) {
    return { search: publisherMatch[1] };
  }

  return { search: query };
};

const importGutenbergBooks = async (query) => {
  const params = query ? parseGutenbergQuery(query) : {};

  const response = await axios.get("https://gutendex.com/books", {
    params,
    timeout: 120000,
    maxRedirects: 10,
  });

  const books = response.data.results || [];

  return books.map((book) => {
    const formats = book.formats || {};

    const epubUrl =
      Object.entries(formats).find(([key]) =>
        key.startsWith("application/epub+zip"),
      )?.[1] || "";

    const pdfUrl =
      Object.entries(formats).find(([key]) =>
        key.startsWith("application/pdf"),
      )?.[1] || "";

    return {
      gutenbergId: book.id,
      title: book.title,
      authors: book.authors?.map((a) => a.name) || [],
      coverImage: book.formats["image/jpeg"] || book.formats["image/png"] || "",
      language: book.languages?.[0] || "en",
      downloads: book.download_count || 0,

      epubUrl,
      pdfUrl,

      downloadUrl: epubUrl || pdfUrl,

      source: "gutenberg",
      sourceType: "gutenberg",

      canRead: Boolean(epubUrl || pdfUrl),

      readingFormat: epubUrl ? "epub" : pdfUrl ? "pdf" : null,
    };
  });
};

module.exports = {
  importGutenbergBooks,
};
