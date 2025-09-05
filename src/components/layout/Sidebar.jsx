import React from "react";
import { NavLink } from "react-router-dom";
import { FaSignOutAlt } from "react-icons/fa";

// Make sure to define or import navLinks, toggleSidebar, and handleLogout above

const Sidebar = ({ navLinks, toggleSidebar, handleLogout }) => {
  return (
    <>
      <aside>
        <nav>
          <ul>
            {navLinks.map((link, index) => {
              if (link.children && link.children.length > 0) {
                // Dropdown navigation item (not shown in your snippet)
                return (
                  <li key={index}>
                    {/* Dropdown logic here */}
                  </li>
                );
              } else {
                // Regular navigation item
                return (
                  <li key={index} className="mb-1">
                    {link.external ? (
                      <a
                        href={link.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-md p-3 text-sm font-medium transition-colors text-gray-300 hover:bg-gray-700 hover:text-white"
                        onClick={toggleSidebar}
                      >
                        {link.icon}
                        <span>{link.label}</span>
                      </a>
                    ) : (
                      <NavLink
                        to={link.path}
                        end
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-md p-3 text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-indigo-600 text-white'
                              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                          }`
                        }
                        onClick={toggleSidebar}
                      >
                        {link.icon}
                        <span>{link.label}</span>
                      </NavLink>
                    )}
                  </li>
                );
              }
            })}
          </ul>
        </nav>
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 rounded-md p-3 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
          >
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
