import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import Ajv2020 from "ajv/dist/2020";
import { describe, expect, it } from "vitest";
import { buildCatalog, CATALOG_SCHEMA_PATH } from "./catalog-json";

// The schema served at /catalog.schema.json is the contract for /catalog.json.
// This test validates the ACTUAL emitted catalog (same buildCatalog() the route
// calls) against it, so the two can never drift: add a field to the catalog and
// forget the schema → additionalProperties:false fails; tighten the schema past
// what the catalog emits → the offending chart fails. Either way, red CI.
const schema = JSON.parse(
  readFileSync(resolve(process.cwd(), "public/catalog.schema.json"), "utf8"),
) as Record<string, unknown>;

describe("catalog.json conforms to catalog.schema.json", () => {
  // `logger: false` silences ajv's "unknown format" annotations — `format` is
  // kept as an editor/consumer hint; we don't pull in ajv-formats to assert it.
  const ajv = new Ajv2020({ allErrors: true, strict: false, logger: false });
  const validate = ajv.compile(schema);

  it("the schema itself compiles (valid JSON Schema 2020-12)", () => {
    expect(typeof validate).toBe("function");
  });

  it("the emitted catalog validates against the schema", () => {
    const catalog = buildCatalog();
    const ok = validate(catalog);
    // Surface the first few errors verbatim when it fails.
    expect(validate.errors ?? [], JSON.stringify(validate.errors?.slice(0, 8), null, 2)).toEqual(
      [],
    );
    expect(ok).toBe(true);
  });

  it("the document points at the schema it is validated against", () => {
    // basename parity — the served $schema URL must name the public file.
    const $schema = (buildCatalog() as { $schema: string }).$schema;
    expect($schema.endsWith(CATALOG_SCHEMA_PATH)).toBe(true);
    // and the schema's own $id agrees on the basename
    expect(String(schema.$id).endsWith(CATALOG_SCHEMA_PATH)).toBe(true);
  });

  it("additionalProperties is locked at every object level", () => {
    // A regression here would let new fields slip in un-described. Assert every
    // object schema forbids extras.
    const defs = schema.$defs as Record<string, { additionalProperties?: boolean }>;
    const props = schema.properties as Record<string, { additionalProperties?: boolean }>;
    expect(schema.additionalProperties).toBe(false);
    expect(defs.prop.additionalProperties).toBe(false);
    expect(defs.chart.additionalProperties).toBe(false);
    expect(props.mcp.additionalProperties).toBe(false);
  });

  it("the MCP pointer names the real server, and its docs page exists", () => {
    const { mcp } = buildCatalog();
    // Guarded end-to-end in mcp-docs.test.ts against packages/mcp itself; here
    // we only assert the catalog's own shape stays honest.
    expect(mcp.transport).toBe("stdio");
    expect(mcp.command).toContain(mcp.package);
    expect(mcp.docs.endsWith("/docs/mcp")).toBe(true);
    expect(mcp.tools.length).toBeGreaterThan(0);
  });
});
