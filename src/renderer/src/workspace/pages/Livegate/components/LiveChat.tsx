import { Bot, Send, Youtube, Instagram, Twitter, Twitch, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";

const LiveChat = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [showComponent, setShowComponent] = useState(true);
  const liveChatWorking = true;

  useEffect(() => {
    if (!liveChatWorking) {
      const timer = setTimeout(() => setShowComponent(false), 3000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [liveChatWorking])

  if (!showComponent) return null;

  const platformIcons = {
    YouTube: <Youtube className="w-4 h-4 text-red-600" />,
    Instagram: <Instagram className="w-4 h-4 text-pink-500" />,
    Twitter: <Twitter className="w-4 h-4 text-blue-400" />,
    Twitch: <Twitch className="w-4 h-4 text-purple-600" />,
  };

  const comments = [
    {
      platform: "YouTube",
      user: "Tigerman",
      message: "I need a computer like that"
    },
    {
      platform: "Instagram",
      user: "Cornman",
      message: "Love the jacket"
    }
  ];

  if (!liveChatWorking) {
    return (
      <div className="w-96 bg-gradient-to-b from-white/90 to-white/80 backdrop-blur-md shadow-lg rounded-t-2xl border-t border-x border-gray-200 p-6">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Live Chat Unavailable</h3>
            <p className="text-sm text-gray-600 max-w-xs">We're currently enhancing the live chat experience. Please check back soon for an improved version.</p>
          </div>
          <div className="w-full max-w-xs bg-gray-50 rounded-lg p-4 mt-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-500">System upgrade in progress</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`transition-all duration-300 ${isOpen ? 'w-96' : 'w-48'} bg-gradient-to-b from-white/90 to-white/80 backdrop-blur-md shadow-lg rounded-t-2xl border-t border-x border-gray-200`}>
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-base font-semibold text-[#14263A]">Live Chat</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {isOpen ? <ChevronDown className="w-4 h-4 text-gray-600" /> : <ChevronUp className="w-4 h-4 text-gray-600" />}
        </button>
      </div>

      {isOpen && (
        <>
          <div className="max-h-96 overflow-y-auto scrollbar-hide">
            <div className="space-y-6 p-6">
              {comments.map((comment, index) => (
                <div key={index} className="group">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      {platformIcons[comment.platform]}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium text-[#14263A]">{comment.user}</span>
                      <span className="mx-2">·</span>
                      <span className="text-gray-500">{comment.platform}</span>
                    </div>
                  </div>
                  <div className="ml-10">
                    <div className="bg-[#14263A] text-white rounded-2xl rounded-tl-none px-4 py-2.5 text-sm w-fit">
                      {comment.message}
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-end mt-6">
                <div className="bg-white shadow-sm rounded-2xl rounded-tr-none px-4 py-2.5 text-sm text-[#14263A] font-medium">
                  How are you?
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-800">
            <div className="relative">
              <input
                type="text"
                placeholder="Type your message..."
                className="w-full bg-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-3">
                <Bot className="w-5 h-5 text-gray-400 hover:text-gray-200 cursor-pointer transition-colors" />
                <div className="w-px h-5 bg-gray-600"></div>
                <Send className="w-5 h-5 text-gray-400 hover:text-gray-200 cursor-pointer transition-colors" />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LiveChat;
