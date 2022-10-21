const cells = document.getElementById("cells");
const cellCtx = cells.getContext("2d");
const scene = document.getElementById("scene");
const sceneCtx = scene.getContext("2d");
const imgSide = 16;
let sceneWidth = 0;
let sceneHeight = 0;
let cursor = null;
let images = [];
let isFill = false;
let isErase = false;
let initSet = 0;
const svrUrl = "http://127.0.0.1:5678"

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

function resetScene() {
    sceneWidth = mapObj.width;
    sceneHeight = mapObj.height;
    scene.width = imgSide * sceneWidth;
    scene.height = imgSide * sceneHeight;
    mapObj.tiles = [];
    mapObj.blocks = [];
    for (let i = 0; i < sceneWidth*sceneHeight; i++) {
        mapObj.tiles.push([0, 0, 0]);
        mapObj.blocks.push(0);
    }
}

function initEditor() {
    $("#newbox").hide();
    $("#openbox").hide();
    resetScene();
    cells.addEventListener("click", function(evt) {
        if (images.length > 0) {
            let img = images[0];
            let wimg = img.width / imgSide;
            let himg = img.height / imgSide;
            let x = Math.floor(evt.offsetX / Math.floor(cells.clientWidth / wimg)) * imgSide;
            let y = Math.floor(evt.offsetY / Math.floor(cells.clientHeight / himg)) * imgSide;
            cursor = {img: 0, x: x, y: y};
        } else {
            console.log("no image.");
        }
    });

    scene.addEventListener("click", function(evt) {
        let x = Math.floor((evt.offsetX * scene.width / scene.clientWidth) / imgSide) * imgSide;
        let y = Math.floor((evt.offsetY * scene.height / scene.clientHeight) / imgSide) * imgSide;
        let i = Math.floor(x / imgSide) + Math.floor(y / imgSide) * sceneWidth;
        if (isErase) {
            mapObj.tiles[i] = [0, 0, 0];
        } else {
            if (cursor == null) {
                return;
            }            
            mapObj.tiles[i] = [cursor.img+1, cursor.x, cursor.y];
        }

        draw();
    });

    scene.addEventListener("mousedown", function(evt) {
        isFill = true;
    });

    scene.addEventListener("mousemove", function(evt) {
        if (isFill) {
            let x = Math.floor((evt.offsetX * scene.width / scene.clientWidth) / imgSide) * imgSide;
            let y = Math.floor((evt.offsetY * scene.height / scene.clientHeight) / imgSide) * imgSide;
            let i = Math.floor(x / imgSide) + Math.floor(y / imgSide) * sceneWidth;
            if (isErase) {
                mapObj.tiles[i] = [0, 0, 0];
            } else if (cursor != null) {
                mapObj.tiles[i] = [cursor.img+1, cursor.x, cursor.y];
            }
    
            draw();
        }
    });

    scene.addEventListener("mouseup", function(evt) {
        isFill = false;
    });

    document.getElementById("new").addEventListener("click", function() {
        console.log("open new.");
        $("#newbox").show();
    });

    document.getElementById("open").addEventListener("click", function() {
        $("#openbox").show();
        $("#select-mapid-down").hide();
        // clearDropdown();

        httpGet(svrUrl + "/get_map_list", function(data) {
            let maplist = JSON.parse(data);
            let files = maplist["files"];
            for (let i = 0; i < files.length; i++) {
                addDropdownMap(files[i]);
            }
        });
    });

    document.getElementById("save").addEventListener("click", function() {
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

    document.getElementById("clear").addEventListener("click", function() {
        for (let i = 0; i < sceneWidth*sceneHeight; i++) {
            mapObj.tiles[i] = [0, 0, 0];
        }
        draw();
    });

    document.getElementById("erase").addEventListener("click", function() {
        isErase = !isErase;
    });

    document.getElementById("fill").addEventListener("click", function() {
        if (cursor != null) {
            mapObj.tiles = [];
            for (let i = 0; i < sceneWidth*sceneHeight; i++) {
                mapObj.tiles.push([cursor.img+1, cursor.x, cursor.y]);
            }
            draw();
        }
    });

    document.getElementById("init1").addEventListener("click", function(evt) {
        initSet = 1;
        cursor = null;
        isErase = false;
    });

    document.getElementById("init2").addEventListener("click", function(evt) {
        initSet = 2;
        cursor = null;
        isErase = false;
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
        loadImages();
    }
}

function loadImages() {
    images = [];
    document.getElementById("imageList").innerHTML = "";
    for (let i = 0; i < mapObj.images.length; i++) {
        let img = new Image();
        img.src = "img/" + mapObj.images[i];
        img.addEventListener("load", function(evt) {
            addImageListItem(mapObj.images[i]);
            images.push(img);
            if (i == 0) {
                cellCtx.drawImage(img, 0, 0, cells.width, cells.height);
            }
        });
    }
}

function onClickCloseNewbox() {
    $("#newbox").hide();
}

function onClickNew() {
    mapid = parseInt(document.getElementById("new-mapid").value);
    let width = parseInt(document.getElementById("new-width").value);
    let height = parseInt(document.getElementById("new-height").value);
    mapObj.width = width;
    mapObj.height = height;
    console.log("mapid:" + mapid + ", width:" + width + ",height:" + height);
    onClickCloseNewbox();
    resetScene();
}

function draw() {
    sceneCtx.clearRect(0, 0, scene.clientHeight, scene.clientHeight);
    for (let i = 0; i < mapObj.tiles.length; i++) {
        let tile = mapObj.tiles[i];
        if (tile == undefined) {
            console.log("tile " + i + " is undefined.");
            continue;
        }
        if (tile[0] > 0) {
            let img = images[tile[0]-1];
            let x = Math.floor(i % sceneWidth) * imgSide;
            let y = Math.floor(i / sceneWidth) * imgSide;
            sceneCtx.drawImage(img, tile[1], tile[2], imgSide, imgSide, x, y, imgSide, imgSide);
        }
    }
}

function addImageListItem(content) {
    const imgTable = document.getElementById("imageList");
    imgTable.innerHTML += "<tr><td>" + content + "</td></tr>";
}

function onClickCloseOpenbox() {
    $("#openbox").hide();
}

function clearDropdown() {
    document.getElementById("select-mapid-down").innerHTML = "";
}

function onClickSelectMapid(obj) {
    let val = $(obj).text();
    $("#select-mapid-down").toggle();
    $("#select-mapid").text(val);
}

function addDropdownMap(content) {
    const dropdown = document.getElementById("select-mapid-down");
    dropdown.innerHTML += "<li class=\"li-dropdown\" onclick=\"onClickSelectMapid(this)\">" + content + "</li>";
}

function onClickMapidDropdown() {
    $("#select-mapid-down").toggle();
}

function httpGet(url, callback) {
    let req = new XMLHttpRequest();
    req.open("GET", url, true);

    req.onreadystatechange = function() {
        if (req.readyState != 4) {
            return;
        }

        if (req.status === 200) {
            callback(req.responseText);
        }
    };
    req.send();
}

function onClickOpen() {
    let selectMapId = $("#select-mapid").text();
    httpGet(svrUrl + "/get_map/" + selectMapId, function(data) {
        if (data == "fail") {
            return;
        }
        mapid = parseInt(selectMapId);
        mapObj = JSON.parse(data);
        loadImages();
        draw();
    });
}

initEditor();
