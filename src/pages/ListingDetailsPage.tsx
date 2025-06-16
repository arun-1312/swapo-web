import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Heart, MessageCircle, MapPin, Calendar, Eye, Star, ArrowLeft, Share2, Flag, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface Listing {
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
    phone?: string;
    ratings: {
      average: number;
      count: number;
    };
    createdAt: string;
  };
  city: string;
  createdAt: string;
  views: number;
  tags: string[];
  status: string;
}

const ListingDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    if (id) {
      fetchListing();
    }
  }, [id]);

  const fetchListing = async () => {
    try {
      const response = await api.get(`/listings/${id}`);
      setListing(response.data.listing);
      
      // Check if in wishlist
      if (isAuthenticated && user?.wishlist.includes(id!)) {
        setIsInWishlist(true);
      }
    } catch (error) {
      toast.error('Failed to fetch listing details');
      navigate('/listings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist');
      navigate('/login');
      return;
    }

    setIsToggling(true);
    try {
      const response = await api.post(`/listings/${id}/wishlist`);
      setIsInWishlist(response.data.inWishlist);
      toast.success(response.data.message);
    } catch (error) {
      toast.error('Failed to update wishlist');
    } finally {
      setIsToggling(false);
    }
  };

  const handleStartChat = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to start a chat');
      navigate('/login');
      return;
    }

    if (listing?.seller._id === user?._id) {
      toast.error('You cannot chat with yourself');
      return;
    }

    try {
      const response = await api.post('/chat', { listingId: id });
      navigate('/chat');
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
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const nextImage = () => {
    if (listing?.images) {
      setCurrentImageIndex((prev) => 
        prev === listing.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const previousImage = () => {
    if (listing?.images) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? listing.images.length - 1 : prev - 1
      );
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing?.title,
          text: listing?.description,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled share
      }
    } else {
      // Fallback to copy URL
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Listing not found</h2>
          <p className="text-gray-600 mb-4">The listing you're looking for doesn't exist or has been removed.</p>
          <Link to="/listings" className="text-blue-600 hover:text-blue-500">
            Browse other listings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to listings</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="relative">
                <div className="aspect-video bg-gray-100">
                  <img
                    src={listing.images[currentImageIndex]?.url || '/placeholder-image.jpg'}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {listing.images.length > 1 && (
                  <>
                    <button
                      onClick={previousImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                      {listing.images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
              
              {/* Thumbnail Strip */}
              {listing.images.length > 1 && (
                <div className="p-4 flex space-x-2 overflow-x-auto">
                  {listing.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                        index === currentImageIndex ? 'border-blue-500' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={image.url}
                        alt={`${listing.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Listing Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{listing.title}</h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{listing.city}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Posted {formatDate(listing.createdAt)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Eye className="h-4 w-4" />
                      <span>{listing.views} views</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleShare}
                    className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleWishlistToggle}
                    disabled={isToggling}
                    className={`p-2 transition-colors ${
                      isInWishlist 
                        ? 'text-red-500 hover:text-red-600' 
                        : 'text-gray-600 hover:text-red-500'
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${isInWishlist ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="text-4xl font-bold text-blue-600 mb-6">
                {formatPrice(listing.price)}
              </div>

              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-gray-100 px-3 py-1 rounded-full">
                  <span className="text-sm font-medium text-gray-700">{listing.category}</span>
                </div>
                <div className="bg-green-100 px-3 py-1 rounded-full">
                  <span className="text-sm font-medium text-green-700">{listing.condition}</span>
                </div>
                <div className={`px-3 py-1 rounded-full ${
                  listing.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  <span className="text-sm font-medium capitalize">{listing.status}</span>
                </div>
              </div>

              <div className="prose max-w-none">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                <p className="text-gray-700 whitespace-pre-line">{listing.description}</p>
              </div>

              {listing.tags && listing.tags.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {listing.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Seller Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Seller</h3>
              
              <div className="flex items-center space-x-4 mb-4">
                <img
                  src={listing.seller.avatar || '/default-avatar.png'}
                  alt={listing.seller.name}
                  className="h-16 w-16 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900">{listing.seller.name}</h4>
                  <p className="text-gray-600">{listing.seller.city}</p>
                  <div className="flex items-center space-x-1 mt-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600">
                      {listing.seller.ratings.average.toFixed(1)} ({listing.seller.ratings.count} reviews)
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Member since {formatDate(listing.seller.createdAt)}
              </p>

              <div className="space-y-3">
                {listing.seller._id !== user?._id && (
                  <button
                    onClick={handleStartChat}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span>Start Chat</span>
                  </button>
                )}
                
                {listing.seller.phone && (
                  <a
                    href={`tel:${listing.seller.phone}`}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>Call Seller</span>
                  </a>
                )}
              </div>
            </div>

            {/* Safety Tips */}
            <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
              <h3 className="text-lg font-semibold text-yellow-900 mb-3">Safety Tips</h3>
              <ul className="space-y-2 text-sm text-yellow-800">
                <li>• Meet in a safe, public location</li>
                <li>• Inspect the item before purchasing</li>
                <li>• Don't share personal information</li>
                <li>• Trust your instincts</li>
                <li>• Report suspicious activity</li>
              </ul>
            </div>

            {/* Report Listing */}
            <button className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2">
              <Flag className="h-5 w-5" />
              <span>Report Listing</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetailsPage;