import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, X, Send } from 'lucide-react';
import axios from 'axios';

const Community = () => {
  const { username, id } = useParams();
  const [newPost, setNewPost] = useState('');
  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch community data
  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        const response = await axios.get(`https://boxed-api.vercel.app/boxes/${id}`);
        setCommunity(response.data.box);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching community:", error);
        setLoading(false);
      }
    };

    fetchCommunity();
  }, [id]);

  // Handle post submission
  const handlePostSubmit = async () => {
    if (!newPost.trim()) {
      alert("Post content cannot be empty");
      return;
    }

    try {
      const postData = {
        postContent: newPost,
        postAuthor: username, // Assuming username is the author
        postBox: id, // The box ID
      };

      const response = await axios.post('https://boxed-api.vercel.app/post', postData);
      const createdPost = response.data.post;

      // Update the community state to include the new post
      setCommunity((prevCommunity) => ({
        ...prevCommunity,
        boxPosts: [createdPost, ...prevCommunity.boxPosts],
        boxPostsCount: prevCommunity.boxPostsCount + 1,
      }));

      setNewPost(''); // Clear the input field
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post");
    }
  };

  // Handle Enter key press
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handlePostSubmit();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-10">
          <div className="flex items-center justify-between px-4 h-16 max-w-2xl mx-auto">
            <div className="h-5 w-5 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-5 w-5 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </header>

        <main className="pt-16 pb-20 max-w-2xl mx-auto">
          <div className="px-4">
            <div className="flex justify-center py-8">
              <div className="w-24 h-24 rounded-full bg-gray-200 animate-pulse"></div>
            </div>

            <div className="text-center space-y-3 mb-8">
              <div className="h-8 w-48 bg-gray-200 rounded mx-auto animate-pulse"></div>
              <div className="h-4 w-64 bg-gray-200 rounded mx-auto animate-pulse"></div>
              <div className="h-4 w-56 bg-gray-200 rounded mx-auto animate-pulse"></div>
            </div>

            <div className="flex items-center gap-3 mb-8">
              <div className="flex-1 relative">
                <div className="w-full h-12 bg-gray-200 rounded-xl animate-pulse"></div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100">
            <div className="px-4 py-4">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>

            <div className="space-y-6">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="px-4">
                  <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
                    <div className="aspect-video bg-gray-200 animate-pulse"></div>
                    <div className="p-4">
                      <div className="h-4 w-full bg-gray-200 rounded mb-3 animate-pulse"></div>
                      <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-10">
        <div className="flex items-center justify-between px-4 h-16 max-w-2xl mx-auto">
          <Link to={`/${username}/dashboard`} className="flex items-center hover:text-emerald-600 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-base font-medium text-gray-900">Box</h1>
          <button className="hover:text-emerald-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="pt-16 pb-20 max-w-2xl mx-auto">
        <div className="px-4">
          <div className="flex justify-center py-8">
            <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-white shadow-lg">
              <img
                src={community.boxImage}
                alt={community.boxName}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          
          <div className="text-center space-y-3 mb-8">
            <h2 className="text-2xl font-bold text-gray-900">{community.boxName}</h2>
            <p className="text-emerald-600 text-sm flex items-center justify-center gap-2">
              <span>{community.boxVisits} visits</span>
              <span>•</span>
              <span>{community.boxMembersCount} Members</span>
              <span>•</span>
              <span>{community.boxPostsCount} Posts</span>
            </p>
            <p className="text-gray-600 text-sm">{community.description}</p>
          </div>

          <div className="flex items-center gap-3 mb-8">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Post your thoughts here"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                onKeyDown={handleKeyDown} // Add Enter key functionality
                className="w-full px-4 py-3 bg-white rounded-xl text-gray-900 shadow-sm ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-gray-400"
              />
              <button
                onClick={handlePostSubmit}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100">
          <div className="px-4 py-4">
            <h3 className="font-medium text-gray-900">Today, 1 Jan 2025</h3>
          </div>
          
          <div className="space-y-6">
            {community.boxPosts.map((post) => (
              <div key={post._id} className="px-4">
                <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
                  {post.image && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={post.image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <p className="text-gray-900 mb-3">{post.postContent}</p>
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      <span>Posted by {post.postAuthor}</span>
                      <span>•</span>
                      <span>{new Date(post.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Community;