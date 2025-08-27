import useStudentStore from "../../../../store/instructor/studentStore";

const StudentTable = ({ students }) => {
  const { openStudentModal } = useStudentStore();

  if (!students.length) {
    return <p className="text-center text-gray-500 py-8">No students found.</p>;
  }

  return (
    <div className="card overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>
              Name
            </th>
            <th>
              Student No.
            </th>
            <th>
              Program
            </th>
            <th>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student._id}>
              <td>
                {student.name}
              </td>
              <td>
                {student.studentNo}
              </td>
              <td>
                {student.program}
              </td>
              <td>
                <button
                  onClick={() => openStudentModal(student)}
                  className="btn-link"
                >
                  View Dashboard
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StudentTable;
