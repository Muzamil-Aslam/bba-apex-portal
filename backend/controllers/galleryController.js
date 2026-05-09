const Gallery = require('../models/Gallery');

exports.getGallery = async (req, res) => {
  const { eventName, mediaType, featured } = req.query;
  const query = {};
  if (eventName) query.eventName = new RegExp(eventName, 'i');
  if (mediaType) query.mediaType = mediaType;
  if (featured === 'true') query.isFeatured = true;
  const items = await Gallery.find(query).sort({ createdAt: -1 });
  // Group by event
  const grouped = items.reduce((acc, item) => {
    const key = item.eventName;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
  res.json({ success: true, count: items.length, gallery: items, grouped });
};

exports.uploadMedia = async (req, res) => {
  if (!req.files || !req.files.media) return res.status(400).json({ success: false, message: 'No file uploaded.' });

  // Validate Cloudinary credentials before attempting upload
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  const cloudinaryReady =
    CLOUDINARY_CLOUD_NAME && !CLOUDINARY_CLOUD_NAME.includes('your_') &&
    CLOUDINARY_API_KEY    && !CLOUDINARY_API_KEY.includes('your_')    &&
    CLOUDINARY_API_SECRET && !CLOUDINARY_API_SECRET.includes('your_');

  if (!cloudinaryReady) {
    return res.status(503).json({
      success: false,
      message: 'Image upload is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.',
    });
  }

  const cloudinary = require('cloudinary').v2;
  cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET });
  const result = await cloudinary.uploader.upload(req.files.media.tempFilePath, { folder: 'bba_apex/gallery', resource_type: 'auto' });
  const item = await Gallery.create({
    ...req.body, fileUrl: result.secure_url,
    thumbnailUrl: result.secure_url.replace('/upload/', '/upload/w_400,h_300,c_fill/'),
    uploadedBy: req.user.id
  });
  res.status(201).json({ success: true, message: 'Media uploaded.', item });
};

exports.deleteMedia = async (req, res) => {
  const item = await Gallery.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Item not found.' });
  res.json({ success: true, message: 'Media deleted.' });
};

exports.toggleFeatured = async (req, res) => {
  const item = await Gallery.findById(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Item not found.' });
  item.isFeatured = !item.isFeatured;
  await item.save();
  res.json({ success: true, item });
};
