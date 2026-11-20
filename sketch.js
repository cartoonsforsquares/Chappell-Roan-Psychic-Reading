//Madame Chappell: tap and Chappell reads your fortune in her crystal ball.
//On a tap she sinks behind the orb until only her eyes peek over it, her hands whirl around
//the ball, then she pops back up and the fortune writes itself onto the lace card.

// ---------- Settings ----------
const VW = 390, VH = 844;            //virtual phone frame, scaled to fit the window
const K = 0.37;                      //reference layout (1872px square) -> frame size
const TOP = 46;                      //where the top of the reference layout sits in the frame
const SINK_MS = 520;                 //how long she takes to duck behind the orb
const READ_MS = 2900;                //when she starts popping back up
const RISE_MS = 600;                 //how long the pop back up takes
const REVEAL_MS = 1000;              //how long the fortune takes to write itself out
const RARE_CHANCE = 1 / 25;          //golden fortune
const BTN = { x: VW / 2, y: 768, w: 262, h: 62 };

const INK = '#2B1022', YELLOW = '#FFE36E', PINK = '#F25FBF', CARD_INK = '#2A1410';

// ---------- State ----------
let man, IMG = {}, bgImg, laceImg;
let sc = 1, ox = 0, oy = 0;
let state = 'idle';                  //idle -> reading -> shown
let readAt = -99999, cardText = '', isRare = false, deck = [], firstRead = true;
let energy = 0, rareGlow = 0;        //how hard the hands and orb are going (0..1)
let sparks = [], pressedAt = -9999;

function preload() {
  man = loadJSON('img/manifest.json');
  bgImg = loadImage('img/background.webp');
  laceImg = loadImage('img/lace.webp');
  for (const n of ['body', 'glowY', 'glowP', 'table', 'orb', 'handTop', 'handLow', 'card'])
    IMG[n] = loadImage(`img/${n}.webp`);
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(min(2, displayDensity()));
  fitFrame();
  cardText = WELCOME;
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); fitFrame(); }

function fitFrame() {
  sc = min(width / VW, height / VH);
  ox = (width - VW * sc) / 2;
  oy = (height - VH * sc) / 2;
}

// ---------- Main loop ----------
function draw() {
  const now = millis(), t = now / 1000, since = now - readAt;
  if (state === 'reading' && since > READ_MS + RISE_MS) state = 'shown';

  //energy follows the reading: hands and orb go wild while she's under the ball
  const want = state === 'reading' && since < READ_MS ? 1 : 0;
  energy = lerp(energy, want, want ? 0.05 : 0.04);
  rareGlow = lerp(rareGlow, isRare && state !== 'reading' ? 1 : (isRare && since > READ_MS - 400 ? 1 : 0), 0.05);

  drawBackground();
  drawLace(t);

  push();
  translate(ox, oy); scale(sc);
  push();
  translate(VW / 2 - 975 * K, TOP - 40 * K); scale(K);       //from here on: reference coordinates
  drawBody(t, since);
  drawPiece('table');
  const pk = constrain(sinkAmount(since), 0, 1);     //how far she's ducked: orb and glow shrink to match
  drawGlow(t, pk);
  drawOrb(t, pk);
  drawHands(t, pk);
  updateSparks(t);
  drawCard(since);
  pop();
  drawButton(now);
  pop();
}

// ---------- Scene pieces (reference coordinates) ----------
function drawPiece(n, dx = 0, dy = 0) {
  const p = man.pieces[n];
  image(IMG[n], p.x + dx, p.y + dy, p.w, p.h);
}

//How far she has sunk: 0 = sitting up, 1 = only her eyes over the orb
function sinkAmount(since) {
  if (state === 'idle' || since > READ_MS + RISE_MS) return 0;
  if (since < SINK_MS) return easeInBack(since / SINK_MS);
  if (since < READ_MS) return 1;
  return 1 - easeOutBack((since - READ_MS) / RISE_MS);
}

function bodyOffset(t, since) {
    const SINK = orbCentre(1).y - man.pieces.glowY.h / 2 * PEEK_SCALE - 30 - man.eyesY;   //eyes just over the (shrunken) glow
  const s = sinkAmount(since);
  const under = state === 'reading' && since > SINK_MS && since < READ_MS;
  //peeking: little bob and eyes darting side to side while she's down there
  const peekX = under ? sin(t * 2.2) * 12 : 0;
  const peekY = under ? abs(sin(t * 1.8)) * -8 : 0;
  const breathe = sin(t * 1.6) * 5 * (1 - s);
  return { x: peekX, y: SINK * s + peekY + breathe, s };
}

function drawBody(t, since) {
  const o = bodyOffset(t, since);
  drawPiece('body', o.x, o.y);
}

//While she ducks, the orb and its glow shrink a little and settle lower so her eyes stay in view
const PEEK_SCALE = 0.74, PEEK_DROP = 45;
function orbCentre(pk) {
  return { x: man.orb.cx, y: man.orb.cy + PEEK_DROP * pk, s: lerp(1, PEEK_SCALE, pk) };
}

function drawGlow(t, pk) {
  const o = man.orb, c = orbCentre(pk);
  const pinkMix = 0.5 + 0.5 * sin(t * (0.7 + energy * 1.3));
  const pulse = c.s * (1 + 0.04 * sin(t * 1.6) + energy * 0.05 * sin(t * 2.4) + rareGlow * 0.1);
  push();
  translate(c.x, c.y); scale(pulse); translate(-o.cx, -o.cy);
  tint(255, 255 * (1 - 0.55 * energy * pinkMix * (1 - rareGlow)));      //yellow never fully fades: pink alone vanishes on the pink background
  drawPiece('glowY');
  if (energy > 0.02) { tint(255, 255 * energy * pinkMix * (1 - rareGlow)); drawPiece('glowP'); }
  noTint();
  pop();
}

let orbSpin = 0;
function drawOrb(t, pk) {
  const o = man.orb, c = orbCentre(pk);
  orbSpin += (0.04 + energy * 0.22) * deltaTime / 1000;          //slow, dreamy turn
  push();
  translate(c.x, c.y + sin(t * 1.3) * 5 * energy);                 //floats a touch while she reads
  scale(c.s);
  rotate(sin(t * 0.6) * 0.04 + orbSpin);
  translate(-o.cx, -o.cy);
  drawPiece('orb');
  pop();
  //misty swirl inside the ball while she reads
  if (energy > 0.05) {
    push();
    translate(c.x, c.y); scale(c.s);
    noFill(); strokeCap(ROUND);
    for (let i = 0; i < 3; i++) {
      const a = t * (0.7 + i * 0.35) + i * 2.1;
      stroke(255, 255, 255, 90 * energy);
      strokeWeight(10 - i * 2);
      arc(0, 0, o.r * (1.3 - i * 0.3), o.r * (1.0 - i * 0.2), a, a + 2.2);
    }
    pop();
  }
}

//Both arms swing from the sleeve end. They circle the orb in opposite directions: lazily while
//she waits, fast and wide while she reads.
function drawHands(t, pk) {
  const speed = 1.0 + energy * 3.2;
  handPhase += speed * deltaTime / 1000;
  const R = 6 + energy * 18;
  const a = handPhase;
  //hands slide in with the shrinking orb so they keep holding it
  const shrink = (1 - orbCentre(pk).s) * man.orb.r, drop = PEEK_DROP * pk;
  hand('handTop', R * cos(a) - shrink * 0.3, R * (sin(a) < 0 ? 0.25 : 0.5) * sin(a) + drop + shrink * 0.45,
    sin(a * 1.1) * (0.03 + energy * 0.04), 1, 0.72);
  hand('handLow', R * cos(a + PI) + shrink * 0.2, R * 0.5 * sin(a + PI) + drop - shrink * 0.4,
    sin(a * 1.1 + 1) * (0.03 + energy * 0.04), 0, 0.35);
}
let handPhase = 0;

function hand(n, dx, dy, rot, pivotX, pivotY) {
  const p = man.pieces[n];
  const px = p.x + p.w * pivotX, py = p.y + p.h * pivotY;
  push();
  translate(px + dx, py + dy); rotate(rot); translate(-px, -py);
  drawPiece(n);
  pop();
}

// ---------- Sparkles ----------
function updateSparks(t) {
  const o = man.orb;
  const rate = 0.06 + energy * 0.3 + rareGlow * 0.2;
  if (random() < rate) {
    const a = random(-0.3, PI + 0.3), r = o.r * random(0.8, 1.5);      //sides and below, so her peeking eyes stay clear
    sparks.push({ x: o.cx + cos(a) * r, y: o.cy + sin(a) * r, vx: cos(a) * random(0.2, 1.1), vy: sin(a) * random(0.2, 1.1) - 0.5,
      life: 1, size: random(14, 34) * (1 + energy * 0.6), col: random() < 0.5 || rareGlow > 0.5 ? YELLOW : '#FF9AD9' });
  }
  noStroke();
  for (const s of sparks) {
    s.x += s.vx; s.y += s.vy; s.vy += s.grav || 0; s.life -= s.decay || 0.009;
    fill(red(s.col), green(s.col), blue(s.col), 255 * constrain(s.life * 1.5, 0, 1));
    star(s.x, s.y, s.size * (0.5 + 0.5 * s.life), t * 1.2 + s.x);
  }
  sparks = sparks.filter(s => s.life > 0);
}

function star(x, y, r, spin) {
  push();
  translate(x, y); rotate(sin(spin) * 0.3);
  beginShape();
  for (let i = 0; i < 8; i++) {
    const a = i * QUARTER_PI - HALF_PI, rr = i % 2 ? r * 0.22 : r;
    vertex(cos(a) * rr, sin(a) * rr);
  }
  endShape(CLOSE);
  pop();
}

//Gold confetti for a golden fortune
function confetti() {
  const c = man.pieces.card;
  for (let i = 0; i < 70; i++) {
    sparks.push({ x: c.x + c.w / 2 + random(-60, 60), y: c.y + 40, vx: random(-14, 14), vy: random(-22, -8),
      grav: 0.6, decay: 0.008, life: 1, size: random(18, 34), col: random() < 0.7 ? '#FFD23F' : '#FFF4B8' });
  }
}

// ---------- The lace card ----------
function drawCard(since) {
  const c = man.pieces.card;
  drawPiece('card');
  const cx = c.x + c.w / 2, cy = c.y + c.h * 0.515, boxW = c.w * 0.68, boxH = c.h * 0.6;
  textFont('Yellowtail'); textAlign(CENTER, CENTER); noStroke();

  let str = cardText, alpha = 255, shown = Infinity;
  if (state === 'reading') {
    if (since < 300) alpha = 255 * (1 - since / 300);                          //old one fades away
    else if (since < READ_MS + 100) { str = 'the spirits are typing' + '.'.repeat(1 + floor(since / 350) % 3); alpha = 150; }
    else shown = floor(cardText.length * constrain((since - READ_MS - 100) / REVEAL_MS, 0, 1));
  }

  //biggest size that fits the paper
  let size = 64, lines;
  do { textSize(size); lines = wrapLines(str, boxW); size -= 2; }
  while (lines.length * size * 1.2 > boxH && size > 30);
  const lh = textSize() * 1.2;

  if (isRare && state !== 'idle' && !(state === 'reading' && since < READ_MS + 100)) {
    textFont('KCBubbleShack'); textSize(46); fill(176, 120, 20, alpha);
    text('GOLDEN PROPHECY', cx, c.y + c.h * 0.2);
    textFont('Yellowtail'); textSize(size + 2);
  }

  fill(42, 20, 16, alpha);
  let n = 0;
  lines.forEach((ln, i) => {
    const y = cy + (i - (lines.length - 1) / 2) * lh;
    //typewriter: only the letters revealed so far
    const visible = constrain(shown - n, 0, ln.length);
    n += ln.length + 1;
    if (visible <= 0) return;
    if (visible < ln.length) {
      textAlign(LEFT, CENTER);
      text(ln.slice(0, visible), cx - textWidth(ln) / 2, y);
      textAlign(CENTER, CENTER);
    } else text(ln, cx, y);
  });
}

function wrapLines(str, w) {
  const words = str.split(' '), lines = [];
  let cur = '';
  for (const wd of words) {
    const test = cur ? cur + ' ' + wd : wd;
    if (textWidth(test) > w && cur) { lines.push(cur); cur = wd; } else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

// ---------- Button ----------
function drawButton(now) {
  const busy = state === 'reading';
  const down = now - pressedAt < 140 ? 4 : 0;
  const label = busy ? 'READING...' : firstRead ? 'TELL MY FORTUNE' : 'ASK AGAIN';
  push();
  translate(BTN.x, BTN.y + down);
  rectMode(CENTER); stroke(INK); strokeWeight(3.5);
  fill(INK); rect(-4 + down, 6 - down, BTN.w, BTN.h, 31);          //3D shadow
  fill(busy ? '#C77AAE' : PINK); rect(0, 0, BTN.w, BTN.h, 31);
  styledText(label, 0, -2, 25, busy ? '#FFF1C2' : YELLOW);
  pop();
}

function styledText(str, x, y, size, fillCol = YELLOW, depth = size * 0.1) {
  textFont('KCBubbleShack'); textSize(size); textAlign(CENTER, CENTER);
  stroke(INK); strokeWeight(size * 0.12); strokeJoin(ROUND); fill(INK);
  for (let i = depth; i > 0; i -= 0.5) text(str, x - i, y + i);
  fill(fillCol); text(str, x, y);
  noStroke();
}

// ---------- Background + lace drapes (window coordinates) ----------
function drawBackground() {
  const s = max(width / bgImg.width, height / bgImg.height);
  imageMode(CENTER);
  image(bgImg, width / 2, height / 2, bgImg.width * s, bgImg.height * s);
  imageMode(CORNER);
}

//One lace strip hung diagonally in each top corner, swaying a little, like curtains
function drawLace(t) {
  const w = 215 * sc, h = w * man.lace.aspect;
  for (const side of [1, -1]) {
    push();
    if (side < 0) { translate(width, 0); scale(-1, 1); }
    translate(w * 0.8, -h * 0.12);
    rotate(radians(38) + sin(t * 0.8 + side) * 0.015);
    image(laceImg, -w / 2, 0, w, h);
    pop();
  }
}

// ---------- Reading a fortune ----------
function nextFortune() {
  isRare = random() < RARE_CHANCE;
  if (isRare) return random(RARE_FORTUNES);
  if (!deck.length) deck = shuffle(FORTUNES.slice());       //no repeats until you've seen them all
  return deck.pop();
}

function tellFortune() {
  if (state === 'reading') return;
  state = 'reading';
  readAt = millis();
  cardText = nextFortune();
  firstRead = false;
  setTimeout(() => {
    if (isRare) confetti();
    if (navigator.vibrate && navigator.userActivation?.hasBeenActive) navigator.vibrate(isRare ? [30, 40, 30, 40, 60] : 25);
  }, READ_MS + 100);
}

// ---------- Input ----------
function press(px, py) {
  const x = (px - ox) / sc, y = (py - oy) / sc;
  //the button, the orb and the card all ask for a fortune
  const onBtn = abs(x - BTN.x) < BTN.w / 2 + 8 && abs(y - BTN.y) < BTN.h / 2 + 10;
  const rx = (x - (VW / 2 - 975 * K)) / K, ry = (y - (TOP - 40 * K)) / K;
  const onOrb = dist(rx, ry, man.orb.cx, man.orb.cy) < man.orb.r * 1.2;
  const c = man.pieces.card;
  const onCard = rx > c.x && rx < c.x + c.w && ry > c.y && ry < c.y + c.h;
  if (onBtn || onOrb || onCard) { pressedAt = millis(); tellFortune(); }
}

function touchStarted() {
  if (touches.length) press(touches[touches.length - 1].x, touches[touches.length - 1].y);
  return false;
}
function mousePressed() { if (!touches.length) press(mouseX, mouseY); }
function keyPressed() {
  if (key === ' ' || keyCode === ENTER) { pressedAt = millis(); tellFortune(); return false; }
}

// ---------- Easing ----------
function easeInBack(x) { const c = 1.9; return (c + 1) * x * x * x - c * x * x; }
function easeOutBack(x) { const c = 2.2; x -= 1; return 1 + (c + 1) * x * x * x + c * x * x; }
