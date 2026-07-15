import { useEffect, useMemo, useState } from "react";
import { getCoachingSummary } from "./lib/api";
import type { CoachingSummary } from "./types/coaching";

function GoalCard({
  title,
  current,
  target,
  unit,
  completed,
}: CoachingSummary["goals"][number]) {
  const progress = Math.min(100, Math.round((current / Math.max(target, 1)) * 100));

  return (
    <article className="goal-card">
      <div className="goal-heading">
        <div>
          <span className="eyebrow">{completed ? "Completado" : "En progreso"}</span>
          <h3>{title}</h3>
        </div>
        <span className={completed ? "goal-state complete" : "goal-state"}>
          {completed ? "✓" : `${progress}%`}
        </span>
      </div>
      <div className="progress-track">
        <div
          className={completed ? "progress-value complete" : "progress-value"}
          style={{ width: `${completed ? 100 : progress}%` }}
        />
      </div>
      <p className="metric">
        <strong>{current}</strong> / {target} {unit}
      </p>
    </article>
  );
}

export function App() {
  const [summary, setSummary] = useState<CoachingSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    getCoachingSummary(controller.signal)
      .then(setSummary)
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError("No fue posible conectar con API-PLAIQ.");
      });

    return () => controller.abort();
  }, []);

  const completedGoals = useMemo(
    () => summary?.goals.filter((goal) => goal.completed).length ?? 0,
    [summary],
  );

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">P</span>
          <div>
            <strong>PLAIQ</strong>
            <small>Personal coaching</small>
          </div>
        </div>

        <nav>
          <button className="nav-item active">Resumen</button>
          <button className="nav-item">Objetivos</button>
          <button className="nav-item">Partidas</button>
          <button className="nav-item">Campeones</button>
        </nav>

        <div className="connection">
          <span className={error ? "status-dot offline" : "status-dot"} />
          {error ? "API desconectada" : "API conectada"}
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <span className="eyebrow">Tu sesión de entrenamiento</span>
            <h1>Juega con propósito.</h1>
          </div>
          <span className="role-badge">
            {summary?.player.primaryRole ?? "Cargando"}
          </span>
        </header>

        {error && <div className="notice">{error} Inicia el backend en el puerto 3000.</div>}

        {!summary ? (
          <section className="loading-card">Preparando tu plan de coaching…</section>
        ) : (
          <>
            <section className="hero-card">
              <div>
                <span className="eyebrow">Enfoque actual</span>
                <h2>{summary.focus}</h2>
                <p>{summary.coachMessage}</p>
              </div>
              <div className="player-card">
                <span>{summary.player.riotId}</span>
                <small>{summary.player.region}</small>
              </div>
            </section>

            <div className="section-heading">
              <div>
                <span className="eyebrow">Objetivos de hoy</span>
                <h2>Entrenamiento activo</h2>
              </div>
              <span>{completedGoals}/{summary.goals.length} completados</span>
            </div>

            <section className="goal-grid">
              {summary.goals.map((goal) => (
                <GoalCard key={goal.id} {...goal} />
              ))}
            </section>
          </>
        )}
      </section>
    </main>
  );
}
