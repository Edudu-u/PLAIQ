import { useEffect, useRef, useState } from "react";

const RANK_EMBLEM = (tier: string) =>
  `/landing/emblems/${tier}.png`;

function loadingArt(championId: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${championId}_0.jpg`;
}

function squareArt(championId: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/16.14.1/img/champion/${championId}.png`;
}

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

const OFFER_CHAMPS = [
  "Ahri",
  "LeeSin",
  "Jinx",
  "Thresh",
  "Ornn",
  "Viego",
  "Ezreal",
  "Lulu",
  "Syndra",
  "Camille",
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

function OfferPanel() {
  return (
    <div className="offer-panel" aria-hidden="true">
      <div className="offer-panel-select">
        <div className="offer-select-grid">
          {OFFER_CHAMPS.map((id) => (
            <img key={id} src={squareArt(id)} alt="" />
          ))}
        </div>
        <div className="offer-panel-meta">
          <strong>Champion select</strong>
          <span>Draft → partida → informe</span>
        </div>
      </div>
      <div className="offer-panel-side">
        <img
          className="offer-panel-badge"
          src={RANK_EMBLEM("challenger")}
          alt=""
        />
        <svg className="offer-chart-svg" viewBox="0 0 220 90" role="img">
          <polyline
            className="offer-chart-line"
            points="6,78 36,70 66,72 96,50 126,54 156,30 186,34 214,14"
          />
          <polyline
            className="offer-chart-line alt"
            points="6,82 36,80 66,74 96,66 126,60 156,52 186,46 214,36"
          />
        </svg>
        <div className="offer-chart-stats compact">
          <span>
            <b>+LP</b>
            tendencia
          </span>
          <span>
            <b>WR</b>
            estable
          </span>
          <span>
            <b>CS</b>
            /min
          </span>
        </div>
      </div>
    </div>
  );
}

export function LandingHome({ onStartFree, onExplorePro }: LandingHomeProps) {
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
      { threshold: 0.14, rootMargin: "0px 0px -6% 0px" },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  function scrollToPlans() {
    document
      .getElementById("planes-plaiq")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="landing" ref={landingRef}>
      <header className="landing-hero-split">
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
        <figure className="landing-hero-ladder">
          <img
            src="/landing/rank-ladder-2026.png"
            alt="Ascenso de liga desde Hierro hasta Retador"
          />
          <figcaption>Ranked 2025 · 2026 · logos actuales</figcaption>
        </figure>
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

      <section className="landing-band landing-band-offer" data-reveal>
        <OfferPanel />
        <div className="landing-band-copy landing-band-copy-offer">
          <span className="eyebrow">Qué ofrecemos</span>
          <h2>Todo el ciclo: draft, partida e informe.</h2>
          <p>
            PLAIQ cubre el loop completo de mejora. Antes de la cola ves contexto
            de draft y pool; durante la sesión el escritorio captura en silencio;
            al terminar conviertes la partida en un informe accionable con
            objetivos claros para la siguiente.
          </p>
          <p>
            No es un feed de tips genéricos: conectamos tu Riot ID, historial
            Match-v5, maestrías y tendencias para que el coach hable de tu juego,
            no del de alguien más. Parche y tierlist se filtran a lo que realmente
            usas.
          </p>
          <div className="landing-feature-row">
            <article>
              <strong>Coach inteligente</strong>
              <span>
                Plan por rol con prioridades semanales, feedback postpartida y
                ajustes cuando tus números cambian.
              </span>
            </article>
            <article>
              <strong>Contenido práctico</strong>
              <span>
                Notas del parche, tierlist y focos de práctica alineados a tu
                pool — menos ruido, más decisiones útiles.
              </span>
            </article>
            <article>
              <strong>Progreso visible</strong>
              <span>
                Actividades, rachas y tendencias de LP / WR / CS para saber si el
                plan está funcionando de verdad.
              </span>
            </article>
          </div>
        </div>
      </section>

      <section className="landing-section landing-plans" id="planes-plaiq" data-reveal>
        <span className="eyebrow">Planes</span>
        <h2>Gratuito y PRO</h2>
        <p className="landing-section-lead">
          Siempre hay capa gratuita. PRO acelera el ritmo de un entrenador
          diario con más profundidad, automatización y foco en tu climb.
        </p>
        <div className="plan-compare">
          <article className="plan-panel">
            <span className="eyebrow">Gratis</span>
            <h3>PLAIQ Free</h3>
            <p className="plan-price">$0</p>
            <ul>
              <li>Vincular Riot ID y resumen de perfil</li>
              <li>Historial de partidas básico</li>
              <li>Maestrías y visión general de ranked</li>
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
            <span className="plan-badge">Más valor</span>
            <span className="eyebrow">Recomendado</span>
            <h3>PLAIQ PRO</h3>
            <p className="plan-price">
              Suscripción
              <small>cuando abramos pagos</small>
            </p>
            <p className="plan-pro-lead">
              El ritmo de un coach diario: más datos, más foco y un plan que se
              actualiza con tu climb.
            </p>
            <ul>
              <li>Sync automático del historial y tendencias de LP</li>
              <li>Coach especializado por rol (Top → Support)</li>
              <li>Plan diario personalizado con metas medibles</li>
              <li>Análisis postpartida con IA y próximos focos</li>
              <li>Tierlist y parche filtrados a tu pool</li>
              <li>Actividades ilimitadas y seguimiento semanal</li>
              <li>Prioridad en insights de winrate, CS y visión</li>
              <li>Ruta de climb con checkpoints por división</li>
              <li>Revisión de hábitos entre partidas (no en combate)</li>
              <li>Acceso anticipado a módulos tácticos nuevos</li>
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
