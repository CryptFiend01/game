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
let imageWids = [];
let isFill = false;
let isErase = false;
let isDrag = false;
let dragStartPos = null;
let initSet = 0;
let isGrid = false;
let isEraseGrid = false;
let selectImg = -1;
const svrUrl = "http://127.0.0.1:5678";

let mapid = 0;
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
    $("#filemain").click( function() { $("#filedrop").toggle(); } );
    $("#editmain").click( function() { $("#editdrop").toggle(); } );
    $("#layermain").click( function() { $("#layerdrop").toggle(); } );
    resetScene();
    cells.addEventListener("click", function(evt) {
        if (selectImg >= 0) {
            let img = images[selectImg];
            let wimg = img.width / imgSide;
            let himg = img.height / imgSide;
            let x = Math.floor(evt.offsetX / Math.floor(cells.clientWidth / wimg));
            let y = Math.floor(evt.offsetY / Math.floor(cells.clientHeight / himg));
            cursor = {img: selectImg, x: x, y: y};
        } else {
            console.log("no image.");
        }
    });

    function setGrid(offsetX, offsetY) {
        let x = Math.floor((offsetX + canvasOffsetX) / imgSide) * imgSide;
        let y = Math.floor((offsetY + canvasOffsetY) / imgSide) * imgSide;
        let i = Math.floor(x / imgSide) + Math.floor(y / imgSide) * sceneWidth;
        if (isErase) {
            console.log("erase (" + x + "," + y + ")");
            mapObj.tiles[i] = [0, 0];
        } else if (isEraseGrid) {
            mapObj.blocks[i] = 0;
        } else if (isGrid) {
            mapObj.blocks[i] = 1;
        } else if (initSet == 1) {
            mapObj.init1 = [Math.floor(x/imgSide), Math.floor(y/imgSide)];
        } else if (initSet == 2) {
            mapObj.init2 = [Math.floor(x/imgSide), Math.floor(y/imgSide)];
        } else if (cursor != null) {
            mapObj.tiles[i] = [cursor.img+1, cursorPos(cursor)];
        }
        draw();
    }

    scene.addEventListener("click", function(evt) {
        if (!isDrag) {
            setGrid(evt.offsetX, evt.offsetY);
        }
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
            setGrid(evt.offsetX, evt.offsetY);
        } else if (isDrag && dragStartPos != null) {
            let dx = dragStartPos.x - evt.offsetX;
            let dy = dragStartPos.y - evt.offsetY;
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
            draw();
        }
    });

    scene.addEventListener("mouseup", function(evt) {
        isFill = false;
        dragStartPos = null;
    });

    $("#save").click(function() {
        if (mapid == 0) {
            return;
        }
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
        isGrid = false;
        isEraseGrid = false;
    });

    $("#clear").click(function() {
        for (let i = 0; i < sceneWidth*sceneHeight; i++) {
            mapObj.tiles[i] = [0, 0];
        }
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
        isGrid = false;
        isEraseGrid = false;
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
        isGrid = false;
        isEraseGrid = false;
    });

    $("#init2").click(function() {
        initSet = 2;
        cursor = null;
        isErase = false;
        isDrag = false;
        dragStartPos = null;
        isGrid = false;
        isEraseGrid = false;
    });

    $("#setgrid").click(function() {
        initSet = 0;
        isErase = false;
        isDrag = false;
        dragStartPos = null;
        isGrid = true;
        isEraseGrid = false;
    });

    $("#remgrid").click(function() {
        initSet = 0;
        isErase = false;
        isDrag = false;
        dragStartPos = null;
        isGrid = false;
        isEraseGrid = true;
    });

    $("#cleargrid").click(function() {
        for (let i = 0; i < sceneWidth*sceneHeight; i++) {
            mapObj.blocks[i] = [0];
        }
        draw();
    });

    $("#loadimg").change(function() {
        let imgName = this.files[0].name;
        for (let i = 0; i < mapObj.images.length; i++) {
            if (mapObj.images[i] == imgName) {
                return;
            }
        }
        mapObj.images.push(imgName);
        loadImages(null);
    });
}

function addImageListItem(content, i) {
    const imgTable = document.getElementById("imageList");
    imgTable.innerHTML += "<tr><td><div class=\"btn-sel\" onclick=\"selectImageItem(" + i + ")\">" + content + "</div></td></tr>";
}

function selectImageItem(i) {
    console.log("select " + i);
    selectImg = i;
    cellCtx.clearRect(0, 0, cells.clientWidth, cells.clientHeight);
    let img = images[i];
    cellCtx.drawImage(img, 0, 0, cells.width, cells.height);
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
                addImageListItem(mapObj.images[i], i);
                images.push(img);
                selectImg = images.length - 1;
                cellCtx.clearRect(0, 0, cells.clientWidth, cells.clientHeight);
                cellCtx.drawImage(img, 0, 0, cells.width, cells.height);
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
    if (mapid < 1) {
        return;
    }
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

    drawGrid();
}

function drawGrid() {
    for (let i = 0; i <= mapObj.width; i++) {
        let x = i * imgSide - canvasOffsetX;
        if (x >=0 && x <= scene.clientWidth) {
            sceneCtx.beginPath();
            sceneCtx.moveTo(x, 0);
            sceneCtx.lineTo(x, mapObj.height * imgSide);
            sceneCtx.lineWidth = 1;
            sceneCtx.setLineDash([10, 3]);
            sceneCtx.strokeStyle = "rgba(50, 80, 180, 0.5)";
            sceneCtx.stroke();
        }
    }

    for (let i = 0; i <= mapObj.height; i++) {
        let y = i * imgSide - canvasOffsetY;
        if (y >= 0 && y <= scene.clientHeight) {
            sceneCtx.beginPath();
            sceneCtx.moveTo(0, y);
            sceneCtx.lineTo(mapObj.width * imgSide, y);
            sceneCtx.lineWidth = 1;
            sceneCtx.setLineDash([10, 3]);
            sceneCtx.strokeStyle = "rgba(50, 80, 180, 0.5)";
            sceneCtx.stroke();
        }
    }

    for (let i = 0; i < mapObj.blocks.length; i++) {
        if (mapObj.blocks[i] != 0) {
            let x = Math.floor(i % mapObj.width) * imgSide - canvasOffsetX;
            let y = Math.floor(i / mapObj.width) * imgSide - canvasOffsetY;
            if (x >= 0 && x <= scene.clientWidth && y >= 0 && y <= scene.clientHeight) {
                sceneCtx.fillStyle = "rgba(50, 80, 180, 0.5)";
                sceneCtx.fillRect(x, y, imgSide, imgSide);
            }
        }
    }

    function drawInit(x, y, color) {
        let centerX = x * imgSide + Math.floor(imgSide / 2) - canvasOffsetX;
        let centerY = y * imgSide + Math.floor(imgSide / 2) - canvasOffsetY;
        sceneCtx.beginPath();
        sceneCtx.arc(centerX, centerY, 13, 0, 2*Math.PI);
        sceneCtx.lineWidth = 5;
        sceneCtx.strokeStyle = color;
        sceneCtx.stroke();
    }

    if (mapObj.init1.length == 2) {
        drawInit(mapObj.init1[0], mapObj.init1[1], "rgba(220, 30, 30, 0.8)");
    }
    if (mapObj.init2.length == 2) {
        drawInit(mapObj.init2[0], mapObj.init2[1], "rgba(30, 30, 220, 0.8)");
    }
}

InitEditor();
