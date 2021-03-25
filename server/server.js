const gameWidth = 3000;
const gameHeight = 3000;
const numOb = 50;
const numHouse1 = 3;
const numHouse2 = 3;
const gridWidth = 400;
const framesPerTick = 3;

const io = require('socket.io')();

io.on('connection', client => {
    client.emit('init', {
        data: Date.now(),
        id: client.id,
        obstacles: obstacles,
        borderObstacles: borderObstacles,
        gameWidth: gameWidth,
        gameHeight: gameHeight,
        gridWidth: gridWidth,
        framesPerTick: framesPerTick
    });
    client.on('new player', addPlayer);
    client.on('disconnect', function() {
        var player = gameState.players[client.id];
        if (player != undefined)
            player.dropEverything(gameState);
        delete gameState.players[client.id];
        delete controls[client.id];
    });
    client.on('reconnect', function() {
        client.sendBuffer = [];
    });
    client.on('keydown', (keycode) => {
        if (keycode != null)
        {
            if (controls[client.id] && gameState.players[client.id]) {
                controls[client.id].keys[keycode] = true;
                gameState.players[client.id].justKeyDowned[keycode] = true;
            }
        }
    });
    client.on('keyup', (keycode) => {
        if (keycode != null)
        {
            if (controls[client.id] && gameState.players[client.id])
                controls[client.id].keys[keycode] = false;
        }
    });
    client.on('mousemove', (ang) => {
        if (ang != null)
        {
            if (controls[client.id] && gameState.players[client.id])
                controls[client.id].ang = ang;
        }
    });
    client.on('mousedown', () => {
        if (controls[client.id] && gameState.players[client.id]) {
            controls[client.id].mouseDown = true;
            gameState.players[client.id].justMouseDowned = true;
            gameState.players[client.id].autoShot = true;
        }
    });
    client.on('mouseup', () => {
        if (controls[client.id] && gameState.players[client.id])
            controls[client.id].mouseDown = false;
            gameState.players[client.id].autoShot = false;
    });

    function addPlayer(msg) {
        controlId = client.id;
        var startPos = findSpawnPosition();
        if (gameState.players[controlId]) {
            gameState.players[controlId].pos = startPos;
            gameState.players[controlId].health = 100;
            gameState.players[controlId].alive = true;
        } else {
            gameState.players[controlId] = new Player(startPos.x, startPos.y, msg.name, controlId);
            controls[controlId] = {
                keys: [],
                mouseDown: false
            };
        }

    }


});
var findSpawnPosition = function(objects) {
    var startPos;
    do {
        startPos = new Vector(gameWidth * Math.random(), gameHeight * Math.random());
    }
    while (inObjects(startPos));
    return startPos;
}
var obstacleSector = function(point) {
    return [Math.floor(point.x / gridWidth), Math.floor(point.y / gridWidth)];
}
var loopThroughObstacles = function(objectPos, inner) {
    for (var i in borderObstacles) {
        inner(borderObstacles[i]);
    }
    var sector = obstacleSector(objectPos);
    for (var i = sector[0] - 1; i < sector[0] + 2; i++) {
        if (i < 0 || i >= obstacles.length) {
            continue;
        }
        for (var j = sector[1] - 1; j < sector[1] + 2; j++) {
            if (j < 0 || j >= obstacles[i].length) {
                continue;
            }
            var objectsToLoop = obstacles[i][j];
            for (var idx in objectsToLoop) {
                inner(objectsToLoop[idx]);
            }
        }
    }
}
var obstacles;
var borderObstacles;
var gameState;
var controls = {};

function emitNewKill(killer, dead) {
    io.sockets.emit('killFeed', {
        msg: gameState.players[killer].name + " killed " + gameState.players[dead].name
    });
}

function emitGameState(gameState) {
    // Send this event to everyone in the room.
    io.sockets.emit('gameState', JSON.stringify(gameState));
}
var setIfUndefined = function(obj, field, value) {
    if (obj[field] === undefined) {
        obj[field] = value;
    }
}
var GameState = function(time, players, weapons) {
    this.type = "GameState";
    setIfUndefined(this, 'time', time);
    setIfUndefined(this, 'players', players);
    setIfUndefined(this, 'weapons', weapons);
    this.step = function() {
        this.time = Date.now();
        for (var k in this.players) {
            var player = this.players[k];
            if (player.alive) {
                player.snapWeapon(this);
                this.mouseControls(k);

                this.controls(k);
                player.playerStep(this);
                for (var i = 0; i < 5; i++)
                {
                  loopThroughObstacles(player.pos, (obstacle) => {
                      if (obstacle.intersectable)
                      {
                        player.intersect(obstacle);
                      }
                  });
                }
            }
        }
        for (var k in this.weapons) {
            this.weapons[k].bulletsStep(this);
        }
        for (var k in this.players) {
            var player = this.players[k];
            if (player.health <= 0 && player.alive) {
                player.dropEverything(this);
                player.alive = false;
                emitNewKill(player.lastHitBy, k);
            }
        }
    }
    this.controls = function(k) {
        var targetVel = new Vector((controls[k].keys[68] ? 1 : 0) + (controls[k].keys[65] ? -1 : 0), (controls[k].keys[83] ? 1 : 0) + (controls[k].keys[87] ? -1 : 0));
        if (!targetVel.magnitude() == 0) {
            targetVel = targetVel.multiply(this.players[k].speed / targetVel.magnitude());
        }
        if (this.players[k].weapon != -1) {
            targetVel = targetVel.multiply(this.weapons[this.players[k].weapon].walkSpeedMult);
            if (this.time - this.weapons[this.players[k].weapon].lastFireTime < 60000 / this.weapons[this.players[k].weapon].firerate) {
                targetVel = targetVel.multiply(this.weapons[this.players[k].weapon].shootWalkSpeedMult);
            }
        }
        this.players[k].vel = this.players[k].vel.add(targetVel.subtract(this.players[k].vel).multiply(this.players[k].agility));
        this.players[k].ang = controls[k].ang;

        if (this.players[k].justKeyDowned[70]) {
            var minDist = this.players[k].reachDist;
            var idx = -1;
            for (var i = 0; i < this.weapons.length; i++) {
                if (this.weapons[i].hold) {
                    continue;
                }
                var distance = this.players[k].pos.distanceTo(this.weapons[i].pos);
                if (distance < minDist) {
                    idx = i;
                    minDist = distance;
                }
            }
            if (idx != -1) {
                this.players[k].pickUpWeapon(this,idx);
            }
            this.players[k].justKeyDowned[70] = false;
        }
        if (this.players[k].justKeyDowned[71]) {
            this.players[k].dropWeapon(this);
            this.players[k].justKeyDowned[71] = false;
        }
        if (this.players[k].justKeyDowned[82]) {
            if (this.players[k].weapon != -1){
              this.weapons[this.players[k].weapon].reload(this.time);
            }
            this.players[k].justKeyDowned[82] = false;
        }
        if (this.players[k].justKeyDowned[88]) {
            this.weapons[this.players[k].weapon].cancelReload();
            this.players[k].justKeyDowned[88] = false;
        }
        if (this.players[k].justKeyDowned[81]) {
            this.players[k].swapWeapon(this, 1 - this.players[k].slot);
            this.players[k].justKeyDowned[81] = false;
        }

    }
    this.mouseControls = function(k){
      var weapon = this.weapons[this.players[k].weapon];
        if (this.players[k].autoShot && this.players[k].weapon != -1 && weapon.auto) {
            weapon.fireBullets(this.time);
            this.players[k].justMouseDowned = false;
        } else if (this.players[k].justMouseDowned) {
            if (this.players[k].weapon != -1 && !weapon.auto) {
                weapon.fireBullets(this.time);
            } else if (this.players[k].weapon == -1) {
                this.players[k].punch(this);
            }
            this.players[k].justMouseDowned = false;
        }
        if (this.players[k].weapon != -1)
        {
          weapon.spray = weapon.stability * (weapon.spray - weapon.defSpray) + weapon.defSpray;
          weapon.recoil *= weapon.animationMult;
        }
    }

    this.toString = function() {
        return JSON.stringify(this);
    }
}
var inObjects = function(v) {
    var out = false;
    loopThroughObstacles(v, (obstacle) => {
        if (obstacle.insideOf(v)) {
            out = true;
            return;
        }
    });
    return out;
}
var makeObstacles = function() {
    var players = {};
    var wallThick = -40;

    borderObstacles = [
        new Obstacle([new Vector(0, 0), new Vector(0, gameHeight), new Vector(-wallThick, gameHeight), new Vector(-wallThick, 0)], '#000', true),
        new Obstacle([new Vector(gameWidth, 0), new Vector(gameWidth, gameHeight), new Vector(gameWidth + wallThick, gameHeight), new Vector(gameWidth + wallThick, 0)], '#000', true),
        new Obstacle([new Vector(0, 0), new Vector(gameWidth, 0), new Vector(gameWidth, -wallThick), new Vector(0, -wallThick)], '#000', true),
        new Obstacle([new Vector(0, gameHeight), new Vector(gameWidth, gameHeight), new Vector(gameWidth, gameHeight + wallThick), new Vector(0, gameHeight + wallThick)], '#000', true)
    ];
    obstacles = [];
    for (var i = 0; i < gameWidth / gridWidth; i++) {
        obstacles[i] = [];
        for (var j = 0; j < gameHeight / gridWidth; j++) {
            obstacles[i][j] = [];
        }
    }
    for (var blah = 0; blah < numHouse1; blah ++)
    {
      var insideOther = true;
      while (insideOther)
      {
        var center = findSpawnPosition();
        var house = new House1(center.x,center.y, 2*Math.PI*Math.random());
        for (var i in house.obstacles)
        {
          var ob = house.obstacles[i];
          insideOther = false;
          loopThroughObstacles(ob.center, (obstacle) => {
            if (ob.intersectOtherOb(obstacle))
            {
              insideOther = true;
            }
          });
          if (insideOther)
          {
            break;
          }
        }
      }
      for (var i in house.obstacles)
      {
        var ob = house.obstacles[i];
        var addTo = obstacles[Math.floor(ob.center.x / gridWidth)][Math.floor(ob.center.y / gridWidth)];
        addTo[addTo.length] = ob;
      }
    }
    for (var blah = 0; blah < numHouse2; blah ++)
    {
      var insideOther = true;
      while (insideOther)
      {
        var center = findSpawnPosition();
        var house = new House2(center.x,center.y, 2*Math.PI*Math.random());
        for (var i in house.obstacles)
        {
          var ob = house.obstacles[i];
          insideOther = false;
          loopThroughObstacles(ob.center, (obstacle) => {
            if (ob.intersectOtherOb(obstacle))
            {
              insideOther = true;
            }
          });
          if (insideOther)
          {
            break;
          }
        }
      }
      for (var i in house.obstacles)
      {
        var ob = house.obstacles[i];
        var addTo = obstacles[Math.floor(ob.center.x / gridWidth)][Math.floor(ob.center.y / gridWidth)];
        addTo[addTo.length] = ob;
      }
    }
    for (var blah = 0; blah < numOb; blah++) {
        var insideOther = true;
        var addTo;
        var ob;
        while (insideOther)
        {
          var center = findSpawnPosition();
          addTo = obstacles[Math.floor(center.x / gridWidth)][Math.floor(center.y / gridWidth)];

          var resolution = 32;
          var vertList = [];
          var distList = [];
          var size = Math.random();
          for (var i = 0; i < resolution; i++) {
              distList[i] = (0.5 + 0.5*size) * (40 + 70 * Math.random());

          }
          for (var i = 0; i < 12; i++) {
              var temp = [];
              for (var j = 0; j < resolution; j++) {
                  temp[j] = distList[j];
              }
              for (var j = 0; j < resolution; j++) {
                  distList[j] = (temp[j] + 2 * temp[(j + 1) % resolution] + temp[(j + 2) % resolution]) / 4;
              }
          }
          for (var i = 0; i < resolution; i++) {
              var ang = i * 2 * Math.PI / resolution;
              vertList[i] = center.add((new Vector(distList[i], 0)).rotate(ang));
          }
          ob = new Obstacle(vertList, '#B1B1B1', true);
          insideOther = false;
          loopThroughObstacles(ob.center, (obstacle) => {
            if (ob.intersectOtherOb(obstacle))
            {
              insideOther = true;
            }
          });

        }
        addTo[addTo.length] = ob;
    }
    var viableWeapons = [
        new Gun('M9',100, 50, 30, false, 780, 1, 15, 1000, 35, 17, 4, 500, 150, 1000, 0.1, 0.12, 0.9, 7, 0.9, 0.95, 1, '#80f', 20, 0, 20, 0),
        new Gun('Redhawk',100, 50, 35, false, 300, 1, 6, 1500, 48, 33, 8, 750, 200, 1500, 0, 0.2, 0.9, 10, 0.9, 0.95, 0.6, '#ff0', 20, 3, 20, 3),

        new Gun('MAC-10',100, 50, 30, true, 900, 1, 32, 1200, 35, 10, 5, 500, 150, 1000, 0, 0.12, 0.9, 3, 0.9, 0.95, 0.8, '#f00', 20, 3, 35, 6),
        new Gun('MP5',200, 350, 50, true, 750, 1, 30, 1500, 42, 9, 2, 550, 270, 1500, 0, 0.06, 0.91, 4, 0.9, 0.9, 0.6, '#f80', 20, 3, 40, 6),
        new Gun('MK11',200, 50, 60, false, 550, 1, 15, 1600, 60, 26, 3, 710, 200, 2000, 0, 0.3, 0.83, 8, 0.84, 0.85, 0.5, '#f08', 20, 3, 45, 6),

        new Gun('QBB-97',200, 350, 70, true, 600, 1, 75, 3000, 45, 13, 4, 550, 270, 1500, 0, 0.03, 0.96, 5, 0.9, 0.8, 0.5, '#fff', 20, 3, 45, 6),
        new Gun('Railgun',200, 350, 90, true, 1500, 1, 100, 2000, 100, 5, 0, 550, 270, 2000, 0, 0, 0.91, 2, 0.9, 0.85, 0.4, '#08f', 20, 3, 45, 6),

        new Gun('Scout',200, 50, 70, false, 70, 1, 5, 2000, 70, 70, 20, 830, 240, 3000, 0, 0.3, 0.83, 14, 0.9, 0.9, 0.6, '#8f0', 20, 3, 45, 6),
        new Gun('BFG',200, 50, 90, false, 40, 1, 1, 2000, 90, 101, 0, 830, 240, 5000, 0, 0.3, 0.83, 17, 0.9, 0.8, 0.5, '#000', 20, 3, 50, 6),

        new Gun('Stevens DB',200, 220, 35, false, 450, 8, 2, 1600, 30, 15, 9, 350, 56, 700, 0.15, 0, 0.83, 10, 0.9, 1, 0.7, '#f0f', 20, 3, 40, 6),
        new Gun('SPAS-12',200, 220, 50, false, 100, 8, 6, 1750, 40, 8, 1, 650, 100, 1300, 0.10, 0, 0.83, 10, 0.9, 1, 0.5, '#0ff', 20, 3, 40, 6)
    ];
    var numEach = [6, 1, 4, 3, 2, 1, 1, 1, 1, 1, 1];
    var weapons = [];
    for (var i = 0; i < viableWeapons.length; i++) {
        for (var j = 0; j < numEach[i]; j++) {
            var weapon = viableWeapons[i].copy();
            weapon.pos = findSpawnPosition();
            weapons.push(weapon);
        }
    }
    gameState = new GameState(Date.now(), players, weapons);
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function orientation(p, q, r) {
    // See https://www.geeksforgeeks.org/orientation-3-ordered-points/
    // for details of below formula.
    var val = (q.y - p.y) * (r.x - q.x) -
        (q.x - p.x) * (r.y - q.y);

    if (val == 0) return 0; // colinear

    return (val > 0) ? 1 : 2; // clock or counterclock wise
}
var Player = function(xStart, yStart, name, id) {
    this.type = "Player";
    setIfUndefined(this, 'speed', 5);
    setIfUndefined(this, 'agility', 1);
    setIfUndefined(this, 'radius', 20);
    setIfUndefined(this, 'reachDist', 50);

    setIfUndefined(this, 'weapon', -1);
    setIfUndefined(this, 'weapons', [-1,-1]);
    setIfUndefined(this, 'slot', 0);

    setIfUndefined(this, 'health', 100);

    setIfUndefined(this, 'pos', new Vector(xStart, yStart));
    setIfUndefined(this, 'vel', new Vector(0, 0));

    setIfUndefined(this, 'ang', 0);

    setIfUndefined(this, 'punchReach', 10);
    setIfUndefined(this, 'punchAnimation', 0);
    setIfUndefined(this, 'punchLastTime', 0);
    setIfUndefined(this, 'punchRate', 200);
    setIfUndefined(this, 'punchDamage', 24);

    setIfUndefined(this, 'justMouseDowned', false);
    setIfUndefined(this, 'justKeyDowned', {});
    setIfUndefined(this, 'autoShot', false);

    setIfUndefined(this, 'id', id);

    setIfUndefined(this, 'healInterval', 5000);
    setIfUndefined(this, 'lastHitTime', 0);

    setIfUndefined(this, 'name', name);
    setIfUndefined(this, 'alive', true);


    setIfUndefined(this, 'lastHitBy', -1);
    this.swapWeapon = function(state, newSlot)
    {
      if (this.slot != newSlot && this.weapon != -1)
      {
        state.weapons[this.weapon].cancelReload();
      }
      this.slot = newSlot;
      if (newSlot < this.weapons.length)
      {
        this.weapon = this.weapons[this.slot];
      }
      else
      {
        this.weapon = -1;
      }
      this.snapWeapon(state);

      this.autoShot = false;
    }
    this.pickUpWeapon = function(state, weaponIdx) {
        if (this.weapons[0] != -1 &&  this.weapons[1] != -1)
        {
          this.dropWeapon(state);
          this.weapons[this.slot] = weaponIdx;
          this.swapWeapon(state, this.slot);
        }
        else if (this.weapons[this.slot] != -1)
        {
          var insertIdx = 1 - this.slot;
          this.weapons[insertIdx] = weaponIdx;
          this.swapWeapon(state, insertIdx);
        }
        else
        {
          this.weapons[this.slot] = weaponIdx;
          this.swapWeapon(state,this.slot);
        }
        this.weapon = weaponIdx;
        var weapon = state.weapons[this.weapon];
        weapon.pos = this.pos.add((new Vector(this.radius + weapon.length / 2 - weapon.recoil, 0)).rotate(this.ang));
        weapon.vel = this.vel;
        weapon.ang = this.ang;
        weapon.hold = true;
        weapon.playerHolding = this.id;

    }
    this.dropWeapon = function(state) {
        var weapon = state.weapons[this.weapon];
        if (this.weapon != -1) {
            this.weapons[this.slot] = -1;
            this.weapon = -1;

            weapon.pos = this.pos;
            weapon.vel = new Vector(0, 0);
            weapon.hold = false;
            weapon.cancelReload();
            weapon.playerHolding = -1;
        }
        this.autoShot = false;
    }
    this.dropEverything = function(state)
    {
       this.dropWeapon(state);
       this.swapWeapon(state, 1 - this.slot);
       this.dropWeapon(state);
    }
    this.snapWeapon = function(state)
    {
        if (this.weapon != -1) {
            var weapon = state.weapons[this.weapon];
            weapon.pos = this.pos.add((new Vector(this.radius + weapon.length / 2 - weapon.recoil, 0)).rotate(this.ang));
            weapon.vel = this.vel;
            weapon.ang = this.ang;

        }
    }
    this.playerStep = function(state) {
        this.pos = this.pos.add(this.vel);
        this.punchAnimation *= 0.9;

        if (state.time - this.lastHitTime > this.healInterval) {
            this.health = Math.min(100, this.health + 0.1);
        }
    }
    this.intersect = function(obstacle) {
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
    this.intersectSegment = function(v1,v2)
    {
      if (!this.alive) {
        return -1;
      }
      var closestPoint = this.pos.closestToLine(v1,v2);
      var distance = closestPoint.distanceTo(this.pos);
      if (distance > this.radius)
      {
        return -1;
      }
      var x = Math.sqrt(this.radius * this.radius - distance * distance);
      var point1 = closestPoint.add(closestPoint.subtract(this.pos).normalize().rotate(Math.PI/2).multiply(x));
      var point2 = closestPoint.add(closestPoint.subtract(this.pos).normalize().rotate(Math.PI/2).multiply(-x));
      var point1On = point1.onSegment(v1,v2);
      var point2On = point2.onSegment(v1,v2);
      
      var point1Dist = v1.distanceTo(point1);
      var point2Dist = v1.distanceTo(point2);
      
      if (point1On)
      {
        if (point2On)
        {
           return (point1Dist < point2Dist ? point1 : point2);
        }
        else
        {
           return point1;
        }
      }
      else
      {
        if (point2On)
        {
           return point2;
        }
        else
        {
           return -1;
        }
      }
    }
    this.punch = function(gameState) {
        if (gameState.time - this.punchLastTime < 60000 / this.punchRate) {
            return;
        }
        this.punchAnimation = 30;
        this.punchLastTime = gameState.time;
        for (var i in gameState.players) {
            var player = gameState.players[i];
            if (this == player || !player.alive) {
                continue;
            }
            if (player.pos.distanceTo(this.pos.add((new Vector(this.radius + this.punchReach, 0)).rotate(this.ang))) < this.punchReach + player.radius) {
                player.takeDamage(this.punchDamage, this.id, gameState);
            }
        }
    }
    this.takeDamage = function(damage, playerId, state) {
        this.health -= damage;
        this.lastHitBy = playerId;
        this.lastHitTime = state.time;
    }
}
var Gun = function(name, startX, startY, length, auto, firerate, multishot, capacity, reloadTime, bulletSpeed, damage, damageDrop, damageRange, damageDropTension, range, defSpray, sprayCoef, stability, kickAnimation, animationMult, walkSpeedMult, shootWalkSpeedMult, color, handPos1x, handPos1y, handPos2x, handPos2y) {
    this.type = "Gun";
    setIfUndefined(this, 'name', name);
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
    setIfUndefined(this, 'damageDrop', damageDrop);
    setIfUndefined(this, 'damageRange', damageRange);
    setIfUndefined(this, 'damageDropTension', damageDropTension);

    setIfUndefined(this, 'range', range);
    setIfUndefined(this, 'stability', stability);
    setIfUndefined(this, 'kickAnimation', kickAnimation);
    setIfUndefined(this, 'animationMult', animationMult);

    setIfUndefined(this, 'walkSpeedMult', walkSpeedMult);
    setIfUndefined(this, 'shootWalkSpeedMult', shootWalkSpeedMult);

    setIfUndefined(this, 'color', color);
    setIfUndefined(this, 'handPos1', new Vector(handPos1x, handPos1y));
    setIfUndefined(this, 'handPos2', new Vector(handPos2x, handPos2y));

    setIfUndefined(this, 'bulletsRemaining', 0);
    setIfUndefined(this, 'reloadStartTime', -1);

    setIfUndefined(this, 'spray', 0);
    setIfUndefined(this, 'recoil', 0);
    setIfUndefined(this, 'lastFireTime', 0);

    setIfUndefined(this, 'hold', false);

    setIfUndefined(this, 'bullets', {});
    setIfUndefined(this, 'bulletsArrLength', 0);


    setIfUndefined(this, 'playerHolding', -1);
    this.copy = function() {
        return new Gun(this.name, this.pos.x, this.pos.y, this.length, this.auto, this.firerate, this.multishot, this.capacity, this.reloadTime, this.bulletSpeed, this.damage, this.damageDrop, this.damageRange, this.damageDropTension, this.range, this.defSpray, this.sprayCoef, this.stability, this.kickAnimation, this.animationMult, this.walkSpeedMult, this.shootWalkSpeedMult, this.color, this.handPos1.x, this.handPos1.y, this.handPos2.x, this.handPos2.y);
    }
    this.reload = function(timeNow) {
        if (this.bulletsRemaining < this.capacity && this.reloadStartTime == -1 && timeNow - this.lastFireTime >= 60000 / this.firerate) {
            this.reloadStartTime = timeNow;
        }
    }
    this.cancelReload = function() {
        this.reloadStartTime = -1;
    }
    this.fireBullets = function(timeNow) {
        if (timeNow - this.lastFireTime >= 60000 / this.firerate && this.reloadStartTime == -1) {
            if (this.bulletsRemaining > 0) {
                for (var i = 0; i < this.multishot; i++) {
                    if (!this.stickingThroughWall()) {
                        this.bullets[this.bulletsArrLength] = new Bullet(this);
                    }
                    this.bulletsArrLength += 1;
                }
                this.spray += this.sprayCoef;
                this.recoil += this.kickAnimation;
                this.lastFireTime = timeNow;
                this.bulletsRemaining -= 1;
            } else {
                this.reload(timeNow);
            }
        }
    }
    this.bulletsStep = function(state) {
        if (this.reloadStartTime != -1 && state.time - this.reloadStartTime >= this.reloadTime) {
            this.bulletsRemaining = this.capacity;
            this.reloadStartTime = -1;
        }
        for (var i in this.bullets) {
            this.bullets[i].step(state);
            if (this.bullets[i].stopAnimationAge > this.bullets[i].fadeTime) {
                delete this.bullets[i];
            }
        }


    }
    this.intersectOb = function(ob) {
        var v1 = this.pos.add((new Vector(this.length / 2, 0)).rotate(this.ang));
        var v2 = this.pos.add((new Vector(-this.length / 2, 0)).rotate(this.ang));

        if (ob.intersectSegment(v1,v2) == -1)
        {
          return false;
        }
        else
        {
          return true;
        }
    }
    this.stickingThroughWall = function() {
        var out = false;
        loopThroughObstacles(this.pos, (obstacle) => {
            if (obstacle.intersectable && this.intersectOb(obstacle)) {
                out = true;
                return;
            }
        });
        return out;
    }
}
var Bullet = function(weapon) {
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
    setIfUndefined(this, 'damageDrop', weapon.damageDrop);
    setIfUndefined(this, 'damageRange', weapon.damageRange);
    setIfUndefined(this, 'damageDropTension', weapon.damageDropTension);


    setIfUndefined(this, 'range', weapon.range);
    setIfUndefined(this, 'hitPoint', -1);
    setIfUndefined(this, 'fadeTime', 10);
    setIfUndefined(this, 'trailLength', this.bulletSpeed * this.fadeTime);
    setIfUndefined(this, 'stopAnimationAge', 0);
    setIfUndefined(this, 'color', weapon.color);


    setIfUndefined(this, 'bulletFiredBy', weapon.playerHolding);
    this.step = function(state) {
        this.pos = this.pos.add(this.vel);
        if (this.tailPos.distanceTo(this.pos) > this.trailLength) {
            this.tailPos = this.pos.add((new Vector(-this.trailLength, 0)).rotate(this.ang));
        }

        if (this.hitPoint == -1) {
            var intersect = this.objectsIntersection(state);
            this.hitPoint = intersect[0];
            if (intersect[1] != -1) {

                state.players[intersect[1]].takeDamage(this.calculateDamage(), this.bulletFiredBy, state);
            }
            if (this.hitPoint == -1 && this.pos.distanceTo(this.startPos) > this.range) {
                this.hitPoint = this.pos.copy();
            }
        } else {
            this.stopAnimationAge += 1;
        }
    }
    this.calculateDamage = function() {
        if (this.hitPoint != -1) {
            var distance = this.hitPoint.distanceTo(this.startPos);
            return this.damage - this.damageDrop / (1 + Math.exp(-(distance - this.damageRange) / this.damageDropTension));
        }
    }
    this.objectsIntersection = function(state) {
        var smallestDistance = Number.MAX_VALUE;
        var objectsPoint = -1;
        loopThroughObstacles(this.pos, (obstacle) => {
            if (!obstacle.intersectable)
            {
              return;
            }
            var point = obstacle.intersectSegment(this.pos.subtract(this.vel.multiply(2)),this.pos);
            if (point != -1) {
                var dist = this.startPos.distanceTo(point);
                if (dist < smallestDistance) {
                    smallestDistance = dist;
                    objectsPoint = point;
                }
            }
        });
        var playerHit = -1;
        for (var key in state.players) {
            var v1 = this.pos.distanceTo(this.startPos) > 2 * this.vel.magnitude() ? this.pos.subtract(this.vel.multiply(2)) : this.startPos;
            var point = state.players[key].intersectSegment(v1, this.pos);
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
var House1 = function(x,y,ang)
{
  this.center = new Vector(x,y);
  this.ang = ang;
  this.wallThickness = 6;
  this.obstacles = [
    new Obstacle([new Vector(-52,-100),new Vector(52,-100),new Vector(52,100),new Vector(-52,100)],'#008',false),
    new Obstacle([new Vector(-40,-100),new Vector(-52,-100),new Vector(-52,100),new Vector(-40,100)],'#008',true),
    new Obstacle([new Vector(40,-100),new Vector(52,-100),new Vector(52,100),new Vector(40,100)],'#008',true)
  ];
  for (var i in this.obstacles)
  {
    var ob = this.obstacles[i];
    ob.rotate(this.ang);
    ob.move(this.center);
  }
}
var House2 = function(x,y,ang)
{
  this.center = new Vector(x,y);
  this.ang = ang;
  this.wallThickness = 6;
  this.obstacles = [
    new Obstacle([new Vector(-52,-100),new Vector(52,-100),new Vector(52,100),new Vector(-52,100)],'#800',false),
    new Obstacle([new Vector(-40,-100),new Vector(-52,-100),new Vector(-52,100),new Vector(52,100),new Vector(52,-100), new Vector(40, -100),new Vector(40,88),new Vector(-40,88)],'#800',true)
  ];
  for (var i in this.obstacles)
  {
    var ob = this.obstacles[i];
    ob.rotate(this.ang);
    ob.move(this.center);
  }
}
var Obstacle = function(vs, color, intersectable) {
    this.type = "Obstacle";
    setIfUndefined(this, 'color', color);

    setIfUndefined(this, 'vs', vs);
    setIfUndefined(this, 'intersectable', intersectable);
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
    this.move = function(displace)
    {
      for (var i in this.vs)
      {
        this.vs[i] = this.vs[i].add(displace);
      }
      this.center = this.center.add(displace);
    }
    this.rotate = function(ang)
    {
      for (var i in this.vs)
      {
        this.vs[i] = this.vs[i].rotate(ang);
      }
      this.center = this.center.rotate(ang);
    }
    this.insideOf = function(point) {
        // ray-casting algorithm based on
        // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html/pnpoly.html
        if (this.radius < point.distanceTo(this.center)) {
            return false;
        }
        var x = point.x,
            y = point.y;

        var inside = false;
        for (var i = 0, j = this.vs.length - 1; i < this.vs.length; j = i++) {
            var xi = this.vs[i].x,
                yi = this.vs[i].y;
            var xj = this.vs[j].x,
                yj = this.vs[j].y;

            var intersect = ((yi > y) != (yj > y)) &&
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }

        return inside;
    }
    this.closestPoint = function(point) {
        var out = new Vector(0, 0);
        var minimumDist = Number.MAX_VALUE;
        for (var i = 0; i < this.vs.length; i++) {
            var v1 = this.vs[i];
            var v2 = this.vs[(i + 1) % this.vs.length];
            var pt = point.closestToLine(v1,v2);
            if (pt.onSegment(v1,v2))
            {
              var dist = pt.distanceTo(point);
              if (dist < minimumDist)
              {
                out = pt;
                minimumDist = dist;
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
    this.intersectSegment = function(v1,v2)
    {
        if (this.center.distanceTo(v1) > v1.distanceTo(v2) + this.maxRadius)
        {
          return -1;
        }
        var minDist = Number.MAX_VALUE;
        var pointOfInter = -1;
        for (var i = 0; i < this.vs.length; i++)
        {
            var v3 = this.vs[i];
            var v4 = this.vs[(i + 1) % this.vs.length];
            
            var a1 = v2.y - v1.y;
            var b1 = v1.x - v2.x;
            var c1 = a1 * v1.x + b1 * v1.y;

            var a2 = v4.y - v3.y;
            var b2 = v3.x - v4.x;
            var c2 = a2 * v3.x + b2 * v3.y;

            var determinant = a1 * b2 - a2 * b1;
            
            var lineInter;
            if (determinant == 0) {
                continue;
            } else {
                 lineInter = new Vector((b2 * c1 - b1 * c2) / determinant, (a1 * c2 - a2 * c1) / determinant);
            }
            if (lineInter.onSegment(v1,v2) && lineInter.onSegment(v3,v4))
            {
                var distanceToV1 = lineInter.distanceTo(v1);
                if (distanceToV1 < minDist)
                {
                  pointOfInter = lineInter;
                  minDist = distanceToV1;
                }
            }
        }
        return pointOfInter;
    }
    this.intersectOtherOb = function(ob)
    {
      if (this.center.distanceTo(ob.center) > this.maxRadius + ob.maxRadius)
      {
        return false;
      }
      for (var idx = 0; idx < ob.vs.length; idx ++)
      {
        if (this.intersectSegment(ob.vs[idx], ob.vs[(idx + 1) % ob.vs.length]) != -1)
        {
          return true;
        }
      }
      return false;
    }
}
var Vector = function(x, y) {
    this.type = "Vector";
    setIfUndefined(this, 'x', x);
    setIfUndefined(this, 'y', y);
    this.rotate = function(theta) {
        return new Vector(x * Math.cos(theta) - y * Math.sin(theta), y * Math.cos(theta) + x * Math.sin(theta));
    }
    this.magnitude = function() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    this.normalize = function()
    {
        return this.multiply(1/this.magnitude());
    }
    this.multiply = function(n) {
        return new Vector(this.x * n, this.y * n);
    }
    this.ang = function() {
        if (x > 0) {
            return Math.atan(this.y / this.x);
        } else if (x < 0) {
            return Math.PI + Math.atan(this.y / this.x);
        } else {
            if (y >= 0) {
                return Math.PI / 2;
            } else {
                return 3 * Math.PI / 2;
            }
        }
    }
    this.add = function(v) {
        return new Vector(this.x + v.x, this.y + v.y);
    }
    this.subtract = function(v) {
        return new Vector(this.x - v.x, this.y - v.y);
    }
    this.distanceTo = function(v) {
        return (this.subtract(v)).magnitude();
    }
    this.angTo = function(v) {
        return (this.subtract(v)).ang();
    }
    this.onSegment = function(v1, v2) {
        var buffer = 0.0001
        return Math.min(v1.x, v2.x) - buffer <= this.x && this.x <= Math.max(v1.x, v2.x) + buffer && Math.min(v1.y, v2.y) - buffer <= this.y && this.y <= Math.max(v1.y, v2.y) + buffer;
    }
    this.closestToLine = function(v1, v2) {
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
    this.copy = function() {
        return new Vector(this.x, this.y);
    }

}
makeObstacles();
var stage = 0;
setInterval(updateGameArea, 1000 / 60);

function updateGameArea() {
    if (Object.keys(gameState.players).length > 0) {
        gameState.step();
        stage += 1;
        if (stage >= framesPerTick) {
            emitGameState(gameState);
            stage = 0;
        }
    }
}
io.listen(process.env.PORT || 3000);
