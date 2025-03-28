let boy = document.getElementById("boy");
let guard = document.getElementById("guard");
let book = document.getElementById("book");

let inital_speed = 20;
let points_counter = 0;
let score = 0;

let boyIsMoving = false;
let boy_speed = inital_speed;
let guard_speed = inital_speed;

// Get the height of the page
var pageHeight = window.innerHeight - 70;
var pageWidth = window.innerWidth - 70;

setRandomPosition(boy);
setRandomPosition(guard);
setRandomPosition(book);

// Add these variables at the top
let direction = { x: 0, y: 0 };
let keys = {};

// Add at the top with other initial variables
let unlockedLevels = ['1']; // Start with only level 1 unlocked
const POINTS_TO_WIN = 4;
const POINTS_FOR_EXTENDED = 8; // Score needed to unlock extended version
let isExtendedMode = false;
let guard2 = null; // Second guard for extended mode

function setRandomPosition(element, minDistanceFromBoy = 0) {
    let validPosition = false;
    let randomNumberHeight, randomNumberWidth;
    const minDistance = (element === guard) ? 400 : 200; // Guard must be at least 400px away

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

            // Enforce minimum distances
            validPosition = (element === guard) ? 
                          distance >= 400 :  // Guard must be far from boy
                          (distance >= 200 && guardDistance >= 200); // Book must be away from both
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
    
    // Hide the buttons initially
    continueBtn.style.display = 'none';
    menuBtn.style.display = 'none';

    if (isGameOver) {
        // Show both restart and menu buttons on game over
        menuBtn.style.display = 'block';
        continueBtn.style.display = 'block';
        continueBtn.textContent = 'RESTART';
        
        menuBtn.onclick = () => {
            modal.style.display = 'none';
            backToMenu();
        };
        
        continueBtn.onclick = () => {
            modal.style.display = 'none';
            // Restart the current level
            restartLevel();
        };
    } else {
        // Change countdown from 3 to 1 second
        let countdown = 1;
        modalText.textContent = `${message}\n\nNext round in: ${countdown}`;
        
        const countdownInterval = setInterval(() => {
            countdown--;
            modalText.textContent = `${message}\n\nNext round in: ${countdown}`;
            
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                modal.style.display = 'none';
                restartGame();
            }
        }, 1000);
    }
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
            score += 1;
            message = `POINT SCORED!\nSCORE: ${score}`;
            guard_speed += 2;
            boy_speed += 1;
            points_counter += 1;
        } else {
            message = `GAME OVER\nFINAL SCORE: ${score}`;
            gameAudio.pause();
        }
        showModal(message, obj !== book);
    }
}

function moveBoy(event) {
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

function createSecondGuard() {
    guard2 = document.createElement('div');
    guard2.id = 'guard2';
    guard2.style.cssText = guard.style.cssText; // Copy styles from first guard
    document.getElementById('game').appendChild(guard2);
    setRandomPosition(guard2, 400);
}

function moveGuard2() {
    if (!guard2) return;
    
    let xDiff = boy.offsetLeft - guard2.offsetLeft;
    let yDiff = boy.offsetTop - guard2.offsetTop;
    
    if (Math.abs(xDiff) > Math.abs(yDiff)) {
        if (xDiff > 0) {
            guard2.style.left = (guard2.offsetLeft + guard_speed) + "px";
        } else {
            guard2.style.left = (guard2.offsetLeft - guard_speed) + "px";
        }
    } else {
        if (yDiff > 0) {
            guard2.style.top = (guard2.offsetTop + guard_speed) + "px";
        } else {
            guard2.style.top = (guard2.offsetTop - guard_speed) + "px";
        }
    }
    
    checkCollision(boy, guard2);
}

function startExtendedMode() {
    isExtendedMode = true;
    document.body.style.backgroundColor = '#000000'; // Using hex code for more reliable black
    
    // Change the audio to extended version
    gameAudio.pause();
    const currentLevel = gameAudio.src.split('/').pop().split('.')[0];
    gameAudio = new Audio(`res/audios/extended/${currentLevel}_extended_cut.mp3`);
    gameAudio.play();
    
    // Add second guard
    createSecondGuard();
    setInterval(moveGuard2, 45);
    
    // Show transition message
    showModal("Extended Mode Activated!\nDouble the guards, double the challenge!", false);
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
    
    if (guard2) {
        guard2.remove();
        guard2 = null;
    }
    isExtendedMode = false;
    document.body.style.backgroundColor = ''; // Reset background color
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
    // Check if level is unlocked
    if (!unlockedLevels.includes(number)) {
        showModal("Complete the previous level first!", true);
        return;
    }

    document.getElementById("levels").style.display = 'none';
    document.getElementById("game").style.display = 'block';
    document.getElementById("levels_title").style.display = 'none';
    
    document.addEventListener("keydown", moveBoy);
    document.addEventListener("keyup", stopBoy);
    
    soundtrack.currentTime = 0;
    soundtrack.pause();

    switch(number){
        case '1':
            var gameAudioName = "res/audios/1.mp3"
            var speed = 10
            break;
        case '2':
            var gameAudioName = "res/audios/2.mp3"
            var speed = 12
            break;
        case '3':
            var gameAudioName = "res/audios/3.mp3"
            var speed = 14
            break;
        case '4':
            var gameAudioName = "res/audios/4.mp3"
            var speed = 16
            break;
    }
    
    gameAudio = new Audio(gameAudioName);
    inital_speed = speed;
    boy_speed = speed;
    guard_speed = speed * 0.9;
    points_counter = 0;
    score = 0;
    
    // Add event listener for when song ends
    gameAudio.addEventListener('ended', () => {
        // If we have enough points, start extended mode instead of ending
        if (score >= POINTS_FOR_EXTENDED && !isExtendedMode) {
            startExtendedMode();
        } else {
            // Stop all intervals immediately
            let intervals = window.setInterval(() => {}, 100000);
            for(let i = 0; i <= intervals; i++) {
                window.clearInterval(i);
            }
            
            // Remove movement controls
            document.removeEventListener("keydown", moveBoy);
            document.removeEventListener("keyup", stopBoy);
            
            if (score >= POINTS_TO_WIN) {
                const nextLevel = (parseInt(number) + 1).toString();
                if (nextLevel <= '4' && !unlockedLevels.includes(nextLevel)) {
                    unlockedLevels.push(nextLevel);
                }
                
                let message;
                if (isExtendedMode) {
                    message = `EXTENDED LEVEL COMPLETE!\nAmazing Score: ${score}\nNext level unlocked!`;
                } else {
                    message = `LEVEL COMPLETE!\nFinal Score: ${score}\nNext level unlocked!`;
                }
                showModal(message, true);
            } else {
                showModal(`Level Failed!\nYou need at least ${POINTS_TO_WIN} points to complete the level.\nFinal Score: ${score}`, true);
            }
        }
    });
    
    setInterval(moveGuard, 45);
    setInterval(updateBoyPosition, 16);
    gameAudio.play();
}

function showLevels(){
    var levels = document.getElementById("levels");
    document.getElementById("start_button_container").style.display = 'none';
    backToMenu();
    document.getElementById("levels_title").style.display = 'block';
    
    // Update level rectangles to show locked/unlocked status
    for (let i = 1; i <= 4; i++) {
        const levelRect = document.getElementById(`rectangle${i}`);
        if (unlockedLevels.includes(i.toString())) {
            levelRect.style.opacity = "1";
            levelRect.style.cursor = "pointer";
        } else {
            levelRect.style.opacity = "0.5";
            levelRect.style.cursor = "not-allowed";
        }
    }
    
    levels.style.display = "block";
}

// Update restartLevel to reset score
function restartLevel() {
    score = 0;
    points_counter = 0;
    boy_speed = inital_speed;
    guard_speed = inital_speed * 0.9;
    
    gameAudio.currentTime = 0;
    restartGame();
    gameAudio.play();
}
