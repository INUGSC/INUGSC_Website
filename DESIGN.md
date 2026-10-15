---
version: alpha
name: INUGSC
description: The design system for inugsc.org, the International Undergraduate Surgical Conference. A photography-led site built from full-width bands in the manner of Apple's product pages, set in a classical serif. Bands alternate deep navy, navy, light blue-grey and white, and the change of colour is the only divider. Libre Baskerville carries every heading and Assistant carries everything you read. One light-blue accent, square corners, no shadows, no gradients, and motion only on scroll.

colors:
  primary: "#1d1d5f"
  primary-deep: "#0e0e33"
  secondary: "#1d12b2"
  tertiary: "#8fd0f5"
  neutral: "#f6f6f6"
  surface-band: "#e1e8f0"
  surface-white: "#ffffff"
  ink: "#14142f"
  on-dark: "#ffffff"
  on-dark-muted: "rgba(255, 255, 255, 0.72)"
  scrim: "rgba(10, 12, 48, 0.62)"
  hairline-light: "rgba(29, 29, 95, 0.18)"
  hairline-dark: "rgba(255, 255, 255, 0.24)"
  map-base: "#d3d8e8"

typography:
  display-date:
    fontFamily: Libre Baskerville
    fontSize: 5.6rem
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: 0.01em
  display-xl:
    fontFamily: Libre Baskerville
    fontSize: 5.4rem
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: 0.01em
  figure:
    fontFamily: Libre Baskerville
    fontSize: 4.5rem
    fontWeight: 400
    lineHeight: 1
    letterSpacing: 0.01em
  accent-italic:
    fontFamily: Libre Baskerville
    fontSize: 3.8rem
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: 0em
  headline-lg:
    fontFamily: Libre Baskerville
    fontSize: 2.9rem
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: 0.01em
  headline-md:
    fontFamily: Libre Baskerville
    fontSize: 2.75rem
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: 0.01em
  headline-sm:
    fontFamily: Libre Baskerville
    fontSize: 2.4rem
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: 0.01em
  quote-italic:
    fontFamily: Libre Baskerville
    fontSize: 2rem
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: 0em
  title:
    fontFamily: Libre Baskerville
    fontSize: 1.5rem
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: 0.01em
  eyebrow-italic:
    fontFamily: Libre Baskerville
    fontSize: 1.15rem
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: 0.03em
  lockup:
    fontFamily: Libre Baskerville
    fontSize: 1rem
    fontWeight: 500
    lineHeight: 1.45
    letterSpacing: 0.07em
  lead:
    fontFamily: Assistant
    fontSize: 1.45rem
    fontWeight: 300
    lineHeight: 1.45
    letterSpacing: 0.02em
  body-lg:
    fontFamily: Assistant
    fontSize: 1.125rem
    fontWeight: 300
    lineHeight: 1.65
  body-md:
    fontFamily: Assistant
    fontSize: 1.0625rem
    fontWeight: 300
    lineHeight: 1.6
  label:
    fontFamily: Assistant
    fontSize: 1rem
    fontWeight: 600
    lineHeight: 1.4
  link:
    fontFamily: Assistant
    fontSize: 1rem
    fontWeight: 500
    lineHeight: 1.4
  button:
    fontFamily: Assistant
    fontSize: 1rem
    fontWeight: 600
    lineHeight: 1
  nav:
    fontFamily: Assistant
    fontSize: 1.2rem
    fontWeight: 400
    lineHeight: 1
  caption:
    fontFamily: Assistant
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.45

rounded:
  none: 0px
  sm: 2px
  seal: 9999px

spacing:
  xs: 0.5rem
  sm: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  xxl: 4rem
  section: 6rem
  section-mobile: 3rem
  gutter: 4rem
  gutter-mobile: 1.5rem
  measure-panel: 32rem
  measure-reading: 36rem
  measure-centred: 44rem

components:
  site-header:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-dark}"
    typography: "{typography.nav}"
    padding: 1rem 3rem
  lockup:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-dark}"
    typography: "{typography.lockup}"
  hero:
    backgroundColor: "{colors.primary-deep}"
    textColor: "{colors.on-dark}"
    typography: "{typography.display-date}"
    padding: 0 5rem 5.5rem
  hero-eyebrow:
    backgroundColor: "{colors.primary-deep}"
    textColor: "{colors.on-dark}"
    typography: "{typography.eyebrow-italic}"
  hero-venue:
    backgroundColor: "{colors.primary-deep}"
    textColor: "{colors.on-dark}"
    typography: "{typography.lead}"
  hero-scrim:
    backgroundColor: "{colors.scrim}"
  band-deep:
    backgroundColor: "{colors.primary-deep}"
    textColor: "{colors.on-dark}"
    padding: "{spacing.section}"
  band-navy:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-dark}"
    padding: "{spacing.section}"
  band-light:
    backgroundColor: "{colors.surface-band}"
    textColor: "{colors.secondary}"
    padding: "{spacing.section}"
  band-white:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.secondary}"
    padding: "{spacing.section}"
  band-page:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.secondary}"
    padding: "{spacing.section}"
  supporting-text-on-dark:
    backgroundColor: "{colors.primary-deep}"
    textColor: "{colors.on-dark-muted}"
    typography: "{typography.body-md}"
  button-on-dark:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: 0.95rem 1.6rem
  button-on-dark-hover:
    backgroundColor: "{colors.surface-band}"
    textColor: "{colors.ink}"
  button-on-light:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-dark}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: 0.95rem 1.6rem
  button-on-light-hover:
    backgroundColor: "{colors.primary-deep}"
    textColor: "{colors.on-dark}"
  text-link-on-dark:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-dark}"
    typography: "{typography.link}"
  text-link-on-light:
    backgroundColor: "{colors.surface-band}"
    textColor: "{colors.secondary}"
    typography: "{typography.link}"
  accent-line:
    backgroundColor: "{colors.primary-deep}"
    textColor: "{colors.tertiary}"
    typography: "{typography.accent-italic}"
  theme-line:
    backgroundColor: "{colors.primary-deep}"
    textColor: "{colors.on-dark}"
    typography: "{typography.accent-italic}"
  details-term:
    backgroundColor: "{colors.surface-band}"
    textColor: "{colors.secondary}"
    typography: "{typography.label}"
  details-value:
    backgroundColor: "{colors.surface-band}"
    textColor: "{colors.secondary}"
    typography: "{typography.body-md}"
  numbers-band:
    backgroundColor: "{colors.primary-deep}"
    textColor: "{colors.on-dark}"
    typography: "{typography.figure}"
    padding: "{spacing.section}"
  numbers-label:
    backgroundColor: "{colors.primary-deep}"
    textColor: "{colors.on-dark-muted}"
    typography: "{typography.body-md}"
  numbers-divider:
    backgroundColor: "{colors.hairline-dark}"
    width: 1px
  quote:
    backgroundColor: "{colors.surface-band}"
    textColor: "{colors.secondary}"
    typography: "{typography.quote-italic}"
  quote-attribution:
    backgroundColor: "{colors.surface-band}"
    textColor: "{colors.secondary}"
    typography: "{typography.label}"
  welcome-letter:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.ink}"
    typography: "{typography.body-lg}"
  welcome-signature:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.primary}"
    typography: "{typography.title}"
  speaker-name:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.primary}"
    typography: "{typography.title}"
  speaker-role:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
  timeline-year:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.primary}"
    typography: "{typography.figure}"
  timeline-entry:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
  divider-light:
    backgroundColor: "{colors.hairline-light}"
    height: 1px
  photo:
    rounded: "{rounded.none}"
  year-seal:
    rounded: "{rounded.seal}"
    size: 183px
  sponsor-wall:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink}"
    typography: "{typography.headline-lg}"
  map-dot:
    backgroundColor: "{colors.map-base}"
  map-dot-lit:
    backgroundColor: "{colors.secondary}"
  form-field:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: 0.85rem 1rem
    height: 3rem
  caption:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.ink}"
    typography: "{typography.caption}"
  site-footer:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.secondary}"
    typography: "{typography.caption}"
    padding: "{spacing.xl}"
---

# INUGSC design system

The rules every page of inugsc.org follows. Read this before changing the site, whether you are next year's committee or an AI tool, so the site stays one consistent thing. The block above holds the exact values; the sections below say how to use them. The file follows Google's DESIGN.md format, so `npx @google/design.md lint DESIGN.md` checks it.

## Overview

The site serves three readers at once: students deciding whether to come, from the UK and abroad; surgeons and academics deciding whether to speak; and organisations deciding whether to sponsor. It should feel like the conference on its best morning: calm, assured, international, and serious about surgery without being stiff.

The look draws on three sources.

- **Apple's product pages** give the page grammar. Full-width bands are stacked edge to edge with one idea in each. Photography comes first and the interface recedes. There is a single accent, and a change of background colour does the work that borders, boxes and cards do on other sites.
- **Editorial serif sites** give the voice: a classical serif for everything you look at (Libre Baskerville, the face of the INUGSC lockup) and a quiet sans for everything you read (Assistant).
- **Olympiad sites such as IChO's** give the content model: welcome messages, a theme line, a band of numbers, a sense of the host city, and a record of past meetings.

**Key characteristics**

- Edge to edge on desktop. No side margins, no centred page container, no gaps between bands.
- Five surfaces: deep navy, navy, light blue-grey, white and page grey. Neighbouring bands always differ, and the colour change is the divider.
- Libre Baskerville at weight 400 for every heading and never bold, with italic kept for short accents. Assistant 300 for reading and 600 for labels.
- One accent, the light blue of the phoenix, for at most one phrase per section and only on navy.
- One solid button per view. Every other action is an underlined text link.
- Square corners: 2px on buttons and fields, none anywhere else. No shadows, gradients, glows or frosted glass.
- Real INUGSC photographs only, one per band, drifting gently as you scroll.
- Every movement is driven by scrolling and has a still version for visitors who reduce motion.

## Colours

Navy and white do most of the work. The light blue-grey band carries practical information, and the accent appears rarely enough to be noticed.

| Name | Token | Value | Use |
|---|---|---|---|
| Navy | `primary` | `#1d1d5f` | Header, split-section text panels, solid buttons on light surfaces, names and years on light surfaces |
| Deep navy | `primary-deep` | `#0e0e33` | Cinematic bands: the first view, speakers and workshops, the numbers band, inner-page title bands |
| Blue text | `secondary` | `#1d12b2` | Headings and short copy on light surfaces, lit countries on the delegate map |
| Phoenix blue | `tertiary` | `#8fd0f5` | The accent. One phrase per section ("Coming soon.", "Submissions open soon."), on navy or deep navy only |
| Page grey | `neutral` | `#f6f6f6` | The resting canvas, long reading, the footer |
| Light blue-grey | `surface-band` | `#e1e8f0` | Date and venue, details, quotes, the row of year seals |
| White | `surface-white` | `#ffffff` | The delegate map, speakers, the sponsor wall, form fields, the solid button on dark |
| Ink | `ink` | `#14142f` | Long reading on light surfaces, sponsor headings, text on the white button, form input |
| White on dark | `on-dark` | `#ffffff` | All text on navy and deep navy |
| Muted white | `on-dark-muted` | 72% white | Supporting lines on dark bands |
| Scrim | `scrim` | `rgba(10, 12, 48, 0.62)` | The flat navy layer between a photograph and the type on it |
| Hairlines | `hairline-light`, `hairline-dark` | 18% navy, 24% white | 1px rules between list rows and between figures |
| Map base | `map-base` | `#d3d8e8` | Unlit dots on the delegate map |

**How colour is used**

- **Text on dark** is white. Supporting lines can drop to 72% white, never lower.
- **Text on light** is blue text for headings and short copy (up to about three paragraphs). Anything longer, such as welcome messages and past-meeting entries, is set in ink, because a page of saturated blue is tiring to read. The sponsor wall is also set in ink, so the greyscale logos sit in a neutral frame.
- **The accent** never appears on a light surface, where it fails contrast at 1.7:1. It is never a button colour, never a background and never a border.
- **Photographs** carry the only other colour on the page. When type sits on a photograph, the scrim goes between them, flat and even. Never use a gradient scrim.
- **Indigo** `#210790` survives in older CSS (narrow panels, the old button, the floating socials). Do not use it in new work, and replace it with navy whenever a section is rebuilt.
- **No gradients**, in backgrounds, scrims, text or buttons.

**Contrast (WCAG 2)**

| Pair | Ratio |
|---|---|
| White on deep navy | 18.6:1 |
| White on navy | 15.1:1 |
| Ink on white | 17.9:1 |
| Navy on light blue-grey | 12.2:1 |
| Phoenix blue on deep navy | 11.1:1 |
| Blue text on light blue-grey | 9.5:1 |
| Muted white on navy | 8.4:1 |
| White on the scrim, over a pure white photo highlight | 5.4:1 |
| Phoenix blue on white (never used) | 1.7:1 |

## Typography

Serif for what you look at, sans for what you read.

- **Display:** Libre Baskerville, self-hosted in `font/` under the SIL Open Font Licence (400, 500, 600 and 400 italic). Fallback: `Georgia, serif`. It matches the Canva lockup.
- **Text:** Assistant, a variable font from 200 to 800, self-hosted in `font/`. Fallback: `"Helvetica Neue", Arial, sans-serif`.

| Token | Desktop size | Responsive size | Weight | Line height | Tracking | Use |
|---|---|---|---|---|---|---|
| `display-date` | 5.6rem | `clamp(2.8rem, 5.4vw, 5.6rem)` | 400 | 1.05 | 0.01em | The date in the first view, always the largest thing on the page |
| `display-xl` | 5.4rem | `clamp(2.6rem, 6.6vw, 5.4rem)` | 400 | 1.05 | 0.01em | Single-word cinematic headings ("Speakers"), inner-page titles |
| `figure` | 4.5rem | `clamp(2.8rem, 6vw, 4.5rem)` | 400 | 1 | 0.01em | The numbers band, years on the past-meetings page |
| `accent-italic` | 3.8rem, italic | `clamp(2rem, 4.8vw, 3.8rem)` | 400 | 1.1 | 0 | The one accent phrase, the theme line |
| `headline-lg` | 2.9rem | `clamp(2rem, 3.3vw, 2.9rem)` | 400 | 1.15 | 0.01em | Centred band headings ("Delegates from 13 countries", "Previous sponsors") |
| `headline-md` | 2.75rem | `clamp(2rem, 3.1vw, 2.75rem)` | 400 | 1.15 | 0.01em | Split-panel headings ("Partner with us") |
| `headline-sm` | 2.4rem | `clamp(1.8rem, 2.6vw, 2.4rem)` | 400 | 1.2 | 0.01em | Sub-section headings ("Contact") |
| `quote-italic` | 2rem, italic | `clamp(1.5rem, 2.6vw, 2rem)` | 400 | 1.35 | 0 | Testimonials and pull quotes |
| `title` | 1.5rem | fixed | 400 | 1.25 | 0.01em | Speaker names, workshop titles, signatures, entry titles |
| `eyebrow-italic` | 1.15rem, italic | fixed | 400 | 1.3 | 0.03em | The line above the date ("16th Anniversary") |
| `lockup` | 1rem | 0.86rem below 1180px, 0.74rem below 1000px | 500 | 1.45 | 0.07em | The header lockup only |
| `lead` | 1.45rem | `clamp(1.1rem, 1.7vw, 1.45rem)` | 300 | 1.45 | 0.02em | The venue line in the first view, panel subtitles |
| `body-lg` | 1.125rem | fixed | 300 | 1.65 | 0 | Welcome messages and other long reading |
| `body-md` | 1.0625rem | fixed | 300 | 1.6 | 0 | Default paragraph |
| `label` | 1rem | fixed | 600 | 1.4 | 0 | Terms in details lists, attributions |
| `link` | 1rem | fixed | 500 | 1.4 | 0 | Text links |
| `button` | 1rem | fixed | 600 | 1 | 0 | The solid button |
| `nav` | 1.2rem | 1.02rem below 1340px, 0.92rem below 1180px | 400 | 1 | 0 | Header links |
| `caption` | 0.875rem | fixed | 400 | 1.45 | 0 | Photo captions, the footer, fine print |

**Principles**

- Never set a paragraph in Libre Baskerville or a heading in Assistant.
- All display type is weight 400. Emphasis comes from size and space, not weight. In Libre Baskerville, weight 500 appears only in the lockup and 600 is not used.
- Italic is an accent for one short line at a time: the eyebrow, the accent phrase, the theme line and quotes.
- Tracking at display sizes is slightly open (0.01 to 0.03em), which suits a serif. The lockup alone uses 0.07em. Never use negative tracking or tracked capitals.
- Use sentence case everywhere, including buttons, navigation and headings.
- Body copy is 17px (1.0625rem), a pixel above the web default, following Apple's reading pace. Running text is weight 300 and inline emphasis is 500.
- Keep lines short. Panel text stops at `measure-panel` (32rem), long reading at `measure-reading` (36rem) and centred text at `measure-centred` (44rem).
- Statistics are set in Libre Baskerville, including the plus in "500+".

## Layout

**Bands**

- The page is a vertical stack of full-width bands with no gaps between them. There is no page container and no side margin on desktop. Content sits inside each band, within the band's own gutter.
- Each band holds one idea and takes one of three forms:
  - **Cinematic:** deep navy, centred, with generous vertical space. Used for the first view, speakers and workshops, and the numbers band.
  - **Split:** a text panel beside a photograph that drifts as you scroll. The text panel is a solid band colour; the photo fills its half to the edge of the screen.
  - **Content:** a centred heading above a grid or list, such as the delegate map, speakers or sponsors.
- Neighbouring bands never share a background. If two light sections must sit together, make one light blue-grey and the other white or page grey.
- When something needs emphasis, change the band before adding anything else, such as a border, a box or a second button.

**Spacing**

- The base unit is 8px. Use the `spacing` tokens rather than new values.
- Bands use `section` (6rem) vertically and `gutter` (4rem) horizontally on desktop, dropping to `section-mobile` (3rem) and `gutter-mobile` (1.5rem) on phones.
- Cinematic bands measure in screen height instead: 18vh above, 20vh below and 14vh between items on desktop, and 14vh, 16vh and 10vh on phones.
- Inside panels, leave 0.8rem from heading to text, 1.6rem below a subtitle, and 1rem between paragraphs.

**Header**

- The header is sticky, solid navy and full width. On the left are the year seal (10vh tall) and the three-line lockup "The International / Undergraduate Surgical / Conference, 2027". On the right are at most five text links in sentence case.
- Nothing else goes in the header: no buttons, social icons, search or language switch.
- Below 1000px it shows the seal, the lockup and a menu icon, and the links fold into a vertical list.

**First view**

- It fills the screen (`100svh` minus the header). The date is the largest thing on the page, then the venue, then at most two actions: one solid button and one text link.
- The content sits at the bottom left, on the gutter.
- The background layer (`.hero_full_media`) is reserved for the scroll-driven fly-in of UCL East. Until that exists it holds a single photograph under the scrim.

**Home page order**

This is the working order for the renovation. The first two positions are fixed.

1. First view
2. Date and venue, with the map
3. Welcome: a short excerpt from the directors, linking to the full messages
4. Numbers band
5. About, with the endorsements
6. Delegates map
7. Speakers and workshops
8. Testimonials
9. Abstract competition
10. A strip of the gallery, linking to past meetings
11. Partner with us, followed by previous sponsors
12. Contact and footer

**Inner pages**

Pages such as past meetings, the gallery, the invitation to speak, the privacy notice and ticket terms open with a shorter title band in deep navy (50 to 60svh, title in `display-xl` or `headline-lg`). After that they use the same band grammar.

## Elevation & Depth

The system is flat. Depth comes from four things only: a change of surface colour, photography, photographs drifting as you scroll, and the scrim.

- Do not use `box-shadow`, `text-shadow`, the `drop-shadow()` filter, glows or `backdrop-filter`, anywhere.
- The sticky header is solid navy. It is never translucent or blurred.
- The only layers are the header over the page, the scrim over a photograph, and type over the scrim.

## Shapes

- `rounded.sm` (2px) is for buttons and form fields.
- `rounded.none` is for everything else: bands, photographs, portraits, the map, lists and panels.
- `rounded.seal` is a circular clip used only for the year seals, because the seals are circular artwork. Never use it on buttons, portraits, tags or images of people.
- Lines are 1px hairlines. Link underlines are a 1px border in the text colour, 2px below the text.
- There are no icon sets. The only glyphs are the menu icon and the Instagram glyph.

## Components

**Header** (`site-header`, `lockup`)

Navy, sticky, with the seal and lockup on the left and up to five links on the right. Links are white `nav` type; on hover they fade to 70% opacity over 0.3s. The current page's link carries a 1px underline.

**First view** (`hero`, `hero-eyebrow`, `hero-venue`, `hero-scrim`)

The stack is the eyebrow ("16th Anniversary" in `eyebrow-italic`), then the date in `display-date` ("30–31 January 2027"), then the venue in `lead` ("Marshgate and One Pool Street, UCL East, London"), then the actions. The photograph or fly-in sits underneath, covered by `hero-scrim`. As the visitor scrolls away, the content lifts and fades (see Motion).

**Bands** (`band-deep`, `band-navy`, `band-light`, `band-white`, `band-page`)

These are the building blocks of every page. Choose a band by its role in Colours, then check that it differs from both neighbours.

**Split section**

A text panel takes 44% of the width and a photograph takes the rest, or the two take half each. Panels alternate sides down the page. The panel holds a `headline-md` heading, an optional subtitle in `lead`, body text up to `measure-panel`, and one action. On phones the photo stacks above the text at 40vh.

**Buttons and links** (`button-on-dark`, `button-on-light`, `text-link-on-dark`, `text-link-on-light`)

- Use at most one solid button per view: white with ink text on dark surfaces, navy with white text on light ones.
- On hover the white button turns light blue-grey and the navy button turns deep navy. Nothing grows, moves or bounces.
- Every other action is a text link in `link` type with a 1px underline. On hover it fades to 70% opacity.
- Keyboard focus is always visible: a 2px solid outline in the current text colour, 3px from the element.
- Labels are short and start with a verb: "Follow for ticket updates", "Partner with us", "Get directions".

**Accent line and theme line** (`accent-line`, `theme-line`)

The accent line is the one phrase per section set in `accent-italic` and phoenix blue on deep navy, such as "Coming soon.". The theme line is the year's theme in the same style but in white, placed in the welcome band or under the first view. It appears only once the 2027 theme is confirmed.

**Details list** (`details-term`, `details-value`)

Facts such as dates, venue, travel and contact are set as a definition list (`dl.details_list`): the term in `label` and the value in `body-md`, in two columns that fold to one on phones. Never use underlined labels or tables for these.

**Numbers band** (`numbers-band`, `numbers-label`, `numbers-divider`)

- Three or four figures sit in a row on deep navy, each a `figure` above a one-line label in muted white, separated by vertical hairlines. On phones they form a two-by-two grid.
- The figures arrive with the standard reveal. They never count up.
- Every figure carries its year or source in its label, for example "countries represented in 2025".
- Confirmed figures available now: founded in 2011, the 16th edition, 500+ delegates, and 13 countries in 2025. Add more only from the archive data.

**Quotes and testimonials** (`quote`, `quote-attribution`)

- Show one quote per band, or two side by side at most, on light blue-grey. The quote is in `quote-italic` blue text, up to `measure-centred`.
- Below it comes the attribution: the name in `label`, then the university and year attended in `caption`. A 4:5 portrait is optional and needs consent.
- Every quote is real, verbatim and used with written permission. Cuts are marked with an ellipsis.
- Do not add decorative quotation marks, star ratings, carousels or cards.

**Welcome messages** (`welcome-letter`, `welcome-signature`)

These follow the IChO pattern: a 4:5 portrait beside the letter on desktop, with the portrait above the letter on phones. The letter is set in `body-lg` ink on page grey, up to `measure-reading`, and signed with the name in `title` and the role in `caption`. The home page shows only two or three sentences, with a text link to the full message.

**Speakers and workshops** (`speaker-name`, `speaker-role`)

- Entries sit in a grid on white: three across on desktop, two on tablets and one on phones. Each has a 4:5 rectangular portrait, the name in `title` navy, the role in `body-md` ink, and the talk or workshop title in `caption`.
- Entries are separated by space, not boxes or borders.
- Until they are confirmed, the section shows the cinematic "coming soon" state: `display-xl` words with the accent line.

**Past meetings** (`timeline-year`, `timeline-entry`, `divider-light`)

There is one row per year, newest first, with hairlines between rows. Each row gives the year in `figure` navy, the edition and theme in `title`, the venue and number of delegates in `body-md`, and one 3:2 photograph where the archive has one, linking to that year's gallery.

**Gallery** (`photo`)

- Photographs run in full-bleed rows of two or three, with 4px gaps in the band colour and no rounding.
- Captions sit below the photo in `caption` when needed. Never use captions that appear only on hover.
- Selecting a photo opens it full screen on deep navy. There are no carousels on the page itself.

**Year seals** (`year-seal`)

The seals from the 10th anniversary to the current year sit in one row on light blue-grey, clipped to circles and shown in full colour, because they are the conference's own identity. They may shrink but never wrap onto two lines on desktop.

**Delegate map** (`map-dot`, `map-dot-lit`)

A dotted world map sits on white. Unlit countries use `map-base` and lit countries use blue text, with a pin and a 16% blue ring on London. Countries light up in order of distance from London as the map crosses the screen.

**Sponsor wall** (`sponsor-wall`)

Logos are greyscale (`filter: grayscale(1) contrast(1.05)`) at 78% opacity on white, under a centred `headline-lg` heading. They do not regain their colour on hover. Endorsing bodies (RCS England, RCSEd, the GMC and the BMA) are treated the same way.

**Forms** (`form-field`)

- Fields are white with ink text, a 1px `hairline-light` border and a 2px radius. The label sits above each field in `label` type and is never a placeholder alone.
- Each form has one solid submit button.
- Errors are a plain sentence below the field, connected with `aria-describedby`.

**Footer** (`site-footer`)

Page grey with a hairline above, in `caption` type and blue text. It holds "©2027 UCL Surgical Society", the email address, the Instagram link, and links to the privacy notice and ticket terms once those pages exist.

## Do's and Don'ts

**Do**

- Start every new section by choosing its band and checking that it differs from both neighbours.
- Let one photograph, one heading and one action carry a band.
- Keep the date and venue directly after the first view.
- Reach for the next band colour before reaching for a border, box or second button.
- Use the tokens above, and add new ones here before using them in CSS.
- Check every page at phone width and with reduced motion switched on before asking for review.

**Don't**

- Don't use gradients, glows, drop shadows or frosted glass.
- Don't use pill buttons, boxy cards or more than one solid button per view.
- Don't set headings in uniform semibold sans, use tracked capitals or add emojis.
- Don't write em dashes, exclamation marks or "it's not X, it's Y" copy.
- Don't invent testimonials or statistics, or round them up.
- Don't use stock or AI-generated photographs, or any photograph without consent from the people in it.
- Don't crowd the header.
- Don't show sponsor logos in colour.
- Don't autoplay video, run carousels, make numbers tick up, or start any motion without a scroll.
- Don't use the accent on a light surface or on more than one phrase per section.
- Don't put two bands of the same colour next to each other.
- Don't use the legacy indigo `#210790` in new work.

## Motion

Motion is always tied to scrolling, using CSS scroll-driven animations (`animation-timeline: view()` or a named `view-timeline`). Nothing runs on a timer.

| Name | What moves | Timing |
|---|---|---|
| Reveal (`.reveal_on_scroll`) | Fades in and rises 3rem | From `entry 10%` to `cover 40%` |
| Photo drift | The photograph moves from -10vh to +10vh inside its own section, so the frame never empties | The section's own view timeline |
| First view | The image drifts down 12vh and scales from 1.06 to 1.12; the content lifts 4rem and fades | Image: `exit 0%` to `exit 100%`. Content: `exit 0%` to `exit 70%` |
| Letter rise | The accent phrase's letters rise 0.45em and sharpen from an 8px blur, one after another | 0.9s each, 60ms stagger, `cubic-bezier(.2, .7, .2, 1)`, starting when the line is 60% visible and replaying when it re-enters from below. One phrase per page |
| Delegate map | Countries fade in, in order of distance from London | The map's own view timeline |

- Tie motion to the section it belongs to, never to the length of the whole page.
- Browsers without scroll timelines must show everything in its final state. A zero-length animation with `both` fill does this, so test in such a browser.
- With `prefers-reduced-motion: reduce`, every animation is switched off and elements sit in their final state.
- Older sections still use `.fade_in_while_scrolling`, a JavaScript fade. Move each one to `.reveal_on_scroll` when its section is rebuilt.
- **UCL East fly-in (planned):** the frames are scrubbed by scroll from an image sequence or a seekable video, never autoplayed. It needs a still poster frame for reduced motion and slow connections. If it is rendered in Google Earth Studio, keep Google's required attribution visible on the frames.

## Imagery

- Use real INUGSC photographs only, from the archive. Anyone identifiable must have given consent. Never use stock or AI-generated images.
- Use one photograph per band. Photos are full-bleed or fill a half, always rectangular, with no frames, borders or rounding.
- Photos keep their natural colour. When type sits on a photo, the flat navy scrim goes between them, and nothing else is added.
- Crops: 16:9 or taller for the first view, cover-fit for split halves, 4:5 for portraits and 3:2 for the gallery and past meetings.
- Format: AVIF, with WebP acceptable, at no more than 2400px on the long edge for full-bleed images. Lazy-load everything below the first view.
- Alt text describes the scene, for example "Delegates practising laparoscopic skills in the 2025 workshop".
- Archive photos live in `img/archive/<year>/`, named by subject, such as `img/archive/2025/suturing-workshop.avif`.

## Writing

- Use British English.
- Write dates as "30–31 January 2027", with an en dash between the days. Use en dashes only for ranges and never use em dashes.
- Write the venue as "Marshgate and One Pool Street, UCL East" (Marshgate, 7 Sidings Street, London E20 2AE).
- Write the conference as "INUGSC 2027" and the organiser as "UCL Surgical Society".
- Use numerals for statistics ("500+ delegates", "13 countries") and give the year of any figure that changes.
- Copy is plain and specific. No exclamation marks, emojis or "it's not X, it's Y" constructions.

## Responsive behaviour

| Width | Changes |
|---|---|
| Above 1340px | Full layout |
| 1180 to 1340px | Header links step down to 1.02rem with tighter gaps |
| 1001 to 1180px | Header links step down to 0.92rem and the lockup to 0.86rem |
| 1000px and below | The header collapses to a menu. Split sections stack with the photo first at 40vh. Details lists fold to one column. Bands use `section-mobile` and `gutter-mobile`. The first view's actions stack |

- Touch targets are at least 44px tall.
- Display sizes scale with the `clamp()` values in Typography. Never set a fixed pixel size for display type.
- Nothing on the page scrolls sideways at any width.

## Editing content

Speakers, workshops, sponsors, the committee and tickets live in plain text files (`speakers.txt`, `workshops.txt`, `sponsors.txt`, `people.txt` and `tickets.txt`), which the page reads in. See `README.md`.

## Working with this file

1. Read this file before writing any page or component, and build one component at a time.
2. Take every value from the tokens. If a value is missing, add it here first.
3. When unsure how to emphasise something, change the band before adding chrome.
4. Check the result against Don'ts, at phone width and with reduced motion on.
5. Run `npx @google/design.md lint DESIGN.md` after editing this file.

## Sources

- **Format:** Google Labs' DESIGN.md specification (alpha).
- **Page grammar:** adapted from the Apple analysis in VoltAgent's awesome-design-md collection (MIT licence). INUGSC replaces Apple's pill buttons, sans-serif display and product shadow with square corners, Libre Baskerville and no shadow at all.
- **Pairing of an editorial serif with a quiet sans:** from the Oura analysis in the same collection.
- **Content model:** from olympiad conference sites such as IChO's.
