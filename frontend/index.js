var gameWidth;
var gameHeight;
var gridWidth;
var buffer = 50;
var framesPerTick;

const socket = io('https://limitless-everglades-60126.herokuapp.com/');
//const socket = {on : function(){}};

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
var path3 = "img/ui/";
function imageExists(weapon, imageSrc, good, bad) {
    var img = new Image();
    img.onload = (() => {good(weapon,img);});
    img.onerror = (() => {bad();});
    img.src = imageSrc;
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
    weaponImages[i] = {};
    imageExists(i,path1 + i + ".svg",(j,img) => {
        weaponImages[j][true] = img;
    },()=>{
        
    });
    imageExists(i,path2 + i + ".svg",(j,img) => {
        weaponImages[j][false] = img;
    },()=>{
        
    });
}
var uiImages = {
    crosshair : 0
}
for (var i in uiImages)
{
    imageExists(i,path3 + i + ".svg",(j,img) => {
        uiImages[j] = img;
    },()=>{
        
    });
}
var viableWeapons;
socket.on('init', (msg) => {
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
    loadout.startNameToId(viableWeapons);
    loadout.updateWeaponClass(viableWeapons);
    loadout.updateElem();

    joinGameBtn.hidden = false;
    gameStates = [{}];
});
function combineObj(prev, obj)
{
    if (obj === null)
    {
        return undefined;
    }
    if (obj === undefined)
    {
        return prev;
    }
    if (prev == null || prev == undefined)
    {
        return obj;
    }
    if (typeof obj === "object" && typeof prev === "object")
    {
        var out = {};
        for (var field in prev)
        {
            var combinedField = combineObj(prev[field],obj[field]);
            if (combinedField !== undefined)
            {
                out[field] = combinedField;
            }
        }
        for (var field in obj)
        {
            if (prev[field] !== undefined)
            {
                continue;
            }
            var combinedField = combineObj(prev[field],obj[field]);
            if (combinedField !== undefined)
            {
                out[field] = combinedField;
            }
        }
        return out;
    }
    else
    {
        return obj;
    }
}
socket.on('gameState', (msg) => {
    var prevGameState = gameStates[gameStates.length - 1];
    
    tickIntervals.push(msg.time);
    if (tickIntervals.length > 6)
    {
        tickIntervals.shift();
    }
    tickInterval = (tickIntervals[tickIntervals.length - 1] - tickIntervals[0])/(tickIntervals.length - 1);
    msg = combineObj(prevGameState, msg);
    for(var i in msg.weapons)
    {
        var weapon = msg.weapons[i];
        Object.assign(weapon, viableWeapons[weapon.gunStats]);
        weapon.type = "Gun";
    }
    gameStates.push(msg);
    linearInterpolator.updateHitPointsFromState(msg);
});
socket.on('killFeed', (msg) => {
    var plyrs = gameStates[gameStates.length - 1].leaderboard;
    var shooterName = (plyrs[msg.shooter] ? plyrs[msg.shooter].name : "unknown");
    var deadName = (plyrs[msg.dead] ? plyrs[msg.dead].name : "unknown");
    if (plyrs[msg.shooter])
    {
        var message = shooterName + " killed " + deadName;
    }
    var killColor;
    if (msg.shooter == controlId)
    {
        killColor = "#8f8";
    }
    else if (msg.dead == controlId)
    {
        killColor = "#f66";
    }
    else
    {
        killColor = "#fff";
    }

    killFeed.add(message,killColor);

    if (msg.shooter == controlId)
    {
        yourKillFeed.add("You killed " + deadName);
    }
    else if (msg.dead == controlId)
    {
        yourKillFeed.add("You were killed by " + shooterName);
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
    killFeed.add(message,"#ccc");
});

var crossHair = {

    display : function() {
        myGameArea.transform(controlsBundle.mouse.x,controlsBundle.mouse.y, 0, this.size, () => {
            if (uiImages.crosshair)
            {
                myGameArea.context.drawImage(uiImages.crosshair, -1, -1, 2, 2);
            }
            
            else
            {
                
                (new Vector(1, 0)).drawLine(new Vector(-1, 0), '#fff', .13);
                (new Vector(0, 1)).drawLine(new Vector(0, -1), '#fff', .13);
                (new Vector(0, 0)).circle(.6, '#fff', .13);
            }
        });
        

    }
}
var loadout = {
    elem : document.getElementById("loadout"),
    primary : -1,
    secondary : -1,
    nameToId : {},
    weaponClasses : {},
    startNameToId : function(viableWeapons)
    {
        for (var i = 0, l = viableWeapons.length; i < l; i++)
        {
            this.nameToId[viableWeapons[i].name] = i;
        }
    },
    updateWeaponClass : function(viableWeapons)
    {
        this.weaponClasses = {};
        for (var i = 0, l = viableWeapons.length; i < l; i++)
        {
            var weapon = viableWeapons[i];
            var weaponClass = weapon.weaponClass;
            if (!this.weaponClasses[weaponClass])
            {
                this.weaponClasses[weaponClass] = [];
            }
            this.weaponClasses[weaponClass].push(weapon);
        }
    },
    updateElem : function()
    {
        while (this.elem.firstChild) {
            this.elem.removeChild(this.elem.firstChild);
        }

        var header = document.createElement("h2");
        header.appendChild(document.createTextNode("Loadout"));
        this.elem.appendChild(header);

        var primaryCollapse = document.createElement("button");
        primaryCollapse.type = "button";
        primaryCollapse.className = "mediumfont collapsible hoverableDarken";
        primaryCollapse.appendChild(document.createTextNode("Primary"));
        this.elem.appendChild(primaryCollapse);
        var primaryContent = document.createElement("div");
        primaryContent.className = "content";
        this.elem.appendChild(primaryContent);


        var secondaryCollapse = document.createElement("button");
        secondaryCollapse.type = "button";
        secondaryCollapse.className = "mediumfont collapsible hoverableDarken";
        secondaryCollapse.appendChild(document.createTextNode("Secondary"));
        this.elem.appendChild(secondaryCollapse);
        var secondaryContent = document.createElement("div");
        secondaryContent.className = "content";

        for (var i in this.weaponClasses)
        {
            var weapons = this.weaponClasses[i];
            if (i == "Secondary")
            {
                for (var j = 0, l = weapons.length; j < l; j++)
                {
                    var weapon = weapons[j];

                    var label = document.createElement("label");
                    label.className = "loadoutWeaponLabels";

                    var elem = document.createElement("input");
                    elem.type = "radio"
                    elem.className = "loadoutSelect";
                    elem.name = "Secondary";
                    elem.value = weapon.name;
                    if (weapon.name == "Glock 17")
                    {
                        elem.checked = true;
                    }
                    label.appendChild(elem);

                    var text = document.createElement("i");
                    text.appendChild(document.createTextNode(weapon.name));
                    label.appendChild(text);



                    secondaryContent.appendChild(label);
                    secondaryContent.appendChild(document.createElement("br"));
                }
            }
            else
            {
                var newCollapse = document.createElement("button");
                newCollapse.type = "button";
                newCollapse.className = "mediumfont collapsible hoverableDarken";
                newCollapse.appendChild(document.createTextNode(i));
                var content = document.createElement("div");
                content.className = "content";

                for (var j = 0, l = weapons.length; j < l; j++)
                {
                    var weapon = weapons[j];

                    var label = document.createElement("label");
                    label.className = "loadoutWeaponLabels";

                    var elem = document.createElement("input");
                    elem.type = "radio"
                    elem.className = "loadoutSelect";
                    elem.name = "Primary";
                    elem.value = weapon.name;
                    if (weapon.name == "AK-47")
                    {
                        elem.checked = true;
                    }
                    label.appendChild(elem);

                    var text = document.createElement("i");
                    text.appendChild(document.createTextNode(weapon.name));
                    label.appendChild(text);
                    content.appendChild(label);
                    content.appendChild(document.createElement("br"));
                }

                primaryContent.appendChild(newCollapse);
                primaryContent.appendChild(content);
            }
        }

        this.elem.appendChild(secondaryContent);

        var radios = document.querySelectorAll('input.loadoutSelect');

        var currentLoad = document.createElement("label");
        currentLoad.className = "currLoadout";
        currentLoad.appendChild(document.createTextNode(""));
        Array.prototype.forEach.call(radios, (function(radio) {
            var update = (function()
            {
               for (var i = 0; i < radios.length; i++)
               {
                   if (radios[i].checked)
                   {
                       if (radios[i].name == "Primary")
                       {
                            this.primary = this.nameToId[radios[i].value];
                       }
                       else
                       {
                           this.secondary = this.nameToId[radios[i].value];
                       }
                   }
               }
               currentLoad.innerHTML = viableWeapons[this.primary].name + " | " + viableWeapons[this.secondary].name;
           }).bind(this);
           update();
           radio.addEventListener('change', update.bind(this));
        }).bind(this));
        this.elem.insertBefore(currentLoad, header.nextSibling);
        this.elem.insertBefore(document.createElement("br"), currentLoad.nextSibling);
        this.elem.insertBefore(document.createElement("br"), currentLoad.nextSibling);

        giveHoverable();
        giveCollapsible();
    }
}
var settings = {
    crosshairSize : {
        minSize : 4,
        maxSize : 400,
        elem : document.getElementById("crosshairSize"),
        size : 10,
        calculate : function(){
            return this.minSize * Math.pow(this.maxSize/this.minSize,this.elem.value/100);
        },
        update : function() {
            crossHair.size = this.calculate();
        },
        start : function() {
            this.update();
            this.elem.oninput = this.update.bind(this);
        }
    },
    uiScale : {
        minSize : 0.2,
        maxSize : 2,
        elem : document.getElementById("uiScale"),
        size : 1,
        calculate : function(){
            return this.minSize * Math.pow(this.maxSize/this.minSize,this.elem.value/100);
        },
        update : function() {
            myGameArea.uiScale = this.calculate();
        },
        start : function() {
            this.update();
            this.elem.oninput = this.update.bind(this);
        }
    }
}
var killFeed = {
    list : [],
    scroll : 0,
    add : function(msg,color){
        this.list.splice(0, 0, {
            msg: msg,
            time: Date.now(),
            color: color
        });
        this.scroll += 1;
    },
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

            blackBoxedText(txt, "bold 16px Courier New", this.list[idx].color, 16, textPosX, textPosY, buffer, txtAlpha);
        }

    }
};
var yourKillFeed = {
    list : [],
    scroll : 0,
    add : function(msg){
        this.list.splice(0, 0, {
            msg: msg,
            time: Date.now()
        });
        this.scroll += 1;
    },
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


            var textPosX = myGameArea.uiWidth/2;
            var textPosY = myGameArea.uiHeight - 250 + (idx + 1 - this.scroll) * 30;

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

function startGame(){
    myGameArea.start();
    drawer = new Drawer();
    controlsBundle.start();
    for (var i in settings)
    {
        settings[i].start();
    }
    linearInterpolator.start();
    myGameArea.interval();
}
function joinGame() {
    lastDeadTime = -2;
    yourKillFeed.scroll = 0;
    yourKillFeed.list = [];

    killFeed.scroll = 0;
    initialScreen.style.display = "none";

    name = gameCodeInput.value.substring(0,18);
    color = colorInput.value;
    if (gameStates.length > 0 && (!gameStates[0].players[controlId] || !gameStates[0].players[controlId].alive))
    {
        newPlayer(name, color, loadout.primary, loadout.secondary);
    }
}

function newPlayer(name, color, prim, sec) {
    socket.emit('new player', {
        name: name,
        color: color,
        primary : prim,
        secondary : sec
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
    for (var i = sector[0] - Math.floor(myGameArea.uiWidth / (2 * drawer.scale * gridWidth)) - 2; i < sector[0] + Math.floor(myGameArea.uiWidth / (2 * drawer.scale * gridWidth)) + 3; i++) {
        if (i < 0 || i >= obstacles.length) {
            continue;
        }
        for (var j = sector[1] - Math.floor(myGameArea.uiHeight / (2 * drawer.scale * gridWidth)) - 2; j < sector[1] + Math.floor(myGameArea.uiHeight / (2 * drawer.scale * gridWidth)) + 3; j++) {
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
var loopThroughAllObstacles = function(inner) {
    for (var i in borderObstacles) {
        inner(borderObstacles[i]);
    }
    for (var i = 0; i < obstacles.length; i++) {
        for (var j = 0; j < obstacles[i].length; j++) {
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


function blackBoxedText(txt, font, color, size, posx, posy, buffer, txtAlpha, align) {
    ctx = myGameArea.context;
    ctx.save();
    ctx.globalAlpha = txtAlpha * 0.2;
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
    ctx.fillStyle = color;
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
    uiScale : 1,
    start: function() {
        //make the canvas and stuff.
        this.canvas = canvas;
        this.canvas.style.border = "none";

        this.canvas.style.margin = 0;
        this.canvas.style.padding = 0;

        this.canvas.width = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        this.canvas.height = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
        this.context = this.canvas.getContext('2d');
        window.oncontextmenu = function() {
            return false; // cancel default menu
        }
        this.time = Date.now();
        this.fpsUpdate = 10;
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
    scale : window.devicePixelRatio,
    clear: function() {
        this.canvas.width = window.innerWidth * this.scale;
        this.canvas.height = window.innerHeight * this.scale;

        this.canvas.style.width = window.innerWidth;
        this.canvas.style.height = window.innerHeight;

        this.scaleRatio = this.uiScale * (this.canvas.width + this.canvas.height)/2000;
        this.uiWidth = this.canvas.width/this.scaleRatio;
        this.uiHeight = this.canvas.height/this.scaleRatio;

        this.context.fillStyle = "#6aa150";
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    },
    transformUi : function(func){
        this.transform(0,0,0,this.scaleRatio,()=>{
            func();
        });
    },
    transform : function(x,y, dir,scl, func)
    {
        this.context.save();
        this.context.translate(x,y);
        this.context.rotate(dir);
        this.context.scale(scl,scl);
        func();
        this.context.restore();
    }
}
var controlsBundle = {
    keys: [],
    mouse: 0,
    mouseDown: false,
    prevAng: 0,
    ang: 0,
    sendControls : function(){
        return initialScreen.style.display == 'none' && gameStates.length > 0 && controlId && gameStates[0].players[controlId] && gameStates[0].players[controlId].alive;
    },
    importantKeys : [87,83,68,65,70,71,82,88,81],
    start: function() {
        controlsBundle.mouse = new Vector(0,0);
        window.addEventListener('keydown', (function(e) {
            this.keys = (this.keys || []);
            if (!this.keys[e.keyCode]) {
                this.keys[e.keyCode] = true;
                if (this.sendControls() && this.importantKeys.includes(e.keyCode))
                    socket.emit('keydown', e.keyCode);
            }
        }).bind(this));
        window.addEventListener('keyup', (function(e) {
            if (this.keys[e.keyCode]) {
                this.keys[e.keyCode] = false;
                if (this.sendControls() && this.importantKeys.includes(e.keyCode))
                    socket.emit('keyup', e.keyCode);
            }
        }).bind(this));

        const rect = myGameArea.canvas.getBoundingClientRect();
        window.addEventListener('mousemove', function(e) {
            controlsBundle.mouse = (new Vector(e.clientX - rect.left, e.clientY - rect.top)).multiply(myGameArea.scale);
            controlsBundle.ang = controlsBundle.mouse.subtract(new Vector(myGameArea.canvas.width, myGameArea.canvas.height).multiply(0.5)).ang();
            //socket.emit('mousemove', controlsBundle.ang);
        });
        window.addEventListener('mousedown', (function(e) {
            if (e.button == 0) {
                this.mouseDown = true;
                if (this.sendControls())
                    socket.emit('mousedown');
            }
        }).bind(this));
        window.addEventListener('mouseup', (function(e) {
            if (e.button == 0) {
                this.mouseDown = false;
                if (this.sendControls())
                    socket.emit('mouseup');
            }
        }).bind(this));
    },
    reset: function(){
        socket.emit('reset');
    }
}
var emitMousePos = function() {
    if (controlsBundle.sendControls())
    {
        socket.emit('mousemove', controlsBundle.ang);
        controlsBundle.prevAng = controlsBundle.ang;
    }
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
        myGameArea.transformUi(() => {
            drawer.transformPoint(() => {
                this.displayGrid(500);
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
                this.displayBullets(idx);
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
            });


            if (this.players[controlId] && initialScreen.style.display == "none")
            {
                this.displayWeaponPickup();
                this.displayHealthMeter();
                // this.displayReloadTime();
                this.displayBulletCount();
                //myGameArea.printFps();
                this.displayLoadout();
                this.displayMinimap();
                killFeed.display();
                yourKillFeed.display();
            }
            this.displayScoreBoard();
        });
    }
    this.displayGrid = function(delta)
    {
        var width = myGameArea.uiWidth/drawer.scale;
        var height = myGameArea.uiHeight/drawer.scale;
        var startX = Math.max(delta*Math.floor((drawer.scroll.x - width/2)/delta),0);
        var startY = Math.max(delta*Math.floor((drawer.scroll.y - height/2)/delta),0);

        var endX = Math.min(delta*(Math.floor((drawer.scroll.x + width/2)/delta)+1),gameWidth);
        var endY = Math.min(delta*(Math.floor((drawer.scroll.y + height/2)/delta) + 1),gameWidth);
        var ctx = myGameArea.context;
        ctx.lineWidth = 4;
        ctx.strokeStyle = "rgba(0,0,0,0.3)";
        for (var x = startX; x <= endX; x += delta)
        {
            ctx.beginPath();
            ctx.moveTo(x,startY);
            ctx.lineTo(x,endY);
            ctx.stroke();
        }
        for (var y = startY; y <= endY; y += delta)
        {
            ctx.beginPath();
            ctx.moveTo(startX,y);
            ctx.lineTo(endX,y);
            ctx.stroke();
        }
    }
    this.displayMinimap = function()
    {
        var height = 150;
        var scale = height/gameHeight;
        var width = gameWidth * scale;
        var startX = 20;
        var startY = myGameArea.uiHeight - height - 20;
        myGameArea.transform(startX,startY, 0, scale,() =>{
            myGameArea.context.globalAlpha = 0.6;
            myGameArea.context.fillStyle = "#6aa150";
            myGameArea.context.fillRect(0, 0, gameWidth, gameHeight);
            loopThroughAllObstacles((obstacle) => {
                obstacle.display(true);
            });
            myGameArea.transform(this.players[controlId].pos.x,this.players[controlId].pos.y,0,1,()=>{
                ctx.fillStyle = "rgba(255,255,255,1)";

                ctx.beginPath();
                ctx.arc(0, 0, 120,0,2*Math.PI);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = "rgba(255,255,255," + (this.minimapInfo[controlId] ? 1 - this.minimapInfo[controlId].fade : 0) + ")";
                ctx.beginPath();
                ctx.arc(0, 0, 160,0,2*Math.PI);
                ctx.closePath();
                ctx.fill();
            });
            for (var i in this.minimapInfo)
            {
                myGameArea.transform(this.minimapInfo[i].pos.x,this.minimapInfo[i].pos.y,0,1,()=>{
                    if (i != controlId)
                    {
                         ctx.fillStyle = "rgba(255,0,0," + (1 - this.minimapInfo[i].fade) + ")";
                        ctx.beginPath();
                        ctx.arc(0, 0, 120,0,2*Math.PI);
                        ctx.closePath();
                        ctx.fill();
                    }
                });
            }
        });
        
    }
    this.displayWeaponPickup = function()
    {
        var screenPos = (new Vector(myGameArea.uiWidth, myGameArea.uiHeight)).multiply(0.5).add(new Vector(0,60));
        var size = 14;
        var buffer = size * 0.3;
        var player = this.players[controlId];
        if (!player)
        {
            return;
        }
        var weaponId = -1;
        var minDist = player.reachDist;
        for (var i in this.weapons)
        {
            var weapon = this.weapons[i];
            var dist = weapon.pos.distanceTo(player.pos);
            if (!weapon.hold && dist < minDist)
            {
                minDist = dist;
                weaponId = i;
            }
        }
        if (weaponId == -1)
        {
            return;
        }
        var weapon = this.weapons[weaponId];

        //console.log(screenPos);
        blackBoxedText(weapon.name + " (" + weapon.weaponClass + ")",
                "bold " + size + "px Courier New",
                "#fff",
                size,
                screenPos.x, screenPos.y,
                buffer, 1, "center");
    }
    this.displayLoadout = function()
    {
        var player = this.players[controlId];
        var length = 180;
        var height = 60;
        var startX = myGameArea.uiWidth - 30 - length;
        var startY = myGameArea.uiHeight - 35 - 2 * height;
        ctx = myGameArea.context;
        ctx.save();
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = "#000";
        ctx.fillRect(startX, startY + height * player.slot, length, height);
        ctx.restore();
        for (var i in  player.weapons)
        {
            if (player.weapons[i] == -1)
            {
                continue;
            }
            var weapon = this.weapons[player.weapons[i]];
             var img = (weapon && weaponImages[weapon.name] && weaponImages[weapon.name][false] ? weaponImages[weapon.name][false] : false);
            var scale = weapon.length/img.naturalWidth;

            ctx.save();
            ctx.translate(startX  + length /2, startY + height * i + height/2);
            if (img)
                ctx.drawImage(img, scale * img.naturalWidth/-2, scale * img.naturalHeight / -2, scale * img.naturalWidth, scale * img.naturalHeight);
            else
            {
                ctx.fillStyle = "#000";
                ctx.fillRect(weapon.length/-2, 8/-2,weapon.length,8);
                ctx.fillStyle = weapon.color;
                ctx.fillRect(weapon.length/-2 +3/2, 5/-2,weapon.length - 3,5)
            }
            ctx.restore();
        }

    }
    this.displayHealthMeter = function()
    {
        var length = 300;
        var startX = 1/2 * myGameArea.uiWidth-length/2;
        var startY = myGameArea.uiHeight -75;
        var height = 40;
        var margin = 6;
        ctx = myGameArea.context;
        ctx.save();
        ctx.globalAlpha = 0.2;
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
        for (var i in this.leaderboard)
        {
            var stats = this.leaderboard[i];
            if (stats.alive)
            {
                displayObj.push({
                    id : i,
                    name: stats.name,
                    killstreak: stats.kills,
                    points: stats.points
                });
            }
        }
        displayObj.sort((a,b) => (b.points - a.points));

        var margin = 8;
        var height = 16;
        var maxLength = 10;
        var totalHeight = (Math.min(displayObj.length,maxLength) + 2)*(margin + height) + margin;
        var totalWidth = 280;
        var startX = myGameArea.uiWidth - 300;
        var startY = 20;
        var split1 = 180;

        var ctx = myGameArea.context;
        ctx.save();
        ctx.globalAlpha = 0.2;
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
        ctx.fillText("Plyrs:" + displayObj.length,  startX + totalWidth - margin, y + 3/4 * height);

        y += margin + height;
        ctx.textAlign = "center";
        ctx.fillText("Leaderboard",  startX + totalWidth/2, y + 3/4 * height);


        y += margin + height;
        for (var i = 0; i < Math.min(displayObj.length,maxLength); i++)
        {
            var playerStats = displayObj[i];
            ctx.fillStyle = (playerStats.id == controlId ? "#8f8" : "#fff");

            ctx.textAlign = "left";
            var name = (playerStats.name.length > 11 ? playerStats.name.substring(0,10) + "\u2026" : playerStats.name);
            ctx.fillText(i + 1 + ". " + name + ":", startX + margin, y + 3/4 * height);
            ctx.fillText(playerStats.killstreak, startX + split1, y + 3/4 * height);
            ctx.textAlign = "right";
            ctx.fillText(Math.floor(playerStats.points + 0.0000001), startX + totalWidth - margin, y + 3/4 * height);

            y += margin + height;
        }
    }
    this.displayPlayer = function(i, minimap) {
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

        if (!minimap)
        {
            var ang = player.ang;
            var rotAng1 = 0;
            var rotAng2 = 0.25*Math.PI;

            var firstShoulder;
            var secondShoulder;
            var firstHand;
            var secondHand;
            if (player.weapon != -1) {
                var weapon = this.weapons[player.weapon];
                firstShoulder = (new Vector(0, player.radius + 2)).rotate(rotAng1);
                secondShoulder = (new Vector(0, -player.radius-2)).rotate(rotAng2);
                firstHand = weapon.handPos1.add(new Vector(weapon.buttPosition -this.weapons[player.weapon].recoil, 0));
                secondHand = weapon.handPos2.add(new Vector(weapon.buttPosition-this.weapons[player.weapon].recoil, 0));

            } else {
                firstShoulder = (new Vector(0, player.radius + 2)).rotate(0);
                secondShoulder = (new Vector(0, -player.radius - 2)).rotate(0);
                firstHand = (new Vector(player.radius * 0.85, player.radius * 0.8)).add((new Vector(player.punchAnimation, 0)).rotate(-Math.PI / 6));
                secondHand = new Vector(player.radius * 0.85, -player.radius * 0.8);

            }
            myGameArea.transform(player.pos.x,player.pos.y,player.ang,1,()=>{
                ctx.fillStyle = '#000';
                ctx.strokeStyle = '#000';

                ctx.beginPath();
                ctx.arc(firstShoulder.x, firstShoulder.y, 14/2, 0, 2 * Math.PI);
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.arc(secondShoulder.x, secondShoulder.y, 14/2, 0, 2 * Math.PI);
                ctx.closePath();
                ctx.fill();

                ctx.lineWidth = 13;
                ctx.beginPath();
                ctx.moveTo(firstShoulder.x, firstShoulder.y);
                ctx.lineTo(firstHand.x,firstHand.y);
                ctx.closePath();
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(secondShoulder.x, secondShoulder.y);
                ctx.lineTo(secondHand.x,secondHand.y);
                ctx.closePath();
                ctx.stroke();

                ctx.fillStyle = player.color;
                ctx.strokeStyle = player.color;

                ctx.beginPath();
                ctx.arc(firstShoulder.x, firstShoulder.y, 10/2, 0, 2 * Math.PI);
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.arc(secondShoulder.x, secondShoulder.y, 10/2, 0, 2 * Math.PI);
                ctx.closePath();
                ctx.fill();

                ctx.lineWidth = 9;
                ctx.beginPath();
                ctx.moveTo(firstShoulder.x, firstShoulder.y);
                ctx.lineTo(firstHand.x,firstHand.y);
                ctx.closePath();
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(secondShoulder.x, secondShoulder.y);
                ctx.lineTo(secondHand.x,secondHand.y);
                ctx.closePath();
                ctx.stroke();

                ctx.fillStyle = "#000";
                ctx.beginPath();
                ctx.arc(firstHand.x, firstHand.y, 16/2,0,2*Math.PI);
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.arc(secondHand.x, secondHand.y, 16/2,0,2*Math.PI);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = player.color;
                ctx.beginPath();
                ctx.arc(firstHand.x, firstHand.y, 12/2,0,2*Math.PI);
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.arc(secondHand.x, secondHand.y, 12/2,0,2*Math.PI);
                ctx.closePath();
                ctx.fill();
            });

            if (player.weapon != -1)
            {
                this.displayWeapon(player.weapon);
            }

            myGameArea.transform(player.pos.x,player.pos.y,player.ang,1,()=>{
                ctx.strokeStyle = '#000';
                ctx.lineWidth =  2;
                ctx.fillStyle = player.color;
                ctx.beginPath();
                ctx.arc(0, 0, player.radius,0,2*Math.PI);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                
            });
        }
        else
        {
            myGameArea.transform(player.pos.x,player.pos.y,player.ang,1,()=>{
                ctx.fillStyle = (i == controlId ? "#00f" : "#f00");
                ctx.beginPath();
                ctx.arc(0, 0, (i == controlId ? 8 : 6) * player.radius,0,2*Math.PI);
                ctx.closePath();
                ctx.fill();
            });
        }
    }
    this.displayWeapon = function(i) {
        var weapon = this.weapons[i];

        var ctx = myGameArea.context;

        myGameArea.transform(weapon.pos.x,weapon.pos.y,weapon.ang,1,()=>{
            if (!weapon.hold) {
                ctx.strokeStyle = weapon.color;
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(0,0, 30, 0, 2*Math.PI);
                ctx.closePath();
                ctx.stroke();
            }
            if (weaponImages[weapon.name] && weaponImages[weapon.name][weapon.hold])
            {
                var fat = 1;
                var img = weaponImages[weapon.name][weapon.hold];
                ctx.drawImage(img, weapon.length/-2, fat*weapon.length * img.naturalHeight/img.naturalWidth / -2, weapon.length, fat*weapon.length * img.naturalHeight/img.naturalWidth);
            }
            else
            {
                ctx.strokeStyle = "#000";
                ctx.lineWidth = 8;
                ctx.beginPath();
                ctx.moveTo(-weapon.length / 2, 0);
                ctx.lineTo(weapon.length / 2, 0);
                ctx.closePath();
                ctx.stroke();


                ctx.strokeStyle = weapon.color;
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.moveTo(-weapon.length / 2 + 1.5, 0);
                ctx.lineTo(weapon.length / 2 - 1.5, 0);
                ctx.closePath();
                ctx.stroke();
            }
        })

    }
    this.displayBullets = function() {
        for (var j in this.bullets) {
            if (this.bullets[j])
                this.bullets[j].display();
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
                "#fff",
                size,
                myGameArea.uiWidth / 2, myGameArea.uiHeight - 100,
                buffer, 1, "center");
            if (weapon.reloadStartTime != -1) {
                var frac = Math.min(Math.max((this.time - weapon.reloadStartTime) / weapon.reloadTime,0),1);
                var ctx = myGameArea.context;
                ctx.save();

                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.moveTo(myGameArea.uiWidth / 2 - width / 2 - buffer, myGameArea.uiHeight - 100 - 3 / 4 * size - buffer);
                ctx.lineTo(myGameArea.uiWidth / 2 + width / 2 + buffer - (width + 20) * frac, myGameArea.uiHeight - 100 - 3 / 4 * size - buffer);
                ctx.closePath();
                ctx.stroke();
                ctx.restore();
            }
        }
    }

    this.displayName = function(i) {

        var player = this.players[i];
        var pos = player.pos.add(new Vector(0, 50));
        blackBoxedText(player.name, "bold 20px Courier New", "#fff",20, pos.x, pos.y, 5, 1, 'center');
    }
    this.snapWeapons = function() {
        for (var i in this.players) {
            if (this.players[i].weapon == -1 || this.weapons[this.players[i].weapon] == undefined) {
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
         ctx.lineWidth = 8;
         ctx.beginPath();
         ctx.moveTo(right.x,right.y);
         ctx.lineTo(mid.x,mid.y);
         ctx.closePath();
         ctx.stroke();

         ctx.strokeStyle = '#0f0';
         ctx.beginPath();
         ctx.moveTo(left.x,left.y);
         ctx.lineTo(mid.x,mid.y);
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

        myGameArea.transform(this.pos.x,this.pos.y,this.ang, 1, ()=>{
            const g = ctx.createLinearGradient(0,0, -this.trailLength, 0);
            if (this.ammoType == 'bullet')
            {
                g.addColorStop(0, hexToRgbA(this.color, 1)); // opaque
                g.addColorStop(0.07/3, hexToRgbA(this.color, 1)); // opaque
                g.addColorStop(0.14/3, hexToRgbA('#ccc', 0.35)); // opaque
                g.addColorStop(2/3, hexToRgbA('#ccc', 0)); // transparent
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
                g.addColorStop(0.07, hexToRgbA(this.color, 1)); // transparent
                g.addColorStop(0.1, hexToRgbA(this.color, 0)); // transparent
            }
            ctx.strokeStyle = g;
            ctx.lineWidth = this.width;
            ctx.beginPath();
            if (this.hitPoint != -1)
            {
                ctx.moveTo(-this.hitPoint.distanceTo(this.pos), 0);
            }
            else
            {
                ctx.moveTo(0,0);
            }

            ctx.lineTo(-Math.min(this.trailLength,this.startPos.distanceTo(this.pos)),0);
            ctx.closePath();
            ctx.stroke();
        });

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

    this.transform = function(point) {
        return point.subtract(this.scroll).multiply(this.scale).add((new Vector(myGameArea.uiWidth, myGameArea.uiHeight)).multiply(0.5));
    }
    this.transformPoint = function(func)
    {
        myGameArea.transform(myGameArea.uiWidth/2,myGameArea.uiHeight/2,0,this.scale,()=>{
            myGameArea.transform(-this.scroll.x,-this.scroll.y,0,1, func);
        });
    }

    this.update = function(state) {

        character = state.players[controlId];
        if (character)
        {
            this.scroll = character.pos.add((new Vector(Math.random() - 0.5, Math.random() - 0.5)).multiply(this.screenShake));
            var maxWidth = 2400 / this.zoom;
            var maxHeight = maxWidth * 9/16;
            this.targetScale = Math.max(myGameArea.uiWidth/maxWidth,myGameArea.uiHeight/maxHeight);
        }
        else
        {
            this.scroll = (new Vector(gameWidth,gameHeight)).multiply(0.5).add((new Vector(Math.random() - 0.5, Math.random() - 0.5)).multiply(this.screenShake));
            this.targetScale =  (Math.max(myGameArea.uiWidth,myGameArea.uiHeight))/Math.max(gameWidth,gameHeight);
        }
        if (this.scale > this.targetScale )
            this.scale *= Math.pow(this.targetScale / this.scale, 0.1);
        else
            this.scale = this.targetScale;
    }
}
var Obstacle = function() {
    this.type = "Obstacle";
    this.display = function(onMinimap) {
        var ctx = myGameArea.context;

        ctx.fillStyle = this.color;
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.vs[0].x,this.vs[0].y);
        for (var i = 1; i < this.vs.length; i++) {
            ctx.lineTo(this.vs[i].x,this.vs[i].y);
        }
        ctx.closePath();
        ctx.fill();
        if (this.intersectable && !onMinimap) {
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
var linearInterpolator = {
    lagLimit : 300,
    ping : Infinity,
    buffers : [],
    pingServer : function(){
        socket.emit('pingServer',Date.now());
        console.log("ping");
    },
    updateBuffer : function(){
        var average = 0;
        for (var i = 0, l = this.buffers.length; i < l; i++)
        {
            average += this.buffers[i];
        }
        average /= this.buffers.length;
        buffer = average;
    },
    addToBuffers : function(elem){
        this.buffers.push(elem);
        if (this.buffers.length > 3)
            this.buffers.shift();
    },
    start : function(){
        socket.on('pongClient', (function(msg){
            this.ping = (Date.now() - msg.clientSend)/2;
            var serverRecieveTime = (Date.now() + msg.clientSend)/2;
            this.addToBuffers(msg.recieveTime - serverRecieveTime);
            this.updateBuffer();
            console.log("pong");
        }).bind(this));
        setInterval(this.pingServer.bind(this),1000);
    },
    weaponBulletHitPoints : {},
    updateHitPointsFromState : function(state){
        for (var j in state.bullets)
        {
            var bullet = state.bullets[j];
            if (bullet.hitPoint == -1)
            {
                try{
                    delete this.weaponBulletHitPoints[j];
                }
                catch{}
            }
            else
            {
                if (!this.weaponBulletHitPoints)
                {
                    this.weaponBulletHitPoints = {};
                }
                this.weaponBulletHitPoints[j] = bullet.hitPoint;
            }
        }
    },
    manageHitPoints : function(state){
        for (var j in state.bullets)
        {
            var bullet = state.bullets[j];
            if (bullet.hitPoint != -1 && !this.weaponBulletHitPoints[j])
            {
                this.weaponBulletHitPoints[j] = bullet.hitPoint;
            }
        }
        for (var j in this.weaponBulletHitPoints)
        {
            if (!state.bullets[j])
            {
                try{
                    delete this.weaponBulletHitPoints[j];
                }
                catch{}
            }
        }
    },
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
    linearGameState : function() {
        var displayTime = Date.now() + buffer;
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

        var right = gameStates[rightIdx];
        var left = gameStates[rightIdx - 1];
        //console.log(Math.floor(1000/(right.time - left.time)));
        var out = JSON.parse(JSON.stringify(right));
        giveMethods(out);
        out.time = this.linearValue(left.time,right.time,displayTime,left.time,right.time);
        for (var i in out.players) {
            if (left.players[i] == undefined || right.players[i] == undefined || !left.players[i].alive) {
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
            if (!right.weapons[i].hold && !left.weapons[i].hold)
                out.weapons[i].pos = this.linearPosition(left.weapons[i].pos,right.weapons[i].pos, displayTime, left.time,right.time);
            //var arrIdx = arrayUnique(Object.keys(right.weapons[i].bullets).concat(Object.keys(left.weapons[i].bullets)));
            
            out.weapons[i].recoil = this.linearValue(left.weapons[i].recoil, right.weapons[i].recoil, displayTime, left.time, right.time);
        }
        for (var j in out.bullets) {
            var rightBull;
            var leftBull;
            if (left.bullets[j] == undefined && right.bullets[j] == undefined)
            {
                console.log(arrIdx, j)
            }
            else if (left.bullets[j] == undefined) {
                rightBull = right.bullets[j];
                leftBull = JSON.parse(JSON.stringify(rightBull));

                giveMethods([rightBull, leftBull]);

                var add = rightBull.vel.multiply(framesPerTick);
                leftBull.pos = rightBull.pos.subtract(add);
            }
            else if (right.bullets[j] == undefined)
            {
                leftBull = left.bullets[j];
                rightBull = JSON.parse(JSON.stringify(leftBull));

                giveMethods([rightBull, leftBull]);

                var add = leftBull.vel.multiply(framesPerTick);
                rightBull.pos = leftBull.pos.add(add);
            }
            else
            {
                leftBull = left.bullets[j];
                rightBull = right.bullets[j];
            }
            var bullet = out.bullets[j];
            giveMethods(bullet);
            if (bullet == undefined)
            {
                out.bullets[j] = JSON.parse(JSON.stringify(leftBull));
                giveMethods(out.bullets[j]);
                bullet = out.bullets[j];
            }
            bullet.pos = this.linearPosition(leftBull.pos, rightBull.pos, displayTime, left.time, right.time);
            if (bullet.startPos.onSegment(bullet.pos,bullet.tailPos)) {
                bullet.tailPos = bullet.startPos;
            } else {
                bullet.tailPos = bullet.pos.add((new Vector(-bullet.trailLength, 0)).rotate(bullet.ang));
            }
            if (bullet.hitPoint == -1)
            {
                if (this.weaponBulletHitPoints && this.weaponBulletHitPoints[j])
                {
                    var newHitPoint = this.weaponBulletHitPoints[j];
                    giveMethods(newHitPoint);
                    if (newHitPoint.onSegment(bullet.startPos,bullet.pos))
                    {
                        bullet.hitPoint = new Vector(newHitPoint.x,newHitPoint.y);
                    }
                }
                else{
                    bullet.objectsIntersection(out);
                }
            }
            if (bullet.pos.onSegment(bullet.startPos,bullet.hitPoint))
            {
                bullet.hitPoint = -1;
            }
            else if (bullet.hitPoint != -1 && bullet.hitPoint.onSegment(bullet.startPos, bullet.tailPos) || bullet.pos.onSegment(bullet.startPos,bullet.tailPos))
            {
                delete out.bullets[j];
            }
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

function updateGameArea() {
    myGameArea.clear();
    if (gameStates.length > 1) {

        var state = linearInterpolator.linearGameState();
        linearInterpolator.manageHitPoints(state);
        if (state.players[controlId] && state.players[controlId].alive) {
            lastDeadTime = -1;
        } else if (lastDeadTime == -1) {
            lastDeadTime = Date.now();
        } else if (Date.now() - lastDeadTime > 4000 && lastDeadTime != -2 ) {

            initialScreen.style.display = 'block';
        }
        if (controlsBundle.keys[27])
        {
            initialScreen.style.display = 'block';
            controlsBundle.reset();
        }


        drawer.update(state);
        state.render();

    }
    crossHair.display();
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
