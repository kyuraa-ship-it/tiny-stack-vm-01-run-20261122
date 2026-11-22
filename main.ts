import fs from'node:fs'
let e=process.env,I=e.MAKEFUN_INPUT_DIR||'/input',O=e.MAKEFUN_OUTPUT_DIR||'/output',N="01146:;?0000000099999995999599999990000000000000044000000000000058000000000000004414"
function R(p,q){let S=[],C=[],M=[],o='',x=0,k=0,n=0,a,b,v,t
for(;;){
if(n>=1e6)return[o,10]
if(x<0||x>=p.length)return[o,9]
let c=p[x],d=N.charCodeAt(c)-48
if(!d&&c&&c!=48&&c!=51&&c!=52)return[o,5]
if(x+(c==1?2:c==2?5:c>47&&c<52?3:1)>p.length)return[o,9]
n++
let w=d>>2
if(S.length<w)return[o,2]
if(S.length-w+(d&3)>256)return[o,3]
switch(c){
case 0:return[o,0]
case 1:S.push(p[x+1]<<24>>24);x+=2;continue
case 2:S.push(p.readInt32LE(x+1));x+=5;continue
case 3:case 4:case 5:case 6:case 7:v=c<5?1:c<7?2:3;t=S[S.length-v];if(c!=4&&c!=6)S.splice(S.length-v,1);if(c!=3)S.push(t);break
case 23:S.push(-S.pop()|0);break
case 27:S.push(~S.pop());break
case 48:x+=3+p.readInt16LE(x+1);continue
case 49:case 50:v=S.pop();x+=3+(v==0^c==50?p.readInt16LE(x+1):0);continue
case 51:if(C.length>63)return[o,7];C.push(x+3);x=p[x+1]|p[x+2]<<8;continue
case 52:if(!C.length)return[o,8];x=C.pop();continue
case 64:a=S.pop();if(a<0||a>255)return[o,6];S.push(M[a]||0);break
case 65:a=S.pop();v=S.pop();if(a<0||a>255)return[o,6];M[a]=v;break
case 80:t=S.pop();if(o.length+(''+t).length>65536)return[o,11];o+=t;break
case 81:if(o.length>65535)return[o,11];o+=String.fromCharCode(S.pop()&255);break
case 82:S.push(k<q.length?q[k++]:-1);break
case 83:return[o,S.pop()&255]
default:b=S.pop();a=S.pop();if(!b&&c>18&&c<23)return[o,4];S.push(c==16?a+b|0:c==17?a-b|0:c==18?Math.imul(a,b):c==19?a/b|0:c==20?a%b|0:c==21?(a>>>0)/(b>>>0)|0:c==22?(a>>>0)%(b>>>0)|0:c==24?a&b:c==25?a|b:c==26?a^b:c==28?a<<b:c==29?a>>b:c==30?a>>>b|0:c==32?+(a==b):c==33?+(a<b):+((a>>>0)<(b>>>0)))
}
x++
}}
for(let d of fs.readdirSync(I)){let i=I+'/'+d,o=O+'/'+d,[a,b]=R(fs.readFileSync(i+'/program.bin'),fs.readFileSync(i+'/input.bin'));fs.mkdirSync(o,{recursive:true});fs.writeFileSync(o+'/stdout.bin',a,'latin1');fs.writeFileSync(o+'/exit.txt',b+'\n')}
