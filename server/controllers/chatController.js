import Chat from '../models/Chat.js';
import Listing from '../models/Listing.js';
import { io } from '../index.js';

export const createChat = async (req, res) => {
  try {
    const { listingId } = req.body;
    const buyerId = req.user._id;

    // Check if listing exists
    const listing = await Listing.findById(listingId).populate('seller');
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // Prevent seller from creating chat with themselves
    if (listing.seller._id.toString() === buyerId.toString()) {
      return res.status(400).json({ message: 'Cannot chat with yourself' });
    }

    // Check if chat already exists
    let chat = await Chat.findOne({
      listing: listingId,
      participants: { $all: [buyerId, listing.seller._id] }
    }).populate('participants', 'name avatar')
     .populate('listing', 'title images price');

    if (!chat) {
      // Create new chat
      chat = new Chat({
        listing: listingId,
        participants: [buyerId, listing.seller._id],
        messages: []
      });

      await chat.save();
      await chat.populate('participants', 'name avatar');
      await chat.populate('listing', 'title images price');
    }

    res.json({
      message: 'Chat created successfully',
      chat
    });
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ message: 'Failed to create chat' });
  }
};

export const getChats = async (req, res) => {
  try {
    const userId = req.user._id;

    const chats = await Chat.find({
      participants: userId
    })
    .populate('participants', 'name avatar')
    .populate('listing', 'title images price status')
    .sort({ lastMessage: -1 });

    res.json({ chats });
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ message: 'Failed to fetch chats' });
  }
};

export const getChat = async (req, res) => {
  try {
    const chatId = req.params.id;
    const userId = req.user._id;

    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId
    })
    .populate('participants', 'name avatar')
    .populate('listing', 'title images price status seller')
    .populate('messages.sender', 'name avatar');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Mark messages as read
    chat.messages.forEach(message => {
      if (message.sender._id.toString() !== userId.toString()) {
        const readByUser = message.readBy.find(read => 
          read.user.toString() === userId.toString()
        );
        if (!readByUser) {
          message.readBy.push({ user: userId });
        }
      }
    });

    await chat.save();

    res.json({ chat });
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ message: 'Failed to fetch chat' });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const chatId = req.params.id;
    const senderId = req.user._id;
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const chat = await Chat.findOne({
      _id: chatId,
      participants: senderId
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Create new message
    const newMessage = {
      sender: senderId,
      content: content.trim(),
      readBy: [{ user: senderId }] // Mark as read by sender
    };

    chat.messages.push(newMessage);
    chat.lastMessage = new Date();
    await chat.save();

    // Populate the new message
    await chat.populate('messages.sender', 'name avatar');
    const populatedMessage = chat.messages[chat.messages.length - 1];

    // Emit to other participants via Socket.IO
    const otherParticipants = chat.participants.filter(
      p => p.toString() !== senderId.toString()
    );

    otherParticipants.forEach(participantId => {
      io.to(participantId.toString()).emit('newMessage', {
        chatId,
        message: populatedMessage
      });
    });

    res.json({
      message: 'Message sent successfully',
      data: populatedMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
};