---
description: Deploy Exim-Accurate to Komodo using GitHub Actions and GHCR
---

# Komodo Deployment Guide (GitHub Actions + GHCR)

This guide uses **GitHub Actions** to build the image and **Komodo UI** to deploy it.

---

## Step 1: CI/CD Build (Automated)

1. Any push to `main` triggers the GitHub Action: `.github/workflows/docker-build.yml`.
2. The action builds the image and pushes it to `ghcr.io/faisalnh/exim-accurate:latest`.

**Verification:**
- Check [GitHub Actions](https://github.com/faisalnh/Exim-Accurate/actions) to ensure the build succeeds.
- Check [GitHub Packages](https://github.com/faisalnh/Exim-Accurate/packages) to see the image.

> [!IMPORTANT]
> To allow Komodo to pull the image without a token:
> 1. Go to your Package Settings on GitHub.
> 2. Set the package visibility to **Public**.
> 3. Or, add your GitHub PAT to Komodo's **Registry** settings.

---

## Step 2: Configure Komodo Stack

1. Open Komodo UI → **Stacks** → `exima`
2. Ensure **Source** is set to `Git Repo` (linked to `exima` repo).
3. Ensure **Compose File Path** is `compose.yaml`.
4. Update/Verify **Environment** variables:
   - Ensure `DATABASE_URL` host is `postgres`.
   - Ensure `NEXTAUTH_URL` and `ACCURATE_REDIRECT_URI` use the production domain.

---

## Step 3: Pull and Deploy

1. In the `exima` stack, click **Pull** to sync the latest `compose.yaml`.
2. Click **Deploy**.
3. Komodo will pull the `latest` image from GHCR and start the containers.

---

## Step 4: Post-Deployment Steps

1. **Run Migration:**
   - Click the **app** container in Komodo.
   - Run: `npx prisma db push`
   
2. **Seed Admin User:**
   - Run: `npm run db:seed admin@yourdomain.com YourSecurePassword admin`

---

## Troubleshooting

### "Permission Denied" on Pull
If the GHCR image is private, Komodo will fail to pull.
- **Fix:** Go to **Registries** in Komodo sidebar → **Add Registry** → `ghcr.io` with your GitHub username and PAT.

### Buildx Errors
By using GHCR, we bypass the `buildx` issues on the Komodo server as the build happens on GitHub's infrastructure.