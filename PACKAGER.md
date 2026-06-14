# Packaging and Release Rules

## Versioning

- Release tags use `app-vX.Y.Z`.
- Keep these versions in sync before tagging:
  - `package.json`
  - `src-tauri/Cargo.toml`
  - `src-tauri/tauri.conf.json`
  - `src-tauri/Cargo.lock`
- Do not reuse a published tag unless the workflow failed before publishing assets.

## Windows Bundles

- Windows releases are NSIS setup EXE only.
- Keep `bundle.targets` set to `["nsis"]`.
- Do not publish MSI assets.
- Keep local `bundle.createUpdaterArtifacts` set to `false`.
- The release workflow may temporarily enable updater artifacts in CI.

## Auto-Update Signing

- Keep the updater private key and password only in ignored local files and GitHub Actions secrets.
- Required GitHub secrets:
  - `TAURI_SIGNING_PRIVATE_KEY`
  - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`
- Never commit `.env`, `.env.local`, `private.key`, `private.key.pub`, `public.key`, or `*.sig`.
- If the updater public key changes, users must manually install that version once before future auto-updates work.

## Database Migrations

- Never edit a shipped SQL migration file.
- SQL files must use LF line endings.
- Runtime schema setup must be idempotent so existing local databases are repaired without checksum failures.
- New schema changes should add missing tables or columns only after checking the existing database shape.

## Release Checklist

1. Commit all intended app changes.
2. Bump versions.
3. Run `corepack pnpm build`.
4. Run `corepack pnpm tauri build`.
5. Confirm only the NSIS setup EXE is produced locally.
6. Push `master`.
7. Tag `app-vX.Y.Z` and push the tag.
8. Confirm the GitHub release contains the setup EXE, `.sig`, and `latest.json`.
9. Confirm `updates/latest.json` is committed back to `master` and contains a non-empty signature.
