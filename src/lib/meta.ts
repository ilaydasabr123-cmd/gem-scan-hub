export const meta = (title: string, description: string) => ({
  meta: [
    { title: `${title} · Perlenatelier` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} · Perlenatelier` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ],
});
