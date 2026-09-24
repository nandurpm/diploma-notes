"""Externalize executable markup in deployment HTML without enabling unsafe-inline.

Source pages remain editable; identical scripts share content-addressed assets.
Do not serialize the whole document: preserve markup outside the changed tags.
"""
import hashlib
import json
import re
from html.parser import HTMLParser


class ScriptExternalizer(HTMLParser):
    def __init__(self, source, target):
        super().__init__(convert_charrefs=False)
        self.source, self.target = source, target
        self.offsets = [0]
        # HTMLParser counts only LF; splitlines() also counts Unicode separators.
        self.offsets.extend(match.end() for match in re.finditer("\n", source))
        self.edits, self.handlers = [], {}
        self.script = None

    def position(self):
        line, column = self.getpos()
        return self.offsets[line - 1] + column

    def asset(self, code):
        name = hashlib.sha256(code.encode()).hexdigest()[:24] + '.js'
        relative = 'assets/js/csp-inline/' + name
        output = self.target / relative
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(code, encoding='utf-8')
        return '/' + relative

    def handle_starttag(self, tag, attrs):
        raw, start = self.get_starttag_text(), self.position()
        values = dict(attrs)
        if tag == 'script' and not values.get('src') and values.get('type', '').lower() in ('', 'module', 'text/javascript', 'application/javascript'):
            self.script = (start, start + len(raw), raw)
        changed = raw
        for name, value in attrs:
            if not re.fullmatch(r'on[a-z]+', name) or value is None:
                continue
            event = name[2:]
            digest = hashlib.sha256((event + value).encode()).hexdigest()[:16]
            self.handlers[(event, digest)] = value
            pattern = r'\s+' + name + r'\s*=\s*(?:"[^"]*"|\x27[^\x27]*\x27|[^\s>]+)'
            changed = re.sub(pattern, ' data-poly-' + event + '="' + digest + '"', changed, flags=re.I)
        if changed != raw:
            self.edits.append((start, start + len(raw), changed))

    def handle_endtag(self, tag):
        if tag != 'script' or self.script is None:
            return
        start, content_start, raw = self.script
        end = self.position()
        code = self.source[content_start:end]
        # Classic inline scripts execute in place even if their tag says defer.
        if not re.search(r'\btype\s*=\s*["\x27]module', raw, re.I):
            raw = re.sub(r'\s+(?:defer|async)(?:\s*=\s*(?:"[^"]*"|\x27[^\x27]*\x27))?', '', raw, flags=re.I)
        tag_text = raw[:-1] + ' src="' + self.asset(code) + '"></script>'
        self.edits.append((start, end + len('</script>'), tag_text))
        self.script = None

    def result(self):
        source = self.source
        if self.handlers:
            registrations = []
            for (event, digest), code in self.handlers.items():
                selector = '[data-poly-' + event + '="' + digest + '"]'
                registrations.append('document.querySelectorAll(' + json.dumps(selector) + ').forEach(function(element) {\n'
                    '  element.addEventListener(' + json.dumps(event) + ', function(event) {\n'
                    '    const result = (function(event) {\n' + code + '\n    }).call(this, event);\n'
                    '    if (result === false) event.preventDefault();\n  });\n});\n')
            tag = '<script src="' + self.asset(''.join(registrations)) + '"></script>\n'
            position = source.lower().rfind('</body>')
            self.edits.append((position if position >= 0 else len(source), position if position >= 0 else len(source), tag))
        for start, end, replacement in sorted(self.edits, reverse=True):
            source = source[:start] + replacement + source[end:]
        return source


def externalize_scripts(source, target):
    parser = ScriptExternalizer(source, target)
    parser.feed(source)
    return parser.result()
