const gameWidth = 4000;
const gameHeight = 4000;
const numOb = 30;
const numHouse1 = 10;
const numHouse2 = 10;
const gridWidth = 250;
const framesPerTick = 4;

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
        if (player != undefined){
            player.dropEverything(gameState);
            emitNewMessage(player.name + " left the game");
        }
        delete gameState.players[client.id];
        delete controls[client.id];
    });
    client.on('reconnect', function() {
        client.sendBuffer = [];
    });
    client.on('keydown', (keycode) => {
        if (typeof keycode !== 'undefined') {
            if (controls[client.id] && gameState.players[client.id]) {
                controls[client.id].keys[keycode] = true;
                gameState.players[client.id].justKeyDowned[keycode] = true;
            }
        }
    });
    client.on('keyup', (keycode) => {
        if (typeof keycode !== 'undefined') {

            if (controls[client.id] && gameState.players[client.id])
                controls[client.id].keys[keycode] = false;
        }
    });
    client.on('mousemove', (ang) => {
        if (typeof ang !== 'undefined' && controls[client.id] && gameState.players[client.id])
            controls[client.id].ang = ang;
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
        {
            controls[client.id].mouseDown = false;
            gameState.players[client.id].autoShot = false;
        }
    });

    function addPlayer(msg) {
        controlId = client.id;
        var player = gameState.players[controlId];
        var startPos = findSpawnPosition();
        var color = (/^#([A-Fa-f0-9]{3}){1,2}$/.test(msg.color) ? msg.color : "#fcc976");
        var name = msg.name.substring(0,18);
        if (player) {
            player.pos = startPos;
            player.health = 100;
            player.alive = true;
            player.color = color;
            player.name = name;
            player.killstreak = 0;
            player.points = 0;

        } else {
            gameState.players[controlId] = new Player(startPos.x, startPos.y, name, color, controlId);
            controls[controlId] = {
                keys: [],
                mouseDown: false
            };
            emitNewMessage(gameState.players[controlId].name + " joined the game");
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
    var sector = obstacleSector(objectPos);
    if (sector[0] < 2)
    {
        inner(borderObstacles[0]);
    }
    else if (sector[0] > obstacles.length - 3)
    {
        inner(borderObstacles[1]);
    }
    if (sector[1] < 2)
    {
        inner(borderObstacles[2]);
    }
    else if (sector[1] > obstacles[0].length - 3)
    {
        inner(borderObstacles[3]);
    }

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
var iterations;

function emitNewMessage(message) {
    io.sockets.emit('killFeed', {
        msg: message
    });
}

function emitGameState(gameState) {
    // Send this event to everyone in the room.
    var copy = JSON.parse(JSON.stringify(gameState));
    io.sockets.emit('gameState', trimObject(copy));
}
var setIfUndefined = function(obj, field, value) {
    if (obj[field] === undefined) {
        obj[field] = value;
    }
}
var trimObject = function(obj)
{
    var out;
    if (obj == null)
    {
        return;
    }
    if (typeof obj == 'object')
    {

        if (obj.outfields)
        {
            out = {};
            for (var i in obj.outfields) {
                var field = obj.outfields[i];
                out[field] = trimObject(obj[field]);
            }
        }
        else
        {
            out = Array.isArray(obj) ? [] : {};
            for (var field in obj) {
                out[field] = trimObject(obj[field]);
            }
        }
    }
    else
    {
        out = obj;
    }
    return out;

}
var GameState = function(time, players, weapons) {
    this.type = "GameState";
    this.outfields = ['type','time','players','weapons'];
    setIfUndefined(this, 'time', time);//
    setIfUndefined(this, 'players', players);//
    setIfUndefined(this, 'weapons', weapons);//
    setIfUndefined(this, 'weaponsSectors', []);//
    this.step = function() {
        iterations = 0;
        this.updateWeaponsSectors();
        for (var i in this.weapons)
        {
          this.weapons[i].setLastFireTime(this);
          if (weaponPushFrameCount == 0)
          {
            this.weapons[i].pushFromAll(this);
          }
        }
        for (var i in this.weapons)
        {
          this.weapons[i].step();
        }
        for (var k in this.players) {
            var player = this.players[k];
            if (player.alive) {
                player.snapWeapon(this);
                this.mouseControls(k);

                this.controls(k);
                player.playerStep(this);
                for (var i = 0; i < 2; i++)
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
                if (this.players[player.lastHitBy])
                {
                    this.players[player.lastHitBy].killstreak += 1;
                    emitNewMessage(this.players[player.lastHitBy].name + ' killed ' + player.name);
                }
                else
                {
                    emitNewMessage('Unknown' + ' killed ' + player.name);
                }
            }
        }
    }
    this.updateWeaponsSectors = function()
    {
      this.weaponsSectors = [];
      for (var i = 0; i < gameWidth / gridWidth; i++) {
          this.weaponsSectors[i] = [];
          for (var j = 0; j < gameHeight / gridWidth; j++) {
              this.weaponsSectors[i][j] = [];
          }
      }
      for (var i in this.weapons)
      {
        var sector = obstacleSector(this.weapons[i].pos);
        this.weaponsSectors[sector[0]][sector[1]].push(i);
      }
    }
    this.loopThroughWeapons = function(pos, inner) {
        var sector = obstacleSector(pos);
        for (var i = sector[0] - 1; i < sector[0] + 2; i++) {
            if (i < 0 || i >= this.weaponsSectors.length) {
                continue;
            }
            for (var j = sector[1] - 1; j < sector[1] + 2; j++) {
                if (j < 0 || j >= this.weaponsSectors[i].length) {
                    continue;
                }
                var arrWeaponIdx = this.weaponsSectors[i][j];
                for (var idx in arrWeaponIdx) {
                    inner(arrWeaponIdx[idx]);
                }
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
            if (this.weapons[this.players[k].weapon].lastFireTime != 0) {
                targetVel = targetVel.multiply(this.weapons[this.players[k].weapon].shootWalkSpeedMult);
            }
        }
        this.players[k].vel = this.players[k].vel.add(targetVel.subtract(this.players[k].vel).multiply(this.players[k].agility));
        this.players[k].ang = controls[k].ang || 0;

        if (this.players[k].justKeyDowned[70]) {
            var minDist = this.players[k].reachDist;
            var idx = -1;
            this.loopThroughWeapons( this.players[k].pos, (weaponIdx) => {
                if (this.weapons[weaponIdx].hold) {
                    return;
                }
                var distance = this.players[k].pos.distanceTo(this.weapons[weaponIdx].pos);
                if (distance < minDist) {
                    idx = weaponIdx;
                    minDist = distance;
                }
            });
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
        var house = new House1(center.x,center.y, Math.PI/2*Math.floor(4*Math.random()));
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
        var house = new House2(center.x,center.y, Math.PI/2*Math.floor(4*Math.random()));
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

          var resolution = 6;
          var vertList = [];
          var distList = [];
          var size = Math.random();
          for (var i = 0; i < resolution; i++) {
              distList[i] = (0.5 + 0.5*size) * (60);

          }
          for (var i = 0; i < 6; i++) {
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
        new Gun('M9',100, 50, 30, false, 780, 1, 15, 1000, true, 40, 17, 4, 500, 150, 1000, 0.1, 0.12, 0.9, 7, 0.9, 0.95, 1, '#80f', 30, 30, 0, 30, 0),
        new Gun('Redhawk',100, 50, 35, false, 300, 1, 6, 1300, true, 50, 33, 8, 750, 200, 1500, 0, 0.2, 0.9, 10, 0.9, 0.95, 0.6, '#ff0', 30, 30, 3, 30, 3),

        new Gun('MAC-10',100, 50, 30, true, 900, 1, 32, 1200, true, 45, 12, 6, 500, 150, 1000, 0, 0.10, 0.9, 3, 0.9, 0.97, 0.8, '#f00', 20,20, 3, 37, 6),
        new Gun('MP5',200, 350, 50, true, 720, 1, 30, 1300, true, 45, 11, 3, 550, 270, 1250, 0, 0.06, 0.91, 4, 0.9, 0.95, 0.65, '#f80', 20,20, 3, 40, 6),
        new Gun('AK-47',200, 350, 60, true, 600, 1, 30, 1600, true, 55, 13, 2, 600, 400, 1500, 0, 0.13, 0.85, 6, 0.9, 0.93, 0.5, '#DEB887', 20, 20, 3, 45, 6),
        new Gun('MK11',200, 50, 65, false, 550, 1, 15, 1800, true, 70, 26, 7, 710, 200, 2000, 0, 0.3, 0.83, 8, 0.84, 0.92, 0.5, '#f08', 20,20, 3, 45, 6),

        new Gun('QBB-97',200, 350, 70, true, 550, 1, 75, 3000, true, 55, 15, 5, 550, 270, 1500, 0, 0.04, 0.96, 5, 0.9, 0.85, 0.5, '#fff', 20,20, 3,45, 6),
        new Gun('Railgun',200, 350, 90, true, 1500, 1, 100, 2000, true, 100, 7, 0, 550, 270, 2000, 0, 0, 0.91, 2, 0.9, 0.85, 0.4, '#08f', 20,20, 3, 45, 6),

        new Gun('Mosin Nagant',200, 50, 70, false, 60, 1, 5, 1000, false, 70, 70, 20, 830, 240, 3000, 0, 0.3, 0.83, 14, 0.9, 0.9, 0.6, '#8f0', 20,20, 3, 45, 6),
        new Gun('Crossbow',200, 50, 40, false, 45, 1, 1, 1500, false, 25, 100, 0, 830, 240, 1500, 0, 0.3, 0.83, 17, 0.9, 0.9, 0.8, '#000', 20,20, 3, 45, 6),

        new Gun('Stevens DB',200, 220, 35, false, 450, 8, 2, 1600, true, 35, 15, 9, 350, 56, 700, 0.15, 0, 0.83, 10, 0.9, 1, 0.7, '#f0f', 20,20, 3, 45, 6),
        new Gun('SPAS-12',200, 220, 50, false, 100, 8, 9, 800, false, 40, 8, 1, 650, 100, 1100, 0.1, 0, 0.83, 10, 0.9, 1, 0.5, '#0ff', 20,20, 3, 45, 6)
    ];
    var numEach = [3, 1, 2, 2, 1,1, 1, 1, 1, 1, 1, 1];
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
var Player = function(xStart, yStart, name, color, id) {
    this.type = "Player";
    this.outfields = ['type','radius','reachDist','weapon','weapons','slot','health','pos','ang','punchAnimation','name','killstreak','points','color','alive'];
    setIfUndefined(this, 'speed', 5);
    setIfUndefined(this, 'agility', 1);
    setIfUndefined(this, 'radius', 20);//
    setIfUndefined(this, 'reachDist', 50);//

    setIfUndefined(this, 'weapon', -1);//
    setIfUndefined(this, 'weapons', [-1,-1]);//
    setIfUndefined(this, 'slot', 0);//

    setIfUndefined(this, 'health', 100);//

    setIfUndefined(this, 'pos', new Vector(xStart, yStart));//
    setIfUndefined(this, 'vel', new Vector(0, 0));//

    setIfUndefined(this, 'ang', 0);//

    setIfUndefined(this, 'punchReach', 10);
    setIfUndefined(this, 'punchAnimation', 0);//
    setIfUndefined(this, 'punchLastTime', 0);
    setIfUndefined(this, 'punchRate', 200);
    setIfUndefined(this, 'punchDamage', 24);

    setIfUndefined(this, 'justMouseDowned', false);
    setIfUndefined(this, 'justKeyDowned', {});
    setIfUndefined(this, 'autoShot', false);

    setIfUndefined(this, 'id', id);

    setIfUndefined(this, 'healInterval', 5000);
    setIfUndefined(this, 'lastHitTime', 0);

    setIfUndefined(this, 'name', name);//
    setIfUndefined(this, 'killstreak', 0);//
    setIfUndefined(this, 'points', 0);//
    setIfUndefined(this, 'color', color);//
    setIfUndefined(this, 'alive', true);//


    setIfUndefined(this, 'lastHitBy', -1);
    this.swapWeapon = function(state, newSlot)
    {
      if (this.slot != newSlot && this.weapon != -1)
      {
        var prevWeapon = state.weapons[this.weapon];
        prevWeapon.cancelReload();
        if (prevWeapon.lastFireTime != 0)
        {
          prevWeapon.lastFireTime = -1;
        }
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
      if (this.weapon != -1)
      {
        var currWeapon = state.weapons[this.weapon];
        if (currWeapon.lastFireTime != 0)
        {
          currWeapon.lastFireTime = state.time;
        }
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
            weapon.vel = (new Vector(-2, 0)).rotate(this.ang);

            weapon.ang = -Math.PI/6;

            weapon.hold = false;
            weapon.cancelReload();
            weapon.playerHolding = -1;
            if (weapon.lastFireTime != 0)
            {
              weapon.lastFireTime = -1;
            }
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
            weapon.pos = this.pos.add((new Vector(weapon.buttPosition + weapon.length / 2 - weapon.recoil, 0)).rotate(this.ang));
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
        if (state.players[playerId])
        {
            state.players[playerId].points += damage;
            this.health -= damage;
            this.lastHitBy = playerId;
            this.lastHitTime = state.time;
        }
    }
}
var Gun = function(name, startX, startY, length, auto, firerate, multishot, capacity, reloadTime, reloadType, bulletSpeed, damage, damageDrop, damageRange, damageDropTension, range, defSpray, sprayCoef, stability, kickAnimation, animationMult, walkSpeedMult, shootWalkSpeedMult, color, buttPosition, handPos1x, handPos1y, handPos2x, handPos2y) {
    this.type = "Gun";
    this.outfields = ['type','name','pos','vel','ang','length','capacity','reloadTime','color','buttPosition','handPos1','handPos2','bulletsRemaining','reloadStartTime','recoil','hold','radius','bullets'];
    setIfUndefined(this, 'name', name);//
    setIfUndefined(this, 'pos', new Vector(startX, startY));//
    setIfUndefined(this, 'vel', new Vector(0, 0));//
    setIfUndefined(this, 'ang', -Math.PI/6);//
    setIfUndefined(this, 'length', length);//
    setIfUndefined(this, 'auto', auto);
    setIfUndefined(this, 'multishot', multishot);
    setIfUndefined(this, 'capacity', capacity);//
    setIfUndefined(this, 'reloadTime', reloadTime);//
    setIfUndefined(this, 'reloadType', reloadType);//
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

    setIfUndefined(this, 'color', color);//
    setIfUndefined(this, 'buttPosition', buttPosition);//
    
    setIfUndefined(this, 'handPos1', new Vector(handPos1x, handPos1y));//
    setIfUndefined(this, 'handPos2', new Vector(handPos2x, handPos2y));//

    setIfUndefined(this, 'bulletsRemaining', 0);//
    setIfUndefined(this, 'reloadStartTime', -1);//

    setIfUndefined(this, 'spray', 0);
    setIfUndefined(this, 'recoil', 0);
    setIfUndefined(this, 'lastFireTime', 0);

    setIfUndefined(this, 'hold', false);//
    setIfUndefined(this, 'radius', 30);//

    setIfUndefined(this, 'bullets', {});//
    setIfUndefined(this, 'bulletsArrLength', 0);


    setIfUndefined(this, 'playerHolding', -1);
    this.copy = function() {
        return new Gun(this.name, this.pos.x, this.pos.y, this.length, this.auto, this.firerate, this.multishot, this.capacity, this.reloadTime, this.reloadType, this.bulletSpeed, this.damage, this.damageDrop, this.damageRange, this.damageDropTension, this.range, this.defSpray, this.sprayCoef, this.stability, this.kickAnimation, this.animationMult, this.walkSpeedMult, this.shootWalkSpeedMult, this.color, this.buttPosition, this.handPos1.x, this.handPos1.y, this.handPos2.x, this.handPos2.y);
    }
    this.setLastFireTime = function(state)
    {
      if (this.lastFireTime == 0)
      {

      }
      else if (this.lastFireTime == -1)
      {

      }
      else if (state.time - this.lastFireTime >= 60000 / this.firerate) {
         this.lastFireTime = 0;
      }
    }
    this.pushFromAll = function(state)
    {
        if (this.hold)
        {
            return;
        }
        var finalForce = new Vector(0,0);
        state.loopThroughWeapons(this.pos, (weaponIdx) => {
            var weapon = state.weapons[weaponIdx];
            if (weapon == this || weapon.hold)
            {
                return;
            }
            var dist = this.pos.distanceTo(weapon.pos);
            if (dist < 0.1)
            {
                this.pos = this.pos.add(new Vector(Math.random(),Math.random()));
                dist = this.pos.distanceTo(weapon.pos);
            }
            var stretch = this.radius + weapon.radius - dist;
            if (stretch > 0)
            {
                finalForce = finalForce.add((new Vector(0.2*stretch,0)).rotate(this.pos.angTo(weapon.pos)));
            }
        });
        loopThroughObstacles(this.pos, (obstacle) => {
            iterations += 1;
            if (this.pos.distanceTo(obstacle.center) > this.radius + obstacle.maxRadius || !obstacle.intersectable)
            {
                return;
            }
            var closestPoint = obstacle.closestPoint(this.pos);
            var dist = this.pos.distanceTo(closestPoint);
            var stretch = this.radius - dist;
            if (stretch > 0)
            {
                finalForce = finalForce.add((new Vector(0.5*stretch,0)).rotate(this.pos.angTo(closestPoint)));
            }

        });
        this.vel = this.vel.add(finalForce).multiply(0.6);
    }
    this.step = function()
    {
        if (this.hold)
        {
            return;
        }
        this.pos = this.pos.add(this.vel.multiply(1/weaponPushFrames));
    }
    this.reload = function(timeNow) {
        if (this.bulletsRemaining < this.capacity && this.reloadStartTime == -1 && this.lastFireTime == 0) {
            this.reloadStartTime = timeNow;
        }
    }
    this.cancelReload = function() {
        this.reloadStartTime = -1;

    }
    this.fireBullets = function(timeNow) {
        if (this.lastFireTime == 0 && (this.reloadStartTime == -1 || !this.reloadType)) {
            if (this.bulletsRemaining > 0) {
                if (!this.reloadType)
                {
                    this.cancelReload();
                }
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
            if (this.reloadType)
            {
                this.bulletsRemaining = this.capacity;
                this.reloadStartTime = -1;
            }
            else
            {
                this.bulletsRemaining += 1;
                if (this.bulletsRemaining < this.capacity)
                {
                    this.reloadStartTime = this.reloadTime + this.reloadStartTime;
                }
                else
                {
                    this.reloadStartTime = -1;
                }
            }
        }
        for (var i in this.bullets) {
            this.bullets[i].step(state);
            if (this.bullets[i].delete) {
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
    this.outfields = ['type','startPos','tailPos','pos','vel','ang','bulletSpeed','range','hitPoint','trailLength','color'];
    setIfUndefined(this, 'startPos', weapon.pos.add((new Vector(weapon.length / 2, 0)).rotate(weapon.ang)));//
    setIfUndefined(this, 'tailPos', this.startPos.copy());//
    setIfUndefined(this, 'pos', this.startPos.copy());//
    setIfUndefined(this, 'vel', (new Vector(weapon.bulletSpeed, 0)).rotate(weapon.ang + weapon.spray * (Math.random() - 0.5)).add(weapon.vel));//
    setIfUndefined(this, 'ang', this.vel.ang());//
    setIfUndefined(this, 'bulletSpeed', weapon.bulletSpeed);//

    setIfUndefined(this, 'damage', weapon.damage);
    setIfUndefined(this, 'damageDrop', weapon.damageDrop);
    setIfUndefined(this, 'damageRange', weapon.damageRange);
    setIfUndefined(this, 'damageDropTension', weapon.damageDropTension);


    setIfUndefined(this, 'range', weapon.range);//
    setIfUndefined(this, 'hitPoint', -1);//
    setIfUndefined(this, 'trailLength', this.bulletSpeed * 60);//
    setIfUndefined(this, 'color', weapon.color);//

    setIfUndefined(this, 'bulletFiredBy', weapon.playerHolding);
    setIfUndefined(this, 'delete', false);


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
        }
        else
        {
            if (this.startPos.distanceTo(this.hitPoint) < this.startPos.distanceTo(this.tailPos))
            {
              this.delete = true;
            }
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
        var tailCheck = this.startPos.onSegment(this.pos.subtract(this.vel.multiply(2)), this.pos) ? this.startPos : this.pos.subtract(this.vel.multiply(2));
        loopThroughObstacles(this.pos, (obstacle) => {
            if (!obstacle.intersectable)
            {
              return;
            }
            var point = obstacle.intersectSegment(tailCheck,this.pos);
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
            var point = state.players[key].intersectSegment(tailCheck, this.pos);
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
    setIfUndefined(this, 'color', color);//

    setIfUndefined(this, 'vs', vs);//
    setIfUndefined(this, 'intersectable', intersectable);//
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
    setIfUndefined(this, 'x', x);//
    setIfUndefined(this, 'y', y);//
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
var weaponPushFrames = 60;
var weaponPushFrameCount = 0;
setInterval(updateGameArea, 1000 / 60);

function updateGameArea() {
    gameState.time = Date.now();
    if (Object.keys(gameState.players).length != 0)
    {
        weaponPushFrameCount += 1;
        if (weaponPushFrameCount >= weaponPushFrames)
        {
            weaponPushFrameCount = 0;
        }
        gameState.step();
    }
    stage += 1;
    if (stage >= framesPerTick) {

        emitGameState(gameState);
        stage = 0;
    }
}
io.listen(process.env.PORT || 3000);
