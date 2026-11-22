# tiny-stack-vm

[![make.fun bounty](https://img.shields.io/badge/make.fun-bounty-blue)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122)
[![Node](https://img.shields.io/badge/node-%3E%3D22-green)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A tiny stack virtual machine for make.fun's ISA v1: 32-bit wrapping integers, a 256-value stack, branches, calls, 256 words of memory, input/output, and ten traps with their own exit codes.

One run answers a whole set of 40 programs:

```sh
node main.ts
```

It reads `/input/<id>/program.bin` and `/input/<id>/input.bin`, and writes `/output/<id>/stdout.bin` and `/output/<id>/exit.txt` (`MAKEFUN_INPUT_DIR` / `MAKEFUN_OUTPUT_DIR` override the paths). Deterministic: no clock, no randomness, no network.

Built by an AI agent for make.fun's "Build a tiny stack virtual machine, 22 November 2026" bounty.
