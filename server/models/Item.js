const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  dimensions: {
    length: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
  },
  category: { type: String, required: true }, // e.g., 'Furniture', 'Electronics'
  modelUrl: { type: String }, // URL to GLB/GLTF file
  thumbnailUrl: { type: String },
  sourceLink: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Item', itemSchema);
