# INUGSC design system

The rules every page of inugsc.org follows. Read this before changing the site, whether you are next year's committee or an AI tool, so the site stays one consistent thing.

## Identity

- **Seal:** `img/INUGSC_2027_logo.png`. Replace it each year with the new seal, and update `favicon.ico` to match.
- **Lockup:** the seal followed by "The International / Undergraduate Surgical / Conference, 2027" on three lines, in Libre Baskerville 500 with 0.07em letter spacing. This matches the Canva lockup.

## Colour

| Role | Value |
|---|---|
| Navy (header, panels) | `#1d1d5f` |
| Deep navy (cinematic sections) | `#0e0e33` |
| Indigo (legacy panels) | `#210790` |
| Blue text | `rgb(29, 18, 178)` |
| Light blue-grey (bands, venue) | `#e1e8f0` |
| Page | `#f6f6f6` |
| Accent, used sparingly | `#8fd0f5`, the light blue of the phoenix |

At most one accent phrase per section ("Coming soon.", "Submissions open soon.").

## Type

- **Display:** Libre Baskerville (self-hosted in `font/`, SIL Open Font Licence). Weight 400 for headings, 400 italic for small accents such as "16th Anniversary". Letter spacing 0.01 to 0.03em at large sizes.
- **Body:** Assistant (variable, 200 to 800). Use 300 for running text and 600 for labels.
- Headings are in sentence case. No tracked uppercase labels.

## Layout

- **First view:** full screen, with the date as the largest thing on the page, then the venue, then at most two actions. The background layer (`.hero_full_media`) is where the scroll-driven 3D fly-in of UCL East will go.
- **Date and venue:** directly after the first view, with the map. This always comes before anything else.
- **Split sections:** a text panel beside a photo that drifts as you scroll.
- **Facts:** set as definition lists (`dl.details_list`), never underlined labels.

## Buttons and links

- At most one solid button per view (white on dark, or navy on light).
- Secondary actions are underlined text links.
- Corner radius 2px.

## Motion

Motion is always tied to scrolling. Nothing autoplays.

- **Reveal:** fade in plus a 3rem rise, from `entry 10%` to `cover 40%` (`.reveal_on_scroll`).
- **Photos:** drift ±10vh across their own section (a view timeline, about 13% of scroll speed). Never tie motion to total page length.
- **Delegate map:** countries light up in order of distance from London.
- **Reduced motion:** always respect `prefers-reduced-motion`.

## Never

- Gradients, glows, drop shadows, pill buttons or icon sets
- Emojis, em dashes or exclamation marks
- "It's not X, it's Y" copy, fake testimonials or stock photos. Real INUGSC photographs only.
- Colourful sponsor logos. They are always greyscale.

## Wording

- **Dates:** "30–31 January 2027" (en dash).
- **Venue:** "Marshgate and One Pool Street, UCL East" (Marshgate, 7 Sidings Street, London E20 2AE).

## Editing content

Speakers, workshops, sponsors, committee and tickets live in plain text files (`speakers.txt`, `workshops.txt`, `sponsors.txt`, `people.txt`, `tickets.txt`). See `README.md`.
