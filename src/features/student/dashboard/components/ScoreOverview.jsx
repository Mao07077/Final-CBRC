import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, CheckCircle, AlertCircle } from "lucide-react";
import useDashboardStore from "../../../../store/student/dashboardStore";

const ScoreOverview = () => {
  const { preTests, postTests } = useDashboardStore();

  // Calculate statistics
  const totalTests = (preTests?.length || 0) + (postTests?.length || 0);
  const preTestScores =
    preTests?.map((test) => ({
      name: test.pre_test_title ? test.pre_test_title.substring(0, 20) + "..." : "Pre-test",
      score: Math.round((test.correct / (test.total_questions || 1)) * 100),
      type: "Pre-test",
    })) || [];

  const postTestScores =
    postTests?.map((test) => ({
      name: test.post_test_title ? test.post_test_title.substring(0, 20) + "..." : "Post-test",
      score: Math.round((test.correct / (test.total_questions || 1)) * 100),
      type: "Post-test",
    })) || [];

  const allScores = [...preTestScores, ...postTestScores];
  const averageScore =
    allScores.length > 0
      ? Math.round(
          allScores.reduce((sum, test) => sum + test.score, 0) /
            allScores.length
        )
      : 0;

  const improvementRate =
    preTestScores.length > 0 && postTestScores.length > 0
      ? Math.round(
          postTestScores.reduce((sum, test) => sum + test.score, 0) /
            postTestScores.length -
            preTestScores.reduce((sum, test) => sum + test.score, 0) /
              preTestScores.length
        )
      : 0;

  return null;
};

export default ScoreOverview;
