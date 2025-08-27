import { FiPlus, FiDownload } from "react-icons/fi";
import { PDFDownloadLink } from "@react-pdf/renderer";
import useAccountStore from "../../../../store/admin/accountStore";
import AccountsReportPDF from "./AccountsReportPDF";

const AccountsToolbar = ({ onFilterChange, selectedAccounts }) => {
  const { openModal } = useAccountStore();

  return (
    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 p-4 bg-gray-50 rounded-lg border">
      {/* Left side: Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
        <input
          type="text"
          placeholder="Search by name or ID..."
          onChange={(e) => onFilterChange({ query: e.target.value })}
          className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition"
        />
        <select
          onChange={(e) => onFilterChange({ role: e.target.value })}
          className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition bg-white"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="instructor">Instructor</option>
          <option value="student">Student</option>
        </select>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-2 w-full md:w-auto justify-start md:justify-end">
        {selectedAccounts && selectedAccounts.length > 0 && (
          <PDFDownloadLink
            document={<AccountsReportPDF accounts={selectedAccounts} />}
            fileName={`accounts_report_${new Date().toISOString()}.pdf`}
            className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75 transition-colors duration-300"
          >
            {({ loading }) =>
              loading ? (
                "Generating..."
              ) : (
                <>
                  <FiDownload className="mr-2" />
                  <span>Report ({selectedAccounts.length})</span>
                </>
              )
            }
          </PDFDownloadLink>
        )}
        <button
          onClick={() => openModal(null)}
          className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition-colors duration-300"
        >
          <FiPlus className="mr-2" />
          <span>New Account</span>
        </button>
      </div>
    </div>
  );
};

export default AccountsToolbar;
