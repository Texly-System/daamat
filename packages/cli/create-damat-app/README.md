<p align="center">
  <a href="https://github.com/damatjs/damat">
    <h1 align="center">create-damat-app</h1>
  </a>
</p>

<h4 align="center">
  <a href="https://docs.damat.com">Documentation</a> |
  <a href="https://damat.com">Website</a>
</h4>

<p align="center">
An open source composable commerce engine built for developers.
</p>
<p align="center">
  <a href="https://github.com/damatjs/damat/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="damat is released under the MIT license." />
  </a>
  <a href="https://github.com/damatjs/damat">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat" alt="PRs welcome!" />
  </a>
</p>

## Overview

Using this command, you can setup a damat backend and admin along with a PostgreSQL database in simple steps.

---

## Usage

Run the following command in your terminal:

```bash
npx create-damat-app@latest
```

Then, answer the prompted questions to setup your PostgreSQL database and damat project.

### Options

| Option | Description | Default value |
|---|---|---|
| `--module` | Create a module instead of a project | `false` |
| `--repo-url <url>` | Create damat project from a different repository URL | `https://github.com/damatjs/damat-starter-default` |
| `--version <version>` | The version of damat packages to install | `latest` |
| `--directory-path <path>` | Specify the directory path to install the project in | `process.cwd()` |
| `--verbose` | Show all logs. Useful for debugging | `false` |
| `--use-bun` | Use bun as the package manager | `false` |
