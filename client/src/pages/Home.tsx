import { useState } from "react";
import { LogOut, Send, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Home = () => {
  const [input, setInput] = useState("");
  const [userName, setUserName] = useState(localStorage.getItem("username"));
  const navigate = useNavigate();
  const username = localStorage.getItem("username");

  const endpoint =
    import.meta.env.VITE_RUNNING_ENV === "dev"
      ? import.meta.env.VITE_DEV_API_URL
      : import.meta.env.VITE_PROD_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!input.trim()) {
      alert("Please enter a message.");
      return;
    }

    try {
      const response = await axios.post(`${endpoint}/addlogs`, {
        userName,
        message: input,
      });

      console.log("Log stored successfully:", response.data);
      setInput("");
      navigate(`${userName}/dashboard`);
    } catch (error) {
      console.error("Error storing log:", error.response?.data || error.message);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col bg-gradient-to-b from-white to-gray-50 relative">
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-10">
        <div className="flex items-center justify-center px-4 h-16 max-w-2xl mx-auto">
        <h1 className="text-xl flex-1 flex justify-center items-center font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            THE BOX
          </h1>
          <button
            className="p-2 hover:text-emerald-600 transition-colors"
            onClick={() => {
              navigate(`/${username}/dashboard`);
            }}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 overflow-y-auto pb-20 justify-center items-center">
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

      {/* Input Form */}
      <div className="fixed bottom-14 left-0 w-full px-4 py-4 bg-white/80 backdrop-blur-md border-t border-gray-100">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          <div className="relative group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Share what's on your mind..."
              className="w-full px-6 py-4 bg-white rounded-2xl text-gray-900 shadow-md ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-gray-400"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-emerald-500 text-white rounded-xl shadow-md hover:bg-emerald-600 transition-colors"
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