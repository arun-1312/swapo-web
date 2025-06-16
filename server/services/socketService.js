export const initializeSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join user to their personal room
    socket.on('join', (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined room`);
    });

    // Join chat room
    socket.on('joinChat', (chatId) => {
      socket.join(`chat_${chatId}`);
      console.log(`User joined chat: ${chatId}`);
    });

    // Leave chat room
    socket.on('leaveChat', (chatId) => {
      socket.leave(`chat_${chatId}`);
      console.log(`User left chat: ${chatId}`);
    });

    // Handle typing indicators
    socket.on('typing', ({ chatId, userId, isTyping }) => {
      socket.to(`chat_${chatId}`).emit('userTyping', { userId, isTyping });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};