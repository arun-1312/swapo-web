import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Mail, Phone, MapPin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="h-8 w-8 text-blue-400" />
              <span className="text-2xl font-bold">SWAPO</span>
            </div>
            <p className="text-gray-400">
              Your trusted marketplace for buying and selling everything you need.
            </p>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2 text-gray-400">
                <Mail className="h-4 w-4" />
                <span>hello@swapo.com</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-400">
                <Phone className="h-4 w-4" />
                <span>+1 (555) 123-4567</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <div className="space-y-2">
              <Link to="/listings" className="block text-gray-400 hover:text-white transition-colors">
                Browse Listings
              </Link>
              <Link to="/create-listing" className="block text-gray-400 hover:text-white transition-colors">
                Sell Item
              </Link>
              <Link to="/profile" className="block text-gray-400 hover:text-white transition-colors">
                My Account
              </Link>
              <Link to="/wishlist" className="block text-gray-400 hover:text-white transition-colors">
                Wishlist
              </Link>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Categories</h3>
            <div className="space-y-2">
              <Link to="/listings?category=Electronics" className="block text-gray-400 hover:text-white transition-colors">
                Electronics
              </Link>
              <Link to="/listings?category=Vehicles" className="block text-gray-400 hover:text-white transition-colors">
                Vehicles
              </Link>
              <Link to="/listings?category=Fashion" className="block text-gray-400 hover:text-white transition-colors">
                Fashion
              </Link>
              <Link to="/listings?category=Home%20%26%20Garden" className="block text-gray-400 hover:text-white transition-colors">
                Home & Garden
              </Link>
            </div>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Support</h3>
            <div className="space-y-2">
              <a href="#" className="block text-gray-400 hover:text-white transition-colors">
                Help Center
              </a>
              <a href="#" className="block text-gray-400 hover:text-white transition-colors">
                Safety Tips
              </a>
              <a href="#" className="block text-gray-400 hover:text-white transition-colors">
                Terms of Service
              </a>
              <a href="#" className="block text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © {new Date().getFullYear()} SWAPO Web. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;