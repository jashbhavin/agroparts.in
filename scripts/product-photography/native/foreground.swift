import Foundation
import Vision
import CoreImage
import ImageIO
import UniformTypeIdentifiers

func savePNG(_ image: CGImage, _ url: URL) throws {
    guard let dest = CGImageDestinationCreateWithURL(url as CFURL, UTType.png.identifier as CFString, 1, nil) else { throw NSError(domain:"SavePNG",code:1) }
    CGImageDestinationAddImage(dest, image, nil)
    guard CGImageDestinationFinalize(dest) else { throw NSError(domain:"SavePNG",code:2) }
}
let args=CommandLine.arguments
if args.count != 3 { fputs("Usage: foreground input-image output-prefix\n",stderr);exit(64) }
do {
 let input=URL(fileURLWithPath:args[1]), prefix=args[2]
 guard let source=CGImageSourceCreateWithURL(input as CFURL,nil),let image=CGImageSourceCreateThumbnailAtIndex(source,0,[kCGImageSourceCreateThumbnailFromImageAlways:true,kCGImageSourceCreateThumbnailWithTransform:true,kCGImageSourceThumbnailMaxPixelSize:2400] as CFDictionary) else { throw NSError(domain:"Decode",code:1) }
 let handler=VNImageRequestHandler(cgImage:image,options:[:])
 let request=VNGenerateForegroundInstanceMaskRequest()
 try handler.perform([request])
 guard let observation=request.results?.first else { throw NSError(domain:"NoForeground",code:1) }
 let buffer=try observation.generateScaledMaskForImage(forInstances:observation.allInstances,from:handler)
 let ci=CIImage(cvPixelBuffer:buffer)
 guard let mask=CIContext().createCGImage(ci,from:ci.extent) else { throw NSError(domain:"Mask",code:1) }
 try savePNG(image,URL(fileURLWithPath:prefix+"-source.png"))
 try savePNG(mask,URL(fileURLWithPath:prefix+"-mask.png"))
 var instanceMasks:[[String:Any]]=[]
 for id in observation.allInstances {
  let b=try observation.generateScaledMaskForImage(forInstances:IndexSet(integer:id),from:handler)
  let c=CIImage(cvPixelBuffer:b)
  if let cg=CIContext().createCGImage(c,from:c.extent){let f=prefix+"-instance-\(id).png";try savePNG(cg,URL(fileURLWithPath:f));instanceMasks.append(["id":id,"mask":f])}
 }
 let ocr=VNRecognizeTextRequest();ocr.recognitionLevel = .accurate;ocr.usesLanguageCorrection=false
 try handler.perform([ocr])
 let texts:[[String:Any]]=(ocr.results ?? []).compactMap { result in
  guard let text=result.topCandidates(1).first else{return nil}
  let r=result.boundingBox
  return ["text":text.string,"confidence":text.confidence,"bounds":["x":r.origin.x,"y":1-r.origin.y-r.height,"width":r.width,"height":r.height]]
 }
 let data:[String:Any]=["instanceMasks":instanceMasks,"originalTextReadOnly":texts,"width":image.width,"height":image.height,"instances":Array(observation.allInstances),"source":prefix+"-source.png","mask":prefix+"-mask.png"]
 let json=try JSONSerialization.data(withJSONObject:data,options:[.prettyPrinted,.sortedKeys])
 try json.write(to:URL(fileURLWithPath:prefix+"-mask.json"))
 print(String(data:json,encoding:.utf8)!)
} catch { fputs("Foreground extraction failed: \(error)\n",stderr);exit(1) }
