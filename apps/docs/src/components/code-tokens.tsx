import { lexJsx } from "@/lib/jsx-lex";

/**
 * Renders a lexed snippet. Kept next to the lexer rather than inside it so the
 * lexer stays a pure, React-free module — the same split the library itself uses
 * between `core/` and the components that draw with it.
 */
export function CodeTokens({ code }: { code: string }) {
  return (
    <>
      {lexJsx(code).map((t) =>
        t.cls ? (
          <span key={t.at} className={t.cls}>
            {t.text}
          </span>
        ) : (
          t.text
        ),
      )}
    </>
  );
}
