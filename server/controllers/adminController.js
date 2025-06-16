import User from '../models/User.js';
import Listing from '../models/Listing.js';
import Chat from '../models/Chat.js';

export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalListings,
      activeListings,
      totalChats,
      recentUsers,
      recentListings
    ] = await Promise.all([
      User.countDocuments(),
      Listing.countDocuments(),
      Listing.countDocuments({ status: 'active' }),
      Chat.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email city createdAt'),
      Listing.find().sort({ createdAt: -1 }).limit(5).populate('seller', 'name').select('title price category createdAt seller')
    ]);

    // Get listings by category
    const listingsByCategory = await Listing.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get users registered per month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      stats: {
        totalUsers,
        totalListings,
        activeListings,
        totalChats,
        soldListings: totalListings - activeListings
      },
      charts: {
        listingsByCategory,
        userGrowth
      },
      recent: {
        users: recentUsers,
        listings: recentListings
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const query = search ? {
      $or: [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { city: new RegExp(search, 'i') }
      ]
    } : {};

    const users = await User.find(query)
      .select('-password -refreshToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

export const getAllListings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';

    let query = {};

    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { category: new RegExp(search, 'i') }
      ];
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const listings = await Listing.find(query)
      .populate('seller', 'name email city')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Listing.countDocuments(query);

    res.json({
      listings,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (error) {
    console.error('Get all listings error:', error);
    res.status(500).json({ message: 'Failed to fetch listings' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Don't allow deleting the current admin
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user's listings
    await Listing.deleteMany({ seller: userId });

    // Remove user from chats
    await Chat.deleteMany({ participants: userId });

    // Delete user
    await User.findByIdAndDelete(userId);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

export const deleteListing = async (req, res) => {
  try {
    const listingId = req.params.id;

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // Delete associated chats
    await Chat.deleteMany({ listing: listingId });

    // Remove from user wishlists
    await User.updateMany(
      { wishlist: listingId },
      { $pull: { wishlist: listingId } }
    );

    // Delete listing
    await Listing.findByIdAndDelete(listingId);

    res.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('Delete listing error:', error);
    res.status(500).json({ message: 'Failed to delete listing' });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isVerified = !user.isVerified;
    await user.save();

    res.json({
      message: `User ${user.isVerified ? 'verified' : 'unverified'} successfully`,
      user
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ message: 'Failed to update user status' });
  }
};

export const toggleListingStatus = async (req, res) => {
  try {
    const listingId = req.params.id;
    const { status } = req.body;

    if (!['active', 'inactive', 'sold'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const listing = await Listing.findByIdAndUpdate(
      listingId,
      { status },
      { new: true }
    ).populate('seller', 'name email');

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    res.json({
      message: 'Listing status updated successfully',
      listing
    });
  } catch (error) {
    console.error('Toggle listing status error:', error);
    res.status(500).json({ message: 'Failed to update listing status' });
  }
};