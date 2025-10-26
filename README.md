# Typst Dependency Checker Action

<!-- Project Status & Quality -->

![Maintenance](https://img.shields.io/badge/Maintained-Yes-green)
![GitHub release (with filter)](https://img.shields.io/github/v/release/TomVer99/typst-check-deps)
![GitHub License](https://img.shields.io/github/license/TomVer99/typst-check-deps)

<!-- CI Badges -->

[![GitHub Super-Linter](https://github.com/TomVer99/typst-check-deps/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/TomVer99/typst-check-deps/actions/workflows/ci.yml/badge.svg)
[![Check dist/](https://github.com/TomVer99/typst-check-deps/actions/workflows/check-dist.yml/badge.svg)](https://github.com/TomVer99/typst-check-deps/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/TomVer99/typst-check-deps/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/TomVer99/typst-check-deps/actions/workflows/codeql-analysis.yml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

<!-- Community & Activity -->

![GitHub Repo stars](https://img.shields.io/github/stars/TomVer99/typst-check-deps)
![Issues](https://img.shields.io/github/issues-raw/TomVer99/typst-check-deps?label=Issues)
![GitHub commits since latest release](https://img.shields.io/github/commits-since/TomVer99/typst-check-deps/latest)

This GitHub Action checks for outdated dependencies in your
[Typst](https://typst.app/) project.

---

**Support this project:** If you find this action valuable, please consider
leaving a star to help others discover it,\
or buy me a coffee to support its development!\
[![BuyMeACoffee](https://raw.githubusercontent.com/pachadotdev/buymeacoffee-badges/main/bmc-yellow.svg)](https://www.buymeacoffee.com/tomver)

## Features

- Scans imported packages in Typst files and reports if newer versions are
  available on Typst Universe
- Adds a comment to pull requests with a summary table of dependencies

### Disclaimers :warning:

:mag:\
Currently, this action only works with a Typst TOML file located in the root
directory of your repository. It will NOT work in _any_ other case.

:mag:\
Also, due to the fact that Typst Universe does not have an official API, the
action relies on web scraping to get the latest version information. It is
therefore not recommended for use in production environments.

## Planned Features

### v1.0.0 [[Milestone](https://github.com/TomVer99/typst-check-deps/milestone/1)]

- Update comment on PR to avoid multiple comments
  [#6](https://github.com/TomVer99/typst-check-deps/issues/6)
- Use GitHub as source of truth for latest versions instead of Typst Universe
  [#7](https://github.com/TomVer99/typst-check-deps/issues/7)
- Improve comment formatting
  [#8](https://github.com/TomVer99/typst-check-deps/issues/8)
- Increase test coverage to 80%+
  [#9](https://github.com/TomVer99/typst-check-deps/issues/9)

### v1.0.0+

- Support for other project types
  - Allow user to specify path(s) to project file(s)
  - Automatically detect of no TOML is found in root, and scan for project files

## Usage

Add the following to your GitHub Actions workflow file (e.g.
`.github/workflows/deps-check.yml`):

```yaml
name: Check Typst deps

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  check-deps:
    permissions:
      pull-requests: write
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
  job when a newer version is detected. Default: `false`. (can be used to fail
  CI when outdated dependencies are found)
