import React, { useState } from 'react';import { NavLink, useNavigate, useLocation } from 'react-router-dom';import { FaSignOutAlt } from 'react-icons/fa';import { FiChevronDown, FiChevronRight } from 'react-icons/fi';import useAuthStore from '../../store/authStore';const Sidebar = ({ navLinks = [], isSidebarOpen, toggleSidebar }) => {  const navigate = useNavigate();  const location = useLocation();  const logout = useAuthStore((state) => state.logout);  const [openDropdowns, setOpenDropdowns] = useState({});  const handleLogout = () => {    logout();    navigate('/login', { replace: true });  };  const toggleDropdown = (index) => {    setOpenDropdowns(prev => ({      ...prev,      [index]: !prev[index]    }));  };  const isChildActive = (children) => {    return children.some(child => location.pathname === child.path);  };  return (    <>      {/* Overlay for mobile */}      <div        className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}        onClick={toggleSidebar}      ></div>      <aside        className={`fixed top-0 left-0 h-full w-64 bg-gray-300 text-black flex flex-col z-40 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'        }`}      >        <div className="h-16 flex items-center justify-center p-4 border-b border-gray-400">          <h1 className="text-2xl font-bold text-black">CBRCS</h1>        </div>        <nav className="flex-grow p-2">          <ul>            {navLinks.map((link, index) => {              if (link.isDropdown) {                const isOpen = openDropdowns[index];                const hasActiveChild = isChildActive(link.children);                return (                  <li key={index} className="mb-1">                    {/* Dropdown Header */}                    <button                      onClick={() => toggleDropdown(index)}                      className={`w-full flex items-center justify-between gap-3 rounded-md p-3 text-sm font-medium transition-colors ${                        hasActiveChild                          ? 'bg-gray-400 text-black'                          : 'text-black hover:bg-gray-200 hover:text-black'                      }`}                    >                      <div className="flex items-center gap-3">                        {link.icon && React.cloneElement(link.icon, { color: 'black' })}                        <span>{link.label}</span>                      </div>                      {isOpen ? <FiChevronDown size={16} color="black" /> : <FiChevronRight size={16} color="black" />}                    </button>                                        {/* Dropdown Content */}                    {isOpen && (                      <ul className="ml-4 mt-1 space-y-1">                        {link.children.map((child, childIndex) => (                          <li key={childIndex}>                            {child.path === "/student/music-player" ? (                              <a                                href={child.path}                                target="_blank"                                rel="noopener noreferrer"                                className="flex items-center gap-3 rounded-md p-2 text-sm font-medium transition-colors text-black hover:bg-gray-200 hover:text-black"                                onClick={toggleSidebar}                              >                                {child.icon && React.cloneElement(child.icon, { color: 'black' })}                                <span>{child.label}</span>                              </a>                            ) : (                              <NavLink                                to={child.path}                                end                                className={({ isActive }) =>                                  `flex items-center gap-3 rounded-md p-2 text-sm font-medium transition-colors ${                                    isActive                                      ? 'bg-gray-400 text-black'                                      : 'text-black hover:bg-gray-200 hover:text-black'                                  }`                                }                                onClick={toggleSidebar}                              >                                {child.icon && React.cloneElement(child.icon, { color: 'black' })}                                <span>{child.label}</span>                              </NavLink>                            )}                          </li>                        ))}                      </ul>
                    )}
                  </li>
                );
              } else {
                // Regular navigation item
                return (
                  <li key={index} className="mb-1">
                    <NavLink
                      to={link.path}
                      end
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-md p-3 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-gray-400 text-black'
                            : 'text-black hover:bg-gray-200 hover:text-black'
                        }`
                      }
                      onClick={toggleSidebar}
                    >
                      {link.icon && React.cloneElement(link.icon, { color: 'black' })}
                      <span>{link.label}</span>
                    </NavLink>
                  </li>
                );
              }
            })}
          </ul>
        </nav>
        <div className="p-4 border-t border-gray-400">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 rounded-md p-3 text-sm font-medium text-black hover:bg-gray-200 hover:text-black transition-colors"
          >
            <FaSignOutAlt color="black" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
