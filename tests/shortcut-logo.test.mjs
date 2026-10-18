import {test} from 'node:test';
import assert from 'node:assert/strict';
import '../assets/scripts/shortcut-logo.js';
const {removeBackground}=globalThis.ClayLogo;
function image(size,color){const data=new Uint8ClampedArray(size*size*4);for(let i=0;i<data.length;i+=4)data.set(color,i);return {data,width:size,height:size}}
function pixel(image,x,y,color){image.data.set(color,(y*image.width+x)*4)}
function rgba(image,x,y){return Array.from(image.data.slice((y*image.width+x)*4,(y*image.width+x+1)*4))}
test('removes connected white background but preserves colors and enclosed white details',()=>{
 const logo=image(9,[255,255,255,255]);
 for(let y=2;y<7;y++)for(let x=2;x<7;x++)pixel(logo,x,y,[0,170,220,255]);
 pixel(logo,4,4,[255,255,255,255]);
 removeBackground(logo);
 assert.equal(rgba(logo,0,0)[3],0);
 assert.equal(rgba(logo,8,8)[3],0);
 assert.deepEqual(rgba(logo,2,2),[0,170,220,255]);
 assert.deepEqual(rgba(logo,4,4),[255,255,255,255]);
});
test('removes dark uniform backgrounds as well',()=>{
 const logo=image(9,[20,20,20,255]);
 for(let y=2;y<7;y++)for(let x=2;x<7;x++)pixel(logo,x,y,[255,120,0,255]);
 removeBackground(logo);
 assert.equal(rgba(logo,0,4)[3],0);
 assert.deepEqual(rgba(logo,4,4),[255,120,0,255]);
});
test('preserves existing transparent logos and solid tiles',()=>{
 const logo=image(9,[0,0,0,0]);pixel(logo,4,4,[255,255,255,255]);
 const before=logo.data.slice();removeBackground(logo);assert.deepEqual(logo.data,before);
 const solid=image(9,[255,0,0,255]);removeBackground(solid);assert.equal(rgba(solid,4,4)[3],255);
});
test('leaves backgrounds without a consistent corner color intact',()=>{
 const logo=image(9,[120,120,120,255]);
 pixel(logo,0,0,[255,0,0,255]);pixel(logo,8,0,[0,255,0,255]);pixel(logo,0,8,[0,0,255,255]);
 const before=logo.data.slice();removeBackground(logo);assert.deepEqual(logo.data,before);
});
