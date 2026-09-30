// Shared by the offline player and portrait builder. Recolor the mint fur only;
// retain each source pixel's lightness/chroma, eyes, props and background.
export const hues = { lagoon: null, sky: 219, clay: 25, lilac: 278, lemon: 49 }
const clamp = value => Math.max(0, Math.min(1, value))
function furWeight(r, g, b) {
  return clamp((g - r - 5) / 18) * clamp((b - r - 3) / 14) * clamp((g - b + 10) / 18)
}
export function tintPixels(data, color) {
  const hue = hues[color]
  if (hue == null) return
  const h = hue / 60, x = 1 - Math.abs(h % 2 - 1)
  const channels = h < 1 ? [1,x,0] : h < 2 ? [x,1,0] : h < 3 ? [0,1,x] : h < 4 ? [0,x,1] : h < 5 ? [x,0,1] : [1,0,x]
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i+1], b = data[i+2], weight = furWeight(r,g,b)
    if (!weight) continue
    const min = Math.min(r,g,b), chroma = Math.max(r,g,b) - min
    for (let j = 0; j < 3; j++) data[i+j] = Math.round(data[i+j] + weight * (min + channels[j] * chroma - data[i+j]))
  }
}
// Track the source fur/eye positions before recoloring, so decorations follow
// the same face during a bob, blink or tilt. Props below the face are excluded.
export function faceAnchor(data, width, height) {
  let left=width, right=0, top=height, bottom=0, count=0
  for(let y=0;y<height*.87;y+=2) for(let x=0;x<width;x+=2) {
    const i=(y*width+x)*4
    if(furWeight(data[i],data[i+1],data[i+2])>.8 && data[i+1]>75) {left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);count++}
  }
  if(count<50) return null
  const w=right-left,h=bottom-top,middle=(left+right)/2
  const eyes=[{x:0,y:0,n:0},{x:0,y:0,n:0}]
  for(let y=Math.round(top+h*.28);y<top+h*.68;y+=2) for(let x=Math.round(left+w*.22);x<left+w*.78;x+=2) {
    const i=(y*width+x)*4,r=data[i],g=data[i+1],b=data[i+2]
    if(Math.max(r,g,b)<90 && Math.max(r,g,b)-Math.min(r,g,b)<35) {const eye=eyes[x<middle?0:1];eye.x+=x;eye.y+=y;eye.n++}
  }
  const a=eyes[0].n>4?{x:eyes[0].x/eyes[0].n,y:eyes[0].y/eyes[0].n}:{x:left+w*.34,y:top+h*.51}
  const b=eyes[1].n>4?{x:eyes[1].x/eyes[1].n,y:eyes[1].y/eyes[1].n}:{x:left+w*.66,y:top+h*.51}
  return {x:(a.x+b.x)/2,y:(a.y+b.y)/2,scale:Math.hypot(b.x-a.x,b.y-a.y)/74,angle:Math.atan2(b.y-a.y,b.x-a.x),bowX:left+w*.77,bowY:top+h*.1,bowScale:w/235}
}
export const accessoryArt = {
  glasses: `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="100" viewBox="0 0 160 100"><defs><linearGradient id="rim" x2="0" y2="1"><stop stop-color="#585254"/><stop offset=".5" stop-color="#25262D"/><stop offset="1" stop-color="#474149"/></linearGradient><filter id="shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-opacity=".24"/></filter></defs><g filter="url(#shadow)" stroke="url(#rim)" stroke-width="3.5" fill="#FFFFFF" fill-opacity=".025"><circle cx="43" cy="50" r="26"/><circle cx="117" cy="50" r="26"/><path d="M69 48Q80 41 91 48M17 45L9 42M143 45L151 42" fill="none" stroke-linecap="round"/></g><g stroke="#FFF" stroke-opacity=".5" stroke-width="1.2" fill="none" stroke-linecap="round"><path d="M25 38Q29 29 39 27M99 38Q103 29 113 27"/></g><g fill="#C8AE78"><circle cx="18" cy="45" r="2"/><circle cx="142" cy="45" r="2"/></g></svg>`,
  bow: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="64" viewBox="0 0 100 64"><defs><linearGradient id="fabric" x2=".4" y2="1"><stop stop-color="#F3B1A1"/><stop offset=".45" stop-color="#D98174"/><stop offset="1" stop-color="#AE5B59"/></linearGradient><linearGradient id="knot" x2="1" y2="1"><stop stop-color="#F5BBAB"/><stop offset="1" stop-color="#C5786C"/></linearGradient><filter id="shadow" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="3" stdDeviation="2" flood-opacity=".2"/></filter></defs><g filter="url(#shadow)"><path d="M48 29C35 14 14 7 10 17C6 27 9 49 17 50C26 52 40 41 48 35ZM52 29C65 14 86 7 90 17C94 27 91 49 83 50C74 52 60 41 52 35Z" fill="url(#fabric)"/><path d="M40 32L20 25M60 32L80 25M40 35L21 43M60 35L79 43" stroke="#9E5953" stroke-opacity=".3" stroke-width="1.5" stroke-linecap="round"/><rect x="42" y="24" width="16" height="18" rx="5" fill="url(#knot)"/><path d="M46 27L46 38" stroke="#FFD7C4" stroke-opacity=".55" stroke-width="1.2" stroke-linecap="round"/></g></svg>`
}
export function accessoryPlacement(anchor, accessory) {
  return accessory === 'bow' ? {x:anchor.bowX,y:anchor.bowY,angle:anchor.angle+.3,scale:anchor.bowScale,originX:50,originY:32} : {x:anchor.x,y:anchor.y,angle:anchor.angle,scale:anchor.scale,originX:80,originY:50}
}
export function placedAccessorySvg(anchor, accessory, size=320) {
  if (!anchor || !accessoryArt[accessory]) return null
  const p=accessoryPlacement(anchor,accessory)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><g transform="translate(${p.x} ${p.y}) rotate(${p.angle*180/Math.PI}) scale(${p.scale}) translate(${-p.originX} ${-p.originY})">${accessoryArt[accessory]}</g></svg>`
}
