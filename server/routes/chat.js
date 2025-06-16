import express from 'express';
import {
  createChat,
  getChats,
  getChat,
  sendMessage
} from '../controllers/chatController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/chat:
 *   get:
 *     summary: Get all user chats
 *     tags: [Chat]
 */
router.get('/', authenticate, getChats);

/**
 * @swagger
 * /api/v1/chat:
 *   post:
 *     summary: Create or get chat for a listing
 *     tags: [Chat]
 */
router.post('/', authenticate, createChat);

/**
 * @swagger
 * /api/v1/chat/{id}:
 *   get:
 *     summary: Get specific chat
 *     tags: [Chat]
 */
router.get('/:id', authenticate, getChat);

/**
 * @swagger
 * /api/v1/chat/{id}/message:
 *   post:
 *     summary: Send message in chat
 *     tags: [Chat]
 */
router.post('/:id/message', authenticate, sendMessage);

export default router;