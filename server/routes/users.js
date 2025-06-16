import express from 'express';
import {
  getWishlist,
  getUserProfile,
  updateUserRating
} from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/users/wishlist:
 *   get:
 *     summary: Get user's wishlist
 *     tags: [Users]
 */
router.get('/wishlist', authenticate, getWishlist);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get user profile by ID
 *     tags: [Users]
 */
router.get('/:id', getUserProfile);

/**
 * @swagger
 * /api/v1/users/{id}/rate:
 *   post:
 *     summary: Rate a user
 *     tags: [Users]
 */
router.post('/:id/rate', authenticate, updateUserRating);

export default router;