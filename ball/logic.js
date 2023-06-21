// op_data: {seed: 1234, rounds: [
//    { skills:[{cid:1, pos:{x:1, y:2}}, {cid:2, pos:{x:1,y:1}}, {cid:0}], dir: {x:-1, y:-3} },
//    { skills:[{cid:2, pos:{x:1,y:1}}], dir: {x:-4, y:-1} },
// ]
// cmd: 
// {
//    {skill: 1001, cid:1, range: [1, 13, 14], enemy:[{id:1,dmg:100,hp:2300,shield:100,buff:11}], self:[{cid:1,add:100,hp:23000,shield:2000}]}
// }
// {
//       {type: "init", dir: {x:1, y:2}, id: 1, cid: 2}, ....
//       {type: "collide", dir: {x: 3, y:4}, dmg: {id:1, dmg:10, hp:180}, skill: {}}, ...
//       {type: "win"}
//       {type: "lose"}
// }

let ldata = {
    lines : [],

    balls : [], // {x: 250, y: 300, radius: 5, color: "#ac2234"},

    ballBase : {x: 250, y: 800},

    begin : {x: 0, y: 0},

    enemys : {},

    collisions : [], // {x: 0, y: 0, radius: 2, color: "#1234bc"}

    times : 10,

    maxLen : -1,

    ballCount : 30,

    status : 1
}

function getNextCollision(start, dirNorm) {
    let end = {
        x: start.x + dirNorm.x * 1400,
        y: start.y + dirNorm.y * 1400
    }
    let line = {x1: start.x, y1: start.y, x2: end.x, y2: end.y}
    return checkNextInterpoint(line, ldata.lines);
}

function getReflectNorm(start, collide) {
    let incident = {x: collide.point.x - start.x, y: collide.point.y - start.y};
    let normal = ldata.lines[collide.idx].normal;
    let rft = reflectVector(incident, normal);
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

function onEmenyDead(id) {
    let temp = [];
    for (let i = 0; i < ldata.lines; i++) {
        if (ldata.lines[i].mid != id) {
            temp.push(ldata.lines[i]);
        }
    }
    ldata.lines = temp;
}

function calcCollide(ball) {
    let collide = getNextCollision(ball, ball.dir);
    ball.collide = collide;
    ball.dist = length({x:collide.point.x - ball.x, y:collide.point.y - ball.y});
}

function checkCollide(deads) {
    if (deads) {
        // 只有目标被移除，只需要检测和这些目标相撞的球
        for (let ball of ldata.balls) {
            if (deads.contain(ball.mid)) {
                calcCollide(ball);
            }
        }
    } else {
        // 其他原因（比如召唤，移动）导致重新检测，需要全部重算一遍
        for (let ball of ldata.balls) {
            calcCollide(ball);
        }
    }
}

function initLogic() {
    for (let line of config.lines) {
        ldata.lines.push(copyLine(line));
        if (!line.mid) {
            continue;
        }
        if (ldata.enemys[line.mid] == null) {
            let monsterData = config.stage.monsters[line.mid-1];
            let monsterCfg = getMonster(monsterData.cid);
            ldata.enemys[line.mid] = {
                id : line.mid,
                point : monsterData.point,
                hp : monsterCfg.hp,
                obj : config.objects[monsterCfg.type]
            };
        }
    }
}

function sortBalls() {
    ldata.balls.sort((a, b) => {
        if (a.dist < b.dist) {
            return true;
        } else {
            return a.id < b.id;
        }
    });
}

function startRound() {
    let collide = getNextCollision(ldata.ballBase, ldata.begin);
    let dist = length({x:collide.point.x - ldata.ballBase.x, y:collide.point.y - ldata.ballBase.y});
    for (let i = 0; i < ldata.ballCount; i++) {
        ldata.balls.push({
            id: i + 1,
            x: ldata.ballBase.x, 
            y: ldata.ballBase.y, 
            radius: 5, 
            color: "#ac2234",
            collide: collide,
            dist: dist,
            dir: ldata.begin,
            times: 0
        });
        sortBalls();
    }
}

function runRound() {
    while (ldata.balls.length > 0) {
        let ball = ldata.balls.shift();
        let line = ldata.lines[ball.collide.idx];
        let enemy = ldata.enemys[line.mid];
        
        // 先将球转向,并将所有球的dist减去第一个球的dist
        ball.times += 1;
        for (let b of ldata.balls) {
            b.dist -= ball.dist;
        }
        // 达到撞击次数上限，就不再计算该球
        if (ball.times < ldata.times) {
            ball.dir = getReflectNorm(ball, ball.collide);
            ball.x = ball.collide.point.x;
            ball.y = ball.collide.point.y;
            calcCollide(ball);
            ldata.balls.push(ball);
        }

        enemy.hp -= 100;
        if (enemy.hp <= 0) {
            onEmenyDead(enemy.id);
            // 中间可以插入一些死亡触发的技能，有新的死亡id可以加入进来，如果触发移动或者召唤，则传入null
            checkCollide([enemy.id]);
        }

        sortBalls();
    }
}