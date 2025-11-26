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
        const [actRes, profileRes, dashRes, attemptsRes, historyRes] = await Promise.allSettled([
          apiClient.get(`/api/student/${id_number}/study-activity-report`),
          apiClient.get(`/api/profile/${id_number}`),
          apiClient.get(`/api/dashboard/${id_number}?mode=combined`),
          apiClient.get(`/api/students/${id_number}/module-attempts`),
          apiClient.get(`/api/students/${id_number}/module-attempts-history`)
        ]);

        const actData = actRes.status === 'fulfilled' ? actRes.value.data : null;
  const profileData = profileRes.status === 'fulfilled' ? profileRes.value.data : null;
  const dashboardData = dashRes.status === 'fulfilled' ? dashRes.value.data : null;
  const attemptsData = attemptsRes.status === 'fulfilled' ? attemptsRes.value.data : null;
  const historyData = historyRes.status === 'fulfilled' ? historyRes.value.data : null;

        // Merge profile fields into activity so UI and PDF can access name/program
        const merged = {
          ...(actData || {}),
          name: (profileData && (profileData.firstname || profileData.lastname)) ? `${profileData.firstname || ''} ${profileData.lastname || ''}`.trim() : (actData && (actData.name || actData.fullname)) || null,
          program: (profileData && profileData.program) || (actData && actData.program) || null,
          // Dashboard summary fields (if available)
          dashboard: dashboardData || null,
          session_hours: actData?.session_hours ?? 0,
          moduleAttempts: attemptsData?.moduleAttempts ?? [],
          attemptsHistory: historyData?.history ?? []
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

      // Weekly progress chart omitted to fit one-page layout

      // Disable page breaks (force single-page layout)
      const ensureSpace = () => {};

  // Bar chart for Flashcards / Sessions (Notes removed per requirement)
    const labels = ['Flashcards', 'Sessions', 'Learn Together Hours'];
    const values = [activity?.flashcards_count ?? 0, activity?.sessions_count ?? 0, activity?.session_hours ?? 0];
      const maxVal = Math.max(...values, 1);

    doc.setFontSize(11);
    doc.text('Study Activity Overview', left, cursorY);
    cursorY += 12;
    // Caption
    doc.setFontSize(9);
    doc.setTextColor(90);
    doc.text('Bars show Flashcards created, Study Sessions taken, and Learn Together Hours.', left, cursorY);
    doc.setTextColor(0);
    cursorY += 12;

      const chartX = left;
      const chartY = cursorY + 6;
      const chartWidth = pageWidth - left * 2;
      const barHeight = 18;
      const gap = 12;

      // Dynamic label gutter to avoid overlap with bars
      const labelWidths = labels.map(l => doc.getTextWidth(l));
      const labelGutter = Math.min(Math.max(100, Math.max(...labelWidths) + 10), Math.floor(chartWidth * 0.45));
      const barAreaWidth = chartWidth - labelGutter;

      for (let i = 0; i < labels.length; i++) {
        const label = labels[i];
        const val = values[i];
        const pct = val / maxVal;
        const w = Math.max(4, Math.round(barAreaWidth * pct));

        // label (right-aligned inside gutter)
        doc.text(label, chartX + labelGutter - 6, chartY + i * (barHeight + gap) + 12, { align: 'right' });

        // bar background
        doc.setDrawColor(200);
        doc.setFillColor(245, 245, 245);
        doc.rect(chartX + labelGutter, chartY + i * (barHeight + gap), barAreaWidth, barHeight, 'F');

        // bar fill
        doc.setFillColor(43, 108, 176);
        doc.rect(chartX + labelGutter, chartY + i * (barHeight + gap), w, barHeight, 'F');

        // value label (clamped inside bar area)
        doc.setFontSize(10);
        const valueX = chartX + labelGutter + Math.min(w + 6, barAreaWidth - 18);
        doc.text(String(val), valueX, chartY + i * (barHeight + gap) + 12);
      }

      cursorY = chartY + labels.length * (barHeight + gap) + 18;

  // Performance Trend (All-Time Averages) - height reduced to fit single page
      doc.setFontSize(12);
      doc.text('Performance Trend (All-Time Averages)', left, cursorY);
      cursorY += 10;
      // Caption
      doc.setFontSize(9);
      doc.setTextColor(90);
      doc.text('Avg Pre/Post are means across modules at each point; Improvement = Avg Post - Avg Pre.', left, cursorY);
      doc.setTextColor(0);
      cursorY += 10;
    const trendX = left;
    const trendY = cursorY + 8;
    const trendW = pageWidth - left * 2;
    const trendH = 140; // increased height for better visibility
      const history = activity?.attemptsHistory || [];
      // Flatten attempts
      const events = [];
      history.forEach(mod => {
        (mod.attempts || []).forEach(a => {
          events.push({ date: new Date(a.submittedAt), type: a.type, percent: a.percent });
        });
      });
      events.sort((a,b)=> a.date - b.date);
      const latestPre = {};
      const latestPost = {};
      const points = [];
      events.forEach((ev, idx) => {
        if (ev.type === 'pretest') latestPre[idx] = ev.percent;
        if (ev.type === 'posttest') latestPost[idx] = ev.percent;
        const preVals = Object.values(latestPre);
        const postVals = Object.values(latestPost);
        const avgPre = preVals.length ? preVals.reduce((a,c)=>a+c,0)/preVals.length : 0;
        const avgPost = postVals.length ? postVals.reduce((a,c)=>a+c,0)/postVals.length : 0;
        const improvement = (postVals.length && preVals.length) ? (avgPost - avgPre) : 0;
        points.push({ x: ev.date.getTime(), avgPre, avgPost, improvement });
      });
      // Add Y-axis label gutter so 0-100% labels don't overlap the plot
      const yLabelW = doc.getTextWidth('100%') + 10;
      const axisX = trendX + yLabelW;
      const xPlotW = Math.max(10, trendW - yLabelW);
      // Axes: increase thickness by ~30%
      doc.setDrawColor(180);
      doc.setLineWidth(0.39);
      doc.line(axisX, trendY, axisX, trendY + trendH);
      doc.line(axisX, trendY + trendH, axisX + xPlotW, trendY + trendH);
      const yScale = (v) => trendY + trendH - (Math.max(0, Math.min(100, v)) / 100) * trendH;
      const xMin = points.length ? points[0].x : Date.now();
      const xMax = points.length ? points[points.length - 1].x : (xMin + 1);
      const xScale = (x) => axisX + ((x - xMin) / Math.max(1, (xMax - xMin))) * xPlotW;
      // Grid lines and y-axis labels (right-aligned just left of axis)
      doc.setDrawColor(220); // slightly darker grid for visibility
      for (let p = 0; p <= 100; p += 20) {
        const gy = yScale(p);
        doc.line(axisX, gy, axisX + xPlotW, gy);
        doc.setFontSize(9);
        doc.setTextColor(120);
        const lbl = `${p}%`;
        doc.text(lbl, axisX - 6, gy + 3, { align: 'right' });
      }
      // Draw lines
      const drawLine = (key, r, g, b) => {
        if (points.length < 2) return;
        doc.setDrawColor(r, g, b);
        doc.setLineWidth(0.78); // +30% thicker series lines
        for (let i = 1; i < points.length; i++) {
          doc.line(xScale(points[i-1].x), yScale(points[i-1][key]), xScale(points[i].x), yScale(points[i][key]));
        }
        // point markers for emphasis
        for (let i = 0; i < points.length; i++) {
          const px = xScale(points[i].x);
          const py = yScale(points[i][key]);
          doc.setFillColor(r, g, b);
          doc.circle(px, py, 0.65, 'F'); // +30% larger markers
        }
      };
      drawLine('avgPre', 59, 130, 246); // blue
      drawLine('avgPost', 16, 185, 129); // green
      drawLine('improvement', 245, 158, 11); // amber
      // Legend
      doc.setFontSize(10);
      doc.setTextColor(33);
      const lgY = trendY + trendH + 14;
      doc.setLineWidth(0.52); // +30% thicker legend swatches
      doc.setDrawColor(59,130,246); doc.line(trendX, lgY-4, trendX+22, lgY-4); doc.text('Avg Pre', trendX+28, lgY);
      doc.setDrawColor(16,185,129); doc.line(trendX+90, lgY-4, trendX+112, lgY-4); doc.text('Avg Post', trendX+118, lgY);
      doc.setDrawColor(245,158,11); doc.line(trendX+180, lgY-4, trendX+202, lgY-4); doc.text('Avg Improvement', trendX+208, lgY);
      cursorY = lgY + 18;

    // Summary Details removed per user request to shorten PDF

  // Per-Module Comparison Chart (Best vs Prev Best Post%) - height reduced, no page break
  cursorY += 8;
      doc.setFontSize(12);
      doc.text('Per-Module Comparison (Best vs Prev Best Post%)', left, cursorY);
      cursorY += 10;
      // Caption
      doc.setFontSize(9);
      doc.setTextColor(90);
      doc.text('Green bar = current best Post%. Orange = previous best. Higher green means improvement.', left, cursorY);
      doc.setTextColor(0);
      cursorY += 10;
      const cmpX = left;
      const cmpY = cursorY + 8;
  const cmpW = pageWidth - left * 2;
  const cmpH = 100; // reduced further to fit single page
      const modules = activity?.moduleAttempts || [];
      // axes
      doc.setDrawColor(200);
      doc.line(cmpX, cmpY, cmpX, cmpY + cmpH);
      doc.line(cmpX, cmpY + cmpH, cmpX + cmpW, cmpY + cmpH);
      // grid and labels
      doc.setDrawColor(235);
      for (let p = 0; p <= 100; p += 20) {
        const gy = cmpY + cmpH - (p/100)*cmpH;
        doc.line(cmpX, gy, cmpX + cmpW, gy);
        doc.setFontSize(8);
        doc.setTextColor(120);
        doc.text(`${p}%`, cmpX - 24, gy + 3);
      }
      // bars
      const barGroupW = Math.max(20, Math.floor(cmpW / Math.max(1, modules.length)) - 6);
      const barW = Math.max(6, Math.floor((barGroupW - 6) / 2));
      modules.forEach((m, i) => {
        const baseX = cmpX + i * (barGroupW + 6) + 6;
        const prev = Math.max(0, Math.min(100, m.prevBestPostPercent || 0));
        const curr = Math.max(0, Math.min(100, m.bestPostPercent || 0));
        const hPrev = (prev/100) * cmpH;
        const hCurr = (curr/100) * cmpH;
        // previous (orange)
        doc.setFillColor(245, 158, 11);
        doc.rect(baseX, cmpY + cmpH - hPrev, barW, hPrev, 'F');
        // current (green)
        doc.setFillColor(16, 185, 129);
        doc.rect(baseX + barW + 4, cmpY + cmpH - hCurr, barW, hCurr, 'F');
        // module label (trim)
        doc.setFontSize(7);
        doc.setTextColor(60);
        const label = (m.title || '').slice(0, 10);
        doc.text(label, baseX + barW/2 + 2, cmpY + cmpH + 10, { align: 'center' });
      });
      cursorY = cmpY + cmpH + 24;

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Performance</h1>
          <p className="text-gray-600">View and download your academic reports and data</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Available Reports</h2>
            <div className="flex space-x-3">
              <button onClick={handleDownloadPDF} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <FiDownload className="mr-2" />
                {generating ? 'Preparing PDF...' : 'Download Performance'}
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
                  <p className="text-sm text-gray-600">Flashcards and study sessions</p>
                  {loading ? (
                    <span className="text-gray-400 text-sm">Loading...</span>
                  ) : error ? (
                    <span className="text-red-500 text-sm">{error}</span>
                  ) : activity ? (
                    <ul className="mt-2 text-sm text-gray-700">
                      <li>Flashcards: {activity.flashcards_count}</li>
                      <li>Study Sessions: {activity.sessions_count}</li>
                        <li>Learn Together Hours: {activity.session_hours}</li>
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
