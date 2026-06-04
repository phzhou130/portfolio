/* ─────────────────────────────────────────────────────────────
   Languru — Staircase Waterway of Letters
   A letter-based reinterpretation of "Staircase Waterway" by
   jiaman / はぅ君 (OpenProcessing #2902086, CC BY-NC-SA 3.0).
   Perlin noise drives flow; glyphs from many writing systems
   replace the original dot particles.
   ───────────────────────────────────────────────────────────── */

// Multilingual glyph pool (language / learning themed)
const GLYPHS = [
  // Latin
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  ...'abcdefghijklmnopqrstuvwxyz',
  // Hiragana
  ...'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろ',
  // Katakana
  ...'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホ',
  // CJK
  ...'語言学習文字書読話聞見愛夢心風月花人日本中国字詩',
  // Hangul
  ...'안녕하세요한국어글말배우다사랑공부',
  // Arabic
  ...'ابتثجحخدذرزسشصضطظعغفقكلمنهوي',
  // Cyrillic
  ...'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ',
  // Greek
  ...'αβγδεζηθικλμνξοπρστυφχψω',
  // Hebrew
  ...'אבגדהוזחטיכלמנסעפצקרשת',
  // Devanagari
  ...'अआइईउऊएऐओऔकखगघचछजझटठडढणतथदधनपफबभमयरलवशषसह',
  // Thai
  ...'กขคงจฉชซญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรลวศษสหฬอฮ'
];

let particles = [];
let time = 0;

function setup() {
  createCanvas(720, 720);
  textFont('"Inter","Helvetica Neue","Hiragino Sans","Noto Sans CJK SC","Noto Sans","Arial Unicode MS",sans-serif');
  textAlign(CENTER, CENTER);
  noStroke();
}

function draw() {
  // Faint fading black + blur → watery trails
  background(0, 9);
  filter(BLUR);
  fill(255);

  // Spawn 9 new particles per frame. Index cycles through a
  // large ring buffer so old particles are overwritten.
  let i = 9;
  while (i > 0) {
    i--;
    const index = time % (width * 9);
    const px = (time * 99) % width;
    particles[index] = {
      x: px,
      y: 0,
      g: 0,        // vertical acceleration
      s: 22,       // text size (replaces dot stroke weight)
      r: random(-PI / 12, PI / 12), // slight tilt for typographic feel
      c: GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
    };
    time = time + 1;
  }

  // Update + render each particle
  for (let idx = 0; idx < particles.length; idx++) {
    const p = particles[idx];

    // Shrink over lifetime — letters disperse like water droplets
    p.s = p.s * 0.997;
    if (p.s < 1.2) continue;

    // Perlin noise governs whether the particle falls or slides
    const Noise = noise(p.x / width, p.y / 9, time / width);

    // Horizontal
    if (Noise > 0.4) {
      // Stay in place (straight fall)
    } else {
      if (Noise % 0.1 > 0.05) p.x += 1;
      else                    p.x -= 1;
      p.g = 0; // reset gravity when sliding sideways
    }

    // Vertical
    if (Noise > 0.4) {
      p.g += 0.5;
      p.y += p.g;
    } else {
      p.y += 0.5;
    }

    // Render the glyph in place of a dot
    push();
    translate(p.x, p.y);
    rotate(p.r);
    textSize(p.s);
    text(p.c, 0, 0);
    pop();
  }
}
