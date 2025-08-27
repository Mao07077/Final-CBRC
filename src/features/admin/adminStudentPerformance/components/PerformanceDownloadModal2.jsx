import React, { useState } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import StudentReportPDF from "../../features/admin/adminStudentPerformance/components/StudentReportPDF";
import Modal from "../../components/common/Modal";

const PerformanceDownloadModal = ({ student, isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Download Student Performance PDF">
      <div className="flex flex-col items-center gap-4 p-4">
        <p>Do you want to download the performance report for <b>{student?.name}</b>?</p>
        <PDFDownloadLink
          document={<StudentReportPDF student={student} />}
          fileName={`Student_Performance_${student?.id_number || "report"}.pdf`}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700"
        >
          {({ loading }) => (loading ? "Preparing PDF..." : "Download PDF")}
        </PDFDownloadLink>
      </div>
    </Modal>
  );
};

export default PerformanceDownloadModal;
