const Book = require("../model/Book.model");

const seedFeaturedBooks = async (req, res) => {
  try {

    const featuredTitles = [
      "Things Fall Apart",
      "Purple Hibiscus",
      "Half of a Yellow Sun",
      "Americanah",
      "The Famished Road",
      "Stay With Me",
      "Children of Blood and Bone",
      "Black Leopard, Red Wolf",
      "The Secret Lives of Baba Segi's Wives"
    ];

    const result = await Book.updateMany(
      {
        title: {
          $in: featuredTitles
        }
      },
      {
        featured: true
      }
    );

    res.status(200).json({
      success: true,
      modified: result.modifiedCount
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

module.exports = {
  seedFeaturedBooks
};