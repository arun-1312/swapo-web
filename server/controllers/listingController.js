import { validationResult } from 'express-validator';
import Listing from '../models/Listing.js';
import User from '../models/User.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../services/cloudinaryService.js';

export const createListing = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { title, description, price, category, condition, city, tags } = req.body;
    const images = req.files;

    if (!images || images.length === 0) {
      return res.status(400).json({ message: 'At least one image is required' });
    }

    // Upload images to Cloudinary
    const uploadPromises = images.map(image => {
      const base64 = `data:${image.mimetype};base64,${image.buffer.toString('base64')}`;
      return uploadToCloudinary(base64, 'listings');
    });

    const uploadedImages = await Promise.all(uploadPromises);

    // Create listing
    const listing = new Listing({
      title,
      description,
      price: parseFloat(price),
      category,
      condition,
      city,
      seller: req.user._id,
      images: uploadedImages,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    });

    await listing.save();
    await listing.populate('seller', 'name avatar city');

    res.status(201).json({
      message: 'Listing created successfully',
      listing
    });
  } catch (error) {
    console.error('Create listing error:', error);
    res.status(500).json({ message: 'Failed to create listing' });
  }
};

export const getListings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    
    const { category, city, minPrice, maxPrice, condition, sortBy } = req.query;
    
    // Build query
    const query = { status: 'active' };
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (city) {
      query.city = new RegExp(city, 'i');
    }
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    
    if (condition) {
      query.condition = condition;
    }

    // Build sort options
    let sortOptions = { createdAt: -1 }; // Default: newest first
    
    if (sortBy === 'price_low') {
      sortOptions = { price: 1 };
    } else if (sortBy === 'price_high') {
      sortOptions = { price: -1 };
    } else if (sortBy === 'views') {
      sortOptions = { views: -1 };
    }

    const listings = await Listing.find(query)
      .populate('seller', 'name avatar city ratings')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const total = await Listing.countDocuments(query);

    res.json({
      listings,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get listings error:', error);
    res.status(500).json({ message: 'Failed to fetch listings' });
  }
};

export const getListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('seller', 'name avatar city phone ratings createdAt');

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // Increment views
    listing.views += 1;
    await listing.save();

    res.json({ listing });
  } catch (error) {
    console.error('Get listing error:', error);
    res.status(500).json({ message: 'Failed to fetch listing' });
  }
};

export const updateListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // Check if user owns the listing
    if (listing.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { title, description, price, category, condition, city, tags, status } = req.body;
    
    // Update basic fields
    const updateData = {
      title: title || listing.title,
      description: description || listing.description,
      price: price ? parseFloat(price) : listing.price,
      category: category || listing.category,
      condition: condition || listing.condition,
      city: city || listing.city,
      status: status || listing.status,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : listing.tags
    };

    // Handle new images if provided
    if (req.files && req.files.length > 0) {
      // Delete old images from Cloudinary
      for (const image of listing.images) {
        await deleteFromCloudinary(image.publicId);
      }

      // Upload new images
      const uploadPromises = req.files.map(image => {
        const base64 = `data:${image.mimetype};base64,${image.buffer.toString('base64')}`;
        return uploadToCloudinary(base64, 'listings');
      });

      updateData.images = await Promise.all(uploadPromises);
    }

    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('seller', 'name avatar city');

    res.json({
      message: 'Listing updated successfully',
      listing: updatedListing
    });
  } catch (error) {
    console.error('Update listing error:', error);
    res.status(500).json({ message: 'Failed to update listing' });
  }
};

export const deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // Check if user owns the listing or is admin
    if (listing.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete images from Cloudinary
    for (const image of listing.images) {
      await deleteFromCloudinary(image.publicId);
    }

    // Remove from user wishlists
    await User.updateMany(
      { wishlist: listing._id },
      { $pull: { wishlist: listing._id } }
    );

    await Listing.findByIdAndDelete(req.params.id);

    res.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('Delete listing error:', error);
    res.status(500).json({ message: 'Failed to delete listing' });
  }
};

export const toggleWishlist = async (req, res) => {
  try {
    const listingId = req.params.id;
    const userId = req.user._id;

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    const user = await User.findById(userId);
    const isInWishlist = user.wishlist.includes(listingId);

    if (isInWishlist) {
      // Remove from wishlist
      user.wishlist.pull(listingId);
      await user.save();
      res.json({ message: 'Removed from wishlist', inWishlist: false });
    } else {
      // Add to wishlist
      user.wishlist.push(listingId);
      await user.save();
      res.json({ message: 'Added to wishlist', inWishlist: true });
    }
  } catch (error) {
    console.error('Toggle wishlist error:', error);
    res.status(500).json({ message: 'Failed to update wishlist' });
  }
};

export const getUserListings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const listings = await Listing.find({ seller: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Listing.countDocuments({ seller: req.user._id });

    res.json({
      listings,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (error) {
    console.error('Get user listings error:', error);
    res.status(500).json({ message: 'Failed to fetch user listings' });
  }
};

export const searchListings = async (req, res) => {
  try {
    const { q, category, city, minPrice, maxPrice, condition } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Build search query
    const query = { status: 'active' };

    if (q) {
      query.$text = { $search: q };
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (city) {
      query.city = new RegExp(city, 'i');
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    if (condition) {
      query.condition = condition;
    }

    const listings = await Listing.find(query)
      .populate('seller', 'name avatar city ratings')
      .sort(q ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Listing.countDocuments(query);

    res.json({
      listings,
      searchQuery: q,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (error) {
    console.error('Search listings error:', error);
    res.status(500).json({ message: 'Search failed' });
  }
};