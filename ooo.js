let width = 41
let height = 41
let pixelSize= 10
// CREDIT: https://gist.github.com/blixt/f17b47c62508be59987b
const Seed = class {
  constructor(seed) {
    this.seed = seed % 2147483647
    if (this.seed <= 0) 
      this.seed += 2147483646
  }
  next() {
    return this.seed = this.seed * 16807 % 2147483647
  }
  nextFloat(opt_minOrMax, opt_max) {
    return (this.next() - 1) / 2147483646
  }
}
// CREDIT: https://github.com/bryc/code/blob/master/jshash/experimental/cyrb53.js
const cyrb53 = (str, seed = 0) => {
    let h1 = 0xdeadbeef ^ seed
    let h2 = 0x41c6ce57 ^ seed
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i)
        h1 = Math.imul(h1 ^ ch, 2654435761)
        h2 = Math.imul(h2 ^ ch, 1597334677)
    }
    h1 = Math.imul(h1 ^ (h1>>>16), 2246822507) ^ Math.imul(h2 ^ (h2>>>13), 3266489909)
    h2 = Math.imul(h2 ^ (h2>>>16), 2246822507) ^ Math.imul(h1 ^ (h1>>>13), 3266489909)
    return 4294967296 * (2097151 & h2) + (h1>>>0)
}

const direction = [
  [-1, 0], [1, 0], // left and right
  [0, -1], [0, 1], // up and down
]

const sleep = ms => new Promise(r => setTimeout(r, ms))

let alreadyPlaced = []

const placeWalls = (map, debugType = -1) => {
  if (debugType === 0 || debugType === -1)
    map.walls = map.entries().filter(([x, y, r]) => r === 1).map(([x, y, r]) => ({x, y, width: 1, height: 1}))
  
  for (let {x, y, width, height} of map.walls) {
    if (alreadyPlaced.find(r => r.x === x && r.y === y) && Math.abs(debugType) !== 1) continue
    if (Math.abs(debugType) !== 1) sleep(8)  
    if (Math.abs(debugType) !== 1) {
      alreadyPlaced.push({x, y})
    } else {
      map.walls.shift()
    }
  }
}

const findPockets = (map, debug, skip) => {
  let queue = [[0, 0]]
  map.set(0, 0, 2)
  let checkedIndices = new Set([0])
  for (let i = 0; i < 5000 && queue.length > 0; i++) {
    let [x, y] = queue.shift()
    for (let [nx, ny] of [
      [x - 1, y], // left
      [x + 1, y], // right
      [x, y - 1], // top
      [x, y + 1], // bottom
    ]) {
      if (nx < 0 || nx > map.width - 1 || ny < 0 || ny > map.height - 1) continue
      if (map.get(nx, ny) !== 0) continue
      let i = ny * map.width + nx
      if (checkedIndices.has(i)) continue
      checkedIndices.add(i)
      queue.push([nx, ny])
      map.set(nx, ny, 2)
      
      if (debug) {
        sleep(1)
      }
    }
  }
  if (skip) return map.entries()
  for (let [x, y, r] of map.entries()) {
    if (r === 2) {
      if (!debug) continue
      sleep(1)
    } else if (r === 0) {
      map.set(x, y, 1)
      if (!debug) continue
      sleep(1)
    }
  }
}

const combineWalls = map => {
  let best = null
  let maxSize = 0
  for (let [x, y, r] of map.entries()) {
    if (r !== 1) continue
    let size = 1
    loop: while (map.has(x + size, y + size)) {
      for (let v = 0; v <= size; v++)
        if (map.get(x + size, y + v) !== 1
         || map.get(x + v, y + size) !== 1)
          break loop
      size++
    }
    if (size > maxSize) {
      maxSize = size
      best = { x, y }
    }
  }
  if (!best) return null
  for (let y = 0; y < maxSize; y++) {
    for (let x = 0; x < maxSize; x++) {
      map.set(best.x + x, best.y + y, 0)
    }
  }
  map.walls.push({ x: best.x, y: best.y, width: maxSize, height: maxSize, }) 
}

const mergeWalls = (map, debug) => {
  for (let x = 0; x < map.width; x++) {
    for (let y = 0; y < map.height; y++) {
      if (map.get(x, y) !== 1) continue
      let chunk = { x, y, width: 0, height: 1 }
      while (map.get(x + chunk.width, y) === 1) {
        map.set(x + chunk.width, y, 0)
        chunk.width++
        
        map.walls.push(chunk)
        placeWalls(map, 1)
        if (debug) sleep(10)
      }
      outer: while (true) {
        for (let i = 0; i < chunk.width; i++) {
          if (map.get(x + i, y + chunk.height) !== 1) break outer
        }
        for (let i = 0; i < chunk.width; i++)
          map.set(x + i, y + chunk.height, 0)
        chunk.height++
        
        map.walls.push(chunk)
        placeWalls(map, 1)
        if (debug) sleep(10)
      }
      map.walls.push(chunk)
    }
  }
}

const wrapping = (x, y, map) => {
  return {
    x: x === 0 ? map.width  - 2 : x === map.width  - 1 ? 1 : x,
    y: y === 0 ? map.height - 2 : y === map.height - 1 ? 1 : y,
  }
}

const Maze = class {
  constructor(width, height, defaultValue) {
    this.width = width
    this.height = height
    this.array = Array(width * height).fill(defaultValue)
    for (let [x, y, r] of this.entries().filter(([x, y, r]) => !this.has(x, y) ))
      this.set(x, y, 0)
    this.walls = []
    this.base = defaultValue
  }
  get(x, y) {
    return this.array[y * this.width + x]
  }
  set(x, y, value) {
    this.array[y * this.width + x] = value
  }
  entries() {
    return this.array.map((value, i) => [i % this.width, Math.floor(i / this.width), value])
  }
  has(x, y) {
    return x > 0 && x < this.width - 1 && y > 0 && y < this.height - 1
  }
}
const topLeft = (map, debug) => {
  let array = [
    map.entries().filter(([x, y, r]) => x > 14 && y > 14 && x < 24 && y < 24).map(([x, y, r]) => [x, y, 0]),
    map.entries().filter(([x, y, r]) => x > 3 && y > 3 && x < 10 && y < 10).map(([x, y, r]) => [x, y, 0]),
    
    map.entries().filter(([x, y, r]) => x > 9 && y > 7 && x < 31 && y < 9).map(([x, y, r]) => [x, y, 0]),
    map.entries().filter(([x, y, r]) => x > 30 && y > 8 && x < 32 && y < 30).map(([x, y, r]) => [x, y, 0]),
    map.entries().filter(([x, y, r]) => x > 8 && y > 30 && x < 32 && y < 32).map(([x, y, r]) => [x, y, 0]),
    map.entries().filter(([x, y, r]) => x > 7 && y > 9 && x < 9 && y < 31).map(([x, y, r]) => [x, y, 0]),
    
    map.entries().filter(([x, y, r]) => x > 30 && y > 4 && x < 35 && y < 9).map(([x, y, r]) => [x, y, 0]),
    map.entries().filter(([x, y, r]) => x > 29 && y > 29 && x < 36 && y < 36).map(([x, y, r]) => [x, y, 0]),
    map.entries().filter(([x, y, r]) => x > 4 && y > 30 && x < 9 && y < 35).map(([x, y, r]) => [x, y, 0]),
   ]

  let output = '\n'
  for (let [x, y, r] of array) {
    
    let cell = ''
    cell = r === 0 ? '~~' : '##'
    map.set(x, y, r)
    output += `${cell}${x === 9 ? '\n' : ''}`
  }
  placeWalls(map, debug ? 0 : -1)
    //map.entries().filter(([x, y, r]) => x < 1 && y < 1 && x > 9 && y > 9).map(([x, y, r]) => r = 0)
}
const CornMaze = class {
  constructor({width, height, mazeSeed, debug}) {
    this.map = new Maze(width, height, 1)

    if (mazeSeed === '') {
      this.mazeSeed = Math.floor(Math.random() * 2147483646)
    } else if (/^\d+$/.test(mazeSeed)) {
      this.mazeSeed = parseInt(mazeSeed)
    } else {
      this.mazeSeed = cyrb53(mazeSeed)
    }
    this.mapSeed = new Seed(this.mazeSeed)
    this.debug = debug
  }
init() {
    this.harvestWalls()
    let toCut = [
      this.map.entries().filter(([x, y, r]) => x > 14 && y > 14 && x < 24 && y < 24).map(([x, y, r]) => [x, y, 0]),
        
      this.map.entries().filter(([x, y, r]) => x > 3 && y > 3 && x < 10 && y < 10).map(([x, y, r]) => [x, y, 0]),
      this.map.entries().filter(([x, y, r]) => x > 30 && y > 4 && x < 35 && y < 9).map(([x, y, r]) => [x, y, 0]),
      this.map.entries().filter(([x, y, r]) => x > 29 && y > 29 && x < 36 && y < 36).map(([x, y, r]) => [x, y, 0]),
      this.map.entries().filter(([x, y, r]) => x > 4 && y > 30 && x < 9 && y < 35).map(([x, y, r]) => [x, y, 0]),
        
      this.map.entries().filter(([x, y, r]) => x > 9 && y > 7 && x < 31 && y < 9).map(([x, y, r]) => [x, y, 0]),
      this.map.entries().filter(([x, y, r]) => x > 30 && y > 8 && x < 32 && y < 30).map(([x, y, r]) => [x, y, 0]),
      this.map.entries().filter(([x, y, r]) => x > 8 && y > 30 && x < 32 && y < 32).map(([x, y, r]) => [x, y, 0]),
      this.map.entries().filter(([x, y, r]) => x > 7 && y > 9 && x < 9 && y < 31).map(([x, y, r]) => [x, y, 0]),
    ]
    let walls = this.map.array.filter(r => r === 1)
    mergeWalls(this.map, this.debug)
    for (let [x, y, r] of toCut)
      this.map.set(x, y, r)
    placeWalls(this.map)
  }
  harvestWalls() {
    for (let [x, y, r] of this.map.entries()) {
      if (x === 0 || x === this.width || y === 0 || y === this.height || this.mapSeed.nextFloat() * 2 - x % 2 - y % 2 > 0) {
        this.map.set(x, y, 0)
      }
    }
    for (let [x, y, r] of this.map.entries().filter(([x, y, r]) => r === 1)) {
      let sides = [
        [x - 1, y], // left
        [x + 1, y], // right
        [x, y - 1], // top
        [x, y + 1], // bottom
      ]
      if (sides.every(([x, y]) => this.map.get(x, y) === 0)) {
        let [spotX, spotY] = sides[Math.floor(this.mapSeed.nextFloat() * 4)]
        this.map.set(spotX, spotY, 1)
      }
    }
    let map = findPockets(this.map, this.debug, true)
    while (map.filter(([x, y, r]) => r === 0).length > 0) {
      let pockets = map.filter(([x, y, r]) => r === 0)
      
      let [x, y, r] = pockets[0]
      a: for (let [nx, ny] of [
        [x - 1, y], // left
        [x + 1, y], // right
        [x, y - 1], // top
        [x, y + 1], // bottom
      ]) {
        if (this.map.get(nx, ny) !== 1) continue
        this.map.set(nx, ny, 0)
        break a
      }
      for (let [x, y, r] of this.map.entries().filter(([x, y, r]) => r === 2))
        this.map.set(x, y, 0)
      
      map = findPockets(this.map, this.debug, true)
    }
  }
}
let map2 = new CornMaze({
    width: 41,
    height: 41,
    mazeSeed: ''
  })
map2.init()
exports.mazecorn = map2
let map3 = new CornMaze({
    width: 41,
    height: 41,
    mazeSeed: ''
  })
map3.init()
exports.mazecornlong = map3
const MazeZone = class {
  constructor(array = [], offset = { x: 0, y: 0 }, length = array.map(row => row.filter(r => r).length).reduce((a, b) => a + b, 0)) {
    this.array = array
    this.offset = offset
    this.length = length
  }
  get width() {
    return this.array.length
  }
  get height() {
    return this.array.length === 0 ? 0 : this.array[0].length
  }
  normalize() {
    while (this.array.length > 0 && this.array[0].every(r => !r)) {
      this.offset.x++
      this.array.shift()
    }
    while (this.array.length > 0 && this.array[this.array.length - 1].every(r => !r)) {
      this.array.pop()
    }
    let minY = Infinity
    let maxY = -Infinity
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        if (!this.array[x][y]) continue
        minY = y < minY ? y : minY
        maxY = y > maxY ? y : maxY
      }
    }
    this.offset.y += minY
    if (minY === Infinity) {
      this.array = []
    } else {
      this.array = this.array.map(row => row.slice(minY, maxY + 1))
    }
    return this
  }
  blocks() {
    let blocks = []
    for (let x = 0; x < this.width; x++)
      for (let y = 0; y < this.height; y++)
        if (this.array[x][y])
          blocks.push({ x: x + this.offset.x, y: y + this.offset.y, size: 1 })
    return blocks
  }
  shaveSingles() {
    let { width, height } = this
    if (this.length <= 3)
      return [null, this.blocks()]
    /*if (this.length === 4)
      if (width === 2 && height === 2)
        return [null, [{ x: this.offset.x, y: this.offset.y, size: 2 }]]
      else
        return [null, this.blocks()]*/

    let output = []
    let shaveable = true
    let shaved = false
    while (shaveable) {
      shaveable = false
      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          if (!this.array[x][y]) continue
          let left = x > 0 && this.array[x - 1][y]
          let right = x + 1 < width && this.array[x + 1][y]
          let top = y > 0 && this.array[x][y - 1]
          let bottom = y + 1 < height && this.array[x][y + 1]
          if ((!left && !right) || (!top && !bottom)) {
            this.array[x][y] = false
            output.push({ x: x + this.offset.x, y: y + this.offset.y, size: 1 })
            shaveable = true
          }
        }
      }
      shaved = shaved || shaveable
    }
    this.length -= output.length
    if (shaved)
      return [this.normalize(), output]
    return null
  }
  takeBiggestSquare() {
    let { width, height } = this
    let best = null
    let maxSize = 0
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        if (!this.array[x][y]) continue
        let size = 1
        loop: while (x + size < width && y + size < height) {
          for (let i = 0; i <= size; i++)
            if (!this.array[x + size][y + i]
             || !this.array[x + i][y + size])
              break loop
          size++
        }
        if (size > maxSize) {
          maxSize = size
          best = { x, y }
        }
      }
    }
    if (!best) return null
    this.length -= maxSize * maxSize
    for (let x = 0; x < maxSize; x++) {
      for (let y = 0; y < maxSize; y++) {
        this.array[best.x + x][best.y + y] = false
      }
    }
    let square = { x: best.x + this.offset.x, y: best.y + this.offset.y, size: maxSize }
    if (best.x === 0 || best.x + maxSize === width
     || best.y === 0 || best.y + maxSize === height)
      this.normalize()
    return square
  }
  shave() {
    this.normalize()
    let shave = this.shaveSingles()
    if (shave)
      return shave
    let biggestSquare = this.takeBiggestSquare()
    return [this.width && this.height ? this : null, [biggestSquare]]
  }
  intoSquares() {
    let current = this
    let squares = []
    while (current) {
      let now = this.shave()
      current = now[0]
      squares.push(...now[1])
    }
    return squares
  }
  toString(filled = '[]', unfilled = '--') {
    let map = Array(this.height).fill().map((_, i) => this.array.map(row => row[i]))
    return [
      `${ this.width }x${ this.height } (${ this.length })`,
      map.map(row => row.map(cell => cell ? filled : unfilled).join('')).join('\n'),
      `+(${ this.offset.x }, ${ this.offset.y })`,
    ].join('\n')
  }
}

const MazeGenerator = class {
  constructor(type) { // TODO new config format
    this.type = type
    this.staticRand = Math.random()
    this.clear()
  }
  clear(mapString) {
    if (mapString) {
      let map = mapString.trim().split('\n').map(r => r.trim().split('').map(r => r === '#' ? 1 : r === '@'))
      this.maze = Array(map[0].length).fill().map((_, y) => Array(map.length).fill().map((_, x) => map[x][y]))
      this.width = map[0].length
      this.height = map.length
    } else {
      this.maze = Array(32).fill().map(() => Array(32).fill(false))
      this.width = 32
      this.height = 32
    }
  }
  isClosed() {
    let cells = [].concat(
      ...this.maze.map((r, x) =>
        r.map((r, y) => [x, y, r])
         .filter(([x, y, r]) => !r))
    ).map(([x, y]) => [x, y, x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1])

    let work = true
    while (work) {
      work = false
      for (let [x, y, open] of cells)
        if (open)
          for (let other of cells) {
            let [ox, oy, oOpen] = other
            if (!oOpen && (Math.abs(ox - x) + Math.abs(oy - y) === 1)) {
              other[2] = true
              work = true
            }
          }
    }
    return cells.some(r => !r[2])
  }
  randomErosion(side = null, corner = null) { // null = no requirement, 0 = neither, 1 = only one, 2 = both, true = one or two
    for (let i = 0; i < 10000; i++) {
      // find position
      let x = Math.floor(Math.random() * this.width)
      let y = Math.floor(Math.random() * this.height)
      if (this.maze[x][y]) continue
      // find direction
      if ((x === 0 || x === this.width - 1) && (y === 0 || y === this.height - 1)) continue
      let direction = Math.floor(Math.random() * 4)
      if (x === 0) direction = 0
      else if (y === 0) direction = 1
      else if (x === this.width - 1) direction = 2
      else if (y === this.height - 1) direction = 3
      // find target
      let tx = direction === 0 ? x + 1 : direction === 2 ? x - 1 : x
      let ty = direction === 1 ? y + 1 : direction === 3 ? y - 1 : y
      if (this.maze[tx][ty] !== true) continue
      // check corner
      if (corner !== null) {
        let left = this.maze
          [direction === 2 || direction === 3 ? x - 1 : x + 1]
          [direction === 0 || direction === 3 ? y - 1 : y + 1]
        let right = this.maze
          [direction === 1 || direction === 2 ? x - 1 : x + 1]
          [direction === 2 || direction === 3 ? y - 1 : y + 1]
        if ((corner === true && (left || right)) || (corner === +left + +right)) {
        } else {
          continue
        }
      }
      // check side
      if (side !== null) {
        let left = this.maze
          [direction === 3 ? x + 1 : direction === 1 ? x - 1 : x]
          [direction === 0 ? y + 1 : direction === 2 ? y - 1 : y]
        let right = this.maze
          [direction === 1 ? x + 1 : direction === 3 ? x - 1 : x]
          [direction === 2 ? y + 1 : direction === 0 ? y - 1 : y]
        if ((side === true && (left || right)) || (side === +left + +right)) {
        } else {
          continue
        }
      }
      // return it
      return [tx, ty, x, y]
    }
    throw new Error(`Unable to find suitable erosion site; side = ${ side }, corner = ${ corner }`)
  }
  erode(side, corner) {
    let [x, y] = this.randomErosion(side, corner)
    this.maze[x][y] = false
  }
  erodeSym2(side, corner) {
    let [x, y] = this.randomErosion(side, corner)
    this.maze[x][y] = false
    this.maze[this.width - 1 - x][this.height - 1 - y] = false
  }
  erodeSym4(side, corner) {
    if (this.width !== this.height)
      throw new Error('Maze must be a square')
    let size = this.width - 1
    let [x, y] = this.randomErosion(side, corner)
    if (this.staticRand < 0.5) {
      this.maze[x][y] = false
      this.maze[x][size - y] = false
      this.maze[size - x][y] = false
      this.maze[size - x][size - y] = false
    } else {
      this.maze[x][y] = false
      this.maze[y][size - x] = false
      this.maze[size - x][size - y] = false
      this.maze[size - y][x] = false
    }
  }
  erodeSym8(side, corner) {
    if (this.width !== this.height)
      throw new Error('Maze must be a square')
    let size = this.width - 1
    let [x, y] = this.randomErosion(side, corner)
    this.maze[x][y] = false
    this.maze[y][x] = false
    this.maze[x][size - y] = false
    this.maze[size - y][x] = false
    this.maze[size - x][y] = false
    this.maze[y][size - x] = false
    this.maze[size - x][size - y] = false
    this.maze[size - y][size - x] = false
  }
  runNormal() {
    this.clear(`
      --------------------------------
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      --------------------------------
    `)
    for (let i = 0; i < 75; i++)
      this.erode(0, 1) // Shaves outer rim
    for (let i = 0; i < 200; i++) {
      this.erode(1, 2) 
      this.erode(2, 2)
    }
  }
  runNormal2() {
    this.clear(`
      --------------------------------
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@--------@@@@@@@@@@@-
      -@@@@@@@@@@@--------@@@@@@@@@@@-
      -@@@@@@@@@@@--------@@@@@@@@@@@-
      -@@@@@@@@@@@--------@@@@@@@@@@@-
      -@@@@@@@@@@@--------@@@@@@@@@@@-
      -@@@@@@@@@@@--------@@@@@@@@@@@-
      -@@@@@@@@@@@--------@@@@@@@@@@@-
      -@@@@@@@@@@@--------@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      --------------------------------
    `)
    for (let i = 0; i < 5; i++) {
      this.erodeSym2(0, 2)
      this.erodeSym2(2, 2)
      this.erodeSym2(2, 2)
      this.erodeSym2(2, 2)
    }
    for (let i = 0; i < 180; i++) {
      this.erode(1, 2) 
      this.erode(2, 2)
    }
  }
  runCXMaze() {
    this.clear(`
      --------------------------------
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@--------@@@@@@@@@@@-
      -@@@@@@@@@@@--------@@@@@@@@@@@-
      -@@@@@@@@@@@--------@@@@@@@@@@@-
      -@@@@@@@@@@@--------@@@@@@@@@@@-
      -@@@@@@@@@@@--------@@@@@@@@@@@-
      -@@@@@@@@@@@--------@@@@@@@@@@@-
      -@@@@@@@@@@@--------@@@@@@@@@@@-
      -@@@@@@@@@@@--------@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      --------------------------------
    `)
    for (let i = 0; i < 20; i++)
      this.erode(0, 2)
    for (let i = 0; i < 10; i++) {
      this.erode(0, 2)
      this.erode(2, 2)
      this.erode(2, 2)
      this.erode(2, 2)
      this.erode(2, 2)
    }
    for (let i = 0; i < 20; i++) {
      this.erode(1, 2)
      this.erode(0, 2)
      this.erode(2, 2)
      this.erode(2, 2)
      this.erode(2, 2)
      this.erode(2, 2)
    }
    for (let i = 0; i < 150; i++)
      this.erode(1, 2)
      this.erode(2, 2)
    for (let i = 0; i < 10; i++) {
      this.erode(0, 2)
      this.erode(2, 2)
      this.erode(2, 2)
      this.erode(2, 2)
      this.erode(2, 2)
    }
    for (let i = 0; i < 50; i++)
      this.erode(0, 0)
  }
  runOriginal() {
    this.clear(`
      --------------------------------
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@--------@@@@@@@@@@@-
      -@@@@@@@@@@@--------@@@@@@@@@@@-
      -@@@@@@@@@@@--------@@@@@@@@@@@-
      -@@@@@@@@@@@--------@@@@@@@@@@@-
      -@@@@@@@@@@@--------@@@@@@@@@@@-
      -@@@@@@@@@@@--------@@@@@@@@@@@-
      -@@@@@@@@@@@--------@@@@@@@@@@@-
      -@@@@@@@@@@@--------@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      --------------------------------
    `)
    for (let i = 0; i < 20; i++)
      this.erode(0, 2)
    for (let i = 0; i < 10; i++) {
      this.erode(0, 2)
      this.erode(2, 2)
      this.erode(2, 2)
      this.erode(2, 2)
      this.erode(2, 2)
    }
    for (let i = 0; i < 20; i++) {
      this.erode(1, 2)
      this.erode(0, 2)
      this.erode(2, 2)
      this.erode(2, 2)
      this.erode(2, 2)
      this.erode(2, 2)
    }
    for (let i = 0; i < 150; i++)
      this.erode(1, 2)
    for (let i = 0; i < 10; i++) {
      this.erode(0, 2)
      this.erode(2, 2)
      this.erode(2, 2)
      this.erode(2, 2)
      this.erode(2, 2)
    }
    for (let i = 0; i < 50; i++)
      this.erode(1, 1)
      this.erode(2, 2)
  }
  runCXMaze2() {
    this.clear(`
      --------------------------------
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@--------@@@@@@@@@@@-
      -@@@@@@@@@@@--------@@@@@@@@@@@-
      -@@@@@@@@@@@--------@@@@@@@@@@@-
      -@@@@@@@@@@@--------@@@@@@@@@@@-
      -@@@@@@@@@@@--------@@@@@@@@@@@-
      -@@@@@@@@@@@--------@@@@@@@@@@@-
      -@@@@@@@@@@@--------@@@@@@@@@@@-
      -@@@@@@@@@@@--------@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      --------------------------------
    `)
    for (let i = 0; i < 20; i++)
      this.erode(0, 2)
    for (let i = 0; i < 10; i++) {
      this.erode(0, 2)
      this.erode(2, 2)
      this.erode(2, 2)
      this.erode(2, 2)
      this.erode(2, 2)
    }
    for (let i = 0; i < 20; i++) {
      this.erode(1, 2)
      this.erode(0, 2)
      this.erode(2, 2)
      this.erode(2, 2)
      this.erode(2, 2)
      this.erode(2, 2)
    }
    for (let i = 0; i < 150; i++)
      this.erode(1, 2)
    for (let i = 0; i < 10; i++) {
      this.erode(0, 2)
      this.erode(2, 2)
      this.erode(2, 2)
      this.erode(2, 2)
      this.erode(2, 2)
    }
    for (let i = 0; i < 50; i++)
      this.erode(1, 1)
      this.erode(2, 2)
  }
  run2Teams() {
    this.clear(`
      --------------------------------
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@----@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@----@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@----@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@-------------------------@@@@-
      -@@@@-@@@@@@@@@@@@@@@@@@@@-@@@@-
      -@@@@-@@@@@@@@@@@@@@@@@@@@-@@@@-
      -@@@@-@@@@@@@@@@@@@@@@@@@@-@@@@-
      -@@@@-@@@@@@@@@@@@@@@@@@@@-@@@@-
      -@@@@-@@@@@@@@@@@@@@@@@@@@-@@@@-
      -@@@@-@@@@@@@@@@@@@@@@@@@@-@@@@-
      -@@@@-@@@@@@--------@@@@@@-@@@@-
      -@@@@-@@@@@@--------@@@@@@-@@@@-
      -@@@@-@@@@@@--------@@@@@@-@@@@-
      -@@@@-@@@@@@--------@@@@@@-@@@@-
      -@@@@-@@@@@@--------@@@@@@-@@@@-
      -@@@@-@@@@@@--------@@@@@@-@@@@-
      -@@@@-@@@@@@--------@@@@@@-@@@@-
      -@@@@-@@@@@@--------@@@@@@-@@@@-
      -@@@@-@@@@@@@@@@@@@@@@@@@@-@@@@-
      -@@@@-@@@@@@@@@@@@@@@@@@@@-@@@@-
      -@@@@-@@@@@@@@@@@@@@@@@@@@-@@@@-
      -@@@@-@@@@@@@@@@@@@@@@@@@@-@@@@-
      -@@@@-@@@@@@@@@@@@@@@@@@@@-@@@@-
      -@@@@-@@@@@@@@@@@@@@@@@@@@-@@@@-
      -@@@@-------------------------@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@----@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@----@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@----@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      --------------------------------
    `)
    for (let i = 0; i < 5; i++)
      this.erodeSym2(0, 2)
    for (let i = 0; i < 5; i++) {
      this.erodeSym2(0, 2)
      this.erodeSym2(2, 2)
      this.erodeSym2(2, 2)
      this.erodeSym2(2, 2)
    }
    for (let i = 0; i < 10; i++) {
      this.erodeSym2(1, 2)
      this.erodeSym2(0, 2)
      this.erodeSym2(2, 2)
      this.erodeSym2(2, 2)
      this.erodeSym2(2, 2)
    }
    for (let i = 0; i < 75; i++)
      this.erodeSym2(1, 2)
    for (let i = 0; i < 5; i++) {
      this.erodeSym2(0, 2)
      this.erodeSym2(2, 2)
      this.erodeSym2(2, 2)
      this.erodeSym2(2, 2)
    }
    for (let i = 0; i < 25; i++)
      this.erodeSym2(0, 0)
  }
  run4Teams() {
    this.clear(`
      --------------------------------
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@----@@@@@@@@@@@@@@@@@@@@----@-
      -@----@@@@@@@@@@@@@@@@@@@@----@-
      -@----@@@@@@@@@@@@@@@@@@@@----@-
      -@----------------------------@-
      -@@@@-@@@@@@@@@@@@@@@@@@@@-@@@@-
      -@@@@-@@@@@@@@@@@@@@@@@@@@-@@@@-
      -@@@@-@@@@@@@@@@@@@@@@@@@@-@@@@-
      -@@@@-@@@@@@@@@@@@@@@@@@@@-@@@@-
      -@@@@-@@@@@@@@@@@@@@@@@@@@-@@@@-
      -@@@@-@@@@@@@@@@@@@@@@@@@@-@@@@-
      -@@@@-@@@@@@--------@@@@@@-@@@@-
      -@@@@-@@@@@@--------@@@@@@-@@@@-
      -@@@@-@@@@@@--------@@@@@@-@@@@-
      -@@@@-@@@@@@--------@@@@@@-@@@@-
      -@@@@-@@@@@@--------@@@@@@-@@@@-
      -@@@@-@@@@@@--------@@@@@@-@@@@-
      -@@@@-@@@@@@--------@@@@@@-@@@@-
      -@@@@-@@@@@@--------@@@@@@-@@@@-
      -@@@@-@@@@@@@@@@@@@@@@@@@@-@@@@-
      -@@@@-@@@@@@@@@@@@@@@@@@@@-@@@@-
      -@@@@-@@@@@@@@@@@@@@@@@@@@-@@@@-
      -@@@@-@@@@@@@@@@@@@@@@@@@@-@@@@-
      -@@@@-@@@@@@@@@@@@@@@@@@@@-@@@@-
      -@@@@-@@@@@@@@@@@@@@@@@@@@-@@@@-
      -@----------------------------@-
      -@----@@@@@@@@@@@@@@@@@@@@----@-
      -@----@@@@@@@@@@@@@@@@@@@@----@-
      -@----@@@@@@@@@@@@@@@@@@@@----@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      --------------------------------
    `)
    for (let i = 0; i < 5; i++)
      this.erodeSym4(0, 2)
    for (let i = 0; i < 2; i++) {
      this.erodeSym4(0, 2)
      this.erodeSym4(2, 2)
      this.erodeSym4(2, 2)
      this.erodeSym4(2, 2)
    }
    for (let i = 0; i < 5; i++) {
      this.erodeSym4(1, 2)
      this.erodeSym4(0, 2)
      this.erodeSym4(2, 2)
      this.erodeSym4(2, 2)
      this.erodeSym4(2, 2)
    }
    for (let i = 0; i < 40; i++)
      this.erodeSym4(1, 2)
    for (let i = 0; i < 2; i++) {
      this.erodeSym4(0, 2)
      this.erodeSym4(2, 2)
      this.erodeSym4(2, 2)
      this.erodeSym4(2, 2)
    }
    for (let i = 0; i < 12; i++)
      this.erodeSym4(0, 0)
  }
  run8Teams() {
    this.clear(`
      --------------------------------
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@----@@@@@@@@----@@@@@@@@----@-
      -@----@@@@@@@@----@@@@@@@@----@-
      -@----@@@@@@@@----@@@@@@@@----@-
      -@----------------------------@-
      -@@@@-@@@@@@@@@@@@@@@@@@@@-@@@@-
      -@@@@-@@@@@@@@@@@@@@@@@@@@-@@@@-
      -@@@@-@@@@@@@@@@@@@@@@@@@@-@@@@-
      -@@@@-@@@@@@@@@@@@@@@@@@@@-@@@@-
      -@@@@-@@@@@@@@@@@@@@@@@@@@-@@@@-
      -@@@@-@@@@@@@@@@@@@@@@@@@@-@@@@-
      -@@@@-@@@@@@--------@@@@@@-@@@@-
      -@@@@-@@@@@@--------@@@@@@-@@@@-
      -@----@@@@@@--------@@@@@@----@-
      -@----@@@@@@--------@@@@@@----@-
      -@----@@@@@@--------@@@@@@----@-
      -@----@@@@@@--------@@@@@@----@-
      -@@@@-@@@@@@--------@@@@@@-@@@@-
      -@@@@-@@@@@@--------@@@@@@-@@@@-
      -@@@@-@@@@@@@@@@@@@@@@@@@@-@@@@-
      -@@@@-@@@@@@@@@@@@@@@@@@@@-@@@@-
      -@@@@-@@@@@@@@@@@@@@@@@@@@-@@@@-
      -@@@@-@@@@@@@@@@@@@@@@@@@@-@@@@-
      -@@@@-@@@@@@@@@@@@@@@@@@@@-@@@@-
      -@@@@-@@@@@@@@@@@@@@@@@@@@-@@@@-
      -@----------------------------@-
      -@----@@@@@@@@----@@@@@@@@----@-
      -@----@@@@@@@@----@@@@@@@@----@-
      -@----@@@@@@@@----@@@@@@@@----@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      --------------------------------
    `)
    for (let i = 0; i < 4; i++)
      this.erodeSym4(0, 2)
    for (let i = 0; i < 2; i++) {
      this.erodeSym4(0, 2)
      this.erodeSym4(2, 2)
      this.erodeSym4(2, 2)
      this.erodeSym4(2, 2)
    }
    for (let i = 0; i < 3; i++) {
      this.erodeSym4(1, 2)
      this.erodeSym4(0, 2)
      this.erodeSym4(2, 2)
      this.erodeSym4(2, 2)
      this.erodeSym4(2, 2)
    }
    for (let i = 0; i < 25; i++)
      this.erodeSym4(1, 2)
    for (let i = 0; i < 2; i++) {
      this.erodeSym4(0, 2)
      this.erodeSym4(2, 2)
      this.erodeSym4(2, 2)
      this.erodeSym4(2, 2)
    }
    for (let i = 0; i < 6; i++)
      this.erodeSym4(0, 0)
  }
  run8TeamsLabyrinth() {
    this.clear(`
      --------------------------------------------------------------------------------------------------------------------------------
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@-
      -@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@-
      -@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@-
      -@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@-
      -@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@-
      -@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@-
      -@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@-
      -@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@-
      -@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@-
      -@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@-
      -@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@-
      -@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@-
      -@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@-
      -@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@-
      -@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@-
      -@@@@@@@----------------------------------------------------------------------------------------------------------------@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@--------------------------------@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@--------------------------------@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@--------------------------------@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@--------------------------------@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@--------------------------------@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@--------------------------------@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@--------------------------------@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@--------------------------------@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@--------------------------------@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@-
      -@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@--------------------------------@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@-
      -@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@--------------------------------@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@-
      -@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@--------------------------------@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@-
      -@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@--------------------------------@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@-
      -@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@--------------------------------@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@-
      -@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@--------------------------------@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@-
      -@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@--------------------------------@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@-
      -@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@--------------------------------@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@-
      -@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@--------------------------------@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@-
      -@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@--------------------------------@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@-
      -@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@--------------------------------@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@-
      -@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@--------------------------------@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@-
      -@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@--------------------------------@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@-
      -@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@--------------------------------@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@-
      -@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@--------------------------------@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@--------------------------------@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@--------------------------------@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@--------------------------------@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@--------------------------------@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@--------------------------------@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@--------------------------------@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@--------------------------------@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@--------------------------------@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@----------------------------------------------------------------------------------------------------------------@@@@@@@-
      -@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@-
      -@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@-
      -@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@-
      -@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@-
      -@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@-
      -@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@-
      -@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@-
      -@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@-
      -@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@-
      -@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@-
      -@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@-
      -@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@-
      -@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@-
      -@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@-
      -@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@----------------@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      --------------------------------------------------------------------------------------------------------------------------------
    `)
    for (let i = 0; i < 32; i++)
      this.erodeSym4(0, 2)
    for (let i = 0; i < 32; i++) {
      this.erodeSym4(0, 2)
      this.erodeSym4(2, 2)
      this.erodeSym4(2, 2)
      this.erodeSym4(2, 2)
    }
    for (let i = 0; i < 27; i++) {
      this.erodeSym4(1, 2)
      this.erodeSym4(0, 2)
      this.erodeSym4(2, 2)
      this.erodeSym4(2, 2)
      this.erodeSym4(2, 2)
    }
    for (let i = 0; i < 500; i++)
      this.erodeSym4(1, 2)
    for (let i = 0; i < 32; i++) {
      this.erodeSym4(0, 2)
      this.erodeSym4(2, 2)
      this.erodeSym4(2, 2)
      this.erodeSym4(2, 2)
    }
    for (let i = 0; i < 96; i++)
      this.erodeSym4(0, 0)
  }
  runBunker() {
    this.clear(`
      --------------------------------
      --------------------------------
      --------------------------------
      --------------------------------
      --------------------------------
      --------------------------------
      --------------------------------
      --------------------------------
      -----------@@@@@@@@@@-----------
      --------@@@@@@@@@@@@@@@@--------
      ------@@@@@@@@@@@@@@@@@@@@------
      -----@@@@@##@@@@@@@@##@@@@@-----
      ----@@@@@#--#@@@@@@#--#@@@@@----
      ---@@@#@#@--#@@@@@@#--@#@#@@@---
      ---@@#@#@@--@@@@@@@@--@@#@#@@---
      --@@#@@@@@@@@@@@@@@@@@@@@@@#@@--
      --@#@@@@@@@@@@@@@@@@@@@@@@@@#@--
      --@@#@@@@@@@@@@@@@@@@@@@@@@#@@--
      -@@#@@@@@@@@@@@@@@@@@@@@@@@@#@@-
      -@@@#@@@@----@@##@@----@@@@#@@@-
      -@@@@##@@#--###@@###--#@@##@@@@-
      -@@@@@#@@#------------#@@#@@@@@-
      -@@@@@@##################@@@@@@-
      --------------------------------
    `)
    for (let i = 0; i < 8; i++)
      this.erode(0, 2)
    for (let i = 0; i < 5; i++) {
      this.erode(0, 2)
      this.erode(2, 2)
      this.erode(2, 2)
      this.erode(2, 2)
    }
    for (let i = 0; i < 10; i++) {
      this.erode(1, 2)
      this.erode(0, 2)
      this.erode(2, 2)
      this.erode(2, 2)
      this.erode(2, 2)
    }
    for (let i = 0; i < 40; i++)
      this.erode(1, 2)
    for (let i = 0; i < 5; i++) {
      this.erode(0, 2)
      this.erode(2, 2)
      this.erode(2, 2)
      this.erode(2, 2)
    }
    for (let i = 0; i < 15; i++)
      this.erode(0, 0)
  }
  runFortress() {
    this.clear(`
      --------------------------------
      --------------------------------
      --------------------------------
      --------------------------------
      --------------------------------
      --------------------------------
      --------@@@@@------@@@@@--------
      -------@@@@@@##--##@@@@@@-------
      ------@@@@#####--#####@@@@------
      ------@@@#@#@##--##@#@#@@@------
      ------@@#@@@@@#--#@@@@@#@@------
      ------@@##@@@@----@@@@##@@------
      ------@@#@@@--------@@@#@@------
      -------###@@--------@@###-------
      -------####----------####-------
      --------------------------------
      --------------------------------
      -------####----------####-------
      -------###@@--------@@###-------
      ------@@#@@@--------@@@#@@------
      ------@@##@@@@----@@@@##@@------
      ------@@#@@@@@#--#@@@@@#@@------
      ------@@@#@#@##--##@#@#@@@------
      ------@@@@#####--#####@@@@------
      -------@@@@@@##--##@@@@@@-------
      --------@@@@@------@@@@@--------
      --------------------------------
      --------------------------------
      --------------------------------
      --------------------------------
      --------------------------------
      --------------------------------
    `)
    for (let i = 0; i < 100; i++)
      this.erode(null, null)
  }
  runCitadel() {
    this.clear(`
      --------------------------
      --------------------------
      -------@@@@@@@@@@@@-------
      -------##@@@@@@@@##-------
      --------##########--------
      --------#@@@@@@@@#--------
      --------------------------
      --@#------------------#@--
      --@###--------------###@--
      --@@#@--------------@#@@--
      --@@#@--------------@#@@--
      --@@#@--------------@#@@--
      --@@#@--------------@#@@--
      --@@#@--------------@#@@--
      --@@#@--------------@#@@--
      --@@#@--------------@#@@--
      --@@#@--------------@#@@--
      --@###--------------###@--
      --@#------------------#@--
      --------------------------
      --------#--------#--------
      --------##########--------
      -------##@@@@@@@@##-------
      -------@@@@@@@@@@@@-------
      --------------------------
      --------------------------
    `)
    for (let i = 0; i < 15; i++)
      this.erode(null, null)
  }
  runMothership() {
    this.clear(`
      ----------------------------------
      -#####-####@##############@####-#-
      -#---#--------------------------#-
      -#---#--------------------------#-
      -#---#--------------------------#-
      -#---#---####-#######@#######---#-
      -#---#----------------------#---#-
      -#---#----------------------#---#-
      -----#----------------------#---@-
      -#---#####-#######@######---#---#-
      -#---#------------------#---#---#-
      -#---#------------------#---#---#-
      -#---@------------------#---#---#-
      -@---#----------------------@---@-
      -#---#----------------------#---#-
      -#---@----------------------@---#-
      -#---#----------------------#---#-
      -#---#----------------------#---#-
      -#---@----------------------@---#-
      -#---#----------------------#---#-
      -@---#----------------------@---@-
      -#---@---#------------------#---#-
      -#---#---#------------------#---#-
      -#---#---#------------------#---#-
      -#---#---#-#######@####-#####---#-
      -@---#----------------------#-----
      -#---#----------------------#---#-
      -#---#----------------------#---#-
      -#---####@#######@#######---#---#-
      -#--------------------------#---#-
      -#--------------------------#---#-
      -#--------------------------#---#-
      -#####@##############@#####@#####-
      ----------------------------------
    `)
    for (let i = 0; i < 5; i++)
      this.erode(null, null)
  }
  runTrial() {
    try {
      switch (this.type) {
        case 0:
          this.runNormal()
          break
        case 1:
          this.runNormal2()
          break
        case 2:
          this.run2Teams()
          break
        case 3:
          this.runOriginal()
          break
        case 4:
          this.run4Teams()
          break
        case 5:
          this.runCXMaze()
          break
        case 6:
          this.runCXMaze2()
          break
        case 8:
          this.run8Teams()
          break
        case 10:
          this.runBunker()
          break
        case 11:
          this.runFortress()
          break
        case 12:
          this.runMothership()
          break
        case 13:
          this.runCitadel()
          break
        case 80:
          this.run8TeamsLabyrinth()
          break
        default:
          return null
          break
      }
    } catch (e) {
      // console.log(e)
      return null
    }
    if (this.isClosed()) {
      // console.log('Maze generation failed')
      return null
    }
    return new MazeZone(this.maze)
  }
  placeMinimal() {
    let bestSquares = null

    for (let i = 0; i < 10; i++) {
      let trial = this.runTrial()
      if (!trial) continue
      let squares = trial.intoSquares()
      if (bestSquares === null || squares.length < bestSquares.length) {
        bestSquares = squares
        continue
      }
    }

    for (let i = 0; !bestSquares && i < 500; i++) {
      let trial = this.runTrial()
      if (!trial) continue
      bestSquares = trial.intoSquares()
    }

    return {
      squares: bestSquares,
      width: this.width,
      height: this.height,
    }
  }
}

/*let runCode = () => {
  try {
    let maze = new MazeGenerator(0)
    let { squares, width, height } = maze.placeMinimal()
    s.style.color = '#006600'
    s.textContent = `Success (${maze.isClosed() ? 'closed' : 'open'})`
  
    let pixelSize = 10
    c.width = pixelSize * width
    c.height = pixelSize * height
    let ctx = c.getContext('2d')
    ctx.scale(pixelSize, pixelSize)
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, width, height)
    ctx.fillStyle = '#000'
    for (let { x, y, size } of squares)
      ctx.fillRect(x, y, size, size)
  } catch(e) {
    console.error(e)
    s.style.color = '#ee0000'
    s.textContent = `Error! ${e.message}`
  }
}
r.onclick = () => {
  runCode()
}*/

// New Maze Generation System
exports.createMaze = mazetype => {
  let generatedMaze = {
    MAZE: new MazeGenerator(mazetype),
    MAZEWALLS: []
  }
  generatedMaze.MAZEWALLS.push(generatedMaze.MAZE.placeMinimal())
  return generatedMaze
};
// Old Maze Generation System
/*exports.maze0 = {
  MAZE: new MazeGenerator(0),
  MAZEWALLS: []
}
exports.maze0.MAZEWALLS.push(exports.maze0.MAZE.placeMinimal())
exports.maze1 = {
  MAZE: new MazeGenerator(1),
  MAZEWALLS: []
}
exports.maze1.MAZEWALLS.push(exports.maze1.MAZE.placeMinimal())
exports.maze2 = {
  MAZE: new MazeGenerator(2),
  MAZEWALLS: []
}
exports.maze2.MAZEWALLS.push(exports.maze2.MAZE.placeMinimal())
exports.maze3 = {
  MAZE: new MazeGenerator(3),
  MAZEWALLS: []
}
exports.maze3.MAZEWALLS.push(exports.maze3.MAZE.placeMinimal())
exports.maze4 = {
  MAZE: new MazeGenerator(4),
  MAZEWALLS: []
}
exports.maze4.MAZEWALLS.push(exports.maze4.MAZE.placeMinimal())
exports.maze8 = {
  MAZE: new MazeGenerator(8),
  MAZEWALLS: []
}
exports.maze8.MAZEWALLS.push(exports.maze8.MAZE.placeMinimal())
exports.maze10 = {
  MAZE: new MazeGenerator(10),
  MAZEWALLS: []
}
exports.maze10.MAZEWALLS.push(exports.maze10.MAZE.placeMinimal())
exports.maze11 = {
  MAZE: new MazeGenerator(11),
  MAZEWALLS: []
}
exports.maze11.MAZEWALLS.push(exports.maze11.MAZE.placeMinimal())
exports.maze12 = {
  MAZE: new MazeGenerator(12),
  MAZEWALLS: []
}
exports.maze12.MAZEWALLS.push(exports.maze12.MAZE.placeMinimal())
exports.maze5 = {
  MAZE: new MazeGenerator(5),
  MAZEWALLS: []
}
exports.maze5.MAZEWALLS.push(exports.maze5.MAZE.placeMinimal())
*/
//console.log(exports.maze1.MAZEWALLS)
//document.body.appendChild()


