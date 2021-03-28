var gameWidth;
var gameHeight;
var gridWidth;
var buffer = 50;
var framesPerTick;

const socket = io('https://limitless-everglades-60126.herokuapp.com/');

socket.on('init', handleInit);
socket.on('gameState', (msg) => {
    gameStates.push(JSON.parse(msg));
});
socket.on('killFeed', (msg) => {
    var message = msg.msg;
    killFeed.splice(0, 0, {
        msg: message,
        time: Date.now()
    });
    killFeedScroll += 1;
});
var killFeedScroll = 0;
var killFeed = [];
const canvas = document.getElementById('canvas');

const initialScreen = document.getElementById('initialScreen');
const gameCodeInput = document.getElementById('gameCodeInput');
const joinGameBtn = document.getElementById('joinGameButton');

joinGameBtn.addEventListener('click', joinGame);
var name;

function joinGame() {
    initialScreen.style.display = 'none';
    myGameArea.start();
    drawer = new Drawer();
    controlsBundle.start();
    myGameArea.interval();
    name = gameCodeInput.value || 'player:' + String(controlId).substring(0, 4);
    newPlayer();
}

function newPlayer() {
    socket.emit('new player', {
        name: name
    });
}

var obstacleSector = function(point) {
    return [Math.floor(point.x / gridWidth), Math.floor(point.y / gridWidth)];
}
var loopThroughDisplayObstacles = function(objectPos, inner) {
    for (var i in borderObstacles) {
        inner(borderObstacles[i]);
    }
    var sector = obstacleSector(objectPos);
    for (var i = sector[0] - Math.floor(myGameArea.canvas.width / (2 * drawer.scale * gridWidth)) - 2; i < sector[0] + Math.floor(myGameArea.canvas.width / (2 * drawer.scale * gridWidth)) + 3; i++) {
        if (i < 0 || i >= obstacles.length) {
            continue;
        }
        for (var j = sector[1] - Math.floor(myGameArea.canvas.height / (2 * drawer.scale * gridWidth)) - 2; j < sector[1] + Math.floor(myGameArea.canvas.height / (2 * drawer.scale * gridWidth)) + 3; j++) {
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
var fillDigits = function(num, length) {
    var out = num.toString();
    if (out.length > length) {
        return out.substring(out.length - length);
    }
    var zeroes = '';
    for (var i = 0; i < length - out.length; i++) {
        zeroes = zeroes + '0';
    }
    return zeroes + out;

}
var timeDifference = 0;
var controlId = 0;
var obstacles;
var borderObstacles;

function handleInit(msg) {
    timeDifference = msg.data - Date.now();
    controlId = msg.id;
    obstacles = msg.obstacles;
    borderObstacles = msg.borderObstacles;

    giveMethods(obstacles);
    giveMethods(borderObstacles);

    gameWidth = msg.gameWidth;
    gameHeight = msg.gameHeight;
    gridWidth = msg.gridWidth;

    framesPerTick = msg.framesPerTick;
}

function displayKillFeed() {

    var speed = 25;
    var fadeTime = 667;
    var upTime = 30000;
    var idx = killFeed.length - 1;
    while (idx > 2) {
        killFeed[idx].time = Math.min(Date.now() - upTime + fadeTime, killFeed[idx].time);
        idx -= 1;
    }

    if (killFeedScroll > 0)
        killFeedScroll -= 1 / speed;
    else
        killFeedScroll = 0;

    while (killFeed.length > 0 && Date.now() - killFeed[killFeed.length - 1].time > upTime) {
        killFeed.splice(killFeed.length - 1, 1);
    }
    for (var idx in killFeed) {
        var txt = killFeed[idx].msg;
        var ctx = myGameArea.context;
        var timeDiff = Date.now() - killFeed[idx].time;
        var txtAlpha = Math.min(1, timeDiff / fadeTime, (upTime - timeDiff) / fadeTime);

        var textPosX = 30;
        var textPosY = 30 + 30 * (1 - killFeedScroll) + idx * 30;

        var buffer = 4;

        blackBoxedText(txt, "bold 16px Courier New", 16, textPosX, textPosY, buffer, txtAlpha);


    }
}

function blackBoxedText(txt, font, size, posx, posy, buffer, txtAlpha, align) {
    ctx = myGameArea.context;
    ctx.save();
    ctx.globalAlpha = txtAlpha * 0.3;
    ctx.font = font;
    ctx.fillStyle = "#000";
    var width = ctx.measureText(txt).width;
    ctx.textBaseline = "middle";
    ctx.textAlign = align || "left";
    if (ctx.textAlign == "left")
        ctx.fillRect(posx - buffer, posy - 3 / 4 * size - buffer, width + 2 * buffer, size + 2 * buffer);
    else
        ctx.fillRect(posx - width / 2 - buffer, posy - 3 / 4 * size - buffer, width + 2 * buffer, size + 2 * buffer);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = txtAlpha;
    ctx.font = font;
    ctx.fillStyle = "#fff";
    ctx.textAlign = align || "left";
    ctx.fillText(txt, posx, posy);
    ctx.restore();
    return width;
}

function serverTime() {
    return Date.now() + timeDifference;
}
var gameStates = [];
var controlId;
var drawer;
var myGameArea = {
    canvas: document.createElement("canvas"),
    start: function() {
        //make the canvas and stuff.
        this.canvas = canvas;
        this.canvas.style.border = "none";

        this.canvas.style.margin = 0;
        this.canvas.style.padding = 0;

        this.canvas.width = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        this.canvas.height = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
        this.context = this.canvas.getContext("2d");
        window.oncontextmenu = function() {
            return false; // cancel default menu
        }
        this.time = Date.now();
        this.fpsUpdate = 60;
        this.frameTimes = [];
        this.printFps = function() {

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
        this.animate = function() {
            requestAnimationFrame(this.animate.bind(this));
            now = Date.now();
            elapsed = now - then;
            if (elapsed > this.fpsInterval) {
                then = now - elapsed % this.fpsInterval;
                updateGameArea();
            }
        }
        this.interval = function() {
            then = Date.now();
            startTime = then;
            this.animate();
        }


    },
    clear: function() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        this.context.fillStyle = "#83b04a";
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    }
}
var controlsBundle = {
    keys: [],
    mouse: {
        type: "Vector",
        x: 0,
        y: 0
    },
    mouseDown: false,
    ang: 0,
    start: function() {
        window.addEventListener('keydown', function(e) {
            controlsBundle.keys = (controlsBundle.keys || []);
            if (!controlsBundle.keys[e.keyCode]) {
                controlsBundle.keys[e.keyCode] = true;
                socket.emit('keydown', e.keyCode);
            }
        })
        window.addEventListener('keyup', function(e) {
            if (controlsBundle.keys[e.keyCode]) {
                controlsBundle.keys[e.keyCode] = false;
                socket.emit('keyup', e.keyCode);
            }
        })

        const rect = myGameArea.canvas.getBoundingClientRect();
        window.addEventListener('mousemove', function(e) {
            controlsBundle.mouse = new Vector(e.clientX - rect.left, e.clientY - rect.top);
            controlsBundle.ang = controlsBundle.mouse.subtract(new Vector(myGameArea.canvas.width, myGameArea.canvas.height).multiply(0.5)).ang();
            //socket.emit('mousemove', controlsBundle.ang);
        });
        window.addEventListener('mousedown', function(e) {
            if (e.button == 0) {
                controlsBundle.mouseDown = true;
                socket.emit('mousedown');
            }
        })
        window.addEventListener('mouseup', function(e) {
            if (e.button == 0) {
                controlsBundle.mouseDown = false;
                socket.emit('mouseup');
            }
        })

        window.addEventListener("keydown", function(e) {
            // space, page up, page down and arrow keys:
            if ([32, 33, 34, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
                e.preventDefault();
            }
        }, false);
    }
}
var emitMousePos = function() {
    socket.emit('mousemove', controlsBundle.ang);
}
var setIfUndefined = function(obj, field, value) {
    if (obj[field] === undefined) {
        obj[field] = value;
    }
}
var giveMethods = function(obj) {
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
var GameState = function() {
    this.type = "GameState";
    this.render = function() {
        loopThroughDisplayObstacles(this.players[controlId].pos, (obstacle) => {
            if (!obstacle.intersectable) {
                obstacle.display();
            }
        });
        for (var idx in this.weapons) {
            if (!this.weapons[idx].hold) {
                this.displayWeapon(idx)
            }
        }
        for (var idx in this.weapons) {
            this.displayBullets(idx)
        }
        loopThroughDisplayObstacles(this.players[controlId].pos, (obstacle) => {
            if (obstacle.intersectable) {
                obstacle.display();
            }
        });
        for (var idx in this.players) {
            if (this.players[idx].alive)
                this.displayPlayer(idx);
        }
        for (var idx in this.players) {
            if (this.players[idx].alive)
                this.displayName(idx);
        }
        //this.displayReloadTime();
        this.displayBulletCount();
        //myGameArea.printFps();
        displayKillFeed();
        displayCrosshair();
    }
    this.displayPlayer = function(i) {
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
        var ang = player.ang;

        var firstHand;
        var secondHand;
        if (player.weapon != -1) {
            firstHand = this.weapons[player.weapon].handPos1.add(new Vector(-this.weapons[player.weapon].recoil, 0));
            secondHand = this.weapons[player.weapon].handPos2.add(new Vector(-this.weapons[player.weapon].recoil, 0));
            this.displayWeapon(player.weapon);
        } else {
            firstHand = (new Vector(player.radius * 0.75, player.radius * 0.8)).add((new Vector(player.punchAnimation, 0)).rotate(-Math.PI / 6));
            secondHand = new Vector(player.radius * 0.75, -player.radius * 0.8);

        }
        ctx.strokeStyle = '#000';
        drawer.lineWidth(ctx, 3);
        ctx.beginPath();
        drawer.circle(ctx, player.pos.add(firstHand.rotate(ang)), 6);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();

        ctx.beginPath();
        drawer.circle(ctx, player.pos.add(secondHand.rotate(ang)), 6);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
    }
    this.displayWeapon = function(i) {
        var weapon = this.weapons[i];
        var ctx = myGameArea.context;
        if (!weapon.hold) {
            ctx.strokeStyle = "#000";
            drawer.lineWidth(ctx, 12);
            ctx.beginPath();
            drawer.circle(ctx, weapon.pos, 30);
            ctx.closePath();
            ctx.stroke();
            
            ctx.strokeStyle = weapon.color;
            drawer.lineWidth(ctx, 6);
            ctx.beginPath();
            drawer.circle(ctx, weapon.pos, 30);
            ctx.closePath();
            ctx.stroke();
        }

        ctx.strokeStyle = "#000";
        drawer.lineWidth(ctx, 12);
        ctx.beginPath();
        drawer.moveContext(ctx, weapon.pos.add((new Vector(-weapon.length / 2, 0)).rotate(weapon.ang)));
        drawer.lineContext(ctx, weapon.pos.add((new Vector(weapon.length / 2, 0)).rotate(weapon.ang)));
        ctx.closePath();
        ctx.stroke();


        ctx.strokeStyle = weapon.color;
        drawer.lineWidth(ctx, 6);
        ctx.beginPath();
        drawer.moveContext(ctx, weapon.pos.add((new Vector(-weapon.length / 2 + 3, 0)).rotate(weapon.ang)));
        drawer.lineContext(ctx, weapon.pos.add((new Vector(weapon.length / 2 - 3, 0)).rotate(weapon.ang)));
        ctx.closePath();
        ctx.stroke();
    }
    this.displayBullets = function(i) {
        var weapon = this.weapons[i];
        for (var j in weapon.bullets) {
            if (weapon.bullets[j])
                weapon.bullets[j].display();
        }
    }
    this.displayBulletCount = function() {
        if (!this.players[controlId].alive) {
            return;
        }
        var player = this.players[controlId];
        if (player && player.weapon != -1) {
            var ctx = myGameArea.context;

            var weapon = this.weapons[player.weapon];
            var length = String(weapon.capacity).length;
            var size = 40;
            var buffer = 10;
            var width = blackBoxedText(fillDigits(weapon.bulletsRemaining, length) + '|' + fillDigits(weapon.capacity, length),
                "bold " + size + "px Courier New",
                size,
                myGameArea.canvas.width / 2, myGameArea.canvas.height - 100,
                buffer, 1, "center");
            if (weapon.reloadStartTime != -1) {
                var ctx = myGameArea.context;
                ctx.save();

                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.moveTo(myGameArea.canvas.width / 2 - width / 2 - buffer, myGameArea.canvas.height - 100 - 3 / 4 * size - buffer);
                ctx.lineTo(myGameArea.canvas.width / 2 + width / 2 + buffer - (width + 20) * (this.time - weapon.reloadStartTime) / weapon.reloadTime, myGameArea.canvas.height - 100 - 3 / 4 * size - buffer);
                ctx.closePath();
                ctx.stroke();
                ctx.restore();
            }
        }
    }
    this.displayReloadTime = function() {
        if (!this.players[controlId].alive) {
            return;
        }
        var player = this.players[controlId];
        if (player && player.weapon != -1 && this.weapons[player.weapon].reloadStartTime != -1) {
            var ctx = myGameArea.context;
            ctx.save();
            ctx.globalAlpha = 0.8;

            ctx.strokeStyle = '#fff';
            drawer.lineWidth(ctx, 6);
            ctx.beginPath();
            drawer.moveContext(ctx, player.pos.add(new Vector(-player.radius, player.radius * 3)));
            drawer.lineContext(ctx, player.pos.add(new Vector(player.radius - 2 * player.radius * (this.time - this.weapons[player.weapon].reloadStartTime) / this.weapons[player.weapon].reloadTime, player.radius * 3)));
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
        }

    }
    this.displayName = function(i) {

        var player = this.players[i];
        var pos = player.pos.add(new Vector(0, 50));
        var disPos = drawer.transform(pos);
        blackBoxedText(player.name, "bold 12px Courier New", 12, disPos.x, disPos.y, 3, 1, 'center');
    }
    this.snapWeapons = function() {
        for (var i in this.players) {
            if (this.players[i].weapon == -1) {
                continue;
            }
            var player = this.players[i];
            var ang = player.ang;
            this.weapons[player.weapon].pos = player.pos.add((new Vector(player.radius + this.weapons[player.weapon].length / 2 - this.weapons[player.weapon].recoil, 0)).rotate(ang));
            this.weapons[player.weapon].ang = ang;
        }
    }
    this.toString = function() {
        return JSON.stringify(this);
    }
}
var makeObstacles = function() {
    drawer = new Drawer();
}
var Player = function() {
    this.type = "Player";
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

}
var Gun = function() {
    this.type = "Gun";


}
var Bullet = function() {
    this.type = "Bullet";
    this.display = function() {
        var ctx = myGameArea.context;
        const g = drawer.createLinearGradient(ctx, this.pos, this.tailPos);
        g.addColorStop(0, hexToRgbA(pSBC(0, this.color), 1)); // opaque
        g.addColorStop(0.2, hexToRgbA(pSBC(0, this.color), 1));
        g.addColorStop(1, hexToRgbA(pSBC(0.3, this.color), 0)); // transparent
        ctx.strokeStyle = g;

        drawer.lineWidth(ctx, 6);
        ctx.beginPath();
        drawer.moveContext(ctx, this.hitPoint != -1 ? this.hitPoint : this.pos);
        drawer.lineContext(ctx, this.tailPos);
        ctx.closePath();
        ctx.stroke();
    }
    this.objectsIntersection = function(state) {
        if (this.hitPoint != -1)
        {
            return;
        }
        var smallestDistance = Number.MAX_VALUE;
        var objectsPoint = -1;
        var bulletHitbox = 2;
        loopThroughObstacles(this.pos, (obstacle) => {
            if (!obstacle.intersectable)
            {
              return;
            }
            
            var point = obstacle.intersectSegment(this.pos.subtract(this.vel.multiply(bulletHitbox)),this.pos);
            if (point != -1) {
                var dist = this.startPos.distanceTo(point);
                if (dist < smallestDistance) {
                    smallestDistance = dist;
                    objectsPoint = point;
                }
            }
        });
        for (var key in state.players) {
            var v1 = this.pos.distanceTo(this.startPos) > bulletHitbox * this.vel.magnitude() ? this.pos.subtract(this.vel.multiply(bulletHitbox)) : this.startPos;
            var point = state.players[key].intersectSegment(v1, this.pos);
            if (point != -1) {
                var dist = this.startPos.distanceTo(point);
                if (dist < smallestDistance) {
                    smallestDistance = dist;
                    objectsPoint = point;
                }
            }
        }
        this.hitPoint = objectsPoint;
    }
}
var Drawer = function() {
    this.scroll = this.scroll || new Vector(0, 0);
    this.scale = 1;
    this.zoom = 1;
    this.targetScale;
    this.screenShake = this.screenShake || 0;
    this.moveContext = function(ctx, point) {
        var displayPoint = this.transform(point);
        ctx.moveTo(displayPoint.x, displayPoint.y);
    }
    this.transform = function(point) {
        return point.subtract(this.scroll).multiply(this.scale).add((new Vector(myGameArea.canvas.width, myGameArea.canvas.height)).multiply(0.5));
    }
    this.lineWidth = function(ctx, width) {
        ctx.lineWidth = width * this.scale;
    }
    this.lineContext = function(ctx, point) {
        var displayPoint = this.transform(point);
        ctx.lineTo(displayPoint.x, displayPoint.y);
    }
    this.circle = function(ctx, point, radius) {
        var displayPoint = this.transform(point);
        ctx.arc(displayPoint.x, displayPoint.y, radius * this.scale, 0, 2 * Math.PI, false);
    }
    this.createLinearGradient = function(ctx, start, end) {
        var newStart = this.transform(start);
        var newEnd = this.transform(end);
        return ctx.createLinearGradient(newStart.x, newStart.y, newEnd.x, newEnd.y);
    }
    this.fillText = function(ctx, point, txt) {
        var displayPoint = this.transform(point);
        ctx.fillText(txt, displayPoint.x, displayPoint.y);
    }
    this.update = function(state) {

        character = state.players[controlId];

        this.targetScale = this.zoom / 40000 * (9 * myGameArea.canvas.width + 16 * myGameArea.canvas.height);
        this.scroll = character.pos.add((new Vector(Math.random() - 0.5, Math.random() - 0.5)).multiply(this.screenShake));
        this.scale *= Math.pow(this.targetScale / this.scale, 0.1);
    }
}
var Obstacle = function() {
    this.type = "Obstacle";
    this.display = function() {
        var ctx = myGameArea.context;

        ctx.fillStyle = this.color;
        ctx.strokeStyle = "#000";
        drawer.lineWidth(ctx, 3);
        ctx.beginPath();
        drawer.moveContext(ctx, this.vs[0]);
        for (var i = 1; i < this.vs.length; i++) {
            drawer.lineContext(ctx, this.vs[i]);
        }
        ctx.closePath();
        ctx.fill();
        if (this.intersectable) {
            ctx.stroke();
        }
    }
    this.intersectSegment = function(v1, v2) {
        if (this.center.distanceTo(v1) > v1.distanceTo(v2) + this.maxRadius) {
            return -1;
        }
        var minDist = Number.MAX_VALUE;
        var pointOfInter = -1;
        for (var i = 0; i < this.vs.length; i++) {
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
            if (lineInter.onSegment(v1, v2) && lineInter.onSegment(v3, v4)) {
                var distanceToV1 = lineInter.distanceTo(v1);
                if (distanceToV1 < minDist) {
                    pointOfInter = lineInter;
                    minDist = distanceToV1;
                }
            }
        }
        return pointOfInter;
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
    this.normalize = function() {
        return this.multiply(1 / this.magnitude());
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
    this.drawLine = function(v, color, thickness) {
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
    this.dot = function(r, color) {
        var ctx = myGameArea.context;
        ctx.beginPath();
        ctx.arc(this.x, this.y, r, 0, 2 * Math.PI, false);
        ctx.fillStyle = color;
        ctx.fill();
    }
    this.circle = function(r, color, thick) {
        var ctx = myGameArea.context;
        ctx.beginPath();
        ctx.arc(this.x, this.y, r, 0, 2 * Math.PI, false);
        ctx.lineWidth = thick;
        ctx.strokeStyle = color;
        ctx.stroke();
    }
    this.copy = function() {
        return new Vector(this.x, this.y);
    }

}
var displayCrosshair = function() {
    giveMethods(controlsBundle.mouse);
    controlsBundle.mouse.add(new Vector(10, 0)).drawLine(controlsBundle.mouse.add(new Vector(-10, 0)), '#fff', 2);
    controlsBundle.mouse.add(new Vector(0, 10)).drawLine(controlsBundle.mouse.add(new Vector(0, -10)), '#fff', 2);
    controlsBundle.mouse.circle(6, '#fff', 2);
}
var linearPosition = function(v1, v2, t, t1, t2) {
    return new Vector(v1.x * (t2 - t) / (t2 - t1) + v2.x * (t - t1) / (t2 - t1), v1.y * (t2 - t) / (t2 - t1) + v2.y * (t - t1) / (t2 - t1));
}
var linearAng = function(a1, a2, t, t1, t2) {
    if (t < t1) {
        return a1;
    } else if (t > t2) {
        return a2;
    } else {
        var dir1 = (a1 % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        var dir2 = (a2 % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        var difference = dir2 - dir1;
        var difference = (difference % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
        return dir1 + difference * (t - t1) / (t2 - t1);
    }
}
var linearGameState = function() {
    var displayTime = serverTime() - buffer;
    var rightIdx = 1;
    var time = 0;
    while (rightIdx < gameStates.length && gameStates[rightIdx].time < displayTime) {
        if (rightIdx > 1) {
            gameStates.splice(rightIdx - 2, 1);
        } else {
            rightIdx += 1;
        }

    }
    if (rightIdx >= gameStates.length) {
        /*var out = JSON.parse(JSON.stringify(gameStates[gameStates.length - 1]));
    giveMethods(out);
     out.snapWeapons();
    return out;*/
        rightIdx = gameStates.length - 1;
    }
    if (gameStates.length > 3) {
        buffer -= 2;
    } else if (gameStates.length < 3) {
        buffer += 2;
    }

    var right = gameStates[rightIdx];
    var left = gameStates[rightIdx - 1];
    console.log(Math.floor(1000/(right.time - left.time)));
    var out = JSON.parse(JSON.stringify(right));
    giveMethods(out);
    out.time = displayTime;
    for (var i in out.players) {
        if (left.players[i] == undefined || right.players[i] == undefined) {
            continue;
        }
        out.players[i].pos = linearPosition(left.players[i].pos, right.players[i].pos, displayTime, left.time, right.time);
        out.players[i].punchAnimation = linearPosition(new Vector(left.players[i].punchAnimation, 0), new Vector(right.players[i].punchAnimation, 0), displayTime, left.time, right.time).x;
        out.players[i].ang = linearAng(left.players[i].ang, right.players[i].ang, displayTime, left.time, right.time);
    }
    for (var i in out.weapons) {
        if (left.weapons[i] == undefined || right.weapons[i] == undefined) {
            continue;
        }
        out.weapons[i].pos = linearPosition(left.weapons[i].pos,right.weapons[i].pos, displayTime, left.time,right.time);
        for (var j in out.weapons[i].bullets) {
            if (left.weapons[i].bullets[j] == undefined) {
                var rightBull = right.weapons[i].bullets[j];
                giveMethods([rightBull.pos, rightBull.vel, rightBull.startPos]);
                if (rightBull.pos.distanceTo(rightBull.startPos) < framesPerTick * rightBull.vel.magnitude() * (right.time - displayTime) / (right.time - left.time)) {
                    delete out.weapons[i].bullets[j];
                    continue;
                } else {
                    out.weapons[i].bullets[j].pos = rightBull.pos.subtract(rightBull.vel.multiply(framesPerTick * (right.time - displayTime) / (right.time - left.time)));
                }
            } else {
                out.weapons[i].bullets[j].pos = linearPosition(left.weapons[i].bullets[j].pos, right.weapons[i].bullets[j].pos, displayTime, left.time, right.time);
            }
            var bullet = out.weapons[i].bullets[j];
            if (bullet.startPos.distanceTo(bullet.pos) < bullet.trailLength) {
                bullet.tailPos = bullet.startPos;
            } else {
                bullet.tailPos = bullet.pos.add((new Vector(-bullet.trailLength, 0)).rotate(bullet.ang));
            }
            if (bullet.hitPoint != -1 && bullet.startPos.distanceTo(bullet.pos) < bullet.startPos.distanceTo(bullet.hitPoint))
            {
                bullet.hitPoint = -1;
            }
            
            bullet.objectsIntersection(out);
        }
        out.weapons[i].recoil = linearPosition(new Vector(left.weapons[i].recoil, 0), new Vector(right.weapons[i].recoil, 0), displayTime, left.time, right.time).x;
    }
    out.snapWeapons();
    return out;
}
var resetControls = function() {
    controlsBundle.justKeyDown = {};
    controlsBundle.justDowned = false;
}
var lastDeadTime = -1;

function updateGameArea() {
    if (gameStates.length > 1) {
        var state = linearGameState();
        myGameArea.clear();
        if (state.players[controlId] && state.players[controlId].alive) {
            drawer.update(state);
            lastDeadTime = -1;
        } else if (lastDeadTime == -1) {
            lastDeadTime = Date.now();
        } else if (Date.now() - lastDeadTime > 5000) {
            newPlayer();
            lastDeadTime = -2;
        }
        state.render();
        emitMousePos();
        
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
    let r, g, b, P, f, t, h, i = parseInt,
        m = Math.round,
        a = typeof(c1) == "string";
    if (typeof(p) != "number" || p < -1 || p > 1 || typeof(c0) != "string" || (c0[0] != 'r' && c0[0] != '#') || (c1 && !a)) return null;
    if (!this.pSBCr) this.pSBCr = (d) => {
        let n = d.length,
            x = {};
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
        }
        return x
    };
    h = c0.length > 9, h = a ? c1.length > 9 ? true : c1 == "c" ? !h : false : h, f = this.pSBCr(c0), P = p < 0, t = c1 && c1 != "c" ? this.pSBCr(c1) : P ? {
        r: 0,
        g: 0,
        b: 0,
        a: -1
    } : {
        r: 255,
        g: 255,
        b: 255,
        a: -1
    }, p = P ? p * -1 : p, P = 1 - p;
    if (!f || !t) return null;
    if (l) r = m(P * f.r + p * t.r), g = m(P * f.g + p * t.g), b = m(P * f.b + p * t.b);
    else r = m((P * f.r ** 2 + p * t.r ** 2) ** 0.5), g = m((P * f.g ** 2 + p * t.g ** 2) ** 0.5), b = m((P * f.b ** 2 + p * t.b ** 2) ** 0.5);
    a = f.a, t = t.a, f = a >= 0 || t >= 0, a = f ? a < 0 ? t : t < 0 ? a : a * P + t * p : 0;
    if (h) return "rgb" + (f ? "a(" : "(") + r + "," + g + "," + b + (f ? "," + m(a * 1000) / 1000 : "") + ")";
    else return "#" + (4294967296 + r * 16777216 + g * 65536 + b * 256 + (f ? m(a * 255) : 0)).toString(16).slice(1, f ? undefined : -2)
}
