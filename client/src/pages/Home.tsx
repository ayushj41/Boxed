import { useState, useEffect, useRef } from "react";
import { Send, X, MessageCircle, Lightbulb } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useUser } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";

const Home = () => {
  const [input, setInput] = useState("");
  const [sessionID, setSessionID] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const { user } = useUser();
  const navigate = useNavigate();
  const username = user?.emailAddresses[0]?.emailAddress;
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Suggested prompts
  const suggestionPrompts = [
    "I need some advice on something…",
    "Guess what just happened to me!",
    "I just want to rant for a sec. You in?",
    "Let's play a game! 20 questions or trivia?"
  ];

  const endpoint =
    import.meta.env.VITE_RUNNING_ENV === "dev"
      ? import.meta.env.VITE_DEV_API_URL
      : import.meta.env.VITE_PROD_API_URL;

  /** Scroll chat to bottom */
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  /** Fetch messages for the current session */
  const fetchMessages = async () => {
    if (!sessionID) return;
    
    try {
      const logsResponse = await axios.get(`${endpoint}/ai/get-messages/${sessionID}`);
      console.log(logsResponse.data.conversationLogs)
      if (logsResponse.data.conversationLogs) {
        setMessages(logsResponse.data.conversationLogs);
        scrollToBottom();
      }
    } catch (error) {
      console.error("Error fetching messages:", error.response?.data || error.message);
    }
  };

  /** Start session and fetch messages on page load */
  useEffect(() => {
    const startSession = async () => {
      try {
        const response = await axios.post(`${endpoint}/ai/create-session`, {
          userName: username,
        });
        setSessionID(response.data.sessionID);
        console.log("Session started:", response.data.sessionID);
        
        // After getting session ID, fetch messages
        if (response.data.sessionID) {
          // Small delay to ensure session is registered on the backend
          setTimeout(() => {
            fetchMessages();
          }, 500);
        }
      } catch (error) {
        console.error("Error starting session:", error.response?.data || error.message);
      }
    };

    if (username) {
      startSession();
    }
    
    // Focus the input field when component mounts
    setTimeout(() => {
      inputRef.current?.focus();
    }, 500);
    
    // Clean up function to end session when component unmounts
    return () => {
      endSession();
    };
  }, [username]);

  /** End session before leaving */
  const endSession = async () => {
    if (!sessionID) return;
    try {
      await axios.post(`${endpoint}/ai/endsession`, { sessionID });
      console.log("Session ended:", sessionID);
    } catch (error) {
      console.error("Error ending session:", error.response?.data || error.message);
    }
  };

  /** Handle message submission */
  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (!input.trim() || !sessionID) {
      return;
    }

    try {
      // Add user message to UI immediately for responsiveness
      const userMessage = { role: "user", content: input };
      setMessages((prev) => [...prev, userMessage]);
      scrollToBottom();
      
      // Clear input field
      setInput("");
      
      // Show typing indicator
      setIsTyping(true);

      // Send message to backend
      const response = await axios.post(`${endpoint}/ai/conversation`, {
        userInput: input,
        sessionID,
      });

      console.log("Message sent successfully");
      
      // Since the API returns the entire conversation, update our state with it
      if (response.data.conversation) {
        setMessages(response.data.conversation);
      } else {
        // If we don't get the conversation back, fetch it separately
        fetchMessages();
      }
      
      // Hide typing indicator
      setIsTyping(false);
      scrollToBottom();
    } catch (error) {
      console.error("Error sending message:", error.response?.data || error.message);
      setIsTyping(false);
      
      // Show error message in chat
      setMessages((prev) => [...prev, { 
        sender: "ai", 
        text: "Sorry, there was an error processing your message. Please try again." 
      }]);
      scrollToBottom();
    }
  };

  // Handle clicking on a suggestion
  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
    // Small delay to ensure the input is updated before submitting
    setTimeout(() => handleSubmit(), 100);
  };

  // Typing indicator component
  const TypingIndicator = () => (
    <div className="flex justify-start mb-3">
      <div className="px-4 py-2 rounded-lg bg-gray-200 text-gray-900 flex items-center space-x-1">
        <span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: "0ms" }}></span>
        <span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: "200ms" }}></span>
        <span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: "400ms" }}></span>
      </div>
    </div>
  );

  // Message bubble animations
  const messageBubbleVariants = {
    hidden: (sender) => ({ 
      opacity: 0, 
      x: sender === "user" ? 20 : -20,
      y: 10,
      scale: 0.9
    }),
    visible: { 
      opacity: 1, 
      x: 0,
      y: 0,
      scale: 1,
      transition: { 
        type: "spring", 
        damping: 25, 
        stiffness: 500
      }
    },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };

  return (
    <div className="min-h-[calc(100vh-24vh)] flex flex-col bg-gradient-to-br from-gray-50 via-white to-emerald-50 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-70">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400 rounded-full filter blur-3xl opacity-10 -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-400 rounded-full filter blur-3xl opacity-10 translate-y-1/2 -translate-x-1/4"></div>
      </div>

      <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md border-b border-emerald-100 z-10 shadow-sm">
        <div className="flex items-center justify-center px-4 h-16 max-w-2xl mx-auto relative">
          {/* Centered text as requested */}
          <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
            THE BOX
          </h1>
          <button
            className="absolute right-4 p-2 hover:text-emerald-600 transition-colors rounded-full hover:bg-emerald-50"
            onClick={() => {
              endSession(); // End session before navigating away
              navigate(`/dashboard`);
            }}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Chat Container - Made smaller and more compact */}
      <main className="flex flex-1 overflow-hidden pb-32 pt-20 justify-center">
        <div className="h-full flex flex-col items-center justify-center px-4 w-full max-w-2xl">
          <div className="w-full bg-white/80 backdrop-blur-md shadow-xl rounded-2xl p-4 h-[calc(100vh-16rem)] overflow-hidden flex flex-col border border-emerald-100">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 scrollbar-thin scrollbar-thumb-emerald-200 scrollbar-track-transparent">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center space-y-6">
                  <div className="text-center">
                    <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-emerald-50 mb-4">
                      <MessageCircle className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                      Let's Chat!
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Start a conversation or try a suggestion below</p>
                  </div>
                  
                  {/* Message Suggestions */}
                  <div className="flex flex-wrap justify-center gap-2 px-4 max-w-sm">
                    {suggestionPrompts.map((suggestion, index) => (
                      <motion.button
                        key={index}
                        className="bg-white px-4 py-2 rounded-full text-sm text-gray-700 border border-emerald-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion}
                      </motion.button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <AnimatePresence>
                    {messages.map((msg, index) => (
                      <motion.div
                        key={index}
                        className={`flex mb-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        custom={msg.role}
                        variants={messageBubbleVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                      >
                        <div
                          className={`px-4 py-2.5 rounded-2xl max-w-xs md:max-w-sm break-words ${
                            msg.role === "user"
                              ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white"
                              : "bg-white border border-gray-100 text-gray-800"
                          }`}
                        >
                          {msg.content}
                        </div>
                      </motion.div>
                    ))}
                    
                    {isTyping && <TypingIndicator />}
                  </AnimatePresence>
                </>
              )}
              <div ref={chatEndRef}></div>
            </div>
          </div>
        </div>
      </main>

      {/* Input Form - Adjusted for bottom navigation */}
      <div className="fixed bottom-16 left-0 w-full px-4 py-4 bg-white/90 backdrop-blur-md border-t border-emerald-100 shadow-lg">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          <div className="relative group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              ref={inputRef}
              className="w-full px-6 py-3 bg-white rounded-xl text-gray-900 ring-1 ring-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-gray-400 shadow-sm"
            />
            <motion.button
              type="submit"
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-xl shadow-md hover:shadow-lg transition-all ${
                !input.trim() || !sessionID
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
              }`}
              disabled={!input.trim() || !sessionID}
            >
              <Send className="h-5 w-5" />
            </motion.button>
          </div>
          
          {/* Message Suggestions when there are messages */}
          {messages.length > 0 && (
            <div className="flex gap-2 mt-2 overflow-x-auto pb-1 scrollbar-none">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center p-1.5 rounded-full bg-emerald-50 text-emerald-600 flex-shrink-0"
              >
                <Lightbulb className="h-4 w-4" />
              </motion.button>
              {suggestionPrompts.slice(0, 3).map((suggestion, index) => (
                <motion.button
                  key={index}
                  className="bg-gray-50 px-3 py-1.5 rounded-full text-xs text-gray-600 border border-gray-100 whitespace-nowrap flex-shrink-0"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Home;