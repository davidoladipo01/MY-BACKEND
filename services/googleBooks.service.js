const axios = require("axios");

const importBooks = async (query = "african literature") => {
  try {
    const response = await axios.get(
      "https://www.googleapis.com/books/v1/volumes",
      {
        params: {
          q: query,
          maxResults: 40,
          key: process.env.GOOGLE_BOOKS_API_KEY,
        },
      }
    );

    const africanKeywords = [
      "nigeria",
      "ghana",
      "kenya",
      "africa",
      "ethiopia",
      "senegal",
      "african",
    ];

    const books = response.data.items || [];

    return books
      .map((item) => {
        const volume = item.volumeInfo || {};

        if (
          !volume.title ||
          !volume.authors?.length ||
          !volume.imageLinks?.thumbnail
        ) {
          return null;
        }

        const searchText = `
          ${volume.title || ""}
          ${volume.description || ""}
          ${(volume.categories || []).join(" ")}
        `.toLowerCase();

        const isAfricanLiterature =
          africanKeywords.some((keyword) =>
            searchText.includes(keyword)
          );

        return {
          googleBookId: item.id,
          title: volume.title,
          authors: volume.authors || [],
          description: volume.description || "",
          coverImage:
            volume.imageLinks?.thumbnail ||
            volume.imageLinks?.smallThumbnail ||
            "",
          publishedDate: volume.publishedDate || "",
          pageCount: volume.pageCount || 0,
          language: volume.language || "en",
          categories: volume.categories || [],
          publisher: volume.publisher || "",
          averageRating: volume.averageRating || 0,
          ratingsCount: volume.ratingsCount || 0,
          isAfricanLiterature,
          source: "google",
          isbn:
            volume.industryIdentifiers?.[0]?.identifier || "",
        };
      })
      .filter(Boolean);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

module.exports = {
  importBooks,
};