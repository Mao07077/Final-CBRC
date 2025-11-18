import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAdminDashboardStore from "../../store/admin/adminDashboardStore";
import InfoTooltip from "../../components/common/InfoTooltip";
import StatCard from "../../features/admin/adminDashboard/components/StatCard";
import AttendanceStats from "../../features/admin/adminDashboard/components/AttendanceStats";
import PerformanceGraph from "../../features/admin/adminDashboard/components/PerformanceGraph";
import TopModulesChart from "../../features/admin/adminDashboard/components/TopModulesChart";
import ScoreDistribution from "../../features/admin/adminDashboard/components/ScoreDistribution";
import StudentPerformanceList from "../../features/admin/adminStudentPerformance/components/StudentPerformanceList";
import UserList from "../../features/admin/adminDashboard/components/UserList";

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { stats, students, instructors, isLoading, error, fetchDashboardData } =
    useAdminDashboardStore();

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div className="flex items-center gap-2 self-start">
          <h1 className="text-2xl md:text-3xl font-bold text-primary-dark">Admin Dashboard</h1>
          <InfoTooltip text="Platform-wide overview: user counts, attendance and performance summaries, top modules, and score distribution." />
        </div>
        <button
          onClick={() => navigate("/admin/posts")}
          className="w-full md:w-auto px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition-colors duration-300"
        >
          Manage Posts
        </button>
      </div>

      {error && (
        <p className="text-red-500 bg-red-100 p-3 rounded-lg mb-4">{error}</p>
      )}

      {/* Statistics Section (Colorful) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard title="Total Students" value={stats.totalStudents} isLoading={isLoading} color="indigo" />
        <StatCard title="Total Instructors" value={stats.totalInstructors} isLoading={isLoading} color="emerald" />
        {stats.totalAdmins !== undefined && (
          <StatCard title="Total Admins" value={stats.totalAdmins} isLoading={isLoading} color="sky" />
        )}
        {stats.reportsThisWeek !== undefined && (
          <StatCard title="Reports This Week" value={stats.reportsThisWeek} isLoading={isLoading} color="amber" />
        )}
      </div>

  {/* Attendance & Performance Row */}
  <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 mb-6">
    <div className="xl:col-span-3">
      <AttendanceStats />
    </div>
    <div className="xl:col-span-2">
      <PerformanceGraph />
    </div>
  </div>

  {/* Monitoring Charts */}
  <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 mb-10">
    <div className="xl:col-span-3">
      <TopModulesChart />
    </div>
    <div className="xl:col-span-2">
      <ScoreDistribution />
    </div>
  </div>

  {/* Student Performance List with PDF Download */}
  {stats && stats.students && (
    <StudentPerformanceList students={stats.students} />
  )}
    </div>
  );
};

export default AdminDashboardPage;
