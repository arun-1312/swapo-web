import User from '../models/User.js';
import Listing from '../models/Listing.js';

export const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'wishlist',
      populate: {
        path: 'seller',
        select: 'name avatar city'
      }
    });

    res.json({ wishlist: user.wishlist });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ message: 'Failed to fetch wishlist' });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    
    const user = await User.findById(userId).select('-password -refreshToken -email');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's active listings
    const listings = await Listing.find({ 
      seller: userId, 
      status: 'active' 
    }).sort({ createdAt: -1 }).limit(6);

    // Get total listings count
    const totalListings = await Listing.countDocuments({ seller: userId });
    const activeListings = await Listing.countDocuments({ 
      seller: userId, 
      status: 'active' 
    });

    res.json({
      user,
      listings,
      stats: {
        totalListings,
        activeListings,
        soldListings: totalListings - activeListings
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Failed to fetch user profile' });
  }
};

export const updateUserRating = async (req, res) => {
  try {
    const { rating } = req.body;
    const userId = req.params.id;
    const raterId = req.user._id;

    if (userId === raterId.toString()) {
      return res.status(400).json({ message: 'Cannot rate yourself' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate new average rating
    const currentAverage = user.ratings.average || 0;
    const currentCount = user.ratings.count || 0;
    
    const newCount = currentCount + 1;
    const newAverage = ((currentAverage * currentCount) + rating) / newCount;

    user.ratings = {
      average: Math.round(newAverage * 10) / 10, // Round to 1 decimal place
      count: newCount
    };

    await user.save();

    res.json({
      message: 'Rating submitted successfully',
      ratings: user.ratings
    });
  } catch (error) {
    console.error('Update user rating error:', error);
    res.status(500).json({ message: 'Failed to update rating' });
  }
};