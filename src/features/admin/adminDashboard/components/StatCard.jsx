const colorStyles = {
  indigo: { header: "text-indigo-600", glow: "from-indigo-50 to-white border-indigo-200" },
  emerald: { header: "text-emerald-600", glow: "from-emerald-50 to-white border-emerald-200" },
  sky: { header: "text-sky-600", glow: "from-sky-50 to-white border-sky-200" },
  amber: { header: "text-amber-600", glow: "from-amber-50 to-white border-amber-200" },
  fuchsia: { header: "text-fuchsia-600", glow: "from-fuchsia-50 to-white border-fuchsia-200" },
  slate: { header: "text-slate-600", glow: "from-slate-50 to-white border-slate-200" },
};

const StatCard = ({ title, value, isLoading, color = "slate", icon: Icon = null }) => {
  const c = colorStyles[color] || colorStyles.slate;
  return (
    <div className={`p-5 rounded-xl bg-gradient-to-br ${c.glow} border shadow-sm`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className={`text-xs font-semibold uppercase tracking-wide ${c.header}`}>{title}</h3>
        {Icon && (
          <div className={`p-2 rounded-md ${c.header} bg-white/70`}>
            <Icon size={18} />
          </div>
        )}
      </div>
      <p className="text-3xl md:text-4xl font-extrabold text-gray-800">{isLoading ? "..." : value}</p>
    </div>
  );
};

export default StatCard;
