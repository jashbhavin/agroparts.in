import sharp from 'sharp';
import { promises as fs } from 'node:fs';
/** Keep actual photographed glyph pixels fully opaque. OCR is localization only, never retyping. */
export async function protectText(prefix) {
 const meta=JSON.parse(await fs.readFile(prefix+'-mask.json','utf8'));
 const masks=[];
 for(const instance of meta.instanceMasks){const {data,info}=await sharp(instance.mask).greyscale().raw().toBuffer({resolveWithObject:true});masks.push({id:instance.id,data:Buffer.from(data),original:Buffer.from(data),width:info.width,height:info.height});}
 if(!masks.length)throw Error('No foreground masks to protect');
 const {width,height}=masks[0],protectedRegions=[],backgroundText=[];
 for(const line of meta.originalTextReadOnly){
  const b=line.bounds;const cx=Math.max(0,Math.min(width-1,Math.round((b.x+b.width/2)*width))),cy=Math.max(0,Math.min(height-1,Math.round((b.y+b.height/2)*height)));
  const target=masks.reduce((best,m)=>m.original[cy*width+cx]>(best?.original[cy*width+cx]||0)?m:best,null);
  if(!target||target.original[cy*width+cx]<128){backgroundText.push({text:line.text,reason:'Text centre is outside the detected product/packaging foreground. Review separately; do not invent a replacement.'});continue;}
  const left=Math.max(0,Math.floor(b.x*width)-2),top=Math.max(0,Math.floor(b.y*height)-2),right=Math.min(width,Math.ceil((b.x+b.width)*width)+2),bottom=Math.min(height,Math.ceil((b.y+b.height)*height)+2);
  for(let y=top;y<bottom;y++)for(let x=left;x<right;x++)target.data[y*width+x]=255;
  protectedRegions.push({originalReadOnlyText:line.text,confidence:line.confidence,instanceId:target.id,pixelBounds:{left,top,width:right-left,height:bottom-top},method:'Keep the entire original photographed word region opaque. No character synthesis, OCR correction or text replacement.'});
 }
 const dest=prefix+'-protected',combined=Buffer.alloc(width*height);const instanceMasks=[];
 for(const m of masks){const file=dest+'-instance-'+m.id+'.png';await sharp(m.data,{raw:{width,height,channels:1}}).png().toFile(file);instanceMasks.push({id:m.id,mask:file});for(let p=0;p<combined.length;p++)combined[p]=Math.max(combined[p],m.data[p]);}
 const mask=dest+'-mask.png';await sharp(combined,{raw:{width,height,channels:1}}).png().toFile(mask);
 const output={...meta,mask,instanceMasks,textProtection:{protectedRegions,backgroundText,wordingRewritten:false,textSynthesized:false,note:'Read-only OCR may miss tiny or blurred text. All other foreground pixels also remain source photographic pixels; manual edge review remains necessary.'}};
 await fs.writeFile(dest+'-mask.json',JSON.stringify(output,null,2));return {prefix:dest,report:output.textProtection};
}
