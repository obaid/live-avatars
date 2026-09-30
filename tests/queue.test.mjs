import test from 'node:test'
import assert from 'node:assert/strict'
import { MODELS, inputFor, queueUrl, mediaUrl, resultMedia, validateRequest } from '../src/queue.mjs'

const reference='data:image/png;base64,iVBORw0KGgo='
test('image and motion requests use the documented, fixed model endpoints',()=>{
  assert.equal(MODELS.image,'fal-ai/nano-banana-2/edit')
  assert.equal(MODELS.video,'minimax/h3-max-turbo/image-to-video')
  const image=inputFor(validateRequest({kind:'image',prompt:'  keep the eyes  ',reference}))
  assert.deepEqual(image.image_urls,[reference]); assert.equal(image.prompt,'keep the eyes')
  const video=inputFor(validateRequest({kind:'video',prompt:'blink',reference}))
  assert.equal(video.image_url,reference); assert.equal(video.end_image_url,reference)
  assert.equal(video.prompt_expansion_mode,'disabled')
})
test('provider URLs and user inputs cannot become arbitrary proxy targets',()=>{
  assert.throws(()=>validateRequest({kind:'__proto__',prompt:'hi',reference}))
  assert.throws(()=>validateRequest({kind:'video',prompt:'hi',reference:'https://localhost/secret'}))
  assert.throws(()=>queueUrl('https://queue.fal.run.evil.test/job'))
  assert.throws(()=>queueUrl('http://queue.fal.run/job'))
  assert.throws(()=>mediaUrl('http://127.0.0.1/private'))
  assert.throws(()=>mediaUrl('https://evil.test/file.png'))
  assert.equal(resultMedia('image',{images:[{url:'https://v3.fal.media/files/example.png'}]}),'https://v3.fal.media/files/example.png')
})
