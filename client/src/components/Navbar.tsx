import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Box } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';

const Navbar = () => {
  const location = useLocation();
  const { user } = useUser();
  const [isSpinning, setIsSpinning] = useState(false);

  if (!user) return null;

  const username = user.emailAddresses[0].emailAddress;

  const handleDiscoverClick = (e) => {
    if (location.pathname === `/explore`) {
      e.preventDefault();
      setIsSpinning(true);
      window.dispatchEvent(new Event('reloadCommunity'));
      
      setTimeout(() => {
        setIsSpinning(false);
      }, 750);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 py-3 px-4 z-10 shadow-lg">
      <div className="flex justify-around items-center max-w-md mx-auto">
        <Link
          to={`/dashboard`}
          className={`flex flex-col items-center transition-colors w-24 ${
            location.pathname === `/dashboard`
              ? 'text-emerald-600'
              : 'text-gray-500 hover:text-emerald-600'
          }`}
        >
          <Home className="h-4 w-4" />
          <span className="text-xs mt-1 font-medium">Home</span>
        </Link>
        <Link
          to={`/explore`}
          onClick={handleDiscoverClick}
          className={`flex flex-col items-center px-8 py-1 rounded-full transition-all ${
            location.pathname === `/explore`
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
          } shadow-md hover:shadow-lg transform hover:-translate-y-0.5 min-w-[160px]`}
        >
          <Box
            className={`h-4 w-4 transition-transform duration-700 ${
              isSpinning ? 'animate-spin' : ''
            }`}
          />
          <span className="text-xs font-medium mt-1">
            {location.pathname === `/explore`
              ? (isSpinning ? 'Loading...' : 'Tap again')
              : 'Tap here'}
          </span>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;