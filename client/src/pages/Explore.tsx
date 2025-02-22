import React, { useState, useEffect, useRef } from "react";
import { ArrowUp, ChevronDown, ChevronUp, Send, X } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";

const Explore = () => {
  const { user } = useUser();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFullDescriptions, setShowFullDescriptions] = useState({});
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const username = user?.emailAddresses[0]?.emailAddress;
  const endpoint = import.meta.env.VITE_RUNNING_ENV === "dev"
    ? import.meta.env.VITE_DEV_API_URL
    : import.meta.env.VITE_PROD_API_URL;

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fetchCommunities = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${endpoint}/random-box/${username}`);
      setCommunities(data.box ? [data.box] : []);
    } catch (error) {
      console.error("Error fetching communities:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, [endpoint, encodedUsername]);

  useEffect(() => {
    const handleReload = () => {
      fetchCommunities();
    };
    window.addEventListener('reloadCommunity', handleReload);
    return () => window.removeEventListener('reloadCommunity', handleReload);
  }, []);

  const handleClose = () => {
    navigate(`/dashboard`);
  };

  // Rest of the component remains the same until the close button
  return (
    <div className="min-h-[calc(100vh-128px)] bg-white flex justify-center">
      <div className="w-full max-w-2xl bg-white shadow-sm flex flex-col">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center px-4 shrink-0 sticky top-0 z-10">
          <div className="flex items-center flex-1">
            <img
              src={communities[0]?.boxImage}
              alt={communities[0]?.boxName}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="ml-3">
              <h1 className="font-medium text-gray-900">{communities[0]?.boxName}</h1>
              <p className="text-xs text-gray-500">
                {communities[0]?.boxMembersCount} members • {communities[0]?.boxVisits} visits
              </p>
            </div>
          </div>
          <button
            className="p-2 hover:text-emerald-600 transition-colors"
            onClick={handleClose}
          >
            <X className="w-6 h-6" />
          </button>
        </header>

        {communities.map((community) => (
          <div key={community._id} className="flex-1 pb-24">
             {/* Description Section */}
                    <div className="border-b border-gray-100">
                      <img
                        src={community.boxImage}
                        alt={community.boxName}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4 bg-white">
                        <h2 className="font-medium text-gray-900 mb-2">About this community</h2>
                        <div className="text-sm text-gray-600">
                          {community.boxDescription && (
                            <div>
                              <p className="transition-all duration-300">
                                {showFullDescription ? community.boxDescription : community.boxDescription.slice(0, 150) + '...'}
                              </p>
                              {community.boxDescription.length > 150 && (
                                <button
                                  onClick={() => setShowFullDescription(!showFullDescription)}
                                  className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center gap-1 mt-2"
                                >
                                  {showFullDescription ? (
                                    <>Show less <ChevronUp className="h-4 w-4" /></>
                                  ) : (
                                    <>Read more <ChevronDown className="h-4 w-4" /></>
                                  )}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

            {/* Messages */}
            <div className="p-4 space-y-4">
              {community.boxPosts.map((post) => (
                <div
                  key={post._id}
                  className={`flex ${post.postAuthor === username ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.postAuthor}`}
                      alt={post.postAuthor}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div 
                    className={`inline-block max-w-[80%] ${
                      post.postAuthor === username 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-white border border-gray-100'
                    } rounded-2xl shadow-sm px-4 py-2`}
                  >
                    {post.image && (
                      <img
                        src={post.image}
                        alt=""
                        className="w-full h-auto rounded-lg mb-2"
                      />
                    )}
                    <p className="mb-1 break-words">{post.postContent}</p>
                    <div className={`text-xs ${
                      post.postAuthor === username ? 'text-emerald-50' : 'text-gray-500'
                    }`}>
                      {post.postAuthor === username ? 'You' : post.postAuthor} • {new Date(post.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        ))}

        {/* Scroll to Top Button */}
        {showScrollTop && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-36 right-4 p-3 bg-emerald-500 text-white rounded-full shadow-lg hover:bg-emerald-600 transition-all z-50"
            aria-label="Scroll to top"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        )}

        {/* Fixed Bottom Input */}
        <div className="bg-white border-t border-gray-100 p-4 fixed bottom-16 left-0 right-0 max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <textarea
                rows="1"
                placeholder="Log thoughts to become a member."
                disabled
                className="w-full px-4 py-3 bg-gray-200 rounded-xl text-gray-500 focus:outline-none transition-all placeholder:text-gray-400 resize-none"
              />
            </div>
            <button className="p-3 bg-gray-300 text-white rounded-xl cursor-not-allowed">
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Explore;