---
name: Coastal Heirloom
colors:
  surface: '#f7f9ff'
  surface-dim: '#cadcf1'
  surface-bright: '#f7f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#edf4ff'
  surface-container: '#e3efff'
  surface-container-high: '#d9eaff'
  surface-container-highest: '#d2e4fa'
  on-surface: '#0b1d2d'
  on-surface-variant: '#43474d'
  inverse-surface: '#213242'
  inverse-on-surface: '#e8f2ff'
  outline: '#73777e'
  outline-variant: '#c3c7ce'
  surface-tint: '#416182'
  primary: '#3e5e7f'
  on-primary: '#ffffff'
  primary-container: '#577799'
  on-primary-container: '#fdfcff'
  inverse-primary: '#a9caef'
  secondary: '#5f5e5a'
  on-secondary: '#ffffff'
  secondary-container: '#e5e2dc'
  on-secondary-container: '#656460'
  tertiary: '#4d5e69'
  on-tertiary: '#ffffff'
  tertiary-container: '#667782'
  on-tertiary-container: '#fbfcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cfe4ff'
  primary-fixed-dim: '#a9caef'
  on-primary-fixed: '#001d34'
  on-primary-fixed-variant: '#284968'
  secondary-fixed: '#e5e2dc'
  secondary-fixed-dim: '#c9c6c1'
  on-secondary-fixed: '#1c1c18'
  on-secondary-fixed-variant: '#474743'
  tertiary-fixed: '#d3e5f2'
  tertiary-fixed-dim: '#b7c9d6'
  on-tertiary-fixed: '#0c1d27'
  on-tertiary-fixed-variant: '#384953'
  background: '#f7f9ff'
  on-background: '#0b1d2d'
  surface-variant: '#d2e4fa'
typography:
  headline-xl:
    fontFamily: EB Garamond
    fontSize: 48px
    fontWeight: '500'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: EB Garamond
    fontSize: 32px
    fontWeight: '500'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: EB Garamond
    fontSize: 28px
    fontWeight: '500'
    lineHeight: '1.2'
  display-italic:
    fontFamily: EB Garamond
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.2'
  body-lg:
    fontFamily: Literata
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Literata
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.08em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  container-padding: 32px
  gutter: 24px
  keyline-gap: 4px
---

## Brand & Style
This design system captures the spirit of an upscale Cape Cod celebration—blending the storied tradition of "Something Blue" with a lively, spirited energy. The brand personality is celebratory, curated, and effortlessly elegant, evoking the tactile quality of high-end stationery and heirloom textiles.

The aesthetic fuses **Modern Minimalism** with **Coastal Classicism**. It utilizes a "Ticking Stripe" motif to create rhythm and verticality, moving away from static grids toward a more rhythmic, textile-inspired interface. The emotional response should be one of refined joy—like an invitation to an exclusive seaside garden party. Key visual signatures include double-keyline borders, delicate scalloped edges, and fine-line engraved illustrations that provide a sense of timeless craftsmanship.

## Colors
The palette is centered on a fresh, maritime-inspired range of blues and warm whites.
- **Primary (French Blue):** A dusty, sophisticated blue used for key actions and primary decorative borders.
- **Secondary (Warm Ivory):** The foundational "paper" color, providing a soft, natural warmth that feels more premium than pure white.
- **Tertiary (Sky Blue):** Used for the "ticking stripe" background patterns and subtle accents to inject a sense of "Something Blue" freshness.
- **Neutral (Slate):** A deep, low-contrast blue-grey used for legible body text and fine-line engravings.

**Background Treatment:** Instead of solid fills or dots, the background features 1px vertical "Ticking Stripes" in Sky Blue spaced 12px apart over a Warm Ivory field.

## Typography
The typography is designed to feel like bespoke editorial layout. 
- **Headlines:** Use **EB Garamond**. It provides a graceful, classical weight. To make the system feel "lively and fun," lean heavily into the italic variant for subheadings and emphasis within paragraphs to create a rhythmic, calligraphic feel.
- **Body:** **Literata** provides a spirited, bookish readability that feels warmer and more approachable than standard system serifs. 
- **Labels:** **Plus Jakarta Sans** is used sparingly for functional UI elements (buttons, tags) to provide a clean, modern counterpoint to the romantic serifs.

Use "Display Italic" for pull-quotes or introductory text to break the formality of standard layouts.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy, mirroring the structured elegance of a printed invitation. 
- **Rhythm:** An 8px base unit drives all spacing.
- **Composition:** Content should be centered with generous margins to allow the vertical ticking stripe background to frame the UI.
- **The Double Keyline:** Major sections and containers are defined by a "Double Keyline"—a 1px solid border, followed by a 4px gap, and then another 0.5px border. This creates a framed, "Heirloom" look.
- **Mobile:** On mobile, the double-keylines compress to a single keyline to maximize screen real estate, while horizontal padding remains generous (24px).

## Elevation & Depth
This design system rejects heavy shadows in favor of **Tonal Layers** and **Physical Metaphors**. 
- **Depth:** Achieved through stacking Ivory surfaces on top of the Ticking Stripe background. 
- **Borders:** Instead of shadows, use the primary color in fine-line weights (0.5px to 1px) to define edges. 
- **Interactivity:** Elements don't "lift" on hover; instead, they might display a subtle scalloped edge reveal or a fill color shift from Ivory to a very pale Sky Blue. 
- **Engraving:** Illustrations and icons should appear "etched" into the surface using the Neutral Slate color, reinforcing the tactile, printed quality.

## Shapes
The shape language is primarily architectural and rectangular, but softened by specific decorative flourishes.
- **Corner Radius:** Standard components use a soft 0.25rem radius to feel approachable but disciplined.
- **Scalloped Edges:** Use scalloped border-bottoms or border-tops on cards and separators to introduce the "lively and fun" coastal aesthetic. These should be subtle, repeating semi-circles that mimic vintage fabric or paper edges.
- **Keylines:** Every primary container must feature the signature double-border (keyline).

## Components
- **Buttons:** Use a pill-shape for primary actions to contrast the rectangular grid. Primary buttons are French Blue with Ivory text; secondary buttons are "Ghost" style with a double-keyline border.
- **Cards:** Ivory background with a 1px French Blue border. The header of the card should feature a scalloped bottom edge separating it from the body content.
- **Input Fields:** Minimalist lines. Only a bottom border (1px) in Slate, which thickens to 2px on focus. Labels sit in the "Label-sm" uppercase style above the line.
- **Chips/Tags:** Small, pill-shaped elements in Sky Blue with dark Slate text, using a 0.5px border.
- **Dividers:** Use a horizontal "Engraved Line"—a single thin line with a decorative flourish (like a small diamond or a shell icon) in the center.
- **Lists:** Items separated by a thin Sky Blue horizontal line. Use the italic serif for list item titles to maintain the spirited vibe.