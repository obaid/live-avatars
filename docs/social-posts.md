# Launch copy — review before publishing

Repository: https://github.com/obaid/live-avatars

Article: https://github.com/obaid/live-avatars/blob/main/docs/how-we-made-cute-avatars.md
Suggested visual: `docs/playground.png` or a short capture switching between idle, thinking, computer work, and celebration.

## X thread

**1/5** I built a tiny fuzzy avatar for Nestor that can think, work, wait, celebrate, and even fall asleep—without generating anything while the app runs. I open-sourced the pipeline + a playground so you can try it with your own fal.ai key: https://github.com/obaid/live-avatars

**2/5** The trick was consistency. I started from one approved reference, used Nano Banana 2 to make a master and expression stills, and kept the silhouette, eyes, lighting, and framing locked in every prompt. “Make it cute” alone gives you a different character every time.

**3/5** H3 Max Turbo turned those stills into short, restrained loops. The same image at the start and end helps the motion return home. I reviewed first/middle/last frames and threw out takes that changed the face, fur, or props.

**4/5** The app plays 15 pre-rendered clips across 12 states. Canvas recolors the fur and tracks the face for glasses or a bow, so five colors and three accessory options don't require 180 video generations. Reduced Motion uses a matching still.

**5/5** The repo has a sample you can play with for free, prompt templates, the offline renderer, and a local fal queue proxy. BYOK generation is one explicit job at a time. Full technical walkthrough: https://github.com/obaid/live-avatars/blob/main/docs/how-we-made-cute-avatars.md

## LinkedIn

I wanted Nestor’s avatar to feel like the same little companion whether it was thinking, working, waiting, or celebrating. Generating a cute still was easy. Keeping its face and material consistent across motion was the real design and engineering problem.

Here’s the pipeline we landed on:

1. Start with one approved reference. Use Nano Banana 2 to create a master portrait and expression stills, while constraining the silhouette, eye geometry, framing, and background.
2. Animate each still with H3 Max Turbo into a short, restrained loop. Give it a matching start/end image, then inspect the first, middle, and final frames. We discarded takes that invented limbs or drifted from the character.
3. Ship pre-rendered assets and play them offline. In the app, task events choose among 12 expressions. A Canvas layer recolors the fuzzy body and places glasses or a bow without multiplying the video-generation budget.

The result is 15 compact clips, a consistent companion, and no generation request during normal app use. It *looks* dimensional, but this is curated video plus pixel-level personalization, not a real-time 3D rig.

I put the working pipeline, editable prompts, and a local BYOK playground in a separate repo. The sample works without a key; bringing your own fal key lets you make a portrait or clip one job at a time.

Repo: https://github.com/obaid/live-avatars

Technical write-up: https://github.com/obaid/live-avatars/blob/main/docs/how-we-made-cute-avatars.md

If you’re building expressive assistants, I’d love to hear how you’re keeping character identity stable across states.
