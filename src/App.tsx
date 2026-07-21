import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  getCoachingSummary,
  getMatchDetail,
  getProfileDetail,
  getProfileMatches,
  getRiotProfiles,
  getRiotSearchHistory,
  lookupRiotProfile,
  MATCH_HISTORY_LIMIT,
  syncProfileMatches,
} from "./lib/api";
import { LandingHome } from "./LandingHome";
import { getClientId } from "./lib/client-id";
import type {
  AppView,
  ChampionMasteryEntry,
  CoachingSummary,
  MatchDetail,
  MatchPlayerSummary,
  MatchSummary,
  PlayerProfileDetail,
  RankedQueueEntry,
  RiotProfile,
  RiotSearchHistory,
} from "./types/coaching";

const NAV_ITEMS: Array<{
  id: AppView;
  label: string;
  icon: "home" | "user" | "coaching" | "tierlist" | "patch";
}> = [
  { id: "inicio", label: "Inicio", icon: "home" },
  { id: "perfiles", label: "Perfiles", icon: "user" },
  { id: "coaching", label: "Coaching", icon: "coaching" },
  { id: "tierlist", label: "Tierlist", icon: "tierlist" },
  { id: "notas-parche", label: "Notas del Parche", icon: "patch" },
];

function NavIcon({
  name,
}: {
  name: (typeof NAV_ITEMS)[number]["icon"];
}) {
  if (name === "home") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
      </svg>
    );
  }

  if (name === "user") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 19.5c1.8-3.2 4-4.8 7-4.8s5.2 1.6 7 4.8" />
      </svg>
    );
  }

  if (name === "coaching") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="7.5" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" />
      </svg>
    );
  }

  if (name === "tierlist") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 7h14" />
        <path d="M5 12h10" />
        <path d="M5 17h6" />
        <path d="M17 15.5 19.5 12 22 15.5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 3.5h8l3 3V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z" />
      <path d="M15 3.5V7h3.5" />
      <path d="M9 12h6M9 16h6" />
    </svg>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function championSquareUrl(championName: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/16.14.1/img/champion/${championName}.png`;
}

/** Official LoL mastery crests (client assets via CommunityDragon). */
function masteryCrestUrl(championLevel: number): string {
  const level = Number.isFinite(championLevel)
    ? Math.max(0, Math.trunc(championLevel))
    : 0;
  const crestLevel = level >= 10 ? 10 : level >= 4 ? level : 0;
  return `https://raw.communitydragon.org/latest/game/assets/ux/mastery/legendarychampionmastery/masterycrest_level${crestLevel}.png`;
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

function formatTier(entry: RankedQueueEntry): string {
  if (entry.unranked) {
    return "Sin clasificar";
  }

  if (entry.ratedTier) {
    return entry.ratedTier.replaceAll("_", " ");
  }

  if (!entry.tier) {
    return "Sin clasificar";
  }

  const tier = entry.tier.charAt(0) + entry.tier.slice(1).toLowerCase();
  return entry.rank ? `${tier} ${entry.rank}` : tier;
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

function rankEmblemUrl(entry: RankedQueueEntry): string {
  if (entry.emblemUrl) {
    return entry.emblemUrl;
  }

  const tier = (entry.tier ?? "unranked").toLowerCase();
  const known = new Set([
    "iron",
    "bronze",
    "silver",
    "gold",
    "platinum",
    "emerald",
    "diamond",
    "master",
    "grandmaster",
    "challenger",
  ]);

  if (!known.has(tier)) {
    return "https://opgg-static.akamaized.net/images/medals/default.png";
  }

  return `https://opgg-static.akamaized.net/images/medals_new/${tier}.png`;
}

function RankedCard({ entry }: { entry: RankedQueueEntry }) {
  const emblem = rankEmblemUrl(entry);
  const tierLabel = formatTier(entry);

  return (
    <article className={`ranked-card ${entry.unranked ? "unranked" : ""}`}>
      <span className="eyebrow">{entry.queueLabel}</span>
      <img
        className="ranked-emblem"
        src={emblem}
        alt={tierLabel}
        title={tierLabel}
      />
      {!entry.unranked && (
        <>
          <p className="ranked-division">
            {entry.rank && !entry.ratedTier ? entry.rank : null}
            {entry.ratedTier ? formatTier(entry) : null}
          </p>
          <p className="ranked-lp">
            {entry.ratedRating != null
              ? `${entry.ratedRating} rating`
              : `${entry.leaguePoints} LP`}
          </p>
          <p className="ranked-wl">
            {entry.wins}V · {entry.losses}D
            {entry.winRate != null ? ` · ${entry.winRate}%` : ""}
          </p>
        </>
      )}
      {entry.unranked && <p className="ranked-wl">Sin partidas ranked</p>}
    </article>
  );
}

function MasteryChip({ mastery }: { mastery: ChampionMasteryEntry }) {
  const crestUrl =
    mastery.masteryCrestUrl || masteryCrestUrl(mastery.championLevel);

  return (
    <article className="mastery-chip">
      <div className="mastery-champ-wrap">
        <img
          className="mastery-champ"
          src={mastery.championIconUrl}
          alt={mastery.championName}
        />
      </div>
      <div className="mastery-chip-copy">
        <strong>{mastery.championName}</strong>
        <small>
          Nivel {mastery.championLevel} ·{" "}
          {mastery.championPoints.toLocaleString("es-CL")} pts
        </small>
      </div>
      <div className="mastery-crest-wrap">
        <img
          className="mastery-crest"
          src={crestUrl}
          alt={`Maestría nivel ${mastery.championLevel}`}
        />
        {mastery.championLevel > 10 ? (
          <span className="mastery-crest-level">{mastery.championLevel}</span>
        ) : null}
      </div>
    </article>
  );
}

function PlayerLine({ player }: { player: MatchPlayerSummary }) {
  return (
    <div
      className={`match-player-line ${player.isTrackedPlayer ? "tracked" : ""} ${player.isMvp ? "mvp" : ""}`}
    >
      <img src={player.championIconUrl} alt={player.championName} />
      <div className="match-player-id">
        <strong>
          {player.riotId}
          {player.isMvp ? " · MVP" : ""}
        </strong>
        <small>
          {player.championName}
          {player.teamPosition ? ` · ${formatRole(player.teamPosition)}` : ""}
          {" · "}
          {player.rankLabel ?? "Liga N/D"}
        </small>
      </div>
      <div className="match-player-stats">
        <strong>
          {player.kills}/{player.deaths}/{player.assists}
        </strong>
        <small>
          {player.creepScore} CS · {player.totalDamageToChampions.toLocaleString("es-CL")} dmg
        </small>
      </div>
    </div>
  );
}

function ExpandableMatchCard({
  match,
  profileId,
  clientId,
}: {
  match: MatchSummary;
  profileId: string;
  clientId: string;
}) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    const next = !open;
    setOpen(next);

    if (!next || detail) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = await getMatchDetail(clientId, profileId, match.id);
      setDetail(payload);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible cargar el detalle.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className={`history-match-card ${match.win ? "win" : "loss"}`}>
      <button className="history-match-summary" type="button" onClick={() => void toggle()}>
        <img
          className="match-champ-icon"
          src={championSquareUrl(match.championName)}
          alt={match.championName}
        />
        <div className="match-result">
          <strong>{match.win ? "V" : "D"}</strong>
          <small>{formatDuration(match.gameDurationSeconds)}</small>
        </div>
        <div className="match-core">
          <strong>{match.championName}</strong>
          <small>
            {match.queueLabel} · {formatRole(match.teamPosition)}
            {match.mvpChampionName
              ? ` · MVP ${match.mvpChampionName}`
              : ""}
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
        <span className="expand-chip">{open ? "Ocultar" : "Detalle"}</span>
      </button>

      {open && (
        <div className="history-match-detail">
          {loading && <p className="lookup-message">Cargando detalle…</p>}
          {error && <p className="lookup-message">{error}</p>}
          {detail && (
            <>
              <div className="match-detail-meta">
                <span>
                  Duración {formatDuration(detail.gameDurationSeconds)}
                </span>
                <span>
                  MVP{" "}
                  {detail.mvpRiotId
                    ? `${detail.mvpRiotId} (${detail.mvpChampionName})`
                    : "N/D"}
                </span>
                <span>
                  {new Date(detail.gameCreation).toLocaleString("es-CL")}
                </span>
              </div>
              <div className="match-teams">
                <div>
                  <span className="eyebrow">Tu equipo</span>
                  {detail.allyTeam.map((player) => (
                    <PlayerLine key={player.puuid} player={player} />
                  ))}
                </div>
                <div>
                  <span className="eyebrow">Equipo rival</span>
                  {detail.enemyTeam.map((player) => (
                    <PlayerLine key={player.puuid} player={player} />
                  ))}
                </div>
              </div>
              <p className="match-detail-note">
                Resumen rápido. Más adelante podrás abrir el análisis completo de
                la partida.
              </p>
            </>
          )}
        </div>
      )}
    </article>
  );
}

function ProfileDetailPanel({
  detail,
  matches,
  clientId,
  isRefreshing,
  onRefresh,
}: {
  detail: PlayerProfileDetail;
  matches: MatchSummary[];
  clientId: string;
  isRefreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <section className="profile-detail">
      <header className="profile-hero">
        <img
          className="profile-icon"
          src={detail.profileIconUrl}
          alt={`Icono de ${detail.riotId}`}
        />
        <div className="profile-hero-copy">
          <span className="eyebrow">{detail.platform}</span>
          <h2>{detail.riotId}</h2>
          <p>
            Nivel {detail.summonerLevel}
            <span className="dot-sep">·</span>
            {detail.searchCount} consultas
          </p>
        </div>
        <button
          className="ghost-button"
          type="button"
          disabled={isRefreshing}
          onClick={onRefresh}
        >
          {isRefreshing ? "Actualizando…" : "Actualizar"}
        </button>
      </header>

      <div className="section-heading compact">
        <div>
          <span className="eyebrow">Clasificatorias</span>
          <h2>Ligas del jugador</h2>
        </div>
      </div>
      <div className="ranked-grid">
        {detail.rankedList.map((entry) => (
          <RankedCard key={entry.key} entry={entry} />
        ))}
      </div>

      <div className="profile-split">
        <section className="profile-split-main">
          <div className="section-heading compact">
            <div>
              <span className="eyebrow">Historial</span>
              <h2>Historial de partidas</h2>
            </div>
            <span>{matches.length} partidas</span>
          </div>
          <div className="history-match-list">
            {matches.length === 0 ? (
              <div className="empty-state">
                Aún no hay partidas sincronizadas. Pulsa Actualizar.
              </div>
            ) : (
              matches.map((match) => (
                <ExpandableMatchCard
                  key={match.id}
                  match={match}
                  profileId={detail.id}
                  clientId={clientId}
                />
              ))
            )}
          </div>
        </section>

        <aside className="profile-split-side">
          <div className="section-heading compact">
            <div>
              <span className="eyebrow">Base para coaching</span>
              <h2>Maestrías</h2>
            </div>
          </div>
          <div className="mastery-column">
            {detail.topMasteries.length === 0 ? (
              <div className="empty-state">Sin maestrías disponibles.</div>
            ) : (
              detail.topMasteries.map((mastery) => (
                <MasteryChip key={mastery.championId} mastery={mastery} />
              ))
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

export function App() {
  const clientId = useMemo(() => getClientId(), []);
  const [view, setView] = useState<AppView>("inicio");
  const [summary, setSummary] = useState<CoachingSummary | null>(null);
  const [profiles, setProfiles] = useState<RiotProfile[]>([]);
  const [history, setHistory] = useState<RiotSearchHistory[]>([]);
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [profileDetail, setProfileDetail] =
    useState<PlayerProfileDetail | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null,
  );
  const [gameName, setGameName] = useState("Jøy Đ Bøy");
  const [tagLine, setTagLine] = useState("NPM");
  const [platform, setPlatform] = useState("LA2");
  const [apiError, setApiError] = useState<string | null>(null);
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isRefreshingDetail, setIsRefreshingDetail] = useState(false);

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

  async function loadProfileDetail(
    profileId: string,
    refresh = true,
  ): Promise<void> {
    setIsRefreshingDetail(true);
    try {
      const detail = await getProfileDetail(clientId, profileId, refresh);
      setProfileDetail(detail);
      setSelectedProfileId(detail.id);
      setLookupMessage(null);

      if (refresh) {
        try {
          const synced = await syncProfileMatches(
            clientId,
            detail.id,
            MATCH_HISTORY_LIMIT,
          );
          setMatches(synced.matches);
        } catch {
          const listed = await getProfileMatches(
            clientId,
            detail.id,
            MATCH_HISTORY_LIMIT,
          );
          setMatches(listed);
        }
      } else {
        const listed = await getProfileMatches(
          clientId,
          detail.id,
          MATCH_HISTORY_LIMIT,
        );
        setMatches(listed);
      }
    } catch (error) {
      setLookupMessage(
        error instanceof Error
          ? error.message
          : "No fue posible cargar el detalle del perfil.",
      );
    } finally {
      setIsRefreshingDetail(false);
    }
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
    if (!activeProfile || (view !== "perfiles" && view !== "inicio")) {
      return;
    }

    if (profileDetail?.id === activeProfile.id) {
      return;
    }

    const controller = new AbortController();

    getProfileDetail(clientId, activeProfile.id, false)
      .then((detail) => {
        if (!controller.signal.aborted) {
          setProfileDetail(detail);
        }
      })
      .catch(() => {
        // Cached detail may be empty until the first live lookup/refresh.
      });

    return () => controller.abort();
  }, [activeProfile, clientId, profileDetail?.id, view]);

  async function handleLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSearching(true);
    setLookupMessage(null);

    try {
      const detail = await lookupRiotProfile({
        clientId,
        gameName: gameName.trim(),
        tagLine: tagLine.trim().replace(/^#/, ""),
        platform,
      });

      setProfileDetail(detail);
      setLookupMessage(`${detail.riotId} sincronizado con Riot.`);
      setSelectedProfileId(detail.id);
      setView("perfiles");
      setApiError(null);
      await refreshRiotData();
      try {
        const synced = await syncProfileMatches(
          clientId,
          detail.id,
          MATCH_HISTORY_LIMIT,
        );
        setMatches(synced.matches);
      } catch {
        setMatches([]);
      }
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
              <NavIcon name={item.icon} />
              <span>{item.label}</span>
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

        {view === "inicio" && (
          <LandingHome
            onStartFree={() => setView("perfiles")}
            onExplorePro={() => setView("coaching")}
          />
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
                <h2>Busca un Riot ID</h2>
                <p>
                  Consultamos Account, Summoner, League, TFT League y Champion
                  Mastery. El PUUID permanece solo en la API.
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
                  {isSearching ? "Consultando Riot…" : "Buscar perfil"}
                </button>
              </form>

              {lookupMessage && (
                <p className="lookup-message">{lookupMessage}</p>
              )}
            </section>

            {profileDetail && (
              <ProfileDetailPanel
                detail={profileDetail}
                matches={matches}
                clientId={clientId}
                isRefreshing={isRefreshingDetail}
                onRefresh={() => {
                  void loadProfileDetail(profileDetail.id, true);
                }}
              />
            )}

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
                        onClick={() => {
                          setSelectedProfileId(profile.id);
                          void loadProfileDetail(profile.id, true);
                        }}
                      >
                        {profile.profileIconUrl ? (
                          <img
                            className="profile-avatar-img"
                            src={profile.profileIconUrl}
                            alt=""
                          />
                        ) : (
                          <span className="profile-avatar">
                            {profile.gameName.slice(0, 1).toUpperCase()}
                          </span>
                        )}
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

        {view === "coaching" && (
          <>
            <header className="topbar">
              <div>
                <span className="eyebrow">Coaching</span>
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

        {view === "tierlist" && (
          <section className="module-placeholder">
            <span className="eyebrow">Meta</span>
            <h1>Tierlist</h1>
            <p>
              Ranking de campeones por rol y parche para orientar picks y bans.
              Este módulo se conectará a datos vivos más adelante.
            </p>
          </section>
        )}

        {view === "notas-parche" && (
          <section className="module-placeholder">
            <span className="eyebrow">Actualizaciones</span>
            <h1>Notas del Parche</h1>
            <p>
              Resumen táctico de cambios relevantes para tu rol, campeones y
              objetivos de coaching. Próximamente.
            </p>
          </section>
        )}
      </section>
    </main>
  );
}
