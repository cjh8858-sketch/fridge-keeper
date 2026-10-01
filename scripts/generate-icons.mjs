#!/usr/bin/env node
// public/icon.svg와 같은 도형을 PNG로 래스터화한다 (PWA 설치·iOS 홈 화면용). 외부 의존성 없음.
// 실행: node scripts/generate-icons.mjs   — 아이콘 디자인을 바꾸면 icon.svg와 이 파일을 함께 고친다.
import { writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { deflateSync } from 'node:zlib';

const ROOT = resolve(import.meta.dirname, '..');
const GREEN = [0x2f, 0x85, 0x5a];
const WHITE = [0xf7, 0xfa, 0xf8];

/** 둥근 사각형 안인가 (viewBox 64 좌표) */
function inRoundRect(x, y, rx, ry, w, h, r) {
  if (x < rx || y < ry || x > rx + w || y > ry + h) return false;
  const cx = Math.min(Math.max(x, rx + r), rx + w - r);
  const cy = Math.min(Math.max(y, ry + r), ry + h - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

/** 둥근 끝 선분(수직) 안인가 */
function inVLine(x, y, lx, y1, y2, width) {
  const cy = Math.min(Math.max(y, y1), y2);
  return (x - lx) ** 2 + (y - cy) ** 2 <= (width / 2) ** 2;
}

/**
 * icon.svg 도형: 배경(둥근 사각형) + 냉장고 몸체 + 칸막이 + 손잡이 2개
 * @returns {number[] | null} RGB 또는 투명
 */
function shade(x, y, fullBleed) {
  const inFridge = inRoundRect(x, y, 18, 10, 28, 44, 5);
  if (inFridge) {
    const divider = Math.abs(y - 26) <= 1.5;
    const handle = inVLine(x, y, 23, 16, 21, 3) || inVLine(x, y, 23, 32, 40, 3);
    return divider || handle ? GREEN : WHITE;
  }
  if (fullBleed || inRoundRect(x, y, 0, 0, 64, 64, 14)) return GREEN;
  return null;
}

/**
 * @param {number} size 픽셀 크기
 * @param {number} pad 여백 비율 (maskable·iOS용: 배경을 꽉 채우고 아이콘을 안쪽에)
 */
function render(size, pad) {
  const SS = 4; // 4x4 슈퍼샘플링 안티앨리어싱
  const rows = [];
  for (let py = 0; py < size; py++) {
    const row = Buffer.alloc(1 + size * 4); // 필터 바이트 0 + RGBA
    for (let px = 0; px < size; px++) {
      let r = 0,
        g = 0,
        b = 0,
        a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const u = (px + (sx + 0.5) / SS) / size;
          const v = (py + (sy + 0.5) / SS) / size;
          // pad>0: 바깥은 배경색, 안쪽 영역에 원래 아이콘을 축소해서 그림
          const iu = (u - pad) / (1 - 2 * pad);
          const iv = (v - pad) / (1 - 2 * pad);
          const inside = iu >= 0 && iu <= 1 && iv >= 0 && iv <= 1;
          const c = inside ? shade(iu * 64, iv * 64, pad > 0) : pad > 0 ? GREEN : null;
          if (c) {
            r += c[0];
            g += c[1];
            b += c[2];
            a += 255;
          }
        }
      }
      const n = SS * SS;
      const cover = a / 255;
      const o = 1 + px * 4;
      row[o] = cover ? Math.round(r / cover) : 0;
      row[o + 1] = cover ? Math.round(g / cover) : 0;
      row[o + 2] = cover ? Math.round(b / cover) : 0;
      row[o + 3] = Math.round(a / n);
    }
    rows.push(row);
  }
  return encodePng(size, Buffer.concat(rows));
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function encodePng(size, raw) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const outputs = [
  ['icon-192.png', 192, 0],
  ['icon-512.png', 512, 0],
  ['icon-maskable-512.png', 512, 0.12], // 안전 영역(가운데 80%) 안에 들어가도록
  ['apple-touch-icon.png', 180, 0.08], // iOS는 투명 배경을 검게 칠하므로 꽉 채움
];
for (const [name, size, pad] of outputs) {
  writeFileSync(join(ROOT, 'public', name), render(size, pad));
  console.log(`✔ public/${name} (${size}px)`);
}
