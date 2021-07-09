const gameWidth = 3000;
const gameHeight = 3000;
const numOb = 45;
const numHouse1 = 8;
const numHouse2 = 8;
const gridWidth = 250;
const framesPerTick = 2;

const io = require('socket.io')();
const words = {
    adjectives : ["aback","abaft","abandoned","abashed","aberrant","abhorrent","abiding","abject","ablaze","able","abnormal","aboard","aboriginal","abortive","abounding","abrasive","abrupt","absent","absorbed","absorbing","abstracted","absurd","abundant","abusive","acceptable","accessible","accidental","accurate","acid","acidic","acoustic","acrid","actually","ad","hoc","adamant","adaptable","addicted","adhesive","adjoining","adorable","adventurous","afraid","aggressive","agonizing","agreeable","ahead","ajar","alcoholic","alert","alike","alive","alleged","alluring","aloof","amazing","ambiguous","ambitious","amuck","amused","amusing","ancient","angry","animated","annoyed","annoying","anxious","apathetic","aquatic","aromatic","arrogant","ashamed","aspiring","assorted","astonishing","attractive","auspicious","automatic","available","average","awake","aware","awesome","awful","axiomatic","bad","barbarous","bashful","bawdy","beautiful","befitting","belligerent","beneficial","bent","berserk","best","better","bewildered","big","billowy","bite-sized","bitter","bizarre","black","black-and-white","bloody","blue","blue-eyed","blushing","boiling","boorish","bored","boring","bouncy","boundless","brainy","brash","brave","brawny","breakable","breezy","brief","bright","bright","broad","broken","brown","bumpy","burly","bustling","busy","cagey","calculating","callous","calm","capable","capricious","careful","careless","caring","cautious","ceaseless","certain","changeable","charming","cheap","cheerful","chemical","chief","childlike","chilly","chivalrous","chubby","chunky","clammy","classy","clean","clear","clever","cloistered","cloudy","closed","clumsy","cluttered","coherent","cold","colorful","colossal","combative","comfortable","common","complete","complex","concerned","condemned","confused","conscious","cooing","cool","cooperative","coordinated","courageous","cowardly","crabby","craven","crazy","creepy","crooked","crowded","cruel","cuddly","cultured","cumbersome","curious","curly","curved","curvy","cut","cute","cute","cynical","daffy","daily","damaged","damaging","damp","dangerous","dapper","dark","dashing","dazzling","dead","deadpan","deafening","dear","debonair","decisive","decorous","deep","deeply","defeated","defective","defiant","delicate","delicious","delightful","demonic","delirious","dependent","depressed","deranged","descriptive","deserted","detailed","determined","devilish","didactic","different","difficult","diligent","direful","dirty","disagreeable","disastrous","discreet","disgusted","disgusting","disillusioned","dispensable","distinct","disturbed","divergent","dizzy","domineering","doubtful","drab","draconian","dramatic","dreary","drunk","dry","dull","dusty","dynamic","dysfunctional","eager","early","earsplitting","earthy","easy","eatable","economic","educated","efficacious","efficient","eight","elastic","elated","elderly","electric","elegant","elfin","elite","embarrassed","eminent","empty","enchanted","enchanting","encouraging","endurable","energetic","enormous","entertaining","enthusiastic","envious","equable","equal","erect","erratic","ethereal","evanescent","evasive","even excellent excited","exciting exclusive","exotic","expensive","extra-large extra-small exuberant","exultant","fabulous","faded","faint fair","faithful","fallacious","false familiar famous","fanatical","fancy","fantastic","far"," far-flung"," fascinated","fast","fat faulty","fearful fearless","feeble feigned","female fertile","festive","few fierce","filthy","fine","finicky","first"," five"," fixed"," flagrant","flaky","flashy","flat","flawless","flimsy"," flippant","flowery","fluffy","fluttering"," foamy","foolish","foregoing","forgetful","fortunate","four frail","fragile","frantic","free"," freezing"," frequent"," fresh"," fretful","friendly","frightened frightening full fumbling functional","funny","furry furtive","future futuristic","fuzzy ","gabby","gainful","gamy","gaping","garrulous","gaudy","general gentle","giant","giddy","gifted","gigantic","glamorous","gleaming","glib","glistening glorious","glossy","godly","good","goofy","gorgeous","graceful","grandiose","grateful gratis","gray greasy great","greedy","green grey grieving","groovy","grotesque","grouchy","grubby gruesome","grumpy","guarded","guiltless","gullible gusty","guttural H habitual","half","hallowed","halting","handsome","handsomely","handy","hanging","hapless","happy","hard","hard-to-find","harmonious","harsh","hateful","heady","healthy","heartbreaking","heavenly heavy hellish","helpful","helpless","hesitant","hideous high","highfalutin","high-pitched","hilarious","hissing","historical","holistic","hollow","homeless","homely","honorable","horrible","hospitable","hot huge","hulking","humdrum","humorous","hungry","hurried","hurt","hushed","husky","hypnotic","hysterical","icky","icy","idiotic","ignorant","ill","illegal","ill-fated","ill-informed","illustrious","imaginary","immense","imminent","impartial","imperfect","impolite","important","imported","impossible","incandescent","incompetent","inconclusive","industrious","incredible","inexpensive","infamous","innate","innocent","inquisitive","insidious","instinctive","intelligent","interesting","internal","invincible","irate","irritating","itchy","jaded","jagged","jazzy","jealous","jittery","jobless","jolly","joyous","judicious","juicy","jumbled","jumpy","juvenile","kaput","keen","kind","kindhearted","kindly","knotty","knowing","knowledgeable","known","labored","lackadaisical","lacking","lame","lamentable","languid","large","last","late","laughable","lavish","lazy","lean","learned","left","legal","lethal","level","lewd","light","like","likeable","limping","literate","little","lively","lively","living","lonely","long","longing","long-term","loose","lopsided","loud","loutish","lovely","loving","low","lowly","lucky","ludicrous","lumpy","lush","luxuriant","lying","lyrical","macabre","macho","maddening","madly","magenta","magical","magnificent","majestic","makeshift","male","malicious","mammoth","maniacal","many","marked","massive","married","marvelous","material","materialistic","mature","mean","measly","meaty","medical","meek","mellow","melodic","melted","merciful","mere","messy","mighty","military","milky","mindless","miniature","minor","miscreant","misty","mixed","moaning","modern","moldy","momentous","motionless","mountainous","muddled","mundane","murky","mushy","mute","mysterious","naive","nappy","narrow","nasty","natural","naughty","nauseating","near","neat","nebulous","necessary","needless","needy","neighborly","nervous","new","next","nice","nifty","nimble","nine","nippy","noiseless","noisy","nonchalant","nondescript","nonstop","normal","nostalgic","nosy","noxious","null","numberless","numerous","nutritious","nutty","oafish","obedient","obeisant","obese","obnoxious","obscene","obsequious","observant","obsolete","obtainable","oceanic","odd","offbeat","old","old-fashioned","omniscient","one","onerous","open","opposite","optimal","orange","ordinary","organic","ossified","outgoing","outrageous","outstanding","oval","overconfident","overjoyed","overrated","overt","overwrought","painful","painstaking","pale","paltry","panicky","panoramic","parallel","parched","parsimonious","past","pastoral","pathetic","peaceful","penitent","perfect","periodic","permissible","perpetual","petite","petite","phobic","physical","picayune","pink","piquant","placid","plain","plant","plastic","plausible","pleasant","plucky","pointless","poised","polite","political","poor","possessive","possible","powerful","precious","premium","present","pretty","previous","pricey","prickly","private","probable","productive","profuse","protective","proud","psychedelic","psychotic","public","puffy","pumped","puny","purple","purring","pushy","puzzled","puzzling","quack","quaint","quarrelsome","questionable","quick","quickest","quiet","quirky","quixotic","quizzical","rabid","racial","ragged","rainy","rambunctious","rampant","rapid","rare","raspy","ratty","ready","real","rebel","receptive","recondite","red","redundant","reflective","regular","relieved","remarkable","reminiscent","repulsive","resolute","resonant","responsible","rhetorical","rich","right","righteous","rightful","rigid","ripe","ritzy","roasted","robust","romantic","roomy","rotten","rough","round","royal","ruddy","rude","rural","rustic","ruthless","sable","sad","safe","salty","same","sassy","satisfying","savory","scandalous","scarce","scared","scary","scattered","scientific","scintillating","scrawny","screeching","second","second-hand","secret","secretive","sedate","seemly","selective","selfish","separate","serious","shaggy","shaky","shallow","sharp","shiny","shivering","shocking","short","shrill","shut","shy","sick","silent","silent","silky","silly","simple","simplistic","sincere","six","skillful","skinny","sleepy","slim","slimy","slippery","sloppy","slow","small","smart","smelly","smiling","smoggy","smooth","sneaky","snobbish","snotty","soft","soggy","solid","somber","sophisticated","sordid","sore","sore","sour","sparkling","special","spectacular","spicy","spiffy","spiky","spiritual","spiteful","splendid","spooky","spotless","spotted","spotty","spurious","squalid","square","squealing","squeamish","staking","stale","standing","statuesque","steadfast","steady","steep","stereotyped","sticky","stiff","stimulating","stingy","stormy","straight","strange","striped","strong","stupendous","stupid","sturdy","subdued","subsequent","substantial","successful","succinct","sudden","sulky","super","superb","superficial","supreme","swanky","sweet","sweltering","swift","symptomatic","synonymous","taboo","tacit","tacky","talented","tall","tame","tan","tangible","tangy","tart","tasteful","tasteless","tasty","tawdry","tearful","tedious","teeny","teeny-tiny","telling","temporary","ten","tender tense","tense","tenuous","terrible","terrific","tested","testy","thankful","therapeutic","thick","thin","thinkable","third","thirsty","thoughtful","thoughtless","threatening","three","thundering","tidy","tight","tightfisted","tiny","tired","tiresome","toothsome","torpid","tough","towering","tranquil","trashy","tremendous","tricky","trite","troubled","truculent","true","truthful","two","typical","ubiquitous","ugliest","ugly","ultra","unable","unaccountable","unadvised","unarmed","unbecoming","unbiased","uncovered","understood","undesirable","unequal","unequaled","uneven","unhealthy","uninterested","unique","unkempt","unknown","unnatural","unruly","unsightly","unsuitable","untidy","unused","unusual","unwieldy","unwritten","upbeat","uppity","upset","uptight","used","useful","useless","utopian","utter","uttermost","vacuous","vagabond","vague","valuable","various","vast","vengeful","venomous","verdant","versed","victorious","vigorous","violent","violet","vivacious","voiceless","volatile","voracious","vulgar","wacky","waggish","waiting","","wakeful","wandering","wanting","warlike","warm","wary","wasteful","watery","weak","wealthy","weary","well-groomed","well-made","well-off","well-to-do","wet","whimsical","whispering","white","whole","wholesale","wicked","wide","wide-eyed","wiggly","wild","willing","windy","wiry","wise","wistful","witty","woebegone","womanly","wonderful","wooden","woozy","workable","worried","worthless","wrathful","wretched","wrong","wry","xenophobic","yellow","yielding","young","youthful","yummy","zany","zealous","zesty","zippy","zonked"],
    nouns : ["canidae","felidae","cat","cattle","dog","donkey","goat","horse","pig","rabbit","aardvark","aardwolf","albatross","alligator","alpaca","amphibian","anaconda","angelfish","anglerfish","ant","anteater","antelope","antlion","ape","aphid","armadillo","asp","baboon","badger","bandicoot","barnacle","barracuda","basilisk","bass","bat","bear","beaver","bedbug","bee","beetle","bird","bison","blackbird","boa","boar","bobcat","bobolink","bonobo","booby","bovid","bug","butterfly","buzzard","camel","canid","capybara","cardinal","caribou","carp","cat","catshark","caterpillar","catfish","cattle","centipede","cephalopod","chameleon","cheetah","chickadee","chicken","chimpanzee","chinchilla","chipmunk","clam","clownfish","cobra","cockroach","cod","condor","constrictor","coral","cougar","cow","coyote","crab","crane","crawdad","crayfish","cricket","crocodile","crow","cuckoo","cicada","damselfly","deer","dingo","dinosaur","dog","dolphin","donkey","dormouse","dove","dragonfly","dragon","duck","eagle","earthworm","earwig","echidna","eel","egret","elephant","elk","emu","ermine","falcon","ferret","finch","firefly","fish","flamingo","flea","fly","flyingfish","fowl","fox","frog","gamefowl","galliform","gazelle","gecko","gerbil","gibbon","giraffe","goat","goldfish","goose","gopher","gorilla","grasshopper","grouse","guan","guanaco","guineafowl","gull","guppy","haddock","halibut","hamster","hare","harrier","hawk","hedgehog","heron","herring","hippopotamus","hookworm","hornet","horse","hoverfly","hummingbird","hyena","iguana","impala","jackal","jaguar","jay","jellyfish","junglefowl","kangaroo","kingfisher","kite","kiwi","koala","koi","krill","ladybug","lamprey","landfowl","lark","leech","lemming","lemur","leopard","leopon","limpet","lion","lizard","llama","lobster","locust","loon","louse","lungfish","lynx","macaw","mackerel","magpie","mammal","manatee","mandrill","marlin","marmoset","marmot","marsupial","marten","mastodon","meadowlark","meerkat","mink","minnow","mite","mockingbird","mole","mollusk","mongoose","monkey","moose","mosquito","moth","mouse","mule","muskox","narwhal","newt","nightingale","ocelot","octopus","opossum","orangutan","orca","ostrich","otter","owl","ox","panda","panther","parakeet","parrot","parrotfish","partridge","peacock","peafowl","pelican","penguin","perch","pheasant","pig","pigeon","pike","pinniped","piranha","planarian","platypus","pony","porcupine","porpoise","possum","prawn","primate","ptarmigan","puffin","puma","python","quail","quelea","quokka","rabbit","raccoon","rat","rattlesnake","raven","reindeer","reptile","rhinoceros","roadrunner","rodent","rook","rooster","roundworm","sailfish","salamander","salmon","sawfish","scallop","scorpion","seahorse","shark","sheep","shrew","shrimp","silkworm","silverfish","skink","skunk","sloth","slug","smelt","snail","snake","snipe","sole","sparrow","spider","spoonbill","squid","squirrel","starfish","stingray","stoat","stork","sturgeon","swallow","swan","swift","swordfish","swordtail","tahr","takin","tapir","tarantula","tarsier","termite","tern","thrush","tick","tiger","tiglon","toad","tortoise","toucan","trout","tuna","turkey","turtle","tyrannosaurus","urial","vicuna","viper","vole","vulture","wallaby","walrus","wasp","warbler","weasel","whale","whippet","whitefish","wildcat","wildebeest","wildfowl","wolf","wolverine","wombat","woodpecker","worm","wren","xerinae","yak","zebra","alpaca","cat","cattle","chicken","dog","donkey","ferret","gayal","goldfish","guppy","horse","koi","llama","sheep","yak"],
    randomName : function(){
        return this.nouns[Math.floor(this.nouns.length * Math.random())];
    }
}
io.on('connection', client => {
    client.inGameId = gameState.generateId();
    client.emit('init', {
        data: Date.now(),
        id: client.inGameId,
        obstacles: obstacles,
        borderObstacles: borderObstacles,
        gameWidth: gameWidth,
        gameHeight: gameHeight,
        gridWidth: gridWidth,
        framesPerTick: framesPerTick,
        viableWeapons: viableWeapons.weapons,
        ammoTypes : viableWeapons.ammo
    });
    client.emit('gameState', trimObject(gameState));
    client.on('new player', function(msg){
        gameState.addPlayer(client.inGameId, msg.name, msg.color, msg.primary,msg.secondary);
    });
    client.on('disconnect', function() {
        gameState.removePlayer(client.inGameId);
    });
    client.on('reconnect', function() {
        client.sendBuffer = [];
    });
    client.on('keydown', (keycode) => {
        controls.keyDown(client.inGameId, keycode);
    });
    client.on('keyup', (keycode) => {
        controls.keyUp(client.inGameId, keycode);
    });
    client.on('mousemove', (ang) => {
        controls.angChange(client.inGameId, ang);
    });
    client.on('mousedown', () => {
        controls.mouseDown(client.inGameId);
    });
    client.on('mouseup', () => {
        controls.mouseUp(client.inGameId);
    });
    client.on('reset', ()=>{
        controls.resetPlayer(client.inGameId);
    });
    client.on('pingServer',(time)=>{
        client.emit('pongClient',{
            clientSend : time,
            recieveTime : Date.now()
        })
    });
});
var Bot = function(state)
{
    this.state = state;
    
    
    this.updateInterval = 500;
    this.playerId = this.state.generateId();
    
    this.name = "";
    this.color = getRandomColor();
    this.primary = 8;
    this.secondary = 1;
    
    this.lastKeyUpdate = -1;
    this.keyUpdatePeriod = 800*(2 + 1*Math.random());
    
    this.lastMouseUpdate = -1;
    this.mouseUpdate = 150*(2 + 1*Math.random());
    this.targetAng = 0;
    this.prevTargetAng = 0;
    
    this.lastDeathTime = -1;
    this.direction = 0;
    this.update = function()
    {
        var player = this.state.players[this.playerId];
        if (player && !player.alive){
            if (this.lastDeathTime == -1)
            {
                this.lastDeathTime = this.state.time;
            }
            else if (this.lastDeathTime != -1 && this.state.time - this.lastDeathTime > 5000)
            {
                this.spawn();
                this.lastDeathTime = -1;
            }
        }
        else if (player && player.alive)
        {
            var weapon = this.state.weapons[player.weapon];
            var trimmedGameState = gameStateEmitter.trimToPlayer(this.state, this.state, this.playerId);
            var minDist = 2300;
            var idx = -1;
            for (var i in trimmedGameState.players)
            {
                if (i == this.playerId || !this.state.players[i].alive)
                {
                    continue;
                }
                var otherPlayer = this.state.players[i];
                var dist = otherPlayer.pos.distanceTo(player.pos);
                if (dist < minDist)
                {
                    minDist = dist;
                    idx = i;
                }
            }
            var time = minDist/weapon.bulletSpeed;
            var predPos = player.pos.add(player.vel.multiply(time));
            var otherPredPos;
            if (idx != -1)
            {
                otherPredPos = this.state.players[idx].pos.add(this.state.players[idx].vel.multiply(time));
            }
            if (this.state.time - this.lastKeyUpdate > this.keyUpdatePeriod)
            {
                this.lastKeyUpdate = this.state.time;
                if (idx != -1)
                {
                    if (player.health > 50)
                        this.goDirection(this.state.players[idx].pos.angTo(player.pos) + Math.PI * (Math.random() - 0.5));
                    else
                        this.goDirection(this.state.players[idx].pos.angTo(player.pos) + Math.PI * (Math.random() + 0.5));
                }
                else
                {
                    this.goDirection((new Vector(gameWidth/2 + 500*(Math.random() - 1),gameHeight/2 + 500*(Math.random() - 1))).angTo(player.pos) + Math.PI/2 * (Math.random() - 0.5));
                }
            }
            if (this.state.time - this.lastMouseUpdate > this.mouseUpdate)
            {
                this.lastMouseUpdate = this.state.time;
                
                if (idx != -1)
                {
                    this.prevTargetAng = this.targetAng;
                    this.targetAng = otherPredPos.angTo(predPos) + 0.3*(Math.random()- 0.5);
                    
                }
                else
                {
                    this.prevTargetAng = this.targetAng;
                }
                
                
            }
            if (this.state.time - this.lastMouseClickUpdate > this.mouseClickUpdate)
            {
                this.mouseClickUpdate = (1.5+ 0.75*Math.random()) * 60000/viableWeapons.weapons[this.primary].firerate * Math.min(viableWeapons.weapons[this.primary].auto, 3);
                this.lastMouseClickUpdate = this.state.time;
                
                if (idx != -1)
                {
                    var inBetween = false;
                    var width = 2500;
                    var height = width * 9/16;
                    loopThroughObstaclesRect(player.pos, (obstacle) => {
                        if (!inBetween && obstacle.intersectable && obstacle.intersectSegment(predPos, otherPredPos) != -1)
                        {
                            inBetween = true;
                            return;
                        }
                    }, width, height);
                    if (!inBetween && predPos.distanceTo(otherPredPos) < weapon.range + weapon.length + weapon.buttPosition)
                    {
                        if  (this.state.weapons[player.weapon].bulletsRemaining > 0 && !controls.playerControls[this.playerId].keys[88])
                            controls.keyDown(this.playerId, 88);
                        controls.mouseDown(this.playerId);
                        if  (controls.playerControls[this.playerId].keys[82])
                        {
                            controls.keyUp(this.playerId, 82);
                        }
                    }
                    else
                    {
                        if  (controls.playerControls[this.playerId].keys[88])
                            controls.keyUp(this.playerId, 88);
                        if  (!controls.playerControls[this.playerId].keys[82])
                        {
                            controls.keyDown(this.playerId, 82);
                        }
                        controls.mouseUp(this.playerId);
                    }
                }
                else
                {
                    if  (controls.playerControls[this.playerId].keys[88])
                        controls.keyUp(this.playerId, 88);
                    if  (!controls.playerControls[this.playerId].keys[82])
                    {
                        controls.keyDown(this.playerId, 82);
                    }
                    controls.mouseUp(this.playerId);
                }
                
            }
        }
        
        
        
        var diff = (this.targetAng - this.prevTargetAng + 3* Math.PI) %(2*Math.PI) - Math.PI;
        this.mouseAng(this.prevTargetAng + (this.state.time - this.lastMouseUpdate)/this.mouseUpdate * diff);
    }
    this.mouseAng = function(ang)
    {
        controls.playerControls[this.playerId].ang = ang;
    }
    this.goDirection = function(ang)
    {
        this.direction = ang
        if (ang == undefined)
        {
            controls.playerControls[this.playerId].keys[65] = false;
            controls.playerControls[this.playerId].keys[68] = false;
            
            controls.playerControls[this.playerId].keys[87] = false;
            controls.playerControls[this.playerId].keys[83] = false;
            return;
        }
        if (Math.cos(ang) > 0.38268343236)
        {
            controls.playerControls[this.playerId].keys[65] = false;
            controls.playerControls[this.playerId].keys[68] = true;
        }
        else if (Math.cos(ang) < -0.38268343236)
        {
            controls.playerControls[this.playerId].keys[65] = true;
            controls.playerControls[this.playerId].keys[68] = false;
        }
        else
        {
            controls.playerControls[this.playerId].keys[65] = false;
            controls.playerControls[this.playerId].keys[68] = false;
        }
        
        if (Math.sin(ang) > 0.38268343236)
        {
            controls.playerControls[this.playerId].keys[87] = false;
            controls.playerControls[this.playerId].keys[83] = true;
        }
        else if (Math.sin(ang) < -0.38268343236)
        {
            controls.playerControls[this.playerId].keys[87] = true;
            controls.playerControls[this.playerId].keys[83] = false;
        }
        else
        {
            controls.playerControls[this.playerId].keys[87] = false;
            controls.playerControls[this.playerId].keys[83] = false;
        }
    }
    this.spawn = function()
    {
        this.primary = 0;
        while (viableWeapons.weapons[this.primary].weaponClass == 'Secondary')
        {
            this.primary = Math.floor(viableWeapons.weapons.length * Math.random());
        }
        this.secondary = 4;
        while (viableWeapons.weapons[this.secondary].weaponClass != 'Secondary')
        {
            this.secondary = Math.floor(viableWeapons.weapons.length * Math.random());
        }
        this.lastMouseClickUpdate = this.state.time;
        this.mouseClickUpdate = 1000;
        this.state.addPlayer(this.playerId, this.name, this.color, this.primary, this.secondary);
    }
}
const viableWeapons = {
    weapons : [],
    ammo : {
        0 : {
            n : "12 gauge",
            g : "#f00",
            b : "#f88"
        },
        1 : {
            n : "9mm",
            g : "#f80",
            b : "#fc8"
        },
        2 : {
            n : "45 acp",
            g : "#ff0",
            b : "#ff8"
        },
        3 : {
            n : "5.56x45",
            g : "#080",
            b : "#8f8"
        },
        4 : {
            n : "7.62x39",
            g : "#00f",
            b : "#bbf"
        },
        5 : {
            n : ".308 Winchester",
            g : "#b0f",
            b : "#f8f"
        },
        6 : {
            n : "laser",
            g : "#000",
            b : "#f00"
        },
        7 : {
            n : "arrow",
            g : "#000",
            b : "#ff9f73"
        }
    },  
    start : function()
    {
        this.weapons = [
            new GunStats('Glock 17', 'Secondary', 35, 1, 780, 1, 15, 1500, true, 30, 20, 4, 500, 150, 750, 0.15, 0.12, 0.9, 7, 0.9, 0, 0.95, 1, '#000','bullet',1, 5, 60, 32, 3, 0, 3, 0),
            new GunStats('Glock 18', 'Secondary', 35, Infinity, 780, 1, 17, 1500, true, 30, 17, 7, 500, 150, 750, 0.15, 0.09, 0.9, 7, 0.9, 0, 0.95, 1, '#444','bullet',1, 5, 60, 32, 3, 0, 3, 0),
            new GunStats('Redhawk', 'Secondary', 40, 1, 300, 1, 6, 1700,true, 50, 30, 10, 700, 200, 975, 0, 0.2, 0.9, 10, 0.9, 0.5, 0.95, 0.6, '#ff0','bullet',4, 5, 60,32, 3, 0, 3, 0),
            new GunStats('Executioner', 'Secondary', 35, 1, 450, 14, 6, 2900,true, 22.5, 5, 3.5, 330, 200, 450, 0.25, 0, 0.9, 10, 0.9, 0.5, 0.95, 0.6, '#222','bullet',0, 3, 60,32, 3, 0, 3, 0),
            
            new GunStats('Stevens DB', 'Shotgun', 90, 1, 450, 8, 2, 2300, true, 26.25, 15, 10, 350, 56, 525, 0.2, 0, 0.83, 10, 0.9, 1.5,1, 0.7, '#888', 'bullet',0,4,60,2,30, 3, 53, -2),
            new GunStats('M870', 'Shotgun', 105, 1, 80, 8, 5, 1000, false, 26.25, 16, 12, 400, 88, 600, 0.19, 0, 0.83, 10, 0.9, 1.5,1, 0.3, '#555', 'bullet',0,4,60,4,28, 3, 57, -2),
            new GunStats('SPAS-12', 'Shotgun', 110, 1, 120, 8, 9, 800, false, 30, 9, 1, 650, 100, 825, 0.12, 0, 0.83, 10, 0.9, 1.5,0.95, 0.3, '#333', 'bullet',0,4,60,4,28, 3, 58, -2),
            
            new GunStats('MAC-10', 'SMG', 50, Infinity, 1200, 1, 32, 1600, true, 26.25, 16, 10, 300, 150, 637.5, 0.1, 0.06, 0.9, 3, 0.9, 0.4, 0.97, 0.8, '#333','bullet', 1,5,60,12,22, 3, 40, -2),
            new GunStats('MP5', 'SMG',75, Infinity, 750, 1, 30, 1900, true, 33.75, 16, 8, 400, 270, 825, 0, 0.07, 0.91, 4, 0.9, 0.4, 0.95, 0.65, '#333','bullet', 1,5,60,6,26, 3, 51, -2),
            new GunStats('M1A1', 'SMG',90, Infinity, 720, 1, 50, 3100, true, 28, 15, 5, 450, 270, 900, 0, 0.04, 0.96, 5, 0.9, 0.3, 0.9, 0.5, '#333', 'bullet', 2,5,60,10,23, 3,48, -9),
            
            new GunStats('AK-47', 'Assault',95, Infinity, 600, 1, 30, 2500, true, 41.25, 16, 1, 600, 400, 1100, 0, 0.15, 0.85, 6, 0.9, 0.48, 0.93, 0.5, '#333', 'bullet',4,6,60,8, 24, 3, 50, -2),
            new GunStats('M4A1', 'Assault', 90, Infinity, 720, 1, 30, 3000, true, 45, 16, 3, 550, 270, 975, 0, 0.07, 0.9, 5, 0.9, 0.48, 0.93, 0.5, '#333', 'bullet',3,6,60,12,20, 3,45, -2),
            new GunStats('M4', 'Assault', 90, 3, 900, 1, 30, 2600, true, 45, 17, 3, 550, 270, 975, 0, 0.035, 0.95, 5, 0.9, 0.48, 0.93, 0.5, '#333', 'bullet',3,6,60,12,20, 3,45, -2),

            new GunStats('MK11', 'DMR',90, 1, 550, 1, 15, 2600, true, 45, 26, 6, 710, 500, 1200, 0, 0.3, 0.83, 8, 0.84, 0.56, 0.92, 0.5, '#333', 'bullet',4,6,90,12,20, 3, 45, -2),

            new GunStats('Remington 700','Sniper', 112, 1, 65, 1, 5, 1000, false, 52.5, 70, 20, 830, 240, 1875, 0, 0.3, 0.83, 14, 0.9, 2.5, 0.9, 0.6, '#333', 'bullet',5,8,170,4,28, 3, 60, -2),
            new GunStats('AWP', 'Sniper',125, 1, 50, 1, 7, 3500, true, 60, 106, 40, 400, 100, 1875, 0, 0.3, 0.83, 16, 0.9, 3, 0.9, 0.6, '#333', 'bullet',5,10,200,4,28, 3, 60, -2),
            
            new GunStats('Crossbow', 'Other',70, 1, 9000, 1, 1, 2400, false,18.75, 100, 0, 830, 240, 1500, 0, 0.3, 0.83, 14, 0.9, 3, 0.9, 1, '#333', 'arrow',7,6,60,12,20, 3, 40, -2),
            new GunStats('Laser', 'Other',90, 1, 120, 1, 6, 2700, true,100, 40, 6, 700, 200, 2500, 0, 0, 0.91, 20, 0.9, 0, 0.9, 0.4, '#f00','laser',6, 6,60,12,20, 3, 45, -2)
        ];
    }
};
var logTime = function(name, func)
{
    var time = Date.now();
    func();
    console.log(name + ": " + (Date.now() - time));
}
var findSpawnPosition = function(objects) {
    var startPos;
    do {
        startPos = new Vector(gameWidth * Math.random(), gameHeight * Math.random());
    }
    while (inObjects(startPos));
    return startPos;
}
var obstacleSector = function(point) {
    var out = [Math.floor(point.x / gridWidth), Math.floor(point.y / gridWidth)];
    out[0] = Math.max(Math.min(out[0],obstacles.length - 1), 0);
    out[1] = Math.max(Math.min(out[1],obstacles[0].length - 1), 0);
    return out;
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

var loopThroughObstaclesRect = function(objectPos, inner, width, height) {
    var sector = obstacleSector(objectPos);
    
    var maxWidthGrid = Math.ceil(width/2 /gridWidth);
    var maxHeightGrid = Math.ceil(height/2 /gridWidth);
    if (sector[0] < 1 + maxWidthGrid)
    {
        inner(borderObstacles[0]);
    }
    else if (sector[0] > obstacles.length - 2 - maxWidthGrid)
    {
        inner(borderObstacles[1]);
    }
    if (sector[1] < 1 + maxHeightGrid)
    {
        inner(borderObstacles[2]);
    }
    else if (sector[1] > obstacles[0].length - 2 - maxHeightGrid)
    {
        inner(borderObstacles[3]);
    }

    for (var i = sector[0] - maxWidthGrid; i < sector[0] + 1 + maxWidthGrid; i++) {
        if (i < 0 || i >= obstacles.length) {
            continue;
        }
        for (var j = sector[1] - maxHeightGrid; j < sector[1] + 1 + maxHeightGrid; j++) {
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
var bots;
var controls = {
    playerControls : {},
    importantKeys : new Set([87,83,68,65,70,71,82,88,81]),
    keyDown : function(id, keycode)
    {
        if (typeof keycode == 'number' && this.importantKeys.has(keycode) && this.playerControls[id] && gameState.players[id] && gameState.players[id].alive) {
            this.playerControls[id].keys[keycode] = true;
            this.playerControls[id].keyPressFrame[keycode] = true;
        }
    },
    keyUp : function(id, keycode)
    {
        if (typeof keycode == 'number' && this.importantKeys.has(keycode) && this.playerControls[id] && gameState.players[id] && gameState.players[id].alive) {
            this.playerControls[id].keys[keycode] = false;
        }
    },
    angChange : function(id, ang)
    {
        if (typeof ang == 'number' && isFinite(ang) && this.playerControls[id] && gameState.players[id] && gameState.players[id].alive){
            this.playerControls[id].ang = ang;
        }
    },
    mouseDown : function(id)
    {
        if (this.playerControls[id] && gameState.players[id] && gameState.players[id].alive) {
            this.playerControls[id].mouseDown = true;
            this.playerControls[id].mouseDownFrame = true;
        }
    },
    mouseUp : function(id)
    {
        if (this.playerControls[id] && gameState.players[id] && gameState.players[id].alive) {
            this.playerControls[id].mouseDown = false;
        }
    },
    resetPlayer : function(id)
    {
        if (this.playerControls[id] && gameState.players[id] && gameState.players[id].alive) {
            this.playerControls[id].keys = {};
            this.playerControls[id].keyPressFrame = {};
            this.playerControls[id].mouseDown = false;
            this.playerControls[id].mouseDownFrame = false;
            
        }
    },
    resetAll : function(){
        for (var i in this.playerControls)
        {
            this.playerControls[i].keyPressFrame = {};
            this.playerControls[i].mouseDownFrame = false;
            
        }
    }
};
var iterations;

function emitNewKill(shooter,dead) {
    io.sockets.emit('killFeed', {
        shooter: shooter,
        dead: dead
    });
}
function emitNewActivity(name, action) {
    io.sockets.emit('playerActivity', {
        name: name,
        action: action
    });
}
var gameStateEmitter = {
    prevStates : {},
    trimToPlayer : function(gameState, copy, inGameId)
    {
        if (gameState.players[inGameId] && this.playerSectors[0] && this.playerSectors[0][0])
        {
            var out = JSON.parse(JSON.stringify(copy));
            var playerPos = gameState.players[inGameId].pos;
            var playerSector = obstacleSector(playerPos);

            var maxWidth = 2500;
            var maxHeight = maxWidth * 9/16;
            var maxWidthGrid = Math.ceil(maxWidth/2 /gridWidth);
            var maxHeightGrid = Math.ceil(maxHeight/2 /gridWidth);

            var newPlayers = {};
            for (var i = Math.max(playerSector[0] - maxWidthGrid, 0); i <= Math.min(playerSector[0] + maxWidthGrid, gameWidth/gridWidth - 1); i++)
            {
                for (var j = Math.max(playerSector[1] - maxHeightGrid, 0); j <= Math.min(playerSector[1] + maxHeightGrid, gameHeight/gridWidth - 1); j++)
                {

                    var indices = this.playerSectors[i][j];
                    for (var idx in indices)
                    {
                        if (out.players[indices[idx]] && playerPos.inRect(out.players[indices[idx]].pos, maxWidth,maxHeight))
                        {
                            newPlayers[indices[idx]] = out.players[indices[idx]];
                        }
                    }
                }
            }
            out.players = newPlayers;
            return out;
        }
        else
        {
            return copy;
        }
    },
    playerSectors : {},
    updatePlayerSectors : function(){
        this.playerSectors = {};
        for (var i = 0; i < gameWidth/gridWidth; i++)
        {
            this.playerSectors[i] = {};
            for (var j = 0; j < gameHeight/gridWidth; j++)
            {
                this.playerSectors[i][j] = [];
            }
        }
        for (var i in gameState.players)
        {
            var player = gameState.players[i];
            sector = obstacleSector(player.pos);
            this.playerSectors[sector[0]][sector[1]].push(i);
        }
    },
    emitGameState : function(gameState)
    {
        var copy = JSON.parse(JSON.stringify(gameState));
    //logTime("copy",()=>{
        copy = trimObject(copy);
    //});
        this.updatePlayerSectors();
    //logTime("emitcopy",()=>{
        var sockets = io.sockets.sockets;
        for(var socketId in sockets) {
            var s = sockets[socketId];
            var inGameId = s.inGameId;
            var out = roundObjectNumbers(this.trimToPlayer(gameState, copy, inGameId));
            var emitObj = differenceBetweenObj(this.prevStates[inGameId], out);
            this.prevStates[inGameId] = out;
            s.emit('gameState',emitObj);
        }

        //io.sockets.emit('gameState', );
    //});
    }
};
function differenceBetweenObj(prev, curr)
{
    if (curr === undefined)
    {
        return null;
    }
    if (typeof curr != "object" && typeof prev != "object" && curr === prev)
    {
        return undefined;
    }
    if (typeof curr == "object" && typeof prev == "object")
    {
        var different = false;
        var out = {};
        for (var field in prev)
        {
            var fieldDifference = differenceBetweenObj(prev[field], curr[field]);
            if (fieldDifference !== undefined)
            {
                out[field] = fieldDifference;
                different = true;
            }
        }
        for (var field in curr)
        {
            if (prev[field] !== undefined)
            {
                continue;
            }
            var fieldDifference = differenceBetweenObj(prev[field], curr[field]);
            if (fieldDifference !== undefined)
            {
                out[field] = fieldDifference;
                different = true;
            }
        }
        return different ? out : undefined;
    }
    return curr;
}
var setIfUndefined = function(obj, field, value) {
    obj[field] = value;
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
            out = {};
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
var roundObjectNumbers = function(obj)
{
    var out;
    if (obj == null)
    {
        return;
    }
    if (typeof obj == 'object')
    {
        out = {};
        for (var field in obj) {
            out[field] = roundObjectNumbers(obj[field]);
        }
    }
    else if (typeof obj == 'number')
    {
        if (Math.abs(obj) > 10)
        {
            out = 100 * Math.round(obj * 10);
        }
        else
        {
            out = Math.round(obj * 1000);
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
    this.outfields = ['type','time','players','weapons','bullets','minimapInfo','leaderboard'];
    setIfUndefined(this, 'time', time);//
    setIfUndefined(this, 'players', players);//
    setIfUndefined(this, 'usedPlayerIds',  new Set());//
    
    setIfUndefined(this, 'weapons', weapons);//
    setIfUndefined(this, 'weaponsLength', 0);//
    setIfUndefined(this, 'weaponsSectors', []);//
    
    setIfUndefined(this, 'bullets', {});//
    setIfUndefined(this, 'bulletsLength', 0);//
    
    setIfUndefined(this, 'minimapInfo', undefined);//
    setIfUndefined(this, 'leaderboard', undefined);//
    this.addBullet = function(bull)
    {
        this.bullets[this.bulletsLength] = bull;
        this.bulletsLength ++;
    }
    this.deleteBullet = function(idx)
    {
        delete this.bullets[idx];
    }
    this.bulletsStep = function() {
        
        for (var i in this.bullets) {
            this.bullets[i].step(this);
            if (this.bullets[i].delete) {
                this.deleteBullet(i);
            }
        }


    }
    this.addWeapon = function(gun){
        this.weapons[this.weaponsLength] = gun;
        gun.id = this.weaponsLength;
        return this.weaponsLength ++;
    }
    this.removeWeapon = function(gunIdx){
        delete this.weapons[gunIdx];
    }
    this.generateId = function()
    {
        var done = false;
        var possible = "abcdefghijklmnopqrstuvwxyz1234567890";
        var length = 2;
        var string;
        while(!done)
        {
            string = "";
            for (var i = 0; i < length; i++)
            {
                var rand = Math.floor(Math.random() * possible.length);
                string = string + possible.charAt(rand);
            }
            done = true;
            if (this.usedPlayerIds.has(string))
            {
                done = false;
            }
        }
        this.usedPlayerIds.add(string)
        return string;
    }
    this.addPlayer = function(id, name, color, primary, secondary)
    {
        if (id == undefined)
        {
            return;
        }
        if (!(typeof name == "string" && color && 
              typeof primary == "number" && Number.isInteger(primary) && primary >= 0 && primary < viableWeapons.weapons.length && viableWeapons.weapons[primary].weaponClass != "Secondary" &&
              typeof secondary == "number" && Number.isInteger(secondary) && secondary >= 0 && secondary < viableWeapons.weapons.length && viableWeapons.weapons[secondary].weaponClass == "Secondary"))
        {
            return;
        }
        if (this.players[id] && this.players[id].alive)
        {
            return;
        }
        
        controls.playerControls[id] = {};
        controls.playerControls[id].mouseDown = false;
        controls.playerControls[id].keys = {};
        controls.playerControls[id].keyPressFrame = {};
        var player = this.players[id];
        var startPos = findSpawnPosition();
        color = (/^#([A-Fa-f0-9]{3}){1,2}$/.test(color) ? color : "#fcc976");
        name = name.substring(0,18);
        if (player) {
            player.pos = startPos;
            player.vel = new Vector(0,0);
            player.health = 100;
            player.alive = true;
            player.color = color;
            player.name = (name.trim() != "" ? name.trim() : player.name);
            player.killstreak = 0;
            player.points = 0;
            
            
            var idx1 = this.addWeapon(new Gun(0,0,primary , id));
            var idx2 = this.addWeapon(new Gun(0,0,secondary , id));

            player.weapon = idx1;
            player.weapons = [idx1,idx2];
            player.slot = 0;

        } else {
            this.players[id] = new Player(startPos.x, startPos.y, (name.trim() != "" ? name.trim() : words.randomName()), color, id, primary, secondary, this);
            controls[id] = {
                keys: [],
                mouseDown: false
            };
            emitNewActivity(this.players[id].name, "join");
        }
    }
    this.removePlayer = function(id)
    {
        var player = this.players[id];
        if (player != undefined){
            player.dropEverything(this);
            emitNewActivity(player.name, "leave");
        }
        delete this.players[id];
        delete controls.playerControls[id];
        delete gameStateEmitter.prevStates[id];
        this.usedPlayerIds.delete(id);
    }
    this.generateMinimap = function()
    {
        this.minimapInfo = {};
        var roundCoor = 250;
        var fadeTime = 1000;
        for (var i in this.players)
        {
            var player = this.players[i];
            if (this.time - player.lastOnRadar < fadeTime)
            {
                this.minimapInfo[i] = {
                    pos : new Vector(roundCoor*Math.round(player.pos.x/roundCoor), roundCoor*Math.round(player.pos.y/roundCoor)),
                    fade : (this.time - player.lastOnRadar)/fadeTime
                };
            }
        }
    }
    this.generateLeaderboard = function()
    {
        this.leaderboard = {};
        for (var i in this.players)
        {
            var player = this.players[i];
            this.leaderboard[i] = {
                name : player.name,
                points : player.points,
                kills : player.killstreak,
                alive : player.alive
            };
        }
    }
    this.step = function() {
        iterations = 0;
        this.updateWeaponsSectors();
        for (var i in this.weapons)
        {
          this.weapons[i].setLastFireTime(this);
        }
        for (var i in this.weapons)
        {
          this.weapons[i].step();
        }
        for (var k in this.players) {
            var player = this.players[k];
            if (player.alive) {

                this.movementControls(k);
                
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
                this.interactControls(k);
            }
        }
        controls.resetAll();
        for (var k in this.weapons) {
            this.weapons[k].updateReloads(this);
        }
        this.bulletsStep();
        for (var k in this.players) {
            var player = this.players[k];
            if (player.health <= 0 && player.alive) {
                player.dropEverything(this);
                player.alive = false;
                if (this.players[player.lastHitBy])
                {
                    this.players[player.lastHitBy].killstreak += 1;
                }
                emitNewKill(player.lastHitBy, player.id);
            }
        }
        this.generateMinimap();
        this.generateLeaderboard();
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
    this.movementControls = function(k) {
        var playerControls = controls.playerControls[k];
        var player = this.players[k];
        player.ang = playerControls.ang || 0;
        
        var targetVel = new Vector((playerControls.keys[68] ? 1 : 0) + (playerControls.keys[65] ? -1 : 0), (playerControls.keys[83] ? 1 : 0) + (playerControls.keys[87] ? -1 : 0));
        if (targetVel.magnitude() != 0) {
            targetVel = targetVel.multiply(this.players[k].speed / targetVel.magnitude());
        }
        if (player.weapon != -1) {
            var weapon = this.weapons[player.weapon];
            targetVel = targetVel.multiply(weapon.walkSpeedMult);
            if (weapon.lastFireTime != 0) {
                targetVel = targetVel.multiply(weapon.shootWalkSpeedMult);
            }
        }
        player.vel = player.vel.add(targetVel.subtract(player.vel).multiply(player.agility));

        

    }
    this.interactControls = function(k)
    {
        var playerControls = controls.playerControls[k];
        var player = this.players[k];
        if (playerControls.keyPressFrame[70]) {
            var minDist = player.reachDist;
            var idx = -1;
            this.loopThroughWeapons(player.pos, (weaponIdx) => {
                if (this.weapons[weaponIdx].hold) {
                    return;
                }
                var distance = player.pos.distanceTo(this.weapons[weaponIdx].pos);
                if (distance < minDist) {
                    idx = weaponIdx;
                    minDist = distance;
                }
            });
            if (idx != -1) {
                player.pickUpWeapon(this,idx);
            }
        }
        if (playerControls.keyPressFrame[71]) {
            player.dropWeapon(this);
        }
        if (playerControls.keys[82]) {
            if (player.weapon != -1){
                var weapon = this.weapons[player.weapon];
                weapon.reload(this.time);
            }
        }
        if (playerControls.keyPressFrame[88]) {
            var weapon = this.weapons[player.weapon];
            this.weapons[this.players[k].weapon].cancelReload();
        }
        if (playerControls.keyPressFrame[81]) {
            this.players[k].swapWeapon(this, 1 - this.players[k].slot);
        }
        
        
        
        player.snapWeapon(this);
        
        if (player.weapon != -1)
        {
            var weapon = this.weapons[player.weapon];
            if (playerControls.mouseDownFrame)
            {
                weapon.autoRem = weapon.auto;
            }
            else if (!playerControls.mouseDown){
                weapon.autoRem = 0;
            }
            if (weapon.bulletsRemaining == 0){
                if (playerControls.mouseDownFrame)
                {
                    weapon.reload(this.time);
                }
            }
            else
            {
                if (weapon.autoRem > 0)
                {
                    weapon.fireBullets(this);
                }
            }
        }
        else
        {
            if (playerControls.mouseDownFrame)
            {
                player.punch(this);
            }
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
    viableWeapons.start();
    var players = {};
    var wallThick = 80;

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
    
    /*var weapons = [];
    for (var i = 0; i < viableWeapons.weapons.length; i++) {
        for (var j = 0; j < viableWeapons.numEach[i]; j++) {
            var weapon = new Gun(0,0,i);
            weapon.pos = findSpawnPosition();
            weapons.push(weapon);
        }
    }*/
    gameState = new GameState(Date.now(), players, {});
    createBots(gameState);
    
}
function createBots(state){
    bots = {};
    for (var i = 0; i < 2; i++)
    {
        var bot = new Bot(state);
        bots[bot.playerId] = bot;
        bot.spawn();
    }
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
var Player = function(xStart, yStart, name, color, id, prim, sec, state) {
    this.type = "Player";
    this.outfields = ['type','radius','reachDist','weapon','weapons','slot','health','pos','ang','punchLastTime','id','name','color','alive'];
    
    
    setIfUndefined(this, 'speed', 5);
    setIfUndefined(this, 'agility', 0.2);
    setIfUndefined(this, 'radius', 20);//
    setIfUndefined(this, 'reachDist', 50);//

    setIfUndefined(this, 'slot', 0);//

    setIfUndefined(this, 'health', 100);//

    setIfUndefined(this, 'pos', new Vector(xStart, yStart));//
    setIfUndefined(this, 'vel', new Vector(0, 0));//

    setIfUndefined(this, 'ang', 0);//

    setIfUndefined(this, 'punchReach', 20);
    setIfUndefined(this, 'punchLastTime', 0);//
    setIfUndefined(this, 'punchRate', 200);
    setIfUndefined(this, 'punchDamage', 48);

    setIfUndefined(this, 'id', id);

    setIfUndefined(this, 'healInterval', 5000);
    setIfUndefined(this, 'lastHitTime', 0);

    setIfUndefined(this, 'name', name);//
    setIfUndefined(this, 'killstreak', 0);//
    setIfUndefined(this, 'points', 0);//
    setIfUndefined(this, 'color', color);//
    setIfUndefined(this, 'alive', true);//
    
    setIfUndefined(this, 'lastHitBy', -1);
    
    var idx1 = state.addWeapon(new Gun(0,0,prim, this.id));
    var idx2 = state.addWeapon(new Gun(0,0,sec, this.id));
    
    setIfUndefined(this, 'weapon', idx1);//
    setIfUndefined(this, 'weapons', [idx1,idx2]);//
    
    setIfUndefined(this, 'lastOnRadar', 0);
    
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
        prevWeapon.autoRem = 0;
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
        weapon.lastHoldTime = -1;
    }
    this.dropWeapon = function(state) {
        var weapon = state.weapons[this.weapon];
        if (this.weapon != -1) {
            this.weapons[this.slot] = -1;
            this.weapon = -1;

            weapon.pos = this.pos;
            weapon.vel = (new Vector(-100, 0)).rotate(this.ang);

            weapon.ang = -Math.PI/6;

            weapon.hold = false;
            weapon.cancelReload();
            weapon.playerHolding = -1;
            if (weapon.lastFireTime != 0)
            {
              weapon.lastFireTime = -1;
            }
            weapon.lastHoldTime = state.time;
            weapon.autoRem = 0;
        }
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

        if (state.time - this.lastHitTime > this.healInterval) {
            this.health = Math.min(100, this.health + 0.05);
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
            var actualdmg;
            if (this.health > 0)
            {
                if (this.health >= damage)
                {
                    actualdmg = damage;
                }
                else
                {
                    actualdmg = this.health;
                }
                state.players[playerId].points += actualdmg;
                this.health -= actualdmg;
                this.lastHitBy = playerId;
                this.lastHitTime = state.time;
            }
        }
    }
}
var GunStats = function(name, weaponClass, length, auto, firerate, multishot, capacity, reloadTime, reloadType, bulletSpeed, damage, damageDrop, damageRange, damageDropTension, range, defSpray, sprayCoef, stability, kickAnimation, animationMult, personRecoil, walkSpeedMult, shootWalkSpeedMult, color, ammoType, ammoId, bulletWidth, fadeTime, buttPosition, handPos1x, handPos1y, handPos2x, handPos2y){
    setIfUndefined(this, 'name', name);//
    setIfUndefined(this, 'weaponClass', weaponClass);//
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
    setIfUndefined(this, 'personRecoil', personRecoil);

    setIfUndefined(this, 'walkSpeedMult', walkSpeedMult);
    setIfUndefined(this, 'shootWalkSpeedMult', shootWalkSpeedMult);

    setIfUndefined(this, 'color', color);//
    setIfUndefined(this, 'ammoType', ammoType);//
    setIfUndefined(this, 'ammoId', ammoId);//
    setIfUndefined(this, 'fadeTime', fadeTime);//
    
    setIfUndefined(this, 'buttPosition', buttPosition);//
    setIfUndefined(this, 'bulletWidth', bulletWidth);//

    setIfUndefined(this, 'handPos1', new Vector(handPos1x, handPos1y));//
    setIfUndefined(this, 'handPos2', new Vector(handPos2x, handPos2y));//
    setIfUndefined(this, 'despawnTime', 30000);//
    setIfUndefined(this, 'radius', 30);//
}
var Gun = function(startX, startY, stats, playerIdx) {
    this.outfields = ['type','gunStats','pos','vel','ang','bulletsRemaining','reloadStartTime','recoil','hold'];
    
    setIfUndefined(this, 'gunStats', stats);//
    Object.assign(this, viableWeapons.weapons[this.gunStats]);
    
    setIfUndefined(this, 'pos', new Vector(startX, startY));//
    setIfUndefined(this, 'vel', new Vector(0, 0));//
    setIfUndefined(this, 'ang', -Math.PI/6);//
    
    setIfUndefined(this, 'autoRem', 0);//
    setIfUndefined(this, 'bulletsRemaining', (playerIdx != -1 ? this.capacity : 0));//
    setIfUndefined(this, 'reloadStartTime', -1);//

    setIfUndefined(this, 'spray', 0);
    setIfUndefined(this, 'recoil', 0);
    setIfUndefined(this, 'lastFireTime', 0);

    setIfUndefined(this, 'hold', (playerIdx != -1));//
    setIfUndefined(this, 'radius', 30);//


    setIfUndefined(this, 'playerHolding', playerIdx);
    setIfUndefined(this, 'lastHoldTime', -1);
    
    setIfUndefined(this, 'id', -1);
    
    
    this.type = "Gun";
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
        if  (!this.hold && this.lastHoldTime != -1 && state.time - this.lastHoldTime > this.despawnTime)
        {
            state.removeWeapon(this.id);
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
            if (weapon == undefined || weapon == this || weapon.hold)
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
        this.vel = this.vel.add(finalForce).multiply(0.8);
        loopThroughObstacles(this.pos, (obstacle) => {
            iterations += 1;
            if (this.pos.distanceTo(obstacle.center) > this.radius + obstacle.maxRadius || !obstacle.intersectable)
            {
                return;
            }
            var closestPoint = obstacle.closestPoint(this.pos);
            var dist = this.pos.distanceTo(closestPoint);
            if (dist < this.radius) {
                if (dist == 0) {
                    return;
                }
                this.pos = closestPoint.add(this.pos.subtract(closestPoint).multiply(this.radius / dist));
                var ang = this.pos.angTo(closestPoint);
                var velMag = this.vel.rotate(-ang).y;
                this.vel = (new Vector(0, velMag)).rotate(ang);
            }

        });
    }
    this.step = function()
    {
        this.spray = this.stability * (this.spray - this.defSpray) + this.defSpray;
        this.recoil *= this.animationMult;
        if (!this.hold)
        {
            this.pos = this.pos.add(this.vel.multiply(1/60));
        }
    }
    this.reload = function(timeNow) {
        if (this.bulletsRemaining < this.capacity && this.reloadStartTime == -1 && this.lastFireTime == 0) {
            this.reloadStartTime = timeNow;
            this.autoRem = 0;
        }
    }
    this.cancelReload = function() {
        this.reloadStartTime = -1;

    }
    this.fireBullets = function(state) {
        if (this.lastFireTime == 0 && (this.reloadStartTime == -1 || !this.reloadType)) {
            if (this.bulletsRemaining > 0) {
                if (!this.reloadType)
                {
                    this.cancelReload();
                }
                if (!this.stickingThroughWall(state)) {
                    for (var i = 0; i < this.multishot; i++) {
                        state.addBullet(new Bullet(this));
                    }
                }
                this.spray += this.sprayCoef;
                this.recoil += this.kickAnimation;
                this.lastFireTime = state.time;
                
                this.autoRem -= 1;
                this.bulletsRemaining -= 1;
                if (this.playerHolding != -1)
                {
                    
                    var player = state.players[this.playerHolding];
                    player.vel = player.vel.add((new Vector( - this.personRecoil,0)).rotate(this.ang));
                    player.lastOnRadar = state.time;
                }
            }
        }
    }
    this.updateReloads = function(state) {
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


    }
    this.intersectOb = function(ob, state) {
        var v1 = this.pos.add((new Vector(this.length / 2, 0)).rotate(this.ang));
        var v2 = (this.hold ? state.players[this.playerHolding].pos : this.pos.add((new Vector(-this.length / 2, 0)).rotate(this.ang)));
        if (ob.intersectSegment(v1,v2) == -1)
        {
          return false;
        }
        else
        {
          return true;
        }
    }
    this.stickingThroughWall = function(state) {
        var out = false;
        loopThroughObstacles(this.pos, (obstacle) => {
            if (obstacle.intersectable && this.intersectOb(obstacle,state)) {
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
        weapon = new Gun(0, 0, 0,-1, 0);
    }
    this.outfields = ['type','startPos','tailPos','pos','vel','ang','bulletSpeed','range','hitPoint','trailLength','width','ammoId', 'ammoType'];
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
    setIfUndefined(this, 'trailLength', this.bulletSpeed * weapon.fadeTime);//
    setIfUndefined(this, 'width', weapon.bulletWidth);//
    setIfUndefined(this, 'ammoId', weapon.ammoId);//
    setIfUndefined(this, 'ammoType', weapon.ammoType);//

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
        if (this.pos.distanceTo(this.startPos) > this.range)
        {
            if (objectsPoint == -1 || objectsPoint != -1 && objectsPoint.distanceTo(this.startPos) > this.range)
            {
                objectsPoint = this.startPos.add(this.vel.normalize().multiply(this.range));
                playerHit = -1;
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
    this.inRect = function(v, maxWidth,maxHeight)
    {
        return (Math.abs(v.x - this.x) < maxWidth/2 && Math.abs(v.y - this.y) < maxHeight/2);
    }
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
setInterval(updateGameArea, 16);
setInterval(() => {
    //logTime("push",()=>{
        for (var i in gameState.weapons)
        {
          gameState.weapons[i].pushFromAll(gameState);
        }
        for (var i in gameState.weapons)
        {
          gameState.weapons[i].pushFromAll(gameState);
        }
    //});
},100);
function updateGameArea() {
    //logTime("updateGameArea", () => {
    
        gameState.time = Date.now();
       
            gameState.step();
        stage += 1;
        if (stage >= framesPerTick) {
            //logTime("emit",()=>{
                gameStateEmitter.emitGameState(gameState);
                stage = 0;
            //});
        }
    //});
    for (var i in bots)
    {
        bots[i].update();
    }
}
io.listen(process.env.PORT || 3000);
