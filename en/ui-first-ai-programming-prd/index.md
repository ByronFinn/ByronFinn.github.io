# A New Playbook for AI Programming: UI First, Then the PRD


<!-- more -->

Everyone knows the standard Vibe Coding flow by now: write user stories → produce a PRD → AI generates the backend → AI generates the frontend → demo and verify. It works, but at delivery time the UI interaction experience often falls far short of expectations. Where does it go wrong? In the PRD itself.

## 1. The Fundamental Problem with PRDs

PRDs (Product Requirements Documents) were never that friendly to humans in the first place. Three reasons:

**Text descriptions are inherently ambiguous.** "After the user clicks the button, pop up a confirmation dialog" — this looks clear enough, but the button's position and size, the dialog's styling, the post-confirmation navigation logic, error handling... every detail hides room for disagreement. The more detailed the PRD, the higher the reading cost — until you can't bring yourself to reread what you wrote.

**Review is extremely inefficient.** Line-by-line reviewing a several-thousand-word PRD is nowhere near as intuitive as one glance at a page prototype. Text forces you to "render" the interface in your head, and that translation process itself introduces misunderstanding — your mental render and the AI's are probably completely different.

**The rework chain is too long.** One interaction issue means changes from the PRD to backend endpoints to frontend components — three or four hours per cycle, with token consumption in the tens of millions. And the root cause is nothing more than an initial disagreement about where a button should go.

## 2. Flip the Direction: Start from the UI

The core idea is simple: **if the UI is ultimately how you verify everything, why not start there?**

The traditional flow is `PRD → code → UI → verification`; the new flow changes it to:

`UI prototype → visual confirmation → reverse-derived PRD → engineering implementation`

This isn't wishful thinking. Plenty of practitioners in the community are already on this path:

- Some generate a set of HTML pages with Codex, then have Claude verify them via image recognition
- Some habitually "always build the UI first", deriving feature logic backward from the interface
- The recent trend of "make AI output HTML instead of Markdown" is essentially using visual form to quickly confirm whether the AI understood correctly

{{< image src="/pictures/note/ui-first-ai-workflow.svg" alt="UI-First workflow comparison" caption="Traditional flow vs UI-First flow: the core difference is where the verification step sits" >}}

## 3. A Workflow You Can Actually Run

Based on community discussions and hands-on feedback, here are the concrete steps:

### Step 1: MVP-Grade UI Prototypes

Skip the full PRD; have AI generate several HTML pages directly. These pages should include:

- All major pages and the navigation structure
- The core functional areas of each page
- Annotating comments or explanatory text (HTML comments are fine)
- Simple JS demos of key interactions (expand/collapse, tab switching, etc.)

The prompt to the AI can be dead simple: "I'm building product X. Generate HTML prototypes for these pages: home, list, detail, settings. Each page should demonstrate its core features and interaction logic."

### Step 2: Visual Review and Annotation

Open the HTML prototypes directly in a browser. The value of this step:

**Review speed jumps by an order of magnitude.** One glance tells you whether the navigation makes sense, whether information density is right, whether the operation flow is smooth. Compared with mentally "translating" PRD text, the efficiency gap is enormous.

**Precise problem localization.** Spot a missing feature and annotate it right on the page: "a filter is needed here," "this area should show recent activity." The AI can follow the context directly.

**Keep the conversation history.** Save your interactions with the AI; that context is critical when generating the PRD later.

### Step 3: Reverse-Generate a Visual PRD

This step is the workflow's key innovation. Hand the visual artifacts and conversation logs to the AI and have it generate a "visual PRD".

How this PRD differs from a traditional one:

| Dimension | Traditional PRD | Visual PRD |
|------|---------|-----------|
| Core medium | Text description | Page screenshots + interaction annotations |
| Review method | Line-by-line reading | Judged at a glance |
| Misunderstanding risk | High (requires mental rendering) | Low (WYSIWYG) |
| Gap to the product | Large (a text-to-UI chasm) | Small (only engineering left) |

A visual PRD contains: page screenshots, interaction flow descriptions, feature boundary definitions, and a data structure overview. Anyone who picks up this document can immediately picture what the product looks like and how to use it.

### Step 4: Interaction Demos (Optional Enhancement)

Going further, you can have AI produce short interaction demos for user stories:

- Narrate the full flow: "the user opens the app, sees the home recommendation list, taps a record to enter the detail page, where they can favorite and comment..."
- AI generates demo videos or motion effects from the prototype pages
- Reorganize everything together with the visual PRD

The resulting PRD has both static visuals and dynamic demos, squeezing misunderstanding down to a minimum.

### Step 5: Engineering Delivery

Only now do you bring in AI's code engineering capabilities to translate the "visual PRD" into the final product. At this point the AI has:

- Clear page structure and interaction definitions
- Context accumulated across the earlier conversation rounds
- Visually verified feature boundaries

All of this is far more explicit and actionable than a pure-text PRD.

## 4. The Actual Payoff

Judging from community feedback and hands-on experience, the advantages of this workflow concentrate in three areas:

**Less rework.** The classic "finished, and only then realized it's wrong" problem moves up to the prototype stage. Changing an HTML prototype is far faster than changing a full frontend-backend codebase, and burns an order of magnitude fewer tokens.

**Lower communication cost.** A visual PRD lets everyone involved (product, engineering, design) align on the same visual material. No more "I thought that was what you meant."

**Faster verification loops.** The time from "figuring out what you want" to "seeing what it looks like" shrinks from days to tens of minutes. You can iterate quickly across multiple options instead of betting everything on one possibly misunderstood PRD.

## 5. Limitations and Fit

This method is no silver bullet:

- **Pure backend / infrastructure projects** don't fit well — the core there is architecture design and performance metrics, not UI
- **Pages with heavy data processing** may need extra data-flow descriptions to supplement the visual prototype
- **Team collaboration** needs additional tooling to manage visual artifacts and annotations

But for most user-facing web apps, tool products, and content platforms, a UI-first workflow noticeably improves both the efficiency and the delivery quality of AI-assisted development.

## 6. Summary

The core tension of the AI programming era isn't whether AI can write code — it's whether we can express requirements clearly. Traditional text PRDs already cause endless trouble in human-to-human communication; handing them to AI for execution only amplifies the drift.

Deriving the PRD backward from the UI essentially replaces the medium humans are worst at (long text descriptions) with the one we're best at (visuals), building a more accurate channel for passing requirements between humans and AI.

This idea is still evolving. If you're doing Vibe Coding too, give it a try: on your next project, have AI draw the pages first and write the docs after. You may find the whole development process feels completely different.

