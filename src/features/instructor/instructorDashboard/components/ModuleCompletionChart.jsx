import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const ModuleCompletionChart = ({ data, isLoading }) => {
  const chartData = (data || []).map(m => ({ title: m.title, completions: m.completions }));
  return (
    <div className="card">
  <h3 className="text-xl font-bold text-primary-dark mb-2">Top Modules by Completions</h3>
  <p className="text-xs uppercase tracking-wide text-gray-500 mb-4">Current cycle post-test completions</p>
      {isLoading ? (
        <p>Loading...</p>
      ) : chartData.length === 0 ? (
        <p className="text-sm text-gray-600">No completions yet.</p>
      ) : (
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="title" interval={0} angle={-25} textAnchor="end" height={70} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <defs>
                <linearGradient id="modComp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.85} />
                  <stop offset="100%" stopColor="#93c5fd" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <Bar dataKey="completions" fill="url(#modComp)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default ModuleCompletionChart;
