import React, { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, Phone, MoreVertical, Image } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  createdAt: string;
  readBy: Array<{
    user: string;
    readAt: string;
  }>;
}

interface Chat {
  _id: string;
  participants: Array<{
    _id: string;
    name: string;
    avatar?: string;
  }>;
  listing: {
    _id: string;
    title: string;
    images: Array<{ url: string }>;
    price: number;
    status: string;
  };
  messages: Message[];
  lastMessage: string;
}

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    fetchChats();
    
    if (user?._id) {
      socketService.connect(user._id);
      
      socketService.onNewMessage((data) => {
        if (selectedChat && data.chatId === selectedChat._id) {
          setSelectedChat(prev => prev ? {
            ...prev,
            messages: [...prev.messages, data.message]
          } : null);
        }
        
        // Update chat list
        setChats(prev => prev.map(chat => 
          chat._id === data.chatId 
            ? { ...chat, lastMessage: new Date().toISOString() }
            : chat
        ));
      });

      socketService.onUserTyping((data) => {
        if (selectedChat && data.userId !== user._id) {
          if (data.isTyping) {
            setTypingUsers(prev => new Set([...prev, data.userId]));
          } else {
            setTypingUsers(prev => {
              const newSet = new Set(prev);
              newSet.delete(data.userId);
              return newSet;
            });
          }
        }
      });
    }

    return () => {
      socketService.offNewMessage();
      socketService.offUserTyping();
    };
  }, [user?._id, selectedChat?._id]);

  useEffect(() => {
    scrollToBottom();
  }, [selectedChat?.messages]);

  const fetchChats = async () => {
    try {
      const response = await api.get('/chat');
      setChats(response.data.chats);
    } catch (error) {
      toast.error('Failed to fetch chats');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChatDetails = async (chatId: string) => {
    setMessageLoading(true);
    try {
      const response = await api.get(`/chat/${chatId}`);
      setSelectedChat(response.data.chat);
      
      // Join chat room
      socketService.joinChat(chatId);
    } catch (error) {
      toast.error('Failed to fetch chat details');
    } finally {
      setMessageLoading(false);
    }
  };

  const handleChatSelect = (chat: Chat) => {
    if (selectedChat?._id) {
      socketService.leaveChat(selectedChat._id);
    }
    fetchChatDetails(chat._id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedChat) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    
    // Stop typing indicator
    handleTyping(false);

    try {
      const response = await api.post(`/chat/${selectedChat._id}/message`, {
        content: messageContent
      });

      // Update chat with new message
      setSelectedChat(prev => prev ? {
        ...prev,
        messages: [...prev.messages, response.data.data]
      } : null);
    } catch (error) {
      toast.error('Failed to send message');
      setNewMessage(messageContent); // Restore message on error
    }
  };

  const handleTyping = (typing: boolean) => {
    if (selectedChat) {
      socketService.emitTyping(selectedChat._id, typing);
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      handleTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      handleTyping(false);
    }, 1000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const getOtherParticipant = (chat: Chat) => {
    return chat.participants.find(p => p._id !== user?._id);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden h-[80vh]">
          <div className="flex h-full">
            {/* Chat List */}
            <div className={`${selectedChat ? 'hidden lg:block' : 'block'} w-full lg:w-1/3 border-r border-gray-200`}>
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
              </div>
              
              <div className="overflow-y-auto h-full">
                {chats.length === 0 ? (
                  <div className="p-6 text-center">
                    <div className="text-gray-400 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations yet</h3>
                    <p className="text-gray-600">Start a conversation by contacting a seller</p>
                  </div>
                ) : (
                  chats.map((chat) => {
                    const otherParticipant = getOtherParticipant(chat);
                    return (
                      <button
                        key={chat._id}
                        onClick={() => handleChatSelect(chat)}
                        className={`w-full p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left ${
                          selectedChat?._id === chat._id ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <img
                            src={otherParticipant?.avatar || '/default-avatar.png'}
                            alt={otherParticipant?.name}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {otherParticipant?.name}
                              </h3>
                              <span className="text-xs text-gray-500">
                                {formatTime(chat.lastMessage)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 truncate">
                              {chat.listing.title}
                            </p>
                            <p className="text-sm font-semibold text-blue-600">
                              {formatPrice(chat.listing.price)}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Chat Interface */}
            <div className={`${selectedChat ? 'block' : 'hidden lg:block'} flex-1 flex flex-col`}>
              {selectedChat ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => setSelectedChat(null)}
                          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                        >
                          <ArrowLeft className="h-5 w-5" />
                        </button>
                        
                        <img
                          src={selectedChat.listing.images[0]?.url || '/placeholder-image.jpg'}
                          alt={selectedChat.listing.title}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {selectedChat.listing.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            with {getOtherParticipant(selectedChat)?.name}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button className="p-2 hover:bg-gray-100 rounded-lg">
                          <Phone className="h-5 w-5 text-gray-600" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-lg">
                          <MoreVertical className="h-5 w-5 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                    {messageLoading ? (
                      <div className="flex justify-center items-center h-full">
                        <LoadingSpinner size="lg" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {selectedChat.messages.map((message, index) => {
                          const isOwnMessage = message.sender._id === user?._id;
                          const showDate = index === 0 || 
                            formatDate(message.createdAt) !== formatDate(selectedChat.messages[index - 1].createdAt);
                          
                          return (
                            <div key={message._id}>
                              {showDate && (
                                <div className="text-center">
                                  <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full">
                                    {formatDate(message.createdAt)}
                                  </span>
                                </div>
                              )}
                              
                              <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                                  <div className={`px-4 py-2 rounded-lg ${
                                    isOwnMessage 
                                      ? 'bg-blue-600 text-white' 
                                      : 'bg-white text-gray-900 border border-gray-200'
                                  }`}>
                                    <p className="text-sm">{message.content}</p>
                                  </div>
                                  <p className={`text-xs text-gray-500 mt-1 ${
                                    isOwnMessage ? 'text-right' : 'text-left'
                                  }`}>
                                    {formatTime(message.createdAt)}
                                  </p>
                                </div>
                                
                                {!isOwnMessage && (
                                  <img
                                    src={message.sender.avatar || '/default-avatar.png'}
                                    alt={message.sender.name}
                                    className="h-8 w-8 rounded-full object-cover order-0 mr-2"
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })}
                        
                        {typingUsers.size > 0 && (
                          <div className="flex justify-start">
                            <div className="bg-white text-gray-900 border border-gray-200 px-4 py-2 rounded-lg">
                              <div className="flex space-x-1">
                                <div className="flex space-x-1">
                                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200 bg-white">
                    <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                      <button
                        type="button"
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <Image className="h-5 w-5 text-gray-600" />
                      </button>
                      
                      <input
                        type="text"
                        value={newMessage}
                        onChange={handleMessageChange}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      
                      <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="h-5 w-5" />
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-gray-400 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a conversation</h3>
                    <p className="text-gray-600">Choose from your existing conversations or start a new one</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;