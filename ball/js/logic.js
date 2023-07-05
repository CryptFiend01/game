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

    balls : new Heap(ballLess), // {x: 250, y: 300, radius: 5, color: "#ac2234"},

    base : {x: 250, y: 800},

    nextBase : null,

    begin : {x: 0, y: 0},

    enemys : {},

    cmds: []
};

const CmdType = {
    CREATE_BALL : 1,
    COLLIDE : 2,
    ROUND_END: 3,
    WIN : 4,
    LOSE : 5
}

function initLogic(base, interLen, roles) {
    assignPoint(base, ldata.base);
    ldata.interLen = interLen;
    ldata.lines.length = 0;
    ldata.balls.clear();
    ldata.enemyCount = 0;
    ldata.baseLine = {x1: 0, y1: base.y, x2: canvas.width, y2: base.y, color: "#aaaaaa", width:1};
    ldata.roles = roles;

    for (let line of config.lines) {
        ldata.lines.push(copyLine(line));
        if (!line.mid) {
            continue;
        }
        if (ldata.enemys[line.mid] == null) {
            let monsterData = config.stage_monsters[line.mid];
            let monsterCfg = getMonster(monsterData.cid);
            ldata.enemys[line.mid] = {
                id : line.mid,
                point : monsterData.point,
                hp : monsterCfg.hp,
                obj : config.objects[monsterCfg.type]
            };
            ldata.enemyCount += 1;
        }
    }
}

function sortBalls() {
    ldata.balls.sort((a, b) => {
        let da = a.dist - a.passed;
        let db = b.dist - b.passed;
        if (da < db) {
            return -1;
        } else if (da > db) {
            return 1;
        } else {
            if (a.id < b.id) {
                return -1;
            } else {
                return 1;
            }
        }
    });
}

function getNextCollision(start, dirNorm, ignores) {
    if (ignores == null) {
        ignores = [];
    }
    return checkNextInterpoint(start, dirNorm, ldata.lines, ignores);
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
            temp.push(l);
        }
    }
    return temp;
}

function onEmenyDead(id) {
    ldata.lines = removeDead(ldata.lines, id);
}

function checkIgnore(ball) {
    let temp = [];
    if (ball.atLine) {
        temp.push(ball.atLine);
    }
    for (let l of ball.ignores) {
        if (pointInLine(ball, l)) {
            temp.push(l);
        }
    }
    ball.ignores = temp;
}

function calcCollide(ball) {
    checkIgnore(ball);
    let collide = getNextCollision(ball, ball.dir, ball.ignores);
    ball.collide = collide;
    if (ball.collide.point != null) {
        ball.dist = length({x:collide.point.x - ball.x, y:collide.point.y - ball.y});
        if (ball.times == 0) {
            // 还未第一次触发弹射的球，因为目标消失而重新计算碰撞点，需要加上起点等待距离
            ball.dist += (ball.id - 1) * ldata.interLen;
        }
    } else {
        console.log("collide null:");
        // showVec("Ball", ball);
        // showVec("Ball Dir", ball.dir);
        // for (let l of ldata.lines) {
        //     showLine("line", l);
        // }
        ball.dist = 0;
    }
}

function checkCollide(deads) {
    let temp = [];
    if (deads) {
        // 只有目标被移除，只需要检测和这些目标相撞的球
        for (let ball of ldata.balls.heap) {
            if (deads.indexOf(ball.collide.line.mid) != -1) {
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

function startRound(aimDir) {
    ldata.cmds.length = 0;
    assignPoint(aimDir, ldata.begin);

    let collide = getNextCollision(ldata.base, ldata.begin, null);
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
                atLine: null,
                ignores: []
            });
            ldata.cmds.push({
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
        ball.times += 1;
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
            ball.atLine = ball.collide.line;
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
                enemy.hp -= 100;
                cmd.dmg = {id: enemy.id, sub: 100, hp: enemy.hp};            
                if (enemy.hp <= 0) {
                    onEmenyDead(enemy.id);
                    // 中间可以插入一些死亡触发的技能，有新的死亡id可以加入进来，如果触发移动或者召唤，则传入null
                    checkCollide([enemy.id]);
                    ldata.enemyCount -= 1;
                    if (ldata.enemyCount == 0) {
                        ldata.cmds.push(cmd);
                        ldata.cmds.push({type: CmdType.WIN});
                        console.timeEnd("round");
                        return;
                    }
                }
            } else {
                console.error("collide dead enemy! id=" + cmd.id + " mid=" + line.mid);
            }
        }

        ldata.cmds.push(cmd);

        //sortBalls();
    }
    ldata.cmds.push({type: CmdType.ROUND_END});
    if (ldata.nextBase) {
        assignPoint(ldata.nextBase, ldata.base);
    }
    console.timeEnd("round");
}