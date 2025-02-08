import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Share, ChevronRight, ChevronLeft, LogOut } from 'lucide-react';
import axios from 'axios';

const Dashboard = () => {
  const [username, setUsername] = useState(localStorage.getItem("username"));
  const [logs, setLogs] = useState([]);
  const [boxes, setBoxes] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('logs');
  const nav = useNavigate();

  const endpoint = import.meta.env.VITE_RUNNING_ENV === 'dev' ? import.meta.env.VITE_DEV_API_URL : import.meta.env.VITE_PROD_API_URL;

  useEffect(() => {
    if (!username) return;

    const fetchData = async () => {
      try {
        const [logsResponse, postsResponse, boxesResponse] = await Promise.all([
          axios.get(`${endpoint}/getlogs/${username}`),
          axios.get(`${endpoint}/getposts/${username}`),
          axios.get(`${endpoint}/userboxes/${username}`)
        ]);

        setLogs(logsResponse.data.logs.slice().reverse());
        setPosts(postsResponse.data.posts);
        setBoxes(boxesResponse.data.boxes);
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [username]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 pb-20">
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-10">
        <div className="flex items-center justify-center px-4 h-16 max-w-2xl mx-auto">
        <h1 className="text-xl flex-1 flex justify-center items-center font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            THE BOX
          </h1>
          <button
            className="p-2 hover:text-emerald-600 transition-colors"
            onClick={() => {
              localStorage.removeItem('username');
              setUsername(null);
              window.location.href = "/auth";
            }}
          >
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="pt-20 px-4 max-w-2xl mx-auto">
        {/* Input section */}
      <div className="mb-8">
          <Link to={`/${username}`} className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm ring-1 ring-gray-200">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`}
                alt="User avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <input
                type="text"
                placeholder="Share your thoughts..."
                className="w-full px-4 py-2 bg-gray-50 rounded-lg text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                readOnly
                onClick={(e) => {
                  e.preventDefault();
                  nav(`/${username}`);
                }}
              />
            </div>
          </Link>
        </div>
        {/* Boxes Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900">Your Boxes</h2>
          </div>

          <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
            <div className="flex gap-4 min-w-max">
              {loading ? (
                [...Array(3)].map((_, index) => (
                  <div key={index} className="block bg-white rounded-2xl overflow-hidden shadow-sm ring-1 ring-gray-200 w-72 animate-pulse">
                    <div className="aspect-video bg-gray-200"></div>
                    <div className="p-4">
                      <div className="h-5 w-3/4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 w-full bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))
              ) : boxes.map((box) => (
                <Link
                  key={box._id}
                  to={`/${username}/community/${box._id}`}
                  className="block bg-white rounded-2xl overflow-hidden shadow-sm ring-1 ring-gray-200 hover:shadow-md transition-all w-72"
                >
                  <div className="aspect-video relative">
                    <img
                      src={box.boxImage}
                      alt={box.boxName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900">{box.boxName}</h3>
                    <p className="text-gray-500 text-xs mt-2 flex items-center gap-2">
                      <span>{box.boxVisits} visits</span>
                      <span>•</span>
                      <span>{box.boxMembersCount} Members</span>
                      <span>•</span>
                      <span>{box.boxPostsCount} posts</span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mb-6">
          {/* Heading */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Logs</h2>
          </div>
          <div className="flex gap-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('logs')}
              className={`pb-2 px-1 text-sm font-medium transition-colors ${
                activeTab === 'logs'
                  ? 'text-emerald-600 border-b-2 border-emerald-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Thoughts
            </button>
            <button
              onClick={() => setActiveTab('posts')}
              className={`pb-2 px-1 text-sm font-medium transition-colors ${
                activeTab === 'posts'
                  ? 'text-emerald-600 border-b-2 border-emerald-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Posts
            </button>
          </div>
        </div>

        {/* Content Section */}
        {activeTab === 'logs' ? (
          <div className="space-y-4">
            {loading ? (
              [...Array(3)].map((_, index) => (
                <div key={index} className="flex justify-between items-center p-4 bg-white rounded-xl shadow-sm ring-1 ring-gray-200 animate-pulse">
                  <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                  <div className="h-4 w-16 bg-gray-200 rounded"></div>
                </div>
              ))
            ) : logs.map((log) => (
              <div key={log._id} className="flex justify-between items-center p-4 bg-white rounded-xl shadow-sm ring-1 ring-gray-200">
                <span className="text-gray-900">{log.message}</span>
                <span className="text-sm text-gray-500">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {loading ? (
              [...Array(3)].map((_, index) => (
                <div key={index} className="animate-pulse p-4 bg-white rounded-xl shadow-sm ring-1 ring-gray-200">
                  <div className="h-5 w-1/3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-full bg-gray-200 rounded"></div>
                </div>
              ))
            ) : posts.map((post) => (
              
              <div key={post._id} className="p-4 bg-white rounded-xl shadow-sm ring-1 ring-gray-200">
                <Link to={`/${username}/community/${post.postBox._id}`} key={post._id} >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-emerald-600">
                    {post.postBox.boxName}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {new Date(post.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-900">{post.postContent}</p>
                </Link>
              </div>
            
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;