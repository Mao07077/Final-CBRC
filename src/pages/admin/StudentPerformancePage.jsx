import { useEffect, useState } from "react";
import useStudentPerformanceStore from "../../store/admin/studentPerformanceStore";
import StudentListPanel from "../../features/admin/adminStudentPerformance/components/StudentListPanel";
import PerformanceDetailView from "../../features/admin/adminStudentPerformance/components/PerformanceDetailView";
import ArchivedPerformanceModal from "../../features/admin/adminStudentPerformance/components/ArchivedPerformanceModal";

const StudentPerformancePage = () => {
  const { fetchStudents, error, selectedStudent } = useStudentPerformanceStore();
  const [archivedOpen, setArchivedOpen] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  return (
    // Use full viewport height so child panels can manage their own scrolling
    <div className="flex h-screen bg-gray-50 relative">
      {/* Top-right actions */}
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={() => setArchivedOpen(true)}
          className="px-3 py-1.5 rounded border text-sm bg-white hover:bg-gray-50"
        >
          Archived Performance
        </button>
      </div>
      {/* On small screens, show only one panel at a time */}
      <div className={`w-full md:w-1/3 md:block ${selectedStudent ? 'hidden' : 'block'} h-full overflow-hidden`}>
        <StudentListPanel />
      </div>

      <div className={`w-full md:w-2/3 md:block ${selectedStudent ? 'block' : 'hidden'} h-full overflow-hidden`}> 
        {error && <p className="p-4 text-red-500 bg-red-100 rounded-md m-4">{error}</p>}
        <PerformanceDetailView />
      </div>
      <ArchivedPerformanceModal open={archivedOpen} onClose={() => setArchivedOpen(false)} />
    </div>
  );
};

export default StudentPerformancePage;
