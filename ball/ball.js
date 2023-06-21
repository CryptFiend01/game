
function aim() {
    let n = ldata.begin;
    let start = ldata.ballBase;
    while (ldata.collisions.length < ldata.times) {
        let collide = getNextCollision(start, n);
        if (collide.point == null)
            break;
        ldata.collisions.push({x: collide.point.x, y: collide.point.y, radius: 2, color: "#1234bc"});

        n = getReflectNorm(start, collide);
        start = collide.point;
    }
    draw(ldata);
}

function update() {
    draw(ldata);
    ldata.status = 1;
}

function copyLine(line) {
    let obj = {};
    for (let k in line) {
        obj[k] = line[k];
    }
    return obj;
}

function initialze() {
    loadData(function () {
        initLogic();
        addEventListener("mousemove", (evt) => {
            if (ldata.status != 1) {
                return;
            }
            ldata.collisions.length = 0;
            ldata.balls.length = 0;
            let v = {x: evt.offsetX - ldata.ballBase.x, y: evt.offsetY - ldata.ballBase.y};
            ldata.begin = normalize(v);
            aim();
        });

        addEventListener("mousedown", (evt) => {
            if (ldata.status == 2) {
                return;
            }
            ldata.status = 2;
            startRound();
            runRound();
            ldata.timer = setInterval(update, 10);
        });
    });   
}

initialze();
