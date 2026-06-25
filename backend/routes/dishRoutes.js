import express from 'express';
import { getDishes, toggleDishPublish } from '../controllers/dishController.js';

const router = express.Router();

// Fetch all dishes
router.get('/', getDishes);

// Toggle published state of a dish
router.patch('/:id/toggle', toggleDishPublish);

export default router;
