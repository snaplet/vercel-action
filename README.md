# Vercel Preview Environment Github Action

## Usage

### With Snaplet

```yaml
# .github/workflows/preview.yml

name: Preview Environment

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
      - uses: actions/checkout@v3
      - id: snaplet
        uses: snaplet/action@main
        with:
          access-token: ${{ secrets.SNAPLET_ACCESS_TOKEN }}
          project-id: <YOUR_SNAPLET_PROJECT_ID>
      - uses: snaplet/vercel-action@main
        with:
          access-token: ${{ secrets.VERCEL_ACCESS_TOKEN }}
          project-id: <YOUR_VERCEL_PROJECT_ID>
        env:
          VERCEL_PREVIEW_DATABASE_URL: ${{ steps.snaplet.outputs.database-url }}
  delete:
    if: ${{ github.event.action == 'closed' }}
    runs-on: ubuntu-latest
    steps:
      - uses: snaplet/action@main
        with:
          access-token: ${{ secrets.SNAPLET_ACCESS_TOKEN }}
          delete: true
          project-id: <YOUR_SNAPLET_PROJECT_ID>
      - uses: snaplet/vercel-action@main
        with:
          access-token: ${{ secrets.VERCEL_ACCESS_TOKEN }}
          delete: true
          project-id: <YOUR_VERCEL_PROJECT_ID>
```

## Documentation

### Prerequisites

- [Connect your GitHub repository with Vercel](https://vercel.com/docs/concepts/git/vercel-for-github)

### Inputs

```yaml
access-token:
  description: Vercel access token
  required: true
  type: string

delete:
  description: Delete the preview related data on Vercel
  required: false
  type: boolean
  default: false

env-preview-prefix:
  description: Prefix to detect environment variables to create on Vercel
  required: false
  type: string
  default: VERCEL_PREVIEW_

project-id:
  description: Vercel project id
  required: true
  type: string
```