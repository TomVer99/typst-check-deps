# Typst Dependency Checker Action

[![GitHub Super-Linter](https://github.com/TomVer99/typst-check-deps/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/TomVer99/typst-check-deps/actions/workflows/ci.yml/badge.svg)
[![Check dist/](https://github.com/TomVer99/typst-check-deps/actions/workflows/check-dist.yml/badge.svg)](https://github.com/TomVer99/typst-check-deps/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/TomVer99/typst-check-deps/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/TomVer99/typst-check-deps/actions/workflows/codeql-analysis.yml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

This GitHub Action checks for outdated dependencies in your
[Typst](https://typst.app/) project.

Features

- Scans imported packages in Typst files and reports if newer versions are
  available on Typst Universe

- Returns a markdown table as an output for use in PR comments or workflow steps

Usage

Add the action to your workflow. Example (use the release tag or repository
path):

DISCLAIMER: This action only works with a Typst TOML file in the root directory
of your repository.

```yaml
name: Check Typst deps

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  check-deps:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Typst Dependency Checker
        uses: TomVer99/typst-check-deps@v0.1.0
        id: deps
        with:
          fail-on-newer-version: false

      - name: Post results as PR comment
        uses: peter-evans/create-or-update-comment@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          repository: ${{ github.repository }}
          issue-number: ${{ github.event.pull_request.number }}
          body: ${{ steps.deps.outputs.table }}
```

Inputs

- `fail-on-newer-version` (optional, boolean) — If `true`, the action fails the
  job when a newer version is detected. Default: `false`.

Outputs

- `table` — A markdown table listing found dependencies, detected version and
  the latest version on Typst Universe.

Examples

- To fail CI when a newer version is available:

```yaml
with:
  fail-on-newer-version: true
```

Troubleshooting

- If the action cannot find Typst files, make sure your repository contains
  `.typ` files and that the workflow checks out the repository (see the
  `actions/checkout` step above).
- If you modify the TypeScript source, ensure the compiled `dist/` is present in
  the release/tag or that your workflow builds the action before using it.

Changelog

See `CHANGELOG.md` for detailed release notes. Initial public release notes:

- 0.1.0 - Initial public release: Typst dependency scanning and reporting
