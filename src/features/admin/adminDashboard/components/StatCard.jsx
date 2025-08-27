const StatCard = ({ title, value, isLoading }) => {
  return (
        <div className="card">
      <h3 className="text-gray-500 text-sm font-medium uppercase">{title}</h3>
      <p className="text-3xl font-bold text-primary-dark mt-2">
        {isLoading ? "..." : value}
      </p>
    </div>
  );
};

export default StatCard;
