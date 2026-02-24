import { Link } from "react-router-dom";

const apps = [
  { path: "/reps", title: "Reps Tracker", desc: "Track exercises by workout tab and quickly adjust reps." },
  { path: "/wakeup", title: "Wake-up Tracker", desc: "Log wake-up times and inspect trends by month/year." },
  { path: "/weight", title: "Weight Tracker", desc: "Track weight entries with moving average and linear trend." },
  { path: "/routine", title: "Daily Routine", desc: "Stopwatch + daily tasks with countdown completion timers." },
];

export function HomePage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Mini-App Hub</h1>
      <p className="text-slate-600 dark:text-slate-300">
        Choose a tracker. Everything is mobile-friendly and synced through FastAPI services.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {apps.map((app) => (
          <Link
            key={app.path}
            to={app.path}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
          >
            <h2 className="text-lg font-semibold">{app.title}</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{app.desc}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
