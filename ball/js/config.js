let config = {
    lines : [
        {x1: 0, y1: 0, x2: canvas.width, y2: 0, color: "#00aa11"},
        {x1: canvas.width, y1: 0, x2: canvas.width, y2: canvas.height, color: "#00aa11"},
        {x1: canvas.width, y1: canvas.height, x2: 0, y2: canvas.height, color: "#00aa11"},
        {x1: 0, y1: canvas.height, x2: 0, y2: 0, color: "#00aa11"},
    ],

    objects: null,
    monsters: null,
    stage: null
}

function makeLines(id, point, obj) {
    let lt = {x: point.x - obj.anchor.x, y: point.y - obj.anchor.y};
    let lines = [];
    for (let i = 0; i < obj.points.length; i++) {
        let j = i + 1;
        if (j == obj.points.length) {
            j = 0;
        }
        let start = obj.points[i];
        let end = obj.points[j];
        lines.push({
            x1: start.x + lt.x,
            y1: start.y + lt.y,
            x2: end.x + lt.x,
            y2: end.y + lt.y,
            color: "#00aa11",
            mid: id
        });
    }
    return lines;
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
        $.getJSON("data/monster.json", function(mst_data) {
            var monsters = mst_data;
            config.monsters = monsters;
            
            $.getJSON("data/stage.json", function(stage_data) {
                var stage = stage_data;
                config.stage = stage;
                for (let m of stage.monsters) {
                    let mc = getMonster(m.cid);
                    if (mc == null) {
                        console.log("not find monster " + m.cid);
                        continue;
                    }
                    let obj = objects[mc.type];
                    let lines = makeLines(m.id, m.point, obj);
                    for (let j = 0; j < lines.length; j++) {
                        config.lines.push(lines[j]);
                    }
                }

                // 通过线段数据生成法线向量
                for (let i = 0; i < config.lines.length; i++) {
                    config.lines[i].normal = normalize(normalVector(vector(config.lines[i])));
                }
                onfinish();
            });
        });
    });
}
