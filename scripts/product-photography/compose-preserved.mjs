import sharp from 'sharp';
import { promises as fs } from 'node:fs';
export async function composePreserved(prefix, output, {width=2048,height=2048}={}) {
 const meta=JSON.parse(await fs.readFile(prefix+'-mask.json','utf8'));
 const {data:rgb,info}=await sharp(meta.source).removeAlpha().raw().toBuffer({resolveWithObject:true});
 if(info.channels!==3)throw Error('RGB source required');
 const components=[];
 for(const instance of meta.instanceMasks){
  const alpha=await sharp(instance.mask).greyscale().raw().toBuffer();
  let left=info.width,top=info.height,right=-1,bottom=-1,area=0;
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){if(alpha[y*info.width+x]>128){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);area++;}}
  if(right<left||area<info.width*info.height*.001)continue;
  // Preserve a small margin around native mask edges, but never invent foreground pixels.
  left=Math.max(0,left-3);top=Math.max(0,top-3);right=Math.min(info.width-1,right+3);bottom=Math.min(info.height-1,bottom+3);
  const rgba=Buffer.alloc(info.width*info.height*4);let alteredOpaquePixels=0;
  for(let p=0;p<info.width*info.height;p++){rgba[p*4]=rgb[p*3];rgba[p*4+1]=rgb[p*3+1];rgba[p*4+2]=rgb[p*3+2];rgba[p*4+3]=alpha[p];if(alpha[p]===255&&(rgba[p*4]!==rgb[p*3]||rgba[p*4+1]!==rgb[p*3+1]||rgba[p*4+2]!==rgb[p*3+2]))alteredOpaquePixels++;}
  const bbox={left,top,width:right-left+1,height:bottom-top+1};
  const layer=await sharp(rgba,{raw:{width:info.width,height:info.height,channels:4}}).extract(bbox).png().toBuffer();
  const texts=meta.originalTextReadOnly.filter(t=>{const cx=(t.bounds.x+t.bounds.width/2)*info.width,cy=(t.bounds.y+t.bounds.height/2)*info.height;return cx>=left&&cx<=right&&cy>=top&&cy<=bottom;});
  const solidity=area/(bbox.width*bbox.height),packaging=texts.length>=2&&solidity>.82;
  components.push({id:instance.id,layer,bbox,solidity,packaging,texts,alteredOpaquePixels});
 }
 if(!components.length)throw Error('No usable foreground; review original instead of fabricating a product');
 const boxes=components.filter(c=>c.packaging),parts=components.filter(c=>!c.packaging);const layout=[];
 const place=async(c,maxW,maxH,x,y,align='top')=>{const layer=await sharp(c.layer).resize({width:Math.round(maxW),height:Math.round(maxH),fit:'inside',withoutEnlargement:false}).png().toBuffer();const m=await sharp(layer).metadata();layout.push({component:c,input:layer,left:Math.round(x+(maxW-m.width)/2),top:Math.round(align==='bottom'?y+maxH-m.height:y),width:m.width,height:m.height});};
 const ratio=width/height;
 if(meta.compositionOverride?.preset==='r-pin-card'){
  const card=components.find(c=>c.id===2),box=components.find(c=>c.id===100),pins=components.find(c=>c.id===101);
  if(!card||!box||!pins)throw Error('The R-pin composition requires its original card, box and both pin groups.');
  if(ratio<1.15){await place(card,width*.84,height*.20,width*.08,height*.045);await place(box,width*.53,height*.65,width*.43,height*.30);await place(pins,width*.50,height*.30,width*.035,height*.58);}
  else {await place(card,width*.58,height*.22,width*.20,height*.04);await place(box,width*.42,height*.70,width*.54,height*.25);await place(pins,width*.48,height*.42,width*.035,height*.49);}
 }else if(ratio<1.15&&boxes.length&&parts.length&&components.length>1){
  const boxW=width*.86/boxes.length,partW=width*.92/parts.length;
  for(let i=0;i<boxes.length;i++)await place(boxes[i],boxW,height*.4,width*.07+i*boxW,height*.05);
  for(let i=0;i<parts.length;i++)await place(parts[i],partW,height*.52,width*.04+i*partW,height*.43,'bottom');
 }else{
  // Preserve the original arrangement for touching/merged components and landscape outputs.
  const allAlpha=await sharp(meta.mask).greyscale().raw().toBuffer();
  let left=Math.min(...components.map(c=>c.bbox.left)),top=Math.min(...components.map(c=>c.bbox.top));
  let right=Math.max(...components.map(c=>c.bbox.left+c.bbox.width)),bottom=Math.max(...components.map(c=>c.bbox.top+c.bbox.height));
  const rgba=Buffer.alloc(info.width*info.height*4);for(let p=0;p<info.width*info.height;p++){rgba[p*4]=rgb[p*3];rgba[p*4+1]=rgb[p*3+1];rgba[p*4+2]=rgb[p*3+2];rgba[p*4+3]=allAlpha[p];}
  const layer=await sharp(rgba,{raw:{width:info.width,height:info.height,channels:4}}).extract({left,top,width:right-left,height:bottom-top}).png().toBuffer();
  const resized=await sharp(layer).resize({width:Math.round(width*.92),height:Math.round(height*.92),fit:'inside'}).png().toBuffer();const m=await sharp(resized).metadata();
  layout.push({input:resized,left:Math.round((width-m.width)/2),top:Math.round((height-m.height)/2),width:m.width,height:m.height});
 }
 const minX=Math.min(...layout.map(l=>l.left)),minY=Math.min(...layout.map(l=>l.top)),maxX=Math.max(...layout.map(l=>l.left+l.width)),maxY=Math.max(...layout.map(l=>l.top+l.height));
 const shadows=`<svg width="${width}" height="${height}"><defs><filter id="b"><feGaussianBlur stdDeviation="${Math.round(width*.009)}"/></filter></defs>${layout.map(l=>`<ellipse cx="${l.left+l.width*.5}" cy="${l.top+l.height-width*.008}" rx="${l.width*.35}" ry="${width*.012}" fill="#17211d" opacity=".16" filter="url(#b)"/>`).join('')}</svg>`;
 const plate=await sharp('assets/studio-backgrounds/neutral-studio-v1.png').resize(width,height,{fit:'cover'}).toBuffer();
 await sharp(plate).composite([{input:Buffer.from(shadows)},...layout.map(({input,left,top})=>({input,left,top}))]).png().toFile(output);
 const textChecks=meta.originalTextReadOnly.map(t=>{const b=t.bounds;let covered=0,samples=0;for(let y=Math.max(0,Math.floor(b.y*info.height));y<Math.min(info.height,Math.ceil((b.y+b.height)*info.height));y+=2)for(let x=Math.max(0,Math.floor(b.x*info.width));x<Math.min(info.width,Math.ceil((b.x+b.width)*info.width));x+=2){samples++;if(components.some(c=>x>=c.bbox.left&&x<c.bbox.left+c.bbox.width&&y>=c.bbox.top&&y<c.bbox.top+c.bbox.height))covered++;}return {originalReadOnlyText:t.text,confidence:t.confidence,foregroundRegionCoverage:samples?covered/samples:0,note:'OCR is read-only. No recognized string is re-rendered into the photograph.'};});
 const fit={subjectWidthRatio:(maxX-minX)/width,subjectHeightRatio:(maxY-minY)/height,minimumMarginRatio:Math.min(minX/width,minY/height,(width-maxX)/width,(height-maxY)/height)};
 const warnings=[];if(Math.min(fit.subjectWidthRatio,fit.subjectHeightRatio)<.58)warnings.push('Naturally narrow/wide subject: square composition has substantial negative space; prefer native-aspect master or review a different source angle.');if(fit.minimumMarginRatio<.025)warnings.push('Subject close to edge');if(components.some(c=>c.bbox.left<=3||c.bbox.top<=3||c.bbox.left+c.bbox.width>=info.width-3||c.bbox.top+c.bbox.height>=info.height-3))warnings.push('Original photograph/foreground touches source boundary; inspect for original clipping.');
 if(textChecks.some(t=>t.confidence>.5&&t.foregroundRegionCoverage>0&&t.foregroundRegionCoverage<.95))warnings.push('A text region is only partially covered by foreground bounds; manual mask review required.');
 return {width,height,instances:components.map(c=>({id:c.id,bbox:c.bbox,packaging:c.packaging,solidity:c.solidity,alteredOpaquePixels:c.alteredOpaquePixels})),textChecks,fit,warnings,method:'Original photographed RGB copied into alpha layers. No product/packaging generative redraw, text retyping, stretching, perspective warp or geometry reconstruction. Only background is AI-generated.',humanReviewRequired:true};
}
if(process.argv[1]?.endsWith('compose-preserved.mjs')){const [prefix,out]=process.argv.slice(2);if(!prefix||!out)throw Error('Usage: compose-preserved.mjs mask-prefix output.png');const qa=await composePreserved(prefix,out);await fs.writeFile(out.replace(/\.png$/,'.qa.json'),JSON.stringify(qa,null,2));console.log(qa.fit);}
