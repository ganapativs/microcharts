import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BRAND_COLORS, BRAND_LICENSE, BRAND_PNGS, BRAND_README, BRAND_SVGS } from "./brand-assets";
import { SITE } from "./site";

/** public/brand/ and the kit zip are generated from `brand-assets.ts` by
 *  `pnpm gen:brand-kit`. These guards fail when a file on disk, or the zip a
 *  visitor downloads, has drifted from the module — the failure mode that made
 *  the old hand-packed kit ship a mark the site had already changed. */
const BRAND = join(process.cwd(), "public/brand");
const KIT = "microcharts-brand-kit";
const read = (p: string) => readFileSync(join(BRAND, p));
/** Exactly what `gen-brand-kit.mjs` writes for colors.json. */
const COLORS_JSON = `${JSON.stringify(BRAND_COLORS, null, 2)}\n`;

const CRC_TABLE = Int32Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});
const crc32 = (buf: Buffer) => {
  let c = -1;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};

/** Walk the zip's central directory: name → CRC of the uncompressed entry. */
function zipEntries(buf: Buffer) {
  const end = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  let at = buf.readUInt32LE(end + 16);
  const out = new Map<string, number>();
  for (let i = 0; i < buf.readUInt16LE(end + 10); i++) {
    const nameLen = buf.readUInt16LE(at + 28);
    const extraLen = buf.readUInt16LE(at + 30);
    const commentLen = buf.readUInt16LE(at + 32);
    out.set(buf.toString("utf8", at + 46, at + 46 + nameLen), buf.readUInt32LE(at + 16));
    at += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

describe("brand assets on disk", () => {
  it.each(Object.keys(BRAND_SVGS))("%s matches the module (run `pnpm gen:brand-kit`)", (name) => {
    expect(read(name).toString("utf8")).toBe(BRAND_SVGS[name]);
  });

  it("ships every raster", () => {
    for (const { file } of BRAND_PNGS) {
      expect(read(join("png", file)).subarray(1, 4).toString("latin1")).toBe("PNG");
    }
  });

  it("keeps README.txt in sync", () => {
    expect(read("README.txt").toString("utf8")).toBe(BRAND_README);
  });

  // README.txt points at LICENSE.txt, colors.json and fonts/OpenRunde-OFL.txt,
  // and the brand page links the terms. All three used to exist only inside the
  // zip, so every one of those references 404'd for anyone reading /brand/.
  it("keeps LICENSE.txt in sync", () => {
    expect(read("LICENSE.txt").toString("utf8")).toBe(BRAND_LICENSE);
  });

  it("keeps colors.json in sync", () => {
    expect(read("colors.json").toString("utf8")).toBe(COLORS_JSON);
  });

  it("serves the font license the wordmark outlines carry", () => {
    expect(read("fonts/OpenRunde-OFL.txt").toString("utf8")).toContain(
      "SIL OPEN FONT LICENSE Version 1.1",
    );
  });
});

describe("brand assets themselves", () => {
  it.each(Object.entries(BRAND_SVGS))("%s is a named, scalable, font-free file", (name, source) => {
    expect(source).toContain("<title>microcharts");
    expect(source).toMatch(/viewBox="0 0 [\d.]+ [\d.]+"/);
    // The name ships as outlines. A <text> element or an @font-face would make
    // the file depend on a font the downloader doesn't have.
    expect(source).not.toMatch(/<text|@font-face/);
    if (name.startsWith("wordmark") || name.startsWith("lockup")) {
      expect(source).toContain("<path");
    }
  });

  it("names every shipped file in the README", () => {
    for (const name of Object.keys(BRAND_SVGS)) expect(BRAND_README).toContain(name);
  });

  // The only address in the terms. It shipped as a handle that appears nowhere
  // else on the site, inside a zip no test read back.
  it("sends questions to the handle the rest of the site publishes", () => {
    expect(BRAND_LICENSE.match(/https:\/\/x\.com\/\S+/g)).toEqual([SITE.authorX]);
  });

  it("says the artwork is not covered by the code license", () => {
    expect(BRAND_LICENSE).toContain("These brand assets are not");
  });
});

describe("the palette is the site's", () => {
  // The kit once documented a paper and an ink the light theme had retired —
  // colors.json said warm cream while every shipped surface painted cool
  // blue-grey. These pins hold the kit to the tokens the site actually renders.
  const css = readFileSync(join(process.cwd(), "src/app/global.css"), "utf8");
  const all = (token: string) =>
    [...css.matchAll(new RegExp(`${token}:\\s*(#[0-9a-fA-F]{6})`, "g"))].map((m) => m[1]);
  /** First definition is the `:root` light value, second the `.dark` override;
   *  anything after that is a preset scope. */
  const themed = (token: string) => {
    const found = all(token);
    expect(found.length).toBeGreaterThanOrEqual(2);
    return { light: found[0], dark: found[1] };
  };

  it("papers the kit on the ground the site paints", () => {
    expect(BRAND_COLORS.paper).toEqual(themed("--color-fd-background"));
  });

  it("inks the wordmark in the site's text ink", () => {
    expect({ light: BRAND_COLORS.ink.light, dark: BRAND_COLORS.ink.dark }).toEqual(
      themed("--color-fd-foreground"),
    );
  });

  it("documents exactly the accents the picker offers", () => {
    const site = all("--accent");
    const kit = Object.values(BRAND_COLORS.accent).flatMap((a) => [a.light, a.dark]);
    expect([...kit].sort()).toEqual([...site].sort());
    // Cobalt light is the `:root` default the whole site boots with.
    expect(BRAND_COLORS.accent.cobalt.light).toBe(site[0]);
  });

  it("carries the valence pair the site renders", () => {
    expect(BRAND_COLORS.semantic.positive).toEqual(themed("--mc-positive"));
    expect(BRAND_COLORS.semantic.negative).toEqual(themed("--mc-negative"));
  });
});

describe("the downloadable kit", () => {
  const entries = zipEntries(read(`${KIT}.zip`));

  it("carries the current text files", () => {
    expect(entries.get(`${KIT}/README.txt`)).toBe(crc32(Buffer.from(BRAND_README)));
    expect(entries.get(`${KIT}/LICENSE.txt`)).toBe(crc32(Buffer.from(BRAND_LICENSE)));
    expect(entries.get(`${KIT}/colors.json`)).toBe(crc32(Buffer.from(COLORS_JSON)));
  });

  it("carries the docs, the license, and the font license", () => {
    expect([...entries.keys()]).toEqual(
      expect.arrayContaining([
        `${KIT}/README.txt`,
        `${KIT}/LICENSE.txt`,
        `${KIT}/colors.json`,
        `${KIT}/fonts/OpenRunde-OFL.txt`,
      ]),
    );
  });

  it.each(Object.entries(BRAND_SVGS))("carries the current %s", (name, source) => {
    expect(entries.get(`${KIT}/svg/${name}`)).toBe(crc32(Buffer.from(source)));
  });

  it.each(BRAND_PNGS.map((p) => p.file))("carries the current %s", (name) => {
    expect(entries.get(`${KIT}/png/${name}`)).toBe(crc32(read(join("png", name))));
  });
});
