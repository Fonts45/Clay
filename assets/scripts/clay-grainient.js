/* Grainient-style background, implemented for the vanilla Clay interface. */
(()=>{
const app=document.getElementById('app'),canvas=document.getElementById('clay-grainient');if(!app||!canvas)return;
const gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power'});if(!gl)return;
const vertex=`attribute vec2 position;void main(){gl_Position=vec4(position,0.,1.);}`;
const fragment=`precision highp float;
uniform vec2 resolution,pointer,swirl;uniform float time,burst,intro;
float random(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
vec3 palette(float t){vec3 a=vec3(18.,15.,23.)/255.,b=vec3(42.,15.,10.)/255.,c=vec3(154.,52.,18.)/255.,d=vec3(249.,115.,22.)/255.,e=vec3(254.,215.,170.)/255.;
if(t<.25)return mix(a,b,smoothstep(0.,.25,t));if(t<.5)return mix(b,c,smoothstep(.25,.5,t));if(t<.75)return mix(c,d,smoothstep(.5,.75,t));return mix(d,e,smoothstep(.75,1.,t));}
void main(){vec2 uv=gl_FragCoord.xy/resolution;vec2 p=uv-.5;p.x*=resolution.x/resolution.y;
vec2 q=uv-swirl;float influence=exp(-dot(q,q)*12.)*burst;float turn=influence*3.;p+=mat2(cos(turn),-sin(turn),sin(turn),cos(turn))*q-q;
vec2 delta=uv-pointer;p+=delta*exp(-dot(delta,delta)*8.)*.14;
float t=time*.18;float flow=sin(p.y*2.4+t)+cos(p.x*2.-t*.7);p+=.8*.13*vec2(flow,sin(p.x*2.8+t));
float silk=sin(p.y*5.+p.x*2.+t)*cos(p.x*3.-t)*.35;
float band=dot(p,vec2(cos(.959931),sin(.959931)))+.5+silk*.25;
vec3 color=palette(clamp(band,0.,1.));float grain=random(floor(gl_FragCoord.xy/1.2)+floor(time*24.))-.5;color+=grain*.08;
gl_FragColor=vec4(mix(vec3(18.,15.,23.)/255.,color,intro),1.);}`;
function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){gl.deleteShader(s);return null}return s}
const vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment);if(!vs||!fs)return;
const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))return;gl.useProgram(program);
const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const pos=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
const uniforms={};['resolution','pointer','swirl','time','burst','intro'].forEach(k=>uniforms[k]=gl.getUniformLocation(program,k));
const reduced=matchMedia('(prefers-reduced-motion: reduce)');let frame=0,last=0,elapsed=0,age=0,burst=0,mouse=[.5,.5],target=[.5,.5],swirl=[.5,.5];
function resize(){const r=app.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.5);if(!r.width||!r.height)return;canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);gl.viewport(0,0,canvas.width,canvas.height)}
function render(now){frame=0;if(!app.classList.contains('o')||document.hidden)return;const dt=last?Math.min((now-last)/1000,.05):0;last=now;elapsed+=dt;age+=dt;burst*=Math.exp(-dt*2.2);mouse=mouse.map((v,i)=>v+(target[i]-v)*(1-Math.exp(-dt*7)));
gl.uniform2f(uniforms.resolution,canvas.width,canvas.height);gl.uniform2fv(uniforms.pointer,mouse);gl.uniform2fv(uniforms.swirl,swirl);gl.uniform1f(uniforms.time,reduced.matches?0:elapsed);gl.uniform1f(uniforms.burst,reduced.matches?0:burst);gl.uniform1f(uniforms.intro,reduced.matches?1:Math.min(age/1.2,1));gl.drawArrays(gl.TRIANGLES,0,6);if(!reduced.matches)frame=requestAnimationFrame(render)}
function sync(){cancelAnimationFrame(frame);frame=0;last=0;if(app.classList.contains('o')&&!document.hidden){resize();frame=requestAnimationFrame(render)}}
function point(e){const r=app.getBoundingClientRect();return [(e.clientX-r.left)/r.width,1-(e.clientY-r.top)/r.height]}
app.addEventListener('pointermove',e=>{target=point(e)});app.addEventListener('pointerleave',()=>{target=[.5,.5]});app.addEventListener('click',e=>{if(e.target.closest('button,a,input,textarea,summary,aside'))return;swirl=point(e);burst=1});
new MutationObserver(sync).observe(app,{attributes:true,attributeFilter:['class']});new ResizeObserver(sync).observe(app);document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(frame)});sync();
})();
