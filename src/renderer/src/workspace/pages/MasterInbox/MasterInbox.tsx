// @ts-nocheck
import React from 'react';


const MasterInbox = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br ">
      <div className="text-center p-8 rounded-lg animate-fadeIn">
        {/* Icon */}
        <div className="flex items-center justify-center mb-4">
          <div className="h-16 w-16 bg-blue-500 text-white rounded-full flex items-center justify-center animate-bounce">

          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Master Inbox Coming Soon!
        </h1>

        {/* Subheading */}
        <p className="text-gray-600 text-lg mb-6">
          We're working hard to bring this feature to you. Stay tuned for something amazing! 🚀
        </p>

        {/* Progress Bar */}
        <div className="relative w-full h-2 bg-gray-300 rounded-full overflow-hidden">
          <div className="absolute h-full w-3/5 bg-blue-500 rounded-full animate-progressBar"></div>
        </div>
      </div>
    </div>
  );
};

export default MasterInbox;
