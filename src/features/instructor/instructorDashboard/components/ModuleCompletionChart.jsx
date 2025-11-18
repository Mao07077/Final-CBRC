import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import InfoTooltip from "../../../../components/common/InfoTooltip";

const ModuleCompletionChart = ({ data, isLoading }) => {
  const chartData = (data || []).map(m => ({ title: m.title, completions: m.completions }));
  return (
    <div className="card">
  <div className="flex items-center gap-2 mb-2">
    <h3 className="text-xl font-bold text-primary-dark">Top Modules by Completions</h3>
    <InfoTooltip text="Modules with the most current-cycle post-test completions." />
  </div>
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
              <Tooltip
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14 }}
                itemStyle={{ fontSize: 14 }}
                labelStyle={{ fontSize: 14 }}
                wrapperStyle={{ zIndex: 30 }}
              />
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
