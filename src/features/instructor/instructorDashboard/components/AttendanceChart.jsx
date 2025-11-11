import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

// Displays overall aggregated attendance: total present days and total study hours (sum of all students)
const AttendanceChart = ({ data, isLoading }) => {
  const totalDays = (data || []).reduce((acc, s) => acc + (s.attendanceDays || 0), 0);
  const totalHours = (data || []).reduce((acc, s) => acc + (s.studyHours7d || 0), 0);
  // Single bar data for overall metrics
  const chartData = [{ name: 'Overall', days: totalDays, hours: totalHours }];
  return (
    <div className="card">
  <h3 className="text-xl font-bold text-primary-dark mb-2">Attendance & Study Hours (Last 7 days)</h3>
  <p className="text-xs uppercase tracking-wide text-gray-500 mb-4">Days present (≥ 0.5h/day) and total study hours</p>
      {isLoading ? (
        <p>Loading...</p>
      ) : data?.length === 0 ? (
        <p className="text-sm text-gray-600">No data available.</p>
      ) : (
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" orientation="left" label={{ value: 'Days', angle: -90, position: 'insideLeft' }} width={50} />
              <YAxis yAxisId="right" orientation="right" label={{ value: 'Hours', angle: 90, position: 'insideRight' }} width={60} />
              <Tooltip />
              <Legend />
              <defs>
                <linearGradient id="attDays" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#c4b5fd" stopOpacity={0.5} />
                </linearGradient>
                <linearGradient id="attHours" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#6ee7b7" stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <Bar radius={[6,6,0,0]} yAxisId="left" dataKey="days" name="Total Attendance Days" fill="url(#attDays)" />
              <Bar radius={[6,6,0,0]} yAxisId="right" dataKey="hours" name="Total Study Hours (7d)" fill="url(#attHours)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default AttendanceChart;
