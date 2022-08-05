# Vercel Preview Github Action

> Deploy Vercel previews. Integrate with external services smoothly.

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
      - uses: snaplet/vercel-action@main
  delete:
    if: ${{ github.event.action == 'closed' }}
    runs-on: ubuntu-latest
    steps:
      - uses: snaplet/vercel-action@main
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
        uses: snaplet/action@main
      - uses: snaplet/vercel-action@main
        with:
          env: |
            DATABASE_URL=${{ steps.snaplet.outputs.database-url }}
  delete:
    if: ${{ github.event.action == 'closed' }}
    runs-on: ubuntu-latest
    steps:
      - uses: snaplet/action@main
        with:
          delete: true
      - uses: snaplet/vercel-action@main
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