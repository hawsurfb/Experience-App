"""Build the HSS Ops app from src/ + the Surf Report Live mockup's design system.

Usage: python3 build.py <surf-report-live-mockup.html> [seed.json]
Outputs: app.html (artifact body) and index.html (standalone page).
"""
import json, re, sys, pathlib

here = pathlib.Path(__file__).parent
mock = pathlib.Path(sys.argv[1]).read_text(encoding="utf-8")
seed_path = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else here / "data" / "2026-10-06-morning.json"

# Design system: the mockup's full stylesheet, unchanged.
css = re.search(r"(/\* ---------- palettes ---------- \*/.*?)</style>", mock, re.S).group(1)
fonts = re.search(r'<link href="(https://fonts\.googleapis\.com/[^"]+)"', mock).group(1)
mapimg = re.search(r"const MAPIMG='(data:image/jpeg;base64,[^']+)'", mock).group(1)
sos = re.search(r'(<section class="sos-zone">\s*<h2 class="sec-title">Emergency contacts</h2>.*?</section>)', mock, re.S).group(1)
gear = re.search(r'(<svg width="20" height="20" viewBox="0 0 24 24"[^>]*>.*?</svg>)', mock, re.S).group(1)

seed = json.loads(seed_path.read_text(encoding="utf-8"))
assert seed.get("schema") == "hss-ops/1", "seed must be hss-ops/1"
seed_js = json.dumps(seed, ensure_ascii=False).replace("</", "<\\/")

body = (here / "src" / "body.html").read_text(encoding="utf-8").replace("__SOS__", sos).replace("__GEAR__", gear)
extra = (here / "src" / "extra.css").read_text(encoding="utf-8")
js = (here / "src" / "app.js").read_text(encoding="utf-8").replace("__SEED__", seed_js).replace("__MAPIMG__", mapimg)

head = f'<title>Soul Surfer Ops</title>\n<link rel="stylesheet" href="{fonts}">\n<style>\n{css}\n{extra}\n</style>\n'
page = f"{head}{body}\n<script>\n{js}\n</script>\n"

(here / "app.html").write_text(page, encoding="utf-8")
(here / "index.html").write_text(
    '<!doctype html>\n<html lang="en" data-size="m" data-palette="violet">\n<head>\n<meta charset="utf-8">\n'
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
    f"{head}</head>\n<body>\n{body}\n<script>\n{js}\n</script>\n</body>\n</html>\n",
    encoding="utf-8",
)
print("built", len(page), "bytes")
