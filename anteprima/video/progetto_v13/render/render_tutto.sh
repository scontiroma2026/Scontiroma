#!/bin/bash
# Rende i 2520 fotogrammi (84 s a 30 fps) in 4 blocchi paralleli: render/fr/{a,b,c,d}
cd "$(dirname "$0")" || exit 1
rm -rf fr && mkdir -p fr
node render.js 0 21 fr/a > log_a.txt 2>&1 &
node render.js 21 42 fr/b > log_b.txt 2>&1 &
node render.js 42 63 fr/c > log_c.txt 2>&1 &
node render.js 63 84 fr/d > log_d.txt 2>&1 &
wait
for d in a b c d; do echo "$d $(ls fr/$d | wc -l)"; done
