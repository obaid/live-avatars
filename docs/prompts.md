# Prompt templates

These are the reusable constraints from the Nestor workflow, rewritten so you can adapt them to a character of your own. The exact Nestor job specs remain in the original app repository. Prompts improve consistency but cannot guarantee it; inspect and curate outputs.

## 1. Master portrait — Nano Banana 2 edit

Use a reference image that you own or have permission to edit. This is an **edit**, so send the reference in `image_urls`.

> Preserve the supplied character's distinctive silhouette, proportions, eye spacing, face, and recognizable identity. Make a dimensional, adorable avatar with restrained studio lighting. Full body visible and centered; straight-on locked camera; generous margins; simple pale backdrop and soft contact shadow. Keep details readable at small app sizes. Do not add limbs, extra characters, text, or unrelated props.

Recommended controls in this example: `aspect_ratio: "1:1"`, `resolution: "1K"`, `num_images: 1`, `output_format: "png"`.

## 2. Expression still — Nano Banana 2 edit

Use the **approved master** as the reference for each expression. Keep identity constraints verbatim, then change one readable cue at a time.

> Use the reference as the exact same character. Preserve body shape, face geometry, material, lighting, centered framing, and backdrop. Expression: [describe eye direction, eyelid openness, and one body tilt]. Keep the whole character visible. Do not add a mouth, limbs, text, extra characters, or props unless the state explicitly calls for one.

For sleeping, say **eyes remain fully closed**. For working on a computer, describe the laptop in both the still and video prompt so it persists. A fuzzy material pass can be made with Nano Banana 2 by editing **only the body surface** and explicitly preserving clean eyes and props. In our batch, a first sleeping still opened its eyes; we replaced it before animating.

## 3. Motion — H3 Max Turbo image-to-video

Pass the approved still as both `image_url` and `end_image_url` for a short loop. This encourages a matching endpoint; it does not guarantee a seamless edit.

> Animate only the exact character in the supplied image. Locked camera, no zoom or cuts. Preserve silhouette, eye geometry, material, lighting, centered composition, and pale background throughout. Begin and end in the exact supplied pose. Smooth, restrained movement. Motion: [one eye action, one body action, one blink]. No new limbs, mouth, text, particles, or extra characters. Silent.

Our sample used `duration: 5`, `resolution: "480P"`, and `prompt_expansion_mode: "disabled"`. Five-second outputs were then cropped and encoded as 320×320 H.264/24 fps with audio removed for mobile playback. Idle, working, and celebrating have two curated takes to avoid mechanical repetition.

## Inspection pass

Before accepting a take, check its first, middle, and last frames. Reject clips that drift in scale, eye spacing, material, or background; invent props; open sleeping eyes; or lose a state-specific prop. Maintain a state manifest so the player maps application events to intentional emotions rather than guessing from a text label.
