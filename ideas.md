# Design Ideas: Mind and Body Reset — Meta Ads Strategy Portal

## Context
A client-facing strategy document portal for a health coaching brand targeting women 40–60 in the Wasatch Front. The content covers a phased Meta Ads campaign plan, creative copy analysis, budget strategy, and actionable recommendations. The tone should be professional, trustworthy, and warm — not cold corporate.

---

<response>
<probability>0.07</probability>
<idea>

**Design Movement:** Organic Editorial — inspired by high-end wellness magazines (Kinfolk, Well+Good) merged with modern strategy consulting decks.

**Core Principles:**
1. Warmth through texture: cream paper tones, soft shadows, and grain overlays
2. Editorial hierarchy: large pull-quotes, section dividers, and asymmetric column layouts
3. Confidence through restraint: minimal color accent (one warm terracotta) against off-white
4. Content-first: typography does the heavy lifting; no decorative clutter

**Color Philosophy:** Off-white (#FAF7F2) background evokes a printed report. Charcoal (#2D2926) for body text. Terracotta (#C4603A) as the single accent for CTAs, phase labels, and highlights. Sage green (#7A9E7E) as a secondary accent for "positive" signals (commendations, green lights).

**Layout Paradigm:** Asymmetric two-column editorial grid. Left column (narrow) holds section labels and phase numbers in a vertical sidebar-style. Right column (wide) holds the main content. On mobile, collapses to single column with left-aligned labels above content.

**Signature Elements:**
1. Phase "stamps" — large circular badges with phase number and name, reminiscent of editorial chapter markers
2. Horizontal rule dividers with a small terracotta diamond icon at center
3. Pull-quote blocks with oversized left-border accent and italic serif type

**Interaction Philosophy:** Scroll-triggered fade-ins for each section. Hover states on recommendation cards reveal a subtle terracotta left-border. Sticky left sidebar navigation highlights the active section.

**Animation:** Sections fade up (translateY 20px → 0, opacity 0 → 1) on scroll entry. Phase badges rotate slightly (0deg → 5deg) on hover. Navigation indicator slides smoothly between active items.

**Typography System:**
- Display: Playfair Display (serif) — for hero headline and section titles
- Body: DM Sans (sans-serif) — for all body text, tables, and UI
- Accent: DM Mono — for data labels, budget numbers, and metric callouts

</idea>
</response>

<response>
<probability>0.06</probability>
<idea>

**Design Movement:** Clinical Precision — inspired by Bloomberg Terminal aesthetics and McKinsey slide decks, but softened with a health/wellness warmth.

**Core Principles:**
1. Data-forward: every insight is visually quantified with charts, progress bars, or callout numbers
2. Dense but scannable: tight grid, small type, high information density
3. Trust through structure: rigid column alignment, consistent spacing units
4. Dark authority: deep navy background signals expertise and seriousness

**Color Philosophy:** Deep navy (#0F1B2D) background. Crisp white (#F5F9FF) for primary text. Electric teal (#00C2A8) as the primary accent for data highlights and CTAs. Amber (#F5A623) for warnings and budget concerns.

**Layout Paradigm:** Dashboard-style fixed sidebar navigation with scrollable main content area. Each section is a "card" with a header bar, content body, and optional data visualization.

**Signature Elements:**
1. Metric callout cards — large number + label + trend indicator (up/down arrow)
2. Phase timeline — horizontal stepper at the top of each phase section
3. Status badges — pill-shaped labels (Active, Recommended, Warning) with color coding

**Interaction Philosophy:** Sidebar navigation with active state indicator. Expandable recommendation cards. Hover tooltips on data points.

**Animation:** Sidebar slides in from left on load. Cards stagger-fade in. Number counters animate from 0 to final value on scroll entry.

**Typography System:**
- Display: Space Grotesk — geometric, technical, modern
- Body: Inter — clean, readable at small sizes
- Data: JetBrains Mono — for all numbers, budgets, and code-like labels

</idea>
</response>

<response>
<probability>0.08</probability>
<idea>

**Design Movement:** Warm Modernism — inspired by Scandinavian design principles applied to a health and wellness brand identity. Clean geometry with human warmth.

**Core Principles:**
1. Generous whitespace as a design element, not empty space
2. Warm neutrals (not cold grays) to signal approachability and health
3. Bold typographic hierarchy — size and weight variation over color variation
4. Purposeful asymmetry — content blocks offset from a strict grid to create visual interest

**Color Philosophy:** Warm white (#FDFAF6) background. Deep espresso (#1C1410) for headings. Warm stone (#8B7355) for secondary text and labels. Dusty rose (#D4A5A5) as the primary accent — feminine, sophisticated, on-brand for the target demographic. Soft sage (#A8B5A0) as a secondary accent for positive/green signals.

**Layout Paradigm:** Full-width sections with alternating left-heavy and right-heavy content blocks. Phase sections use a large phase number as a background watermark. Recommendation cards arranged in an offset masonry-style grid.

**Signature Elements:**
1. Large phase number watermarks (e.g., "01", "02") in light stone color behind section headers
2. Recommendation cards with a dusty rose top-border accent and soft drop shadow
3. A sticky progress bar at the top of the page showing scroll position through the document

**Interaction Philosophy:** Smooth scroll between sections. Cards lift slightly on hover (translateY -4px). Navigation items have an underline that slides in from left.

**Animation:** Hero text splits and fades in word by word. Section headers slide in from the left. Cards fade up on scroll entry with a 100ms stagger between siblings.

**Typography System:**
- Display: Cormorant Garamond (elegant serif) — for the hero and major section titles
- Body: Nunito Sans — friendly, rounded, highly readable
- Labels: Nunito Sans Bold — for phase labels, metric callouts, and table headers

</idea>
</response>

---

## Selected Approach: Warm Modernism (Option 3)

Rationale: The target audience is women 40–60 interested in health and wellness. The "Warm Modernism" approach aligns with the brand's identity — sophisticated yet approachable, feminine without being frivolous. The dusty rose accent is on-brand for the demographic, and the generous whitespace makes the dense strategic content feel readable and inviting rather than overwhelming.
