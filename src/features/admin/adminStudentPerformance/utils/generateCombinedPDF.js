import React from "react";
import { pdf } from "@react-pdf/renderer";
import apiClient from "../../../../api/axiosClient";
import CombinedStudentReportPDF from "../components/CombinedStudentReportPDF";

export default async function generateCombinedPDF(students) {
  if (!students || students.length === 0) throw new Error("No students provided");

  // Fetch detailed performance for each student in parallel
  const promises = students.map((s) =>
    apiClient.get(`/api/admin/student-performance/${s.id_number}`).then((res) => ({ student: s, details: res.data.details || res.data }))
  );
  const results = await Promise.all(promises);

  const enriched = results.map(({ student, details }) => ({ ...student, studentDetails: details, testHistory: details?.testHistory || details?.tests || [] }));

  const doc = React.createElement(CombinedStudentReportPDF, { students: enriched });
  const asPdf = pdf();
  asPdf.updateContainer(doc);
  const blob = await asPdf.toBlob();
  return blob;
}
