import { useCallback, useEffect, useMemo, useState } from "react";
import {
  generateAiCoaching,
  getCoachingSummary,
  getLatestAiCoaching,
  getProfileMatches,
  getMatchTimeline,
  getSkillModel,
  syncMatchTimeline,
  type CoachAiAnalysis,
} from "./lib/api";
import type {
  CoachingGoal,
  CoachingInsight,
  CoachingMetric,
  CoachingSummary,
  RiotProfile,
  SkillModel,
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
  const [aiAnalysis, setAiAnalysis] = useState<CoachAiAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [skillModel, setSkillModel] = useState<SkillModel | null>(null);
  const [skillModelLoading, setSkillModelLoading] = useState(false);
  const [timelineBatchLoading, setTimelineBatchLoading] = useState(false);
  const [timelineBatchProgress, setTimelineBatchProgress] = useState("");
  const [timelineBatchError, setTimelineBatchError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!profile) {
      setAiAnalysis(null);
      return;
    }

    let cancelled = false;
    void getLatestAiCoaching(clientId, profile.id)
      .then((payload) => {
        if (!cancelled) setAiAnalysis(payload);
      })
      .catch(() => {
        // AI is optional; deterministic coaching remains available.
      });

    return () => {
      cancelled = true;
    };
  }, [clientId, profile]);


  useEffect(() => {
    if (!profile) {
      setSkillModel(null);
      return;
    }

    let cancelled = false;
    setSkillModelLoading(true);
    void getSkillModel(clientId, profile.id, 20)
      .then((payload) => {
        if (!cancelled) setSkillModel(payload);
      })
      .catch(() => {
        if (!cancelled) setSkillModel(null);
      })
      .finally(() => {
        if (!cancelled) setSkillModelLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [clientId, profile]);

  async function handleSyncRecentTimelines() {
    if (!profile) return;

    setTimelineBatchLoading(true);
    setTimelineBatchError(null);
    setTimelineBatchProgress("Buscando partidas Ranked recientes…");

    let processed = 0;
    let skipped = 0;
    let failed = 0;

    try {
      const matches = (await getProfileMatches(clientId, profile.id, 100))
        .filter((match) => match.queueId === 420)
        .slice(0, 30);

      for (let index = 0; index < matches.length && processed < 5; index += 1) {
        const match = matches[index];
        setTimelineBatchProgress(
          `Revisando ${index + 1}/${matches.length} · timelines nuevos ${processed}/5`,
        );

        try {
          const current = await getMatchTimeline(clientId, profile.id, match.id);
          if (current.synced) {
            skipped += 1;
            continue;
          }

          const synced = await syncMatchTimeline(clientId, profile.id, match.id);
          if (synced.synced) {
            processed += 1;
          } else {
            failed += 1;
          }
        } catch {
          failed += 1;
        }
      }

      const nextModel = await getSkillModel(clientId, profile.id, 20);
      setSkillModel(nextModel);
      setTimelineBatchProgress(
        `Timelines nuevos: ${processed} · ya disponibles: ${skipped} · no disponibles/error: ${failed}`,
      );
    } catch (caught) {
      setTimelineBatchError(
        caught instanceof Error
          ? caught.message
          : "No se pudieron sincronizar los timelines.",
      );
    } finally {
      setTimelineBatchLoading(false);
      setSkillModelLoading(false);
    }
  }

  async function handleGenerateAi() {
    if (!profile) return;

    setAiLoading(true);
    setAiError(null);

    try {
      const result = await generateAiCoaching(clientId, profile.id, 20);
      setAiAnalysis(result);
    } catch (caught) {
      setAiError(
        caught instanceof Error
          ? caught.message
          : "No se pudo generar el coaching IA.",
      );
    } finally {
      setAiLoading(false);
    }
  }

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

          <section className="coach-panel coach-champions-panel">
            <div className="section-heading compact">
              <div>
                <span className="eyebrow">Rendimiento</span>
                <h2>Tu pool reciente</h2>
              </div>
              <span>{summary.champions.length} campeones</span>
            </div>

            {summary.champions.length === 0 ? (
              <div className="empty-state">No hay suficiente información por campeón.</div>
            ) : (
              <div className="coach-champion-table">
                {summary.champions.map((champion) => (
                  <article className="coach-champion-row" key={champion.championName}>
                    <div>
                      <strong>{champion.championName}</strong>
                      <small>{champion.games} partidas · {champion.winRate.toFixed(1)}% WR</small>
                    </div>
                    <div>
                      <span>CS/min <b>{champion.csPerMinute.toFixed(2)}</b></span>
                      <span>Muertes <b>{champion.averageDeaths.toFixed(1)}</b></span>
                      <span>Daño/min <b>{champion.damagePerMinute.toLocaleString("es-CL")}</b></span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="coach-skill-panel">
            <header className="coach-skill-header">
              <div>
                <span className="eyebrow">Skill model · Match-V5 Timeline</span>
                <h2>Perfil de habilidades</h2>
                <p>
                  Puntuaciones heurísticas de 0 a 100; no son MMR ni una
                  predicción de rango. Solo se incluyen partidas con timeline disponible.
                </p>
              </div>
              <button
                className="primary-button coach-skill-sync"
                type="button"
                disabled={timelineBatchLoading || !profile}
                onClick={() => void handleSyncRecentTimelines()}
              >
                {timelineBatchLoading ? "Procesando…" : "Sincronizar hasta 5 timelines"}
              </button>
            </header>

            {timelineBatchError && (
              <p className="lookup-message">{timelineBatchError}</p>
            )}
            {timelineBatchProgress && (
              <p className="coach-skill-progress">{timelineBatchProgress}</p>
            )}

            {skillModelLoading && !skillModel ? (
              <div className="empty-state">Calculando habilidades a partir de timelines guardados…</div>
            ) : skillModel ? (
              <>
                <div className="coach-skill-coverage">
                  <div>
                    <span className="eyebrow">Cobertura de timeline</span>
                    <strong>
                      {skillModel.sampleSize}/{skillModel.requestedMatches}
                    </strong>
                  </div>
                  <div className="coach-skill-coverage-track">
                    <div style={{ width: skillModel.coveragePercent + "%" }} />
                  </div>
                  <small>{skillModel.coveragePercent}% de las últimas ranked del rol {skillModel.role}</small>
                </div>

                <div className="coach-skill-grid">
                  {skillModel.dimensions.map((dimension) => (
                    <article className="coach-skill-dimension" key={dimension.key}>
                      <div className="coach-skill-dimension-head">
                        <span>{dimension.label}</span>
                        <strong>
                          {dimension.score == null
                            ? "N/D"
                            : Math.round(dimension.score)}
                        </strong>
                      </div>
                      <div className="coach-skill-track">
                        <div
                          className={dimension.score == null ? "unavailable" : ""}
                          style={{
                            width: dimension.score == null
                              ? "0%"
                              : Math.max(0, Math.min(100, dimension.score)) + "%",
                          }}
                        />
                      </div>
                      <p>{dimension.explanation}</p>
                      <small>
                        {dimension.sampleSize} partidas con dato
                        {dimension.deltaVsPreviousBlock == null
                          ? ""
                          : " · " +
                            (dimension.deltaVsPreviousBlock > 0 ? "+" : "") +
                            dimension.deltaVsPreviousBlock +
                            " vs bloque anterior"}
                      </small>
                    </article>
                  ))}
                </div>

                {skillModel.sampleSize === 0 && (
                  <p className="coach-skill-empty">
                    Todavía no hay timelines sincronizados para estas partidas.
                    Usa el botón para importar hasta cinco por tanda; si Riot no
                    tiene timeline disponible para una partida, no se inventará.
                  </p>
                )}
                <small className="coach-skill-version">
                  Actualizado {new Date(skillModel.generatedAt).toLocaleString("es-CL")}
                  {" · "}calculado localmente por API-PLAIQ
                </small>
              </>
            ) : (
              <p className="coach-skill-empty">
                No se pudo obtener el skill model. Comprueba que la API y la base
                de datos estén disponibles.
              </p>
            )}
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

          <section className="coach-ai-panel">
            <div className="coach-ai-header">
              <div>
                <span className="eyebrow">Coach IA</span>
                <h2>
                  {aiAnalysis
                    ? aiAnalysis.narrative.headline
                    : "Convierte el diagnóstico en un plan"}
                </h2>
              </div>
              <button
                className="primary-button coach-ai-button"
                type="button"
                onClick={() => void handleGenerateAi()}
                disabled={aiLoading || summary.sampleSize < 5}
              >
                {aiLoading
                  ? "Generando…"
                  : aiAnalysis
                    ? "Regenerar plan"
                    : "Generar plan IA"}
              </button>
            </div>

            {aiError && <p className="lookup-message">{aiError}</p>}

            {!aiAnalysis ? (
              <div className="coach-ai-empty">
                <p>
                  La IA no sustituye las métricas. Recibe el diagnóstico
                  determinista y lo transforma en un plan de entrenamiento
                  estructurado y verificable.
                </p>
                <small>
                  Requiere al menos 5 partidas y OPENAI_API_KEY configurada en
                  API-PLAIQ.
                </small>
              </div>
            ) : (
              <>
                <p className="coach-ai-summary">{aiAnalysis.narrative.summary}</p>

                <div className="coach-ai-columns">
                  <div>
                    <span className="eyebrow">Fortalezas</span>
                    <div className="coach-ai-list">
                      {aiAnalysis.narrative.strengths.map((item) => (
                        <article key={item.title}>
                                                    <strong>{item.title}</strong>
                          <small className="coach-ai-metric">{item.metricKey}</small>
                          <span>{item.evidence}</span>
                        </article>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="eyebrow">Debilidades</span>
                    <div className="coach-ai-list">
                      {aiAnalysis.narrative.weaknesses.map((item) => (
                        <article key={item.title}>
                                                    <strong>{item.title}</strong>
                          <small className="coach-ai-metric">{item.metricKey}</small>
                          <span>{item.evidence}</span>
                          <small>{item.impact}</small>
                        </article>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="coach-ai-actions">
                  <span className="eyebrow">Plan del próximo bloque</span>
                  <div className="coach-ai-plan">
                    {aiAnalysis.narrative.actionPlan.map((item, index) => (
                      <article key={item.title}>
                                                <strong>
                          {String(index + 1).padStart(2, "0")} · {item.title}
                        </strong>
                        <small className="coach-ai-metric">{item.metricKey}</small>
                        <p>{item.reason}</p>
                        <span>{item.measurable}</span>
                      </article>
                    ))}
                  </div>
                </div>

                {aiAnalysis.narrative.limitations.length > 0 && (
                  <div className="coach-ai-limitations">
                    <span className="eyebrow">
                      Confianza {aiAnalysis.narrative.confidence}
                    </span>
                    <p>{aiAnalysis.narrative.limitations.join(" · ")}</p>
                  </div>
                )}

                <div className="coach-ai-meta">
                  <span>
                    {aiAnalysis.cached ? "Resultado en caché" : "Nuevo análisis"}
                  </span>
                  <span>·</span>
                  <span>{aiAnalysis.sampleSize} partidas</span>
                  <span>·</span>
                  <span>{aiAnalysis.model}</span>
                  <span>·</span>
                  <span>{new Date(aiAnalysis.createdAt).toLocaleString("es-CL")}</span>
                </div>
              </>
            )}
          </section>

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
