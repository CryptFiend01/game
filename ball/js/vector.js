function showVec(name, v) {
    console.log(name + ": [" + v.x + "," + v.y + "]");
}

function showLine(name, l) {
    console.log(name + ": [" + l.x1 + "," + l.y1 + "," + l.x2 + "," + l.y2 + "]");
}

function vector(line) {
    return {
        x : line.x2 - line.x1,
        y : line.y2 - line.y1
    }
}

function normalVector(v) {
    let n = {
        x : -v.y,
        y : v.x
    };
    return n;
}

function length(v) {
    return Math.sqrt(v.x * v.x + v.y * v.y);
}

function normalize(v) {
    let d = length(v);
    return {x: v.x / d, y: v.y / d};
}

function dot(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y;
}

function reflectVector(incident, normal) {
    let dt = dot(incident, normal);
    let r = {
        x : incident.x - 2 * dt * normal.x,
        y : incident.y - 2 * dt * normal.y
    };
    // 反射向量不能为0，略微加上一个偏移量
    if (r.x == 0 && r.y == 0) {
        r.x = incident.x - 2.1 * dt * normal.x;
        r.y = incident.y - 2.1 * dt * normal.y;
    }
    return r;
}

function getIntersection(line1, line2) {
    let a = {x: line1.x1, y: line1.y1};
    let b = {x: line1.x2, y: line1.y2};
    let c = {x: line2.x1, y: line2.y1};
    let d = {x: line2.x2, y: line2.y2};
    
    // 三角形abc 面积的2倍  
    var area_abc = (a.x - c.x) * (b.y - c.y) - (a.y - c.y) * (b.x - c.x);  
  
    // 三角形abd 面积的2倍  
    var area_abd = (a.x - d.x) * (b.y - d.y) - (a.y - d.y) * (b.x - d.x);   
  
    // 面积符号相同则两点在线段同侧,不相交 (对点在线段上的情况,本例当作不相交处理);  
    if (area_abc * area_abd >= 0) {  
        return null;  
    }  
  
    // 三角形cda 面积的2倍  
    var area_cda = (c.x - a.x) * (d.y - a.y) - (c.y - a.y) * (d.x - a.x);  
    // 三角形cdb 面积的2倍  
    // 注意: 这里有一个小优化.不需要再用公式计算面积,而是通过已知的三个面积加减得出.  
    var area_cdb = area_cda + area_abc - area_abd ;  

    if (  area_cda * area_cdb >= 0 ) {  
        return null;  
    }  
  
    //计算交点坐标  
    var t = area_cda / (area_abd - area_abc);  
    var dx = t * (b.x - a.x);
    var dy = t * (b.y - a.y);
    return { x: a.x + dx , y: a.y + dy };
}

function checkNextInterpoint(line, lines) {
    //showLine("line", line);
    let nearest = 1e10;
    let inter = { point: null, line: null };
    for (let i = 0; i < lines.length; i++) {
        let l = lines[i];
        let p = getIntersection(l, line);
        if (p != null) {
            let dist = length({x: p.x - line.x1, y: p.y - line.y1});
            if (dist > 1e-9 && dist < nearest) {
                inter.point = p;
                inter.line = l;
                nearest = dist;
            }
        }
    }

    return inter;
}

function copyLine(line) {
    let obj = {};
    for (let k in line) {
        obj[k] = line[k];
    }
    return obj;
}

function assignPoint(src, dst) {
    dst.x = src.x;
    dst.y = src.y;
}

function copyPoint(pt) {
    return {x: pt.x, y: pt.y};
}