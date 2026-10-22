const canvas = document.getElementById('avatarCanvas');
const ctx = canvas.getContext('2d');
const input = document.getElementById('photoInput');
const zoom = document.getElementById('zoom');
const rotate = document.getElementById('rotate');
const reset = document.getElementById('resetBtn');
const download = document.getElementById('downloadBtn');
const hint = document.getElementById('emptyHint');
const frame = new Image(); frame.src = 'frame-80-original.jpg';
let frameOverlay = null;
let photo = null, scale = 1, angle = 0, offsetX = 0, offsetY = 0, drag = null;
const frameSpecs = {
  'frame-80-original.jpg': {cx:627, cy:627, radius:478},
  'frame-80-alternative.jpg': {cx:750, cy:750, radius:598}
};

function baseScale(){return Math.max(canvas.width / photo.naturalWidth, canvas.height / photo.naturalHeight)}
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='#eef4ff';ctx.fillRect(0,0,canvas.width,canvas.height);
  if(photo){
    ctx.save();ctx.translate(canvas.width/2+offsetX,canvas.height/2+offsetY);ctx.rotate(angle*Math.PI/180);
    const s=baseScale()*scale;ctx.drawImage(photo,-photo.naturalWidth*s/2,-photo.naturalHeight*s/2,photo.naturalWidth*s,photo.naturalHeight*s);ctx.restore();
  }
  if(frameOverlay) ctx.drawImage(frameOverlay,0,0,canvas.width,canvas.height);
}
function enable(on){[zoom,rotate,reset,download].forEach(x=>x.disabled=!on)}
function resetPhoto(){scale=1;angle=0;offsetX=0;offsetY=0;zoom.value=1;rotate.value=0;draw()}
function processFrame(){
  // Xuất đúng độ phân giải gốc của từng khung: A1 là 1254px, A2 là 1500px.
  // Mọi pixel ngoài vùng chân dung được giữ nguyên từ tệp gốc.
  canvas.width=frame.naturalWidth; canvas.height=frame.naturalHeight;
  const spec=frameSpecs[frame.getAttribute('data-file') || frame.src.split('/').pop()] || {cx:canvas.width/2,cy:canvas.height/2,radius:canvas.width*.38};
  const off=document.createElement('canvas'); off.width=canvas.width; off.height=canvas.height;
  const octx=off.getContext('2d'); octx.drawImage(frame,0,0,off.width,off.height);
  const data=octx.getImageData(0,0,off.width,off.height);
  for(let y=0;y<off.height;y++) for(let x=0;x<off.width;x++){
    const i=(y*off.width+x)*4, dx=x-spec.cx,dy=y-spec.cy;
    if(dx*dx+dy*dy<spec.radius*spec.radius && data.data[i]>238 && data.data[i+1]>238 && data.data[i+2]>238) data.data[i+3]=0;
  }
  octx.putImageData(data,0,0); frameOverlay=off;
  if(photo){scale=1;angle=0;offsetX=0;offsetY=0;zoom.value=1;rotate.value=0}
  draw();
}
frame.onload=processFrame;
document.querySelectorAll('input[name="frame"]').forEach(choice=>choice.addEventListener('change',()=>{
  document.querySelectorAll('.frame-option').forEach(card=>card.classList.remove('selected'));
  choice.closest('.frame-option').classList.add('selected');
  frameOverlay=null; frame.setAttribute('data-file',choice.value); frame.src=choice.value;
}));
input.addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const url=URL.createObjectURL(f);photo=new Image();photo.onload=()=>{URL.revokeObjectURL(url);enable(true);hint.hidden=true;resetPhoto()};photo.src=url});
zoom.addEventListener('input',()=>{scale=+zoom.value;draw()});rotate.addEventListener('input',()=>{angle=+rotate.value;draw()});reset.addEventListener('click',resetPhoto);
function point(e){const r=canvas.getBoundingClientRect(), p=e.touches?e.touches[0]:e;return{x:(p.clientX-r.left)*canvas.width/r.width,y:(p.clientY-r.top)*canvas.height/r.height}}
canvas.addEventListener('pointerdown',e=>{if(!photo)return;canvas.setPointerCapture(e.pointerId);drag=point(e);canvas.classList.add('dragging')});
canvas.addEventListener('pointermove',e=>{if(!drag)return;const p=point(e);offsetX+=p.x-drag.x;offsetY+=p.y-drag.y;drag=p;draw()});
function stop(){drag=null;canvas.classList.remove('dragging')}canvas.addEventListener('pointerup',stop);canvas.addEventListener('pointercancel',stop);
download.addEventListener('click',()=>{draw();const a=document.createElement('a');a.download='avatar-80-nam-THPT-Tran-Phu.png';a.href=canvas.toDataURL('image/png');a.click()});
draw();
