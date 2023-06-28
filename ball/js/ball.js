let game = {
    status: 1,
    aimDir: {x: 0, y: 0},
    collisions : [], // {x: 0, y: 0, radius: 2, color: "#1234bc"}
    base: {x: 250, y: 800},
    times: 10,
    timer: -1,
    basSpeed: 6,
    speed: 1,
    speedAdd: 0,
    running: null,
    totalDist: 0,
    distInterval: 15,
    lastDist: 0,
    gameMode: 4
}

const BallStatus = {
    CREATING : 1,
    MOVING : 2,
    MOVED : 3,
    DESTROY : 4
}

function objToString(o) {
    let s = "{";
    let sep = "";
    for (let k in o) {
        s += sep + k + ":";
        if (typeof(o[k]) == "object") {
            s += objToString(o[k]);    
        } else {
            s += o[k];
        }
        if (sep == "")
            sep = ",";
    }
    s += "}";
    return s;
}

function aim() {
    let n = game.aimDir;
    let start = game.base;
    let lastLine = null;
    while (game.collisions.length < game.times) {
        let collide = getNextCollision(start, n, lastLine);
        if (collide.point == null || (collide.point.x == start.x && collide.point.y == start.y)) {
            console.log("collide times:" + game.collisions.length);
            showVec("start", start);
            showVec("dir", n);
            console.log("collide:" + objToString(collide));
            break;
        }
            
        game.collisions.push({x: collide.point.x, y: collide.point.y, radius: 2, color: "#1234bc"});

        let reflect = getReflectNorm(n, collide.line);
        start = collide.point;
        n = reflect;
        lastLine = collide.line;
    }
    draw();
}

function test() {
    let line = {x1:198,y1:630,x2:170,y2:645,color:"#004411",mid:17,normal:{x:-0.472221412515419,y:-0.8814799700287821}};
    let dir = {x:-0.39691115068546706, y:-0.9178570359601427};
    let start = game.base;//{x:176.32978723404258,y:641.6090425531914};
    let end = {x: start.x + dir.x * 1400, y: start.y + dir.y * 1400};
    let l = {x1: start.x, y1: start.y, x2: end.x, y2: end.y, color:"#bbaa11"};
    let lines = [
        {x1: 0, y1: 0, x2: canvas.width, y2: 0, color: "#00aa11"},
        {x1: canvas.width, y1: 0, x2: canvas.width, y2: canvas.height, color: "#00aa11"},
        {x1: canvas.width, y1: canvas.height, x2: 0, y2: canvas.height, color: "#00aa11"},
        {x1: 0, y1: canvas.height, x2: 0, y2: 0, color: "#00aa11"},
        line
    ];

    for (let i = 0; i < 4; i++) {
        lines[i].normal = normalize(normalVector(vector(lines[i])));
    }
    
    drawLine(line);
    drawLine(l);
    
    let collide = checkNextInterpoint(l, lines);
    if (collide.point == null) {
        console.log("no collide.");
        return;
    }
    console.log("collide:" + objToString(collide));
    let n = getReflectNorm(dir, collide.line);
    showVec("reflect", n);
    let dl = {x1: collide.point.x, y1: collide.point.y, x2: collide.point.x + n.x * 100, y2: collide.point.y + n.y * 100, color:"#00aa11"};
    drawLine(dl);
    let b1 = {x: dl.x1, y: dl.y1, radius:3, color: "#2233cc"};
    let b2 = {x: dl.x2, y: dl.y2, radius:3, color: "#cc3322"};
    drawBall(b1);
    drawBall(b2);
}

function loadBalls() {
    let cmd = ldata.cmds.shift();
    while (cmd.type == CmdType.CREATE_BALL) {
        rdata.balls.push({
            id: cmd.id,
            x: game.base.x,
            y: game.base.y,
            radius: 5,
            color: "#ac2243",
            dir: {x:cmd.dir.x, y:cmd.dir.y},
            status: BallStatus.CREATING,
            dist: 0,
        });
        cmd = ldata.cmds.shift();
    }
    game.running = cmd;
}

function ballMove(ball) {
    ball.x += ball.dir.x * (game.speed - ball.dist);
    ball.y += ball.dir.y * (game.speed - ball.dist);
    ball.status = BallStatus.MOVED;
}

function startDebug() {
    game.running = ldata.cmds.shift();
    console.log("cmd:" + objToString(game.running));
    game.timer = setInterval(updateDebug, 10);
}

function onfinish() {
    if (ldata.cmds.length == 0) {
        game.status = 1;
        rdata.balls.length = 0;
        rdata.status = game.status;

        if (game.timer != -1) {
            clearInterval(game.timer);
            game.timer = -1;
        }

        if (cmd.type == CmdType.WIN) {
            console.log("win.");
            game.status = 3;
            rdata.status = game.status;
            draw();
        }
    }
}

function updateDebug() {
    let cmd = game.running;
    let ball = rdata.balls[cmd.id-1];
    ball.dist = 0;
    if (ball.status == BallStatus.CREATING) {
        ball.status = BallStatus.MOVING;
    }
    let dist = length({x: cmd.target.x - ball.x, y: cmd.target.y - ball.y});
    if (dist <= game.speed - ball.dist) {
        if (cmd.reflect == null) {
            ball.status = BallStatus.DESTROY;
        } else {
            assignPoint(cmd.reflect, ball.dir);
        }
        assignPoint(cmd.target, ball);
        ball.target = null;
        ball.dist += dist;

        // 移除死亡的单位
        if (cmd.dmg != null && cmd.dmg.hp == 0) {
            let temp = [];
            for (let l of rdata.lines) {
                if (!l.mid || l.mid != cmd.dmg.id) {
                    temp.push(l);
                }
            }
            rdata.lines = temp;
        }
        console.log("move finish.")
        game.running = null;
        clearInterval(game.timer);
        game.timer = -1;
    } else {
        ballMove(ball);
    }

    draw();
    onfinish();
}

function update() {
    // 按照间隔解锁球,初始化一帧的状态
    for (let ball of rdata.balls) {
        if (ball.status == BallStatus.CREATING) {
            if (game.totalDist >= (ball.id - 1) * game.distInterval) {
                ball.status = BallStatus.MOVING;
            } else {
                break;
            }
        } else if (ball.status != BallStatus.DESTROY) {
            ball.status = BallStatus.MOVING;
            ball.dist = 0;
        }
    }

    // 优先执行命令，看看有没有碰撞
    let cmd = game.running;
    while (true) {
        let ball = rdata.balls[cmd.id-1];
        if (ball.status != BallStatus.MOVING) {
            console.error("cmd ball is not moving.")
            break;
        }
        //console.log(">run cmd ball:" + objToString(ball));

        let dist = length({x: cmd.target.x - ball.x, y: cmd.target.y - ball.y});
        if (game.lastDist > 0 && dist > game.lastDist) {
            console.error("ball " + ball.id + " is far away from target. ");
            console.log("dist:" + dist + ", lastdist:" + game.lastDist);
            console.log("ball.id:" + ball.id + ", cmd.id:" + cmd.id);
            console.log("ball count:" + rdata.balls.length);
            showVec("last point", game.lastPt);
            showVec("current point", ball);
            showVec("target", cmd.target);
            if (ball.target)
                showVec("ball target", ball.target);
            else
                console.log("ball target is null");
            showVec("old dir", ball.dir);
            ball.dir = normalize({x: cmd.target.x - ball.x, y: cmd.target.y - ball.y});
            showVec("new dir", ball.dir);
        }
        game.lastDist = dist;
        game.lastPt = copyPoint(ball);
        ball.target = copyPoint(cmd.target);
        //console.log("ball:" + objToString(ball));
        //console.log("dist:" + dist);
        if (dist <= game.speed - ball.dist) {
            if (cmd.reflect == null) {
                ball.status = BallStatus.DESTROY;
            } else {
                assignPoint(cmd.reflect, ball.dir);
            }
            assignPoint(cmd.target, ball);
            ball.target = null;
            ball.dist += dist;

            // 移除死亡的单位
            if (cmd.dmg != null && cmd.dmg.hp == 0) {
                let temp = [];
                for (let l of rdata.lines) {
                    if (!l.mid || l.mid != cmd.dmg.id) {
                        temp.push(l);
                    }
                }
                rdata.lines = temp;
            }

            cmd = ldata.cmds.shift();
            game.lastDist = 0;
            game.lastPt = null;
            //console.log("next cmd:" + objToString(cmd));
            if (cmd.type != CmdType.COLLIDE) {
                break;
            }
            game.running = cmd;
        } else {
            ballMove(ball);
            break;
        }
    }

    // 最后执行其他球的移动
    for (let ball of rdata.balls) {
        if (ball.status == BallStatus.MOVING) {
            ballMove(ball);
        }
    }
    
    game.totalDist += game.speed;
    game.speed += game.speedAdd;

    draw();
    onfinish();
}

function initRender() {
    rdata.lines.length = 0;
    for (let l of ldata.lines) {
        rdata.lines.push(copyLine(l));
    }
    rdata.status = game.status;
    rdata.base = game.base;
    rdata.collisions = game.collisions;
}

function reset() {
    initLogic(game.base, game.times, game.distInterval);
    initRender();
}

function initialze() {
    loadData(function () {
        reset();
        addEventListener("mousemove", (evt) => {
            let coord = document.getElementById("coord");
            coord.innerHTML = "坐标：" + evt.offsetX + "," + evt.offsetY;
            if (game.status != 1) {
                return;
            }
            game.collisions.length = 0;
            let v = {x: evt.offsetX - game.base.x, y: evt.offsetY - game.base.y};
            game.aimDir = normalize(v);
            coord.innerHTML += "  方向：" + game.aimDir.x + "," + game.aimDir.y;
            aim();
        });

        addEventListener("mousedown", (evt) => {
            if (game.status != 1) {
                return;
            }
            game.status = game.gameMode;
            game.totalDist = 0;
            game.speed = game.basSpeed;
            rdata.status = game.status;
            startRound(game.aimDir);
            updateRound();
            console.log("cmd count:" + ldata.cmds.length);
            loadBalls();
            console.log("cmd count:" + ldata.cmds.length);
            if (game.status == 2) {
                game.timer = setInterval(update, 10);
            } else if (game.status == 4) {
                startDebug();
            }
        });

        addEventListener("keydown", (evt) => {
            if (game.status == 2) {
                if (game.timer == -1) {
                    game.timer = setInterval(update, 10);
                } else {
                    clearInterval(game.timer);
                    game.timer = -1;
                }
            } else if (game.status == 1) {
                game.logaim = !game.logaim;
                aim();
            } else if (game.status == 4) {
                if (game.timer == -1) {
                    startDebug();
                }
            }
        })
    });   
}

initialze();
//test();