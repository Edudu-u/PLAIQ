import { useEffect, useId, useMemo, useRef, useState } from "react";
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
import { PatchNotesView } from "./PatchNotesView";
import { TierlistView } from "./TierlistView";
import { BrandLogo } from "./BrandLogo";
import { BrandWordmark } from "./BrandWordmark";
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
  const uid = useId().replace(/:/g, "");
  const gradId = `navGrad-${uid}`;
  const stroke = `url(#${gradId})`;

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient
          id={gradId}
          x1="3"
          y1="12"
          x2="21"
          y2="12"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="var(--logo-a, #5cefff)" />
          <stop offset="55%" stopColor="var(--logo-mid, #5bb8ff)" />
          <stop offset="100%" stopColor="var(--logo-b, #7a9dff)" />
        </linearGradient>
      </defs>
      {name === "home" ? (
        <path
          d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z"
          stroke={stroke}
        />
      ) : name === "user" ? (
        <>
          <circle cx="12" cy="8" r="3.5" stroke={stroke} />
          <path d="M5 19.5c1.8-3.2 4-4.8 7-4.8s5.2 1.6 7 4.8" stroke={stroke} />
        </>
      ) : name === "coaching" ? (
        <>
          <circle cx="12" cy="12" r="7.5" stroke={stroke} />
          <circle cx="12" cy="12" r="3" stroke={stroke} />
          <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" stroke={stroke} />
        </>
      ) : name === "tierlist" ? (
        <>
          <path d="M5 7h14" stroke={stroke} />
          <path d="M5 12h10" stroke={stroke} />
          <path d="M5 17h6" stroke={stroke} />
          <path d="M17 15.5 19.5 12 22 15.5" stroke={stroke} />
        </>
      ) : (
        <>
          <path
            d="M7 3.5h8l3 3V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z"
            stroke={stroke}
          />
          <path d="M15 3.5V7h3.5" stroke={stroke} />
          <path d="M9 12h6M9 16h6" stroke={stroke} />
        </>
      )}
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
                  key={`${detail.id}-${match.id}`}
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
  const [theme, setTheme] = useState<"zekrom" | "reshiram">(() => {
    const saved = window.localStorage.getItem("playq.theme");
    return saved === "reshiram" || saved === "zekrom" ? saved : "zekrom";
  });
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
  const profileRequestId = useRef(0);

  const activeProfile = useMemo(
    () =>
      profiles.find((profile) => profile.id === selectedProfileId) ?? null,
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
    const requestId = ++profileRequestId.current;
    setIsRefreshingDetail(true);
    setMatches([]);
    try {
      const detail = await getProfileDetail(clientId, profileId, refresh);
      if (requestId !== profileRequestId.current) {
        return;
      }
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
          if (requestId !== profileRequestId.current) {
            return;
          }
          setMatches(synced.matches);
          if (synced.matches.length === 0) {
            setLookupMessage(
              "Riot no devolvió partidas recientes para este perfil.",
            );
          }
        } catch (error) {
          const listed = await getProfileMatches(
            clientId,
            detail.id,
            MATCH_HISTORY_LIMIT,
          );
          if (requestId !== profileRequestId.current) {
            return;
          }
          setMatches(listed);
          setLookupMessage(
            error instanceof Error
              ? `No se pudo sincronizar partidas: ${error.message}`
              : "No se pudo sincronizar el historial de partidas.",
          );
        }
      } else {
        const listed = await getProfileMatches(
          clientId,
          detail.id,
          MATCH_HISTORY_LIMIT,
        );
        if (requestId !== profileRequestId.current) {
          return;
        }
        setMatches(listed);
      }
    } catch (error) {
      if (requestId !== profileRequestId.current) {
        return;
      }
      setLookupMessage(
        error instanceof Error
          ? error.message
          : "No fue posible cargar el detalle del perfil.",
      );
    } finally {
      if (requestId === profileRequestId.current) {
        setIsRefreshingDetail(false);
      }
    }
  }

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("playq.theme", theme);
  }, [theme]);

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
        setApiError("No fue posible conectar con la API de PLAYQ.GG.");
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
    if (
      !selectedProfileId ||
      (view !== "perfiles" && view !== "inicio")
    ) {
      return;
    }

    if (profileDetail?.id === selectedProfileId) {
      return;
    }

    const requestId = ++profileRequestId.current;
    const profileId = selectedProfileId;

    Promise.all([
      getProfileDetail(clientId, profileId, false),
      getProfileMatches(clientId, profileId, MATCH_HISTORY_LIMIT),
    ])
      .then(([detail, listed]) => {
        if (requestId !== profileRequestId.current) {
          return;
        }
        setProfileDetail(detail);
        setMatches(listed);
      })
      .catch(() => {
        // Cached detail may be empty until the first live lookup/refresh.
      });
  }, [selectedProfileId, clientId, profileDetail?.id, view]);

  async function handleLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const requestId = ++profileRequestId.current;
    setIsSearching(true);
    setLookupMessage(null);
    setMatches([]);

    try {
      const detail = await lookupRiotProfile({
        clientId,
        gameName: gameName.trim(),
        tagLine: tagLine.trim().replace(/^#/, ""),
        platform,
      });

      if (requestId !== profileRequestId.current) {
        return;
      }

      setProfileDetail(detail);
      setLookupMessage(`${detail.riotId} sincronizado con Riot.`);
      setSelectedProfileId(detail.id);
      setView("perfiles");
      setApiError(null);
      await refreshRiotData();
      if (requestId !== profileRequestId.current) {
        return;
      }
      try {
        const synced = await syncProfileMatches(
          clientId,
          detail.id,
          MATCH_HISTORY_LIMIT,
        );
        if (requestId !== profileRequestId.current) {
          return;
        }
        setMatches(synced.matches);
        if (synced.matches.length === 0) {
          setLookupMessage(
            `${detail.riotId} sincronizado, pero Riot no devolvió partidas recientes.`,
          );
        }
      } catch (error) {
        if (requestId !== profileRequestId.current) {
          return;
        }
        setMatches([]);
        setLookupMessage(
          error instanceof Error
            ? `Perfil OK, pero el historial falló: ${error.message}`
            : "Perfil OK, pero no se pudo sincronizar el historial.",
        );
      }
    } catch (error) {
      if (requestId !== profileRequestId.current) {
        return;
      }
      setLookupMessage(
        error instanceof Error
          ? error.message
          : "No fue posible buscar el Riot ID.",
      );
    } finally {
      if (requestId === profileRequestId.current) {
        setIsSearching(false);
      }
    }
  }

  const completedGoals = useMemo(
    () => summary?.goals.filter((goal) => goal.completed).length ?? 0,
    [summary],
  );

  return (
    <main className="app-shell">
      <div className="atmosphere" aria-hidden="true" />

      <header className="top-nav">
        <button
          className="brand brand-button"
          type="button"
          onClick={() => setView("inicio")}
          aria-label="Ir a Inicio"
        >
          <span className="brand-mark">
            <BrandLogo />
          </span>
          <div>
            <strong>
              <BrandWordmark />
            </strong>
            <small>Centro táctico</small>
          </div>
        </button>

        <nav className="top-nav-links" aria-label="Principal">
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

        <div className="top-nav-end">
          <button
            className="theme-toggle"
            type="button"
            onClick={() =>
              setTheme((current) =>
                current === "zekrom" ? "reshiram" : "zekrom",
              )
            }
            aria-label={
              theme === "zekrom"
                ? "Cambiar a modo claro Reshiram"
                : "Cambiar a modo oscuro Zekrom"
            }
            title={
              theme === "zekrom"
                ? "Modo claro · Reshiram"
                : "Modo oscuro · Zekrom"
            }
          >
            <span className="theme-toggle-icon" aria-hidden="true">
              {theme === "zekrom" ? "Z" : "R"}
            </span>
            <span>
              {theme === "zekrom" ? "Zekrom" : "Reshiram"}
              <small>{theme === "zekrom" ? "Oscuro" : "Claro"}</small>
            </span>
          </button>
          <div className="connection">
            <span className={apiError ? "status-dot offline" : "status-dot"} />
            {apiError ? "API desconectada" : "API conectada"}
          </div>
        </div>
      </header>

      <section className="content">
        {apiError && (
          <div className="notice">
            {apiError} Inicia PostgreSQL y el backend en el puerto 3000.
          </div>
        )}

        {view === "inicio" && (
          <LandingHome
            gameName={gameName}
            tagLine={tagLine}
            platform={platform}
            isSearching={isSearching}
            lookupMessage={lookupMessage}
            onGameNameChange={setGameName}
            onTagLineChange={setTagLine}
            onPlatformChange={setPlatform}
            onLookup={handleLookup}
            onOpenModule={(id) => setView(id)}
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

        {view === "tierlist" && <TierlistView />}

        {view === "notas-parche" && <PatchNotesView />}
      </section>
    </main>
  );
}
