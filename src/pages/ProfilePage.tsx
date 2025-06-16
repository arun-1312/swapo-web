import React, { useState, useEffect } from 'react';
import { Edit3, Camera, Package, Heart, MessageCircle, Star, Eye, MapPin, Calendar, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface UserListing {
  _id: string;
  title: string;
  price: number;
  images: Array<{ url: string }>;
  status: string;
  views: number;
  createdAt: string;
}

const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userListings, setUserListings] = useState<UserListing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    city: user?.city || '',
    avatar: user?.avatar || ''
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchUserListings();
  }, []);

  const fetchUserListings = async () => {
    try {
      const response = await api.get('/listings/user');
      setUserListings(response.data.listings);
    } catch (error) {
      toast.error('Failed to fetch your listings');
    } finally {
      setListingsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let updateData = { ...profileData };

      // Handle avatar upload
      if (avatarFile) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          updateData.avatar = e.target?.result as string;
          await updateProfile(updateData);
          toast.success('Profile updated successfully!');
          setIsEditing(false);
          setAvatarFile(null);
          setAvatarPreview(null);
        };
        reader.readAsDataURL(avatarFile);
      } else {
        await updateProfile(updateData);
        toast.success('Profile updated successfully!');
        setIsEditing(false);
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'sold':
        return 'bg-blue-100 text-blue-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const activeListings = userListings.filter(listing => listing.status === 'active');
  const soldListings = userListings.filter(listing => listing.status === 'sold');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-8">
              <div className="text-center">
                <div className="relative inline-block">
                  <img
                    src={avatarPreview || user?.avatar || '/default-avatar.png'}
                    alt={user?.name}
                    className="h-24 w-24 rounded-full object-cover mx-auto"
                  />
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 cursor-pointer hover:bg-blue-700 transition-colors">
                      <Camera className="h-4 w-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mt-4">{user?.name}</h2>
                <p className="text-gray-600 flex items-center justify-center space-x-1 mt-2">
                  <MapPin className="h-4 w-4" />
                  <span>{user?.city}</span>
                </p>
                
                <div className="flex items-center justify-center space-x-1 mt-2">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-gray-600">
                    {user?.ratings.average.toFixed(1)} ({user?.ratings.count} reviews)
                  </span>
                </div>

                <p className="text-sm text-gray-500 mt-2">
                  Member since {formatDate(user?.createdAt || '')}
                </p>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{userListings.length}</div>
                  <div className="text-sm text-gray-600">Total Listings</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{activeListings.length}</div>
                  <div className="text-sm text-gray-600">Active</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-600">{soldListings.length}</div>
                  <div className="text-sm text-gray-600">Sold</div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <>
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setAvatarFile(null);
                        setAvatarPreview(null);
                        setProfileData({
                          name: user?.name || '',
                          phone: user?.phone || '',
                          city: user?.city || '',
                          avatar: user?.avatar || ''
                        });
                      }}
                      className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                
                <Link
                  to="/create-listing"
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Listing</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Edit Profile Form */}
            {isEditing && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Profile</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={profileData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={profileData.city}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </form>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link
                to="/chat"
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <MessageCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Messages</h3>
                    <p className="text-sm text-gray-600">View conversations</p>
                  </div>
                </div>
              </Link>
              
              <Link
                to="/wishlist"
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-red-100 p-3 rounded-full">
                    <Heart className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Wishlist</h3>
                    <p className="text-sm text-gray-600">{user?.wishlist.length || 0} items</p>
                  </div>
                </div>
              </Link>
              
              <Link
                to="/create-listing"
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 p-3 rounded-full">
                    <Package className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Sell Item</h3>
                    <p className="text-sm text-gray-600">Create new listing</p>
                  </div>
                </div>
              </Link>
            </div>

            {/* User Listings */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">My Listings</h3>
                <Link
                  to="/create-listing"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add New</span>
                </Link>
              </div>

              {listingsLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              ) : userListings.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">No listings yet</h4>
                  <p className="text-gray-600 mb-4">Start selling by creating your first listing</p>
                  <Link
                    to="/create-listing"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Create Listing
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {userListings.map((listing) => (
                    <Link
                      key={listing._id}
                      to={`/listings/${listing._id}`}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex space-x-4">
                        <img
                          src={listing.images[0]?.url || '/placeholder-image.jpg'}
                          alt={listing.title}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">{listing.title}</h4>
                          <p className="text-lg font-bold text-blue-600 mt-1">
                            {formatPrice(listing.price)}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(listing.status)}`}>
                              {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                            </span>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Eye className="h-4 w-4" />
                                <span>{listing.views}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDate(listing.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;