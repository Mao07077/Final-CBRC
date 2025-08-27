import { Page, Text, View, Document, StyleSheet } from "@react-pdf/renderer";

// Define styles for the PDF
const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 11 },
  title: { fontSize: 24, textAlign: "center", marginBottom: 20 },
  section: { marginBottom: 15 },
  sectionTitle: { fontSize: 16, marginBottom: 8, textDecoration: "underline" },
  text: { marginBottom: 4 },
  table: {
    display: "table",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: { margin: "auto", flexDirection: "row" },
  tableColHeader: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: "#f0f0f0",
    padding: 5,
    fontWeight: "bold",
  },
  tableCol: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
  },
});

const StudentReportPDF = ({ student }) => {
  if (!student) {
    return (
      <Document>
        <Page style={styles.page}>
          <Text>No student data available.</Text>
        </Page>
      </Document>
    );
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Student Performance Report</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Student Information</Text>
          <Text style={styles.text}>Name: {student.name || 'N/A'}</Text>
          <Text style={styles.text}>ID Number: {student.id_number || 'N/A'}</Text>
          <Text style={styles.text}>Program: {student.program || 'N/A'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Results</Text>
          <Text>No test results available.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended Study Habits</Text>
          {student.studyHabits && student.studyHabits.length > 0 ? (
            student.studyHabits.map((habit, index) => (
              <Text key={index} style={styles.text}>
                - {habit}
              </Text>
            ))
          ) : (
            <Text>No study habits recorded.</Text>
          )}
        </View>
      </Page>
    </Document>
  );
};

export default StudentReportPDF;
