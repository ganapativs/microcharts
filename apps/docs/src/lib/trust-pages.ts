/**
 * `/contact` and `/privacy`, written once.
 *
 * Both pages render from these structures, and both Markdown twins
 * (`/contact.md`, `/privacy.md`) serialize from them — so the page a reader
 * sees and the file an agent fetches cannot drift. The prose accepts a small
 * Markdown subset, `[label](href)` and `` `code` ``, rendered by
 * `components/prose-doc.tsx` and passed through verbatim into Markdown.
 *
 * Every claim on the privacy page is checked against the code in
 * `trust-pages.test.ts`: the analytics property, the third-party hosts, and the
 * `localStorage` keys are read out of the components that set them, so a new
 * tracker cannot ship while the page still says there isn't one.
 */
import { CATALOG } from "./docs-facts";
import { SITE } from "./site";

export type Block = { p: string } | { list: string[] };

export type Section = {
  heading: string;
  /** Anchor id — stable, referenced from other pages. */
  id: string;
  blocks: Block[];
};

export type TrustPage = {
  title: string;
  /** Meta description: one plain, page-specific sentence. */
  description: string;
  /** The lede, above the first heading. */
  intro: string;
  sections: Section[];
};

/** The Google Analytics 4 property this site loads. Mirrors `components/analytics.tsx`. */
export const GA_PROPERTY = "G-LN11CCKKTW";

/** Hosts a page here can call at runtime, and why. */
export const THIRD_PARTIES = [
  {
    host: "www.googletagmanager.com",
    what: `Google Analytics 4 (property ${GA_PROPERTY}), loaded on every page.`,
  },
  {
    host: "api.github.com",
    what: "One unauthenticated call for the repository's star count, cached in your browser for six hours.",
  },
  {
    host: "stackblitz.com",
    what: "Only when you open an example in StackBlitz, which loads that editor in a frame.",
  },
] as const;

/** Keys this site writes to `localStorage`, all first-party, all preferences. */
export const STORAGE_KEYS = ["mc-accent", "mc-preset", "mc-gh-stars", "theme"] as const;

export const CONTACT_PAGE: TrustPage = {
  title: "Contact",
  description:
    "How to report a bug, propose a chart type, or report a security issue in microcharts.",
  intro:
    "microcharts is an open-source project maintained in the open. Everything below reaches the maintainer; the issue tracker reaches them fastest.",
  sections: [
    {
      heading: "Report a bug",
      id: "bugs",
      blocks: [
        {
          p: `Open an issue at [${SITE.repo}/issues](${SITE.repo}/issues). Include the chart, the props you passed, the React version, and whether it rendered on the server, the client, or both.`,
        },
        {
          p: "A minimal reproduction closes a bug faster than a description of one. The examples in the repository are a working starting point.",
        },
      ],
    },
    {
      heading: "Propose a chart type or a prop",
      id: "proposals",
      blocks: [
        {
          p: `Open an issue first, before writing code. The catalog is deliberately bounded, so a new type has to clear the admission bar: a data story the existing ${CATALOG.total} types cannot already tell, one honest encoding channel, and readability at 200×60 px without training.`,
        },
        {
          p: `The same applies to new props. \`CONTRIBUTING.md\` in the repository carries the full policy, and [/docs/design-notes](${SITE.url}/docs/design-notes) explains what has already been ruled out and why.`,
        },
      ],
    },
    {
      heading: "Report a security issue",
      id: "security",
      blocks: [
        {
          p: `Do not open a public issue. Report privately through [GitHub's private vulnerability reporting](${SITE.repo}/security/advisories/new), or email **vsg.inbox@gmail.com**.`,
        },
        {
          p: "You get an acknowledgement within a few days. Once a fix ships, the advisory is disclosed with credit to the reporter unless you prefer to stay anonymous.",
        },
      ],
    },
    {
      heading: "Follow releases",
      id: "releases",
      blocks: [
        {
          list: [
            `[${SITE.url}/rss.xml](${SITE.url}/rss.xml) — every release as an Atom feed.`,
            `[${SITE.npm}](${SITE.npm}) — the published package.`,
            `[${SITE.repo}/releases](${SITE.repo}/releases) — release notes and changelogs.`,
          ],
        },
      ],
    },
    {
      heading: "Who maintains this",
      id: "maintainer",
      blocks: [
        {
          p: `${SITE.author} ([${SITE.authorUrl}](${SITE.authorUrl})), on [GitHub](${SITE.authorGithub}) and [X](${SITE.authorX}). microcharts is MIT licensed.`,
        },
      ],
    },
    {
      heading: "For agents",
      id: "agents",
      blocks: [
        {
          p: `This page has a Markdown twin at [${SITE.url}/contact.md](${SITE.url}/contact.md), and the same contact details appear in the \`info.contact\` object of [${SITE.url}/openapi.json](${SITE.url}/openapi.json).`,
        },
      ],
    },
  ],
};

export const PRIVACY_PAGE: TrustPage = {
  title: "Privacy",
  description:
    "What microcharts.dev collects, what it stores in your browser, and who else sees a request.",
  intro:
    "microcharts.dev is a static documentation site. It has no accounts, no sign-in, no forms, and no payments, so there is nothing here to hand over. What follows is everything the site does that touches you.",
  sections: [
    {
      heading: "What is collected",
      id: "collected",
      blocks: [
        {
          p: `This site loads Google Analytics 4 (property \`${GA_PROPERTY}\`) on every page. It records page views, plus four interactions: clicking a call to action, following a link off this site, copying a code block, and opening search. Those events carry the page path and the link involved, and nothing you type.`,
        },
        {
          p: "Google Analytics sets its own cookies and processes the request under Google's terms. Block it with any content blocker, or with your browser's Do Not Track setting, and the site works exactly the same — nothing here depends on analytics.",
        },
        {
          p: "The npm package itself collects nothing. It ships zero runtime dependencies and makes no network requests, on the server or in the browser.",
        },
      ],
    },
    {
      heading: "What is stored in your browser",
      id: "storage",
      blocks: [
        {
          p: "Four `localStorage` keys, all first-party, all preferences. None of them is sent anywhere.",
        },
        {
          list: [
            "`mc-accent` and `mc-preset` — the accent colour and chart preset you picked, so the page paints them before the first frame on your next visit.",
            "`theme` — light, dark, or system.",
            "`mc-gh-stars` — the repository's star count, cached for six hours so the navigation makes one API call per session rather than one per page.",
          ],
        },
      ],
    },
    {
      heading: "Who else sees a request",
      id: "third-parties",
      blocks: [
        { p: "Three hosts, in the situations named:" },
        {
          list: THIRD_PARTIES.map((t) => `\`${t.host}\` — ${t.what}`),
        },
        {
          p: "Fonts are not one of them. Every typeface is served from this domain: the two Google-hosted families are downloaded at build time and self-hosted, so reading a page sends no request to Google's font servers.",
        },
        {
          p: "The site is served from Cloudflare's edge network, which processes the request in order to answer it.",
        },
      ],
    },
    {
      heading: "Agents and crawlers",
      id: "agents",
      blocks: [
        {
          p: `Automated clients are welcome, and \`/robots.txt\` says so by name. Nothing on this site is rate-limited, gated, or fingerprinted, and no request is logged in a way that identifies a caller. Reading this site with \`Accept: text/markdown\` or fetching [${SITE.url}/llms.txt](${SITE.url}/llms.txt) is the intended use, not an edge case.`,
        },
      ],
    },
    {
      heading: "Changes and questions",
      id: "changes",
      blocks: [
        {
          p: `This page changes when the site does, and its history is public in the repository. Ask about anything here at [${SITE.repo}/issues](${SITE.repo}/issues), or email **vsg.inbox@gmail.com**.`,
        },
      ],
    },
  ],
};

/** Serialize a trust page to the Markdown its twin serves. */
export function trustPageMarkdown(page: TrustPage, url: string): string {
  const lines = [`# ${page.title} (${url})`, "", page.intro, ""];
  for (const section of page.sections) {
    lines.push(`## ${section.heading}`, "");
    for (const block of section.blocks) {
      if ("p" in block) lines.push(block.p, "");
      else {
        for (const item of block.list) lines.push(`- ${item}`);
        lines.push("");
      }
    }
  }
  return `${lines.join("\n").trimEnd()}\n`;
}
