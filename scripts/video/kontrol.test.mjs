// node --test scripts/video/kontrol.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { acilisKontrol } from "./kontrol.mjs";

const k = (s, e) => ({ w: "x", s, e });

test("temiz açılış uyarı vermez", () => {
  assert.deepEqual(acilisKontrol({ sure: 3, kelimeler: [k(0.1, 1), k(1.1, 2.8)] }), []);
});

test("geç başlayan konuşma, ölü an ve boş son yakalanır", () => {
  const u = acilisKontrol({ sure: 10, kelimeler: [k(1.4, 2), k(4, 5)] });
  assert.equal(u.length, 3);
  assert.match(u[0], /1\.4/);
  assert.match(u[1], /Ölü an/);
  assert.match(u[2], /boşluk/);
});

test("konuşmasız video uyarı verir", () => {
  assert.equal(acilisKontrol({ sure: 5, kelimeler: [] }).length, 1);
});
