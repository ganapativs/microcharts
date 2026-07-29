/**
 * Setup instructions for every MCP client that can spawn a local stdio server,
 * shared by the React disclosure list on /docs/mcp and the Markdown mirror
 * (`md-transform.ts`), so both say the same thing.
 *
 * Every command and config block is BUILT from `PKG` and `NAME` rather than
 * typed out, so a package rename moves all 23 clients at once and the test that
 * greps for the published name can't pass on a stale string.
 *
 * Client shapes were read from each vendor's own documentation; `docs` links to
 * the page a setup was taken from, which is also where a reader goes when a
 * client changes its format.
 */

import type { ConfigLang } from "./config-lex.ts";

/** The published package. One source for every command on the page. */
export const PKG = "@microcharts/mcp";
/** The server name a client shows in its own UI. */
export const NAME = "microcharts";

/** The stdio invocation, in the shape most clients ask for. */
const COMMAND = "npx";
const ARGS = ["-y", PKG];
/** The same thing as one shell word — for CLIs that take a bare command. */
const CMDLINE = `${COMMAND} ${ARGS.join(" ")}`;

/** Pretty JSON, with short string arrays folded back onto one line — the shape
 *  every client's own docs print, and four lines shorter in a disclosure. */
const json = (value: unknown) =>
  JSON.stringify(value, null, 2).replace(
    /\[\n\s*("[^"\n]*"(?:,\n\s*"[^"\n]*")*)\n\s*\]/g,
    (m, inner: string) => {
      const flat = `[${inner.replace(/\s*\n\s*/g, " ")}]`;
      return flat.length <= 60 ? flat : m;
    },
  );

/** `{ "mcpServers": { "microcharts": { command, args } } }` — the common form. */
const serverBlock = (key: "mcpServers" | "servers" | "context_servers", extra?: object) =>
  json({ [key]: { [NAME]: { ...extra, command: COMMAND, args: ARGS } } });

export interface McpSetup {
  /** What this route is: "Command line", "Config file", "In the app". */
  label: string;
  lang: ConfigLang;
  code: string;
  /** File name shown above the block, when the code IS a file's contents. */
  file?: string;
  /** One sentence of context — a path, a scope flag, a caveat. */
  note?: string;
}

export interface McpClient {
  id: string;
  name: string;
  /** Key into `AI_LOGOS`; clients with no published mono mark fall back to a
   *  monogram tile built from `name`. */
  logo?: string;
  /** The one line that answers "where does this live?" in the summary row. */
  where: string;
  /** The vendor page this setup was read from. */
  docs: string;
  setups: McpSetup[];
  /** A one-click install link, where the client publishes a URL scheme. */
  install?: { label: string; href: string };
  /** Anything a reader needs after the blocks — shared config, a limitation. */
  note?: string;
}

export interface McpClientGroup {
  title: string;
  /** What this group of clients has in common, in a fragment. */
  note: string;
  clients: McpClient[];
}

/** base64 for a deeplink payload — Node at build time, browsers if ever bundled. */
function b64(s: string): string {
  return typeof Buffer !== "undefined"
    ? Buffer.from(s, "utf8").toString("base64")
    : btoa(unescape(encodeURIComponent(s)));
}

const cursorLink = `cursor://anysphere.cursor-deeplink/mcp/install?name=${NAME}&config=${encodeURIComponent(
  b64(json({ command: COMMAND, args: ARGS })),
)}`;

const vscodeLink = `vscode:mcp/install?${encodeURIComponent(
  JSON.stringify({ name: NAME, command: COMMAND, args: ARGS }),
)}`;

export const MCP_CLIENT_GROUPS: McpClientGroup[] = [
  {
    title: "Command-line agents",
    note: "one command, then the tools are live in the next turn",
    clients: [
      {
        id: "claude-code",
        name: "Claude Code",
        logo: "claude-code",
        where: "claude mcp add",
        docs: "https://code.claude.com/docs/en/mcp",
        setups: [
          {
            label: "Command line",
            lang: "bash",
            code: `claude mcp add ${NAME} -- ${CMDLINE}`,
            note: "Everything after `--` is the command Claude Code spawns. Add `--scope user` to make it available in every project.",
          },
          {
            label: "Config file",
            lang: "json",
            file: ".mcp.json",
            code: serverBlock("mcpServers"),
            note: "Project scope — check this file in and everyone on the repo gets the server.",
          },
        ],
      },
      {
        id: "codex",
        name: "Codex CLI",
        logo: "codex",
        where: "~/.codex/config.toml",
        docs: "https://developers.openai.com/codex/mcp",
        setups: [
          {
            label: "Command line",
            lang: "bash",
            code: `codex mcp add ${NAME} -- ${CMDLINE}`,
          },
          {
            label: "Config file",
            lang: "toml",
            file: "~/.codex/config.toml",
            code: `[mcp_servers.${NAME}]\ncommand = "${COMMAND}"\nargs = [${ARGS.map((a) => `"${a}"`).join(", ")}]`,
          },
        ],
        note: "The ChatGPT desktop app and the Codex IDE extension read this same file, so one entry covers all three.",
      },
      {
        id: "gemini-cli",
        name: "Gemini CLI",
        logo: "gemini",
        where: "~/.gemini/settings.json",
        docs: "https://google-gemini.github.io/gemini-cli/docs/tools/mcp-server.html",
        setups: [
          {
            label: "Command line",
            lang: "bash",
            code: `gemini mcp add --scope user ${NAME} ${CMDLINE}`,
            note: "Scope defaults to the current project; `--scope user` writes the home config instead.",
          },
          {
            label: "Config file",
            lang: "json",
            file: "~/.gemini/settings.json",
            code: serverBlock("mcpServers"),
          },
        ],
      },
      {
        id: "copilot-cli",
        name: "GitHub Copilot CLI",
        logo: "copilot",
        where: "~/.copilot/mcp-config.json",
        docs: "https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-mcp-servers",
        setups: [
          {
            label: "In the app",
            lang: "text",
            code: `/mcp add\n\nName     ${NAME}\nType     Local (STDIO)\nCommand  ${CMDLINE}\nTools    *`,
            note: "Tab moves between fields, Ctrl+S saves. The server is usable without restarting.",
          },
          {
            label: "Config file",
            lang: "json",
            file: "~/.copilot/mcp-config.json",
            code: json({
              mcpServers: {
                [NAME]: { type: "local", command: COMMAND, args: ARGS, tools: ["*"] },
              },
            }),
          },
        ],
      },
      {
        id: "opencode",
        name: "opencode",
        logo: "opencode",
        where: "opencode.json",
        docs: "https://opencode.ai/docs/mcp-servers/",
        setups: [
          {
            label: "Config file",
            lang: "json",
            file: "opencode.json",
            code: json({
              $schema: "https://opencode.ai/config.json",
              mcp: {
                [NAME]: { type: "local", command: [COMMAND, ...ARGS], enabled: true },
              },
            }),
            note: "opencode takes the command as one array rather than command plus args.",
          },
        ],
      },
      {
        id: "amp",
        name: "Amp",
        logo: "amp",
        where: "amp mcp add",
        docs: "https://ampcode.com/manual#mcp",
        setups: [
          {
            label: "Command line",
            lang: "bash",
            code: `amp mcp add ${NAME} -- ${CMDLINE}`,
          },
          {
            label: "Config file",
            lang: "json",
            file: "~/.config/amp/settings.json",
            code: json({ "amp.mcpServers": { [NAME]: { command: COMMAND, args: ARGS } } }),
            note: "The VS Code extension reads the same key from its own settings.",
          },
        ],
      },
      {
        id: "goose",
        name: "Goose",
        where: "~/.config/goose/config.yaml",
        docs: "https://block.github.io/goose/docs/getting-started/using-extensions/",
        setups: [
          {
            label: "In the app",
            lang: "text",
            code: `goose configure\n\n> Add Extension\n> Command-line Extension\n\nName     ${NAME}\nCommand  ${CMDLINE}`,
          },
          {
            label: "Config file",
            lang: "yaml",
            file: "~/.config/goose/config.yaml",
            code: `extensions:\n  ${NAME}:\n    type: stdio\n    name: ${NAME}\n    enabled: true\n    cmd: ${COMMAND}\n    args: [${ARGS.map((a) => `"${a}"`).join(", ")}]\n    envs: {}`,
            note: "Goose calls the executable `cmd`, not `command`.",
          },
        ],
      },
    ],
  },
  {
    title: "Editors and IDEs",
    note: "the server sits beside the code the agent is writing",
    clients: [
      {
        id: "vscode",
        name: "VS Code",
        logo: "vscode",
        where: ".vscode/mcp.json",
        docs: "https://code.visualstudio.com/docs/copilot/customization/mcp-servers",
        install: { label: "Install in VS Code", href: vscodeLink },
        setups: [
          {
            label: "Config file",
            lang: "json",
            file: ".vscode/mcp.json",
            code: serverBlock("servers", { type: "stdio" }),
            note: "VS Code names the object `servers`, not `mcpServers`. For every workspace, run **MCP: Open User Configuration** instead.",
          },
          {
            label: "Command line",
            lang: "bash",
            code: `code --add-mcp '${JSON.stringify({ name: NAME, command: COMMAND, args: ARGS })}'`,
          },
        ],
      },
      {
        id: "cursor",
        name: "Cursor",
        logo: "cursor",
        where: ".cursor/mcp.json",
        docs: "https://cursor.com/docs/context/mcp",
        install: { label: "Add to Cursor", href: cursorLink },
        setups: [
          {
            label: "Config file",
            lang: "json",
            file: ".cursor/mcp.json",
            code: serverBlock("mcpServers"),
            note: "`~/.cursor/mcp.json` is the same file for every project.",
          },
        ],
      },
      {
        id: "windsurf",
        name: "Windsurf",
        logo: "windsurf",
        where: "~/.codeium/windsurf/mcp_config.json",
        docs: "https://docs.windsurf.com/windsurf/cascade/mcp",
        setups: [
          {
            label: "Config file",
            lang: "json",
            file: "~/.codeium/windsurf/mcp_config.json",
            code: serverBlock("mcpServers"),
            note: "Cascade panel → the MCP icon → **Configure** opens this file.",
          },
        ],
      },
      {
        id: "zed",
        name: "Zed",
        logo: "zed",
        where: "settings.json",
        docs: "https://zed.dev/docs/ai/mcp",
        setups: [
          {
            label: "Config file",
            lang: "json",
            file: "settings.json",
            code: serverBlock("context_servers"),
            note: "Zed calls MCP servers context servers. Settings → AI → MCP Servers → **Add Local Server** writes the same entry.",
          },
        ],
      },
      {
        id: "jetbrains",
        name: "JetBrains IDEs",
        logo: "jetbrains",
        where: "Settings | Tools | AI Assistant",
        docs: "https://www.jetbrains.com/help/ai-assistant/configure-an-mcp-server.html",
        setups: [
          {
            label: "In the app",
            lang: "text",
            code: "Settings | Tools | AI Assistant | Model Context Protocol (MCP)\n\n> + > As JSON > paste the block below > Apply",
          },
          {
            label: "Config file",
            lang: "json",
            code: serverBlock("mcpServers"),
            note: "Covers IntelliJ IDEA, WebStorm, PyCharm, and the rest of the family — AI Assistant and Junie share the server list.",
          },
        ],
      },
      {
        id: "kiro",
        name: "Kiro",
        where: ".kiro/settings/mcp.json",
        docs: "https://kiro.dev/docs/mcp/configuration/",
        setups: [
          {
            label: "Config file",
            lang: "json",
            file: ".kiro/settings/mcp.json",
            code: json({
              mcpServers: {
                [NAME]: {
                  command: COMMAND,
                  args: ARGS,
                  disabled: false,
                  autoApprove: ["find_microchart", "get_microchart", "render_microchart"],
                },
              },
            }),
            note: "Workspace config wins over `~/.kiro/settings/mcp.json`. Kiro reloads on save — no restart. Drop `autoApprove` to confirm each call by hand.",
          },
        ],
      },
      {
        id: "antigravity",
        name: "Antigravity",
        logo: "antigravity",
        where: "~/.gemini/config/mcp_config.json",
        docs: "https://antigravity.google/docs/mcp",
        setups: [
          {
            label: "Config file",
            lang: "json",
            file: "~/.gemini/config/mcp_config.json",
            code: serverBlock("mcpServers"),
            note: "`.agents/mcp_config.json` scopes the same block to one workspace.",
          },
        ],
      },
      {
        id: "visual-studio",
        name: "Visual Studio",
        logo: "visualstudio",
        where: "%USERPROFILE%\\.mcp.json",
        docs: "https://learn.microsoft.com/en-us/visualstudio/ide/mcp-servers",
        setups: [
          {
            label: "Config file",
            lang: "json",
            file: ".mcp.json",
            code: serverBlock("servers", { type: "stdio" }),
            note: "`%USERPROFILE%\\.mcp.json` for every solution, `<SOLUTIONDIR>\\.mcp.json` for one. Saving the file restarts the agent's servers.",
          },
        ],
      },
      {
        id: "cline",
        name: "Cline",
        logo: "cline",
        where: "cline_mcp_settings.json",
        docs: "https://docs.cline.bot/mcp/configuring-mcp-servers",
        setups: [
          {
            label: "Config file",
            lang: "json",
            file: "cline_mcp_settings.json",
            code: json({
              mcpServers: {
                [NAME]: { command: COMMAND, args: ARGS, disabled: false, autoApprove: [] },
              },
            }),
            note: "MCP Servers icon → **Configure** → **Configure MCP Servers** opens it. The CLI reads `~/.cline/mcp.json`.",
          },
        ],
      },
      {
        id: "roo-code",
        name: "Roo Code",
        logo: "roocode",
        where: ".roo/mcp.json",
        docs: "https://docs.roocode.com/features/mcp/using-mcp-in-roo",
        setups: [
          {
            label: "Config file",
            lang: "json",
            file: ".roo/mcp.json",
            code: serverBlock("mcpServers"),
            note: "Project config wins over the global `mcp_settings.json`.",
          },
        ],
      },
      {
        id: "continue",
        name: "Continue",
        logo: "continue",
        where: ".continue/mcpServers/*.yaml",
        docs: "https://docs.continue.dev/customize/deep-dives/mcp",
        setups: [
          {
            label: "Config file",
            lang: "yaml",
            file: `.continue/mcpServers/${NAME}.yaml`,
            code: `name: ${NAME}\nversion: 0.0.1\nschema: v1\nmcpServers:\n  - name: ${NAME}\n    type: stdio\n    command: ${COMMAND}\n    args:\n${ARGS.map((a) => `      - "${a}"`).join("\n")}`,
            note: "Continue takes one block file per server, and `mcpServers` is a list rather than an object.",
          },
        ],
      },
      {
        id: "trae",
        name: "Trae",
        where: "Settings > MCP",
        docs: "https://docs.trae.ai/ide/model-context-protocol",
        setups: [
          {
            label: "In the app",
            lang: "text",
            code: "Settings > MCP > Add > Add Manually",
          },
          {
            label: "Config file",
            lang: "json",
            code: serverBlock("mcpServers"),
          },
        ],
      },
    ],
  },
  {
    title: "Desktop and chat apps",
    note: "where the reply itself is the surface, so a rendered mark lands in it",
    clients: [
      {
        id: "claude-desktop",
        name: "Claude Desktop",
        logo: "claude",
        where: "claude_desktop_config.json",
        docs: "https://modelcontextprotocol.io/docs/develop/connect-local-servers",
        setups: [
          {
            label: "Config file",
            lang: "json",
            file: "claude_desktop_config.json",
            code: serverBlock("mcpServers"),
            note: "Settings → Developer → **Edit Config** opens it: `~/Library/Application Support/Claude/` on macOS, `%APPDATA%\\Claude\\` on Windows. Quit and reopen Claude to load it.",
          },
        ],
      },
      {
        id: "chatgpt-desktop",
        name: "ChatGPT desktop",
        logo: "openai",
        where: "Settings > MCP servers",
        docs: "https://developers.openai.com/codex/mcp",
        setups: [
          {
            label: "In the app",
            lang: "text",
            code: `Settings > MCP servers > Add server\n\nName     ${NAME}\nTransport STDIO\nCommand  ${CMDLINE}`,
            note: "Save, then **Restart**.",
          },
          {
            label: "Config file",
            lang: "toml",
            file: "~/.codex/config.toml",
            code: `[mcp_servers.${NAME}]\ncommand = "${COMMAND}"\nargs = [${ARGS.map((a) => `"${a}"`).join(", ")}]`,
          },
        ],
        note: "ChatGPT on the web reads no local file and spawns no local process — it reaches remote connectors only.",
      },
      {
        id: "lm-studio",
        name: "LM Studio",
        logo: "lmstudio",
        where: "~/.lmstudio/mcp.json",
        docs: "https://lmstudio.ai/docs/app/plugins/mcp",
        setups: [
          {
            label: "Config file",
            lang: "json",
            file: "~/.lmstudio/mcp.json",
            code: serverBlock("mcpServers"),
            note: "The **Program** tab → **Install** → **Edit mcp.json** opens it in the app.",
          },
        ],
      },
      {
        id: "warp",
        name: "Warp",
        logo: "warp",
        where: "Settings > AI > MCP servers",
        docs: "https://docs.warp.dev/knowledge-and-collaboration/mcp",
        setups: [
          {
            label: "In the app",
            lang: "text",
            code: "Settings > AI > MCP servers > + Add\n\n> CLI Server (command) > paste the block below > Save",
          },
          {
            label: "Config file",
            lang: "json",
            code: json({ [NAME]: { command: COMMAND, args: ARGS } }),
            note: "Warp takes the server entry on its own, without an `mcpServers` wrapper.",
          },
        ],
      },
    ],
  },
];

/** Every client, flattened — for counts and tests. */
export const MCP_CLIENTS: McpClient[] = MCP_CLIENT_GROUPS.flatMap((g) => g.clients);
