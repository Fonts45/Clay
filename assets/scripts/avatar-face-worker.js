// Inference runs on this device. Only the libraries and model weights are downloaded.
const VERSION='0.10.32';
let engine;
async function detectors(){
 if(!engine)engine=(async()=>{
  const {FilesetResolver,FaceDetector,ObjectDetector}=await import(`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION}/vision_bundle.mjs`);
  const files=await FilesetResolver.forVisionTasks(`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION}/wasm`);
  const face=await FaceDetector.createFromOptions(files,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite'},runningMode:'IMAGE',minDetectionConfidence:.5});
  const person=await ObjectDetector.createFromOptions(files,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float32/1/efficientdet_lite0.tflite'},runningMode:'IMAGE',scoreThreshold:.45,categoryAllowlist:['person']});
  return {face,person};
 })().catch(error=>{engine=null;throw error});
 return engine;
}
self.onmessage=async({data:{id,bitmap}})=>{
 try{
  const {face,person}=await detectors();
  // A worker canvas avoids blocking page navigation while the models run.
  const canvas=new OffscreenCanvas(bitmap.width,bitmap.height);
  canvas.getContext('2d').drawImage(bitmap,0,0);
  const faces=face.detect(canvas).detections;
  const people=person.detect(canvas).detections;
  self.postMessage({id,faces,people,width:bitmap.width,height:bitmap.height});
 }catch{self.postMessage({id,error:'Não foi possível verificar a foto neste aparelho. Verifique sua conexão e tente novamente. Nenhuma foto foi enviada.'})}
 finally{bitmap.close()}
};
