import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Share, ChevronRight, ChevronLeft, LogOut } from 'lucide-react';
import axios from 'axios';

const Dashboard = () => {
  const [username, setUsername] = useState(localStorage.getItem("username"));
  const [logs, setLogs] = useState([]); // State to store logs
  const [boxes, setBoxes] = useState([]); // State to store boxes
  const [loading, setLoading] = useState(true); // State to track loading status
  const [error, setError] = useState(null); // State to handle errors
  const nav = useNavigate();

  const endpoint = import.meta.env.VITE_RUNNING_ENV === 'dev' ? import.meta.env.VITE_DEV_API_URL : import.meta.env.VITE_PROD_API_URL;

  // Fetch logs and boxes from the backend
  useEffect(() => {
    if (!username) return; // Prevent API call if username is not available

    const fetchData = async () => {
      try {
        // Fetch logs
        const logsResponse = await axios.get(`${endpoint}/getlogs/${username}`);
        setLogs(logsResponse.data.logs.slice().reverse()); // Reverse logs safely

        // Fetch boxes
        const boxesResponse = await axios.get(`${endpoint}/userboxes/${username}`);
        setBoxes(boxesResponse.data.boxes);
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to fetch data'); // Handle errors
      } finally {
        setLoading(false); // Set loading to false after the request completes
      }
    };

    fetchData();
  }, [username]); // Re-fetch data if the username changes

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 pb-20">
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-10">
        <div className="flex items-center justify-between px-4 h-16 max-w-2xl mx-auto">
          <h1 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Home
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
        {/* Your Boxes Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900">Your Boxes</h2>
            <div className="flex gap-2">
              <button className="p-1.5 rounded-full bg-white shadow-sm hover:bg-gray-50 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="p-1.5 rounded-full bg-white shadow-sm hover:bg-gray-50 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
            <div className="flex gap-4 min-w-max">
              {loading ? (
                // Loading Skeleton for Boxes
                [...Array(3)].map((_, index) => (
                  <div
                    key={index}
                    className="block bg-white rounded-2xl overflow-hidden shadow-sm ring-1 ring-gray-200 w-72 animate-pulse"
                  >
                    <div className="aspect-video bg-gray-200"></div>
                    <div className="p-4">
                      <div className="h-5 w-3/4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 w-full bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))
              ) : error ? (
                <p className="text-red-600">{error}</p>
              ) : boxes.length === 0 ? (
                <p className="text-gray-600">No boxes available.</p>
              ) : (
                boxes.map((box) => (
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
                ))
              )}
            </div>
          </div>
        </div>

        {/* Logs Section */}
        <div>
          <div className="space-y-2 mb-6">
            <h2 className="text-lg font-medium text-gray-900">Logs</h2>
            <p className="text-sm text-emerald-600">Let us explore</p>
          </div>

          {loading ? (
            // Loading Skeleton for Logs
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-4 bg-white rounded-xl shadow-sm ring-1 ring-gray-200 animate-pulse"
                >
                  <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                  <div className="h-4 w-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : logs.length === 0 ? (
            <p className="text-gray-600">No logs available.</p>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log._id}
                  className="flex justify-between items-center p-4 bg-white rounded-xl shadow-sm ring-1 ring-gray-200"
                >
                  <span className="text-gray-900">{log.message}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;