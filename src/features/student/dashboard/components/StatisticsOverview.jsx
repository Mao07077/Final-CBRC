import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import {
  TrendingUp,
  BookOpen,
  Clock,
  Award,
  Target,
  Activity,
} from "lucide-react";
import useDashboardStore from "../../../../store/student/dashboardStore";

const StatisticsOverview = () => {
  const {
    completedModules,
    totalModules,
    studyHours,
    weeklySessionHours,
    weeklyFlashcardHours,
    averageScore,
    learningStreak,
    weeklyProgress,
    subjectPerformance,
    strengths,
    weaknesses,
    detailedMetrics,
    assessmentResults,
    preTestCount,
    postTestCount,
    studyHabits,
  } = useDashboardStore();

  // Color palette for pie chart
  const PIE_COLORS = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7f50', '#8dd1e1', '#a4de6c', '#d0ed57', '#ffbb28', '#ff8042', '#b39ddb', '#f06292', '#4dd0e1', '#ffd54f', '#aed581', '#ba68c8', '#e57373', '#64b5f6', '#81c784', '#fff176', '#ffb74d'
  ];

  // Assign color to each subject
  const pieData = subjectPerformance.map((entry, idx) => ({ ...entry, color: PIE_COLORS[idx % PIE_COLORS.length] }));

  // Custom label for inside the pie, truncates long subject names
  const renderPieLabel = ({ subject, score }) => {
    const maxLen = 12;
    const label = subject.length > maxLen ? subject.slice(0, maxLen) + '…' : subject;
    return `${label}: ${score}%`;
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color = "blue" }) => (
    <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          <p className="text-sm text-gray-500">{title}</p>
        </div>
      </div>
      {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Statistics Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={BookOpen}
          title="Modules Completed"
          value={`${completedModules}/${totalModules}`}
          subtitle={totalModules > 0 ? `${Math.round((completedModules / totalModules) * 100)}% completed` : ""}
          color="blue"
        />
        <StatCard
          icon={Clock}
          title="Study Hours"
          value={`${studyHours}h`}
          subtitle="This month"
          color="green"
        />
        <StatCard
          icon={Award}
          title="Average Score"
          value={`${averageScore}%`}
          subtitle="All assessments"
          color="purple"
        />
        <StatCard
          icon={Activity}
          title="Learning Streak"
          value={`${learningStreak} days`}
          subtitle="Keep it up!"
          color="orange"
        />
      </div>

      {/* Study Habits Summary */}
      <div className="bg-white p-6 rounded-2xl shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Study Habits</h3>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {(studyHabits?.categories || []).length > 0 ? (
            studyHabits.categories.map((cat, idx) => (
              <span key={idx} className="px-3 py-1 text-sm rounded-full bg-blue-50 text-blue-700 border border-blue-200">{cat}</span>
            ))
          ) : (
            <span className="text-gray-500">No habits detected yet</span>
          )}
        </div>
        {/* Habits mini chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
          <div className="col-span-1 flex flex-col justify-between">
            <div className="text-sm text-gray-600 mb-3">
              <span className="block mb-1">Flashcards (7d): <strong>{studyHabits?.weeklyFlashcardCount ?? 0} cards</strong></span>
              <span>Learn Together (7d): <strong>{(weeklySessionHours ?? studyHabits?.weeklySessionHours ?? 0)}h</strong></span>
            </div>
            {studyHabits?.suggestions && studyHabits.suggestions.length > 0 && (
              <ul className="mt-1 list-disc list-inside text-xs text-gray-600 space-y-1">
                {studyHabits.suggestions.slice(0,2).map((s, i) => (
                  <li key={i}>{s.replace('30 minutes', '10 flashcards').replace('flashcards for at least', 'new flashcards (target:').replace('this week to strengthen recall.', ' this week)')}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="lg:col-span-2 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: 'Flashcards', value: studyHabits?.weeklyFlashcardCount ?? 0, type: 'cards' },
                  { name: 'Learn Together', value: (weeklySessionHours ?? studyHabits?.weeklySessionHours ?? 0), type: 'hours' }
                ]}
                margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#6b7280" />
                <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                <Tooltip
                  formatter={(val, label, props) => {
                    const unit = props.payload.type === 'cards' ? 'cards' : 'hours';
                    return [`${val} ${unit}`, label];
                  }}
                  contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="value" radius={[6,6,0,0]}>
                  <Cell fill="#2563eb" />
                  <Cell fill="#10b981" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <h4 className="font-semibold text-green-700 mb-2">Strength</h4>
          {strengths && strengths.length > 0 ? (
            <span className="text-lg font-bold">{strengths[0].subject} ({strengths[0].score}%)</span>
          ) : (
            <span className="text-gray-500">No strengths yet</span>
          )}
        </div>
        <div className="bg-red-50 p-4 rounded-lg text-center">
          <h4 className="font-semibold text-red-700 mb-2">Weakness</h4>
          {weaknesses && weaknesses.length > 0 ? (
            <span className="text-lg font-bold">{weaknesses[0].subject} ({weaknesses[0].score}%)</span>
          ) : (
            <span className="text-gray-500">No weaknesses yet</span>
          )}
        </div>
      </div>

      {/* Weekly Progress Chart - now full width and more detailed */}
      <div className="bg-white p-6 rounded-2xl shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
          Weekly Progress
        </h3>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={weeklyProgress} margin={{ top: 20, right: 40, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" stroke="#666" tick={{ fontSize: 13 }} />
            <YAxis stroke="#666" tick={{ fontSize: 13 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
              formatter={(value, name) => name === 'hours' ? [`${value} hrs`, 'Study Hours'] : [`${value}%`, 'Average Score']}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" />
            <Line
              type="monotone"
              dataKey="hours"
              stroke="#3B82F6"
              strokeWidth={3}
              dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
              name="Study Hours"
              label={{ position: 'top', fill: '#3B82F6', fontSize: 12, formatter: v => `${v}h` }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#10B981"
              strokeWidth={3}
              dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }}
              name="Average Score"
              label={{ position: 'top', fill: '#10B981', fontSize: 12, formatter: v => `${v}%` }}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex justify-end mt-2 text-sm text-gray-500">
          <span>Shows the last 7 days of your study hours and average score.</span>
        </div>
      </div>

      {/* Detailed Performance Metrics */}
      <div className="bg-white p-6 rounded-2xl shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Detailed Performance Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">
              {detailedMetrics.totalQuestions}
            </p>
            <p className="text-sm text-gray-600">Total Questions Answered</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">
              {detailedMetrics.correctAnswers}
            </p>
            <p className="text-sm text-gray-600">Correct Answers</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">
              {detailedMetrics.accuracy}%
            </p>
            <p className="text-sm text-gray-600">Overall Accuracy</p>
          </div>
        </div>
      </div>

      {/* Subject Performance Bar Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Subject Performance Breakdown
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={assessmentResults}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="module" stroke="#666" />
            <YAxis stroke="#666" />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="score" radius={[4, 4, 0, 0]}>
              {assessmentResults.map((entry, idx) => (
                <Cell key={`bar-cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex justify-between mt-4">
          <span className="text-sm text-gray-600">Pre-tests taken: {preTestCount}</span>
          <span className="text-sm text-gray-600">Post-tests taken: {postTestCount}</span>
        </div>
      </div>
    </div>
  );
};

export default StatisticsOverview;
