import express from 'express';
import {
  getDashboardStats,
  getAllUsers,
  getAllListings,
  deleteUser,
  deleteListing,
  toggleUserStatus,
  toggleListingStatus
} from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

/**
 * @swagger
 * /api/v1/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard statistics
 *     tags: [Admin]
 */
router.get('/dashboard', getDashboardStats);

/**
 * @swagger
 * /api/v1/admin/users:
 *   get:
 *     summary: Get all users
 *     tags: [Admin]
 */
router.get('/users', getAllUsers);

/**
 * @swagger
 * /api/v1/admin/listings:
 *   get:
 *     summary: Get all listings
 *     tags: [Admin]
 */
router.get('/listings', getAllListings);

router.delete('/users/:id', deleteUser);
router.delete('/listings/:id', deleteListing);
router.patch('/users/:id/status', toggleUserStatus);
router.patch('/listings/:id/status', toggleListingStatus);

export default router;