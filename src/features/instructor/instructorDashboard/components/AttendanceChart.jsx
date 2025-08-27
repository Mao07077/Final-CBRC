const AttendanceChart = ({ data, isLoading }) => {
  return (
    <div className="card">
      <h3 className="text-xl font-bold text-primary-dark mb-4">
        Student Attendance
      </h3>
      <div className="flex items-end justify-around h-48">
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          data.map((value, index) => (
            <div
              key={index}
              className="w-8 bg-primary-light rounded-t-lg hover:bg-primary transition-all duration-300"
              style={{ height: `${value}%` }}
              title={`Day ${index + 1}: ${value}%`}
            ></div>
          ))
        )}
      </div>
    </div>
  );
};

export default AttendanceChart;
