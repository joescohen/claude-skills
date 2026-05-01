# Use-Case Generation Reference

This document provides detailed guidance on generating effective use cases for system validation.
Read this when you need help creating use cases that are genuinely exhaustive.

---

## The Input-Method Rotation Pattern

If a system supports multiple ways to accomplish the same goal, each method is its own bug surface.
Create at least one use case per input method.

**Example — a travel app with 4 trip creation methods:**

| Use Case | Input Method | Why This Matters |
|----------|-------------|-----------------|
| UC-01 | AI Chatbot — paste a detailed trip description | Tests NLP parsing, entity extraction, geocoding from freeform text |
| UC-02 | Manual form entry — add each item one by one | Tests form validation, field constraints, save/load cycle |
| UC-03 | Freeform journal paste — multi-paragraph text block | Tests text parsing, structure inference, paragraph boundary detection |
| UC-04 | Mixed — chatbot skeleton + manual edits | Tests interop between creation methods, edit-after-generate flow |

**Example — an e-commerce product listing system:**

| Use Case | Input Method | Why This Matters |
|----------|-------------|-----------------|
| UC-01 | Single product form | Tests field validation, image upload, category selection |
| UC-02 | CSV bulk import | Tests parsing, error handling for malformed rows, duplicate detection |
| UC-03 | API endpoint | Tests schema validation, auth, response codes |
| UC-04 | Duplicate existing listing | Tests copy logic, unique field generation, image cloning |

---

## The State-Space Pattern

Every feature exists in multiple states. Most bugs hide in the states nobody thinks to test.

For each feature, exercise:

| State | What to look for |
|-------|-----------------|
| **Empty** | Is there a friendly empty-state message? Or a blank page? Or an error? |
| **Single item** | Does the UI handle the simplest case correctly? Singular vs. plural labels? |
| **Typical** | The happy path — 3-10 items, normal data |
| **Full / overflow** | 50+ items. Does pagination work? Does the UI scroll? Does performance degrade? |
| **Error** | Network failure mid-action. Invalid data. Expired session. Missing permissions. |
| **Loading** | Is there a skeleton/spinner? Does it resolve? What if it takes 10 seconds? |
| **Stale** | Data created yesterday. Is it still correct? Did any timestamps drift? |

---

## Real Data Matters

Use real place names, product names, dates, and amounts. Real data catches bugs that "Test Item 1" never will.

**Bad use-case data:**
```
Activity: "Test Restaurant"
Location: "Test City"
Date: "Tomorrow"
```

**Good use-case data:**
```
Activity: "Remi Flower & Coffee"
Location: "234 W 42nd St, New York, NY 10036"
Date: "2026-05-15" (an actual Thursday — catches day-of-week logic)
```

Why? Real data exposes:
- **Character encoding**: "Café résumé naïve" breaks systems that don't handle diacritics
- **Geocoding accuracy**: "Sacré-Cœur Basilica" might geocode to the wrong location
- **Display overflow**: "American Museum of Natural History" is longer than most UI cards expect
- **Special characters**: Apostrophes in "Joe's Pizza" break unescaped SQL or HTML

---

## The Persona Variation Pattern

Different users trigger different bugs.

| Persona | What they test |
|---------|---------------|
| **First-time user** | Onboarding flow, empty states, discoverability, default settings |
| **Power user** | Keyboard shortcuts, bulk operations, advanced filters, performance at scale |
| **Error-prone user** | Undo/redo, validation messages, recovery from mistakes, back-button behavior |
| **Mobile user** | Touch targets, responsive layout, scroll behavior, orientation changes |
| **Accessibility user** | Screen reader labels, keyboard navigation, focus management, contrast ratios |
| **Returning user** | Session persistence, data retention, "what changed" indicators |
| **Read-only viewer** | Shared/public links, permission enforcement, hidden edit controls |

---

## The Feature × Method × State Coverage Matrix

This is the single most important artifact for ensuring exhaustive coverage. Build it early, reference it
throughout the audit, and fill gaps as you find them.

```
                  | Manual | Chatbot | Import | Happy | Empty | Error | Overflow
------------------|--------|---------|--------|-------|-------|-------|--------
Create item       | UC-02  |  UC-01  | UC-03  | UC-01 | UC-04 | UC-07 | UC-09
Edit item         | UC-02  |  UC-05  |   —    | UC-02 |   —   | UC-07 |   —
Delete item       | UC-02  |    —    |   —    | UC-02 |   —   |   —   |   —
Reorder items     | UC-02  |    —    |   —    | UC-02 |   —   |   —   | UC-06
Search/filter     | UC-08  |    —    |   —    | UC-08 | UC-04 |   —   | UC-06
Map display       | UC-01  |  UC-01  | UC-03  | UC-01 | UC-04 |   —   | UC-06
Share             | UC-01  |    —    |   —    | UC-01 |   —   |   —   |   —
Export            |   —    |    —    |   —    |   —   |   —   |   —   |   —
```

Every `—` is a coverage gap. Some gaps are acceptable (not every combination is meaningful), but each one
should be a conscious decision, not an oversight. The "Export" row above shows a feature that's completely
untested — that's a red flag.

---

## Generating Use Cases from a Codebase

When creating use cases for a system you haven't used before:

1. **Read the routes/pages** — `app/routes/`, `pages/`, router config, navigation component. Each route is
   a surface to test.

2. **Read the component tree** — Look for form components, modal dialogs, interactive widgets. Each one
   has states and edge cases.

3. **Read the API endpoints** — Each endpoint represents a user action that should be testable through
   the UI.

4. **Read the database schema** — Each table/collection represents a data entity with create/read/update/
   delete operations to verify.

5. **Read existing tests** — They tell you what the developers thought was important. The gaps between
   what's tested and what exists in the codebase are where your use cases should focus.

6. **Read the README and docs** — They describe the intended user experience. Compare intent vs. reality.

---

## Example: Complete Use Case

This shows the level of detail that makes a use case genuinely useful for catching bugs:

```markdown
### UC-02: Paris, France — 2 Days (Manual Entry)

**Goal:** Add a multi-day trip entirely through manual form entry, exercising
the add/edit/reorder flow
**Input method:** DIY manual entry — add each activity via the Add Activity form
**Persona:** Methodical planner who enters everything by hand
**Prerequisites:** Fresh account, logged in, no existing trips

**Steps:**
1. Click "New Trip" → enter "Paris, France", dates May 15-16 2026
2. Verify the trip page loads with 2 empty days showing correct dates
3. On Day 1, add activities in this order using the Add Activity form:
   - "Hotel Pullman Paris Tour Eiffel", type: hotel, no start time
   - "Louvre Museum", type: attraction, time: 09:30, note: "Book skip-line tickets"
   - "Arc de Triomphe", type: attraction, time: 15:00, note: "Climb to the top"
   - "Eiffel Tower", type: attraction, time: 17:00
   - "Le Jules Verne", type: restaurant, time: 20:30, note: "Michelin-starred"
4. Attempt to reorder: drag "Arc de Triomphe" above "Louvre Museum"
5. Edit "Le Jules Verne" — add note "Level 2 Eiffel Tower, reservation required"
6. On Day 2, add:
   - "Sacré-Cœur Basilica", type: attraction, time: 10:00
   - "Le Marais", type: attraction, time: 12:00
   - "Musée d'Orsay", type: museum, time: 13:30
   - "Moulin Rouge", type: other, time: 21:00, note: "Cabaret show"

**What to verify:**
- [ ] All 5 Day 1 activities appear in correct order after creation
- [ ] Drag-and-drop reorder persists after page refresh
- [ ] Hotel card shows check-in date and spans 2 days (not just Day 1)
- [ ] Map pins appear at plausible Paris locations:
  - Eiffel Tower in 7th arrondissement (west bank)
  - Louvre on the right bank near Tuileries
  - Sacré-Cœur in Montmartre (north)
  - Musée d'Orsay on the left bank
- [ ] Map routing makes geographic sense (no zigzagging across the city)
- [ ] Edit saves correctly — note appears on the card after save
- [ ] Activity type icons are correct (hotel ≠ restaurant ≠ attraction)
- [ ] Day headers show "Friday, May 15" and "Saturday, May 16" (correct day-of-week)
- [ ] Empty state for Day 2 shows a prompt to add activities (before step 6)

**Knobs to exercise:**
- [ ] Switch map tile: Street → Terrain → Satellite — all render correctly
- [ ] Toggle between Day 1 and Day 2 — route lines update to show only selected day
- [ ] Click a map pin — popup shows correct activity name and links to card
- [ ] Click a card — map flies to the correct pin location
```

Notice: this use case tests manual entry, drag-and-drop, editing, map accuracy, visual correctness,
data persistence, and multiple UI states — all in one coherent user journey. That density of coverage
within a realistic flow is what makes a good use case.

---

## Specification Detail: Section-by-Section Guidance

When building the specification in Phase 0b, use this guidance for each section.

### Section 2: Feature Inventory

For each user-facing feature, document all of these fields:

- **What it does** (in plain language, not implementation terms)
- **How the user accesses it** (navigation path, entry point, URL)
- **What correct behavior looks like** (the "golden path" — step by step)
- **What inputs it accepts** (and what it should reject with validation errors)
- **What outputs/state changes it produces** (what the user sees after the action)
- **How it interacts with other features** (does creating X update list Y?)
- **What edge cases exist** (ambiguous input, overflow, empty state, concurrent users)

Example:
```
Feature: Trip Creation via Chatbot
- Access: Home → "New Trip" → Chatbot tab
- Input: Freeform natural language description of a trip
- Expected behavior:
  - Parses destination, dates, activities, hotels, transport
  - Creates a structured itinerary with one day per date
  - Geocodes every location and places map pins
  - Sets correct activity types (restaurant, attraction, hotel, transport)
  - Handles multi-city trips with transport legs between cities
- Interactions: Created trip appears in "Your Adventures" list; map populates
- Edge cases: Ambiguous destinations ("Paris" = France not Texas),
  overlapping activities, dates in the past, no hotel mentioned
```

### Section 3: Data Model & Invariants

- What entities exist and how do they relate?
- What invariants must always hold? (e.g., "every trip has at least one day",
  "hotel check-out day ≤ trip end date", "activity times are within their day's date")
- What uniqueness constraints exist?
- What happens to related data when a parent is deleted?

### Section 4: Input Methods & Pipelines

- List every way data can enter the system (form, chat, import, API, drag-and-drop, URL)
- For each, document what fields are required, what validation exists, and what the
  expected output state is
- Note where different input methods should produce equivalent results

### Section 5: User Roles & Permissions

- What can each role do? What should they NOT be able to do?
- How does the UI change between roles? (edit buttons hidden for read-only, admin
  panels visible only to admins)
- What happens when a user without permission tries a restricted action?

### Section 6: Visual & UX Expectations

- What design system or component library is in use?
- What are the expected responsive breakpoints?
- Are there specific brand requirements (colors, fonts, tone of copy)?
- What empty states, loading states, and error states should look like?
- What animations or transitions are expected?

### Section 7: Integration Points

- What external services does the system depend on? (Maps API, AI model, payment
  processor, email service)
- What happens when an external service is slow or unavailable?
- What data comes from external sources vs. local state?
