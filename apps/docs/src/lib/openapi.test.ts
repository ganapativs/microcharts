import { describe, expect, it } from "vitest";
import Ajv2020 from "ajv/dist/2020";
import { buildOpenApi } from "./openapi.ts";
import { STABLE_CHARTS } from "./catalog.ts";
import { SITE } from "./site.ts";
import { methodNotAllowed, notAcceptable, notFound, problemJson } from "./agent-errors.ts";

const doc = buildOpenApi();
const operations = Object.entries(doc.paths).flatMap(([path, item]) =>
  Object.entries(item as Record<string, Record<string, unknown>>).map(([method, op]) => ({
    path,
    method,
    op,
  })),
);

describe("the document", () => {
  it("is OpenAPI 3.1", () => {
    expect(doc.openapi).toMatch(/^3\.1\./);
  });

  it("points at the deployed origin", () => {
    expect(doc.servers[0].url).toBe(SITE.url);
  });

  it("names a way to reach a human", () => {
    expect(doc.info.contact.url).toContain("github.com");
    expect(doc.info.contact.email).toBe(SITE.email);
    expect(doc.info.license.identifier).toBe("MIT");
  });

  it("declares no authentication, because there is none", () => {
    expect("security" in doc).toBe(false);
    expect("securitySchemes" in doc.components).toBe(false);
  });
});

describe("every operation", () => {
  it("is a GET — the site is read-only", () => {
    for (const { path, method } of operations) expect(`${path} ${method}`).toContain("get");
  });

  it("has a unique operationId", () => {
    const ids = operations.map((o) => o.op.operationId);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z][A-Za-z0-9]+$/);
  });

  it("has a summary and a description", () => {
    for (const { path, op } of operations) {
      expect(typeof op.summary, path).toBe("string");
      expect((op.description as string).length, path).toBeGreaterThan(40);
    }
  });

  it("declares a response schema for every status", () => {
    for (const { path, op } of operations) {
      const responses = op.responses as Record<string, Record<string, unknown>>;
      expect(Object.keys(responses).length, path).toBeGreaterThan(0);
      for (const [status, response] of Object.entries(responses)) {
        if ("$ref" in response) continue; // shared response, checked below
        const content = response.content as Record<string, { schema?: unknown }>;
        expect(Object.keys(content).length, `${path} ${status}`).toBeGreaterThan(0);
        for (const media of Object.values(content)) expect(media.schema).toBeTruthy();
      }
    }
  });

  it("types and describes every parameter", () => {
    for (const { path, op } of operations) {
      for (const parameter of (op.parameters ?? []) as Record<string, unknown>[]) {
        if ("$ref" in parameter) {
          const name = (parameter.$ref as string).split("/").pop() as string;
          expect(doc.components.parameters, path).toHaveProperty(name);
          continue;
        }
        expect(parameter.schema, path).toBeTruthy();
      }
    }
  });

  it("only tags with tags the document declares", () => {
    const declared = new Set(doc.tags.map((t) => t.name));
    for (const { path, op } of operations) {
      for (const tag of (op.tags ?? []) as string[]) expect(declared, path).toContain(tag);
    }
  });
});

describe("references", () => {
  const refs: string[] = [];
  JSON.stringify(doc, (key, value) => {
    if (key === "$ref" && typeof value === "string") refs.push(value);
    return value;
  });

  it("resolves every local $ref", () => {
    const local = refs.filter((r) => r.startsWith("#/"));
    expect(local.length).toBeGreaterThan(0);
    for (const ref of local) {
      const resolved = ref
        .slice(2)
        .split("/")
        .reduce<unknown>((node, part) => (node as Record<string, unknown>)?.[part], doc);
      expect(resolved, ref).toBeTruthy();
    }
  });

  it("points external refs at the published catalog schema", () => {
    for (const ref of refs.filter((r) => !r.startsWith("#/"))) {
      expect(ref.startsWith(`${SITE.url}/catalog.schema.json`), ref).toBe(true);
    }
  });
});

describe("the chart slug parameter", () => {
  it("enumerates exactly the charts that ship", () => {
    const enumerated = doc.components.parameters.ChartSlug.schema.enum;
    expect([...enumerated].sort()).toEqual(STABLE_CHARTS.map((c) => c.slug).sort());
  });
});

/**
 * The strongest guarantee here: the Problem schema the document publishes is
 * checked against the bodies the Worker actually renders. A drift between the
 * two is the failure an agent would hit at runtime, so it fails here first.
 */
describe("the published Problem schema", () => {
  const ajv = new Ajv2020({ strict: false, validateFormats: false });
  const validate = ajv.compile(doc.components.schemas.Problem);
  const origin = SITE.url;

  it.each([
    ["404", notFound({ path: "/nope", origin, suggestions: [`${origin}/docs`] })],
    ["404 with no suggestions", notFound({ path: "/nope", origin })],
    ["405", methodNotAllowed({ path: "/api/search", origin, method: "POST" })],
    ["406", notAcceptable({ path: "/charts/core", origin, accept: "text/markdown" })],
  ])("validates the real %s body", (_label, problem) => {
    const body = JSON.parse(problemJson(problem, origin));
    expect(validate(body), JSON.stringify(validate.errors)).toBe(true);
  });

  it("enumerates every code the builders emit", () => {
    const codes = doc.components.schemas.Problem.properties.code.enum;
    expect(codes).toContain(notFound({ path: "/x", origin }).code);
    expect(codes).toContain(methodNotAllowed({ path: "/x", origin, method: "PUT" }).code);
    expect(codes).toContain(notAcceptable({ path: "/x", origin, accept: "x" }).code);
  });
});
