import { useEffect, useMemo, useState } from "react";
import { getPatchArticle, getPatchIndex } from "./lib/api";
import type { PatchArticle, PatchIndex } from "./types/patches";

function formatDate(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function PatchNotesView() {
  const [index, setIndex] = useState<PatchIndex | null>(null);
  const [article, setArticle] = useState<PatchArticle | null>(null);
  const [year, setYear] = useState<number | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingArticle, setLoadingArticle] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoadingList(true);
    void getPatchIndex(controller.signal)
      .then((payload) => {
        setIndex(payload);
        const newestYear = payload.years.length
          ? Math.max(...payload.years.map((group) => group.year))
          : null;
        setYear(newestYear);
        const newestGroup = payload.years.find(
          (group) => group.year === newestYear,
        );
        setSlug(newestGroup?.patches[0]?.slug ?? payload.latestSlug);
      })
      .catch((caught: unknown) => {
        setError(
          caught instanceof Error
            ? caught.message
            : "No se pudieron cargar las notas oficiales.",
        );
      })
      .finally(() => setLoadingList(false));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!slug) {
      return;
    }
    const controller = new AbortController();
    setLoadingArticle(true);
    setError(null);
    void getPatchArticle(slug, controller.signal)
      .then(setArticle)
      .catch((caught: unknown) => {
        setError(
          caught instanceof Error
            ? caught.message
            : "No se pudo abrir ese parche.",
        );
      })
      .finally(() => setLoadingArticle(false));
    return () => controller.abort();
  }, [slug]);

  const visibleYears = useMemo(() => {
    const years = index?.years ?? [];
    if (!years.length) return [];
    const newest = Math.max(...years.map((group) => group.year));
    return years.filter((group) => group.year === newest);
  }, [index]);

  const yearGroup = useMemo(
    () =>
      visibleYears.find((group) => group.year === year) ?? visibleYears[0],
    [visibleYears, year],
  );

  function selectYear(nextYear: number) {
    setYear(nextYear);
    const group = visibleYears.find((item) => item.year === nextYear);
    const nextSlug = group?.patches[0]?.slug;
    if (nextSlug) {
      setSlug(nextSlug);
    }
  }

  return (
    <div className="patches-shell">
      <header className="topbar">
        <div>
          <span className="eyebrow">Actualizaciones</span>
          <h1>Notas del Parche</h1>
        </div>
        {article && (
          <a
            className="ghost-button"
            href={article.officialUrl}
            target="_blank"
            rel="noreferrer"
          >
            Ver en LoL
          </a>
        )}
      </header>

      {error && <p className="lookup-message">{error}</p>}

      <div className="patches-layout">
        <aside className="patches-nav">
          <p className="patches-nav-kicker">Historial</p>
          {loadingList ? (
            <p className="patches-nav-empty">Cargando versiones…</p>
          ) : (
            <>
              <div className="patches-years" role="tablist" aria-label="Año">
                {visibleYears.map((group) => (
                  <button
                    key={group.year}
                    type="button"
                    role="tab"
                    className={group.year === year ? "is-active" : ""}
                    onClick={() => selectYear(group.year)}
                  >
                    {group.year}
                  </button>
                ))}
              </div>
              <div className="patches-list">
                {yearGroup?.patches.map((patch) => (
                  <button
                    key={patch.slug}
                    type="button"
                    className={patch.slug === slug ? "is-active" : ""}
                    onClick={() => setSlug(patch.slug)}
                  >
                    <strong>
                      {patch.version}
                      {patch.slug === index?.latestSlug ? (
                        <span className="patch-latest">Última</span>
                      ) : null}
                    </strong>
                    <small>{formatDate(patch.publishedAt)}</small>
                  </button>
                ))}
              </div>
            </>
          )}
        </aside>

        <section className="patches-stage">
          {loadingArticle || !article ? (
            <div className="loading-card">Cargando notas oficiales de Riot…</div>
          ) : (
            <article className="patches-article">
              {article.bannerUrl && (
                <div className="patches-hero">
                  <img src={article.bannerUrl} alt="" />
                  <div className="patches-hero-copy">
                    <span className="eyebrow">Versión {article.version}</span>
                    <h2>{article.title}</h2>
                    <time dateTime={article.publishedAt}>
                      {formatDate(article.publishedAt)}
                    </time>
                  </div>
                </div>
              )}
              {article.blurb && <p className="patches-blurb">{article.blurb}</p>}
              {article.toc.length > 0 && (
                <nav className="patches-toc" aria-label="Índice">
                  {article.toc.map((item) => (
                    <a key={item.id} href={`#${item.id}`}>
                      {item.title}
                    </a>
                  ))}
                </nav>
              )}
              <div
                className="patches-html"
                dangerouslySetInnerHTML={{ __html: article.html }}
              />
            </article>
          )}
        </section>
      </div>
    </div>
  );
}
