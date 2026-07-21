import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";

const RANK_EMBLEM = (tier: string) =>
  `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-emblem/emblem-${tier}.png`;

const RANK_CLIMB = [
  {
    from: "gold",
    to: "platinum",
    label: "Promo Gold → Plat",
    season: "Split 2025",
    splash:
      "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Jinx_0.jpg",
  },
  {
    from: "platinum",
    to: "emerald",
    label: "Promo Plat → Emerald",
    season: "Split 2025",
    splash:
      "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ahri_0.jpg",
  },
  {
    from: "emerald",
    to: "diamond",
    label: "Promo Emerald → Diamond",
    season: "Split 2026",
    splash:
      "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/LeeSin_0.jpg",
  },
  {
    from: "diamond",
    to: "master",
    label: "Diamond → Master",
    season: "Split 2026",
    splash:
      "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Yasuo_0.jpg",
  },
  {
    from: "master",
    to: "grandmaster",
    label: "Master → Grandmaster",
    season: "Split 2026",
    splash:
      "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Thresh_0.jpg",
  },
  {
    from: "grandmaster",
    to: "challenger",
    label: "Grandmaster → Challenger",
    season: "Ranked 2026",
    splash:
      "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ornn_0.jpg",
  },
] as const;

const COACH_SESSIONS = [
  {
    src: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Syndra_0.jpg",
    coach: "Coach mid",
    player: "Pro mid · LCK academy",
    note: "Prioridad de wave antes del primer roam",
    tag: "VOD review · 1:1",
  },
  {
    src: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Sejuani_0.jpg",
    coach: "Coach jungle",
    player: "Pro jungler · LEC",
    note: "Pathing A → invade solo si hay info",
    tag: "Scrim notes",
  },
  {
    src: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Camille_0.jpg",
    coach: "Coach top",
    player: "Pro top · CBLOL",
    note: "TP sync con fight de Herald",
    tag: "Draft + plan",
  },
  {
    src: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Nautilus_0.jpg",
    coach: "Coach bot",
    player: "Pro ADC / Support",
    note: "Spacing en lane vs engage",
    tag: "Lane clinic",
  },
  {
    src: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Azir_0.jpg",
    coach: "Head coach",
    player: "Roster completo",
    note: "Wincon del draft y foco de pelea",
    tag: "Team talk",
  },
] as const;

const OFFER_FRAMES = [
  {
    kind: "select" as const,
    tag: "Champion select",
    title: "Draft listo",
    champs: ["Ahri", "LeeSin", "Jinx", "Thresh", "Ornn", "Viego", "Ezreal", "Lulu", "Syndra", "Camille"],
  },
  {
    kind: "challenger" as const,
    tag: "Loading Challenger",
    title: "Cola Challenger",
    splash:
      "https://ddragon.leagueoflegends.com/cdn/img/champion/loading/Yasuo_0.jpg",
  },
  {
    kind: "challenger" as const,
    tag: "Loading Challenger",
    title: "Lobby alto elo",
    splash:
      "https://ddragon.leagueoflegends.com/cdn/img/champion/loading/Ahri_0.jpg",
  },
  {
    kind: "charts" as const,
    tag: "Métricas de mejora",
    title: "LP · WR · CS/min",
  },
  {
    kind: "charts" as const,
    tag: "Tendencia semanal",
    title: "Objetivos cumplidos",
  },
] as const;

function loadingArt(championId: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${championId}_0.jpg`;
}

function squareArt(championId: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/16.14.1/img/champion/${championId}.png`;
}

const ROLE_ACADEMIES = [
  {
    role: "Top",
    blurb: "Wave control, trades y timing de TP.",
    label: "Gameplay Top",
    frames: [
      "Ornn",
      "Camille",
      "Aatrox",
      "Renekton",
      "Gwen",
      "Sett",
      "Jax",
      "Darius",
      "KSante",
      "Gnar",
    ].map(loadingArt),
  },
  {
    role: "Jungle",
    blurb: "Pathing, tempo y objetivos.",
    label: "Gameplay Jungle",
    frames: [
      "Viego",
      "LeeSin",
      "JarvanIV",
      "Sejuani",
      "Elise",
      "Nidalee",
      "Vi",
      "Belveth",
      "Graves",
      "Kindred",
    ].map(loadingArt),
  },
  {
    role: "Mid",
    blurb: "Prioridad, roam y wincons.",
    label: "Gameplay Mid",
    frames: [
      "Ahri",
      "Yasuo",
      "Syndra",
      "Orianna",
      "Zed",
      "Viktor",
      "Azir",
      "Akali",
      "Sylas",
      "Leblanc",
    ].map(loadingArt),
  },
  {
    role: "ADC",
    blurb: "CS, spacing y late game.",
    label: "Gameplay ADC",
    frames: [
      "Jinx",
      "Kaisa",
      "Ezreal",
      "Lucian",
      "Ashe",
      "MissFortune",
      "Zeri",
      "Aphelios",
      "Jhin",
      "Caitlyn",
    ].map(loadingArt),
  },
  {
    role: "Support",
    blurb: "Visión, roam y sinergia.",
    label: "Gameplay Support",
    frames: [
      "Thresh",
      "Nautilus",
      "Lulu",
      "Rakan",
      "Blitzcrank",
      "Pyke",
      "Nami",
      "Renata",
      "Milio",
      "Bard",
    ].map(loadingArt),
  },
] as const;

type LandingHomeProps = {
  onStartFree: () => void;
  onExplorePro: () => void;
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

function RankClimbHero() {
  const index = useFrameCycle(RANK_CLIMB.length, 3600);
  const current = RANK_CLIMB[index];

  return (
    <div className="tf-compilation rank-climb" aria-hidden="true">
      {RANK_CLIMB.map((frame, frameIndex) => (
        <div
          key={frame.label}
          className={`rank-climb-frame${frameIndex === index ? " is-active" : ""}`}
          style={{ backgroundImage: `url(${frame.splash})` }}
        />
      ))}
      <div className="tf-scrim" />
      <div className="rank-climb-stage">
        <img
          className="rank-climb-emblem from"
          src={RANK_EMBLEM(current.from)}
          alt=""
        />
        <span className="rank-climb-arrow" />
        <img
          className="rank-climb-emblem to"
          src={RANK_EMBLEM(current.to)}
          alt=""
        />
      </div>
      <div className="tf-hud">
        <div className="tf-hud-top">
          <span>Ascenso ranked</span>
          <strong>{current.season}</strong>
          <span>Logos actuales</span>
        </div>
        <div className="tf-hud-bars">
          <span className="fight-bar ally" />
          <span className="fight-bar enemy" />
        </div>
        <div className="tf-tag">{current.label}</div>
      </div>
    </div>
  );
}

function LaneGameplay({
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
    <button className="lane-gameplay" type="button" onClick={onSelect}>
      <span className="lane-art-stage">
        {frames.map((src, frameIndex) => (
          <img
            key={src}
            className={`lane-art${frameIndex === index ? " is-active" : ""}`}
            src={src}
            alt=""
          />
        ))}
      </span>
      <span className="lane-scrim" />
      <span className="lane-hud">
        <span className="lane-chip">{label}</span>
        <strong>{role}</strong>
        <small>{blurb}</small>
      </span>
    </button>
  );
}

function CoachShowcase({ caption }: { caption: string }) {
  const index = useFrameCycle(COACH_SESSIONS.length, 4200);
  const current = COACH_SESSIONS[index];

  return (
    <div className="media-reel media-reel-xl coach-reel" aria-hidden="true">
      {COACH_SESSIONS.map((frame, frameIndex) => (
        <div
          key={frame.src}
          className={`media-reel-frame${frameIndex === index ? " is-active" : ""}`}
          style={{ backgroundImage: `url(${frame.src})` }}
        />
      ))}
      <div className="media-reel-scrim" />
      <div className="coach-hud">
        <div className="coach-call">
          <span className="coach-pill live">En vivo</span>
          <strong>{current.coach}</strong>
          <span>→ {current.player}</span>
        </div>
        <div className="coach-note">{current.note}</div>
        <div className="coach-chips">
          <span>VOD</span>
          <span>Objetivos</span>
          <span>Repetición</span>
        </div>
      </div>
      <span className="media-reel-caption">
        {caption} · {current.tag}
      </span>
    </div>
  );
}

function OfferShowcase() {
  const index = useFrameCycle(OFFER_FRAMES.length, 3800);
  const current = OFFER_FRAMES[index];

  return (
    <div className="media-reel media-reel-xl offer-reel" aria-hidden="true">
      {OFFER_FRAMES.map((frame, frameIndex) => {
        const active = frameIndex === index;
        if (frame.kind === "select") {
          return (
            <div
              key={`select-${frameIndex}`}
              className={`offer-frame offer-select${active ? " is-active" : ""}`}
            >
              <div className="offer-select-grid">
                {frame.champs.map((id) => (
                  <img key={id} src={squareArt(id)} alt="" />
                ))}
              </div>
              <div className="offer-select-meta">
                <strong>{frame.title}</strong>
                <span>Bans listos · roles asignados</span>
              </div>
            </div>
          );
        }
        if (frame.kind === "challenger") {
          return (
            <div
              key={frame.splash}
              className={`offer-frame offer-challenger${active ? " is-active" : ""}`}
            >
              <img className="offer-challenger-art" src={frame.splash} alt="" />
              <img
                className="offer-challenger-badge"
                src={RANK_EMBLEM("challenger")}
                alt=""
              />
              <strong>{frame.title}</strong>
            </div>
          );
        }
        return (
          <div
            key={`charts-${frameIndex}`}
            className={`offer-frame offer-charts${active ? " is-active" : ""}`}
          >
            <strong>{frame.title}</strong>
            <svg className="offer-chart-svg" viewBox="0 0 320 140" role="img">
              <polyline
                className="offer-chart-line"
                points="8,118 48,102 88,108 128,74 168,82 208,48 248,56 308,22"
              />
              <polyline
                className="offer-chart-line alt"
                points="8,124 48,120 88,112 128,98 168,90 208,78 248,70 308,52"
              />
            </svg>
            <div className="offer-chart-stats">
              <span>
                <b>+214 LP</b>
                semana
              </span>
              <span>
                <b>58% WR</b>
                20 partidas
              </span>
              <span>
                <b>7.4 CS</b>
                /min
              </span>
            </div>
          </div>
        );
      })}
      <span className="media-reel-caption">{current.tag}</span>
    </div>
  );
}

export function LandingHome({ onStartFree, onExplorePro }: LandingHomeProps) {
  const landingRef = useRef<HTMLDivElement | null>(null);
  const heroRef = useRef<HTMLElement | null>(null);

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
      { threshold: 0.14, rootMargin: "0px 0px -6% 0px" },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  function handlePointerMove(event: MouseEvent<HTMLElement>) {
    const hero = heroRef.current;
    if (!hero) {
      return;
    }
    const rect = hero.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    hero.style.setProperty("--spot-x", `${x}%`);
    hero.style.setProperty("--spot-y", `${y}%`);
  }

  function scrollToPlans() {
    document
      .getElementById("planes-plaiq")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="landing" ref={landingRef}>
      <header
        className="landing-hero-pro landing-hero-compilation"
        ref={heroRef}
        onMouseMove={handlePointerMove}
      >
        <RankClimbHero />
        <div className="landing-hero-scrim" aria-hidden="true" />

        <div className="landing-hero-content">
          <span className="eyebrow">Centro táctico PLAIQ</span>
          <h1>MEJORAR EN RANKED NUNCA FUE TAN CLARO.</h1>
          <p>
            Coaching personalizado entre partidas, objetivos medibles y un plan
            para tu rol. Sin copiloto en combate: progreso real fuera de la
            Rift.
          </p>
          <div className="landing-cta">
            <button
              className="primary-button"
              type="button"
              onClick={onStartFree}
            >
              Empezar gratis
            </button>
            <button
              className="ghost-button"
              type="button"
              onClick={scrollToPlans}
            >
              Ver planes
            </button>
          </div>
        </div>
      </header>

      <section className="landing-band landing-band-coach" data-reveal>
        <div className="landing-band-copy landing-band-copy-wide">
          <span className="eyebrow">Por qué un coach</span>
          <h2>La diferencia está entre partidas, no en el chat.</h2>
          <p>
            Un coach personalizado traduce tu historial en hábitos concretos:
            qué practicar hoy, qué corregir mañana y cómo medir si estás
            subiendo de verdad. PLAIQ combina métricas objetivas con IA para
            proponerte el siguiente paso — sin gritarte pelees en vivo.
          </p>
          <ul className="landing-check-list">
            <li>Diagnóstico con datos de Match-v5 y tu perfil Riot</li>
            <li>Objetivos diarios/semanales que sí se pueden completar</li>
            <li>Foco en tu rol, tu pool y el parche actual</li>
          </ul>
        </div>
        <CoachShowcase caption="Coach → proplayer" />
      </section>

      <section className="landing-roles" data-reveal>
        <div className="landing-roles-head">
          <span className="eyebrow">Gameplays por línea</span>
          <h2>Top, Jungle, Mid, ADC y Support</h2>
          <p>
            Rotación amplia de campeones por rol. Entra a tu academia y conecta
            coaching con tu camino.
          </p>
        </div>
        <div className="lane-gameplay-grid">
          {ROLE_ACADEMIES.map((item) => (
            <LaneGameplay
              key={item.role}
              role={item.role}
              label={item.label}
              blurb={item.blurb}
              frames={item.frames}
              onSelect={onExplorePro}
            />
          ))}
        </div>
      </section>

      <section className="landing-band landing-band-reverse" data-reveal>
        <OfferShowcase />
        <div className="landing-band-copy">
          <span className="eyebrow">Qué ofrecemos</span>
          <h2>Todo el ciclo: draft, partida e informe.</h2>
          <p>
            Perfiles Riot, historial, maestrías, coaching con metas, lectura de
            parche y tierlist. El escritorio captura en silencio; el análisis
            ocurre cuando terminas de jugar.
          </p>
          <div className="landing-feature-row">
            <article>
              <strong>Coach inteligente</strong>
              <span>Plan claro según tu rol y tus números.</span>
            </article>
            <article>
              <strong>Contenido práctico</strong>
              <span>Parche y tierlist filtrados a lo que usas.</span>
            </article>
            <article>
              <strong>Progreso visible</strong>
              <span>Actividades y tendencias que puedes revisar.</span>
            </article>
          </div>
        </div>
      </section>

      <section className="landing-section" id="planes-plaiq" data-reveal>
        <span className="eyebrow">Planes</span>
        <h2>Gratuito y PRO</h2>
        <p className="landing-section-lead">
          Siempre hay capa gratuita. PRO acelera el ritmo de un entrenador
          diario.
        </p>
        <div className="plan-compare">
          <article className="plan-panel">
            <span className="eyebrow">Gratis</span>
            <h3>PLAIQ Free</h3>
            <p className="plan-price">$0</p>
            <ul>
              <li>Vincular Riot ID y resumen de perfil</li>
              <li>Historial de partidas básico</li>
              <li>Coach general con cupo limitado</li>
              <li>Actividades semanales limitadas</li>
              <li>Notas del Parche resumidas</li>
            </ul>
            <button
              className="ghost-button"
              type="button"
              onClick={onStartFree}
            >
              Empezar en Free
            </button>
          </article>

          <article className="plan-panel plan-panel-pro">
            <span className="eyebrow">Recomendado</span>
            <h3>PLAIQ PRO</h3>
            <p className="plan-price">
              Suscripción
              <small>cuando abramos pagos</small>
            </p>
            <ul>
              <li>Sync automático y tendencias</li>
              <li>Coach especializado por rol</li>
              <li>Plan diario personalizado</li>
              <li>Análisis postpartida con IA</li>
              <li>Tierlist y parche para tu pool</li>
            </ul>
            <button
              className="primary-button"
              type="button"
              onClick={onExplorePro}
            >
              Explorar coaching PRO
            </button>
          </article>
        </div>
      </section>

      <section className="landing-finale" data-reveal>
        <div
          className="landing-finale-art"
          style={{
            backgroundImage:
              "url(https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Yasuo_0.jpg)",
          }}
          aria-hidden="true"
        />
        <div className="landing-finale-copy">
          <h2>Empieza tu climb con un plan, no con suerte.</h2>
          <p>
            Vincula tu Riot ID, mira tu historial y deja que PLAIQ te marque el
            siguiente objetivo.
          </p>
          <button
            className="primary-button"
            type="button"
            onClick={onStartFree}
          >
            Empezar ahora
          </button>
        </div>
      </section>
    </div>
  );
}
