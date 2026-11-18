.PHONY: bootstrap dev preview new build check browser-check clean

bootstrap:
	python3 scripts/bootstrap.py
	npm ci

dev:
	.tools/hugo server --bind 127.0.0.1 --noBuildLock

preview:
	.tools/hugo server --bind 127.0.0.1 --buildDrafts --buildFuture --noBuildLock

new:
	@test -n "$(SLUG)" || { echo 'Usage: make new SLUG=my-post' >&2; exit 1; }
	TZ=Pacific/Auckland .tools/hugo new content blog/$(SLUG).md

build:
	node scripts/clean.mjs
	.tools/hugo --environment production --minify --panicOnWarning --noBuildLock

check: build
	npm run check
	.tools/gitleaks dir . --config .gitleaks.toml --redact --no-banner

browser-check: check
	npm run test:browser

clean:
	node scripts/clean.mjs
