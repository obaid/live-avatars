# From one fuzzy portrait to a consistent animated companion

*LinkedIn article draft · by Obaid Ahmed · use `docs/playground.png` as the cover image*

A cute AI-generated image is easy to make. A character that still looks like itself when it's thinking, working, waiting, and celebrating is harder. The expressive presence of [ChatGPT dots](https://help.openai.com/en/articles/20001530-getting-started-with-your-dot), [Grok Bot](https://x.ai/news/designing-grok-bot), and [Meta Muse](https://research.meta.ai/blog/bringing-your-muse-to-life) inspired us to solve that problem for Nestor, a personal assistant with its own small fuzzy companion.

We built twelve emotional states and fifteen short animations, then made the same character customizable in five colors with glasses, a bow, or both. The final app doesn't generate media during normal use. It plays small, curated assets offline.

The character and implementation here are Nestor's own; this post explains our pipeline rather than the internals of those products.

### Create one identity master

We began with Nestor's two-eyed jelly mark and used Nano Banana 2's image-editing endpoint to create a dimensional, fuzzy master portrait. The prompt locked down eye spacing, silhouette, framing, material, lighting, and background. It explicitly excluded limbs, a mouth, text, and unrelated props.

Every state portrait was edited from the approved master. We changed only the expression or a necessary prop. A separate pass introduced the short velvet-like fur while keeping the eyes and laptop smooth. We inspected the outputs and discarded any that drifted. For example, an early sleeping portrait opened its eyes; that still never became an animation.

### Give each state a small, repeatable motion

H3 Max Turbo turned approved stills into video. The prompts were intentionally quiet: a glance, a blink, a slight tilt, and a return to the original pose. We supplied the same image as the first and last frame to encourage loops. We checked early, middle, and late frames for changed eyes, new anatomy, or disappearing props instead of approving a clip from its first frame alone.

We selected fifteen takes and encoded them as silent 320×320 H.264 clips at 24 fps. Together, the clips weigh about 1.12 MB. The app's player chooses a clip based on real task events and pauses off-screen playback. Reduced Motion uses a matching still.

### Customize the player, not every asset

Pre-generating every color, accessory, and expression combination in the playground would mean 240 variants before adding alternate motions. Instead, a Canvas layer reads the video frame and recolors only the mint fur, preserving its texture and lightness. Simple face anchors place SVG glasses, a bow, or both over the moving image. The eyes, laptop, and neutral background stay untouched.

This is a practical image-to-video pipeline, not a live 3D model. The dimension comes from the rendered artwork; the responsiveness comes from local playback and compositing. It gives Nestor a stable visual identity without model latency or generation cost every time the user opens the app.

I separated the recipe into a [public-ready playground and code repository](https://github.com/obaid/live-avatars). The included sample is free to play with. If you want to create your own, run the local Node app, provide a reference image you have permission to edit, and bring your own fal.ai key. Image and motion generation happen one request at a time, so you can inspect each result before paying for the next.

The repository also includes [prompt templates and a deeper technical walkthrough](https://github.com/obaid/live-avatars/blob/main/docs/how-we-made-cute-avatars.md). I'm curious how other teams keep generated characters recognizable across states—especially once motion and personalization enter the picture.
