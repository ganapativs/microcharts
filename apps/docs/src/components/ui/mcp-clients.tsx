import { ChevronDown, ArrowUpRight, Plug } from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { CopyButton } from "@/components/ui/copy";
import { lexConfig } from "@/lib/config-lex";
import { MCP_CLIENT_GROUPS, type McpClient, type McpSetup } from "@/lib/mcp-clients";

/**
 * The setup list on /docs/mcp: one disclosure per client, grouped by the kind
 * of surface the server ends up in.
 *
 * It is a static server component built on `<details>`, so the whole list —
 * 23 clients, ~30 code blocks — costs no client JavaScript beyond the copy
 * buttons, opens without hydration, and is searchable by the browser's own find
 * when a row is open. Blocks are coloured by the in-house config lexer rather
 * than a runtime highlighter, for the same reason.
 */

/** Backticks → `<code>`, `**bold**` → `<strong>`. The notes are Markdown, so
 *  the `.md` mirror carries the same string unchanged. */
function Note({ text }: { text: string }) {
  // Offsets, not list positions, key the parts — the same stable, data-derived
  // key the lexers use.
  let at = 0;
  const parts = text
    .split(/(`[^`]+`|\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((s) => {
      const part = { s, at };
      at += s.length;
      return part;
    });
  return (
    <p className="mcp-note">
      {parts.map(({ s, at: key }) =>
        s.startsWith("`") ? (
          <code key={key}>{s.slice(1, -1)}</code>
        ) : s.startsWith("**") ? (
          <strong key={key}>{s.slice(2, -2)}</strong>
        ) : (
          <span key={key}>{s}</span>
        ),
      )}
    </p>
  );
}

function Code({ code, lang }: { code: string; lang: McpSetup["lang"] }) {
  return (
    <pre className="mcp-code code-inset">
      <code>
        {lexConfig(code, lang).map((t) =>
          t.cls ? (
            <span key={t.at} className={t.cls}>
              {t.text}
            </span>
          ) : (
            <span key={t.at}>{t.text}</span>
          ),
        )}
      </code>
    </pre>
  );
}

function Setup({ setup }: { setup: McpSetup }) {
  return (
    <div className="mcp-setup">
      <div className="mcp-setup-head">
        <span className="mono-label opacity-70">{setup.label}</span>
        {setup.file && <code className="mcp-file">{setup.file}</code>}
        <CopyButton text={setup.code} size={7} className="ml-auto" />
      </div>
      <Code code={setup.code} lang={setup.lang} />
      {setup.note && <Note text={setup.note} />}
    </div>
  );
}

/** The mark, or a monogram for a client with no published mono logo. */
function ClientMark({ client }: { client: McpClient }) {
  return (
    <span className="mcp-mark" aria-hidden>
      {client.logo ? (
        <BrandLogo name={client.logo} className="size-[18px]" />
      ) : (
        <span className="mcp-monogram">{client.name.charAt(0)}</span>
      )}
    </span>
  );
}

function Client({ client, group }: { client: McpClient; group: string }) {
  return (
    <details className="mcp-client" name={group}>
      <summary className="mcp-client-summary">
        <ClientMark client={client} />
        <span className="mcp-client-name">{client.name}</span>
        <code className="mcp-where">{client.where}</code>
        <ChevronDown className="mcp-chevron size-4" aria-hidden />
      </summary>
      <div className="mcp-client-body">
        {client.setups.map((s) => (
          <Setup key={s.label} setup={s} />
        ))}
        {client.note && <Note text={client.note} />}
        <div className="mcp-client-foot">
          <a href={client.docs} rel="noreferrer" target="_blank">
            {client.name} MCP docs
            <ArrowUpRight className="size-3" aria-hidden />
          </a>
          {client.install && (
            <a href={client.install.href} className="mcp-install">
              <Plug className="size-3" aria-hidden />
              {client.install.label}
            </a>
          )}
        </div>
      </div>
    </details>
  );
}

export function McpClients() {
  return (
    <div className="not-prose my-6 flex flex-col gap-6">
      {MCP_CLIENT_GROUPS.map((g) => (
        <section key={g.title}>
          <div className="mb-2.5 flex items-baseline gap-2">
            <h3 className="text-sm font-medium text-fd-foreground">{g.title}</h3>
            <span className="mono-label tabular-nums opacity-45">
              {g.clients.length.toString().padStart(2, "0")}
            </span>
            <span className="mono-label truncate opacity-60">{g.note}</span>
          </div>
          <div className="panel-soft overflow-hidden">
            {g.clients.map((c) => (
              <Client key={c.id} client={c} group={g.title} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
