import { useState } from 'react';
import { Send } from 'lucide-react';
import axios from 'axios';

const Home = () => {
  const [input, setInput] = useState('');
  const [userName, setUserName] = useState(localStorage.getItem('username'));

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!input.trim()) {
      alert('Please enter a message.');
      return;
    }
    
    try {
      const response = await axios.post('https://boxed-api.vercel.app/addlogs', {
        userName,
        message: input,
      });
      
      console.log('Log stored successfully:', response.data);
      setInput('');
    } catch (error) {
      console.error('Error storing log:', error.response?.data || error.message);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-white to-gray-50">
      {/* AI Background Pattern - Fixed position */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,128,128,0.1)_0%,rgba(0,128,128,0)_50%)]"></div>
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Header */}
      <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center justify-center px-4 h-full max-w-2xl mx-auto">
          <h1 className="text-xl font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            BOXED
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="h-full flex items-center justify-center px-4">
          <div className="w-full max-w-2xl text-center space-y-6">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Share your thoughts, find your community
            </h2>
            <p className="text-gray-600">
              AI-powered communities that understand and connect you
            </p>
          </div>
        </div>
      </main>

      {/* Input Form - Adjusted to account for Navbar height */}
      <div className="w-full px-4 py-4 bg-white/80 backdrop-blur-md border-t border-gray-100 mb-14">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          <div className="relative group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Share what's on your mind..."
              className="w-full px-6 py-4 bg-white rounded-2xl text-gray-900 shadow-sm ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-gray-400"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Home;