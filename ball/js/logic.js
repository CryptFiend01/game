// op_data: {seed: 1234, rounds: [
//    { skills:[{cid:1, pos:{x:1, y:2}}, {cid:2, pos:{x:1,y:1}}, {cid:0}], dir: {x:-1, y:-3} },
//    { skills:[{cid:2, pos:{x:1,y:1}}], dir: {x:-4, y:-1} },
// ]
// cmd: 
// {
//    {skill: 1001, cid:1, range: [1, 13, 14], enemy:[{id:1,dmg:100,hp:2300,shield:100,buff:11}], self:[{cid:1,add:100,hp:23000,shield:2000}]}
// }
// {
//       {type: "create_ball", dir: {x:1, y:2}, id: 1, cid: 2}, ....
//       {type: "collide", reflect: {x: 3, y:4}, target:{x: 1, y: 1}, dmg: {id:1, dmg:10, hp:180}, skill: {}}, ...
//       {type: "push", line: 5, moved:[{id:1, x:30, y:50},...]}
//       {type: "win"}
//       {type: "lose"}
// }

function ballLess(a, b) {
    let da = a.dist - a.passed;
    let db = b.dist - b.passed;
    if (da < db) {
        return true;
    } else if (da > db) {
        return false;
    } else {
        if (a.id < b.id) {
            return true;
        } else {
            return false;
        }
    }
}

let ldata = {
    lines : [],

    dashLines : [],

    balls : new Heap(ballLess), // {x: 250, y: 300, radius: 5, color: "#ac2234"},

    base : {x: 250, y: 800},

    nextBase : null,

    begin : {x: 0, y: 0},

    enemys : {},

    startLine: 0,

    round: 0,

    ballDmg : 500,

    isThrough : false,

    skills : [],

    pushed: -1,

    win : false,

    cmds: [],

    ops: [],

    takegrids: [],

    callid : 1
};

const CmdType = {
    CREATE_BALL : 1,
    COLLIDE : 2,
    HIT: 3,
    ROLE_SKILL: 4,
    ENEMY_SKILL: 5,
    REMOVE_SKILL : 6,
    SKILL_EFFECT : 7,
    ENEMY_MOVE: 8,
    PUSH: 10,
    ROUND_END: 11,
    WIN : 12,
    LOSE : 13
}

function inRange(line) {
    return lineInRect(line, ldata.rect);
}

function pointInRange(point) {
    return pointInRect(point, ldata.rect);
}

function addCmd(cmd) {
    cmd.cmdid = ldata.cmds.length + 1;
    ldata.cmds.push(cmd);
}

function resetTakeGrids() {
    ldata.takegrids.length = 0;

    for (let i = 0; i < RenderConfig.width * RenderConfig.height; i++) {
        ldata.takegrids.push(0);
    }

    for (let eid in ldata.enemys) {
        let enemy = ldata.enemys[eid];
        if (enemy.visible && enemy.hp > 0) {
            ldata.takegrids[enemy.grid] = enemy.id;
            // 超过1格的，将周围格子加上去。
        }
    }
}

function initLogic(base, interLen, roles) {
    assignPoint(base, ldata.base);
    ldata.interLen = interLen;
    ldata.lines.length = 0;
    ldata.balls.clear();
    ldata.enemyCount = 0;
    ldata.baseLine = {x1: 0, y1: base.y, x2: canvas.width, y2: base.y, color: "#aaaaaa", width:1};
    ldata.roles = roles;
    ldata.rect = {left: GameRect.left, right: GameRect.right, top: GameRect.top + RenderConfig.side, bottom: GameRect.bottom};
    console.log(objToString(ldata.rect));

    let max_line = config.stage.max_line;
    if (max_line < RenderConfig.height) {
        max_line = RenderConfig.height;
    }

    for (let line of config.frameLines) {
        ldata.lines.push(copyLine(line));
    }

    ldata.startLine = max_line - RenderConfig.height;
    let yoffset = ldata.startLine * RenderConfig.side;

    ldata.enemys = copyEnemies(config.enemys);
    for (let eid in ldata.enemys) {
        let enemy = ldata.enemys[eid];
        if (enemy.solid) {
            ldata.enemyCount += 1;
        }
        for (let line of enemy.lines) {
            line.y1 -= yoffset;
            line.y2 -= yoffset;
        }
        enemy.rect.top -= yoffset;
        enemy.rect.bottom -= yoffset;
        enemy.grid -= ldata.startLine * RenderConfig.width;

        if (enemy.rect.top < ldata.rect.top || enemy.rect.bottom > ldata.rect.bottom) {
            enemy.visible = false;
        }
    }

    // 按照个体设置
    for (let eid in ldata.enemys) {
        let enemy = ldata.enemys[eid];
        if (enemy.visible) {
            for (let l of enemy.lines)
                ldata.lines.push(l);
        }
    }

    console.log("config enemy count:" + config.stage.monsters.length);
    console.log("enemyCount:" + ldata.enemyCount);

    hidenInline(ldata.lines);

    resetTakeGrids();
}

function getNextCollision(start, dirNorm, ignores, dashid, isThrough) {
    if (ignores == null) {
        ignores = [];
    }
    return checkNextInterpoint(start, dirNorm, ldata.lines, ignores, dashid, isThrough);
}

function getNextBase(ball) {
    if (!ldata.nextBase) {
        let p = getRaySegmentIntersection(ball, ball.dir, ldata.baseLine);
        if (p != null) {
            ldata.nextBase = p;
        }
    }
}

function getReflectNorm(dir, line) {
    if (!line.solid || (ldata.isThrough && line.mid > 0)) {
        return dir;
    }
    let normal = line.normal;
    let rft = reflectVector(dir, normal);
    let rft_normal = normalize(rft);
    if (rft_normal.x == 0 || rft_normal.y == 0) {
        let angle = Math.PI / 36;
        // 旋转一个角度
        let rotate = {
            x : rft_normal.x * Math.cos(angle) - rft_normal.y * Math.sin(angle),
            y : rft_normal.x * Math.sin(angle) + rft_normal.y * Math.cos(angle)
        };
        rft_normal = rotate;
    }
    return rft_normal;
}

function removeDead(lines, id) {
    let temp = [];
    for (let l of lines) {
        if (!l.mid || l.mid != id) {
            if (l.hide == id) {
                l.hide = 0;
            }

            if (l.hideLines != null) {
                let temp = [];
                for (let l1 of l.hideLines) {
                    let ids = unMixId(l1.mid);
                    if (ids[0] != id && ids[1] != id) {
                        temp.push(l1);
                    }
                }
                if (temp.length == null) {
                    l.hideLines = null;
                } else {
                    l.hideLines = temp;
                }
            }
            temp.push(l);
        }
    }
    return temp;
}

function addEnemy(id, mc, obj, grid) {
    let point = getPointByGrid(obj, grid);
    let lines = makeLines(id, point, obj, mc.solid);
    let enemy = {
        id : id,
        point : point,
        grid: grid,
        hp : mc.hp,
        solid : mc.solid,
        evt: mc.evt,
        obj : obj,
        lines : lines,
        rect: makeRect(lines)
    };

    for (let l of lines) {
        ldata.lines.push(l);
    }
    ldata.enemys[id] = enemy;
    hidenPartLines(lines, ldata.lines);
}

function addEnemies(cid, count, grid) {
    let mc = getMonster(cid);
    let obj = config.objects[mc.type];
    let freeGrids = [];
    let g = grid;
    for (let i = 0; i < count; i++) {
        while (ldata.takegrids[g] != 0) {
            ++g;
        }
        freeGrids.push(g);
    }
    for (let i = 0; i < count; i++) {
        addEnemy(ldata.callid + i, mc, obj, freeGrids[i]);
    }
    ldata.callid += count;
}

function onEnemyDead(id) {
    let deads = [id];
    ldata.lines = removeDead(ldata.lines, id);
    let enemy = ldata.enemys[id];
    if (enemy.evt && enemy.evt.type == StageEvent.DEAD_CALL) {
        addEnemies(enemy.evt.cid, enemy.evt.count, enemy.grid);
        return null;
    } else {
        for (let skill of ldata.skills) {
            if (skill.type == SkillType.DEAD_TRIGGER) {
                // 死亡触发技能
            }
        }
    }

    return deads;
}

function resetIgnore(start, ignores, collide) {
    let temp = [];
    // 任何情况，本次碰撞线加入下次碰撞检测的忽略组中
    if (collide.line) {
        temp.push(collide.line);
    }
    for (let l of ignores) {
        if (pointInLine(start, l)) {
            temp.push(l);
        }
    }
    return temp;
}

function checkIgnore(ball) {
    ball.ignores = resetIgnore(ball, ball.ignores, ball.collide);
}

function calcCollide(ball) {
    checkIgnore(ball);
    // 计算新的碰撞时，球可能已经移动的了一段距离，逻辑部分不会实时改变球的坐标，所以需要重新计算当前位置，这部分可以考虑每次直接把球的当前点算出来
    let start = {x: ball.x + ball.dir.x * ball.passed, y: ball.y + ball.dir.y * ball.passed};
    let collide = getNextCollision(start, ball.dir, ball.ignores, ball.hit, ldata.isThrough);
    ball.collide = collide;
    // 虚线物体或者当前为穿透球，需要记录正在那个敌方体内，再次碰撞其他物体前不会反复计算碰撞伤害
    if (ball.collide.line && (!ball.collide.line.solid || ldata.isThrough)) {
        ball.hit = ball.collide.line.mid;
    } else {
        ball.hit = 0;
    }
    if (ball.collide.point != null) {
        ball.dist = length({x:collide.point.x - ball.x, y:collide.point.y - ball.y});
        if (ball.times == 0) {
            // 还未第一次触发弹射的球，因为目标消失而重新计算碰撞点，需要加上起点等待距离
            ball.dist += (ball.id - 1) * ldata.interLen;
        }
    } else {
        ball.dist = 0;
    }
}

function checkCollide(deads) {
    let temp = [];
    if (deads) {
        // 只有目标被移除，只需要检测和这些目标相撞的球
        for (let ball of ldata.balls.heap) {
            if (deads.indexOf(ball.collide.line.mid) != -1) {
                recoverBallState(ball);
                calcCollide(ball);
            }
            if (ball.collide.point)
                temp.push(ball);
            else
                getNextBase(ball);
        }
    } else {
        // 其他原因（比如召唤，移动）导致重新检测，需要全部重算一遍
        for (let ball of ldata.balls.heap) {
            recoverBallState(ball);
            calcCollide(ball);
            if (ball.collide.point)
                temp.push(ball);
            else
                getNextBase(ball);
        }
    }

    ldata.balls.clear();
    for (let ball of temp) {
        ldata.balls.add(ball);
    }
}

function getSkillRange(point, width, height) {
    return {
        x: (point.x - Math.floor(width / 2)) * RenderConfig.side + RenderConfig.xoffset,
        y: (point.y - Math.floor(height / 2)) * RenderConfig.side + RenderConfig.yoffset,
        width: width * RenderConfig.side,
        height: height * RenderConfig.side
    }
}

function effectSkill(skill) {
    let effects = [];
    skill.round += 1;
    //console.log("skill.rect:" + objToString(skill.rect));
    for (let eid in ldata.enemys) {
        let enemy = ldata.enemys[eid];
        if (enemy.visible && enemy.solid && enemy.hp > 0 && rectInserect(enemy.rect, skill.rect)) {
            //console.log("inserect enemy rect:" + objToString(enemy.rect));
            enemy.hp -= skill.cfg.dmg;
            effects.push({id:eid, dmg: skill.cfg.dmg, hp: enemy.hp});
            if (enemy.hp <= 0) {
                onEnemyDead(eid);
                ldata.enemyCount -= 1;
            }
        }
    }

    if (ldata.enemyCount <= 0) {
        addCmd({type: CmdType.WIN});
        ldata.win = true;
    } else if (ldata.lines.length <= config.frameLines.length && ldata.startLine > 0) {
        let pushLine = Math.min(ldata.startLine, 10);
        pushMap(pushLine);
    }

    return effects;
}

function checkSkillValid() {
    let temp = [];
    for (let skill of ldata.skills) {
        if (skill.round >= skill.cfg.round) {
            addCmd({type: CmdType.REMOVE_SKILL, cid: skill.cid});
        } else {
            temp.push(skill);
        }
    }
    ldata.skills = temp;
}

function useSkill(role, target) {
    ldata.ops.push({op: "skill", rid: role.id, target: target ? copyPoint(target) : null});
    let cfg = role.skill;
    let cmd = {type: CmdType.ROLE_SKILL, cid: role.id, target: target, cd: cfg.cd, range: []};
    addCmd(cmd);
    if (cfg.type == SkillType.BALL_ADD) {
        ldata.ballDmg = cfg.dmg;
    } else if (cfg.type == SkillType.ROUND_DAMAGE) {
        let range = getSkillRange(target, cfg.width, cfg.height);
        let skill = {cid: role.id, cfg: cfg, rect:{left: range.x, top: range.y, right: range.x + range.width, bottom: range.y + range.height}, round: 0};
        ldata.skills.push(skill);
        cmd.range.push(range);
        cmd.effects = effectSkill(skill);
    } else if (cfg.type == SkillType.BALL_THROUGH) {
        ldata.isThrough = true;
        ldata.ballDmg *= 3;
    }

    checkSkillValid();
}

function skillRound() {
    for (let skill of ldata.skills) {
        let cmd = {type: CmdType.SKILL_EFFECT, cid: skill.cid};
        addCmd(cmd);
        cmd.effects = effectSkill(skill);
        if (ldata.win) {
            break;
        }
    }

    checkSkillValid();
}

function startRound(aimDir) {
    ldata.ops.push({op: "ball", dir: copyPoint(aimDir)})
    ldata.cmds.length = 0;
    assignPoint(aimDir, ldata.begin);

    let collide = getNextCollision(ldata.base, ldata.begin, null, 0, ldata.isThrough);
    let dist = length({x:collide.point.x - ldata.base.x, y:collide.point.y - ldata.base.y});
    let n = 0;
    for (let role of ldata.roles) {
        for (let i = 0; i < role.count; i++) {
            ldata.balls.add({
                id: n + 1,
                role: role,
                x: ldata.base.x, 
                y: ldata.base.y, 
                collide: collide,
                dist: dist + n * ldata.interLen,
                passed: 0,
                dir: ldata.begin,
                times: 0,
                ignores: [],
                hit: 0,
                oldState: {ignores:[], hit:0, collide:null}
            });
            addCmd({
                type: CmdType.CREATE_BALL,
                id: n + 1,
                cid: role.id,
                dir: ldata.begin
            });
            ++n;
        }
    }

    ldata.nextBase = null;
}

function pushMap(pushLine) {
    if (pushLine > 0) {
        ldata.lines.length = 0;
        for (let l of config.frameLines) {
            ldata.lines.push(copyLine(l));
        }
        ldata.startLine -= pushLine;
        let yoffset = pushLine * RenderConfig.side;
        for (let eid in ldata.enemys) {
            let enemy = ldata.enemys[eid];
            if (enemy.hp <= 0 ) {
                continue;
            }
            let visible = true;
            for (let line of enemy.lines) {
                line.y1 += yoffset;
                line.y2 += yoffset;
                line.hide = 0;
            }

            enemy.rect.top += yoffset;
            enemy.rect.bottom += yoffset;
            enemy.grid += pushLine * ldata.startLine * RenderConfig.widt;
            if (enemy.rect.top < ldata.rect.top || enemy.rect.bottom > ldata.rect.bottom) {
                visible = false;
            }

            if (enemy.visible && enemy.solid && !visible) {
                // 底线移除
                ldata.enemyCount -= 1;
            }
            enemy.visible = visible;

            if (visible) {
                for (let line of enemy.lines) {
                    ldata.lines.push(line);
                }
            }
        }

        hidenInline(ldata.lines);

        resetTakeGrids();
        
        addCmd({type: CmdType.PUSH, line: pushLine});
    } 
}

function saveBallState(ball) {
    ball.oldState.hit = ball.hit;
    if (ball.collide && ball.collide.point) {
        ball.oldState.collide = { 
            point: copyPoint(ball.collide.point),
            line: ball.collide.line
        };
    }
    ball.oldState.ignores.length = 0;
    for (let l of ball.ignores) {
        ball.oldState.ignores.push(l);
    }
}

function recoverBallState(ball) {
    ball.hit = ball.oldState.hit;
    if (ball.oldState.collide && ball.oldState.collide.point) {
        ball.collide.point = copyPoint(ball.oldState.collide.point);
        ball.collide.line = ball.oldState.collide.line;
    }
    ball.ignores.length = 0;
    for (let l of ball.oldState.ignores) {
        ball.ignores.push(l);
    }
}

function updateRound() {
    console.time("round");
    while (!ldata.balls.empty()) {
        let ball = ldata.balls.pop();
        let line = ball.collide.line;
        let cmd = {
            type: CmdType.COLLIDE, 
            id: ball.id,
            dmg: null,
            target: copyPoint(ball.collide.point)
        };
       
        // 先将球转向,并将所有球的dist减去第一个球的dist
        if (ball.hit == 0) {
            ball.times += 1;
        }
        let d = ball.dist - ball.passed; // 本次移动距离为弹射时的总距离-已经走过的距离
        for (let b of ldata.balls.heap) {
            console.assert(b.dist >= 0, "dist can't be nagetive.");
            b.passed += d;
        }
        // 达到撞击次数上限，就不再计算该球
        if (ball.times < ball.role.times) {
            ball.dir = getReflectNorm(ball.dir, ball.collide.line);
            ball.passed = 0; // 只有反弹时才需要将pass设置为0
            cmd.reflect = copyPoint(ball.dir);
            assignPoint(ball.collide.point, ball);
            saveBallState(ball);
            calcCollide(ball);
            if (ball.collide.point) {
                ldata.balls.add(ball);
            } else {
                getNextBase(ball);
            }
        }

        if (line.mid) {
            let enemy = ldata.enemys[line.mid];
            // cmd.dir为null表示小球消失
            if (enemy.hp > 0) {
                if (enemy.solid) {
                    enemy.hp -= ldata.ballDmg;
                    cmd.dmg = {id: enemy.id, sub: ldata.ballDmg, hp: enemy.hp}; 
                } else {
                    enemy.hp -= 1;
                    cmd.dmg = {id: enemy.id, sub: 1, hp: enemy.hp};
                }
           
                if (enemy.hp <= 0) {
                    let deads = onEnemyDead(enemy.id);
                    // 中间可以插入一些死亡触发的技能，有新的死亡id可以加入进来，如果触发移动或者召唤，则传入null
                    checkCollide(deads);
                    if (enemy.solid)
                        ldata.enemyCount -= 1;
                    // console.log("enemyCount:" + ldata.enemyCount);
                    if (ldata.enemyCount == 0) {
                        addCmd(cmd);
                        addCmd({type: CmdType.WIN});
                        console.timeEnd("round");
                        return;
                    }
                }
            } else {
                console.error("collide dead enemy! id=" + cmd.id + " mid=" + line.mid);
            }
        }

        addCmd(cmd);
    }

    // 敌方行动

    // 回合结束推进
    ldata.round += 1;
    let pushLine = 0;
    if (ldata.lines.length <= config.frameLines.length && ldata.startLine > 0) {
        pushLine = Math.min(ldata.startLine, 10);
    } else if (ldata.pushed + 1 < config.stage.push.length) {
        let next_push = config.stage.push[ldata.pushed + 1];
        if (ldata.round >= next_push.round) {
            pushLine = Math.min(ldata.startLine, next_push.line);
            ldata.pushed += 1;
        }
    }

    pushMap(pushLine);

    // 技能回合
    skillRound();

    ldata.ballDmg = 100;
    ldata.isThrough = false;

    addCmd({type: CmdType.ROUND_END});
    if (ldata.nextBase) {
        assignPoint(ldata.nextBase, ldata.base);
    }
    
    console.timeEnd("round");
}