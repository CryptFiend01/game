let Offset = {
    x : (Canvas.width - Board.WIDTH * Board.SIDE) / 2,
    y : 5
}

let GameRect = {
    left: Offset.x,
    top: Offset.y,
    right: Board.WIDTH * Board.SIDE + Offset.x,
    bottom: Board.HEIGHT * Board.SIDE + Offset.y
}

let EnemyRect = {
    left: GameRect.left,
    top: GameRect.top + Board.SIDE,
    right: GameRect.right,
    bottom: GameRect.bottom
}

let config = {
    enemys: [],

    objects: null,
    monsters: null,
    stage: null
}

function getMonster(cid) {
    for (let m of config.monsters) {
        if (m.id == cid) {
            return m;
        }
    }
    return null;
};

function loadData(onfinish) {
    $.getJSON("data/object.json", function(obj_data) {
        var objects = obj_data;
        config.objects = objects;
        for (let k in config.objects) {
            let obj = config.objects[k];
            obj.size = obj.anchor.x * 2 / Board.SIDE;
        }
        $.getJSON("data/monster.json", function(mst_data) {
            var monsters = mst_data;
            config.monsters = monsters;

            $.getJSON("data/role.json", function(role_data) {
                config.roles = role_data;
                
                $.getJSON("data/stage.json", function(stage_data) {
                    var stage = stage_data;
                    config.stage = stage;
                    config.stage_monsters = {}
                    for (let m of stage.monsters) {
                        config.stage_monsters[m.id] = m;
                        let mc = getMonster(m.cid);
                        if (mc == null) {
                            console.log("not find monster " + m.cid);
                            continue;
                        }
                        let obj = objects[mc.type];
                        if (!m.point) {
                            m.point = getPointByGrid(obj, m.grid);
                        }
    
                        let lines = makeLines(m.id, m.point, obj, mc.solid);
                        config.enemys.push({
                            id : m.id,
                            point : m.point,
                            grid: m.grid,
                            hp : mc.hp,
                            solid : mc.solid,
                            evt: mc.evt,
                            obj : obj,
                            lines : lines,
                            rect: makeRect(lines)
                        });
                    }
                    onfinish();
                });
            });
        });
    });
}

function copyEnemies(enemys) {
    let ret = {};
    for (let enemy of enemys) {
        let e = {
            id: enemy.id,
            point: copyPoint(enemy.point),
            grid: enemy.grid,
            hp: enemy.hp,
            visible: true,
            solid: enemy.solid,
            evt: enemy.evt,
            obj: enemy.obj,
            lines: [],
            rect: copyRect(enemy.rect)
        }
        for (let l of enemy.lines) {
            e.lines.push(new Line(l));
        }
        ret[e.id] = e;
    }
    return ret;
}
