import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  getCoachingSummary,
  getRiotProfiles,
  getRiotSearchHistory,
  lookupRiotProfile,
} from "./lib/api";
import { getClientId } from "./lib/client-id";
import type {
  CoachingSummary,
  RiotProfile,
  RiotSearchHistory,
} from "./types/coaching";

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
    <article className="goal-card">
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

export function App() {
  const clientId = useMemo(() => getClientId(), []);
  const [summary, setSummary] = useState<CoachingSummary | null>(null);
  const [profiles, setProfiles] = useState<RiotProfile[]>([]);
  const [history, setHistory] = useState<RiotSearchHistory[]>([]);
  const [gameName, setGameName] = useState("Jøy Đ Bøy");
  const [tagLine, setTagLine] = useState("NPM");
  const [platform, setPlatform] = useState("LA2");
  const [apiError, setApiError] = useState<string | null>(null);
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  async function refreshRiotData(): Promise<void> {
    const [savedProfiles, searches] = await Promise.all([
      getRiotProfiles(clientId),
      getRiotSearchHistory(clientId),
    ]);

    setProfiles(savedProfiles);
    setHistory(searches);
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
      }

      if (historyResult.status === "fulfilled") {
        setHistory(historyResult.value);
      }
    });

    return () => controller.abort();
  }, [clientId]);

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
          <button className="nav-item">Perfiles</button>
          <button className="nav-item">Objetivos</button>
          <button className="nav-item">Partidas</button>
        </nav>

        <div className="connection">
          <span className={apiError ? "status-dot offline" : "status-dot"} />
          {apiError ? "API desconectada" : "API conectada"}
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <span className="eyebrow">Tu sesión de entrenamiento</span>
            <h1>Juega con propósito.</h1>
          </div>
          <span className="role-badge">
            {summary?.player.primaryRole ?? "PLAIQ"}
          </span>
        </header>

        {apiError && (
          <div className="notice">
            {apiError} Inicia PostgreSQL y el backend en el puerto 3000.
          </div>
        )}

        <section className="lookup-card">
          <div className="lookup-copy">
            <span className="eyebrow">Perfiles Riot</span>
            <h2>Busca y guarda un jugador</h2>
            <p>
              El historial queda asociado a esta instalación hasta que
              habilitemos cuentas por correo.
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

          {lookupMessage && <p className="lookup-message">{lookupMessage}</p>}
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
                <div className="empty-state">Todavía no hay perfiles guardados.</div>
              ) : (
                profiles.slice(0, 5).map((profile) => (
                  <article className="profile-row" key={profile.id}>
                    <span className="profile-avatar">
                      {profile.gameName.slice(0, 1).toUpperCase()}
                    </span>
                    <div>
                      <strong>{profile.riotId}</strong>
                      <small>
                        {profile.platform} · Nivel {profile.summonerLevel ?? "—"}
                      </small>
                    </div>
                    <span className="search-count">
                      {profile.searchCount} {profile.searchCount === 1 ? "consulta" : "consultas"}
                    </span>
                  </article>
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
                <div className="empty-state">No existen búsquedas todavía.</div>
              ) : (
                history.slice(0, 6).map((item) => (
                  <article className="history-row" key={item.id}>
                    <div>
                      <strong>{item.riotId}</strong>
                      <small>
                        {new Date(item.searchedAt).toLocaleString("es-CL")}
                      </small>
                    </div>
                    <span className={`history-status ${item.status}`}>
                      {item.status === "found" ? "Encontrado" : "Sin resultado"}
                    </span>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>

        {summary ? (
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
              <span>
                {completedGoals}/{summary.goals.length} completados
              </span>
            </div>

            <section className="goal-grid">
              {summary.goals.map((goal) => (
                <GoalCard key={goal.id} {...goal} />
              ))}
            </section>
          </>
        ) : (
          <section className="loading-card">
            {apiError ? "El coaching se cargará al conectar la API." : "Preparando tu plan de coaching…"}
          </section>
        )}
      </section>
    </main>
  );
}
