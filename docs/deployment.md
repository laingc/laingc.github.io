# Deployment

## Repository configuration

The source repository is `laingc/laingc.github.io`. Its default branch is `main`.
GitHub Pages uses GitHub Actions, not a branch of generated files.
The custom domain is `chrislaing.net`. `static/CNAME` preserves this domain in each artefact.

The workflow has read-only permissions during the build. Only the deployment job receives Pages and OpenID Connect permissions.
Deployment uses GitHub's temporary workflow token. No personal access token or SSH key is required.

## Publish a change

1. Run `make bootstrap`.
2. Run `make browser-check`.
3. Review the source diff for private material and unrelated files.
4. Commit the approved change.
5. Push the commit to `main`.
6. Verify the **Check and deploy** workflow in GitHub Actions.
7. Verify the changed pages at <https://chrislaing.net/>.

If a check fails, the workflow does not deploy the artefact.
The workflow also supports a manual run from GitHub Actions.

## Roll back

Revert the affected source commit. Run the checks before you push the revert.
Do not restore generated output, backup files, or the retired publication history.

## Maintenance

Dependabot proposes monthly npm and GitHub Actions updates. Every update runs the same validation before deployment.
The external-link workflow runs weekly and on request. External service errors do not block source changes or deployments.
Review the Hugo, Gitleaks, and Node.js version pins monthly. Update the version files through a checked source change.

Git history replacement was a one-off migration. It is not a deployment operation.
History replacement does not remove copies from external caches or other people's clones.
