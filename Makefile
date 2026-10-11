.PHONY: bootstrap dev preview build check browser-check clean

bootstrap:
	python3 scripts/bootstrap.py
	npm ci

dev:
	.tools/hugo server --bind 127.0.0.1 --noBuildLock

preview:
	.tools/hugo server --bind 127.0.0.1 --buildDrafts --buildFuture --noBuildLock

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
