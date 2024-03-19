            /*jslint node: true */




// The original game is at http://random-arraspstest.glitch.me/#hv



/*jshint -W061 */
/*global goog, Map, let */
// mode thing : 'ffa' = FFA , 'tdm' = 4 TDM, '2tdm' = 2 TDM, '1tdm' = 1 TDM
// maze stuff : 0 - full maze, 1 - maze with nest, 2 - 2tdm maze, 4 - 4tdm maze, 5 - cx maze, 8 - 8tdm maze?, 80 - 8TeamsLabyrinth,  10 - assault bunker, 11- siege fortress
"use strict";

// General requires
require('google-closure-library');
goog.require('goog.structs.PriorityQueue');
goog.require('goog.structs.QuadTree');
// Import game settings.
const c = require('./config.json');
const definition = require('./lib/definitions');
require('dotenv').config();

// Import utilities.
const util = require('./lib/util');
const ran = require('./lib/random');
const hshg = require('./lib/hshg');
// mockups.json convet to definitions.js Test
const definitiontest = require('./lib/mockuptodef');
// tokens
const tokens = require('./lib/tokens');
let tokenLevels = tokens.tokenlevels
let tokenexpired = tokens.tokenexpired
const fetch = require('node-fetch')
// Let's get a cheaper array removal thing
Array.prototype.remove = index => {
    if(index === this.length - 1){
        return this.pop();
    } else {
        let r = this[index];
        this[index] = this.pop();
        return r;
    }
};
let uptime = {
  seconds: 0,
  minutes: 0,
  hours: 0,
  }
  let serverUpTime = `${uptime.hours > 9 ? uptime.hours:'0'+uptime.hours}:${uptime.minutes > 9 ? uptime.minutes:'0'+uptime.minutes}:${uptime.seconds > 9 ? uptime.seconds:'0'+uptime.seconds}`;
// Set up room.
global.fps = "Unknown";
var roomSpeed = c.gameSpeed;
var dredshapes = 0;
var nod = 1;
var siegebosses = 999 ;
var siegewavestarted = false;
var commandwalls = [];
let lockedTanks = [];
let clanlist = {};
let tempBannedList = []
let check = false
let checktype
let clans = 0
let clientcount = 0;
let siegewave = 1
let servermode = require('./servermode');
let randommode = servermode.mode
let blueD = 0;
let greenD = 0;
let redD = 0;
let purpleD = 0;
let yellowD = 5;
let gamecode_name = a => {
  var d = [
      [{
          id: "p",
          to: "Private"
      }],
      [{
          id: "g",
          to: "Growth"
      }],
      [{
          id: "a",
          to: "Arms Race"
      }],
      [{
          id: "e",
          dynamic: "word"
      }],
      [{
          id: "w",
          dynamic: "words"
      }],
      [{
          id: "o",
          to: "Open"
      }],
      [{
          id: "m",
          to: "Maze",
          delay: !0,
          remove: "f"
      }],
      [{
          id: "6",
          to: "Dreadnoughts",
          remove: "f"
      }],
      [{
          id: "f",
          to: "FFA"
      }, {
          id: "2",
          to: "2 Team",
          end: "2TDM"
      }, {
          id: "3",
          to: "3 Team",
          end: "3TDM"
      }, {
          id: "4",
          to: "4 Team",
          end: "4TDM"
      }],
      [{
          id: "d",
          to: "Domination"
      }, {
          id: "m",
          to: "Mothership",
          remove: "2"
      }, {
          id: "a",
          to: "Assault",
          remove: "2",
      }],
      [{
          id: "7",
          to: "Skinwalkers",
          delay: !0,
          remove: "f"
      }],
      [{
          id: "8",
          to: "Event",
          delay: !0,
          remove: "f"
      }],
      [{
          id: "9",
          to: "Retrograde",
          delay: !0,
          remove: "f"
      }],
      [{
          id: "z",
          to: "Sandbox",
          delay: !0,
          remove: "f"
      }],
      [{
          id: "5",
          to: "Random Mode",
          delay: !0,
          remove: "f"
      }],
  ];
  let c = [],
      h = [];
  var u = 0;
  for (let b of d)
      for (let n of b)
          if (n.id === a.charAt(u)) {
              u++;
              d = Object.assign({}, n);
              if ("word" === n.dynamic) {
                  var y = parseInt(a.charAt(u++),36),//+a.charAt(u++),
                      f = a.slice(u, u + y);
                  d.to = f.charAt(0).toUpperCase() + f.slice(1);
                  u += y
              } else if ("words" === n.dynamic) {
                  y = parseInt(a.charAt(u++), 36);
                  f = [];
                  for (let b = 0; b < y; b++) {
                      var e = a.charAt(u++);
                      if ("d" === e) f.push("-");
                      else if ("s" ===
                          e) f.push(" ");
                      else {
                          e = parseInt(e, 36);
                          let b = a.slice(u, u + e);
                          f.push(b.charAt(0).toUpperCase() + b.slice(1));
                          u += e
                      }
                  }
                  d.to = f.join("")
              }
              n.remove && h.push(n.remove);
              c.push(d);
              break
          } if (0 === c.length) return "Unknown";
  a = c[c.length - 1];
  a.end && (a.to = a.end);
  for (a = 0; a + 1 < c.length; a++) c[a].delay && !c[a + 1].delay && (u = c[a], c[a] = c[a + 1], c[a + 1] = u, a++);
  c = c.filter(({
      id: b
  }) => !h.includes(b));
  return c.map(b => b.to).join(" ")
};
let maxDomin = yellowD
let size = c['SIZE'+randommode];
let width2 = size;
let height2 = size;
let arrasmaze = require('./lib/maze');
let DOMINATION = c['DOMINATION'+randommode];
if (DOMINATION === undefined) {
  DOMINATION = false;
}
let ASSAULT = c['ASSAULT'+randommode];
if (ASSAULT === undefined) {
  ASSAULT = false;
} else {
  blueD = 0;
  greenD = 4;
  redD = 0;
  purpleD = 0;
  yellowD = 0;
}
let MAZETYPE = c['MAZETYPE'+randommode];
if (MAZETYPE === undefined) {
  MAZETYPE = -1;
}
let FOODSPAWN = c['FOODSPAWN'+randommode];
if (FOODSPAWN === undefined) {
  FOODSPAWN = true;
}
let HAS_MAZE_VARIANT = c['HAS_MAZE_VARIANT'+randommode];
if (HAS_MAZE_VARIANT !== undefined) {
  HAS_MAZE_VARIANT = true;
  let choosemaze = Math.floor(Math.random() * 3);
  console.log(choosemaze)
  if (choosemaze !== 1) {
    MAZETYPE = 6
  }
}
let DREADNOUGHTS = c['DREADNOUGHTS'+randommode];
if (DREADNOUGHTS === undefined) {
  DREADNOUGHTS = false;
}
let MANHUNT = c['MANHUNT'+randommode];
if (MANHUNT === undefined) {
  MANHUNT = false;
}
let GROUPS = c['GROUPS'+randommode];
if (GROUPS === undefined) {
  GROUPS = false;
}
let SKINWALKERS = c['SKINWALKERS'+randommode];
if (SKINWALKERS === undefined) {
  SKINWALKERS = false;
}
let RETROGRADE = c['RETROGRADE'+randommode];
if (RETROGRADE === undefined) {
  RETROGRADE = false;
}
let WINTER_MAYHEM = c['WINTERMAYHEM'+randommode];
if (WINTER_MAYHEM === undefined) {
  WINTER_MAYHEM = false;
}
let FOOD_AMOUNTV2 = c['FOOD_AMOUNT'+randommode];
if (FOOD_AMOUNTV2 === undefined) {
  FOOD_AMOUNTV2 = 1;
}
let gamemodecodeoriginal = c['MODECODE'+randommode];
let gamemodeoriginal = c['MODECODE'+randommode];
let MAGIC_MAZE = c['MAGIC_MAZE'+randommode];
if (MAGIC_MAZE === undefined) {
  MAGIC_MAZE = false;
} else {
  if (gamemodecodeoriginal[0] === 'w') {
    gamemodecodeoriginal = 'w'+(Math.floor(gamemodecodeoriginal[1])+2)+'5magics'+gamemodecodeoriginal.substring(2)
  } else {
    gamemodecodeoriginal = 'w15magicm'+gamemodecodeoriginal
  }
}
let ARMSRACE = servermode.armsrace//c['ARMSRACE'+randommode];
if (ARMSRACE === true) {
  //gamemodecodeoriginal = "a"+gamemodecodeoriginal
  if (gamemodecodeoriginal[0] === 'w') {
    if ((Math.floor(gamemodecodeoriginal[1])+4) < 10) {
      gamemodecodeoriginal = 'w'+(Math.floor(gamemodecodeoriginal[1])+4)+'4armss4races'+gamemodecodeoriginal.substring(2)
    }
  } else {
    gamemodecodeoriginal = 'w44armss4races'+gamemodecodeoriginal
  }
}
let TRAIN_WARS = c['TRAIN_WARS'+randommode]
if (TRAIN_WARS === undefined) {
  TRAIN_WARS = false;
} else {
  if (gamemodecodeoriginal[0] === 'w') {
    gamemodecodeoriginal = 'w'+(Math.floor(gamemodecodeoriginal[1])+4)+'5trains4warss'+gamemodecodeoriginal.substring(2)
  } else {
    gamemodecodeoriginal = 'w45trains4warss'+gamemodecodeoriginal
  }
}
let CLANS = c['CLANS'+randommode];
if (CLANS === undefined) {
  CLANS = false;
} else {
  if (gamemodecodeoriginal[0] === 'w') {
    gamemodecodeoriginal = 'w'+(Math.floor(gamemodecodeoriginal[1])+4)+'4clans4warss'+gamemodecodeoriginal.substring(2)
  } else {
    gamemodecodeoriginal = 'w44clans4warss'+gamemodecodeoriginal
  }
}
let GROWTH = c['GROWTH'+randommode]
if (GROWTH === undefined) {
  GROWTH = false;
} else {
  if (gamemodeoriginal !== 'w23olds6o4') {
      gamemodecodeoriginal = "g"+gamemodecodeoriginal
  }
  /*if (gamemodecodeoriginal[0] === 'w') {
    if (gamemodeoriginal !== 'w23olds6o4') {
      gamemodecodeoriginal = 'w'+(Math.floor(gamemodecodeoriginal[1])+2)+'6growths'+gamemodecodeoriginal.substring(2)
    }
  } else {
    gamemodecodeoriginal = 'w26growths'+gamemodecodeoriginal
  }*/
}
let SIEGE = c['SIEGE'+randommode]
if (SIEGE === undefined) {
  SIEGE = false;
} else {
  blueD = 4;
  greenD = 0;
  redD = 0;
  purpleD = 0;
  yellowD = 0;
}
let OUTBREAK = c['OUTBREAK'+randommode];
if (OUTBREAK === undefined) {
  OUTBREAK = false;
}
let NOCRASHERS = c['NOCRASHERS'+randommode]
if (NOCRASHERS === undefined) {
  NOCRASHERS = false;
}
/*if (MAZETYPE != -1) {
  util.log(arrasmaze['createMaze'](MAZETYPE))
}*/
let roomsetup = c['ROOM_SETUP'+randommode]
let realmode = c['MODE'+randommode]
if (DOMINATION === true) {
  if (realmode === "tdm") {
    let yellowD = 3;
    maxDomin = yellowD
    if (MAZETYPE != -1) {
      let yellowD = 4;
      maxDomin = yellowD
    }
  }
}
let ygrid = c['Y_GRID'+randommode]
let xgrid = c['X_GRID'+randommode]
let CORNMAZESIZE = c['CORNSIZE'+randommode]
let MAZEX_GRID = xgrid; let MAZEY_GRID = ygrid;
if (c['MAZEX_GRID'+randommode] !== undefined) {
  MAZEX_GRID = c['MAZEX_GRID'+randommode] 
} else MAZEX_GRID=32;
if (c['MAZEY_GRID'+randommode] !== undefined) {
  MAZEY_GRID = c['MAZEY_GRID'+randommode] 
} else MAZEY_GRID=32
if (xgrid !== ygrid) {
  width2 = c['WIDTH'+randommode];
  height2 = c['HEIGHT'+randommode];
}
let modename = c['NAME'+randommode]
util.log('gamemode id: '+randommode+' ('+modename+')')
let CORNMAZE_ROOMS = c["CORNMAZE_ROOMS"+randommode]
if (CORNMAZE_ROOMS === undefined) {
  CORNMAZE_ROOMS = false;
}
let mazemap = undefined
//console.log(arrasmaze['createMaze'](MAZETYPE).MAZE.staticRand)
var maze = {
    
}
if (MAZETYPE != -1) {
  if (MAZETYPE === "corn") {
    MAZEX_GRID = arrasmaze['maze'+MAZETYPE].map.width
    MAZEY_GRID = arrasmaze['maze'+MAZETYPE].map.height
  } else {
    mazemap = arrasmaze['createMaze'](MAZETYPE)
    MAZEX_GRID = mazemap.MAZEWALLS[0].width
    MAZEY_GRID = mazemap.MAZEWALLS[0].height
  }
}
let gamemodecode = gamemodecodeoriginal
if (randommode === 21) {
  gamemodecode = 'w35trains4wars'
}
const room = {
    lastCycle: undefined,
    cycleSpeed: 1000 / roomSpeed / 30,
    width: width2,
    height: height2,
    setup: roomsetup,
    wallxgrid: MAZEX_GRID,
    wallygrid: MAZEY_GRID,
    xgrid: xgrid, 
    ygrid: ygrid,
    gameMode: realmode,
    skillBoost: c.SKILL_BOOST,
    scale: {
        square: width2 * height2 / 100000000,
        linear: Math.sqrt(width2 * height2 / 100000000),
    },
    maxFood: width2 * height2 / 20000 * c.FOOD_AMOUNT * FOOD_AMOUNTV2,
    isInRoom: location => {
        return location.x >= 0 && location.x <= width2 && location.y >= 0 && location.y <= height2
    },    
    topPlayerID: -1,
};
    room.findType = type => {
        let output = [];
        let j = 0;
        room.setup.forEach(row => { 
            let i = 0;
            row.forEach(cell => {
                if (cell === type) { 
                    output.push({ x: (i + 0.5) * room.width / room.xgrid, y: (j + 0.5) * room.height / room.ygrid, });
                }
                i++;
            });
            j++;
        });
        room[type] = output;
    };
    room.findType('nest');
    room.findType('norm');
    room.findType('bas1');
    room.findType('dbc1');
    room.findType('bas2');
    room.findType('dbc2');
    room.findType('dngr');
    room.findType('bas3');
    room.findType('bas4');
    room.findType('bap1');
    room.findType('bap2');
    room.findType('bap3');
    room.findType('bap4');
    room.findType('domx');
    room.findType('port');
    room.findType('edge');
    room.findType('atmg');
    room.findType('mot1');
    room.findType('mot2');
    room.findType('roid');
    room.findType('pump');
    room.findType('rock');
    room.findType('redz');
    room.findType('wall');
    room.findType('walr'); //random wall
    room.findType('walb'); //button wall
    room.findType('ball');
    room.nestFoodAmount = 1.5 * Math.sqrt(room.nest.length) / room.xgrid / room.ygrid;
    room.random = () => {
        return {
            x: ran.irandom(width2),
            y: ran.irandom(height2),
        };
    };
    room.randomv2 = (x,y) => {
        return {
            x: ran.irandom(x),
            y: ran.irandom(y),
        };
    };
    room.randomType = type => {
        let selection = room[type][ran.irandom(room[type].length-1)];
        return {
            x: ran.irandom(0.5*room.width/room.xgrid) * ran.choose([-1, 1]) + selection.x,
            y: ran.irandom(0.5*room.height/room.ygrid) * ran.choose([-1, 1])  + selection.y,
        };
    };
    room.randomType2 = (type, rx, ry) => {
        let selection = room[type][ran.irandom(room[type].length-1)];
        room[type].forEach((loc) => {
          if (loc.x != rx) {if (loc.y != ry) {selection = loc}}
        }); 
        return {
            x: ran.irandom(0.5*room.width/room.xgrid) * ran.choose([-1, 1]) + selection.x,
            y: ran.irandom(0.5*room.height/room.ygrid) * ran.choose([-1, 1])  + selection.y,
        };
    };
    room.hasType = (type) => {
      let result = 0
      room.setup.forEach((ry) => {
        ry.forEach((rx)=> {
          if (rx == type) {
            result = 1
          }
        });
      });
      return result
    }
    room.gauss = clustering => {
        let output;
        do {
            output = {
                x: ran.gauss(room.width/2, room.height/clustering),
                y: ran.gauss(room.width/2, room.height/clustering),
            };
        } while (!room.isInRoom(output));
    };
    room.gaussInverse = clustering => {
        let output;
        do {
            output = {
                x: ran.gaussInverse(0, room.width, clustering),
                y: ran.gaussInverse(0, room.height, clustering),
            };
        } while (!room.isInRoom(output));
        return output;
    };
    room.gaussRing = (radius, clustering) => {
        let output;
        do {
            output = ran.gaussRing(room.width * radius, clustering);
            output = {
               x: output.x + room.width/2,
               y: output.y + room.height/2, 
            };
        } while (!room.isInRoom(output));
        return output;
    };
    room.isIn = (type, location) => {
        if (room.isInRoom(location)) {
            let a = Math.floor(location.y * room.ygrid / room.height);
            let b = Math.floor(location.x * room.xgrid / room.width);
            return type === room.setup[a][b];
        } else {
            return false;
        }
    };
    room.locRoom = (location) => {
        if (room.isInRoom(location)) {
            let a = Math.floor(location.y * room.ygrid / room.height);
            let b = Math.floor(location.x * room.xgrid / room.width);
            return {x:b, y:a};
        }
    };
    room.locWallPlacement = (location,size) => {
        let a = Math.floor(location.y * room.wallygrid / room.height);
        let b = Math.floor(location.x * room.wallxgrid / room.width);
        let location2 = {x: b, y:a}
        let realy = Math.floor(location2.y / room.wallygrid * room.height+size);
        let realx = Math.floor(location2.x / room.wallxgrid * room.width+size);
        return {x:realx, y:realy};
    };
    maze.locWall = (location,size) => {
        let a = Math.floor(location.y / room.wallygrid * room.height+size);
        let b = Math.floor(location.x / room.wallxgrid * room.width+size);
        return {x:b, y:a};
    };
    maze.locWallCorn = (location,size,width,height) => {
        let a = Math.floor(location.y / room.wallygrid * height+size);
        let b = Math.floor(location.x / room.wallxgrid * width+size);
        return {x:b, y:a};
    };
    room.isInNorm = location => {
        if (room.isInRoom(location)) {
            let a = Math.floor(location.y * room.ygrid / room.height);
            let b = Math.floor(location.x * room.xgrid / room.width);
            let v = room.setup[a][b];
            return v !== 'nest';
        } else {
            return false;
        }
    };
    room.gaussType = (type, clustering) => {
        let selection = room[type][ran.irandom(room[type].length-1)];
        let location = {};
        do {
            location = {
                x: ran.gauss(selection.x, room.width/room.xgrid/clustering),
                y: ran.gauss(selection.y, room.height/room.ygrid/clustering),
            };
        } while (!room.isIn(type, location));
        return location;
    };
util.log(room.width + ' x ' + room.height + ' room initalized.  Max food: ' + room.maxFood + ', max nest food: ' + (room.maxFood * room.nestFoodAmount) + '.');

// Define a vector
class Vector {
    constructor(x, y) { //Vector constructor.
        this.x = x;
        this.y = y;
    }

    update() {
        this.len = this.length;
        this.dir = this.direction;
    }

    get length() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }

    get direction() {
        return Math.atan2(this.y, this.x);
    }
}
function nullVector(v) {
    v.x = 0; v.y = 0; //this guy's useful
}

// Get class definitions and index them
var Class = (() => {
    let def = require('./lib/definitions'),
        i = 0;
    for (let k in def) {
        if (!def.hasOwnProperty(k)) continue;
        def[k].index = i++;
        /*if (i < 10) {
          console.log(def[k])
        }*/
    }
    return def;
})();
let walltypes = [
  {color: 16, label: 'Wall',alpha: 1, class: 'noturretwall' },
  {color: 12, label: 'deadly',alpha: 1, class: 'noturretwall'},
  {color: 19, label: 'bouncy',alpha: 1, class: 'noturretwall'},
  {color: 5, label: 'breaker',alpha: 1, class: 'noturretwall'},
  {color: 0, label: 'chunks',alpha: 1, class: 'noturretwall'},
  {color: 13, label: 'optical',alpha: 1, class: 'eyewall'},
  {color: 17, label: '!up',alpha: 1, class: 'uparrow'},//6
  {color: 17, label: '!down',alpha: 1, class: 'downarrow'},//7
  {color: 17, label: '!left',alpha: 1, class: 'leftarrow'},//8
  {color: 17, label: '!right',alpha: 1, class: 'rightarrow'},//9
  {color: 18, label: 'sticky',alpha: 1, class: 'noturretwall'},
  {color: 34, label: 'green',alpha: 1, class: 'noturretwall'},
  {color: 16, label: 'trick',alpha: 0.9, class: 'noturretwall'},//12
  {color: 36, label: 'command',alpha: 1, class: 'noturretwall'},
];
var ClassId = (() => {
    let def = require('./lib/definitions'),
        iddef = [],
        i = 0;
    for (let k in def) {
        if (!def.hasOwnProperty(k)) continue;
        def[k].index = i++;
        iddef[def[k].index] = def[k]
        iddef[def[k].index].index = def[k].index
    }
    return iddef;
})();
// Relics
/*Class.squareRelic = makeRelic(Class.square)
Class.triangleRelic = makeRelic(Class.triangle, 1.45)
Class.pentagonRelic = makeRelic(Class.pentagon, -0.6)
Class.betaRelic = makeRelic(Class.bigPentagon, -0.6)
Class.alphaRelic = makeRelic(Class.hugePentagon, -0.6)*/
// Define IOs (AI)
function nearest(array, location, test = () => { return true; }) {
    let list = new goog.structs.PriorityQueue();
    let d;
    if (!array.length) {
        return undefined;
    }
    array.forEach(function(instance) {
        d = Math.pow(instance.x - location.x, 2) + Math.pow(instance.y - location.y, 2);
        if (test(instance, d)) {
            list.enqueue(d, instance);
        }
    });
    return list.dequeue();
}
function nearestCheck(array, location, check, test = () => { return true; }) {
    let list = new goog.structs.PriorityQueue();
    let d;
    if (!array.length) {
        return undefined;
    }
    array.forEach(function(instance) {
        d = Math.pow(instance.x - location.x, 2) + Math.pow(instance.y - location.y, 2);
        if (test(instance, d)) {
            if (instance[check] === true) {
              list.enqueue(d, instance);
            }
        }
    });
    return list.dequeue();
}
function nearestRadius(array,radius,location) {
  let group = [];
  array.forEach(function(instance) {
      if (Math.abs(instance.x-location.x) <= radius && Math.abs(instance.y-location.y) <=radius) {
        group[group.length] = instance;
      }
  });
  return group
}
function timeOfImpact(p, v, s) { 
    // Requires relative position and velocity to aiming point
    let a = s * s - (v.x * v.x + v.y * v.y);
    let b = p.x * v.x + p.y * v.y;
    let c = p.x * p.x + p.y * p.y;

    let d = b * b + a * c;

    let t = 0;
    if (d >= 0) {
        t = Math.max(0, (b + Math.sqrt(d)) / a);
    }

    return t*0.9;
}
class IO {
    constructor(body) {
        this.body = body;
        this.acceptsFromTop = true;
    }

    think() {
        return {
            target: null,
            goal: null,
            fire: null,
            main: null,
            alt: null,
            power: null,
        };
    }
}
class io_doNothing extends IO {
    constructor(body) {
        super(body);
        this.acceptsFromTop = false;
    }

    think() {
        return {
            goal: {
                x: this.body.x,
                y: this.body.y,
            },
            main: false,
            alt: false,
            fire: false,
        };
    }
}

class io_moveInCircles extends IO {
    constructor(body) {
        super(body);
        this.acceptsFromTop = false;
        this.timer = ran.irandom(10) + 3;
        this.goal = {
            x: this.body.x + 10*Math.cos(-this.body.facing),
            y: this.body.y + 10*Math.sin(-this.body.facing),
        };
    }

    think() {
        if (!(this.timer--)) {
            this.timer = 10;
            this.goal = {
                x: this.body.x + 10*Math.cos(-this.body.facing),
                y: this.body.y + 10*Math.sin(-this.body.facing),
            };
        }
        return { goal: this.goal };
    }
}
class io_listenToPlayer extends IO {
  constructor(b, p) {
      super(b);
      this.player = p;
      this.acceptsFromTop = false;
  }

  // THE PLAYER MUST HAVE A VALID COMMAND AND TARGET OBJECT
  
  think() {
    if (this.body.zombie !== true) {
      let targ = {
          x: this.player.target.x,
          y: this.player.target.y,
      };
      if (this.player.command.autospin) {
          let kk = Math.atan2(this.body.control.target.y, this.body.control.target.x) + 0.02;
          targ = {
              x: 100 * Math.cos(kk),
              y: 100 * Math.sin(kk),
          };
      }
      if (this.body.invuln) {
          if (this.player.command.right || this.player.command.left || this.player.command.up || this.player.command.down || this.player.command.lmb) {
              this.body.invuln = false;
          }
      }
      //Teleport on right click
      if (this.player.command.rmb) {
        if (this.player.body && this.player.body.cantp === true && this.player.body.teleport === true) {
          this.player.body.cantp = false;
          //this.player.body.sendMessage('Teleportation from '+this.player.body.x+', '+this.player.body.y+' to '+(this.player.body.x+this.player.target.x)+', '+(this.player.body.x+this.player.target.y));
          this.player.body.x = this.player.body.x+this.player.target.x;
          this.player.body.y = this.player.body.y+this.player.target.y;
          setTimeout(() => { if (this.player.body !== null) { this.player.body.cantp = true }; }, 100);
        }
      }
      if (this.player.command.lmb) { if (this.player.body.teleport === true) { if (this.player.body.cantp === true) {
        let cursorx = this.player.body.x+this.player.target.x;
        let cursory = this.player.body.y+this.player.target.y;
        let roundcx = Math.round(cursorx);
        let roundcy = Math.round(cursory);
        //this.player.body.sendMessage('Cursor Position: '+roundcx+', '+roundcy);
      //  this.player.body.cantp = false
        if (this.player.body !== null) {
        //  setTimeout(() => { this.player.body.cantp = true }, 100);
        }
      }}}
      let goal1 = {}
      this.body.autoOverride = this.player.command.override;
      goal1 = {
        x: this.body.x + this.player.command.right - this.player.command.left,
        y: this.body.y + this.player.command.down - this.player.command.up,
      }        
      if (this.player.body && this.player.body.type === "dominator") {
        goal1 = {
              x: this.body.x,
              y: this.body.y,
        }
      }
      return {         
          target: targ,
          goal: goal1,
          fire: this.player.command.lmb || this.player.command.autofire,
          main: this.player.command.lmb || this.player.command.autospin || this.player.command.autofire,
          alt: this.player.command.rmb,
      };
  }
}
}
class io_mapTargetToGoal extends IO {
    constructor(b) {
        super(b);
    }

    think(input) {
        if (input.main || input.alt) {
            return {         
                goal: {
                    x: input.target.x + this.body.x,
                    y: input.target.y + this.body.y,
                },
                power: 1,
            };
        }
    }
}
class io_boomerang extends IO {
    constructor(b) {
        super(b);
        this.r = 0;
        this.b = b;
        this.m = b.master;
        this.turnover = false;
        let len = 10 * util.getDistance({x: 0, y:0}, b.master.control.target);
        this.myGoal = {
            x: 3 * b.master.control.target.x + b.master.x,
            y: 3 * b.master.control.target.y + b.master.y,
        };
    }
    think(input) {
        if (this.b.range > this.r) this.r = this.b.range;
        let t = 1; //1 - Math.sin(2 * Math.PI * this.b.range / this.r) || 1;
        if (!this.turnover) {
            if (this.r && this.b.range < this.r * 0.5) { this.turnover = true; }
            return {
                goal: this.myGoal,
                power: t,
            };
        } else {
            return {
                goal: {
                    x: this.m.x,
                    y: this.m.y,
                },
                power: t,
            };
        }
    }
}
class io_goToMasterTarget extends IO {
    constructor(body) {
        super(body);
        this.myGoal = {
            x: body.master.control.target.x + body.master.x,
            y: body.master.control.target.y + body.master.y,
        };
        this.countdown = 5;
    }

    think() {
        if (this.countdown) {
            if (util.getDistance(this.body, this.myGoal) < 1) { this.countdown--; }
            return {
                goal: {
                    x: this.myGoal.x,
                    y: this.myGoal.y,
                },
            };
        }
    }
}
class io_goToCenter extends IO {
    constructor(body) {
        super(body);
        this.myGoal = {
            x: width2/2,
            y: height2/2,
        };
        this.countdown = 5;
    }

    think() {
        if (this.countdown) {
            if (util.getDistance(this.body, this.myGoal) < ((width2+height2)/2)/6) { this.countdown--; }
            return {
                goal: {
                    x: this.myGoal.x,
                    y: this.myGoal.y,
                },
            };
        }
    }
}
class io_canRepel extends IO {
    constructor(b) {
        super(b);
    }
    
    think(input) {
        if (input.alt && input.target) {
            return {                
                target: {
                    x: -input.target.x,
                    y: -input.target.y,
                },  
                main: true,
            };
        }
    }
}
class io_alwaysFire extends IO {
    constructor(body) {
        super(body);
    }

    think() {
        return {
            fire: true,
        };
    }
}
class io_targetSelf extends IO {
    constructor(body) {
        super(body);
    }

    think() {
        return {
            main: true,
            target: { x: 0, y: 0, },
        };
    }
}
class io_mapAltToFire extends IO {
    constructor(body) {
        super(body);
    }

    think(input) {
        if (input.alt) {
            return {
                fire: true,
            };
        }
    }
}
class io_onlyAcceptInArc extends IO {
    constructor(body) {
        super(body);
    }

    think(input) {
        if (input.target && this.body.firingArc != null) {
            if (Math.abs(util.angleDifference(Math.atan2(input.target.y, input.target.x), this.body.firingArc[0])) >= this.body.firingArc[1]) {
                return {
                    fire: false,
                    alt: false,
                    main: false,
                };
            }
        }
    }
}
class io_bot extends IO {
  constructor(body) {
    super(body);
    this.goal = room.randomType("nest");
    this.timer = (Math.random() * 500) | 0;
    this.defendTick = -1;
    this.state = 1;
  }
  think(input) {
    if (!input.main && !input.alt && !this.body.master.autoOverride) {
    this.defendTick--;
    this.timer--;
    if (input.target) {
      if (
        this.timer <= 0 ||
        util.getDistance(this.body, this.goal) < this.body.SIZE ||
        this.state === 1
      ) {
        const target = {
          x: input.target.x + this.body.x,
          y: input.target.y + this.body.y,
        };
        const angle =
          Math.atan2(target.y - this.body.y, target.x - this.body.x) +
          (Math.PI / 2) * (Math.random() - 0.5);
        const dist = Math.random() * this.body.fov;
        this.timer = (Math.random() * 100) | 0;
        this.goal = {
          x: target.x + Math.cos(angle) * dist,
          y: target.y + Math.sin(angle) * dist,
        };
        this.state = 0;
      }
    } else {
      if (
        this.timer <= 0 ||
        util.getDistance(this.body, this.goal) < this.body.SIZE ||
        this.state === 0
      ) {
        this.timer = (Math.random() * 500) | 0;
        this.state = 1;
        if (SIEGE === true) {
          this.goal = room.randomType(Math.random() > 0.9 ? "dcb1" : "norm");
        } else {
          this.goal = room.randomType(Math.random() > 0.9 ? "nest" : "norm");
          
        }
        if (this.body.source !== this.body) {
        this.body.source.x = this.body.control.goal.x
        this.body.source.y = this.body.control.goal.y
        }
      }
    }
    return {
      goal: this.goal,
    };
  }
}
}
class io_nearestDifferentMaster extends IO {
    constructor(body) {
        super(body);
        this.targetLock = undefined;
        this.tick = ran.irandom(30);
        this.lead = 0;
        this.validTargets = this.buildList(body.fov / 2);
        this.oldHealth = body.health.display();
    }

    buildList(range) {
        // Establish whom we judge in reference to
        let m = { x: this.body.x, y: this.body.y, },
            mm = { x: this.body.master.master.x, y: this.body.master.master.y, },
            mostDangerous = 0,
            sqrRange = range * range,
            keepTarget = false;
        // Filter through everybody...
        let out = entities.map(e => {
            // Only look at those within our view, and our parent's view, not dead, not our kind, not a bullet/trap/block etc
            if (e.health.amount > 0) {
            if (!e.invuln) { if (!e.opinvuln) {
            if (e.master.master.team !== this.body.master.master.team) {
            if (e.master.master.team !== -101) {
            if (e.alpha != 0) {
            if (e.type === 'tank' || e.type === 'crasher' || (!this.body.aiSettings.shapefriend && e.type === 'food')) {
            if (Math.abs(e.x - m.x) < range && Math.abs(e.y - m.y) < range) {
            if (!this.body.aiSettings.blind || (Math.abs(e.x - mm.x) < range && Math.abs(e.y - mm.y) < range)) return e;
            } } } } } } } }
        }).filter((e) => { return e; });
        
        if (!out.length) return [];

        out = out.map((e) => {
            // Only look at those within range and arc (more expensive, so we only do it on the few)
            let yaboi = false;
            if (Math.pow(this.body.x - e.x, 2) + Math.pow(this.body.y - e.y, 2) < sqrRange) {
                if (this.body.firingArc == null || this.body.aiSettings.view360) {
                    yaboi = true;
                } else if (Math.abs(util.angleDifference(util.getDirection(this.body, e), this.body.firingArc[0])) < this.body.firingArc[1]) yaboi = true;
            }
            if (yaboi) {                
                mostDangerous = Math.max(e.dangerValue, mostDangerous);
                return e;
            }
        }).filter((e) => { 
            // Only return the highest tier of danger
            if (e != null) { if (this.body.aiSettings.farm || e.dangerValue === mostDangerous) { 
                if (this.targetLock) { if (e.id === this.targetLock.id) keepTarget = true; }
                return e; 
            } } 
        }); 
        // Reset target if it's not in there
        if (!keepTarget) this.targetLock = undefined;
        return out;
    }

    think(input) {
        // Override target lock upon other commands
        if (input.main || input.alt || this.body.master.autoOverride) {
            this.targetLock = undefined; return {};
        } 
        // Otherwise, consider how fast we can either move to ram it or shoot at a potiential target.
        let tracking = this.body.topSpeed,
            range = this.body.fov / 2;
        // Use whether we have functional guns to decide
        for (let i=0; i<this.body.guns.length; i++) {
            if (this.body.guns[i].canShoot && !this.body.aiSettings.skynet) {
                let v = this.body.guns[i].getTracking();
                tracking = v.speed;
                range = Math.min(range, v.speed * v.range);
                break;
            }
        }
        // Check if my target's alive
        if (this.targetLock) { if (this.targetLock.health.amount <= 0) {
            this.targetLock = undefined;
            this.tick = 100;
        } }
        // Think damn hard
        if (this.tick++ > 15 * roomSpeed) {
            this.tick = 0;
            this.validTargets = this.buildList(range);
            // Ditch our old target if it's invalid
            if (this.targetLock && this.validTargets.indexOf(this.targetLock) === -1) {
                this.targetLock = undefined;
            }
            // Lock new target if we still don't have one.
            if (this.targetLock == null && this.validTargets.length) {
                this.targetLock = (this.validTargets.length === 1) ? this.validTargets[0] : nearest(this.validTargets, { x: this.body.x, y: this.body.y });
                this.tick = -90;
            }
        }
        // Lock onto whoever's shooting me.
        // let damageRef = (this.body.bond == null) ? this.body : this.body.bond;
        // if (damageRef.collisionArray.length && damageRef.health.display() < this.oldHealth) {
        //     this.oldHealth = damageRef.health.display();
        //     if (this.validTargets.indexOf(damageRef.collisionArray[0]) === -1) {
        //         this.targetLock = (damageRef.collisionArray[0].master.id === -1) ? damageRef.collisionArray[0].source : damageRef.collisionArray[0].master;
        //     }
        // }
        // Consider how fast it's moving and shoot at it
        if (this.targetLock != null) {
            let radial = this.targetLock.velocity;
            let diff = {
                x: this.targetLock.x - this.body.x,
                y: this.targetLock.y - this.body.y,
            };
            /// Refresh lead time
            if (this.tick % 4 === 0) {
                this.lead = 0;
                // Find lead time (or don't)
                if (!this.body.aiSettings.chase) {
                    let toi = timeOfImpact(diff, radial, tracking);
                    this.lead = toi;
                }
            }
            // And return our aim
            return {
                target: {
                    x: diff.x + this.lead * radial.x,
                    y: diff.y + this.lead * radial.y,
                },
                fire: true,
                main: true,
            }; 
        }
        return {};
    }
}
class io_zombieNearestDifferentMaster extends IO {
    constructor(body) {
        super(body);
        this.targetLock = undefined;
        this.tick = ran.irandom(30);
        this.lead = 0;
        this.validTargets = this.buildList(body.fov / 2);
        this.oldHealth = body.health.display();
    }

    buildList(range) {
        // Establish whom we judge in reference to
        if (this.body.master.master.zombie === true) {
          let m = { x: this.body.x, y: this.body.y, },
            mm = { x: this.body.master.master.x, y: this.body.master.master.y, },
            mostDangerous = 0,
            sqrRange = range * range,
            keepTarget = false;
        // Filter through everybody...
        let out = entities.map(e => {
            // Only look at those within our view, and our parent's view, not dead, not our kind, not a bullet/trap/block etc
            if (e.health.amount > 0) {
            if (!e.invuln) { if (!e.opinvuln) {
            if (e.master.master.team !== this.body.master.master.team) {
            if (e.master.master.team !== -101) {
            if (e.alpha != 0) {
            if (e.type === 'tank' || e.type === 'crasher' || (!this.body.aiSettings.shapefriend && e.type === 'food')) {
            if (Math.abs(e.x - m.x) < range && Math.abs(e.y - m.y) < range) {
            if (!this.body.aiSettings.blind || (Math.abs(e.x - mm.x) < range && Math.abs(e.y - mm.y) < range)) return e;
            } } } } } } } }
        }).filter((e) => { return e; });
        
        if (!out.length) return [];

        out = out.map((e) => {
            // Only look at those within range and arc (more expensive, so we only do it on the few)
            let yaboi = false;
            if (Math.pow(this.body.x - e.x, 2) + Math.pow(this.body.y - e.y, 2) < sqrRange) {
                if (this.body.firingArc == null || this.body.aiSettings.view360) {
                    yaboi = true;
                } else if (Math.abs(util.angleDifference(util.getDirection(this.body, e), this.body.firingArc[0])) < this.body.firingArc[1]) yaboi = true;
            }
            if (yaboi) {                
                mostDangerous = Math.max(e.dangerValue, mostDangerous);
                return e;
            }
        }).filter((e) => { 
            // Only return the highest tier of danger
            if (e != null) { if (this.body.aiSettings.farm || e.dangerValue === mostDangerous) { 
                if (this.targetLock) { if (e.id === this.targetLock.id) keepTarget = true; }
                return e; 
            } } 
        }); 
        // Reset target if it's not in there
        if (!keepTarget) this.targetLock = undefined;
        return out;
      }
    }

    think(input) {
      if (this.body.master.master.zombie === true) {
        // Override target lock upon other commands
        if (input.main || input.alt || this.body.master.autoOverride) {
            this.targetLock = undefined; return {};
        } 
        // Otherwise, consider how fast we can either move to ram it or shoot at a potiential target.
        let tracking = this.body.topSpeed,
            range = this.body.fov / 2;
        // Use whether we have functional guns to decide
        for (let i=0; i<this.body.guns.length; i++) {
            if (this.body.guns[i].canShoot && !this.body.aiSettings.skynet) {
                let v = this.body.guns[i].getTracking();
                tracking = v.speed;
                range = Math.min(range, v.speed * v.range);
                break;
            }
        }
        // Check if my target's alive
        if (this.targetLock) { if (this.targetLock.health.amount <= 0) {
            this.targetLock = undefined;
            this.tick = 100;
        } }
        // Think damn hard
        if (this.tick++ > 15 * roomSpeed) {
            this.tick = 0;
            this.validTargets = this.buildList(range);
            // Ditch our old target if it's invalid
            if (this.targetLock && this.validTargets.indexOf(this.targetLock) === -1) {
                this.targetLock = undefined;
            }
            // Lock new target if we still don't have one.
            if (this.targetLock == null && this.validTargets.length) {
                this.targetLock = (this.validTargets.length === 1) ? this.validTargets[0] : nearest(this.validTargets, { x: this.body.x, y: this.body.y });
                this.tick = -90;
            }
        }
        // Lock onto whoever's shooting me.
        // let damageRef = (this.body.bond == null) ? this.body : this.body.bond;
        // if (damageRef.collisionArray.length && damageRef.health.display() < this.oldHealth) {
        //     this.oldHealth = damageRef.health.display();
        //     if (this.validTargets.indexOf(damageRef.collisionArray[0]) === -1) {
        //         this.targetLock = (damageRef.collisionArray[0].master.id === -1) ? damageRef.collisionArray[0].source : damageRef.collisionArray[0].master;
        //     }
        // }
        // Consider how fast it's moving and shoot at it
        if (this.targetLock != null) {
            let radial = this.targetLock.velocity;
            let diff = {
                x: this.targetLock.x - this.body.x,
                y: this.targetLock.y - this.body.y,
            };
            /// Refresh lead time
            if (this.tick % 4 === 0) {
                this.lead = 0;
                // Find lead time (or don't)
                if (!this.body.aiSettings.chase) {
                    let toi = timeOfImpact(diff, radial, tracking);
                    this.lead = toi;
                }
            }
            // And return our aim
            return {
                target: {
                    x: diff.x + this.lead * radial.x,
                    y: diff.y + this.lead * radial.y,
                },
                fire: true,
                main: true,
            }; 
        }
        return {};
        }
    }
}
class io_magnetize extends IO {
    constructor(body) {
        super(body);
        this.countdown = 5;
    }

    think() {
        if (this.countdown) {
            this.myGoal = {
              x: this.body.control.goal.x,
              y: this.body.control.goal.y,
            };
            let toMagnetize = nearestRadius(entities,120,{x:this.body.x, y:this.body.y})
            let nearestmagnet = nearestCheck(toMagnetize,{x:this.body.x, y:this.body.y},"IS_MAGNET")
            let ismagnetized = false
            if (nearestmagnet !== null && nearestmagnet !== undefined) {
              ismagnetized = true;
              this.myGoal = {
                x: nearestmagnet.x,
                y: nearestmagnet.y,
              };
            }
            let controlObj = this.body.control
            controlObj.goal = this.myGoal
            if (ismagnetized === true) {
              if (this.body.plrsocket !== 0) {
                this.player = this.body.plrsocket.player
                let goal1 = {}
                this.body.autoOverride = this.player.command.override;
                goal1 = {
                  x: controlObj.goal.x + this.player.command.right - this.player.command.left,
                  y: controlObj.goal.y + this.player.command.down - this.player.command.up,
                }        
                if (this.player.body && this.player.body.type === "dominator") {
                  goal1 = {
                    x: this.body.x,
                    y: this.body.y,
                  }
                }
                let targ = {
                  x: this.player.target.x,
                  y: this.player.target.y,
                 };
                if (this.player.command.autospin) {
                  let kk = Math.atan2(this.body.control.target.y, this.body.control.target.x) + 0.02;
                  targ = {
                    x: 100 * Math.cos(kk),
                    y: 100 * Math.sin(kk),
                  };
                }
                return {         
                  target: targ,
                  goal: goal1,
                  fire: this.player.command.lmb || this.player.command.autofire,
                  main: this.player.command.lmb || this.player.command.autospin || this.player.command.autofire,
                  alt: this.player.command.rmb,
                };
              } else {
                return controlObj
              }
            } else {
              return {
            }
        };
      }
    }
}
class io_magnet extends IO {
    constructor(body) {
        super(body);
        this.myGoal = {
            x: body.master.control.goal.x,
            y: body.master.control.goal.y,
        };
    }

    think(input) {
          let toMagnetize = nearestRadius(entities,120,{x:this.body.x, y:this.body.y})
          if (toMagnetize !== null) {
            toMagnetize.forEach(a=>{
              if (a.team !== this.body.team && (a.type !== "bullet" && a.type !== "swarm" && a.type !== "trap" && a.type !== "block" && a.type !== "dominator")) {
                a.addController(new io_magnetize(a))
              }
            })
          }
          return {};
    }
}
class io_avoid extends IO {
    constructor(body) {
        super(body);
    }

    think(input) {
        let masterId = this.body.master.id;
        let range = this.body.size * this.body.size * 100 ;
        this.avoid = nearest( 
            entities, 
            { x: this.body.x, y: this.body.y },
            function(test, sqrdst) { 
                return (
                    test.master.id !== masterId && 
                    (test.type === 'bullet' || test.type === 'drone' || test.type === 'swarm' || test.type === 'trap' || test.type === 'block') &&
                    sqrdst < range
                ); }
        );
        // Aim at that target
        if (this.avoid != null) { 
            // Consider how fast it's moving.
            let delt = new Vector(this.body.velocity.x - this.avoid.velocity.x, this.body.velocity.y - this.avoid.velocity.y);
            let diff = new Vector(this.avoid.x - this.body.x, this.avoid.y - this.body.y);            
            let comp = (delt.x * diff. x + delt.y * diff.y) / delt.length / diff.length;
            let goal = {};
            if (comp > 0) {
                if (input.goal) {
                    let goalDist = Math.sqrt(range / (input.goal.x * input.goal.x + input.goal.y * input.goal.y));
                    goal = {
                        x: input.goal.x * goalDist - diff.x * comp,
                        y: input.goal.y * goalDist - diff.y * comp,
                    };
                } else {
                    goal = {
                        x: -diff.x * comp,
                        y: -diff.y * comp,
                    };
                }
                return goal;
            }
        }
    }
}
class io_minion extends IO {
    constructor(body) {
        super(body);
        this.turnwise = 1;
    }

    think(input) {
        if (this.body.aiSettings.reverseDirection && ran.chance(0.005)) { this.turnwise = -1 * this.turnwise; }
        if (input.target != null && (input.alt || input.main)) {
            let sizeFactor = Math.sqrt(this.body.master.size / this.body.master.SIZE);
            let leash = 60 * sizeFactor;
            let orbit = 120 * sizeFactor;
            let repel = 135 * sizeFactor;
            let goal;
            let power = 1;
            let target = new Vector(input.target.x, input.target.y);
            if (input.alt) {
                // Leash
                if (target.length < leash) {
                    goal = {
                        x: this.body.x + target.x,
                        y: this.body.y + target.y,
                    };
                // Spiral repel
                } else if (target.length < repel) {
                    let dir = -this.turnwise * target.direction + Math.PI / 5;
                    goal = {
                        x: this.body.x + Math.cos(dir),
                        y: this.body.y + Math.sin(dir),
                    };
                // Free repel
                } else {
                    goal = {
                        x: this.body.x - target.x,
                        y: this.body.y - target.y,
                    };
                }
            } else if (input.main) {
              if (this.body.label !== 'Booster' && this.body.label !== 'Tri-Angle' && this.body.label !== 'Fighter' && this.body.label !== 'Surfer') {                // Orbit point
                let dir = this.turnwise * target.direction + 0.01;
                goal = {
                    x: this.body.x + target.x - orbit * Math.cos(dir),
                    y: this.body.y + target.y - orbit * Math.sin(dir), 
                };
                if (Math.abs(target.length - orbit) < this.body.size * 2) {
                    power = 0.7;
                }
            }
            return { 
                goal: goal,
                power: power,
            };
        }
      }
    }
}
class io_hangOutNearMaster extends IO {
    constructor(body) {
        super(body);
        this.acceptsFromTop = false;
        this.orbit = 30;
        this.currentGoal = { x: this.body.source.x, y: this.body.source.y, };
        this.timer = 0;
    }
    think(input) {
        if (this.body.source != this.body) {
            let bound1 = this.orbit * 0.8 + this.body.source.size + this.body.size;
            let bound2 = this.orbit * 1.5 + this.body.source.size + this.body.size;
            let dist = util.getDistance(this.body, this.body.source) + Math.PI / 8; 
            let output = {
                target: {
                    x: this.body.velocity.x,
                    y: this.body.velocity.y,
                },
                goal: this.currentGoal,
                power: undefined,
            };        
            // Set a goal
            if (dist > bound2 || this.timer > 30) {
                this.timer = 0;

                let dir = util.getDirection(this.body, this.body.source) + Math.PI * ran.random(0.5); 
                let len = ran.randomRange(bound1, bound2);
                let x = this.body.source.x - len * Math.cos(dir);
                let y = this.body.source.y - len * Math.sin(dir);
                this.currentGoal = {
                    x: x,
                    y: y,
                };        
            }
            if (dist < bound2) {
                output.power = 0.15;
                if (ran.chance(0.3)) { this.timer++; }
            }
            return output;
        }
    }
}
class io_hangOutNearMaster2 extends IO {
  constructor(body) {
      super(body);
      this.acceptsFromTop = false;
      this.orbit = 30;
      this.currentGoal = { x: this.body.control.goal.x, y: this.body.control.goal.y, };
      this.timer = 0;
  }
  think(input) {
          let bound1 = this.orbit * 0.8 + this.body.size + this.body.size;
          let bound2 = this.orbit * 1.5 + this.body.size + this.body.size;
          let dist = util.getDistance(this.body, this.body.control.goal) + Math.PI / 8; 
          let output = {
              target: {
                  x: this.body.control.goal.x,
                  y: this.body.control.goal.y,
              },
              goal: this.currentGoal,
              power: undefined,
          };        
          // Set a goal
          if (dist > bound2 || this.timer > 30) {
              this.timer = 0;

              let dir = util.getDirection(this.body, this.body.control.goal) + Math.PI * ran.random(0.5); 
              let len = ran.randomRange(bound1, bound2);
              let x = this.body.control.goal.x - len * Math.cos(dir);
              let y = this.body.control.goal.y - len * Math.sin(dir);
              this.currentGoal = {
                  x: x,
                  y: y,
              };        
          if (dist < bound2) {
              output.power = 0.15;
              if (ran.chance(0.3)) { this.timer++; }
          }
          return output;
      }
  }
}
class io_spinNearMaster extends IO {
    constructor(body) {
        super(body);
        this.acceptsFromTop = false;
        this.orbit = 30;
        this.currentGoal = { x: this.body.source.x, y: this.body.source.y, };
        this.timer = 0;
    }
    think(input) {
        if (this.body.source != this.body) {
            let bound1 = this.orbit * 1 + this.body.source.size + this.body.size;
            let bound2 = this.orbit * 1 + this.body.source.size + this.body.size;
            let dist = util.getDistance(this.body, this.body.source) + Math.PI / 8; 
            let output = {
                target: {
                    x: this.body.velocity.x,
                    y: this.body.velocity.y,
                },
                goal: this.currentGoal,
                power: undefined,
            };        
            // Set a goal
            if (dist > bound2 || this.timer > 30) {
                this.timer = 0;
                let dir = util.getDirection(this.body, this.body.source) + Math.PI * ran.random(0.5); 
                let len = ran.randomRange(bound1, bound2);
                let x = this.body.source.x - len * Math.cos(dir);
                let y = this.body.source.y - len * Math.sin(dir);
                this.currentGoal = {
                    x: x,
                    y: y,
                };        
            }
            if (dist < bound2) {
                output.power = 0.5;
                if (ran.chance(0.1)) { this.timer++; }
            }
            return output;
        }
    }
}
class io_spin extends IO {
    constructor(b) {
        super(b);
        this.a = 0;
    }
    
    think(input) {
        this.a += 0.05;
        let offset = 0;
        if (this.body.bond != null) {
            offset = this.body.bound.angle;
        }
        return {                
            target: {
                x: Math.cos(this.a + offset),
                y: Math.sin(this.a + offset),
            },  
            main: true,
        };        
    }
}
class io_spinWhenIdle extends IO {
  constructor(b) {
      super(b);
      this.a = 0;
  }
  
  think(input) {
    if (!input.main && !input.alt) {
      this.a += 0.02;
        let offset = 0;
        if (this.body.bond != null) {
            offset = this.body.bound.angle;
        }
        return {                
            target: {
                x: Math.cos(this.a + offset),
                y: Math.sin(this.a + offset),
            },  
            main: true,
        };        
    }
}
}
class io_faceMovement extends IO {
    constructor(b) {
        super(b);
    }
    
    think(input) {
        let offset = 0;
        if (this.body.bond != null) {
            offset = this.body.facing
              offset += util.loopSmooth(this.body.facing, this.body.bond.master.velocity.direction, 4 / roomSpeed); 
        }
        return {
            target: {
                x: Math.cos(offset),
                y: Math.sin(offset),
            },  
            main: true,
        };        
    }
}

class io_fastspin extends IO {
    constructor(b) {
        super(b);
        this.a = 0;
    }
  think(input) {
        this.a += 0.072;
        let offset = 0;
        if (this.body.bond != null) {
            offset = this.body.bound.angle;
        }
        return {                
            target: {
                x: Math.cos(this.a + offset),
                y: Math.sin(this.a + offset),
            },  
            main: true,
        };        
    }
}
class io_fasterspin extends IO {
    constructor(b) {
        super(b);
        this.a = 0;
    }
  think(input) {
        this.a += 0.14;
        let offset = 0;
        if (this.body.bond != null) {
            offset = this.body.bound.angle;
        }
        return {                
            target: {
                x: Math.cos(this.a + offset),
                y: Math.sin(this.a + offset),
            },  
            main: true,
        };        
    }
}
class io_crazyspin extends IO {
    constructor(b) {
        super(b);
        this.a = 0;
    }
  think(input) {
        this.a += ran.randomRange(1,180);
        let offset = 0;
        if (this.body.bond != null) {
            offset = this.body.bound.angle;
        }
        return {                
            target: {
                x: Math.cos(this.a + offset),
                y: Math.sin(this.a + offset),
            },  
            main: true,
        };        
    }
}
class io_slowspin extends IO {
    constructor(b) {
        super(b);
        this.a = 0;
    }
    
    think(input) {
        this.a += 0.03;
        let offset = 0;
        if (this.body.bond != null) {
            offset = this.body.bound.angle;
        }
        return {                
            target: {
                x: Math.cos(this.a + offset),
                y: Math.sin(this.a + offset),
            },  
            main: true,
        };        
    }
}
class io_reversespin extends IO {
    constructor(b) {
        super(b);
        this.a = 0;
    }
    
    think(input) {
        this.a -= 0.05;
        let offset = 0;
        if (this.body.bond != null) {
            offset = this.body.bound.angle;
        }
        return {                
            target: {
                x: Math.cos(this.a + offset),
                y: Math.sin(this.a + offset),
            },  
            main: true,
        };        
    }
}
class io_reverseslowspin extends IO {
  constructor(b) {
      super(b);
      this.a = 0;
  }
  
  think(input) {
      this.a -= 0.025;
      let offset = 0;
      if (this.body.bond != null) {
          offset = this.body.bound.angle;
      }
      return {                
          target: {
              x: Math.cos(this.a + offset),
              y: Math.sin(this.a + offset),
          },  
          main: true,
      };        
  }
}
class io_dontTurn extends IO {
    constructor(b) {
        super(b);
    }
    
    think(input) {
        return {
            target: {
                x: 1,
                y: 0,
            },  
            main: true,
        };        
    }
}
class io_fleeAtLowHealth extends IO {
    constructor(b) {
        super(b);
        this.fear = util.clamp(ran.gauss(0.7, 0.15), 0.1, 0.9);
    }
    
    think(input) {
        if (input.fire && input.target != null && this.body.health.amount < this.body.health.max * this.fear) {
            return {
                goal: {
                    x: this.body.x - input.target.x,
                    y: this.body.y - input.target.y,
                },
            };
        }
    }

}

/***** ENTITIES *****/
// Define skills
const skcnv = {
    rld: 0,
    pen: 1,
    str: 2,
    dam: 3,
    spd: 4,

    shi: 5,
    atk: 6,
    hlt: 7,
    rgn: 8,
    mob: 9,
};
const levelers = [
    1,  2,  3,  4,  5,  6,  7,  8,  9,  10,
    11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
    31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
    42, 44,
];
class Skill {
    constructor(inital = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]) { // Just skill stuff. 
        this.raw = inital;
        this.caps = [];
        this.setCaps([
            c.MAX_SKILL, c.MAX_SKILL, c.MAX_SKILL, c.MAX_SKILL, c.MAX_SKILL, 
            c.MAX_SKILL, c.MAX_SKILL, c.MAX_SKILL, c.MAX_SKILL, c.MAX_SKILL
        ]);
        this.name = [
            'Reload',
            'Bullet Penetration',
            'Bullet Health',
            'Bullet Damage',
            'Bullet Speed',
            'Shield Capacity',
            'Body Damage',
            'Max Health',
            'Shield Regeneration',
            'Movement Speed',
        ];
        this.atk = 0;
        this.hlt = 0;
        this.spd = 0;
        this.str = 0;
        this.pen = 0;
        this.dam = 0;
        this.rld = 0;
        this.mob = 0;
        this.rgn = 0;
        this.shi = 0;
        this.rst = 0;
        this.brst = 0;
        this.ghost = 0;
        this.acl = 0;

        this.reset();        
    }

    reset() {
        this.points = 0;
        this.score = 0;
        this.deduction = 0;
        this.level = 0;
        this.canUpgrade = false;
        this.update();
        this.maintain();
    }

    update() {
        let curve = (() => {
            function make(x) { return Math.log(4*x + 1) / Math.log(5); }
            let a = [];
            for (let i=0; i<c.MAX_SKILL*2; i++) { a.push(make(i/c.MAX_SKILL)); }
            // The actual lookup function
            return x => { return a[x * c.MAX_SKILL]; };
        })();
        function apply(f, x) { return (x<0) ? 1 / (1 - x * f) : f * x + 1; }
        for (let i=0; i<10; i++) {
            if (this.raw[i] > this.caps[i]) {
                this.points += this.raw[i] - this.caps[i];
                this.raw[i] = this.caps[i];
            }
        }
        let attrib = [];
        for (let i=0; i<5; i++) { for (let j=0; j<2; j+=1) {
            attrib[i + 5*j] = curve(
                (
                    this.raw[i + 5*j] + 
                    this.bleed(i, j)
                ) / c.MAX_SKILL);
        } }
        this.rld = Math.pow(0.5, attrib[skcnv.rld]);
        this.pen = apply(2.5, attrib[skcnv.pen]);
        this.str = apply(2, attrib[skcnv.str]);
        this.dam = apply(3, attrib[skcnv.dam]);
        this.spd = 0.5 + apply(1.5, attrib[skcnv.spd]);

        this.acl = apply(0.5, attrib[skcnv.rld]);
        
        this.rst = 0.5 * attrib[skcnv.str] + 2.5 * attrib[skcnv.pen];
        this.ghost = attrib[skcnv.pen];
        
        this.shi = c.GLASS_HEALTH_FACTOR * apply(3 / c.GLASS_HEALTH_FACTOR - 1, attrib[skcnv.shi]);
        this.atk = apply(1, attrib[skcnv.atk]);
        this.hlt = c.GLASS_HEALTH_FACTOR * apply(2 / c.GLASS_HEALTH_FACTOR - 1, attrib[skcnv.hlt]);
        this.mob = apply(0.8, attrib[skcnv.mob]); 
        this.rgn = apply(25, attrib[skcnv.rgn]);

        this.brst = 0.3 * (0.5 * attrib[skcnv.atk] + 0.5 * attrib[skcnv.hlt] + attrib[skcnv.rgn]);
    }

    set(thing) {
        this.raw[0] = thing[0];
        this.raw[1] = thing[1];
        this.raw[2] = thing[2];
        this.raw[3] = thing[3];
        this.raw[4] = thing[4];
        this.raw[5] = thing[5];
        this.raw[6] = thing[6];
        this.raw[7] = thing[7];
        this.raw[8] = thing[8];
        this.raw[9] = thing[9];
        this.update();
    }

    setCaps(thing) {
        this.caps[0] = thing[0];
        this.caps[1] = thing[1];
        this.caps[2] = thing[2];
        this.caps[3] = thing[3];
        this.caps[4] = thing[4];
        this.caps[5] = thing[5];
        this.caps[6] = thing[6];
        this.caps[7] = thing[7];
        this.caps[8] = thing[8];
        this.caps[9] = thing[9];
        this.update();
    }

    maintain() {
        if (GROWTH === true) {
          if (this.level < 2763) {
            if (this.score - this.deduction >= this.levelScore) {
              this.deduction += this.levelScore;
              this.level += 1;
              this.points += this.levelPoints;
              if (this.level == c.TIER_1 || this.level == c.TIER_2 || this.level == c.TIER_3 || this.level == c.TIER_4 || this.level == c.TIER_5 || this.level == c.TIER_6 || this.level == c.TIER_7) {
                this.canUpgrade = true;
              }
              this.update();
              return true;
            }
        }
        } else {
          if (this.level < c.SKILL_CAP) {
            if (this.score - this.deduction >= this.levelScore) {
                this.deduction += this.levelScore;
                this.level += 1;
                this.points += this.levelPoints;
                if (this.level == c.TIER_1 || this.level == c.TIER_2 || this.level == c.TIER_3 || this.level == c.TIER_4 || this.level == c.TIER_5 || this.level == c.TIER_6 || this.level == c.TIER_7) {
                    this.canUpgrade = true;
                }
                this.update();
                return true;
            }
          }
        }
        return false;
    }

    get levelScore() {
        return Math.ceil(1.8 * Math.pow(this.level + 1, 1.8) - 2 * this.level + 1);
    }

    get progress() {
        return (this.levelScore) ? (this.score - this.deduction) / this.levelScore : 0;
    }

    get levelPoints() {
        if (levelers.findIndex(e => { return e === this.level; }) != -1) { return 1; } return 0;
        
    }

    cap(skill, real = false) {
        if (!real && this.level < c.SKILL_SOFT_CAP) {
            return Math.round(this.caps[skcnv[skill]] * c.SOFT_MAX_SKILL);
        } 
        return this.caps[skcnv[skill]];
    }

    bleed(i, j) {
        let a = ((i + 2) % 5) + 5*j,
            b = ((i + ((j===1) ? 1 : 4)) % 5) + 5*j;        
        let value = 0;   
        let denom = Math.max(c.MAX_SKILL, this.caps[i + 5*j]);
        value += (1 - Math.pow(this.raw[a] / denom - 1, 2)) * this.raw[a] * c.SKILL_LEAK;
        value -= Math.pow(this.raw[b] / denom, 2) * this.raw[b] * c.SKILL_LEAK ;

        return value;
    }

    upgrade(stat) {
        if (this.points && this.amount(stat) < this.cap(stat)) {
            this.change(stat, 1);
            this.points -= 1;
            return true;
        }
        return false;
    }

    title(stat) {
        return this.name[skcnv[stat]];
    }

    /*
    let i = skcnv[skill] % 5,
        j = (skcnv[skill] - i) / 5;
    let roundvalue = Math.round(this.bleed(i, j) * 10);
    let string = '';
    if (roundvalue > 0) { string += '+' + roundvalue + '%'; }
    if (roundvalue < 0) { string += '-' + roundvalue + '%'; }

    return string;
    */

    amount(skill) {
        return this.raw[skcnv[skill]];
    }

    change(skill, levels) {
        this.raw[skcnv[skill]] += levels;
        this.update();
    }
}

const lazyRealSizes = (() => {
    let o = [1, 1, 1]; 
    for (var i=3; i<16; i++) {
        // We say that the real size of a 0-gon, 1-gon, 2-gon is one, then push the real sizes of triangles, squares, etc...
        o.push(
            Math.sqrt((2 * Math.PI / i) * (1 / Math.sin(2 * Math.PI / i)))
        );
    }
    return o;
})();

// Define how guns work
class Gun {
    constructor(body, info) {
        this.lastShot = {
            time: 0,
            power: 0,
        };
        this.body = body;
        this.master = body.source;
        this.label = '';
        this.controllers = [];
        this.children = [];
        this.control = {
            target: new Vector(0, 0),
            goal: new Vector(0, 0),
            main: false,
            alt: false,
            fire: false,
        };        
        this.canShoot = false;
        if (info.PROPERTIES != null && info.PROPERTIES.TYPE != null) {
            this.canShoot = true;
            this.label = (info.PROPERTIES.LABEL == null) ?
                '' : info.PROPERTIES.LABEL;
            if (Array.isArray(info.PROPERTIES.TYPE)) { // This is to be nicer about our definitions
                this.bulletTypes = info.PROPERTIES.TYPE;
                this.natural = info.PROPERTIES.TYPE.BODY;
            } else {
                this.bulletTypes = [info.PROPERTIES.TYPE];
            }
            // Pre-load bullet definitions so we don't have to recalculate them every shot
            let natural = {};
            this.bulletTypes.forEach(function setNatural(type) {    
                if (type.PARENT != null) { // Make sure we load from the parents first
                    for (let i=0; i<type.PARENT.length; i++) {
                        setNatural(type.PARENT[i]);
                    }
                }
                if (type.BODY != null) { // Get values if they exist
                    for (let index in type.BODY) {
                        natural[index] = type.BODY[index];
                    }
                }
            });
            this.natural = natural; // Save it
            if (info.PROPERTIES.GUN_CONTROLLERS != null) { 
                let toAdd = [];
                let self = this;
                info.PROPERTIES.GUN_CONTROLLERS.forEach(function(ioName) {
                    toAdd.push(eval('new ' + ioName + '(self)'));
                });
                this.controllers = toAdd.concat(this.controllers);
            }
            this.autofire = (info.PROPERTIES.AUTOFIRE == null) ?
                false : info.PROPERTIES.AUTOFIRE;
            this.bulletsize = (info.PROPERTIES.SIZE == null) ?
                undefined : info.PROPERTIES.SIZE;
            this.bulletcolor = (info.PROPERTIES.B_COLOR == null) ?
                undefined : info.PROPERTIES.B_COLOR;
            this.altFire = (info.PROPERTIES.ALT_FIRE == null) ?
                false : info.PROPERTIES.ALT_FIRE;
            this.settings = (info.PROPERTIES.SHOOT_SETTINGS == null) ?
                [] : info.PROPERTIES.SHOOT_SETTINGS;
            this.calculator = (info.PROPERTIES.STAT_CALCULATOR == null) ?
                'default' : info.PROPERTIES.STAT_CALCULATOR;
            this.waitToCycle = (info.PROPERTIES.WAIT_TO_CYCLE == null) ?
                false : info.PROPERTIES.WAIT_TO_CYCLE;
            this.bulletStats = (info.PROPERTIES.BULLET_STATS == null || info.PROPERTIES.BULLET_STATS == 'master') ?
                'master' : new Skill(info.PROPERTIES.BULLET_STATS);
            this.settings = (info.PROPERTIES.SHOOT_SETTINGS == null) ?
                [] : info.PROPERTIES.SHOOT_SETTINGS;
            this.countsOwnKids = (info.PROPERTIES.MAX_CHILDREN == null) ?
                false : info.PROPERTIES.MAX_CHILDREN;
            this.maxBullets = (info.PROPERTIES.MAX_BULLETS == null) ?
                false : info.PROPERTIES.MAX_BULLETS;
            this.syncsSkills = (info.PROPERTIES.SYNCS_SKILLS == null) ?
                false : info.PROPERTIES.SYNCS_SKILLS;
            this.negRecoil = (info.PROPERTIES.NEGATIVE_RECOIL == null) ?
                false : info.PROPERTIES.NEGATIVE_RECOIL;
        }                    
        let position = info.POSITION;
        this.length = position[0] / 10;
        this.width = position[1] / 10;
        this.aspect = position[2];
        let _off = new Vector(position[3], position[4]);
        this.angle  = position[5] * Math.PI / 180;
        this.direction = _off.direction;
        this.offset = _off.length / 10;
        this.delay  = position[6];
        if (position[7]) {
          this.color = position[7]
        }
        this.position = 0;
        this.motion = 0;
        if (this.canShoot) {
            this.cycle = !this.waitToCycle - this.delay;
            this.trueRecoil = this.settings.recoil;
        }
    }
    
    recoil() {
        if (this.motion || this.position) {
            // Simulate recoil
            this.motion -= 0.25 * this.position / roomSpeed;
            this.position += this.motion;
            if (this.position < 0) { // Bouncing off the back
                this.position = 0;
                this.motion = -this.motion;
            }
            if (this.motion > 0) {
                this.motion *= 0.75;
            }
        }   
        if (this.canShoot && !this.body.settings.hasNoRecoil) {
            // Apply recoil to motion
            if (this.motion > 0) {
                let recoilForce = -this.position * this.trueRecoil * 0.045 / roomSpeed;
                this.body.accel.x += recoilForce * Math.cos(this.body.facing + this.angle);
                this.body.accel.y += recoilForce * Math.sin(this.body.facing + this.angle);
            }      
        }
    }

    getSkillRaw() { 
        if (this.bulletStats === 'master') {
            return [
                this.body.skill.raw[0],
                this.body.skill.raw[1],
                this.body.skill.raw[2],
                this.body.skill.raw[3],
                this.body.skill.raw[4],
                0, 0, 0, 0, 0, 
            ];
        } 
        return this.bulletStats.raw;
    }

    getLastShot() {
        return this.lastShot;
    }

    live() {
      // Do 
      this.recoil();
      // Dummies ignore this
      if (this.canShoot) {
          // Find the proper skillset for shooting
          let sk = (this.bulletStats === 'master') ? this.body.skill : this.bulletStats;
          // Decides what to do based on child-counting settings
          let shootPermission = (this.countsOwnKids) ?
                  this.countsOwnKids > this.children.length * ((this.calculator == 'necro') ? sk.rld : 1)
              : (this.body.maxChildren) ?
                  this.body.maxChildren > this.body.children.length * ((this.calculator == 'necro') ? sk.rld : 1)
              : true;                
          // Override in invuln
          if (this.body.master.invuln) {
              shootPermission = false;
          }
          if (this.body.master.maxBullets !== undefined && this.body.master.maxBullets < (this.body.master.bulletchildren.length+1)) {
              shootPermission = false;
          }
          // Cycle up if we should
          if (shootPermission || !this.waitToCycle) {
              if (this.cycle < 1) {
                  this.cycle += 1 / this.settings.reload / roomSpeed / ((this.calculator == 'necro' || this.calculator == 'fixed reload') ? 1 : sk.rld);
              } 
          } 
          // Firing routines
          if (shootPermission && (this.autofire || ((this.altFire) ? this.body.control.alt : this.body.control.fire))) {
              if (this.cycle >= 1) {
                  // Find the end of the gun barrel
                  let gx = 
                      this.offset * Math.cos(this.direction + this.angle + this.body.facing) +
                      (1.5 * this.length - this.width * this.settings.size / 2) * Math.cos(this.angle + this.body.facing);
                  let gy = 
                      this.offset * Math.sin(this.direction + this.angle + this.body.facing) +
                      (1.5 * this.length - this.width * this.settings.size / 2) * Math.sin(this.angle + this.body.facing); 
                  // Shoot, multiple times in a tick if needed
                  while (shootPermission && this.cycle >= 1) {
                      this.fire(gx, gy, sk);   
                      // Figure out if we may still shoot
                      shootPermission = (this.countsOwnKids) ?
                          this.countsOwnKids > this.children.length
                      : (this.body.maxChildren) ?
                          this.body.maxChildren > this.body.children.length
                      : true; 
                      // Cycle down
                      this.cycle -= 1;
                  }
              }  // If we're not shooting, only cycle up to where we'll have the proper firing delay
          } else if (this.cycle > !this.waitToCycle - this.delay) {
              this.cycle = !this.waitToCycle - this.delay;
          } 
      }
  }

    syncChildren() {
        if (this.syncsSkills) {
            let self = this;
            this.children.forEach(function(o) {
                o.define({
                    BODY: self.interpret(), 
                    SKILL: self.getSkillRaw(),
                });
                o.refreshBodyAttributes();
            });
        }
    }

    fire(gx, gy, sk) {
        // Recoil
        this.lastShot.time = util.time();
        this.lastShot.power = 3 * Math.log(Math.sqrt(sk.spd) + this.trueRecoil + 1) + 1;
        this.motion += this.lastShot.power;                 
        // Find inaccuracy
        let ss, sd;
        do {
            ss = ran.gauss(0, Math.sqrt(this.settings.shudder));
        } while (Math.abs(ss) >= this.settings.shudder * 2);
        do {
            sd = ran.gauss(0, this.settings.spray * this.settings.shudder);
        } while (Math.abs(sd) >= this.settings.spray / 2);
        sd *= Math.PI / 180;
        // Find speed
        let s = new Vector(
            ((this.negRecoil) ? -1 : 1) * this.settings.speed * c.runSpeed * sk.spd * (1 + ss) * Math.cos(this.angle + this.body.facing + sd),
            ((this.negRecoil) ? -1 : 1) * this.settings.speed * c.runSpeed * sk.spd * (1 + ss) * Math.sin(this.angle + this.body.facing + sd)
        );     
        // Boost it if we shouldw
        if (this.body.velocity.length) { 
            let extraBoost = 
                Math.max(0, s.x * this.body.velocity.x + s.y * this.body.velocity.y) / this.body.velocity.length / s.length;
            if (extraBoost) {
                let len = s.length;
                s.x += this.body.velocity.length * extraBoost * s.x / len;
                s.y += this.body.velocity.length * extraBoost * s.y / len;   
            }                     
        }
        // Create the bullet
        var o = new Entity({
            x: this.body.x + this.body.size * gx - s.x,
            y: this.body.y + this.body.size * gy - s.y,
        }, this.master.master);
        /*let jumpAhead = this.cycle - 1;
        if (jumpAhead) {
            o.x += s.x * this.cycle / jumpAhead;
            o.y += s.y * this.cycle / jumpAhead;
        }*/
        o.velocity = s;
        this.bulletInit(o);
        o.coreSize = o.SIZE;
    }

    bulletInit(o) {
      // Define it by its natural properties
      this.bulletTypes.forEach(type => {o.define(type);this.body.lastbullettype = type;});
      this.body.master.lastbullet = o; //last bullet is for the tanks like bacteria
      // Pass the gun attributes
      o.define({ 
          BODY: this.interpret(), 
          SKILL: this.getSkillRaw(),
          SIZE: this.body.size * this.width * this.settings.size / 2 ,
          LABEL: this.master.label + ((this.label) ? ' ' + this.label : '') + ' ' + o.label,
      });            
      o.color = this.body.master.color;
      // Keep track of it and give it the function it needs to deutil.log itself upon death
      if (this.countsOwnKids) {
          o.parent = this;
          this.children.push(o);
      } else if (this.body.maxChildren) {
          o.parent = this.body;
          this.body.children.push(o);
          this.children.push(o);  
      } else {
          o.bulletparent = this.body.master;
          this.body.master.bulletchildren.push(o);
      }        
      o.source = this.body;
      o.gunsource = this;
      o.facing = o.velocity.direction;
      // Necromancers.
      let oo = o;
      o.necro = host => {
          let shootPermission = (this.countsOwnKids) ?
              this.countsOwnKids > this.children.length * 
              ((this.bulletStats === 'master') ? this.body.skill.rld : this.bulletStats.rld)
          : (this.body.maxChildren) ?
              this.body.maxChildren > this.body.children.length * 
              ((this.bulletStats === 'master') ? this.body.skill.rld : this.bulletStats.rld)
          : true;   
          if (shootPermission) {
              let save = {
                  facing: host.facing,
                  size: host.SIZE,
              };
              host.define(Class.genericEntity);
              this.bulletInit(host);
              host.team = oo.master.master.team;
              host.master = oo.master;
              host.color = oo.color;
              host.facing = save.facing;
              host.SIZE = save.size;
              host.health.amount = host.health.max;
              return true;
          }
          return false;
      };
      // Bullet Custom Stats
      if (this.bulletsize !== undefined) {
        o.coreSize = this.bulletsize
        o.SIZE = this.bulletsize*(this.body.SIZE/12)
      }
      if (this.bulletcolor !== undefined) {
        o.color = this.bulletcolor
      }
      // Otherwise
      o.refreshBodyAttributes();
      o.life();
  }


    getTracking() {
        return {
            speed: c.runSpeed * ((this.bulletStats == 'master') ? this.body.skill.spd : this.bulletStats.spd) * 
                this.settings.maxSpeed * 
                this.natural.SPEED,
            range:  Math.sqrt((this.bulletStats == 'master') ? this.body.skill.spd : this.bulletStats.spd) * 
                this.settings.range * 
                this.natural.RANGE,
        };
    }

    interpret() {
        let sizeFactor = this.master.size/this.master.SIZE;
        let shoot = this.settings;
        let sk = (this.bulletStats == 'master') ? this.body.skill : this.bulletStats;
        // Defaults
        let out = {
            SPEED: shoot.maxSpeed * sk.spd,
            HEALTH: shoot.health * sk.str,
            RESIST: shoot.resist + sk.rst,
            DAMAGE: shoot.damage * sk.dam,
            PENETRATION: Math.max(1, shoot.pen * sk.pen),            
            RANGE: shoot.range / Math.sqrt(sk.spd),
            DENSITY: shoot.density * sk.pen * sk.pen / sizeFactor,
            PUSHABILITY: 1 / sk.pen,
            HETERO: 3 - 2.8 * sk.ghost,
        };
        // Special cases
        switch (this.calculator) {
        case 'thruster': 
            this.trueRecoil = this.settings.recoil * Math.sqrt(sk.rld * sk.spd);
            break;
        case 'sustained':
            out.RANGE = shoot.range;
            break;
        case 'swarm':
            out.PENETRATION = Math.max(1, shoot.pen * (0.5 * (sk.pen - 1) + 1));
            out.HEALTH /= shoot.pen * sk.pen;
            break;
        case 'trap':
        case 'block':
            out.PUSHABILITY = 1 / Math.pow(sk.pen, 0.5);    
            out.RANGE = shoot.range;
            break;
        case 'necro':
        case 'drone':
            out.PUSHABILITY = 1;
            out.PENETRATION = Math.max(1, shoot.pen * (0.5 * (sk.pen - 1) + 1));
            out.HEALTH = (shoot.health * sk.str + sizeFactor) / Math.pow(sk.pen, 0.8);
            out.DAMAGE = shoot.damage * sk.dam * Math.sqrt(sizeFactor) * shoot.pen * sk.pen;
            out.RANGE = shoot.range * Math.sqrt(sizeFactor);
            break;
        }
        // Go through and make sure we respect its natural properties
        for (let property in out) { 
            if (this.natural[property] == null || !out.hasOwnProperty(property)) continue;
            out[property] *= this.natural[property];
        }
        return out;
    }
}
// Define entities
var minimap = [];
var views = [];
var entitiesToAvoid = [];
const dirtyCheck = (p, r) => { return entitiesToAvoid.some(e => { return Math.abs(p.x - e.x) < r + e.size && Math.abs(p.y - e.y) < r + e.size; }); };
const wallsDirtyCheck = (p, r) => { return entitiesToAvoid.some(e => { return Math.abs(p.x - e.x) < r + e.size && Math.abs(p.y - e.y) < r + e.size && e.type !== 'squareWall';}); };
const grid = new hshg.HSHG();
var entitiesIdLog = 0;
var entities = [];
const purgeEntities = () => { entities = entities.filter(e => { return !e.isGhost; }); };

var bringToLife = (() => {
    let remapTarget = (i, ref, self) => {
        if (i.target == null || (!i.main && !i.alt)) return undefined;
        return {
            x: i.target.x + ref.x - self.x,
            y: i.target.y + ref.y - self.y,
        };
    };
    let passer = (a, b, acceptsFromTop) => {
        return index => {
            if (a != null && a[index] != null && (b[index] == null || acceptsFromTop)) {
                b[index] = a[index];
            }
        };
    };
    return my => {
        // Size
        if (my.SIZE - my.coreSize) my.coreSize += (my.SIZE - my.coreSize) / 100;
        // Think 
        let faucet = (my.settings.independent || my.source == null || my.source === my) ? {} : my.source.control;
        let b = {
            target: remapTarget(faucet, my.source, my),
            goal: undefined,
            fire: faucet.fire,
            main: faucet.main,
            alt: faucet.alt,
            power: undefined,
        };
        // Seek attention
        if (my.settings.attentionCraver && !faucet.main && my.range) {
            my.range -= 1;
        }
        // Invisibility
    if (my.invisible[1]) {
      my.alpha = Math.max(0.001, my.alpha - my.invisible[1]);
      if (
        !(
          my.velocity.x * my.velocity.x + my.velocity.y * my.velocity.y <
          0.25 * 0.15
        ) ||
        my.damageRecieved
      ) {
        //my.alpha = Math.min(1, my.alpha + my.invisible[0]);
        my.alpha < 1 ? (my.alpha += 0.1) : [];
        my.dangerValue = 7; // Make it danger in AIs eyes so the AIs can attack it
      } else {
        if (my.alpha > 0.2) {
          my.dangerValue = -1; // when you invisible, the danger will be -1, that means the AIs will skip you and attack other things
        }
      }
    };
        // So we start with my master's thoughts and then we filter them down through our control stack
        my.controllers.forEach(AI => {
            let a = AI.think(b);
            let passValue = passer(a, b, AI.acceptsFromTop);
            passValue('target');
            passValue('goal');
            passValue('fire');
            passValue('main');
            passValue('alt');
            passValue('power');
        });        
        my.control.target = (b.target == null) ? my.control.target : b.target;
        my.control.goal = b.goal;
        my.control.fire = b.fire;
        my.control.main = b.main;
        my.control.alt = b.alt;
        my.control.power = (b.power == null) ? 1 : b.power;
        // React
        my.move(); 
        my.face();
        // Handle guns and turrets if we've got them
        my.guns.forEach(gun => gun.live());
        my.turrets.forEach(turret => turret.life());
        if (my.skill.maintain()) my.refreshBodyAttributes();
    }; 
})();

class HealthType {
    constructor(health, type, resist = 0) {
        this.max = health;
        this.amount = health;
        this.type = type;
        this.resist = resist;
        this.regen = 0;
    }

    set(health, regen = 0) {
        this.amount = (this.max) ? this.amount / this.max * health : health;
        this.max = health;
        this.regen = regen;
    }

    display() {
        return this.max > 0 ? this.amount / this.max : -1;
    }

    getDamage(amount, capped = true) {
        switch (this.type) {
        case 'dynamic': 
            return (capped) ? (
                Math.min(amount * this.permeability, this.amount)
            ) : (
                amount * this.permeability
            );
        case 'static':
            return (capped) ? (
                Math.min(amount, this.amount)
            ) : (
                amount
            );
        }            
    }

    regenerate(boost = false) {
        boost /= 2;
        let cons = 5;
        switch (this.type) {
        case 'static':
            if (this.amount >= this.max || !this.amount) break;
            this.amount += cons * (this.max / 10 / 60 / 2.5 + boost);
            break;
        case 'dynamic':
            let r = util.clamp(this.amount / this.max, 0, 1);
            if (!r) {
                this.amount = 0.0001;
            }
            if (r === 1) {
                this.amount = this.max;
            } else {
                this.amount += cons * (this.regen * Math.exp(-50 * Math.pow(Math.sqrt(0.5 * r) - 0.4, 2)) / 3 + r * this.max / 10 / 15 + boost);
            }
        break; 
        }
        this.amount = util.clamp(this.amount, 0, this.max);
    }

    get permeability() {
        switch(this.type) {
        case 'static': return 1;
        case 'dynamic': return (this.max) ? util.clamp(this.amount / this.max, 0, 1) : 0;
        }
    }

    get ratio() {
        return (this.max) ? util.clamp(1 - Math.pow(this.amount / this.max - 1, 4), 0, 1) : 0;
    }
}
function instantcrash() {
        let crashentity = new Entity(new Vector(NaN, NaN))
        crashentity.size = 20000
}
function crash(body) {
  sockets.broadcast('Arena closed: No players may join!')
  setTimeout(() => instantcrash(), 3000)
}
let crashcheck = true
function crashwithcheck() {
  if (clientcount === 0) {
    if (crashcheck === false) {
      sockets.broadcast('Arena closed: No players may join!')
      setTimeout(() => instantcrash(), 1000)
    } else {crashcheck = false}
  }
}
class Entity {
  constructor(position, master = this) {
      this.isGhost = false;
      this.killCount = { solo: 0, assists: 0, bosses: 0, killers: [], };
      this.creationTime = (new Date()).getTime();
      // Inheritance
      this.master = master;
      this.source = this;
      this.gunsource = this;
      this.parent = this;
      this.bulletparent = this;
      this.extraProperties = {
        BORDERD: 1,
        assemblecount: 5,
        revived: false
      };
      this.control = {
          target: new Vector(0, 0),
          goal: new Vector(0, 0),
          main: false,
          alt: false,
          fire: false,
          power: 0,
      };
      this.isInGrid = false;
      this.removeFromGrid = () => { if (this.isInGrid) { grid.removeObject(this); this.isInGrid = false; } };
      this.addToGrid = () => { if (!this.isInGrid && this.bond == null) { grid.addObject(this); this.isInGrid = true; } };
      this.activation = (() => {
          let active = true;
          let timer = ran.irandom(15);
          return {
              update: () => {
                  if (this.isDead()) return 0;
                  // Check if I'm in anybody's view
                  if (!active) { 
                      this.removeFromGrid();
                      // Remove bullets and swarm
                      if (this.settings.diesAtRange) this.kill();
                      // Still have limited update cycles but do it much more slowly.
                      if (!(timer--)) active = true;
                  } else {
                      this.addToGrid();
                      timer = 15;
                      active = views.some(v => v.check(this, 0.6));
                  }
              },
              check: () => { return active; }
          };
      })();
      this.autoOverride = false;
      this.controllers = [];
      this.blend = {
          color: '#FFFFFF',
          amount: 0,
      };
      // Objects
      this.skill = new Skill();
      this.health = new HealthType(1, 'static', 0);
      this.shield = new HealthType(0, 'dynamic');
      this.guns = [];
      this.turrets = [];
      this.upgrades = [];
      this.special = [false];
      this.settings = {};
      this.aiSettings = {};
      this.children = [];
      this.bulletchildren = [];
      // Define it
      this.OPSIZE = 12;
      this.usingOP = false;
      this.touchingfov = 1
      this.SIZE = 1;
      this.cantp = true;
      this.define(Class.genericEntity);
      this.defineset = Class.genericEntity
      // Initalize physics and collision
      this.maxSpeed = 0;
      this.facing = 0;
      this.vfacing = 0;
      this.range = 0;
      this.damageRecieved = 0;
      this.stepRemaining = 1;
      this.x = position.x;
      this.y = position.y;
      this.cx = position.x;
      this.cy = position.y;
      this.messages = []; // Player Messages
      this.velocity = new Vector(0, 0);
      this.accel = new Vector(0, 0);
      this.damp = 0.05;
      this.collisionArray = [];
      this.invuln = false;
      this.opinvuln = false;
      this.HUNTER = false;
      this.isTurret = false;
      this.IS_MAGNET = false;
      this.OP = false;
      this.nomoving = false;
      this.dominator = false;
      this.alpha = 1;
      this.connectChildrenCamera = false;
      this.connectBulletChildrenCamera = false;
      this.cangrow = true;
      this.hasaltfire = false;
      this.invisible = [0, 0];
      this.teleport = false;
      this.controlled = false;
      this.changebody = false;
      this.changebodynew = false;
      this.zombie = false;
      this.whirlwind = false;
      this.BORDERD = 1;
      this.hitownteam = false;
      this.realfov = this.FOV;
      this.plrsocket = 0;
      this.walltype = -1;
      // Get a new unique id
      this.id = entitiesIdLog++;
      this.team = this.id;
      this.team = master.team;
      // This is for collisions
      this.updateAABB = () => {};
      this.getAABB = (() => {
          let data = {}, savedSize = 0;
          let getLongestEdge = (x1, y1, x2, y2) => {
              return Math.max(
                  Math.abs(x2 - x1),
                  Math.abs(y2 - y1)
              );
          };
          this.updateAABB = active => { 
              if (this.bond != null) return 0;
              if (!active) { data.active = false; return 0; }
              // Get bounds
              let x1 = Math.min(this.x, this.x + this.velocity.x + this.accel.x) - this.realSize - 5;
              let y1 = Math.min(this.y, this.y + this.velocity.y + this.accel.y) - this.realSize - 5;
              let x2 = Math.max(this.x, this.x + this.velocity.x + this.accel.x) + this.realSize + 5;
              let y2 = Math.max(this.y, this.y + this.velocity.y + this.accel.y) + this.realSize + 5;
              // Size check
              let size = getLongestEdge(x1, y1, x2, y1);
              let sizeDiff = savedSize / size;
              // Update data
              data = { 
                  min: [x1, y1],
                  max: [x2, y2],
                  active: true,
                  size: size,
              };
              // Update grid if needed
              if (sizeDiff > Math.SQRT2 || sizeDiff < Math.SQRT1_2) {
                  this.removeFromGrid(); this.addToGrid();
                  savedSize = data.size;
              }
          };
          return () => { return data; };
      })();
      this.updateAABB(true);   
      entities.push(this); // everything else
      views.forEach(v => v.add(this));
  }
  
  life() { bringToLife(this); }

  addController(newIO) {
      if (Array.isArray(newIO)) {
          this.controllers = newIO.concat(this.controllers);
      } else {
          this.controllers.unshift(newIO); 
      }
  } 

  define(set,temp) {
      if (set != undefined) {
         if (set.PARENT != null) {
          for (let i=0; i<set.PARENT.length; i++) {
              this.define(set.PARENT[i]);
          }
          this.defineset = set
      }
      if (set.index != null) {
          this.index = set.index;
      }
      if (set.NAME != null) { 
          this.name = set.NAME; 
      }
      if (set.LABEL != null) { 
          this.label = set.LABEL; 
      }
      if (set.EXTRALABEL != null) { 
          this.label = set.EXTRALABEL+" "+set.LABEL; 
      }
      if (set.ASSEMBLE_COUNT != null) { 
          this.extraProperties.assemblecount = set.ASSEMBLE_COUNT
      }
      if (set.HUNTER != null) { 
          this.HUNTER = set.HUNTER; 
      }
      if (set.TYPE != null) { 
          this.type = set.TYPE; 
      }
      if (set.HITOWNTEAM != null) {
          this.hitownteam = set.HITOWNTEAM
      }
      if (set.DONTHITOTHERTEAMS != null) {
          this.donthit = set.DONTHITOTHERTEAMS
      }
      if (set.SHAPE != null) {
          this.shape = typeof set.SHAPE === 'number' ? set.SHAPE : 0
          this.shapeData = set.SHAPE;
      }
      if (set.COLOR != null) { 
          this.color = set.COLOR; 
      }   
      if (set.CONTROLLERS != null) { 
          let toAdd = [];
          set.CONTROLLERS.forEach((ioName) => {
              toAdd.push(eval('new io_' + ioName + '(this)'));
          });
          this.addController(toAdd);
      }
      if (set.MOTION_TYPE != null) { 
          this.motionType = set.MOTION_TYPE; 
      }
      if (set.TELEPORT != null) { 
          this.teleport = set.TELEPORT; 
      }
      if (set.WALLTYPE != null) { 
          this.walltype = set.WALLTYPE; 
      }
      if (set.DOMINATOR != null) { 
          this.dominator = set.DOMINATOR; 
      }
      if (set.CAN_GROW != null) { 
          this.cangrow = set.CAN_GROW; 
      }
      if (set.CHANGEBODY != null) { 
          this.changebody = set.CHANGEBODY; 
      }
      if (set.BACTERIA != null) { 
          this.connectBulletChildrenCamera = set.BACTERIA; 
          this.changebodynew = set.BACTERIA; 
      }
      if (set.NO_MOVING != null) { 
          this.nomoving = set.NO_MOVING; 
      }
      if (set.FACING_TYPE != null) { 
          this.facingType = set.FACING_TYPE; 
      }
      if (set.WHIRLWIND != null) { 
          this.whirlwind = set.WHIRLWIND;
          this.whirlproperties = set.WHIRLPROPERTIES;
      }
      if (set.DRAW_HEALTH != null) { 
          this.settings.drawHealth = set.DRAW_HEALTH; 
      }
      if (set.DRAW_SELF != null) { 
          this.settings.drawShape = set.DRAW_SELF; 
      }
      if (set.HAS_ALTFIRE != null) { 
          this.hasaltfire = set.HAS_ALTFIRE; 
      }
      if (set.MINIMAP != null) { 
          this.settings.minimapshow = set.MINIMAP; 
      }
      if (set.DAMAGE_EFFECTS != null) { 
          this.settings.damageEffects = set.DAMAGE_EFFECTS; 
      }
      if (set.RATIO_EFFECTS != null) { 
          this.settings.ratioEffects = set.RATIO_EFFECTS; 
      }
      if (set.MOTION_EFFECTS != null) { 
          this.settings.motionEffects = set.MOTION_EFFECTS; 
      }
      if (set.ACCEPTS_SCORE != null) { 
          this.settings.acceptsScore = set.ACCEPTS_SCORE; 
      }
      if (set.GIVE_KILL_MESSAGE != null) { 
          this.settings.givesKillMessage = set.GIVE_KILL_MESSAGE; 
      }
      if (set.CAN_GO_OUTSIDE_ROOM != null) { 
          this.settings.canGoOutsideRoom = set.CAN_GO_OUTSIDE_ROOM; 
      }
      if (set.CAN_GO_THROUGH_ROOM != null) { 
          this.settings.canGoThroughRoom = set.CAN_GO_THROUGH_ROOM; 
      }
      if (set.HITS_OWN_TYPE != null) { 
          this.settings.hitsOwnType = set.HITS_OWN_TYPE; 
      }
      if (set.CUSTOM_COLLIDE != null) { 
          this.settings.customCollide = set.CUSTOM_COLLIDE; 
      }
      if (set.DIE_AT_LOW_SPEED != null) { 
          this.settings.diesAtLowSpeed = set.DIE_AT_LOW_SPEED; 
      }
      if (set.DIE_AT_RANGE != null) { 
          this.settings.diesAtRange = set.DIE_AT_RANGE; 
      }
      if (set.INDEPENDENT != null) { 
          this.settings.independent = set.INDEPENDENT; 
      }
      if (set.PERSISTS_AFTER_DEATH != null) { 
          this.settings.persistsAfterDeath = set.PERSISTS_AFTER_DEATH; 
      }
      if (set.CLEAR_ON_MASTER_UPGRADE != null) { 
          this.settings.clearOnMasterUpgrade = set.CLEAR_ON_MASTER_UPGRADE; 
      }
      if (set.HEALTH_WITH_LEVEL != null) { 
          this.settings.healthWithLevel = set.HEALTH_WITH_LEVEL; 
      }
      if (set.ACCEPTS_SCORE != null) { 
          this.settings.acceptsScore = set.ACCEPTS_SCORE; 
      }
      if (set.OBSTACLE != null) { 
          this.settings.obstacle = set.OBSTACLE; 
      }
      if (set.NECRO != null) { 
          this.settings.isNecromancer = set.NECRO; 
      }
      if (set.AUTO_UPGRADE != null) { 
          this.settings.upgrading = set.AUTO_UPGRADE; 
      }
      if (set.HAS_NO_RECOIL != null) { 
          this.settings.hasNoRecoil = set.HAS_NO_RECOIL; 
      }
      if (set.CRAVES_ATTENTION != null) { 
          this.settings.attentionCraver = set.CRAVES_ATTENTION; 
      }
      if (set.BROADCAST_MESSAGE != null) { 
          this.settings.broadcastMessage = (set.BROADCAST_MESSAGE === '') ? undefined : set.BROADCAST_MESSAGE; 
      }
      if (set.DAMAGE_CLASS != null) { 
          this.settings.damageClass = set.DAMAGE_CLASS; 
      }
      if (set.IS_MAGNET != null) {
          this.IS_MAGNET = set.IS_MAGNET
      }
      if (set.BUFF_VS_FOOD != null) { 
          this.settings.buffVsFood = set.BUFF_VS_FOOD; 
      }
      if (set.CAN_BE_ON_LEADERBOARD != null) { 
          this.settings.leaderboardable = set.CAN_BE_ON_LEADERBOARD; 
      }
      if (set.INTANGIBLE != null) { 
          this.intangibility = set.INTANGIBLE; 
      }
      if (set.IS_SMASHER != null) { 
          this.settings.reloadToAcceleration = set.IS_SMASHER; 
      }
      if (set.STAT_NAMES != null) { 
          this.settings.skillNames = set.STAT_NAMES; 
      }
      if (set.AI != null) { 
          this.aiSettings = set.AI; 
      }
      if (set.ALPHA != null) { 
          this.alpha = set.ALPHA;
      }
      if (set.BORDERD != null) { 
          this.extraProperties.BORDERD = set.BORDERD;
      }
      if (set.INVISIBLE != null) { 
          this.invisible = set.INVISIBLE;
      }
      if (set.DANGER != null) { 
          this.dangerValue = set.DANGER; 
      }
      if (set.VARIES_IN_SIZE != null) { 
          this.settings.variesInSize = set.VARIES_IN_SIZE; 
          this.squiggle = (this.settings.variesInSize) ? ran.randomRange(0.8, 1.2) : 1;
      }
      if (set.RESET_UPGRADES) {
          this.upgrades = [];
      }
      if (set.UPGRADES_TIER_1 != null) { 
          set.UPGRADES_TIER_1.forEach((e) => {
              this.upgrades.push({ class: e, tier: 1, level: c.TIER_1, index: e.index });
          });
      }
      if (set.UPGRADES_TIER_2 != null) { 
          set.UPGRADES_TIER_2.forEach((e) => {
              this.upgrades.push({ class: e, tier: 2, level: c.TIER_2, index: e.index });
          });
      }
      if (set.UPGRADES_TIER_3 != null) { 
          set.UPGRADES_TIER_3.forEach((e) => {
              this.upgrades.push({ class: e, tier: 3, level: c.TIER_3, index: e.index });
          });
      }
      if (set.UPGRADES_TIER_4 != null) { 
          set.UPGRADES_TIER_4.forEach((e) => {
              this.upgrades.push({ class: e, tier: 4, level: c.TIER_4, index: e.index });
          });
      }
      if (set.UPGRADES_TIER_DAILY != null) { 
          set.UPGRADES_TIER_DAILY.forEach((e) => {
              this.upgrades.push({ class: e, tier: 3, level: c.TIER_DAILY, index: e.index });
          });
      }
      if (set.UPGRADES_TIER_5 != null) { 
          set.UPGRADES_TIER_5.forEach((e) => {
              this.upgrades.push({ class: e, tier: 5, level: c.TIER_5, index: e.index });
          });
      }
      if (set.UPGRADES_TIER_6 != null) { 
          set.UPGRADES_TIER_6.forEach((e) => {
              this.upgrades.push({ class: e, tier: 6, level: c.TIER_6, index: e.index });
          });
      }
      if (set.UPGRADES_TIER_7 != null) { 
          set.UPGRADES_TIER_7.forEach((e) => {
              this.upgrades.push({ class: e, tier: 7, level: c.TIER_7, index: e.index });
          });
      }
      if (set.SIZE != null) {
          this.SIZE = set.SIZE * this.squiggle;
          if (this.coreSize == null) { this.coreSize = this.SIZE; }
      }
      if (set.SKILL != null && set.SKILL != []) { 
          if (set.SKILL.length != 10) {
              throw('Inappropiate skill raws.');
          }
          this.skill.set(set.SKILL);
      } 
      if (set.LEVEL != null) {
          if (set.LEVEL === -1) {
              this.skill.reset();
          }
          while (this.skill.level < c.SKILL_CHEAT_CAP && this.skill.level < set.LEVEL) {
              this.skill.score += this.skill.levelScore;
              this.skill.maintain();
          }
          this.refreshBodyAttributes();
      }
      if (set.SKILL_CAP != null && set.SKILL_CAP != []) { 
          if (set.SKILL_CAP.length != 10) {
              throw('Inappropiate skill caps.');
          }
          this.skill.setCaps(set.SKILL_CAP);
      } 
      if (set.VALUE != null) {
          this.skill.score = Math.max(this.skill.score, set.VALUE * this.squiggle);
      }
      if (set.ALT_ABILITIES != null) { 
          this.abilities = set.ALT_ABILITIES; 
      }
      if (set.SPECIAL != null) { 
          this.special = set.SPECIAL; 
      }
      if (set.GUNS != null) { 
          let newGuns = [];
          set.GUNS.forEach((gundef) => {
              newGuns.push(new Gun(this, gundef));
          });
          this.guns = newGuns;
      }
      if (set.MAX_CHILDREN != null) { 
          this.maxChildren = set.MAX_CHILDREN; 
      }
      if (set.MAX_BULLETS != null) { 
          this.maxBullets = set.MAX_BULLETS; 
      }
      if (set.FOOD != null) {
          if (set.FOOD.LEVEL != null) { 
              this.foodLevel = set.FOOD.LEVEL; 
              this.foodCountup = 0;
          }
      }
      if (set.BODY != null) {
          if (set.BODY.ACCELERATION != null) { 
              this.ACCELERATION = set.BODY.ACCELERATION; 
          }
          if (set.BODY.SPEED != null) { 
              this.SPEED = set.BODY.SPEED; 
          }
          if (set.BODY.HEALTH != null) { 
              this.HEALTH = set.BODY.HEALTH; 
          }
          if (set.BODY.RESIST != null) { 
              this.RESIST = set.BODY.RESIST;
          }
          if (set.BODY.SHIELD != null) { 
              this.SHIELD = set.BODY.SHIELD; 
          }
          if (set.BODY.REGEN != null) { 
              this.REGEN = set.BODY.REGEN; 
          }
          if (set.BODY.DAMAGE != null) { 
              this.DAMAGE = set.BODY.DAMAGE; 
          }
          if (set.BODY.PENETRATION != null) { 
              this.PENETRATION = set.BODY.PENETRATION; 
          }
          if (set.BODY.FOV != null) { 
              this.FOV = set.BODY.FOV; 
          }
          if (set.BODY.RANGE != null) { 
              this.RANGE = set.BODY.RANGE; 
          }
          if (set.BODY.SHOCK_ABSORB != null) { 
              this.SHOCK_ABSORB = set.BODY.SHOCK_ABSORB; 
          }
          if (set.BODY.DENSITY != null) { 
              this.DENSITY = set.BODY.DENSITY; 
          }
          if (set.BODY.STEALTH != null) { 
              this.STEALTH = set.BODY.STEALTH; 
          }
          if (set.BODY.PUSHABILITY != null) { 
              this.PUSHABILITY = set.BODY.PUSHABILITY; 
          }
          if (set.BODY.HETERO != null) { 
              this.heteroMultiplier = set.BODY.HETERO; 
          }
          this.refreshBodyAttributes();
      }
      if (set.TURRETS != null) {
          let o;
          this.turrets.forEach(o => o.destroy());
          this.turrets = [];
          set.TURRETS.forEach(def => {
              o = new Entity(this, this.master);
                  ((Array.isArray(def.TYPE)) ? def.TYPE : [def.TYPE]).forEach(type => o.define(type));
            let motions = def.MOTIONTYPE
            if (motions === undefined) {
              motions = ["bound", "bound"]
            }
                  o.bindToMaster(def.POSITION, this, motions[0], motions[1]);
          });
      }
      if (set.TURRETSADD != null) {
          let o;
          set.TURRETSADD.forEach(def => {
              o = new Entity(this, this.master);
                  ((Array.isArray(def.TYPE)) ? def.TYPE : [def.TYPE]).forEach(type => o.define(type));
                  o.bindToMaster(def.POSITION, this);
          });
      }
      if (set.mockup != null) {
          this.mockup = set.mockup;
      }
    }
  }

  refreshBodyAttributes() {
      let speedReduce = Math.pow(this.size / (this.coreSize || this.SIZE), 1);

      this.acceleration = c.runSpeed * this.ACCELERATION / speedReduce;
      if (this.settings.reloadToAcceleration) this.acceleration *= this.skill.acl;

      this.topSpeed = c.runSpeed * this.SPEED * this.skill.mob / speedReduce;
      if (this.settings.reloadToAcceleration) this.topSpeed /= Math.sqrt(this.skill.acl);
      
      this.health.set(
          (((this.settings.healthWithLevel) ? 2 * this.skill.level : 0) + this.HEALTH) * this.skill.hlt
      );

      this.health.resist = 1 - 1 / Math.max(1, this.RESIST + this.skill.brst);

      this.shield.set(
          (((this.settings.healthWithLevel) ? 0.6 * this.skill.level : 0) + this.SHIELD) * this.skill.shi, 
          Math.max(0, ((((this.settings.healthWithLevel) ? 0.006 * this.skill.level : 0) + 1) * this.REGEN) * this.skill.rgn)
      );
      
      this.damage = this.DAMAGE * this.skill.atk;

      this.penetration = this.PENETRATION + 1.5 * (this.skill.brst + 0.8 * (this.skill.atk - 1));

      if (!this.settings.dieAtRange || !this.range) {
          this.range = this.RANGE;
      }

      this.fov = this.FOV * 250 * Math.sqrt(this.size) * (1 + 0.003 * this.skill.level);
      
      this.density = (1 + 0.08 * this.skill.level) * this.DENSITY; 

      this.stealth = this.STEALTH;

      this.pushability = this.PUSHABILITY;        
  }    

  bindToMaster(position, bond, facing, motion) {
      this.bond = bond;
      this.source = bond;
      this.bond.turrets.push(this);
      this.skill = this.bond.skill;
      this.label = this.bond.label + ' ' + this.label;
      //A check to see if its a turret.
      this.isTurret = true;
      // It will not be in collision calculations any more nor shall it be seen.
      this.removeFromGrid();
      this.settings.drawShape = false;
      // Get my position.
      this.bound = {};
      this.bound.size =  position[0] / 20;
      let _off = new Vector(position[1], position[2]);
      this.bound.angle  = position[3] * Math.PI / 180;
      this.bound.direction = _off.direction;
      this.bound.offset = _off.length / 10;
      this.bound.arc = position[4] * Math.PI / 180;
      // Figure out how we'll be drawn.
      this.bound.layer = position[5];
      // Initalize.
      this.facing = this.bond.facing + this.bound.angle;
      this.facingType = facing;
      this.motionType = motion;
      this.move();
  }
  
  get size() {
      if (this.bond == null) return (this.coreSize || this.SIZE) * (1 + this.skill.level / 45);
      return this.bond.size * this.bound.size;
  }

  get mass() {
      return this.density * (this.size * this.size + 1); 
  }

  get realSize() {
      return this.size * ((Math.abs(this.shape) > lazyRealSizes.length) ? 1 : lazyRealSizes[Math.abs(this.shape)]);
  }

  get m_x() {
      return (this.velocity.x + this.accel.x) / roomSpeed;
  }
  get m_y() {
      return (this.velocity.y + this.accel.y) / roomSpeed;
  }

  camera(tur = false) {
      let outCamera = {
          type: 0 + tur * 0x01 + this.settings.drawHealth * 0x02 + (this.type === 'tank' || this.type === 'spectator' || this.type === 'special') * 0x04,
          id: this.id,
          index: this.index,
          x: this.x,
          y: this.y,
          cx: this.x,
          cy: this.y,
          vx: this.velocity.x,
          vy: this.velocity.y,  
          fov: this.fov,
          size: this.size,           
          rsize: this.realSize,   
          status: 1,
          health: this.health.display(),
          shield: this.shield.display(),
          alpha: this.alpha,
          facing: this.facing,
          vfacing: this.vfacing,
          twiggle: this.facingType === 'autospin' || (this.facingType === 'locksFacing' && this.control.alt),
          layer: (this.bond != null) ? this.bound.layer :
                  (this.type === 'spectator') ? 12 :
                  (this.type === 'squareWall') ? 11 : 
                  (this.type === 'wall') ? 11 : 
                  (this.type === 'food') ? 10 : 
                  (this.type === 'tank') ? 5 :
                  (this.type === 'dominator') ? 5 :
                  (this.type === 'crasher') ? 1 :
                  0,
          color: this.color,
          name: this.name,
          score: this.skill.score,
          guns: this.guns.map(gun => gun.getLastShot()),
          turrets: this.turrets.map(turret => turret.camera(true)),
          messages: this.messages,
      };
      if (this.connectChildrenCamera === true) {
        let cameracx = this.x
        let cameracxcount = 1
        this.children.forEach((a)=>{
          cameracx+=(a.x)
          cameracxcount += 1
        });
        cameracx = cameracx / cameracxcount
        let cameracy = this.y
        let cameracycount = 1
        this.children.forEach((a)=>{
          cameracy+=(a.y)
          cameracycount += 1
        });
        cameracy = cameracy / cameracycount
        outCamera.cx = cameracx
        outCamera.cy = cameracy
        outCamera.fov = this.fov+((Math.abs(this.x-cameracx)+Math.abs(this.y-cameracy))*2)
      };
      if (this.connectBulletChildrenCamera === true) {
        let cameracx = this.x
        let cameracxcount = 1
        this.bulletchildren.forEach((a)=>{
          cameracx+=(a.x)
          cameracxcount += 1
        });
        cameracx = cameracx / cameracxcount
        let cameracy = this.y
        let cameracycount = 1
        this.bulletchildren.forEach((a)=>{
          cameracy+=(a.y)
          cameracycount += 1
        });
        cameracy = cameracy / cameracycount
        outCamera.cx = cameracx
        outCamera.cy = cameracy
        outCamera.fov = this.fov+((Math.abs(this.x-cameracx)+Math.abs(this.y-cameracy))*2)
      };
      if (this.HUNTER === true) {
        if (this.control.alt === 1) {
          outCamera.cx = this.x+(300*Math.cos(this.facing))
          outCamera.cy = this.y+(300*Math.sin(this.facing))
        }
      }
      return outCamera
  }   
  
  skillUp(stat) {
      let suc = this.skill.upgrade(stat);
      if (suc) {
          this.refreshBodyAttributes();
          this.guns.forEach(function(gun) {
              gun.syncChildren();
          });
      }
      return suc;
  }

  upgrade(number) {
      if (number < this.upgrades.length && this.skill.level >= this.upgrades[number].level) {     
          let saveMe = this.upgrades[number].class;
        if (lockedTanks.includes(saveMe) && this.plrsocket !== 0 && this.plrsocket.key !== process.env.SECRET) {this.plrsocket.talk('m', 'You cannot upgrade to this tank as it is locked.')} else {
          this.upgrades = [];
          this.define(saveMe);
          this.define
          this.sendMessage('You have upgraded to ' + this.label + '.');
          console.log(this.plrsocket.name+" has upgraded to "+this.label)
          let ID = this.id;
          entities.forEach(instance => {
              if (instance.settings.clearOnMasterUpgrade && instance.master.id === ID) {
                  instance.kill();
              }
          }); 
          this.skill.update();
          this.refreshBodyAttributes();
      }
      }
  }

  damageMultiplier() {
      switch (this.type) {
      case 'swarm': 
          return 0.25 + 1.5 * util.clamp(this.range / (this.RANGE + 1), 0, 1);
      default: return 1;
      } 
  }

  move() {
      if (this.control.goal === undefined) {
        this.control.goal = new Vector(this.x,this.y)
        this.control.main = false
        this.control.alt = false
        this.control.fire = false
      }
      let g = {
              x: this.control.goal.x - this.x,
              y: this.control.goal.y - this.y,
          },
          gactive = (g.x !== 0 || g.y !== 0),
          engine = {
              x: 0,
              y: 0,
          },
          a = this.acceleration / roomSpeed;
      switch (this.motionType) {
      case 'glide':
          this.maxSpeed = this.topSpeed;
          this.damp = 0.05;
          break;
      case 'grow':
          this.SIZE += 0.5;
          break;
      case 'fastgrow':
          this.SIZE += 2.5;
          break;
      case 'fastergrow':
          this.SIZE += 5;
      case 'fastestgrow':
          this.SIZE += 15;
          break;
      case 'shrink':
          if (this.SIZE > 0.6) {
            this.SIZE -= 0.5;
          }
          break;
      case 'motor':
          this.maxSpeed = 0;            
          if (this.topSpeed) {
              this.damp = a / this.topSpeed;
          }
          if (gactive) {
              let len = Math.sqrt(g.x * g.x + g.y * g.y);
              engine = {
                  x: a * g.x / len,
                  y: a * g.y / len,
              };
          }
          break;
      case 'swarm': 
          this.maxSpeed = this.topSpeed;
          let l = util.getDistance({ x: 0, y: 0, }, g) + 1;
          if (gactive && l > this.size) {
              let desiredxspeed = this.topSpeed * g.x / l,
                  desiredyspeed = this.topSpeed * g.y / l,
                  turning = Math.sqrt((this.topSpeed * Math.max(1, this.range) + 1) / a);
              engine = {
                  x: (desiredxspeed - this.velocity.x) / Math.max(5, turning),
                  y: (desiredyspeed - this.velocity.y) / Math.max(5, turning),  
              };
          } else {
              if (this.velocity.length < this.topSpeed) {
                  engine = {
                      x: this.velocity.x * a / 20,
                      y: this.velocity.y * a / 20,
                  };
              }
          }
          break;        
      case 'chase':
          if (gactive) {
              let l = util.getDistance({ x: 0, y: 0, }, g);
              if (l > this.size * 2) {
                  this.maxSpeed = this.topSpeed;
                  let desiredxspeed = this.topSpeed * g.x / l,
                      desiredyspeed = this.topSpeed * g.y / l;
                  engine = {                
                      x: (desiredxspeed - this.velocity.x) * a,
                      y: (desiredyspeed - this.velocity.y) * a,
                  };
              } else {
                  this.maxSpeed = 0;
              }   
          } else {
              this.maxSpeed = 0;
          }
          break;
      case 'drift':
          this.maxSpeed = 0;
          engine = {
              x: g.x * a,
              y: g.y * a,
          };
          break;
      case 'bound':
          let bound = this.bound, ref = this.bond;
          this.x = ref.x + ref.size * bound.offset * Math.cos(bound.direction + bound.angle + ref.facing);
          this.y = ref.y + ref.size * bound.offset * Math.sin(bound.direction + bound.angle + ref.facing);
          this.bond.velocity.x += bound.size * this.accel.x;
          this.bond.velocity.y += bound.size * this.accel.y;
          this.firingArc = [ref.facing + bound.angle, bound.arc / 2];
          nullVector(this.accel);
          this.blend = ref.blend;
          break;
      }
      this.accel.x += engine.x * this.control.power;
      this.accel.y += engine.y * this.control.power;
  }

  face() {
      let t = this.control.target,
          tactive = (t.x !== 0 || t.y !== 0),
          oldFacing = this.facing;
      switch(this.facingType) {
      case 'autospin':
          this.facing += 0.02 / roomSpeed;
          break;
      case 'turnWithSpeed':
          this.facing += this.velocity.length / 90 * Math.PI / roomSpeed;
          break;
      case 'withMotion': 
          this.facing = this.velocity.direction;
          break;
      case 'smoothWithMotion':
      case 'looseWithMotion':
          this.facing += util.loopSmooth(this.facing, this.velocity.direction, 4 / roomSpeed); 
          break;
      case 'withTarget': 
      case 'toTarget': 
          this.facing = Math.atan2(t.y, t.x);
          break; 
      case 'locksFacing': 
          if (!this.control.alt) this.facing = Math.atan2(t.y, t.x);
          break;
      case 'looseWithTarget':
      case 'looseToTarget':
      case 'smoothToTarget':
          this.facing += util.loopSmooth(this.facing, Math.atan2(t.y, t.x), 4 / roomSpeed); 
          break;   
      case 'bound':
          let givenangle;
          if (this.control.main) {
              givenangle = Math.atan2(t.y, t.x);
              let diff = util.angleDifference(givenangle, this.firingArc[0]);
              if (Math.abs(diff) >= this.firingArc[1]) {
                  givenangle = this.firingArc[0];// - util.clamp(Math.sign(diff), -this.firingArc[1], this.firingArc[1]);
              }
          } else {
              givenangle = this.firingArc[0];
          }
          this.facing += util.loopSmooth(this.facing, givenangle, 4 / roomSpeed);
          break;
      case 'boundslow':
          let givenangle2;
          if (this.control.main) {
              givenangle2 = Math.atan2(t.y, t.x);
              let diff = util.angleDifference(givenangle2, this.firingArc[0]);
              if (Math.abs(diff) >= this.firingArc[1]) {
                  givenangle2 = this.firingArc[0];// - util.clamp(Math.sign(diff), -this.firingArc[1], this.firingArc[1]);
              }
          } else {
              givenangle2 = this.firingArc[0];
          }
          this.facing += util.loopSmooth(this.facing, givenangle2, 16 / roomSpeed);
          break;
      case 'copy':
          this.facing = this.source.facing
          break;
      }
      // Loop
      const TAU = 2 * Math.PI
      this.facing = (this.facing % TAU + TAU) % TAU;
      this.vfacing = util.angleDifference(oldFacing, this.facing) * roomSpeed;
  }

  takeSelfie() {
      this.flattenedPhoto = null;
      this.photo = (this.settings.drawShape) ? this.camera() : this.photo = undefined;
  }

  physics() {
      if (this.accel.x == null || this.velocity.x == null) {
          util.error('Void Error!');
          util.error(this.collisionArray);
          util.error(this.label);
          util.error(this);
          nullVector(this.accel); nullVector(this.velocity);
      }
      // Apply acceleration
      this.velocity.x += this.accel.x;
      this.velocity.y += this.accel.y;
      // Reset acceleration
      nullVector(this.accel); 
      // Apply motion
      this.stepRemaining = 1;
      this.x += this.stepRemaining * this.velocity.x / roomSpeed;
      this.y += this.stepRemaining * this.velocity.y / roomSpeed;        
  }

  friction() {
      var motion = this.velocity.length,
          excess = motion - this.maxSpeed;
      if (excess > 0 && this.damp) {
          var k = this.damp / roomSpeed,
              drag = excess / (k + 1),
              finalvelocity = this.maxSpeed + drag;
          this.velocity.x = finalvelocity * this.velocity.x / motion;
          this.velocity.y = finalvelocity * this.velocity.y / motion;
      }
  }

  confinementToTheseEarthlyShackles() {
      if (this.x == null || this.x == null) {
          util.error('Void Error!');
          util.error(this.collisionArray);
          util.error(this.label);
          util.error(this);
          nullVector(this.accel); nullVector(this.velocity);
          return 0;
      }
      if (!this.settings.canGoOutsideRoom && (this.type !== "miniboss" || this.type !== "spectator")) {
        this.accel.x -= Math.min(this.x - this.realSize + 50, 0) * c.ROOM_BOUND_FORCE / roomSpeed;
        this.accel.x -= Math.max(this.x + this.realSize - room.width - 50, 0) * c.ROOM_BOUND_FORCE / roomSpeed;
        this.accel.y -= Math.min(this.y - this.realSize + 50, 0) * c.ROOM_BOUND_FORCE / roomSpeed;
        this.accel.y -= Math.max(this.y + this.realSize - room.height - 50, 0) * c.ROOM_BOUND_FORCE / roomSpeed;
      }
      /*if (room.isIn('edge', { x: this.x, y: this.y, })) {
          this.accel.x -= Math.min(this.x - this.realSize + 50, 0) * c.ROOM_BOUND_FORCE / roomSpeed;
          this.accel.x -= Math.max(this.x + this.realSize - room.width - 50, 0) * c.ROOM_BOUND_FORCE / roomSpeed;
          this.accel.y -= Math.min(this.y - this.realSize + 50, 0) * c.ROOM_BOUND_FORCE / roomSpeed;
          this.accel.y -= Math.max(this.y + this.realSize - room.height - 50, 0) * c.ROOM_BOUND_FORCE / roomSpeed;
      }*/
      if (room.gameMode === 'tdm' && this.team !== -100 && this.team !== -101) { 
          let loc = { x: this.x, y: this.y, };
          if (
              (this.team !== -1 && room.isIn('bas1', loc)) ||
              (this.team !== -2 && room.isIn('bas2', loc)) ||
              (this.team !== -3 && room.isIn('bas3', loc)) ||
              (this.team !== -4 && room.isIn('bas4', loc))
          ) {if (this.invuln === false && this.opinvuln === false) this.health.amount = this.health.amount - (this.health.amount / 10) - (this.health.max/20) }
      }
      if (room.isIn('port', { x: this.x, y: this.y, })) {
          let newpos = room.randomType2("port")
          this.x = newpos.x + Math.floor(Math.random()) * (width2/xgrid)
          this.y = newpos.y + Math.floor(Math.random()) * (height2/ygrid)
      }
      if (room.gameMode === '2tdm' || room.gameMode === 'assault' && this.team !== -100 && this.team !== -101) { 
          let loc = { x: this.x, y: this.y, };
          if (
              (this.team !== -1 && room.isIn('bas1', loc)) ||
              (this.team !== -2 && room.isIn('bas2', loc)) 
          ) {if (this.invuln === false && this.opinvuln === false) this.health.amount = this.health.amount - (this.health.amount / 10) - (this.health.max/20) }
      }
      if (room.gameMode === '1tdm' || room.gameMode === 'siege' && this.team !== -100 && this.team !== -101 && this.type !== "spectator") { 
          let loc = { x: this.x, y: this.y, };
          if (
              (this.team !== -1 && room.isIn('bas1', loc)) ||
              (room.isIn('dead', loc)) ||
              (this.team !== -3 && room.isIn('bap3', loc)) 
          ) {if (this.invuln === false && this.opinvuln === false) this.health.amount = this.health.amount - (this.health.amount / 10) - (this.health.max/20) }
      }
  }

  contemplationOfMortality() {
      if (this.invuln || this.opinvuln) {
          this.damageRecieved = 0;
          return 0;
      }
      // Life-limiting effects
      if (this.settings.diesAtRange) {
          this.range -= 1 / roomSpeed;
          if (this.range < 0) {
              this.kill();
          }
      }
      if (this.settings.diesAtLowSpeed) {
          if (!this.collisionArray.length && this.velocity.length < this.topSpeed / 2) {
              this.health.amount -= this.health.getDamage(1 / roomSpeed);
          }
      }
      // Shield regen and damage
      if (this.shield.max) {
          if (this.damageRecieved !== 0) {
              if (this.damageRecieved > 0) {
                  let shieldDamage = this.shield.getDamage(this.damageRecieved);
                  this.damageRecieved -= shieldDamage;
                  this.shield.amount -= shieldDamage;
              }
          }
      }
      // Health damage 
      if (this.damageRecieved !== 0) {
          let healthDamage = this.health.getDamage(this.damageRecieved);
          this.blend.amount = 1;
          this.health.amount -= healthDamage;
      }
      let xdominator = 0
      let ydominator = 0
      let lastkiller
      let lastkillerteam = -100
      this.damageRecieved = 0;
      // Check for death
      if (this.isDead()) {
          if (this.label === 'Bacteria') { 
          } else {
            let killers = [], killTools = [], notJustFood = false;
          // If I'm a tank, call me a nameless player
          let name = (this.master.name == '') ?
              (this.master.type === 'tank') ?
                  "a nameless player's " + this.label :
                  (this.master.type === 'miniboss') ?
                      "a visiting " + this.label :
                      util.addArticle(this.label) 
              :
              this.master.name + "'s " + this.label;
          // Calculate the jackpot
          let jackpot = Math.ceil(util.getJackpot(this.skill.score) / this.collisionArray.length);
          // Now for each of the things that kill me...
          this.collisionArray.forEach(instance => {
              if (instance.type === 'wall') return 0;
              if (instance.master.settings.acceptsScore) { // If it's not food, give its master the score
                  if (instance.master.type === 'tank' || instance.master.type === 'miniboss') notJustFood = true;
                  instance.master.skill.score += jackpot;
                  killers.push(instance.master); // And keep track of who killed me
              } else if (instance.settings.acceptsScore) {
                  instance.skill.score += jackpot;
              }
              killTools.push(instance); // Keep track of what actually killed me
          });
          // Remove duplicates
          killers = killers.filter((elem, index, self) => { return index == self.indexOf(elem); });
          // If there's no valid killers (you were killed by food), change the message to be more passive
          let killText = (notJustFood) ? '' : "You have been killed by ",
              dothISendAText = this.settings.givesKillMessage;
          killers.forEach(instance => {
              this.killCount.killers.push(instance.index);
              if (this.type === 'tank') {
                  if (killers.length > 1) instance.killCount.assists++; else instance.killCount.solo++;
              } else if (this.type === "miniboss") instance.killCount.bosses++;
          });
          // Add the killers to our death message, also send them a message
          if (notJustFood) {
              killers.forEach(instance => {
                  if (instance.master.type !== 'food' && instance.master.type !== 'crasher') {
                      killText += (instance.name == '') ? (killText == '') ? 'An unnamed player' : 'an unnamed player' : instance.name;
                      killText += ' and ';
                  }
                  // Only if we give messages
                  if (dothISendAText) { 
                    if (SKINWALKERS === true) {
                        if (this.type === "tank") {
                          instance.upgrades = []
                          instance.define(this.defineset)
                          instance.sendMessage('You killed ' + this.name + ((killers.length > 1) ? ' and became '+name+' (with some help).' : ' and became '+name+'.')); 
                        }
                    } else {
                      instance.sendMessage('You killed ' + name + ((killers.length > 1) ? ' (with some help).' : '.')); 
                    }
                  }
              });
              // Prepare the next part of the next 
              killText = killText.slice(0, -4);
              killText += 'killed you with ';
          }
          // Broadcast
          if (this.settings.broadcastMessage) sockets.broadcast(this.settings.broadcastMessage);
          // Add the implements to the message
          killTools.forEach((instance) => {
              killText += util.addArticle(instance.label) + ' and ';
          });
          if (this.dredshape === true) {dredshapes = dredshapes - 1}
          if (this.siegeboss === true) {siegebosses = siegebosses - 1}
          if (siegebosses < 1) {siegewave += 1; siegewavestarted = false; siegebosses = 999; setTimeout(() => {startwave(),100})}
          
          if (this.label === "Sanctuary") { if (SIEGE === true) {
            xdominator = this.x;
            ydominator = this.y;
            let body = new Entity(new Vector(xdominator,ydominator))
            body.define(Class.sanctuary1);
            body.dominator = true;
            body.nomoving = true;
            body.coreSize = body.SIZE
            let teamtest = false;
            if (this.team === -1) {
              body.team = -100;
              body.color = 3;   
              body.define(Class.dominator0);
              body.label = "Sanctuary"
              sockets.broadcast('A sanctuary has been destroyed!');
              yellowD = yellowD + 1;
              blueD = blueD - 1;
              let roompos = room.locRoom(new Vector(body.x, body.y))
              room.setup[roompos.y][roompos.x] = 'domx';
              sockets.updateRoom()
            } else {
              teamtest = true;
              body.team = -1;
              body.color = 10;
              //sockets.broadcast('A GREEN dominator has been repaired!');
              //sockets.broadcast('A GREEN dominator has been destroyed!');
              sockets.broadcast('A sanctuary has been unlocked!');
              yellowD = yellowD - 1;
              blueD = blueD + 1;
              let roompos = room.locRoom(new Vector(this.x, this.y))
              room.setup[roompos.y][roompos.x] = 'dbc1';
              sockets.updateRoom()
            }
            if (blueD === 0) {
              sockets.broadcast('Your team has lost.', 'red')
              setTimeout(() => {crash(body)},5000) // crash game
            }
          }}
          
          if (this.label === "Sanctuary") { if (ASSAULT === true) {
            xdominator = this.x;
            ydominator = this.y;
            let body = new Entity(new Vector(xdominator,ydominator))
            body.define(Class.sanctuary2);
            body.dominator = true;
            body.nomoving = true;
            body.coreSize = body.SIZE
            let teamtest = false;
            if (this.team === -1) {
              teamtest = true;
              body.team = -2;
              body.color = 11;
              //sockets.broadcast('A GREEN dominator has been repaired!');
              //sockets.broadcast('A GREEN dominator has been destroyed!');
              sockets.broadcast('A sanctuary has been unlocked!');
              greenD = greenD + 1;
              blueD = blueD - 1;
              let roompos = room.locRoom(new Vector(this.x, this.y))
              room.setup[roompos.y][roompos.x] = 'dbc2';
              sockets.updateRoom()
            } else {
              body.team = -1;
              body.color = 10;   
              body.define(Class.dominator0);
              body.label = "Sanctuary"
              sockets.broadcast('A sanctuary has been destroyed!');
              greenD = greenD - 1;
              blueD = blueD + 1;
              let roompos = room.locRoom(new Vector(body.x, body.y))
              room.setup[roompos.y][roompos.x] = 'dbc1';
              sockets.updateRoom()
            }
            if (blueD === 4) {
              sockets.broadcast('BLUE HAS WON THE GAME!', 'blue')
              setTimeout(() => {crash(body)},5000) // crash game
            }
          }}
          
          if (this.label === "Dominator") { if (DOMINATION === true) {
            xdominator = this.x;
            ydominator = this.y;
            killers.forEach(instance => {
                  if (instance.team === -1) {
                    lastkiller = instance;
                    lastkillerteam = instance.team;
                  } else if (instance.team === -2) {
                    lastkiller = instance;
                    lastkillerteam = instance.team;
                  } else if (instance.team === -3) {
                    lastkiller = instance;
                    lastkillerteam = instance.team;
                  } else if (instance.team === -4) {
                    lastkiller = instance;
                    lastkillerteam = instance.team;
                  }
            });
            if (this.dominator == true) {
            let body = new Entity(new Vector(xdominator,ydominator))
            body.define(Class.dominator1);
            body.dominator = true;
            body.nomoving = true;
            body.coreSize = body.SIZE
            if (this.team === -100) {
              let teamtest = false;
              if (lastkillerteam === -1) {
                teamtest = true;
                body.team = lastkiller.team;
                body.color = (lastkiller.team * (-1))+9;
                sockets.broadcast('Dominator is now controlled by BLUE');
                blueD = blueD + 1;
                yellowD = yellowD - 1;
                let roompos = room.locRoom(new Vector(this.x, this.y))
                room.setup[roompos.y][roompos.x] = 'dom1';
                sockets.updateRoom()
              }
              if (lastkillerteam === -2) {
                teamtest = true;
                body.team = lastkiller.team;
                body.color = (lastkiller.team * (-1))+9;
                sockets.broadcast('Dominator is now controlled by GREEN');
                greenD = greenD + 1;
                yellowD = yellowD - 1;
                let roompos = room.locRoom(new Vector(this.x, this.y))
                room.setup[roompos.y][roompos.x] = 'dom2';
                sockets.updateRoom()
              }
              if (lastkillerteam === -3) {
                teamtest = true;
                body.team = lastkiller.team;
                body.color = (lastkiller.team * (-1))+9;
                sockets.broadcast('Dominator is now controlled by RED');
                redD = redD + 1;
                yellowD = yellowD - 1;
                let roompos = room.locRoom(new Vector(this.x, this.y))
                room.setup[roompos.y][roompos.x] = 'dom3';
                sockets.updateRoom()
              }
              if (lastkillerteam === -4) {
                teamtest = true;
                body.team = lastkiller.team;
                body.color = (lastkiller.team * (-1))+11;
                sockets.broadcast('Dominator is now controlled by PURPLE');
                purpleD = purpleD + 1;
                yellowD = yellowD - 1;
                let roompos = room.locRoom(new Vector(this.x, this.y))
                room.setup[roompos.y][roompos.x] = 'dom4';
                sockets.updateRoom()
              }
              if (teamtest === false) {
                body.team = -100;
                body.color = 3;   
                sockets.broadcast('Dominator is being contested')
              }
            } else {
              body.team = -100;
              body.color = 3;   
              sockets.broadcast('Dominator is being contested')
              if (this.team === -1) {
                blueD = blueD - 1;
              }
              if (this.team === -2) {
                greenD = greenD - 1;
              }
              if (this.team === -3) {
                redD = redD - 1;
              }
              if (this.team === -4) {
                purpleD = purpleD - 1;
              }
              yellowD = yellowD + 1
              let roompos = room.locRoom(new Vector(this.x, this.y))
              room.setup[roompos.y][roompos.x] = 'domx';
              sockets.updateRoom()
            } 
            if (realmode === 'tdm') {sockets.broadcast('BLUE: '+blueD+'  GREEN: '+greenD+'  RED: '+redD+'  PURPLE: '+purpleD+'   [YELLOW: '+yellowD+']')}
            if (realmode === '2tdm') {sockets.broadcast('GREEN: '+greenD+' BLUE: '+blueD+'.      YELLOW: '+yellowD)}
            if (blueD === maxDomin) {
              sockets.broadcast('BLUE HAS WON THE GAME!', 'blue')
              setTimeout(() => {crash(body)},5000) // crash game
            }
            if (greenD === maxDomin) {
              sockets.broadcast('GREEN HAS WON THE GAME!', 'green')
              setTimeout(() => {crash(body)},5000) // crash game
            }
            if (redD === maxDomin) {
              sockets.broadcast('RED HAS WON THE GAME!', 'red')
              setTimeout(() => {crash(body)},5000) // crash game
            }
            if (purpleD === maxDomin) {
              sockets.broadcast('PURPLE HAS WON THE GAME!', 'magenta')
              setTimeout(() => {crash(body)},5000) // crash game
            }
            //body.addController(new io_listenToPlayer(body, player));
            }
          };
          }
          // Prepare it and clear the collision array.
          killText = killText.slice(0, -5);
          if (killText === 'You have been kille') killText = 'You have died a stupid death';
          this.sendMessage(killText + '.');
          if (OUTBREAK === true) {
            if (this.zombie === true) {
              let necrokiller = undefined
              killers.forEach((k)=>{
                if (k.label === "Necromancer") {
                  necrokiller = k
                }
              });
              if (necrokiller) {
                this.color = 16;
                this.extraProperties.revived = true;
                this.team = necrokiller.team;
                return 0;
              }
            }
          }
          // If I'm the leader, broadcast it:
          if (this.id === room.topPlayerID) {
              let usurptText = (this.name === '') ? 'The leader': this.name;
              if (notJustFood) { 
                  usurptText += ' has been usurped by';
                  killers.forEach(instance => {
                      usurptText += ' ';
                      usurptText += (instance.name === '') ? 'an unnamed player' : instance.name;
                      usurptText += ' and';
                  });
                  usurptText = usurptText.slice(0, -4);
                  usurptText += '!';
              } else {
                  usurptText += ' fought a polygon... and the polygon won.';
              }
              sockets.broadcast(usurptText);
              if (MANHUNT === true) {
                  let leader = entities.find(r=>r.id ===  room.topPlayerID)
                  if (leader) {
                      leader.color = 12
                  }
              }
            }
              // Initalize message arrays
         }
        return 1;
        // Kill it
      } 
      return 0;
  }

  protect() { 
      entitiesToAvoid.push(this); this.isProtected = true; 
  }

  sendMessage(message) { } // Dummy

  kill() {
      this.health.amount = -1;
  }
  killl() {
      this.health.amount = -999999;
  }
  ondead () { } // On dead dummy
  
  destroy() {
      // Remove from the protected entities list
      if (this.isProtected) util.remove(entitiesToAvoid, entitiesToAvoid.indexOf(this)); 
      // Remove from minimap
      let i = minimap.findIndex(entry => { return entry[0] === this.id; });
      if (i != -1) util.remove(minimap, i);
      // Remove this from views
      views.forEach(v => v.remove(this));
      // Remove from parent lists if needed
      if (this.parent != null) util.remove(this.parent.children, this.parent.children.indexOf(this));
      //remove bullet from bullet list if it needs that and the only reason it exists is for bacteria lmao
      if (this.changebodynew === false) {if (this.bulletparent != null) util.remove(this.bulletparent.bulletchildren, this.bulletparent.bulletchildren.indexOf(this))} else if (this.bulletparent !== null && this.bulletparent !== this && this.bulletparent !== undefined) {
        console.log(this.bulletparent.id, this.bulletparent.master.id)
        util.remove(this.bulletparent.master.bulletchildren, this.bulletparent.master.bulletchildren.indexOf(this))
      }
      // Kill all of its children
      let ID = this.id;
      entities.forEach(instance => {
          if (instance.source.id === this.id) {
              if (instance.settings.persistsAfterDeath) {
                  instance.source = instance;
              } else {
                  if (this.changebodynew === false) {
                    instance.kill();
                  }
              }
          }
          if (instance.parent && instance.parent.id === this.id) {
              instance.parent = null;
          }
          if (instance.master.id === this.id) {
            if (this.changebodynew === false) {
              instance.kill();
              instance.master = instance;
            }
          }
      });
      // Remove everything bound to it
      this.turrets.forEach(t => t.destroy());
      // Remove from the collision grid
      this.removeFromGrid();
      this.isGhost = true;
  }    
  
  isDead() {
      return this.health.amount <= 0; 
  }
}
var o = new Entity({x: room.width/2,y:room.height/2}); o.name = 'Zombie Master'; o.define({CAN_GO_OUTSIDE_ROOM: true}); o.SIZE=0;o.define({DRAW_SELF: false});
entities.splice(o)
var zombieMaster = o
/*** SERVER SETUP ***/
// Make a speed monitor
var logs = (() => {
    let logger = (() => {
        // The two basic functions
        function set(obj) {
            obj.time = util.time();
        }
        function mark(obj) {
            obj.data.push(util.time() - obj.time);
        }
        function record(obj) {
            let o = util.averageArray(obj.data);
            obj.data = [];
            return o;
        }
        function sum(obj) {
            let o = util.sumArray(obj.data);
            obj.data = [];
            return o;
        }
        function tally(obj) {
            obj.count++;
        }
        function count(obj) {
            let o = obj.count;
            obj.count = 0;
            return o;
        }
        // Return the logger creator
        return () => {
            let internal = {
                data: [],
                time: util.time(),
                count: 0,
            };
            // Return the new logger
            return {
                set: () => set(internal),
                mark: () => mark(internal),
                record: () => record(internal),
                sum: () => sum(internal),
                count: () => count(internal),
                tally: () => tally(internal),
            };
        };
    })();
    // Return our loggers
    return {
        entities: logger(),
        collide: logger(),
        network: logger(),
        minimap: logger(),
        misc2: logger(),
        misc3: logger(),
        physics: logger(),
        life: logger(),
        selfie: logger(),
        master: logger(),
        activation: logger(),
        loops: logger(),
    };
})();
// Essential server requires
var http = require('http'),
    url = require('url'),
    WebSocket = require('ws'),
    fs = require('fs'),
    mockupJsonData = (() => { 
        function rounder(val) {
            if (Math.abs(val) < 0.00001) val = 0;
            return +val.toPrecision(6);
        }
        // Define mocking up functions
        function getMockup(e, positionInfo) {
            return { 
                index: e.index,
                name: e.label,  
                x: rounder(e.x),
                y: rounder(e.y),
                color: e.color,
                shape: e.shapeData,
                size: rounder(e.size),
                realSize: rounder(e.realSize),
                facing: rounder(e.facing),
                layer: e.layer,
                statnames: e.settings.skillNames,
                position: positionInfo,
                upgrades: e.upgrades.map(r => ({ tier: r.tier, index: r.index })),
                guns: e.guns.map(function(gun) {
                    return {
                        offset: rounder(gun.offset),
                        direction: rounder(gun.direction),
                        length: rounder(gun.length),
                        width: rounder(gun.width),
                        aspect: rounder(gun.aspect),
                        angle: rounder(gun.angle),
                    };
                }),
                turrets: e.turrets.map(function(t) { 
                    let out = getMockup(t, {});
                    out.sizeFactor = rounder(t.bound.size);
                    out.offset = rounder(t.bound.offset);
                    out.direction = rounder(t.bound.direction);
                    out.layer = rounder(t.bound.layer);
                    out.angle = rounder(t.bound.angle);
                    return out;
                }),
                special: JSON.stringify(e.special)
            };
        }
        function getDimensions(entities) {
            /* Ritter's Algorithm (Okay it got serious modified for how we start it)
            * 1) Add all the ends of the guns to our list of points needed to be bounded and a couple points for the body of the tank..
            */
            let endpoints = [];
            let pointDisplay = [];
            let pushEndpoints = function(model, scale, focus={ x: 0, y: 0 }, rot=0) {
                let s = Math.abs(model.shape);
                let z = (Math.abs(s) > lazyRealSizes.length) ? 1 : lazyRealSizes[Math.abs(s)];
                if (z === 1) { // Body (octagon if circle)
                    for (let i=0; i<2; i+=0.5) {
                        endpoints.push({x: focus.x + scale * Math.cos(i*Math.PI), y: focus.y + scale * Math.sin(i*Math.PI)});
                    }
                } else { // Body (otherwise vertices)
                    for (let i=(s%2)?0:Math.PI/s; i<s; i++) { 
                        let theta = (i / s) * 2 * Math.PI;
                        endpoints.push({x: focus.x + scale * z * Math.cos(theta), y: focus.y + scale * z * Math.sin(theta)});
                    }
                }
                model.guns.forEach(function(gun) {
                    let h = (gun.aspect > 0) ? scale * gun.width / 2 * gun.aspect : scale * gun.width / 2;
                    let r = Math.atan2(h, scale * gun.length) + rot;
                    let l = Math.sqrt(scale * scale * gun.length * gun.length + h * h);
                    let x = focus.x + scale * gun.offset * Math.cos(gun.direction + gun.angle + rot);
                    let y = focus.y + scale * gun.offset * Math.sin(gun.direction + gun.angle + rot);        
                    endpoints.push({
                        x: x + l * Math.cos(gun.angle + r),
                        y: y + l * Math.sin(gun.angle + r),
                    });
                    endpoints.push({
                        x: x + l * Math.cos(gun.angle - r),
                        y: y + l * Math.sin(gun.angle - r),
                    });
                    pointDisplay.push({
                        x: x + l * Math.cos(gun.angle + r),
                        y: y + l * Math.sin(gun.angle + r),
                    }); 
                    pointDisplay.push({
                        x: x + l * Math.cos(gun.angle - r),
                        y: y + l * Math.sin(gun.angle - r),
                    });
                });
                model.turrets.forEach(function(turret) {
                    pushEndpoints(
                        turret, turret.bound.size, 
                        { x: turret.bound.offset * Math.cos(turret.bound.angle), y: turret.bound.offset * Math.sin(turret.bound.angle) }, 
                        turret.bound.angle
                    );
                });
            };
            pushEndpoints(entities, 1);
            // 2) Find their mass center
            let massCenter = { x: 0, y: 0 };
            /*endpoints.forEach(function(point) {
                massCenter.x += point.x;
                massCenter.y += point.y;
            });
            massCenter.x /= endpoints.length;
            massCenter.y /= endpoints.length;*/
            // 3) Choose three different points (hopefully ones very far from each other)
            let chooseFurthestAndRemove = function(furthestFrom) {
                let index = 0;
                if (furthestFrom != -1) {
                    let list = new goog.structs.PriorityQueue();
                    let d;
                    for (let i=0; i<endpoints.length; i++) {
                        let thisPoint = endpoints[i];
                        d = Math.pow(thisPoint.x - furthestFrom.x, 2) + Math.pow(thisPoint.y - furthestFrom.y, 2) + 1;
                        list.enqueue(1/d, i);
                    }
                    index = list.dequeue();
                }
                let output = endpoints[index];
                endpoints.splice(index, 1);
                return output;
            };
            let point1 = chooseFurthestAndRemove(massCenter); // Choose the point furthest from the mass center
            let point2 = chooseFurthestAndRemove(point1); // And the point furthest from that
            // And the point which maximizes the area of our triangle (a loose look at this one)
            let chooseBiggestTriangleAndRemove = function(point1, point2) {
                let list = new goog.structs.PriorityQueue();
                let index = 0;
                let a;
                for (let i=0; i<endpoints.length; i++) {
                    let thisPoint = endpoints[i];
                    a = Math.pow(thisPoint.x - point1.x, 2) + Math.pow(thisPoint.y - point1.y, 2) +
                        Math.pow(thisPoint.x - point2.x, 2) + Math.pow(thisPoint.y - point2.y, 2);                                 
                        /* We need neither to calculate the last part of the triangle 
                        * (because it's always the same) nor divide by 2 to get the 
                        * actual area (because we're just comparing it)
                        */
                    list.enqueue(1/a, i);
                }
                index = list.dequeue();
                let output = endpoints[index];
                endpoints.splice(index, 1);
                return output;
            };
            let point3 = chooseBiggestTriangleAndRemove(point1, point2);
            // 4) Define our first enclosing circle as the one which seperates these three furthest points
            function circleOfThreePoints(p1, p2, p3) {
                let x1 = p1.x;
                let y1 = p1.y;
                let x2 = p2.x;
                let y2 = p2.y;
                let x3 = p3.x;
                let y3 = p3.y;
                let denom =  
                    x1 * (y2 - y3) - 
                    y1 * (x2 - x3) + 
                    x2 * y3 -
                    x3 * y2;
                let xy1 = x1*x1 + y1*y1;
                let xy2 = x2*x2 + y2*y2;
                let xy3 = x3*x3 + y3*y3;
                let x = ( // Numerator
                    xy1 * (y2 - y3) +
                    xy2 * (y3 - y1) +
                    xy3 * (y1 - y2)
                ) / (2 * denom);
                let y = ( // Numerator
                    xy1 * (x3 - x2) +
                    xy2 * (x1 - x3) +
                    xy3 * (x2 - x1)
                ) / (2 * denom);
                let r = Math.sqrt(Math.pow(x - x1, 2) + Math.pow(y - y1, 2));
                let r2 = Math.sqrt(Math.pow(x - x2, 2) + Math.pow(y - y2, 2));
                let r3 = Math.sqrt(Math.pow(x - x3, 2) + Math.pow(y - y3, 2));
                if (r != r2 || r != r3) {
                    //util.log('somethings fucky');
                }
                return { x: x, y: y, radius: r };            
            }
            let c = circleOfThreePoints(point1, point2, point3);
            pointDisplay = [
                { x: rounder(point1.x), y: rounder(point1.y), },
                { x: rounder(point2.x), y: rounder(point2.y), },
                { x: rounder(point3.x), y: rounder(point3.y), },
            ];
            let centerOfCircle = { x: c.x, y: c.y };
            let radiusOfCircle = c.radius;
            // 5) Check to see if we enclosed everything
            function checkingFunction() {
                for(var i=endpoints.length; i>0; i--) {
                    // Select the one furthest from the center of our circle and remove it
                    point1 = chooseFurthestAndRemove(centerOfCircle);
                    let vectorFromPointToCircleCenter = new Vector(centerOfCircle.x - point1.x, centerOfCircle.y - point1.y);
                    // 6) If we're still outside of this circle build a new circle which encloses the old circle and the new point
                    if (vectorFromPointToCircleCenter.length > radiusOfCircle) {
                        pointDisplay.push({ x: rounder(point1.x), y: rounder(point1.y), });
                        // Define our new point as the far side of the cirle
                        let dir = vectorFromPointToCircleCenter.direction;
                        point2 = {
                            x: centerOfCircle.x + radiusOfCircle * Math.cos(dir),
                            y: centerOfCircle.y + radiusOfCircle * Math.sin(dir),
                        };
                        break;
                    }
                }
                // False if we checked everything, true if we didn't
                return !!endpoints.length;
            }
            while (checkingFunction()) { // 7) Repeat until we enclose everything
                centerOfCircle = {
                    x: (point1.x + point2.x) / 2,
                    y: (point1.y + point2.y) / 2,
                };
                radiusOfCircle = Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2)) / 2;
            }
            // 8) Since this algorithm isn't perfect but we know our shapes are bilaterally symmetrical, we bind this circle along the x-axis to make it behave better
            return {
                middle: { x: rounder(centerOfCircle.x), y: 0 },
                axis: rounder(radiusOfCircle * 2),
                points: pointDisplay,
            };
        }
        // Save them 
        let mockupData = [];
        for (let k in Class) {
            try {
                if (!Class.hasOwnProperty(k)) continue;
                let type = Class[k];   
                // Create a reference entities which we'll then take an image of.
                let temptank = new Entity({x: 0, y: 0});
                temptank.define(type);
                temptank.name = type.LABEL; // Rename it (for the upgrades menu).
                // Fetch the mockup.
                type.mockup = {
                    body: temptank.camera(true),
                    position: getDimensions(temptank),
                };
                // This is to pass the size information about the mockup that we didn't have until we created the mockup
                type.mockup.body.position = type.mockup.position;
                // Add the new data to the thing.
                mockupData.push(getMockup(temptank, type.mockup.position));
                // Kill the reference entities.
                temptank.destroy();
            } catch(error) {
                util.error(error);
                util.error(k);
                util.error(Class[k]);
            } 
        }
        // Remove them
        purgeEntities();
        // Build the function to return
        let writeData = JSON.stringify(mockupData);
        return writeData;
    })();
function startwave() {
  let random = ran.randomRange(1,2454100)
  let bosses = siegewave
  let sentries = 2
  sockets.broadcast('Wave '+siegewave+' has started!')
  if (bosses > 30) {bosses = 30; sentries = 10} else 
  if (bosses > 15) {bosses = 15; sentries = 8} else 
  if (bosses > 5) {bosses = 5; sentries = 5}
  siegebosses = bosses
  //sockets.broadcast('bosses test: '+siegebosses, 'gold')
  for (let i = 0; i < siegebosses; i++) {
    let bossestype = [Class.elite_destroyer, Class.elite_sprayer, Class.elite_gunner, Class.summoner, Class.sorcerer]
    if (siegewave > 9) {
      bossestype = [Class.elite_destroyer, Class.elite_sprayer, Class.elite_gunner, Class.summoner, Class.sorcerer, Class.enchantress, Class.exorcistor, Class.nestKeeper, Class.nestWarden, Class.nestGuardian, Class.gersemi, Class.ares, Class.ezekiel, Class.selene, Class.eris]
    }
    if (siegewave > 20) {
      bossestype = [Class.elite_destroyer, Class.elite_sprayer, Class.elite_gunner, Class.summoner, Class.sorcerer, Class.enchantress, Class.exorcistor, Class.nestKeeper, Class.nestWarden, Class.nestGuardian, Class.gersemi, Class.ares, Class.ezekiel, Class.selene, Class.eris, Class.nyx, Class.theia, Class.freyja, Class.paladin, Class.zaphkiel]
    }
    if (siegewave === 16 || siegewave === 69 || siegewave === 180 || siegewave === 360 || siegewave === 450) {
      bossestype = [Class.bob]
    }
    if (WINTER_MAYHEM === true) {
      bossestype = [Class.elf_destroyer, Class.elf_gunner, Class.elfSpawner, Class.reindeer0, Class.reindeer0, Class.reindeer0, Class.everscream, Class.pumpkinEmperor, Class.presentSnatcher]
    }
    let randombosstype = Math.floor(ran.randomRange(0,bossestype.length))
    let bosstype = bossestype[randombosstype]
    let randomspawn = [{x:100, y:100},{x:room.width-100, y:100},{x:100, y:room.height-100},{x:room.width-100, y:room.height-100}]
    //console.log(randomspawn[ran.randomRange(0,3)]+' '+ran.randomRange(0,3))
    let newboss = new Entity({x: randomspawn[Math.floor(ran.randomRange(0,3))].x + ran.randomRange(0,100), y:randomspawn[Math.floor(ran.randomRange(0,3))].y + + ran.randomRange(0,100)})
    newboss.define(bosstype)
    newboss.team = -100
    newboss.type = 'miniboss'
    newboss.siegeboss = true
    newboss.fov = 9999999
    newboss.addController(new io_goToCenter(newboss))
  }
  for (let i = 0; i < sentries; i++) {
    for (let i2 = 0; i2 < 2 * 2; i2++) {
      let newCrasher = new Entity({x: ran.randomRange(room.width/3,room.width-room.width/3),y: ran.randomRange(room.height/3,room.height-room.height/3)})
      newCrasher.define(Class.crasher)
      newCrasher.team = -100
    }
    let Sentrytype = [Class.sentrySwarm,Class.sentryGun,Class.sentryTrap]
    let newSentry = new Entity({x: ran.randomRange(room.width/3,room.width-room.width/3),y: ran.randomRange(room.height/3,room.height-room.height/3)})
    newSentry.define(Sentrytype[Math.floor(ran.randomRange(0,Sentrytype.length))])
    newSentry.team = -100
  }
}
// Train Wars
setInterval(() => {
    if (TRAIN_WARS === true) {
      let teams = new Set(entities.filter(r => r.plrsocket).map(r => r.team))
      for (let team of teams) {
        //let train = entities.filter(r => r.player && r.team === team && !r.inBaseProtectionLevel).sort((a, b) => b.skill.score - a.skill.score)
        let train = entities.filter(r => r.plrsocket && r.team === team).sort((a, b) => b.skill.score - a.skill.score)
        for (let [i, player] of train.entries()) {
          if (i === 0) continue

          player.velocity.x = util.clamp(train[i - 1].x - player.x, -90, 90) * player.damp
          player.velocity.y = util.clamp(train[i - 1].y - player.y, -90, 90) * player.damp
        }
      }
    }
}, 33.33)
// Websocket behavior
const sockets = (() => {
    const protocol = require('./lib/fasttalk');
    let clients = [], players = [];
    return {
        broadcast: (message,color) => {
            clients.forEach(socket => {
                if (color) {
                  socket.talk('m', message, color);
                } else socket.talk('m', message);
            });
        },
        updateRoom: () => {
          clients.forEach(socket => {
            socket.talk(
              'R',
              room.width,
              room.height,
              JSON.stringify(roomsetup), 
              JSON.stringify(util.serverStartTime),
              roomSpeed
            );
          })
        },
        connect: (() => {
            // Define shared functions
            // Closing the socket
            function close(socket) {
                // Figure out who the player was
                let player = socket.player,
                    index = players.indexOf(player);
                // Remove the player if one was created
                if (index != -1) {
                    // Kill the body if it exists
                    if (player.body != null) {
                        player.body.invuln = false;
                        player.body.opinvuln = false;
                        setTimeout(() => {
                            player.body.kill();
                        }, 10000);
                    }
                    // Disconnect everything
                    util.log('[INFO] User ' + socket.name + ' disconnected!');
                    sockets.broadcast(socket.name+' has left the game.')
                    util.remove(players, index);
                } else {
                    util.log('[INFO] A player disconnected before entering the game.');
                }
                // Free the view
                util.remove(views, views.indexOf(socket.view));
                // Remove the socket
                util.remove(clients, clients.indexOf(socket));        
                util.log('[INFO] Socket closed. Views: ' + views.length + '. Clients: ' + clients.length + '.');
                clientcount = clientcount - 1
            }
            // Being kicked 
            function kick(socket, reason = 'No reason given.') {
                util.warn(reason + ' Kicking.');
                socket.lastWords('K');
            }
            // Handle incoming messages
            function incoming(message, socket) {
                // Only accept binary
                if (!(message instanceof ArrayBuffer)) { socket.kick('Non-binary packet.'); return 1; }
                // Decode it
                let m = protocol.decode(message);
                // Make sure it looks legit
                if (m === -1) { socket.kick('Malformed packet.'); return 1; }
                // Log the message request
                socket.status.requests++;
                //temp banned check
                let socketIsBanned = false
                tempBannedList.forEach((bip) => {
                  if (socket._socket.remoteAddress === bip) {
                    socketIsBanned = true
                  }
                })
                if (socketIsBanned === true) {
                  socket.kick('You got banned temporarily.');//rip to anyone who gets banned by this lol
                }
                // Remember who we are
                let player = socket.player;
                // Handle the request
                switch (m.shift()) {
                    case 'k': { // key verification
                        if (m.length > 2) { socket.kick('Ill-sized key request.'); return 1; }
                        if (socket.status.verified) { socket.kick('Duplicate player spawn attempt.'); return 1; }
                        socket.talk('w', true)
                        if (m.length >= 1) {
                            let key = m[0];
                            socket.key = key;
                            util.log('[INFO] A socket was verified with the token: '); util.log(key);
                        }
                        socket.verified = true;
                        util.log('Clients: ' + clients.length);
                        if (check === true) {
                            if (checktype === 1 && socket.key !== process.env.SECRET) {
                            socket.talk('K')
                            socket.terminate();
                            sockets.broadcast('A player tried to join, but was kicked.')
                            } else if (checktype === 0 && socket.key !== 'ShinyToken?' && socket.key !== process.env.SECRET) {
                            socket.talk('K')
                            socket.terminate()
                            }
                            }
                        /*if (m.length === 4) {
                          util.log('Nexus Teleported!')
                          //socket.nexus = [m[1],m[2],m[3]]
                        }*/
                        console.log(m)
                        if (m[1] == true) {
                          util.log('Nexus Teleported!')
                          if (c["ALLOW_NEXUSTP"] === true) {
                            socket.nexusTp = true
                          }
                        }
                        socket.controlling_dom = false;
                        socket.dragging = false; // DRAG OP COMMAND
                        socket.globalchatdelay = false; // delay for global chat
                        socket.chatchannel = "near";//Chat channel
                        socket.entitydragged
                        if (socket.key === process.env.SECRET) {
                            socket.tokenlvl = 5
                            socket.OP = true;
                        }
                          else {
                            let findtoken = process.env.thesetokens
                            let tokenlist = findtoken.split('/')
                            socket.tokenlvl = 0
                            let tokenid = 0
                            tokenlist.forEach((t)=>{
                              if (socket.key === t) {
                                if (tokenexpired[tokenid]===0) {
                                  socket.tokenlvl = tokenLevels[tokenid]
                                } else {
                                  if (tokenLevels[tokenid] === 4) {
                                    socket.talk('m', 'Your Beta Tester token has been disabled.');
                                  }
                                }
                              }
                              tokenid += 1
                            })
                            if (socket.tokenlvl > 2) {socket.OP = true;}
                            //sockets.broadcast('Someone has joined the game.');
                        };
                        if (randommode === "SANDBOX") {
                          socket.OP = true;
                        }
                        if (socket.tokenlvl < c["MIN_TOKEN_LVL"] && socket.nexusTp !== true) {
                          sockets.broadcast("Someone tried to join the server but doesn't have permissions to do that.")
                          socket.kick("Socket doesn't have permissions to join this server.")
                        }
                        /*if (m.length !== 1) { socket.kick('Ill-sized key request.'); return 1; }
                        // Get data
                        // Verify it
                        if (typeof key !== 'string') { socket.kick('Weird key offered.'); return 1; }
                        if (key.length > 64) { socket.kick('Overly-long key offered.'); return 1; }
                        if (socket.status.verified) { socket.kick('Duplicate player spawn attempt.'); return 1; }
                        // Otherwise proceed to check if it's available.
                        if (keys.indexOf(key) != -1) {
                            // Save the key
                            socket.key = key.substr(0, 64);
                            // Make it unavailable
                            util.remove(keys, keys.indexOf(key));
                            socket.verified = true;
                            // Proceed
                            socket.talk('w', true);
                            util.log('[INFO] A socket was verified with the token: '); util.log(key);
                            util.log('Clients: ' + clients.length);
                        } else {
                            // If not, kick 'em (nicely)
                            util.log('[INFO] Invalid player verification attempt.');
                            socket.lastWords('w', false);
                        }*/
                    } break;
                case 'A': { // spawn request
                    // CASE: server detected that you control a mothership.
              if (DOMINATION === true) {
                if(socket.controlling_dom){
                socket.controlling_dom=false;
                socket.player.body.controlled = false;
                let e = new Entity(room.random());
                e.define(Class.basic);
                for(let en of entities){if(en.dominator == true){
                //en.addController(new io_listenToPlayer(e, socket.player));
                  
               // en.controllers = [];
               // en.addController(new io_nearestDifferentMaster(en))
                socket.player.body = e;
                e.control = socket.player.body.control;
                setTimeout(()=>{socket.player.body.kill()},25);
                }}};
              
             //for(let e of entities){if(e.type=='modemothership'){if(e.controllers!='listenToPlayer'){e.controlled=false}}};
              //let clients = sockets.getClients();
              let canbedom = false;
              for (let e of entities) {
                if(socket.player.body != null){
                if(e.dominator == true && e.team == socket.player.body.team && e.controlled == false && socket.controlling_dom === false){
                  socket.talk('m', 'You are now controlling the Dominator. Press F to surrender control.');
                  let oldbody = socket.player.body;
                  e.controlled = true;
                  e.control = socket.player.body.control;
                  socket.player.body.controlled = e.controlled;
                  socket.player.body = e;
                  e.controllers = [];
                  e.addController(new io_listenToPlayer(e, socket.player)); 
                  socket.controlling_dom = true;
                  canbedom = true
                  setTimeout(()=>{oldbody.invuln = false; oldbody.opinvuln = false; setTimeout(()=>{oldbody.destroy();}, 15);},50);
                 }
                  }
                } 
                if (canbedom == false) {socket.talk('m', 'Someone has already took control of all dominators.');}
              }
                } break;
                case 's': { // spawn request
                    if (!socket.status.deceased) { socket.kick('Trying to spawn while already alive.'); return 1; }
                    if (m.length !== 2) { socket.kick('Ill-sized spawn request.'); return 1; }
                    // Get data
                    let name = m[0].replace(c.BANNED_CHARACTERS_REGEX, '');
                    let needsRoom = m[1];
                    // Verify it
                    if (typeof name != 'string') { socket.kick('Bad spawn request name.'); return 1; }
                    if (encodeURI(name).split(/%..|./).length > 48) { socket.kick('Overly-long name.'); return 1; }
                    if (needsRoom !== -1 && needsRoom !== 0) { socket.kick('Bad spawn request.'); return 1; }
                    // Bring to life
                    socket.status.deceased = false;
                    // Define the player.
                    if (players.indexOf(socket.player) != -1) { util.remove(players, players.indexOf(socket.player));  }
                    // Free the old view
                    if (views.indexOf(socket.view) != -1) { util.remove(views, views.indexOf(socket.view)); socket.makeView(); }
                    socket.player = socket.spawn(name);     
                    // Give it the room state
                    if (!needsRoom) { 
                        socket.talk(
                            'R',
                            room.width,
                            room.height,
                            JSON.stringify(roomsetup), 
                            JSON.stringify(util.serverStartTime),
                            roomSpeed
                        );
                    }
                    // Start the update rhythm immediately
                    socket.update(0);  
                    // Log it    
                    util.log('[INFO] ' + (m[0]) + (needsRoom ? ' joined' : ' rejoined') + ' the game! Players: ' + players.length);   
                    if (needsRoom === 0) {
                      sockets.broadcast(m[0]+' has joined the game!')
                    }
                    socket.name = m[0]
                } break;
                case 'S': { // clock syncing
                    if (m.length !== 1) { socket.kick('Ill-sized sync packet.'); return 1; }
                    // Get data
                    let synctick = m[0];
                    // Verify it
                    if (typeof synctick !== 'number') { socket.kick('Weird sync packet.'); return 1; }
                    // Bounce it back
                    socket.talk('S', synctick, util.time());
                    room.players = players;
                } break;
                case 'p': { // ping
                    if (m.length !== 1) { socket.kick('Ill-sized ping.'); return 1; }
                    // Get data
                    let ping = m[0];
                    // Verify it
                    if (typeof ping !== 'number') { socket.kick('Weird ping.'); return 1; }
                    // Pong
                    socket.talk('p', m[0]); // Just pong it right back
                    socket.status.lastHeartbeat = util.time();
                    room.players = players;
                } break;
                case 'd': { // downlink
                    if (m.length !== 1) { socket.kick('Ill-sized downlink.'); return 1; }
                    // Get data
                    let time = m[0];
                    // Verify data
                    if (typeof time !== 'number') { socket.kick('Bad downlink.'); return 1; }
                    // The downlink indicates that the client has received an update and is now ready to receive more.
                    socket.status.receiving = 0;
                    socket.camera.ping = util.time() - time;
                    socket.camera.lastDowndate = util.time();
                    // Schedule a new update cycle
                    // Either fires immediately or however much longer it's supposed to wait per the config.
                    socket.update(Math.max(0, (1000 / c.networkUpdateFactor) - (util.time() - socket.camera.lastUpdate)));
                } break;
                case 'vW': { // allow debug menu
                  if (socket.tokenlvl > 2) {
                    console.log(socket.name+' have accessed the debug menu.')
                    socket.talk('bigW')
                  } else {
                    console.log(socket.name+' tried to access debug menu.')
                    socket.talk('m', "To access debug menu you have to be shiny member or higher")
                  }
                } break;
                case 'C': { // command packet

                    if (m.length !== 3) { socket.kick('Ill-sized command packet.'); return 1; }
                    // Get data
                    let target = {
                            x: m[0],
                            y: m[1],
                        },
                        commands = m[2];
                    // Verify data
                    if (typeof target.x !== 'number' || typeof target.y !== 'number' || typeof commands !== 'number') { socket.kick('Weird downlink.'); return 1; }
                    if (commands > 255) { socket.kick('Malformed command packet.'); return 1; }
                    // Put the new target in
                    player.target = target
                    // Process the commands
                    if (player.command != null && player.body != null) {
                        player.command.up    = (commands &  1)
                        player.command.down  = (commands &  2) >> 1
                        player.command.left  = (commands &  4) >> 2
                        player.command.right = (commands &  8) >> 3
                        player.command.lmb   = (commands & 16) >> 4
                        player.command.mmb   = (commands & 32) >> 5
                        player.command.rmb   = (commands & 64) >> 6
                    }
                    // Update the thingy 
                    socket.timeout.set(commands)
                } break;
                case 't': { // player toggle
                    if (m.length !== 1) { socket.kick('Ill-sized toggle.'); return 1; }
                    // Get data
                    let given = '',
                        tog = m[0];
                    // Verify request
                    if (typeof tog !== 'number') { socket.kick('Weird toggle.'); return 1;  }
                    // Decipher what we're supposed to do.
                    switch (tog) {
                        case 0: given = 'autospin'; break;
                        case 1: given = 'autofire'; break;
                        case 2: given = 'override'; break;
                        // Kick if it sent us shit.
                        default: 
                        if (tog === 3) {
                          //sockets.broadcast('press B')
                        } else if (tog === 4) {
                          //sockets.broadcast('press V')
                        } else {
                          socket.kick('Bad toggle.');
                        }
                        return 1;
                    }
                    // Apply a good request.
                    if (player.command != null && player.body != null) {
                        player.command[given] = !player.command[given];
                        // Send a message.
                        player.body.sendMessage(given.charAt(0).toUpperCase() + given.slice(1) + ((player.command[given]) ? ' enabled.' : ' disabled.'));
                    }
                } break;
                case 'U': { // upgrade request
                    if (m.length !== 1) { socket.kick('Ill-sized upgrade request.'); return 1; }
                    // Get data
                    let number = m[0];
                    // Verify the request
                    if (typeof number != 'number' || number < 0) { socket.kick('Bad upgrade request.'); return 1; }
                    // Upgrade it
                    if (player.body != null) {
                        player.body.upgrade(number); // Ask to upgrade
                        if (player.body.hasaltfire === true) {
                          socket.talk('m', "Right click to fire your main barrel.");
                        }
                        if (player.body.label === 'Size: +2') {
                          player.body.OPSIZE = player.body.OPSIZE+2;
                        };
                        if (player.body.label === 'Size: -2') {
                          if ((player.body.OPSIZE-2) !== 0) {
                            player.body.OPSIZE = player.body.OPSIZE-2;
                        } else {
                          player.body.sendMessage('Size cant be smaller than 0!')
                        }
                        };
                        if (player.body.teleport === true) {
                          player.body.sendMessage('Press Right-Click to Teleport.')
                        }
                    }
                    /*if (player.body.color !== socket.player.teamColor) {
                      if (room.gameMode === "ffa") {
                        if (player.body.color !== 12 && socket.player.teamColor !== 10) {
                          socket.player.teamColor = socket.player.body.color;
                        }
                      } else {
                        socket.player.teamColor = socket.player.body.color;
                      }
                    }*/
                } break;
                case 'x': { // skill upgrade request
                    if (m.length !== 1) { socket.kick('Ill-sized skill request.'); return 1; }
                    let number = m[0], stat = '';
                    // Verify the request
                    if (typeof number != 'number') { socket.kick('Weird stat upgrade request.'); return 1; }
                    // Decipher it
                    switch (number) {
                        case 0: stat = 'atk'; break;
                        case 1: stat = 'hlt'; break;
                        case 2: stat = 'spd'; break;
                        case 3: stat = 'str'; break;
                        case 4: stat = 'pen'; break;
                        case 5: stat = 'dam'; break;
                        case 6: stat = 'rld'; break;
                        case 7: stat = 'mob'; break;
                        case 8: stat = 'rgn'; break;
                        case 9: stat = 'shi'; break;
                        default: socket.kick('Unknown stat upgrade request.'); return 1;
                    }
                    // Apply it
                    if (player.body != null) {
                        player.body.skillUp(stat); // Ask to upgrade a stat
                    }
                } break;
                case 'L': { // level up cheat
                    if (m.length !== 0) { if (m.length !== 1) {socket.kick('Ill-sized level-up request.'); return 1;} }
                    // cheatingbois
                    if (player.body != null) {
                      if (m.length === 1) {
                          if (m[0] === 0) {
                            if (player.body.skill.level < c.SKILL_CHEAT_CAP || ((socket.key === process.env.SECRET) && player.body.skill.level < 45)) {
                            if (player.body.type !== "dominator") {
                              player.body.skill.score += player.body.skill.levelScore;
                              player.body.skill.maintain();
                              player.body.refreshBodyAttributes();
                            }
                          }
                        } else if (m[0] === 1) {
                          if (socket.OP === true) {
                            player.body.skill.score += player.body.skill.levelScore;
                            player.body.skill.maintain();
                            player.body.refreshBodyAttributes();
                          }
                        }
                      } else {
                        if (player.body.skill.level < c.SKILL_CHEAT_CAP || ((socket.key === process.env.SECRET) && player.body.skill.level < 45)) {
                        if (player.body.type !== "dominator") {
                          player.body.skill.score += player.body.skill.levelScore;
                        player.body.skill.maintain();
                        player.body.refreshBodyAttributes();
                        }
                      }
                      }
                    }
                } break;
                case 'op': { // level up cheat
                    if (socket.OP === true) {
                    let command = m[0]
                    //util.log('op command data: '+m+', op player: '+socket.name)
                    socket.commanddelay = false
                    if (socket.player.body != null) {
                      switch (command) {
                        case 191: {
                          let help_menu = ["Help menu:","- [1] Preset tank #1", "- [Q] Basic", "- [E] Teleport", "- [K]ill", "- [T]eam", "- [Y] Invite to team", "- [H]eal", "- [S]tronger", "- [C]an be on leaderboard", "- [N] Infinite level up", "- [P]olice", "- [B]last","- [D]rag", "- [X] Wall", "- [Z] Wall type", "- [V]anish", "- [I]nvulnerable", "- [0] Clear zoom", "- [+] Zoom-in", "- [-] Zoom-out", "- [.] Bigger", "- [,] Smaller", "- [;] Give operator access"]
                          if (socket.tokenlvl === 5) {
                          help_menu[help_menu.length] = '- [9] Restart'
                          }
                          if (socket.tokenlvl >= 4) {
                          help_menu[help_menu.length] = '- [O] Kick a player'
                          }
                          help_menu[help_menu.length] = "Warning: Avoid zooming all the way out to prevent lagging server."
                          // Old Help menu
                          /*for (let i = help_menu.length-1; i>=0; i+=-1) {
                            socket.player.body.sendMessage(help_menu[i])
                          }*/
                          socket.talk("Em", JSON.stringify(help_menu))
                          
                        } break;
                        case 189: {
                         // socket.player.body.sendMessage('Bigger')
                          socket.player.body.fov = socket.player.body.fov * 1.25
                        } break;
                        case 57: {
                          if (socket.key === process.env.SECRET) {
                            sockets.broadcast('Arena closed: No players may join!')
                            setTimeout(() => instantcrash(),3500)
                          }
                        } break;
                        case 'Comma': {
                          socket.player.body.SIZE = socket.player.body.SIZE / 1.125
                          socket.player.body.OPSIZE = socket.player.body.OPSIZE / 1.125
                          socket.player.body.coreSize = socket.player.body.SIZE
                          player.body.refreshBodyAttributes();
                        } break;
                        case 'Period': {
                          let mapsize = width2
                          if (height2>width2) {
                            mapsize = height2
                          }
                          if (socket.player.body.realSize < mapsize/5.25) {
                            //socket.player.body.sendMessage('size'+socket.player.body.SIZE+' mapsize'+mapsize)
                            socket.player.body.SIZE = socket.player.body.SIZE * 1.125
                            socket.player.body.OPSIZE = socket.player.body.OPSIZE * 1.125
                            socket.player.body.coreSize = socket.player.body.SIZE
                            player.body.refreshBodyAttributes();
                          }
                        } break;
                        case 'Semicolon': {
                          let drag = m[1]
                          let o = nearest(entities, {x:socket.player.body.x+socket.player.target.x,y:socket.player.body.y+socket.player.target.y});
                          if (o.x < socket.player.body.x+socket.player.target.x+(o.SIZE*1.5)) {if (o.x > socket.player.body.x+socket.player.target.x-(o.SIZE*1.5)) {if (o.y < socket.player.body.y+socket.player.target.y+(o.SIZE*1.5)) {if (o.y > socket.player.body.y+socket.player.target.y-(o.SIZE*1.5)) {
                            socket.player.body.sendMessage('Entity selected: Name:'+o.name+', Label:'+o.label+', ID:'+o.id)
                            if (o.plrsocket != 0) {
                              if (o.plrsocket.tokenlvl < 3) {
                                if (o.plrsocket.OP === true) {
                                  o.plrsocket.OP = false
                                  socket.player.body.sendMessage('Operator access removed to entity!')
                                  o.sendMessage('You are no longer an operator.')
                                } else {
                                  o.plrsocket.OP = true
                                  socket.player.body.sendMessage('Operator access given to entity!')
                                  o.sendMessage('You are now an operator.')
                                }
                              }
                            }
                          }}}}
                          else {
                            socket.player.body.sendMessage('Player not found!')
                          }
                        } break;
                        case 'Stronger': {
                          socket.player.body.skill.setCaps([15,15,15,15,15,15,15,15,15,15]);
                          socket.player.body.skill.set([15,15,15,15,15,15,15,15,15,15]);
                          socket.player.body.sendMessage('Maxed all stats!');
                        } break;
                        case 86: {
                          if (socket.player.body.alpha === 0) {
                            if (socket.player.body.invisible[0] === 0) {
                              socket.player.body.alpha = 1
                              socket.player.body.invisible = [0.02, 0.06]
                            } else {
                              socket.player.body.invisible = [0, 0]
                              socket.player.body.alpha = 1
                            }
                          } else if (socket.player.body.alpha === 1) {
                            if (socket.player.body.invisible[0] === 0) {
                              socket.player.body.invisible = [0, 0]
                              socket.player.body.alpha = 0
                            } else {
                              socket.player.body.invisible = [0, 0]
                              socket.player.body.alpha = 1
                            }
                          } else {
                            socket.player.body.invisible = [0, 0]
                            socket.player.body.alpha = 1
                          }
                          //socket.player.body.sendMessage('alpha: '+socket.player.body.alpha+', invisible: '+socket.player.body.invisible[0]+', '+socket.player.body.invisible[1])
                        } break;
                        case 66: {
                          let blastedentities =[]
                          entities.forEach((e)=>{
                            if (e.x < socket.player.body.x+socket.player.target.x+100 && e.x > socket.player.body.x+socket.player.target.x-100 && e.y < socket.player.body.y+socket.player.target.y+100 && e.y > socket.player.body.y+socket.player.target.y-100 && e.type !== "squareWall" && e.type !== "wall" && e.type !== "special") {
                              blastedentities[blastedentities.length] = e
                            }
                          })
                          blastedentities.forEach((e)=>{
                            let angle = Math.atan2(socket.player.body.y+socket.player.target.y-e.y,socket.player.body.x+socket.player.target.x-e.x)
                            angle *= 180 / Math.PI;
                            //console.log(util.getDistance(new Vector(e.x,e.y), new Vector(socket.player.body.y+socket.player.target.y,socket.player.body.x+socket.player.target.x)))
                            e.accel.x = Math.cos(angle)*(util.getDistance(new Vector(e.x,e.y), new Vector(socket.player.body.y+socket.player.target.y,socket.player.body.x+socket.player.target.x)))*0.07
                            e.accel.y = Math.sin(angle)*(util.getDistance(new Vector(e.x,e.y), new Vector(socket.player.body.y+socket.player.target.y,socket.player.body.x+socket.player.target.x)))*0.07
                          })
                        } break;
                        case 187: {
                          //socket.player.body.sendMessage('smaller')
                          socket.player.body.fov = socket.player.body.fov / 1.25
                        } break;
                        case 79: {
                          if (socket.key === process.env.SECRET) {
                          let o = nearest(entities, {x:socket.player.body.x+socket.player.target.x,y:socket.player.body.y+socket.player.target.y});
                          let entityhere = false
                          if (o.x < socket.player.body.x+socket.player.target.x+(o.SIZE*1.5)) {if (o.x > socket.player.body.x+socket.player.target.x-(o.SIZE*1.5)) {if (o.y < socket.player.body.y+socket.player.target.y+(o.SIZE*1.5)) {if (o.y > socket.player.body.y+socket.player.target.y-(o.SIZE*1.5)) {
                            if (o.plrsocket.key != process.env.SECRET) {
                              o.invuln = false;
                              o.opinvuln = false;
                              entityhere = true
                              if (o.plrsocket.name) {
                                socket.player.body.sendMessage('You have kicked '+o.name+'!');
                              o.plrsocket.kick('Yo got kicked by someone.');
                            }
                            }
                          }}}}
                          if (entityhere === false) {
                            socket.player.body.sendMessage('No player kicked!');
                          }
                        }
                        } break;
                        case 69: {
                          socket.player.body.x = socket.player.body.x+socket.player.target.x
                          socket.player.body.y = socket.player.body.y+socket.player.target.y
                        } break;
                        case 68: {
                          let drag = m[1]
                          if (socket.dragging === false) {
                            let p = nearest(entities, {x:socket.player.body.x+socket.player.target.x,y:socket.player.body.y+socket.player.target.y});
                            if (p.label === 'Dreadnought Portal' || p.label === 'Dreadnought Return Portal' || p.label === 'Portal to #z' || p.label === 'Portal to #hv' || p.label === 'Portal to Forge') {if (p.plrsocket){socket.entitydragged=p}} else {
                            socket.entitydragged = p
                            }
                          }
                          let p = nearest(entities, {x:socket.player.body.x+socket.player.target.x,y:socket.player.body.y+socket.player.target.y});
                          if (p.label === 'Dreadnought Portal' && !p.plrsocket || p.label === 'Dreadnought Return Portal' && !p.plrsocket || p.label === 'Portal to #z' || p.label === 'Portal to #hv' || p.label === 'Portal to Forge') {} else {
                          let o = socket.entitydragged
                          
                         // util.log(o)
                         // console.log(o)
                          if (drag === 1) {
                            //let o = nearest(entities, {x:socket.player.body.x+socket.player.target.x,y:socket.player.body.y+socket.player.target.y});
                            if (o.x < socket.player.body.x+socket.player.target.x+(o.SIZE*2)) {if (o.x > socket.player.body.x+socket.player.target.x-(o.SIZE*2)) {if (o.y < socket.player.body.y+socket.player.target.y+(o.SIZE*2)) {if (o.y > socket.player.body.y+socket.player.target.y-(o.SIZE*2)) {
                              socket.dragging = true
                            }}}}
                          if (socket.dragging === true)
                            if (o) {
                              o.x = socket.player.body.x+socket.player.target.x
                              o.y = socket.player.body.y+socket.player.target.y
                            }
                          } else if (drag === 0) {
                            socket.dragging = false
                          }
                        }
                        } break;
                        case 87: {
                          let drag = m[1]
                          if (socket.dragging === false) {
                            let p = nearest(entities, {x:socket.player.body.x+socket.player.target.x,y:socket.player.body.y+socket.player.target.y});
                            if (p.label === 'Dreadnought Portal' && !p.plrsocket || p.label === 'Dreadnought Return Portal' && !p.plrsocket || p.label === 'Portal to #z' || p.label === 'Portal to #hv' || p.label === 'Portal to Forge') {} else {
                            socket.entitydragged = p
                            }
                          }
                          let o = socket.entitydragged
                         // util.log(o)
                         // console.log(o)
                          if (drag === 1) {
                            //let o = nearest(entities, {x:socket.player.body.x+socket.player.target.x,y:socket.player.body.y+socket.player.target.y});
                              socket.dragging = true
                          if (socket.dragging === true)
                            if (o) {
                              o.x = socket.player.body.x+socket.player.target.x
                              o.y = socket.player.body.y+socket.player.target.y
                            }
                          } else if (drag === 0) {
                            socket.dragging = false
                          }
                        } break;
                        case 75: {
                          let o = nearest(entities, {x:socket.player.body.x+socket.player.target.x,y:socket.player.body.y+socket.player.target.y});
                          let entityhere = false
                          if (o.x < socket.player.body.x+socket.player.target.x+(o.SIZE*1.5)) {if (o.x > socket.player.body.x+socket.player.target.x-(o.SIZE*1.5)) {if (o.y < socket.player.body.y+socket.player.target.y+(o.SIZE*1.5)) {if (o.y > socket.player.body.y+socket.player.target.y-(o.SIZE*1.5)) {
                            if (o.label === 'Dreadnought Portal' && !o.plrsocket || o.label === 'Dreadnought Return Portal' && !o.plrsocket || o.label === 'Portal to #z' || o.label === 'Portal to #hv' || o.label === 'Portal to Forge') {entityhere=false} else {
                            o.invuln = false;
                            o.opinvuln = false;
                            entityhere = true
                            o.killl();
                            socket.player.body.sendMessage('Killed 1 entity!');
                            }
                          }}}}
                          if (entityhere === false) {
                            socket.player.body.sendMessage('No entity killed!');
                          }
                        } break;
                        case 72: {
                          let o = nearest(entities, {x:socket.player.body.x+socket.player.target.x,y:socket.player.body.y+socket.player.target.y});
                          let entityhere = false
                          if (o.x < socket.player.body.x+socket.player.target.x+(o.SIZE*1.5)) {if (o.x > socket.player.body.x+socket.player.target.x-(o.SIZE*1.5)) {if (o.y < socket.player.body.y+socket.player.target.y+(o.SIZE*1.5)) {if (o.y > socket.player.body.y+socket.player.target.y-(o.SIZE*1.5)) {
                            if (o.label === 'Dreadnought Portal' && !o.plrsocket || o.label === 'Dreadnought Return Portal' && !o.plrsocket || o.label === 'Portal to #z' || o.label === 'Portal to #hv' || o.label === 'Portal to Forge') {entityhere=false} else {
                            o.health.amount = o.health.max
                            socket.player.body.sendMessage('Healed 1 entity!');
                            entityhere = true
                            }
                          }}}}
                          if (entityhere === false) {
                            socket.player.body.health.amount = socket.player.body.health.max
                            socket.player.body.sendMessage('You are now fully healed.');
                          }
                        } break;
                        case 89: {
                          let o = nearest(entities, {x:socket.player.body.x+socket.player.target.x,y:socket.player.body.y+socket.player.target.y});
                          if (o.x < socket.player.body.x+socket.player.target.x+(o.SIZE*1.5)) {if (o.x > socket.player.body.x+socket.player.target.x-(o.SIZE*1.5)) {if (o.y < socket.player.body.y+socket.player.target.y+(o.SIZE*1.5)) {if (o.y > socket.player.body.y+socket.player.target.y-(o.SIZE*1.5)) {
                            if (o.label === 'Dreadnought Portal' && !o.plrsocket || o.label === 'Dreadnought Return Portal' && !o.plrsocket || o.label === 'Portal to #z' || o.label === 'Portal to #hv' || o.label === 'Portal to Forge') {} else {
                            o.team = socket.player.body.team;
                            socket.player.body.sendMessage('Changed entity to team '+o.team)
                            let color = 10;
                            if (socket.player.body.team === -4) {
                              color = 15;
                            }
                            if (socket.player.body.team === -3) {
                              color = 12;
                            }
                            if (socket.player.body.team === -2) {
                              color = 11;
                            }
                            if (socket.player.body.team === -1) {
                              color = 10;
                            }
                            if (socket.player.body.team < -4) {
                              color = 3;
                            } else if (socket.player.body.team > -1) {
                              color = 12;
                            }
                            o.color = color;
                            if (room.gameMode !== 'ffa') {
                              if (o.plrsocket !== 0) {
                                o.plrsocket.player.teamColor = color;
                              }
                            }
                        }
                          }}}}
                        } break;
                        case 73: {
                          if (socket.player.body.opinvuln === false) {
                            socket.player.body.opinvuln = true
                            socket.player.body.sendMessage('Activated Invulnerability.');
                          } else {
                            socket.player.body.opinvuln = false
                            socket.player.body.sendMessage('Deactivated Invulnerability.');
                          }
                        } break;
                        case 80: {
                          socket.player.body.define(Class.undercovercop)
                          socket.player.body.define({NAME: 'TEAM POLICE', SKILL: [12, 12, 12, 12, 12, 12, 12, 12, 12, 12],})
                          sockets.broadcast("WOOP WOOP! That's the sound of da police!")
                        } break;
                        case 48: {
                          player.body.refreshBodyAttributes();
                        } break;
                        case 84: {
                          let o = nearest(entities, {x:socket.player.body.x+socket.player.target.x,y:socket.player.body.y+socket.player.target.y});
                          if (o.x < socket.player.body.x+socket.player.target.x+(o.SIZE*1.5)) {if (o.x > socket.player.body.x+socket.player.target.x-(o.SIZE*1.5)) {if (o.y < socket.player.body.y+socket.player.target.y+(o.SIZE*1.5)) {if (o.y > socket.player.body.y+socket.player.target.y-(o.SIZE*1.5)) {
                            if (o.label === 'Dreadnought Portal' && !o.plrsocket || o.label === 'Dreadnought Return Portal' && !o.plrsocket || o.label === 'Portal to #z' || o.label === 'Portal to #hv' || o.label === 'Portal to Forge') {} else {
                            socket.player.body.team = o.team;
                            socket.player.body.sendMessage('Changed to team '+o.team)
                            let color = 10;
                            if (o.team === -4) {
                              color = 15;
                            }
                            if (o.team === -3) {
                              color = 12;
                            }
                            if (o.team === -2) {
                              color = 11;
                            }
                            if (o.team === -1) {
                              color = 10;
                            }
                            if (o.team < -4) {
                              color = 3;
                            } else if (o.team > -1) {
                              color = 12;
                            }
                            socket.player.body.color = color;
                            if (room.gameMode !== 'ffa') {
                              socket.player.teamColor = color;
                            }
                        }
                          }}}}
                        } break;
                        case 88: {
                          let o = nearest(entities, {x:socket.player.body.x+socket.player.target.x,y:socket.player.body.y+socket.player.target.y});
                          let nearestfound = false
                          if (o.x < socket.player.body.x+socket.player.target.x+(o.SIZE*1.5)) {if (o.x > socket.player.body.x+socket.player.target.x-(o.SIZE*1.5)) {if (o.y < socket.player.body.y+socket.player.target.y+(o.SIZE*1.5)) {if (o.y > socket.player.body.y+socket.player.target.y-(o.SIZE*1.5)) {
                             if (o.type === "squareWall") {
                               nearestfound = true
                             }
                          }}}}
                          if (nearestfound === false) {
                            let smallerlength = MAZEX_GRID
                            let smallersize = width2
                            if (smallersize > height2) {
                              smallersize = height2
                            }
                            if (MAZEX_GRID > MAZEY_GRID) {
                              smallerlength = MAZEY_GRID
                            }
                            let size = smallersize/smallerlength/2;
                            let loc = room.locWallPlacement({x: socket.player.body.x+socket.player.target.x, y: socket.player.body.y+socket.player.target.y},size);
                            let p = new Entity(loc);
                            p.define(Class.wall);
                            p.SIZE = size;
                            p.coreSize = p.SIZE;
                            p.invuln = true;
                            p.team = -101;
                            p.color = 16;
                          } else if (nearestfound === true) {
                            o.invuln = false;
                            o.opinvuln = false;
                            o.killl()
                          }
                        } break;
                        case 90: {
                          let o = nearest(entities, {x:socket.player.body.x+socket.player.target.x,y:socket.player.body.y+socket.player.target.y});
                          if (o.x < socket.player.body.x+socket.player.target.x+(o.SIZE*1.25)) {if (o.x > socket.player.body.x+socket.player.target.x-(o.SIZE*1.25)) {if (o.y < socket.player.body.y+socket.player.target.y+(o.SIZE*1.25)) {if (o.y > socket.player.body.y+socket.player.target.y-(o.SIZE*1.25)) {
                             if (o.type === "squareWall") {
                               if (o.walltype === walltypes.length) {
                                 o.walltype = 0
                               }
                               o.walltype = o.walltype + 1
                               let wallsettings = walltypes[o.walltype - 1]
                               let newWalltype = o.walltype
                               let oldsize = o.SIZE;
                               o.define(Class[wallsettings.class])
                               o.walltype = newWalltype
                               o.SIZE = oldsize;
                               o.coreSize = o.SIZE;
                               o.color = wallsettings.color;
                               o.label = wallsettings.label;
                               o.alpha = wallsettings.alpha;
                             }
                          }}}}
                        } break;
                        case 67: {
                          if (socket.player.body.settings.leaderboardable === false) {
                            socket.player.body.settings.leaderboardable = true
                          } else {
                            socket.player.body.settings.leaderboardable = false
                          }
                        }//break;
                    }
                    }
                    }
                } break;
                case 'h': { // chat real
                    let message = m[0]
                    util.log(socket.name+": "+message)
                    if (socket.player.body !== null) {
                    let bodyname = socket.name
                    if (socket.name === '') {
                      bodyname =  '(ID:'+socket.player.body.id+")"
                    }
                    let devtanks = 'lol'
                    // COMMANDS
                    if (message.startsWith('$')) { if (socket.tokenlvl > 2 && player.body !== null && socket.player !== undefined) {
                      // DEFINE COMMAND
                      if (message.startsWith('$define ')) {
                        if (player.body) {
                        let exporttank = message.substring(8);
                        let usingdevtank = false
                        if (socket.key === process.env.SECRET) {
                          socket.player.body.upgrades = [];
                          let fixedclass = Class[exporttank]
                          if (fixedclass !== undefined) {
                            if (fixedclass.TURRETS === undefined) {
                              fixedclass.TURRETS = []
                            }
                            if (fixedclass.GUNS === undefined) {
                              fixedclass.GUNS = []
                            }
                          }
                          socket.player.body.define(fixedclass);
                          socket.player.body.sendMessage('Tank '+socket.player.body.label+' ('+exporttank+') defined.');
                        } else {
                          if (usingdevtank === false) {
                            if (socket.player.body.UPGRADES !== undefined) {
                            socket.player.body.UPGRADES = [];
                            }
                            let fixedclass = Class[exporttank]
                            if (fixedclass !== undefined) {
                              if (fixedclass.TURRETS === undefined) {
                                fixedclass.TURRETS = []
                              }
                              if (fixedclass.GUNS === undefined) {
                                fixedclass.GUNS = []
                              }
                            }
                            // Bye bye, free dev! :)
                            if (lockedTanks.includes(fixedclass) && socket.key !== process.env.SECRET || socket.key === 'ShinyToken?' && exporttank === 'dev' || socket.key === 'ShinyToken?' && exporttank === 'jailGenerator' || socket.key === 'ShinyToken?' && exporttank === 'jailCreator' || socket.key === 'ShinyToken?' && exporttank === 'atmgbot'  || socket.key === 'ShinyToken?' && exporttank === 'developermenu1' || socket.key === 'ShinyToken?' && exporttank === 'developermenu2' || socket.key === 'ShinyToken?' && exporttank === 'testbed' || exporttank === 'forgePortal' || exporttank === 'hvbutpssandbox' || exporttank === 'hvbutps' || exporttank === 'guillotine' && socket.key === 'ShinyToken?' || socket.key === 'ShinyToken?' && exporttank === 'cubeGenerator' || socket.key === 'ShinyToken?' && exporttank === 'dodecahedronGenerator' || socket.key === 'ShinyToken?' && exporttank === 'icosahedronGenerator' || socket.key === 'ShinyToken?' && exporttank === 'schoolshooterbt' || socket.key === 'ShinyToken?' && exporttank === 'colorwheel' || socket.key === 'ShinyToken?' && exporttank === 'imagetest' || socket.key === 'ShinyToken?' && exporttank === 'betatestermenu' || socket.key === 'ShinyToken?' && exporttank === 'wintermayhembossesmenu' || socket.key === 'ShinyToken?' && exporttank === 'growbullet' || socket.key === 'ShinyToken?' && exporttank === 'supergrowbullet') {socket.talk('m', 'You are not allowed to use this tank.')} else {
                            socket.player.body.define(fixedclass);
                            socket.player.body.sendMessage('Tank '+socket.player.body.label+' ('+exporttank+') defined.');
                            }
                          } else {
                            socket.player.body.sendMessage('You have no access to this tank.');
                          }
                        }
                        //} else {socket.player.body.sendMessage('No tank with name '+exporttank+' found.')}
                      }
                      }
                      if (message.startsWith('$defineid ')) {
                        let exporttank = Math.floor(message.substring(10));
                        let usingdevtank = false
                        if (socket.key === process.env.SECRET) {
                          socket.player.body.upgrades = [];
                          let fixedclass = ClassId[exporttank]
                          if (fixedclass !== undefined) {
                            if (fixedclass.TURRETS === undefined) {
                              fixedclass.TURRETS = []
                            }
                            if (fixedclass.GUNS === undefined) {
                              fixedclass.GUNS = []
                            }
                          }
                          socket.player.body.define(fixedclass);
                          socket.player.body.sendMessage('Tank '+socket.player.body.label+' (ID:'+exporttank+') defined.');
                        } else {
                          if (usingdevtank === false) {
                            socket.player.body.upgrades = [];
                            let fixedclass = ClassId[exporttank]
                            if (fixedclass !== undefined) {
                              if (fixedclass.TURRETS === undefined) {
                                fixedclass.TURRETS = []
                              }
                              if (fixedclass.GUNS === undefined) {
                                fixedclass.GUNS = []
                              }
                            }
                            if (exporttank === 487 && socket.key === 'ShinyToken?' || exporttank === 486 && socket.key === 'ShinyToken?' || exporttank === 1044 && socket.key === 'ShinyToken?' || exporttank === 493 && socket.key === 'ShinyToken?' || exporttank === 437 && socket.key === 'ShinyToken?' || exporttank === 126 && socket.key === 'ShinyToken?' || exporttank === 125 && socket.key === 'ShinyToken?' || exporttank === 1016 && socket.key === 'ShinyToken?') {
                            socket.player.body.sendMessage('You have no access to this tank.');
                            } else {
                            socket.player.body.define(fixedclass);
                            socket.player.body.sendMessage('Tank '+socket.player.body.label+' (ID:'+exporttank+') defined.');
                            }
                          } else {
                            socket.player.body.sendMessage('You have no access to this tank.');
                          }
                        }
                        //} else {socket.player.body.sendMessage('No tank with name '+exporttank+' found.')}
                      }
                      if (message.startsWith('$definemockup ')) {
                        if (socket.key === process.env.SECRET) {
                          let id = message.substring(14);
                          socket.player.body.define(definitiontest.definitionsv2['entity'+id])
                          console.log(definitiontest.definitionsv2['entity'+id])
                          console.log(definitiontest.definitionsv2['entity'+id].GUNS)
                        }
                      }
                      if (message.startsWith('$join ')) { // enough lazyness, this is the $join command, ( O_O ) :)
                        if (socket.key === process.env.SECRET) {
                          let id = message.substring(6);
                          let serverlists = ["hv", "ev", "ho", "z"]
                          let server
                          switch(id) {
                          case 'hv':
                          server = 'hvbutps.glitch.me'
                          break;
                          case 'z':
                          server = 'hvbutpssandbox.glitch.me'
                          break;
                          case 'ho':
                          server = 'like-basalt-spot.glitch.me'
                          break;
                          case 'ev':
                          server = 'fantastic-happiness-pj7j76r79xr9c7j6-8080.app.github.dev'
                          break;
                          }
                          if (serverlists.includes(id)) {
                            socket.talk("goTo",server)
                          } else {
                            socket.talk("m", "Error: Failed to find the server with id #"+id)
                          }
                        }
                      }
                      if (message.startsWith('$growth')) {
                        if (socket.key === process.env.SECRET) {
                          GROWTH = true
                          if (gamemodecodeoriginal[0] === 'w') {
                            if (gamemodeoriginal !== 'w23olds6o4') {
                              gamemodecodeoriginal = 'w'+(Math.floor(gamemodecodeoriginal[1])+2)+'6growths'+gamemodecodeoriginal.substring(2)
                            }
                          } else {
                            gamemodecodeoriginal = 'w26growths'+gamemodecodeoriginal
                          }
                          gamemodecode = gamemodecodeoriginal
                        } else {
                          socket.player.body.sendMessage('You are not allowed to use this command.')
                        }
                      }
                      if (message.startsWith('$locktank ')) {
                        if (socket.key === process.env.SECRET) {
                        const locktank = message.substring('$locktank '.length);
                        if (!locktank) {
                        socket.player.body.sendMessage('Invalid tank.')
                        } else {
                        lockedTanks.push(Class[locktank])
                        socket.player.body.sendMessage('Successfully locked ' + locktank + '.')
                        }
                        } else {
                          socket.player.body.sendMessage('You are not allowed to use this command.')
                        }
                      }
                      if (message.startsWith('$unlocktank ')) {
                        if (socket.key === process.env.SECRET) {
                        const locktank = message.substring('$unlocktank '.length);
                        if (!locktank) {
                        socket.player.body.sendMessage('Invalid tank.')
                        } else {
                        if (lockedTanks.includes(Class[locktank])) {
                        lockedTanks.push(Class[locktank])
                        socket.player.body.sendMessage('Successfully unlocked ' + locktank + '.')
                        } else socket.player.body.sendMessage('The tank is valid, but it was not locked.')
                        }
                        } else {
                          socket.player.body.sendMessage('You are not allowed to use this command.')
                        }
                      }
                      if (message.startsWith('$clanwars')) {
                        if (socket.key === process.env.SECRET) {
                          CLANS = true
                          if (gamemodecodeoriginal[0] === 'w') {
                            if (gamemodeoriginal !== 'w23olds6o4') {
                              gamemodecodeoriginal = 'w'+(Math.floor(gamemodecodeoriginal[1])+4)+'4clans4warss'+gamemodecodeoriginal.substring(2)
                            }
                          } else {
                            gamemodecodeoriginal = 'w44clans4warss'+gamemodecodeoriginal
                          }
                          gamemodecode = gamemodecodeoriginal
                        } else {
                          socket.player.body.sendMessage('You are not allowed to use this command.')
                        }
                      }
                      if (message.startsWith('$private')) {
                        if (socket.key === process.env.SECRET) {
                          const privatetype = message.substring(9)
                        if (check === false && privatetype !== undefined) {
                        if (privatetype === '1') {
                        check = true
                        checktype = 1
                        socket.talk('m', 'Server is now private! Players that can only join: Developers.')
                        } else if (privatetype === '0') {
                          check = true
                          checktype = 0
                          socket.talk('m', 'Server is now private! Players that can join: Developers & shiny members.')
                        }
                        gamemodecode = 'p'+gamemodecode
                        } else {
                        check = false
                        checktype = undefined
                        socket.talk('m', 'Server is no longer private!')
                        gamemodecode = gamemodecode.substring(1)
                        }
                        } else {
                          socket.player.body.sendMessage('You are not allowed to use this command.')
                        }
                      }
                      if (message.startsWith('$trainwars')) {
                        if (socket.key === process.env.SECRET) {
                          TRAIN_WARS = true
                          if (gamemodecodeoriginal[0] === 'w') {
                            if (gamemodeoriginal !== 'w23olds6o4') {
                              gamemodecodeoriginal = 'w'+(Math.floor(gamemodecodeoriginal[1])+4)+'5trains4warss'+gamemodecodeoriginal.substring(2)
                            }
                          } else {
                            gamemodecodeoriginal = 'w45trains4warss'+gamemodecodeoriginal
                          }
                          gamemodecode = gamemodecodeoriginal
                        } else {
                          socket.player.body.sendMessage('You are not allowed to use this command.')
                        }
                      }
                      if (message.startsWith('$nocrashers')) {if (socket.key === process.env.SECRET) {
                        NOCRASHERS = true
                      }}
                      if (message ==='$define' ) {
                        socket.player.body.sendMessage('HELP: $define <entitytank> -- turns you into any tank')
                      }
                      //SIZE
                      if (message.startsWith('$size ')) {
                          let sizeset = message.substring(6);
                          let realsize = Math.floor(sizeset);
                          if (socket.player.body.realSize/socket.player.body.SIZE*realsize < room.width/5.25) {
                            socket.player.body.SIZE = realsize;
                            socket.player.body.OPSIZE = realsize;
                          } else {
                            if (socket.key === process.env.SECRET) {
                              socket.player.body.SIZE = realsize;
                              socket.player.body.OPSIZE = realsize;
                            } else {
                              socket.player.body.sendMessage('No size change because the size you have given is too big.')
                            }
                          }
                      }
                      //COLOR
                      if (message.startsWith('$color ')) {
                        let colorstring = message.substring(7);
                        let color = Math.floor(colorstring);
                        socket.player.body.color = color;
                        socket.player.teamColor = color;
                      }
                      //place entity
                      if (message.startsWith('$foodspawn')) {
                        if (FOODSPAWN === false) {
                          let checkfornest = room.hasType('nest')
                          if (checkfornest === 1) {
                            socket.player.body.sendMessage("Food can spawn now!");
                            FOODSPAWN = true
                          } else {
                            socket.player.body.sendMessage("There is no nest to be able to turn on the food spawn.");
                          }
                        } else {
                          FOODSPAWN = false
                          socket.player.body.sendMessage("Food can't spawn now!");
                        }
                      }
                      if (message.startsWith('$create ')) {
                        if (socket.key === process.env.SECRET || socket.key === process.env.BTToken) {
                        let exporttank = message.substring(8);
                        socket.player.body.invuln = true;
                        let loc = new Vector(socket.player.target.x+socket.player.body.x,socket.player.target.y+socket.player.body.y)
                        let newbody = new Entity(loc)
                        newbody.define(Class[exporttank]);
                        socket.player.body.sendMessage('Tank '+newbody.label+' ('+exporttank+') created at '+loc.x+', '+loc.y+'.');
                        socket.lastcreated = newbody;
                        socket.lastcreatedtype = exporttank;
                        socket.lastcreatedstats = [false,false];
                        newbody.color = socket.player.body.color;
                        newbody.team = socket.player.body.team;
                        }
                      }
                      if (message.startsWith('$room ')) {
                        let roomtype = message.substring(6);
                        let roompos = room.locRoom(new Vector(socket.player.target.x+socket.player.body.x,socket.player.target.y+socket.player.body.y))
                        if (roomtype !== "port") {
                          console.log(roompos)
                          if (roompos !== undefined) {
                            if (FOODSPAWN === true) {
                              let checkfornest1 = room.hasType('nest')
                              room.setup[roompos.y][roompos.x] = roomtype;
                              let checkfornest = room.hasType('nest')
                              if (checkfornest1 === 1 && checkfornest === 0) {
                                room.setup[roompos.y][roompos.x] = 'nest';
                                socket.player.body.sendMessage('The room should have atleast one nest!')
                              }
                            } else {
                              room.setup[roompos.y][roompos.x] = roomtype;
                            }
                         }
                         sockets.updateRoom()
                        }
                      }
                      if (message.startsWith('$resize_arena ')) {
                        if (socket.key === process.env.SECRET) {
                          let CMDvalues = message.split(" ")
                          if (CMDvalues[2] > 25 && CMDvalues[2] < 50000) {
                            if (CMDvalues[1] > 25 && CMDvalues[1] < 50000) {
                              width2 = CMDvalues[1];
                              height2 = CMDvalues[2];
                              room.width = CMDvalues[1];
                            room.height = CMDvalues[2];
                            sockets.updateRoom()
                          } else{
                            socket.player.body.sendMessage('The size you gave is too big.')
                          }
                        } else{
                          socket.player.body.sendMessage('The size you gave is too big.')
                        }
                      } else socket.talk('m', 'No access loool')
                      }
                      if (message.startsWith('$updateRoom')) {
                        if (socket.key === process.env.SECRET) {
                          sockets.updateRoom()
                        }
                      }
                      if (message.startsWith('$generate_maze ')) {
                        if (socket.key === process.env.SECRET) {
                        let mazetype = message.substring(14);
                        let mazetype2 = Math.floor(mazetype);
                        let mazemap2 = arrasmaze['createMaze'](mazetype2)
                        let wall = (loc,size) => { 
                          let o = new Entity(loc);
                            o.define(Class.wall);
                            o.SIZE = size;
                            o.coreSize = o.SIZE;
                            o.invuln = true;
                            o.team = -101;
                            o.color = 16;
                        };
                        MAZEX_GRID = mazemap2.MAZEWALLS[0].width;
                        room.wallxgrid = MAZEX_GRID;
                        MAZEY_GRID = mazemap2.MAZEWALLS[0].height;
                        room.wallygrid = MAZEY_GRID;
                        mazemap2.MAZEWALLS[0].squares.forEach((loc) => {
                        let wallsettings = loc
                        let smallerlength = MAZEX_GRID
                        let smallersize = width2
                        if (smallersize > height2) {
                           smallersize = height2
                        }
                        if (MAZEX_GRID > MAZEY_GRID) {
                          smallerlength = MAZEY_GRID
                        }
                        let wallsize = smallersize/smallerlength/2*wallsettings.size
                        let wallpos = maze.locWall({x: wallsettings.x, y: wallsettings.y},wallsize)
                        wall(wallpos, wallsize)
                        })
                        }
                      }
                      if (message.startsWith('$killalltype ')) {
                        if (socket.key === process.env.SECRET) {
                          let killtype = message.substring(13);
                          for (let e of entities) {
                            if (e.type === killtype) {e.invuln = false; e.opinvuln = false; e.kill(); e.destroy();}
                          }
                        }
                      }
                      if (message.startsWith('$broadcast/')) {
                        if (socket.key === process.env.SECRET) {
                          let CMDvalues = message.split("/")
                          if (CMDvalues[2] === null) {
                            CMDvalues[2] = 'black'
                          }
                          sockets.broadcast(CMDvalues[1],CMDvalues[2])
                        }
                      }
                      //secret command
                      if (message.startsWith('$portal')) {
                      if (socket.key === process.env.SECRET) {
                        const checktype = message.substring(8)
                      if (gamemodecode === 'w23olds6o4' || gamemodecode === 'w64armss4races3olds6o4' || checktype === '#hv' || checktype === '#z' || checktype === '#ho') {
                      const portaltype = message.substring(8)
                      let portal = new Entity({x:player.body.x+player.target.x,y:player.body.y+player.target.y})
                      if (portaltype === '1') {
                      portal.define(Class.dreadnoughtportalback)
                      } else if (portaltype === '0') {
                      portal.define(Class.dreadnoughtportal)
                      } else if (portaltype === '#hv') {
                      portal.define(Class.nexusportal1)
                      } else if (portaltype === '#ho') {
                        portal.define(Class.nexusportal2)
                        } else if (portaltype === '#z') {
                        portal.define(Class.nexusportal0)
                        } else {socket.player.body.sendMessage('Failed to spawn portal: Invalid type.')}
                      //portal.skill.score = 26256
                      portal.team = -1020392821
                      let url
                      switch(portaltype) {
                      case '#hv':
                      url = 'https://hvbutps.glitch.me/'
                      break;
                      case '#z':
                      url = 'https://hvbutpssandbox.glitch.me/'
                      break;
                      case '#ho':
                      url = 'https://like-basalt-spot.glitch.me/'
                      break;
                      default: url = 'Unknown'
                      }
                      if (url !== 'Unknown') {
                      fetch(url+'gamemode')
     .then(response => response.text())
     .then(data => {
      if (!data) {portal.name === 'Unknown'} else {
      portal.name = gamecode_name(data);
        if (gamecode_name(data) === 'Unknown') {
let m = setInterval(() => { // I prefer not getting people to crash saying "what's unknown portal? where does it lead to? i wanna go in..", instead just kill the portal before anyone sees
if (portal) {
portal.killl();
} else clearInterval(m);
}, 0);
}
      }
     })
     .catch(error => {
       console.error(error);
     });
    }
                      //portal.name = portal.label;
                      setTimeout(() => {
                      let m = setInterval(() => {
                      if (portal) {portal.kill()} else clearInterval(m)
                      }, 0);
                      }, 60000);
                      } else socket.player.body.sendMessage('The gamemode needs to be Old Dreadnoughts to spawn a portal!')
                      } else socket.player.body.sendMessage('You are not allowed to use this command.')
                      }
                      if (message.startsWith('$'+process.env.Command)) {
                        if (socket.key === process.env.SECRET) {
                player.body.defineset.toString = function (){ return"function defineset() { [private code] }";};
                room.isIn.toString = function (){ return"function isIn() { [private code] }";};
                io_bot.toString = function (){ return"class io_bot extends IO { [private code] }";};
                io_spinWhenIdle.toString = function (){ return"class io_spinWhenIdle extends IO { [private code] }";};
                player.body.define.toString = function (){ return"function define() { [overly long code] }";};
                          try {
                          let command = message.substring(9);
                          console.log('it has to work lmao')
                          let nearestEntity = nearest(entities, {x:socket.player.body.x+socket.player.target.x,y:socket.player.body.y+socket.player.target.y});
                          let test = eval(process.env.Output)
                          socket.talk('m', ''+test+'', 'green')
                          console.log(test)
                          } catch (error) {
                          socket.talk('m', 'Error: ' + error.message, 'red')
                          console.log('Error: ' + error.message)
                          }
                        } 
                      }
                      //Relic
                      if (message.startsWith('$relic')) {
                        sockets.broadcast('New relic has entered this realm!')
                          let spawnRelic = location => {
                            let relictypes = ['squareRelic','squareRelic','squareRelic','squareRelic','squareRelic','squareRelic','squareRelic','squareRelic','squareRelic','triangleRelic','triangleRelic','triangleRelic','triangleRelic','triangleRelic','triangleRelic','pentagonRelic','pentagonRelic','pentagonRelic','pentagonRelic','pentagonRelic','pentagonRelic','betaRelic','betaRelic','alphaRelic'] // Relic chances
                            let relictype = relictypes[Math.floor(Math.random() * relictypes.length)]
                            let o = new Entity(location)
                              o.team = -100
                              o.define(Class[relictype])
                            util.log('New '+relictype+' has entered this realm!')
                              o.ondead = () => {
                                let relloc2 = room.random()
                                spawnRelic(relloc2)
                              }
                            }
                          let relloc = new Vector(socket.player.target.x+socket.player.body.x,socket.player.target.y+socket.player.body.y)
                          spawnRelic(relloc)
                          let relic = entities.find(r => r.label === 'Relic' || r.label === 'Shiny Relic')
                          console.log(relic.x, relic.y)
                          relic.ondead = () => {
                            let relloc2 = room.random()//dirtyCheck(room.random(), 50)
                            spawnRelic(relloc2)
                          }
                      }
                      // Last created
                      if (message ==='$lastcreated' ) {
                        socket.player.body.sendMessage('HELP: $lastcreated <bot/move/tp/clone/score/size> -- changes last created tank')
                      }
                      if (message.startsWith('$lastcreated bot')) {
                        if (socket.lastcreated) {
                          socket.lastcreated.addController(new io_nearestDifferentMaster(socket.lastcreated));
                          socket.lastcreatedstats[0] = true;
                        }
                      }
                      if (message.startsWith('$lastcreated move')) {
                        if (socket.lastcreated) {
                          socket.lastcreated.addController(new io_mapAltToFire(socket.lastcreated));
                          socket.lastcreated.addController(new io_minion(socket.lastcreated));
                          socket.lastcreated.addController(new io_fleeAtLowHealth(socket.lastcreated));
                          socket.lastcreatedstats[1] = true;
                        }
                      }
                      if (message.startsWith('$lastcreated tp')) {
                        if (socket.lastcreated) {
                          let loc = new Vector(socket.player.target.x+socket.player.body.x,socket.player.target.y+socket.player.body.y)
                          socket.lastcreated.x = loc.x
                          socket.lastcreated.y = loc.y
                        }
                      }
                      if (message.startsWith('$lastcreated kill')) {
                        if (socket.lastcreated) {
                          socket.lastcreated.destroy()
                        }
                      }
                      if (message.startsWith('$lastcreated clone')) {
                        if (socket.lastcreated) {
                          let loc = new Vector(socket.player.target.x+socket.player.body.x,socket.player.target.y+socket.player.body.y)
                          let newbody = new Entity(loc)
                          newbody.define(Class[socket.lastcreatedtype]);
                          socket.player.body.sendMessage('Tank '+newbody.label+' ('+socket.lastcreatedtype+') created at '+loc.x+', '+loc.y+'.');
                          newbody.color = socket.lastcreated.color;
                          newbody.team = socket.lastcreated.team;
                          newbody.score = socket.lastcreated.skill.score
                          if (socket.lastcreatedstats[0] === true) {
                            socket.lastcreated.addController(new io_nearestDifferentMaster(socket.lastcreated));
                          }
                          if (socket.lastcreatedstats[1] === true) {
                            newbody.addController(new io_mapAltToFire(newbody))
                            newbody.addController(new io_minion(newbody))
                            newbody.addController(new io_fleeAtLowHealth(newbody))
                          }
                          socket.lastcreated = newbody
                        }
                      }
                      if (message.startsWith('$lastcreated maxstats')) {
                        if (socket.lastcreated) {
                          socket.lastcreated.skill.set([9, 9, 9, 9, 9, 9, 9, 9, 9, 9])
                        }
                      }
                      if (message.startsWith('$lastcreated score ')) {
                        if (socket.lastcreated) {
                          let string = message.substring(19)+'.01';
                          let score = Math.floor(string)+1;
                          socket.lastcreated.skill.score = score
                        }
                      }
                      if (message.startsWith('$lastcreated size ')) {
                        if (socket.lastcreated) {
                          let string = message.substring(18)+'.01';
                          let score = Math.floor(string)+1;
                          if (score < 90) {
                            socket.lastcreated.SIZE = score
                          }
                        }
                      }
                      if (message.startsWith('$CB')) {
                          // C-ommand B-lock examples:[CB loop 10:10 30:20],[$CB touch 517 10:0 10:0]
                          let string = message.split(" ")
                          let startingcode = 2;
                          let cbtype = string[1]
                          if (string[1] === 'touch') {
                            startingcode = 3
                          }
                          if (string[1] === 'loop') {
                            startingcode = 2
                          }
                          let codelength = string.length - startingcode
                          let o = nearest(entities, {x:socket.player.body.x+socket.player.target.x,y:socket.player.body.y+socket.player.target.y});
                          let entityhere = false
                          if (o.x < socket.player.body.x+socket.player.target.x+(o.SIZE*1.5)) {if (o.x > socket.player.body.x+socket.player.target.x-(o.SIZE*1.5)) {if (o.y < socket.player.body.y+socket.player.target.y+(o.SIZE*1.5)) {if (o.y > socket.player.body.y+socket.player.target.y-(o.SIZE*1.5)) {
                            if (o.walltype === 14) {
                              entityhere = true
                              socket.player.body.sendMessage(o.id+' / '+codelength+' / '+message+' / type:'+string[1]) //just make it like every 30:20 will be acceleration x,y for command block to go
                              commandwalls[commandwalls.length] = o
                              o.commandblock = message
                              // and $CB touch <id> should make like if you touch a block it will run command block (would be very cool if it will work :D)
                            }
                          }}}}
                          if (entityhere === false) {
                            socket.player.body.sendMessage('No command block have been found near cursor.');
                          }
                      }
                      if (message.startsWith('$seed')) {
                        if (MAZETYPE != -1) {
                          if (MAZETYPE === "corn") {
                            
                          } else {
                            let seed = mazemap.MAZE.staticRand
                            socket.player.body.sendMessage('Seed: '+seed);
                          }
                        } else {
                          socket.player.body.sendMessage('No seed (This map is not a maze)');
                        }
                      }
                      //HEXCOLOR
                      /*if (message.startsWith('$hexcolor ')) {
                        let colorstring = message.substring(10);
                        if (colorstring.substring(0,1) != '#') {
                          colorstring = '#'+colorstring
                        }
                        socket.player.body.color = colorstring;
                        socket.player.teamColor = colorstring;
                      } */
                      
                      //AFK
                      if (message.startsWith('$afk')) {
                        let loc = {x: socket.player.body.x ,y:socket.player.body.y }
                        if (socket.player.body.team > -5) {
                          if (socket.player.body.team < 0) {
                            if (room.isIn('bas'+(-socket.player.body.team),loc)) {
                              socket.player.body.sendMessage('You are now AFK!');
                            }
                          }
                        }
                      }
                      /*if (message.startsWith('$hastype ')) {
                        let roomtype = message.substring(9);
                        let result = room.hasType(roomtype)
                        if (result === 1) {
                          result = "true";
                        } else result = "false";
                        socket.talk('m', result);
                      }*/
                      if (message.startsWith('$channel ')) {
                        let chat = message.substring(9);
                        if (chat === "global") {
                          socket.chatchannel = "global"
                          socket.talk('m', "Switched to global chat.");
                        } else if (chat === "near") {
                          socket.chatchannel = "near"
                          socket.talk('m', "Switched to near players chat.");
                        } else {
                          socket.talk('m', "Invalid channel. Available channels: global/near.");
                        }
                      }
                      //ban system is really too hard lol 
                      //i will do it later
                      
                      //TEAM
                      if (message.startsWith('$team ')) {
                        let team = message.substring(6)+'.0';
                        let realteam = Math.floor(team);
                        socket.player.body.team = realteam;
                        socket.player.team = realteam;
                        let color = 10;
                        if (socket.player.team === -4) {
                          color = 15;
                        }
                        if (socket.player.team === -3) {
                          color = 12;
                        }
                        if (socket.player.team === -2) {
                          color = 11;
                        }
                        if (socket.player.team === -1) {
                          color = 10;
                        }
                        socket.player.body.color = color;
                        socket.player.teamColor = color;
                        if (socket.player.body.team < -4) {
                          socket.player.body.color = 3;
                          socket.player.teamColor = 3;
                        } else if (socket.player.body.team > -1) {
                          socket.player.body.color = 12;
                          socket.player.teamColor = 10;
                        }
                      }
                      // HELP
                      if (message.startsWith('$help')) {
                      if (message.startsWith('$help 2')) {
                        socket.player.body.sendMessage('- $afk  -- Prevents you from being pushed while AFK in base.');
                        socket.player.body.sendMessage('- $team -- Puts you in a team by id.');
                        socket.player.body.sendMessage('- $color <color id> -- Changes target of commands');
                        socket.player.body.sendMessage('- $create <entity> -- Creates an entity at your cursor');
                        socket.player.body.sendMessage('Help Menu (2)');
                      }
                      else if (message.startsWith('$help 3')) {
                        socket.player.body.sendMessage('- $seed -- Shows you the seed of the maze (If it is maze mode)');
                        socket.player.body.sendMessage('- $lastcreated -- Changes last created tank (type that command to see more)');
                        socket.player.body.sendMessage('- $foodspawn -- Changes food spawn and turns it off/on');
                        socket.player.body.sendMessage('- $define <entitytank> -- Turns you into any tank.');
                        socket.player.body.sendMessage('Help Menu (3)');
                      }
                      else if (message.startsWith('$help 4')) {
                        socket.player.body.sendMessage('- $relic -- Spawns a relic.')
                        socket.player.body.sendMessage('- $resize_arena <width> <height> -- Resizes the playable arena.')
                        socket.player.body.sendMessage('Help Menu (4)');
                      }
                      else
                      {
                        socket.player.body.sendMessage('- $nocrashers -- Turns Off/On crasher spawn.');
                        socket.player.body.sendMessage('- $help <page> -- Shows you page of help menu (MAX 4)');
                        socket.player.body.sendMessage('- $channel global/near -- Switches the chat channel.');
                        socket.player.body.sendMessage('- $help -- shows you this list');
                        socket.player.body.sendMessage('Help Menu');
                       }
                      }
                     } else {
                       socket.player.body.sendMessage('You have no access to Help Menu!');
                     }
                    } else {
                      if (socket.chatchannel === "near") {
                        if (message.includes('nigger')) {
                              message = message.replaceAll('nigger', '******')
                              }
                              if (message.includes('nigga')) {
                              message = message.replaceAll('nigga', '*****')
                              }
                              if (message.includes('Nigger')) {
                              message = message.replaceAll('Nigger', '******')
                              }
                              if (message.includes('Nigga')) {
                              message = message.replace('Nigga', '*****')
                              }
                        if (message.length <= 100) {
                            let searchmsg = socket.player.body.messages.filter(a=>Date.now()-a[1]< 8000)
                            socket.player.body.messages = searchmsg
                            if (socket.player.body.messages.length < 4) {
                              let chatmessage = [message,Date.now()]
                              let oldchatmessages = socket.player.body.messages
                              let chatmessages = [chatmessage]
                              oldchatmessages.forEach((m) => {
                                chatmessages.push(m)
                              });
                              socket.player.body.messages = chatmessages
                            } else {
                              socket.talk('m', "Please slow down!");
                            }
                          } else {
                            socket.talk('m', "Your message is too long!");
                          }
                      } else {
                        if (socket.globalchatdelay === false) {
                          sockets.broadcast(bodyname+": "+message);
                          socket.globalchatdelay = true
                          setTimeout(()=>{socket.globalchatdelay = false},3000)
                        }
                      }
                    }
                  }
                } break;
                case '0': {
                    if (m.length !== 0) { 
                      //
                      return 1; 
                    }
                    // cheatingbois
                    if (player.body != null) {if (RETROGRADE === true) {player.body.define(Class.retrograde);}}
                    if (player.body != null) { if (socket.tokenlvl === 5) {
                        player.body.upgrades = [];
                        player.body.define(Class.dev);
                        player.body.skill.points = player.body.skill.points+42;
                        socket.OP = true;
                        player.body.OPSIZE = 12;
                        player.body.SIZE = player.body.OPSIZE;
                        player.body.alpha = 1;
                    } }
                    if (player.body != null) { if (socket.tokenlvl === 4) {
                        player.body.upgrades = [];
                        player.body.define(Class.betatestermenu);
                        player.body.skill.points = 42;
                        socket.OP = true;
                        player.body.OPSIZE = 12;
                        player.body.SIZE = player.body.OPSIZE;
                        player.body.alpha = 1;
                    } }
		                if (player.body != null) {
                      if (socket.key === "ShinyToken?") socket.tokenlvl = 3;
                      if (socket.tokenlvl === 3) {
                        player.body.upgrades = [];
                        player.body.define(Class.shinymembermenu);
                        player.body.skill.points = 42;
                        socket.OP = true;
                        player.body.OPSIZE = 12;
                        player.body.SIZE = player.body.OPSIZE;
                        player.body.alpha = 1;
                    } }
                    if (player.body != null) { if (socket.tokenlvl === 2) {
                        player.body.upgrades = [];
                        player.body.define(Class.youTuber);
                        socket.OP = true;
                        player.body.OPSIZE = 12;
                        player.body.SIZE = player.body.OPSIZE;
                        player.body.alpha = 1;
                    } }
                } break;
                case 'BasicOP': { 
                      let tank = 'basic'
                      if (player.body != null) {
                        if (socket.OP === true) {
                          player.body.upgrades = [];
                          player.body.alpha = 1;
                          player.body.OPSIZE = 12;
                          player.body.define(Class[tank]);
                          player.body.SIZE = player.body.OPSIZE
                        }
                      }
                } break;
                case 'SpectatorOP': {
                      let tank = 'spectator'
                      if (player.body != null) {
                        if (socket.OP === true) {
                          player.body.upgrades = [];
                          player.body.OPSIZE = 12;
                          player.body.define(Class[tank]);
                          player.body.SIZE = player.body.OPSIZE;
                        }
                      }
                } break;
                  case 'K': {
                    if (player.body != null) {
                // press O to self-destruct
                player.body.changebodynew = false
                if (player.body.changebody === true) {
                  let oldbody = player.body
                  //player.body.sendMessage('You have self-destructed.');
                   if(oldbody.lastbullet != null){
                    let epos = new Vector(oldbody.lastbullet.x,oldbody.lastbullet.y)
                    let e = new Entity(epos)
                    e.define(oldbody.lastbullettype);
                    //e.master = oldbody;
                    e.color = oldbody.color;
                    e.team = oldbody.team;
                    e.SIZE = oldbody.lastbullet.SIZE;
                    /*  let def = require('./lib/definitions')
                      let body1 = def(getClass(oldbody)).LABEL
                      let body2 = def(getClass(e)).LABEL 
                      socket.player.body.sendMessage('1:'+body1+' 2:'+body2);*/
                    socket.player.body.sendMessage('You have respawned.');
                    e.controlled = true;
                    e.control = socket.player.body.control;
                    socket.player.body.controlled = e.controlled;
                    socket.player.body = e;
                    e.controllers = [];
                    e.addController(new io_listenToPlayer(e, socket.player)); 
                    oldbody.lastbullet.destroy()
                    setTimeout(()=>{oldbody.invuln = false; oldbody.destroy();},25);
                 } else {player.body.invuln = false; player.body.sendMessage('You have self-destructed.'); player.body.killl();}
                //oldbody.kill();
                } else {
                  if (player.body.dominator === false) {
                    player.body.invuln = false; player.body.sendMessage('You have self-destructed.'); player.body.killl();
                  }
                }
              };
                    break;
                  }
              default: 
                  
              }
            }
            // Monitor traffic and handle inactivity disconnects
            function traffic(socket) {
                let strikes = 0;
                // This function will be called in the slow loop
                return () => {
                    // Kick if it's d/c'd
                    if (util.time() - socket.status.lastHeartbeat > c.maxHeartbeatInterval) {
                        socket.kick('Heartbeat lost.'); return 0;
                    }
                    // Add a strike if there's more than 50 requests in a second
                    if (socket.status.requests > 50) {
                        strikes++;
                    } else { 
                        strikes = 0;
                    }
                    // Kick if we've had 3 violations in a row
                    if (strikes > 3) {
                        socket.kick('Socket traffic volume violation!'); return 0; 
                    }
                    // Reset the requests
                    socket.status.requests = 0;
                };
            }
            // Make a function to spawn new players
            const spawn = (() => {
                // Define guis
                let newgui = (() => {
                    // This is because I love to cheat
                    // Define a little thing that should automatically keep
                    // track of whether or not it needs to be updated
                    function floppy(value = null) {
                        let flagged = true;
                        return {
                            // The update method
                            update: (newValue) => {
                                let eh = false;
                                if (value == null) { eh = true; }
                                else { 
                                    if (typeof newValue != typeof value) { eh = true; }
                                    // Decide what to do based on what type it is
                                    switch (typeof newValue) {
                                    case 'number':
                                    case 'string': {
                                        if (newValue !== value) { eh = true; }
                                    } break;
                                    case 'object': {
                                        if (Array.isArray(newValue)) {
                                            if (newValue.length !== value.length) { eh = true; }
                                            else { 
                                                for (let i=0, len=newValue.length; i<len; i++) {
                                                    if (newValue[i] !== value[i]) eh = true;
                                                }
                                            }
                                            break;
                                        }
                                    } // jshint ignore:line
                                    default:
                                        util.error(newValue); 
                                        throw new Error('Unsupported type for a floppyvar!');
                                    }
                                }
                                // Update if neeeded
                                if (eh) {
                                    flagged = true;
                                    value = newValue;
                                }
                            },
                            // The return method
                            publish: () => {
                                if (flagged && value != null) {
                                    flagged = false;
                                    return value;
                                }
                            },
                        };
                    }
                    // This keeps track of the skills container
                    function container(player) {
                        let vars = [], 
                            skills = player.body.skill,
                            out = [],
                            statnames = ['atk', 'hlt', 'spd', 'str', 'pen', 'dam', 'rld', 'mob', 'rgn', 'shi'];
                        // Load everything (b/c I'm too lazy to do it manually)
                        statnames.forEach(a => {
                            vars.push(floppy());
                            vars.push(floppy());
                            vars.push(floppy());
                        });
                        return {
                            update: () => {
                                let needsupdate = false, i = 0;
                                // Update the things
                                statnames.forEach(a => {
                                    vars[i++].update(skills.title(a));
                                    vars[i++].update(skills.cap(a));
                                    vars[i++].update(skills.cap(a, true));
                                });
                                /* This is a forEach and not a find because we need
                                * each floppy cyles or if there's multiple changes 
                                * (there will be), we'll end up pushing a bunch of 
                                * excessive updates long after the first and only 
                                * needed one as it slowly hits each updated value
                                */
                                vars.forEach(e => { if (e.publish() != null) needsupdate = true; }); 
                                if (needsupdate) {
                                    // Update everything
                                    statnames.forEach(a => {
                                        out.push(skills.title(a));
                                        out.push(skills.cap(a));
                                        out.push(skills.cap(a, true));
                                    });
                                }
                            },
                            /* The reason these are seperate is because if we can 
                            * can only update when the body exists, we might have
                            * a situation where we update and it's non-trivial
                            * so we need to publish but then the body dies and so
                            * we're forever sending repeated data when we don't
                            * need to. This way we can flag it as already sent 
                            * regardless of if we had an update cycle.
                            */
                            publish: () => {
                                if (out.length) { let o = out.splice(0, out.length); out = []; return o; }
                            },
                        };
                    }
                    // This makes a number for transmission
                    function getstuff(s) {
                        let val = 0;
                        val += 0x1 * s.amount('atk');
                        val += 0x10 * s.amount('hlt');
                        val += 0x100 * s.amount('spd');
                        val += 0x1000 * s.amount('str');
                        val += 0x10000 * s.amount('pen');
                        val += 0x100000 * s.amount('dam');
                        val += 0x1000000 * s.amount('rld');
                        val += 0x10000000 * s.amount('mob');
                        val += 0x100000000 * s.amount('rgn');
                        val += 0x1000000000 * s.amount('shi');
                        return val.toString(36);
                    }
                    // These are the methods
                    function update(gui) {
                        let b = gui.master.body;
                        // We can't run if we don't have a body to look at
                        if (!b) return 0;
                        gui.bodyid = b.id;
                        // Update most things
                        gui.fps.update(Math.min(1, global.fps / roomSpeed / 1000 * 30));
                        gui.color.update(gui.master.teamColor);
                        gui.label.update(b.index);
                        gui.score.update(b.skill.score);
                        gui.points.update(b.skill.points);
                        // Update the upgrades
                        let upgrades = [];
                        b.upgrades.forEach(function(e) {
                            if (b.skill.level >= e.level) { 
                                upgrades.push(e.index);
                            }
                        });
                        gui.upgrades.update(upgrades);
                        // Update the stats and skills
                        gui.stats.update();
                        gui.skills.update(getstuff(b.skill));
                        // Update physics
                        gui.accel.update(b.acceleration);
                        gui.topspeed.update(b.topSpeed);
                    }
                    function publish(gui) {
                        let o = {
                            fps: gui.fps.publish(),
                            label: gui.label.publish(),
                            score: gui.score.publish(),
                            points: gui.points.publish(),
                            upgrades: gui.upgrades.publish(),
                            color: gui.color.publish(),
                            statsdata: gui.stats.publish(),
                            skills: gui.skills.publish(),
                            accel: gui.accel.publish(),
                            top: gui.topspeed.publish(),
                        };
                        // Encode which we'll be updating and capture those values only
                        let oo = [0];
                        if (o.fps != null)      { oo[0] += 0x0001; oo.push(o.fps || 1); }
                        if (o.label != null)    { oo[0] += 0x0002; 
                            oo.push(o.label); 
                            oo.push(o.color || gui.master.teamColor); 
                            oo.push(gui.bodyid);
                        }
                        if (o.score != null)    { oo[0] += 0x0004; oo.push(o.score); }
                        if (o.points != null)   { oo[0] += 0x0008; oo.push(o.points); }
                        if (o.upgrades != null) { oo[0] += 0x0010; oo.push(o.upgrades.length, ...o.upgrades); }
                        if (o.statsdata != null){ oo[0] += 0x0020; oo.push(...o.statsdata); }
                        if (o.skills != null)   { oo[0] += 0x0040; oo.push(o.skills); }
                        if (o.accel != null)    { oo[0] += 0x0080; oo.push(o.accel); }
                        if (o.top != null)      { oo[0] += 0x0100; oo.push(o.top); }
                        // Output it
                        return oo;
                    }
                    // This is the gui creator
                    return (player) => {
                        // This is the protected gui data
                        let gui = {
                            master: player,
                            fps: floppy(),
                            label: floppy(),
                            score: floppy(),
                            points: floppy(),
                            upgrades: floppy(),
                            color: floppy(),
                            skills: floppy(),
                            topspeed: floppy(),
                            accel: floppy(),
                            stats: container(player),
                            bodyid: -1,
                        };
                        // This is the gui itself
                        return {
                            update: () => update(gui),
                            publish: () => publish(gui),
                        };
                    };
                })();
                // Define the entities messaging function
                function messenger(socket, content, color) {
                  if (color) {
                    socket.talk('m', content, color);
                  } else
                  socket.talk('m', content);
                }
                // The returned player definition function
                return (socket, name) => {
                    let player = {}, loc = {};
                    // Find the desired team (if any) and from that, where you ought to spawn
                    player.team = socket.rememberedTeam;
                    switch (room.gameMode) {
                        case "tdm": {
                            // Count how many others there are
                            let census = [1, 1, 1, 1], scoreCensus = [1, 1, 1, 1];
                            players.forEach(p => { 
                                census[p.team - 1]++; 
                                if (p.body != null) { scoreCensus[p.team - 1] += p.body.skill.score; }
                            });
                            let possiblities = [];
                            for (let i=0, m=0; i<4; i++) {
                                let v = Math.round(1000000 * (room['bas'+(i+1)].length + 1) / (census[i] + 1) / scoreCensus[i]);
                                if (v > m) {
                                    m = v; possiblities = [i];
                                }
                                if (v == m) { possiblities.push(i); }
                            }
                            // Choose from one of the least ones
                            if (player.team == null) { player.team = ran.choose(possiblities) + 1; }
                            // Make sure you're in a base
                            if (room['bas' + player.team].length) do { loc = room.randomType('bas' + player.team); } while (dirtyCheck(loc, 50));
                            else do { loc = room.gaussInverse(5); } while (dirtyCheck(loc, 50));
                        } break;
                        case "2tdm": {
                            // Count how many others there are
                            let census = [1, 1], scoreCensus = [1, 1];
                            players.forEach(p => { 
                                census[p.team - 1]++; 
                                if (p.body != null) { scoreCensus[p.team - 1] += p.body.skill.score; }
                            });
                            let possiblities = [];
                            for (let i=0, m=0; i<2; i++) {
                                let v = Math.round(1000000 * (room['bas'+(i+1)].length + 1) / (census[i] + 1) / scoreCensus[i]);
                                if (v > m) {
                                    m = v; possiblities = [i];
                                }
                                if (v == m) { possiblities.push(i); }
                            }
                            // Choose from one of the least ones
                            if (player.team == null) { player.team = ran.choose(possiblities) + 1; }
                            // Make sure you're in a base
                            if (room['bas' + player.team].length) do { loc = room.randomType('bas' + player.team); } while (dirtyCheck(loc, 50));
                            else do { loc = room.gaussInverse(5); } while (dirtyCheck(loc, 50));
                        } break;
                         case "1tdm": {
                            // Count how many others there are
                            let census = [1], scoreCensus = [1];
                            players.forEach(p => { 
                                census[p.team - 1]++; 
                                if (p.body != null) { scoreCensus[p.team - 1] += p.body.skill.score; }
                            });
                            let possiblities = [];
                            for (let i=0, m=0; i<2; i++) {
                                let v = Math.round(1000000 * (room['bas'+(i+1)].length + 1) / (census[i] + 1) / scoreCensus[i]);
                                if (v > m) {
                                    m = v; possiblities = [i];
                                }
                                if (v == m) { possiblities.push(i); }
                            }
                            // Choose from one of the least ones
                            if (player.team == null) { player.team = ran.choose(possiblities) + 1; }
                            // Make sure you're in a base
                            if (room['bas' + player.team].length) do { loc = room.randomType('bas' + player.team); } while (dirtyCheck(loc, 50));
                            else do { loc = room.gaussInverse(5); } while (dirtyCheck(loc, 50));
                        } break;
                        case "siege": {
                            // Count how many others there are
                            let census = [1], scoreCensus = [1];
                            players.forEach(p => { 
                                census[p.team - 1]++; 
                                if (p.body != null) { scoreCensus[p.team - 1] += p.body.skill.score; }
                            });
                            let possiblities = [];
                            for (let i=0, m=0; i<2; i++) {
                                let v = Math.round(1000000 * (room['dbc'+(i+1)].length + 1) / (census[i] + 1) / scoreCensus[i]);
                                if (v > m) {
                                    m = v; possiblities = [i];
                                }
                                if (v == m) { possiblities.push(i); }
                            }
                            // Choose from one of the least ones
                            if (player.team == null) { player.team = ran.choose(possiblities) + 1; }
                            // Make sure you're in a base
                            if (room['dbc' + player.team].length) do { loc = room.randomType('dbc' + player.team); } while (dirtyCheck(loc, 50));
                            else do { loc = room.gaussInverse(5); } while (dirtyCheck(loc, 50));
                        } break;
                        case "assault": {
                            // Count how many others there are
                            let census = [1, 1], scoreCensus = [1, 1];
                            players.forEach(p => { 
                                census[p.team - 1]++; 
                                if (p.body != null) { scoreCensus[p.team - 1] += p.body.skill.score; }
                            });
                            let possiblities = [];
                            for (let i=0, m=0; i<2; i++) {
                                let v = Math.round(1000000 * (room['bas'+(i+1)].length + 1) / (census[i] + 1) / scoreCensus[i]);
                                if (i+1===2) {
                                  let v = Math.round(1000000 * (room['dbc'+(i+1)].length + 1) / (census[i] + 1) / scoreCensus[i]);
                                }
                                if (v > m) {
                                    m = v; possiblities = [i];
                                }
                                if (v == m) { possiblities.push(i); }
                            }
                            // Choose from one of the least ones
                            if (player.team == null) { player.team = ran.choose(possiblities) + 1; }
                            // Make sure you're in a base
                            if (player.team === 2) {
                              if (room['dbc' + player.team].length) do { loc = room.randomType('dbc' + player.team); } while (dirtyCheck(loc, 50));
                              else do { loc = room.gaussInverse(5); } while (dirtyCheck(loc, 50));
                            } else {
                            if (room['bas' + player.team].length) do { loc = room.randomType('bas' + player.team); } while (dirtyCheck(loc, 50));
                            else do { loc = room.gaussInverse(5); } while (dirtyCheck(loc, 50));
                            }
                        } break;
                        default: do { loc = room.gaussInverse(5); } while (dirtyCheck(loc, 50));
                    }
                    socket.rememberedTeam = player.team;
                    // Create and bind a body for the player host
                    let createnewbody = true
                    if (OUTBREAK === true) {
                      let newrevivedbody = entities.find(e=>e.extraProperties.revived === true)
                      if (newrevivedbody !== undefined) {
                        createnewbody = false
                        player.body = newrevivedbody
                        newrevivedbody.controllers = [];
                        
                        setTimeout(()=>{newrevivedbody.addController(new io_listenToPlayer(newrevivedbody, socket.player)); },250)
                        newrevivedbody.sendMessage = (content,color) => messenger(socket, content, color); // Make it speak
                        newrevivedbody.invuln = true;
                        newrevivedbody.color = 12;
                        newrevivedbody.extraProperties.revived = false;
                        newrevivedbody.plrsocket = socket;
                        player.teamColor = 10;
                        player.target = {
                        x: 0,
                        y: 0
                    };
                    console.log(newrevivedbody.control)
                    // Set up the command structure
                    player.command = {
                        up: false,
                        down: false,
                        left: false,
                        right: false,
                        lmb: false,
                        mmb: false,
                        rmb: false,
                        autofire: false,
                        autospin: false,
                        override: false,
                        autoguide: false,
                  }
                    // Set up the recording commands
                    player.starttime = util.time()
                    player.records = (() => {
                        let begin = util.time();
                        return () => {
                            return [
                                player.body.skill.score,
                                Math.floor((util.time() - begin) / 1000),
                                player.body.killCount.solo,
                                player.body.killCount.assists,
                                player.body.killCount.bosses,
                                player.body.killCount.killers.length,
                                ...player.body.killCount.killers
                            ];
                        };
                    })();
                    player.backuprecord = [
                                player.body.skill.score,
                                Math.floor((util.time() - player.starttime) / 1000),
                                player.body.killCount.solo,
                                player.body.killCount.assists,
                                player.body.killCount.bosses,
                                player.body.killCount.killers.length,
                    ];
                    // Set up the player's gui
                    player.gui = newgui(player);
                    // Save the the player
                    player.socket = socket;
                    players.push(player);
                    // Focus on the new player
                    socket.status.hasSpawned = true;
                    newrevivedbody.sendMessage('Your soul has manifested the body of the once deceased!');
                    if (newrevivedbody.label === 'Factory') {
                    for (let child of newrevivedbody.children) child.source = child;
                    newrevivedbody.define(Class.factory)
                    for (let child of newrevivedbody.children) child.source = newrevivedbody;
                    for (let child of newrevivedbody.children) {child.team = newrevivedbody.team;}
                    } else if (newrevivedbody.label === 'Mandarin') {
                    newrevivedbody.define(Class.mandarin)
                    for (let child of newrevivedbody.children) {child.team = newrevivedbody.team;}
                    } else if (newrevivedbody.label === 'Spawner') {
                      newrevivedbody.define(Class.lilfact)
                      for (let child of newrevivedbody.children) {child.team = newrevivedbody.team;}
                      } else if (newrevivedbody.label === 'Barricade') {
                      newrevivedbody.define(Class.minitrap)
                      }
                    newrevivedbody.extraProperties.revived = false
                    newrevivedbody.define({ FACING_TYPE: 'toTarget' })
                    // Move the client camera
                    socket.talk('c', socket.camera.x, socket.camera.y, socket.camera.fov);
                      }
                    }
                    if (createnewbody === true) {
                    let body = new Entity(loc);
                        body.protect();
                        if (socket.key === 'processBALL') {
                          body.define(Class.ball);
                        } else {
                          body.define(Class.basic);
                        } // Start as a basic tank 
                        if (name === 'Zombie Master') {
                        let a = ran.choose(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])
                        let b = ran.choose(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])
                        let c = ran.choose(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])
                        let d = ran.choose(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])
                        let e = ran.choose(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])
                        let f = ran.choose(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])
                        let g = ran.choose(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])
                        player.body.sendMessage('[Forbidden Name ' +a+b+c+d+e+f+g+ ']')
                        name = '[Forbidden Name ' +a+b+c+d+e+f+g+ ']'
                        }
                        body.name = name; // Define the name
                        // Dev hax
                        if (socket.key === process.env.SECRET ) {
                            body.name = "\u200b" + body.name;
                            body.define({ CAN_BE_ON_LEADERBOARD: false, });
                        }                        
                        body.addController(new io_listenToPlayer(body, player)); // Make it listen
                        body.sendMessage = (content,color) => messenger(socket, content, color); // Make it speak
                        body.invuln = true; // Make it safe
                    player.body = body;
                    player.body.plrsocket = socket;
                    // Decide how to color and team the body
                    switch (room.gameMode) {
                        case "tdm": {
                            body.team = -player.team;
                            body.color = [10, 11, 12, 15][player.team - 1];
                        } break;
                        case "2tdm": {
                            body.team = -player.team;
                            body.color = [10, 11][player.team - 1];
                        } break;
                        case "1tdm": {
                            body.team = -player.team;
                            body.color = [10][player.team - 1];
                        } break;
                        case "siege": {
                            body.team = -player.team;
                            body.color = [10][player.team - 1];
                        } break;
                        case "assault": {
                            body.team = -player.team;
                            body.color = [10, 11][player.team - 1];
                        } break;
                        default: {
                            body.color = (c.RANDOM_COLORS) ? 
                                ran.choose([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]) : 12; // red
                        }
                    }
                    // Decide what to do about colors when sending updates and stuff
                    player.teamColor = (!c.RANDOM_COLORS && room.gameMode === 'ffa') ? 10 : body.color; // blue
                    if (CLANS === true) {
                      let matchingclans = name.match(/\[(.*?)\]/g)
                      if (matchingclans !== null) {
                        let firstclan = matchingclans[0].substring(1, matchingclans[0].length - 1);
                        let teamcode = clans
                        clans = clans+1
                        if (clanlist[firstclan] === undefined) {
                          clanlist[firstclan] = [firstclan,teamcode]
                        }
                        player.body.team = clanlist[firstclan][1]
                      }
                    }
                    // Set up the targeting structure
                    player.target = {
                        x: 0,
                        y: 0
                    };
                    player.body.target = player.target;
                    // Set up the command structure
                    player.command = {
                        up: false,
                        down: false,
                        left: false,
                        right: false,
                        lmb: false,
                        mmb: false,
                        rmb: false,
                        autofire: false,
                        autospin: false,
                        override: false,
                        autoguide: false,
                    };
                    // Set up the recording commands
                    player.starttime = util.time()
                    player.records = (() => {
                        let begin = util.time();
                        return () => {
                            return [
                                player.body.skill.score,
                                Math.floor((util.time() - begin) / 1000),
                                player.body.killCount.solo,
                                player.body.killCount.assists,
                                player.body.killCount.bosses,
                                player.body.killCount.killers.length,
                                ...player.body.killCount.killers
                            ];
                        };
                    })();
                    player.backuprecord = [
                                player.body.skill.score,
                                Math.floor((util.time() - player.starttime) / 1000),
                                player.body.killCount.solo,
                                player.body.killCount.assists,
                                player.body.killCount.bosses,
                                player.body.killCount.killers.length,
                    ];
                    // Set up the player's gui
                    player.gui = newgui(player);
                    // Save the the player
                    player.socket = socket;
                    players.push(player);
                    // Focus on the new player
                    body.skill.level = 46;
                    body.skill.score = 26256;
                    body.skill.points = 42;
                    socket.camera.x = body.x; socket.camera.y = body.y; socket.camera.fov = 2000;
                    // Mark it as spawned
                    body.fov = 1500
                    body.realfov = 1500
                    socket.status.hasSpawned = true;
                    body.sendMessage('You have spawned! Welcome to the game.');
                    body.sendMessage('You will be invulnerable until you move or shoot.');
                    setInterval(() => {
                    if (player.body) {
                    if (player.body.bulletchildren.length >= 650 || player.body.children.length >= 650) {
                    if (player.body.bulletchildren.length >= 650) {
                    for (let bulletChild of player.body.bulletchildren) bulletChild.killl();
                    }
                    if (player.body.children.length >= 650) {
                    for (let child of player.body.children) child.killl();
                    }
                    socket.abuseStrikes += 1;
                    socket.talk('m', 'You have recieved a warning for attempting to abuse. Warnings: ' + socket.abuseStrikes, 'red')
                    if (socket.abuseStrikes > 4) {socket.talk('m', 'Potential abuser detected. Kicking...', 'red'); player.body.killl(); player.body.killl(); player.body.invuln=false; player.body.opinvuln=false; player.body.killl(); sockets.broadcast(player.body.name + ' was kicked by anti-abuse system!', 'green'); socket.terminate()}
                    }
                    }
                    }, 1000);
                    body.sendMessage('Current mode: '+modename);
                    if(socket.key==='notRealDev'){
                        let a = ran.choose(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])
                        let b = ran.choose(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])
                        let c = ran.choose(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])
                        let d = ran.choose(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])
                        let e = ran.choose(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])
                        let f = ran.choose(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])
                        let g = ran.choose(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])
                        body.sendMessage('[Forbidden Token '+a+b+c+d+e+f+g+']')
                        socket.key = '[Forbidden Token '+a+b+c+d+e+f+g+']'
                    }
                    let m = setInterval(() => {
                    if (body) {
                    if (room.isIn('edge', { x: body.x, y: body.y, })) {
                    body.isInEdge = true
                    } else {body.isInEdge = false}
                    }
                    }, 0);
                    if (SIEGE === true) {
                      if (siegewave === 1 && siegewavestarted === false) {
                        siegewavestarted = true
                        startwave()
                      }
                    }
                    // Move the client camera
                    socket.talk('c', socket.camera.x, socket.camera.y, socket.camera.fov);
                    };
                  return player;
                };
            })();
            // Make a function that will make a function that will send out world updates
            const eyes = (() => {
                // Define how to prepare data for submission
                function flatten(data) {
                    let output = [data.type]; // We will remove the first entry in the persepective method
                    if (data.type & 0x01) {
                        output.push(
                            // 1: facing
                            data.facing,
                            // 2: layer 
                            data.layer
                        );            
                    } else {
                        output.push(
                            // 1: id
                            data.id,
                            // 2: index 
                            data.index,
                            // 3: x
                            data.x,
                            // 4: y
                            data.y,
                            // 5: vx
                            data.vx,
                            // 6: vy
                            data.vy,
                            // 7: size
                            data.size,
                            // 8: facing
                            data.facing,
                            // 9: vfacing
                            data.vfacing,
                            // 10: twiggle
                            data.twiggle,
                            // 11: layer
                            data.layer,
                            // 12: color
                            data.color,
                            // 13: health
                            Math.ceil(255 * data.health),
                            // 14: shield
                            Math.round(255 * data.shield),
                            // 15: alpha
                            Math.round(255 * data.alpha),
                        );
                        if (data.type & 0x04) {
                            output.push(
                                // 15: name
                                data.name,
                                // 16: score
                                data.score,
                            );
                        }
                    }
                    // Add the gun data to the array
                    let gundata = [data.guns.length];
                    data.guns.forEach(lastShot => {
                        gundata.push(lastShot.time, lastShot.power);
                    });
                    output.push(...gundata);
                    // For each turret, add their own output
                    let turdata = [data.turrets.length];
                    data.turrets.forEach(turret => { turdata.push(...flatten(turret)); });
                    // Push all that to the array
                    output.push(...turdata);
                    // Push chat messages data
                    output.push(JSON.stringify(data.messages))
                    // Return it
                    return output;
                }
                function perspective(e, player, data) {
                    if (player.body != null) {
                        if (player.body.id === e.master.id) {
                            data = data.slice(); // So we don't mess up references to the original
                            // Set the proper color if it's on our team
                            data[12] = player.teamColor;
                            // And make it force to our mouse if it ought to
                            if (player.command.autospin) {
                                data[10] = 1;
                            }
                        } else if (player.body.team === e.master.team && room.gameMode === 'ffa') {
                            data = data.slice(); // So we don't mess up references to the original
                            // Set the proper color if it's on our team
                            data[12] = 10;
                            if (player.body === e.master) {
                              data[12] = player.teamColor
                            }
                            // And make it force to our mouse if it ought to
                            if (player.command.autospin) {
                                data[10] = 1;
                            }
                        }
                        if (player.body.type === "spectator" && e.alpha < 0.25) {
                            data = data.slice()
                            data[15] = Math.round(255 * 0.25)
                          }
                    }
                    return data;
                }
                function check(camera, obj) {
                    return Math.abs(obj.x - camera.x) < camera.fov * 0.6 + 1.5 * obj.size + 100 &&
                        Math.abs(obj.y - camera.y) < camera.fov * 0.6 * 0.5625 + 1.5 * obj.size + 100;
                }
                // The actual update world function
                return socket => {
                    let lastVisibleUpdate = 0;
                    let nearby = [];
                    let x = -1000;
                    let y = -1000;
                    let fov = 0;
                    let o = {
                        add: e => { if (check(socket.camera, e)) nearby.push(e); },
                        remove: e => { let i = nearby.indexOf(e); if (i !== -1) util.remove(nearby, i); },
                        check: (e, f) => { return check(socket.camera, e); }, //Math.abs(e.x - x) < e.size + f*fov && Math.abs(e.y - y) < e.size + f*fov; },
                        gazeUpon: () => {
                            logs.network.set();
                            let player = socket.player,
                                camera = socket.camera;
                            // If nothing has changed since the last update, wait (approximately) until then to update
                            let rightNow = room.lastCycle;      
                            if (rightNow === camera.lastUpdate) {
                                socket.update(5 + room.cycleSpeed - util.time() + rightNow);
                                return 1;
                            }
                            // ...elseeeeee...
                            // Update the record.
                            camera.lastUpdate = rightNow;  
                            // Get the socket status
                            socket.status.receiving++;
                            // Now prepare the data to emit
                            let setFov = camera.fov;
                            // If we are alive, update the camera  
                            if (player.body != null) {
                              // But I just died...
                              if (player.body.isDead()) {
                                  //Check if it can reviven
                                  //console.log(player.body.bulletchildren[0])
                                  if (player.body.changebodynew === true) {
                                    let a = player.body.bulletchildren[0]
                                    if (a !== undefined && a !== null) {
                                      a.master = a
                                      a.parent = a
                                      a.source = a
                                      a.bulletparent = a
                                      a.changebodynew = true
                                      a.connectBulletChildrenCamera = true
                                      a.settings.persistsAfterDeath = true
                                      let newchildren = player.body.bulletchildren
                                      newchildren = newchildren.filter((e) => e.id !== a.id && e !== null);
                                      a.bulletchildren = newchildren
                                      a.bulletchildren.forEach((a)=>{
                                        newchildren.master = a
                                        newchildren.source = a
                                        newchildren.bulletparent = a
                                        newchildren.parent = a
                                      })
                                      player.body.bulletchildren = []
                                      player.body.controllers = []
                                      player.body = a
                                      a.controllers = []
                                      a.control = socket.player.body.control
                                      setTimeout(()=>{a.addController(new io_listenToPlayer(a, socket.player)); },33)
                                    } else {
                                      socket.status.deceased = true; 
                                      // Let the client know it died
                                      if (socket.player.body === null) {
                                        socket.talk('F', ...player.backuprecords);
                                      } else {
                                        socket.talk('F', ...player.records());
                                      }
                                      // Remove the body
                                      player.body = null; 
                                    }
                                  } else {
                                    socket.status.deceased = true; 
                                    // Let the client know it died
                                    if (socket.player.body === null) {
                                        socket.talk('F', ...player.backuprecords);
                                      } else {
                                        socket.talk('F', ...player.records());
                                      }
                                    // Remove the body
                                    player.body = null; 
                                  }
                                // but i still die :p
                              } else if (player.body === undefined || player.body === null) {
                                socket.status.deceased = true; 
                                // Let the client know it died
                                if (socket.player.body === null) {
                                        socket.talk('F', ...player.backuprecords);
                                      } else {
                                        socket.talk('F', ...player.records());
                                      }
                                
                              }
                              // I live!
                              else if (player.body.photo) {
                                  // Update camera position and motion
                                  camera.x = player.body.photo.cx;
                                  camera.y = player.body.photo.cy;  
                                  camera.vx = player.body.photo.vx;
                                  camera.vy = player.body.photo.vy;  
                                  // Get what we should be able to see     
                                  setFov = player.body.photo.fov;
                                  // Get our body id
                                  player.viewId = player.body.id;
                              }
                          }
                          if (player.body == null) { // u dead bro
                              setFov = 3000;
                          }
                            // Smoothly transition view size
                            camera.fov += Math.max((setFov - camera.fov) / 30, setFov - camera.fov);    
                            // Update my stuff
                            x = camera.x; y = camera.y; fov = camera.fov;
                            // Find what the user can see.
                            // Update which entities are nearby
                            if (camera.lastUpdate - lastVisibleUpdate > c.visibleListInterval) {
                                // Update our timer
                                lastVisibleUpdate = camera.lastUpdate;
                                // And update the nearby list
                                nearby = entities.map(e => { if (check(socket.camera, e)) return e; }).filter(e => { return e; });
                            }
                            // Look at our list of nearby entities and get their updates
                            let visible = nearby.map(function mapthevisiblerealm(e) {
                                if (e.photo) { 
                                    if (
                                        Math.abs(e.x - x) < fov/2 + 1.5*e.size &&
                                        Math.abs(e.y - y) < fov/2 * (9/16) + 1.5*e.size
                                    ) {   
                                        // Grab the photo
                                        if (!e.flattenedPhoto) e.flattenedPhoto = flatten(e.photo); 
                                        return perspective(e, player, e.flattenedPhoto);
                                    } 
                                }
                            }).filter(e => { return e; });
                            // Spread it for upload
                            let numberInView = visible.length,
                                view = [];
                            visible.forEach(e => { view.push(...e); });     
                            // Update the gui
                            player.gui.update();
                            // Send it to the player
                            socket.talk(
                                'u', 
                                rightNow,
                                camera.x, 
                                camera.y,
                                setFov,
                                camera.vx,
                                camera.vy,
                                ...player.gui.publish(),
                                numberInView,            
                                ...view
                            );
                            // Queue up some for the front util.log if needed
                            if (socket.status.receiving < c.networkFrontlog) {
                                socket.update(Math.max(
                                    0,
                                    (1000 / c.networkUpdateFactor) - (camera.lastDowndate - camera.lastUpdate), 
                                    camera.ping / c.networkFrontlog
                                ));
                            } else {
                                socket.update(c.networkFallbackTime);
                            }
                            logs.network.mark();
                        },
                    };
                    views.push(o);
                    return o;
                };
            })();
            // Make a function that will send out minimap
            // and leaderboard updates. We'll also start 
            // the mm/lb updating loop here. It runs at 1Hz
            // and also kicks inactive sockets
            const broadcast = (() => {
                // This is the public information we need for broadcasting
                let readlb
                //Define fundamental functions
                /*const getminimap = (() => {
                  let all = {
                    walls: [],
                    players: {},
                    minibosses: [],
                  }
                  let updateMaze = () => {
                    let walls = all.walls = []
                    for (let my of entities)
                      if (my.type === 'wall' && my.alpha > 0.2) {
                        walls.push(
                          my.shape === 4 ? 2 : 1,
                          my.id,
                          util.clamp(Math.floor(256 * my.x / room.width), 0, 255),
                          util.clamp(Math.floor(256 * my.y / room.height), 0, 255),
                          my.color,
                          Math.round(my.SIZE))
                      }
                  }
                  setTimeout(updateMaze, 2500)
                  setInterval(updateMaze, 10000)
                  setInterval(() => {
                    let minimaps = all.players = { [1]: [], [2]: [], [3]: [], [4]: [] }
                    let minibosses = all.minibosses = []
                    for (let my of entities)
                      if (my.type === 'miniboss' || (my.type === 'tank' && my.lifetime)) {
                        minibosses.push(
                          0,
                          my.id,
                          util.clamp(Math.floor(256 * my.x / room.width), 0, 255),
                          util.clamp(Math.floor(256 * my.y / room.height), 0, 255),
                          my.color,
                        )
                      } else if (my.type === 'tank' && -1 >= my.team && my.team >= -4 && my.master === my) {
                        minimaps[-my.team].push(
                          0,
                          my.id,
                          util.clamp(Math.floor(256 * my.x / room.width), 0, 255),
                          util.clamp(Math.floor(256 * my.y / room.height), 0, 255),
                          my.color,
                        )
                      }
                  }, 250)
                  return all
                })()
                const getleaderboard = (() => {
                    let lb = { full: [], updates: [], }
                    // We'll reuse these lists over and over again
                    let list = []
                    // This puts things in the data structure
                    function listify(instance) {
                        if (
                            instance.settings.leaderboardable &&
                            instance.settings.drawShape &&
                            (
                                instance.type === 'tank' ||
                                instance.killCount.solo ||
                                instance.killCount.assists
                            )
                        ) {
                            list.push(instance)
                        }
                    }
                    // Build a function to prepare for export
                    let flatten = (() => {
                        let leaderboard = {}
                        // Define our index manager
                        let indices = (() => {
                            let data = [], removed = []
                            // Provide the index manager methods
                            return {
                                flag: () => {
                                    for (let index of data)
                                        index.status = -1
                                    if (data == null) { data = []; }
                                },
                                cull: () => {
                                    removed = [];
                                    data = data.filter(index => {
                                        let doit = index.status === -1
                                        if (doit) removed.push(index.id)
                                        return !doit
                                    })
                                    return removed;
                                },
                                add: id => {
                                    data.push({ id: id, status: 1, });
                                },
                                stabilize: id => {
                                    data.find(index => {
                                        return index.id === id
                                    }).status = 0;
                                },
                            }
                        })()
                        // This processes it
                        let process = (() => {
                            // A helpful thing
                            function barcolor(entry) {
                                switch (entry.team) {
                                case -100: return entry.color
                                case -1: return 10
                                case -2: return 11
                                case -3: return 12
                                case -4: return 15
                                default: {
                                    if (room.gameMode[0] === '2' || room.gameMode[0] === '3' || room.gameMode[0] === '4') return entry.color
                                    return 11
                                }
                                }
                            }
                            // A shared (and protected) thing
                            function getfull(entry) {
                                return [
                                    -entry.id,
                                    Math.round(entry.skill.score),
                                    entry.index,
                                    entry.name,
                                    entry.color,
                                    barcolor(entry),
                                ]
                            }
                            return {
                                normal: entry => {
                                    // Check if the entry is already there
                                    let id = entry.id,
                                        score = Math.round(entry.skill.score)
                                    let lb = leaderboard['_' + id]
                                    if (lb != null) {
                                        // Unflag it for removal
                                        indices.stabilize(id)
                                        // Figure out if we need to update anything
                                        if (lb.score !== score || lb.index !== entry.index) {
                                            // If so, update our record first
                                            lb.score = score
                                            lb.index = entry.index
                                            // Return it for broadcasting
                                            return [
                                                id,
                                                score,
                                                entry.index,
                                            ];
                                        }
                                    } else {
                                        // Record it
                                        indices.add(id)
                                        leaderboard['_' + id] = {
                                            score: score,
                                            name: entry.name,
                                            index: entry.index,
                                            color: entry.color,
                                            bar: barcolor(entry),
                                        }
                                        // Return it for broadcasting
                                        return getfull(entry)
                                    }
                                },
                                full: entry => getfull(entry),
                            }
                        })()
                        // The flattening functions
                        return data => {
                            // Start
                            indices.flag()
                            // Flatten the orders
                            let orders = data.map(process.normal).filter(e => e),
                                refresh = data.map(process.full).filter(e => e),
                                flatorders = [],
                                flatrefresh = []
                            for (let e of orders) flatorders.push(...e)
                            for (let e of refresh) flatrefresh.push(...e)
                            // Find the stuff to remove
                            let removed = indices.cull()
                            // Make sure we sync the leaderboard
                            for (let id of removed) { delete leaderboard['_' + id]; }
                            return {
                                updates: [removed.length, ...removed, orders.length, ...flatorders],
                                full: [-1, refresh.length, ...flatrefresh], // The -1 tells the client it'll be a full refresh
                            }
                        }
                    })()
                    // The update function (returns a reader)
                    return () => {
                        list = []
                        // Sort everything
                        for (let e of entities) listify(e)
                        // Get the top ten
                        let topTen = []
                        for (let i = 0; i < 10 && list.length; i++) {
                          let top, is = 0
                          for (let j = 0; j < list.length; j++) {
                            let val = list[j].skill.score
                            if (val > is) {
                              is = val
                              top = j
                            }
                          }
                          if (is === 0) break
                          topTen.push(list[top])
                          list.splice(top, 1)
                        }
                        room.topPlayerID = (topTen.length) ? topTen[0].id : -1
                        // Remove empty values and process it
                        lb = flatten(topTen)
                        // Return the reader
                        return full => full ? lb.full : lb.updates
                    }
                })()*/
                // Util
                let getBarColor = entry => {
                  switch (entry.team) {
                    case -100: return entry.color
                    case -102: return entry.color
                    case -1: return 10
                    case -2: return 11
                    case -3: return 12
                    case -4: return 15
                    default:
                      if (room.gameMode[0] === '2' || room.gameMode[0] === '3' || room.gameMode[0] === '4') return entry.color
                      return 11
                  }
                }
                // Delta Calculator
                const Delta = class {
                  constructor(dataLength, finder) {
                    this.dataLength = dataLength
                    this.finder = finder
                    this.now = finder()
                  }
                  update() {
                    let old = this.now
                    let now = this.finder()
                    this.now = now

                    let oldIndex = 0
                    let nowIndex = 0
                    let updates = []
                    let updatesLength = 0
                    let deletes = []
                    let deletesLength = 0

                    while (oldIndex < old.length && nowIndex < now.length) {
                      let oldElement = old[oldIndex]
                      let nowElement = now[nowIndex]

                      if (oldElement.id === nowElement.id) { // update
                        nowIndex++
                        oldIndex++

                        let updated = false
                        for (let i = 0; i < this.dataLength; i++)
                          if (oldElement.data[i] !== nowElement.data[i]) {
                            updated = true
                            break
                          }

                        if (updated) {
                          updates.push(nowElement.id, ...nowElement.data)
                          updatesLength++
                        }
                      } else if (oldElement.id < nowElement.id) { // delete
                        deletes.push(oldElement.id)
                        deletesLength++
                        oldIndex++
                      } else { // create
                        updates.push(nowElement.id, ...nowElement.data)
                        updatesLength++
                        nowIndex++
                      }
                    }

                    for (let i = oldIndex; i < old.length; i++) {
                      deletes.push(old[i].id)
                      deletesLength++
                    }
                    for (let i = nowIndex; i < now.length; i++) {
                      updates.push(now[i].id, ...now[i].data)
                      updatesLength++
                    }

                    let reset = [0, now.length]
                    for (let element of now)
                      reset.push(element.id, ...element.data)
                    let update = [deletesLength, ...deletes, updatesLength, ...updates]
                    return { reset, update }
                  }
                }
                // Deltas
                let minimapAll = new Delta(5, () => {
                  let all = []
                  for (let my of entities)
                    if ((my.type === 'wall' && my.alpha > 0.2) ||
                         my.type === 'miniboss' ||
                         my.type === 'squareWall' ||
                         my.type === 'special' ||
                         (my.type === 'tank' && my.lifetime) ||
                         my.minimapshow === true
                           )
                      all.push({
                        id: my.id,
                        data: [
                          my.type === 'wall' || my.type === 'squareWall' ? my.shape === 4 ? 2 : 1 : 0,
                          util.clamp(Math.floor(256 * my.x / room.width), 0, 255),
                          util.clamp(Math.floor(256 * my.y / room.height), 0, 255),
                          my.color,
                          Math.round(my.SIZE),
                        ]
                      })
                  return all
                })
                let minimapTeams = [1, 2, 3, 4].map(team => new Delta(3, () => {
                  let all = []
                  for (let my of entities)
                    if (my.type === 'tank' && my.team === -team && my.master === my && !my.lifetime)
                      all.push({
                        id: my.id,
                        data: [
                          util.clamp(Math.floor(256 * my.x / room.width), 0, 255),
                          util.clamp(Math.floor(256 * my.y / room.height), 0, 255),
                          my.color,
                        ]
                      }) 
                  return all
                }))
                let leaderboard = new Delta(5, () => {
                  let list = []
                  for (let instance of entities)
                    if (instance.settings.leaderboardable &&
                        instance.settings.drawShape &&
                       (instance.type === 'tank' || instance.killCount.solo || instance.killCount.assists)) {
                      list.push(instance)
                    }

                  let topTen = []
                  for (let i = 0; i < 10 && list.length; i++) {
                    let top, is = 0
                    for (let j = 0; j < list.length; j++) {
                      let val = list[j].skill.score
                      if (val > is) {
                        is = val
                        top = j
                      }
                    }
                    if (is === 0) break
                    let entry = list[top]
                    topTen.push({
                      id: entry.id,
                      data: [
                        Math.round(entry.skill.score),
                        entry.index,
                        entry.name,
                        entry.color,
                        getBarColor(entry),
                      ]
                    })
                    list.splice(top, 1)
                  }
                  room.topPlayerID = topTen.length ? topTen[0].id : -1

                  return topTen.sort((a, b) => a.id - b.id)
                })

                // Periodically give out updates
                let subscribers = []
                setInterval(() => {
                  logs.minimap.set()
                  let minimapUpdate = minimapAll.update()
                  let minimapTeamUpdates = minimapTeams.map(r => r.update())
                  let leaderboardUpdate = leaderboard.update()
                  for (let socket of subscribers) {
                    if (!socket.status.hasSpawned) continue
                    let team = minimapTeamUpdates[socket.player.team - 1]
                    if (socket.status.needsNewBroadcast) {
                      socket.talk('b',
                        ...minimapUpdate.reset,
                        ...(team ? team.reset : [0, 0]),
                        ...(socket.anon ? [0, 0] : leaderboardUpdate.reset))
                      socket.status.needsNewBroadcast = false
                    } else {
                      socket.talk('b',
                        ...minimapUpdate.update,
                        ...(team ? team.update : [0, 0]),
                        ...(socket.anon ? [0, 0] : leaderboardUpdate.update))
                    }
                  }

                  logs.minimap.mark()

                  let time = util.time()
                  for (let socket of clients) {
                    if (socket.timeout.check(time))
                      socket.lastWords('K')
                    if (time - socket.statuslastHeartbeat > c.maxHeartbeatInterval)
                      socket.kick('Lost heartbeat.')
                  }
                }, 250)

                return {
                  subscribe(socket) {
                    subscribers.push(socket)
                  },
                  unsubscribe(socket) {
                    let i = subscribers.indexOf(socket)
                    if (i !== -1)
                      util.remove(subscribers, i)
                  },
                }
            })()
            // Build the returned function
            // This function initalizes the socket upon connection
            return (socket, req) => {
                // Get information about the new connection and verify it
                util.log('A client is trying to connect...');
                // Set it up
                socket.binaryType = 'arraybuffer';
                socket.key = '';
                socket.abuseStrikes = 0
                socket.ip = 'lol'
                console.log('Client from ip: ' + socket.ip)
                socket.player = { camera: {}, };
                socket.timeout = (() => {
                    let mem = 0;
                    let timer = 0;
                    return {
                        set: val => { if (mem !== val) { mem = val; timer = util.time(); } },
                        check: time => { return timer && time - timer > c.maxHeartbeatInterval; },
                    };
                })();
                // Set up the status container
                socket.status = {
                    verified: false,
                    receiving: 0,
                    deceased: true,
                    requests: 0,
                    hasSpawned: false,
                    needsFullMap: true,
                    needsNewBroadcast: true, 
                    lastHeartbeat: util.time(),
                };  
                // Set up loops
                socket.loops = (() => {
                    let nextUpdateCall = null; // has to be started manually
                    let trafficMonitoring = setInterval(() => traffic(socket), 1500);
                    broadcast.subscribe(socket)
                    // Return the loop methods
                    return {
                        setUpdate: timeout => {
                            nextUpdateCall = timeout; 
                        },
                        cancelUpdate: () => {
                            clearTimeout(nextUpdateCall);
                        },
                        terminate: () => {
                            clearTimeout(nextUpdateCall);
                            clearTimeout(trafficMonitoring);
                            broadcast.unsubscribe(socket)
                        },
                    };
                })();
                // Set up the camera
                socket.camera = {
                    x: undefined,
                    y: undefined,
                    vx: 0,
                    vy: 0,
                    lastUpdate: util.time(),
                    lastDowndate: undefined,
                    fov: 2000,
                };
                // Set up the viewer
                socket.makeView = () => { socket.view = eyes(socket); };
                socket.makeView();
                // Put the fundamental functions in the socket
                socket.kick = reason => kick(socket, reason);
                socket.talk = (...message) => {
                    if (socket.readyState === socket.OPEN) { 
                        socket.send(protocol.encode(message), { binary: true, }); 
                    } 
                };
                socket.lastWords = (...message) => {
                    if (socket.readyState === socket.OPEN) { 
                        socket.send(protocol.encode(message), { binary: true, }, () => setTimeout(() => socket.terminate(), 1000));
                    } 
                };
                socket.on('message', message => incoming(message, socket));
                socket.on('close', () => { socket.loops.terminate(); close(socket); });
                socket.on('error', e => { util.log('[ERROR]:'); util.error(e); });
                // Put the player functions in the socket
                socket.spawn = name => { return spawn(socket, name); };
                // And make an update
                socket.update = time => {
                    socket.loops.cancelUpdate();
                    socket.loops.setUpdate(setTimeout(() => { socket.view.gazeUpon(); }, time)); 
                };
                // Log it
                clients.push(socket);
                util.log('[INFO] New socket opened');
                clientcount = clientcount + 1
            };
        })(),
    };
})();
/**** GAME SETUP ****/
// Define how the game lives
// The most important loop. Fast looping.
var gameloop = (() => {
    // Collision stuff
    let collide = (() => {
        function simplecollide(my, n) {
            let diff = (1 + util.getDistance(my, n) / 2) * roomSpeed;
            let a = (my.intangibility) ? 1 : my.pushability,
                b = (n.intangibility) ? 1 : n.pushability,
                c = 0.05 * (my.x - n.x) / diff,
                d = 0.05 * (my.y - n.y) / diff;
            my.accel.x += a / (b + 0.3) * c;
            my.accel.y += a / (b + 0.3) * d;
            n.accel.x -= b / (a + 0.3) * c;
            n.accel.y -= b / (a + 0.3) * d;
        }
        function firmcollide(my, n, buffer = 0) {
            let item1 = { x: my.x + my.m_x, y: my.y + my.m_y, };
            let item2 = { x: n.x + n.m_x, y: n.y + n.m_y, };
            let dist = util.getDistance(item1, item2);
            let s1 = Math.max(my.velocity.length, my.topSpeed);
            let s2 = Math.max(n.velocity.length, n.topSpeed);
            let strike1, strike2;
            if (buffer > 0 && dist <= my.realSize + n.realSize + buffer) {
                let repel = (my.acceleration + n.acceleration) * (my.realSize + n.realSize + buffer - dist) / buffer / roomSpeed;
                my.accel.x += repel * (item1.x - item2.x) / dist;
                my.accel.y += repel * (item1.y - item2.y) / dist;
                n.accel.x -= repel * (item1.x - item2.x) / dist;
                n.accel.y -= repel * (item1.y - item2.y) / dist;
            }
            while (dist <= my.realSize + n.realSize && !(strike1 && strike2)) {
                strike1 = false; strike2 = false;
                if (my.velocity.length <= s1) {
                    my.velocity.x -= 0.05 * (item2.x - item1.x) / dist / roomSpeed;
                    my.velocity.y -= 0.05 * (item2.y - item1.y) / dist / roomSpeed;
                } else { strike1 = true; }
                if (n.velocity.length <= s2) {
                    n.velocity.x += 0.05 * (item2.x - item1.x) / dist / roomSpeed;
                    n.velocity.y += 0.05 * (item2.y - item1.y) / dist / roomSpeed;
                } else { strike2 = true; }
                item1 = { x: my.x + my.m_x, y: my.y + my.m_y, };
                item2 = { x: n.x + n.m_x, y: n.y + n.m_y, };
                dist = util.getDistance(item1, item2); 
            }
        }
        function squarecollide(my, n) {
      if (n.type === "grid") {
        return;
      }
      if (n.type !== "squareWall" && n.type !== "wall") {
        if (n.settings.canGoThroughRoom !== true && n.type !== "spectator") {
          //console.log('square collide with '+n.type+' and '+my.type+' and the name of first one is '+n.label)
      /*  if (n.type === "bullet"||n.type === "crasher"||n.type === "drone"||n.type === "minion"||n.type === "swarm"||n.type === "trap"||n.type === "block"||n.type === "dominator") {
          if (my.walltype === 1 || my.walltype === 2 || my.walltype === 5 || my.walltype === 6 || my.walltype === 7 || my.walltype === 8 || my.walltype === 9 || my.walltype === 10 || my.walltype === 13 || my.walltype === 14) {
              n.opinvuln = false;
              n.invuln = false;
              n.kill()
              }
        }*/
      let grid_x = 0; // -1 or 0 or 1
      let grid_y = 0; // -1 or 0 or 1
      let dest = { x: n.x + n.m_x, y: n.y + n.m_y };
      let kill = false;
      let dealt = false;
      if (dest.x < my.x - my.size) {
        grid_x = -1;
      } else if (dest.x > my.x + my.size) {
        grid_x = 1;
      } else {
        grid_x = 0;
      }
      if (dest.y < my.y - my.size) {
        grid_y = -1;
      } else if (dest.y > my.y + my.size) {
        grid_y = 1;
      } else {
        grid_y = 0;
      }
      if (
        (grid_x === -1 && grid_y === -1) ||
        (grid_x === 1 && grid_y === -1) ||
        (grid_x === -1 && grid_y === 1) ||
        (grid_x === 1 && grid_y === 1)
      ) {
        let circle = { x: my.x + my.size * grid_x, y: my.y + my.size * grid_y };
        let dist = util.getDistance(dest, circle);
        if (dist < n.size) {
          let radian = Math.atan2(dest.x - circle.x, dest.y - circle.y);
          n.accel.x += Math.sin(radian) * (n.size - dist);
          n.accel.y += Math.cos(radian) * (n.size - dist);
          //kill = true;
        }
      } else {
        let rad = Math.atan2(n.y - my.y, n.x - my.x);
        if (rad < (-Math.PI / 4) * 3 || (Math.PI / 4) * 3 < rad) {
          // Left
          let v = my.x - my.size - n.size;
          if (v < n.x + n.m_x) {
            if (n.type === "bullet"||n.type === "crasher"||n.type === "drone"||n.type === "minion"||n.type === "swarm"||n.type === "trap"||n.type === "block"||n.type === "dominator") {
              if (my.walltype === 1 || my.walltype === 2 || my.walltype === 5 || my.walltype === 6 || my.walltype === 7 || my.walltype === 8 || my.walltype === 9 || my.walltype === 10 || my.walltype === 13 || my.walltype === 14) {
                n.destroy()
                if (grid.checkIfInHSHG(n)) {
                  grid.removeObject(n);
                }
              }
            } 
            if (my.walltype === 10) {
              n.accel.x += v - (n.x + n.m_x)+100;
            } else {
              /*if (my.walltype === 10 || my.walltype === 9 || my.walltype === 8 || my.walltype === 7 || my.walltype === 5 || my.walltype === 13 || my.walltype === 15) {
                n.accel.x += v - ((n.x + n.m_x)/1.25);
              } else {*/
                n.accel.x += v - (n.x + n.m_x);
              //}
            }
            if (my.walltype === 2 ) {
              if (n.opinvuln === false && n.invuln === false) {
                n.health.amount -= n.health.max/1.75
              }
              n.accel.x += -25
            }
            if (my.walltype === 4 ) {
              
            }
            if (my.walltype === 6 ) {
              
            }
            if (my.walltype === 3 ) {
              n.accel.x += -50
            }
            if (my.walltype === 12 ) { //greenwall
              my.accel.x += 10
            }
            //kill = true;
          }
        }
        if (-Math.PI / 4 < rad && rad < Math.PI / 4) {
          // Right
          let v = my.x + my.size + n.size;
          if (n.x + n.m_x < v) {
            if (n.type === "bullet"||n.type === "crasher"||n.type === "drone"||n.type === "minion"||n.type === "swarm"||n.type === "trap"||n.type === "block"||n.type === "dominator") {
              if (my.walltype === 1 || my.walltype === 2 || my.walltype === 5 || my.walltype === 6 || my.walltype === 7 || my.walltype === 8 || my.walltype === 9 || my.walltype === 10 || my.walltype === 13 || my.walltype === 14) {
                n.destroy()
                if (grid.checkIfInHSHG(n)) {
                  grid.removeObject(n);
                }
              }
            }
            if (my.walltype === 9) {
              n.accel.x += v - (n.x + n.m_x)-100;
            } else {
              n.accel.x += v - (n.x + n.m_x);
            }
            if (my.walltype === 2 ) {
              if (n.opinvuln === false && n.invuln === false) {
                n.health.amount -= n.health.max/1.75
              }
              n.accel.x += 25
            }
            if (my.walltype === 4 ) {
              
            }
            if (my.walltype === 5 ) {
              
            }
            if (my.walltype === 6 ) {
              
            }
            if (my.walltype === 12 ) { //greenwall
              my.accel.x += -10
            }
            if (my.walltype === 3 ) {
              n.accel.x += 50
            }
            //kill = true;
          }
        }
        if ((-Math.PI / 4) * 3 < rad && rad < -Math.PI / 4) {
          // Top
          let v = my.y - my.size - n.size;
          if (v < n.y + n.m_y) {
            if (n.type === "bullet"||n.type === "crasher"||n.type === "drone"||n.type === "minion"||n.type === "swarm"||n.type === "trap"||n.type === "block"||n.type === "dominator") {
              if (my.walltype === 1 || my.walltype === 2 || my.walltype === 5 || my.walltype === 6 || my.walltype === 7 || my.walltype === 8 || my.walltype === 9 || my.walltype === 10 || my.walltype === 13 || my.walltype === 14) {
                n.destroy()
                if (grid.checkIfInHSHG(n)) {
                  grid.removeObject(n);
                }
              }
            }
            if (my.walltype === 8) {
              n.accel.y += 100//v - (n.y + n.m_y)+190;
            } else {
              n.accel.y += v - (n.y + n.m_y);
            }
            if (my.walltype === 2 ) {
              if (n.opinvuln === false && n.invuln === false) {
                n.health.amount -= n.health.max/1.75
              }
              n.accel.y += -25
            }
            if (my.walltype === 4 ) {
              
            }
            if (my.walltype === 6 ) {
              
            }
            if (my.walltype === 3 ) {
              n.accel.y += -50
            }
            if (my.walltype === 12 ) { //greenwall
              my.accel.y += 10
            }
            //kill = true;
          }
        }
        if (Math.PI / 4 < rad && rad < (Math.PI / 4) * 3) {
          // Bottom
          let v = my.y + my.size + n.size;
          if (n.y + n.m_y < v) {
            if (n.type === "bullet"||n.type === "crasher"||n.type === "drone"||n.type === "minion"||n.type === "swarm"||n.type === "trap"||n.type === "block"||n.type === "dominator") {
              if (my.walltype === 1 || my.walltype === 2 || my.walltype === 5 || my.walltype === 6 || my.walltype === 7 || my.walltype === 8 || my.walltype === 9 || my.walltype === 10 || my.walltype === 13 || my.walltype === 14) {
                n.destroy()
                if (grid.checkIfInHSHG(n)) {
                  grid.removeObject(n);
                }
              }
            }
            if (my.walltype === 7) {
              n.accel.y += -100//v - (n.y + n.m_y)-200;
            } else {
              n.accel.y += v - (n.y + n.m_y);
            }
            if (my.walltype === 2 ) {
              if (n.opinvuln === false && n.invuln === false) {
                n.health.amount -= n.health.max/1.75
              }
              n.accel.y += 25
            }
            if (my.walltype === 4 ) {
              
            }
            if (my.walltype === 6 ) {
              
            }
            if (my.walltype === 3 ) {
              n.accel.y += 50
            }
            if (my.walltype === 12 ) { //greenwall
              my.accel.y += -10
            }
            //kill = true; 6,7,8,9,12
          }
        }
      }
    }
    }
      }
        function reflectcollide(wall, bounce) {
            let delt = new Vector(wall.x - bounce.x, wall.y - bounce.y);
            let dist = delt.length;
            let diff = wall.size + bounce.size - dist;
            if (diff > 0) {
                bounce.accel.x -= diff * delt.x / dist;
                bounce.accel.y -= diff * delt.y / dist;
                return 1;
            }
            return 0;
        }
        function customCollide(my, n, collideType) {
          if (collideType === "assembler") {
            let assemblecount = my.master.extraProperties.assemblecount
            if (my.label === n.label) {
              if (((n.assemblecount < assemblecount && my.assemblecount === undefined)||(my.assemblecount < assemblecount && n.assemblecount === undefined)||(n.assemblecount < assemblecount && my.assemblecount < assemblecount)) || n.assemblecount === undefined && my.assemblecount === undefined) {
                let pos = new Vector(my.x,my.y);
                n.kill()
                let newtrap = new Entity(pos, my.master);
                newtrap.define(my.defineset)
                let biggerentity = my
                if (n.SIZE > biggerentity.SIZE) {
                  biggerentity = n
                }
                if (my.assemblecount === undefined && n.assemblecount === undefined) {
                  newtrap.assemblecount = 0
                } else {
                  if (n.assemblecount === undefined) {
                    newtrap.assemblecount = my.assemblecount+1
                  } else {
                    if (my.assemblecount === undefined) {
                      newtrap.assemblecount = n.assemblecount+1
                    } else {
                      newtrap.assemblecount = my.assemblecount+n.assemblecount+1
                    }
                  }
                }
               /* newtrap.SIZE = biggerentity.SIZE*1.2
                newtrap.skill = biggerentity.skill
                biggerentity.master.children[biggerentity.master.children.length] = newtrap;
                newtrap.color = my.color
                newtrap.label = my.label*/
                newtrap.refreshBodyAttributes()
                if (biggerentity.gunsource !== biggerentity) {
                  biggerentity.gunsource.bulletInit(newtrap)
                }
                newtrap.HEALTH = biggerentity.HEALTH*1.1
                newtrap.SIZE = biggerentity.SIZE*1.2
                newtrap.coreSize = newtrap.SIZE
                my.kill()
              }
            }
          }
        }
        function advancedcollide(my, n, doDamage, doInelastic, nIsFirmCollide = false) {
            // Prepare to check
            let tock = Math.min(my.stepRemaining, n.stepRemaining),
                combinedRadius = n.size + my.size,
                motion = {
                    _me: new Vector(my.m_x, my.m_y),
                    _n: new Vector(n.m_x, n.m_y),
                },
                delt = new Vector(
                    tock * (motion._me.x - motion._n.x),
                    tock * (motion._me.y - motion._n.y)
                ),
                diff = new Vector(my.x - n.x, my.y - n.y),
                dir = new Vector((n.x - my.x) / diff.length, (n.y - my.y) / diff.length),
                component = Math.max(0, dir.x * delt.x + dir.y * delt.y);

            if (component >= diff.length - combinedRadius) { // A simple check
                // A more complex check
                let goahead = false,
                    tmin = 1 - tock,
                    tmax = 1,
                    A = Math.pow(delt.x, 2) + Math.pow(delt.y, 2),
                    B = 2*delt.x*diff.x + 2*delt.y*diff.y,
                    C = Math.pow(diff.x, 2) + Math.pow(diff.y, 2) - Math.pow(combinedRadius, 2),
                    det = B * B - (4 * A * C),
                    t;

                if (!A || det < 0 || C < 0) { // This shall catch mathematical errors
                    t = 0;
                    if (C < 0) { // We have already hit without moving
                        goahead = true;
                    }
                } else {
                    let t1 = (-B - Math.sqrt(det)) / (2*A),
                        t2 = (-B + Math.sqrt(det)) / (2*A);                
                    if (t1 < tmin || t1 > tmax) { // 1 is out of range
                        if (t2 < tmin || t2 > tmax) { // 2 is out of range;
                            t = false;
                        } else { // 1 is out of range but 2 isn't
                            t = t2; goahead = true;
                        }
                    } else { // 1 is in range
                        if (t2 >= tmin && t2 <= tmax) { // They're both in range!
                            t = Math.min(t1, t2); goahead = true; // That means it passed in and then out again.  Let's use when it's going in
                        } else { // Only 1 is in range
                            t = t1; goahead = true;
                        }
                    }
                }
                /********* PROCEED ********/
                if (n.type !== "spectator" && my.type !== "spectator") { // Dont do collision with spectator
                if (goahead) {
                    // Add to record
                    my.collisionArray.push(n);
                    n.collisionArray.push(my);
                    if (t) { // Only if we still need to find the collision
                        // Step to where the collision occured
                        my.x += motion._me.x * t;
                        my.y += motion._me.y * t;
                        n.x += motion._n.x * t;
                        n.y += motion._n.y * t;

                        my.stepRemaining -= t;
                        n.stepRemaining -= t;

                        // Update things
                        diff = new Vector(my.x - n.x, my.y - n.y);
                        dir = new Vector((n.x - my.x) / diff.length, (n.y - my.y) / diff.length);            
                        component = Math.max(0, dir.x * delt.x + dir.y * delt.y);
                    }
                    let componentNorm = component / delt.length;
                    /************ APPLY COLLISION ***********/
                    // Prepare some things
                    let reductionFactor = 1,
                        deathFactor = {
                            _me: 1,
                            _n: 1,
                        },
                        accelerationFactor = (delt.length) ? (
                            (combinedRadius / 4) / (Math.floor(combinedRadius / delt.length) + 1) 
                        ) : (
                            0.001
                        ),
                        depth = {
                            _me: util.clamp((combinedRadius - diff.length) / (2 * my.size), 0, 1), //1: I am totally within it
                            _n: util.clamp((combinedRadius - diff.length) / (2 * n.size), 0, 1), //1: It is totally within me
                        },
                        combinedDepth = {
                            up: depth._me * depth._n,
                            down: (1-depth._me) * (1-depth._n),
                        },
                        pen = {
                            _me: {
                                sqr: Math.pow(my.penetration, 2),
                                sqrt: Math.sqrt(my.penetration),
                            },
                            _n: {
                                sqr: Math.pow(n.penetration, 2),
                                sqrt: Math.sqrt(n.penetration),
                            },
                        },
                        savedHealthRatio = {
                            _me: my.health.ratio,
                            _n: n.health.ratio,
                        };
                    if (doDamage && ((n.type !== "squareWall" || my.type === "tank") && (my.type !== "squareWall" || n.type === "tank"))) {
                        let speedFactor = { // Avoid NaNs and infinities
                            _me: (my.maxSpeed) ? ( Math.pow(motion._me.length/my.maxSpeed, 0.25)  ) : ( 1 ),
                            _n: (n.maxSpeed) ? ( Math.pow(motion._n.length/n.maxSpeed, 0.25) ) : ( 1 ),
                        };

                        /********** DO DAMAGE *********/
                        let bail = false;
                        if (my.shape === n.shape && my.settings.isNecromancer && n.type === 'food') {
                            bail = my.necro(n);
                        } else if (my.shape === n.shape && n.settings.isNecromancer && my.type === 'food') {
                            bail = n.necro(my);
                        } 
                        if (!bail) {
                            // Calculate base damage
                            let resistDiff = my.health.resist - n.health.resist,
                                damage = {
                                    _me: 
                                        c.DAMAGE_CONSTANT * 
                                        my.damage * 
                                        (1 + resistDiff) * 
                                        (1 + n.heteroMultiplier * (my.settings.damageClass === n.settings.damageClass)) *
                                        ((my.settings.buffVsFood && n.settings.damageType === 1) ? 3 : 1 ) *
                                        my.damageMultiplier() *
                                        Math.min(2, Math.max(speedFactor._me, 1) * speedFactor._me),
                                    _n: 
                                        c.DAMAGE_CONSTANT * 
                                        n.damage * 
                                        (1 - resistDiff) * 
                                        (1 + my.heteroMultiplier * (my.settings.damageClass === n.settings.damageClass)) *
                                        ((n.settings.buffVsFood && my.settings.damageType === 1) ? 3 : 1) *
                                        n.damageMultiplier() *
                                        Math.min(2, Math.max(speedFactor._n, 1) * speedFactor._n),
                                };
                            // Advanced damage calculations
                            if (my.settings.ratioEffects) {
                                damage._me *= Math.min(1, Math.pow(Math.max(my.health.ratio, my.shield.ratio), 1 / my.penetration));
                            }
                            if (n.settings.ratioEffects) {
                                damage._n *= Math.min(1, Math.pow(Math.max(n.health.ratio, n.shield.ratio), 1 / n.penetration));
                            }
                            if (my.settings.damageEffects) {
                                damage._me *=
                                    accelerationFactor *
                                    (1 + (componentNorm - 1) * (1 - depth._n) / my.penetration) *
                                    (1 + pen._n.sqrt * depth._n - depth._n) / pen._n.sqrt; 
                            }
                            if (n.settings.damageEffects) {
                                damage._n *=
                                    accelerationFactor *
                                    (1 + (componentNorm - 1) * (1 - depth._me) / n.penetration) *
                                    (1 + pen._me.sqrt * depth._me - depth._me) / pen._me.sqrt; 
                            }
                            // Find out if you'll die in this cycle, and if so how much damage you are able to do to the other target
                            let damageToApply = {
                                _me: damage._me,
                                _n: damage._n,
                            };
                            if (n.shield.max) { 
                                damageToApply._me -= n.shield.getDamage(damageToApply._me);
                            }
                            if (my.shield.max) { 
                                damageToApply._n -= my.shield.getDamage(damageToApply._n);
                            }
                            let stuff = my.health.getDamage(damageToApply._n, false);
                            deathFactor._me = (stuff > my.health.amount) ? my.health.amount / stuff : 1;
                            stuff = n.health.getDamage(damageToApply._me, false);
                            deathFactor._n = (stuff > n.health.amount) ? n.health.amount / stuff : 1;

                                reductionFactor = Math.min(deathFactor._me, deathFactor._n);

                            // Now apply it
                            // But dont apply it if one of the types is a wall
                            if (my.type !== "wall" && n.type !== "wall") {
                              if (my.label === 'Dreadnought Portal'  && !my.plrsocket|| n.label === 'Dreadnought Portal' && !n.plrsocket || my.label === 'Dreadnought Return Portal' && !my.plrsocket || n.label === 'Dreadnought Return Portal' && !n.plrsocket || my.label === 'Portal to #z' && !my.plrsocket || n.label === 'Portal to #z' && !n.plrsocket|| my.label === 'Portal to #hv' && !my.plrsocket|| n.label === 'Portal to #hv' && !n.plrsocket || my.label === 'Portal to Forge' && !my.plrsocket || n.label === 'Portal to Forge' && !n.plrsocket) {
                              if (gamemodecode === 'w23olds6o4' || gamemodecode === 'w64armss4races3olds6o4' || my.label === 'Portal to #z' || n.label === 'Portal to #z' || my.label === 'Portal to #hv' || n.label === 'Portal to #hv' || my.label === 'Portal to Forge' || n.label === 'Portal to Forge') {
                              if (my.label === 'Dreadnought Portal' && n.label !== my.label) {
                              if (n.type !== 'bullet' && n.type !== 'drone' && n.type !== 'minion') {
                              n.sendMessage('Ascending to the maze...')
                              let chancesX = [5934, 2063, 2084, 9726, 9849]
                              let chancesY = [5979, 9815, 2120, 2171, 9897]
                              let randomX = chancesX[Math.floor(Math.random() * chancesX.length)];
                              let randomY = chancesY[Math.floor(Math.random() * chancesY.length)];
                              n.x = randomX
                              n.y = randomY
                              my.skill.score += n.skill.score
                              }
                              }
                              if (n.label === 'Dreadnought Portal' && my.label !== n.label) {
                              if (my.type !== 'bullet' && my.type !== 'drone' && my.type !== 'minion') {
                              my.sendMessage('Ascending to the maze...')
                              let chancesX = [5934, 2063, 2084, 9726, 9849]
                              let chancesY = [5979, 9815, 2120, 2171, 9897]
                              let randomX = chancesX[Math.floor(Math.random() * chancesX.length)];
                              let randomY = chancesY[Math.floor(Math.random() * chancesY.length)];
                              my.x = randomX
                              my.y = randomY
                              n.skill.score += my.skill.score
                              }
                              }
                              if (my.label === 'Portal to #z' && !my.plrsocket && n.label !== my.label) {
                              if (n.plrsocket) {
                              n.plrsocket.talk("goTo", "hvbutpssandbox.glitch.me")
                              setTimeout(() => {
                              n.kill()
                              }, 0);
                              }
                              }
                              if (my.label === 'Portal to Forge' && !my.plrsocket && n.label !== my.label) {
                                if (n.plrsocket && n.skill.score > 185649) {
                                n.plrsocket.talk("goTo", "like-basalt-spot.glitch.me")
                                setTimeout(() => {
                                n.kill()
                                }, 0);
                                } else {
                                  n.accel.x -= Math.min(n.x - n.realSize + 50, 0) * 0.005 / roomSpeed;
                                  n.accel.x -= Math.max(n.x + n.realSize - my.SIZE - 50, 0) * 0.005 / roomSpeed;
                                  n.accel.y -= Math.min(n.y - n.realSize + 50, 0) * 0.005 / roomSpeed;
                                  n.accel.y -= Math.max(n.y + n.realSize - my.SIZE - 50, 0) * 0.005 / roomSpeed;
                                  n.sendMessage('You must be at least level 90 to enter forge! Try getting level 90, waiting for a portal to spawn, then try again.')
                                }
                                }
                                if (n.label === 'Portal to Forge' && !n.plrsocket && my.label !== n.label) {
                                  if (my.plrsocket && my.skill.score > 185649) {
                                  my.plrsocket.talk("goTo", "like-basalt-spot.glitch.me")
                                  setTimeout(() => {
                                  my.kill()
                                  }, 0);
                                  } else {
                                    my.accel.x -= Math.min(my.x - my.realSize + 50, 0) * c.ROOM_BOUND_FORCE / roomSpeed;
                                    my.accel.x -= Math.max(my.x + my.realSize - n.SIZE - 50, 0) * c.ROOM_BOUND_FORCE / roomSpeed;
                                    my.accel.y -= Math.min(my.y - my.realSize + 50, 0) * c.ROOM_BOUND_FORCE / roomSpeed;
                                    my.accel.y -= Math.max(my.y + my.realSize - n.SIZE - 50, 0) * 0.005 / roomSpeed;
                                    my.sendMessage('You must be at least level 90 to enter forge! Try getting level 90, waiting for a portal to spawn, then try again.')
                                  }
                                  }
                              if (n.label === 'Portal to #z' && !n.plrsocket && my.label !== n.label) {
                                if (my.plrsocket) {
                                my.plrsocket.talk("goTo", "hvbutpssandbox.glitch.me")
                                setTimeout(() => {
                                my.kill()
                                }, 0);
                                }
                                }
                                if (my.label === 'Portal to #hv' && !my.plrsocket && n.label !== my.label) {
                                  if (n.plrsocket) {
                                  n.plrsocket.talk("goTo", "hvbutps.glitch.me")
                                  setTimeout(() => {
                                  n.kill()
                                  }, 0);
                                  }
                                  }
                                  if (n.label === 'Portal to #hv' && !n.plrsocket && my.label !== n.label) {
                                    if (my.plrsocket) {
                                    my.plrsocket.talk("goTo", "hvbutps.glitch.me")
                                    setTimeout(() => {
                                    my.kill()
                                    }, 0);
                                    }
                                    }
                              if (my.label === 'Dreadnought Return Portal' && n.label !== my.label) {
                              if (n.type !== 'bullet' && n.type !== 'drone' && n.type !== 'minion') {
                              n.sendMessage('Descending to the arena...')
                              let chancesX = [30036, 25544, 25542, 34389, 34484]
                              let chancesY = [6209, 10458, 1587, 1614, 10505]
                              let randomX = chancesX[Math.floor(Math.random() * chancesX.length)];
                              let randomY = chancesY[Math.floor(Math.random() * chancesY.length)];
                              n.x = randomX
                              n.y = randomY
                              my.skill.score += n.skill.score
                              }
                              }
                              if (n.label === 'Dreadnought Return Portal' && my.label !== n.label) {
                                if (my.type !== 'bullet' && my.type !== 'drone' && my.type !== 'minion') {
                                my.sendMessage('Descending to the arena...')
                                let chancesX = [30036, 25544, 25542, 34389, 34484]
                              let chancesY = [6209, 10458, 1587, 1614, 10505]
                              let randomX = chancesX[Math.floor(Math.random() * chancesX.length)];
                              let randomY = chancesY[Math.floor(Math.random() * chancesY.length)];
                              my.x = randomX
                              my.y = randomY
                                n.skill.score += my.skill.score
                                }
                                }
                              }
                              }
                              my.damageRecieved += damage._n * deathFactor._n;
                              n.damageRecieved += damage._me * deathFactor._me;
                            }
                        }
                    }
                    /************* DO MOTION ***********/ 
                    if (n.settings.canGoThroughRoom !== true && my.settings.canGoThroughRoom !== true) {
                    if (nIsFirmCollide < 0) {
                        nIsFirmCollide *= -0.5;
                        my.accel.x -= nIsFirmCollide * component * dir.x;
                        my.accel.y -= nIsFirmCollide * component * dir.y;
                        n.accel.x += nIsFirmCollide * component * dir.x;
                        n.accel.y += nIsFirmCollide * component * dir.y;
                    } else if (nIsFirmCollide > 0) {
                        n.accel.x += nIsFirmCollide * (component * dir.x + combinedDepth.up);
                        n.accel.y += nIsFirmCollide * (component * dir.y + combinedDepth.up);
                    } else {
                         // Calculate the impulse of the collision
                        let elasticity = 2 - 4 * Math.atan(my.penetration * n.penetration) / Math.PI; 
                        if (doInelastic && my.settings.motionEffects && n.settings.motionEffects) {
                            elasticity *= savedHealthRatio._me / pen._me.sqrt + savedHealthRatio._n / pen._n.sqrt;
                        } else {
                            elasticity *= 2;
                        }
                        let spring = 2 * Math.sqrt(savedHealthRatio._me * savedHealthRatio._n) / roomSpeed,
                            elasticImpulse = 
                                Math.pow(combinedDepth.down, 2) * 
                                elasticity * component * 
                                my.mass * n.mass / (my.mass + n.mass),
                            springImpulse = 
                                c.KNOCKBACK_CONSTANT * spring * combinedDepth.up,   
                            impulse = -(elasticImpulse + springImpulse) * (1 - my.intangibility) * (1 - n.intangibility),
                            force = {
                                x: impulse * dir.x,
                                y: impulse * dir.y,
                            },
                            modifiers = {
                                _me: c.KNOCKBACK_CONSTANT * my.pushability / my.mass * deathFactor._n,
                                _n: c.KNOCKBACK_CONSTANT * n.pushability / n.mass * deathFactor._me,
                            };
                        // Apply impulse as force
                        my.accel.x += modifiers._me * force.x;
                        my.accel.y += modifiers._me * force.y;
                        n.accel.x -= modifiers._n * force.x;
                        n.accel.y -= modifiers._n * force.y;
                    }
                  }
                }
                }
            }
        }
        // The actual collision resolution function
        return collision => {
            // Pull the two objects from the collision grid      
            let instance = collision[0],
                other = collision[1];   
            // Check for ghosts...
            if (other.isGhost) {
                if (grid.checkIfInHSHG(other)) {
                  grid.removeObject(other);
                }
                return 0;
            }
            if (instance.isGhost) {
                if (grid.checkIfInHSHG(instance)) {
                    grid.removeObject(instance);
                }
                return 0;
            }
            if (!instance.activation.check() && !other.activation.check()) { util.warn('Tried to collide with an inactive instance.'); return 0; }
            // Handle walls
            if (instance.type === 'wall' || other.type === 'wall') {
                let a = (instance.type === 'bullet' || other.type === 'bullet') ? 
                    1 + 10 / (Math.max(instance.velocity.length, other.velocity.length) + 10) : 
                    1;
                if (instance.type === 'wall') {if (other.type !== "squareWall" && other.type !== "wall") {advancedcollide(instance, other, false, false, a);}}
                else if (instance.type !== "squareWall" && instance.type !== "wall") {advancedcollide(other, instance, false, false, a);}
            } else
            if (instance.type === "squareWall" || other.type === "squareWall") {
              if (instance.type !== "wall" && other.type !== "wall") {
                if (instance.type === "squareWall") {if (instance.type === 'squareWall' && other.type === 'squareWall') {} else {squarecollide(instance, other);}}
              else {if (instance.type === 'squareWall' && other.type === 'squareWall') {} else {squarecollide(other, instance);}}
              }
            }
            // If they can firm collide, do that
            if ((instance.type === 'crasher' && other.type === 'food') || (other.type === 'crasher' && instance.type === 'food')) {
                firmcollide(instance, other);
            } else
            // Otherwise, collide normally if they're from different teams
            //if (instance.team !== other.team) { // actually collide normally on same teams too
            if (instance.type !== 'squareWall' && instance.type !== 'wall') {
                if (instance.team !== other.team) {
                  if (other.type !== 'squareWall') {
                    if (other.donthit !== true && instance.donthit !== true) {
                      advancedcollide(instance, other, true, true);
                    }
                  } else if (other.walltype !== 7 && other.walltype !== 8 && other.walltype !== 9 && other.walltype !== 10 && other.walltype !== 13 && other.walltype !== 5 && other.walltype !== 11 && other.walltype !== 15) {
                    if (other.donthit !== true && instance.donthit !== true) {
                      advancedcollide(instance, other, true, true);
                    }
                  }
                } else // if 2 tanks on the same team do firmCollide
                  if (other.type === 'tank' && instance.type === 'tank') {
                  firmcollide(instance, other);
                } else // Healer bullets
                  if (other.hitownteam === true || instance.hitownteam === true) {
                    if (other.master.id !== instance.id && instance.master.id !== other.id) {
                      advancedcollide(instance, other, true, true);
                    }
                } else {
                  // Ignore them if either has asked to be
                  if (instance.settings.hitsOwnType == 'never' || other.settings.hitsOwnType == 'never') {
                    // Do jack                    
                  } else 
                  // Standard collision resolution
                  if (instance.settings.hitsOwnType === other.settings.hitsOwnType) {
                    switch (instance.settings.hitsOwnType) {
                      case 'push': advancedcollide(instance, other, false, false); break;
                      case 'hard': firmcollide(instance, other); break;
                      case 'hardWithBuffer': firmcollide(instance, other, 30); break;
                      case 'repel': simplecollide(instance, other); break;
                      default: customCollide(instance, other, instance.settings.hitsOwnType); break;
                    }
                  }
                }
            }     
        };
    })();
    // Living stuff
    function entitiesactivationloop(my) {
        // Update collisions.
        my.collisionArray = []; 
        // Activation
        my.activation.update();
        my.updateAABB(my.activation.check()); 
    }
    function entitiesliveloop (my) {
        // Consider death.  
        if (my.contemplationOfMortality()) {
          if (OUTBREAK === true) {
            if (my.zombie === false && my.type === 'tank' && !my.label.includes('Bacteria')) {
              let originalhealth = my.HEALTH;
              if (my.plrsocket !== 0) { // leave zombie body
                let e = new Entity({x:NaN, y:NaN});
                e.define(Class.basic);
                e.leaderboardable = false;
                e.skill = my.skill;
                e.define({CAN_BE_ON_LEADERBOARD: true})
                e.label = 'You got zombified!';
                my.plrsocket.player.body = e;
                e.zombie = true;
                setTimeout(() => { 
                  e.destroy();
                },33.33)
              }
              my.invuln = true;
              my.color = 16
              my.zombie = true;
              my.health.amount = my.health.max
              if (SIEGE===true){my.team=-100} else {
              my.team = -102}
              my.HEALTH = my.HEALTH * 7
              my.control = {
                target: new Vector(0, 0),
                goal: new Vector(0, 0),
                main: false,
                alt: 0,
                fire: false,
                power: 0,
              };
              my.plrsocket = 0
              setTimeout(() => {
                my.invuln = false;
                my.HEALTH = originalhealth/1.25;
                my.color = 41;
                if (SIEGE === true) {
                  my.define({CONTROLLERS: ['nearestDifferentMaster', 'mapAltToFire', 'mapTargetToGoal', 'hangOutNearMaster2', 'minion']})
                } else {
                my.define({CONTROLLERS: ['nearestDifferentMaster', 'mapAltToFire', 'mapTargetToGoal', 'minion', 'hangOutNearMaster2', 'bot']})
                }
                my.aiSettings.blind = true
                if (my.label === 'Factory') {my.define(Class.zfactory)
                my.define({ FACING_TYPE: 'looseToTarget' })
                for (let child of my.children) {child.team = my.team}
                } else if (my.label === 'Mandarin') {my.define(Class.zmandarin)
                    my.define({ FACING_TYPE: 'looseToTarget' })
                    for (let child of my.children) {child.team = my.team;}
                } else if (my.label === 'Barricade') {my.define(Class.zminitrap)
                  my.define({ FACING_TYPE: 'looseToTarget' })
              } else if (my.label === 'Spawner') {my.define(Class.zlilfact)
                my.define({ FACING_TYPE: 'looseToTarget' })
                for (let child of my.children) {child.team = my.team;}
            } else {
                my.define({ FACING_TYPE: 'looseToTarget' })
                }
                my.isTurret = true
                my.addController(new io_nearestDifferentMaster(my));
                my.addController(new io_mapAltToFire(my));  
                my.addController(new io_minion(my));
                my.addController(new io_mapTargetToGoal(my));
                if (SIEGE !== true) {
                my.addController(new io_bot(my));
                }
                my.source = zombieMaster;
                my.addController(new io_hangOutNearMaster2(my))
              },2000)
            } else {
              if (my.extraProperties.revived === false) {
                my.ondead()
                my.destroy()
              } else my.plrsocket = 0; my.invuln = true; my.zombie = false; my.health.amount = my.health.max;
            }
          } else {
            my.ondead()
            my.destroy();
          }
        }
        else {
            if (my.bond == null) { 
                // Resolve the physical behavior from the last collision cycle.
                logs.physics.set();
                my.physics();
                logs.physics.mark();
            }
            if (my.activation.check()) {
                logs.entities.tally();
                // Think about my actions.
                logs.life.set();
                my.life();
                logs.life.mark();
                // Apply friction.
                my.friction();
                my.confinementToTheseEarthlyShackles();
                logs.selfie.set();
                my.takeSelfie();
                logs.selfie.mark();
            }
        }
        // Update collisions.
        my.collisionArray = []; 
    }
    let time;
    // Return the loop function
    return () => {
        logs.loops.tally();
        logs.master.set();
        logs.activation.set();
            entities.forEach(e => entitiesactivationloop(e));
        logs.activation.mark();
        // Do collisions
        logs.collide.set();
        if (entities.length > 1) {
            // Load the grid
            grid.update();
            // Run collisions in each grid
            grid.queryForCollisionPairs().forEach(collision => collide(collision));
        }
        logs.collide.mark();
        // Do entities life
        logs.entities.set();
            entities.forEach(e => entitiesliveloop(e));
        logs.entities.mark();
        logs.master.mark();
        // Remove dead entities
        purgeEntities();
        room.lastCycle = util.time();
    };
    //let expected = 1000 / c.gameSpeed / 30;
    //let alphaFactor = (delta > expected) ? expected / delta : 1;
    //roomSpeed = c.gameSpeed * alphaFactor;
    //setTimeout(moveloop, 1000 / roomSpeed / 30 - delta); 
})();
setInterval(() => {
  let portal = new Entity(room.randomType('norm'))
  let randomchoice = [Class.nexusportal1, Class.nexusportal0, Class.nexusportal2]
  portal.define(randomchoice[Math.floor(Math.random() * randomchoice.length)])
  //portal.skill.score = 26256; 
  //portal.name = portal.label
  let url
                      switch(portal.label) {
                      case 'Portal to #hv':
                      url = 'https://hvbutps.glitch.me/'
                      break;
                      case 'Portal to #z':
                      url = 'https://hvbutpssandbox.glitch.me/'
                      break;
                      case 'Portal to Forge':
                      url = 'https://like-basalt-spot.glitch.me/'
                      break;
                      default: url = 'Unknown'
                      }
                      if (url !== 'Unknown') {
                      fetch(url+'gamemode')
     .then(response => response.text())
     .then(data => {
      if (!data) {portal.name = 'Unknown'} else {
      portal.name = gamecode_name(data);
      }
        if (gamecode_name(data) === 'Unknown') {
let m = setInterval(() => { // I prefer not getting people to crash saying "what's unknown portal? where does it lead to? i wanna go in..", instead just kill the portal before anyone sees
if (portal) {
portal.killl();
} else clearInterval(m);
}, 0);
}
     })
     .catch(error => {
       console.error(error);
     });
    }
  setTimeout(() => {
  let m = setInterval(() => {
  if (portal) {portal.kill()} else clearInterval(m)
  }, 0);
  }, 30000);
  }, 60000);
//Dreadnought Shapes
function spawnshapeslol() {
  if (dredshapes < 89) {
  let random = ran.randomRange(1,2454100)
  dredshapes = dredshapes+1
  //sockets.broadcast('dredshapes: '+dredshapes, 'gold')
  let shape = Class.bigPentagon;
  if (random > 1500000) {
    shape = Class.hugePentagon;
    if (random > 2000000) {
      shape = Class.square;
      if (random > 2250000) {
        shape = Class.gem;
        if (random > 2310000) {
          shape = Class.greenpentagon;
          if (random > 2350000) {
            shape = Class.greenhugePentagon;
            if (random > 2400000) {
              shape = Class.cyansquare;
              if (random > 2425000) {
                shape = Class.cyanpentagon;
                if (random > 2440000) {
                  shape = Class.blacksquare;
                  if (random > 2450000) {
                    shape = Class.cyanhugePentagon;
                    if (random > 2452000) {
                      shape = Class.blackpentagon;
                      if (random > 2452500) {
                        shape = Class.blackhugePentagon;
                        if (random > 2453000) {
                          shape = Class.rainbowsquare;
                          if (random > 2453400) {
                            shape = Class.rainbowtriangle;
                            if (random > 2453700) {
                              shape = Class.rainbowpentagon;
                              if (random > 2453900) {
                                shape = Class.rainbowbigPentagon;
                                if (random > 2454000) {
                                  shape = Class.rainbowhugePentagon;
                                  if (random > 2454034) {
                                    shape = Class.cube;
                                    if (random > 2454067) {
                                      shape = Class.icosahedron;
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  let newshape = new Entity(room.randomv2(12000,12000))
  newshape.define(shape)
  newshape.team = -100
  newshape.dredshape = true
  }
}

function gameloop2() {
  // Command block i guess
  for (let e of commandwalls) {
        if (e.commandblock) {
          let string = e.commandblock.split(' ')
          if (e.command === undefined) {
            e.command = 0
          }
          //$CB loop -50:0 0:50 50:0 0:-50
          let startingcode = 2;
          let codelength = string.length - startingcode
          let cbtype = string[1]
          if (string[1] === 'touch') {
            startingcode = 3
          }
          if (string[1] === 'loop') {
           startingcode = 2
           e.accel.x = Math.floor(string[startingcode+e.command].split(':')[0])
           e.accel.y = Math.floor(string[startingcode+e.command].split(':')[1])
           e.command += 1
           if (e.command > (codelength-1)) {
             e.command = 0
           }
          }
        }
      }
}
// A less important loop. Runs at an actual 5Hz regardless of game speed.
var maintainloop = (() => {
    // Place obstacles
    function placeRoids() {
        function placeRoid(type, entityClass) {
            let x = 0;
            let position;
            do { position = room.randomType(type); 
                x++;
                if (x>200) { util.warn("Could not place some roids."); return 0; }
            } while (dirtyCheck(position, 10 + entityClass.SIZE));
            let o = new Entity(position);
                o.define(entityClass);
                o.team = -101;
                o.facing = ran.randomAngle();
                o.protect();
                o.life();
        }
        // Start placing them
        let roidcount = room.roid.length * room.width * room.height / room.xgrid / room.ygrid / 50000 / 1.5;
        let rockcount = room.rock.length * room.width * room.height / room.xgrid / room.ygrid / 250000 / 1.5;
        let count = 0;
        for (let i=Math.ceil(roidcount); i; i--) { count++; placeRoid('roid', Class.obstacle); }
        if (gamemodeoriginal !== "w37pumpkins5patch") {
          for (let i=Math.ceil(roidcount * 0.3); i; i--) { count++; placeRoid('roid', Class.babyObstacle); }
        }
        for (let i=Math.ceil(rockcount * 0.8); i; i--) { count++; placeRoid('rock', Class.obstacle); }
        for (let i=Math.ceil(rockcount * 0.5); i; i--) { count++; placeRoid('rock', Class.babyObstacle); }
        for (let i=Math.ceil(rockcount * 0.8); i; i--) { count++; placeRoid('rock', Class.obstacle); }
        util.log('Placing ' + count + ' obstacles!');
    }
    placeRoids();
    // pumpkins
    if (gamemodeoriginal === "w37pumpkins5patch") {
        for (let my of entities) {
          if (my.type === "wall") {
              let mysize = Class.babyObstacle.SIZE
              my.define(Class.pumpkinobstacle)
              my.define({SIZE: mysize, VARIES_IN_SIZE: true})
          }
        }
    }
    // Spawning functions
    let spawnBosses = (() => {
        let timer = 0;
        let boss = (() => {
            let i = 0,
                names = [],
                bois = [Class.egg],
                n = 0,
                begin = 'yo some shit is about to move to a lower position',
                arrival = 'Something happened lol u should probably let Neph know this broke',
                loc = 'norm';
            let spawn = () => {
                let spot, m = 0;
                do {
                    spot = room.randomType(loc); m++;
                } while (dirtyCheck(spot, 500) && m<30);
                let o = new Entity(spot);
                    o.define(ran.choose(bois));
                    o.team = -100;
                    o.name = names[i++];
            };
            return {
                prepareToSpawn: (classArray, number, nameClass, typeOfLocation = 'norm') => {
                    n = number;
                    bois = classArray;
                    loc = typeOfLocation;
                    names = ran.chooseBossName(nameClass, number);
                    i = 0;
                    if (n === 1) {
                        begin = 'A visitor is coming.';
                        arrival = names[0] + ' has arrived.'; 
                    } else {
                        begin = 'Visitors are coming.';
                        arrival = '';
                        for (let i=0; i<n-2; i++) arrival += names[i] + ', ';
                        arrival += names[n-2] + ' and ' + names[n-1] + ' have arrived.';
                    }
                },
                spawn: () => {
                    sockets.broadcast(begin);
                    for (let i=0; i<n; i++) {
                        setTimeout(spawn, ran.randomRange(3500, 5000));
                    }
                    // Wrap things up.
                    setTimeout(() => sockets.broadcast(arrival), 5000);
                    util.log('[SPAWN] ' + arrival);
                },
            };
        })();
        return census => {
            if (timer > 6000 && ran.dice(16000 - timer)) {
                util.log('[SPAWN] Preparing to spawn...');
                timer = 0;
                let choice = [];
                switch (ran.chooseChance(40, 1)) {
                    case 0: 
                        choice = [[Class.elite_destroyer], 2, 'a', 'nest'];
                        break;
                    case 1: 
                        choice = [[Class.palisade], 1, 'castle', 'norm']; 
                        sockets.broadcast('A strange trembling...');
                        break;
                    case 2: 
                        choice = [[Class.elite], 1, 'castle', 'norm']; 
                        sockets.broadcast('Do you believe in Ragnarok? Jk it not rangarok.');
                        break;
                }
                boss.prepareToSpawn(...choice);
                setTimeout(boss.spawn, 3000);
                // Set the timeout for the spawn functions
            } else if (!census.miniboss) timer++;
        };
    })();
    
    let spawnCrasher = census => {
        if (ran.chance(1 -  0.5 * census.crasher / room.maxFood / room.nestFoodAmount)) {
          if (NOCRASHERS === false) {
            let spot, i = 30;
            do { spot = room.randomType('nest'); i--; if (!i) return 0; } while (dirtyCheck(spot, 100));
            let type = (ran.dice(80)) ? ran.choose([Class.sentryGun, Class.sentrySwarm, Class.sentryTrap]) : Class.crasher;
            let o = new Entity(spot);
                o.define(type);
                o.team = -100;
            }
        }
    };
    // The NPC function
    let makenpcs = (() => {
            let f = (loc, team) => { 
                let o = new Entity(loc);
                    o.define(Class.baseProtector);
                    o.team = -team;
                    o.color = [10, 11, 12, 15][team-1];
                    o.coreSize = o.SIZE;
                 o.ondead = () => {
                   f(loc,team);
                 };
            };
            for (let i=1; i<5; i++) {
                room['bas' + i].forEach((loc) => {
                  f(loc, i); 
                }); 
            }
            // Magic Maze Relics
            if (MAGIC_MAZE === true) {
              let spawnRelic = location => {
                    let relictypes = ['squareRelic','squareRelic','squareRelic','squareRelic','squareRelic','squareRelic','squareRelic','squareRelic','squareRelic','triangleRelic','triangleRelic','triangleRelic','triangleRelic','triangleRelic','triangleRelic','pentagonRelic','pentagonRelic','pentagonRelic','pentagonRelic','pentagonRelic','pentagonRelic','betaRelic','betaRelic','alphaRelic'] // Relic chances
                    let relictype = relictypes[Math.floor(Math.random() * relictypes.length)]
                    let o = new Entity(location)
                      o.team = -100
                      o.define(Class[relictype])
                      util.log('New '+relictype+' has entered this realm!')
                      o.ondead = () => {
                        let relloc2 = room.random()
                        spawnRelic(relloc2)
                  }
                }
              /*let spawnRelic = location => {
              let o = new Entity(location)
                o.define(Class.squareRelic)
                o.team -100
                util.log('New relic has entered this realm!')
                // on relic death
                o.ondead = () => {
                  let relloc2 = new Vector(1,1)//dirtyCheck(room.random(), 50)
                  spawnRelic2(relloc2)
                  let relic = entities.find(r => r.label === 'Relic' || r.label === 'Shiny Relic')
                  relic.ondead = () => {
                      spawnRelic2(relloc2)
                  }
                }
              }*/
              // spawn first relic
              let relloc = room.random()//new Vector(1,1)
              spawnRelic(relloc)
              let relic = entities.find(r => r.label === 'Relic' || r.label === 'Shiny Relic')
              console.log(relic.x, relic.y)
              relic.ondead = () => {
                let relloc2 = room.random()//dirtyCheck(room.random(), 50)
                spawnRelic(relloc2)
              }
            }
            let g = (loc) => { 
                let o = new Entity(loc);
                    o.define(Class.dominator1);
                    o.team = -100;
                    o.color = 3;
                    o.addController(new io_nearestDifferentMaster(o))
            };
            let m1 = (loc) => { 
                let o = new Entity(loc);
                    o.define(Class.mothership);
                    o.team = -1;
                    o.color = 10;
                    o.addController(new io_nearestDifferentMaster(o))
            };
            let m2 = (loc) => { 
                let o = new Entity(loc);
                    o.define(Class.mothership);
                    o.team = -2;
                    o.color = 11;
                    o.addController(new io_nearestDifferentMaster(o))
            };
            let s = (loc) => { 
                let o = new Entity(loc);
                    if (WINTER_MAYHEM === true) {
                      o.define(Class.sanctuarymayhem1);
                    } else {
                      o.define(Class.sanctuary1);
                    }
                    o.team = -1;
                    o.color = 10;
                    o.addController(new io_nearestDifferentMaster(o))
            };
            let s2 = (loc) => { 
                let o = new Entity(loc);
                    o.define(Class.sanctuary2);
                    o.team = -2;
                    o.color = 11;
                    o.addController(new io_nearestDifferentMaster(o))
            };
            room['domx'].forEach((loc) => { g(loc); }); 
            let atmgr = (loc) => { 
                let o = new Entity(loc);
                    o.define(Class.atmgbot);
                    o.team = -100;
                    o.color = 12;
            };
            room['dbc1'].forEach((loc) => { s(loc); }); 
            room['dbc2'].forEach((loc) => { s2(loc); });
            room['mot1'].forEach((loc) => { m1(loc); });
            room['mot2'].forEach((loc) => { m2(loc); });
            room['atmg'].forEach((loc) => { atmgr(loc); }); 
            let placewall = true
                let w = (loc) => { 
                let o = new Entity(loc);
                    o.define(Class.wall);
                    o.SIZE = width2/xgrid/2;
                    o.coreSize = o.SIZE;
                    o.invuln = true;
                    o.team = -101;
                    o.color = 16;
                };
                      let b= (loc) => { 
                let o = new Entity(loc);
                    o.define(Class.soccerball);
                    o.coreSize = o.SIZE;
                    o.team = -100;
                };
            room['wall'].forEach((loc) => {w(loc)})
          room['ball'].forEach((loc) => {b(loc)})
                room['walr'].forEach((loc) => {
                if (placewall === true) {
                  w(loc);
                }
                let randomnumber = Math.floor(Math.random() * 3);
                if (randomnumber === 0) {
                  placewall = true
                 } else {
                  placewall = false
                }
        });
        // Real maze generation
        if (MAZETYPE != -1) {
          let wall = (loc,size) => { 
                let o = new Entity(loc);
                    o.define(Class.wall);
                    o.SIZE = size;
                    o.coreSize = o.SIZE;
                    o.invuln = true;
                    o.team = -101;
                    o.color = 16;
                    if (MAGIC_MAZE === true) { // magic maze walls
                      let magicwall = Math.floor(ran.randomRange(0,2))
                      if (magicwall === 1) {
                        let walltype = Math.floor(ran.randomRange(0,8))
                        let wallsettings = walltypes[walltype]
                        let oldsize = o.SIZE;
                        o.define(Class[wallsettings.class])
                        o.walltype = walltype+1
                        o.SIZE = oldsize;
                        o.coreSize = o.SIZE;
                        o.color = wallsettings.color;
                        o.label = wallsettings.label;
                        o.alpha = wallsettings.alpha;
                      }
                    }
          };
          if (MAZETYPE === "corn") {
            let wallcountx = -1 // wallcountx is just a x pos of a wall
            let wallcounty = 0 // same about wallcounty
            arrasmaze['maze'+MAZETYPE].map.array.forEach((loc) => {
              wallcountx = wallcountx+1
              if (wallcountx > 40) {
                wallcountx = 0
                wallcounty = wallcounty + 1
              } 
              //loc in corn maze is just a boolean (wall placed/wall not placed)
              if (loc === 0) {
                let wallplace = loc;
                let smallerlength = MAZEX_GRID
                let smallersize = width2
                if (smallersize > height2) {
                  smallersize = height2
                }
                if (MAZEX_GRID > MAZEY_GRID) {
                  smallerlength = MAZEY_GRID
                }
                let wallsize = CORNMAZESIZE/smallerlength/2;
                let wallx = wallcountx;
                let wally = wallcounty;
                let wallpos = maze.locWallCorn({x: wallx, y: wally},wallsize,CORNMAZESIZE,CORNMAZESIZE)
                if (CORNMAZE_ROOMS === true) {
                  let caniplaceit = true
                  if (wallx > 3) {if (wallx < 11) { if (wally > 3) {if (wally < 11) {
                    caniplaceit = false
                  }}}}
                  if (wallx > 3) {if (wallx < 37) { if (wally === 10) {
                    caniplaceit = false
                  }}}
                  if (wallx > 29) {if (wallx < 37) { if (wally > 3) {if (wally < 11) {
                    caniplaceit = false
                  }}}}
                  if (wally > 3) {if (wally < 37) { if (wallx === 10) {
                    caniplaceit = false
                  }}}
                  if (wally > 3) {if (wally < 37) { if (wallx === 30) {
                    caniplaceit = false
                  }}}
                  if (wallx > 3) {if (wallx < 11) { if (wally > 29) {if (wally < 37) {
                    caniplaceit = false
                  }}}}
                  if (wallx > 29) {if (wallx < 37) { if (wally > 29) {if (wally < 37) {
                    caniplaceit = false
                  }}}}
                  if (wallx > 3) {if (wallx < 37) { if (wally === 30) {
                    caniplaceit = false
                  }}}
                  if (wallx > 15) {if (wallx < 25) { if (wally > 15) {if (wally < 25) {
                    caniplaceit = false
                  }}}}
                  if (caniplaceit === true) {
                    wall(wallpos, wallsize)
                  }
                } else {
                  wall(wallpos, wallsize)
                }
              }
            })
          } else {
            //console.log(arrasmaze['maze'+MAZETYPE].MAZEWALLS[0].squares)
            mazemap.MAZEWALLS[0].squares.forEach((loc) => {
            let wallsettings = loc
            let smallerlength = MAZEX_GRID
            let smallersize = width2
            if (smallersize > height2) {
                  smallersize = height2
            }
            if (MAZEX_GRID > MAZEY_GRID) {
              smallerlength = MAZEY_GRID
            }
            let wallsize = smallersize/smallerlength/2*wallsettings.size
            let wallpos = maze.locWall({x: wallsettings.x, y: wallsettings.y},wallsize)
            wall(wallpos, wallsize)
            })
          }
        }
        // Return the spawning function
        let bots = [];
        return () => {
            let census = {
                crasher: 0,
                miniboss: 0,
                tank: 0,
            };    
            let npcs = entities.map(function npcCensus(instance) {
                if (census[instance.type] != null) {
                    census[instance.type]++;
                    return instance;
                }
            }).filter(e => { return e; });    
            // Spawning
            if (FOODSPAWN === true) {
              spawnCrasher(census);
            }
            if (FOODSPAWN === true) {
              spawnBosses(census);
            }
            /*/ Bots
                if (bots.length < c.BOTS) {
                    let o = new Entity(room.random());
                    o.color = 17;
                    o.define(Class.bot);
                    o.define(Class.basic);
                    o.name += ran.chooseBotName();
                    o.refreshBodyAttributes();
                    o.color = 17;
                    bots.push(o);
                }
                // Remove dead ones
                bots = bots.filter(e => { return !e.isDead(); });
                // Slowly upgrade them
                bots.forEach(o => {
                    if (o.skill.level < 45) {
                        o.skill.score += 35;
                        o.skill.maintain();
                    }
                });*/
            
        };
    })();
    // The big food function
    let makefood = (() => {
        let food = [], foodSpawners = [];
        // The two essential functions
        function getFoodClass(level) {
            let a = { };
            switch (level) {
                case 0: a = Class.egg; break;
                case 1: a = Class.square; break;
                case 2: a = Class.triangle; break;
                case 3: a = Class.pentagon; break;
                case 4: a = Class.bigPentagon; break;
                case 5: a = Class.hugePentagon; break;
                default: throw('bad food level');
            }
            if (a !== {}) {
                a.BODY.ACCELERATION = 0.015 / (a.FOOD.LEVEL + 1);
            }
            return a;
        }
        let placeNewFood = (position, scatter, level, allowInNest = false) => {
            let o = nearest(food, position); 
            let mitosis = false;
            let seed = false;
            // Find the nearest food and determine if we can do anything with it
            if (o != null) {
                for (let i=50; i>0; i--) {
                    if (scatter == -1 || util.getDistance(position, o) < scatter) {
                        if (ran.dice((o.foodLevel + 1) * (o.foodLevel + 1))) {
                            mitosis = true; break;
                        } else {
                            seed = true; break;
                        }
                    }
                }
            }
            // Decide what to do
            if (scatter != -1 || mitosis || seed) {
                // Splitting
                if (o != null && (mitosis || seed) && room.isIn('nest', o) === allowInNest) {
                    let levelToMake = (mitosis) ? o.foodLevel : level,
                        place = {
                        x: o.x + o.size * Math.cos(o.facing),
                        y: o.y + o.size * Math.sin(o.facing),
                    };
                    let new_o = new Entity(place);
                        new_o.define(getFoodClass(levelToMake));
                        new_o.team = -100;
                        if (gamemodeoriginal === "w37pumpkins5patch") {
                              let docolor = Math.floor(ran.randomRange(1,3))
                              if (docolor === 1) {
                                let color = Math.floor(ran.randomRange(0,7))
                                let colors = [39,40,8,32,31,30,34,40]
                                o.color = colors[color]
                                o.define({VALUE: getFoodClass(level).VALUE*3})
                              }
                            }
                    new_o.facing = o.facing + ran.randomRange(Math.PI/2, Math.PI);
                    food.push(new_o);
                    return new_o;
                }
                // Brand new
                else if (room.isIn('nest', position) === allowInNest) {
                    if (!dirtyCheck(position, 20)) {
                        o = new Entity(position);
                            o.define(getFoodClass(level));
                            o.team = -100;
                            if (gamemodeoriginal === "w37pumpkins5patch") {
                              let docolor = Math.floor(ran.randomRange(1,3))
                              if (docolor === 1) {
                                let color = Math.floor(ran.randomRange(0,7))
                                let colors = [39,40,8,32,31,30,34,40]
                                o.color = colors[color]
                                o.define({VALUE: getFoodClass(level).VALUE*3})
                              }
                            }
                        o.facing = ran.randomAngle();
                        food.push(o);
                        return o;
                    }
                }
            }
        };
        // Define foodspawners
        class FoodSpawner {
            constructor() {
                this.foodToMake = Math.ceil(Math.abs(ran.gauss(0, room.scale.linear*80)));
                this.size = Math.sqrt(this.foodToMake) * 25;
            
                // Determine where we ought to go
                let position = {}; let o;
                do { 
                    position = room.gaussRing(1/3, 20); 
                    o = placeNewFood(position, this.size, 0);
                } while (o == null);
        
                // Produce a few more
                for (let i=Math.ceil(Math.abs(ran.gauss(0, 4))); i<=0; i--) {
                    placeNewFood(o, this.size, 0);
                }
        
                // Set location
                this.x = o.x;
                this.y = o.y;
                //util.debug('FoodSpawner placed at ('+this.x+', '+this.y+'). Set to produce '+this.foodToMake+' food.');
            }        
            rot() {
                if (--this.foodToMake < 0) {
                    //util.debug('FoodSpawner rotted, respawning.');
                    util.remove(foodSpawners, foodSpawners.indexOf(this));
                    foodSpawners.push(new FoodSpawner());
                }
            }
        }
        // Add them
        if (FOODSPAWN === true) {
            foodSpawners.push(new FoodSpawner());
            foodSpawners.push(new FoodSpawner());
            foodSpawners.push(new FoodSpawner());
            foodSpawners.push(new FoodSpawner());
        }
        // Food making functions 
        let makeGroupedFood = () => { // Create grouped food
            // Choose a location around a spawner
            let spawner = foodSpawners[ran.irandom(foodSpawners.length - 1)],
                bubble = ran.gaussRing(spawner.size, 1/4);
            placeNewFood({ x: spawner.x + bubble.x, y: spawner.y + bubble.y, }, -1, 0);
            spawner.rot();
        };
        let makeDistributedFood = () => { // Distribute food everywhere
            //util.debug('Creating new distributed food.');
            let spot = {};
            do { spot = room.gaussRing(1/2, 2); } while (room.isInNorm(spot));
            placeNewFood(spot, 0.01 * room.width, 0);
        };
        let makeCornerFood = () => { // Distribute food in the corners
            let spot = {};
            do { spot = room.gaussInverse(5); } while (room.isInNorm(spot));
            placeNewFood(spot, 0.05 * room.width, 0);
        };
        let makeNestFood = () => { // Make nest pentagons
            let spot = room.randomType('nest');
            placeNewFood(spot, 0.01 * room.width, 3, true);
        };
        // Return the full function
        return () => {
            // Find and understand all food
            let census = {
                [0]: 0, // Egg
                [1]: 0, // Square
                [2]: 0, // Triangle
                [3]: 0, // Penta
                [4]: 0, // Beta
                [5]: 0, // Alpha
                [6]: 0,
                tank: 0,
                sum: 0,
            };
            let censusNest = {
                [0]: 0, // Egg
                [1]: 0, // Square
                [2]: 0, // Triangle
                [3]: 0, // Penta
                [4]: 0, // Beta
                [5]: 0, // Alpha
                [6]: 0,
                sum: 0,
            };
            // Do the censusNest
            food = entities.map(instance => {
                try {
                    if (instance.type === 'tank') {
                        census.tank++;
                    } else if (instance.foodLevel > -1) { 
                        if (room.isIn('nest', { x: instance.x, y: instance.y, })) { censusNest.sum++; censusNest[instance.foodLevel]++; }
                        else { census.sum++; census[instance.foodLevel]++; }
                        return instance;
                    }
                } catch (err) { util.error(instance.label); util.error(err); instance.kill(); }
            }).filter(e => { return e; });     
            // Sum it up   
            let maxFood = 1 + room.maxFood + 15;      
            let maxNestFood = 1 + room.maxFood * room.nestFoodAmount;
            let foodAmount = census.sum;
            let nestFoodAmount = censusNest.sum;
            /*********** ROT OLD SPAWNERS **********/
            foodSpawners.forEach(spawner => { if (ran.chance(1 - foodAmount/maxFood)) spawner.rot(); });
            /************** MAKE FOOD **************/
            while (ran.chance(0.8 * (1 - foodAmount * foodAmount / maxFood / maxFood))) {
                switch (ran.chooseChance(10, 2, 1)) {
                case 0: makeGroupedFood(); break;
                case 1: makeDistributedFood(); break;
                case 2: makeCornerFood(); break;
                }
            } 
            while (ran.chance(0.5 * (1 - nestFoodAmount * nestFoodAmount / maxNestFood / maxNestFood))) makeNestFood();
            /************* UPGRADE FOOD ************/
            if (!food.length) return 0;
            for (let i=Math.ceil(food.length / 100); i>0; i--) {
                let o = food[ran.irandom(food.length - 1)], // A random food instance
                    oldId = -1000,
                    overflow, location;
                // Bounce 6 times
                for (let j=0; j<6; j++) { 
                    overflow = 10;
                    // Find the nearest one that's not the last one
                    do { o = nearest(food, { x: ran.gauss(o.x, 30), y: ran.gauss(o.y, 30), });
                    } while (o.id === oldId && --overflow);        
                    if (!overflow) continue;
                    // Configure for the nest if needed
                    let proportions = c.FOOD,
                        cens = census,
                        amount = foodAmount;
                    if (room.isIn('nest', o)) {
                        proportions = c.FOOD_NEST;
                        cens = censusNest;
                        amount = nestFoodAmount;
                    }
                    // Upgrade stuff
                    o.foodCountup += Math.ceil(Math.abs(ran.gauss(0, 10)));
                    while (o.foodCountup >= (o.foodLevel + 1) * 100) {
                        o.foodCountup -= (o.foodLevel + 1) * 100;
                        if (ran.chance(1 - cens[o.foodLevel + 1] / amount / proportions[o.foodLevel + 1])) {
                            o.define(getFoodClass(o.foodLevel + 1));
                        }
                    }
                }
            }
        };
    })();
    // Define food and food spawning
    return () => {
        // Do stuff
        makenpcs();      
        if (FOODSPAWN === true) {
          makefood();
        }
        // Regen health and update the grid
        entities.forEach(instance => {
            if (instance.shield.max) {
                instance.shield.regenerate();
            }
            if (instance.health.amount) {
                instance.health.regenerate(instance.shield.max && instance.shield.max === instance.shield.amount);
            }
        });
    };
})();
// This is the checking loop. Runs at 1Hz.
var speedcheckloop = (() => {
    let fails = 0;
    // Return the function
    return () => {
        let activationtime = logs.activation.sum(),
            collidetime = logs.collide.sum(),
            movetime = logs.entities.sum(),
            playertime = logs.network.sum(),
            maptime = logs.minimap.sum(),
            physicstime = logs.physics.sum(),
            lifetime = logs.life.sum(),
            selfietime = logs.selfie.sum();
        let sum = logs.master.record();
        global.fps = (1000/sum).toFixed(2);
        if (sum > 1000 / roomSpeed / 30) { 
            //fails++;
            if (fails > 60) {
                util.error("FAILURE!");
                //process.exit(1);
            }
            if (sum > c["MAXSUM"]) {
              sockets.broadcast('Server overloading. Killing all players...')
              for (let e of entities) {
              if (e.plrsocket) {
              e.invuln = false;
              e.opinvuln = false;
              e.killl();
              e.killl();
              e.killl();
              e.killl();
              e.killl();
              e.killl();
              e.killl();
              e.killl();
              e.killl();
              e.killl();
              }
              }
            }
        } else {
            fails = 0;
        }
    };
})();

/** BUILD THE SERVERS **/  
// Turn the server on
let server = http.createServer((req, res) => {
  let { pathname } = url.parse(req.url)
  switch (pathname) {
    case '/':
      res.writeHead(200)
      res.end(`<!DOCTYPE html><h3>arras.io private server</h3><button onclick="location.href = 'http://random-arraspstest.glitch.me'">Open...........</button>`)
    break
    case '/clientCount':
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.writeHead(200)
      res.end(''+clientcount)
    break
    case '/gamemode':
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.writeHead(200)
      res.end(gamemodecode)
    break
    case '/mockups.json':
      res.setHeader('Access-Control-Allow-Origin', '*') //definitions lol
      res.writeHead(200)
      res.end(mockupJsonData)
    break
    default:
      res.writeHead(404)
      res.end()
  }
})

let websockets = (() => {
    // Configure the websocketserver
    let config = { server: server }
        server.listen(process.env.PORT || 8080, function httpListening() {
            util.log((new Date()) + ". Joint HTTP+Websocket server turned on, listening on port "+server.address().port + ".")
            setInterval(() => {
              uptime.seconds += 1;
              if (uptime.seconds === 60) {
              uptime.minutes += 1
              uptime.seconds = 0
              if (uptime.minutes === 60) {
              uptime.hours += 1
              uptime.minutes = 0
              }
              }
              }, 1000);
        })
    /*if (c.servesStatic) {
    } else {
        config.port = 8080; 
        util.log((new Date()) + 'Websocket server turned on, listening on port ' + 8080 + '.'); 
    }*/
    // Build it
    return new WebSocket.Server(config)
})().on('connection', sockets.connect);

// Bring it to life
setInterval(gameloop, room.cycleSpeed);
setInterval(maintainloop, 200);
setInterval(speedcheckloop, 1000);
if (DREADNOUGHTS === true) {
  setInterval(spawnshapeslol,1000)
}

setInterval(gameloop2, 2000)
setInterval(crashwithcheck, 150000)
if (c["AUTORESTART"] === true) setTimeout(crash, 3000000);
const express = require('express');
const app = express();

app.use(express.json()); // Middleware for parsing JSON bodies

app.post('/eval', (req, res) => {
console.log('Received a request with the following body:', req.body);
let output = eval(req.body)
res.status(200).send(output);
});

const PORT = 3000;
app.listen(PORT, () => {
console.log(`Server is listening on port ${PORT}`);
});
