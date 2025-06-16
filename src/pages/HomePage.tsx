import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Shield, Users, Zap, Star } from 'lucide-react';
import SearchBar from '../components/common/SearchBar';

const categories = [
  { name: 'Electronics', icon: '📱', count: '2.5k+' },
  { name: 'Vehicles', icon: '🚗', count: '1.8k+' },
  { name: 'Fashion', icon: '👕', count: '3.2k+' },
  { name: 'Home & Garden', icon: '🏠', count: '1.9k+' },
  { name: 'Sports', icon: '⚽', count: '950+' },
  { name: 'Books', icon: '📚', count: '1.2k+' },
];

const features = [
  {
    icon: Shield,
    title: 'Safe & Secure',
    description: 'Your transactions are protected with advanced security measures'
  },
  {
    icon: Users,
    title: 'Trusted Community',
    description: 'Join thousands of verified buyers and sellers in your area'
  },
  {
    icon: Zap,
    title: 'Quick & Easy',
    description: 'List your items in minutes and start selling immediately'
  }
];

const HomePage: React.FC = () => {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Buy & Sell
              <span className="block text-blue-200">Everything Local</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
              Discover amazing deals from people in your community. 
              The safest way to buy and sell locally.
            </p>
            
            <div className="max-w-2xl mx-auto">
              <SearchBar />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/listings"
                className="flex items-center space-x-2 bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                <Search className="h-5 w-5" />
                <span>Browse Items</span>
              </Link>
              <Link
                to="/create-listing"
                className="flex items-center space-x-2 bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-400 transition-colors border border-blue-400"
              >
                <Plus className="h-5 w-5" />
                <span>Start Selling</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Shop by Category
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Find exactly what you're looking for in our organized categories
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Link
                key={category.name}
                to={`/listings?category=${encodeURIComponent(category.name)}`}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-blue-200 group"
              >
                <div className="text-center space-y-3">
                  <div className="text-4xl mb-2">{category.icon}</div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-500">{category.count} items</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Why Choose SWAPO?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We make buying and selling locally simple, safe, and rewarding
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              {features.map((feature) => (
                <div key={feature.title} className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
                    <feature.icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 max-w-sm mx-auto">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 md:p-12 text-white">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold">50K+</div>
              <div className="text-blue-200">Active Users</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold">100K+</div>
              <div className="text-blue-200">Items Sold</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold">4.8</div>
              <div className="text-blue-200 flex items-center justify-center space-x-1">
                <Star className="h-4 w-4 fill-current" />
                <span>Rating</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold">24/7</div>
              <div className="text-blue-200">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Start?
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Join our community of buyers and sellers today
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Sign Up Free
              </Link>
              <Link
                to="/listings"
                className="border border-gray-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                Browse Items
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;