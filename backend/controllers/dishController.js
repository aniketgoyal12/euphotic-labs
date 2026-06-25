import Dish from '../models/dish.js';
import mongoose from 'mongoose';

// Fetch all dishes sorted by their custom dishId
export const getDishes = async (req, res) => {
  try {
    const dishes = await Dish.find({}).sort({ dishId: 1 });
    res.json(dishes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dishes from database.' });
  }
};

// Toggle isPublished for a given id (handles both custom dishId and mongo _id)
export const toggleDishPublish = async (req, res) => {
  const { id } = req.params;

  try {
    let query = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: id }, { dishId: id }] };
    } else {
      query = { dishId: id };
    }

    const item = await Dish.findOne(query);
    if (!item) {
      return res.status(404).json({ error: 'No dish found with this identifier.' });
    }

    item.isPublished = !item.isPublished;
    const result = await item.save();

    // The change stream will catch this save and propagate it to all clients.

    // Return the updated document
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle publication status.' });
  }
};
