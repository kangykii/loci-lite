# Loci Lite Auto-Update Guide

## Overview

Auto-updates are configured to work with GitHub Releases. When you tag a release, a GitHub Actions workflow automatically:

1. **Builds** the Tauri app for Windows x86_64
2. **Creates** a GitHub Release with signed installers
3. **Updates** `updates/latest.json` with the new version info
4. **App checks** this manifest on startup and prompts users to update

## Setup Instructions

### 1. Generate a Tauri Signing Key (One-time)

```bash
# Install Tauri CLI if you don't have it
cargo install tauri-cli

# Generate private key (store this safely!)
tauri signer generate -w "private.key"

# Extract public key
tauri signer extract-public-key -private-key private.key -output public.key
```

**Important:** 
- Store `private.key` securely (add to `.gitignore`, never commit)
- Add `public.key` to your Tauri config in `src-tauri/tauri.conf.json`:

```json
{
  "plugins": {
    "updater": {
      "endpoints": ["https://raw.githubusercontent.com/kangykii/loci-lite/master/updates/latest.json"],
      "pubkey": "YOUR_PUBLIC_KEY_HERE",
      "windows": {
        "installMode": "passive"
      }
    }
  }
}
```

### 2. Add Keys to GitHub Secrets

1. Go to **Settings → Secrets and variables → Actions**
2. Create two secrets:
   - `TAURI_SIGNING_PRIVATE_KEY`: Contents of `private.key`
   - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: Password (if key is encrypted) or leave empty

### 3. Update Release Workflow

The `.github/workflows/release.yml` already includes the signing logic. Just verify these env vars are set:

```yaml
env:
  TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
  TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
```

### 4. Create a Release

Tag and push to trigger the workflow:

```bash
# Bump version in both:
# - src-tauri/tauri.conf.json: "version": "0.2.1"
# - src-tauri/Cargo.toml: version = "0.2.1"

git add src-tauri/tauri.conf.json src-tauri/Cargo.toml
git commit -m "Bump version to 0.2.1"
git tag app-v0.2.1
git push origin master --tags
```

The GitHub Actions workflow will:
- Build the release
- Create a GitHub Release
- Auto-generate and commit `updates/latest.json`
- Users' apps will prompt to update on next startup

Local builds keep `bundle.createUpdaterArtifacts` disabled so `pnpm tauri build` can produce the setup EXE without requiring signing secrets. The release workflow temporarily enables updater artifacts in CI after `TAURI_SIGNING_PRIVATE_KEY` is available.

### 5. Testing Auto-Updates Locally

```bash
# Build locally without updater artifacts
pnpm tauri build

# Test by checking the app console (should download latest.json)
# Modify updates/latest.json version to a future version to trigger update prompt
```

## File Structure

```
updates/
├── latest.json          # Auto-generated manifest (do not edit manually)
└── README.md            # This file

.github/workflows/
└── release.yml          # GitHub Actions workflow for automated releases

scripts/
└── sign-release.sh      # Helper to manually sign releases if needed
```

## Troubleshooting

### "Could not fetch a valid release JSON"

**Cause:** `updates/latest.json` is malformed or unreachable.

**Fix:**
- Check the file exists at `https://raw.githubusercontent.com/kangykii/loci-lite/master/updates/latest.json`
- Validate JSON syntax
- Ensure the repo is public (not private)

### Signature validation fails

**Cause:** Public key doesn't match the one used to sign the executable.

**Fix:**
- Regenerate keys:
  ```bash
  tauri signer generate -w "private.key"
  tauri signer extract-public-key -private-key private.key -output public.key
  ```
- Update GitHub Secrets
- Rebuild and retag

### App doesn't prompt for update

**Cause:** Version in `latest.json` is not higher than current app version.

**Fix:**
- Check `latest.json` version is higher than app version
- Check `tauri.conf.json` has correct version number
- Manually test: set `latest.json` version to `999.0.0`

## Manual Release Process (if needed)

If GitHub Actions fails:

```bash
# 1. Build locally
pnpm build

# Enable bundle.createUpdaterArtifacts first if you need a signed updater manifest.
pnpm tauri build

# 2. Sign the executable
./scripts/sign-release.sh "src-tauri/target/release/bundle/nsis/Loci.Notepad_0.2.1_x64-setup.exe" private.key

# 3. Upload to GitHub Releases manually
# 4. Update updates/latest.json with the URL and signature
```

## Version Management

Keep these in sync:

| File | Field | Example |
|------|-------|---------|
| `src-tauri/tauri.conf.json` | `"version"` | `"0.2.1"` |
| `src-tauri/Cargo.toml` | `version` | `0.2.1` |
| Git tag | Tag name | `app-v0.2.1` |
| `updates/latest.json` | `"version"` | `"0.2.1"` |

**Pro tip:** Add a pre-commit hook to validate these match.
