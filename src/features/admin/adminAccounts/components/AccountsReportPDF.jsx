import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Helvetica-Bold',
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableColHeader: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: '#f0f0f0',
    padding: 5,
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
  },
  tableCol: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
    fontSize: 9,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: 'grey',
    fontSize: 10,
  },
});

const AccountsReportPDF = ({ accounts }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Account Information Report</Text>
      
      <View style={styles.table}>
        {/* Table Header */}
        <View style={styles.tableRow}>
          <View style={styles.tableColHeader}><Text>Name</Text></View>
          <View style={styles.tableColHeader}><Text>ID Number</Text></View>
          <View style={styles.tableColHeader}><Text>Email</Text></View>
          <View style={styles.tableColHeader}><Text>Role</Text></View>
        </View>
        
        {/* Table Body */}
        {accounts.map(account => (
          <View key={account._id} style={styles.tableRow}>
            <View style={styles.tableCol}><Text>{account.name || `${account.firstname} ${account.lastname}`}</Text></View>
            <View style={styles.tableCol}><Text>{account.id_number}</Text></View>
            <View style={styles.tableCol}><Text>{account.email}</Text></View>
            <View style={styles.tableCol}><Text style={{ textTransform: 'capitalize' }}>{account.role}</Text></View>
          </View>
        ))}
      </View>

      <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
        `${pageNumber} / ${totalPages}`
      )} fixed />
    </Page>
  </Document>
);

export default AccountsReportPDF;
