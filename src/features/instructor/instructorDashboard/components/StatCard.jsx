const StatCard = ({ title, value, isLoading }) => {
  return (
    <div className="card text-center">
      <h3 className="text-lg font-semibold text-gray-500 mb-2">{title}</h3>
      <p className="text-4xl font-bold text-primary-dark">
        {isLoading ? "..." : value}
      </p>
    </div>
  );
};

export default StatCard;
