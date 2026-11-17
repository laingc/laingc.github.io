#!/usr/bin/env python3
"""Build independent consumer sites and inspect their generated documents."""

import html
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
from urllib.parse import unquote, urljoin, urlparse
import xml.etree.ElementTree as ET

THEME = Path(__file__).resolve().parents[1]
OUTPUT = THEME / '.test-output' / 'builds'
CURRENT = os.environ.get('HUGO_BIN', 'hugo')
MINIMUM = os.environ.get('HUGO_MIN_BIN')


class Document(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.ids = set()
        self.links = []
        self.attributes = []
        self.jsonld = []
        self.in_json = False
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        keys = [key for key, _ in attrs]
        assert len(keys) == len(set(keys)), f'Duplicate attributes: {tag}'
        attrs = dict(attrs)
        self.attributes.append((tag, attrs))
        if 'id' in attrs:
            assert attrs['id'] not in self.ids, f'Duplicate ID: {attrs["id"]}'
            self.ids.add(attrs['id'])
        for key in ('href', 'src', 'poster'):
            if attrs.get(key):
                self.links.append(attrs[key])
        if tag == 'img':
            assert 'alt' in attrs, 'Image has no alt attribute'
        if tag == 'script' and attrs.get('type') == 'application/ld+json':
            self.in_json = True

    def handle_endtag(self, tag):
        if tag == 'script':
            self.in_json = False

    def handle_data(self, data):
        if self.in_json:
            self.jsonld.append(json.loads(data))


def run(command, environment=None):
    result = subprocess.run(command, cwd=THEME, env=environment, capture_output=True, text=True)
    output = result.stdout + result.stderr
    if result.returncode or re.search(r'\b(WARN|ERROR)\b', output):
        raise AssertionError(f'{" ".join(map(str, command))}\n{output}')
    return output


def inspect(destination, base_url):
    base = urlparse(base_url)
    documents = {}
    for filename in destination.rglob('*.html'):
        text = filename.read_text()
        assert '#ZgotmplZ' not in text, filename
        documents[filename] = Document(text)
    for filename, document in documents.items():
        route = filename.relative_to(destination).as_posix()
        route = route[:-10] if route.endswith('index.html') else route
        current_url = urljoin(base_url, route)
        for link in document.links:
            parsed = urlparse(urljoin(current_url, link))
            if parsed.scheme not in ('http', 'https') or parsed.netloc != base.netloc:
                continue
            assert parsed.path.startswith(base.path), f'Base path lost: {filename}: {link}'
            target = destination / unquote(parsed.path[len(base.path):])
            if target.is_dir():
                target /= 'index.html'
            assert target.is_file(), f'Broken link: {filename}: {link}'
            if parsed.fragment and target in documents:
                assert unquote(parsed.fragment) in documents[target].ids, f'Broken anchor: {filename}: {link}'
    for filename in destination.rglob('*.xml'):
        root = ET.parse(filename).getroot()
        if root.tag == 'rss':
            assert root.findtext('./channel/title')
            for item in root.findall('./channel/item'):
                assert item.findtext('link').startswith(base_url)
                assert item.findtext('title')
        if filename.name == 'sitemap.xml':
            assert '/search/' not in filename.read_text(), filename
    for filename in destination.rglob('*.json'):
        json.loads(filename.read_text())
    for filename in destination.rglob('*.css'):
        for value in re.findall(r'url\([\'"]?([^\)\'\"]+)', filename.read_text()):
            parsed = urlparse(urljoin(base_url, value))
            if parsed.netloc == base.netloc:
                assert (destination / parsed.path[len(base.path):]).is_file(), f'Missing CSS asset: {value}'
    return len(documents)


def build(binary, name, source, base_url='https://example.org/', extra=None, environment=None):
    destination = OUTPUT / name
    if destination.exists():
        shutil.rmtree(destination)
    command = [binary, '--source', str(source), '--themesDir', str(THEME.parent), '--destination', str(destination), '--baseURL', base_url, '--printPathWarnings', '--printI18nWarnings']
    run(command + (extra or []), environment)
    count = inspect(destination, base_url)
    print(f'PASS {name}: {count} HTML documents, links, assets, XML, and JSON', flush=True)
    return destination


def write(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text)


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    example = THEME / 'exampleSite'
    current = build(CURRENT, 'current', example)
    build(CURRENT, 'subdirectory', example, 'https://example.org/demo/', ['--minify'])
    assert 'lang="en-NZ"' in (current / 'index.html').read_text()
    assert 'dir="rtl"' in (current / 'ar/index.html').read_text()
    assert len(json.loads((current / 'search.json').read_text())) == 9
    if MINIMUM:
        minimum = build(MINIMUM, 'minimum', example, extra=['--config', 'hugo.toml,hugo.legacy.toml'])
        assert 'lang="en-NZ"' in (minimum / 'index.html').read_text()
        assert 'dir="rtl"' in (minimum / 'ar/index.html').read_text()

    with tempfile.TemporaryDirectory(prefix='ash-consumer-', dir=OUTPUT) as temp:
        root = Path(temp)
        empty = root / 'empty'
        write(empty / 'hugo.toml', "title = 'Empty site'\ntheme = 'ash'\nenableRobotsTXT = true\n")
        build(CURRENT, 'empty', empty)
        write(empty / 'content/about.md', "+++\ntitle = 'A plain page'\n+++\n\nOrdinary Markdown without dates or author configuration.\n")
        plain = build(CURRENT, 'plain', empty)
        assert '0001' not in (plain / 'about/index.html').read_text()

        fixture = root / 'fixtures'
        shutil.copytree(example, fixture, ignore=shutil.ignore_patterns('resources', 'public', '.hugo_build.lock'))
        write(fixture / 'hugo.toml', (fixture / 'hugo.toml').read_text().replace("themesDir = '../..'", f"themesDir = '{THEME.parent}'"))
        fixtures = {
            'draft': "date = 2020-01-01T12:00:00Z\ndraft = true",
            'future': 'date = 2099-01-01T12:00:00Z',
            'expired': 'date = 2020-01-01T12:00:00Z\nexpiryDate = 2021-01-01T12:00:00Z',
            'unlisted': 'date = 2020-01-01T12:00:00Z\nhidden = true\nnoindex = true',
        }
        for name, settings in fixtures.items():
            write(fixture / f'content/blog/{name}.md', f"+++\ntitle = 'Fixture {name}'\n{settings}\n+++\n\nfixture-{name}-sentinel\n")
        write(fixture / 'content/blog/escaping.md', "+++\ntitle = '</script><script>alert(1)</script>'\ndate = 2020-01-01T12:00:00Z\n+++\n\nAn escaped title.\n")
        production = build(CURRENT, 'publication-rules', fixture)
        for name in ('draft', 'future', 'expired'):
            assert not (production / f'blog/{name}/index.html').exists()
        search = (production / 'search.json').read_text()
        feed = (production / 'index.xml').read_text()
        for name in fixtures:
            assert f'fixture-{name}-sentinel' not in search
            assert f'fixture-{name}-sentinel' not in feed
        assert 'noindex, follow' in (production / 'blog/unlisted/index.html').read_text()
        preview = build(CURRENT, 'preview-flags', fixture, extra=['--buildDrafts', '--buildFuture', '--buildExpired'])
        for name in ('draft', 'future', 'expired'):
            assert (preview / f'blog/{name}/index.html').exists()

        config = (fixture / 'hugo.toml').read_text()
        config = config.replace("homePosts = 3", "homePosts = 3\nhomeMode = 'journal'\nrssFullContent = true")
        write(fixture / 'hugo.toml', config)
        journal = build(CURRENT, 'journal-full-feed', fixture)
        assert (journal / 'page/2/index.html').exists()
        assert 'Keep a record' in html.unescape((journal / 'index.xml').read_text())

        module = root / 'module'
        shutil.copytree(example, module, ignore=shutil.ignore_patterns('resources', 'public', '.hugo_build.lock'))
        config = (module / 'hugo.toml').read_text()
        config = re.sub(r"^(theme|themesDir) = .*\n", '', config, flags=re.M)
        config += "\n[[module.imports]]\npath = 'example.org/ash'\n"
        write(module / 'hugo.toml', config)
        write(module / 'go.mod', 'module example.org/ash-consumer\n\ngo 1.23.0\n')
        environment = {**os.environ, 'HUGO_MODULE_REPLACEMENTS': f'example.org/ash -> {THEME}'}
        build(CURRENT, 'hugo-module', module, environment=environment)
    print('All build checks passed.', flush=True)


if __name__ == '__main__':
    main()
