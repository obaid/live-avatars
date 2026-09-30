import { createServer } from 'node:http'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { MODELS, inputFor, queueUrl, resultMedia, validateRequest } from './queue.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const port = Number(process.env.PORT || 4175)
const jobs = new Map()
const staticFiles = new Map([
  ['/', ['public/index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['public/styles.css', 'text/css; charset=utf-8']],
  ['/app.js', ['public/app.js', 'text/javascript; charset=utf-8']],
  ['/appearance.mjs', ['src/appearance.mjs', 'text/javascript; charset=utf-8']],
])
const stateNames = new Set(['idle','greeting','working','waiting','attention','celebrating','thinking','computer','confused','sleeping','tired','excited'])
const clipNames = new Set([...stateNames].flatMap(name => [name+'-h3', ...(['idle','working','celebrating'].includes(name) ? [name+'-h3-alt'] : [])]))

function reply(res, code, value) {
  res.writeHead(code, { 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store', 'x-content-type-options':'nosniff' })
  res.end(JSON.stringify(value))
}
function fail(res, code, message) { reply(res, code, { error: message }) }
async function json(req, max = 11_500_000) {
  let size = 0; const chunks = []
  for await (const chunk of req) { size += chunk.length; if (size > max) throw Error('Request too large.'); chunks.push(chunk) }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}
async function falRequest(url, key, options = {}) {
  const response = await fetch(queueUrl(url), { ...options, headers: { Authorization: `Key ${key}`, 'Content-Type':'application/json' }, signal: AbortSignal.timeout(60_000) })
  if (!response.ok) throw Error(`fal returned HTTP ${response.status}. Check your key, credits, and model access.`)
  return response.json()
}
function keyFor(req) {
  const key = req.headers['x-fal-key'] || process.env.FAL_KEY
  if (typeof key !== 'string' || key.length < 10 || key.length > 300 || /\s/.test(key)) throw Error('Enter a valid fal key to generate.')
  return key
}
async function saveMedia(job, url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(120_000) })
  if (!response.ok) throw Error(`Media download returned HTTP ${response.status}.`)
  if (Number(response.headers.get('content-length')) > 64_000_000) throw Error('Generated media exceeded 64 MB.')
  const chunks = []; let bytes = 0
  for await (const chunk of response.body) { bytes += chunk.length; if (bytes > 64_000_000) throw Error('Generated media exceeded 64 MB.'); chunks.push(chunk) }
  await mkdir(path.join(root,'generated'), { recursive: true })
  job.file = path.join(root,'generated',`${job.id}.${job.kind === 'image' ? 'png' : 'mp4'}`)
  await writeFile(job.file, Buffer.concat(chunks))
  job.media = `/api/jobs/${job.id}/media`
}
async function handle(req,res) {
  const origin = req.headers.origin
  if (origin && origin !== `http://127.0.0.1:${port}` && origin !== `http://localhost:${port}`) return fail(res,403,'Only the local playground may call this server.')
  const url = new URL(req.url,'http://127.0.0.1')
  try {
    if (url.pathname === '/api/health' && req.method === 'GET') return reply(res,200,{ ready:true, localOnly:true })
    if (url.pathname === '/api/jobs' && req.method === 'POST') {
      const key = keyFor(req), request = validateRequest(await json(req)), model = MODELS[request.kind]
      const queued = await falRequest(`https://queue.fal.run/${model}`,key,{ method:'POST', body:JSON.stringify(inputFor(request)) })
      if (!queued.request_id || !queued.status_url || !queued.response_url) throw Error('fal returned an incomplete queue response. Check request history before retrying.')
      const job = { id:randomUUID(), kind:request.kind, model, requestId:queued.request_id, statusUrl:queueUrl(queued.status_url), responseUrl:queueUrl(queued.response_url), status:'IN_QUEUE', created:Date.now(), media:null }
      jobs.set(job.id,job)
      return reply(res,202,{ id:job.id, status:job.status, requestId:job.requestId })
    }
    const match = url.pathname.match(/^\/api\/jobs\/([0-9a-f-]{36})(\/media)?$/)
    if (match && req.method === 'GET') {
      const job = jobs.get(match[1]); if (!job) return fail(res,404,'Job not found in this server session.')
      if (match[2]) { if (!job.file) return fail(res,404,'Media not ready.'); const file = await readFile(job.file); res.writeHead(200,{ 'content-type':job.kind === 'image'?'image/png':'video/mp4', 'content-length':file.length, 'cache-control':'no-store', 'x-content-type-options':'nosniff' }); return res.end(file) }
      const key = keyFor(req)
      if (job.status !== 'COMPLETED' && job.status !== 'FAILED') {
        const state = await falRequest(job.statusUrl,key)
        job.status = state.status
      }
      if (job.status === 'COMPLETED' && !job.media) {
        const result = await falRequest(job.responseUrl,key)
        await saveMedia(job,resultMedia(job.kind,result))
      }
      return reply(res,200,{ id:job.id, status:job.status, requestId:job.requestId, media:job.media, error:job.status === 'FAILED'?'The generation failed; check your fal request history.':undefined })
    }
    if (req.method !== 'GET') return fail(res,405,'Method not allowed.')
    let file = staticFiles.get(url.pathname)
    if (!file) {
      const clip = url.pathname.match(/^\/sample\/clips\/([a-z-]+)\.mp4$/)
      const portrait = url.pathname.match(/^\/sample\/portraits\/([a-z]+)\.jpg$/)
      if (clip && clipNames.has(clip[1])) file = [`public${url.pathname}`,'video/mp4']
      if (portrait && stateNames.has(portrait[1])) file = [`public${url.pathname}`,'image/jpeg']
    }
    if (!file) return fail(res,404,'Not found.')
    const data = await readFile(path.join(root,file[0]))
    res.writeHead(200,{ 'content-type':file[1], 'content-length':data.length, 'cache-control':url.pathname.startsWith('/sample/')?'public, max-age=3600':'no-store', 'x-content-type-options':'nosniff', 'content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'" })
    return res.end(data)
  } catch (error) { return fail(res,400,error instanceof Error ? error.message : 'Request failed.') }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createServer((req,res) => { void handle(req,res) }).listen(port,'127.0.0.1',() => console.log(`Live Avatars: http://127.0.0.1:${port}`))
}
export { handle }
