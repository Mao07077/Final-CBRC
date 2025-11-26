import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import moduleService from "../../services/moduleService";
import useAuthStore from "../../store/authStore";
import useDashboardStore from "../../store/student/dashboardStore";
import PresenceCheckModal from "../../components/common/PresenceCheckModal";

const PostTestPage = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { userData } = useAuthStore();
  const refreshDashboard = useDashboardStore(s => s.fetchDashboardData);

  const [postTest, setPostTest] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAllCompleteModal, setShowAllCompleteModal] = useState(false);
  const [pendingResults, setPendingResults] = useState(null);

  // Timing & presence
  const startTimeRef = useRef(Date.now());
  const pausedAccumRef = useRef(0);
  const pauseStartRef = useRef(null);
  const [presenceOpen, setPresenceOpen] = useState(false);

  // Fetch post-test
  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const post = await moduleService.getPostTest(moduleId);
        if (!post || !post.questions) throw new Error("No post-test found");
        setPostTest(post);
      } catch (e) {
        console.error(e);
        setError("Failed to load post-test. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [moduleId]);

  const handleAnswerSelect = (idx, answer) => {
    setAnswers(prev => ({ ...prev, [idx]: answer }));
  };
  const handleNext = () => {
    if (!postTest) return;
    if (currentQuestion < postTest.questions.length - 1) setCurrentQuestion(q => q + 1);
  };
  const handlePrevious = () => {
    if (currentQuestion > 0) setCurrentQuestion(q => q - 1);
  };

  const effectiveElapsedSeconds = () => {
    const now = Date.now();
    const currentPause = pauseStartRef.current ? (now - pauseStartRef.current) : 0;
    const elapsedMs = (now - startTimeRef.current) - (pausedAccumRef.current + currentPause);
    return Math.max(0, Math.floor(elapsedMs / 1000));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const timeSpent = effectiveElapsedSeconds();
      const response = await moduleService.submitPostTest(moduleId, answers, userData.id_number, timeSpent);
      await refreshDashboard();
      let all;
      try { all = await moduleService.getAllModulesCompletedStatus(userData.id_number); } catch (_) {}
      const payload = {
        results: {
          correct: response.correct,
          incorrect: response.incorrect,
          total_questions: response.total_questions,
          time_spent: timeSpent
        },
        moduleTitle: response.module_title || (postTest?.title || "Post-Test"),
        moduleId
      };
      if (all && all.allModulesCompleted) {
        setPendingResults(payload);
        setShowAllCompleteModal(true);
      } else {
        navigate("/post-test-results", { state: payload });
      }
    } catch (e) {
      console.error(e);
      setError("Failed to submit post-test. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Activity-driven inactivity detection: start counting when no activity, reset on activity
  useEffect(() => {
    if (!true) {} // keep hook order consistent
    const lastActivityRef = { current: Date.now() };

    const onActivity = () => {
      lastActivityRef.current = Date.now();
      // Do NOT auto-dismiss the presence modal on activity.
      // Continue must be pressed to resume.
    };

    const checker = setInterval(() => {
      if (presenceOpen) return;
      const now = Date.now();
      if (now - lastActivityRef.current >= 600000) { // 10 seconds
        pauseStartRef.current = Date.now();
        setPresenceOpen(true);
      }
    }, 1000);

    window.addEventListener('mousemove', onActivity);
    window.addEventListener('mousedown', onActivity);
    window.addEventListener('keydown', onActivity);
    window.addEventListener('touchstart', onActivity);
    window.addEventListener('wheel', onActivity);

    return () => {
      clearInterval(checker);
      window.removeEventListener('mousemove', onActivity);
      window.removeEventListener('mousedown', onActivity);
      window.removeEventListener('keydown', onActivity);
      window.removeEventListener('touchstart', onActivity);
      window.removeEventListener('wheel', onActivity);
    };
  }, [presenceOpen]);

  const confirmPresence = () => {
    if (pauseStartRef.current) {
      pausedAccumRef.current += (Date.now() - pauseStartRef.current);
      pauseStartRef.current = null;
    }
    setPresenceOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mb-6" />
        <div className="text-lg text-primary-dark font-semibold">Loading post-test...</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-600 text-xl mb-4">{error}</div>
        <button onClick={() => navigate("/student/dashboard")} className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark">Back to Dashboard</button>
      </div>
    );
  }
  if (!postTest) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-gray-600 text-xl mb-4">No post-test available.</div>
        <button onClick={() => navigate("/student/dashboard")} className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark">Back to Dashboard</button>
      </div>
    );
  }

  const current = postTest.questions[currentQuestion];
  const isLast = currentQuestion === postTest.questions.length - 1;
  const allAnswered = postTest.questions.every((_, i) => answers.hasOwnProperty(i));

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary-dark mb-2">{postTest.title}</h1>
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>Question {currentQuestion + 1} of {postTest.questions.length}</span>
              <div className="w-64 bg-gray-200 rounded-full h-2">
                <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${((currentQuestion + 1) / postTest.questions.length) * 100}%` }} />
              </div>
              <PresenceCheckModal isOpen={presenceOpen} onConfirm={confirmPresence} />
            </div>
          </div>
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-6">{current.question}</h2>
            <div className="space-y-3">
              {current.options.map((opt, idx) => {
                const selected = answers[currentQuestion] === opt;
                return (
                  <label key={idx} className={`flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${selected ? "border-primary bg-primary-light" : "border-gray-200"}`}>
                    <input type="radio" name={`q-${currentQuestion}`} value={opt} checked={selected} onChange={() => handleAnswerSelect(currentQuestion, opt)} className="sr-only" />
                    <div className={`w-4 h-4 rounded-full border-2 mr-3 ${selected ? "border-primary bg-primary" : "border-gray-300"}`}>{selected && <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5" />}</div>
                    <span className="text-gray-700">{opt}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex justify-between gap-3">
              <button onClick={handlePrevious} disabled={currentQuestion === 0} className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
              {isLast ? (
                <button onClick={handleSubmit} disabled={!allAnswered || isSubmitting} className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSubmitting ? "Submitting..." : "Submit Test"}
                </button>
              ) : (
                <button onClick={handleNext} disabled={!answers.hasOwnProperty(currentQuestion)} className="px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto py-1 -mx-1 px-1">
              {postTest.questions.map((_, i) => {
                const visited = answers.hasOwnProperty(i);
                const active = i === currentQuestion;
                const cls = active ? "bg-primary text-white" : visited ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600";
                return (
                  <button key={i} onClick={() => setCurrentQuestion(i)} className={`flex-shrink-0 w-8 h-8 rounded-full text-sm ${cls}`}>{i + 1}</button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      {showAllCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Congratulations! 🎉</h2>
            <p className="text-gray-700">You've completed all modules. Press OK to reset and retake everything, or Cancel to keep your results and view this test's outcome.</p>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => { if (pendingResults) navigate("/post-test-results", { state: pendingResults }); setShowAllCompleteModal(false); }} className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300">Cancel</button>
              <button onClick={async () => { try { await moduleService.resetAllModules(userData.id_number); setShowAllCompleteModal(false); navigate("/student/dashboard"); } catch (e) { alert("Reset failed: " + (e && e.message)); } }} className="px-4 py-2 rounded bg-primary text-white hover:bg-primary-dark">OK Retake All</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostTestPage;
