import { useEffect } from "react";
import { Link } from "react-router-dom";
import { FiPlusCircle } from "react-icons/fi";
import useInstructorDashboardStore from "../../store/instructor/instructorDashboardStore";
import StatCard from "../../features/instructor/instructorDashboard/components/StatCard";
import AttendanceChart from "../../features/instructor/instructorDashboard/components/AttendanceChart";
import ModuleList from "../../features/instructor/instructorDashboard/components/ModuleList";

const InstructorDashboardPage = () => {
  const { stats, modules, attendanceData, isLoading, fetchDashboardData } =
    useInstructorDashboardStore();

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">
        Instructor Dashboard
      </h1>

      {/* Top Row: Stats & Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          isLoading={isLoading}
        />
        <StatCard
          title="Engagement Rate"
          value={`${stats.engagementRate}%`}
          isLoading={isLoading}
        />
        <div className="md:col-span-2 lg:col-span-1 flex flex-col justify-center p-4 bg-white rounded-lg shadow-md">
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <Link
              to="/instructor/modules"
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FiPlusCircle className="mr-2" />
              Create Module
            </Link>
            <Link
              to="/instructor/post-tests"
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FiPlusCircle className="mr-2" />
              Create Post-Test
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Row: Charts & Lists */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3">
          <AttendanceChart data={attendanceData} isLoading={isLoading} />
        </div>
        <div className="xl:col-span-2">
          <ModuleList modules={modules} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboardPage;
