import React, { useState, useEffect } from "react";
import useStudentStore from "../../../../store/instructor/studentStore";
import apiClient from "../../../../api/axiosClient";

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="card max-w-lg w-full">
        {children}
      </div>
    </div>
  );
};

const StudentDashboardModal = () => {
  const { isModalOpen, selectedStudent, closeStudentModal } = useStudentStore();
  const [studentStats, setStudentStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isModalOpen && selectedStudent) {
      setLoading(true);
      setError(null);
      apiClient.get(`/api/dashboard/${selectedStudent.studentNo}`)
        .then(res => {
          const data = res.data;
          setStudentStats({
            modulesCompleted: data.completedModules,
            totalModules: data.totalModules,
            averageScore: data.detailedMetrics?.accuracy + "%",
            lastLogin: selectedStudent.lastLogin || "N/A",
            studyHours: data.studyHours,
            learningStreak: data.learningStreak,
          });
          setLoading(false);
        })
        .catch(err => {
          setError("Failed to fetch student dashboard.");
          setLoading(false);
        });
    } else {
      setStudentStats(null);
    }
  }, [isModalOpen, selectedStudent]);

  return (
    <Modal isOpen={isModalOpen} onClose={closeStudentModal}>
      {selectedStudent && (
        <div>
          <h2 className="text-2xl font-bold mb-4">
            {selectedStudent.name}'s Dashboard
          </h2>
          <div className="space-y-3">
            <p>
              <span className="font-semibold">Student No:</span>{" "}
              {selectedStudent.studentNo}
            </p>
            <p>
              <span className="font-semibold">Program:</span>{" "}
              {selectedStudent.program}
            </p>
            <hr className="my-4" />
            <h3 className="text-lg font-semibold">Performance Stats</h3>
            {loading && <p>Loading...</p>}
            {error && <p className="text-red-500">{error}</p>}
            {studentStats && (
              <>
                <p>Modules Completed: {studentStats.modulesCompleted} / {studentStats.totalModules}</p>
                <p>Average Score: {studentStats.averageScore}</p>
                <p>Study Hours: {studentStats.studyHours}</p>
                <p>Learning Streak: {studentStats.learningStreak} days</p>
                <p>Last Login: {studentStats.lastLogin}</p>
              </>
            )}
          </div>
          <div className="text-right mt-6">
            <button
              onClick={closeStudentModal}
              className="btn btn-secondary"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default StudentDashboardModal;
