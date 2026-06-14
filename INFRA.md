# Infrastructure

The site deploys (`.github/workflows/deploy.yml`) publish static files to **S3 +
CloudFront** using GitHub **OIDC** (no stored keys), mirroring Soroban. The
workflow does the deploy; the AWS resources below must exist first. The
convention (from `salpa`): **the S3 bucket name equals the domain**, and the
CloudFront distribution is found at runtime by its **alias == domain** (so no
distribution id is hard-coded).

## What this repo deploys

| Site         | Domain                      | Source synced            |
| ------------ | --------------------------- | ------------------------ |
| Landing page | `showcase.alleato.dev`      | `landing/`               |
| Live demo    | `demo.showcase.alleato.dev` | `packages/site/dist` (built from `examples/default`) |

## AWS resources to provision (per domain)

For **each** domain above:

1. **S3 bucket** named exactly as the domain (e.g. `showcase.alleato.dev`),
   private, holding the static files.
2. **ACM certificate** (in `us-east-1`) covering the domain.
3. **CloudFront distribution** with:
   - the domain as an **alternate name (alias)** + that ACM cert,
   - the S3 bucket as origin (OAC),
   - default root object `index.html`,
   - a viewer-request function that appends `.html` to extensionless paths
     (the site is built with `format: "file"`, so `/about` ⇒ `/about.html`).
4. **DNS**: a record for the domain → the CloudFront distribution.

## GitHub OIDC role

One IAM role assumable by this repo's Actions via the GitHub OIDC provider
(`token.actions.githubusercontent.com`), trust scoped to
`repo:alleato-llc/showcase:*`. Permissions:

- `s3:ListBucket`, `s3:PutObject`, `s3:DeleteObject` on the buckets (and `/*`).
- `cloudfront:ListDistributions`, `cloudfront:CreateInvalidation`.

## Repository configuration

Set these as **repository variables** (Settings → Secrets and variables →
Actions → Variables):

| Variable             | Value                                         |
| -------------------- | --------------------------------------------- |
| `AWS_REGION`         | e.g. `us-east-1`                              |
| `AWS_SITE_ROLE_ARN`  | ARN of the OIDC deploy role above             |

No secrets are required — OIDC issues short-lived credentials at run time.

## salpa

The deploy is driven by [`salpa`](https://github.com/alleato-llc/salpa)
(>= 0.1.10), pulled from `ghcr.io/alleato-llc/salpa` in the workflow. Each run
sets `$SALPA_DIR` + `$SALPA_BUCKET` and salpa does `aws s3 sync --delete` +
CloudFront invalidate. The workflows declare `permissions: packages: read` and
`oras login` with the job token — so the **salpa ghcr package must be readable**
by each deploying repo (make it public, or grant the org/repos read access).
This is especially relevant for the instance repo (`nycjv321/showcase`), which
pulls salpa from a different org (`alleato-llc`).

## Instances

A portfolio **instance** (e.g. `nycjv321/showcase` → `showcase.javierlvelasquez.com`)
uses the same pattern with its own bucket/distribution/role in its own account.
A **standalone** instance (scaffolded by `scripts/new-instance.sh`) builds and
deploys on its own (one bucket); a **thin** instance checks this engine out as a
sibling and builds with `SHOWCASE_DATA`.
