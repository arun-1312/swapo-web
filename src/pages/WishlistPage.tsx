import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Eye, MapPin, Calendar, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface WishlistItem {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  images: Array<{ url: string; publicId: string }>;
  seller: {
    _id: string;
    name: string;
    avatar?: string;
    city: string;
  };
  city: string;
  createdAt: string;
  views: number;
  status: string;
}

const WishlistPage: React.FC = () => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const response = await api.get('/users/wishlist');
      setWishlist(response.data.wishlist);
    } catch (error) {
      toast.error('Failed to fetch wishlist');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (itemId: string) => {
    setRemovingItems(prev => new Set([...prev, itemId]));
    
    try {
      await api.post(`/listings/${itemId}/wishlist`);
      setWishlist(prev => prev.filter(item => item._id !== itemId));
      toast.success('Removed from wishlist');
    } catch (error) {
      toast.error('Failed to remove from wishlist');
    } finally {
      setRemovingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleStartChat = async (listingId: string, sellerId: string) => {
    if (sellerId === user?._id) {
      toast.error('You cannot chat with yourself');
      return;
    }

    try {
      await api.post('/chat', { listingId });
      toast.success('Chat started successfully');
    } catch (error) {
      toast.error('Failed to start chat');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Wishlist</h1>
          <p className="text-gray-600">
            {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved for later
          </p>
        </div>

        {wishlist.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-gray-400 mb-6">
              <Heart className="h-24 w-24 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-8">
              Save items you're interested in to easily find them later
            </p>
            <Link
              to="/listings"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
            >
              <span>Browse Listings</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((item) => (
              <div key={item._id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative">
                  <Link to={`/listings/${item._id}`}>
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={item.images[0]?.url || '/placeholder-image.jpg'}
                        alt={item.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </Link>
                  
                  <button
                    onClick={() => handleRemoveFromWishlist(item._id)}
                    disabled={removingItems.has(item._id)}
                    className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors"
                  >
                    {removingItems.has(item._id) ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-gray-600 hover:text-red-500" />
                    )}
                  </button>
                  
                  <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium ${
                    item.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Link to={`/listings/${item._id}`}>
                      <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-1">
                        {item.title}
                      </h3>
                    </Link>
                    <div className="text-xl font-bold text-blue-600">
                      {formatPrice(item.price)}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {item.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{item.city}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      <img
                        src={item.seller.avatar || '/default-avatar.png'}
                        alt={item.seller.name}
                        className="h-6 w-6 rounded-full object-cover"
                      />
                      <span className="text-sm text-gray-600">{item.seller.name}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1 text-gray-400">
                        <Eye className="h-4 w-4" />
                        <span className="text-xs">{item.views}</span>
                      </div>
                      
                      {item.seller._id !== user?._id && (
                        <button
                          onClick={() => handleStartChat(item._id, item.seller._id)}
                          className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;