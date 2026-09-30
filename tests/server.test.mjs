import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { handle } from '../src/server.mjs'

test('local sample works without a key; one mocked paid request can finish without leaking credentials', async()=>{
  const nativeFetch=globalThis.fetch
  const calls=[]
  globalThis.fetch=async(url,options={})=>{
    const value=String(url)
    if(value.startsWith('https://queue.fal.run')){
      calls.push({url:value,authorization:options.headers?.Authorization})
      if(options.method==='POST')return new Response(JSON.stringify({request_id:'request-1',status_url:'https://queue.fal.run/status-1',response_url:'https://queue.fal.run/result-1'}),{status:200})
      if(value.endsWith('status-1'))return new Response(JSON.stringify({status:'COMPLETED'}),{status:200})
      return new Response(JSON.stringify({images:[{url:'https://v3.fal.media/files/example.png'}]}),{status:200})
    }
    if(value==='https://v3.fal.media/files/example.png')return new Response(Buffer.from([137,80,78,71]),{status:200,headers:{'content-type':'image/png'}})
    throw Error('Unexpected network request')
  }
  const server=createServer((req,res)=>{void handle(req,res)});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve))
  const base=`http://127.0.0.1:${server.address().port}`
  try{
    const sample=await nativeFetch(base+'/sample/portraits/idle.jpg');assert.equal(sample.status,200);assert.equal(sample.headers.get('content-type'),'image/jpeg')
    const noKey=await nativeFetch(base+'/api/jobs',{method:'POST',headers:{'content-type':'application/json'},body:'{}'});assert.equal(noKey.status,400)
    const blocked=await nativeFetch(base+'/api/health',{headers:{origin:'https://external.example'}});assert.equal(blocked.status,403)
    const submit=await nativeFetch(base+'/api/jobs',{method:'POST',headers:{'content-type':'application/json','x-fal-key':'example-not-a-real-key'},body:JSON.stringify({kind:'image',prompt:'a curious blink',reference:'data:image/png;base64,iVBORw0KGgo='})})
    assert.equal(submit.status,202);const job=await submit.json();assert.equal(job.requestId,'request-1');assert.ok(!JSON.stringify(job).includes('example-not-a-real-key'))
    const poll=await nativeFetch(base+`/api/jobs/${job.id}`,{headers:{'x-fal-key':'example-not-a-real-key'}});assert.equal(poll.status,200);const done=await poll.json();assert.equal(done.status,'COMPLETED');assert.equal(done.media,`/api/jobs/${job.id}/media`)
    const media=await nativeFetch(base+done.media);assert.equal(media.status,200);assert.deepEqual(Buffer.from(await media.arrayBuffer()),Buffer.from([137,80,78,71]))
    assert.equal(calls.length,3);assert.ok(calls.every(call=>call.authorization==='Key example-not-a-real-key'))
  } finally {globalThis.fetch=nativeFetch;await new Promise(resolve=>server.close(resolve))}
})
