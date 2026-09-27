import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// One YAML file per language in src/content/site/ (fr.yaml, en.yaml), plus a
// shared links.yaml (Steam, itch.io, shorts, social) — the shape a CMS (Decap)
// edits directly, no separate database.
const kv = z.object({ k: z.string(), v: z.string() });

const siteSchema = z.object({
  lang: z.string(),
  htmlLang: z.string(),
  title: z.string(),
  description: z.string(),
  switchLabel: z.string(),
  switchTitle: z.string(),
  nav: z.object({
    expedition: z.string(),
    museum: z.string(),
    raiders: z.string(),
    biomes: z.string(),
    studio: z.string(),
    videos: z.string(),
    fungus: z.string(),
    wishlist: z.string(),
    steamSoon: z.string(),
  }),
  hero: z.object({
    kicker: z.string(),
    title: z.string(),
    lede: z.string(),
    cta: z.string(),
    steamSoon: z.string(),
    follow: z.string(),
    secondary: z.string(),
    soon: z.string(),
    alt: z.string(),
  }),
  expedition: z.object({
    eyebrow: z.string(),
    title: z.string(),
    intro: z.string(),
    steps: z.array(z.object({ n: z.string(), title: z.string(), text: z.string(), img: z.string(), alt: z.string() })),
  }),
  game: z.object({
    eyebrow: z.string(),
    title: z.string(),
    text: z.array(z.string()),
    quote: z.string(),
    quoteAlt: z.string(),
    pillars: z.array(kv),
  }),
  museum: z.object({
    eyebrow: z.string(),
    title: z.string(),
    intro: z.string(),
    label: z.string(),
    specimens: z.array(z.object({ no: z.string(), name: z.string(), era: z.string(), note: z.string(), img: z.string(), alt: z.string() })),
  }),
  raiders: z.object({
    eyebrow: z.string(),
    title: z.string(),
    intro: z.string(),
    inGame: z.string(),
    list: z.array(z.object({ id: z.string(), name: z.string(), tag: z.string(), text: z.string(), alt: z.string() })),
  }),
  biomes: z.object({
    eyebrow: z.string(),
    title: z.string(),
    intro: z.string(),
    prev: z.string(),
    next: z.string(),
    list: z.array(z.object({ name: z.string(), text: z.string(), img: z.string() })),
    more: z.object({ name: z.string(), text: z.string() }),
  }),
  travel: z.object({
    eyebrow: z.string(),
    title: z.string(),
    text: z.string(),
    balloonAlt: z.string(),
    mapAlt: z.string(),
  }),
  wishlist: z.object({
    title: z.string(),
    soonTitle: z.string(),
    text: z.string(),
    soonText: z.string(),
    reasons: z.array(z.string()),
    cta: z.string(),
    steamSoon: z.string(),
    follow: z.string(),
  }),
  studio: z.object({
    eyebrow: z.string(),
    title: z.string(),
    text: z.array(z.string()),
    from: z.string(),
    team: z.array(z.object({ name: z.string(), role: z.string(), img: z.string(), alt: z.string() })),
    bearAlt: z.string(),
  }),
  fungus: z.object({
    eyebrow: z.string(),
    title: z.string(),
    text: z.array(z.string()),
    facts: z.array(kv),
    cta: z.string(),
    demo: z.string(),
    video: z.string(),
    videoAlt: z.string(),
    handheldAlt: z.string(),
    bandAlt: z.string(),
  }),
  footer: z.object({
    tagline: z.string(),
    links: z.string(),
    rights: z.string(),
    steam: z.string(),
    steamSoon: z.string(),
    itch: z.string(),
    anorak: z.string(),
  }),
  videos: z.object({
    eyebrow: z.string(),
    title: z.string(),
    text: z.string(),
    play: z.string(),
    prev: z.string(),
    next: z.string(),
    more: z.string(),
    followTitle: z.string(),
    followText: z.string(),
    followAll: z.string(),
  }),
  social: z.object({ title: z.string(), text: z.string() }),
  notFound: z.object({ title: z.string(), text: z.string(), back: z.string() }),
});

// Only the two locale files go through the full site schema.
const site = defineCollection({
  loader: glob({
    pattern: ['fr.yaml', 'en.yaml'],
    base: './src/content/site',
    generateId: ({ entry }) => entry.replace(/\.yaml$/, ''),
  }),
  schema: siteSchema,
});

const linksSchema = z.object({
  steamLive: z.boolean().default(false),
  steam: z.string(),
  fungusItch: z.string(),
  fungusVideoId: z.string(),
  anorak: z.string(),
  shorts: z.array(z.string()).default([]),
  social: z.array(z.object({ id: z.string(), name: z.string(), handle: z.string(), url: z.string() })).default([]),
});

const links = defineCollection({
  loader: glob({
    pattern: 'links.yaml',
    base: './src/content/site',
    generateId: () => 'main',
  }),
  schema: linksSchema,
});

export const collections = { site, links };
