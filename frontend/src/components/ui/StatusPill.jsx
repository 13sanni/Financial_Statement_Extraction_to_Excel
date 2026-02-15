const labels = {
  completed: "Completed",
  processing: "Processing",
  review: "Needs Review",
};

const classes = {
  completed: "bg-white/15 text-white",
  processing: "bg-slate-500/30 text-slate-100",
  review: "bg-slate-700 text-slate-100",
};

function StatusPill({ status }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${classes[status]}`}>
      {labels[status]}
    </span>
  );
}

export default StatusPill;
