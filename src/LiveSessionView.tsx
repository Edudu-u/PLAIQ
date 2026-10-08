import { useEffect, useMemo, useState } from "react";
import {
  createGameSession,
  getGameSession,
  getGameSessions,
  type GameSessionDetail,
  type GameSessionSummary,
} from "./lib/api";
import type { RiotProfile } from "./types/coaching";

type LiveSessionViewProps = {
  clientId: string;
  profile: RiotProfile | null;
};

type LiveProbe = {
  connected: boolean;
  inGame: boolean;
  gameTimeSeconds: number;
  mapName: string | null;
  gameMode: string | null;
};

type LiveStatus = {
  running: boolean;
  inGame: boolean;
  connected: boolean;
  sessionId: string | null;
  startedAt: string | null;
  snapshotCount: number;
  lastSnapshot: {
    capturedAtMs: number;
    gameTimeSeconds: number;
    creepScore: number;
    kills: number;
    deaths: number;
    assists: number;
    visionScore: number;
  } | null;
  endedReason: string | null;
  expectedRiotId: string | null;
};

type LiveEndedSession = LiveStatus & {
  endedAt: string | null;
  role: string | null;
  championName: string | null;
  queueId: number;
  snapshots: Array<{
    capturedAtMs: number;
    gameTimeSeconds: number;
    creepScore: number;
    kills: number;
    deaths: number;
    assists: number;
    visionScore: number;
  }>;
};

const EMPTY_STATUS: LiveStatus = {
  running: false,
  inGame: false,
  connected: false,
  sessionId: null,
  startedAt: null,
  snapshotCount: 0,
  lastSnapshot: null,
  endedReason: null,
  expectedRiotId: null,
};

function mmss(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return mins + ":" + String(secs).padStart(2, "0");
}

function statusLabel(probe: LiveProbe | null, status: LiveStatus): string {
  if (!probe?.connected && !status.connected) return "Cliente no detectado";
  if (status.inGame) return "Partida activa";
  return "Esperando partida";
}

export function LiveSessionView({
  clientId,
  profile,
}: LiveSessionViewProps) {
  const available = typeof window !== "undefined" && Boolean(window.plaiq?.live);
  const [probe, setProbe] = useState<LiveProbe | null>(null);
  const [status, setStatus] = useState<LiveStatus>(EMPTY_STATUS);
  const [error, setError] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<
    "idle" | "uploading" | "stored" | "failed"
  >("idle");
  const [lastUpload, setLastUpload] = useState<string | null>(null);
  const [sessions, setSessions] = useState<GameSessionSummary[]>([]);
  const [selectedSession, setSelectedSession] = useState<GameSessionDetail | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    if (!available) return;
    let cancelled = false;

    async function refresh() {
      try {
        const next = await window.plaiq!.live.probe();
        if (!cancelled) setProbe(next);
      } catch {
        if (!cancelled) setProbe(null);
      }
    }

    void refresh();
    const timer = window.setInterval(() => void refresh(), 5000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [available]);

  useEffect(() => {
    if (!available || !profile) return;
    let cancelled = false;

    setLoadingSessions(true);
    void getGameSessions(clientId, profile.id, 10)
      .then((items) => {
        if (!cancelled) setSessions(items);
      })
      .catch(() => {
        if (!cancelled) setSessions([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSessions(false);
      });

    return () => {
      cancelled = true;
    };
  }, [available, clientId, profile]);

  useEffect(() => {
    if (!available) return;

    const removeStatus = window.plaiq!.live.onStatus((next) => {
      setStatus(next);
    });

    const removeSnapshot = window.plaiq!.live.onSnapshot((snapshot) => {
      setStatus((current) => ({
        ...current,
        connected: true,
        inGame: snapshot.inGame,
        snapshotCount: current.snapshotCount + 1,
        lastSnapshot: snapshot,
      }));
    });

    const removeEnded = window.plaiq!.live.onSessionEnded((session) => {
      setStatus({
        running: false,
        inGame: false,
        connected: true,
        sessionId: session.sessionId,
        startedAt: session.startedAt,
        snapshotCount: session.snapshotCount,
        lastSnapshot:
          session.snapshots[session.snapshots.length - 1] ?? null,
        endedReason: session.endedReason,
        expectedRiotId: session.expectedRiotId,
      });

      if (!profile || session.snapshots.length === 0) {
        setUploadState("failed");
        setError(
          profile
            ? "La partida terminó sin snapshots suficientes para guardar."
            : "No hay un perfil activo para asociar esta sesión.",
        );
        return;
      }

      setUploadState("uploading");
      setError(null);

      void createGameSession({
        clientId,
        profileId: profile.id,
        localSessionId: session.sessionId!,
        queueId: session.queueId,
        role: session.role ?? "UNKNOWN",
        championId: 0,
        championName: session.championName ?? "UNKNOWN",
        startedAt: session.startedAt ?? new Date().toISOString(),
        endedAt: session.endedAt ?? new Date().toISOString(),
        snapshots: session.snapshots,
      })
        .then(async (result) => {
          setUploadState("stored");
          setLastUpload(result.receivedSnapshots + " snapshots almacenados");
          const latest = await getGameSessions(clientId, profile.id, 10);
          setSessions(latest);
          const stored = latest.find((item) => item.id === result.sessionId);
          if (stored) {
            setSelectedSession(await getGameSession(clientId, stored.id));
          }
        })
        .catch((caught) => {
          setUploadState("failed");
          setError(
            caught instanceof Error
              ? "No se pudo guardar la sesión: " + caught.message
              : "No se pudo guardar la sesión.",
          );
        });
    });

    return () => {
      removeStatus();
      removeSnapshot();
      removeEnded();
    };
  }, [available, clientId, profile]);

  async function handleStart() {
    if (!profile || !window.plaiq?.live) return;

    setError(null);
    setUploadState("idle");

    try {
      const next = await window.plaiq.live.start(profile.riotId);
      setStatus(next);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "No se pudo iniciar la captura.",
      );
    }
  }

  async function handleStop() {
    if (!window.plaiq?.live) return;

    try {
      const next = await window.plaiq.live.stop();
      setStatus(next);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "No se pudo detener la captura.",
      );
    }
  }

  const latest = status.lastSnapshot;
  const liveMetrics = useMemo(
    () =>
      latest
        ? [
            ["CS", String(latest.creepScore)],
            ["K / D / A", latest.kills + " / " + latest.deaths + " / " + latest.assists],
            ["Visión", latest.visionScore.toFixed(1)],
            ["Tiempo", mmss(latest.gameTimeSeconds)],
          ]
        : [],
    [latest],
  );


function Sparkline({
  values,
  label,
}: {
  values: number[];
  label: string;
}) {
  if (values.length < 2) {
    return <span className="live-chart-empty">Sin suficientes muestras</span>;
  }

  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = Math.max(max - min, 1);
  const width = 420;
  const height = 96;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / span) * (height - 12) - 6;
      return x.toFixed(1) + "," + y.toFixed(1);
    })
    .join(" ");

  return (
    <div className="live-chart" role="img" aria-label={label}>
      <svg viewBox={"0 0 " + width + " " + height} preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="live-chart-range">
        <span>{min.toFixed(1)}</span>
        <span>{max.toFixed(1)}</span>
      </div>
    </div>
  );
}

  if (!available) {
    return (
      <section className="live-empty">
        <span className="eyebrow">Live Client</span>
        <h1>Este módulo requiere PLAIQ Desktop.</h1>
        <p>
          La captura se mantiene en el proceso principal de Electron para que
          React nunca tenga acceso directo al puerto local del juego.
        </p>
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="live-empty">
        <span className="eyebrow">Live Client</span>
        <h1>Selecciona un perfil Riot primero.</h1>
        <p>
          La sesión se asociará al perfil activo y nunca recogerá datos de un
          jugador distinto al Riot ID seleccionado.
        </p>
      </section>
    );
  }

  return (
    <div className="live-dashboard">
      <header className="topbar">
        <div>
          <span className="eyebrow">Captura local</span>
          <h1>Partida en vivo</h1>
        </div>
        <span className={"live-state " + (status.inGame ? "active" : "")}>
          <span className="status-dot" />
          {statusLabel(probe, status)}
        </span>
      </header>

      <section className="live-control-card">
        <div className="live-control-copy">
          <span className="eyebrow">Perfil objetivo</span>
          <h2>{profile.riotId}</h2>
          <p>
            Solo se capturan tus propios contadores de partida. No se muestran
            instrucciones tácticas, tracking oculto ni decisiones automáticas.
          </p>
        </div>

        <div className="live-controls">
          {!status.running ? (
            <button className="primary-button" type="button" onClick={handleStart}>
              Iniciar captura
            </button>
          ) : (
            <button className="ghost-button" type="button" onClick={handleStop}>
              Detener captura
            </button>
          )}
        </div>
      </section>

      {error && <p className="lookup-message">{error}</p>}

      <section className="live-health-grid">
        <article className="live-health">
          <span className="eyebrow">Game Client</span>
          <strong>{probe?.connected ? "Conectado" : "No detectado"}</strong>
          <small>HTTPS local · 127.0.0.1:2999</small>
        </article>
        <article className="live-health">
          <span className="eyebrow">Captura</span>
          <strong>{status.snapshotCount}</strong>
          <small>snapshots recogidos</small>
        </article>
        <article className="live-health">
          <span className="eyebrow">Persistencia</span>
          <strong>
            {uploadState === "uploading"
              ? "Guardando…"
              : uploadState === "stored"
                ? "Guardado"
                : uploadState === "failed"
                  ? "Error"
                  : "Pendiente"}
          </strong>
          <small>{lastUpload ?? "Se guarda al terminar la partida"}</small>
        </article>
      </section>

      {latest ? (
        <section className="live-metrics-grid">
          {liveMetrics.map(([label, value]) => (
            <article className="live-metric" key={label}>
              <span className="eyebrow">{label}</span>
              <strong>{value}</strong>
            </article>
          ))}
        </section>
      ) : (
        <section className="live-waiting">
          <span className="live-pulse" />
          <div>
            <span className="eyebrow">Collector preparado</span>
            <h2>{status.running ? "Esperando una partida…" : "Listo para capturar"}</h2>
            <p>
              Al detectar una partida compatible, PLAIQ muestreará los contadores
              propios cada 5 segundos.
            </p>
          </div>
        </section>
      )}

      <section className="live-session-history">
        <div className="section-heading compact">
          <div>
            <span className="eyebrow">Historial local</span>
            <h2>Sesiones capturadas</h2>
          </div>
          <span>{loadingSessions ? "Cargando…" : sessions.length + " sesiones"}</span>
        </div>

        <div className="live-history-grid">
          <div className="live-session-list">
            {sessions.length === 0 ? (
              <div className="empty-state">Todavía no hay sesiones almacenadas.</div>
            ) : (
              sessions.map((session) => (
                <button
                  type="button"
                  key={session.id}
                  className={
                    selectedSession?.id === session.id
                      ? "live-session-row active"
                      : "live-session-row"
                  }
                  onClick={() => {
                    void getGameSession(clientId, session.id).then(setSelectedSession);
                  }}
                >
                  <span>
                    <strong>{session.championName}</strong>
                    <small>
                      {session.role} · {session.sampleCount} muestras
                    </small>
                  </span>
                  <span>
                    <strong>{mmss(session.durationSeconds)}</strong>
                    <small>{new Date(session.startedAt).toLocaleDateString("es-CL")}</small>
                  </span>
                </button>
              ))
            )}
          </div>

          <div className="live-session-detail">
            {selectedSession ? (
              <>
                <div className="section-heading compact">
                  <div>
                    <span className="eyebrow">
                      {selectedSession.championName} · {selectedSession.role}
                    </span>
                    <h2>Curva de entrenamiento</h2>
                  </div>
                  <span>{selectedSession.sampleCount} muestras</span>
                </div>
                <div className="live-session-summary">
                  <div>
                    <span className="eyebrow">CS @ 10</span>
                    <strong>
                      {selectedSession.analysis.csAt10 == null
                        ? "—"
                        : selectedSession.analysis.csAt10}
                    </strong>
                  </div>
                  <div>
                    <span className="eyebrow">Muertes @ 15</span>
                    <strong>
                      {selectedSession.analysis.deathsAt15 == null
                        ? "—"
                        : selectedSession.analysis.deathsAt15}
                    </strong>
                  </div>
                  <div>
                    <span className="eyebrow">KDA final</span>
                    <strong>
                      {selectedSession.analysis.finalKda == null
                        ? "—"
                        : selectedSession.analysis.finalKda.toFixed(2)}
                    </strong>
                  </div>
                  <div>
                    <span className="eyebrow">Calidad</span>
                    <strong>{selectedSession.analysis.quality}</strong>
                  </div>
                </div>
                <div className="live-chart-grid">
                  <article className="live-chart-card">
                    <span className="eyebrow">CS</span>
                    <Sparkline
                      label="Evolución de CS durante la sesión"
                      values={selectedSession.snapshots.map((item) => item.creepScore)}
                    />
                  </article>
                  <article className="live-chart-card">
                    <span className="eyebrow">Visión</span>
                    <Sparkline
                      label="Evolución de visión durante la sesión"
                      values={selectedSession.snapshots.map((item) => item.visionScore)}
                    />
                  </article>
                </div>
              </>
            ) : (
              <div className="live-chart-empty-wrap">
                <span className="eyebrow">Detalle</span>
                <p>Selecciona una sesión para ver su evolución temporal.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="live-method">
        <span className="eyebrow">Arquitectura</span>
        <div>
          <strong>Electron → Game Client → snapshots → API-PLAIQ</strong>
          <p>
            El renderer no abre el puerto 2999. El proceso principal maneja el
            certificado local y expone solo datos normalizados mediante IPC.
          </p>
        </div>
      </section>
    </div>
  );
}
