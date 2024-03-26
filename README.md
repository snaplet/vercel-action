# Vercel Preview Deployments Github Action

<p align="center">
  <img width="360" src="logo.png" alt="Snappy looking through a magnifier with the Vercel logo in its center">
</p>

> Trigger Vercel preview deployments when you want to integrate with external services smoothly.

Vercel preview deployments happen automatically with each commit. This action allows you to take control over automatic deployments, which is helpful when you want to create external resources (like a database) and wait for services to be ready before deploying your code on Vercel.

To take control over the automatic deployments, this action is injecting a custom [script](scripts/ignore-build.mjs) into the [Ignored Build Step](https://vercel.com/guides/how-do-i-use-the-ignored-build-step-field-on-vercel) in your Vercel project settings. This script is canceling all preview deployments coming from the Vercel GitHub App and only allows deployments created by this GitHub action (based on [Vercel REST API](https://vercel.com/docs/rest-api#endpoints/deployments/create-a-new-deployment)).

Combine this action with [snaplet/action](https://github.com/marketplace/actions/snaplet-preview-databases) to get preview databases with production-accurate data for each of your Vercel preview deployment. [Learn more here.](#with-snaplet)

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
      - uses: snaplet/vercel-action@v3
  delete:
    if: ${{ github.event.action == 'closed' }}
    runs-on: ubuntu-latest
    steps:
      - uses: snaplet/vercel-action@v3
        with:
          delete: true
```

### With Snaplet

Using [snaplet/action](https://github.com/marketplace/actions/snaplet-preview-databases)

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
      - uses: snaplet/vercel-action@v3
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
      - uses: snaplet/vercel-action@v3
        with:
          delete: true
```

## Documentation

### Prerequisites

[Connect your GitHub repository with Vercel](https://vercel.com/docs/concepts/git/vercel-for-github)

### Environment variables

- VERCEL_ACCESS_TOKEN **[required]**
- VERCEL_PROJECT_ID **[required]**
- VERCEL_TEAM_ID

### Inputs

```yaml
await-for-deployment:
  description: Await for the preview deployment to be ready and output the preview deployment URL
  required: false
  type: boolean
  default: false
delete:
  description: Delete the preview related data on Vercel
  required: false
  type: boolean
  default: false
env:
  description: Environment variables to create on Vercel, they are scoped to the "preview" environment and the current branch
  required: false
  type: string
ignored-branches:
  description: Branches to ignore the preview deployments. The default value is "main,master,develop".
  required: false
  default: main,master,develop
ignored-build-command:
  description: Command set for the Ignored Build Step in your project settings, the default script is canceling all preview deployments coming from the Vercel Github App and only allows preview deployments coming from this GitHub action.
  required: false
  type: string
  default: curl -sS "https://raw.githubusercontent.com/snaplet/vercel-action/v3/scripts/ignore-build.mjs" | node --input-type=module
```

### Outputs

```yaml
deployment-url:
  description: Preview deployment url
```
