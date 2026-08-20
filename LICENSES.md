# Licensing

Three components, three licenses, chosen deliberately:

| Component | Paths | License |
|---|---|---|
| Code — schema file, validator, CLI, tests | `spec/**/*.schema.json`, `src/`, `bin/`, `tests/` | [Apache-2.0](LICENSE) |
| Specification prose and documentation | `spec/**/*.md`, `docs/`, `README.md`, `GOVERNANCE.md` | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| Examples | `spec/**/examples/` | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |

Why the split:

- **Apache-2.0 on code** carries an express patent grant, which matters for
  anything intended to become a standard, and is maximally friendly to
  commercial adoption.
- **CC BY 4.0 on prose** lets anyone republish, translate, or excerpt the
  specification with attribution — how spec text actually spreads.
- **CC0 on examples** means copying an example into your own repository as a
  starting point creates no attribution obligation. Examples exist to be
  copied.

By contributing, you license your contribution under the license of the files
you touch (see CONTRIBUTING.md; DCO sign-off required).
