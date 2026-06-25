import mongoose from 'mongoose';

const dishSchema = new mongoose.Schema({
  dishId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  dishName: {
    type: String,
    required: true,
    trim: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  isPublished: {
    type: Boolean,
    default: false
  }
}, {
  // Good practice to track creation/update times
  timestamps: true
});

const Dish = mongoose.model('Dish', dishSchema);

export default Dish;
