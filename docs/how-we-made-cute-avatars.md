# How we made a cute animated avatar that stays the same character

*A practical image → video → offline player pipeline using fal.ai, Nano Banana 2, H3 Max Turbo, and a little Canvas. By Obaid Ahmed.*

We wanted Nestor, a personal assistant, to feel present while it worked. A mascot can do that with a glance or a tiny pause. It can also break trust if it changes face every time it blinks. The problem was less “generate a cute image” and more “keep one recognizable character across a dozen emotional states, without running a generative model in the app.”

The inspiration was the expressive presence of [ChatGPT dots](https://help.openai.com/en/articles/20001530-getting-started-with-your-dot), [Grok Bot's character system](https://x.ai/news/designing-grok-bot), and [Meta Muse](https://research.meta.ai/blog/bringing-your-muse-to-life). Nestor's artwork and the pipeline below are our own; this is a record of how we built our version, not a description of those products' internals.

The result is a fuzzy mint companion with twelve states: idle, greeting, working, waiting, needing attention, celebrating, thinking, at a computer, confused, sleeping, tired, and excited. It uses fifteen short video clips, including alternate idle, working, and celebration takes. The same face appears in every state; the user can recolor it or stack glasses and a bow without generating another video set.

![The Live Avatars playground](playground.png)

## Start with an identity, not a prompt every time

Our first reference was Nestor's existing two-eyed jelly mark. We used [Nano Banana 2's image-editing endpoint](https://fal.ai/models/fal-ai/nano-banana-2/edit/api) to turn it into a dimensional master portrait. The prompt wasn't just “make it cute.” It specified silhouette, eye spacing, eye plates, framing, backdrop, lighting, and the things the model must *not* invent: limbs, a mouth, text, and extra characters. We picked one approved master, then used it as the reference for new expression stills.

For the fuzzy finish, we ran a separate edit that changed the body surface to very short velvet-like fibers while keeping the eyes and laptop smooth. Separating material from expression helped us judge whether an output had drifted. It also exposed failures: the first sleeping portrait opened its eyes, so we replaced that still before making a sleeping video. AI consistency is a curation loop, not a checkbox.

## Animate restrained motions

We sent the approved stills to [H3 Max Turbo's image-to-video endpoint](https://fal.ai/models/minimax/h3-max-turbo/image-to-video/api). Most prompts described one eye movement, one body movement, and a return to the original pose. We supplied the same image as first and last frame to encourage repeatable five-second loops, with a locked camera, simple background, no invented anatomy, and no sound. Sleeping and computer work used their own stills as references so closed eyelids and the laptop remained visible.

We tried Gemini Omni Flash as a comparison. Some drafts invented limbs or altered the body and face. H3 held this particular character more consistently in the batch we reviewed, so that is what shipped. That is a result of our references and prompts, not a universal model ranking. We inspected early, middle, and late frames rather than judging only the first frame.

## Treat generation as asset production

The app never calls fal while someone is using Nestor. Our build step uses FFmpeg to crop and encode each selected clip as 320×320 H.264 at 24 fps, stripping audio. The fifteen clips total about 1.12 MB; an offline HTML player with embedded video and posters is about 1.68 MB before app-bundle compression. React Native hosts that player in a WebView; a browser can use the same player in a sandboxed iframe.

The player receives a small configuration object: `emotion`, `color`, `accessory`, `motion`, and `playing`. Application status and observed task events choose the emotion. For example, an actual browser action can show computer work; a user decision shows attention; completion earns a celebration. We do not infer “confused” or “sleeping” from a generic blocked task. Off-screen or background playback pauses. Reduced Motion shows a matching still. The celebration plays once per entry instead of bouncing forever.

## Personalize the pixels, not the whole generation budget

Generating every color and accessory combination for every state would multiply cost and make identity drift harder to control. Instead, we decode the selected video into a 320-pixel Canvas. A selective color mask changes only mint fur while retaining each pixel's lightness and chroma. The glossy eyes, laptop, and pale background stay neutral. Simple pixel heuristics find the fur bounds and eye centers, then position SVG glasses and a bow over the moving face. The playground supports four combinations—neither, either one, or both—so five colors × four combinations × twelve expressions would otherwise mean 240 separate variants. The original app's native rows used three accessory choices and baked 180 small static portraits with the same appearance functions.

This is a deliberately pragmatic architecture. The avatar looks dimensional because the source artwork and motion are rendered that way; there is no live 3D mesh, skeleton, or simulated fur. Accessory tracking can drift on difficult frames, so a production team should inspect its own clips frame by frame and test physical-device performance.

## Try the pipeline

The [Live Avatars repository](https://github.com/obaid/live-avatars) includes the playable Nestor sample, editable prompt templates, the Canvas appearance layer, and a local Node proxy for fal's asynchronous queue. Clone it, run `npm start`, and open `http://127.0.0.1:4175`. You can play with the sample without a key. To make your own, upload a reference image, paste your fal key for the current browser session, and run the master, expression, and motion steps one at a time. Each Generate click may incur a charge; the interface never silently fans out into twelve jobs.

The key stays in memory in that browser tab and goes through a server bound to `127.0.0.1`; it is not embedded in the frontend bundle, a URL, or the Git repository. Keep the playground local. If you want a public multi-user generator, add authentication, rate limits, and a proper server-side key-management design first.

For me, the biggest lesson was to give the model less freedom where identity matters and more freedom only where emotion matters. One reference, a small controlled state vocabulary, short curated loops, and an offline player were enough to make Nestor feel alive.
