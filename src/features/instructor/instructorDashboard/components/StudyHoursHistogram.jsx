import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import InfoTooltip from "../../../../components/common/InfoTooltip";

const StudyHoursHistogram = ({ data, isLoading }) => {
  const chartData = (data || []).map(b => ({ bucket: b.bucket, count: b.count }));
  return (
    <div className="card">
  <div className="flex items-center gap-2 mb-2">
    <h3 className="text-xl font-bold text-primary-dark">Study Hours Distribution (7 days)</h3>
    <InfoTooltip text="Histogram of students grouped by total study hours in the last 7 days." />
  </div>
  <p className="text-xs uppercase tracking-wide text-gray-500 mb-4">Students grouped by 7-day total hours</p>
      {isLoading ? (
        <p>Loading...</p>
      ) : chartData.length === 0 ? (
        <p className="text-sm text-gray-600">No data available.</p>
      ) : (
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bucket" />
              <YAxis allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14 }}
                itemStyle={{ fontSize: 14 }}
                labelStyle={{ fontSize: 14 }}
                wrapperStyle={{ zIndex: 30 }}
              />
              <defs>
                <linearGradient id="hoursHist" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#fde68a" stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <Bar dataKey="count" fill="url(#hoursHist)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default StudyHoursHistogram;
