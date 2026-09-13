import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
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
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingArticle, setLoadingArticle] = useState(true);
  const articleRef = useRef<HTMLElement | null>(null);

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
        setSlug(newestGroup?.patches[0]?.slug ?? payload.latestSlug ?? null);
      })
      .catch((caught: unknown) => {
        setError(
          caught instanceof Error
            ? caught.message
            : "No se pudieron cargar las notas oficiales.",
        );
        setSlug(null);
        setLoadingArticle(false);
      })
      .finally(() => setLoadingList(false));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!slug) {
      setLoadingArticle(false);
      return;
    }
    const controller = new AbortController();
    setLoadingArticle(true);
    setError(null);
    void getPatchArticle(slug, controller.signal)
      .then((payload) => {
        setArticle(payload);
        articleRef.current?.scrollTo({ top: 0 });
      })
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

  const filteredPatches = useMemo(() => {
    const patches = yearGroup?.patches ?? [];
    const term = query.trim().toLowerCase();
    if (!term) return patches;
    return patches.filter(
      (patch) =>
        patch.version.toLowerCase().includes(term) ||
        patch.title.toLowerCase().includes(term),
    );
  }, [yearGroup, query]);

  function selectYear(nextYear: number) {
    setYear(nextYear);
    setQuery("");
    const group = visibleYears.find((item) => item.year === nextYear);
    const nextSlug = group?.patches[0]?.slug;
    if (nextSlug) {
      setSlug(nextSlug);
    }
  }

  function onTocClick(event: MouseEvent<HTMLAnchorElement>, id: string) {
    event.preventDefault();
    const root = articleRef.current;
    const target = root?.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
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
            className="primary-button patches-official-link"
            href={article.officialUrl}
            target="_blank"
            rel="noreferrer"
          >
            Ver en la página oficial
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M6.5 3.5H3.75A1.25 1.25 0 0 0 2.5 4.75v7.5c0 .69.56 1.25 1.25 1.25h7.5c.69 0 1.25-.56 1.25-1.25V9.5M9.5 2.5h4v4M7 9l6.5-6.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
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
                    <span className="patches-year-count">
                      {group.patches.length}
                    </span>
                  </button>
                ))}
              </div>
              <label className="patches-search">
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar 26.17…"
                  aria-label="Buscar parche"
                />
              </label>
              <div className="patches-list">
                {filteredPatches.length === 0 ? (
                  <p className="patches-nav-empty">
                    {error
                      ? "No se pudo cargar el historial de parches."
                      : "No hay parches para esa búsqueda."}
                  </p>
                ) : (
                  filteredPatches.map((patch) => (
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
                  ))
                )}
              </div>
            </>
          )}
        </aside>

        <section className="patches-stage">
          {!article && loadingArticle ? (
            <div className="loading-card">Cargando notas oficiales de Riot…</div>
          ) : article ? (
            <article
              ref={articleRef}
              className={
                loadingArticle
                  ? "patches-article is-loading"
                  : "patches-article"
              }
            >
              <div
                className={
                  article.bannerUrl
                    ? "patches-hero"
                    : "patches-hero is-plain"
                }
              >
                {article.bannerUrl && (
                  <img src={article.bannerUrl} alt="" />
                )}
                <div className="patches-hero-copy">
                  <span className="eyebrow">Versión {article.version}</span>
                  <h2>{article.title}</h2>
                  {article.publishedAt && (
                    <time dateTime={article.publishedAt}>
                      {formatDate(article.publishedAt)}
                    </time>
                  )}
                  {(article.tags ?? []).length > 0 && (
                    <div className="patches-tags">
                      {(article.tags ?? []).map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {article.blurb && <p className="patches-blurb">{article.blurb}</p>}
              {article.toc.length > 0 && (
                <nav className="patches-toc" aria-label="Índice">
                  {article.toc.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      onClick={(event) => onTocClick(event, item.id)}
                    >
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
          ) : (
            <div className="loading-card">
              Elige un parche del historial para leer las notas oficiales.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
