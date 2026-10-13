/* Clay hero: standalone WebGL interpretation of the supplied ColorBends settings. */
(()=>{
 const canvas=document.getElementById('clay-bends');if(!canvas)return;
 const options={color:'#F97316',speed:.4,frequency:1.8,noise:.18,bandWidth:.22,rotation:115,fadeTop:.70,iterations:1,intensity:1.4};
 const gl=canvas.getContext('webgl',{alpha:false,antialias:false});
 if(!gl){canvas.style.background='radial-gradient(ellipse at 70% 80%,#9b3c10,transparent 60%),#100d13';return}
 const vertex='attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
 const fragment=`precision mediump float;
 uniform vec2 resolution;uniform float time;uniform vec3 color;
 uniform float frequency,noise,bandWidth,rotation,fadeTop,intensity;
 float random(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 void main(){
 vec2 uv=gl_FragCoord.xy/resolution;
 vec2 p=(uv-.5)*vec2(resolution.x/resolution.y,1.);
 float angle=radians(rotation-90.);p=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*p;
 float wave=sin(p.x*frequency*2.+time*.35)*.13+sin(p.x*frequency*.8-time*.22)*.10;
 float y=p.y-wave;
 float bands=0.;
 for(int i=0;i<3;i++){
 float line=-.40+float(i)*.26;
 float d=abs(y-line);
 bands+=exp(-d*d/(bandWidth*bandWidth*.12))*(.65+float(i)*.10);
 }
 float fade=(1.-smoothstep(1.-fadeTop,1.,uv.y));
 float grain=(random(gl_FragCoord.xy+floor(time*12.))-.5)*noise;
 vec3 bg=vec3(.043,.034,.053);
 vec3 glow=color*bands*intensity*.56*fade;
 vec3 result=bg+glow+grain*(.10+bands*.23)*fade;
 gl_FragColor=vec4(max(result,vec3(0.)),1.);
 }`;
 function shader(type,source){const obj=gl.createShader(type);gl.shaderSource(obj,source);gl.compileShader(obj);if(!gl.getShaderParameter(obj,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(obj));return obj}
 let program;
 try{program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Shader');}
 catch(e){canvas.style.background='radial-gradient(ellipse at 70% 80%,#9b3c10,transparent 60%),#100d13';return}
 gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
 const pos=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
 const uniforms={};['resolution','time','color','frequency','noise','bandWidth','rotation','fadeTop','intensity'].forEach(k=>uniforms[k]=gl.getUniformLocation(program,k));
 gl.uniform3f(uniforms.color,249/255,115/255,22/255);
 ['frequency','noise','bandWidth','rotation','fadeTop','intensity'].forEach(k=>gl.uniform1f(uniforms[k],options[k]));
 const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;let visible=true,frame=0,last=0;
 function size(){const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(canvas.clientWidth*dpr);canvas.height=Math.round(canvas.clientHeight*dpr);gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(uniforms.resolution,canvas.width,canvas.height)}
 function render(t){if(t-last<33)return;last=t;gl.uniform1f(uniforms.time,reduced?0:t*.001*options.speed);gl.drawArrays(gl.TRIANGLES,0,6)}
 function loop(t){frame=0;if(!visible||document.hidden)return;render(t);if(!reduced)frame=requestAnimationFrame(loop)}
 function start(){if(!frame&&visible&&!document.hidden)frame=requestAnimationFrame(loop)}
 new ResizeObserver(()=>{size();render(performance.now()+34)}).observe(canvas);
 new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(!visible&&frame){cancelAnimationFrame(frame);frame=0}else start()}).observe(canvas);
 document.addEventListener('visibilitychange',start);size();start();
})();
