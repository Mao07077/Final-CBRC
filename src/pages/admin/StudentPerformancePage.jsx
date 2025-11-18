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
      {/* Top-right actions (visible only when no student is selected to avoid overlap) */}
      {!selectedStudent && null}
      {/* On small screens, show only one panel at a time */}
      <div className={`w-full md:w-1/3 md:block ${selectedStudent ? 'hidden' : 'block'} h-full overflow-hidden`}>
        <StudentListPanel onOpenArchived={() => setArchivedOpen(true)} />
      </div>

      <div className={`w-full md:w-2/3 md:block ${selectedStudent ? 'block' : 'hidden'} h-full overflow-hidden`}> 
        {error && <p className="p-4 text-red-500 bg-red-100 rounded-md m-4">{error}</p>}
        <PerformanceDetailView onOpenArchived={() => setArchivedOpen(true)} />
      </div>
      <ArchivedPerformanceModal open={archivedOpen} onClose={() => setArchivedOpen(false)} />
    </div>
  );
};

export default StudentPerformancePage;
