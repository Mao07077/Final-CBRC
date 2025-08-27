import SurveyForm from "../../features/survey/components/SurveyForm";

const SurveyPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <header className="max-w-2xl mx-auto mb-6 text-center">
        <img src="/cbrc_logo.png" alt="CBRC Logo" className="h-12 mx-auto mb-4" />
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          CBRC Review Center Survey
        </h1>
      </header>
      <main className="max-w-2xl mx-auto">
        <SurveyForm />
      </main>
    </div>
  );
};

export default SurveyPage;
