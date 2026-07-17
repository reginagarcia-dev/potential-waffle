import { useEffect } from "react";

type SeoOptions = {
  title: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
  og?: {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: string;
  };
  jsonLd?: object;
};

function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[${attr}="${key}"]`,
  );
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

const JSON_LD_ID = "seo-json-ld";

function setJsonLd(data: object | undefined) {
  const existing = document.getElementById(JSON_LD_ID);
  if (!data) {
    existing?.remove();
    return;
  }
  const script =
    existing instanceof HTMLScriptElement
      ? existing
      : document.createElement("script");
  script.id = JSON_LD_ID;
  script.type = "application/ld+json";
  script.text = JSON.stringify(data);
  if (!existing) document.head.appendChild(script);
}

// Runs on route mount/change to override the static fallback tags baked into
// index.html (those exist for crawlers/scrapers that don't execute JS —
// see index.html comment). Writes directly to document.head instead of
// pulling in react-helmet-async, which only has a handful of call sites here.
export function useSeo({
  title,
  description,
  canonical,
  noindex,
  og,
  jsonLd,
}: SeoOptions) {
  useEffect(() => {
    document.title = title;

    if (description) setMeta("name", "description", description);
    setMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");
    if (canonical) setLink("canonical", canonical);

    if (og) {
      const ogTitle = og.title ?? title;
      const ogDescription = og.description ?? description;
      setMeta("property", "og:title", ogTitle);
      if (ogDescription) setMeta("property", "og:description", ogDescription);
      if (og.url) setMeta("property", "og:url", og.url);
      if (og.image) setMeta("property", "og:image", og.image);
      setMeta("property", "og:type", og.type ?? "website");
      setMeta("name", "twitter:card", "summary_large_image");
      setMeta("name", "twitter:title", ogTitle);
      if (ogDescription) setMeta("name", "twitter:description", ogDescription);
      if (og.image) setMeta("name", "twitter:image", og.image);
    }

    setJsonLd(jsonLd);

    return () => setJsonLd(undefined);
  }, [title, description, canonical, noindex, og, jsonLd]);
}
