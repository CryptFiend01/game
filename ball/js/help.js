function objToString(o) {
    let s = "{";
    let sep = "";
    for (let k in o) {
        s += sep + k + ":";
        if (typeof(o[k]) == "object") {
            s += objToString(o[k]);    
        } else {
            s += o[k];
        }
        if (sep == "")
            sep = ",";
    }
    s += "}";
    return s;
}

function showVec(name, v) {
    console.log(name + ": [" + v.x + "," + v.y + "]");
}

function showLine(name, l) {
    console.log(name + ": [" + l.x1 + "," + l.y1 + "," + l.x2 + "," + l.y2 + "]");
}

function vec2String(v) {
    return "[" + v.x + "," + v.y + "]";
}

function line2String(l) {
    return "[" + l.x1 + "," + l.y1 + "," + l.x2 + "," + l.y2 + "]";
}
