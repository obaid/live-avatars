# How we made a cute animated avatar that stays the same character

*X Article draft · by Obaid Ahmed · attach `docs/playground.png` as the cover image*

I wanted Nestor to feel present while it helped with a task. The expressive feel of [ChatGPT dots](https://help.openai.com/en/articles/20001530-getting-started-with-your-dot), [Grok Bot](https://x.ai/news/designing-grok-bot), and [Meta Muse](https://research.meta.ai/blog/bringing-your-muse-to-life) was the inspiration. A tiny glance, a blink, or a moment of celebration can make an assistant feel warmer. But if every animation comes back with different eyes or a new silhouette, that personality falls apart.

We ended up with one fuzzy character, twelve emotional states, fifteen short motion clips, and live color/accessory customization. The app plays it all offline. Here's the pipeline—and a [playground you can run locally](https://github.com/obaid/live-avatars) with your own fal.ai key.

This is Nestor's own character and implementation, not a copy of those products' assets or an account of their technical internals.

## 1. Lock the character before adding emotion

Our reference was Nestor's two-eyed jelly mark. We used Nano Banana 2's image-edit endpoint to turn that into one approved master portrait. The prompt specified the silhouette, eye spacing, short fuzzy material, centered framing, soft light, and pale background. It also forbade the easy ways a model can drift: extra limbs, a mouth, text, and props.

Each expression still started from that approved master—not from a new text prompt alone. The stills could change a gaze, eyelids, or a slight tilt, but had to keep the same face and body. We treated the fuzzy surface as a separate editing problem and rejected outputs that changed the eyes. One sleeping portrait opened its eyes, so we replaced it before animating. The consistency came from both constraints and curation.

## 2. Animate less

We sent the approved stills to H3 Max Turbo image-to-video. A useful motion prompt asked for one eye movement, one small body movement, a locked camera, and a return to the starting pose. We supplied the same still as the first and last frame to encourage a loop. Then we checked the first, middle, and last frames of every result, looking for changed proportions, invented limbs, disappearing props, or eye drift.

The restrained takes looked more alive than the busy ones because you could still recognize Nestor. We encoded the chosen videos as silent 320×320 H.264 clips at 24 fps. All fifteen together are about 1.12 MB.

## 3. Do personalization at playback time

Five colors × three accessory options × twelve expressions would require 180 variants if every combination were generated separately. We instead draw the chosen clip into a small Canvas. A selective tint changes the mint fur while preserving its lightness and texture. The eyes, laptop, and background remain intact. A face anchor derived from the frame places SVG glasses or a bow over the moving avatar.

This is curated video and pixel-level compositing, not a real-time 3D rig. It also means the app makes no model call when a user changes color or assigns work. Task events select a state: computer work when it's actually using the browser, attention when it needs a decision, celebration on completion. Reduced Motion shows a matching still.

## Try it yourself

The [Live Avatars repo](https://github.com/obaid/live-avatars) includes all twelve sample states, the appearance layer, editable prompts, and a small local fal queue proxy. Clone it, run `npm start`, and play with the sample for free. To generate your own portrait or clip, upload a reference you can use and paste a fal key into the local playground. Each click submits one explicit paid job; it never launches a full batch behind your back.

The key stays in the browser tab's memory and goes only to the loopback server and fal. Keep the playground local. The full [technical walkthrough](https://github.com/obaid/live-avatars/blob/main/docs/how-we-made-cute-avatars.md) covers the tradeoffs and the offline player architecture.

The lesson for me: give the model very little freedom where identity matters, and just enough where emotion matters.
