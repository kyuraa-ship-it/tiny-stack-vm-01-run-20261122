// Tiny stack VM (ISA v1) for make.fun — written from ISA.md in this session.
// One run answers a set: /input/<id>/{program,input}.bin -> /output/<id>/{stdout.bin,exit.txt}.
// Traps: 2 underflow, 3 stack overflow, 4 div by zero, 5 unknown opcode,
// 6 bad memory address, 7 call-stack overflow, 8 empty RET, 9 pc outside,
// 10 step limit, 11 output limit. A trap keeps the output written before it.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const I = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const O = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
function run(p: Buffer, inp: Buffer): [number[], number] {
  const s = new Int32Array(257), c = new Int32Array(64), m = new Int32Array(256);
  const o: number[] = [];
  let sp = 0, cp = 0, pc = 0, ip = 0, steps = 0;
  for (;;) {
    if (steps >= 1e6) return [o, 10]; // step limit checked first
    if (pc < 0 || pc >= p.length) return [o, 9]; // pc outside program
    const op = p[pc];
    let l = 1;
    if (op === 1) l = 2; else if (op === 2) l = 5;
    else if (op >= 0x30 && op <= 0x33) l = 3;
    else if (op > 7 && op < 0x10 || op > 0x22 && op < 0x30 ||
      op > 0x34 && op < 0x40 || op > 0x41 && op < 0x50 || op > 0x53) return [o, 5];
    if (pc + l > p.length) return [o, 9]; // immediate cut off
    steps++;
    switch (op) {
      case 0: return [o, 0]; // HALT
      case 1: if (sp >= 256) return [o, 3]; { let v = p[pc + 1]; s[sp++] = v > 127 ? v - 256 : v; } pc += 2; break; // PUSH8
      case 2: if (sp >= 256) return [o, 3]; s[sp++] = p.readInt32LE(pc + 1); pc += 5; break; // PUSH32
      case 3: if (sp < 1) return [o, 2]; sp--; pc++; break; // POP
      case 4: if (sp < 1) return [o, 2]; if (sp >= 256) return [o, 3]; s[sp] = s[sp - 1]; sp++; pc++; break; // DUP
      case 5: if (sp < 2) return [o, 2]; { const t = s[sp - 1]; s[sp - 1] = s[sp - 2]; s[sp - 2] = t; } pc++; break; // SWAP
      case 6: if (sp < 2) return [o, 2]; if (sp >= 256) return [o, 3]; s[sp] = s[sp - 2]; sp++; pc++; break; // OVER
      case 7: if (sp < 3) return [o, 2]; { const a = s[sp - 3]; s[sp - 3] = s[sp - 2]; s[sp - 2] = s[sp - 1]; s[sp - 1] = a; } pc++; break; // ROT
      case 0x10: case 0x11: case 0x12: case 0x13: case 0x14: case 0x15: case 0x16:
      case 0x18: case 0x19: case 0x1a: case 0x1c: case 0x1d: case 0x1e:
      case 0x20: case 0x21: case 0x22: { // binary ops: (a b -- r), b is top
        if (sp < 2) return [o, 2];
        const b = s[--sp], a = s[sp - 1];
        if (op >= 0x13 && op <= 0x16 && b === 0) return [o, 4];
        if (op === 0x10) s[sp - 1] = (a + b) | 0;
        else if (op === 0x11) s[sp - 1] = (a - b) | 0;
        else if (op === 0x12) s[sp - 1] = Math.imul(a, b); // low 32 bits
        else if (op === 0x13) s[sp - 1] = (a / b) | 0; // trunc to 0; INT_MIN/-1 wraps
        else if (op === 0x14) s[sp - 1] = (a % b) | 0; // sign of a; x%-1 is 0
        else if (op === 0x15) s[sp - 1] = ((a >>> 0) / (b >>> 0)) | 0;
        else if (op === 0x16) s[sp - 1] = ((a >>> 0) % (b >>> 0)) | 0;
        else if (op === 0x18) s[sp - 1] = a & b;
        else if (op === 0x19) s[sp - 1] = a | b;
        else if (op === 0x1a) s[sp - 1] = a ^ b;
        else if (op === 0x1c) s[sp - 1] = a << b; // JS masks shift to 5 bits
        else if (op === 0x1d) s[sp - 1] = a >> b; // arithmetic
        else if (op === 0x1e) s[sp - 1] = a >>> b; // logical, read back signed
        else if (op === 0x20) s[sp - 1] = a === b ? 1 : 0;
        else if (op === 0x21) s[sp - 1] = a < b ? 1 : 0;
        else s[sp - 1] = (a >>> 0) < (b >>> 0) ? 1 : 0; // LTU
        pc++; break;
      }
      case 0x17: if (sp < 1) return [o, 2]; s[sp - 1] = (-s[sp - 1]) | 0; pc++; break; // NEG
      case 0x1b: if (sp < 1) return [o, 2]; s[sp - 1] = ~s[sp - 1]; pc++; break; // NOT
      case 0x30: case 0x31: case 0x32: { // JMP / JZ / JNZ: pc = next + signed offset
        let off = p[pc + 1] | (p[pc + 2] << 8); if (off > 32767) off -= 65536;
        if (op === 0x30) { pc = pc + 3 + off; break; }
        if (sp < 1) return [o, 2];
        const v = s[--sp];
        pc = (op === 0x31 ? v === 0 : v !== 0) ? pc + 3 + off : pc + 3; break;
      }
      case 0x33: if (cp >= 64) return [o, 7]; c[cp++] = pc + 3; pc = p[pc + 1] | (p[pc + 2] << 8); break; // CALL
      case 0x34: if (cp === 0) return [o, 8]; pc = c[--cp]; break; // RET
      case 0x40: if (sp < 1) return [o, 2]; { const a = s[--sp]; if (a < 0 || a > 255) return [o, 6]; s[sp++] = m[a]; } pc++; break; // LOAD
      case 0x41: if (sp < 2) return [o, 2]; { const a = s[--sp], v = s[--sp]; if (a < 0 || a > 255) return [o, 6]; m[a] = v; } pc++; break; // STORE
      case 0x50: if (sp < 1) return [o, 2]; { const t = String(s[--sp]); if (o.length + t.length > 65536) return [o, 11]; for (let i = 0; i < t.length; i++) o.push(t.charCodeAt(i)); } pc++; break; // PRINT
      case 0x51: if (sp < 1) return [o, 2]; if (o.length + 1 > 65536) return [o, 11]; o.push(s[--sp] & 255); pc++; break; // PUTC
      case 0x52: if (sp >= 256) return [o, 3]; s[sp++] = ip < inp.length ? inp[ip++] : -1; pc++; break; // IN
      case 0x53: if (sp < 1) return [o, 2]; return [o, s[--sp] & 255]; // EXIT
    }
  }
}
for (const e of readdirSync(I, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : 1)) {
  if (!e.isDirectory()) continue;
  const [o, code] = run(readFileSync(join(I, e.name, 'program.bin')), readFileSync(join(I, e.name, 'input.bin')));
  mkdirSync(join(O, e.name), { recursive: true });
  writeFileSync(join(O, e.name, 'stdout.bin'), Buffer.from(o));
  writeFileSync(join(O, e.name, 'exit.txt'), code + '\n');
}
