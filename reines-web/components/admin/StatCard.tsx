interface StatCardProps {
  label:    string;
  value:    string | number;
  icon:     React.ReactNode;
  accent?:  string;
}

export default function StatCard({ label, value, icon, accent = "bg-zinc-100 text-zinc-500" }: StatCardProps) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 sm:gap-4 sm:p-5">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 ${accent}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="min-w-0 break-words text-lg font-bold tabular-nums leading-tight text-[#2d4a6b] sm:text-xl lg:text-2xl">
          {value}
        </p>
        <p className="text-xs text-zinc-500 sm:text-sm">{label}</p>
      </div>
    </div>
  );
}
