import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";

const TEAMFIGHT_COMPILATION = [
  {
    src: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/LeeSin_0.jpg",
    tag: "Baron pit · engage",
  },
  {
    src: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Yasuo_0.jpg",
    tag: "Mid collapse · knock-up",
  },
  {
    src: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Jinx_0.jpg",
    tag: "Front-to-back · ace",
  },
  {
    src: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ornn_0.jpg",
    tag: "Top side · ult chain",
  },
  {
    src: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Thresh_0.jpg",
    tag: "Bot river · hook engage",
  },
  {
    src: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ahri_0.jpg",
    tag: "Side flip · pick into 5",
  },
] as const;

const ROLE_ACADEMIES = [
  {
    role: "Top",
    blurb: "Wave control, trades y timing de TP.",
    label: "Gameplay Top",
    frames: [
      "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ornn_0.jpg",
      "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Camille_0.jpg",
      "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Aatrox_0.jpg",
    ],
  },
  {
    role: "Jungle",
    blurb: "Pathing, tempo y objetivos.",
    label: "Gameplay Jungle",
    frames: [
      "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Viego_0.jpg",
      "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/LeeSin_0.jpg",
      "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/JarvanIV_0.jpg",
    ],
  },
  {
    role: "Mid",
    blurb: "Prioridad, roam y wincons.",
    label: "Gameplay Mid",
    frames: [
      "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ahri_0.jpg",
      "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Yasuo_0.jpg",
      "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Syndra_0.jpg",
    ],
  },
  {
    role: "ADC",
    blurb: "CS, spacing y late game.",
    label: "Gameplay ADC",
    frames: [
      "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Jinx_0.jpg",
      "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Kaisa_0.jpg",
      "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ezreal_0.jpg",
    ],
  },
  {
    role: "Support",
    blurb: "Visión, roam y sinergia.",
    label: "Gameplay Support",
    frames: [
      "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Thresh_0.jpg",
      "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Nautilus_0.jpg",
      "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Lulu_0.jpg",
    ],
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

function TeamfightCompilation() {
  const index = useFrameCycle(TEAMFIGHT_COMPILATION.length, 3200);
  const current = TEAMFIGHT_COMPILATION[index];

  return (
    <div className="tf-compilation" aria-hidden="true">
      {TEAMFIGHT_COMPILATION.map((frame, frameIndex) => (
        <div
          key={frame.src}
          className={`tf-frame${frameIndex === index ? " is-active" : ""}`}
          style={{ backgroundImage: `url(${frame.src})` }}
        />
      ))}
      <div className="tf-scrim" />
      <div className="tf-hud">
        <div className="tf-hud-top">
          <span>Teamfight compilation</span>
          <strong>0{index + 1} / 0{TEAMFIGHT_COMPILATION.length}</strong>
          <span>Worlds style</span>
        </div>
        <div className="tf-hud-bars">
          <span className="fight-bar ally" />
          <span className="fight-bar enemy" />
        </div>
        <div className="tf-tag">{current.tag}</div>
      </div>
      <div className="tf-thumbs">
        {TEAMFIGHT_COMPILATION.map((frame, frameIndex) => (
          <span
            key={frame.src}
            className={`tf-thumb${frameIndex === index ? " is-active" : ""}`}
            style={{ backgroundImage: `url(${frame.src})` }}
          />
        ))}
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
  const index = useFrameCycle(frames.length, 3800 + role.length * 120);

  return (
    <button className="lane-gameplay" type="button" onClick={onSelect}>
      {frames.map((src, frameIndex) => (
        <span
          key={src}
          className={`lane-frame${frameIndex === index ? " is-active" : ""}`}
          style={{ backgroundImage: `url(${src})` }}
        />
      ))}
      <span className="lane-scrim" />
      <span className="lane-hud">
        <span className="lane-chip">{label}</span>
        <strong>{role}</strong>
        <small>{blurb}</small>
      </span>
    </button>
  );
}

function FightShowcase({ caption }: { caption: string }) {
  const index = useFrameCycle(TEAMFIGHT_COMPILATION.length, 4000);

  return (
    <div className="media-reel media-reel-xl" aria-hidden="true">
      {TEAMFIGHT_COMPILATION.map((frame, frameIndex) => (
        <div
          key={frame.src}
          className={`media-reel-frame${frameIndex === index ? " is-active" : ""}`}
          style={{ backgroundImage: `url(${frame.src})` }}
        />
      ))}
      <div className="media-reel-scrim" />
      <div className="fight-hud">
        <div className="fight-hud-top">
          <span>5v5</span>
          <strong>28:41</strong>
          <span>Ace setup</span>
        </div>
        <div className="fight-hud-bars">
          <span className="fight-bar ally" />
          <span className="fight-bar enemy" />
        </div>
        <div className="fight-feed">
          <span>{TEAMFIGHT_COMPILATION[index].tag}</span>
          <span>Engage limpio · foco carry</span>
        </div>
      </div>
      <span className="media-reel-caption">{caption}</span>
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
        <TeamfightCompilation />
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

      <section className="landing-band" data-reveal>
        <div className="landing-band-copy">
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
        <FightShowcase caption="Highlight de pelea · estilo Worlds" />
      </section>

      <section className="landing-roles" data-reveal>
        <div className="landing-roles-head">
          <span className="eyebrow">Gameplays por línea</span>
          <h2>Top, Jungle, Mid, ADC y Support</h2>
          <p>
            Paneles más grandes con rotación de jugadas por rol. Entra a tu
            academia y conecta coaching con tu camino.
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
        <FightShowcase caption="Momento de equipo · sin controles" />
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
