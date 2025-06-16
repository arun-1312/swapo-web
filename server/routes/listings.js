import express from 'express';
import { body } from 'express-validator';
import multer from 'multer';
import {
  createListing,
  getListings,
  getListing,
  updateListing,
  deleteListing,
  toggleWishlist,
  getUserListings,
  searchListings
} from '../controllers/listingController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Validation rules
const listingValidation = [
  body('title').trim().isLength({ min: 5, max: 100 }).withMessage('Title must be 5-100 characters'),
  body('description').trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be 10-1000 characters'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('category').notEmpty().withMessage('Category is required'),
  body('condition').notEmpty().withMessage('Condition is required'),
  body('city').trim().notEmpty().withMessage('City is required')
];

/**
 * @swagger
 * /api/v1/listings:
 *   get:
 *     summary: Get all listings
 *     tags: [Listings]
 */
router.get('/', getListings);

/**
 * @swagger
 * /api/v1/listings/search:
 *   get:
 *     summary: Search listings
 *     tags: [Listings]
 */
router.get('/search', searchListings);

/**
 * @swagger
 * /api/v1/listings/user:
 *   get:
 *     summary: Get user's listings
 *     tags: [Listings]
 */
router.get('/user', authenticate, getUserListings);

/**
 * @swagger
 * /api/v1/listings:
 *   post:
 *     summary: Create a new listing
 *     tags: [Listings]
 */
router.post('/', authenticate, upload.array('images', 5), listingValidation, createListing);

/**
 * @swagger
 * /api/v1/listings/{id}:
 *   get:
 *     summary: Get a specific listing
 *     tags: [Listings]
 */
router.get('/:id', getListing);

/**
 * @swagger
 * /api/v1/listings/{id}:
 *   put:
 *     summary: Update a listing
 *     tags: [Listings]
 */
router.put('/:id', authenticate, upload.array('images', 5), updateListing);

/**
 * @swagger
 * /api/v1/listings/{id}:
 *   delete:
 *     summary: Delete a listing
 *     tags: [Listings]
 */
router.delete('/:id', authenticate, deleteListing);

/**
 * @swagger
 * /api/v1/listings/{id}/wishlist:
 *   post:
 *     summary: Toggle wishlist for a listing
 *     tags: [Listings]
 */
router.post('/:id/wishlist', authenticate, toggleWishlist);

export default router;