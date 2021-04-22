var gameWidth;
var gameHeight;
var gridWidth;
var buffer = 50;
var framesPerTick;

const socket = io('https://limitless-everglades-60126.herokuapp.com/');

socket.on('init', handleInit);
socket.on('gameState', (msg) => {
    for(var i in msg.weapons)
    {
        var weapon = msg.weapons[i];
        Object.assign(weapon, viableWeapons[weapon.gunStats]);
        weapon.type = "Gun";
    }
    tickIntervals.push(msg.time);
    if (tickIntervals.length > 10)
    {
        tickIntervals.shift();
    }
    tickInterval = (tickIntervals[tickIntervals.length - 1] - tickIntervals[0])/(tickIntervals.length - 1);
    gameStates.push(msg);
});
socket.on('killFeed', (msg) => {
    var plyrs = gameStates[gameStates.length - 1].players;
    var shooterName = (plyrs[msg.shooter] ? plyrs[msg.shooter].name : "unknown");
    var deadName = (plyrs[msg.dead] ? plyrs[msg.dead].name : "unknown");
    if (plyrs[msg.shooter])
    {
        var message = shooterName + " killed " + deadName;
    }
    killFeed.list.splice(0, 0, {
        msg: message,
        time: Date.now()
    });
    killFeed.scroll += 1;
    
    if (msg.shooter == controlId)
    {
        yourKillFeed.list.splice(0, 0, {
            msg: "You killed " + deadName,
            time: Date.now()
        });
        yourKillFeed.scroll += 1;
    }
    else if (msg.dead == controlId)
    {
        msg.shooter;
    }
});
socket.on('playerActivity', (msg) => {
    var message;
    if (msg.action == "join")
    {
        message = (msg.name || "unknown") + " joined";
    }
    else if (msg.action == "leave")
    {
        message = (msg.name || "unknown") + " left";
    }
    killFeed.list.splice(0, 0, {
        msg: message,
        time: Date.now()
    });
    killFeed.scroll += 1;
});
var killFeed = {
    list : [],
    scroll : 0,
    display : function () {
        var speed = 25;
        var fadeTime = 667;
        var upTime = 30000;
        var idx = this.list.length - 1;
        while (idx > 2) {
            this.list[idx].time = Math.min(Date.now() - upTime + fadeTime, this.list[idx].time);
            idx -= 1;
        }

        if (this.scroll > 0)
            this.scroll -= 1 / speed;
        else
            this.scroll = 0;

        while (this.list.length > 0 && Date.now() - this.list[this.list.length - 1].time > upTime) {
            this.list.splice(this.list.length - 1, 1);
        }
        for (var idx = 0, l = this.list.length; idx < l ; idx ++) {
            var txt = this.list[idx].msg;
            var ctx = myGameArea.context;
            var timeDiff = Date.now() - this.list[idx].time;
            var txtAlpha = Math.min(1, timeDiff / fadeTime, (upTime - timeDiff) / fadeTime);

            var textPosX = 30;
            var textPosY = 30 + (idx + 1 - this.scroll) * 30;

            var buffer = 4;

            blackBoxedText(txt, "bold 16px Courier New", 16, textPosX, textPosY, buffer, txtAlpha);
        }

    }
};
var yourKillFeed = {
    list : [],
    scroll : 0,
    display : function () {
        var speed = 25;
        var fadeTime = 667;
        var upTime = 10000;
        var idx = this.list.length - 1;
        while (idx > 2) {
            this.list[idx].time = Math.min(Date.now() - upTime + fadeTime, this.list[idx].time);
            idx -= 1;
        }

        if (this.scroll > 0)
            this.scroll -= 1 / speed;
        else
            this.scroll = 0;

        while (this.list.length > 0 && Date.now() - this.list[this.list.length - 1].time > upTime) {
            this.list.splice(this.list.length - 1, 1);
        }
        for (var idx = 0, l = this.list.length; idx < l ; idx ++) {
            var txt = this.list[idx].msg;
            var ctx = myGameArea.context;
            var timeDiff = Date.now() - this.list[idx].time;
            var txtAlpha = Math.min(1, timeDiff / fadeTime, (upTime - timeDiff) / fadeTime);

            
            var textPosX = myGameArea.canvas.width/2;
            var textPosY = myGameArea.canvas.height - 250 + (idx + 1 - this.scroll) * 30;

            var ctx = myGameArea.context;
            ctx.save();
            ctx.globalAlpha = txtAlpha;
            ctx.font = "bold 20px Courier New";
            ctx.lineWidth = 2;
            ctx.strokeStyle = "black";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.strokeText(txt, textPosX,textPosY);
            ctx.fillText(txt, textPosX,textPosY);
            ctx.restore();
        }

    }
};



var tickIntervals = [];
var tickInterval;
const canvas = document.getElementById('canvas');

const initialScreen = document.getElementById('initialScreen');
const gameCodeInput = document.getElementById('gameCodeInput');
const colorInput = document.getElementById('colorInput');
const joinGameBtn = document.getElementById('joinGameButton');

joinGameBtn.addEventListener('click', joinGame);
var name;
var color;
var path1 = "img/weapons/";
var path2 = "img/ground weapons/";
function imageExists(image_url){

    var http = new XMLHttpRequest();

    http.open('HEAD', image_url, false);
    http.send();

    return http.status != 404;

}
var weaponImages = {
    "AK-47" : 0,
    "MP5" : 0,
    "Stevens DB" : 0,
    "Crossbow" : 0,
    "M1A1" : 0,
    "Laser" : 0,
    "Glock 17" : 0
};
for (var i in weaponImages)
{
    weaponImages[i] = {true : new Image(), false : new Image()};
    if (imageExists(path1 + i + ".svg"))
    {
        weaponImages[i][true].src = path1 + i + ".svg";
    }
    else
    {
        weaponImages[i][true] = false;
    }
    if (imageExists(path2 + i + ".svg")){
        weaponImages[i][false].src = path2 + i + ".svg";
    }
    else
    {
        weaponImages[i][false] = false;
    }
}
var viableWeapons;
function startGame(){
    myGameArea.start();
    drawer = new Drawer();
    controlsBundle.start();
    myGameArea.interval();
}
function joinGame() {
    lastDeadTime = -2;
    
    killFeed.scroll = 0;
    initialScreen.style.display = "none";

    name = gameCodeInput.value.substring(0,18);
    color = colorInput.value;
    newPlayer(name, color);
}

function newPlayer(name, color) {
    socket.emit('new player', {
        name: name,
        color: color
    });
}
function limitInput()
{
    if (gameCodeInput.value.length > 18)
    {
        gameCodeInput.value = gameCodeInput.value.substring(0,18);
    }
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
    while(out.length < length) {
        out = '0' + out;
    }
    return out;

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
    viableWeapons = msg.viableWeapons;
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
        this.updateFps = function() {

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


            return this.fps;
        }
        this.fpsInterval = 1000 / 60;
        this.animate = function() {
            requestAnimationFrame(this.animate.bind(this));
            now = Date.now();
            elapsed = now - then;
            if (elapsed > this.fpsInterval) {
                this.updateFps();
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
    mouse: 0,
    mouseDown: false,
    ang: 0,
    start: function() {
        controlsBundle.mouse = new Vector(0,0);
        window.addEventListener('keydown', function(e) {
            controlsBundle.keys = (controlsBundle.keys || []);
            if (!controlsBundle.keys[e.keyCode]) {
                controlsBundle.keys[e.keyCode] = true;
                socket.emit('keydown', e.keyCode);
            }
        });
        window.addEventListener('keyup', function(e) {
            if (controlsBundle.keys[e.keyCode]) {
                controlsBundle.keys[e.keyCode] = false;
                socket.emit('keyup', e.keyCode);
            }
        });

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
        });
        window.addEventListener('mouseup', function(e) {
            if (e.button == 0) {
                controlsBundle.mouseDown = false;
                socket.emit('mouseup');
            }
        });
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
        loopThroughDisplayObstacles(drawer.scroll, (obstacle) => {
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
        loopThroughDisplayObstacles(drawer.scroll, (obstacle) => {
            if (obstacle.intersectable) {
                obstacle.display();
            }
        });
        
        for (var idx in this.players) {
            if (this.players[idx].alive && idx != controlId)
                this.displayName(idx);
        }
        for (var idx in this.players) {
            if (this.players[idx].alive)
                this.displayPlayer(idx);
        }
        
        for (var idx in this.players) {
            if (this.players[idx].alive && idx != controlId)
                this.players[idx].drawHealthBar(idx);
        }
        if (this.players[controlId] && initialScreen.style.display == "none")
        {
            this.displayHealthMeter();
            // this.displayReloadTime();
            this.displayBulletCount();
            //myGameArea.printFps();
            killFeed.display();
            yourKillFeed.display();
        }
        this.displayScoreBoard();
    }
    this.displayHealthMeter = function()
    {
        var length = 300;
        var startX = 1/2 * myGameArea.canvas.width-length/2;
        var startY = myGameArea.canvas.height -75;
        var height = 40;
        var margin = 6;
        ctx = myGameArea.context;
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = "#000";
        ctx.fillRect(startX, startY, length, height);
        ctx.restore();
        var health = this.players[controlId].health;
        if (health > 99)
            ctx.fillStyle = "#b3b3b3";
        else if (health > 60)
            ctx.fillStyle = "#fff";
        else if (health > 30)
            ctx.fillStyle = "#f88";
        else if (health > 0)
            ctx.fillStyle = pSBC(-0.5*(Math.sin(this.time/250) + 1)/2, "#f00")
        if (health > 0)
        {
            ctx.fillRect(startX + margin, startY + margin, this.players[controlId].health/100 * (length - 2*margin), height- 2*margin);
        }
    }
    this.displayScoreBoard = function()
    {
        var displayObj = [];
        for (var i in this.players)
        {
            var player = this.players[i];
            if (!player.alive)
            {
                continue;
            }
            displayObj.push({
                id : player.id,
                name: player.name,
                killstreak: player.killstreak,
                points: player.points
            });
        }
        displayObj.sort((a,b) => (b.points - a.points));

        var margin = 8;
        var height = 16;
        var maxLength = 10;
        var totalHeight = (Math.min(displayObj.length,maxLength) + 2)*(margin + height) + margin;
        var totalWidth = 280;
        var startX = myGameArea.canvas.width - 300;
        var startY = 20;
        var split1 = 180;

        var ctx = myGameArea.context;
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = "#000";
        ctx.fillRect(startX, startY, totalWidth, totalHeight);
        ctx.restore();

        var y = startY + margin;
        ctx.font = "bold " + height + "px Courier New";
        ctx.fillStyle = "#fff";
        
        ctx.textAlign = "left";
        ctx.fillText("fps:" + Math.floor(myGameArea.fps + 0.5),  startX + margin, y + 3/4 * height);
        
        ctx.textAlign = "center";
        ctx.fillText("tickspd:" + Math.floor(1000/tickInterval + 0.5),  startX + totalWidth/2, y + 3/4 * height);
        
        ctx.textAlign = "right";
        ctx.fillText("Plyrs:" + Object.keys(this.players).length,  startX + totalWidth - margin, y + 3/4 * height);
        
        y += margin + height;
        ctx.textAlign = "center";
        ctx.fillText("Leaderboard",  startX + totalWidth/2, y + 3/4 * height);
        
        
        y += margin + height;
        for (var i = 0; i < Math.min(displayObj.length,maxLength); i++)
        {
            var playerStats = displayObj[i];
            ctx.fillStyle = (playerStats.id == controlId ? "#88f" : "#fff");
            
            ctx.textAlign = "left";
            var name = (playerStats.name.length > 11 ? playerStats.name.substring(0,10) + "\u2026" : playerStats.name);
            ctx.fillText(i + 1 + ". " + name + ":", startX + margin, y + 3/4 * height);
            ctx.fillText(playerStats.killstreak, startX + split1, y + 3/4 * height);
            ctx.textAlign = "right";
            ctx.fillText(Math.floor(playerStats.points + 0.0000001), startX + totalWidth - margin, y + 3/4 * height);

            y += margin + height;
        }
    }
    this.displayPlayer = function(i) {
        var player = this.players[i];

        var ctx = myGameArea.context;
        /*ctx.save();
        ctx.globalAlpha = 0.5+0.25*Math.cos(((this.time)/125)%(2*Math.PI));
        ctx.fillStyle = pSBC(0.5,player.color);
        ctx.beginPath();
        drawer.circle(ctx, player.pos, player.radius);
        ctx.closePath();
        ctx.fill();
        ctx.restore();*/

        
        var ang = player.ang;
        var rotAng1 = 0;
        var rotAng2 = 0.25*Math.PI;

        var firstShoulder;
        var secondShoulder;
        var firstHand;
        var secondHand;

        if (player.weapon != -1) {
            var weapon = this.weapons[player.weapon];
            firstShoulder = (new Vector(0, player.radius + 3)).rotate(rotAng1);
            secondShoulder = (new Vector(0, -player.radius-3)).rotate(rotAng2);
            firstHand = weapon.handPos1.add(new Vector(weapon.buttPosition -this.weapons[player.weapon].recoil, 0));
            secondHand = weapon.handPos2.add(new Vector(weapon.buttPosition-this.weapons[player.weapon].recoil, 0));

        } else {
            firstShoulder = (new Vector(0, player.radius + 3)).rotate(0);
            secondShoulder = (new Vector(0, -player.radius - 3)).rotate(0);
            firstHand = (new Vector(player.radius * 0.85, player.radius * 0.8)).add((new Vector(player.punchAnimation, 0)).rotate(-Math.PI / 6));
            secondHand = new Vector(player.radius * 0.85, -player.radius * 0.8);

        }
        ctx.strokeStyle = '#000';
        ctx.fillStyle = player.color;
        drawer.lineWidth(ctx, 1.5);
        ctx.beginPath();
        drawer.circle(ctx, player.pos.add(firstShoulder.rotate(ang)), 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        drawer.lineWidth(ctx, 1.5);
        ctx.beginPath();
        drawer.circle(ctx, player.pos.add(secondShoulder.rotate(ang)), 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        drawer.lineWidth(ctx, 11.5);
        ctx.beginPath();
        drawer.moveContext(ctx, player.pos.add(firstShoulder.rotate(ang)));
        drawer.lineContext(ctx, player.pos.add(firstHand.rotate(ang)));
        ctx.closePath();
        ctx.stroke();
        
        ctx.beginPath();
        drawer.moveContext(ctx, player.pos.add(secondShoulder.rotate(ang)));
        drawer.lineContext(ctx, player.pos.add(secondHand.rotate(ang)));
        ctx.closePath();
        ctx.stroke();
        
        ctx.strokeStyle = player.color;
        drawer.lineWidth(ctx, 8.5);
        ctx.beginPath();
        drawer.moveContext(ctx, player.pos.add(firstShoulder.rotate(ang)));
        drawer.lineContext(ctx, player.pos.add(firstHand.rotate(ang)));
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        drawer.moveContext(ctx, player.pos.add(secondShoulder.rotate(ang)));
        drawer.lineContext(ctx, player.pos.add(secondHand.rotate(ang)));
        ctx.closePath();
        ctx.stroke();

        ctx.strokeStyle = '#000';
        drawer.lineWidth(ctx, 1.5);
        ctx.beginPath();
        drawer.circle(ctx, player.pos.add(firstHand.rotate(ang)), 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        drawer.circle(ctx, player.pos.add(secondHand.rotate(ang)), 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        if (player.weapon != -1)
        {
            this.displayWeapon(player.weapon);
        }
        
        ctx.strokeStyle = '#000';
        drawer.lineWidth(ctx, 1.5);
        ctx.fillStyle = player.color;
        ctx.beginPath();
        drawer.circle(ctx, player.pos, player.radius);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    this.displayWeapon = function(i) {
        var weapon = this.weapons[i];

        var ctx = myGameArea.context;
        if (!weapon.hold) {
            ctx.strokeStyle = weapon.color;
            drawer.lineWidth(ctx, 4);
            ctx.beginPath();
            drawer.circle(ctx, weapon.pos, 30);
            ctx.closePath();
            ctx.stroke();
        }
        if (weaponImages[weapon.name] && weaponImages[weapon.name][weapon.hold])
        {
            var pos = drawer.transform(weapon.pos);
            var newLength = drawer.scaled(weapon.length);
            ctx.save();
            ctx.translate(pos.x, pos.y);
            ctx.rotate(weapon.ang);
            var fat = 1;
            var img = weaponImages[weapon.name][weapon.hold];
            ctx.drawImage(img, newLength/-2, fat*newLength * img.naturalHeight/img.naturalWidth / -2, newLength, fat*newLength * img.naturalHeight/img.naturalWidth);
            ctx.restore();
        }
        else
        {
            ctx.strokeStyle = "#000";
            drawer.lineWidth(ctx, 8);
            ctx.beginPath();
            drawer.moveContext(ctx, weapon.pos.add((new Vector(-weapon.length / 2, 0)).rotate(weapon.ang)));
            drawer.lineContext(ctx, weapon.pos.add((new Vector(weapon.length / 2, 0)).rotate(weapon.ang)));
            ctx.closePath();
            ctx.stroke();


            ctx.strokeStyle = weapon.color;
            drawer.lineWidth(ctx, 5);
            ctx.beginPath();
            drawer.moveContext(ctx, weapon.pos.add((new Vector(-weapon.length / 2 + 1.5, 0)).rotate(weapon.ang)));
            drawer.lineContext(ctx, weapon.pos.add((new Vector(weapon.length / 2 - 1.5, 0)).rotate(weapon.ang)));
            ctx.closePath();
            ctx.stroke();
        }
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
                var frac = (this.time - weapon.reloadStartTime) / weapon.reloadTime;
                var ctx = myGameArea.context;
                ctx.save();

                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.moveTo(myGameArea.canvas.width / 2 - width / 2 - buffer, myGameArea.canvas.height - 100 - 3 / 4 * size - buffer);
                ctx.lineTo(myGameArea.canvas.width / 2 + width / 2 + buffer - (width + 20) * frac, myGameArea.canvas.height - 100 - 3 / 4 * size - buffer);
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
            var weapon = this.weapons[player.weapon];
            var ang = player.ang;
            weapon.pos = player.pos.add((new Vector(weapon.buttPosition + weapon.length / 2 - weapon.recoil, 0)).rotate(ang));
            weapon.ang = ang;
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
    this.drawHealthBar = function()
    {
         var ctx = myGameArea.context;

         var left = this.pos.add(new Vector(-1.5*this.radius,-this.radius * 2));
         var right = this.pos.add(new Vector(1.5*this.radius,-this.radius * 2));
         var mid = this.pos.add(new Vector(-1.5*this.radius+3*Math.max(0,this.health)/100*this.radius,-this.radius * 2));

         ctx.strokeStyle = '#f00';
         drawer.lineWidth(ctx,8);
         ctx.beginPath();
         drawer.moveContext(ctx,right);
         drawer.lineContext(ctx,mid);
         ctx.closePath();
         ctx.stroke();

         ctx.strokeStyle = '#0f0';
         ctx.beginPath();
         drawer.moveContext(ctx,left);
         drawer.lineContext(ctx,mid);
         ctx.closePath();
         ctx.stroke();
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

}
var Gun = function() {
    this.type = "Gun";


}
var Bullet = function() {
    this.type = "Bullet";
    this.display = function() {
        var ctx = myGameArea.context;
        const g = drawer.createLinearGradient(ctx, this.pos, this.pos.add((new Vector(-this.trailLength, 0)).rotate(this.ang)));
        if (this.ammoType == 'bullet')
        {
            g.addColorStop(0, hexToRgbA(this.color, 1)); // opaque
            g.addColorStop(0.07/3, hexToRgbA(this.color, 1)); // opaque
            g.addColorStop(0.14/3, hexToRgbA('#ccc', 0.25)); // opaque
            g.addColorStop(1/3, hexToRgbA('#ccc', 0)); // transparent
        }
        else if (this.ammoType == 'laser')
        {
            g.addColorStop(0, hexToRgbA(this.color, 0.5)); // opaque
            g.addColorStop(0.5, hexToRgbA(this.color, 0.5)); // opaque
            g.addColorStop(1, hexToRgbA(this.color, 0)); // transparent
        }
        else if (this.ammoType == 'arrow')
        {
            g.addColorStop(0, hexToRgbA(this.color, 1)); // opaque
            g.addColorStop(0.1, hexToRgbA(this.color, 1)); // transparent
            g.addColorStop(0.12, hexToRgbA(this.color, 0)); // transparent
        }
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
        var tailCheck = this.startPos.onSegment(this.pos.subtract(this.vel.multiply(bulletHitbox)),this.pos) ? this.startPos : this.pos.subtract(this.vel.multiply(bulletHitbox));
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
        for (var key in state.players) {
            var point = state.players[key].intersectSegment(tailCheck, this.pos);
            if (point != -1) {
                var dist = this.startPos.distanceTo(point);
                if (dist < smallestDistance) {
                    smallestDistance = dist;
                    objectsPoint = point;
                }
            }
        }
        if (this.pos.distanceTo(this.startPos) > this.range)
        {
            if (objectsPoint == -1 || objectsPoint != -1 && objectsPoint.distanceTo(this.startPos) > this.range)
            {
                objectsPoint = this.startPos.add(this.vel.normalize().multiply(this.range));
                playerHit = -1;
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
    this.scaled = function(x)
    {
        return x * this.scale;
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
        if (character)
        {
            this.scroll = character.pos.add((new Vector(Math.random() - 0.5, Math.random() - 0.5)).multiply(this.screenShake));
            this.targetScale = this.zoom / 40000 * (9 * myGameArea.canvas.width + 16 * myGameArea.canvas.height);
        }
        else
        {
            this.scroll = (new Vector(gameWidth,gameHeight)).multiply(0.5).add((new Vector(Math.random() - 0.5, Math.random() - 0.5)).multiply(this.screenShake));
            this.targetScale =  (Math.max(myGameArea.canvas.width,myGameArea.canvas.height))/Math.max(gameWidth,gameHeight);
        }

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
    controlsBundle.mouse.add(new Vector(10, 0)).drawLine(controlsBundle.mouse.add(new Vector(-10, 0)), '#fff', 2);
    controlsBundle.mouse.add(new Vector(0, 10)).drawLine(controlsBundle.mouse.add(new Vector(0, -10)), '#fff', 2);
    controlsBundle.mouse.circle(6, '#fff', 2);
}
var linearInterpolator = {
    lagLimit : 150,
    linearValue : function(v1, v2, t, t1, t2) {
        var ratio = Math.max(-this.lagLimit, t2 - t) / (t2 - t1);
        return v1 * ratio + v2 * (1-ratio);
    },
    linearPosition : function(v1, v2, t, t1, t2) {
        return new Vector(this.linearValue(v1.x,v2.x,t,t1,t2), this.linearValue(v1.y,v2.y,t,t1,t2));
    },
    linearAng : function(a1, a2, t, t1, t2) {
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
    },
    linearGameState : function(lastRenderedState) {
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
        if (gameStates.length > 2) {
            buffer -= Math.max((gameStates.length - 3)*1000/60*framesPerTick,2);
        } else if (gameStates.length < 3) {

            buffer += 2;
        }

        var right = gameStates[rightIdx];
        var left = gameStates[rightIdx - 1];
        //console.log(Math.floor(1000/(right.time - left.time)));
        var out = JSON.parse(JSON.stringify(right));
        giveMethods(out);
        out.time = this.linearValue(left.time,right.time,displayTime,left.time,right.time);
        for (var i in out.players) {
            if (left.players[i] == undefined || right.players[i] == undefined) {
                continue;
            }
            out.players[i].pos = this.linearPosition(left.players[i].pos, right.players[i].pos, displayTime, left.time, right.time);
            if (displayTime > right.players[i].punchLastTime)
                out.players[i].punchAnimation = 30*Math.pow(0.9,(displayTime - right.players[i].punchLastTime)/20);
            else
                out.players[i].punchAnimation = 30*Math.pow(0.9,(displayTime - left.players[i].punchLastTime)/20);
            out.players[i].ang = this.linearAng(left.players[i].ang, right.players[i].ang, displayTime, left.time, right.time);
        }
        for (var i in out.weapons) {
            if (left.weapons[i] == undefined || right.weapons[i] == undefined) {
                continue;
            }
            out.weapons[i].pos = this.linearPosition(left.weapons[i].pos,right.weapons[i].pos, displayTime, left.time,right.time);
            //var arrIdx = arrayUnique(Object.keys(right.weapons[i].bullets).concat(Object.keys(left.weapons[i].bullets)));
            var arrIdx = Object.keys(right.weapons[i].bullets);
            for (var thing in arrIdx) {
                var j = arrIdx[thing];
                var rightBull;
                var leftBull;
                if (left.weapons[i].bullets[j] == undefined && right.weapons[i].bullets[j] == undefined)
                {
                    console.log(arrIdx, j)
                }
                else if (left.weapons[i].bullets[j] == undefined) {
                    rightBull = right.weapons[i].bullets[j];
                    leftBull = JSON.parse(JSON.stringify(rightBull));

                    giveMethods([rightBull, leftBull]);

                    var add = rightBull.vel.multiply(framesPerTick);
                    leftBull.pos = rightBull.pos.subtract(add);
                }
                else if (right.weapons[i].bullets[j] == undefined)
                {
                    leftBull = left.weapons[i].bullets[j];
                    rightBull = JSON.parse(JSON.stringify(leftBull));

                    giveMethods([rightBull, leftBull]);

                    var add = leftBull.vel.multiply(framesPerTick);
                    rightBull.pos = leftBull.pos.add(add);
                }
                else
                {
                    leftBull = left.weapons[i].bullets[j];
                    rightBull = right.weapons[i].bullets[j];
                }
                var bullet = out.weapons[i].bullets[j];
                if (bullet == undefined)
                {
                    out.weapons[i].bullets[j] = JSON.parse(JSON.stringify(leftBull));
                    giveMethods(out.weapons[i].bullets[j]);
                    bullet = out.weapons[i].bullets[j];
                }
                bullet.pos = this.linearPosition(leftBull.pos, rightBull.pos, displayTime, left.time, right.time);
                if (bullet.startPos.distanceTo(bullet.pos) < bullet.trailLength) {
                    bullet.tailPos = bullet.startPos;
                } else {
                    bullet.tailPos = bullet.pos.add((new Vector(-bullet.trailLength, 0)).rotate(bullet.ang));
                }
                if (bullet.hitPoint == -1 && lastRenderedState && lastRenderedState.weapons[i].bullets[j] && lastRenderedState.weapons[i].bullets[j].hitPoint)
                {
                    var newHitPoint = lastRenderedState.weapons[i].bullets[j].hitPoint;
                    if (bullet.startPos.distanceTo(bullet.pos) > bullet.startPos.distanceTo(newHitPoint))
                    {
                        bullet.hitPoint = new Vector(newHitPoint.x,newHitPoint.y);
                    }
                }
                if (bullet.hitPoint != -1 && bullet.startPos.distanceTo(bullet.pos) < bullet.startPos.distanceTo(bullet.hitPoint))
                {
                    bullet.hitPoint = -1;
                }
                else
                {
                    if (bullet.hitPoint != -1 && bullet.startPos.distanceTo(bullet.hitPoint) < bullet.startPos.distanceTo(bullet.tailPos) || bullet.startPos.distanceTo(rightBull.pos) < framesPerTick * bullet.vel.magnitude() * (right.time - displayTime) / (right.time - left.time))
                    {
                        delete out.weapons[i].bullets[j];
                    }
                    else
                    {
                        bullet.objectsIntersection(out);
                    }
                }
            }
            out.weapons[i].recoil = this.linearValue(left.weapons[i].recoil, right.weapons[i].recoil, displayTime, left.time, right.time);
        }
        out.snapWeapons();
        return out;
    }
};
var resetControls = function() {
    controlsBundle.justKeyDown = {};
    controlsBundle.justDowned = false;
}
setInterval(() => {
    if (gameStates && gameStates[gameStates.length - 1] && gameStates[gameStates.length - 1].players[controlId] && gameStates[gameStates.length - 1].players[controlId].alive)
    {
        emitMousePos();
    }
},20);
var lastDeadTime = -1;
var lastRenderedState = new GameState();
function updateGameArea() {
    myGameArea.clear();
    if (gameStates.length > 1) {
        
        var state = linearInterpolator.linearGameState(lastRenderedState);
        for (var i in state.weapons)
        {
            for (var j in state.weapons[i].bullets)
            {
                if (!state.weapons[i].bullets[j])
                {
                    delete state.weapons[i].bullets[j];
                }
                else
                {
                    var bullet = state.weapons[i].bullets[j];
                    lastRenderedState.weapons[i].bullets[j].hitPoint = lastRenderedState.weapons[i].bullets[j].hitPoint || bullet.hitPoint;
                }
            }
        }
        if (state.players[controlId] && state.players[controlId].alive) {
            lastDeadTime = -1;
        } else if (lastDeadTime == -1) {
            lastDeadTime = Date.now();
        } else if (Date.now() - lastDeadTime > 3000 && lastDeadTime != -2 || controlsBundle.keys[32]) {

            initialScreen.style.display = 'block';
        }


        drawer.update(state);
        state.render();

    }
    displayCrosshair();
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
function arrayUnique(array) {
    var a = array.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j--, 1);
        }
    }

    return a;
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
