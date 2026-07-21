import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";

const HERO_SPLASH =
  "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Mordekaiser_0.jpg";

const FIGHT_FRAMES = [
  "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/LeeSin_0.jpg",
  "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Yasuo_0.jpg",
  "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Jinx_0.jpg",
  "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Thresh_0.jpg",
  "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ahri_0.jpg",
];

const ROLE_ACADEMIES = [
  {
    role: "Top",
    blurb: "Wave control, trades y timing de TP con objetivos claros.",
    splash: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ornn_0.jpg",
  },
  {
    role: "Jungle",
    blurb: "Pathing, tempo y decisiones de objetivo sin ruido táctico.",
    splash: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Viego_0.jpg",
  },
  {
    role: "Mid",
    blurb: "Prioridad de línea, roaming y win conditions medibles.",
    splash: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ahri_0.jpg",
  },
  {
    role: "ADC",
    blurb: "CS, posicionamiento y consistencia en mid/late game.",
    splash: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Jinx_0.jpg",
  },
  {
    role: "Support",
    blurb: "Visión, roam windows y sinergia con tu carry.",
    splash: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Thresh_0.jpg",
  },
] as const;

type LandingHomeProps = {
  onStartFree: () => void;
  onExplorePro: () => void;
};

function FightShowcase({ caption }: { caption: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) {
      return;
    }
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % FIGHT_FRAMES.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="media-reel media-reel-fight" aria-hidden="true">
      {FIGHT_FRAMES.map((src, frameIndex) => (
        <div
          key={src}
          className={`media-reel-frame${frameIndex === index ? " is-active" : ""}`}
          style={{ backgroundImage: `url(${src})` }}
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
          <span>Equipo azul inicia</span>
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
      { threshold: 0.16, rootMargin: "0px 0px -6% 0px" },
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
        className="landing-hero-pro"
        ref={heroRef}
        onMouseMove={handlePointerMove}
      >
        <div
          className="landing-hero-art"
          style={{ backgroundImage: `url(${HERO_SPLASH})` }}
          aria-hidden="true"
        />
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
          <span className="eyebrow">Sistema por rol</span>
          <h2>Elige tu academia táctica</h2>
          <p>
            Cada rol tiene un camino distinto. Empieza por el tuyo y conecta
            coaching, historial y metas en el mismo centro.
          </p>
        </div>
        <div className="role-academy-grid">
          {ROLE_ACADEMIES.map((item) => (
            <button
              key={item.role}
              className="role-academy"
              type="button"
              onClick={onExplorePro}
              style={{ backgroundImage: `url(${item.splash})` }}
            >
              <span className="role-academy-scrim" />
              <span className="role-academy-body">
                <strong>{item.role}</strong>
                <small>{item.blurb}</small>
                <span className="role-academy-cta">Entrar a {item.role}</span>
              </span>
            </button>
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
