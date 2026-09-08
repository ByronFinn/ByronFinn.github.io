# Dissecting a PPT Agent: From Research to SVG Output


Conclusion first: this is not another "type a topic → force it into a template → output garbage" AI PPT tool.

It runs a complete expert workflow — requirement research, material retrieval, outline planning, layout planning, visual design — where every step allows manual fine-tuning, or the whole thing can run automatically end to end. In terms of output, pages generated with Gemini 3 Flash already reach commercial delivery quality.

{{< image src="/pictures/posts/ppt-agent-workflow-pipeline.svg" caption="The PPT agent's four-stage pipeline" alt="PPT Agent workflow" title="Four-stage pipeline" width="800" class="center" >}}

<!-- more -->

The whole approach comes from a share by sandun (三顿) on Linux.do — seven years teaching PPT, three years building AI products. Below, stage by stage.

## Why Every AI PPT Tool on the Market Disappoints

Nearly every AI PPT tool follows the same flow: you type a topic, it instantly spits out an outline, then stuffs content into templates. Nowhere in the process is there any "understanding the requirement" step.

But the professional process for making decks doesn't work that way. Professional design firms employ dedicated planners who first nail down three questions: who is this for? What is it saying? What outcome is it driving at? Only then does anyone start writing.

This agent ports that professional flow over.

## Stage 1: Requirement Research — Ask Before Doing

Given a topic, the agent's first move isn't generating an outline — it searches for relevant material, then questions the user like a consultant:

- Who is the audience for this deck?
- What is the core message to convey?
- Are there any must-include data points or case studies?

This step uses a structured prompt casting the AI as a "PPT structure architect," with the Pyramid Principle as the core methodology — conclusion first, upper levels govern lower levels, group like items, progress logically.

The full prompt:

```markdown
# Role: Top-tier PPT Structure Architect

## Profile
- Version: 2.0 (Context-Aware)
- Specialty: PPT logical structure design
- Strength: Applying the Pyramid Principle, combined with **background research information**, to build clear presentation logic

## Goals
Based on the **PPT topic** and **background research information (Context)** provided by the user, design a rigorously logical, clearly layered PPT outline.

## Core Methodology: The Pyramid Principle
1. Conclusion first: every section opens with its core point
2. Upper governs lower: upper-level points summarize the content beneath them
3. Grouping: items at the same level belong to the same logical category
4. Logical progression: content unfolds in a coherent order

## Important: Use the Research Information
You will receive search summaries about the topic. Be sure to consult this information when planning the outline so it fits current market realities or technical facts, rather than being fabricated.
For example: if the research shows "a certain technology is obsolete," do not present it as a core recommendation.

## Output Specification
Strictly follow this JSON format, wrapping the result in [PPT_OUTLINE] and [/PPT_OUTLINE]:

[PPT_OUTLINE]
{
  "ppt_outline": {
    "cover": {
      "title": "an attention-grabbing main title",
      "sub_title": "subtitle",
      "content": []
    },
    "table_of_contents": {
      "title": "Table of Contents",
      "content": ["Part 1 title", "Part 2 title", "..."]
    },
    "parts": [
      {
        "part_title": "Part 1: Section Title",
        "pages": [
          { "title": "Page title 1", "content": [] },
          { "title": "Page title 2", "content": [] }
        ]
      }
    ],
    "end_page": {
      "title": "Summary and Outlook",
      "content": []
    }
  }
}
[/PPT_OUTLINE]

## Constraints
1. Strictly follow the JSON format.
2. **Page count requirement**: {{PAGE_REQUIREMENTS}}
```

The output is a structured JSON outline where every page has a title but no concrete content yet.

## Stage 2: Material Retrieval — Putting Flesh on the Skeleton

The outline is the skeleton; content is the flesh. This step takes each page title from the outline apart and runs search and information gathering one by one.

The project uses a domestic search API, but if you're DIYing it yourself, sandun's recommendation is to use Grok directly — feed it the outline titles one by one and it searches, organizes, and summarizes automatically.

The key point: **never let the AI invent content out of thin air**. Every piece of information should have a source, whether financial report data, technical documentation, or industry reports. How well this step is done directly determines the credibility of the final deck.

## Stage 3: The Planning Draft — Lock the Layout Before Design

This is the stage most AI PPT tools lack, and the core difference behind professional design firms quoting 10,000+ RMB per page.

The planning draft is a simplified page mockup — no flashy styling, just the placement of content and the layout plan. What element goes in which position on each page, and in what layout, all gets locked down.

{{< image src="/pictures/posts/ppt-agent-bento-grid-concept.svg" caption="The Bento Grid layout concept" alt="Bento Grid layout" title="Bento Grid" width="800" class="center" >}}

In practice, splitting planning and design into two steps for the AI works far better than doing it in one shot. The planning step owns content organization and layout planning; the design step owns style and visuals — each does its own job.

Users can fine-tune content at this stage and run the design after confirming. Or never intervene and let the AI run the whole thing.

## Stage 4: SVG Rendering — Bento Grid Is the Key

This is the most interesting part.

The layout uses a **Bento Grid** (bento-box layout) — packing content into cards of different sizes, arranged like a Japanese bento. The visual web pages in Apple keynotes and Xiaomi's annual reports both follow this idea.

Three reasons for choosing Bento Grid:

1. **High information density**: a single page carries plenty of content without looking empty or cramped
2. **Flexible layout**: card count, size, and position combine freely, with no dependence on fixed templates
3. **AI can understand it**: the most critical one. "Cards" are the design language AI grasps most easily — far more controllable than free-form layout

The full Bento Grid layout specification:

```markdown
Bento Grid layout for content pages
This is a flexible grid system whose layout should be driven by the needs of the content itself,
rather than rigid templates. Combine cards of different sizes to create dynamic, visually
interesting layouts.
- Core principles:
    - Flexibility: the number of cards is not fixed. It can be 1, 2, 3, 4, 5, or more,
      depending on what best presents the information.
    - Hierarchy: use card sizes to establish visual hierarchy. The most important
      information goes on the largest card.
    - Whitespace: keep at least 20px of spacing between all cards.
- Example layout combinations:
    - Single focus: one large card covering most of the area (w=1200, h=580). Suited to a
      single, powerful message or a detailed chart.
    - Two-column layouts:
        - 50/50 symmetric: two cards of equal width.
        - Asymmetric: one wider card (e.g., 2/3 width) for the main content, one narrower
          (1/3 width) for supporting information, data, or images.
    - Three-column layout: three equal-width cards, ideal for comparing three items side
      by side.
    - Hero plus support: one large centered card with a smaller vertical card on each side.
    - Top hero: a wide "hero" card on top, with a grid of 2-4 smaller equal-width cards
      below.
    - Mixed grid (most freedom): freely mix cards of various sizes, e.g., one medium
      square, two small horizontal rectangles, and one vertical rectangle. This adapts
      extremely well to different content needs.
```

The full SVG rendering prompt:

```markdown
As an expert in information architecture and SVG coding, your task is to convert the complete
text content into a high-quality, structured SVG presentation page with a sense of refinement,
simplicity, and professionalism. Requirements:

1. Canvas: the SVG viewBox must be 0 0 1280 720.

2. Bento Grid layout for content pages
This is a flexible grid system whose layout should be driven by the needs of the content itself,
rather than rigid templates. Combine cards of different sizes to create dynamic, visually
interesting layouts.
- Core principles:
    - Flexibility: the number of cards is not fixed. It can be 1, 2, 3, 4, 5, or more,
      depending on what best presents the information.
    - Hierarchy: use card sizes to establish visual hierarchy. The most important
      information goes on the largest card.
    - Whitespace: keep at least 20px of spacing between all cards.
- Example layout combinations:
    - Single focus: one large card covering most of the area (w=1200, h=580). Suited to a
      single, powerful message or a detailed chart.
    - Two-column layouts:
        - 50/50 symmetric: two cards of equal width.
        - Asymmetric: one wider card (e.g., 2/3 width) for the main content, one narrower
          (1/3 width) for supporting information, data, or images.
    - Three-column layout: three equal-width cards, ideal for comparing three items side
      by side.
    - Hero plus support: one large centered card with a smaller vertical card on each side.
    - Top hero: a wide "hero" card on top, with a grid of 2-4 smaller equal-width cards
      below.
    - Mixed grid (most freedom): freely mix cards of various sizes, e.g., one medium
      square, two small horizontal rectangles, and one vertical rectangle. This adapts
      extremely well to different content needs.

Please output the SVG code based on my content. My content is:
```

Layout combinations can be single focus, symmetric/asymmetric two-column, three-column parallel, top hero, mixed grid, and so on — entirely content-driven.

The output format is SVG rather than HTML. Reasons:

- SVG imports directly into Office 2016+ and stays fully editable
- Every design tool (Figma, Sketch, Illustrator) supports it
- Vector format — scale infinitely without blurring
- The cost is that parsing and rendering SVG took enormous engineering work — nobody had done it, so everything started from zero

If you don't need editability, HTML is easier to generate, and Gemini's HTML output quality is high too.

## Real Output and Cost

The screenshots at the top of the article are all Gemini 3 Flash output. For higher quality requirements, step up to Gemini 3.1 Pro.

On cost: Flash pricing is low enough that running the complete pipeline stays within acceptable bounds. The Pro version looks better but doubles the cost — save it for important occasions.

## The Shortest Path to Reproduce It Yourself

If you want to run this pipeline yourself:

1. Use the Pyramid Principle prompt to generate a structured outline (full prompt above)
2. Use Grok to retrieve material page by page
3. Have the AI generate a simplified planning draft
4. Use the Bento Grid + SVG prompt to generate the final design

No coding is needed for the whole process — just feed each step's output into the next step. The key is to skip no step — especially the planning draft.

## A Few Observations

What makes this pipeline work isn't any single brilliant prompt — it's **decomposing a human expert's workflow cleanly, then having AI execute it step by step**. The planner/designer division of labor applies to AI just the same.

This approach probably uses only 5% of what AI can do for PPT. The SVG format itself still has plenty of limitations — style consistency across pages, complex animation, and chart rendering remain open problems. But as a mid-2026 solution, it already reaches a commercially usable level.

Source: [sandun's original post on Linux.do](https://linux.do/t/topic/1782304)

