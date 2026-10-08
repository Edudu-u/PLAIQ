import { useCallback, useEffect, useMemo, useState } from "react";
import { getCoachingSummary } from "./lib/api";
import type {
  CoachingGoal,
  CoachingInsight,
  CoachingMetric,
  CoachingSummary,
  RiotProfile,
} from "./types/coaching";

type CoachingViewProps = {
  clientId: string;
  profile: RiotProfile | null;
};

function formatMetric(metric: CoachingMetric): string {
  if (metric.key === "damage_per_minute") {
    return metric.value.toLocaleString("es-CL");
  }
  if (metric.value % 1 === 0) return String(metric.value);
  return metric.value.toFixed(metric.key === "average_kda" ? 2 : 2);
}

function trendLabel(metric: CoachingMetric): string | null {
  if (metric.delta == null || metric.delta === 0) return null;

  const improving =
    metric.direction === "lower"
      ? metric.delta < 0
      : metric.direction === "higher"
        ? metric.delta > 0
        : false;

  return (improving ? "↗" : "↘") + " " + Math.abs(metric.delta).toFixed(2);
}

function goalProgress(goal: CoachingGoal): number {
  if (goal.completed) return 100;
  if (goal.metric === "average_deaths") {
    return Math.max(
      0,
      Math.min(99, Math.round((goal.target / Math.max(goal.current, 0.1)) * 100)),
    );
  }

  return Math.max(
    0,
    Math.min(99, Math.round((goal.current / Math.max(goal.target, 0.1)) * 100)),
  );
}

function InsightIcon({ severity }: { severity: CoachingInsight["severity"] }) {
  return (
    <span className={"coach-insight-icon " + severity} aria-hidden="true">
      {severity === "critical" ? "!" : severity === "attention" ? "!" : "✓"}
    </span>
  );
}

export function CoachingView({ clientId, profile }: CoachingViewProps) {
  const [summary, setSummary] = useState<CoachingSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile) {
      setSummary(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = await getCoachingSummary(clientId, profile.id, 20);
      setSummary(payload);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "No se pudo calcular el coaching.",
      );
    } finally {
      setLoading(false);
    }
  }, [clientId, profile]);

  useEffect(() => {
    void load();
  }, [load]);

  const criticalCount = useMemo(
    () => summary?.insights.filter((item) => item.severity === "critical").length ?? 0,
    [summary],
  );

  if (!profile) {
    return (
      <section className="coach-empty">
        <div className="coach-empty-mark">AI</div>
        <span className="eyebrow">Coaching personalizado</span>
        <h1>Conecta un perfil antes de analizar.</h1>
        <p>
          El sistema no genera consejos genéricos. Necesita partidas reales
          asociadas a un perfil para construir un diagnóstico.
        </p>
      </section>
    );
  }

  return (
    <>
      <header className="topbar coach-topbar">
        <div>
          <span className="eyebrow">Entrenamiento basado en datos</span>
          <h1>Coaching</h1>
        </div>
        <div className="coach-header-actions">
          <span className="coach-data-badge">
            Match-v5 · últimas {summary?.sampleSize ?? 20}
          </span>
          <button
            className="ghost-button"
            type="button"
            disabled={loading}
            onClick={() => void load()}
          >
            {loading ? "Analizando…" : "Actualizar análisis"}
          </button>
        </div>
      </header>

      {error && <p className="lookup-message">{error}</p>}

      {loading && !summary ? (
        <section className="coach-loading">
          <div className="coach-loading-core" />
          <div>
            <span className="eyebrow">Analizando partidas</span>
            <h2>Buscando patrones medibles…</h2>
            <p>El coach calcula las métricas antes de redactar cualquier recomendación.</p>
          </div>
        </section>
      ) : summary ? (
        <div className="coaching-dashboard">
          <section className="coach-hero-card">
            <div className="coach-player-badge">
              {profile.profileIconUrl ? (
                <img src={profile.profileIconUrl} alt="" />
              ) : (
                <span>{profile.gameName.slice(0, 1).toUpperCase()}</span>
              )}
            </div>
            <div className="coach-hero-copy">
              <span className="eyebrow">
                {summary.player.region} · {summary.player.primaryRole}
              </span>
              <h2>{summary.player.riotId}</h2>
              <p>{summary.coachMessage}</p>
            </div>
            <div className="coach-focus">
              <span className="eyebrow">Foco prioritario</span>
              <strong>{summary.focus}</strong>
              <small>{summary.sampleSize} ranked analizadas</small>
            </div>
          </section>

          <section className="coach-metric-grid">
            {summary.metrics.map((metric) => (
              <article className="coach-metric-card" key={metric.key}>
                <span className="eyebrow">{metric.label}</span>
                <div className="coach-metric-value">
                  <strong>{formatMetric(metric)}</strong>
                  {metric.unit && <small>{metric.unit}</small>}
                </div>
                {trendLabel(metric) && (
                  <span
                    className={
                      "coach-trend " +
                      (metric.direction === "lower"
                        ? metric.delta! < 0
                          ? "good"
                          : "bad"
                        : metric.delta! > 0
                          ? "good"
                          : "bad")
                    }
                  >
                    {trendLabel(metric)}
                  </span>
                )}
                {metric.delta == null && (
                  <span className="coach-trend neutral">sin comparación</span>
                )}
              </article>
            ))}
          </section>

          <div className="coach-main-grid">
            <section className="coach-panel">
              <div className="section-heading compact">
                <div>
                  <span className="eyebrow">Diagnóstico</span>
                  <h2>Lo que importa ahora</h2>
                </div>
                {criticalCount > 0 && (
                  <span className="coach-alert-count">
                    {criticalCount} crítico
                  </span>
                )}
              </div>

              <div className="coach-insight-list">
                {summary.insights.map((item) => (
                  <article
                    className={"coach-insight " + item.severity}
                    key={item.title}
                  >
                    <InsightIcon severity={item.severity} />
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.evidence}</p>
                      <span>{item.recommendation}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="coach-panel">
              <div className="section-heading compact">
                <div>
                  <span className="eyebrow">Objetivos</span>
                  <h2>Próximo bloque</h2>
                </div>
                <span>{summary.goals.filter((goal) => goal.completed).length}/{summary.goals.length}</span>
              </div>

              <div className="coach-goal-list">
                {summary.goals.length === 0 ? (
                  <div className="empty-state">
                    Aún no hay objetivos porque falta muestra suficiente.
                  </div>
                ) : (
                  summary.goals.map((goal) => (
                    <article
                      className={"coach-goal " + (goal.completed ? "complete" : "")}
                      key={goal.id}
                    >
                      <div className="coach-goal-head">
                        <strong>{goal.title}</strong>
                        <span>
                          {goal.completed
                            ? "✓"
                            : Math.round(goalProgress(goal)) + "%"}
                        </span>
                      </div>
                      <div className="coach-goal-track">
                        <div
                          className="coach-goal-value"
                          style={{ width: goalProgress(goal) + "%" }}
                        />
                      </div>
                      <small>
                        {goal.current.toFixed(goal.unit.includes("min") ? 2 : 1)} /{" "}
                        {goal.target.toFixed(goal.unit.includes("min") ? 2 : 1)}{" "}
                        {goal.unit}
                      </small>
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>

          <section className="coach-methodology">
            <span className="eyebrow">Cómo decide PLAIQ</span>
            <div>
              <strong>Datos primero. IA después.</strong>
              <p>
                Esta versión calcula las métricas de forma determinista a partir
                de Match-v5. Las referencias por rol son heurísticas transparentes;
                no son MMR, ELO ni una clasificación alternativa.
              </p>
            </div>
            <span className="coach-version">
              {summary.analysisVersion}
            </span>
          </section>
        </div>
      ) : null}
    </>
  );
}
