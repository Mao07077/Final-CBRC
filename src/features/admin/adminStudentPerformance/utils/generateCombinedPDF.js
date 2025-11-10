import jsPDF from "jspdf";
import apiClient from "../../../../api/axiosClient";

// Load logo and convert to data URL
async function loadImageDataUrl(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function drawStudyActivityOverview(doc, left, pageWidth, cursorY, activity) {
  doc.setFontSize(11);
  doc.text('Study Activity Overview', left, cursorY);
  cursorY += 12;

  const labels = ['Flashcards', 'Sessions', 'Learn Together Hours'];
  const values = [activity?.flashcards_count ?? 0, activity?.sessions_count ?? 0, activity?.session_hours ?? 0];
  const maxVal = Math.max(...values, 1);

  const chartX = left;
  const chartY = cursorY + 6;
  const chartWidth = pageWidth - left * 2;
  const barHeight = 18;
  const gap = 12;

  const labelWidths = labels.map(l => doc.getTextWidth(l));
  const labelGutter = Math.min(Math.max(100, Math.max(...labelWidths) + 10), Math.floor(chartWidth * 0.45));
  const barAreaWidth = chartWidth - labelGutter;

  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    const val = values[i];
    const pct = val / maxVal;
    const w = Math.max(4, Math.round(barAreaWidth * pct));

    doc.text(label, chartX + labelGutter - 6, chartY + i * (barHeight + gap) + 12, { align: 'right' });

    doc.setDrawColor(200);
    doc.setFillColor(245, 245, 245);
    doc.rect(chartX + labelGutter, chartY + i * (barHeight + gap), barAreaWidth, barHeight, 'F');

    doc.setFillColor(43, 108, 176);
    doc.rect(chartX + labelGutter, chartY + i * (barHeight + gap), w, barHeight, 'F');

    doc.setFontSize(10);
    const valueX = chartX + labelGutter + Math.min(w + 6, barAreaWidth - 18);
    doc.text(String(val), valueX, chartY + i * (barHeight + gap) + 12);
  }

  return chartY + labels.length * (barHeight + gap) + 18;
}

function drawPerformanceTrend(doc, left, pageWidth, cursorY, attemptsHistory) {
  doc.setFontSize(12);
  doc.text('Performance Trend (All-Time Averages)', left, cursorY);
  cursorY += 10;
  const trendX = left;
  const trendY = cursorY + 8;
  const trendW = pageWidth - left * 2;
  const trendH = 100;

  const history = attemptsHistory || [];
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

  const yLabelW = doc.getTextWidth('100%') + 10;
  const axisX = trendX + yLabelW;
  const xPlotW = Math.max(10, trendW - yLabelW);

  doc.setDrawColor(200);
  doc.line(axisX, trendY, axisX, trendY + trendH);
  doc.line(axisX, trendY + trendH, axisX + xPlotW, trendY + trendH);
  const yScale = (v) => trendY + trendH - (Math.max(0, Math.min(100, v)) / 100) * trendH;
  const xMin = points.length ? points[0].x : Date.now();
  const xMax = points.length ? points[points.length - 1].x : (xMin + 1);
  const xScale = (x) => axisX + ((x - xMin) / Math.max(1, (xMax - xMin))) * xPlotW;

  doc.setDrawColor(235);
  for (let p = 0; p <= 100; p += 20) {
    const gy = yScale(p);
    doc.line(axisX, gy, axisX + xPlotW, gy);
    doc.setFontSize(8);
    doc.setTextColor(120);
    const lbl = `${p}%`;
    doc.text(lbl, axisX - 6, gy + 3, { align: 'right' });
  }

  const drawLine = (key, r, g, b) => {
    if (points.length < 2) return;
    doc.setDrawColor(r, g, b);
    for (let i = 1; i < points.length; i++) {
      doc.line(xScale(points[i-1].x), yScale(points[i-1][key]), xScale(points[i].x), yScale(points[i][key]));
    }
  };
  drawLine('avgPre', 59, 130, 246);
  drawLine('avgPost', 16, 185, 129);
  drawLine('improvement', 245, 158, 11);

  doc.setFontSize(9);
  doc.setTextColor(33);
  const lgY = trendY + trendH + 14;
  doc.setDrawColor(59,130,246); doc.line(axisX, lgY-4, axisX+18, lgY-4); doc.text('Avg Pre', axisX+22, lgY);
  doc.setDrawColor(16,185,129); doc.line(axisX+80, lgY-4, axisX+98, lgY-4); doc.text('Avg Post', axisX+102, lgY);
  doc.setDrawColor(245,158,11); doc.line(axisX+170, lgY-4, axisX+188, lgY-4); doc.text('Avg Improvement', axisX+192, lgY);

  return lgY + 18;
}

function drawPerModuleComparison(doc, left, pageWidth, cursorY, modules) {
  doc.setFontSize(12);
  doc.text('Per-Module Comparison (Best vs Prev Best Post%)', left, cursorY);
  cursorY += 10;
  const cmpX = left;
  const cmpY = cursorY + 8;
  const cmpW = pageWidth - left * 2;
  const cmpH = 100;

  doc.setDrawColor(200);
  doc.line(cmpX, cmpY, cmpX, cmpY + cmpH);
  doc.line(cmpX, cmpY + cmpH, cmpX + cmpW, cmpY + cmpH);
  doc.setDrawColor(235);
  for (let p = 0; p <= 100; p += 20) {
    const gy = cmpY + cmpH - (p/100)*cmpH;
    doc.line(cmpX, gy, cmpX + cmpW, gy);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`${p}%`, cmpX - 24, gy + 3);
  }
  const barGroupW = Math.max(20, Math.floor(cmpW / Math.max(1, modules.length)) - 6);
  const barW = Math.max(6, Math.floor((barGroupW - 6) / 2));
  modules.forEach((m, i) => {
    const baseX = cmpX + i * (barGroupW + 6) + 6;
    const prev = Math.max(0, Math.min(100, m.prevBestPostPercent || 0));
    const curr = Math.max(0, Math.min(100, m.bestPostPercent || 0));
    const hPrev = (prev/100) * cmpH;
    const hCurr = (curr/100) * cmpH;
    doc.setFillColor(245, 158, 11);
    doc.rect(baseX, cmpY + cmpH - hPrev, barW, hPrev, 'F');
    doc.setFillColor(16, 185, 129);
    doc.rect(baseX + barW + 4, cmpY + cmpH - hCurr, barW, hCurr, 'F');
    doc.setFontSize(7);
    doc.setTextColor(60);
    const label = (m.title || '').slice(0, 10);
    doc.text(label, baseX + barW/2 + 2, cmpY + cmpH + 10, { align: 'center' });
  });
  return cmpY + cmpH + 24;
}

async function fetchStudentData(id_number) {
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

  return {
    ...(actData || {}),
    id_number,
    name: (profileData && (profileData.firstname || profileData.lastname)) ? `${profileData.firstname || ''} ${profileData.lastname || ''}`.trim() : (actData && (actData.name || actData.fullname)) || null,
    program: (profileData && profileData.program) || (actData && actData.program) || null,
    dashboard: dashboardData || null,
    session_hours: actData?.session_hours ?? 0,
    moduleAttempts: attemptsData?.moduleAttempts ?? [],
    attemptsHistory: historyData?.history ?? []
  };
}

function drawStudentPage(doc, student, logoDataUrl) {
  const left = 40;
  const top = 40;
  const pageWidth = doc.internal.pageSize.getWidth();

  if (logoDataUrl) {
    const logoH = 84;
    const logoW = logoH;
    const centerX = (pageWidth - logoW) / 2;
    doc.addImage(logoDataUrl, 'PNG', centerX, top, logoW, logoH);
  }

  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  const titleY = top + 84 + 9;
  doc.text('Student Performance Report', pageWidth / 2, titleY, { align: 'center' });

  doc.setLineWidth(0.5);
  const hrY = titleY + 12;
  doc.line(left, hrY, pageWidth - left, hrY);

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  const metaY = hrY + 16;
  doc.text(`ID: ${student.id_number}`, left, metaY);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - left, metaY, { align: 'right' });

  let cursorY = metaY + 20;
  doc.setFontSize(12);
  doc.text(`Name: ${student?.name || 'N/A'}`, left, cursorY);
  cursorY += 18;
  doc.text(`Program: ${student?.program || 'N/A'}`, left, cursorY);
  cursorY += 18;

  const dash = student?.dashboard || {};
  if (dash && Object.keys(dash).length > 0) {
    cursorY += 6;
    doc.setFontSize(12);
    doc.text('Dashboard Summary', left, cursorY);
    cursorY += 14;
    doc.setFontSize(10);
    doc.text(`Modules Completed: ${dash.completedModules ?? 'N/A'}`, left, cursorY);
    doc.text(`Total Modules: ${dash.totalModules ?? 'N/A'}`, pageWidth - left, cursorY, { align: 'right' });
    cursorY += 12;
    doc.text(`Study Hours: ${dash.studyHours ?? 'N/A'}`, left, cursorY);
    doc.text(`Learning Streak: ${dash.learningStreak ?? 'N/A'}`, pageWidth - left, cursorY, { align: 'right' });
    cursorY += 12;
    doc.text(`Accuracy: ${dash.accuracy ?? 'N/A'}%`, left, cursorY);
    doc.text(`Pre/Post Tests: ${dash.preTestCount ?? 0}/${dash.postTestCount ?? 0}`, pageWidth - left, cursorY, { align: 'right' });
    cursorY += 18;
  }
  cursorY += 20;

  cursorY = drawStudyActivityOverview(doc, left, pageWidth, cursorY, student);
  cursorY = drawPerformanceTrend(doc, left, pageWidth, cursorY, student?.attemptsHistory);
  cursorY += 8;
  cursorY = drawPerModuleComparison(doc, left, pageWidth, cursorY, student?.moduleAttempts || []);

  doc.setFontSize(9);
  const footerY = doc.internal.pageSize.getHeight() - 40;
  doc.text('This report is system generated. For questions, contact support.', left, footerY);
}

export default async function generateCombinedPDF(students = []) {
  if (!students || students.length === 0) throw new Error('No students provided');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const logoDataUrl = await loadImageDataUrl('/cbrc_logo.png');

  for (let i = 0; i < students.length; i++) {
    const s = students[i];
    try {
      const data = await fetchStudentData(s.id_number);
      if (i > 0) doc.addPage();
      drawStudentPage(doc, data, logoDataUrl);
    } catch (err) {
      if (i > 0) doc.addPage();
      doc.setFontSize(14);
      doc.text(`Student ${s.name || s.id_number}: report unavailable`, 40, 100);
      doc.setFontSize(10);
      doc.text(`Reason: ${err?.message || 'fetch failed'}`, 40, 120);
    }
  }

  return doc.output('blob');
}
