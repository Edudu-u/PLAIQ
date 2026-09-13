import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { BrandLogo } from "./BrandLogo";

function loadingArt(championId: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${championId}_0.jpg`;
}

const ROLE_ACADEMIES = [
  {
    role: "Top",
    blurb: "Wave, trades y TP.",
    label: "Top",
    frames: ["Ornn", "Camille", "Aatrox", "Renekton", "Gwen", "Sett"].map(
      loadingArt,
    ),
  },
  {
    role: "Jungle",
    blurb: "Pathing y objetivos.",
    label: "Jungle",
    frames: ["Viego", "LeeSin", "JarvanIV", "Sejuani", "Elise", "Nidalee"].map(
      loadingArt,
    ),
  },
  {
    role: "Mid",
    blurb: "Prioridad y roam.",
    label: "Mid",
    frames: ["Ahri", "Yasuo", "Syndra", "Orianna", "Zed", "Viktor"].map(
      loadingArt,
    ),
  },
  {
    role: "ADC",
    blurb: "CS y spacing.",
    label: "ADC",
    frames: ["Jinx", "Kaisa", "Ezreal", "Lucian", "Ashe", "Zeri"].map(
      loadingArt,
    ),
  },
  {
    role: "Support",
    blurb: "Visión y sinergia.",
    label: "Support",
    frames: ["Thresh", "Nautilus", "Lulu", "Rakan", "Pyke", "Nami"].map(
      loadingArt,
    ),
  },
] as const;

const HOME_MODULES = [
  {
    id: "perfiles",
    title: "Perfiles",
    blurb: "Riot ID, ranked, maestrías e historial Match-v5.",
    tag: "Lookup",
  },
  {
    id: "coaching",
    title: "Coaching",
    blurb: "Plan por rol, metas medibles y feedback entre partidas.",
    tag: "PRO",
  },
  {
    id: "tierlist",
    title: "Tierlist",
    blurb: "Prioridades del parche filtradas a tu pool.",
    tag: "Meta",
  },
  {
    id: "notas-parche",
    title: "Notas del Parche",
    blurb: "Cambios que importan para tu climb, sin ruido.",
    tag: "Patch",
  },
] as const;

type HomeModuleId = (typeof HOME_MODULES)[number]["id"];

type LandingHomeProps = {
  gameName: string;
  tagLine: string;
  platform: string;
  isSearching: boolean;
  lookupMessage: string | null;
  onGameNameChange: (value: string) => void;
  onTagLineChange: (value: string) => void;
  onPlatformChange: (value: string) => void;
  onLookup: (event: FormEvent<HTMLFormElement>) => void;
  onOpenModule: (id: HomeModuleId) => void;
};

function useFrameCycle(length: number, intervalMs: number) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (length <= 1) {
      return;
    }
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) {
      return;
    }
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % length);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs, length]);

  return index;
}

function RoleCard({
  role,
  label,
  blurb,
  frames,
  onSelect,
}: {
  role: string;
  label: string;
  blurb: string;
  frames: readonly string[];
  onSelect: () => void;
}) {
  const index = useFrameCycle(frames.length, 3200 + role.length * 90);

  return (
    <button className="blitz-role" type="button" onClick={onSelect}>
      <span className="blitz-role-art">
        {frames.map((src, frameIndex) => (
          <img
            key={src}
            className={frameIndex === index ? "is-active" : ""}
            src={src}
            alt=""
          />
        ))}
      </span>
      <span className="blitz-role-copy">
        <strong>{label}</strong>
        <small>{blurb}</small>
      </span>
    </button>
  );
}

export function LandingHome({
  gameName,
  tagLine,
  platform,
  isSearching,
  lookupMessage,
  onGameNameChange,
  onTagLineChange,
  onPlatformChange,
  onLookup,
  onOpenModule,
}: LandingHomeProps) {
  const landingRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = landingRef.current;
    if (!root) {
      return;
    }

    const nodes = root.querySelectorAll<HTMLElement>("[data-reveal]");
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      nodes.forEach((node) => node.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -4% 0px" },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  function scrollToPlans() {
    document
      .getElementById("planes-playq")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="blitz-home" ref={landingRef}>
      <section className="blitz-hero">
        <div className="blitz-hero-glow" aria-hidden="true" />
        <div className="blitz-hero-brand">
          <BrandLogo className="brand-logo brand-logo-hero" />
          <p className="blitz-hero-wordmark">PLAYQ.GG</p>
        </div>
        <h1>Busca un invocador. Mejora con un plan.</h1>
        <p className="blitz-hero-lead">
          Perfiles Riot, coaching entre partidas, tierlist y parche — todo en un
          centro táctico para ranked.
        </p>

        <form className="blitz-search" onSubmit={onLookup}>
          <label className="blitz-search-name">
            <span>Riot ID</span>
            <input
              value={gameName}
              onChange={(event) => onGameNameChange(event.target.value)}
              maxLength={64}
              placeholder="Nombre"
              required
            />
          </label>
          <span className="blitz-search-hash" aria-hidden="true">
            #
          </span>
          <label className="blitz-search-tag">
            <span>Tag</span>
            <input
              value={tagLine}
              onChange={(event) => onTagLineChange(event.target.value)}
              maxLength={16}
              placeholder="TAG"
              required
            />
          </label>
          <label className="blitz-search-region">
            <span>Región</span>
            <select
              value={platform}
              onChange={(event) => onPlatformChange(event.target.value)}
            >
              <option value="LA2">LAS</option>
              <option value="LA1">LAN</option>
              <option value="BR1">BR</option>
              <option value="NA1">NA</option>
            </select>
          </label>
          <button className="primary-button blitz-search-submit" disabled={isSearching}>
            {isSearching ? "Buscando…" : "Buscar"}
          </button>
        </form>

        {lookupMessage && <p className="lookup-message">{lookupMessage}</p>}

        <div className="blitz-hero-actions">
          <button className="ghost-button" type="button" onClick={scrollToPlans}>
            Ver planes
          </button>
          <button
            className="ghost-button"
            type="button"
            onClick={() => onOpenModule("coaching")}
          >
            Explorar coaching
          </button>
        </div>
      </section>

      <section className="blitz-section" data-reveal>
        <div className="blitz-section-head">
          <span className="eyebrow">Herramientas</span>
          <h2>Todo lo que puedes hacer en PLAYQ.GG</h2>
        </div>
        <div className="blitz-modules">
          {HOME_MODULES.map((mod) => (
            <button
              key={mod.id}
              className="blitz-module"
              type="button"
              onClick={() => onOpenModule(mod.id)}
            >
              <span className="blitz-module-tag">{mod.tag}</span>
              <strong>{mod.title}</strong>
              <span>{mod.blurb}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="blitz-section" data-reveal>
        <div className="blitz-section-head">
          <span className="eyebrow">Por rol</span>
          <h2>Elige tu línea y entra al plan</h2>
        </div>
        <div className="blitz-roles">
          {ROLE_ACADEMIES.map((item) => (
            <RoleCard
              key={item.role}
              role={item.role}
              label={item.label}
              blurb={item.blurb}
              frames={item.frames}
              onSelect={() => onOpenModule("coaching")}
            />
          ))}
        </div>
      </section>

      <section
        className="blitz-section landing-plans"
        id="planes-playq"
        data-reveal
      >
        <div className="blitz-section-head">
          <span className="eyebrow">Planes</span>
          <h2>Gratis para empezar. PRO para acelerar.</h2>
          <p>
            Misma base de perfiles e historial. PRO suma coach por rol, plan
            diario y análisis postpartida.
          </p>
        </div>
        <div className="plan-compare">
          <article className="plan-panel">
            <span className="eyebrow">Gratis</span>
            <h3>PLAYQ Free</h3>
            <p className="plan-price">$0</p>
            <ul>
              <li>Vincular Riot ID y resumen de perfil</li>
              <li>Historial de partidas básico</li>
              <li>Maestrías y ranked overview</li>
              <li>Coach general con cupo limitado</li>
              <li>Notas del Parche resumidas</li>
            </ul>
            <button
              className="ghost-button"
              type="button"
              onClick={() => onOpenModule("perfiles")}
            >
              Empezar en Free
            </button>
          </article>

          <article className="plan-panel plan-panel-pro">
            <span className="plan-badge">Más valor</span>
            <span className="eyebrow">Recomendado</span>
            <h3>PLAYQ PRO</h3>
            <p className="plan-price">
              Suscripción
              <small>cuando abramos pagos</small>
            </p>
            <ul>
              <li>Sync automático y tendencias de LP</li>
              <li>Coach especializado por rol</li>
              <li>Plan diario con metas medibles</li>
              <li>Análisis postpartida con IA</li>
              <li>Tierlist y parche para tu pool</li>
              <li>Actividades ilimitadas y checkpoints</li>
            </ul>
            <button
              className="primary-button"
              type="button"
              onClick={() => onOpenModule("coaching")}
            >
              Explorar coaching PRO
            </button>
          </article>
        </div>
      </section>
    </div>
  );
}
