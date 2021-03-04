const gameWidth = 2000;
const gameHeight = 2000;

const io = require('socket.io')();

io.on('connection', client => {
	client.emit('init', {data : Date.now(), id : client.id, obstacles : obstacles});
	client.on('new player', addPlayer);
    client.on('disconnect', function() {
      if (gameState.players[client.id] != undefined)
      	gameState.players[client.id].dropWeapon();
      delete gameState.players[client.id];
      delete controls[client.id];
    });
    client.on('keydown', (keycode) => {
    	if (controls[client.id] && gameState.players[client.id])
    	{
    		controls[client.id].keys[keycode] = true;
    		gameState.players[client.id].justKeyDowned[keycode] = true;
    	}
    });
    client.on('keyup', (keycode) => {
    	if (controls[client.id] && gameState.players[client.id])
    		controls[client.id].keys[keycode] = false;
    });
    client.on('mousemove', (ang) => {
    	if (controls[client.id] && gameState.players[client.id])
    		controls[client.id].ang = ang;
    });
    client.on('mousedown', () => {
    	if (controls[client.id] && gameState.players[client.id])
    	{
    		controls[client.id].mouseDown = true;
    	    gameState.players[client.id].justMouseDowned = true;
    	}
    });
    client.on('mouseup', () => {
    	if (controls[client.id] && gameState.players[client.id])
    		controls[client.id].mouseDown = false;
    });
	function addPlayer(msg){
	  controlId = client.id;
		var startPos = findSpawnPosition();
		gameState.players[controlId] = new Player(startPos.x,startPos.y);
		controls[controlId] = {
			keys : [],
			mouseDown : false
		}
	}
   

});
var findSpawnPosition = function()
{
   var startPos;
   do {
      startPos = new Vector(gameWidth * Math.random(), gameHeight * Math.random());
   }
   while (gameState.inObjects(startPos));
   return startPos;
}
var obstacles;
var gameState;
var controls = {};
function emitGameState(gameState) {
  // Send this event to everyone in the room.
  io.sockets.emit('gameState', JSON.stringify(gameState));
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
var GameState = function (time, players, weapons) {
  this.type = "GameState";
  setIfUndefined(this, 'time', time);
  setIfUndefined(this, 'players', players);
  setIfUndefined(this, 'weapons', weapons);
  this.step = function () {
  	this.time = Date.now();
  	for (var k in this.players)
    {
        this.players[k].controls(k);
    }
    for (var k in this.players) {
      this.players[k].step();
    }
    obstacles.forEach((obstacle) => {
      for (var k in this.players) {
        this.players[k].intersect(obstacle);
      }
    });
    for (var k in this.weapons) {
      this.weapons[k].bulletsStep();
    }
    for (var k in this.players) {
      if (this.players[k].health <= 0) {
        this.players[k].dropWeapon();

        delete this.players[k];
      }
    }
  }
	this.inObjects = function(v)
	{
		for (var i in obstacles)
		{
			if (obstacles[i].insideOf(v))
			{
				return true;
			}
		}
		return false;
	}
  this.toString = function () {
    return JSON.stringify(this);
  }
}
var makeObstacles = function () {
  var players = {
  };
  obstacles = [
    /*new Obstacle([new Vector(100, 100), new Vector(200, 200), new Vector(260, 200), new Vector(260, 100), new Vector(200, 100)], '#f00'),
    new Obstacle([new Vector(0, 100), new Vector(43.4314575051, 100), new Vector(143.4314575051, 200), new Vector(0, 200)], '#f00'),
    new Obstacle([new Vector(400, 200), new Vector(400, 300), new Vector(300, 300), new Vector(300, 240)], '#00f'),
    new Obstacle([new Vector(40, 300), new Vector(260, 300), new Vector(260, 240), new Vector(40, 240)], '#00f')*/
  ];
  for (var i =0 ; i < 50; i++)
	{
		var width = 50 + 200 * Math.random();
		var height = 50 + 200 * Math.random();
		var centerx = gameWidth * Math.random();
		var centery = gameHeight * Math.random();
		obstacles.push(new Obstacle([
			new Vector(centerx - width/2,centery - height/2), 
			new Vector(centerx + width/2,centery - height/2),
			new Vector(centerx + width/2,centery + height/2),
			new Vector(centerx - width/2,centery + height/2)
																], getRandomColor()));
	}
  var viableWeapons = [
    new Gun(100, 50, 30, true, 900, 1, 32, 1000, 30, 7, 900, 0, 0.12, 0.9, 2, 0.9, 0.8, '#800'),
    new Gun(200, 350, 45, true, 600, 1, 30, 1400, 40, 8, 1500, 0, 0.08, 0.91, 3, 0.9, 0.6, '#f80'),
    new Gun(200, 50, 60, false, 450, 1, 10, 1500, 50, 20, 2000, 0, 0.3, 0.83, 6, 0.9, 0.3, '#008'),
    new Gun(200, 220, 35, false, 450, 8, 2, 1200, 25, 9, 700, 0.3, 0, 0.83, 6, 0.9, 0.5, '#808')
  ];
   var weapons = [];
  for (var i = 0; i < viableWeapons.length; i++)
  {
     var weapon = viableWeapons[i];
     weapon.pos = findSpawnPosition();
     weapons.push(weapon);
  }
  gameState = new GameState(Date.now(), players, weapons);
}
function deepCopy(obj){
   var out = JSON.parse(JSON.stringify(obj));
   giveMethods(out);
}
function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
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
  setIfUndefined(this, 'justMouseDowned', false);
  setIfUndefined(this, 'justKeyDowned', {});
  this.intersect = function (obstacle) {
    if (this.radius + obstacle.maxRadius < this.pos.distanceTo(obstacle.center)) {
      return;
    }
    var pointOnOb = obstacle.closestPoint(this.pos);
    var distanceToPointOnOb = pointOnOb.distanceTo(this.pos);
    if (distanceToPointOnOb < this.radius) {
      if (distanceToPointOnOb == 0) {
        return;
      }
      this.pos = pointOnOb.add(this.pos.subtract(pointOnOb).multiply(this.radius / distanceToPointOnOb));
      var ang = this.pos.angTo(pointOnOb);
      var velMag = this.vel.rotate(-ang).y;
      this.vel = (new Vector(0, velMag)).rotate(ang);
    }
  }
  this.controls = function (k) {
    var targetVel = new Vector((controls[k].keys[68] ? 1 : 0) + (controls[k].keys[65] ? -1 : 0), (controls[k].keys[83] ? 1 : 0) + (controls[k].keys[87] ? -1 : 0));
    if (!targetVel.magnitude() == 0) {
      targetVel = targetVel.multiply(this.speed / targetVel.magnitude());
    }
    if (this.weapon != -1 && gameState.time - gameState.weapons[this.weapon].lastFireTime < 60000 / gameState.weapons[this.weapon].firerate) {
      targetVel = targetVel.multiply(gameState.weapons[this.weapon].shootWalkSpeedMult);
    }
    this.vel = this.vel.add(targetVel.subtract(this.vel).multiply(this.agility));
    this.ang = controls[k].ang;

    if (this.justKeyDowned[70]) {
      var minDist = this.reachDist;
      var idx = -1;
      for (var i = 0; i < gameState.weapons.length; i++) {
        if (gameState.weapons[i].hold) {
          continue;
        }
        var distance = this.pos.distanceTo(gameState.weapons[i].pos);
        if (distance < minDist) {
          idx = i;
          minDist = distance;
        }
      }
      if (idx != -1) {
        this.dropWeapon();
        this.pickUpWeapon(idx);
      }
      this.justKeyDowned[70] = false;
    }
    if (this.justKeyDowned[71]) {
      this.dropWeapon();
      this.justKeyDowned[71] = false;
    }
    if (this.justKeyDowned[82] && this.weapon != -1) {
      gameState.weapons[this.weapon].reload();
      this.justKeyDowned[82] = false;
    }
    if (this.justKeyDowned[88]) {
      gameState.weapons[this.weapon].cancelReload();
      this.justKeyDowned[88] = false;
    }

    if (controls[k].mouseDown && this.weapon != -1 && gameState.weapons[this.weapon].auto) {
      gameState.weapons[this.weapon].fireBullets();
    }
    else if (this.justMouseDowned) {
      if (this.weapon != -1 && !gameState.weapons[this.weapon].auto) {
        gameState.weapons[this.weapon].fireBullets();
      }
      this.justMouseDowned = false;
    }
    
  }
  this.pickUpWeapon = function (weapon) {
    this.weapon = weapon;
    gameState.weapons[this.weapon].pos = this.pos.add((new Vector(this.radius + gameState.weapons[this.weapon].length / 2 - gameState.weapons[this.weapon].recoil, 0)).rotate(this.ang));
    gameState.weapons[this.weapon].vel = this.vel;
    gameState.weapons[this.weapon].ang = this.ang;
    gameState.weapons[this.weapon].hold = true;
  }
  this.dropWeapon = function () {
    if (this.weapon != -1) {
      gameState.weapons[this.weapon].pos = this.pos;
      gameState.weapons[this.weapon].vel = new Vector(0, 0);
      gameState.weapons[this.weapon].hold = false;
      gameState.weapons[this.weapon].cancelReload();
      this.weapon = -1;
    }
  }
  this.step = function () {
    this.pos = this.pos.add(this.vel);
    if (this.weapon != -1) {
      gameState.weapons[this.weapon].pos = this.pos.add((new Vector(this.radius + gameState.weapons[this.weapon].length / 2 - gameState.weapons[this.weapon].recoil, 0)).rotate(this.ang));
      gameState.weapons[this.weapon].vel = this.vel;
      gameState.weapons[this.weapon].ang = this.ang;

      gameState.weapons[this.weapon].spray = gameState.weapons[this.weapon].stability * (gameState.weapons[this.weapon].spray - gameState.weapons[this.weapon].defSpray) + gameState.weapons[this.weapon].defSpray;
      gameState.weapons[this.weapon].recoil *= gameState.weapons[this.weapon].animationMult;
    }
  }
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
  this.reload = function () {
    if (this.bulletsRemaining < this.capacity && this.reloadStartTime == -1) {
      this.reloadStartTime = gameState.time;
    }
  }
  this.cancelReload = function () {
    this.reloadStartTime = -1;
  }
  this.fireBullets = function () {
    var timeNow = gameState.time;
    if (timeNow - this.lastFireTime >= 60000 / this.firerate && this.reloadStartTime == -1) {
      if (this.bulletsRemaining > 0) {
        for (var i = 0; i < this.multishot; i++) {
          this.bullets.push(new Bullet(this));
        }
        this.spray += this.sprayCoef;
        this.recoil += this.kickAnimation;
        this.lastFireTime = timeNow;
        this.bulletsRemaining -= 1;
      }
      else {
        this.reload();
      }
    }
  }
  this.bulletsStep = function () {
    if (this.reloadStartTime != -1 && gameState.time - this.reloadStartTime >= this.reloadTime) {
      this.bulletsRemaining = this.capacity;
      this.reloadStartTime = -1;
    }
    for (var i = this.bullets.length - 1; i >= 0; i--) {
      this.bullets[i].step();
      if (this.bullets[i].stopAnimationAge > this.bullets[i].fadeTime) {
        this.bullets.splice(i, 1);
      }
    }

  }
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
  this.step = function () {
    this.pos = this.pos.add(this.vel);
    if (this.tailPos.distanceTo(this.pos) > this.trailLength) {
      this.tailPos = this.pos.add((new Vector(-this.trailLength, 0)).rotate(this.ang));
    }

    if (this.hitPoint == -1) {
      var intersect = this.objectsIntersection(obstacles);
      this.hitPoint = intersect[0];
      if (intersect[1] != -1) {
        gameState.players[intersect[1]].health -= this.damage;
      }
      if (this.pos.distanceTo(this.startPos) > this.range) {
        this.hitPoint = this.pos.copy();
      }
    }
    else {
      this.stopAnimationAge += 1;
    }
  }
  this.insideObject = function () {
    for (var i = 0; i < obstacles.length; i++) {
      if (obstacles[i].insideOf(this.pos)) {
        return true;
      }
    }
    return false;
  }
  this.pathIntersect = function (v1, v2) {
    var v3 = this.pos;
    var v4 = this.pos.subtract(this.vel);

    var a1 = v2.y - v1.y;
    var b1 = v1.x - v2.x;
    var c1 = a1 * v1.x + b1 * v1.y;

    var a2 = v4.y - v3.y;
    var b2 = v3.x - v4.x;
    var c2 = a2 * v3.x + b2 * v3.y;

    var determinant = a1 * b2 - a2 * b1;

    if (determinant == 0) {
      return new Vector(Number.MAX_VALUE, Number.MAX_VALUE);
    }
    else {
      return new Vector((b2 * c1 - b1 * c2) / determinant, (a1 * c2 - a2 * c1) / determinant);
    }
  }

  this.segmentIntersect = function (v1, v2) {
    var v3 = this.pos;
    var v4 = this.pos.subtract(this.vel);
    var intersectionPoint = this.pathIntersect(v1, v2);
    if (intersectionPoint.onSegment(v1, v2) && intersectionPoint.onSegment(v3, v4)) {
      return intersectionPoint;
    }
    else {
      return -1;
    }
  }
  this.objectIntersection = function (object) {
    if (object.center.distanceTo(this.pos) > object.maxRadius + this.vel.magnitude()) {
      return -1;
    }
    var vertices = object.vs;
    vertices.push(vertices[0]);
    var smallestDistance = Number.MAX_VALUE;
    var objectPoint = -1;
    for (var i = 0; i < vertices.length - 1; i++) {
      var point = this.segmentIntersect(vertices[i], vertices[i + 1]);
      if (point != -1) {
        var dist = this.startPos.distanceTo(point);
        if (dist < smallestDistance) {
          smallestDistance = dist;
          objectPoint = point;
        }
      }
    }
    return objectPoint;
  }
  this.playerIntersection = function (player) {
    if (player.pos.distanceTo(this.pos) > player.radius + this.vel.magnitude()) {
      return -1;
    }
    var v3 = this.pos;
    var v4 = this.pos.subtract(this.vel);
    var closestPoint = player.pos.closestToLine(v3, v4);
    if (closestPoint.distanceTo(player.pos) <= player.radius && closestPoint.onSegment(v3, v4)) {
      return closestPoint;
    }
    else {
      return -1;
    }
  }
  this.objectsIntersection = function (objects) {
    var smallestDistance = Number.MAX_VALUE;
    var objectsPoint = -1;
    for (var i = 0; i < objects.length; i++) {
      var point = this.objectIntersection(objects[i]);
      if (point != -1) {
        var dist = this.startPos.distanceTo(point);
        if (dist < smallestDistance) {
          smallestDistance = dist;
          objectsPoint = point;
        }
      }
    }
    var playerHit = -1;
    for (var key in gameState.players) {
      var point = this.playerIntersection(gameState.players[key]);
      if (point != -1) {
        var dist = this.startPos.distanceTo(point);
        if (dist < smallestDistance) {
          smallestDistance = dist;
          objectsPoint = point;
          playerHit = key;
        }
      }
    }
    return [objectsPoint, playerHit];
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
  this.insideOf = function (point) {
    // ray-casting algorithm based on
    // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html/pnpoly.html
    if (this.radius < point.distanceTo(this.center)) {
      return false;
    }
    var x = point.x, y = point.y;

    var inside = false;
    for (var i = 0, j = this.vs.length - 1; i < this.vs.length; j = i++) {
      var xi = this.vs[i].x, yi = this.vs[i].y;
      var xj = this.vs[j].x, yj = this.vs[j].y;

      var intersect = ((yi > y) != (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }

    return inside;
  }
  this.closestPoint = function (point) {
    var out = new Vector(0, 0);
    var minimumDist = 1000000000;
    for (var i = 0; i < this.vs.length; i++) {
      var x1 = this.vs[i].x;
      var y1 = this.vs[i].y;
      if (i == this.vs.length - 1) {
        var x2 = this.vs[0].x;
        var y2 = this.vs[0].y;
      }
      else {
        var x2 = this.vs[i + 1].x;
        var y2 = this.vs[i + 1].y;
      }

      var e1x = x2 - x1;
      var e1y = y2 - y1;
      var area = e1x * e1x + e1y * e1y;
      var e2x = point.x - x1;
      var e2y = point.y - y1;
      var val = e1x * e2x + e1y * e2y;
      var on = (val > 0 && val < area);

      var lenE1 = Math.sqrt(e1x * e1x + e1y * e1y);
      var lenE2 = Math.sqrt(e2x * e2x + e2y * e2y);
      var cos = val / (lenE1 * lenE2);

      var projLen = cos * lenE2;
      var px = x1 + (projLen * e1x) / lenE1;
      var py = y1 + (projLen * e1y) / lenE1;
      var distance = Math.sqrt((px - point.x) * (px - point.x) + (py - point.y) * (py - point.y));
      if (Math.min(x1, x2) <= px && px <= Math.max(x1, x2) && Math.min(y1, y2) <= py && py <= Math.max(y1, y2)) {
        if (minimumDist > distance) {
          minimumDist = distance;
          out = new Vector(px, py);
        }
      }
    }
    for (var i = 0; i < this.vs.length; i++) {
      var distance = this.vs[i].distanceTo(point);
      if (minimumDist > distance) {
        minimumDist = distance;
        out = this.vs[i];
      }
    }
    return out;
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
makeObstacles();
setInterval(updateGameArea, 1000/60);
var stage = 0;
function updateGameArea() {
  if (Object.keys(gameState.players).length > 0)
  {
		gameState.step();
		stage += 1;
		if (stage >= 3)
		{
			emitGameState(gameState);
			stage = 0;
		}
  }
}
io.listen(process.env.PORT || 3000);
