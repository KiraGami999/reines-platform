interface StatCardProps {
  label:    string;
  value:    string | number;
  icon:     React.ReactNode;
  accent?:  string;
}

export default function StatCard({ label, value, icon, accent = "bg-[#8fb9e8]/10 text-[#8fb9e8]" }: StatCardProps) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 ${accent}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-[#2d4a6b] sm:text-2xl">{value}</p>
        <p className="text-xs leading-tight text-zinc-500 sm:text-sm">{label}</p>
      </div>
    </div>
  );
}
