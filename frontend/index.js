const buffer = 50;

const socket = io('https://limitless-everglades-60126.herokuapp.com/');

socket.on('init', handleInit);
socket.on('gameState', (msg) => {
    gameStates.push(JSON.parse(msg));
});
const canvas = document.getElementById('canvas');
const initialScreen = document.getElementById('initialScreen');
const joinGameBtn = document.getElementById('joinGameButton');

joinGameBtn.addEventListener('click', joinGame);


function joinGame()
{
  initialScreen.style.display = 'none';
  myGameArea.start();
  drawer = new Drawer();
  controlsBundle.start();
  myGameArea.interval();

  socket.emit('new player', {});
}
var timeDifference = 0;
var controlId = 0;
function handleInit(msg) {
  timeDifference = msg.data - Date.now();
  controlId = msg.id;
}
function serverTime()
{
  return Date.now() + timeDifference;
}
function sendControls()
{
  socket.emit('controls',controlsBundle);
}
var gameStates = [];
var controlId;
var drawer;
var myGameArea = {
  canvas: document.createElement("canvas"),
  start: function () {
    //make the canvas and stuff.
    this.canvas = canvas;
    this.canvas.style.border = "none";

    this.canvas.style.margin = 0;
    this.canvas.style.padding = 0;

    this.canvas.width = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    this.canvas.height = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    this.context = this.canvas.getContext("2d");
    window.oncontextmenu = function () {
      return false;     // cancel default menu
    }
    this.time = Date.now();
    this.fpsUpdate = 60;
    this.frameTimes = [];
    this.printFps = function () {

      var elapsed = Date.now() - this.time;
      this.time = Date.now();
      this.frameTimes.push(elapsed);
      if (this.frameTimes.length > this.fpsUpdate) {
        this.frameTimes.shift();
      }
      this.totalElapsed = 0;
      for (var i = 0; i < this.frameTimes.length; i++) {
        this.totalElapsed += this.frameTimes[i];
      }
      this.fps = this.frameTimes.length * 1000 / this.totalElapsed;


      var ctx = myGameArea.context;
      ctx.save();
      ctx.font = "bold 45px Courier New";
      ctx.fillStyle = "black";
      ctx.textAlign = "left";
      var displayNum = Math.floor(this.fps + 0.5);
      ctx.fillText(displayNum, 10, 45);
      ctx.restore();
    }
    this.fpsInterval = 1000 / 60;
    this.animate = function () {
      requestAnimationFrame(this.animate.bind(this));
      now = Date.now();
      elapsed = now - then;
      if (elapsed > this.fpsInterval) {
        then = now - elapsed % this.fpsInterval;
        updateGameArea();
      }
    }
    this.interval = function () {
      then = Date.now();
      startTime = then;
      this.animate();
    }
    

  },
  clear: function () {
    this.context.fillStyle = "#080";
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
var controlsBundle = {
  keys: [],
  mouse: 0,
  mouseDown: false,
  ang: 0,
  start: function () {
    window.addEventListener('keydown', function (e) {
      controlsBundle.keys = (controlsBundle.keys || []);
      controlsBundle.keys[e.keyCode] = true;
      socket.emit('keydown', e.keyCode);
    })
    window.addEventListener('keyup', function (e) {
      controlsBundle.keys[e.keyCode] = false;
      socket.emit('keyup', e.keyCode);
    })

    const rect = myGameArea.canvas.getBoundingClientRect();
    window.addEventListener('mousemove', function (e) {
      controlsBundle.mouse = new Vector(e.clientX - rect.left, e.clientY - rect.top);
      controlsBundle.ang = controlsBundle.mouse.subtract(new Vector(myGameArea.canvas.width, myGameArea.canvas.height).multiply(0.5)).ang();
      socket.emit('mousemove', controlsBundle.ang);
    });
    window.addEventListener('mousedown', function (e) {
      if (e.button == 0) {
        controlsBundle.mouseDown = true;
        socket.emit('mousedown');
      }
    })
    window.addEventListener('mouseup', function (e) {
      if (e.button == 0) {
        controlsBundle.mouseDown = false;
        socket.emit('mouseup');
      }
    })

    window.addEventListener("keydown", function (e) {
      // space, page up, page down and arrow keys:
      if ([32, 33, 34, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
        e.preventDefault();
      }
    }, false);
  }
}
var setIfUndefined = function (obj, field, value) {
  if (obj[field] === undefined) {
    obj[field] = value;
  }
}
var giveMethods = function (obj) {
  if (obj == null) {
    return;
  }

  if (typeof obj === "object") {
    for (var field in obj) {
      giveMethods(obj[field]);
    }
  }

  var type = obj.type;
  if (type != undefined) {
    obj.construct = window[type];
    obj.construct();
  }
}
var GameState = function (time, players, obstacles, weapons) {
  this.type = "GameState";
  setIfUndefined(this, 'time', time);
  setIfUndefined(this, 'players', players);
  setIfUndefined(this, 'obstacles', obstacles);
  setIfUndefined(this, 'weapons', weapons);
  this.render = function (gameState2, gameState3) {
    myGameArea.clear();
    drawer.update(this);
    for (var idx in this.obstacles)
    {
      this.displayObstacle(idx);
    }
    for (var idx in this.weapons)
    {
      if (!this.weapons[idx].hold) {
        this.displayWeapon(idx)
      }
    }
    for (var idx in this.players) {
      this.displayPlayer(idx);
    }
    for (var idx in gameState2.players) {
      gameState2.displayPlayer(idx);
    }
    for (var idx in gameState2.players) {
      gameState3.displayPlayer(idx);
    }
    this.displayReloadTime();
    this.displayBulletCount();
    myGameArea.printFps();
    displayCrosshair();
  }
  this.displayPlayer = function(i)
  {
    var player = this.players[i];

    var color = '#fcc976';
    var ctx = myGameArea.context;

    ctx.fillStyle = pSBC(0.5, color);
    ctx.beginPath();
    drawer.circle(ctx, player.pos, player.radius);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = color;
    ctx.beginPath();
    drawer.circle(ctx, player.pos, player.radius * player.health / 100);
    ctx.closePath();
    ctx.fill();

    var firstHand = (player.weapon != -1 ? new Vector(player.radius - this.weapons[player.weapon].recoil, 3) : new Vector(player.radius * 0.75, player.radius * 0.8));
    var secondHand = (player.weapon != -1 ? new Vector(2 * player.radius - this.weapons[player.weapon].recoil, 6) : new Vector(player.radius * 0.75, -player.radius * 0.8));
    if (player.weapon != -1) {
      this.displayWeapon(player.weapon);
    }
    ctx.strokeStyle = '#000';
    drawer.lineWidth(ctx, 3);
    ctx.beginPath();
    drawer.circle(ctx, player.pos.add(firstHand.rotate(player.ang)), 6);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();

    ctx.beginPath();
    drawer.circle(ctx, player.pos.add(secondHand.rotate(player.ang)), 6);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
  }
  this.displayWeapon = function(i)
  {
    var weapon = this.weapons[i];
    for (var i = 0; i < weapon.bullets.length; i++) {
      weapon.bullets[i].display();
    }
    var ctx = myGameArea.context;
    ctx.strokeStyle = weapon.color;

    drawer.lineWidth(ctx, 8);
    ctx.beginPath();
    drawer.moveContext(ctx, weapon.pos.add((new Vector(-weapon.length / 2, 0)).rotate(weapon.ang)));
    drawer.lineContext(ctx, weapon.pos.add((new Vector(weapon.length / 2, 0)).rotate(weapon.ang)));
    ctx.closePath();
    ctx.stroke();
  }
  this.displayObstacle = function(i)
  {
    var obstacle = this.obstacles[i];
    var ctx = myGameArea.context;
    ctx.fillStyle = obstacle.color;
    ctx.beginPath();
    drawer.moveContext(ctx, obstacle.vs[0]);
    for (var i = 1; i < obstacle.vs.length; i++) {
      drawer.lineContext(ctx, obstacle.vs[i]);
    }
    ctx.closePath();
    ctx.fill();
  }
  this.displayBulletCount = function () {
    var player = this.players[controlId];
    if (player && player.weapon != -1) {
      var ctx = myGameArea.context;
      ctx.save();
      ctx.font = "bold 40px Courier New";
      ctx.fillStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.textAlign = "center";
      ctx.fillText(this.weapons[player.weapon].bulletsRemaining + '|' + this.weapons[player.weapon].capacity, myGameArea.canvas.width / 2, myGameArea.canvas.height - 100);
      ctx.restore();
    }
  }
  this.displayReloadTime = function () {
    var player = this.players[controlId];
    if (player.weapon != -1 && this.weapons[player.weapon].reloadStartTime != -1) {
      var ctx = myGameArea.context;
      ctx.save();
      ctx.globalAlpha = 0.8;

      ctx.strokeStyle = '#fff';
      drawer.lineWidth(ctx, 6);
      ctx.beginPath();
      drawer.moveContext(ctx, player.pos.add(new Vector(-player.radius, player.radius * 2)));
      drawer.lineContext(ctx, player.pos.add(new Vector(player.radius - 2 * player.radius * (this.time - this.weapons[player.weapon].reloadStartTime) / this.weapons[player.weapon].reloadTime, player.radius * 2)));
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }
  }
  this.toString = function () {
    return JSON.stringify(this);
  }
}
var makeObstacles = function () {
  drawer = new Drawer();
}
var Player = function (xStart, yStart) {
  this.type = "Player";
  setIfUndefined(this, 'speed', 4);
  setIfUndefined(this, 'agility', .1);
  setIfUndefined(this, 'radius', 20);
  setIfUndefined(this, 'reachDist', 50);
  setIfUndefined(this, 'weapon', -1);
  setIfUndefined(this, 'health', 100);

  setIfUndefined(this, 'pos', new Vector(xStart, yStart));
  setIfUndefined(this, 'vel', new Vector(0, 0));

  setIfUndefined(this, 'ang', 0);
  
  /*this.drawHealthBar = function()
  {
       var ctx = myGameArea.context;
     var border = 3;
     
      ctx.strokeStyle = '#000';
       drawer.lineWidth(ctx,8 + 2*border);
       ctx.beginPath();
       drawer.moveContext(ctx,this.pos.add(new Vector(-this.radius - border,-this.radius * 2)));
       drawer.lineContext(ctx,this.pos.add(new Vector(-this.radius+2*this.radius + border,-this.radius * 2)));
       ctx.closePath();
       ctx.stroke();

       ctx.strokeStyle = '#f00';
       drawer.lineWidth(ctx,8);
       ctx.beginPath();
       drawer.moveContext(ctx,this.pos.add(new Vector(-this.radius,-this.radius * 2)));
       drawer.lineContext(ctx,this.pos.add(new Vector(-this.radius+2*this.radius,-this.radius * 2)));
       ctx.closePath();
       ctx.stroke();


       ctx.strokeStyle = '#0f0';
       ctx.beginPath();
       drawer.moveContext(ctx,this.pos.add(new Vector(-this.radius,-this.radius * 2)));
       drawer.lineContext(ctx,this.pos.add(new Vector(-this.radius+2*Math.max(0,this.health)/100*this.radius,-this.radius * 2)));
       ctx.closePath();
       ctx.stroke();
  }*/
  
}
var Gun = function (startX, startY, length, auto, firerate, multishot, capacity, reloadTime, bulletSpeed, damage, range, defSpray, sprayCoef, stability, kickAnimation, animationMult, shootWalkSpeedMult, color) {
  this.type = "Gun";
  setIfUndefined(this, 'pos', new Vector(startX, startY));
  setIfUndefined(this, 'vel', new Vector(0, 0));
  setIfUndefined(this, 'ang', 0);
  setIfUndefined(this, 'length', length);
  setIfUndefined(this, 'auto', auto);
  setIfUndefined(this, 'multishot', multishot);
  setIfUndefined(this, 'capacity', capacity);
  setIfUndefined(this, 'reloadTime', reloadTime);
  setIfUndefined(this, 'firerate', firerate);
  setIfUndefined(this, 'defSpray', defSpray);
  setIfUndefined(this, 'sprayCoef', sprayCoef);
  setIfUndefined(this, 'bulletSpeed', bulletSpeed);
  setIfUndefined(this, 'damage', damage);
  setIfUndefined(this, 'range', range);
  setIfUndefined(this, 'stability', stability);
  setIfUndefined(this, 'kickAnimation', kickAnimation);
  setIfUndefined(this, 'animationMult', animationMult);
  setIfUndefined(this, 'shootWalkSpeedMult', shootWalkSpeedMult);

  setIfUndefined(this, 'color', color);
  setIfUndefined(this, 'bulletsRemaining', 0);
  setIfUndefined(this, 'reloadStartTime', -1);

  setIfUndefined(this, 'spray', 0);
  setIfUndefined(this, 'recoil', 0);
  setIfUndefined(this, 'lastFireTime', 0);
  setIfUndefined(this, 'hold', false);
  setIfUndefined(this, 'bullets', []);
}
var Bullet = function (weapon) {
  this.type = "Bullet";
  if (weapon === undefined) {
    weapon = new Gun(0, 0, 0, false, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '#000');
  }
  setIfUndefined(this, 'startPos', weapon.pos.add((new Vector(weapon.length / 2, 0)).rotate(weapon.ang)));
  setIfUndefined(this, 'tailPos', this.startPos.copy());
  setIfUndefined(this, 'pos', this.startPos.copy());
  setIfUndefined(this, 'vel', (new Vector(weapon.bulletSpeed, 0)).rotate(weapon.ang + weapon.spray * (Math.random() - 0.5)).add(weapon.vel));
  setIfUndefined(this, 'ang', this.vel.ang());
  setIfUndefined(this, 'bulletSpeed', weapon.bulletSpeed);
  setIfUndefined(this, 'damage', weapon.damage);
  setIfUndefined(this, 'range', weapon.range);
  setIfUndefined(this, 'hitPoint', -1);
  setIfUndefined(this, 'fadeTime', 10);
  setIfUndefined(this, 'trailLength', this.bulletSpeed * this.fadeTime);
  setIfUndefined(this, 'stopAnimationAge', 0);
  setIfUndefined(this, 'color', weapon.color);
  this.display = function () {
    var ctx = myGameArea.context;
    const g = drawer.createLinearGradient(ctx, this.pos, this.tailPos);
    g.addColorStop(0, hexToRgbA(pSBC(0.5, this.color), 1)); // opaque
    g.addColorStop(1, hexToRgbA(pSBC(0.3, this.color), 0)); // transparent
    ctx.strokeStyle = g;

    drawer.lineWidth(ctx, 6);
    ctx.beginPath();
    drawer.moveContext(ctx, this.hitPoint != -1 ? this.hitPoint : this.pos);
    drawer.lineContext(ctx, this.tailPos);
    ctx.closePath();
    ctx.stroke();
  }
}
var Drawer = function () {
  this.scroll = this.scroll || new Vector(0, 0);
  this.scale = 1;
  this.targetScale = 1 / 3000 * (myGameArea.canvas.width + myGameArea.canvas.height);
  this.screenShake = this.screenShake || 0;
  this.moveContext = function (ctx, point) {
    var displayPoint = point.subtract(this.scroll).multiply(this.scale).add((new Vector(myGameArea.canvas.width, myGameArea.canvas.height)).multiply(0.5));
    ctx.moveTo(displayPoint.x, displayPoint.y);
  }
  this.lineWidth = function (ctx, width) {
    ctx.lineWidth = width * this.scale;
  }
  this.lineContext = function (ctx, point) {
    var displayPoint = point.subtract(this.scroll).multiply(this.scale).add((new Vector(myGameArea.canvas.width, myGameArea.canvas.height)).multiply(0.5));
    ctx.lineTo(displayPoint.x, displayPoint.y);
  }
  this.circle = function (ctx, point, radius) {
    var displayPoint = point.subtract(this.scroll).multiply(this.scale).add((new Vector(myGameArea.canvas.width, myGameArea.canvas.height)).multiply(0.5));
    ctx.arc(displayPoint.x, displayPoint.y, radius * this.scale, 0, 2 * Math.PI, false);
  }
  this.createLinearGradient = function (ctx, start, end) {
    var newStart = start.subtract(this.scroll).multiply(this.scale).add((new Vector(myGameArea.canvas.width, myGameArea.canvas.height)).multiply(0.5));
    var newEnd = end.subtract(this.scroll).multiply(this.scale).add((new Vector(myGameArea.canvas.width, myGameArea.canvas.height)).multiply(0.5));
    return ctx.createLinearGradient(newStart.x, newStart.y, newEnd.x, newEnd.y);
  }
  this.update = function (state) {
    character = state.players[controlId];
    this.scroll = character.pos.add((new Vector(Math.random() - 0.5, Math.random() - 0.5)).multiply(this.screenShake));
    this.scale = 0.9 * (this.scale - this.targetScale) + this.targetScale;
  }
}
var Obstacle = function (vs, color) {
  this.type = "Obstacle";
  setIfUndefined(this, 'color', color);

  setIfUndefined(this, 'vs', vs);
  if (this.center == undefined) {
    this.center = new Vector(0, 0);
    for (var i = 0; i < this.vs.length; i++) {
      this.center = this.center.add(this.vs[i]);
    }
    this.center = this.center.multiply(1 / this.vs.length);

  }
  if (this.maxRadius == undefined) {
    this.maxRadius = 0;
    for (var i = 0; i < this.vs.length; i++) {
      this.maxRadius = Math.max(this.center.distanceTo(this.vs[i]), this.maxRadius);
    }
  }
}
var Vector = function (x, y) {
  this.type = "Vector";
  setIfUndefined(this, 'x', x);
  setIfUndefined(this, 'y', y);
  this.rotate = function (theta) {
    return new Vector(x * Math.cos(theta) - y * Math.sin(theta), y * Math.cos(theta) + x * Math.sin(theta));
  }
  this.magnitude = function () {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  this.multiply = function (n) {
    return new Vector(this.x * n, this.y * n);
  }
  this.ang = function () {
    if (x > 0) {
      return Math.atan(this.y / this.x);
    }
    else if (x < 0) {
      return Math.PI + Math.atan(this.y / this.x);
    }
    else {
      if (y >= 0) {
        return Math.PI / 2;
      }
      else {
        return 3 * Math.PI / 2;
      }
    }
  }
  this.add = function (v) {
    return new Vector(this.x + v.x, this.y + v.y);
  }
  this.subtract = function (v) {
    return new Vector(this.x - v.x, this.y - v.y);
  }
  this.distanceTo = function (v) {
    return (this.subtract(v)).magnitude();
  }
  this.angTo = function (v) {
    return (this.subtract(v)).ang();
  }
  this.drawLine = function (v, color, thickness) {
    if (v == null) {
      return;
    }
    var ctx = myGameArea.context;
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(v.x, v.y);
    ctx.stroke();
  }
  this.dot = function (r, color) {
    var ctx = myGameArea.context;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, 2 * Math.PI, false);
    ctx.fillStyle = color;
    ctx.fill();
  }
  this.onSegment = function (v1, v2) {
    var buffer = 0.0001
    return Math.min(v1.x, v2.x) - buffer <= this.x && this.x <= Math.max(v1.x, v2.x) + buffer && Math.min(v1.y, v2.y) - buffer <= this.y && this.y <= Math.max(v1.y, v2.y) + buffer;
  }
  this.closestToLine = function (v1, v2) {
    var x1 = v1.x;
    var y1 = v1.y;
    var x2 = v2.x;
    var y2 = v2.y;

    var e1x = x2 - x1;
    var e1y = y2 - y1;
    var area = e1x * e1x + e1y * e1y;
    var e2x = this.x - x1;
    var e2y = this.y - y1;
    var val = e1x * e2x + e1y * e2y;
    var on = (val > 0 && val < area);

    var lenE1 = Math.sqrt(e1x * e1x + e1y * e1y);
    var lenE2 = Math.sqrt(e2x * e2x + e2y * e2y);
    var cos = val / (lenE1 * lenE2);

    var projLen = cos * lenE2;
    var px = x1 + (projLen * e1x) / lenE1;
    var py = y1 + (projLen * e1y) / lenE1;
    return new Vector(px, py);
  }
  this.copy = function () {
    return new Vector(this.x, this.y);
  }

}
var displayCrosshair = function () {
  controlsBundle.mouse.add(new Vector(10, 0)).drawLine(controlsBundle.mouse.add(new Vector(-10, 0)), '#fff', 2);
  controlsBundle.mouse.add(new Vector(0, 10)).drawLine(controlsBundle.mouse.add(new Vector(0, -10)), '#fff', 2);
}
var linearPosition = function(v1,v2,t,t1,t2)
{
  return new Vector(v1.x * 0.5 + v2.x * 0.5, v1.y * 0.5 + v2.y * 0.5);
  return new Vector(v1.x * (t2 - t)/(t2 - t1) + v2.x * (t - t1)/(t2 - t1), v1.y * (t2 - t)/(t2 - t1) + v2.y * (t - t1)/(t2 - t1));
}
var linearGameState = function()
{
  var displayTime = serverTime() - buffer;
  var rightIdx = 1;
  var time = 0;
  while (rightIdx < gameStates.length && gameStates[rightIdx].time < displayTime)
  {
      if (rightIdx > 1)
      {
        gameStates.splice(rightIdx - 2, 1);
      }
      else{
        rightIdx += 1;
      }
      
  }
  if (rightIdx >= gameStates.length)
  {
    rightIdx = gameStates.length - 1;
  }

  var right = gameStates[rightIdx];
  var left = gameStates[rightIdx - 1];
  return [left, right];
}
var resetControls = function()
{
  controlsBundle.justKeyDown = {};
  controlsBundle.justDowned = false;
}
function updateGameArea() {
  if (gameStates.length > 1)
  {
    var states = linearGameState();
    var state = Object(states[0]);
    var displayTime = serverTime() - buffer;
    for (var i in state.players)
    {
       if (states[0].players[i] == undefined || states[1].players[i] == undefined)
       {
          continue;
       }
       state.players[i].pos = linearPosition(states[0].players[i].pos, states[1].players[i].pos, displayTime, states[0].time, states[1].time);
    }
    giveMethods(state);
    giveMethods(states);
    state.render(states[0],states[1]);
  }
}
function hexToRgbA(hex, alpha) {
  var c;
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    c = hex.substring(1).split('');
    if (c.length == 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    c = '0x' + c.join('');
    return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + alpha + ')';
  }
  throw new Error('Bad Hex');
}
// Version 4.0
const pSBC = (p, c0, c1, l) => {
  let r, g, b, P, f, t, h, i = parseInt, m = Math.round, a = typeof (c1) == "string";
  if (typeof (p) != "number" || p < -1 || p > 1 || typeof (c0) != "string" || (c0[0] != 'r' && c0[0] != '#') || (c1 && !a)) return null;
  if (!this.pSBCr) this.pSBCr = (d) => {
    let n = d.length, x = {};
    if (n > 9) {
      [r, g, b, a] = d = d.split(","), n = d.length;
      if (n < 3 || n > 4) return null;
      x.r = i(r[3] == "a" ? r.slice(5) : r.slice(4)), x.g = i(g), x.b = i(b), x.a = a ? parseFloat(a) : -1
    } else {
      if (n == 8 || n == 6 || n < 4) return null;
      if (n < 6) d = "#" + d[1] + d[1] + d[2] + d[2] + d[3] + d[3] + (n > 4 ? d[4] + d[4] : "");
      d = i(d.slice(1), 16);
      if (n == 9 || n == 5) x.r = d >> 24 & 255, x.g = d >> 16 & 255, x.b = d >> 8 & 255, x.a = m((d & 255) / 0.255) / 1000;
      else x.r = d >> 16, x.g = d >> 8 & 255, x.b = d & 255, x.a = -1
    } return x
  };
  h = c0.length > 9, h = a ? c1.length > 9 ? true : c1 == "c" ? !h : false : h, f = this.pSBCr(c0), P = p < 0, t = c1 && c1 != "c" ? this.pSBCr(c1) : P ? { r: 0, g: 0, b: 0, a: -1 } : { r: 255, g: 255, b: 255, a: -1 }, p = P ? p * -1 : p, P = 1 - p;
  if (!f || !t) return null;
  if (l) r = m(P * f.r + p * t.r), g = m(P * f.g + p * t.g), b = m(P * f.b + p * t.b);
  else r = m((P * f.r ** 2 + p * t.r ** 2) ** 0.5), g = m((P * f.g ** 2 + p * t.g ** 2) ** 0.5), b = m((P * f.b ** 2 + p * t.b ** 2) ** 0.5);
  a = f.a, t = t.a, f = a >= 0 || t >= 0, a = f ? a < 0 ? t : t < 0 ? a : a * P + t * p : 0;
  if (h) return "rgb" + (f ? "a(" : "(") + r + "," + g + "," + b + (f ? "," + m(a * 1000) / 1000 : "") + ")";
  else return "#" + (4294967296 + r * 16777216 + g * 65536 + b * 256 + (f ? m(a * 255) : 0)).toString(16).slice(1, f ? undefined : -2)
}
