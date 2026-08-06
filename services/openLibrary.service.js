const axios = require("axios");

const importOpenLibraryBooks = async (query = "african literature") => {
  try {
    const response = await axios.get(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}`,
        {
    timeout: 15000,
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

    const books = response.data.docs || [];

    return books
      .slice(0, 50)
      .map((item) => {
        if (
          !item.has_fulltext ||
          !item.title ||
          !item.author_name?.length ||
          !item.cover_i
        ) {
          return null;
        }

        const searchText = `
          ${item.title || ""}
          ${(item.subject || []).join(" ")}
        `.toLowerCase();

        const isAfricanLiterature = africanKeywords.some((keyword) =>
          searchText.includes(keyword),
        );

        return {
          openLibraryId: item.key,
          title: item.title,
          authors: item.author_name || [],
          description: "",
          coverImage: `https://covers.openlibrary.org/b/id/${item.cover_i}-L.jpg`,
          publishedDate: item.first_publish_year?.toString() || "",
          publisher: item.publisher?.[0] || "",
          language: item.language?.[0] || "en",
          isAfricanLiterature,
          source: "openlibrary",
          canRead: false,
          sourceType: "openlibrary",
          isbn: item.isbn?.[0] || "",
          categories: item.subject?.slice(0, 10) || [],
        };
      })
      .filter(Boolean);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

module.exports = {
  importOpenLibraryBooks,
};
