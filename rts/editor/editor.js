const cells = document.getElementById("cells");
const cellCtx = cells.getContext("2d");
const scene = document.getElementById("scene");
const sceneCtx = scene.getContext("2d");
const imgSide = 16;
const sceneWidth = 40;
const sceneHeight = 30;
let cursor = null;
let images = [];

function initEditor() {
    scene.width = imgSide * sceneWidth;
    scene.height = imgSide * sceneHeight;
    cells.addEventListener("click", function(evt) {
        if (images.length > 0) {
            let img = images[0];
            let wimg = img.width / imgSide;
            let himg = img.height / imgSide;
            let x = Math.floor(evt.offsetX / Math.floor(cells.clientWidth / wimg)) * imgSide;
            let y = Math.floor(evt.offsetY / Math.floor(cells.clientHeight / himg)) * imgSide;
            cursor = {img: img, x: x, y: y};
        } else {
            console.log("no image.");
        }
    });

    scene.addEventListener("click", function(evt) {
        if (cursor == null) {
            return;
        }
        // console.log("click: (" + evt.offsetX + "," + evt.offsetY + ")");

        let x = Math.floor((evt.offsetX * scene.width / scene.clientWidth) / imgSide) * imgSide;
        let y = Math.floor((evt.offsetY * scene.height / scene.clientHeight) / imgSide) * imgSide;
        // console.log("draw from (" + cursor.x + "," + cursor.y + ") to (" + x + "," + y + ")");
        sceneCtx.drawImage(cursor.img, cursor.x, cursor.y, imgSide, imgSide, x, y, imgSide, imgSide);
    });

    // console.log("scene canvas size: " + scene.width + ", " + scene.height);
    // console.log("scene client size: " + scene.clientWidth + ", " + scene.clientHeight);
}

function onClickLoad() {
    // alert("load image.");
    if (images.length == 0) {
        let img = new Image();
        img.src = "img/TileA5_PHC_Exterior-Nature.png";
        img.addEventListener("load", function(evt) {
            addImageListItem(img.src);
            cellCtx.drawImage(img, 0, 0, cells.width, cells.height);
            images.push(img);
        });
    }
}

function addImageListItem(content) {
    const imgTable = document.getElementById("imageList");
    imgTable.innerHTML += "<tr><td>" + content + "</td></tr>";
}

initEditor();
