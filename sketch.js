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
const INTRO_FADE_MS = 650;           //opening frame fade into the game
const BTN = { x: VW / 2, y: 766, w: 290, h: 106 };   //h follows the Ask Again art's shape

const INK = '#2B1022', YELLOW = '#FFE36E', PINK = '#F25FBF', CARD_INK = '#2A1410';

// ---------- State ----------
let man, IMG = {}, bgImg, laceImg, btnImg;
let sc = 1, ox = 0, oy = 0;
let state = 'intro';                 //intro -> idle -> reading -> shown
let introOutAt = 0;                  //when the opening frame started fading away
let readAt = -99999, cardText = '', isRare = false, deck = [], firstRead = true, readingLine = '';
let energy = 0, rareGlow = 0;        //how hard the hands and orb are going (0..1)
let sparks = [], pressedAt = -9999;

function preload() {
  man = loadJSON('img/manifest.json');
  bgImg = loadImage('img/background.webp');
  laceImg = loadImage('img/lace.webp');
  btnImg = loadImage('img/ask-again.webp');
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

  //opening frame on top, fading away once tapped
  if (state === 'intro' || now - introOutAt < INTRO_FADE_MS) {
    const a = state === 'intro' ? 1 : 1 - easeInOut((now - introOutAt) / INTRO_FADE_MS);
    drawIntro(t, a);
  }
}

// ---------- Opening frame ----------
//"Welcome to Chappell Roan's Psychic Readings" on the lace card, a glowing orb, and a pulsing
//Tap to Begin. Drawn over the game so it can fade straight into it.
function drawIntro(t, a) {
  drawingContext.save();
  drawingContext.globalAlpha = a;
  drawBackground();
  drawLace(t);
  push();
  translate(ox, oy); scale(sc);
  imageMode(CENTER);

  //title on the lace card
  const cw = 372, ch = cw * man.pieces.card.h / man.pieces.card.w, cy = 236;
  image(IMG.card, VW / 2, cy, cw, ch);
  textFont('Charm'); textAlign(CENTER, CENTER); noStroke(); fill(42, 20, 16);
  textSize(22); text('Welcome to', VW / 2, cy - 50);
  const big = (str, y) => { textSize(40); textSize(min(40, 40 * 250 / textWidth(str))); text(str, VW / 2, y); };
  big("Chappell Roan's", cy - 8);
  big('Psychic Readings', cy + 38);

  //the orb, glowing and turning slowly, with twinkles around it
  const oyc = 520, pulse = 1 + 0.05 * sin(t * 1.6);
  image(IMG.glowY, VW / 2, oyc, 250 * pulse, 245 * pulse);
  push();
  translate(VW / 2, oyc + sin(t * 1.2) * 4); rotate(t * 0.08);
  image(IMG.orb, 0, 0, 132, 132);
  pop();
  for (let i = 0; i < 9; i++) {
    const ang = i * TWO_PI / 9 + t * 0.15, r = 112 + 14 * sin(i * 2.3);
    const tw = constrain(sin(t * 1.7 + i * 1.9), 0, 1);
    fill(i % 2 ? color(255, 227, 110, 255 * tw) : color(255, 154, 217, 255 * tw));
    star(VW / 2 + cos(ang) * r, oyc + sin(ang) * r * 0.85, 7 + 6 * tw, t + i);
  }

  //tap prompt
  //same solid ink as the headline; it pulses in size instead of fading
  fill(42, 20, 16);
  textSize(30 * (1 + 0.05 * sin(t * 3))); text('Tap to Begin', VW / 2, 712);
  imageMode(CORNER);
  pop();
  drawingContext.restore();
}

function startFromIntro() {
  if (state !== 'intro') return;
  state = 'idle';
  introOutAt = millis();
}

function easeInOut(x) { x = constrain(x, 0, 1); return x < 0.5 ? 2 * x * x : 1 - pow(-2 * x + 2, 2) / 2; }

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
//The hands are the show. Idle: a slow hover around the orb. Reading: they whip around the ball in
//figure-eights in opposite directions, waggle from the wrist with a spooky finger tremble, and
//flare out in a big "ta-da!" when she pops back up with the fortune.
function drawHands(t, pk) {
  const since = millis() - readAt;
  const speed = 1.0 + energy * 6.5;
  handPhase += speed * deltaTime / 1000;
  const a = handPhase;
  const R = 6 + energy * 34;
  //wave: two wrist flicks per loop, plus a fast shimmy while she's reading
  const wave = (0.03 + energy * 0.13);
  const tremble = sin(t * 19) * 0.03 * energy;
  //"ta-da": arms flare open as she rises, then settle back
  let flare = 0;
  if (state === 'reading' && since > READ_MS - 150 && since < READ_MS + RISE_MS + 250)
    flare = sin(PI * constrain((since - READ_MS + 150) / (RISE_MS + 400), 0, 1));
  //anticipation: a quick lift just as she starts to duck
  const lift = state === 'reading' && since < 260 ? sin(PI * since / 260) : 0;

  //hands slide in with the shrinking orb so they keep holding it
  const shrink = (1 - orbCentre(pk).s) * man.orb.r, drop = PEEK_DROP * pk;
  const topY = R * 0.55 * sin(2 * a);
  //top hand: while she's ducked, it never flicks its fingers up over her eyes
  let topRot = sin(a * 2) * wave + tremble;
  if (topRot > 0) topRot *= 1 - 0.85 * pk;
  hand('handTop',
    R * cos(a) - shrink * 0.3 + flare * 70,
    (topY < 0 ? topY * 0.4 : topY) + drop + shrink * 0.45 + pk * 22 - flare * 45 - lift * 30,
    topRot - flare * 0.22, 1, 0.72);
  hand('handLow',
    R * cos(a + PI) + shrink * 0.2 - flare * 70,
    R * 0.55 * sin(2 * a + PI) + drop - shrink * 0.4 + flare * 40 - lift * 30,
    sin(a * 2 + 1.3) * wave - tremble + flare * 0.22, 0, 0.35);
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
  textFont('Charm'); textAlign(CENTER, CENTER); noStroke();

  let str = cardText, alpha = 255, shown = Infinity;
  if (state === 'reading') {
    if (since < 300) alpha = 255 * (1 - since / 300);                          //old one fades away
    else if (since < READ_MS + 100) { str = readingLine; alpha = 170; }                //her snark while she reads
    else shown = floor(cardText.length * constrain((since - READ_MS - 100) / REVEAL_MS, 0, 1));
  }

  //biggest size that fits the paper
  let size = 64, lines;
  do { textSize(size); lines = wrapLines(str, boxW); size -= 2; }
  while (lines.length * size * 1.2 > boxH && size > 30);
  const lh = textSize() * 1.2;

  if (isRare && state !== 'idle' && !(state === 'reading' && since < READ_MS + 100)) {
    textFont('Charm'); textSize(50); fill(176, 120, 20, alpha);
    text('GOLDEN PROPHECY', cx, c.y + c.h * 0.2);
    textFont('Charm'); textSize(size + 2);
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
  const pressed = now - pressedAt < 140;
  const h = BTN.w * man.button.aspect;
  push();
  translate(BTN.x, BTN.y + (pressed ? 3 : sin(now / 600) * 2));   //floats gently, dips when tapped
  scale(pressed ? 0.96 : 1);
  imageMode(CENTER);
  if (busy) tint(255, 140);                                         //faded while she reads
  image(btnImg, 0, 0, BTN.w, h);
  noTint();
  pop();
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
  readingLine = random(READING_LINES.filter(l => l !== readingLine));   //never the same twice in a row
  firstRead = false;
  setTimeout(() => {
    if (isRare) confetti();
    if (navigator.vibrate && navigator.userActivation?.hasBeenActive) navigator.vibrate(isRare ? [30, 40, 30, 40, 60] : 25);
  }, READ_MS + 100);
}

// ---------- Input ----------
function press(px, py) {
  if (state === 'intro') { startFromIntro(); return; }       //any tap leaves the opening frame
  if (millis() - introOutAt < INTRO_FADE_MS) return;
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
  if (key === ' ' || keyCode === ENTER) {
    if (state === 'intro') startFromIntro(); else { pressedAt = millis(); tellFortune(); }
    return false;
  }
}

// ---------- Easing ----------
function easeInBack(x) { const c = 1.9; return (c + 1) * x * x * x - c * x * x; }
function easeOutBack(x) { const c = 2.2; x -= 1; return 1 + (c + 1) * x * x * x + c * x * x; }
