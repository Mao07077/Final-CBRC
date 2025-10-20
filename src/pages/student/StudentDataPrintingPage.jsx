import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";
import { FiFileText, FiDownload, FiPrinter } from "react-icons/fi";
import apiClient from "../../api/axiosClient";

const StudentDataPrintingPage = () => {
  const id_number = localStorage.getItem("id_number") || "123456";
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function fetchActivity() {
      setLoading(true);
      try {
        // Fetch study activity, profile and dashboard in parallel; dashboard has summary stats
        const [actRes, profileRes, dashRes] = await Promise.allSettled([
          apiClient.get(`/api/student/${id_number}/study-activity-report`),
          apiClient.get(`/api/profile/${id_number}`),
          apiClient.get(`/api/dashboard/${id_number}`)
        ]);

        const actData = actRes.status === 'fulfilled' ? actRes.value.data : null;
  const profileData = profileRes.status === 'fulfilled' ? profileRes.value.data : null;
  const dashboardData = dashRes.status === 'fulfilled' ? dashRes.value.data : null;

        // Merge profile fields into activity so UI and PDF can access name/program
        const merged = {
          ...(actData || {}),
          name: (profileData && (profileData.firstname || profileData.lastname)) ? `${profileData.firstname || ''} ${profileData.lastname || ''}`.trim() : (actData && (actData.name || actData.fullname)) || null,
          program: (profileData && profileData.program) || (actData && actData.program) || null,
          // Dashboard summary fields (if available)
          dashboard: dashboardData || null
        };

        setActivity(merged);

        // If either call failed, surface a compact error message
        if (actRes.status === 'rejected' && profileRes.status === 'rejected') {
          setError('Failed to fetch study activity and profile.');
        } else if (actRes.status === 'rejected') {
          setError('Failed to fetch study activity report.');
        } else if (profileRes.status === 'rejected') {
          // Not fatal: profile missing means we still have activity
          setError(null);
        } else {
          setError(null);
        }
      } catch (err) {
        setError('Failed to fetch study activity report.');
      } finally {
        setLoading(false);
      }
    }
    fetchActivity();
  }, [id_number]);

  // PDF download handler using jsPDF
  const handleDownloadPDF = async () => {
    setGenerating(true);
    try {
      // formal PDF with header + bar chart
      const doc = new jsPDF({ unit: "pt", format: "a4" });

      // Draw header (logo + title)
      const left = 40;
      const top = 40;
      const pageWidth = doc.internal.pageSize.getWidth();

      // Try to load logo from public folder
      const logoUrl = '/cbrc_logo.png';
      const loadImage = (url) =>
        new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = url;
        });

      const img = await loadImage(logoUrl);
      if (img) {
        // convert to dataURL via canvas
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        // enlarge height by 20% and center horizontally
        const logoH = 84;
        const logoW = (img.width / img.height) * logoH;
        const centerX = (pageWidth - logoW) / 2;
        doc.addImage(dataUrl, 'PNG', centerX, top, logoW, logoH);
      }

      // Title
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      const titleY = top + 84 + 18 / 2; // centered under the logo
      doc.text('Student Performance Report', pageWidth / 2, titleY, { align: 'center' });

      // Draw a horizontal rule under the title
      doc.setLineWidth(0.5);
      const hrY = titleY + 12;
      doc.line(left, hrY, pageWidth - left, hrY);

      // Meta (moved below the rule)
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const metaY = hrY + 16;
      doc.text(`ID: ${id_number}`, left, metaY);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - left, metaY, { align: 'right' });

      // Student summary (start lower)
      let cursorY = metaY + 20;
      doc.setFontSize(12);
      doc.text(`Name: ${activity?.name || 'N/A'}`, left, cursorY);
      cursorY += 18;
      doc.text(`Program: ${activity?.program || 'N/A'}`, left, cursorY);
      cursorY += 18;

      // Dashboard summary (if available)
      const dash = activity?.dashboard || {};
      if (dash && Object.keys(dash).length > 0) {
        cursorY += 6;
        doc.setFontSize(12);
        doc.text('Dashboard Summary', left, cursorY);
        cursorY += 14;
        doc.setFontSize(10);
        doc.text(`Modules Completed: ${dash.completedModules ?? dash.completedModules ?? 'N/A'}`, left, cursorY);
        doc.text(`Total Modules: ${dash.totalModules ?? dash.totalModules ?? 'N/A'}`, pageWidth - left, cursorY, { align: 'right' });
        cursorY += 12;
        doc.text(`Study Hours: ${dash.studyHours ?? 'N/A'}`, left, cursorY);
        doc.text(`Learning Streak: ${dash.learningStreak ?? 'N/A'}`, pageWidth - left, cursorY, { align: 'right' });
        cursorY += 12;
        doc.text(`Accuracy: ${dash.accuracy ?? 'N/A'}%`, left, cursorY);
        doc.text(`Pre/Post Tests: ${dash.preTestCount ?? 0}/${dash.postTestCount ?? 0}`, pageWidth - left, cursorY, { align: 'right' });
        cursorY += 18;
      }
      cursorY += 28;

      // Small weekly progress bar chart (from dashboard.weeklyProgress)
      const weekly = activity?.dashboard?.weeklyProgress || activity?.dashboard?.weekly_progress || [];
      if (weekly && Array.isArray(weekly) && weekly.length > 0) {
        doc.setFontSize(12);
        doc.text('Weekly Progress (hours)', left, cursorY);
        cursorY += 12;
        const weekX = left;
        const weekY = cursorY + 6;
        const weekWidth = pageWidth - left * 2;
        const weekBarWidth = Math.max(28, Math.floor(weekWidth / weekly.length) - 8);
        const maxHours = Math.max(...weekly.map((d) => d.hours || 0), 1);
        for (let i = 0; i < weekly.length; i++) {
          const item = weekly[i];
          const hrs = item.hours || 0;
          const hPct = hrs / maxHours;
          const hH = Math.max(4, Math.round(60 * hPct));
          const x = weekX + i * (weekBarWidth + 8);
          // draw bar background
          doc.setFillColor(245, 245, 245);
          doc.rect(x, weekY + (60 - hH), weekBarWidth, hH, 'F');
          // fill
          doc.setFillColor(43, 108, 176);
          doc.rect(x, weekY + (60 - hH), weekBarWidth, hH, 'F');
          // label day (short)
          doc.setFontSize(8);
          const dayLabel = (item.day || '').slice(5); // MM-DD
          doc.text(dayLabel, x + weekBarWidth / 2, weekY + 72, { align: 'center' });
        }
        cursorY = weekY + 86;
      }

      // Bar chart for Notes / Flashcards / Sessions
      const labels = ['Notes', 'Flashcards', 'Sessions'];
      const values = [activity?.notes_count ?? 0, activity?.flashcards_count ?? 0, activity?.sessions_count ?? 0];
      const maxVal = Math.max(...values, 1);

      doc.setFontSize(11);
      doc.text('Study Activity Overview', left, cursorY);
      cursorY += 12;

      const chartX = left;
      const chartY = cursorY + 6;
      const chartWidth = pageWidth - left * 2;
      const barHeight = 18;
      const gap = 12;

      for (let i = 0; i < labels.length; i++) {
        const label = labels[i];
        const val = values[i];
        const pct = val / maxVal;
        const w = Math.max(4, Math.round(chartWidth * pct));

        // label
        doc.text(label, chartX, chartY + i * (barHeight + gap) + 12);

        // bar background
        doc.setDrawColor(200);
        doc.setFillColor(245, 245, 245);
        doc.rect(chartX + 80, chartY + i * (barHeight + gap), chartWidth - 80, barHeight, 'F');

        // bar fill
        doc.setFillColor(43, 108, 176);
        doc.rect(chartX + 80, chartY + i * (barHeight + gap), w, barHeight, 'F');

        // value
        doc.setFontSize(10);
        doc.text(String(val), chartX + 80 + Math.min(w + 6, chartWidth - 80 - 18), chartY + i * (barHeight + gap) + 12);
      }

      cursorY = chartY + labels.length * (barHeight + gap) + 18;

      // Detailed list
      doc.setFontSize(12);
      doc.text('Summary Details', left, cursorY);
      cursorY += 12;
      doc.setFontSize(10);
      doc.text(`Notes: ${activity?.notes_count ?? 0}`, left, cursorY);
      cursorY += 12;
      doc.text(`Flashcards: ${activity?.flashcards_count ?? 0}`, left, cursorY);
      cursorY += 12;
      doc.text(`Study Sessions: ${activity?.sessions_count ?? 0}`, left, cursorY);

      doc.setFontSize(9);
      // place footer near bottom of page
      const footerY = doc.internal.pageSize.getHeight() - 40;
      doc.text('This report is system generated. For questions, contact support.', left, footerY);

      // Build filename with name or id
      const safeName = (activity?.name || id_number).toString().replace(/[^a-z0-9_\- ]/gi, '_');
      doc.save(`Student_${safeName}_report.pdf`);
    } catch (err) {
      console.error('PDF generation failed', err);
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
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
              <button onClick={handleDownloadPDF} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <FiDownload className="mr-2" />
                {generating ? 'Preparing PDF...' : 'Download My Report'}
              </button>
              <button onClick={handlePrint} className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                <FiPrinter className="mr-2" />
                Print
              </button>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <FiFileText className="text-blue-600 mr-3" size={20} />
                <div>
                  <h3 className="font-medium text-gray-900">Academic Performance Report</h3>
                  <p className="text-sm text-gray-600">Overall performance across all modules</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <FiFileText className="text-green-600 mr-3" size={20} />
                <div>
                  <h3 className="font-medium text-gray-900">Test Results Summary</h3>
                  <p className="text-sm text-gray-600">Pre-test and post-test results</p>
                </div>
              </div>
            </div>
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
            </div>
          </div>
          <div className="text-center py-8 text-gray-500">
            <FiFileText size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg mb-2">No reports available yet</p>
            <p className="text-sm">Complete some modules to generate your reports</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDataPrintingPage;
