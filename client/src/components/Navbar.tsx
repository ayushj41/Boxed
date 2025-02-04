import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Box } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const username = localStorage.getItem("username"); // Get the logged-in username

  if (!username) return null; // Hide Navbar if user is not logged in

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 py-2 px-4 z-10">
      <div className="flex justify-around items-center max-w-md mx-auto">
        <Link 
          to={`/${username}`} 
          className={`flex flex-col items-center transition-colors ${
            location.pathname === `/${username}` 
              ? 'text-emerald-600' 
              : 'text-gray-500 hover:text-emerald-600'
          }`}
        >
          <Home className="h-5 w-5" />
          <span className="text-xs mt-1 font-medium">Home</span>
        </Link>
        <Link 
          to={`/${username}/dashboard`} 
          className={`flex flex-col items-center transition-colors ${
            location.pathname === `/${username}/dashboard` 
              ? 'text-emerald-600' 
              : 'text-gray-500 hover:text-emerald-600'
          }`}
        >
          <Box className="h-5 w-5" />
          <span className="text-xs mt-1 font-medium">Boxes</span>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
