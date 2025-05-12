let canvas = document.getElementById("meuCanvas");
let ctx = canvas.getContext("2d");

let menuInicial = document.getElementById('menuInicial'); 
let botaoJogar = document.getElementById('botaoJogar'); 
let botaoReiniciar = document.getElementById('botaoReiniciar');
let botaoMenu = document.getElementById('botaoMenu'); 
let botoesFimDeJogo = document.getElementById('botoesFimDeJogo');
let gameContainer = document.getElementById('gameContainer');

let gameState = "menu";

let somTiro = new Audio("e-somtiros.mp3");
let somExplosao = new Audio("e-somexplosão.mp3");
let somGameOver = new Audio("e-somfimdejogo.mp3");
let musicaFundo = new Audio("e-somjogo.mp3");

musicaFundo.loop = true;
musicaFundo.volume = 0.5;

let player = new Image();
player.src = "espacialnaveplayer-game.png";
let background = new Image();
background.src = "fundo-canvas.png";
let bullet = new Image();
bullet.src = "fogotiros-game.png";
let enemyImage = new Image();
enemyImage.src = "enemy-game.png";
let explosionImage = new Image();
explosionImage.src = "explosão-game.png";

let bg1Y = 0;
let bg2Y = -canvas.height;
let playerSpeed = 1;
let pX = 400; 
let pY = canvas.height - 100; 
let pW = 110; 
let pH = 110; 
let bW = 40;
let bH = 40;
let bSpeed = 10; 
let bullets = Array(8).fill([400, -100]).map(b => [...b]);

canvas.addEventListener("click", () => {
    for (let i = 0; i < bullets.length; i++) {
        if (bullets[i][1] < -100) { 
            somTiro.currentTime = 0;
            somTiro.play(); 
            bullets[i][0] = pX + pW / 2 - bW / 2;
            bullets[i][1] = pY;
            break;
        }
    }
});

let enemies = [];
let enemyW = 55;
let enemyH = 55;
let enemyBaseSpeedVertical = 1.5; 
let enemyVerticalSpeedVariation = 0.5; 
let enemyBaseSpeedHorizontal = 0.5; 
let dW = 70; 
let dH = 70; 
let explosions = [];
let score = 0;
let fase = 1;
const maxFase = 14;
let qtdPedrasFase = 3;
let gameStage = 0; 
let stageTimer = 0; 
let intervalId; 

canvas.addEventListener("mousemove", function (event) {
    let rect = canvas.getBoundingClientRect();
    let cX = event.clientX - rect.left;
    pX = Math.max(0, Math.min(cX - pW / 2, canvas.width - pW));
    pY = canvas.height - pH;
});

function desenha() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawBullets() {
    bg1Y += playerSpeed;
    bg2Y += playerSpeed;
    if (bg1Y >= canvas.height) bg1Y = bg2Y - canvas.height;
    if (bg2Y >= canvas.height) bg2Y = bg1Y - canvas.height;
    
    ctx.drawImage(background, 0, bg1Y, canvas.width, canvas.height);
    ctx.drawImage(background, 0, bg2Y, canvas.width, canvas.height);
    ctx.drawImage(player, pX, pY, pW, pH);
    
    for (let b of bullets) {
        b[1] -= bSpeed;
        ctx.drawImage(bullet, b[0], b[1], bW, bH);
    }
    
    drawScore();
}

function drawEnemies() {
    if (enemies.length === 0 && gameStage === 3) createEnemies();

    let allDead = true; 

    for (let i = 0; i < enemies.length; i++) {
        let e = enemies[i];
        if (!e.alive) continue;
        allDead = false;
        e.x += e.xSpeed;
        e.y += e.ySpeed;

        if (e.x < 0 || e.x > canvas.width - enemyW) e.xSpeed *= -1;
        if (e.y > canvas.height + enemyH) e.alive = false;

        ctx.drawImage(enemyImage, e.x, e.y, enemyW, enemyH);

        for (let b of bullets) {
            if (b[1] > -100 && b[0] < e.x + enemyW && b[0] + bW > e.x && b[1] < e.y + enemyH && b[1] + bH > e.y) {
                explosions.push({ x: e.x, y: e.y, timer: 15 });
                e.alive = false;
                b[1] = -200;
                score += 20;
                somExplosao.currentTime = 0;
                somExplosao.play();
            }
        }

        if (e.y + enemyH >= canvas.height ||
            (e.x < pX + pW && e.x + enemyW > pX && e.y < pY + pH && e.y + enemyH > pY)) {
            gameOver();
            return;
        }
    }

    if (allDead && fase <= maxFase && gameStage === 3) {
        fase++;
        qtdPedrasFase += 2;
        enemies = [];
        gameStage = 0;
        stageTimer = 0;
    }

    if (fase > maxFase) {
        gameOver(true);
    }
}

function createEnemies() {
    enemies = [];
    for (let i = 0; i < qtdPedrasFase; i++) {
        const x = Math.random() * (canvas.width - enemyW);
        const y = -enemyH;
        const xSpeed = (Math.random() - 0.5) * enemyBaseSpeedHorizontal * 2;
        const ySpeed = Math.random() * enemyVerticalSpeedVariation + enemyBaseSpeedVertical;
        enemies.push({ x, y, alive: true, xSpeed, ySpeed });
    }
}

function drawExplosions() {
    for (let i = explosions.length - 1; i >= 0; i--) {
        let e = explosions[i];
        ctx.drawImage(explosionImage, e.x + enemyW / 2 - dW / 2, e.y + enemyH / 2 - dH / 2, dW, dH);
        e.timer--;
        if (e.timer <= 0) explosions.splice(i, 1);
    }
}

function drawScore() {
    ctx.fillStyle = "#b7bbba";
    ctx.font = "20px Arial";
    ctx.fillText("Score: " + score, 20, 30);
}

function drawStageText() {
    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    let text = "";
    switch (gameStage) {
        case 0: text = "Fase " + fase; break;
        case 1: text = "Ready?"; break;
        case 2: text = "Go!"; break;
    }
    ctx.fillText(text, canvas.width / 2 - 50, canvas.height / 2);

    if (stageTimer >= 60) {
        stageTimer = 0;
        gameStage++;
        if (gameStage > 2) {
            gameStage = 3;
            if (enemies.length === 0) createEnemies();
        }
    }
    stageTimer++;
}

function jogar() {
    desenha();
    drawBullets();
    if (gameStage === 3) drawEnemies();
    drawExplosions();
    drawStageText();
}

function gameOver(vitoria = false) {
    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    let texto = vitoria ? "Você venceu!" : "Fim de Jogo!";
    ctx.fillText(`${texto} Pontuação Final: ${score}`, canvas.width / 2 - 200, canvas.height / 2);
    clearInterval(intervalId);
    somGameOver.currentTime = 0;
    somGameOver.play();
    musicaFundo.pause();
    musicaFundo.currentTime = 0;
    botoesFimDeJogo.style.display = 'flex';
    botaoReiniciar.style.display = 'block';
    botaoMenu.style.display = 'block';
    canvas.style.cursor = 'default';
}

function iniciarJogo() {
    score = 0;
    fase = 1;
    qtdPedrasFase = 3;
    enemies = [];
    explosions = [];
    bullets = bullets.map(() => [400, -100]);
    stageTimer = 0;
    gameStage = 0;
    gameState = "jogando";
    canvas.style.display = 'block';
    canvas.style.cursor = 'none';
    menuInicial.style.display = 'none';
    botoesFimDeJogo.style.display = 'none';
    musicaFundo.currentTime = 0;
    musicaFundo.play();
    clearInterval(intervalId);
    intervalId = setInterval(jogar, 1000 / 60);
}

function reiniciarJogo() {
    iniciarJogo();
}

function voltarAoMenu() {
    clearInterval(intervalId);
    musicaFundo.pause();
    musicaFundo.currentTime = 0;
    enemies = [];
    explosions = [];
    bullets = bullets.map(() => [400, -100]);
    fase = 1;
    score = 0;
    gameStage = 0;
    stageTimer = 0;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    canvas.style.display = 'none';
    gameContainer.style.display = 'none';
    botoesFimDeJogo.style.display = 'none';
    menuInicial.style.display = 'flex';
    menuInicial.classList.remove('fade-out');
    void menuInicial.offsetWidth;
    menuInicial.classList.add('fade-in');
    canvas.style.cursor = 'default';
    gameState = "menu";
}

document.addEventListener('DOMContentLoaded', function () {
    botaoJogar.addEventListener('click', () => {
        menuInicial.classList.add('fade-out');
        setTimeout(() => {
            menuInicial.style.display = 'none';
            gameContainer.style.display = 'block';
            gameContainer.classList.add('fade-in');
            iniciarJogo();
        }, 500);
    });

    botaoReiniciar.addEventListener('click', reiniciarJogo);
    botaoMenu.addEventListener('click', voltarAoMenu);
});

canvas.style.cursor = 'none';