import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Electronics',
      'Vehicles',
      'Real Estate',
      'Jobs',
      'Services',
      'Fashion',
      'Home & Garden',
      'Sports',
      'Books',
      'Others'
    ]
  },
  condition: {
    type: String,
    required: [true, 'Condition is required'],
    enum: ['New', 'Like New', 'Good', 'Fair', 'Poor']
  },
  images: [{
    url: { type: String, required: true },
    publicId: { type: String, required: true }
  }],
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'sold', 'inactive'],
    default: 'active'
  },
  views: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  tags: [String]
}, {
  timestamps: true
});

// Optimized text index with partial filter for active listings only
listingSchema.index({ title: 'text', description: 'text' }, { partialFilterExpression: { status: 'active' } });
listingSchema.index({ category: 1, city: 1, status: 1 });
listingSchema.index({ seller: 1, status: 1 });
listingSchema.index({ createdAt: -1 });

export default mongoose.model('Listing', listingSchema);