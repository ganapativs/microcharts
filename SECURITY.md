# Security Policy

## Supported versions

microcharts is pre-1.0; security fixes land on the latest published release of `@microcharts/react`. Please upgrade to
the newest version before reporting.

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

Report privately through GitHub's
[private vulnerability reporting](https://github.com/ganapativs/microcharts/security/advisories/new), or email
**vsg.inbox@gmail.com** with the details.

Include, where possible:

- affected version(s) and environment (React version, RSC/SSR/CSR),
- a minimal reproduction or proof of concept,
- the impact you observed.

You'll get an acknowledgement within a few days. Once a fix is ready, a patched release is published and the advisory is
disclosed with credit to the reporter (unless you prefer to stay anonymous).

## Scope

microcharts ships zero runtime dependencies and renders SVG from the data you pass it. The most relevant classes of
issue are around untrusted input reaching chart props (e.g. label/summary text) and any output that could break SVG/HTML
containment. Reports demonstrating such vectors are especially welcome.
