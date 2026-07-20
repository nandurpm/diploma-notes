#!/usr/bin/env python3
"""Refine and validate the POLY PMNA About page without removing its bilingual guide."""
from __future__ import annotations

import argparse
import re
from pathlib import Path

ABOUT = Path("about.html")
CSS = Path("assets/css/about-experience.css")
DEPLOY = Path(".github/workflows/deploy-static-site.yml")
LIVE_VERIFY = Path("tools/verify_live_about.py")

OLD_TITLE = "About POLY PMNA | Bilingual Kerala Polytechnic Study Portal"
NEW_TITLE = "About | POLY PMNA"
STYLE_MARKER = "/* About page cross-site alignment refinements */"


def replace_all(text: str, old: str, new: str) -> str:
    return text.replace(old, new)


def refine_about(html: str) -> str:
    html = replace_all(html, OLD_TITLE, NEW_TITLE)
    html = replace_all(html, "20260720-about2", "20260720-about3")

    if "class=\"site-breadcrumbs about-breadcrumbs\"" not in html:
        marker = '  <main id="main-content" class="about-experience">\n'
        breadcrumb = (
            marker
            + '    <nav class="site-breadcrumbs about-breadcrumbs" aria-label="Breadcrumb">'
              '<ol><li><a href="/">Home</a></li><li><span aria-current="page" '
              'data-en="About POLY PMNA" data-ml="POLY PMNAയെ കുറിച്ച്">About POLY PMNA</span></li></ol></nav>\n'
        )
        if marker not in html:
            raise RuntimeError("About main-content marker was not found")
        html = html.replace(marker, breadcrumb, 1)

    if 'id="about-values-heading"' not in html:
        marker = '    <section class="about-section" aria-labelledby="start-heading">\n'
        section = '''    <section class="about-section about-values-section" aria-labelledby="about-values-heading">
      <div class="about-container">
        <div class="about-heading" data-about-reveal>
          <h2 id="about-values-heading" data-en="More than a directory: a portal designed to keep improving." data-ml="Directory മാത്രമല്ല: തുടർച്ചയായി മെച്ചപ്പെടുന്ന പഠന portal.">More than a directory: a portal designed to keep improving.</h2>
          <p data-en="The Home page focuses on quick access. This About page explains how the platform is built, how corrections are handled and what improvements are planned." data-ml="Home page quick accessനാണ് മുൻഗണന നൽകുന്നത്. Platform എങ്ങനെ നിർമ്മിച്ചിരിക്കുന്നു, corrections എങ്ങനെ കൈകാര്യം ചെയ്യുന്നു, മുന്നോട്ടുള്ള improvements എന്തൊക്കെയാണ് എന്നിവ ഈ About page വിശദീകരിക്കുന്നു.">The Home page focuses on quick access. This About page explains how the platform is built, how corrections are handled and what improvements are planned.</p>
        </div>
        <div class="about-values-grid">
          <article class="about-value-card" data-about-reveal>
            <span class="about-value-icon" aria-hidden="true">◇</span>
            <h3 data-en="Student-first structure" data-ml="Student-first structure">Student-first structure</h3>
            <p data-en="Resources are organised by revision, programme, semester and subject code so students can verify context before opening a lesson or paper." data-ml="Lesson അല്ലെങ്കിൽ paper തുറക്കുന്നതിന് മുമ്പ് context ഉറപ്പാക്കാൻ revision, programme, semester, subject code എന്നിവ അനുസരിച്ച് resources ക്രമീകരിച്ചിരിക്കുന്നു.">Resources are organised by revision, programme, semester and subject code so students can verify context before opening a lesson or paper.</p>
          </article>
          <article class="about-value-card" data-about-reveal>
            <span class="about-value-icon" aria-hidden="true">{ }</span>
            <h3 data-en="Transparent technology" data-ml="Transparent technology">Transparent technology</h3>
            <p data-en="The public experience is static-first HTML, CSS and JavaScript. Optional online services support accounts, saved results, public Help discussions and AI guidance." data-ml="Public experience static-first HTML, CSS, JavaScript അടിസ്ഥാനത്തിലാണ്. Accounts, saved results, Help discussions, AI guidance എന്നിവയ്ക്ക് ആവശ്യമായിടത്ത് online services ഉപയോഗിക്കുന്നു.">The public experience is static-first HTML, CSS and JavaScript. Optional online services support accounts, saved results, public Help discussions and AI guidance.</p>
          </article>
          <article class="about-value-card" data-about-reveal>
            <span class="about-value-icon" aria-hidden="true">↻</span>
            <h3 data-en="Corrections are part of the roadmap" data-ml="Corrections roadmapന്റെ ഭാഗമാണ്">Corrections are part of the roadmap</h3>
            <p data-en="Broken links, incorrect codes and missing resources can be reported through Help. Verified corrections are prioritised over adding unconfirmed content." data-ml="Broken links, തെറ്റായ codes, missing resources എന്നിവ Help വഴി report ചെയ്യാം. സ്ഥിരീകരിക്കാത്ത content ചേർക്കുന്നതിനെക്കാൾ verified correctionsന് മുൻഗണന നൽകുന്നു.">Broken links, incorrect codes and missing resources can be reported through Help. Verified corrections are prioritised over adding unconfirmed content.</p>
          </article>
        </div>
      </div>
    </section>

'''
        if marker not in html:
            raise RuntimeError("Final CTA marker was not found")
        html = html.replace(marker, section + marker, 1)

    if 'class="about-initiative"' not in html:
        marker = '  </main>\n\n  <footer class="footer"'
        initiative = '''    <section class="about-initiative" aria-label="SFI Perinthalmanna Poly Unit initiative">
      <div class="about-container about-initiative-inner" data-about-reveal>
        <p data-en="An initiative by SFI Perinthalmanna Poly Unit" data-ml="SFI Perinthalmanna Poly Unitന്റെ സംരംഭം">An initiative by <strong>SFI Perinthalmanna Poly Unit</strong></p>
        <a href="https://www.instagram.com/sfi_gptcpmna/" target="_blank" rel="noopener noreferrer" data-en="Follow on Instagram" data-ml="Instagramൽ പിന്തുടരുക">Follow on Instagram</a>
      </div>
    </section>
  </main>

  <footer class="footer"'''
        if marker not in html:
            raise RuntimeError("About footer marker was not found")
        html = html.replace(marker, initiative, 1)

    return html


def refine_css(css: str) -> str:
    if STYLE_MARKER in css:
        return css
    return css.rstrip() + "\n\n" + STYLE_MARKER + r'''
.about-experience .about-breadcrumbs{
  position:relative;z-index:18;width:min(1220px,calc(100% - 32px));margin:0 auto;padding:18px 0 0;
}
.about-experience .about-breadcrumbs ol{display:flex;align-items:center;gap:9px;margin:0;padding:0;list-style:none}
.about-experience .about-breadcrumbs li{display:flex;align-items:center;gap:9px;color:var(--about-muted);font-size:.88rem;font-weight:800}
.about-experience .about-breadcrumbs li+li::before{content:"/";color:rgba(185,199,223,.55)}
.about-experience .about-breadcrumbs a{color:#bfeaff;text-decoration:none}
.about-experience .about-breadcrumbs a:hover,.about-experience .about-breadcrumbs a:focus-visible{color:#fff;text-decoration:underline;text-underline-offset:4px}
.about-values-section{background:radial-gradient(circle at 50% 0,rgba(85,184,255,.07),transparent 42rem)}
.about-values-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.about-value-card{position:relative;min-height:285px;padding:30px;border:1px solid var(--about-line);border-radius:26px;background:linear-gradient(145deg,rgba(18,36,65,.92),rgba(8,19,37,.94));box-shadow:0 20px 48px rgba(0,0,0,.2);overflow:hidden}
.about-value-card::after{content:"";position:absolute;right:-55px;bottom:-65px;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,rgba(85,184,255,.14),transparent 68%)}
.about-value-icon{display:grid;place-items:center;width:52px;height:52px;border-radius:17px;color:#06101f;background:linear-gradient(135deg,var(--about-cyan),#d9ffef);font-weight:950}
.about-value-card:nth-child(2) .about-value-icon{background:linear-gradient(135deg,var(--about-violet),#e9ddff)}
.about-value-card:nth-child(3) .about-value-icon{background:linear-gradient(135deg,var(--about-orange),#fff0dc)}
.about-value-card h3{position:relative;z-index:1;margin:24px 0 10px;color:var(--about-text);font-size:1.32rem}
.about-value-card p{position:relative;z-index:1;margin:0;color:var(--about-muted);line-height:1.72}
.about-initiative{padding:0 0 clamp(58px,8vw,96px)}
.about-initiative-inner{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:24px 28px;border:1px solid rgba(255,255,255,.18);border-radius:24px;background:linear-gradient(110deg,rgba(189,22,47,.9),rgba(105,12,33,.92));box-shadow:0 22px 55px rgba(50,0,15,.28)}
.about-initiative p{margin:0;color:#fff;font-size:clamp(1rem,2vw,1.18rem);letter-spacing:.035em;text-transform:uppercase}
.about-initiative a{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:10px 17px;border:1px solid rgba(255,255,255,.58);border-radius:13px;color:#fff;text-decoration:none;font-weight:900;white-space:nowrap}
.about-initiative a:hover,.about-initiative a:focus-visible{color:#7d102a;background:#fff;outline:none}
@media(max-width:820px){.about-values-grid{grid-template-columns:1fr}.about-value-card{min-height:0}.about-initiative-inner{align-items:flex-start;flex-direction:column}}
@media(max-width:760px){.about-experience .about-breadcrumbs{width:min(100% - 20px,1220px);padding-top:14px}}
''' + "\n"


def refine_support_files() -> None:
    if DEPLOY.exists():
        text = DEPLOY.read_text(encoding="utf-8")
        text = text.replace("grep -q 'Bilingual Kerala Polytechnic Study Portal' _site/about.html", "grep -q '<title>About | POLY PMNA</title>' _site/about.html")
        text = text.replace("'Bilingual Kerala Polytechnic Study Portal', 'data-about-guide'", "'<title>About | POLY PMNA</title>', 'data-about-guide'")
        DEPLOY.write_text(text, encoding="utf-8")
    if LIVE_VERIFY.exists():
        text = LIVE_VERIFY.read_text(encoding="utf-8")
        text = text.replace('"Bilingual Kerala Polytechnic Study Portal",', '"<title>About | POLY PMNA</title>",')
        LIVE_VERIFY.write_text(text, encoding="utf-8")


def validate() -> list[str]:
    errors: list[str] = []
    html = ABOUT.read_text(encoding="utf-8")
    css = CSS.read_text(encoding="utf-8")
    checks = {
        "normalized title": f"<title>{NEW_TITLE}</title>" in html,
        "one H1": len(re.findall(r"<h1(?:\s|>)", html, flags=re.I)) == 1,
        "shared header": 'data-site-header' in html,
        "breadcrumb": 'class="site-breadcrumbs about-breadcrumbs"' in html,
        "persistent language control": 'data-about-lang="ml"' in html,
        "autoplay guide retained": 'data-about-guide' in html and 'data-guide-toggle' in html,
        "unique About values": 'id="about-values-heading"' in html,
        "initiative attribution": 'class="about-initiative"' in html,
        "shared footer": 'data-site-footer' in html,
        "alignment CSS": STYLE_MARKER in css,
    }
    errors.extend(name for name, passed in checks.items() if not passed)
    if OLD_TITLE in html:
        errors.append("old title remains in about.html")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()

    if not args.check:
        ABOUT.write_text(refine_about(ABOUT.read_text(encoding="utf-8")), encoding="utf-8")
        CSS.write_text(refine_css(CSS.read_text(encoding="utf-8")), encoding="utf-8")
        refine_support_files()

    errors = validate()
    if errors:
        print("About refinement validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1
    print("About page refinement validated.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
