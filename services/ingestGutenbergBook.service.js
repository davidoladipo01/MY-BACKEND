const Book = require("../model/Book.model");
const { downloadFileBuffer } = require("./gutenbergDownload.service");
const uploadBookFile = require("./cloudinaryBookUpload");

const ingestGutenbergBook = async (book) => {
  const downloadUrl = book.epubUrl || book.pdfUrl || book.downloadUrl;

  if (!downloadUrl) {
    throw new Error("No downloadable file found for this Gutenberg book");
  }

  console.log("Downloading:", downloadUrl);

  const fileBuffer = await downloadFileBuffer(downloadUrl);

  console.log("Downloaded:", fileBuffer.length);
  console.log("Uploading to Cloudinary...");

  const fileType = book.epubUrl ? "epub" : "pdf";

  const uploaded = await uploadBookFile(fileBuffer, fileType);
  console.log(uploaded);
  console.log("Upload complete");

  

  const updatedBook = await Book.findByIdAndUpdate(
    book._id,
    {
      fileUrl: uploaded.secure_url,
      fileType,
      readingFormat: fileType,
      fileSize: uploaded.bytes || 0,
    },
    {
      returnDocument: "after",
    },
  );

  return updatedBook;
};

module.exports = {
  ingestGutenbergBook,
};
