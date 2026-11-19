// Game configuration and state variables
const GOAL_CANS = 25;
const INITIAL_TIME = 270; // 4:30 in seconds
let currentCans = 0;
let timeLeft = INITIAL_TIME;
let gameActive = false;
let spawnInterval = null;
let timerInterval = null;
let snakeInterval = null;
let treeInterval = null;

// Truck lane controls: 0 = Left lane, 1 = Center/Median, 2 = Right lane
let currentLane = 1;
const truckElement = document.querySelector('.truck-back-view');
const objectsLayer = document.getElementById('road-objects-layer');
const treesLayer = document.getElementById('trees-layer');
const feedbackLayer = document.getElementById('feedback-layer') || document.querySelector('.road-scene');
const cansDisplay = document.getElementById('current-cans');
const timerDisplay = document.getElementById('timer');
const startButton = document.getElementById('start-game');

function updateTruckLane() {
  if (!truckElement) return;
  truckElement.classList.remove('lane-0', 'lane-1', 'lane-2');
  truckElement.classList.add(`lane-${currentLane}`);
}

function steerLeft() {
  if (currentLane > 0) {
    currentLane--;
    updateTruckLane();
  }
}

function steerRight() {
  if (currentLane < 2) {
    currentLane++;
    updateTruckLane();
  }
}

// Arrow button click listeners
const leftArrowBtn = document.getElementById('arrow-left-btn');
const rightArrowBtn = document.getElementById('arrow-right-btn');

if (leftArrowBtn) {
  leftArrowBtn.addEventListener('click', steerLeft);
}
if (rightArrowBtn) {
  rightArrowBtn.addEventListener('click', steerRight);
}

// Keyboard arrow controls (Left/Right or A/D)
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
    steerLeft();
  } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
    steerRight();
  }
});

// Format time as M:SS
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// Show floating +1 or hit text effect on the dedicated top layer
function showFloatFeedback(text, color) {
  if (!feedbackLayer) return;
  const feedback = document.createElement('div');
  feedback.className = 'float-feedback';
  feedback.textContent = text;
  if (color) feedback.style.color = color;
  
  // Position right above the truck in the current lane
  const lanePositions = ['36%', '50%', '64%'];
  feedback.style.left = lanePositions[currentLane];
  feedback.style.top = '52%';
  
  feedbackLayer.appendChild(feedback);
  setTimeout(() => feedback.remove(), 880);
}

// Spawn a water can or rock in one of the 3 lanes
function spawnRoadItem() {
  if (!objectsLayer) return;
  
  // Pick a random lane: 0 (Left), 1 (Center), 2 (Right)
  const lane = Math.floor(Math.random() * 3);
  
  // 65% chance water can, 35% chance rock
  const isWater = Math.random() < 0.65;
  const type = isWater ? 'water' : 'rock';
  const imgSrc = isWater ? 'img/water.png' : 'img/rock.png';
  const itemClass = isWater ? 'item-water' : 'item-rock';
  
  const item = document.createElement('img');
  item.className = `spawned-item ${itemClass} lane-${lane}`;
  item.src = imgSrc;
  item.alt = type;
  objectsLayer.appendChild(item);
  
  let collected = false;
  
  // React the moment the item slips under the truck and is no longer visible (~1320ms)
  const collisionDelay = 1320;
  setTimeout(() => {
    if (!item.parentElement) return;
    
    // Check if truck is in the same lane
    if (currentLane === lane) {
      collected = true;
      item.remove(); // Instantly remove so it stays completely hidden under the truck
      
      if (type === 'water') {
        currentCans++;
        if (cansDisplay) cansDisplay.textContent = currentCans;
        const waterWords = ['+1!', 'SPLASH!', 'GLUG!', '+1 NICE!'];
        const word = waterWords[Math.floor(Math.random() * waterWords.length)];
        showFloatFeedback(word, '#FFC907');
      } else {
        // Hit rock
        if (truckElement) {
          truckElement.classList.add('truck-hit');
          setTimeout(() => truckElement.classList.remove('truck-hit'), 350);
        }
        const rockWords = ['CLANG!', 'BONK!', 'CRUNCH!', 'OUCH!'];
        const word = rockWords[Math.floor(Math.random() * rockWords.length)];
        showFloatFeedback(word, '#F5402C');
      }
    }
  }, collisionDelay);
  
  // Auto-clean up item at end of animation (2300ms)
  setTimeout(() => {
    if (item.parentElement && !collected) {
      item.remove();
    }
  }, 2350);
}

// Spawn a snake jumping into the road from the far left or far right grass
function spawnJumpingSnake() {
  if (!objectsLayer) return;
  
  // Only target the far left (lane 0) or far right (lane 2)
  const targetLane = Math.random() < 0.5 ? 0 : 2;
  const jumpClass = targetLane === 0 ? 'snake-jump-left' : 'snake-jump-right';
  
  const snake = document.createElement('img');
  snake.className = `spawned-item item-snake ${jumpClass}`;
  snake.src = 'img/snake.webp';
  snake.alt = 'Jumping snake';
  objectsLayer.appendChild(snake);
  
  let collected = false;
  
  // React the moment the snake slips under the truck and is no longer visible (~1320ms)
  setTimeout(() => {
    if (!snake.parentElement) return;
    
    if (currentLane === targetLane) {
      collected = true;
      snake.remove(); // Instantly remove so it stays completely hidden under the truck
      if (truckElement) {
        truckElement.classList.add('truck-hit');
        setTimeout(() => truckElement.classList.remove('truck-hit'), 350);
      }
      const snakeWords = ['HISS!', 'SNAP!', 'YIKES!'];
      const word = snakeWords[Math.floor(Math.random() * snakeWords.length)];
      showFloatFeedback(word, '#4FCB53');
    }
  }, 1320);
  
  setTimeout(() => {
    if (snake.parentElement && !collected) {
      snake.remove();
    }
  }, 2350);
}

// Smart tree spawner with natural cadence and realistic depth sorting
let treeSideToggle = false;
let treeDepthLeftToggle = false;
let treeDepthRightToggle = false;

function spawnRoadTree(initialDelay) {
  if (!treesLayer) return;
  
  // Alternate sides so trees don't bunch up on one verge
  treeSideToggle = !treeSideToggle;
  const side = treeSideToggle ? 'left' : 'right';
  
  // Alternate between inner (roadside) and outer (background field) tracks
  let depth;
  if (side === 'left') {
    treeDepthLeftToggle = !treeDepthLeftToggle;
    depth = treeDepthLeftToggle ? 'inner' : 'outer';
  } else {
    treeDepthRightToggle = !treeDepthRightToggle;
    depth = treeDepthRightToggle ? 'inner' : 'outer';
  }
  
  const tree = document.createElement('img');
  tree.className = `spawned-tree tree-${side}-${depth}`;
  tree.src = 'img/tree.png';
  tree.alt = '';
  tree.setAttribute('aria-hidden', 'true');
  
  if (initialDelay) {
    tree.style.animationDelay = initialDelay;
  }
  
  // PREPEND to treesLayer so older (closer) trees naturally sit in front of newer (distant) trees!
  treesLayer.prepend(tree);
  
  setTimeout(() => {
    if (tree.parentElement) {
      tree.remove();
    }
  }, 2650);
}

// Cleanly spaced initial landscape
function initTrees() {
  if (!treesLayer) return;
  treesLayer.innerHTML = '';
  // Pre-seed 4 trees cleanly spaced along the roadside
  spawnRoadTree('-1.8s');
  spawnRoadTree('-1.2s');
  spawnRoadTree('-0.6s');
  spawnRoadTree('0s');
}

// Starts or restarts the game
function startGame() {
  currentCans = 0;
  timeLeft = INITIAL_TIME;
  gameActive = true;
  
  if (cansDisplay) cansDisplay.textContent = '0';
  if (timerDisplay) timerDisplay.textContent = formatTime(timeLeft);
  if (objectsLayer) objectsLayer.innerHTML = '';
  
  clearInterval(spawnInterval);
  clearInterval(timerInterval);
  clearInterval(snakeInterval);
  clearInterval(treeInterval);
  
  initTrees();
  
  // Steady, non-overlapping cadence (every 750ms alternating sides)
  treeInterval = setInterval(spawnRoadTree, 750);
  
  // Spawn water cans/rocks every 1.3 seconds
  spawnInterval = setInterval(spawnRoadItem, 1300);
  
  // Snake jumps into the road every 5.5 seconds (from far left or right)
  snakeInterval = setInterval(spawnJumpingSnake, 5500);
  
  // Countdown timer
  timerInterval = setInterval(() => {
    timeLeft--;
    if (timerDisplay) timerDisplay.textContent = formatTime(timeLeft);
    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

function endGame() {
  gameActive = false;
  clearInterval(spawnInterval);
  clearInterval(timerInterval);
  clearInterval(snakeInterval);
  clearInterval(treeInterval);
  alert(`Time's up! You collected ${currentCans} water cans!`);
}

if (startButton) {
  startButton.addEventListener('click', startGame);
}

// Start animations right away so the road is active and lively!
initTrees();
treeInterval = setInterval(spawnRoadTree, 750);
spawnInterval = setInterval(spawnRoadItem, 1400);
snakeInterval = setInterval(spawnJumpingSnake, 6000);
