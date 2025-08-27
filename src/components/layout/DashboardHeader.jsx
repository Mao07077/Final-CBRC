import React from 'react';
import { FiMenu, FiX } from 'react-icons/fi';

const DashboardHeader = ({ isSidebarOpen, toggleSidebar }) => {
  return (
    <header className="md:hidden bg-white shadow-sm z-20 sticky top-0">
      <div className="flex items-center justify-between px-4 h-16">
        <h1 className="text-xl font-bold text-gray-800">CBRCS</h1>
        <button onClick={toggleSidebar} className="p-2 rounded-md text-gray-500 hover:bg-gray-100">
          {isSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>
    </header>
  );
};

export default DashboardHeader;
