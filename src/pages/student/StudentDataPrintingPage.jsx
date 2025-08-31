import React, { useEffect, useState } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import StudentReportPDF from "../../features/admin/adminStudentPerformance/components/StudentReportPDF";
import { PDFDownloadLink, Document, Page, Text, StyleSheet } from "@react-pdf/renderer";
import { FiFileText, FiDownload, FiPrinter } from "react-icons/fi";
import apiClient from "../../api/axiosClient";

const StudentDataPrintingPage = () => {
  // PDF styles
  const styles = StyleSheet.create({
    page: { padding: 24 },
    section: { marginBottom: 16 },
    title: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
    subtitle: { fontSize: 14, marginBottom: 4 },
    text: { fontSize: 12, marginBottom: 2 },
  });

  // PDF Documents
  const AcademicReportPDF = (
    <Document>
      <Page style={styles.page}>
        <Text style={styles.title}>Academic Performance Report</Text>
        <Text style={styles.text}>Overall performance across all modules</Text>
      </Page>
    </Document>
  );
  const TestResultsPDF = (
    <Document>
      <Page style={styles.page}>
        <Text style={styles.title}>Test Results Summary</Text>
        <Text style={styles.text}>Pre-test and post-test results</Text>
      </Page>
    </Document>
  );
  const StudyActivityPDF = (
    <Document>
      <Page style={styles.page}>
        <Text style={styles.title}>Study Activity Report</Text>
        <Text style={styles.text}>Notes: {activity?.notes_count ?? 0}</Text>
        <Text style={styles.text}>Flashcards: {activity?.flashcards_count ?? 0}</Text>
        <Text style={styles.text}>Study Sessions: {activity?.sessions_count ?? 0}</Text>
      </Page>
    </Document>
  );
  // Replace with actual user id_number from auth context/store
  const id_number = localStorage.getItem("id_number") || "123456";
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchActivity() {
      try {
        const res = await apiClient.get(`/api/student/${id_number}/study-activity-report`);
        setActivity(res.data);
      } catch (err) {
        if (err.response && err.response.data) {
          setError(err.response.data.error || JSON.stringify(err.response.data));
        } else {
          setError("Failed to fetch study activity report.");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchActivity();
  }, [id_number]);

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  // Download handler (for demo: downloads current view as PDF using browser print)
  const handleDownloadAll = () => {
    window.print(); // User can select 'Save as PDF'
  };

  // Download individual report (for demo: downloads current view as PDF)
  const handleDownloadReport = (reportType) => {
    window.print(); // Could be improved to only print a section
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Reports</h1>
          <p className="text-gray-600">View and download your academic reports and data</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Available Reports</h2>
            <div className="flex space-x-3">
              <PDFDownloadLink document={AcademicReportPDF} fileName="Academic_Performance_Report.pdf">
                {({ loading }) => (
                  <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <FiDownload className="mr-2" />
                    {loading ? "Preparing..." : "Download Academic"}
                  </button>
                )}
              </PDFDownloadLink>
              <PDFDownloadLink document={TestResultsPDF} fileName="Test_Results_Summary.pdf">
                {({ loading }) => (
                  <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <FiDownload className="mr-2" />
                    {loading ? "Preparing..." : "Download Test Results"}
                  </button>
                )}
              </PDFDownloadLink>
              <PDFDownloadLink document={StudyActivityPDF} fileName="Study_Activity_Report.pdf">
                {({ loading }) => (
                  <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <FiDownload className="mr-2" />
                    {loading ? "Preparing..." : "Download Activity"}
                  </button>
                )}
              </PDFDownloadLink>
              <div className="flex space-x-3">
                <PDFDownloadLink
                  document={<StudentReportPDF student={{ id_number, activity }} />}
                  fileName={`Student_${id_number}_report.pdf`}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {({ loading }) => (
                    <span className="flex items-center">
                      <FiDownload className="mr-2" />
                      {loading ? "Preparing..." : "Download My Report"}
                    </span>
                  )}
                </PDFDownloadLink>
                <button onClick={handlePrint} className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <FiPrinter className="mr-2" />
                  Print
                </button>
              </div>
            </div>
          </div>
          {/* Study Activity Report - dynamic from backend */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <FiFileText className="text-purple-600 mr-3" size={20} />
              <div>
                <h3 className="font-medium text-gray-900">Study Activity Report</h3>
                <p className="text-sm text-gray-600">Notes, flashcards, and study sessions</p>
                {loading ? (
                  <span className="text-gray-400 text-sm">Loading...</span>
                ) : error ? (
                  <span className="text-red-500 text-sm">{error}</span>
                ) : activity ? (
                  <ul className="mt-2 text-sm text-gray-700">
                    <li>Notes: {activity.notes_count}</li>
                    <li>Flashcards: {activity.flashcards_count}</li>
                    <li>Study Sessions: {activity.sessions_count}</li>
                  </ul>
                ) : (
                  <span className="text-gray-500 text-sm">No activity data found.</span>
                )}
              </div>
            </div>
            <button onClick={() => handleDownloadReport('activity')} className="text-blue-600 hover:text-blue-800 font-medium">Download</button>
          </div>
        </div>
        {/* No Reports Message */}
        <div className="text-center py-8 text-gray-500">
          <FiFileText size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg mb-2">No reports available yet</p>
          <p className="text-sm">Complete some modules to generate your reports</p>
        </div>
      </div>
    </div>
  );
};

export default StudentDataPrintingPage;
