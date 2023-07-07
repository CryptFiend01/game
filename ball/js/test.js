
function test() {
    let line = {x1:198,y1:630,x2:170,y2:645,color:"#004411",mid:17,normal:{x:-0.472221412515419,y:-0.8814799700287821}};
    // let dir = {x:-0.39691115068546706, y:-0.9178570359601427};
    // let start = game.base;
    let start = {x:375, y:305};
    let dir = {x:0.24483931082618096, y:0.9695636708716766};
    let end = {x: start.x + dir.x * 1400, y: start.y + dir.y * 1400};
    let l = {x1: start.x, y1: start.y, x2: end.x, y2: end.y, color:"#bbaa11"};
    let lines = [];
    for (let ll of config.lines) {
        lines.push(ll);
    }

    lines.push({x2:375,y2:305,x1:345,y1:305,color:"#00aa11",mid:30,hide:0});
    lines.push({x2:405,y2:365,x1:375,y1:365,color:"#00aa11",mid:35,hide:0});
    lines.push({x2:375,y2:335,x1:375,y1:305,color:"#00aa11",mid:30,hide:0});

    for (let i = 0; i < lines.length; i++) {
        lines[i].normal = normalize(normalVector(vector(lines[i])));
    }
    
    for (let ll of lines) {
        drawLine(ll);
        drawNormal(ll);
    }
        
    drawLine(l);

    console.log("ray: " + objToString(l));
    
    let collide = checkNextInterpoint(start, dir, lines, [lines[4]]);
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

function test1() {
    // let start = {x:375, y:305};
    // let dir = {x:0.24483931082618096, y:0.9695636708716766};
    // //let dir = {x:0.2, y:0.9};
    // ldata.lines.push({x1:375,y1:305,x2:345,y2:305,color:"#00aa11",mid:30,hide:0,normal:{x:0,y:-1}});
    // ldata.lines.push({x1:405,y1:365,x2:375,y2:365,color:"#00aa11",mid:35,hide:0,normal:{x:0,y:-1}});
    // ldata.lines.push({x1:375,y1:335,x2:375,y2:305,color:"#00aa11",mid:30,hide:0,normal:{x:0,y:-1}});
    // let collide = getNextCollision(start, dir, ldata.lines[1]);
    // console.log("collide" + objToString(collide));
    // let line1 = {x1: 250, y1: 800, x2: 1164.1154708972479, y2: -260.3739462408073, hide:1, width:1};
    // let line2 = {x1:500,y1:0,x2:500,y2:900,color:"#00aa11",hide:0,normal:{x:-1,y:0}};

    let start = {x: 10, y: 10};
    let dir = {x: 0.5, y: 0.5};
    let line1 = {x1: start.x, y1: start.y, x2: start.x + dir.x * 50, y2: start.y + dir.y * 50, hide:1, width:1};
    let line2 = {x1:5,y1:15,x2:15,y2:5,color:"#00aa11",hide:0,normal:{x:-1,y:0}};
    //let pt = getIntersectionPoint(line1, line2);
    let pt = getRaySegmentIntersection(start, dir, line2);
    console.log(pt);
    //showVec("inter", pt);

    drawLine(line1);
    drawLine(line2);
}

function testHeap() {
    let h = new Heap((a, b) => {return a < b;});
    let elements = [100, 80, 96, 12, 300, 234, 113,64,158,77,950];
    for (let e of elements) {
        h.add(e);
    }
    h.show();
    while(h.count > 5) {
        console.log(h.pop());
    }

    h.add(211);
    h.add(176);
    while (!h.empty()) {
        console.log(h.pop());
    }
}

function testRect() {
    let rt1 = {left:104,top:149,right:248,bottom:293};
    let rt2 = {left:56,top:437,right:152,bottom:533};
    let rt3 = {left:104,top:293,right:152,bottom:341};
    console.log("rt2.top=" + rt2.top + ", rt1.bottom=" + rt1.bottom);
    console.log(rt2.top >= rt1.bottom);
    console.log(rectInserect(rt2, rt1));
    console.log(rectInserect(rt3, rt1));
}