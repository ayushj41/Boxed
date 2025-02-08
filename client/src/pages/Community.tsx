import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Send, ChevronDown, ChevronUp, ArrowUp } from 'lucide-react';
import axios from 'axios';

const Community = () => {
  const { username, id } = useParams();
  const [newPost, setNewPost] = useState('');
  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const messagesEndRef = useRef(null);
  
  const endpoint = import.meta.env.VITE_RUNNING_ENV === 'dev' ? import.meta.env.VITE_DEV_API_URL : import.meta.env.VITE_PROD_API_URL;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleScroll = () => {
    setShowScrollTop(window.scrollY > 400);
  };

  useEffect(() => {
    scrollToBottom();
  }, [community?.boxPosts]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        const response = await axios.get(`${endpoint}/boxes/${id}`);
        setCommunity(response.data.box);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching community:", error);
        setLoading(false);
      }
    };

    fetchCommunity();
  }, [id]);

  const handlePostSubmit = async () => {
    if (!newPost.trim()) return;

    try {
      const postData = {
        postContent: newPost,
        postAuthor: username,
        postBox: id,
      };

      const response = await axios.post(`${endpoint}/post`, postData);
      const createdPost = response.data.post;

      setCommunity((prevCommunity) => ({
        ...prevCommunity,
        boxPosts: [createdPost, ...prevCommunity.boxPosts],
        boxPostsCount: prevCommunity.boxPostsCount + 1,
      }));

      setNewPost('');
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handlePostSubmit();
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-white flex justify-center">
        <div className="w-full max-w-2xl bg-white">
          <div className="h-16 bg-white/80 backdrop-blur-md animate-pulse" />
          <div className="h-48 bg-gray-200 animate-pulse" />
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-128px)] bg-white flex justify-center">
      <div className="w-full max-w-2xl bg-white shadow-sm flex flex-col">
        {/* Fixed Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center px-4 shrink-0 sticky top-0 z-10">
          <Link to={`/${username}/dashboard`} className="mr-4 hover:text-emerald-600 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          
          <div className="flex items-center flex-1">
            <img
              src={community.boxImage}
              alt={community.boxName}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="ml-3">
              <h1 className="font-medium text-gray-900">{community.boxName}</h1>
              <p className="text-xs text-gray-500">
                {community.boxMembersCount} members • {community.boxVisits} visits
              </p>
            </div>
          </div>
        </header>

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
        <div className="flex-1 pb-24">
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

        {/* Scroll to Top Button */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-36 right-4 p-3 bg-emerald-500 text-white rounded-full shadow-lg hover:bg-emerald-600 transition-all z-50"
            aria-label="Scroll to top"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        )}

        {/* Fixed Bottom Input */}
        <div className="bg-white border-t border-gray-100 p-4 fixed bottom-12 left-0 right-0 max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <textarea
                rows="1"
                placeholder="Type a message..."
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-gray-400 resize-none"
              />
            </div>
            <button
              onClick={handlePostSubmit}
              className="p-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!newPost.trim()}
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Community;