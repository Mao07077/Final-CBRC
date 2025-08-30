import React, { useEffect } from "react";
import { useLocation, Link as RouterLink } from "react-router-dom";
import { Element, scroller } from 'react-scroll';
import apiClient from "../api/axiosClient";
import { FiBookOpen, FiEdit, FiUsers, FiTrendingUp, FiAward, FiMessageCircle } from 'react-icons/fi';
import HeroBg from '../assets/images/hero_landing_page_bg.jpg';
import useLandingStore from "../store/landingStore";

const HomePage = () => {
  const landingPageData = useLandingStore((state) => state.pageData);
  const isLoading = useLandingStore((state) => state.isLoading);
  const location = useLocation();

  useEffect(() => {
    // Call fetchPageData directly from the store without adding it to dependencies
    useLandingStore.getState().fetchPageData();
  }, []); // Empty dependency array - only run once on mount

  useEffect(() => {
    if (location.state?.scrollTo) {
      scroller.scrollTo(location.state.scrollTo, {
        spy: true,
        smooth: true,
        offset: -80,
        duration: 500,
      });
    }
  }, [location]);

        const [adminPosts, setAdminPosts] = useState([]);
        const [postsLoading, setPostsLoading] = useState(true);
  if (isLoading || !landingPageData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl font-semibold">Loading...</div>
      </div>
    );
        useEffect(() => {
          async function fetchPosts() {
            try {
              const res = await apiClient.get("/api/admin/posts");
              setAdminPosts(res.data);
            } catch (err) {
              setAdminPosts([]);
            } finally {
              setPostsLoading(false);
            }
          }
          fetchPosts();
        }, []);

  }

  const { intro, about, news, featuredCourses, posts } = landingPageData;

  const features = [
    { icon: <FiBookOpen className="h-10 w-10 text-primary" />, title: "Interactive Modules", description: "Engage with comprehensive lessons designed for deep understanding." },
    { icon: <FiEdit className="h-10 w-10 text-primary" />, title: "Personalized Notes", description: "Create, organize, and review your notes effortlessly." },
    { icon: <FiUsers className="h-10 w-10 text-primary" />, title: "Collaborative Learning", description: "Connect with peers and instructors in a dedicated chat environment." },
    { icon: <FiTrendingUp className="h-10 w-10 text-primary" />, title: "Performance Tracking", description: "Monitor your progress with detailed analytics and reports." },
    { icon: <FiAward className="h-10 w-10 text-primary" />, title: "Post-Test Mastery", description: "Assess your knowledge with targeted post-tests and feedback." },
    { icon: <FiMessageCircle className="h-10 w-10 text-primary" />, title: "Community Forum", description: "Ask questions, share insights, and learn together with the community." },
  ];

  return (
    <div className="bg-white text-gray-800">
      {/* Hero Section */}
      <Element name="home" className="element">
        <section 
          className="relative text-center bg-cover bg-center min-h-screen flex items-center justify-center"
          style={{ backgroundImage: `url(${HeroBg})` }}
        >
          <div className="absolute inset-0 bg-primary-dark opacity-70"></div>
          <div className="relative container mx-auto px-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
              {intro.header}
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-primary-light">
              {intro.subHeader}
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <RouterLink
                to="/signup"
                className="inline-block py-3 px-8 bg-accent-medium text-white font-bold rounded-lg shadow-lg hover:bg-accent-dark transition-transform transform hover:scale-105"
              >
                Get Started
              </RouterLink>
              <RouterLink
                to="/login"
                className="inline-block py-3 px-8 bg-transparent text-white border-2 border-white font-bold rounded-lg shadow-lg hover:bg-white hover:text-primary-dark transition-all transform hover:scale-105"
              >
                Log In
              </RouterLink>
            </div>
          </div>
        </section>
      </Element>

      {/* Features Section */}
      <Element name="features" className="py-20 sm:py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Why Choose CBRCS?</h2>
            <p className="mt-4 text-lg text-gray-600">Everything you need to ace your exams, all in one place.</p>
          </div>
            {/* Admin News/Posts Section */}
            <section className="container mx-auto px-6 py-12">
              <h2 className="text-2xl font-bold mb-6">Latest News & Announcements</h2>
              {postsLoading ? (
                <div className="text-gray-500">Loading posts...</div>
              ) : adminPosts.length === 0 ? (
                <div className="text-gray-500">No posts available.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {adminPosts.map((post) => (
                    <div key={post._id} className="bg-white rounded-lg shadow-md p-4 border">
                      {post.image && (
                        <img src={post.image} alt={post.title} className="w-full h-40 object-cover rounded mb-3" />
                      )}
                      <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
                      <p className="text-gray-700 mb-2">{post.content}</p>
                      <div className="text-xs text-gray-500">{post.createdAt ? new Date(post.createdAt).toLocaleString() : "No date"}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-8 bg-gray-50 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                <div className="flex justify-center items-center mb-4 bg-primary-light w-20 h-20 rounded-full mx-auto">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </Element>

      {/* About Section */}
      <Element name="about" className="bg-primary-dark text-white py-20 sm:py-24">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">{about.header}</h2>
          <p className="max-w-3xl mx-auto text-lg text-primary-light">
            {about.content}
          </p>
        </div>
      </Element>

      {/* Featured Courses Section */}
      <Element name="courses" className="py-20 sm:py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Featured Courses</h2>
            <p className="mt-4 text-lg text-gray-600">Explore our most popular review programs.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {featuredCourses.map((course, index) => (
              <div key={index} className="bg-gray-50 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-300 overflow-hidden">
                <img src={course.image} alt={course.title} className="w-full h-48 object-cover"/>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 text-gray-900">{course.title}</h3>
                  <span className="inline-block bg-accent-light text-accent-dark text-xs font-semibold px-2 py-1 rounded-full">
                    {course.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Element>

      {/* News Section */}
      <Element name="news" className="py-20 sm:py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">{news.header}</h2>
            <p className="mt-4 text-lg text-gray-600">{news.title}</p>
          </div>
          <div className="text-center text-gray-500">
            <p className="italic">{news.content}</p>
          </div>
          {news.newsImage && (
            <div className="flex justify-center mt-6">
              <img src={news.newsImage} alt="News" className="max-w-md rounded-lg shadow" />
            </div>
          )}
        </div>
      </Element>

      {/* Posts Section */}
      {posts && posts.length > 0 && (
        <Element name="posts" className="py-20 sm:py-24 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Latest Announcements</h2>
              <p className="mt-4 text-lg text-gray-600">Stay updated with the latest posts from the admin team.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {posts.map((post, idx) => (
                <div key={post._id || idx} className="bg-gray-50 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-300 overflow-hidden">
                  {post.image && (
                    <img src={post.image} alt={post.title} className="w-full h-48 object-cover" />
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2 text-gray-900">{post.title}</h3>
                    <p className="text-gray-600 mb-2">{post.content}</p>
                    <span className="inline-block bg-accent-light text-accent-dark text-xs font-semibold px-2 py-1 rounded-full">
                      {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Element>
      )}
    </div>
  );
}

export default HomePage;