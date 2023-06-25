let game = {
    status: 1,
    aimDir: {x: 0, y: 0},
    collisions : [], // {x: 0, y: 0, radius: 2, color: "#1234bc"}
    base: {x: 250, y: 800},
    times: 10,
    timer: -1,
    speed: 3,
    running: null,
    totalInterval: 0,
    startInterval: 3
}

function aim() {
    let n = game.aimDir;
    let start = game.base;
    while (game.collisions.length < game.times) {
        let collide = getNextCollision(start, n);
        if (collide.point == null)
            break;
        game.collisions.push({x: collide.point.x, y: collide.point.y, radius: 2, color: "#1234bc"});

        n = getReflectNorm(start, collide);
        start = collide.point;
    }
    draw();
}

function update() {
    if (game.running == null) {
        let cmd = ldata.cmds.shift();
        while (cmd.type == CmdType.CREATE_BALL) {
            rdata.balls.push({
                id: cmd.id,
                x: game.base.x,
                y: game.base.y,
                radius: 5,
                color: "#ac2243",
                dir: {x:cmd.dir.x, y:cmd.dir.y},
                creating: true
            });
            cmd = ldata.cmds.shift();
        }
        game.running = cmd;
    } else {
        let cmd = game.running;
        for (let ball of rdata.balls) {
            if (ball.creating) {
                if (game.totalInterval >= (ball.id - 1) * game.startInterval)
                    ball.creating = false;
                else
                    break;
            }

            let dist = length({x: cmd.target.x - ball.x, y: cmd.target.y - ball.y});
            if (dist >= game.speed) {
                cmd = ldata.cmds.shift();
            } else {

            }
        }
    }
    
    game.totalInterval += 1;

    draw();

    if (ldata.cmds.length == 0) {
        game.status = 1;
    }
}

function copyLine(line) {
    let obj = {};
    for (let k in line) {
        obj[k] = line[k];
    }
    return obj;
}

function initRender() {
    for (let l of ldata.lines) {
        rdata.lines.push(copyLine(l));
    }
    rdata.status = game.status;
    rdata.base = game.base;
    rdata.collisions = game.collisions;
}

function initialze() {
    loadData(function () {
        initLogic(game.base, game.times);
        initRender();
        addEventListener("mousemove", (evt) => {
            if (game.status != 1) {
                return;
            }
            game.collisions.length = 0;
            let v = {x: evt.offsetX - game.base.x, y: evt.offsetY - game.base.y};
            game.aimDir = normalize(v);
            aim();
        });

        addEventListener("mousedown", (evt) => {
            if (game.status == 2) {
                return;
            }
            game.status = 2;
            startRound(game.aimDir);
            runRound();
            game.timer = setInterval(update, 10);
        });
    });   
}

initialze();
