const BallStatus = {
    CREATING : 1,
    MOVING : 2,
    MOVED : 3,
    DESTROY : 4
}

const GameState = {
    GS_SKILL : 1,
    GS_AIM : 2,
    GS_PLAY : 3,
    GS_PUSH : 4,
    GS_FINISH : 5,
    GS_DEBUG : 6,
    GS_GROUP_DEBUG : 7,
}

let game = {
    status: GameState.GS_SKILL,
    aimDir: {x: 0, y: 0},
    collisions : [],
    base: {x: 200, y: 552},
    timer: -1,
    basSpeed: 8,
    speed: 1,
    speedAdd: 0,
    running: null,
    totalDist: 0,
    times: 50,
    roles: [
        { id: 1, count: 10, times: 50, color: "red", skill: {type: SkillType.BALL_ADD, dmg: 1000, cd: 4} },
        { id: 2, count: 10, times: 50, color: "orange", skill: {type: SkillType.BALL_THROUGH, round: 2, cd: 2} },
        { id: 3, count: 10, times: 50, color: "purple", skill: {type: SkillType.RANGE_TRIGGER, width: 4, height: 2, dmg1: 1000, dmg2: 500, round: 3, cd:3, push: true} },
        { id: 4, count: 10, times: 50, color: "skyblue", skill: {type: SkillType.ROUND_DAMAGE, width: 3, height: 3, dmg: 5000, round: 4, cd:4, push: true} },
        { id: 5, count: 10, times: 50, color: "cyan", skill: {type: SkillType.SOLID_BLOCK, round: 3, cd: 3} }
    ],
    distInterval: 15,
    lastDist: 0,
    gameMode: GameState.GS_PLAY,

    pushed: 0,
    chooseRole: null,
    skillCD: [0, 0, 0, 0, 0],

    replayJson: "",
    replay: [],
    isPlayReplay: false,

    cmds : null
}

function initialze() {
    loadData(function () {
        initLogic(game.base, game.distInterval, game.roles);
        initRender(ldata.lines, game.status, game.base, game.collisions, game.roles);
        draw();
        addUIEvents();
    });   
}

function loadBalls() {
    let cmd = game.cmds.shift();
    while (cmd.type == CmdType.CREATE_BALL) {
        let role = game.roles[cmd.cid - 1];
        let ball = new Ball({
            id: cmd.id,
            x: game.base.x,
            y: game.base.y,
            color: role.color,
            dir: {x:cmd.dir.x, y:cmd.dir.y},
            dist: 0
        });
        rdata.balls.push(ball);
        cmd = game.cmds.shift();
    }
    game.running = cmd;
}

function updatePush() {
    let totalPush = game.running.line * RenderConfig.side;
    let pushPixel = 8;
    if (rdata.lines.length > 3) {
        game.pushed += pushPixel;

        let temp = [];
        for (let i = 0; i < 3; i++) {
            temp.push(rdata.lines[i]);
        }
    
        for (let i = 3; i < rdata.lines.length; i++) {
            let line = rdata.lines[i];
            line.y1 += pushPixel;
            line.y2 += pushPixel;
            if (inRange(line)) {
                temp.push(line);
            }
        }
        rdata.lines = temp;
    
        draw();
    } else {
        game.pushed = totalPush;
    }

    if (game.pushed >= totalPush) {
        console.log("push finish!");
        game.running = game.cmds.shift();
        setLines(ldata.lines);
        onfinish();
    }
}

function startPush() {
    game.pushed = 0;
    rdata.balls.length = 0;
    clearInterval(game.timer);
    game.timer = setInterval(updatePush, 50);
}

function updateSkillEffect(effects) {
    for (let e of effects) {
        if (e.hp <= 0) {
            rdata.lines = removeDead(rdata.lines, e.id);
        }
    }
}

function onfinish() {
    while (game.running != null) {
        let cmd = game.running;
        if (cmd.type == CmdType.PUSH) {
            startPush();
            return;
        } else if (cmd.type == CmdType.ROLE_SKILL) {
            if (cmd.range) {
                addSkillRange(cmd.cid, cmd.range);
            }
            if (cmd.effects) {
                updateSkillEffect(cmd.effects);
            }
            
            if (cmd.cd > 0) {
                const btn = document.getElementById("skill"+cmd.cid);
                btn.disabled = true;
                btn.innerHTML = cmd.cd;
                game.skillCD[cmd.cid - 1] = cmd.cd;
            }
        } else if (cmd.type == CmdType.REMOVE_SKILL) {
            removeSkillRange(cmd.cid);
        } else if (cmd.type == CmdType.SKILL_EFFECT) {
            updateSkillEffect(cmd.effects);
        } else if (cmd.type == CmdType.ROUND_END) {
            for (let i = 0; i < game.skillCD.length; i++) {
                if (game.skillCD[i] > 0) {
                    game.skillCD[i] -= 1;
                    const btn = document.getElementById("skill"+(i+1));
                    if (game.skillCD[i] <= 0) {
                        btn.innerHTML = "";
                        btn.disabled = false;
                    } else {
                        btn.innerHTML = game.skillCD[i];
                    }
                }
            }
            resetSkillRoles();
        } else if (cmd.type == CmdType.WIN) {
            break;
        }
        game.running = game.cmds.shift();
    }
    if (game.cmds.length == 0) {
        game.status = GameState.GS_SKILL;
        rdata.balls.length = 0;
        rdata.status = game.status;
        assignPoint(ldata.base, game.base);
        openSkillPanel();

        if (game.timer > 0) {
            clearInterval(game.timer);
            game.timer = -1;
        }

        if (game.running && game.running.type == CmdType.WIN) {
            console.log("win.");
            game.status = GameState.GS_FINISH;
            rdata.status = game.status;
            rdata.skillSelect = null;
            rdata.skillRange = {};
            let replayJson = JSON.stringify(ldata.ops);
            console.log(replayJson);
            if (!game.isPlayReplay) {
                alert("录像数据，可复制保存进行回放：" + replayJson);
            }
        }

        draw();

        if (game.isPlayReplay) {
            playNext();
        }
    }
}

function ballMove(ball, dist) {
    let d = dist - ball.dist;
    ball.x += ball.dir.x * d;
    ball.y += ball.dir.y * d;
    ball.status = BallStatus.MOVED;
}

function moveAll(dist) {
    // 最后执行其他球的移动
    for (let ball of rdata.balls) {
        if (ball.status == BallStatus.MOVING) {
            ballMove(ball, dist);
        }
    }
}

function run(pass) {
    let cmd = game.running;
    if (cmd.type != CmdType.COLLIDE && cmd.type != CmdType.HIT) {
        return -1;
    }

    for (let ball of rdata.balls) {
        if (ball.status == BallStatus.CREATING) {
            if (game.totalDist >= (ball.id - 1) * game.distInterval) {
                ball.status = BallStatus.MOVING;
                ball.dist = -(game.totalDist - (ball.id - 1) * game.distInterval);
            } else {
                break;
            }
        } else if (ball.status != BallStatus.DESTROY) {
            ball.status = BallStatus.MOVING;
            ball.dist = 0;
        }
    }

    let ball = rdata.balls[cmd.id-1];
    if (ball.status != BallStatus.MOVING) {
        console.error("Ball " + ball.id + " is not moving.");
        console.log("cmd:" + objToString(cmd));
        game.running = null;
        return -1;
    }
    let rest = game.speed - pass;
    let v = {x: cmd.target.x - ball.x, y: cmd.target.y - ball.y};
    let dist = distance(v);
    if (dist <= rest) {
        moveAll(dist);

        if (cmd.reflect == null) {
            ball.status = BallStatus.DESTROY;
        } else {
            assignPoint(cmd.reflect, ball.dir);
        }

        // 移除死亡的单位
        if (cmd.dmg != null && cmd.dmg.hp <= 0) {
            rdata.lines = removeDead(rdata.lines, cmd.dmg.id);
        }

        // 处理事件
        if (cmd.evts) {
            for (let evt of cmd.evts) {
                if (evt.type == EvtType.CALL_ENEMY) {
                    let mc = getMonster(evt.cid);
                    let obj = config.objects[mc.type];
                    let point = getPointByGrid(obj, evt.grid);
                    let lines = makeLines(evt.id, point, obj, mc.solid);
                    for (let l of lines) {
                        l.color = ColorSet.LineSolid;
                        rdata.lines.push(l);
                    }
                    hidenPartLines(lines, rdata.lines);
                }
            }
        }

        game.running = game.cmds.shift();
        return dist;
    } else {
        moveAll(rest);
        return rest;
    }
}

function update() {
    let d = run(0);
    game.totalDist += d;
    while (d > 0 && d < game.speed) {
        let x = run(d);
        if (x == -1) {
            d = -1;
            break;
        }
        game.totalDist += x;
        d += x;
    }

    if (d == -1) {
        onfinish();
    }

    game.speed += game.speedAdd;
    
    draw();
}

function getGridPoint(x, y) {
    return {
        x: Math.floor((x - RenderConfig.xoffset) / RenderConfig.side), 
        y: Math.floor((y - RenderConfig.yoffset) / RenderConfig.side)
    };
}

function getSkillSelectRange(role, x, y) {
    let skill = role.skill;
    let p = getGridPoint(x, y);
    return getSkillRange(p, skill.width, skill.height);
}

function doUseSkill(role, target) {
    hidden("replay");
    useSkill(role, target);
    game.cmds = ldata.cmds;
    game.running = game.cmds.shift();
    rdata.skillRoles[role.id-1] = 1;
    onfinish();
    draw();
}

function playNext() {
    if (game.replay.length == 0) {
        return;
    }

    let op = game.replay.shift();
    if (op.op == "skill") {
        let role = game.roles[op.rid - 1];
        doUseSkill(role, op.target);
    } else if (op.op == "ball") {
        assignPoint(op.dir, game.aimDir);
        game.collisions.length = 0;
        game.status = GameState.GS_PLAY;
        game.totalDist = 0;
        game.speed = game.basSpeed;
        rdata.status = game.status;
        startRound(game.aimDir);
        updateRound();
        game.cmds = ldata.cmds;
        loadBalls();
        //console.log("ball cmds:" + objToString(game.cmds));
        game.timer = setInterval(update, 10);
    }
}

function finishSkill() {
    if (game.status != GameState.GS_FINISH) {
        game.status = GameState.GS_AIM;
        rdata.status = game.status;
        hidden("skills");
    } else {
        alert("游戏结束，刷新重开！");
    }
}

initialze();
//testVectorAngle();
//test1();
//test();
//testHeap();
//testRect();
//test2();
//test3();