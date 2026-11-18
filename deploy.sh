#!/usr/bin/env bash
# Build and check the site locally, then publish it. GitHub Pages serves the gh-pages branch,
# so the push is the deployment. That branch holds a single commit of built files, replaced on
# every deployment, so generated output never accumulates in Git history.
set -euo pipefail
cd "$(dirname "$0")"

if [ "$#" -ne 0 ]; then
  echo "Usage: ./deploy.sh (build, check, and publish the site to https://laing.nz/)" >&2
  exit 2
fi

remote=origin
branch=gh-pages
site=https://laing.nz/

source="$(git rev-parse --short HEAD)"
if [ -n "$(git status --porcelain)" ]; then
  source="$source with uncommitted changes"
  echo "Note: uncommitted changes will go live. Commit and push master to keep the source in step." >&2
fi

# A fresh production build, the source and output checks, the secret scan, and browser checks.
make browser-check

publish="$(mktemp -d)"
trap 'rm -rf "$publish"' EXIT
cp -R public/. "$publish/"
# Serve the files as built, without Jekyll processing.
touch "$publish/.nojekyll"
git -C "$publish" init -q -b "$branch"
git -C "$publish" add -A
git -C "$publish" -c user.name="$(git config user.name)" -c user.email="$(git config user.email)" \
  commit -q -m "Publish $source"
git -C "$publish" push -q --force "$(git remote get-url "$remote")" "$branch:$branch"
published="$(git -C "$publish" rev-parse HEAD)"
echo "Pushed the build of $source to $branch."

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub Pages publishes the branch within a minute or two: $site"
  exit 0
fi

repo="$(gh repo view --json nameWithOwner --jq .nameWithOwner)"
# A push normally starts a Pages build; requesting one as well makes sure it does.
gh api -X POST "repos/$repo/pages/builds" >/dev/null 2>&1 || true
echo "Waiting for GitHub Pages to publish it..."
for _ in $(seq 1 60); do
  latest="$(gh api "repos/$repo/pages/builds/latest" --jq '"\(.status) \(.commit)"' 2>/dev/null || echo "unknown none")"
  if [ "${latest#* }" = "$published" ]; then
    case "${latest%% *}" in
      built) echo "Live at $site"; exit 0 ;;
      errored) echo "GitHub Pages reported an error: https://github.com/$repo/actions" >&2; exit 1 ;;
    esac
  fi
  sleep 5
done
echo "GitHub Pages has not finished after five minutes: https://github.com/$repo/actions" >&2
exit 1
