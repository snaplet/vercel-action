# Vercel Preview Github Action

<p align="center">
  <img width="360" src="logo.png" alt="Snappy looking through a magnifier with the Vercel logo in its center">
</p>

> Deploy Vercel previews. Integrate with external services smoothly.

Vercel preview deployments happen automatically with each commit. This action allows you to pause automatic deployments, which is helpful when you want to wait for an external service (like a database) to be ready before running code against it.

Combine this action with [snaplet/action](https://github.com/snaplet/action) to get an ephemeral database with production-accurate data for each pull-request. [Learn more here.](#with-snaplet)

## Usage

Create a GitHub Action Workflow file in your repository following one of these examples.

### Standalone

```yaml
# .github/workflows/preview.yml

name: Preview Environment

env:
  VERCEL_ACCESS_TOKEN: ${{ secrets.VERCEL_ACCESS_TOKEN }}
  VERCEL_PROJECT_ID: <YOUR_VERCEL_PROJECT_ID>

on:
  pull_request:
    types: [opened, synchronize, closed]
    branches:
      - main

jobs:
  deploy:
    if: ${{ github.event.action == 'opened' || github.event.action == 'synchronize' }}
    runs-on: ubuntu-latest
    steps:
      - uses: snaplet/vercel-action@v1
  delete:
    if: ${{ github.event.action == 'closed' }}
    runs-on: ubuntu-latest
    steps:
      - uses: snaplet/vercel-action@v1
        with:
          delete: true
```

### With Snaplet

Using [snaplet/action](https://github.com/marketplace/actions/snaplet-instant-database)

```yaml
# .github/workflows/preview.yml

name: Preview Environment

env:
  SNAPLET_ACCESS_TOKEN: ${{ secrets.SNAPLET_ACCESS_TOKEN }}
  SNAPLET_PROJECT_ID: <YOUR_SNAPLET_PROJECT_ID>
  VERCEL_ACCESS_TOKEN: ${{ secrets.VERCEL_ACCESS_TOKEN }}
  VERCEL_PROJECT_ID: <YOUR_VERCEL_PROJECT_ID>

on:
  pull_request:
    types: [opened, synchronize, closed]
    branches:
      - main

jobs:
  deploy:
    if: ${{ github.event.action == 'opened' || github.event.action == 'synchronize' }}
    runs-on: ubuntu-latest
    steps:
      - id: snaplet
        uses: snaplet/action@v1
      - uses: snaplet/vercel-action@v1
        with:
          env: |
            DATABASE_URL=${{ steps.snaplet.outputs.database-url }}
  delete:
    if: ${{ github.event.action == 'closed' }}
    runs-on: ubuntu-latest
    steps:
      - uses: snaplet/action@v1
        with:
          delete: true
      - uses: snaplet/vercel-action@v1
        with:
          delete: true
```

## Documentation

### Prerequisites

[Connect your GitHub repository with Vercel](https://vercel.com/docs/concepts/git/vercel-for-github)

### Environment variables

- VERCEL_ACCESS_TOKEN
- VERCEL_PROJECT_ID

### Inputs

```yaml
delete:
  description: Delete the preview related data on Vercel
  required: false
  type: boolean
  default: false
env:
  description: Environment variables to create on Vercel, they are scoped to the "preview" environment and the current branch
  required: false
  type: string
```