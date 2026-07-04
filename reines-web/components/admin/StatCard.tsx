interface StatCardProps {
  label:    string;
  value:    string | number;
  icon:     React.ReactNode;
  accent?:  string;
}

export default function StatCard({ label, value, icon, accent = "bg-[#8fb9e8]/10 text-[#8fb9e8]" }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-3 sm:p-5 flex items-center gap-3 sm:gap-4">
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xl sm:text-2xl font-bold text-[#2d4a6b]">{value}</p>
        <p className="text-xs sm:text-sm text-zinc-500 truncate">{label}</p>
      </div>
    </div>
  );
}
