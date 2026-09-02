import { useEffect, useMemo, useState } from "react";
import {
  getTierlist,
  getTierlistSyncStatus,
  startTierlistSync,
} from "./lib/api";
import type { TierlistQuery, TierlistResponse, TierlistSyncStatus } from "./types/tierlist";

const PLATFORM_LABELS: Record<string, string> = {
  ALL: "Todas",
  LA2: "LAS",
  LA1: "LAN",
  BR1: "BR",
  NA1: "NA",
};

function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function TierlistView() {
  const [query, setQuery] = useState<TierlistQuery>({
    platform: "LA2",
    role: "TOP",
    patch: "ALL",
    league: "MASTER_PLUS",
    queueId: "420",
  });
  const [data, setData] = useState<TierlistResponse | null>(null);
  const [sync, setSync] = useState<TierlistSyncStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void getTierlistSyncStatus(controller.signal)
      .then(setSync)
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!sync?.running) {
      return;
    }
    const timer = window.setInterval(() => {
      void getTierlistSyncStatus()
        .then(setSync)
        .catch(() => undefined);
    }, 2500);
    return () => window.clearInterval(timer);
  }, [sync?.running]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void getTierlist(query)
      .then((payload) => {
        if (!cancelled) {
          setData(payload);
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "No se pudo cargar la tierlist.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [query, sync?.status, sync?.matchesImported]);

  const patches = useMemo(() => {
    const values = data?.available.patches ?? [];
    return ["ALL", ...values];
  }, [data?.available.patches]);

  async function handleSync() {
    setSyncing(true);
    setError(null);
    try {
      const status = await startTierlistSync();
      setSync(status);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "No se pudo iniciar el muestreo Riot.",
      );
    } finally {
      setSyncing(false);
    }
  }

  function update<K extends keyof TierlistQuery>(key: K, value: TierlistQuery[K]) {
    setQuery((current) => ({ ...current, [key]: value }));
  }

  return (
    <>
      <header className="topbar">
        <div>
          <span className="eyebrow">Meta Riot</span>
          <h1>Tierlist</h1>
        </div>
        <button
          className="primary-button"
          type="button"
          onClick={() => void handleSync()}
          disabled={syncing || sync?.running}
        >
          {sync?.running ? "Muestreando…" : "Actualizar con Riot"}
        </button>
      </header>

      <p className="tierlist-lead">
        Winrate, pick y ban salen de ladders oficiales (League-v4) y partidas
        Match-v5, no de OP.GG. El recorte por defecto es LAS/LAN, ranked solo y
        Master+.
      </p>

      {sync?.message && (
        <p className="tierlist-sync">
          {sync.message}
          {sync.matchesImported
            ? ` · ${sync.matchesImported} partidas nuevas`
            : ""}
        </p>
      )}

      <form className="tierlist-filters" onSubmit={(event) => event.preventDefault()}>
        <label>
          Región
          <select
            value={query.platform}
            onChange={(event) => update("platform", event.target.value)}
          >
            <option value="ALL">Todas</option>
            {["LA2", "LA1", "BR1", "NA1"].map((platform) => (
              <option key={platform} value={platform}>
                {PLATFORM_LABELS[platform]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Rol
          <select
            value={query.role}
            onChange={(event) => update("role", event.target.value)}
          >
            {(data?.available.roles ?? [
              { id: "TOP", label: "Top" },
              { id: "JUNGLE", label: "Jungle" },
              { id: "MIDDLE", label: "Mid" },
              { id: "BOTTOM", label: "ADC" },
              { id: "UTILITY", label: "Support" },
              { id: "ALL", label: "Todas" },
            ]).map((role) => (
              <option key={role.id} value={role.id}>
                {role.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Parche
          <select
            value={query.patch}
            onChange={(event) => update("patch", event.target.value)}
          >
            {patches.map((patch) => (
              <option key={patch} value={patch}>
                {patch === "ALL" ? "Todos" : patch}
              </option>
            ))}
          </select>
        </label>
        <label>
          Liga
          <select
            value={query.league}
            onChange={(event) => update("league", event.target.value)}
          >
            {(data?.available.leagues ?? [
              { id: "MASTER_PLUS", label: "Master+" },
              { id: "CHALLENGER", label: "Challenger" },
              { id: "GRANDMASTER", label: "Grandmaster" },
              { id: "MASTER", label: "Master" },
              { id: "DIAMOND", label: "Diamante" },
              { id: "ALL", label: "Todas" },
            ]).map((league) => (
              <option key={league.id} value={league.id}>
                {league.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Modo
          <select
            value={query.queueId}
            onChange={(event) => update("queueId", event.target.value)}
          >
            <option value="ALL">Todos</option>
            {(data?.available.queues ?? [
              { id: 420, label: "Ranked Solo" },
              { id: 440, label: "Ranked Flex" },
              { id: 450, label: "ARAM" },
            ]).map((queue) => (
              <option key={queue.id} value={String(queue.id)}>
                {queue.label}
              </option>
            ))}
          </select>
        </label>
      </form>

      {error && <p className="lookup-message">{error}</p>}

      {loading ? (
        <section className="loading-card">Cargando meta Riot…</section>
      ) : !data?.rows.length ? (
        <section className="loading-card">
          No hay partidas agregadas todavía. Pulsa <strong>Actualizar con Riot</strong>{" "}
          con una production/development key en la API.
        </section>
      ) : (
        <div className="tierlist-table-wrap">
          <table className="tierlist-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Tier</th>
                <th>Campeón</th>
                <th>Rol</th>
                <th>WR</th>
                <th>Pick</th>
                <th>Ban</th>
                <th>KDA</th>
                <th>Juegos</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={`${row.championId}-${row.role}`}>
                  <td>{row.rank}</td>
                  <td>
                    <span className={`tier-pill tier-${row.tier.toLowerCase()}`}>
                      {row.tier}
                    </span>
                  </td>
                  <td>
                    <span className="tierlist-champ">
                      <img src={row.championIconUrl} alt="" />
                      {row.championName}
                    </span>
                  </td>
                  <td>{row.roleLabel}</td>
                  <td>{percent(row.winRate)}</td>
                  <td>{percent(row.pickRate)}</td>
                  <td>{percent(row.banRate)}</td>
                  <td>{row.kda.toFixed(2)}</td>
                  <td>{row.games}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="tierlist-footnote">
            {data.totalMatches} partidas en este recorte · fuente {data.source}
          </p>
        </div>
      )}
    </>
  );
}
