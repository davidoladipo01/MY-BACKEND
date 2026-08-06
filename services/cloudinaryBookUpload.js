const cloudinary = require("../config/cloudinary");

const streamifier = require("streamifier");

const uploadBookFile = (fileBuffer, folder = "books") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "raw",
      },
      (error, result) => {
        if (error) return reject(error);

        resolve(result);
      },
    );

    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

module.exports = uploadBookFile;
