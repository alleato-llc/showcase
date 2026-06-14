#!/usr/bin/env bash
#
# Scaffold a STANDALONE showcase instance from this engine — a self-contained
# Astro project (a copy of packages/site) plus a data/ folder, so it builds and
# deploys on its own without depending on the engine at build time.
#
# Usage:  scripts/new-instance.sh <target-dir> [--data <dir>] [--domain <host>]
#   --data    seed projects/config/themes from here (default: examples/default)
#   --domain  S3 bucket / site domain for the deploy workflow (default: a placeholder)
#
# Editing stays in the engine: hand-edit data/*.json, or point the engine's
# CLI/GUI at this folder's data dir. Engine updates are a manual re-sync.
set -euo pipefail

ENGINE_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET=""
DATA_SRC="$ENGINE_ROOT/examples/default"
DOMAIN="your-portfolio.example.com"

while [ $# -gt 0 ]; do
  case "$1" in
    --data) DATA_SRC="$2"; shift 2 ;;
    --domain) DOMAIN="$2"; shift 2 ;;
    -*) echo "unknown flag: $1" >&2; exit 2 ;;
    *) TARGET="$1"; shift ;;
  esac
done
[ -n "$TARGET" ] || { echo "usage: new-instance.sh <target-dir> [--data <dir>] [--domain <host>]" >&2; exit 2; }
NAME="$(basename "$TARGET")"

mkdir -p "$TARGET/data" "$TARGET/.github/workflows"

# the site generator (standalone copy)
cp -R "$ENGINE_ROOT/packages/site/src" "$TARGET/src"
cp -R "$ENGINE_ROOT/packages/site/public" "$TARGET/public"
cp "$ENGINE_ROOT/packages/site/astro.config.mjs" "$ENGINE_ROOT/packages/site/tsconfig.json" "$TARGET/"

# seed content
cp "$DATA_SRC/projects.json" "$DATA_SRC/config.json" "$DATA_SRC/themes.json" "$TARGET/data/"

# the site reads its data from ./data via SHOWCASE_DATA (set in the scripts)
cat > "$TARGET/package.json" <<JSON
{
  "name": "${NAME}",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "SHOWCASE_DATA=./data astro dev",
    "build": "SHOWCASE_DATA=./data astro build",
    "preview": "astro preview"
  },
  "dependencies": {
    "@astrojs/preact": "^4.0.0",
    "astro": "^5.0.0",
    "preact": "^10.25.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0"
  }
}
JSON

cat > "$TARGET/.gitignore" <<'GI'
node_modules/
dist/
.astro/
.DS_Store
GI

cat > "$TARGET/.github/workflows/deploy.yml" <<YAML
name: Deploy

# Self-contained: build this Astro site and publish to ${DOMAIN} via
# OIDC -> S3 -> CloudFront invalidate. Needs an S3 bucket named after the
# domain, a CloudFront distribution aliased to it, an OIDC deploy role, and the
# repo vars AWS_REGION / AWS_SITE_ROLE_ARN.
on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  id-token: write
  contents: read

concurrency:
  group: deploy
  cancel-in-progress: true

env:
  AWS_REGION: \${{ vars.AWS_REGION }}
  SITE_DOMAIN: ${DOMAIN}

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: |
          npm ci
          npm run build
      - name: Mask account id
        env:
          ROLE_ARN: \${{ vars.AWS_SITE_ROLE_ARN }}
        run: |
          echo "::add-mask::\$(printf '%s' "\$ROLE_ARN" | cut -d: -f5)"
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: \${{ vars.AWS_SITE_ROLE_ARN }}
          aws-region: \${{ env.AWS_REGION }}
      - name: Deploy
        run: |
          aws s3 sync dist "s3://\$SITE_DOMAIN" --delete
          DIST=\$(aws cloudfront list-distributions \\
            --query "DistributionList.Items[?contains(Aliases.Items, '\$SITE_DOMAIN')].Id | [0]" \\
            --output text)
          if [ -n "\$DIST" ] && [ "\$DIST" != "None" ]; then
            aws cloudfront create-invalidation --distribution-id "\$DIST" --paths "/*"
          else
            echo "::warning::no CloudFront distribution aliased to \$SITE_DOMAIN"
          fi
YAML

cat > "$TARGET/README.md" <<MD
# ${NAME}

A standalone [showcase](https://github.com/alleato-llc/showcase) portfolio — a
self-contained Astro site plus its content in \`data/\`.

\`\`\`bash
npm install
npm run dev      # local preview
npm run build    # static build -> dist/
\`\`\`

Edit \`data/projects.json\`, \`data/config.json\`, \`data/themes.json\` by hand, or
point the engine's CLI/GUI at \`data/\` (the editing tool lives in the engine
repo). Push to \`main\` to deploy (see \`.github/workflows/deploy.yml\`).

Scaffolded from the engine with \`scripts/new-instance.sh\`; pull engine updates
by re-running it (or merging) when you want them.
MD

echo "Scaffolded standalone instance: $TARGET  (domain: $DOMAIN)"
echo "Next: cd \"$TARGET\" && npm install && npm run dev"
