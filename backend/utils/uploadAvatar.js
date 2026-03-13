const multer = require("multer");
const { createCloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = createCloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "bus-ticket/avatars",
    allowed_formats: ["jpg", "png", "jpeg"]
  }
});

const upload = multer({ storage });

module.exports = upload;
