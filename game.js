const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const startButton = document.getElementById('startButton');

// Set canvas size for mobile
canvas.width = 400;
canvas.height = 600;

// Game variables
let gameStarted = false;
let gameOver = false;
let score = 0;
const winningScore = 20; // Score needed to win the game
const snowParticles = Array(30).fill().map(() => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    speed: Math.random() * 0.5 + 0.1 // Slower snow
}));

// Load player image
const playerImage = new Image();
playerImage.src = 'assets/Me_For_FlappyBird.png';

// Player
const player = {
    x: canvas.width / 3,
    y: canvas.height / 2,
    width: 50,
    height: 50,
    gravity: 0.5,
    velocity: 0,
    jump: -8,
    rotation: 0
};

// Christmas trees (obstacles)
const initialTreeGap = 250; // Bigger initial gap
let currentTreeGap = initialTreeGap;
const minTreeGap = 150; // Minimum gap size
const gapDecrease = 5; // How much the gap decreases per tree
const trees = [];
const treeWidth = 60;

class Tree {
    constructor() {
        this.x = canvas.width;
        this.width = treeWidth;
        this.topHeight = Math.random() * (canvas.height - currentTreeGap - 100) + 50;
        this.bottomY = this.topHeight + currentTreeGap;
        this.passed = false;
    }

    draw() {
        // Draw top tree (upside down)
        drawChristmasTree(this.x, this.topHeight, true);
        
        // Draw bottom tree
        drawChristmasTree(this.x, this.bottomY, false);
    }
}

function drawChristmasTree(x, y, isUpsideDown) {
    const treeHeight = 120;
    const triangleHeight = treeHeight * 0.8;
    
    ctx.fillStyle = '#4a2810'; // trunk color
    
    if (isUpsideDown) {
        // Draw trunk all the way up, but stop at triangle
        ctx.fillRect(x + treeWidth/3, 0, treeWidth/3, y - triangleHeight);
        
        // Draw tree triangles (flipped)
        ctx.fillStyle = '#0f5132'; // tree color
        ctx.beginPath();
        ctx.moveTo(x, y - triangleHeight);
        ctx.lineTo(x + treeWidth/2, y);
        ctx.lineTo(x + treeWidth, y - triangleHeight);
        ctx.closePath();
        ctx.fill();
    } else {
        // Draw trunk all the way down
        ctx.fillRect(x + treeWidth/3, y, treeWidth/3, canvas.height - y);
        
        // Draw tree triangles
        ctx.fillStyle = '#0f5132'; // tree color
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + treeWidth/2, y - triangleHeight);
        ctx.lineTo(x + treeWidth, y);
        ctx.closePath();
        ctx.fill();
    }
}

// Background
const background = {
    draw() {
        // Sky
        ctx.fillStyle = '#1a472a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Update and draw snow
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        snowParticles.forEach(particle => {
            particle.y += particle.speed;
            if (particle.y > canvas.height) {
                particle.y = 0;
                particle.x = Math.random() * canvas.width;
            }
            
            // Draw snowflake
            const size = 4;
            ctx.save();
            ctx.translate(particle.x, particle.y);
            
            // Draw the main cross
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                ctx.moveTo(0, -size);
                ctx.lineTo(0, size);
                ctx.moveTo(-size, 0);
                ctx.lineTo(size, 0);
                ctx.stroke();
                ctx.rotate(Math.PI / 4);
            }
            
            ctx.restore();
        });
    }
};

// Game functions
function createTree() {
    if (trees.length === 0 || trees[trees.length - 1].x < canvas.width - 250) {
        trees.push(new Tree());
        // Decrease gap size for next tree
        if (currentTreeGap > minTreeGap) {
            currentTreeGap = Math.max(minTreeGap, currentTreeGap - gapDecrease);
        }
    }
}

function handleJump(e) {
    if ((e.type === 'click' || e.type === 'touchstart') && !gameOver) {
        if (!gameStarted) {
            startGame();
        } else {
            player.velocity = player.jump;
        }
    }
}

function checkCollision(tree) {
    const playerRight = player.x + player.width;
    const playerLeft = player.x;
    const treeRight = tree.x + tree.width;
    const treeLeft = tree.x;

    if (playerRight > treeLeft && playerLeft < treeRight) {
        if (player.y < tree.topHeight || player.y + player.height > tree.bottomY) {
            return true;
        }
    }
    return false;
}

function drawPlayer() {
    ctx.save();
    ctx.translate(player.x + player.width/2, player.y + player.height/2);
    
    // Calculate rotation based on velocity
    player.rotation = Math.min(Math.max(player.velocity * 3, -Math.PI/4), Math.PI/4);
    ctx.rotate(player.rotation);
    
    // Draw the image
    ctx.drawImage(
        playerImage,
        -player.width/2,
        -player.height/2,
        player.width,
        player.height
    );
    
    ctx.restore();
}

function drawScore() {
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText(`Score: ${score}`, 10, 30);
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Center everything
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Game Over text
    ctx.fillStyle = 'white';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', centerX, centerY - 50);
    
    // Score text
    ctx.font = '24px Arial';
    ctx.fillText(`Score: ${score}`, centerX, centerY + 10);
    
    // Retry button
    const buttonWidth = 120;
    const buttonHeight = 40;
    const buttonX = centerX - buttonWidth / 2;
    const buttonY = centerY + 40;
    
    ctx.fillStyle = '#c41e3a';
    ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
    
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText('Retry', centerX, buttonY + 25);
    
    // Store button coordinates for click detection
    window.retryButton = {
        x: buttonX,
        y: buttonY,
        width: buttonWidth,
        height: buttonHeight
    };
}

function startGame() {
    gameStarted = true;
    gameOver = false;
    score = 0;
    currentTreeGap = initialTreeGap; // Reset gap size
    player.y = canvas.height / 2;
    player.velocity = 0;
    trees.length = 0;
    startScreen.style.display = 'none';
    animate();
}

function animate() {
    if (!gameOver) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw background
        background.draw();
        
        // Update player
        player.velocity += player.gravity;
        player.y += player.velocity;
        
        // Create and update trees
        createTree();
        
        trees.forEach((tree, index) => {
            tree.x -= 2;
            
            // Check for score
            if (!tree.passed && tree.x + tree.width < player.x) {
                score++;
                tree.passed = true;
                
                // Check for victory
                if (score >= winningScore) {
                    window.location.href = 'victory.html';
                    return;
                }
            }
            
            // Remove off-screen trees
            if (tree.x + tree.width < 0) {
                trees.splice(index, 1);
            }
            
            // Check for collision
            if (checkCollision(tree)) {
                gameOver = true;
            }
            
            tree.draw();
        });
        
        // Check boundaries
        if (player.y + player.height > canvas.height || player.y < 0) {
            gameOver = true;
        }
        
        drawPlayer();
        drawScore();
        
        requestAnimationFrame(animate);
    } else {
        drawGameOver();
    }
}

// Event listeners
canvas.addEventListener('click', handleJump);
canvas.addEventListener('touchstart', handleJump);
startButton.addEventListener('click', startGame);

// Handle canvas click for retry
canvas.addEventListener('click', (e) => {
    if (gameOver) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        const clickX = (e.clientX - rect.left) * scaleX;
        const clickY = (e.clientY - rect.top) * scaleY;
        
        const button = window.retryButton;
        
        if (button && 
            clickX >= button.x && 
            clickX <= button.x + button.width && 
            clickY >= button.y && 
            clickY <= button.y + button.height) {
            startGame();
        }
    }
});

// Also handle touch events for retry
canvas.addEventListener('touchstart', (e) => {
    if (gameOver) {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        const clickX = (touch.clientX - rect.left) * scaleX;
        const clickY = (touch.clientY - rect.top) * scaleY;
        
        const button = window.retryButton;
        
        if (button && 
            clickX >= button.x && 
            clickX <= button.x + button.width && 
            clickY >= button.y && 
            clickY <= button.y + button.height) {
            startGame();
        }
    }
});

// Initial draw
background.draw();
