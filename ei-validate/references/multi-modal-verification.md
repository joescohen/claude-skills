# Multi-Modal Verification Techniques

This document details how to perform verification through multiple channels. Read this when you need
guidance on how to cross-reference visual, structural, and interactive evidence.

---

## The Screenshot Rule — gestalt from pixels, content from the DOM

Take a screenshot before declaring something "works" — but be precise about what a screenshot
can and cannot prove. A screenshot is ground truth for **visual gestalt**: layout, overlap,
z-index, color, alignment, "did it render at all." It is **not** reliable ground truth for
**content or legibility** — exact text, numeric values, font size, and contrast must be read
from the DOM / computed CSS (see "DOM / Accessibility Tree Verification" below).

Why: every image you view is downscaled by the vision model to ≤1568px on its long edge and
~1.15 megapixels. Fine text in a full-window capture is destroyed by that resize — you end up
squinting at 6px glyphs and guessing. Don't guess; read `getComputedStyle`.

### Capture quality — make the screenshot worth reading

A blurry screenshot is not evidence. Before you rely on a screenshot for a visual claim:

- **Scope to the element under test, not the whole window.** Capture the one panel/component
  you are judging (element- or region-scoped screenshot) so it fills the image budget instead
  of sharing pixels with two other panels. A 700px-wide panel captured alone is legible; the
  same panel inside a 1440px three-pane capture is not.
- **Capture at 2× device scale** (`deviceScaleFactor: 2` in Playwright/Puppeteer; on a browser
  MCP that can't set DPR, zoom the page or scroll the target to fill the viewport before
  capturing). 2× renders glyphs with double the detail *before* the model's downscale.
- **Keep the delivered image ≤~1568px long edge / ~1.1MP.** 2× of a *small scoped region* stays
  under budget; 2× of a full page blows past it and gets shrunk back to mush. Never use a
  full-page (`fullPage: true`) capture to read detail — it is for structure/scroll only.
- **Prefer PNG** for UI (sharp text edges); JPEG compression smears small type.

If a screenshot is too low-resolution to read the text you are judging, that is a **capture
failure — not a pass and not a fail.** Re-capture scoped + at 2×, or fall back to computed CSS.
Never record a verdict from an illegible image.

**What to look for in a screenshot:**

- **Layout**: Are elements where they should be? Any overlapping? Any off-screen content?
- **Text**: Is it readable? Correct font? Correct size? Truncated? Overflowing its container?
- **Colors**: Do they match the design system? Any elements using wrong theme colors?
- **Alignment**: Are things lined up? Consistent padding and margins?
- **Completeness**: Is everything that should be there actually visible? Missing icons? Empty spaces
  where content should be?
- **State indicators**: Loading spinners resolved? Error banners cleared? Active/selected states correct?

**Common visual bugs that pass code review:**

| Bug | Why Code Review Misses It | What Screenshot Shows |
|-----|--------------------------|----------------------|
| Z-index collision | CSS specificity is correct but visual stacking is wrong | Element hidden behind another |
| Font fallback | `font-family` declaration looks fine, but the font file is missing | Text in wrong typeface (usually system default) |
| Responsive breakage | CSS media queries exist but have wrong breakpoint values | Content crushed, overlapping, or off-screen |
| Dynamic content overflow | Container has `overflow: hidden` which seems correct | Text or images cut off mid-word/mid-image |
| Missing empty state | Code has a fallback but it renders as blank space | White void where a "No items yet" message should be |
| Color contrast failure | Color values in code look fine but don't meet WCAG guidelines | Text that's hard to read against its background |

---

## DOM / Accessibility Tree Verification

The DOM tells you what the system *thinks* is on screen. Compare it with what you *see* on screen.

**Key checks:**

- **Element existence vs. visibility**: An element in the DOM might have `display: none`, `visibility: hidden`,
  `opacity: 0`, or be positioned off-screen. Check computed styles.
- **Interactive state**: Is a button `disabled`? Is an input `readonly`? These states might not be
  visually obvious.
- **ARIA labels**: Do interactive elements have meaningful labels for screen readers?
- **Focus order**: Tab through the page. Does focus move logically? Are any elements skipped or trapped?
- **Form values**: After filling a form, are the values actually in the form fields (not just visually displayed)?

**DOM-Visual disagreements that indicate bugs:**

| DOM Says | Screenshot Shows | Likely Bug |
|----------|-----------------|-----------|
| Button exists | Button not visible | CSS hiding (z-index, overflow, positioning) |
| Input has value | Input appears empty | Value set on wrong element, or display vs. value mismatch |
| Modal is `display: none` | Modal is visible | Multiple modals or stale state |
| List has 5 items | Only 3 visible | Container overflow, virtualization bug, or render error |
| Error message present | No error visible | Error div positioned off-screen or behind another element |

---

## Interaction Verification

Actually use the system. Click buttons, fill forms, drag elements, navigate between pages.

**After each interaction, verify:**

1. **Immediate feedback**: Did something visually change? Did a loading indicator appear?
2. **Completion signal**: Did the action finish? Is there a success message, a state change, a redirect?
3. **Side effects**: Did related UI elements update? Did a list count change? Did a map pin move?
4. **Persistence**: Refresh the page. Is the change still there?
5. **Undo**: Can the user reverse the action? Does undo work correctly?

**High-value interactions to test:**

| Interaction | What Goes Wrong |
|-------------|----------------|
| Double-click on a submit button | Duplicate records, double charges, error from second submission |
| Fill form → navigate away → come back | Data lost? Unsaved changes warning? |
| Drag item to new position → refresh page | Reorder not persisted to database |
| Click rapidly between tabs/views | Race condition, stale data from previous view, visual glitch |
| Submit form with browser autofill | Autofill populates wrong fields, breaks validation |
| Paste rich text into a plain text field | HTML/markup appears as visible text |
| Resize browser while modal is open | Modal loses centering, content becomes inaccessible |
| Open multiple browser tabs of the app | State conflicts, stale cache, session issues |

---

## Data Verification

When the system displays data (from a database, API, or AI model), verify it's correct.

**Techniques:**

- **Source comparison**: Compare the displayed value against the raw data source (database, API response)
- **Calculation check**: If the UI shows a computed value (total, average, percentage), verify the math
- **Cross-page consistency**: If the same data appears on multiple pages, verify it matches everywhere
- **Temporal accuracy**: Are dates, times, and durations correct? Do timezones render correctly?
- **Geocoding accuracy**: If locations are shown on a map, are the pins in the right place? (A common
  bug: "Paris, Texas" instead of "Paris, France")

---

## Console & Network Verification

Check the browser console and network tab for issues that aren't visible in the UI.

**Console:**
- JavaScript errors (uncaught exceptions, type errors, null reference)
- Console warnings (deprecation notices, missing resources)
- Failed assertions or debug messages from the app itself

**Network:**
- Failed HTTP requests (4xx, 5xx responses)
- Unexpectedly slow requests (>2 seconds for a simple API call)
- Missing resources (404 for images, fonts, scripts)
- CORS errors
- Requests that fire but receive no response (hung connections)

These are "invisible bugs" — the UI might look fine while the console is full of errors. A swallowed
error today becomes a visible bug tomorrow.

---

## The Cross-Reference Checklist

For any claim you make in the audit report ("Feature X works correctly"), verify you have evidence
from at least 2 of these channels:

- [ ] **Visual**: Screenshot showing correct rendering
- [ ] **Structural**: DOM/accessibility tree confirming element state
- [ ] **Interactive**: Successful completion of the user action
- [ ] **Data**: Correct values displayed and persisted
- [ ] **Console**: No errors or warnings related to this feature

A finding supported by only one channel is a hypothesis. A finding supported by two or more channels
is a confirmed issue.

---

## Cross-Cutting Checklist

After completing individual use cases, check these system-wide qualities that span all features:

**Visual consistency**
- [ ] Fonts match across all pages (no stray fallbacks or wrong typefaces)
- [ ] Colors follow the design system consistently (no rogue hex values)
- [ ] Spacing and component styles are uniform (padding, margins, border radii)
- [ ] Icons and imagery are consistent in style and size

**Navigation coherence**
- [ ] User can always get back to where they started (back button, breadcrumbs, home link)
- [ ] No dead-end pages (every page has a clear next action or navigation path)
- [ ] Browser back/forward buttons work correctly (no broken history states)
- [ ] Deep links work (pasting a URL directly loads the correct page and state)

**Error handling**
- [ ] Network disconnect mid-action: does the UI show an error or silently fail?
- [ ] Missing required fields: does the form show clear validation messages?
- [ ] Invalid URL: is there a 404 page, or a blank screen?
- [ ] Double-click on submit: does it create duplicate records or handle gracefully?
- [ ] Page refresh mid-flow: does the user lose their work, or is state preserved?
- [ ] Expired session: does the system redirect to login with a clear message?
- [ ] Unauthorized access: does visiting a restricted URL show a proper error?

**Performance signals**
- [ ] No actions take noticeably long (>2 seconds) without a loading indicator
- [ ] Loading spinners/skeletons resolve to actual content (not stuck indefinitely)
- [ ] Large lists/datasets don't freeze the UI (pagination or virtualization works)
- [ ] Animations are smooth (no janky transitions or layout thrashing)

**Empty states**
- [ ] Every page/feature shows a friendly message when no data exists
- [ ] No blank white voids, raw error messages, or placeholder text like "undefined"
- [ ] Empty states include a clear call to action ("Add your first item")

**Data persistence**
- [ ] Created data survives page refresh
- [ ] Created data survives navigating away and back
- [ ] Created data survives logout and login
- [ ] Edits and deletions persist across all three scenarios above
- [ ] No stale cache showing outdated data after mutations
