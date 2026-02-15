import React from 'react';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram } from 'lucide-react';
import { Separator } from './ui/separator';

export function Footer() {
  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">ShopHub</h3>
            <p className="text-sm text-muted-foreground">
              Your one-stop destination for quality products at competitive prices. 
              We're committed to providing excellent customer service and fast delivery.
            </p>
            <div className="flex space-x-4">
              <Facebook className="w-5 h-5 text-muted-foreground hover:text-primary cursor-pointer" />
              <Twitter className="w-5 h-5 text-muted-foreground hover:text-primary cursor-pointer" />
              <Instagram className="w-5 h-5 text-muted-foreground hover:text-primary cursor-pointer" />
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-medium">Quick Links</h4>
            <div className="space-y-2 text-sm">
              <a href="#" className="block text-muted-foreground hover:text-primary">About Us</a>
              <a href="#" className="block text-muted-foreground hover:text-primary">Contact</a>
              <a href="#" className="block text-muted-foreground hover:text-primary">FAQ</a>
              <a href="#" className="block text-muted-foreground hover:text-primary">Shipping Info</a>
              <a href="#" className="block text-muted-foreground hover:text-primary">Returns</a>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h4 className="font-medium">Categories</h4>
            <div className="space-y-2 text-sm">
              <a href="#" className="block text-muted-foreground hover:text-primary">Electronics</a>
              <a href="#" className="block text-muted-foreground hover:text-primary">Clothing</a>
              <a href="#" className="block text-muted-foreground hover:text-primary">Shoes</a>
              <a href="#" className="block text-muted-foreground hover:text-primary">Accessories</a>
              <a href="#" className="block text-muted-foreground hover:text-primary">Home</a>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="font-medium">Contact Us</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">support@shophub.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">1-800-SHOP-HUB</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">123 Commerce St, City, State 12345</span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-sm text-muted-foreground">
            © 2024 ShopHub. All rights reserved.
          </p>
          <div className="flex space-x-6 text-sm">
            <a href="#" className="text-muted-foreground hover:text-primary">Privacy Policy</a>
            <a href="#" className="text-muted-foreground hover:text-primary">Terms of Service</a>
            <a href="#" className="text-muted-foreground hover:text-primary">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}