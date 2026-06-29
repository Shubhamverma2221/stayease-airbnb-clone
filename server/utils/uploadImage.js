const cloudinary = require('../config/cloudinary');
const fs = require('fs');

const uploadImage = async (file) => {
  if (!file) return '';

  // If Cloudinary is configured, upload to Cloudinary and clean up local file
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'airbnb_clone',
      });
      // Delete temporary local file
      fs.unlinkSync(file.path);
      return result.secure_url;
    } catch (error) {
      console.error('Cloudinary Upload Error:', error);
      // Fallback to local URL if Cloudinary upload fails
      return `/uploads/${file.filename}`;
    }
  }

  // Fallback: Return path to the locally saved file
  return `/uploads/${file.filename}`;
};

module.exports = uploadImage;
