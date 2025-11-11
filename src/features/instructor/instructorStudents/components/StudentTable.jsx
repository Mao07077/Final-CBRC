import useStudentStore from "../../../../store/instructor/studentStore";

const StudentTable = ({ students }) => {
  const { openStudentModal } = useStudentStore();

  if (!students.length) {
    return <p className="text-center text-gray-500 py-8">No students found.</p>;
  }

  return (
    <div className="card">
      <div className="block sm:hidden space-y-3">
        {students.map((student) => (
          <div key={student._id} className="p-3 border rounded-md flex flex-col gap-1 bg-white">
            <div className="text-sm font-semibold text-gray-800 truncate">{student.name}</div>
            <div className="text-xs text-gray-500">{student.studentNo}</div>
            <div className="text-xs text-gray-500">{student.program}</div>
            <div className="mt-1">
              <button
                onClick={() => openStudentModal(student)}
                className="text-indigo-600 text-xs font-medium hover:underline"
              >
                View Dashboard
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-max w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-gray-700">Name</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-700">Student No.</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-700">Program</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student._id} className="border-b last:border-b-0">
                <td className="px-4 py-2 whitespace-nowrap max-w-[160px] truncate">{student.name}</td>
                <td className="px-4 py-2 whitespace-nowrap">{student.studentNo}</td>
                <td className="px-4 py-2 whitespace-nowrap">{student.program}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => openStudentModal(student)}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    View Dashboard
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentTable;
