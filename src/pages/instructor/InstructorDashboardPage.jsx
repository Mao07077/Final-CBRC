import { useEffect } from "react";
import { Link } from "react-router-dom";
import { FiPlusCircle, FiUsers, FiActivity, FiTrendingUp, FiClock } from "react-icons/fi";
import useInstructorDashboardStore from "../../store/instructor/instructorDashboardStore";
import useAuthStore from "../../store/authStore";
import StatCard from "../../features/instructor/instructorDashboard/components/StatCard";
import AttendanceChart from "../../features/instructor/instructorDashboard/components/AttendanceChart";
import StudyHoursHistogram from "../../features/instructor/instructorDashboard/components/StudyHoursHistogram";
import ModuleCompletionChart from "../../features/instructor/instructorDashboard/components/ModuleCompletionChart";
import InfoTooltip from "../../components/common/InfoTooltip";

const InstructorDashboardPage = () => {
  const { stats, attendanceData, hoursHistogram, moduleCompletions, isLoading, fetchDashboardData } = useInstructorDashboardStore();
  const { userData } = useAuthStore();

  useEffect(() => {
    if (userData?.id_number) {
      fetchDashboardData(userData.id_number, userData.program);
    }
  }, [fetchDashboardData, userData]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800">Instructor Dashboard</h1>
        <InfoTooltip text="Overview of your class: key stats, recent attendance and study activity, plus module completion insights." />
      </div>

  {/* Top Row: Stats */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          isLoading={isLoading}
          color="indigo"
          icon={FiUsers}
        />
        <StatCard
          title="Engagement Rate"
          value={`${stats.engagementRate}%`}
          isLoading={isLoading}
          color="emerald"
          icon={FiActivity}
        />
        <StatCard
          title="Class Avg Accuracy"
          value={`${stats.classAverageAccuracy}%`}
          isLoading={isLoading}
          color="sky"
          icon={FiTrendingUp}
        />
        <StatCard
          title="Avg Study Hours (7d)"
          value={`${stats.avgStudyHours7d}h`}
          isLoading={isLoading}
          color="amber"
          icon={FiClock}
        />
      </div>

      {/* Attendance + Actions (Side by Side) */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 mt-6">
        <div className="xl:col-span-3">
          <AttendanceChart data={attendanceData} isLoading={isLoading} />
        </div>
        <div className="xl:col-span-2 p-6 bg-white rounded-lg shadow-md">
          <div className="mb-3">
            <h2 className="text-lg font-medium text-gray-800">Actions</h2>
          </div>
          <div className="flex flex-col gap-3 w-full mt-2">
            <Link
              to="/instructor/modules"
              className="w-full flex items-center justify-center px-4 py-2 border border-indigo-600 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              aria-label="Manage Module"
            >
              <FiPlusCircle className="mr-2" />
              Manage Modules
            </Link>
            <Link
              to="/instructor/pre-tests"
              className="w-full flex items-center justify-center px-4 py-2 border border-indigo-600 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              aria-label="Create New Post-Test"
            >
              <FiPlusCircle className="mr-2" />
              Create New Post-Test
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 mt-6">
        <div className="xl:col-span-3">
          <ModuleCompletionChart data={moduleCompletions} isLoading={isLoading} />
        </div>
        <div className="xl:col-span-2">
          <StudyHoursHistogram data={hoursHistogram} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboardPage;
