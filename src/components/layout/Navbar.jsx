import React, { useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { Link as ScrollLink } from 'react-scroll';
import useAuthStore from '../../store/authStore';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const navLinks = [
    { to: 'courses', label: 'Courses' },
    { to: 'about', label: 'About' },
    { to: 'news', label: 'News' },
  ];

  const scrollProps = {
    spy: true,
    smooth: true,
    offset: -80,
    duration: 500,
  };

  const linkClassName = "text-gray-600 hover:text-accent-medium transition duration-300 cursor-pointer";
  const mobileLinkClassName = "block py-2 px-4 text-sm text-gray-600 hover:bg-gray-100 cursor-pointer";

  const renderNavLinks = (isMobile = false) => {
    const className = isMobile ? mobileLinkClassName : linkClassName;
    return navLinks.map(link => (
      isHomePage ? (
        <ScrollLink key={link.to} to={link.to} {...scrollProps} className={className} onClick={() => isMobile && setIsMenuOpen(false)}>
          {link.label}
        </ScrollLink>
      ) : (
        <RouterLink key={link.to} to={`/`} className={className} onClick={() => isMobile && setIsMenuOpen(false)}>
          {link.label}
        </RouterLink>
      )
    ));
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-6 py-3">
        <div className="flex justify-between items-center">
          <RouterLink to="/" className="flex items-center space-x-2">
            <img src="/cbrc_logo.png" alt="CBRCS Logo" className="h-10 w-10" />
            <span className="text-xl font-bold text-primary-dark">CBRCS</span>
          </RouterLink>

          {!isAuthenticated && (
            <>
              {/* Desktop Menu */}
              <div className="hidden md:flex items-center space-x-6">
                {renderNavLinks()}
                <RouterLink to="/login" className="py-2 px-5 bg-primary-dark text-white rounded-full hover:bg-accent-medium transition duration-300">Login</RouterLink>
              </div>

              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-600 focus:outline-none">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"} />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && !isAuthenticated && (
          <div className="md:hidden mt-4">
            {renderNavLinks(true)}
            <RouterLink to="/login" className="block mt-2 py-2 px-4 text-sm bg-primary-dark text-white rounded-full text-center hover:bg-accent-medium" onClick={() => setIsMenuOpen(false)}>Login</RouterLink>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
