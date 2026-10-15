#!/usr/bin/env python3
"""Lê uma TTF (glyf/quadráticas) e gera contornos SVG por caractere, com y para cima negativo (igual ao logo)."""
import struct, sys, json

path, chars, out = sys.argv[1], sys.argv[2], sys.argv[3]
data = open(path, 'rb').read()
u16 = lambda o: struct.unpack('>H', data[o:o + 2])[0]
i16 = lambda o: struct.unpack('>h', data[o:o + 2])[0]
u32 = lambda o: struct.unpack('>I', data[o:o + 4])[0]

tables = {}
for i in range(u16(4)):
    r = 12 + 16 * i
    tables[data[r:r + 4].decode('latin1')] = u32(r + 8)

head, maxp, loca, glyf, cmap, hhea, hmtx = (tables[t] for t in ('head', 'maxp', 'loca', 'glyf', 'cmap', 'hhea', 'hmtx'))
long_loca = i16(head + 50) == 1
num_glyphs = u16(maxp + 4)
num_hm = u16(hhea + 34)


def loc(g):
    return u32(loca + 4 * g) if long_loca else u16(loca + 2 * g) * 2


def advance(g):
    return u16(hmtx + 4 * min(g, num_hm - 1))


# cmap: subtabela formato 4 (Unicode BMP)
cmap_map = {}
for i in range(u16(cmap + 2)):
    r = cmap + 4 + 8 * i
    pid, eid, off = u16(r), u16(r + 2), u32(r + 4)
    st = cmap + off
    if u16(st) == 4 and pid in (0, 3):
        segx2 = u16(st + 6)
        ends, starts = st + 14, st + 16 + segx2
        deltas, ranges = starts + segx2, starts + 2 * segx2
        for s in range(segx2 // 2):
            e, b = u16(ends + 2 * s), u16(starts + 2 * s)
            d, ro = i16(deltas + 2 * s), u16(ranges + 2 * s)
            for c in range(b, e + 1):
                if c == 0xFFFF:
                    continue
                if ro == 0:
                    g = (c + d) & 0xFFFF
                else:
                    a = ranges + 2 * s + ro + 2 * (c - b)
                    g = u16(a)
                    if g:
                        g = (g + d) & 0xFFFF
                cmap_map.setdefault(c, g)
        break


def contours(g, dx=0, dy=0):
    o = glyf + loc(g)
    if loc(g) == loc(g + 1):
        return []
    n = i16(o)
    if n < 0:  # composto
        res = []
        p = o + 10
        while True:
            flags, gi = u16(p), u16(p + 2)
            p += 4
            if flags & 1:
                a1, a2 = i16(p), i16(p + 2); p += 4
            else:
                a1, a2 = struct.unpack('>bb', data[p:p + 2]); p += 2
            if flags & 8: p += 2
            elif flags & 0x40: p += 4
            elif flags & 0x80: p += 8
            res += contours(gi, dx + a1, dy + a2)
            if not flags & 0x20:
                break
        return res
    ends = [u16(o + 10 + 2 * i) for i in range(n)]
    npts = ends[-1] + 1
    p = o + 10 + 2 * n
    p += 2 + u16(p)
    flags = []
    while len(flags) < npts:
        f = data[p]; p += 1
        flags.append(f)
        if f & 8:
            r = data[p]; p += 1
            flags += [f] * r
    def coords(short, same):
        nonlocal p
        v, out_ = 0, []
        for f in flags:
            if f & short:
                d = data[p]; p += 1
                v += d if f & same else -d
            elif not f & same:
                v += i16(p); p += 2
            out_.append(v)
        return out_
    xs = coords(2, 16)
    ys = coords(4, 32)
    res, s = [], 0
    for e in ends:
        res.append([(xs[i] + dx, ys[i] + dy, flags[i] & 1) for i in range(s, e + 1)])
        s = e + 1
    return res


def to_svg(cs):
    f = lambda v: ('%.1f' % v).rstrip('0').rstrip('.')
    d = []
    for c in cs:
        if not c:
            continue
        # começa num ponto "on"; se não houver, no meio dos dois primeiros
        k = next((i for i, p in enumerate(c) if p[2]), None)
        if k is None:
            a, b = c[0], c[1]
            c = [((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 1)] + c
            k = 0
        c = c[k:] + c[:k]
        x0, y0, _ = c[0]
        d.append(f'M{f(x0)} {f(-y0)}')
        pts = c[1:] + [c[0]]
        ctrl = None
        for x, y, on in pts:
            if on:
                if ctrl:
                    d.append(f'Q{f(ctrl[0])} {f(-ctrl[1])} {f(x)} {f(-y)}'); ctrl = None
                else:
                    d.append(f'L{f(x)} {f(-y)}')
            else:
                if ctrl:
                    mx, my = (ctrl[0] + x) / 2, (ctrl[1] + y) / 2
                    d.append(f'Q{f(ctrl[0])} {f(-ctrl[1])} {f(mx)} {f(-my)}')
                ctrl = (x, y)
        if ctrl:
            d.append(f'Q{f(ctrl[0])} {f(-ctrl[1])} {f(x0)} {f(-y0)}')
        d.append('Z')
    return ''.join(d)


res = {}
for ch in chars:
    g = cmap_map.get(ord(ch))
    if g is None:
        print('sem glifo:', ch); continue
    res[ch] = {'d': to_svg(contours(g)), 'w': advance(g)}
open(out, 'w').write(json.dumps(res, ensure_ascii=False))
print(len(res), 'glifos, unitsPerEm', u16(head + 18))
