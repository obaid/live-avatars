import { cp, readFile, rm, writeFile } from 'node:fs/promises'

const output = new URL('../dist/', import.meta.url)
await rm(output, { recursive: true, force: true })
await cp(new URL('../public/', import.meta.url), output, { recursive: true })
await cp(new URL('../src/appearance.mjs', import.meta.url), new URL('appearance.mjs', output))

const localSetup = `<section class="make" id="make">
  <div class="make-copy"><span class="section-kicker">YOUR TURN</span>
    <h2>Make your own<br>little someone.</h2>
    <p>The character lab above is free to explore. To generate a new character from your own reference, run the playground locally and bring your fal.ai key.</p>
    <div class="notice">The live demo makes no generation requests and never asks for an API key.</div>
  </div>
  <div class="make-form local-setup">
    <h3>Three commands. Your own character lab.</h3>
    <p>Requires Node.js 20 or newer. No dependencies to install.</p>
    <pre><code>git clone https://github.com/obaid/live-avatars.git
cd live-avatars
npm start</code></pre>
    <p>Open <code>http://127.0.0.1:4175</code>, add your reference image and fal key, then generate a portrait, expression, or animation. Each generation uses your fal account and can incur charges.</p>
    <a class="secondary-link" href="https://github.com/obaid/live-avatars#run-it" target="_blank" rel="noopener noreferrer">Open setup guide <span aria-hidden="true">↗</span></a>
  </div>
</section>`

let html = await readFile(new URL('index.html', output), 'utf8')
const formSection = /<section class="make" id="make">.*?<\/section>/s
if (!formSection.test(html)) throw new Error('Could not locate the local generation section.')
html = html.replace(formSection, localSetup)
  .replace('Explore the real pipeline behind Nestor’s fuzzy companion. Play with twelve emotions, change its look, then use your own reference and fal key to make a new one.', 'Explore the real pipeline behind Nestor’s fuzzy companion. Try twelve emotions, mix colors and accessories, and watch your little character come to life. No API key needed.')
  .replace('Offline sample</span>', 'No API key needed</span>')
await writeFile(new URL('index.html', output), html)
await writeFile(new URL('.nojekyll', output), '')
console.log('GitHub Pages demo built in dist/')
