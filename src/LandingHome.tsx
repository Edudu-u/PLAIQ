import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";

const SPLASH_BACKDROPS = [
  "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ahri_0.jpg",
  "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Jinx_0.jpg",
  "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Yasuo_0.jpg",
  "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Thresh_0.jpg",
  "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/LeeSin_0.jpg",
  "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Lux_0.jpg",
];

const AMBIENT_VIDEO =
  "https://videos.pexels.com/video-files/5752729/5752729-uhd_2560_1440_30fps.mp4";

type LandingHomeProps = {
  onStartFree: () => void;
  onExplorePro: () => void;
};

export function LandingHome({ onStartFree, onExplorePro }: LandingHomeProps) {
  const stageRef = useRef<HTMLElement | null>(null);
  const [splashIndex, setSplashIndex] = useState(0);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) {
      return;
    }

    const timer = window.setInterval(() => {
      setSplashIndex((current) => (current + 1) % SPLASH_BACKDROPS.length);
    }, 7000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const root = stageRef.current?.closest(".landing");
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
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  function handlePointerMove(event: MouseEvent<HTMLElement>) {
    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    const rect = stage.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    stage.style.setProperty("--spot-x", `${x}%`);
    stage.style.setProperty("--spot-y", `${y}%`);
    stage.style.setProperty("--tilt-x", `${(x - 50) / 28}deg`);
    stage.style.setProperty("--tilt-y", `${(50 - y) / 36}deg`);
  }

  function scrollToPlans() {
    document
      .getElementById("planes-plaiq")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="landing">
      <header
        className="landing-stage"
        ref={stageRef}
        onMouseMove={handlePointerMove}
      >
        <div className="landing-media" aria-hidden="true">
          <video
            className={`landing-video${videoReady ? " is-ready" : ""}`}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            onCanPlay={() => setVideoReady(true)}
          >
            <source src={AMBIENT_VIDEO} type="video/mp4" />
          </video>

          {SPLASH_BACKDROPS.map((src, index) => (
            <div
              key={src}
              className={`landing-splash${index === splashIndex ? " is-active" : ""}`}
              style={{ backgroundImage: `url(${src})` }}
            />
          ))}

          <div className="landing-scrim" />
          <div className="landing-spot" />
          <div className="landing-grain" />
        </div>

        <div className="landing-stage-inner">
          <div className="landing-hero-copy">
            <p className="brand-hero">PLAIQ</p>
            <h1>Tu entrenador personal para League.</h1>
            <p className="hero-copy">
              Coaching entre partidas con objetivos medibles y progreso real —
              no un copiloto que te diga cómo pelear.
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

          <div className="landing-hero-visual" aria-hidden="true">
            <div className="landing-radar" />
            <div className="landing-radar-core">
              <span>PLAY</span>
              <strong>IQ</strong>
            </div>
          </div>
        </div>
      </header>

      <section className="landing-section" data-reveal>
        <span className="eyebrow">Qué es PLAIQ</span>
        <h2>Play IQ: inteligencia para mejorar de verdad</h2>
        <p>
          PLAIQ acompaña todo el ciclo — draft, partida e informe — con foco en
          hábitos y métricas. Las estadísticas se calculan en código; la IA
          interpreta y propone el plan. Tu Riot API Key y OpenAI viven solo en
          el backend: el escritorio nunca las ve.
        </p>
      </section>

      <section className="landing-section" data-reveal>
        <span className="eyebrow">Sistema</span>
        <h2>Todo lo que ofrece el centro táctico</h2>
        <ul className="landing-offer-list">
          <li>
            <strong>Perfiles Riot</strong>
            <span>
              Vincula tu Riot ID, rangos Solo/Flex/TFT, maestrías e historial
              Match-v5 sin exponer tu PUUID.
            </span>
          </li>
          <li>
            <strong>Coaching con objetivos</strong>
            <span>
              Metas medibles (CS, visión, muertes tempranas) y un coach que
              habla claro entre partidas.
            </span>
          </li>
          <li>
            <strong>Draft inteligente</strong>
            <span>
              Alternativas puntuadas con tu rendimiento, maestría y sinergia —
              sin órdenes ni tracking enemigo oculto.
            </span>
          </li>
          <li>
            <strong>Tierlist y parche</strong>
            <span>
              Lectura del meta y notas del parche filtradas a tu rol y pool para
              decidir qué practicar.
            </span>
          </li>
          <li>
            <strong>Captura en partida</strong>
            <span>
              Recopilación silenciosa desde Live Client; HUD opcional solo con
              metas que ya definiste.
            </span>
          </li>
        </ul>
      </section>

      <section className="landing-section" id="planes-plaiq" data-reveal>
        <span className="eyebrow">Planes</span>
        <h2>Gratuito y PRO</h2>
        <p className="landing-section-lead">
          Hay capa gratuita siempre. PRO desbloquea el ritmo diario de un
          entrenador de verdad.
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
              <li>Acceso a Notas del Parche resumidas</li>
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
              <li>Sync automático y tendencias de progreso</li>
              <li>Coach especializado por rol</li>
              <li>Plan diario personalizado</li>
              <li>Análisis postpartida con IA</li>
              <li>Tierlist y parche orientados a tu pool</li>
              <li>Prioridad en nuevas herramientas de coaching</li>
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
    </div>
  );
}
