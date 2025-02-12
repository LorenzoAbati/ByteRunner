let boy = document.getElementById("boy");
let guard = document.getElementById("guard");
let book = document.getElementById("book");

let inital_speed = 20;
let points_counter = 0;

let boyIsMoving = false;
let boy_speed = inital_speed;
let guard_speed = inital_speed;

// Get the height of the page
var pageHeight = window.innerHeight - 70;
var pageWidth = window.innerWidth - 70;

setRandomPosition(boy);
setRandomPosition(guard);
setRandomPosition(book);

// Add these variables at the top with your other variables
let powerUpActive = false;
let powerUpTimer = null;
let dashAvailable = true;
let dashCooldown = null;
let score = 0;

// Add these variables at the top
let direction = { x: 0, y: 0 };
let keys = {};

function setRandomPosition(element, minDistanceFromBoy = 0) {
    let validPosition = false;
    let randomNumberHeight, randomNumberWidth;
    const safeDistance = 100; // Minimum 100px distance between characters

    while (!validPosition) {
        // Keep positions within screen boundaries with padding
        randomNumberHeight = Math.floor(Math.random() * (pageHeight - 100)) + 50;
        randomNumberWidth = Math.floor(Math.random() * (pageWidth - 100)) + 50;

        if (element === boy) {
            validPosition = true;
        } else {
            // Calculate distance from boy
            let boyX = boy.offsetLeft;
            let boyY = boy.offsetTop;
            let distance = Math.sqrt(
                Math.pow(randomNumberWidth - boyX, 2) + 
                Math.pow(randomNumberHeight - boyY, 2)
            );

            // Also check distance from guard if placing book
            let guardDistance = Infinity;
            if (element === book && guard) {
                let guardX = guard.offsetLeft;
                let guardY = guard.offsetTop;
                guardDistance = Math.sqrt(
                    Math.pow(randomNumberWidth - guardX, 2) + 
                    Math.pow(randomNumberHeight - guardY, 2)
                );
            }

            validPosition = distance >= safeDistance && guardDistance >= safeDistance;
        }
    }

    element.style.top = randomNumberHeight + "px";
    element.style.left = randomNumberWidth + "px";
}

// Autonomous guard movement
setInterval(moveGuard, 45);

function isCollision(a, b) {
  let aRect = a.getBoundingClientRect();
  let bRect = b.getBoundingClientRect();

  return !(
    (aRect.bottom < bRect.top) ||
    (aRect.top > bRect.bottom) ||
    (aRect.right < bRect.left) ||
    (aRect.left > bRect.right)
  );
}

function showModal(message, isGameOver) {
    const modal = document.getElementById('gameModal');
    const modalText = document.getElementById('modalText');
    const continueBtn = document.getElementById('modalContinue');
    const menuBtn = document.getElementById('modalMenu');

    modalText.textContent = message;
    modal.style.display = 'flex';

    continueBtn.onclick = () => {
        modal.style.display = 'none';
        restartGame();
    };

    menuBtn.onclick = () => {
        modal.style.display = 'none';
        backToMenu();
    };
}

function checkCollision(boy, obj) {
    if (isCollision(boy, obj)) {
        // Stop all intervals immediately
        let intervals = window.setInterval(() => {}, 100000);
        for(let i = 0; i <= intervals; i++) {
            window.clearInterval(i);
        }
        
        let message;
        if (obj === book) {
            score += powerUpActive ? 2 : 1;
            message = `LEVEL COMPLETE!\nSCORE: ${score}\nPOWER-UP BONUS: ${powerUpActive ? '+1' : '0'}`;
            guard_speed += 3;
            boy_speed += 4;
            points_counter += 1;
        } else {
            message = `GAME OVER\nFINAL SCORE: ${score}`;
            guard_speed = inital_speed;
            boy_speed = inital_speed;
            points_counter = 1;
            score = 0;
            gameAudio.currentTime = 0;
            gameAudio.pause();
        }
        showModal(message, obj !== book);
    }
}

function moveBoy(event) {
    if (event.keyCode === 32) { // Spacebar for dash
        dash();
        return;
    }
    if (event.keyCode === 16) { // Shift for power-up
        activatePowerUp();
        return;
    }
    
    // Handle movement keys
    switch (event.keyCode) {
        case 37: // left arrow
            direction.x = -1;
            direction.y = 0;
            boyIsMoving = true;
            break;
        case 38: // up arrow
            direction.x = 0;
            direction.y = -1;
            boyIsMoving = true;
            break;
        case 39: // right arrow
            direction.x = 1;
            direction.y = 0;
            boyIsMoving = true;
            break;
        case 40: // down arrow
            direction.x = 0;
            direction.y = 1;
            boyIsMoving = true;
            break;
    }
}

function stopBoy(event) {
    // Only stop the direction that was released
    switch (event.keyCode) {
        case 37: // left arrow
            if (direction.x < 0) {
                direction.x = 0;
                boyIsMoving = false;
            }
            break;
        case 39: // right arrow
            if (direction.x > 0) {
                direction.x = 0;
                boyIsMoving = false;
            }
            break;
        case 38: // up arrow
            if (direction.y < 0) {
                direction.y = 0;
                boyIsMoving = false;
            }
            break;
        case 40: // down arrow
            if (direction.y > 0) {
                direction.y = 0;
                boyIsMoving = false;
            }
            break;
    }
}

function updateBoyPosition() {
    if (!boyIsMoving) return;

    let newX = boy.offsetLeft + (direction.x * boy_speed);
    let newY = boy.offsetTop + (direction.y * boy_speed);

    // Screen wrapping
    if (newX < 0) newX = pageWidth;
    if (newX > pageWidth) newX = 0;
    if (newY < 0) newY = pageHeight;
    if (newY > pageHeight) newY = 0;

    boy.style.left = newX + "px";
    boy.style.top = newY + "px";

    checkCollision(boy, book);
}

function moveGuard() {
    let xDiff = boy.offsetLeft - guard.offsetLeft;
    let yDiff = boy.offsetTop - guard.offsetTop;
    
    if (Math.abs(xDiff) > Math.abs(yDiff)) {
        if (xDiff > 0) {
            guard.style.left = (guard.offsetLeft + guard_speed) + "px";
        } else {
            guard.style.left = (guard.offsetLeft - guard_speed) + "px";
        }
    } else {
        if (yDiff > 0) {
            guard.style.top = (guard.offsetTop + guard_speed) + "px";
        } else {
            guard.style.top = (guard.offsetTop - guard_speed) + "px";
        }
    }

    if (boyIsMoving) {
        gameAudio.play();
    }
    
    checkCollision(boy, guard);
}

function restartGame() {
    // Clear all existing intervals
    let intervals = window.setInterval(() => {}, 100000);
    for(let i = 0; i <= intervals; i++) {
        window.clearInterval(i);
    }
    
    boyIsMoving = false;
    setRandomPosition(boy);
    setRandomPosition(guard, 400);  // Minimum distance from boy
    setRandomPosition(book, 300);   // Minimum distance from boy
    
    // Restart the movement intervals
    setInterval(moveGuard, 45);
    setInterval(updateBoyPosition, 16);
    
    // Re-enable movement controls
    document.addEventListener("keydown", moveBoy);
    document.addEventListener("keyup", stopBoy);
}

function backToMenu(){
  document.removeEventListener("keydown", moveBoy);
  document.removeEventListener("keyup", stopBoy);
  document.getElementById("game").style.display = 'none';
  document.getElementById("levels").style.display = 'block';
  document.getElementById("levels_title").style.display = 'block';
  soundtrack = new Audio("res/audios/menu_soundtrack.mp3");
  soundtrack.play();
}

function onRectangleClick(number) {
    document.getElementById("levels").style.display = 'none';
    document.getElementById("game").style.display = 'block';
    document.getElementById("levels_title").style.display = 'none';
    
    document.addEventListener("keydown", moveBoy);
    document.addEventListener("keyup", stopBoy);
    
    soundtrack.currentTime = 0;
    soundtrack.pause();

    switch(number){
        case '1':
            var gameAudioName = "res/audios/stealthebook_strengthboost_20230125T151332.mp3"
            var speed = 10  // Doubled from 5
            break;
        case '2':
            var gameAudioName = "res/audios/stealthebook_strategicsomersaults_20230125T153403.mp3"
            var speed = 12  // Doubled from 6
            break;
        case '3':
            var gameAudioName = "res/audios/stealthebook_fastmode_20230125T153446.mp3"
            var speed = 14  // Doubled from 7
            break;
        case '4':
            var gameAudioName = "res/audios/stealthebook_runningthroughexplosions_20230125T153537.mp3"
            var speed = 16  // Doubled from 8
            break;
    }
    
    gameAudio = new Audio(gameAudioName);
    inital_speed = speed;
    boy_speed = speed;
    guard_speed = speed * 0.8; // Guard stays at 80% of boy's speed
    points_counter = 0;
    
    // Start autonomous guard movement
    setInterval(moveGuard, 45);
    setInterval(updateBoyPosition, 16);
}

function showLevels(){
  var levels = document.getElementById("levels");
  document.getElementById("start_button_container").style.display = 'none';
  backToMenu();
  document.getElementById("levels_title").style.display = 'block';
  
  levels.style.display = "block";
}

// Add these new functions
function activatePowerUp() {
    if (powerUpActive) return;
    powerUpActive = true;
    let originalSpeed = boy_speed;
    boy_speed *= 1.5;
    
    // Visual feedback
    boy.style.boxShadow = "0 0 10px #00ff00";
    
    powerUpTimer = setTimeout(() => {
        powerUpActive = false;
        boy_speed = originalSpeed;
        boy.style.boxShadow = "none";
    }, 3000);
}

function dash() {
    if (!dashAvailable || !boyIsMoving) return;
    
    dashAvailable = false;
    let dashDistance = 150;
    
    // Dash in the last pressed direction
    if (keys[37]) boy.style.left = (boy.offsetLeft - dashDistance) + "px"; // left
    if (keys[38]) boy.style.top = (boy.offsetTop - dashDistance) + "px";   // up
    if (keys[39]) boy.style.left = (boy.offsetLeft + dashDistance) + "px"; // right
    if (keys[40]) boy.style.top = (boy.offsetTop + dashDistance) + "px";   // down
    
    // Visual feedback
    boy.style.boxShadow = "0 0 20px #ff0000";
    
    setTimeout(() => {
        boy.style.boxShadow = "none";
    }, 200);
    
    // Cooldown
    dashCooldown = setTimeout(() => {
        dashAvailable = true;
    }, 2000);
}
