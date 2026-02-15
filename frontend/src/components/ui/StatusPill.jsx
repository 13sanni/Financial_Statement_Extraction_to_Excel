const labels = {
  completed: "Completed",
  processing: "Processing",
  review: "Needs Review",
};

const classes = {
  completed: "bg-emerald-100 text-emerald-800",
  processing: "bg-blue-100 text-blue-800",
  review: "bg-amber-100 text-amber-800",
};

function StatusPill({ status }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${classes[status]}`}>
      {labels[status]}
    </span>
  );
}

export default StatusPill;
