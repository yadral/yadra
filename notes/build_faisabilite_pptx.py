#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Générateur de présentation d'étude de faisabilité Fintech Cameroun.

Prend en charge deux univers visuels distincts :
1. Style GitHub Copilot (Dark Mode, néons Purple & Cyan, Segoe UI)
2. Style Anthropic (Warm Editorial, fond Lin/Parchemin, Terracotta & Sauge, Georgia)
"""

from dataclasses import dataclass
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_CONNECTOR, MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Inches, Pt


@dataclass
class Theme:
    name: str
    bg_canvas: RGBColor
    bg_card: RGBColor
    bg_card_alt: RGBColor
    bg_card_hover: RGBColor
    border_subtle: RGBColor
    border_accent: RGBColor
    text_primary: RGBColor
    text_muted: RGBColor
    text_subtle: RGBColor
    accent_primary: RGBColor      # Purple (Copilot) ou Terracotta (Anthropic)
    accent_secondary: RGBColor    # Cyan (Copilot) ou Sauge (Anthropic)
    accent_success: RGBColor      # Vert succès
    accent_warning: RGBColor      # Ambre / Or
    accent_danger: RGBColor       # Rouge alerte
    lane_a: RGBColor
    lane_b: RGBColor
    font_title: str
    font_body: str
    font_mono: str
    brand_tag: str
    footer_text: str


COPILOT_THEME = Theme(
    name="copilot",
    bg_canvas=RGBColor(0x0D, 0x11, 0x17),      # #0D1117 Fond GitHub Dark
    bg_card=RGBColor(0x16, 0x1B, 0x22),        # #161B22 Surface standard
    bg_card_alt=RGBColor(0x1C, 0x21, 0x28),    # #1C2128 Surface surélevée
    bg_card_hover=RGBColor(0x21, 0x26, 0x2D),  # #21262D Entêtes
    border_subtle=RGBColor(0x30, 0x36, 0x3D),  # #30363D Bordure subtile
    border_accent=RGBColor(0x48, 0x4F, 0x58),  # #484F58 Bordure active
    text_primary=RGBColor(0xF0, 0xF6, 0xFC),   # #F0F6FC Texte principal
    text_muted=RGBColor(0x8B, 0x94, 0x9E),     # #8B949E Texte secondaire
    text_subtle=RGBColor(0x6E, 0x76, 0x81),    # #6E7681 Métadonnées
    accent_primary=RGBColor(0x89, 0x57, 0xE5), # #8957E5 Copilot Purple
    accent_secondary=RGBColor(0x58, 0xA6, 0xFF),# #58A6FF Cyan / Bleu électrique
    accent_success=RGBColor(0x3F, 0xB9, 0x50), # #3FB950 GitHub Green
    accent_warning=RGBColor(0xD2, 0x99, 0x22), # #D29922 Ambre
    accent_danger=RGBColor(0xF8, 0x51, 0x49),  # #F85149 Rouge GitHub
    lane_a=RGBColor(0x13, 0x18, 0x20),
    lane_b=RGBColor(0x0E, 0x13, 0x1A),
    font_title="Segoe UI",
    font_body="Segoe UI",
    font_mono="Consolas",
    brand_tag="⚡ GITHUB COPILOT ARCHITECTURE",
    footer_text="GitHub Copilot · Architecture & Viabilité Fintech Cameroun · Modèle Intégrateur Direct",
)

ANTHROPIC_THEME = Theme(
    name="anthropic",
    bg_canvas=RGBColor(0xFA, 0xF8, 0xF5),      # #FAF8F5 Parchemin / Lin chaud
    bg_card=RGBColor(0xFF, 0xFF, 0xFF),        # #FFFFFF Cartes blanches douces
    bg_card_alt=RGBColor(0xF3, 0xEE, 0xE7),    # #F3EEE7 Conteneurs secondaires
    bg_card_hover=RGBColor(0xEB, 0xE4, 0xD9),  # #EBE4D9 Entêtes & badges
    border_subtle=RGBColor(0xE4, 0xDC, 0xD0),  # #E4DCD0 Bordure papier délicate
    border_accent=RGBColor(0xCF, 0xC3, 0xB2),  # #CFC3B2 Bordure marquée
    text_primary=RGBColor(0x1F, 0x1B, 0x18),   # #1F1B18 Expresso profond chaud
    text_muted=RGBColor(0x6A, 0x62, 0x58),     # #6A6258 Gris pierre chaud
    text_subtle=RGBColor(0x99, 0x8F, 0x82),    # #998F82 Taupe subtil
    accent_primary=RGBColor(0xD4, 0x62, 0x41), # #D46241 Claude Terracotta / Argile
    accent_secondary=RGBColor(0x3B, 0x5E, 0x4F),# #3B5E4F Vert Sauge profond
    accent_success=RGBColor(0x28, 0x68, 0x4E), # #28684E Vert forêt
    accent_warning=RGBColor(0xC8, 0x7E, 0x2A), # #C87E2A Ocre chaud / Ambre
    accent_danger=RGBColor(0xB2, 0x38, 0x38),  # #B23838 Rouge brique
    lane_a=RGBColor(0xFF, 0xFF, 0xFF),
    lane_b=RGBColor(0xF5, 0xF0, 0xE8),
    font_title="Georgia",
    font_body="Segoe UI",
    font_mono="Consolas",
    brand_tag="✦ ANTHROPIC RESEARCH & STRATEGY",
    footer_text="Anthropic Research & Strategy · Note de Faisabilité Fintech Cameroun · Modèle Intégrateur",
)

W = Inches(13.333)
H = Inches(7.5)
M = Inches(0.85)


def set_run(run, size=18, bold=False, color=None, font="Segoe UI"):
    run.font.size = Pt(size)
    run.font.bold = bold
    if color:
        run.font.color.rgb = color
    run.font.name = font
    rPr = run._r.get_or_add_rPr()
    rPr.get_or_add_latin().set("typeface", font)


def rect(slide, l, t, w, h, fill, border=None, border_w=1.0, rounded=False):
    kind = MSO_SHAPE.ROUNDED_RECTANGLE if rounded else MSO_SHAPE.RECTANGLE
    s = slide.shapes.add_shape(kind, l, t, w, h)
    if rounded:
        try:
            s.adjustments[0] = 0.06
        except Exception:
            pass
    s.fill.solid()
    s.fill.fore_color.rgb = fill
    if border is None:
        s.line.fill.background()
    else:
        s.line.color.rgb = border
        s.line.width = Pt(border_w)
    return s


def oval(slide, l, t, w, h, fill, border=None, border_w=2.0):
    s = slide.shapes.add_shape(MSO_SHAPE.OVAL, l, t, w, h)
    s.fill.solid()
    s.fill.fore_color.rgb = fill
    if border is None:
        s.line.fill.background()
    else:
        s.line.color.rgb = border
        s.line.width = Pt(border_w)
    return s


def diamond(slide, l, t, w, h, fill, border=None, border_w=1.5):
    s = slide.shapes.add_shape(MSO_SHAPE.DIAMOND, l, t, w, h)
    s.fill.solid()
    s.fill.fore_color.rgb = fill
    if border is None:
        s.line.fill.background()
    else:
        s.line.color.rgb = border
        s.line.width = Pt(border_w)
    return s


def seg(slide, x1, y1, x2, y2, color, width=1.6, dashed=False):
    c = slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, x1, y1, x2, y2)
    c.line.color.rgb = color
    c.line.width = Pt(width)
    if dashed:
        from pptx.enum.dml import MSO_LINE
        c.line.dash_style = MSO_LINE.DASH
    return c


def arrow_head(slide, direction, x, y, color, size=Inches(0.16)):
    kinds = {
        "r": MSO_SHAPE.ISOSCELES_TRIANGLE,
        "l": MSO_SHAPE.ISOSCELES_TRIANGLE,
        "d": MSO_SHAPE.ISOSCELES_TRIANGLE,
        "u": MSO_SHAPE.ISOSCELES_TRIANGLE,
    }
    rot = {"u": 0, "r": 90, "d": 180, "l": 270}[direction]
    s = slide.shapes.add_shape(kinds[direction], x - size / 2, y - size / 2, size, size)
    s.rotation = rot
    s.fill.solid()
    s.fill.fore_color.rgb = color
    s.line.fill.background()
    return s


def arrow_line(slide, x1, y1, x2, y2, color, width=1.8, dashed=False):
    seg(slide, x1, y1, x2, y2, color=color, width=width, dashed=dashed)
    dx = x2 - x1
    dy = y2 - y1
    if abs(dx) >= abs(dy):
        arrow_head(slide, "r" if dx > 0 else "l", x2, y2, color=color)
    else:
        arrow_head(slide, "d" if dy > 0 else "u", x2, y2, color=color)


def text(slide, l, t, w, h, s, size=18, bold=False, color=None,
         align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP, font="Segoe UI"):
    tb = slide.shapes.add_textbox(l, t, w, h)
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.04)
    tf.margin_right = Inches(0.04)
    tf.margin_top = Inches(0.02)
    tf.margin_bottom = Inches(0.02)
    try:
        tf._txBody.bodyPr.set(
            "anchor",
            {MSO_ANCHOR.TOP: "t", MSO_ANCHOR.MIDDLE: "ctr", MSO_ANCHOR.BOTTOM: "b"}[anchor],
        )
    except Exception:
        pass
    lines = s.split("\n")
    for idx, line in enumerate(lines):
        p = tf.paragraphs[0] if idx == 0 else tf.add_paragraph()
        p.alignment = align
        p.space_after = Pt(2)
        run = p.add_run()
        run.text = line
        set_run(run, size=size if idx == 0 else max(size - 2, 10),
                bold=bold if idx == 0 else False,
                color=color, font=font)
    return tb


def badge(slide, l, t, w, h, s, bg, border, text_col, size=10, font="Segoe UI"):
    rect(slide, l, t, w, h, bg, border=border, border_w=0.8, rounded=True)
    text(slide, l, t, w, h, s, size=size, bold=True, color=text_col, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE, font=font)


def chrome(theme: Theme, slide, step, title, n, total):
    # Toile de fond
    rect(slide, 0, 0, W, H, theme.bg_canvas)

    # Barre bicolore de signature
    accent_w = Inches(2.2)
    rect(slide, M, Inches(0.48), accent_w, Inches(0.04), theme.accent_primary)
    rect(slide, M + accent_w, Inches(0.48), Inches(1.5), Inches(0.04), theme.accent_secondary)

    # Badge d'étape
    icon = "●" if theme.name == "copilot" else "§"
    badge(slide, M, Inches(0.62), Inches(2.35), Inches(0.28),
          f"{icon} {step.upper()}", bg=theme.bg_card_alt, border=theme.border_subtle,
          text_col=theme.accent_primary, size=10, font=theme.font_mono)

    # Titre principal
    text(slide, M, Inches(0.98), Inches(11.6), Inches(0.65),
         title, size=26, bold=True, color=theme.text_primary, font=theme.font_title)

    # Ligne basse
    rect(slide, M, Inches(6.92), W - 2 * M, Inches(0.01), theme.border_subtle)

    # Footer
    text(slide, M, Inches(7.02), Inches(8.5), Inches(0.28),
         theme.footer_text, size=10, color=theme.text_subtle, font=theme.font_body)
    text(slide, W - M - Inches(1.5), Inches(7.02), Inches(1.5), Inches(0.28),
         f"{n:02d} / {total:02d}", size=10, color=theme.text_muted, align=PP_ALIGN.RIGHT, font=theme.font_mono)


def cover_slide(theme: Theme, slide, n, total):
    rect(slide, 0, 0, W, H, theme.bg_canvas)

    # Badge de marque
    badge(slide, M, Inches(1.35), Inches(3.8), Inches(0.35),
          theme.brand_tag, bg=theme.bg_card, border=theme.accent_primary,
          text_col=theme.accent_primary, size=11, font=theme.font_mono)

    # Titre principal
    text(slide, M, Inches(1.95), Inches(11.2), Inches(1.8),
         "Pénétrer le marché.\nEt comment.",
         size=46, bold=True, color=theme.text_primary, font=theme.font_title)

    # Ligne d'accentuation
    rect(slide, M, Inches(3.95), Inches(1.8), Inches(0.05), theme.accent_primary)
    rect(slide, M + Inches(1.8), Inches(3.95), Inches(1.8), Inches(0.05), theme.accent_secondary)

    # Sous-titre
    sub_color = theme.accent_secondary if theme.name == "copilot" else theme.text_muted
    text(slide, M, Inches(4.18), Inches(10.5), Inches(0.9),
         "Trois lois fondamentales : simplicité, sécurité, acceptabilité.\n"
         "Un moteur invariant — du rail monétaire aux cas d’usage terrain.",
         size=18, color=sub_color, font=theme.font_body)

    # 4 Cartes de fonctionnalités clés
    features = [
        ("01 · OM & MoMo", "Connexion API directe"),
        ("02 · Maviance S3P", "Passerelle bancaire & RIB"),
        ("03 · WhatsApp Bot", "Canal naturel sans app"),
        ("04 · Réconciliation", "Ingestion & solde consolidé"),
    ]
    gap = Inches(0.25)
    pw = (W - 2 * M - 3 * gap) / 4
    for i, (tag, desc) in enumerate(features):
        x = M + i * (pw + gap)
        rect(slide, x, Inches(5.45), pw, Inches(1.05), theme.bg_card, border=theme.border_subtle, border_w=1.0, rounded=True)
        acc = theme.accent_primary if i % 2 == 0 else theme.accent_secondary
        rect(slide, x, Inches(5.45), pw, Inches(0.04), acc)
        text(slide, x + Inches(0.16), Inches(5.58), pw - Inches(0.32), Inches(0.35),
             tag, size=12, bold=True, color=acc, font=theme.font_mono)
        text(slide, x + Inches(0.16), Inches(5.95), pw - Inches(0.32), Inches(0.45),
             desc, size=11, color=theme.text_muted, font=theme.font_body)

    # Footer
    rect(slide, M, Inches(6.92), W - 2 * M, Inches(0.01), theme.border_subtle)
    text(slide, M, Inches(7.02), Inches(8.5), Inches(0.28),
         "Étude de faisabilité · Cameroun · Intégration directe & Réconciliation unifiée",
         size=10, color=theme.text_subtle, font=theme.font_body)
    text(slide, W - M - Inches(1.5), Inches(7.02), Inches(1.5), Inches(0.28),
         f"{n:02d} / {total:02d}", size=10, color=theme.text_muted, align=PP_ALIGN.RIGHT, font=theme.font_mono)


def statement_slide(theme: Theme, step, title, big, pillars, note=None):
    def _fn(slide, n, total):
        chrome(theme, slide, step, title, n, total)
        text(slide, M, Inches(1.80), W - 2 * M, Inches(1.05),
             big, size=20, bold=True, color=theme.text_primary, font=theme.font_title)

        gap = Inches(0.35)
        cw = (W - 2 * M - 2 * gap) / 3
        y = Inches(3.05)
        ch = Inches(2.95 if note else 3.45)
        accents = [theme.accent_primary, theme.accent_secondary, theme.accent_success]

        for i, (h, body) in enumerate(pillars):
            x = M + i * (cw + gap)
            acc = accents[i % len(accents)]
            rect(slide, x, y, cw, ch, theme.bg_card, border=theme.border_subtle, border_w=1.0, rounded=True)
            rect(slide, x, y, cw, Inches(0.05), acc)
            text(slide, x + Inches(0.24), y + Inches(0.24), cw - Inches(0.48), Inches(0.42),
                 h, size=16, bold=True, color=theme.text_primary, font=theme.font_title)
            text(slide, x + Inches(0.24), y + Inches(0.75), cw - Inches(0.48), ch - Inches(0.9),
                 body, size=13.5, color=theme.text_muted, font=theme.font_body)

        if note:
            rect(slide, M, Inches(6.20), W - 2 * M, Inches(0.52), theme.bg_card_alt, border=theme.border_subtle, border_w=0.8, rounded=True)
            rect(slide, M, Inches(6.20), Inches(0.08), Inches(0.52), theme.accent_warning)
            text(slide, M + Inches(0.22), Inches(6.20), W - 2 * M - Inches(0.44), Inches(0.52),
                 f"💡  {note}", size=12, color=theme.text_primary, anchor=MSO_ANCHOR.MIDDLE, font=theme.font_body)
    return _fn


def split_slide(theme: Theme, step, title, left_h, left_lines, right_h, right_lines, verdict=None):
    def _fn(slide, n, total):
        chrome(theme, slide, step, title, n, total)
        gap = Inches(0.45)
        cw = (W - 2 * M - gap) / 2
        y = Inches(1.82)
        ch = Inches(4.18 if verdict else 4.75)

        configs = [
            (left_h, left_lines, theme.accent_secondary),
            (right_h, right_lines, theme.accent_primary),
        ]

        for i, (h, lines, acc) in enumerate(configs):
            x = M + i * (cw + gap)
            rect(slide, x, y, cw, ch, theme.bg_card, border=theme.border_subtle, border_w=1.0, rounded=True)
            rect(slide, x, y, cw, Inches(0.05), acc)
            text(slide, x + Inches(0.3), y + Inches(0.25), cw - Inches(0.6), Inches(0.42),
                 h, size=17, bold=True, color=theme.text_primary, font=theme.font_title)

            tb = slide.shapes.add_textbox(x + Inches(0.3), y + Inches(0.78), cw - Inches(0.6), ch - Inches(0.95))
            tf = tb.text_frame
            tf.word_wrap = True
            for j, ln in enumerate(lines):
                p = tf.paragraphs[0] if j == 0 else tf.add_paragraph()
                p.space_after = Pt(10)
                r_bullet = p.add_run()
                r_bullet.text = "›  "
                set_run(r_bullet, size=14, bold=True, color=acc, font=theme.font_mono)
                r_text = p.add_run()
                r_text.text = ln
                set_run(r_text, size=14, color=theme.text_muted, font=theme.font_body)

        if verdict:
            rect(slide, M, Inches(6.18), W - 2 * M, Inches(0.55), theme.bg_card_alt, border=theme.border_subtle, border_w=1.0, rounded=True)
            rect(slide, M, Inches(6.18), Inches(0.10), Inches(0.55), theme.accent_success)
            text(slide, M + Inches(0.24), Inches(6.18), W - 2 * M - Inches(0.48), Inches(0.55),
                 verdict, size=13, bold=True, color=theme.text_primary, anchor=MSO_ANCHOR.MIDDLE, font=theme.font_body)
    return _fn


def grid8_slide(theme: Theme, step, title, items):
    def _fn(slide, n, total):
        chrome(theme, slide, step, title, n, total)
        cols, rows = 4, 2
        gapx, gapy = Inches(0.24), Inches(0.26)
        cw = (W - 2 * M - (cols - 1) * gapx) / cols
        ch = Inches(2.25)
        y0 = Inches(1.85)

        for idx, (num, h, b) in enumerate(items):
            r = idx // cols
            c = idx % cols
            x = M + c * (cw + gapx)
            y = y0 + r * (ch + gapy)

            rect(slide, x, y, cw, ch, theme.bg_card, border=theme.border_subtle, border_w=1.0, rounded=True)
            badge(slide, x + Inches(0.18), y + Inches(0.18), Inches(0.55), Inches(0.28),
                  num, bg=theme.bg_card_hover, border=theme.border_subtle,
                  text_col=theme.accent_primary, size=11, font=theme.font_mono)
            text(slide, x + Inches(0.18), y + Inches(0.54), cw - Inches(0.36), Inches(0.46),
                 h, size=14.5, bold=True, color=theme.text_primary, font=theme.font_title)
            text(slide, x + Inches(0.18), y + Inches(1.05), cw - Inches(0.36), Inches(1.05),
                 b, size=12.5, color=theme.text_muted, font=theme.font_body)
    return _fn


def limits_slide(theme: Theme, slide, n, total):
    chrome(
        theme,
        slide,
        "Étape 5 — Limites & Sécurité",
        "Limites du canal : Analyse des risques et solutions apportées",
        n,
        total,
    )

    bh = Inches(2.22)
    y1 = Inches(1.82)
    y2 = Inches(4.35)

    # Bande 1 : Flow nominal
    rect(slide, M, y1, W - 2 * M, bh, theme.bg_card, border=theme.border_subtle, border_w=1.0, rounded=True)
    rect(slide, M, y1, Inches(0.08), bh, theme.accent_success)
    text(slide, M + Inches(0.25), y1 + Inches(0.14), Inches(7.0), Inches(0.30),
         "LE FLOW D’INTERACTION NOMINAL", size=12, bold=True, color=theme.accent_success, font=theme.font_mono)

    steps_flow = [
        ("1. Notification bot", "Envoi du relevé\nvia compte officiel", theme.accent_secondary),
        ("2. Espace sécurisé", "Lien web chiffré\nà usage unique", theme.accent_primary),
        ("3. Validation USSD", "Invite opérateur avec\nnom marchand affiché", theme.accent_success),
        ("4. Confirmation", "Webhook validé +\nquittance transmise", theme.accent_secondary),
    ]

    gap = Inches(0.32)
    bw = (W - 2 * M - Inches(0.5) - 3 * gap) / 4
    x0 = M + Inches(0.25)

    for i, (t, sub, col) in enumerate(steps_flow):
        x = x0 + i * (bw + gap)
        rect(slide, x, y1 + Inches(0.54), bw, Inches(1.42), theme.bg_card_alt, border=theme.border_subtle, border_w=0.8, rounded=True)
        rect(slide, x, y1 + Inches(0.54), bw, Inches(0.04), col)
        text(slide, x + Inches(0.10), y1 + Inches(0.68), bw - Inches(0.20), Inches(1.15),
             f"{t}\n{sub}", size=12.5, bold=True, color=theme.text_primary,
             align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE, font=theme.font_body)
        if i < 3:
            arrow_line(slide, x + bw + Inches(0.03), y1 + Inches(1.25),
                       x + bw + gap - Inches(0.03), y1 + Inches(1.25), color=theme.accent_secondary)

    # Bande 2 : Limites & Solutions
    rect(slide, M, y2, W - 2 * M, bh, theme.bg_card, border=theme.border_subtle, border_w=1.0, rounded=True)
    rect(slide, M, y2, Inches(0.08), bh, theme.accent_primary)
    text(slide, M + Inches(0.25), y2 + Inches(0.14), Inches(7.0), Inches(0.30),
         "LIMITES DU CANAL & SOLUTIONS TECHNIQUES", size=12, bold=True, color=theme.accent_primary, font=theme.font_mono)

    limits_items = [
        ("Usurpation de canal",
         "Risque : Faux profils de contact.\nRéponse : Compte certifié Meta (badge vert) + canal officiel."),
        ("Lien trompeur",
         "Risque : Copie d'interface.\nRéponse : Domaine officiel sous HTTPS + jeton signé temporaire."),
        ("Erreur destinataire",
         "Risque : Transfert mal orienté.\nRéponse : L'invite USSD opérateur affiche le nom marchand officiel."),
        ("Protection du code",
         "Risque : Capture du code secret.\nRéponse : Le PIN reste tapé sur le clavier USSD opérateur."),
    ]

    for i, (t, sub) in enumerate(limits_items):
        x = x0 + i * (bw + gap)
        rect(slide, x, y2 + Inches(0.54), bw, Inches(1.42), theme.bg_card_alt, border=theme.border_subtle, border_w=0.8, rounded=True)
        rect(slide, x, y2 + Inches(0.54), bw, Inches(0.04), theme.accent_primary if i % 2 == 0 else theme.accent_secondary)
        text(slide, x + Inches(0.12), y2 + Inches(0.62), bw - Inches(0.24), Inches(0.32),
             t, size=12, bold=True, color=theme.text_primary, align=PP_ALIGN.CENTER, font=theme.font_title)
        text(slide, x + Inches(0.12), y2 + Inches(0.96), bw - Inches(0.24), Inches(0.90),
             sub, size=11, color=theme.text_muted, align=PP_ALIGN.CENTER, font=theme.font_body)


def bpmn_slide(theme: Theme, slide, n, total):
    chrome(
        theme,
        slide,
        "Diagramme de Flux",
        "Processus complet : de la synchronisation initiale à la réconciliation finale",
        n,
        total,
    )

    top = Inches(1.72)
    lh = Inches(1.22)
    lw_label = Inches(1.85)
    lw_body = W - 2 * M - lw_label
    x_lane = M + lw_label

    lanes = [
        ("ORGANISATION /\nCLIENT", theme.lane_a),
        ("PLATEFORME\nCommunication & Sync", theme.lane_b),
        ("UTILISATEUR\nWhatsApp · Bot", theme.lane_a),
        ("OPÉRATEURS\nOM · MTN · Maviance", theme.lane_b),
    ]

    for i, (lbl, bg) in enumerate(lanes):
        y = top + i * lh
        rect(slide, M, y, lw_label, lh, theme.bg_card_hover, border=theme.border_subtle, border_w=1.0)
        accent_lane = theme.accent_primary if i == 1 else (theme.accent_secondary if i in (2, 3) else theme.border_accent)
        rect(slide, M, y, Inches(0.06), lh, accent_lane)
        text(slide, M + Inches(0.12), y, lw_label - Inches(0.20), lh,
             lbl, size=11, bold=True, color=theme.accent_primary if i == 1 else theme.text_primary,
             align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE, font=theme.font_body)
        rect(slide, x_lane, y, lw_body, lh, bg, border=theme.border_subtle, border_w=0.8)

    def y_mid(lane_idx):
        return top + lane_idx * lh + lh / 2

    def task(lane_idx, cx, label, fill=theme.bg_card, border=theme.accent_secondary, tc=theme.text_primary, w=Inches(1.42), h=Inches(0.68)):
        ym = y_mid(lane_idx)
        rect(slide, cx - w / 2, ym - h / 2, w, h, fill, border=border, border_w=1.2, rounded=True)
        text(slide, cx - w / 2 + Inches(0.06), ym - h / 2, w - Inches(0.12), h,
             label, size=10, bold=True, color=tc, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE, font=theme.font_body)

    def event(lane_idx, cx, label, start=True):
        ym = y_mid(lane_idx)
        r = Inches(0.36)
        oval(slide, cx - r / 2, ym - r / 2, r, r,
             theme.bg_card,
             border=theme.accent_success if start else theme.accent_danger,
             border_w=2.0)
        text(slide, cx - Inches(0.55), ym + r / 2 + Inches(0.02), Inches(1.1), Inches(0.26),
             label, size=9, bold=True, color=theme.accent_success if start else theme.accent_danger,
             align=PP_ALIGN.CENTER, font=theme.font_mono)

    def xor(lane_idx, cx, label):
        ym = y_mid(lane_idx)
        s = Inches(0.48)
        diamond(slide, cx - s / 2, ym - s / 2, s, s, theme.bg_card, border=theme.accent_warning, border_w=1.8)
        text(slide, cx - s / 2, ym - s / 2, s, s,
             "×", size=14, bold=True, color=theme.accent_warning, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE, font=theme.font_mono)
        if label:
            text(slide, cx - Inches(0.65), ym - s / 2 - Inches(0.26), Inches(1.3), Inches(0.24),
                 label, size=9, bold=True, color=theme.accent_warning, align=PP_ALIGN.CENTER, font=theme.font_mono)

    # Colonnes temporelles
    c1 = x_lane + Inches(0.55)
    c2 = x_lane + Inches(1.65)
    c3 = x_lane + Inches(3.15)
    c4 = x_lane + Inches(4.70)
    c5 = x_lane + Inches(6.05)
    c6 = x_lane + Inches(7.45)
    c7 = x_lane + Inches(8.95)
    c8 = x_lane + Inches(9.55)

    # Connecteurs
    arrow_line(slide, c1 + Inches(0.18), y_mid(0), c2 - Inches(0.71), y_mid(0), color=theme.accent_secondary)
    arrow_line(slide, c2, y_mid(0) + Inches(0.34), c3 - Inches(0.71), y_mid(1), color=theme.accent_secondary)
    arrow_line(slide, c3 + Inches(0.71), y_mid(1), c4 - Inches(0.71), y_mid(2), color=theme.accent_secondary)
    arrow_line(slide, c4 + Inches(0.71), y_mid(2), c5 - Inches(0.24), y_mid(2), color=theme.accent_secondary)
    arrow_line(slide, c5, y_mid(2) + Inches(0.24), c6 - Inches(0.71), y_mid(3), color=theme.accent_success)
    arrow_line(slide, c5 + Inches(0.24), y_mid(2), c6 - Inches(0.71), y_mid(2), color=theme.accent_warning, dashed=True)
    arrow_line(slide, c6, y_mid(2) - Inches(0.34), c6, y_mid(0) + Inches(0.34), color=theme.accent_warning, dashed=True)
    arrow_line(slide, c6 + Inches(0.71), y_mid(3), c7 - Inches(0.71), y_mid(1), color=theme.accent_success)
    arrow_line(slide, c6 + Inches(0.71), y_mid(0), c7 - Inches(0.71), y_mid(1), color=theme.accent_warning, dashed=True)
    arrow_line(slide, c7, y_mid(1) - Inches(0.34), c7, y_mid(0) + Inches(0.34), color=theme.accent_secondary)
    arrow_line(slide, c7, y_mid(1) + Inches(0.34), c7, y_mid(3) - Inches(0.34), color=theme.accent_success)
    arrow_line(slide, c7 + Inches(0.71), y_mid(0), c8 - Inches(0.18), y_mid(0), color=theme.accent_secondary)

    # Nœuds
    event(0, c1, "Début", start=True)
    task(0, c2, "Exporter données\n(système existant)", border=theme.border_accent)
    task(1, c3, "Traitement & Sync\nCalcul solde + Token", fill=theme.bg_card, border=theme.accent_primary, tc=theme.text_primary)
    task(2, c4, "Notification bot\nConsultation solde", border=theme.accent_secondary)
    xor(2, c5, "Mode ?")
    task(2, c6, "Dépôt bordereau\nvirement", fill=theme.bg_card, border=theme.accent_warning, tc=theme.text_primary)
    task(0, c6, "Gestionnaire valide\nsur relevé", fill=theme.bg_card, border=theme.accent_warning, tc=theme.text_primary)
    task(3, c6, "Push USSD + PIN\n(nom marchand)", fill=theme.bg_card, border=theme.accent_success, tc=theme.text_primary)
    task(1, c7, "Webhook / Validé\nMAJ solde + Reçu", fill=theme.bg_card, border=theme.accent_primary, tc=theme.text_primary)
    task(0, c7, "Réimport Delta\nConsolidé", border=theme.border_accent)
    task(3, c7, "Disbursement\nou Maviance RIB", fill=theme.bg_card, border=theme.accent_success, tc=theme.text_primary)
    event(0, c8, "Clos", start=False)


def matrix_slide(theme: Theme, step, title, headers, rows, tones):
    def _fn(slide, n, total):
        chrome(theme, slide, step, title, n, total)
        y = Inches(1.85)
        rh = Inches(0.62)
        widths = [Inches(3.2), Inches(1.9), W - 2 * M - Inches(5.1)]

        # Entête
        x = M
        for w, h in zip(widths, headers):
            rect(slide, x, y, w, Inches(0.44), theme.bg_card_hover, border=theme.border_subtle, border_w=1.0)
            text(slide, x + Inches(0.16), y, w - Inches(0.32), Inches(0.44),
                 h.upper(), size=10, bold=True, color=theme.accent_primary, anchor=MSO_ANCHOR.MIDDLE, font=theme.font_mono)
            x += w

        # Lignes
        y += Inches(0.46)
        for idx, (r, tone) in enumerate(zip(rows, tones)):
            bg = theme.bg_card if idx % 2 == 0 else theme.bg_card_alt
            x = M
            for ci, (w, val) in enumerate(zip(widths, r)):
                rect(slide, x, y, w, rh, bg, border=theme.border_subtle, border_w=0.6)
                col = theme.text_primary
                b = ci == 0
                fnt = theme.font_title if ci == 0 else theme.font_body
                if ci == 1:
                    col = theme.accent_success if tone == "ok" else (theme.accent_warning if tone == "warn" else theme.accent_danger)
                    b = True
                    fnt = theme.font_mono
                elif ci == 2:
                    col = theme.text_muted
                text(slide, x + Inches(0.16), y, w - Inches(0.32), rh,
                     val, size=12.5, bold=b, color=col, anchor=MSO_ANCHOR.MIDDLE, font=fnt)
                x += w
            y += rh
    return _fn


def build_presentation(theme: Theme) -> Presentation:
    prs = Presentation()
    prs.slide_width = W
    prs.slide_height = H
    blank = prs.slide_layouts[6]

    slides = [
        # 1. Cover
        lambda s, n, t: cover_slide(theme, s, n, t),

        # 2. But + piliers
        statement_slide(
            theme,
            "Étape 0 — Le but",
            "Établir la viabilité d’une solution adaptée aux réalités locales",
            "L’objectif est de concevoir un dispositif simple, sécurisé et pragmatique qui réconcilie naturellement les flux de paiement avec les engagements financiers :",
            [
                ("1. Simplicité",
                 "Accessibilité immédiate pour l’usager sans application dédiée.\nPrise en main fluide et sans friction pour l’organisation.\nSuppression des étapes et saisies redondantes."),
                ("2. Intégration naturelle",
                 "Respect des habitudes de paiement et des canaux existants.\nCoexistence harmonieuse avec les outils en place.\nAdoption facilitée pour l’ensemble des acteurs."),
                ("3. Efficience opérationnelle",
                 "Visibilité claire sur les restes à payer en temps réel.\nDiminution drastique des erreurs et litiges de rapprochement.\nFiabilité accrue des flux financiers collectés."),
            ],
        ),

        # 3. La démarche en 8 pas
        grid8_slide(
            theme,
            "Étape 0 — La démarche",
            "Le fil exact de l’étude — huit questions dans l’ordre",
            [
                ("01", "Connexions API", "Intégration directe OM/MoMo et passerelle Maviance pour le RIB."),
                ("02", "Enjeu de consolidation", "Rapprochement contextuel entre sommes dues et règlements effectifs."),
                ("03", "Intégration flexible", "Connexion harmonieuse à l'écosystème client sans intrusion logicielle."),
                ("04", "Canal d'échange", "Un flow intuitif et direct orienté WhatsApp Bot."),
                ("05", "Limites & Sécurité", "Analyse rigoureuse des risques du canal et réponses techniques."),
                ("06", "Processus global", "Diagramme de flux complet de l'ingestion à la réconciliation."),
                ("07", "Traçabilité multi-canal", "Consolidation des paiements (Mobile Money, virement, espèces)."),
                ("08", "Déploiement", "Matrice d'application sur les cas d'usage pilotes et marchés cibles."),
            ],
        ),

        # 4. Étape 1 — Connexions API
        split_slide(
            theme,
            "Étape 1 — Connexions API",
            "Deux types de connexion API : Intégration directe (OM/MoMo) et Passerelle (Maviance RIB)",
            "1. OM / MoMo : Intégration directe",
            [
                "Connexion directe aux API marchandes des opérateurs (Orange Money & MTN MoMo).",
                "Zéro intermédiaire sur les opérations de paiement mobile du quotidien.",
                "Collection instantanée vers le compte marchand dédié de l’organisation.",
                "Disbursement (reversement) direct sur le même réseau d'opérateur.",
                "Gestion cloisonnée et sécurisée des deux soldes opérateurs.",
            ],
            "2. RIB / Banque : Passerelle Maviance",
            [
                "Raccordement au réseau bancaire et interbancaire (GIMAC) via Maviance (S3P).",
                "Évite la lourdeur d’une adhésion directe GIMAC (sponsoring bancaire, collatéral).",
                "Permet les virements sortants et la couverture vers les comptes bancaires (RIB).",
                "Gestion préventive de la trésorerie et balayage automatique selon les seuils définis.",
                "Sécurisation des soldes importants au-delà des plafonds réglementaires mobile.",
            ],
            verdict="Synthèse : Pleine autonomie sur les flux Mobile Money massifs · Raccordement bancaire fiabilisé via Maviance.",
        ),

        # 5. Étape 2 — L’enjeu de la consolidation
        split_slide(
            theme,
            "Étape 2 — L’enjeu de la consolidation",
            "Relier les règlements financiers à leur contexte de gestion et au suivi des soldes",
            "Pourquoi la consolidation est essentielle",
            [
                "Une transaction brute isolée ne donne pas la visibilité sur la situation réelle.",
                "La consolidation unifie les montants engagés, les échéances et les versements effectifs.",
                "Elle élimine les rapprochements manuels chronophages et les risques de double paiement.",
                "Elle assure un suivi continu : solde initial, règlements partiels et reste à payer actualisé.",
            ],
            "Exemples concrets de consolidation",
            [
                "Paiements échelonnés : règlement d'une facture ou scolarité en plusieurs tranches.",
                "Facturation multi-lignes : affectation automatique d'un versement sur la bonne créance.",
                "Mixité des canaux : cumul d'un acompte en agence et du solde via mobile.",
                "Multi-acteurs : attribution d'un règlement effectué par un tiers pour le compte d'un usager.",
            ],
            verdict="Synthèse : Transformer un flux de paiement brut en information de gestion exploitable en temps réel.",
        ),

        # 6. Étape 3 — Intégration Flexible
        statement_slide(
            theme,
            "Étape 3 — Intégration Flexible",
            "S’intégrer à l’écosystème du client sans dénaturer ni modifier ses outils existants",
            "La plateforme s’adapte aux méthodes de travail en place : elle agit comme une passerelle de communication\net de synchronisation de données, sans jamais s’immiscer de force dans le système d’information du client.",
            [
                ("Respect total de l’existant",
                 "L'organisation conserve ses logiciels, tableurs ou bases de données internes.\nAucune refonte lourde ni changement des habitudes de travail.\nL'organisation reste propriétaire et maîtresse exclusive de ses données."),
                ("Plateforme de communication",
                 "Génération et envoi automatisé des notifications et états de compte.\nInteraction instantanée avec les payeurs sans solliciter les équipes internes.\nAccès simplifié aux reçus et quittances numériques officielles."),
                ("Synchronisation des données",
                 "Ingestion simple des états de créances et calcul dynamique des soldes.\nRestitution d'un delta consolidé prêt à être réimporté en un clic.\nTraitement asynchrone sécurisé garantissant zéro perte d'information."),
            ],
        ),

        # 7. Étape 4 — Le canal d’échange : WhatsApp Bot
        split_slide(
            theme,
            "Étape 4 — Le canal d’échange",
            "Un Flow orienté WhatsApp Bot : interaction naturelle et accessible à tous",
            "Ce que l’usager peut faire sur le bot",
            [
                "Consulter son solde : affichage instantané des sommes dues et de l'historique récent.",
                "Initier un paiement mobile : déclenchement en 1 clic d'un push USSD sécurisé sur son téléphone.",
                "Transmettre un bordereau : envoi d'une photo de reçu bancaire ou virement pour validation.",
                "Recevoir sa quittance : téléchargement immédiat du reçu officiel infalsifiable avec QR code.",
            ],
            "Les avantages du canal WhatsApp",
            [
                "Zéro application à télécharger : aucun encombrement de stockage sur le téléphone.",
                "Prise en main immédiate : canal déjà maîtrisé par 100 % des utilisateurs sur le marché.",
                "Reconnaissance contextuelle : le numéro de téléphone oriente directement vers le dossier.",
                "Continuité de service : échanges disponibles 24h/24 sans attente au guichet.",
            ],
            verdict="Synthèse : WhatsApp devient le guichet digital universel : consultation, exécution et réception de quittances.",
        ),

        # 8. Étape 5 — Limites & Sécurité
        lambda s, n, t: limits_slide(theme, s, n, t),

        # 9. Étape 6 — Processus global : Diagramme de Flux
        lambda s, n, t: bpmn_slide(theme, s, n, t),

        # 10. Étape 7 — Consolidation des paiements pour une meilleure traçabilité
        statement_slide(
            theme,
            "Étape 7 — Traçabilité",
            "Consolidation des Paiements pour une meilleure traçabilité",
            "La plateforme unifie l'ensemble des canaux de règlement pour garantir une vue comptable cohérente et sans faille :",
            [
                ("1. Paiement Mobile direct",
                 "Déclenchement instantané par push USSD sur le téléphone du payeur.\nConfirmation temps réel via webhook cryptographique sécurisé.\nÉmission immédiate de la quittance numérique et mise à jour du solde."),
                ("2. Virement bancaire & passerelle",
                 "Dépôt d'une photo du bordereau bancaire ou virement via l'interface.\nVérification simple et validation en un clic par le gestionnaire.\nTraçabilité horodatée de l'écriture sans risque d'oubli."),
                ("3. Règlements physiques en espèces",
                 "Enregistrement des versements au guichet dans le logiciel habituel du client.\nPrise en compte automatique lors de la prochaine synchronisation.\nDéduction exacte du solde sans double écriture ni distorsion."),
            ],
            note="Règle de synchronisation : Les validations digitales en temps réel sont prioritaires pour garantir l'exactitude permanente des soldes.",
        ),

        # 11. Étape 8 — Cas d’Usage
        matrix_slide(
            theme,
            "Étape 8 — Cas d’Usage",
            "Cas d’Usage : Déclinaison du moteur sur les marchés cibles",
            ["Cas d’usage (Secteur)", "Priorité", "Application concrète du moteur de réconciliation"],
            [
                ["Éducation (Écoles & Instituts)", "1 · Prioritaire", "Paiement échelonné des scolarités, suppression des faux bordereaux, désengorgement des guichets."],
                ["Distribution & Demi-grossistes", "2 · Extension", "Recouvrement des créances clients et règlement des commandes sans transport d'espèces volumineuses."],
                ["Logistique, dépôts & santé", "3 · Déploiement", "Validation de la preuve de versement avant déblocage de stock ou délivrance de services."],
                ["Gestion immobilière & Bailleurs", "3 · Déploiement", "Notification des loyers, confirmation des versements sur WhatsApp et quittance automatique."],
                ["Collectivités & Régies de services", "4 · Évolution", "Interface usager fluide et restitution de données compatibles avec les systèmes de trésorerie."],
                ["Agrégation pure non ciblée", "Hors cible", "Services de paiement génériques sans lien avec une créance ou un suivi de solde."],
            ],
            ["ok", "ok", "warn", "warn", "warn", "no"],
        ),
    ]

    total = len(slides)
    for i, fn in enumerate(slides, start=1):
        s = prs.slides.add_slide(blank)
        fn(s, i, total)
    return prs


if __name__ == "__main__":
    from pathlib import Path

    dir_notes = str(Path(__file__).resolve().parent)

    # 1. Version Anthropic (Warm Editorial)
    path_anthropic = f"{dir_notes}/etude-faisabilite-fintech-anthropic.pptx"
    prs_anthropic = build_presentation(ANTHROPIC_THEME)
    prs_anthropic.save(path_anthropic)
    print("Anthropic:", path_anthropic, "slides:", len(prs_anthropic.slides))

    # 2. Version GitHub Copilot (Dark Neon)
    path_copilot = f"{dir_notes}/etude-faisabilite-fintech-copilot.pptx"
    prs_copilot = build_presentation(COPILOT_THEME)
    prs_copilot.save(path_copilot)
    print("Copilot:", path_copilot, "slides:", len(prs_copilot.slides))

    # 3. Référence standard (mise par défaut sur Anthropic)
    path_default = f"{dir_notes}/etude-faisabilite-fintech-cameroun.pptx"
    prs_anthropic.save(path_default)
    print("Default (Anthropic):", path_default, "slides:", len(prs_anthropic.slides))
