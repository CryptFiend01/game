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
//       {type: "collide", reflect: {x: 3, y:4}, target:{x: 1, y: 1}, dmg: {id:1, dmg:10, hp:180}, evts: [{type:1, id:1001, cid:9, grid:3}]}, ...
//       {type: "push", line: 5, moved:[{id:1, x:30, y:50},...]}
//       {type: "win"}
//       {type: "lose"}
// }

const BASE_DMG = 500;

let frameLines = [
    new Line({x1: GameRect.left, y1: GameRect.top, x2: GameRect.right, y2: GameRect.top, solid: true, hide:0, mid:0}),
    new Line({x1: GameRect.right, y1: GameRect.top, x2: GameRect.right, y2: GameRect.bottom, solid: true, hide:0, mid:0}),
    new Line({x1: GameRect.left, y1: GameRect.bottom, x2: GameRect.left, y2: GameRect.top, solid: true, hide:0, mid:0}),
];

let ldata = {
    lines : [],

    balls : new Heap(ballLess),

    base : {x: 250, y: 800},

    nextBase : null,

    begin : {x: 0, y: 0},

    enemys : {},

    startLine: 0,

    round: 0,

    ballDmg : BASE_DMG,

    isThrough : false,

    skills : [],

    pushed: -1,

    win : false,

    cmds: [],

    ops: [],

    takegrids: [],

    callid : 1001
};

function addCmd(cmd) {
    cmd.id = ldata.cmds.length + 1;
    ldata.cmds.push(cmd);
}

function resetTakeGrids() {
    ldata.takegrids.length = 0;

    for (let i = 0; i < Board.WIDTH * Board.HEIGHT; i++) {
        ldata.takegrids.push(0);
    }

    let setTakeGrid = (grid, eid) => {
        if (grid < 0 || grid >= ldata.takegrids.length) {
            return;
        }
        if (ldata.takegrids[grid] != 0) {
            console.error("grid " + grid + " has taked");
        } else {
            ldata.takegrids[grid] = eid;
        }
    }

    for (let eid in ldata.enemys) {
        let enemy = ldata.enemys[eid];
        if (enemy.visible && enemy.hp > 0) {
            if (enemy.obj.size == 1) {
                setTakeGrid(enemy.grid, enemy.id);
            } else {
                // 超过1格的，将周围格子加上去。
                for (let i = 0; i < enemy.obj.size; i++) {
                    for (let j = 0; j < enemy.obj.size; j++) {
                        let grid = enemy.grid + j + i * Board.WIDTH;
                        setTakeGrid(grid, enemy.id);
                    }
                }
            }
        }
    }
}

function initEnemyLines() {
    let ret = {
        startLine: 0,
        lines: [],
        enemys: {},
        enemyCount: 0
    }
    let max_line = config.stage.max_line;
    if (max_line < Board.HEIGHT) {
        max_line = Board.HEIGHT;
    }

    for (let line of frameLines) {
        ret.lines.push(line);
    }

    ret.startLine = max_line - Board.HEIGHT;
    let yoffset = ret.startLine * Board.SIDE;

    ret.enemys = copyEnemies(config.enemys);
    for (let eid in ret.enemys) {
        let enemy = ret.enemys[eid];
        if (enemy.solid) {
            ret.enemyCount += 1;
        }
        for (let line of enemy.lines) {
            line.y1 -= yoffset;
            line.y2 -= yoffset;
        }
        enemy.rect.top -= yoffset;
        enemy.rect.bottom -= yoffset;
        enemy.grid -= ret.startLine * Board.WIDTH;

        if (enemy.rect.top < EnemyRect.top || enemy.rect.bottom > EnemyRect.bottom) {
            enemy.visible = false;
        }
    }

    // 按照个体设置
    for (let eid in ret.enemys) {
        let enemy = ret.enemys[eid];
        if (enemy.visible) {
            for (let l of enemy.lines)
            ret.lines.push(l);
        }
    }

    hidenInline(ret.lines, frameLines.length);
    return ret;
}

function initLogic(base, interLen, roles) {
    assignPoint(base, ldata.base);
    ldata.interLen = interLen;
    ldata.lines.length = 0;
    ldata.balls.clear();
    ldata.enemyCount = 0;
    ldata.baseLine = new Line({x1: 0, y1: base.y, x2: canvas.width, y2: base.y});
    ldata.roles = roles;
    ldata.rect = {left: GameRect.left, right: GameRect.right, top: GameRect.top + Board.SIDE, bottom: GameRect.bottom};

    let ret = initEnemyLines();
    ldata.startLine = ret.startLine;
    ldata.lines = ret.lines;
    ldata.enemys = ret.enemys;
    ldata.enemyCount = ret.enemyCount;
    console.log("config enemy count:" + config.stage.monsters.length);
    console.log("enemyCount:" + ldata.enemyCount);
    resetTakeGrids();
}

function getNextBase(ball) {
    if (!ldata.nextBase) {
        let p = getRaySegmentIntersection(ball, ball.dir, ldata.baseLine);
        if (p != null) {
            ldata.nextBase = p;
        }
    }
}

function removeDead(lines, id) {
    let temp = [];
    for (let l of lines) {
        if (!l.mid || l.mid != id) {
            l.unHide(id);
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
        visible: true,
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
    ldata.enemyCount += 1;
    hidenPartLines(lines, ldata.lines, frameLines.length);
    return enemy;
}

function addEnemies(cid, count, grid) {
    let evts = [];
    let mc = getMonster(cid);
    let obj = config.objects[mc.type];
    let freeGrids = [];
    let g = grid;
    for (let i = 0; i < count; i++) {
        while (ldata.takegrids[g] != 0) {
            ++g;
        }
        freeGrids.push(g);
        ++g;
    }

    let newEnemies = [];
    for (let i = 0; i < count; i++) {
        let id = ldata.callid + i;
        //console.log("add enemy " + id + " at grid:" + freeGrids[i]);
        let e = addEnemy(id, mc, obj, freeGrids[i]);
        evts.push({type: EvtType.CALL_ENEMY, id: id, cid: cid, grid: freeGrids[i]});
        newEnemies.push(e);
    }
    ldata.callid += count;

    return {evts: evts, enemies: newEnemies};
}

function onEnemyDead(id) {
    let ret = {deads:[id]};

    // 移除向量
    ldata.lines = removeDead(ldata.lines, id);
    let enemy = ldata.enemys[id];
    // 清空格子占据信息
    for (let i = 0; i < enemy.obj.size; i++) {
        for (let j = 0; j < enemy.obj.size; j++) {
            let grid = enemy.grid + j + i * Board.WIDTH;
            ldata.takegrids[grid] = 0;
        }
    }

    // 处理死亡事件
    if (enemy.evt && enemy.evt.type == StageEvent.DEAD_CALL) {
        ret.deads = null;
        let r = addEnemies(enemy.evt.cid, enemy.evt.count, enemy.grid);
        ret.evts = r.evts;
        ret.enemies = r.enemies;
        //console.log("add evts:" + objToString(ret.evts));
        return ret;
    } else {
        for (let skill of ldata.skills) {
            if (skill.type == SkillType.DEAD_TRIGGER) {
                // 死亡触发技能
            }
        }
    }

    return ret;
}

function checkCollide(deads) {
    let temp = [];
    if (deads) {
        // 只有目标被移除，只需要检测和这些目标相撞的球
        ldata.balls.foreach((ball) => {
            if (deads.indexOf(ball.nextCollideId()) != -1) {
                ball.recoverState();
                ball.calcCollide();
            }
            if (ball.nextCollidePoint())
                temp.push(ball);
            else
                getNextBase(ball);
        });
    } else {
        // 其他原因（比如召唤，移动）导致重新检测，需要全部重算一遍
        ldata.balls.foreach((ball) => {
            ball.recoverState();
            ball.calcCollide(ball);
            if (ball.nextCollidePoint())
                temp.push(ball);
            else
                getNextBase(ball);
        });
    }

    ldata.balls.clear();
    for (let ball of temp) {
        ldata.balls.add(ball);
    }
}

function getSkillRange(point, width, height) {
    return {
        x: (point.x - Math.floor(width / 2)) * Board.SIDE + Offset.x,
        y: (point.y - Math.floor(height / 2)) * Board.SIDE + Offset.y,
        width: width * Board.SIDE,
        height: height * Board.SIDE
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
            let cmd = {dmg:{id:eid, dmg: skill.cfg.dmg, hp: enemy.hp}};
            effects.push(cmd);
            if (enemy.hp <= 0) {
                let ret = onEnemyDead(eid);
                cmd.evts = ret.evts;
                ldata.enemyCount -= 1;
            }
        }
    }

    if (ldata.enemyCount <= 0) {
        addCmd({type: CmdType.WIN});
        ldata.win = true;
    } else if (ldata.lines.length <= frameLines.length && ldata.startLine > 0) {
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
    ldata.ops.push({op: OpType.SKILL, rid: role.id, target: target ? copyPoint(target) : null});
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
    if (ldata.win) {
        return;
    }
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

function pushDataMap(data, pushLine) {
    data.lines.length = 0;
    for (let l of frameLines) {
        data.lines.push(l);
    }
    data.startLine -= pushLine;
    let yoffset = pushLine * Board.SIDE;
    let subEnemyCount = 0;
    for (let eid in data.enemys) {
        let enemy = data.enemys[eid];
        if (enemy.hp <= 0 ) {
            continue;
        }
        let visible = true;
        for (let line of enemy.lines) {
            line.move(yoffset);
        }

        enemy.rect.top += yoffset;
        enemy.rect.bottom += yoffset;
        enemy.grid += pushLine * Board.WIDTH;
        if (enemy.rect.top < EnemyRect.top || enemy.rect.bottom > EnemyRect.bottom) {
            visible = false;
        }

        if (enemy.visible && enemy.solid && !visible) {
            // 底线移除
            subEnemyCount = subEnemyCount + 1;
        }
        enemy.visible = visible;

        if (visible) {
            for (let line of enemy.lines) {
                data.lines.push(line);
            }
        }
    }

    hidenInline(data.lines, frameLines.length);
    return subEnemyCount;
}

function pushMap(pushLine) {
    if (pushLine > 0) {
        ldata.enemyCount -= pushDataMap(ldata, pushLine);

        resetTakeGrids();
        
        addCmd({type: CmdType.PUSH, line: pushLine});
    } 
}

function ballRound() {
    while (!ldata.balls.empty()) {
        let ball = ldata.balls.pop();
        let line = ball.nextCollideLine();
        // 距离最短，移动后发生碰撞才会创建命令
        let cmd = {
            type: CmdType.COLLIDE, 
            bid: ball.id,
            dmg: null,
            target: copyPoint(ball.nextCollidePoint())
        };
       
        // 先将球转向,并将所有球的dist减去第一个球的dist
        let d = ball.restDist();
        ldata.balls.foreach((b) => {
            b.move(d);
        });
        ball.setCollideFinish();

        // 更新球的状态，最快的球移动到碰撞点，计算弹射后的方向和下次碰撞点
        if (ball.update()) {
            if (ball.nextCollidePoint()) {
                cmd.reflect = copyPoint(ball.dir);
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
                    let ret = onEnemyDead(enemy.id);
                    cmd.evts = ret.evts;
                    // 中间可以插入一些死亡触发的技能，有新的死亡id可以加入进来，如果触发移动或者召唤，则传入null
                    checkCollide(ret.deads);
                    if (enemy.solid)
                        ldata.enemyCount -= 1;
                    if (ldata.enemyCount == 0) {
                        addCmd(cmd);
                        ldata.win = true;
                        addCmd({type: CmdType.WIN});
                        return;
                    }
                }
            } else {
                console.error("collide dead enemy! id=" + cmd.bid + " mid=" + line.mid);
            }
        }

        addCmd(cmd);
    }
}

function enemyRound() {
    if (ldata.win) {
        return;
    }
}

function pushRound() {
    if (ldata.win) {
        return;
    }
    let pushLine = 0;
    if (ldata.lines.length <= frameLines.length && ldata.startLine > 0) {
        pushLine = Math.min(ldata.startLine, 10);
    } else if (ldata.pushed + 1 < config.stage.push.length) {
        let next_push = config.stage.push[ldata.pushed + 1];
        if (ldata.round >= next_push.round) {
            pushLine = Math.min(ldata.startLine, next_push.line);
            ldata.pushed += 1;
        }
    }
    pushMap(pushLine);
}

function endRound() {
    if (ldata.win) {
        return;
    }
    ldata.ballDmg = BASE_DMG;
    ldata.isThrough = false;
    if (ldata.nextBase) {
        assignPoint(ldata.nextBase, ldata.base);
    }

    addCmd({type: CmdType.ROUND_END, base: copyPoint(ldata.base)});
}

function startRound(aimDir) {
    ldata.ops.push({op: OpType.BALL, dir: copyPoint(aimDir)})
    ldata.cmds.length = 0;
    assignPoint(aimDir, ldata.begin);

    let collide = lcheckNextCollide(ldata.base, ldata.begin, [], 0);
    let dist = distance({x:collide.point.x - ldata.base.x, y:collide.point.y - ldata.base.y});
    let n = 0;
    for (let role of ldata.roles) {
        for (let i = 0; i < role.count; i++) {
            let ball = new Ball({
                id: n + 1,
                role: role,
                x: ldata.base.x, 
                y: ldata.base.y, 
                collide: collide,
                dist: dist + n * ldata.interLen,
                dir: ldata.begin,
                interLen: n * ldata.interLen
            });
            ldata.balls.add(ball);
            addCmd({
                type: CmdType.CREATE_BALL,
                bid: n + 1,
                cid: role.id,
                dir: ldata.begin
            });
            ++n;
        }
    }

    ldata.nextBase = null;
}

function updateRound() {
    console.time("round");
    // 剩余距离最短的球弹射
    ballRound();

    // 敌方行动
    enemyRound();

    // 回合结束推进
    ldata.round += 1;
    pushRound();

    // 技能回合
    skillRound();

    // 回合结束重置
    endRound();
    
    console.timeEnd("round");
}
