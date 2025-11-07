import React, { useState, useEffect } from "react";
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import useAuthStore from "../../store/authStore";
import profileService from "../../services/profileService";

const StudentProfilePage = () => {
  const navigate = useNavigate();
  const { userData } = useAuthStore();

  const [profile, setProfile] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [dailyData, setDailyData] = useState([]);
  const [top3Habits, setTop3Habits] = useState([]);
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

  const habitNavigationMap = {
    "Study with Friends": "/student/learn-together",
    "Asking for Help": "/student/chat",
    "Test Yourself Periodically": "/student/modules",
    "Creating a Study Schedule": "/student/scheduler",
    "Setting Study Goals": "/student/notes",
    "Organizing Notes": "/student/notes",
    "Teach What You've Learned": "/student/learn-together",
    "Use of Flashcards": "/student/flashcards",
    "Using Aromatherapy, Plants, or Music": "/student/music",
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

        // Fetch top 3 study habits
        const habitsData = await profileService.getRecommendedPages(
          userData.id_number
        );
        setTop3Habits(habitsData.recommendedPages || []);

        // Fetch daily activity data from backend
        if (Array.isArray(profileData?.dailyActivity) && profileData.dailyActivity.length > 0) {
          // Normalize missing numeric fields to 0 to avoid tooltip undefined
          const normalized = profileData.dailyActivity.map(d => ({
            day: d.day,
            hours: typeof d.hours === 'number' ? d.hours : 0,
            modules: Array.isArray(d.modules) ? d.modules : [],
            flashcardsGenerated: typeof d.flashcardsGenerated === 'number' ? d.flashcardsGenerated : 0,
            sessionHours: typeof d.sessionHours === 'number' ? d.sessionHours : 0
          }));
          setDailyData(normalized);
        } else {
          // Provide 7-day placeholders when backend returns empty to surface chart structure
          const today = new Date();
          const placeholders = Array.from({ length: 7 }).map((_, idx) => {
            const d = new Date(today.getTime() - (6 - idx) * 86400000);
            const iso = d.toISOString().split('T')[0];
            return { day: iso, hours: 0, modules: [], flashcardsGenerated: 0, sessionHours: 0 };
          });
          setDailyData(placeholders);
        }
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

  const handleHabitClick = (habit) => {
    const route = habitNavigationMap[habit];
    if (route) {
      navigate(route);
    }
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

  // Custom tooltip (outside of JSX tree)
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = (payload[0] && payload[0].payload) ? payload[0].payload : {};
      const mods = Array.isArray(data.modules) ? data.modules : [];
      return (
        <div className="p-3 rounded-lg bg-gray-800 text-gray-50 text-sm">
          <div className="font-semibold mb-1">{label}</div>
          <div>
            Study Hours: <span className="font-semibold">{(data.hours ?? 0)}h</span>
          </div>
          <div>
            Learn Together: <span className="font-semibold">{(data.sessionHours ?? 0)}h</span>
          </div>
          <div>
            Flashcards Generated: <span className="font-semibold">{(data.flashcardsGenerated ?? 0)}</span>
          </div>
          <div className="mt-1">Modules:</div>
          {mods.length > 0 ? (
            <ul className="list-disc list-inside text-xs text-gray-200">
              {mods.slice(0, 4).map((m, i) => (
                <li key={i}>{m}</li>
              ))}
              {mods.length > 4 && <li>+{mods.length - 4} more…</li>}
            </ul>
          ) : (
            <div className="text-xs text-gray-300">No modules taken</div>
          )}
        </div>
      );
    }
    return null;
  };

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
                    {profile?.hoursActivity || 0} hours
                  </div>
                </div>
              </div>

              {/* Academic Period */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Academic Period
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  September 20, 2024 - March 12, 2025
                </p>
              </div>
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

          {top3Habits.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {top3Habits.slice(0, 3).map((habit, index) => (
                <div
                  key={index}
                  onClick={() => handleHabitClick(habit)}
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
                    {habit}
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {habitDescriptions[habit] || `Learn more about ${habit}`}
                  </p>
                </div>
              ))}
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

        {/* Daily Activity Chart */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-gray-900">
              Daily Study Activity
            </h2>
          </div>

          {/* Custom tooltip component (declared outside JSX) */}

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dailyData && dailyData.length > 0 ? dailyData : [
                  { day: 'No Data', hours: 0, modules: [], flashcardsGenerated: 0, sessionHours: 0 }
                ]}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="day"
                  stroke="#6b7280"
                  fontSize={12}
                  fontFamily="Inter, system-ui, sans-serif"
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={12}
                  fontFamily="Inter, system-ui, sans-serif"
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="hours"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  name="Study Hours"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Stats already shown above, remove duplicate */}
          </div>
        </div>
  </div>
  {/* Profile Update Request Modal */}
  <ProfileUpdateRequestModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

export default StudentProfilePage;
