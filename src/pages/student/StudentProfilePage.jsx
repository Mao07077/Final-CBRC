import React, { useState, useEffect, useMemo } from "react";
import ProfileUpdateRequestModal from "../../components/ProfileUpdateRequestModal";
import { useNavigate } from "react-router-dom";
import {
  User,
  Camera,
  Calendar,
  BookOpen,
  TrendingUp,
  Edit3,
} from "lucide-react";
import useAuthStore from "../../store/authStore";
import useDashboardStore from "../../store/student/dashboardStore";
import profileService from "../../services/profileService";

const StudentProfilePage = () => {
  const navigate = useNavigate();
  const { userData } = useAuthStore();
  const { studyHours, fetchDashboardData } = useDashboardStore();

  const [profile, setProfile] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  // We now derive Top 3 Study Habits from dashboard recommended pages (normalized)
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const habitDescriptions = {
    "Study with Friends": "Collaborate and learn together with peers",
    "Asking for Help": "Reach out to instructors and get support",
    "Test Yourself Periodically": "Regular self-assessment and practice",
    "Creating a Study Schedule": "Organize your study time effectively",
    "Setting Study Goals": "Define clear learning objectives",
    "Organizing Notes": "Keep your study materials well-structured",
    "Teach What You've Learned": "Share knowledge to reinforce learning",
    "Use of Flashcards": "Active recall and spaced repetition",
    "Using Aromatherapy, Plants, or Music": "Create optimal study environment",
  };

  // Page slug mapping from dashboard recommendedPages -> route & display name
  const pageSlugMap = {
    "learn-together": { name: "Learn Together", route: "/student/learn-together" },
    "instructor-chat": { name: "Instructor Chat", route: "/student/messages" },
    messages: { name: "Instructor Chat", route: "/student/messages" },
    modules: { name: "Modules", route: "/student/modules" },
    scheduler: { name: "Scheduler", route: "/student/scheduler" },
    notes: { name: "Notes", route: "/student/notes" },
    flashcards: { name: "Flashcards", route: "/student/flashcards" },
    flashcard: { name: "Flashcards", route: "/student/flashcards" },
    music: { name: "Study Music", route: "/student/music-player" },
    "music-player": { name: "Study Music", route: "/student/music-player" },
  };

  // Normalize dashboard slugs similar to RecommendedPages component
  const normalizeSlug = (slug) => {
    if (!slug) return slug;
    if (slug === "messages") return "instructor-chat"; // unify
    if (slug === "flashcard") return "flashcards";
    if (slug === "music") return "music-player";
    return slug;
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        if (!userData?.id_number) {
          setError("User not authenticated");
          return;
        }

        // Fetch profile data
        const profileData = await profileService.getProfile(userData.id_number);
        console.log('Full profile object:', profileData);
        setProfile(profileData);
        // Always set profileImage from backend
        setProfileImage(profileData.profileImageUrl || null);

        // Fetch dashboard data (recommended pages + metrics)
        await fetchDashboardData('current');

        // Debug log
        console.log('Fetched profile for:', userData.id_number, 'Image URL:', profileData.profileImageUrl);
      } catch (err) {
        console.error("Profile fetch error:", err);
        setError(err.message || "Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [userData]);

  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (file && userData?.id_number) {
      const formData = new FormData();
      formData.append("profileImage", file);
      try {
        // Use fetch directly for image upload
        const response = await fetch(`https://cbrcs-final.onrender.com/api/profile/${userData.id_number}/image`, {
          method: "PUT",
          body: formData,
        });
        const result = await response.json();
        if (result?.profileImageUrl) {
          // After upload, fetch the latest profile for this student
          const latestProfile = await profileService.getProfile(userData.id_number);
          setProfile(latestProfile);
          setProfileImage(latestProfile.profileImageUrl || null);
              // Debug log and confirmation
              console.log('Profile image uploaded for:', userData.id_number, 'Image URL:', latestProfile.profileImageUrl);
              alert('Profile image uploaded and updated!');
        }
      } catch (err) {
        setError("Failed to upload image");
      }
    }
  };

  // Derive top 3 from dashboard recommendedPages
  const { recommendedPages } = useDashboardStore.getState();
  const top3FromDashboard = useMemo(() => {
    const normalized = (recommendedPages || []).map(normalizeSlug);
    const unique = [];
    for (const slug of normalized) {
      if (slug && !unique.includes(slug)) unique.push(slug);
    }
    return unique.slice(0, 3);
  }, [recommendedPages]);

  const handleHabitClick = (slug) => {
    const key = normalizeSlug(slug);
    const meta = pageSlugMap[key];
    if (meta?.route) navigate(meta.route);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Daily Study Activity chart removed per request

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Account Profile
          </h1>
          <div className="h-1 w-16 bg-primary rounded"></div>
        </div>

        {/* Profile Info Section */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow hover:bg-indigo-700 transition"
            >
              Request Profile Update
            </button>
          </div>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Profile Image */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-32 h-32 bg-gray-200 rounded-full overflow-hidden border-4 border-gray-300">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() =>
                    document.getElementById("profileImageUpload").click()
                  }
                  className="absolute -bottom-2 -right-2 bg-primary hover:bg-primary-dark text-white p-2 rounded-full shadow-lg transition-colors"
                >
                  <Camera className="h-4 w-4" />
                </button>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="profileImageUpload"
                />
              </div>
              <button className="mt-3 flex items-center gap-2 text-primary hover:text-primary-dark text-sm font-medium">
                <Edit3 className="h-4 w-4" />
                Edit Photo
              </button>
            </div>

            {/* Profile Details */}
            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="text-lg font-semibold text-gray-900">
                    {profile?.firstname} {profile?.lastname}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID Number
                  </label>
                  <div className="text-lg font-semibold text-gray-900">
                    {profile?.id_number}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Program
                  </label>
                  <div className="text-lg font-semibold text-gray-900">
                    {profile?.program}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Study Hours
                  </label>
                  <div className="text-lg font-semibold text-gray-900">
                    {typeof studyHours === 'number' ? studyHours : (profile?.hoursActivity || 0)} hours
                  </div>
                </div>
              </div>

              {/* Academic Period removed per request */}
            </div>
          </div>
        </div>

        {/* Top 3 Study Habits Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-gray-900">
              Your Top 3 Study Habits
            </h2>
          </div>

          {top3FromDashboard.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {top3FromDashboard.map((slug, index) => {
                const display = pageSlugMap[slug]?.name || slug;
                return (
                <div
                  key={slug}
                  onClick={() => handleHabitClick(slug)}
                  className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transform hover:scale-105 transition-all duration-200 border-l-4 border-primary"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="bg-primary-light p-2 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-xs font-semibold text-primary bg-primary-light px-2 py-1 rounded-full">
                      #{index + 1}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm">
                    {display}
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {habitDescriptions[display] || `Explore ${display} to enhance your learning.`}
                  </p>
                </div>
              );})}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">
                Complete the survey to discover your top study habits
              </p>
            </div>
          )}
        </div>

        {/* Daily Study Activity section removed */}
  </div>
  {/* Profile Update Request Modal */}
  <ProfileUpdateRequestModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

export default StudentProfilePage;
