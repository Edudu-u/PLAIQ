export interface PatchSummary {
  slug: string;
  version: string;
  title: string;
  blurb: string;
  publishedAt: string;
  imageUrl: string | null;
  officialUrl: string;
}

export interface PatchYearGroup {
  year: number;
  patches: PatchSummary[];
}

export interface PatchIndex {
  latestSlug: string;
  years: PatchYearGroup[];
}

export interface PatchTocItem {
  id: string;
  title: string;
}

export interface PatchArticle {
  slug: string;
  version: string;
  title: string;
  blurb: string;
  publishedAt: string;
  bannerUrl: string | null;
  officialUrl: string;
  tags: string[];
  html: string;
  toc: PatchTocItem[];
}
