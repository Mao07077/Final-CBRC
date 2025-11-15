import React, { useMemo, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { FaSignOutAlt } from 'react-icons/fa';
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';
import useAuthStore from '../../store/authStore';
import { useChat } from '../../context/ChatProvider';

const Sidebar = ({ navLinks = [], isSidebarOpen, toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const [openDropdowns, setOpenDropdowns] = useState({});
  const { unread } = useChat() || { unread: {} };
  const totalUnread = useMemo(() => {
    if (!unread) return 0;
    try {
      return Object.values(unread).reduce((acc, v) => acc + (v ? 1 : 0), 0);
    } catch {
      return 0;
    }
  }, [unread]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const toggleDropdown = (index) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const isChildActive = (children) => {
    return children.some((child) => location.pathname === child.path);
  };

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`fixed left-0 right-0 top-16 bottom-0 bg-black bg-opacity-50 z-30 md:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={toggleSidebar}
      ></div>
      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-gray-300 text-black flex flex-col z-40 transform transition-transform duration-300 ease-in-out md:relative md:top-0 md:h-full md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Removed brand header (CBRCS) per request; compact nav */}
        <nav className="flex-grow p-2 pt-3">
          <ul>
            {navLinks.map((link, index) => {
              if (link.isDropdown) {
                const isOpen = openDropdowns[index];
                const hasActiveChild = isChildActive(link.children);
                return (
                  <li key={index} className="mb-1">
                    <button
                      onClick={() => toggleDropdown(index)}
                      className={`w-full flex items-center justify-between gap-3 rounded-md p-3 text-sm font-medium transition-colors ${
                        hasActiveChild
                          ? 'bg-gray-400 text-black'
                          : 'text-black hover:bg-gray-200 hover:text-black'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {link.icon && React.cloneElement(link.icon, { color: 'black' })}
                        <span className="relative inline-flex items-center">
                          {link.label}
                          {/* Show badge on parent when dropdown is closed */}
                          {!isOpen && totalUnread > 0 && (
                            <span className="ml-2 inline-flex items-center justify-center text-white text-[10px] bg-red-600 rounded-full min-w-[16px] h-4 px-1">
                              {totalUnread}
                            </span>
                          )}
                        </span>
                      </div>
                      {isOpen ? <FiChevronDown size={16} color="black" /> : <FiChevronRight size={16} color="black" />}
                    </button>
                    {isOpen && (
                      <ul className="ml-4 mt-1 space-y-1">
                        {link.children.map((child, childIndex) => {
                          const isMessages = child.path.endsWith('/messages');
                          return (
                            <li key={childIndex}>
                              <NavLink
                                to={child.path}
                                end
                                className={({ isActive }) =>
                                  `flex items-center justify-between rounded-md p-2 text-sm font-medium transition-colors ${
                                    isActive
                                      ? 'bg-gray-400 text-black'
                                      : 'text-black hover:bg-gray-200 hover:text-black'
                                  }`
                                }
                                onClick={toggleSidebar}
                              >
                                <span className="flex items-center gap-3">
                                  {child.icon && React.cloneElement(child.icon, { color: 'black' })}
                                  <span>{child.label}</span>
                                </span>
                                {/* When dropdown is open, move badge to Messages item */}
                                {isMessages && totalUnread > 0 && (
                                  <span className="ml-2 inline-flex items-center justify-center text-white text-[10px] bg-red-600 rounded-full min-w-[16px] h-4 px-1">
                                    {totalUnread}
                                  </span>
                                )}
                              </NavLink>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              }
              const isMessagesTop = link.path?.endsWith('/messages');
              return (
                <li key={index} className="mb-1">
                  <NavLink
                    to={link.path}
                    end
                    className={({ isActive }) =>
                      `flex items-center justify-between rounded-md p-3 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-gray-400 text-black'
                          : 'text-black hover:bg-gray-200 hover:text-black'
                      }`
                    }
                    onClick={toggleSidebar}
                  >
                    <span className="flex items-center gap-3">
                      {link.icon && React.cloneElement(link.icon, { color: 'black' })}
                      <span>{link.label}</span>
                    </span>
                    {isMessagesTop && totalUnread > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center text-white text-[10px] bg-red-600 rounded-full min-w-[16px] h-4 px-1">
                        {totalUnread}
                      </span>
                    )}
                  </NavLink>
                </li>
              );
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
