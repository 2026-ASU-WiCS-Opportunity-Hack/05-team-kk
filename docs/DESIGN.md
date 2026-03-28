# WIAL Global Chapter Network — UI/UX Design System

A comprehensive design guide for both the admin dashboard and the public chapter websites. This document defines the visual identity, interaction patterns, component behavior, and experiential details of every surface a user touches.

---

## Table of Contents

- [1. Design Philosophy](#1-design-philosophy)
- [2. Visual Identity — "Rooted Growth"](#2-visual-identity--rooted-growth)
- [3. Color System](#3-color-system)
- [4. Typography](#4-typography)
- [5. Spacing and Layout Grid](#5-spacing-and-layout-grid)
- [6. Iconography](#6-iconography)
- [7. Imagery and Photography Direction](#7-imagery-and-photography-direction)
- [8. Motion and Animation](#8-motion-and-animation)
- [9. Component Design Language](#9-component-design-language)
- [10. Admin Dashboard — Screen-by-Screen Design](#10-admin-dashboard--screen-by-screen-design)
- [11. Chapter Website — Page-by-Page Design](#11-chapter-website--page-by-page-design)
- [12. Dark Mode and Light Mode](#12-dark-mode-and-light-mode)
- [13. Responsive Strategy](#13-responsive-strategy)
- [14. States — Loading, Empty, Error, Success](#14-states--loading-empty-error-success)
- [15. Accessibility](#15-accessibility)
- [16. Multi-Language Visual Considerations](#16-multi-language-visual-considerations)

---

## 1. Design Philosophy

This platform serves people across Nigeria, Vietnam, Brazil, Germany, Kenya, the Philippines, and twenty other countries. The design must honor that breadth without flattening it into a single bland corporate aesthetic. The guiding principle is **"Rooted Growth"** — a visual language that feels grounded in earth and human warmth, while reaching upward with clarity and optimism.

Three tenets govern every design decision:

**Warmth over sterility.** The platform is about human connection — coaches helping people learn through action. The interface should feel like a well-lit workshop, not a spreadsheet. Rounded corners, warm neutrals, generous whitespace, and real faces take priority over sharp edges and cold grays.

**Clarity over cleverness.** Chapter leads in Lagos and content creators in Hanoi are not designers. Every interaction must be self-evident. Labels over icons alone. Visible affordances over hidden gestures. One primary action per screen. When in doubt, be obvious.

**Respect over uniformity.** Each chapter's website carries that chapter's identity — their colors, their language, their story. The design system provides a strong structural skeleton that holds any cultural expression without imposing a single aesthetic. The bones are universal; the skin is local.

---

## 2. Visual Identity — "Rooted Growth"

The visual identity draws from two natural metaphors: earth and canopy. The earth represents foundation, warmth, trust, and the grounded nature of action learning. The canopy represents growth, reach, the branching of a global network into local chapters.

### The WIAL Logo — Non-Negotiable Constraint

The WIAL logo is fixed across the entire global network. No chapter has a variation. Every surface in this platform that displays the WIAL logo must be designed around it.

**Logo description.** The logo consists of two graphic elements side by side. On the left: four vertical bar-chart columns of ascending height in a saturated golden yellow (approximately #D4A900). On the right, overlapping the bars: a bold geometric "A" letterform constructed from angular strokes in a deep crimson red (approximately #C8102E). The wordmark below reads "WORLD INSTITUTE FOR" in very small regular weight, and "ACTION LEARNING" in larger bold weight — both in near-black (~#1A1A1A). The entire mark is designed to sit on a white or very light background. There is no official reversed/white variant distributed across existing chapter sites.

**Logo color extraction:**

| Element | Color Description | Approximate Hex |
|---|---|---|
| Bar chart icon | Saturated golden yellow | #D4A900 |
| "A" letterform | Deep crimson red | #C8102E |
| Wordmark text | Near-black | #1A1A1A |

**Critical design rule.** Every location in the platform where the WIAL logo appears must use a white or near-white surface behind it. The logo's dark wordmark and colored icon are designed exclusively for light backgrounds. Where the platform uses a dark background (the admin sidebar, dark mode surfaces), the logo must either be placed in a dedicated light-colored band within that surface, or a white-on-transparent reversed variant must be created and used. This is not optional — displaying the standard logo on a dark charcoal background makes the wordmark invisible.

### Personality Attributes

| Attribute | Expression |
|---|---|
| Warm | Golden amber tones, rounded shapes, soft shadows, photography-forward layouts |
| Professional | Clean type hierarchy, disciplined spacing, restrained animation, structured grids |
| Global | A dotted world map as a signature element, multilingual-ready layouts, culturally neutral iconography |
| Approachable | Generous padding, friendly sans-serif typography, conversational microcopy, inviting empty states |
| Trustworthy | Consistent visual patterns, predictable navigation, visible system status, no surprise interactions |

### Signature Visual Elements

**The Dot Map.** A stylized dotted world map appears as a background texture on the admin dashboard's global views and the hero section of the main marketing presence. Each chapter's location is marked with a softly pulsing dot in the accent color. Lines connecting the dots animate gently, suggesting the flow of knowledge between chapters. This is not decorative — it is the visual embodiment of the global network.

**The Growth Line.** A subtle curved line motif, inspired by a growing vine or river, appears as a decorative element on chapter websites. It runs along section dividers, deployment timelines, and the edges of hero sections. Each chapter can tint this line with their brand color. It is thin, never more than two pixels, and never competes with content.

**Warm Gradients.** Rather than flat solid backgrounds, key surfaces use subtle warm-to-neutral gradients. A hero section might shift from a barely-warm ivory at the top to pure white at the bottom. Cards in the admin dashboard have a whisper of warmth in their background that distinguishes them from the cooler page surface. These gradients are almost imperceptible — they are felt more than seen.

---

## 3. Color System

### 3.1 Admin Dashboard Palette

The admin dashboard uses a fixed palette that does not change per chapter. It must work equally well in light and dark modes, remain accessible at all contrast levels, and feel warm without being distracting during extended administrative sessions.

#### Light Mode

| Role | Color | Usage |
|---|---|---|
| Background | Warm ivory with a hint of cream | The base page surface. Not pure white — carries a barely-perceptible warmth that reduces eye strain |
| Surface | Clean white | Cards, panels, dialogs, dropdowns — elevated elements that sit above the background |
| Surface Muted | Warm stone-gray, very light | Table header rows, sidebar background, secondary panels, skeleton loader base |
| Primary | Deep teal (~#1A7A8A range, calibrated against WIAL USA chapter usage) | Primary buttons, active navigation indicators, focused input borders, links, selection highlights |
| Primary Hover | Slightly lighter teal | Hover state for primary buttons and links |
| Secondary | WIAL golden yellow (~#D4A900, the logo's own bar color) | Secondary actions, badges for chapter counts, accent borders, active tab indicators, featured items — this directly picks up the logo's first color element |
| Secondary Hover | Slightly darker golden yellow | Hover state for secondary elements |
| Accent | WIAL crimson (~#C8102E, the logo's own "A" color) | Deploy buttons, notification badges, high-emphasis CTAs — this directly picks up the logo's second color element. Visually distinct from the destructive red by context and usage |
| Text Primary | Deep warm charcoal | Headings and body text. Not pure black — a very dark warm gray that is easier on the eyes |
| Text Secondary | Medium warm gray | Supporting text, timestamps, helper text, placeholder text |
| Text Muted | Light warm gray | Disabled text, subtle labels, watermarks |
| Border | Soft warm gray | Card borders, input borders at rest, dividers, table rules |
| Border Subtle | Very light warm gray | Section dividers within cards, hairline separators |
| Destructive | Warm red | Delete actions, error states, destructive confirmations |
| Destructive Hover | Slightly darker warm red | Hover state for destructive actions |
| Success | Forest green | Success toasts, active status badges, completed deployment indicators |
| Warning | Deep amber | Warning banners, expiring invitation indicators, deployment in-progress |
| Info | Calm blue | Information toasts, help tooltips, onboarding highlights |

#### Dark Mode

The dark mode is not an inversion. It is a deliberate re-mapping where surfaces become deep warm grays (never pure black), text becomes warm off-whites, and accent colors shift slightly to maintain contrast and vibrancy against dark backgrounds.

| Role | Color | Usage |
|---|---|---|
| Background | Very deep warm charcoal | The base page surface. Carries a subtle warmth — not the cold blue-black of typical dark modes |
| Surface | Slightly lighter warm charcoal | Cards, panels, dialogs — one step above the background |
| Surface Muted | Medium-dark warm gray | Table headers, sidebar background, secondary panels |
| Primary | Bright teal, slightly desaturated from light mode | Retains visibility against dark backgrounds without neon harshness |
| Secondary | Bright golden yellow, slightly desaturated | Warm and visible on dark backgrounds without neon harshness |
| Accent | WIAL crimson, brightened slightly | Retains brand identity on dark surfaces |
| Text Primary | Warm off-white | Main readable text. Not pure white — reduces glare |
| Text Secondary | Medium light warm gray | Supporting text, dates, helper text |
| Border | Medium warm gray with low opacity | Subtle separation between elements without harsh lines |
| Destructive | Coral red, slightly lighter than light mode | Visible against dark backgrounds |
| Success | Bright mint green | Clearly visible success indicators |
| Warning | Bright amber | Warning states that read clearly on dark |

#### Semantic Color Tokens

Colors are referenced by their semantic purpose, never by raw values. Every component uses tokens like "primary," "surface," "text-secondary," and "destructive." This ensures that switching between light and dark mode is a single token re-mapping, and that no component accidentally uses a hardcoded color that breaks in the opposite theme.

### 3.2 Chapter Website Default Palette

Chapter websites receive their own brand colors from the database. However, the template ships with a thoughtfully designed default palette that serves as both the fallback and the starting recommendation for new chapters.

#### Default Chapter Colors

| Role | Color Description | Purpose |
|---|---|---|
| Brand Primary | Deep teal (~#1A7A8A) | Hero section backgrounds, primary buttons, heading accents, navigation hover states. The WIAL USA chapter already uses this teal as its hero background — using it as the default creates immediate coherence with real-world chapter usage |
| Brand Secondary | Teal, lighter shade (~#2E8E9E) | Hover states, secondary buttons, card accent borders |
| Brand Accent | WIAL golden yellow (~#D4A900) | Call-to-action buttons ("Join Now," "Contact Us"), highlighted tags, featured coach indicators — directly reflects the logo's bar color |

**Why not navy blue + orange:** Research of all existing WIAL chapter sites revealed the logo contains both crimson red (#C8102E) and golden yellow (#D4A900). A navy blue header background behind that logo creates a heavy, unresolved tricolor (red, gold, navy). An orange accent button alongside the logo's crimson creates two competing warm hues. The teal + golden-yellow default is harmonious — teal provides clear complementary contrast to the logo's warm red and yellow, while golden yellow as the accent directly mirrors the logo's own bar element.

**The header is always white.** Regardless of what a chapter sets as their brand primary, the website's top navigation header maintains a white background. This is a hard constraint, not a chapter choice. All existing WIAL sites — global (wial.org), USA (wial-usa.org), Nigeria (wialnigeria.org) — display the logo on a white header. The brand primary color is applied to the hero section below the header, section backgrounds, buttons, and footer — never to the header bar where the logo lives. This ensures the logo always renders in its intended context.

When chapters customize their colors, the template's design ensures the layout, contrast relationships, and visual hierarchy remain intact regardless of the colors chosen.

#### Derived Color Relationships

The template automatically derives additional colors from the three brand inputs:

- A very light tint of the primary (roughly five percent opacity over white) serves as the page section background alternation
- A darker shade of the primary (mixed toward black at twenty percent) serves as the footer background
- A lighter tint of the accent (at thirty percent opacity over white) serves as the tag and badge background
- Text on primary-colored surfaces is always white
- Text on accent-colored surfaces is determined by the accent's luminance — dark text on light accents, white text on dark accents

#### Neutral Foundation

Regardless of brand colors, the template's body text, borders, and background surfaces use the same warm neutral scale as the admin dashboard. This ensures readability is never compromised by an unfortunate brand color choice. Brand colors are applied to accents, headings, buttons, and decorative elements — never to body text or primary reading surfaces.

### 3.3 Certification Level Colors

Coach certification levels have a fixed color mapping used across both the admin dashboard and chapter websites. These colors are consistent and never overridden by chapter branding, so users build a cross-chapter visual vocabulary for certification levels.

| Level | Color | Metaphor |
|---|---|---|
| CALC (Certified Action Learning Coach) | Steady blue | Foundation — the beginning of the journey |
| SALC (Senior Action Learning Coach) | Growth green | Experience — growing into mastery |
| MALC (Master Action Learning Coach) | Rich amber | Expertise — a warm, authoritative presence |
| PALC (Principal Action Learning Coach) | Deep plum-purple | Distinction — rare and distinguished |

These colors appear in small certification badges next to coach names, as colored dots on coach cards, and as the tint of the individual coach profile's header accent.

---

## 4. Typography

### 4.1 Font Selection

The platform uses two font families, chosen for warmth, readability, multilingual support, and professional clarity.

**Headings: Lexend.** Lexend was specifically designed to improve reading proficiency. Its letterforms are optimized for readability, with generous spacing and open counters. It feels modern and friendly without being casual — exactly the tone for a professional learning organization. Available in weights from light to bold, allowing for nuanced heading hierarchies.

**Body: Source Sans 3.** Adobe's open-source humanist sans-serif provides excellent readability at body text sizes. Its character set supports Latin, Cyrillic, and Greek scripts. Its open, slightly rounded forms complement Lexend's warmth without competing. Available from extra-light to black, with true italics.

**Monospace (admin dashboard only): JetBrains Mono.** Used exclusively for deployment logs, build output, and any technical reference strings. Its ligatures and clean design make technical information scannable.

### 4.2 Type Scale

The type scale follows a musical progression — each size step is a ratio of the previous, creating a harmonious visual rhythm.

| Name | Size | Weight | Line Height | Letter Spacing | Usage |
|---|---|---|---|---|---|
| Display | 48 points | Lexend Bold | 1.1 | Tight, negative two percent | Chapter website hero headlines, admin dashboard welcome headings |
| Heading 1 | 36 points | Lexend Semibold | 1.2 | Tight, negative one percent | Page titles on both admin and chapter sites |
| Heading 2 | 28 points | Lexend Semibold | 1.25 | Normal | Section headings within pages |
| Heading 3 | 22 points | Lexend Medium | 1.3 | Normal | Card titles, subsection headings, dialog titles |
| Heading 4 | 18 points | Lexend Medium | 1.4 | Normal | Small group headings, sidebar section labels, table section titles |
| Body Large | 18 points | Source Sans 3 Regular | 1.6 | Normal | Lead paragraphs, chapter website body text, important descriptions |
| Body | 16 points | Source Sans 3 Regular | 1.6 | Normal | Standard body text, form labels, table cell content |
| Body Small | 14 points | Source Sans 3 Regular | 1.5 | Slight positive | Helper text, captions, timestamps, secondary information |
| Label | 14 points | Source Sans 3 Medium | 1.4 | Slight positive, five percent | Form labels, button text, navigation items, badge text |
| Caption | 12 points | Source Sans 3 Regular | 1.4 | Positive, two percent | Fine print, table footnotes, legal text. Never used for primary reading |
| Overline | 12 points | Lexend Semibold uppercase | 1.2 | Wide, ten percent | Category labels above sections ("COACHES," "CONTENT BLOCKS," "DEPLOYMENTS") |

### 4.3 Text Color Pairings

Headings use the primary text color at full strength. Body text uses the primary text color at ninety percent — a subtle reduction that prevents walls of text from feeling heavy. Secondary text (timestamps, helper text, metadata) uses the text-secondary token. Placeholder text uses text-muted. Links use the primary color and are underlined on hover, not at rest — except within body content where they are always underlined for discoverability.

### 4.4 Line Length and Measure

Body text never exceeds seventy-five characters per line. On the admin dashboard, content areas are constrained by card widths and table column widths that naturally enforce this. On chapter websites, the main content column maxes out at forty-two rem (approximately 672 pixels), centered on the page with comfortable side margins. This produces a reading experience similar to a well-typeset book — wide enough to feel open, narrow enough to read without eye strain.

### 4.5 Chapter Website Typography Override

When a chapter selects a custom font, that font replaces Lexend for headings on their website only. Source Sans 3 remains the body font to guarantee readability. The admin dashboard always uses Lexend and Source Sans 3, regardless of chapter settings.

The custom font is loaded from Google Fonts with only the weights the template actually uses (regular and bold for headings). A system font fallback stack ensures text is visible immediately while the custom font loads, with no invisible text flash.

### 4.6 Low-Bandwidth Font Strategy

For chapters in low-bandwidth regions (SRD requirement), the system font stack (`system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`) is recommended over custom Google Fonts. This saves 50-150KB per page load. Custom fonts are optional per chapter — the admin dashboard's font selector includes a "System Default (fastest)" option at the top. When system fonts are selected, no font download occurs and text renders instantly. The type scale, weights, and spacing remain the same — only the font face changes.

---

## 5. Spacing and Layout Grid

### 5.1 Spacing Scale

All spacing uses a base-four scale: every padding, margin, and gap value is a multiple of four pixels. This creates a rhythmic consistency that the eye perceives as "ordered" even subconsciously.

| Token | Value | Usage Examples |
|---|---|---|
| Space 1 | 4 pixels | Tight gaps within compact elements — between an icon and its label, between badge text and badge edge |
| Space 2 | 8 pixels | Default gap within components — between form input and helper text, between avatar and name |
| Space 3 | 12 pixels | Internal card padding (compact), gap between table rows, gap between tag chips |
| Space 4 | 16 pixels | Standard internal card padding, gap between form fields, sidebar item padding |
| Space 5 | 20 pixels | Gap between related card groups, section padding on mobile |
| Space 6 | 24 pixels | Gap between content sections within a page, card grid gap |
| Space 8 | 32 pixels | Major section separation, page-level vertical rhythm |
| Space 10 | 40 pixels | Large section breaks, hero section internal padding |
| Space 12 | 48 pixels | Page-level top and bottom padding |
| Space 16 | 64 pixels | Hero section vertical padding, major page breaks on desktop |
| Space 20 | 80 pixels | Chapter website section vertical spacing on desktop |
| Space 24 | 96 pixels | Maximum breathing room — hero bottom margin, footer top padding |

### 5.2 Admin Dashboard Layout

The admin dashboard uses a sidebar-plus-content layout.

**Sidebar width:** 260 pixels when expanded, 64 pixels when collapsed to icon rail. The transition between these states is animated over 200 milliseconds with an ease-out curve.

**Content area:** Fills the remaining horizontal space. Content within this area is constrained to a maximum width of 1280 pixels and centered horizontally when the viewport exceeds that width. This prevents content from stretching unreadably wide on ultrawide monitors.

**Header height:** 64 pixels. Fixed to the top of the viewport. Contains, from left to right: the hamburger button (visible only on mobile viewports to toggle the sidebar), the chapter context selector, a flexible spacer, the language picker, the theme toggle (sun/moon icon button), a notification bell icon (with a small red dot badge when there are unread items — new invitation acceptances, completed deployments, or failed deployments), and the user avatar menu. These elements are vertically centered within the header with 12 pixels of horizontal gap between them.

**Content padding:** 24 pixels on all sides at desktop widths. Reduces to 16 pixels on tablet and 12 pixels on mobile.

**Page structure:** Every admin page follows the same vertical rhythm — a page header area (title, description, primary action button), followed by the page content (tables, forms, cards). The page header has 32 pixels of bottom margin separating it from the content.

### 5.3 Chapter Website Layout

The chapter website uses a single-column, content-centered layout.

**Maximum content width:** 1200 pixels, centered with auto margins.

**Section pattern:** Sections alternate between full-bleed backgrounds (extending edge to edge) and contained content. For example, the hero section is full-bleed with a tinted background, but the text within it is constrained to the content width. The next section (featured coaches) has a white background and contained content. This alternation creates visual rhythm without heavy borders or separators.

**Vertical section spacing:** 80 pixels between major sections on desktop, 48 pixels on tablet, 32 pixels on mobile. This generous spacing gives each section room to breathe and prevents the page from feeling crammed.

**Content columns:** Within sections, content uses a twelve-column grid on desktop, collapsing to a single column on mobile. Common arrangements: six-and-six for text alongside an image, four-four-four for three coach cards in a row, three-three-three-three for four smaller feature cards.

### 5.4 Border Radius Scale

Rounded corners are central to the warm personality. A consistent radius scale prevents the randomness that makes interfaces feel unfinished.

| Token | Value | Usage |
|---|---|---|
| Radius Small | 4 pixels | Tags, small badges, inline status indicators |
| Radius Default | 8 pixels | Buttons, inputs, dropdowns, small interactive elements |
| Radius Medium | 12 pixels | Cards, panels, dialogs, larger containers |
| Radius Large | 16 pixels | Hero images, prominent featured cards, modal overlays on mobile |
| Radius Full | 9999 pixels (pill shape) | Status badges, certification badges, pill buttons, avatar circles |

The rule of thumb: the larger the element, the larger its radius. A button at 8 pixels. The card containing the button at 12 pixels. The page section containing the card has no radius (full-bleed sections) or 16 pixels (contained sections on the chapter website). This nesting of progressively larger radii creates a subtle "matryoshka" effect that feels cohesive.

### 5.5 Z-Index Layering System

A defined stacking order prevents z-index wars and ensures overlapping elements always appear in the correct visual priority.

| Layer | Z-Index Range | Elements |
|---|---|---|
| Base | 0 | Page content, cards, tables, static elements |
| Sticky | 10 | Sticky table headers, sticky filter bars, the chapter website header after scroll |
| Sidebar | 20 | The admin dashboard sidebar (both expanded and collapsed) |
| Header | 30 | The admin dashboard fixed header bar |
| Dropdown | 40 | Select dropdowns, context menus, popovers, tooltips, the color picker |
| Modal Scrim | 50 | The darkened backdrop behind dialogs and mobile sidebar |
| Modal Content | 60 | Dialog panels, confirmation overlays, the mobile sidebar sheet |
| Toast | 70 | Toast notifications — always above everything else |

No element outside this table should use a z-index value. If a new element needs layering, it must fit into one of these defined ranges.

---

## 6. Iconography

### 6.1 Icon Set

The platform uses Lucide icons exclusively. Lucide provides a consistent visual language: 24-by-24 pixel default size, 2-pixel stroke width, rounded caps and joins. The rounded style harmonizes with the platform's warm, approachable personality.

### 6.2 Icon Usage Rules

Icons always appear alongside text labels in navigation — never alone. The only exceptions are the theme toggle (sun/moon icons are universally recognized) and the user avatar menu trigger. Every icon-only button includes a tooltip and an accessible label.

Icon sizes follow three tiers:

| Context | Size | Example |
|---|---|---|
| Navigation and sidebar | 20 by 20 pixels | Menu items, breadcrumb separators |
| Inline with text | 16 by 16 pixels | Status indicators next to labels, dropdown arrows |
| Feature illustrations | 32 by 32 pixels | Empty state illustrations, onboarding step icons |

Icons inherit the text color of their context. A navigation item's icon matches its label color. A button's icon matches its button text. Icons never have independent colors except in status contexts: green checkmark for success, red circle-x for error, amber triangle for warning.

### 6.3 No Emojis

Emojis are never used as functional icons anywhere in the platform. They render inconsistently across operating systems, cannot be styled with color tokens, and look unprofessional in an administrative interface. All visual indicators use Lucide SVG icons, which scale crisply, respond to theme changes, and maintain visual consistency across every device and browser.

---

## 7. Imagery and Photography Direction

### 7.1 Photography Style

When photography appears (coach profile photos, chapter hero images, about page images), it should follow a consistent editorial direction:

**Warm color grading.** Photos should feel warm — not orange-tinted, but gently warm. Slight lift in the shadows, natural skin tones, warm highlights. The effect should feel like "golden hour" — inviting and human.

**Real people in real settings.** Stock photos of people in suits shaking hands in glass offices are explicitly banned. The platform represents a global learning community. Photos should show people in workshops, in conversation circles, in diverse settings — a facilitator at a whiteboard in Nairobi, a coaching circle under a veranda in Manila, a group discussion in a São Paulo conference room.

**Environmental diversity.** The imagery should implicitly communicate the platform's global reach. Not every photo needs to show a different country, but the overall collection should feel international — varied architecture, varied clothing, varied skin tones, varied settings.

**Faces forward.** Coach profile photos should be well-lit headshots or upper-body portraits where the person's face is clearly visible and they are looking toward the camera or slightly off-camera. Not silhouettes, not extreme candids, not group shots. The coach is the subject.

### 7.2 Fallback Avatars

When a coach has no photo, the system generates an avatar from their initials. The avatar uses the certification level color as its background (blue for CALC, green for SALC, amber for MALC, plum for PALC) with white text. The initials use Lexend Bold at a size proportional to the avatar circle. This means even the fallback avatars carry useful information — a viewer can glance at the color and know the certification level.

### 7.3 Chapter Logo Treatment

Chapter logos — and the global WIAL logo — appear in the website header and the admin dashboard's chapter selector.

**On the chapter website header** (always white background): the chapter's uploaded logo is displayed at a maximum height of 40 pixels, maintaining its natural aspect ratio. Because the header is always white, any logo renders exactly as its designer intended. If no logo is uploaded, the chapter name renders in Lexend Semibold at Heading 4 size in the chapter's primary brand color.

**On the admin dashboard** (the sidebar is dark, the header bar is light): the WIAL global logo appears in the admin header bar, which uses a white or very light surface background. The logo is never placed directly on the dark charcoal sidebar background — the dark sidebar is only the navigation item zone below the logo area. The top of the sidebar (the logo/brand zone) uses a distinct, slightly lighter treatment or a contained white-background panel to ensure the standard logo renders correctly.

**Reversed logo variant**: If WIAL provides an official all-white version of the logo (white icon elements and wordmark), it can be used on fully dark surfaces like a dark-mode admin header. Until an official white variant is confirmed, the logo placement follows the light-background rule above. No artificial color manipulation (CSS filters, white overlays) is applied to the logo — it is always displayed as-is on an appropriate surface.

**Chapter selector in admin header**: Each chapter is identified by its name text and a small colored status dot — not by a tiny logo thumbnail. At the small scale of the chapter selector dropdown, logos would be unreadable and inconsistent. The chapter's logo only appears at full size in the chapter website's header, where its size and context are appropriate.

---

## 8. Motion and Animation

### 8.1 Animation Philosophy

Animation serves comprehension, not decoration. Every animation answers the question "where did this come from?" or "what just happened?" If an animation does neither, it is removed.

The overall motion personality is **calm and deliberate** — like a door opening smoothly, not like a pinball machine. This is a professional tool used daily by people managing real organizations. Animation should reduce cognitive load, not add spectacle.

### 8.2 Timing and Easing

| Category | Duration | Easing | Examples |
|---|---|---|---|
| Micro-interactions | 150 milliseconds | Ease-out | Button hover color change, checkbox toggle, tooltip appear |
| Component transitions | 200 milliseconds | Ease-out | Sidebar collapse/expand, dropdown open, tab switch content fade |
| Page-level transitions | 300 milliseconds | Ease-in-out | Page content fade-in on navigation, dialog enter/exit |
| Emphasis animations | 400 milliseconds | Spring (light damping) | Deployment status badge change, success checkmark draw, notification badge bounce |
| Decorative (chapter websites only) | 600 to 1000 milliseconds | Gentle ease | Hero text fade-up on page load, dot map pulse, growth line draw |

Exit animations are always faster than enter animations — approximately seventy percent of the enter duration. A dialog that takes 300 milliseconds to enter takes 200 milliseconds to exit. This makes dismissals feel snappy and responsive.

### 8.3 Specific Animation Patterns

**Page load on chapter websites.** Content fades up from twenty pixels below its final position while simultaneously fading from transparent to opaque. Elements stagger their entrance: the heading appears first, then the subheading 80 milliseconds later, then the body text 80 milliseconds after that, then the call-to-action button 80 milliseconds after that. This "blur fade" stagger creates a pleasant reading rhythm without being slow — the entire sequence completes in under 600 milliseconds.

**Dot map pulse.** On the admin dashboard's global overview and the platform's hero section, chapter location dots pulse gently. Each dot scales from one hundred percent to one hundred and twenty percent and back over a 2-second cycle, with each dot offset by a random amount so they do not all pulse in unison. The connecting lines between dots draw on with a slow animation when the map first becomes visible in the viewport.

**Number counters.** Dashboard statistics (total chapters, total coaches, active deployments) animate from zero to their actual value over 800 milliseconds using a deceleration curve (fast at the start, slowing at the end). This "number ticker" effect draws the eye to the data and creates a sense of vitality. The counters only animate the first time they become visible — not on every re-render.

**Deployment status transitions.** When a deployment changes status (queued to building, building to deploying, deploying to done), the status badge performs a brief scale-up to one hundred and ten percent and back, and the color transitions smoothly to the new status color over 300 milliseconds. A successfully completed deployment also triggers a subtle green checkmark that draws itself in a single stroke over 400 milliseconds.

**Toast notifications.** Toasts slide in from the top-right corner, translating horizontally from off-screen to their final position over 250 milliseconds with an ease-out curve. They auto-dismiss after 4 seconds by fading out over 200 milliseconds. Success toasts have a brief green flash on the left edge. Error toasts have a red left edge that remains visible for the toast's duration.

**Sidebar collapse.** The sidebar's width transitions over 200 milliseconds. Navigation labels cross-fade — they fade out as the sidebar narrows and are replaced by icon-only tooltips. The content area smoothly expands to fill the freed space.

### 8.4 Reduced Motion

When the user's operating system signals a preference for reduced motion, all animations are replaced with instant state changes. No fades, no slides, no number counters rolling up — elements simply appear in their final state. The only motion that remains is essential functional animation: a loading spinner continues to spin (without it, the user would not know the system is working). Everything else becomes immediate.

---

## 9. Component Design Language

This section defines the visual character of recurring UI components across the platform. These are stylistic specifications — how components look and feel, not their technical implementation.

### 9.1 Buttons

**Primary button.** Solid background in the primary teal color. White text. Rounded corners at 8 pixels. Vertical padding of 10 pixels, horizontal padding of 20 pixels. On hover, the background lightens slightly and the button lifts with a subtle shadow increase (elevation rises). On press, the button compresses slightly (scales to ninety-eight percent) and the shadow decreases. Disabled state: reduced opacity to forty percent, no cursor change, no hover effect.

**Secondary button.** Outlined with a 1.5-pixel border in the primary color. Transparent background. Primary-colored text. On hover, the background fills with a five-percent-opacity wash of the primary color. Same corner radius and padding as primary.

**Ghost button.** No border, no background. Primary-colored text. On hover, a very subtle background appears (three-percent-opacity primary). Used for less prominent actions: "Cancel," "Skip," "View All."

**Destructive button.** Same shape as primary but in the destructive red color. Used exclusively for irreversible or high-consequence actions: revoking invitations, archiving chapters. Never placed next to a primary button without at least 24 pixels of separation and a clear visual weight difference.

**Button with icon.** Icons sit to the left of button text with an 8-pixel gap. The icon is 16 by 16 pixels regardless of button size. Icons in buttons always match the button text color.

**Button sizes.** Small: 32 pixels tall, 14-point text, 8 pixels horizontal padding on each side beyond the label. Default: 40 pixels tall, 14-point text, 20 pixels horizontal padding. Large: 48 pixels tall, 16-point text, 24 pixels horizontal padding. The large size is used only for primary page-level calls to action.

### 9.2 Cards

Cards are the primary container for grouped information throughout the platform.

**Surface.** White background in light mode, elevated surface color in dark mode. A 1-pixel border in the border token color. Border radius of 12 pixels — noticeably rounded, contributing to the warm personality. A very subtle shadow: offset zero vertically, one pixel of blur, at two-percent opacity black. This shadow is so gentle it is almost invisible — but its absence would make cards feel flat and lifeless.

**Hover (when interactive).** On hoverable cards (coach cards in the directory, chapter cards in the admin list), the shadow deepens slightly on hover (four pixels of blur, five-percent opacity) and the border color transitions to the secondary color. The transition takes 150 milliseconds.

**Internal structure.** Cards have 20 pixels of internal padding on all sides. Content within a card follows the standard spacing scale — 12 pixels between a card title and its description, 16 pixels between the description and the card's action area. A horizontal divider (1-pixel line in border-subtle color) separates the card body from the card footer if one exists.

**Card footer.** Contains action buttons or metadata. Background is surface-muted (a barely-tinted gray). Bottom corners match the card's border radius. Padding is 16 pixels horizontal, 12 pixels vertical.

### 9.3 Tables

Tables display lists of data throughout the admin dashboard: chapters, coaches, users, content blocks, deployments, invitations.

**Header row.** Background in surface-muted. Text in Overline style (12-point Lexend Semibold uppercase, wide letter-spacing). Sticky to the top of the scrollable area so column labels remain visible during scrolling. Bottom border in the standard border color.

**Data rows.** Alternating row backgrounds are not used — they create visual noise. Instead, rows are separated by a single 1-pixel border in border-subtle. Vertical padding of 14 pixels per row, horizontal padding of 16 pixels per cell. Text is Body size (16-point).

**Hover state.** The hovered row receives a five-percent-opacity wash of the primary color. The transition is 100 milliseconds.

**Selected state.** If rows are selectable, selected rows have a ten-percent-opacity wash of the primary color and a 2-pixel left border in the primary color. The left border is the primary visual indicator — it is visible even to users who cannot perceive the background color change.

**Responsive behavior.** On viewports below 768 pixels, tables transform into a card-stack layout. Each row becomes an independent card. Column headers become inline labels preceding each value. The card layout uses the same visual language as other cards — same border radius, same padding, same shadow.

### 9.4 Form Inputs

**Text inputs.** 40 pixels tall. 1-pixel border in the border color. Border radius of 8 pixels. 12 pixels of horizontal padding. Placeholder text in the text-muted color. On focus, the border transitions to the primary color and gains a 3-pixel ring in the primary color at twenty-percent opacity. The transition takes 150 milliseconds. The label sits above the input with 6 pixels of gap.

**Textarea.** Same styling as text inputs but with a minimum height of 100 pixels. Resizable vertically only. The WYSIWYG rich text editor (for content blocks) has a toolbar above the editing area — the toolbar uses a surface-muted background, 1-pixel bottom border, and icon buttons with 8-pixel spacing between them. The editing area itself uses the same styling as a textarea.

**Select dropdowns.** Same height and border styling as text inputs. A chevron-down icon in text-secondary color sits at the right edge. The dropdown panel appears below with a 4-pixel gap, surface-colored background, 1-pixel border, 8-pixel border radius, and a shadow slightly deeper than the card shadow (8 pixels of blur, eight-percent opacity).

**File upload.** A dashed-border box (2-pixel dashed border in the border color) with 32 pixels of padding. An upload-cloud icon centered above the text "Drag and drop or click to upload." On hover, the border color transitions to primary and the background gains a two-percent primary wash. When a file is uploaded, a thumbnail preview (for images) or a file-name chip replaces the upload prompt.

**Validation states.** Error: the input border turns destructive red, a small alert-circle icon appears at the right edge of the input, and the error message appears below the input in destructive color at Body Small size. Success: a check-circle icon appears at the right edge in success green, with no other changes. These icons are 16 by 16 pixels and appear with a quick fade-in over 150 milliseconds.

**Required indicator.** An asterisk in the destructive color appears after the label text, with 4 pixels of gap.

### 9.5 Badges and Tags

**Status badges.** Small pill-shaped indicators with 4 pixels of vertical padding, 10 pixels of horizontal padding, and a full border radius (completely rounded ends). The background is a fifteen-percent-opacity wash of the status color. The text is the full-strength status color. Font is Label size (14-point Source Sans 3 Medium).

| Status | Background Tint | Text Color | Used For |
|---|---|---|---|
| Active / Live / Done | Success green tint | Success green | Active chapters, live deployments, accepted invitations |
| Pending / Building / Queued | Warning amber tint | Warning amber | Pending invitations, builds in progress |
| Suspended / Failed | Destructive red tint | Destructive red | Suspended chapters, failed deployments |
| Archived / Expired | Muted gray tint | Text-muted gray | Archived chapters, expired invitations |
| Draft / Inactive | Border-subtle tint | Text-secondary | Inactive coaches, draft content |

**Certification badges.** Use the certification level colors defined in section 3.3. Same pill shape as status badges but with a slight visual distinction — a solid 1.5-pixel left border in the certification color, giving them a "flag" appearance that distinguishes them from status badges at a glance.

**Specialization tags.** Rounded rectangles (6-pixel border radius) with 4 pixels of vertical padding, 8 pixels of horizontal padding. Background in surface-muted. Text in text-secondary at Body Small size. When many tags are present, the first three are shown inline and the rest are collapsed behind a "+N more" indicator that expands on click.

### 9.6 Dialogs (Modals)

Dialogs overlay the screen with a scrim (black at forty-percent opacity) that dims the background. The dialog itself is a card-styled panel centered vertically and horizontally, with a maximum width of 520 pixels for standard dialogs and 680 pixels for wide dialogs (like the content editor preview).

**Enter animation.** The scrim fades in over 200 milliseconds. The dialog scales from ninety-five percent to one hundred percent while fading in over 250 milliseconds with a subtle spring easing.

**Exit animation.** The dialog fades out and scales down to ninety-eight percent over 150 milliseconds. The scrim fades out over 200 milliseconds.

**Structure.** A dialog has three zones: header (title text in Heading 3, optional subtitle, and an X close button in the top-right corner), body (scrollable if content exceeds the viewport), and footer (action buttons right-aligned, with the primary action on the right and the cancel action on the left). The footer has a top border and surface-muted background.

**Destructive confirmation dialogs.** When a dialog asks the user to confirm a destructive action (archiving a chapter, revoking an invitation), the dialog description explicitly names what will happen. The confirm button is a destructive button. The dialog does not auto-focus the confirm button — it auto-focuses the cancel button, so the safe action is the default.

### 9.7 Sidebar Navigation

The admin dashboard's sidebar is a core navigational element used in every session.

**Expanded state.** 260 pixels wide. Deep warm charcoal background (same in both light and dark mode — the sidebar is always dark to create a strong visual anchor). Text and icons in warm off-white.

The top of the sidebar contains a **logo zone**: a 64-pixel-tall band with a white or very light surface background (not the dark charcoal of the rest of the sidebar). This light band creates the correct background for the WIAL logo, whose dark wordmark and colored icon are designed exclusively for light backgrounds. The logo is centered vertically in this band with 16 pixels of horizontal padding. A thin 1-pixel separator in the charcoal color separates the light logo zone from the dark navigation items below. This "light header, dark navigation" two-zone treatment is both functionally correct (logo legibility) and visually distinctive — it resembles the way a physical office might have a bright reception desk within an otherwise wood-paneled room.

**Navigation items.** 40 pixels tall. 12 pixels of horizontal padding. An icon (20 by 20 pixels) followed by the label text (Label size) with 12 pixels of gap. Items have 2 pixels of vertical gap between them.

**Active item.** The active item's background is a ten-percent-opacity wash of white. A 3-pixel-wide vertical bar in the WIAL golden yellow (~#D4A900, the secondary color) appears on the left edge of the active item. The icon and text brighten to full white.

**Hover state.** A five-percent-opacity wash of white appears behind the item over 100 milliseconds. The text and icon brighten slightly.

**Section dividers.** Sidebar items are grouped by function (main navigation, chapter-specific management, settings). Groups are separated by a thin horizontal line in fifteen-percent-opacity white with 8 pixels of vertical margin above and below.

**Collapsed state (icon rail).** 64 pixels wide. Only the icons remain visible, centered in the rail. The active indicator bar persists. Hovering an icon shows a tooltip with the label text, appearing to the right of the rail with 8 pixels of gap.

**Mobile behavior.** Below 768 pixels, the sidebar becomes a slide-out sheet triggered by the hamburger button in the header. The sheet slides in from the left with the same scrim overlay as dialogs. It can be dismissed by tapping the scrim, swiping left, or tapping the X button.

### 9.8 Toast Notifications

Toasts appear in the top-right corner of the viewport, stacking vertically with 8 pixels between them. Maximum width of 400 pixels.

**Structure.** A left color bar (4 pixels wide, full height) in the toast's semantic color. An icon (20 by 20 pixels) matching the semantic color. The message text in Body size. An optional close button (X icon) at the right edge.

| Type | Left Bar Color | Icon |
|---|---|---|
| Success | Success green | Circle-check |
| Error | Destructive red | Circle-x |
| Warning | Warning amber | Triangle-alert |
| Info | Info blue | Info |

Toasts auto-dismiss after 4 seconds. Error toasts are an exception — they persist until manually dismissed, because error information may need to be read carefully or referenced.

### 9.9 Breadcrumbs

Breadcrumbs appear on all admin pages below the page header to show the user's location in the navigation hierarchy.

**Structure.** A horizontal row of text links separated by chevron-right icons (12 by 12 pixels, text-muted color). Each breadcrumb segment is in Body Small size. All segments except the last are links in the primary color. The last segment (the current page) is plain text in text-primary with no link behavior. The breadcrumb row has 8 pixels of bottom margin separating it from the page title.

**Examples by depth.** A one-level page: "Dashboard" (no breadcrumb shown — the sidebar active state is sufficient). A two-level page: "Chapters" (link) > "WIAL Nigeria" (current). A three-level page: "Content" (link) > "Landing Page" (link) > "Hero Title" (current).

**Overflow on mobile.** If the breadcrumb trail is too long for the viewport, only the last two segments are shown. The earlier segments are collapsed into an ellipsis button (three dots) that expands the full trail on tap.

### 9.10 Pagination

When tables display more than 20 rows, pagination controls appear below the table.

**Layout.** Centered below the table with 24 pixels of top margin. The controls consist of: a "Previous" ghost button with a left-arrow icon, a row of page number buttons, and a "Next" ghost button with a right-arrow icon.

**Page number buttons.** Small square buttons (36 by 36 pixels) with the page number centered. The current page button has a primary-colored background with white text. Other page buttons have a transparent background with text-secondary text and a subtle hover state. If there are more than seven pages, the display shows: first page, an ellipsis, pages surrounding the current page (one before and one after), an ellipsis, and the last page.

**Per-page selector.** To the left of the pagination buttons, a small dropdown reads "20 per page" with options for 10, 20, 50. Changing this value resets to page one and reloads the table.

**Results summary.** To the right of the pagination buttons, a text label reads "Showing 21–40 of 127" in Body Small, text-secondary.

### 9.11 Dropdown Menu Items

Dropdown menus (context menus triggered by three-dot buttons, select dropdowns, the chapter selector) share a consistent item design.

**Item dimensions.** Each item is 36 pixels tall with 12 pixels of horizontal padding. Items have no gap between them — they stack directly.

**Item content.** An optional icon (16 by 16 pixels) on the left, the label text in Body size, and an optional right-side element (a checkmark for the selected item, a keyboard shortcut hint, or a badge). The icon and label have 8 pixels of gap.

**Hover state.** The hovered item receives a surface-muted background fill over 100 milliseconds. The text remains the same color — no color change on hover, just the background fill.

**Active/Selected state.** The currently selected item (in single-select dropdowns) shows a checkmark icon on the right in the primary color. The item text also shifts to primary color.

**Destructive items.** Menu items that trigger destructive actions (like "Archive Chapter" or "Remove") use the destructive red color for both icon and text. They are visually separated from other items by a 1-pixel divider above them and positioned at the bottom of the menu, creating both visual and spatial distance from safe actions.

**Disabled items.** Grayed-out at forty-percent opacity with no hover state and no cursor change. A tooltip on hover explains why the item is disabled (for example, "Deployment is already in progress").

### 9.12 The Chapter Context Selector

A specialized dropdown in the admin dashboard header that lets multi-chapter users switch between chapters.

**Collapsed state.** Shows the currently selected chapter's name (truncated with an ellipsis if longer than 24 characters) and a small colored dot indicating the chapter's status. A chevron-down icon indicates it is expandable.

**Expanded state.** A dropdown panel (same styling as select dropdowns but wider, up to 320 pixels) showing all chapters the user has access to. Each chapter row shows: a status dot, the chapter name, and a subtle label for the user's role in that chapter ("Lead," "Creator," "Coach"). For super admins, a "Global" option appears at the top, separated from the chapter list by a divider. The current selection has a check icon on the right.

### 9.13 User Avatar Menu

The rightmost element in the admin header. A circular avatar (32 pixels) showing the user's profile photo or initials fallback (using the first letter of the first name and last name, on a surface-muted background with text-primary text). Clicking the avatar opens a dropdown menu below and to the left.

**Menu contents:** The top section shows the user's full name in Label weight, their email in Body Small text-secondary, and their primary role as a small badge. Below a divider: "My Profile" (links to profile settings), "Sign Out" (destructive item, positioned at the bottom with a divider above it).

### 9.14 Branding Preview Panel

A live-updating miniature mockup used on the chapter create/edit and chapter settings pages. It shows how the chapter's chosen colors and font will look on the actual website.

**Structure.** A card with a fixed height of 400 pixels on desktop, scrollable if content overflows. Inside: a mini header bar (40 pixels tall, using the chapter's primary color as background, with a white text placeholder for the logo and three small navigation labels), a mini hero section (the chapter name in the selected heading font over a five-percent-opacity primary background), a mini coach card (a small circle for the avatar, the certification badge in its level color, two lines of placeholder text), and a mini button (pill-shaped, in the accent color). Every element updates the instant the user changes a color or font value — no save required.

**Visual treatment.** The preview panel itself has a subtle inset shadow (as if it is recessed into the page) and a 1-pixel border, distinguishing it from other cards. A small "Preview" label in Caption size sits above the panel.

**Mobile behavior.** On viewports below 1024 pixels, the preview panel moves below the form inputs and becomes full-width. It is collapsed by default behind a "Show Preview" toggle button to save vertical space.

Switching chapters causes a brief page transition: the content area fades out over 150 milliseconds, the new chapter's data loads, and the content fades back in over 200 milliseconds. If the load takes longer than 300 milliseconds, the content area shows skeleton loaders instead of the old content.

---

## 10. Admin Dashboard — Screen-by-Screen Design

### 10.1 Login Page

A centered layout with no sidebar and no header navigation. The background is the warm ivory, with a very subtle radial gradient of the primary teal at three-percent opacity emanating from the center, giving the page a gentle warm focus.

The login card is centered both horizontally and vertically. It is 420 pixels wide on desktop, full-width with 16-pixel horizontal margins on mobile. It contains:

- The WIAL logo or wordmark at the top, centered, with 32 pixels of bottom margin
- A welcoming headline: "Sign in to your account" in Heading 3
- A brief subtext in text-secondary: "Manage your chapter, coaches, and content"
- The email input field with label
- The password input field with label, including a show/hide toggle icon at the right edge
- A primary button spanning the full card width reading "Sign In"
- Below the button, a single line of text-secondary text: "Received an invitation? Check your email for the signup link."

**Error handling.** If credentials are wrong, the card does not shake or flash. A toast appears in the top-right with the error message. The password field is cleared. The email field retains its value and gains focus. This is calm, not punishing.

**Loading state.** While authentication is in progress, the "Sign In" button shows a small spinner replacing its text. The button is disabled. The inputs remain visible but non-interactive (reduced opacity).

### 10.2 Signup Page (Invitation-Based)

Same centered layout as the login page. The card is slightly taller to accommodate more fields.

**Token validation state.** Before the form appears, the card shows a centered spinner and the text "Validating your invitation..." in text-secondary. If the token is invalid or expired, the spinner is replaced by a cautionary illustration (an hourglass icon at 48 pixels in the warning color) and the text "This invitation has expired or is no longer valid." Below, a line reads "Please contact the person who invited you for a new link."

**Valid invitation state.** The card shows:

- A welcome message: "You've been invited to join [Chapter Name]" in Heading 3
- A subtitle indicating the role: "as a [Role Name]" in text-secondary with a role badge
- The invitee's email, displayed as read-only text (not an input) with a subtle muted background
- A "Full Name" input field
- A "Password" input field with a show/hide toggle
- A "Confirm Password" input field
- A primary button reading "Create Account"
- A "learn more" link to information about WIAL, opening in a new tab

**Password requirements.** Below the password field, a small checklist shows password requirements. Each requirement starts unchecked (muted text, circle icon). As the user types, met requirements animate to success green with a filled check-circle icon fading in over 150 milliseconds. This provides real-time positive feedback without disruptive error messages.

### 10.3 Dashboard Overview (Super Admin — Global View)

The first screen a super admin sees after login. It provides a bird's-eye view of the entire platform.

**Top section: Stats strip.** A horizontal row of four stat cards, equal width, spanning the content area. Each stat card shows:

- An overline label ("TOTAL CHAPTERS," "ACTIVE COACHES," "PENDING INVITATIONS," "RECENT DEPLOYMENTS")
- A large number in Display size, animated with the number ticker effect on first load
- A subtle trend indicator: an arrow (up or down) with a percentage change and the comparison period ("vs. last month") in Caption size, text-secondary

The stat cards have a slightly different visual treatment from standard cards — they have a very subtle top border (3 pixels) in a unique color per stat: teal for chapters, green for coaches, golden yellow for invitations, WIAL crimson for deployments. This color coding builds a visual association that carries throughout the dashboard.

**Middle section: Global dot map.** A wide card spanning the full content width, containing the animated dotted world map. Chapter locations are marked with pulsing dots. Each dot has a tooltip on hover showing the chapter name, coach count, and status. Below the map, a horizontal scrolling row of small chapter "chips" — each showing the chapter name and a status dot — acts as a legend and quick navigation. Clicking a chip navigates to that chapter's detail view.

**Bottom section: Two-column layout.** The left column (sixty percent width) shows a "Recent Activity" feed — a vertical list of the most recent actions across the platform (invitation sent, chapter created, deployment completed, coach profile updated). Each activity item shows a small icon identifying the action type, a human-readable description ("Maria Santos invited a new coach to WIAL Brazil"), a relative timestamp ("3 hours ago"), and the relevant chapter's name as a clickable link. The right column (forty percent width) shows "Deployments In Progress" — a live-updating list of any chapters currently being built or deployed, each showing a progress indicator and the deployment status badge.

### 10.4 Dashboard Overview (Chapter Lead — Chapter View)

A focused view showing only the selected chapter's state.

**Top section: Stats strip.** Four stat cards, same visual treatment as the global view but with chapter-specific data: coach count, content block count, last deployment status (with a timestamp), and pending invitations count.

**Middle section: Quick Actions bento grid.** Instead of the world map, chapter leads see a bento-style grid of quick action cards. These are larger, more visual cards that serve as shortcuts to common tasks:

- "Manage Coaches" — shows a small count badge and the three most recent coach avatars stacked in a row
- "Edit Content" — shows a mini preview of the last-edited content block's title and timestamp
- "Deploy Website" — shows the current deployment status with a prominent "Deploy Now" button if the chapter has pending changes
- "Invite Team" — shows the count of active team members and a "Send Invite" action

The bento grid uses a two-by-two layout on desktop, single column on mobile. Each card has a distinctive left-edge color matching the stat card color coding scheme.

**Bottom section: Activity feed.** A single-column feed of recent activity within this chapter only. Same visual treatment as the global feed but filtered to one chapter.

### 10.5 Dashboard Overview (Content Creator and Coach)

A simplified dashboard. Content creators see a welcome message, a shortcut card to the content editing section, and a read-only view of recent content changes in their chapter. Coaches see a welcome message, a prominent "Edit My Profile" card showing their current profile completeness as a ring chart (percentage of fields filled out), and a read-only view of their chapter's information.

The profile completeness ring uses the certification level color as its fill and surface-muted as its track. Below the ring, a list of incomplete fields (like missing bio, missing photo, missing specializations) appears as clickable suggestions that link directly to the relevant section of the profile editor.

### 10.6 Chapter Management — List Page (Super Admin)

A full-width table showing all chapters. The page header reads "Chapters" in Heading 1, with a "Create Chapter" primary button at the right edge.

**Filter bar above the table.** A search input (magnifying glass icon, placeholder "Search chapters..."), a status filter dropdown (All, Active, Suspended, Archived), and a sort dropdown (Name A-Z, Name Z-A, Newest, Oldest). Filters are pill-shaped and sit in a horizontal row with 8 pixels of gap.

**Table columns.** A small colored status dot (no text, just the dot), chapter name (linked, primary text weight), slug, subdomain, default language (shown as a small flag icon or language code), coach count, last deployed (relative timestamp), and an actions column with a three-dot menu.

**Row actions menu.** Clicking the three-dot icon opens a dropdown with: "View Chapter," "Edit Chapter," "Trigger Deploy" (grayed out if not provisioned), a divider, then "Suspend Chapter" or "Activate Chapter" (depending on current status), and "Archive Chapter" (in the destructive text color). Archiving triggers a confirmation dialog.

**Empty state.** If no chapters exist (fresh installation), the table area is replaced by a centered empty state illustration: a simple line drawing of a globe with sprouting branches, the text "No chapters yet" in Heading 3, a description "Create your first chapter to start building the global network" in Body, and a "Create Chapter" primary button.

### 10.7 Chapter Management — Create and Edit Page

A form page. The page header reads "Create New Chapter" (or "Edit [Chapter Name]"). Below the header, a breadcrumb trail: "Chapters" (linked) followed by a chevron followed by "Create" or the chapter name.

The form is organized into collapsible sections (accordion-style), each with a section heading and a chevron toggle. Sections start expanded for creation and can be collapsed on the edit page.

**Section: Basic Information.** Chapter name input, slug input (auto-generated from name, editable, with a live preview showing the resulting subdomain below: "[slug].wial.ashwanthbk.com" in text-muted), and default language dropdown.

**Section: Branding.** Three color picker inputs arranged horizontally: primary color, secondary color, accent color. Each color picker shows a square swatch (32 by 32 pixels) of the current color, the hex value in a text input, and clicking the swatch opens a color picker popover. Below the color inputs, a font selection input with a dropdown of popular Google Fonts. A live branding preview panel sits to the right of the color inputs on desktop — a miniature card that updates in real-time as the user changes colors and fonts, showing a mock header, a heading, body text, and a button styled with the selected colors. This preview is below the inputs on mobile.

A logo upload area below the colors, using the file upload component described in section 9.4.

**Section: Contact Information.** Email, phone, and address inputs.

**Section: Chapter Lead.** Email input for the person who will manage this chapter. If creating a new chapter, this field is required and sends an invitation on chapter creation. On the edit page, this section shows the current chapter lead(s) as a read-only list.

**Save action.** A sticky footer bar at the bottom of the page (above the browser chrome) containing a "Cancel" ghost button and a "Create Chapter" primary button (or "Save Changes" on the edit page). The sticky bar has a top border and a slight upward shadow, distinguishing it from the page content.

### 10.8 User Management — List Page

A table of users in the context of the selected chapter (or all users globally for super admins).

**Table columns.** User avatar (small circle, 32 pixels), full name, email, role (shown as a badge), date joined (relative timestamp), actions.

**Tabs above the table.** Two tabs: "Members" (active users) and "Invitations" (pending invitations). The tabs use the standard tab component — a horizontal row of text labels where the active tab has a bottom border in the primary color.

**Invitations tab content.** A table showing: invitee email, invited role (badge), invited by (name), sent date, expires date, status (badge: pending, accepted, expired), and actions (a "Revoke" destructive ghost button for pending invitations).

**Invite action.** A "Send Invite" primary button in the page header. Clicking it opens a dialog (not a new page) with: email input, role selector (dropdown: Content Creator, Coach; or for super admins: also Chapter Lead), and a "Send Invitation" primary button. On success, a success toast confirms the invitation was sent, and the invitations tab updates in real-time.

### 10.9 Coach Directory — Chapter Roster

The coach management page for chapter leads.

**Page header.** "Coaches" in Heading 1, with an "Add Coach" primary button at the right edge. Below the header, a filter bar with: search input, certification level dropdown, specialization dropdown (populated dynamically from existing tags), language dropdown, and an active/inactive toggle switch with the label "Show Inactive."

**Coach table.** Columns: photo (circular avatar, 40 pixels), full name (linked), certification badge, specializations (tag chips, maximum three visible), languages (comma-separated), hours logged (number, right-aligned), active status (a green dot or gray dot), actions (three-dot menu).

The three-dot menu offers: "View Profile," "Edit," "Send Invitation" (if no user account linked), "Deactivate" (or "Activate"), and "Remove" (destructive).

**Alternative view: Grid.** A toggle in the filter bar lets users switch between table view and card grid view. The grid view shows coach cards (described in the chapter website section below) with an admin overlay — a small edit icon button in the top-right corner of each card.

### 10.10 Coach Directory — Add and Edit Form

A form page similar in structure to the chapter create/edit page, using collapsible sections.

**Section: Personal Information.** Full name input (required), email input (optional, with a checkbox "Send invitation to this email"), photo upload area (circular preview, 120 pixels, showing the uploaded image or the initials avatar fallback).

**Section: Professional Details.** Certification level dropdown (CALC, SALC, MALC, PALC), hours logged number input, bio textarea (large, 200-pixel minimum height, with a character count indicator showing current length in text-muted), specializations tag input, languages tag input.

**Tag input behavior.** The tag input is a text field with an area above it showing existing tags as removable chips. The user types a tag name and presses Enter to add it. Each chip shows the tag text and a small X button to remove it. As the user types, a dropdown suggests existing tags from other coaches in the chapter (for consistency), but free-text entry is always allowed.

**Section: Contact Information.** Contact email, phone, and website inputs.

**Coach self-edit view.** When a coach accesses their own profile, the form shows the same layout but with the following fields disabled (grayed out, non-interactive, with a tooltip explaining "Only your chapter lead can change this"): certification level, hours logged, and a hidden active status toggle. The photo, bio, specializations, languages, and contact fields remain editable.

### 10.11 Coach Directory — Global View (Super Admin)

Same table as the chapter roster but with an additional "Chapter" column showing the chapter name (as a clickable link to the chapter detail). The filter bar gains a chapter dropdown at the beginning, allowing filtering by chapter.

When the search bar is in focus and the user types a query, a subtle transition occurs: the table view cross-fades to show results ranked by relevance (powered by semantic search in Phase 3). A small label below the search bar reads "Semantic search enabled — try natural language queries" in text-muted italic.

### 10.12 Content Block Management — List Page

A page-oriented content management view, not a raw data table.

**Page header.** "Content" in Heading 1. A "New Block" primary button at the right edge.

**Language tabs (Phase 3).** A horizontal tab bar showing the chapter's active languages as tab items. The active tab is underlined. Tabs that have fewer blocks than the primary language show a small count badge indicating the number of untranslated blocks.

**Content grouped by page.** The main content area organizes blocks into visual groups, each representing a page on the chapter website. Each group has:

- A group header showing the page name ("Landing Page," "About Page," "Coach Directory," "Contact," "Membership," "Header & Footer") with a small icon representing the page type
- Below the header, a grid of content block cards, two columns wide on desktop

Each content block card shows:

- The human-readable block name (derived from the block key, such as "Hero Title" from "hero_title," or "About Body" from "about_body")
- A content type badge (Rich Text, Plain Text, Image, JSON)
- A truncated preview of the content — for rich text, the first sixty characters stripped of HTML tags; for images, a thumbnail; for JSON, the first line
- The last updated timestamp in text-secondary
- A hover state that slightly elevates the card and shows an "Edit" label

**Missing blocks.** For standard block keys that the template expects but which do not exist yet in this chapter, a dashed-border card appears in the appropriate group with the text "Not yet created" and a "Create" ghost button. These placeholder cards use a faded, lower-contrast style to distinguish them from existing blocks.

### 10.13 Content Block Management — Editor Page

The heart of the content management experience. The editor adapts based on content type.

**Page layout.** The breadcrumb reads "Content" followed by the page group name ("Landing Page") followed by the block name ("Hero Title"). The page title is the human-readable block name.

**Rich text editor.** A card containing the Tiptap WYSIWYG editor. The toolbar sits at the top of the card with a surface-muted background and 1-pixel bottom border. Toolbar buttons are icon-only with tooltips, grouped with 1-pixel vertical separators between groups:

- Text formatting group: Bold (B icon), Italic (I icon)
- Heading group: H2, H3, H4 (text labels, not icons, for clarity)
- List group: Bullet list, Ordered list
- Insert group: Link insertion (link icon)
- History group: Undo, Redo

**Toolbar button states.** At rest, toolbar buttons are text-secondary with no background. On hover, they gain a surface-muted background. When active (for example, Bold is active because the cursor is within bold text), the button gains a primary-color background at ten-percent opacity and the icon shifts to the primary color. This active state is a toggle — pressing the button deactivates it and the visual state returns to rest. The heading buttons (H2, H3, H4) are mutually exclusive — only one can be active at a time.

The editing area below the toolbar has generous padding (24 pixels) and uses the chapter's body font at Body Large size. The editing experience should feel like writing in a well-formatted document, not filling in a form field. The cursor blinks at a relaxed pace.

**Plain text editor.** A large textarea input, same generous padding as the rich text editor, with a character count in the bottom-right corner.

**Image URL editor.** The file upload component with a large image preview (up to 400 pixels wide). If an image already exists, it is shown at full preview size with a "Replace" button overlaid in the bottom-right corner and a "Remove" ghost button.

**JSON editor.** A textarea with a monospace font (JetBrains Mono). A "Validate JSON" button above the textarea. If the JSON is invalid on blur, the border turns destructive and a helpful error message indicates the line and nature of the error. If valid, a green checkmark appears briefly.

**AI actions (Phase 3).** Two additional buttons appear in the editor toolbar area, visually separated from the standard editing tools:

- "AI Generate" — a button with a sparkle icon and a soft gradient background (primary-to-secondary, at ten-percent opacity). Clicking opens a dialog where the user selects a content type and generates draft content.
- "Translate" — a button with a languages icon. Clicking opens a dialog with target language selection.

Both AI-generated results appear in a side-by-side comparison view within the dialog: the current content on the left, the AI-generated content on the right, with a "Use This" button below the generated content and a "Regenerate" ghost button. This makes the review step explicit and tangible.

**Save action.** A sticky footer bar with "Discard Changes" ghost button and "Save" primary button. If the user navigates away with unsaved changes, a confirmation dialog appears: "You have unsaved changes. Discard them?"

### 10.14 Deployment Management Page

Available to chapter leads and super admins. Shows deployment history and provides the deploy trigger.

**Page header.** "Deployments" in Heading 1. A large "Deploy Now" button in the WIAL crimson accent color (not the standard primary teal — this uses the accent to visually distinguish it as a special, high-consequence action). If a deployment is currently in progress, the button is disabled and shows a spinner with the text "Building..."

**Live site link.** Below the header, a row showing: "Live at [subdomain].wial.ashwanthbk.com" as a clickable link with an external-link icon, the last successful deployment's timestamp, and a small green "Live" badge.

**Deployment status card (visible when a deployment is in progress).** A prominent card at the top of the content area showing the current deployment's progress. A horizontal progress track with four nodes: Queued, Building, Deploying, Done. The current stage's node pulses gently. Completed stages show a checkmark in success green. The line connecting completed stages fills with success green. Failed stages show an X in destructive red, and the track stops there. Below the progress track, the deployment's build log appears as a scrollable monospace text area (JetBrains Mono, Body Small size, surface-muted background) that auto-scrolls to the bottom as new lines appear.

**Deployment history table.** Columns: timestamp (relative, with absolute time on hover tooltip), triggered by (user name and avatar), status (badge), duration (calculated from start to completion, showing "—" for in-progress), deploy URL (clickable link, only for successful deployments).

The most recent successful deployment row has a subtle green left border accent, visually confirming "this is what's currently live."

### 10.15 Chapter Settings Page (Chapter Lead)

A settings page organized into tabs within the content area: "Branding," "Contact Information," "Languages" (Phase 3), and "General."

**Branding tab.** Same color picker, font selection, and logo upload as the chapter edit form, but with the live preview panel larger and more prominent — it occupies the right half of the screen on desktop, showing a more detailed mock of the chapter website header, hero section, and a coach card, all styled with the current settings. Every change to a color or font immediately updates this preview, providing instant visual feedback.

**Contact Information tab.** Standard form with email, phone, and address fields.

**Languages tab (Phase 3).** A list of currently active languages, each shown as a card with the language name, a flag icon, and a "Remove" destructive ghost button. Below the list, an "Add Language" button that opens a dropdown of available languages. Adding a language shows a brief informational message: "Adding a language creates space for translated content. You can translate blocks using AI assistance or write them manually."

**General tab.** Chapter name (read-only for chapter leads, with a note "Contact a Super Admin to change the chapter name"), slug (read-only), subdomain (read-only, displayed as the full URL), and a "Request Changes" link that could be used to contact support.

**AI Coach Matching tab (Phase 5).** A single toggle: "Enable AI Coach Matching widget." When enabled, the chapter website's coach directory page shows a "Find Your Coach" natural language search above the standard directory grid.

### 10.16 Events Management Page (Phase 4)

Available to Chapter Leads, Super Admins, and advanced coaches (SALC/MALC/PALC) who can create training events.

**Page header.** "Events" in Heading 1. A "Create Event" primary button at the right edge.

**Filter bar.** Event type dropdown (All, Certification, Workshop, Meetup, Webinar), date range picker (showing "Upcoming" by default), and a published/draft toggle.

**Events table.** Columns: title, type (badge — same color coding as status badges: certification in primary teal, workshop in secondary, meetup in info blue, webinar in accent), date range (formatted as "Mar 15, 2026" or "Mar 15–17, 2026"), location (text, or a "Virtual" badge with a video icon), published status (toggle switch), registrations count (if registration link is set), and actions (three-dot menu with Edit, Delete).

**Create/edit event form.** A single-page form (not multi-section accordion — events are simpler than chapters). Fields: title (required), description (rich text textarea, 200px minimum height), event_type (dropdown), start_date (datetime picker), end_date (datetime picker, optional — shows "Single day event" when empty), location (text input with a map-pin icon), is_virtual toggle (when enabled, shows virtual_link input), max_attendees (number input, optional — shows "Unlimited" when empty), registration_link (URL input, optional — when empty, the event shows "Contact chapter for details"), is_published toggle with a label "Publish to website."

**Global events view (Super Admin).** Same table with an additional "Chapter" column. An aggregated calendar view option: a simple month-view grid where days with events show colored dots. Clicking a day shows that day's events in a side panel.

**Empty state.** Calendar icon at 48 pixels, "No events yet" in Heading 3, "Create your first event to share with your community" in Body, and a "Create Event" primary button.

### 10.17 Resources Management (Phase 4)

Resources are managed through the content block editor but with a structured editing overlay for the resources_items JSON block.

**Structured resources editor.** Instead of a raw JSON textarea, the editor shows a vertical list of resource cards. Each card shows: a type icon (document for PDF, play for video, link for external, book for article), the title in Label weight, the description truncated to one line, and the URL as a clickable text link. Each card has an "Edit" ghost button and a "Remove" destructive ghost button. Drag handles on the left allow reordering.

**Add/Edit resource form (in a dialog).** Fields: title (required), description (textarea), URL (required), and type (dropdown: PDF, Video, Link, Article). The dialog has "Cancel" and "Save" buttons.

**Empty state.** Book-open icon, "No resources yet" in Heading 3, "Add links to documents, videos, and articles for your chapter" in Body, and an "Add Resource" primary button.

### 10.18 Client Organizations Management (Phase 4)

Available to Chapter Leads and Super Admins. Replaces the previous footer_client_logos JSON content block with a proper management page.

**Page header.** "Client Organizations" in Heading 1 (or "Partners" — the label is configurable). An "Add Client" primary button.

**Client list.** A card grid (not a table — logos are visual and better displayed in cards). Each card shows: the logo image (80 pixels square, object-fit contain), the organization name in Label weight, the website URL as a truncated link, and an active/inactive toggle. Cards have drag handles for reordering. Cards follow the standard card design with 12-pixel border radius and 20-pixel padding.

**Add/Edit client form (dialog).** Logo upload (square preview, 120 pixels), name (required), website URL, description (optional textarea), sort_order (number), is_active toggle.

### 10.19 Coach Certification Tracking (Phase 4)

Additions to existing coach forms and views.

**In the coach edit form (Chapter Lead view).** A new "Certification" collapsible section below "Professional Details." Fields: recertification_due_date (date picker — shows a colored indicator: green chip "Due in X months" if >90 days, yellow "Due in X months" if 30-90 days, red "Overdue" or "Due in X days" if <30 days), ce_credits_earned (number input), certification_approved toggle (checkbox with label "Approved for public directory" — when unchecked, a warning banner appears: "This coach will not appear in the public directory until approved").

**In the coach self-edit view ("My Profile").** A read-only "My Certification" card at the top of the profile page, above the editable fields. The card shows: current certification level as a large badge (using the certification level color from section 3.3), hours logged in Heading 3 with a small clock icon, recertification due date with the colored indicator, CE credits earned with a progress-style display (if a target is known), and advancement path text: "X hours toward SALC" (or the next level). This card has a subtle left border in the certification level color, 4 pixels wide.

**Certification approval workflow in the coach list.** Coaches pending approval show a small yellow "Pending Approval" badge next to their name. Chapter Leads can bulk-approve from the table using a checkbox selection and an "Approve Selected" button in a sticky action bar that appears when rows are selected.

### 10.20 AI Editor Page (Phase 5)

A new sidebar item for Chapter Leads between "Content" and "Deployments." Icon: sparkle or wand.

**Page layout.** Split into two areas. Left side (60% width on desktop): the prompt area and session history. Right side (40%): the live preview.

**Prompt area.** A large textarea (200px minimum height) with placeholder text: "Describe what you'd like to change on your website..." A "Submit Edit" primary button with a sparkle icon below the textarea. Above the textarea, a small help text in Caption: "AI will edit your chapter's website files. You'll preview changes before they go live."

**Session status area.** Below the prompt, a vertical progress indicator showing the current AI edit session state:
- **Queued** — gray dot, "Waiting to start..."
- **Processing** — animated spinner, "AI is editing your site..." with an elapsed time counter
- **Preview Ready** — green dot, "Preview is ready for your review"
- **Approved** — green checkmark, "Changes deployed to production"
- **Rejected** — red X, "Changes discarded"

Each state transition uses the emphasis animation (400ms spring). Only the current state is highlighted; past states show as completed checkmarks.

**Preview panel (right side).** When preview is ready, an iframe loads the Cloudflare branch preview URL. The iframe has a 1-pixel border, 12-pixel border radius, and a small "Open in new tab" icon-link in the top-right corner. Above the iframe, the preview URL is shown in Caption size. Below the iframe, three buttons:
- "Approve & Deploy" — primary button in the accent color (high-emphasis, similar to the deploy button styling)
- "Edit More" — secondary button (sends the user back to the prompt textarea, preserving the branch)
- "Discard" — destructive ghost button (deletes the branch)

**Session history.** Below the active session, a collapsible "Past Sessions" section showing previous AI edit sessions as a timeline. Each entry shows: the prompt text (truncated), timestamp, and outcome badge (approved/rejected/discarded).

**Mobile behavior.** On mobile, the preview panel moves below the prompt area in a full-width layout. The iframe becomes a "View Preview" button that opens the preview URL in a new tab.

### 10.21 Payment Pages — Mocked (Phase 6)

These pages exist in the navigation with realistic layouts but display sample data with a "(Coming Soon)" banner.

**Chapter Lead — Payments page.** Sidebar item with a credit-card icon. The page shows: a "(Coming Soon)" info banner at the top with a brief message about upcoming payment features. Below, a mocked payments table with sample data: amount, payer, type badge (dues/enrollment/certification), status badge (completed/pending), and date. Summary cards above the table: "Total Collected" (mocked number), "Outstanding" (mocked), "This Month" (mocked). A "Connect Stripe" and "Connect PayPal" button pair, both disabled with "(Coming Soon)" labels.

**Super Admin — Revenue page.** Same mocked treatment but with a global revenue view: per-chapter revenue breakdown table and summary cards.

### 10.22 Analytics Dashboard — Mocked (Phase 6)

A sidebar item with a bar-chart icon. Shows a "(Coming Soon)" banner with mocked chart areas: a placeholder line chart for "Website Traffic" (gray dashed box with chart icon), a "Contact Form Submissions" counter card, an "Event Registrations" counter card, and a "Top Pages" ranked list. All data is placeholder. The layout establishes the visual structure so it feels integrated when real data is connected.

### 10.23 Sidebar Navigation Update

Updated sidebar items by role:

**Super Admin (Global):**
- Dashboard
- Chapters
- Global Coach Directory
- Global Events Calendar (new)
- Users
- Revenue (new — mocked)
- Analytics (new — mocked)
- Settings

**Chapter Lead:**
- Dashboard
- Coaches
- Content
- Testimonials
- Events (new)
- Client Organizations (new)
- AI Editor (Phase 5)
- Users
- Deployments
- Payments (new — mocked)
- Chapter Settings

**Content Creator:**
- Dashboard
- Content
- Coaches (read-only)

**Coach:**
- My Profile (with "My Certification" card)
- Dashboard

---

## 11. Chapter Website — Page-by-Page Design

The chapter website is the public face of each chapter. It is a static site that must feel polished, branded, and welcoming. The design must work with any chapter's color choices while maintaining structural quality and accessibility.

### 11.1 Global Elements: Header

The header is present on every page. It uses a "scroll-aware" behavior: it is visible at the top of the page, scrolls away as the user scrolls down (freeing vertical space), and slides back into view when the user scrolls up by at least 30 pixels (indicating intent to navigate). The slide-down re-entrance takes 250 milliseconds with an ease-out curve. When re-entering, the header has a solid white background and a subtle bottom shadow, regardless of scroll position — the transparent state only applies when the page is scrolled to the very top.

**Desktop layout (above 768 pixels).** Left: the chapter logo (or text wordmark if no logo). Center-right: navigation links to all ten pages, spaced 24 pixels apart, using Label typography. With ten pages, tighter spacing is used compared to the original six-page layout. The active page's link has a bottom border in the accent color, 3 pixels thick, with 8 pixels of gap between the text and the border. Far right: a language switcher dropdown (if multi-language is active). On desktop viewports below 1200 pixels, the navigation may overflow — in this case, the last few links collapse into a "More" dropdown to maintain a single-row header.

**Visual treatment.** The header background is always white — at all scroll positions, on all chapter sites, regardless of the chapter's brand colors. This is a hard constraint driven by the WIAL logo: every existing WIAL chapter site (wial.org, wial-usa.org, wialnigeria.org) displays the logo on a white header, and the logo's standard version is designed for white backgrounds. The chapter's brand primary color is not applied to the header background — it appears in the hero section, buttons, and footer. When the page is first loaded and the user is at the very top, the header is white at ninety-five-percent opacity (slightly translucent so the hero behind it subtly shows through). As the user scrolls, it transitions to fully opaque white with a subtle bottom shadow over a 10-pixel scroll range.

**Mobile layout (below 768 pixels).** Left: the chapter logo. Right: a hamburger menu icon (three horizontal lines, evenly spaced, 24 by 24 pixels). Tapping the hamburger opens a full-screen overlay with a solid white background. The overlay slides in from the right over 250 milliseconds. Navigation links are stacked vertically, centered, using Heading 3 typography. The active page has a left-edge accent bar similar to the admin sidebar. An X close button sits in the top-right corner. The hamburger menu uses a pure CSS checkbox toggle with no JavaScript — the menu is a native HTML disclosure that is styled to look and feel like a smooth overlay.

### 11.2 Global Elements: Footer

The footer is a full-width section with a dark background (the chapter's primary brand color mixed toward black at eighty-percent, or a deep warm charcoal if the primary color would produce poor contrast). Text in the footer is warm off-white.

**Three-column layout on desktop:**

- Column one (left): The chapter logo or name in Heading 4, followed by the footer description content block in Body Small. Below, social media links as icon buttons (32 by 32 pixels each, using Lucide icons for common platforms: Globe for website, Mail for email, and simple identifiable icons for social platforms). Social icons are warm off-white with a hover state that brightens them to full white and scales them to one hundred and ten percent.
- Column two (center): "Quick Links" label in Overline style, followed by a vertical list of navigation links mirroring the header. Links are warm off-white, underlined on hover.
- Column three (right): "Contact" label in Overline style, followed by the chapter's contact email (with a mail icon), phone (with a phone icon), and address (with a map-pin icon). Each contact item is on its own line.

**Below the columns:** A full-width horizontal line in fifteen-percent opacity white, followed by the copyright text centered, in Caption size.

**Mobile layout:** The three columns stack vertically, centered. Each column has 32 pixels of vertical space between it and the next.

### 11.3 Page 1 — Landing (Hero)

The first impression. This page must communicate what the chapter does, who it serves, and how to engage — within five seconds of visual scanning.

**Hero section.** Full viewport width, 80 percent of viewport height on desktop (minimum 500 pixels), 60 percent on mobile. The background uses the chapter's primary brand color at a very low opacity (five percent) over a warm off-white, creating a tinted canvas that feels branded without being heavy. The hero image (from the hero_image_url content block) appears on the right half of the hero on desktop as a large photograph with rounded corners (16-pixel radius) and a subtle shadow. On mobile, the image appears above the text, spanning the full width with a gentle bottom fade into the content below.

**Hero text content.** Left-aligned on desktop, centered on mobile. The hero title in Display typography, in the chapter's primary brand color. The hero subtitle in Heading 2, text-secondary color. The hero description in Body Large, text-primary. A call-to-action button in the accent color (large size, pill-shaped with a fully rounded border radius) reading the hero_cta_text. Below the CTA, a subtle trust indicator line: "Part of the WIAL Global Network — 20+ chapters worldwide" in Caption, text-muted, with a small globe icon.

**Content entrance animation.** On page load, the text content fades up with the staggered blur-fade described in section 8.3. The hero image fades in from the right (translating 30 pixels) slightly after the text sequence completes.

**Impact statistics strip.** Below the hero, a horizontal strip with a contrasting background (surface-muted or a subtle warm tint). Three or four statistics in a row: "X+ Certified Coaches" with the number ticker effect, "X Countries Active," "X Years of Impact," and optionally "X+ Hours of Coaching." Each statistic uses the number in Heading 1 size in the primary brand color, with the label in Body Small below it. On mobile, statistics are in a two-by-two grid.

**Featured coaches section.** A section titled "Meet Our Coaches" in Heading 2, with a brief description from the coaches_description content block. Below, a four-column grid of coach cards (two columns on tablet, single column on mobile). Each card is described in section 11.5. A "View All Coaches" ghost button sits below the grid, centered.

**About teaser section.** A two-column layout: the left column shows the about_image_url as a warmly styled photo (rounded corners, a slight rotation of one or two degrees for visual interest, with a colored shadow offset — a shadow in the primary brand color at fifteen-percent opacity, shifted four pixels down and four pixels right). The right column shows the first paragraph of about_body as rich text, followed by a "Learn More" link to the About page. This asymmetric treatment — the tilted photo, the colored shadow — is a signature visual moment that differentiates the template from generic designs.

### 11.4 Page 2 — About

**Hero banner.** A shorter hero section (40 percent of viewport height) with the about page title in Display typography and a decorative growth-line element curving gently across the background.

**Content section.** A single-column layout, centered, with maximum line length of seventy-five characters. The about_body content block renders as rich HTML — headings, paragraphs, bold, italic, lists, and links. The about_mission content block appears as a styled callout: a card with a left border in the accent color (4 pixels wide), a slightly warm-tinted background, and the text in Body Large italic. This callout sits indented from the main text column, creating visual distinction.

**Supporting image.** The about_image_url appears as a large photo, spanning the content width, with rounded corners and the same warm shadow treatment as the landing page — a slight rotation, a colored offset shadow. This consistent photographic treatment becomes a recognizable part of the template's visual identity.

### 11.5 Page 3 — Coach Directory

**Page header.** The coaches_title in Heading 1, the coaches_description below in Body Large.

**Filter bar.** A horizontal row of filter controls: a search input (with a magnifying glass icon and placeholder "Search coaches..."), a certification level dropdown, and a language dropdown. The filter bar is sticky — it remains visible at the top of the page as the user scrolls through the directory. On mobile, the filters collapse into a single "Filter" button that opens a bottom sheet with the filter options stacked vertically.

**Coach card grid.** A responsive grid: three columns on desktop (above 1024 pixels), two on tablet (768 to 1024), one on mobile. Cards have 24 pixels of gap between them.

**Individual coach card design.** Each card is a contained unit with:

- The coach's photo as a large circle (96 pixels diameter) centered at the top of the card, overlapping the card's top edge by half its height (48 pixels above the card's natural top). This creates a "floating head" effect that draws the eye and adds dimensionality. If no photo exists, the initials avatar (colored by certification level) takes its place.
- Below the photo: the coach's full name in Heading 4, centered.
- The certification badge (pill-shaped, small, colored per section 3.3) directly below the name.
- A horizontal line of language labels in Caption size, text-secondary, separated by dots.
- The first three specialization tags as small tag chips. If more exist, "+N" is shown.
- A "View Profile" link at the bottom of the card, styled as a subtle text link with an arrow icon.

**Card hover behavior.** On hover (desktop), the card lifts slightly (translateY negative 4 pixels, shadow deepens, transition 200 milliseconds). The "View Profile" link text transitions to the accent color. The photo slightly scales up (one hundred and five percent) within its circular clip. These combined micro-interactions create an inviting, responsive feel.

**Empty state.** If the chapter has no coaches, the grid area shows a warm illustration of a group of abstract human figures with a speech bubble, the text "No coaches listed yet" in Heading 3, and "Check back soon as our team grows" in Body. This empty state feels hopeful, not barren.

**Search behavior (Phase 3 semantic search).** When the user enters text in the search field and submits, a small inline script calls the semantic search Edge Function and replaces the grid content with the results. While results load, the existing cards fade to forty-percent opacity and a small spinner appears above them. Results fade in once loaded. If no results match, a friendly message appears: "No coaches matched your search. Try different words or clear the search to see everyone."

### 11.6 Page 4 — Individual Coach Profile

A dedicated page for each coach, generated at build time.

**Profile header.** A wide hero-style banner using the certification level color at ten-percent opacity as the background. The coach's photo is large (160 pixels, circular) and positioned on the left on desktop, centered on mobile. To the right of the photo on desktop:

- Full name in Heading 1
- Certification badge in its full form (not abbreviated): "Certified Action Learning Coach" for CALC, and so on
- A subtle horizontal line
- Contact icons in a row: email (mailto link), phone (tel link), website (external link), each as an icon button with the primary color

**Bio section.** Below the header, the coach's bio renders as rich text in a centered content column (same width as the About page). If the bio is long, it reads like a short essay — well-typeset, comfortable measure, generous line height.

**Details sidebar (desktop only).** A sticky card that floats alongside the bio on the right. It contains:

- "Specializations" label in Overline, followed by tag chips
- "Languages" label in Overline, followed by tag chips
- "Hours Logged" label in Overline, followed by the number in Heading 3 with a small clock icon
- "Certification" label in Overline, followed by a visual representation — four horizontal bars where the bars up to and including the coach's level are filled in the certification color, and higher levels are surface-muted. CALC fills one of four, SALC fills two, MALC fills three, PALC fills all four.

**Mobile layout.** The sidebar content appears below the bio, stacked vertically.

**Back navigation.** A "Back to Coach Directory" link with a left-arrow icon sits above the profile header, providing clear navigation back to the listing.

### 11.7 Page 5 — Contact

**Page header.** The contact_title in Heading 1, contact_description in Body Large.

**Two-column layout on desktop.** Left column: the contact form. Right column: contact information and optional map embed.

**Contact form.** Three fields: Name, Email, and Message (textarea). Each field has a visible label, appropriate input type (email for the email field, tel for phone), and the required indicator. A "Send Message" primary button in the accent color. On submission, the button shows a loading state, then the form is replaced by a success message: a large check-circle icon in success green, "Thank you for reaching out" in Heading 3, and "We'll get back to you soon" in Body. The form does not reappear — the user would need to refresh to send another message, which is intentional to prevent accidental double submissions.

The form uses native HTML form submission as the primary mechanism, with a small enhancement script that intercepts the submission to show the loading state and success message without a page reload. If the script fails to load, the form falls back to a standard submission that redirects to a thank-you page.

**Contact information panel.** A card (or styled section) on the right showing:

- Email with a mail icon, as a clickable mailto link
- Phone with a phone icon, as a clickable tel link
- Address with a map-pin icon, as plain text
- If a map embed URL is provided, an iframe showing the embedded map with a 16:9 aspect ratio, rounded corners, and a 1-pixel border

### 11.8 Page 6 — Membership and Join

**Page header.** The join_title in Display typography, centered. The join_description below in Body Large, centered, maximum width of 600 pixels.

**Benefits section.** The join_benefits content block renders as a visually distinct list. Rather than plain bullet points, each benefit is a small card in a vertical stack, with an accent-colored check-circle icon on the left and the benefit text on the right. The cards have a very subtle surface-muted background and 1 pixel of border. They are stacked with 12 pixels of gap, creating a "checklist" visual rhythm.

**Call to action.** A large, visually prominent CTA section below the benefits. A full-width card with the primary brand color as a gradient background (primary at the left, slightly lighter primary at the right). White text: "Ready to Join?" in Heading 2, a brief encouragement line in Body, and the join_cta button in white with the primary color text (inverted from the usual button colors to stand out against the colored background). The button is pill-shaped (full border radius) and large (48 pixels tall).

**Payment integration (Phase 6).** When payments are enabled, the CTA button leads to a Stripe/PayPal hosted checkout page instead of an external URL. A small "Secure payment" caption with a lock icon appears below the button.

### 11.9 Page 7 — Events Calendar (Phase 4)

**Page header.** The events_title in Heading 1, events_description in Body Large below.

**Upcoming events section.** Events are displayed as a vertical timeline, not a traditional calendar grid — this is more scannable and works better on mobile. Each event is a wide card spanning the content width, with:

- A date block on the left: the month abbreviation in Overline style, the day number in Heading 2, and the year in Caption — all in the primary brand color. For multi-day events, the date block shows "Mar 15–17" style.
- The event content on the right: title in Heading 3, a type badge (using the same badge design from section 9.5 — certification in primary teal, workshop in secondary, meetup in info blue, webinar in accent), location with a map-pin icon (or "Virtual" with a video icon), description as truncated rich text (first two lines, expandable with a "Read more" link), and a registration button (accent color, links to external URL or shows chapter contact).

Events are ordered chronologically. A subtle connecting line runs between the date blocks, creating the timeline visual. If an event is happening today or within 7 days, a small "Coming up" badge in the warning amber color appears above the card.

**Past events section.** Collapsed by default behind a "View Past Events" ghost button. When expanded, shows the same card layout but in a muted style — reduced opacity, no registration button, and a "Past" badge replacing the type badge.

**iCal download.** Each event card has a small calendar-plus icon button that downloads an .ics file. The button uses the ghost button style at small size.

**Empty state.** Calendar icon at 48 pixels, "No upcoming events" in Heading 3, "Check back soon for workshops, certifications, and meetups" in Body.

### 11.10 Page 8 — Resources and Library (Phase 4)

**Page header.** The resources_title in Heading 1, resources_description in Body Large below.

**Resources grid.** A two-column grid on desktop (single column on mobile) of resource cards. Each card follows the standard card design (12-pixel radius, 20-pixel padding, subtle shadow) with:

- A colored icon on the left side, sized at 32 pixels: a file-text icon for PDFs (in the destructive red — PDF brand color), a play-circle icon for videos (in the info blue), a external-link icon for external links (in the primary teal), and a book-open icon for articles (in the secondary golden yellow). The icon sits in a 48-pixel circle with a five-percent-opacity wash of its color as background.
- Title in Heading 4 to the right of the icon.
- Description in Body Small below the title, text-secondary, maximum two lines with ellipsis truncation.
- A "View" or "Download" link at the bottom right of the card, styled as a text link with an arrow-right icon.

**Card hover.** Same hover behavior as coach cards: subtle lift (translateY -4 pixels), shadow deepens, link text transitions to accent color.

**Empty state.** Book-open icon, "No resources yet" in Heading 3, "Check back soon for documents, videos, and learning materials" in Body.

### 11.11 Action Learning Page — Certification Section (Phase 4)

Below the existing Action Learning content (the 6-component accordion and benefits), a new "Certification Levels" section appears.

**Section header.** "Certification Levels" in Heading 2, with a subtle top border (1-pixel in border-subtle) and 48 pixels of top margin separating it from the Action Learning content.

**Certification level cards.** Four cards in a single row on desktop (two-by-two on tablet, single column on mobile). Each card represents one certification tier:

- A colored top border (4 pixels, in the certification level color from section 3.3) distinguishes each card.
- The level abbreviation (CALC, SALC, MALC, PALC) in Overline style, in the certification color.
- The full name ("Certified Action Learning Coach") in Heading 4.
- Requirements text in Body Small — hours required, prerequisites.
- A horizontal bar showing progression: the four levels as dots on a line, with the current level and all lower levels filled in the certification color.

**Recertification section.** Below the cards, the cert_recertification_info content block renders as a styled callout (same treatment as the about_mission callout — left border in accent color, warm-tinted background, Body Large text).

**Apply link.** A "Begin Your Certification Journey" primary button linking to cert_application_link. Centered below the recertification section.

### 11.12 "Find Your Coach" Widget (Phase 5)

Appears on the Coach Directory page above the standard directory grid when AI Coach Matching is enabled for the chapter.

**Visual design.** A full-width card with a warm gradient background (five-percent primary over white on the left, transitioning to five-percent accent on the right). Inside:

- A heading: "Find Your Coach" in Heading 2, primary brand color.
- A subheading in Body, text-secondary: "Describe what you're looking for and we'll match you with the right coach."
- A large text input (48 pixels tall, 16-point text — larger than standard inputs to feel inviting) with placeholder "e.g., Leadership development for a manufacturing team in Brazil..."
- A "Match Me" primary button with a sparkle icon, positioned to the right of the input on desktop, below it on mobile.

**Results display.** When results arrive, the widget expands smoothly (300ms ease-in-out) to show the matched coaches. Each result is a coach card (same design as the directory cards from section 11.5) with an additional "Why this coach" paragraph below the card — in Body Small, text-secondary, italic — explaining the AI's match reasoning. Results are separated by 16 pixels of gap.

**Loading state.** While the AI processes, the input is disabled and a skeleton loader appears in the results area: three horizontal card-shaped skeletons with shimmer animation.

---

## 12. Dark Mode and Light Mode

### 12.1 Admin Dashboard Theme Strategy

The admin dashboard supports both themes. The user toggles between them using a sun/moon icon button in the header. Their preference persists in local storage and defaults to matching the operating system preference.

**The toggle animation.** The sun and moon icons do not simply swap. The current icon rotates 90 degrees while fading out, and the new icon rotates in from negative 90 degrees while fading in. This brief 200-millisecond animation makes the toggle feel tactile and intentional, not like a system glitch.

**Surface hierarchy in dark mode.** Dark mode uses three distinct surface levels to maintain depth perception:

- Level 0 (page background): the deepest, warmest dark
- Level 1 (cards, panels): one step lighter
- Level 2 (dropdowns, tooltips, elevated menus): another step lighter

Each level increases in lightness by a consistent amount, creating a clear stacking order even without relying on shadows (which are less visible against dark backgrounds).

**Borders in dark mode.** Borders use white at eight to twelve percent opacity rather than a specific gray color. This ensures they adapt naturally to any surface level they sit on.

**Images and photos in dark mode.** Coach profile photos and chapter logos are not modified in dark mode — they remain at full brightness and saturation. Adding a darkening filter to human faces would look unnatural. The card backgrounds behind photos may darken, but the photos themselves stay true.

### 12.2 Chapter Website Theme

Chapter websites do not have a dark mode toggle. They are served in a light theme only. This is a deliberate design decision: the chapter site is a public marketing surface where brand color fidelity matters, and introducing a dark variant of every chapter's custom color scheme would create unpredictable contrast and branding issues. The admin dashboard, as a productivity tool used for extended periods, benefits from dark mode. The chapter website, as a browsing destination for brief visits, does not.

However, the chapter website respects the reader's system preference for text-only/reduced-data mode (see low-bandwidth design in section 13.4), which is a more meaningful accommodation for the target audience than a cosmetic dark theme.

---

## 13. Responsive Strategy

### 13.1 Breakpoints

Four breakpoints govern the responsive behavior across both surfaces:

| Name | Width | Target Devices |
|---|---|---|
| Mobile | Below 640 pixels | Small phones, narrow portrait mode |
| Tablet Portrait | 640 to 767 pixels | Large phones, small tablets in portrait |
| Tablet Landscape | 768 to 1023 pixels | Tablets, small laptops |
| Desktop | 1024 pixels and above | Laptops, desktops, ultrawide |

An additional consideration at 1440 pixels: content areas stop growing and center within the viewport, preventing uncomfortably wide layouts on large monitors.

### 13.2 Admin Dashboard Responsive Behavior

**Desktop (above 1024 pixels).** Full sidebar visible. Content area with comfortable margins. Tables display all columns. Forms use multi-column layouts where appropriate (the branding section's color pickers sit side-by-side).

**Tablet landscape (768 to 1023 pixels).** Sidebar collapses to icon rail by default but can be expanded to an overlay. Content area takes full width. Tables may hide less critical columns (hiding "slug" in the chapters table, for example) with a "Show All Columns" option. Forms remain multi-column but narrower.

**Tablet portrait and mobile (below 768 pixels).** Sidebar is hidden, accessible via hamburger menu as a slide-out sheet. Header condenses: the chapter selector becomes a compact dropdown, the language selector moves into the user menu, and the theme toggle remains visible. Tables transform into card stacks. Forms are single-column. Dialogs become bottom sheets that slide up from the bottom of the viewport rather than centered overlays — this is more ergonomic for thumb-reachable interaction on mobile.

**Touch target enforcement.** On viewports below 768 pixels, every interactive element has a minimum touch target of 44 by 44 pixels. This includes table action buttons (which gain extra padding), tag chip remove buttons (which expand their hit area), and close buttons on dialogs.

### 13.3 Chapter Website Responsive Behavior

**Desktop (above 1024 pixels).** Full multi-column layouts. Hero section shows text and image side-by-side. Coach directory uses a three-column grid. Footer uses a three-column layout.

**Tablet (640 to 1023 pixels).** Hero image moves above the hero text. Coach directory uses a two-column grid. Footer uses a two-column layout (navigation and contact merge). The statistics strip on the landing page uses a two-by-two grid.

**Mobile (below 640 pixels).** Everything is single-column. The hero section stacks: image on top (full width, 50 percent viewport height max), text below. Coach cards are full-width. The hamburger menu replaces horizontal navigation. The statistics strip stacks vertically (but remains in a two-by-two grid for compactness). Section spacing reduces from 80 to 32 pixels. Generous horizontal padding (16 pixels) prevents content from touching screen edges.

### 13.4 Low-Bandwidth Visual Treatment

**Performance targets (from SRD):** WIAL operates in Nigeria, the Philippines, Brazil, and other regions where mobile data is expensive. The median web page in 2025 is 2,559 KB — that takes nearly a minute on 2G and costs real money in sub-Saharan Africa.

| Page Type | Max Size (compressed) |
|---|---|
| Chapter landing page | ≤ 200 KB |
| Coach directory page | ≤ 500 KB |
| Image-heavy pages | ≤ 800 KB |

**Image strategy:** AVIF as primary format, WebP as fallback, JPEG as last resort — all via the `<picture>` element. No single image exceeds 50 KB. Below-fold images are lazy-loaded. Coach thumbnails: 200x200. Hero images: 1200x630.

**JavaScript budget:** Target under 100 KB total JS on content pages. Static site generation means most pages have zero JS. Only the coach directory filter, semantic search, and AI coach matching widget require scripts — all inlined.

**Font strategy:** System font stack recommended for low-bandwidth chapters (see section 4.6). Zero custom web fonts unless specifically chosen by the chapter, saving 50-150 KB per page.

**Compression:** Brotli (15-25% smaller than gzip) on all static assets. Pre-compressed at build time.

**Automatic text-only mode** for users on constrained connections (detected via the Save-Data header or the prefers-reduced-data CSS media query):

- All images hidden via display:none, replaced by text alternatives (chapter name for logo, initials for photos)
- Decorative elements stripped (growth line, colored shadows, gradient backgrounds, animated counters)
- System font stack only — no Google Fonts request
- Single-column layout forced even on desktop
- Brand colors kept for headings and links (zero cost), decorative colors removed

The result is a fully functional page under 50 KB. It is not a "broken" version — it is a deliberately designed text-forward experience.

**Cloudflare CDN:** 330+ edge locations including 32+ African cities (Lagos, Nairobi, Kigali, Kampala). Static assets cached with long TTLs (1 year for hashed assets, 1 hour for HTML). Brotli and automatic minification enabled.

---

## 14. States — Loading, Empty, Error, Success

Every view in the platform can be in one of four states beyond its default "populated" state. Each state has a deliberate design.

### 14.1 Loading States

**Skeleton loaders.** When a page's data is loading, the layout renders immediately with skeleton placeholders where data will appear. Skeletons are rounded rectangles in the surface-muted color, with a subtle shimmer animation — a horizontal light band that sweeps across the skeleton from left to right over 1.5 seconds, repeating. The shimmer uses a gradient from surface-muted to a slightly lighter tone and back. Skeleton shapes match the approximate dimensions of the content they replace: a heading skeleton is 60 percent of the column width and 28 pixels tall, a body text skeleton is three full-width lines with 8 pixels of vertical gap, an avatar skeleton is a circle of the appropriate size.

**Full-page load.** On initial page load, the admin dashboard shows the sidebar and header immediately (these are static chrome) and the content area fills with skeletons. This establishes spatial context — the user knows where they are and what kind of content is coming — even before any data arrives.

**Inline loading.** When a specific component is refreshing (like the deployment status updating), only that component shows a loading indicator. A small spinner (16 pixels, in text-secondary) appears next to the component's title. The existing content remains visible at full opacity — it only fades or changes when the new data actually arrives. This prevents the jarring "flash to skeleton and back" for partial updates.

**Button loading.** When a button triggers an async operation (saving a form, sending an invitation, triggering a deployment), the button text is replaced by a spinner of the same size as the text. The button's width does not change (it maintains its original width to prevent layout shift). The button is disabled during loading.

### 14.2 Empty States

Empty states are opportunities, not dead ends. Every empty state consists of three elements:

1. **An illustration or icon.** A simple, warm Lucide icon at 48 pixels in text-muted, or a composed illustration using two or three icons arranged meaningfully. Not a sad face, not a broken image — something contextual. An empty coach directory shows a group icon. An empty content page shows a document-plus icon. An empty deployment history shows a rocket icon.

2. **A headline.** Short, direct, and positive. "No coaches yet" — not "Error: no data found." In Heading 3 size.

3. **A call to action.** Either a description of what to do next ("Add your first coach to start building the directory") or a button that begins the creation flow ("Add Coach" primary button). For read-only views where the user cannot create content, the description explains who can ("Your chapter lead will add coaches here").

Empty states are centered horizontally and vertically within their container, with generous padding (64 pixels above and below on desktop).

### 14.3 Error States

**Page-level errors (network failure, unauthorized access).** The content area shows a centered error layout: a large alert-triangle icon (48 pixels, in the warning amber color), a headline ("Something went wrong" or "You don't have access to this page"), a description (a human-readable explanation of what happened, not a stack trace), and a retry action ("Try Again" primary button that reloads the data, or "Go to Dashboard" link).

**Inline errors (a specific operation failed).** A toast notification appears with the error type and message. The original UI state is preserved — if a form submission fails, the form remains filled with the user's input. The user is never forced to re-enter information because of an error.

**Form validation errors.** Described in section 9.4. Error messages appear below the relevant field in destructive color at Body Small size. If multiple fields have errors, the page scrolls to the first error field and focuses it. A brief summary appears above the form: "Please fix N errors below" in a warning banner (amber background at ten-percent opacity, amber left border, amber text).

### 14.4 Success States

**After form submission.** A success toast appears in the top-right corner. The form either clears (for "create" forms, suggesting the user can create another) or remains showing the saved values (for "edit" forms, confirming what was saved). The toast auto-dismisses after 4 seconds.

**After deployment trigger.** The deployment card transitions from the trigger state to the live tracking state with a smooth animation. The "Deploy Now" button transforms into the progress tracker, with the first node ("Queued") immediately lighting up.

**After invitation sent.** A success toast confirms the email was sent, and the invitations list updates in real-time to show the new pending invitation at the top with a subtle green highlight that fades out over 3 seconds.

---

## 15. Accessibility

Accessibility is not a feature — it is a structural requirement. Every design decision in this document has been made with accessibility in mind, but this section consolidates the explicit commitments and audit criteria.

### 15.1 Color Contrast

All text meets WCAG AA contrast requirements at minimum:

- Normal text (below 18 points): 4.5 to 1 contrast ratio against its background
- Large text (18 points and above, or 14 points bold): 3 to 1 contrast ratio
- Interactive element boundaries (input borders, button borders): 3 to 1 contrast ratio against the adjacent background

The certification level colors, status badge colors, and brand accent colors have all been selected to meet these thresholds. When chapters choose custom brand colors, the template's color derivation logic ensures body text always sits on a neutral background — brand colors are never used as body text backgrounds where contrast cannot be guaranteed.

**Admin dashboard color picker warning.** When a chapter lead selects brand colors, the color picker shows a real-time contrast check. If the chosen primary or accent color would produce insufficient contrast when used as button text on a white background, a small warning appears: "This color may be difficult to read in some contexts. Consider a darker shade." This is a soft warning, not a block — the chapter lead can proceed.

### 15.2 Focus Indicators

Every interactive element (links, buttons, inputs, dropdowns, menu items, tabs, toggle switches) has a visible focus indicator when focused via keyboard (using the focus-visible selector to avoid showing focus rings on mouse clicks).

The focus indicator is a 2-pixel ring in the primary teal color, offset 2 pixels from the element's edge. In dark mode, the ring uses the bright teal variant. On chapter websites, the ring uses the chapter's accent color.

Focus order follows the visual layout from top to bottom, left to right (or right to left for RTL languages). No element is skipped. No focus trap exists outside of open dialogs (where focus is intentionally trapped within the dialog until it is dismissed, then returned to the element that triggered the dialog).

### 15.3 Screen Reader Support

**Page titles.** Every page has a unique, descriptive document title that updates on navigation (for example, "Coaches — WIAL Admin" or "About — WIAL Nigeria"). Screen reader users navigating by page title can always identify where they are.

**Landmarks.** Both the admin dashboard and chapter websites use semantic HTML landmarks: the navigation is within a nav element, the main content is within a main element, the sidebar is within an aside element, and the footer is within a footer element. These landmarks allow screen reader users to jump directly to the section they need.

**Headings.** Every page has exactly one H1. Subsequent headings follow the proper nesting order (H1 contains H2s, which contain H3s). No heading level is ever skipped. Screen reader users navigating by heading can build a mental model of the page structure.

**Descriptive labels.** Every icon-only button has an accessible label (for example, the theme toggle reads "Switch to dark mode" or "Switch to light mode" depending on the current state, not just "Theme"). Every form input has an associated label element. Every image has meaningful alt text or, if purely decorative, an empty alt attribute.

**Live regions.** Toast notifications use an aria-live polite region so screen readers announce them without interrupting the user's current action. Deployment status updates use a polite live region as well, announcing "Deployment status: building" when the status changes. The number ticker animations on the dashboard are wrapped in elements whose final value is immediately available to assistive technology — the rolling animation is a visual enhancement only; the actual number is exposed from the start.

**Loading announcements.** When a page enters a loading state, the loading container has aria-busy set to true. When loading completes, a brief screen-reader-only announcement ("Content loaded") confirms that the user can now interact with the new content.

### 15.4 Keyboard Navigation

**Skip link.** The very first focusable element on every page (admin dashboard and chapter website) is a "Skip to main content" link. It is visually hidden by default (positioned off-screen) but becomes visible and styled when focused. Pressing Enter on this link moves focus to the main content area, bypassing the sidebar, header, and navigation.

**Admin dashboard shortcuts.** The admin sidebar can be navigated with arrow keys once a sidebar item has focus. Up/Down moves between items. Enter activates the focused item. Escape collapses an expanded section.

**Table navigation.** Tables can be navigated with Tab (moves between interactive elements in the table: links, buttons, checkboxes) and arrow keys (moves between cells). The currently focused cell has a subtle highlight.

### 15.5 Chapter Website Zero-JavaScript Baseline

The chapter website works completely without JavaScript. All navigation functions via standard anchor links. The mobile hamburger menu uses a CSS checkbox toggle. The contact form submits via a standard HTML form action. The coach directory is a fully rendered HTML page with all coaches visible. The language switcher (Phase 3) uses standard anchor links to locale-prefixed routes.

JavaScript is loaded as a progressive enhancement for two specific features: the directory search/filter (which provides dynamic filtering without page reload) and the semantic search (Phase 3, which calls an API). If JavaScript fails to load or is disabled, the full unfiltered directory remains visible, and a "Search" link pointing to a search page could serve as a fallback.

---

## 16. Multi-Language Visual Considerations

### 16.1 Text Expansion

Languages vary in word length. A label that reads "Coaches" in English might read "Entraîneurs" in French (fifty percent longer) or "Treinadores" in Portuguese. The UI must accommodate this expansion without breaking layouts.

**Admin dashboard.** Navigation labels, button text, and table headers use flexible widths — they grow to fit their content, up to a reasonable maximum. The sidebar width accommodates the longest expected label (260 pixels is generous for this). Buttons use horizontal padding rather than fixed widths. Table column widths use auto-fitting rather than fixed percentages. If a label would overflow, it wraps to a second line (for navigation items) or truncates with an ellipsis (for badge text) — but the design is sized so this should be rare.

**Chapter websites.** The same flexibility principles apply. Navigation links in the header are spaced apart and allowed to wrap to a second line if the combined width exceeds the header. On mobile, since navigation is in a vertical hamburger menu, expansion is not an issue.

### 16.2 Right-to-Left (RTL) Readiness

While the initial languages are all left-to-right (English, Spanish, French, Portuguese), the design system is built to support right-to-left layouts for potential future languages (Arabic, Hebrew). This means:

- All layouts use logical properties ("start" and "end" rather than "left" and "right") so they automatically flip in RTL contexts
- The sidebar appears on the right side in RTL mode
- Navigation items reorder naturally
- Icons with directional meaning (arrows, chevrons) flip horizontally

This is not something that requires active development now, but the design decisions are made with RTL in mind so that adding an RTL language does not require a redesign.

### 16.3 Language Switcher Design

**Admin dashboard.** A compact dropdown in the header bar, positioned between the chapter selector and the theme toggle. It shows the current language as a two-letter code or short name ("EN," "ES," "FR," "PT"). The dropdown panel shows the full language name in each language's native script: "English," "Español," "Français," "Português." A checkmark icon indicates the current selection.

**Chapter website (Phase 3).** If the chapter has two or three active languages, the switcher appears as a row of small text buttons in the header (for example: "EN | FR"). The active language is in the primary brand color; others are in text-secondary. If the chapter has four or more languages, the switcher becomes a compact dropdown similar to the admin version. Clicking a language navigates to the same page under the new locale prefix without a full page reload (it is a standard anchor link to the locale-prefixed URL).

---

*This design system is a living document. It captures the specific, deliberate visual and interaction decisions that give the WIAL Global Chapter Network Platform its identity. Every pixel, every animation, every color choice serves the people who use it — chapter leads in Lagos, coaches in São Paulo, content creators in Manila, and the global community they support.*
