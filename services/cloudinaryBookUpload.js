const cloudinary = require("../config/cloudinary");

const streamifier = require("streamifier");

const uploadBookFile = (fileBuffer,fileType, folder = "books") => {
   return new Promise((resolve, reject) => {
    const stream =
      cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "raw",
          public_id: `${Date.now()}.${fileType}`,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );

    streamifier
      .createReadStream(fileBuffer)
      .pipe(stream);
  });
};

module.exports = uploadBookFile;
