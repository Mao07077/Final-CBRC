/* Layouts */
import DashboardLayout from "../../components/layout/DashboardLayout";

/* Icons */
import {
  FiHome,
  FiBook,
  FiClipboard,
  FiCalendar,
  FiUsers,
  FiMessageSquare,
  FiMusic,
  FiAlertTriangle,
  FiBarChart2,
  FiFileText,
  FiUserCheck,
  FiBell,
  FiChevronDown,
  FiChevronRight,
  FiUser,
} from "react-icons/fi";

/* Public Routes */
import HomePage from "../../pages/HomePage";
import LoginPage from "../../pages/authentication/LoginPage";
import SignupPage from "../../pages/authentication/SignupPage";
import ForgotPasswordPage from "../../pages/authentication/ForgotPasswordPage";
import ResetPasswordPage from "../../pages/authentication/ResetPasswordPage";

/* Student Routes */
import DashboardPage from "../../pages/student/StudentDashboardPage";
import SurveyPage from "../../pages/student/SurveyPage";
import ModulePage from "../../pages/student/ModulePage";
import ModuleContentPage from "../../pages/student/ModuleContentPage";
import PreTestPage from "../../pages/student/PreTestPage";
import PreTestResultsPage from "../../pages/student/PreTestResultsPage";
import PostTestPage from "../../pages/student/PostTestPage";
import PostTestResultsPage from "../../pages/student/PostTestResultsPage";
import NotesPage from "../../pages/student/NotesPage";
import SchedulerPage from "../../pages/student/SchedulerPage";
import FlashcardsPage from "../../pages/student/FlashcardPage";
import FlashcardLandingPage from "../../pages/student/FlashcardLandingPage";
import LearnTogetherPage from "../../pages/student/LearnTogetherPage";
import StudySessionPage from "../../pages/student/StudySessionPage";
import StudentChatPage from "../../pages/student/studentChatPage";
import StudyMusicPlayerPage from "../../pages/student/StudyMusicPlayerPage";
import StudentProfilePage from "../../pages/student/StudentProfilePage";
import StudentDataPrintingPage from "../../pages/student/StudentDataPrintingPage";
import SendReportPage from "../../pages/student/SendReportPage";

/* Instructor Routes */
import InstructorDashboardPage from "../../pages/instructor/InstructorDashboardPage";
import ModuleManagementPage from "../../pages/instructor/ModuleManagementPage";
import PostTestManagementPage from "../../pages/instructor/PostTestManagementPage";
import StudentListPage from "../../pages/instructor/StudentListPage";
import InstructorChatPage from "../../pages/instructor/InstructorChatPage";

/* Admin Routes */
import AdminDashboardPage from "../../pages/admin/AdminDashboardPage";
import AccountsManagementPage from "../../pages/admin/AccountsManagementPage";
import PostManagementPage from "../../pages/admin/PostManagementPage";
import ReportsPage from "../../pages/admin/ReportsPage";
import AccountsUpdateRequestsPage from "../../pages/admin/AccountUpdateRequestsPage";
import StudentPerformancePage from "../../pages/admin/StudentPerformancePage";

const studentNavLinks = [
  { path: "/student/dashboard", label: "Dashboard", icon: <FiHome /> },
  {
    label: "Study Habits",
    icon: <FiBook />,
    isDropdown: true,
    children: [
      { path: "/student/modules", label: "Modules", icon: <FiBook /> },
      {
        path: "/student/music-player",
        label: "Study Music",
        icon: <FiMusic />,
      },
      {
        path: "/student/learn-together",
        label: "Learn Together",
        icon: <FiUsers />,
      },
      { path: "/student/scheduler", label: "Scheduler", icon: <FiCalendar /> },
      { path: "/student/notes", label: "Notes", icon: <FiFileText /> },
      {
        path: "/student/flashcards",
        label: "Flashcards",
        icon: <FiUserCheck />,
      },
      {
        path: "/student/messages",
        label: "Messages",
        icon: <FiMessageSquare />,
      },
    ],
  },
  {
    path: "/student/send-report",
    label: "Send Report",
    icon: <FiAlertTriangle />,
  },
  {
    path: "/student/data-reports",
    label: "My Reports",
    icon: <FiFileText />,
  },
  {
    path: "/student/profile",
    label: "Profile",
    icon: <FiUser />,
  },
];

const instructorNavLinks = [
  { path: "/instructor/dashboard", label: "Dashboard", icon: <FiHome /> },
  { path: "/instructor/modules", label: "Module Management", icon: <FiBook /> },
  {
    path: "/instructor/post-tests",
    label: "Post-Tests",
    icon: <FiClipboard />,
  },
  { path: "/instructor/students", label: "Student List", icon: <FiUsers /> },
  {
    path: "/instructor/messages",
    label: "Messages",
    icon: <FiMessageSquare />,
  },
];

const adminNavLinks = [
  { path: "/admin/dashboard", label: "Dashboard", icon: <FiHome /> },
  { path: "/admin/accounts", label: "Accounts", icon: <FiUsers /> },
  { path: "/admin/posts", label: "Posts", icon: <FiFileText /> },
  { path: "/admin/reports", label: "Reports", icon: <FiAlertTriangle /> },
  {
    path: "/admin/update-requests",
    label: "Update Requests",
    icon: <FiBell />,
  },
  {
    path: "/admin/student-performance",
    label: "Performance",
    icon: <FiBarChart2 />,
  },
];

export const routesConfig = [
  // Public routes
  { path: "/", element: <HomePage />, isPublic: true },
  { path: "/login", element: <LoginPage />, isPublic: true },
  { path: "/signup", element: <SignupPage />, isPublic: true },
  { path: "/forgot-password", element: <ForgotPasswordPage />, isPublic: true },
  { path: "/reset-password", element: <ResetPasswordPage />, isPublic: true },
  { path: "/survey", element: <SurveyPage />, isPublic: true },
  {
    path: "/pre-test/:moduleId",
    element: <PreTestPage />,
    allowedRoles: ["student"],
  },
  {
    path: "/pre-test-results",
    element: <PreTestResultsPage />,
    allowedRoles: ["student"],
  },
  {
    path: "/post-test/:moduleId",
    element: <PostTestPage />,
    allowedRoles: ["student"],
  },
  {
    path: "/post-test-results",
    element: <PostTestResultsPage />,
    allowedRoles: ["student"],
  },
  {
    path: "/module/:moduleId",
    element: <ModuleContentPage />,
    allowedRoles: ["student"],
  },

  /* Student Routes */
  {
    path: "/student",
    element: <DashboardLayout navLinks={studentNavLinks} />,
    allowedRoles: ["student"],
    isDashboard: true,
    children: [
      { path: "dashboard", element: <DashboardPage /> },
      { path: "modules", element: <ModulePage /> },
      { path: "notes", element: <NotesPage /> },
      { path: "scheduler", element: <SchedulerPage /> },
      { path: "flashcards", element: <FlashcardLandingPage /> },
      { path: "flashcards/practice", element: <FlashcardsPage /> },
      { path: "learn-together", element: <LearnTogetherPage /> },
      { path: "study-session/:groupId", element: <StudySessionPage /> },
      { path: "messages", element: <StudentChatPage /> },
      { path: "music-player", element: <StudyMusicPlayerPage /> },
      { path: "send-report", element: <SendReportPage /> },
      { path: "data-reports", element: <StudentDataPrintingPage /> },
      { path: "profile", element: <StudentProfilePage /> },
    ],
  },

  /* Instructor Routes */
  {
    path: "/instructor",
    element: <DashboardLayout navLinks={instructorNavLinks} />,
    allowedRoles: ["instructor"],
    isDashboard: true,
    children: [
      { path: "dashboard", element: <InstructorDashboardPage /> },
      { path: "modules", element: <ModuleManagementPage /> },
      { path: "post-tests", element: <PostTestManagementPage /> },
      { path: "students", element: <StudentListPage /> },
      { path: "messages", element: <InstructorChatPage /> },
    ],
  },

  /* Admin Routes */
  {
    path: "/admin",
    element: <DashboardLayout navLinks={adminNavLinks} />,
    allowedRoles: ["admin"],
    isDashboard: true,
    children: [
      { path: "dashboard", element: <AdminDashboardPage /> },
      { path: "accounts", element: <AccountsManagementPage /> },
      { path: "posts", element: <PostManagementPage /> },
      { path: "reports", element: <ReportsPage /> },
      { path: "update-requests", element: <AccountsUpdateRequestsPage /> },
      { path: "student-performance", element: <StudentPerformancePage /> },
    ],
  },
];
