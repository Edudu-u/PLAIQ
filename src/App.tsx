import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  getCoachingSummary,
  getProfileMatches,
  getRiotProfiles,
  getRiotSearchHistory,
  lookupRiotProfile,
  syncProfileMatches,
} from "./lib/api";
import { getClientId } from "./lib/client-id";
import type {
  AppView,
  CoachingSummary,
  MatchSummary,
  RiotProfile,
  RiotSearchHistory,
} from "./types/coaching";

const NAV_ITEMS: Array<{ id: AppView; label: string }> = [
  { id: "resumen", label: "Resumen" },
  { id: "perfiles", label: "Perfiles" },
  { id: "objetivos", label: "Objetivos" },
  { id: "partidas", label: "Partidas" },
];

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function formatRole(position: string | null): string {
  if (!position || position === "INVALID" || position === "NONE") {
    return "—";
  }

  const labels: Record<string, string> = {
    TOP: "Top",
    JUNGLE: "Jungla",
    MIDDLE: "Mid",
    BOTTOM: "ADC",
    UTILITY: "Support",
  };

  return labels[position] ?? position;
}

function GoalCard({
  title,
  current,
  target,
  unit,
  completed,
}: CoachingSummary["goals"][number]) {
  const progress = Math.min(
    100,
    Math.round((current / Math.max(target, 1)) * 100),
  );

  return (
    <article className={`goal-card ${completed ? "is-complete" : ""}`}>
      <div className="goal-heading">
        <div>
          <span className="eyebrow">
            {completed ? "Completado" : "En progreso"}
          </span>
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

function MatchRow({ match }: { match: MatchSummary }) {
  return (
    <article className={`match-row ${match.win ? "win" : "loss"}`}>
      <div className="match-result">
        <strong>{match.win ? "V" : "D"}</strong>
        <small>{formatDuration(match.gameDurationSeconds)}</small>
      </div>
      <div className="match-core">
        <strong>{match.championName}</strong>
        <small>
          {match.queueLabel} · {formatRole(match.teamPosition)}
          {match.patchVersion ? ` · ${match.patchVersion}` : ""}
        </small>
      </div>
      <div className="match-kda">
        <strong>
          {match.kills}/{match.deaths}/{match.assists}
        </strong>
        <small>
          {match.creepScore} CS · {match.visionScore} visión
        </small>
      </div>
      <time dateTime={match.gameCreation}>
        {new Date(match.gameCreation).toLocaleString("es-CL", {
          dateStyle: "short",
          timeStyle: "short",
        })}
      </time>
    </article>
  );
}

export function App() {
  const clientId = useMemo(() => getClientId(), []);
  const [view, setView] = useState<AppView>("resumen");
  const [summary, setSummary] = useState<CoachingSummary | null>(null);
  const [profiles, setProfiles] = useState<RiotProfile[]>([]);
  const [history, setHistory] = useState<RiotSearchHistory[]>([]);
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null,
  );
  const [gameName, setGameName] = useState("Jøy Đ Bøy");
  const [tagLine, setTagLine] = useState("NPM");
  const [platform, setPlatform] = useState("LA2");
  const [apiError, setApiError] = useState<string | null>(null);
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);
  const [matchMessage, setMatchMessage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const activeProfile = useMemo(
    () =>
      profiles.find((profile) => profile.id === selectedProfileId) ??
      profiles[0] ??
      null,
    [profiles, selectedProfileId],
  );

  async function refreshRiotData(): Promise<RiotProfile[]> {
    const [savedProfiles, searches] = await Promise.all([
      getRiotProfiles(clientId),
      getRiotSearchHistory(clientId),
    ]);

    setProfiles(savedProfiles);
    setHistory(searches);

    if (
      savedProfiles.length > 0 &&
      (!selectedProfileId ||
        !savedProfiles.some((profile) => profile.id === selectedProfileId))
    ) {
      setSelectedProfileId(savedProfiles[0].id);
    }

    return savedProfiles;
  }

  useEffect(() => {
    const controller = new AbortController();

    Promise.allSettled([
      getCoachingSummary(controller.signal),
      getRiotProfiles(clientId),
      getRiotSearchHistory(clientId),
    ]).then(([summaryResult, profilesResult, historyResult]) => {
      if (summaryResult.status === "fulfilled") {
        setSummary(summaryResult.value);
        setApiError(null);
      } else {
        setApiError("No fue posible conectar con API-PLAIQ.");
      }

      if (profilesResult.status === "fulfilled") {
        setProfiles(profilesResult.value);
        if (profilesResult.value[0]) {
          setSelectedProfileId(profilesResult.value[0].id);
        }
      }

      if (historyResult.status === "fulfilled") {
        setHistory(historyResult.value);
      }
    });

    return () => controller.abort();
  }, [clientId]);

  useEffect(() => {
    if (!activeProfile || view !== "partidas") {
      return;
    }

    const controller = new AbortController();

    getProfileMatches(clientId, activeProfile.id, 10)
      .then((list) => {
        if (!controller.signal.aborted) {
          setMatches(list);
          setMatchMessage(null);
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setMatchMessage(
            error instanceof Error
              ? error.message
              : "No fue posible cargar las partidas.",
          );
        }
      });

    return () => controller.abort();
  }, [activeProfile, clientId, view]);

  async function handleLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSearching(true);
    setLookupMessage(null);

    try {
      const profile = await lookupRiotProfile({
        clientId,
        gameName: gameName.trim(),
        tagLine: tagLine.trim().replace(/^#/, ""),
        platform,
      });

      setLookupMessage(`${profile.riotId} fue encontrado y guardado.`);
      setSelectedProfileId(profile.id);
      setApiError(null);
      await refreshRiotData();
    } catch (error) {
      setLookupMessage(
        error instanceof Error
          ? error.message
          : "No fue posible buscar el Riot ID.",
      );
    } finally {
      setIsSearching(false);
    }
  }

  async function handleSyncMatches() {
    if (!activeProfile) {
      setMatchMessage("Busca y guarda un perfil antes de sincronizar partidas.");
      return;
    }

    setIsSyncing(true);
    setMatchMessage(null);

    try {
      const result = await syncProfileMatches(clientId, activeProfile.id, 10);
      setMatches(result.matches);
      setMatchMessage(
        `Importadas ${result.imported} · omitidas ${result.skipped}.`,
      );
      setApiError(null);
    } catch (error) {
      setMatchMessage(
        error instanceof Error
          ? error.message
          : "No fue posible sincronizar las partidas.",
      );
    } finally {
      setIsSyncing(false);
    }
  }

  const completedGoals = useMemo(
    () => summary?.goals.filter((goal) => goal.completed).length ?? 0,
    [summary],
  );

  return (
    <main className="app-shell">
      <div className="atmosphere" aria-hidden="true" />

      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">P</span>
          <div>
            <strong>PLAIQ</strong>
            <small>Centro táctico</small>
          </div>
        </div>

        <nav>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={view === item.id ? "nav-item active" : "nav-item"}
              onClick={() => setView(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="connection">
          <span className={apiError ? "status-dot offline" : "status-dot"} />
          {apiError ? "API desconectada" : "API conectada"}
        </div>
      </aside>

      <section className="content">
        {apiError && (
          <div className="notice">
            {apiError} Inicia PostgreSQL y el backend en el puerto 3000.
          </div>
        )}

        {view === "resumen" && (
          <>
            <header className="hero-panel">
              <div>
                <p className="brand-hero">PLAIQ</p>
                <h1>Juega con propósito.</h1>
                <p className="hero-copy">
                  Coaching personalizado entre partidas: objetivos medibles,
                  progreso real y un plan para tu rol.
                </p>
              </div>
              <div className="hero-meta">
                <span className="role-badge">
                  {summary?.player.primaryRole ?? "ADC"}
                </span>
                <small>
                  {activeProfile?.riotId ??
                    summary?.player.riotId ??
                    "Sin perfil vinculado"}
                </small>
              </div>
            </header>

            {summary ? (
              <section className="focus-strip">
                <div>
                  <span className="eyebrow">Enfoque actual</span>
                  <h2>{summary.focus}</h2>
                  <p>{summary.coachMessage}</p>
                </div>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => setView("objetivos")}
                >
                  Ver objetivos
                </button>
              </section>
            ) : (
              <section className="loading-card">
                {apiError
                  ? "El coaching se cargará al conectar la API."
                  : "Preparando tu plan de coaching…"}
              </section>
            )}

            <section className="quick-grid">
              <button
                className="quick-card"
                type="button"
                onClick={() => setView("partidas")}
              >
                <span className="eyebrow">Siguiente paso</span>
                <strong>Sincroniza tus partidas</strong>
                <small>Match-v5 alimenta el diagnóstico postpartida.</small>
              </button>
              <button
                className="quick-card"
                type="button"
                onClick={() => setView("perfiles")}
              >
                <span className="eyebrow">Identidad</span>
                <strong>Vincula tu Riot ID</strong>
                <small>
                  {activeProfile
                    ? activeProfile.riotId
                    : "Ejemplo editable: Jøy Đ Bøy#NPM"}
                </small>
              </button>
            </section>
          </>
        )}

        {view === "perfiles" && (
          <>
            <header className="topbar">
              <div>
                <span className="eyebrow">Perfiles Riot</span>
                <h1>Identidad del jugador</h1>
              </div>
            </header>

            <section className="lookup-panel">
              <div className="lookup-copy">
                <h2>Busca y guarda un jugador</h2>
                <p>
                  El historial queda asociado a esta instalación hasta que
                  habilitemos cuentas por correo. El PUUID permanece solo en la
                  API.
                </p>
              </div>

              <form className="lookup-form" onSubmit={handleLookup}>
                <label>
                  Game Name
                  <input
                    value={gameName}
                    onChange={(event) => setGameName(event.target.value)}
                    maxLength={64}
                    required
                  />
                </label>
                <label className="tag-input">
                  Tag
                  <input
                    value={tagLine}
                    onChange={(event) => setTagLine(event.target.value)}
                    maxLength={16}
                    required
                  />
                </label>
                <label className="platform-input">
                  Región
                  <select
                    value={platform}
                    onChange={(event) => setPlatform(event.target.value)}
                  >
                    <option value="LA2">LAS</option>
                    <option value="LA1">LAN</option>
                    <option value="BR1">BR</option>
                    <option value="NA1">NA</option>
                  </select>
                </label>
                <button className="primary-button" disabled={isSearching}>
                  {isSearching ? "Buscando…" : "Buscar perfil"}
                </button>
              </form>

              {lookupMessage && (
                <p className="lookup-message">{lookupMessage}</p>
              )}
            </section>

            <section className="profile-layout">
              <div>
                <div className="section-heading compact">
                  <div>
                    <span className="eyebrow">Guardados</span>
                    <h2>Perfiles recientes</h2>
                  </div>
                  <span>{profiles.length} perfiles</span>
                </div>

                <div className="profile-list">
                  {profiles.length === 0 ? (
                    <div className="empty-state">
                      Todavía no hay perfiles guardados.
                    </div>
                  ) : (
                    profiles.slice(0, 8).map((profile) => (
                      <button
                        className={
                          activeProfile?.id === profile.id
                            ? "profile-row active"
                            : "profile-row"
                        }
                        key={profile.id}
                        type="button"
                        onClick={() => setSelectedProfileId(profile.id)}
                      >
                        <span className="profile-avatar">
                          {profile.gameName.slice(0, 1).toUpperCase()}
                        </span>
                        <div>
                          <strong>{profile.riotId}</strong>
                          <small>
                            {profile.platform} · Nivel{" "}
                            {profile.summonerLevel ?? "—"}
                          </small>
                        </div>
                        <span className="search-count">
                          {profile.searchCount}{" "}
                          {profile.searchCount === 1 ? "consulta" : "consultas"}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div>
                <div className="section-heading compact">
                  <div>
                    <span className="eyebrow">Actividad</span>
                    <h2>Historial</h2>
                  </div>
                </div>

                <div className="history-list">
                  {history.length === 0 ? (
                    <div className="empty-state">
                      No existen búsquedas todavía.
                    </div>
                  ) : (
                    history.slice(0, 8).map((item) => (
                      <article className="history-row" key={item.id}>
                        <div>
                          <strong>{item.riotId}</strong>
                          <small>
                            {new Date(item.searchedAt).toLocaleString("es-CL")}
                          </small>
                        </div>
                        <span className={`history-status ${item.status}`}>
                          {item.status === "found"
                            ? "Encontrado"
                            : "Sin resultado"}
                        </span>
                      </article>
                    ))
                  )}
                </div>
              </div>
            </section>
          </>
        )}

        {view === "objetivos" && (
          <>
            <header className="topbar">
              <div>
                <span className="eyebrow">Objetivos de hoy</span>
                <h1>Entrenamiento activo</h1>
              </div>
              <span>
                {completedGoals}/{summary?.goals.length ?? 0} completados
              </span>
            </header>

            {summary ? (
              <section className="goal-grid">
                {summary.goals.map((goal) => (
                  <GoalCard key={goal.id} {...goal} />
                ))}
              </section>
            ) : (
              <section className="loading-card">
                Conecta la API para ver tus metas de entrenamiento.
              </section>
            )}
          </>
        )}

        {view === "partidas" && (
          <>
            <header className="topbar">
              <div>
                <span className="eyebrow">Historial</span>
                <h1>Partidas sincronizadas</h1>
              </div>
              <button
                className="primary-button"
                type="button"
                disabled={isSyncing || !activeProfile}
                onClick={() => {
                  void handleSyncMatches();
                }}
              >
                {isSyncing ? "Sincronizando…" : "Sincronizar últimas 10"}
              </button>
            </header>

            <section className="match-toolbar">
              <div>
                <span className="eyebrow">Perfil activo</span>
                <strong>{activeProfile?.riotId ?? "Ninguno"}</strong>
              </div>
              {profiles.length > 1 && (
                <label>
                  Cambiar perfil
                  <select
                    value={activeProfile?.id ?? ""}
                    onChange={(event) =>
                      setSelectedProfileId(event.target.value)
                    }
                  >
                    {profiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.riotId}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </section>

            {matchMessage && <p className="lookup-message">{matchMessage}</p>}

            <div className="match-list">
              {matches.length === 0 ? (
                <div className="empty-state">
                  Aún no hay partidas. Sincroniza un perfil guardado para
                  importar Match-v5.
                </div>
              ) : (
                matches.map((match) => (
                  <MatchRow key={match.id} match={match} />
                ))
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
