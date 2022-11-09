const cells = document.getElementById("cells");
const cellCtx = cells.getContext("2d");
const scene = document.getElementById("scene");
const sceneCtx = scene.getContext("2d");
const imgSide = 16;
let screenWidth = 54;
let screenHeight = 54;
scene.width = imgSide * screenWidth;
scene.height = imgSide * screenHeight;
let sceneWidth = 0;
let sceneHeight = 0;
let canvasOffsetX = 0;
let canvasOffsetY = 0;
let cursor = null;
let images = [];
let isFill = false;
let isErase = false;
let isDrag = false;
let dragStartPos = null;
let initSet = 0;
const svrUrl = "http://127.0.0.1:5678";

let mapid = 1;
let mapObj = {
    width : 40,
    height : 30,
    side : 16,
    init1 : [],
    init2 : [],
    images : [],
    tiles : [],
    blocks : [],
};

function cursorPos(cursor) {
    let img = images[cursor.img];
    return cursor.x + cursor.y * Math.floor(img.width / imgSide);
}

function resetScene() {
    sceneWidth = mapObj.width;
    sceneHeight = mapObj.height;
    canvasOffsetX = 0;
    canvasOffsetY = 0;
    console.log("scene clientWidth:" + scene.clientWidth + ", clientHeight:" + scene.clientHeight);
    mapObj.tiles = [];
    mapObj.blocks = [];
    for (let i = 0; i < sceneWidth*sceneHeight; i++) {
        mapObj.tiles.push([0, 0]);
        mapObj.blocks.push(0);
    }
}

function InitEditor() {
    $("#newbox").hide();
    $("#openbox").hide();
    resetScene();
    cells.addEventListener("click", function(evt) {
        if (images.length > 0) {
            let img = images[0];
            let wimg = img.width / imgSide;
            let himg = img.height / imgSide;
            let x = Math.floor(evt.offsetX / Math.floor(cells.clientWidth / wimg));
            let y = Math.floor(evt.offsetY / Math.floor(cells.clientHeight / himg));
            cursor = {img: 0, x: x, y: y};
        } else {
            console.log("no image.");
        }
    });

    scene.addEventListener("click", function(evt) {
        if (!isDrag) {
            let x = Math.floor((evt.offsetX + canvasOffsetX) / imgSide) * imgSide;
            let y = Math.floor((evt.offsetY + canvasOffsetY) / imgSide) * imgSide;
            let i = Math.floor(x / imgSide) + Math.floor(y / imgSide) * sceneWidth;
            if (isErase) {
                console.log("erase (" + x + "," + y + ")");
                mapObj.tiles[i] = [0, 0];
            } else if (cursor != null) {
                console.log("click pos: (" + evt.offsetX + "," + evt.offsetY + ")");
                console.log("draw cursor: (" + cursor.img + "," + cursor.x + "," + cursor.y + ") at (" + x + "," + y + ")");
                console.log("cursorpos: " + cursorPos(cursor));
                mapObj.tiles[i] = [cursor.img+1, cursorPos(cursor)];
            }
        }
        draw();
    });

    scene.addEventListener("mousedown", function(evt) {
        if (isDrag) {
            dragStartPos = {x: evt.offsetX, y: evt.offsetY};
        } else {
            isFill = true;
        }
    });

    scene.addEventListener("mousemove", function(evt) {
        if (isFill) {
            let x = Math.floor((evt.offsetX + canvasOffsetX) / imgSide) * imgSide;
            let y = Math.floor((evt.offsetY + canvasOffsetY) / imgSide) * imgSide;
            let i = Math.floor(x / imgSide) + Math.floor(y / imgSide) * sceneWidth;
            if (isErase) {
                mapObj.tiles[i] = [0, 0];
            } else if (cursor != null) {
                mapObj.tiles[i] = [cursor.img+1, cursorPos(cursor)];
            }
    
            draw();
        } else if (isDrag && dragStartPos != null) {
            let dx = dragStartPos.x - evt.offsetX;
            let dy = dragStartPos.y - evt.offsetY;
            let oldOffsetX = canvasOffsetX;
            let oldOffsetY = canvasOffsetY;
            canvasOffsetX += dx; //Math.floor(dx / (imgSide*2)) * imgSide;
            canvasOffsetY += dy; //Math.floor(dy / (imgSide*2)) * imgSide;
            if (canvasOffsetX < 0)
                canvasOffsetX = 0;
            if (canvasOffsetY < 0)
                canvasOffsetY = 0;
            if (canvasOffsetX > sceneWidth * imgSide - scene.width)
                canvasOffsetX = sceneWidth * imgSide - scene.width;
            if (canvasOffsetY > sceneHeight * imgSide - scene.height)
                canvasOffsetY = sceneHeight * imgSide - scene.height;
            if (oldOffsetX != canvasOffsetX || oldOffsetY != canvasOffsetY)
                draw();
        }
    });

    scene.addEventListener("mouseup", function(evt) {
        isFill = false;
        dragStartPos = null;
    });

    $("#save").click(function() {
        let httpRequest = new XMLHttpRequest();
        httpRequest.open("POST", svrUrl + "/save_map", true);
        httpRequest.setRequestHeader("Content-type","application/json");
        let req = {
            mapid : mapid,
            data : mapObj
        }
        let msg = JSON.stringify(req);
        httpRequest.send(msg);

        httpRequest.onreadystatechange = () => {
            if (httpRequest.readyState == 4 && httpRequest.status == 200) {
                let data = httpRequest.responseText;
                if (data == "success") {
                    alert("save success!");
                }
            }
        }
    });

    $("#pen").click(function() {
        isDrag = false;
        isErase = false;
        dragStartPos = null;
    });

    $("#clear").click(function() {
        for (let i = 0; i < sceneWidth*sceneHeight; i++) {
            mapObj.tiles[i] = [0, 0];
        }

        isDrag = false;
        isErase = false;
        dragStartPos = null;
        initSet = 0;
        draw();
    });

    $("#drag").click(function() {
        isDrag = true;
        isErase = false;
        initSet = 0;
    })

    $("#erase").click(function() {
        isErase = true;
        isDrag = false;
        dragStartPos = null;
        initSet = 0;
    });

    $("#fill").click(function() {
        if (cursor != null) {
            mapObj.tiles = [];
            for (let i = 0; i < sceneWidth*sceneHeight; i++) {
                mapObj.tiles.push([cursor.img+1, cursorPos(cursor)]);
            }
            draw();
        }
    });

    $("#init1").click(function() {
        initSet = 1;
        cursor = null;
        isErase = false;
        isDrag = false;
        dragStartPos = null;
    });

    $("#init2").click(function() {
        initSet = 2;
        cursor = null;
        isErase = false;
        isDrag = false;
        dragStartPos = null;
    });
}

function onClickLoad() {
    if (images.length == 0) {
        let name = "TileA5_PHC_Exterior-Nature.png";
        for (let i = 0; i < mapObj.images.length; i++) {
            if (mapObj.images[i] == name) {
                return;
            }
        }
        mapObj.images.push(name);
        loadImages(null);
    }
}

function loadImages(onfinish) {
    images = [];
    document.getElementById("imageList").innerHTML = "";
    let promises = [];
    for (let i = 0; i < mapObj.images.length; i++) {
        let p = new Promise(function(resolve, reject) {
            let img = new Image();
            img.src = "img/" + mapObj.images[i];
            img.addEventListener("load", function(evt) {
                addImageListItem(mapObj.images[i]);
                images.push(img);
                if (i == 0) {
                    cellCtx.drawImage(img, 0, 0, cells.width, cells.height);
                }
                resolve();
            });
        });
        promises.push(p);
    }

    Promise.all(promises).then(() => {
        console.log("load images finish!");
        if (onfinish != null) {
            onfinish();
        }
    });
}

function redraw() {
    sceneWidth = mapObj.width;
    sceneHeight = mapObj.height;
    canvasOffsetX = 0;
    canvasOffsetY = 0;
    
    draw();
}

function draw() {
    sceneCtx.clearRect(0, 0, scene.clientWidth, scene.clientHeight);
    for (let i = 0; i < mapObj.tiles.length; i++) {
        let tile = mapObj.tiles[i];
        if (tile == undefined) {
            console.log("tile " + i + " is undefined.");
            continue;
        }
        if (tile[0] > 0) {
            let img = images[tile[0]-1];
            let w = Math.floor(img.width / imgSide);
            let x = Math.floor(i % sceneWidth) * imgSide - canvasOffsetX;
            let y = Math.floor(i / sceneWidth) * imgSide - canvasOffsetY;
            sceneCtx.drawImage(img, Math.floor(tile[1] % w) * imgSide, Math.floor(tile[1] / w) * imgSide, imgSide, imgSide, x, y, imgSide, imgSide);
        }
    }
}

InitEditor();
