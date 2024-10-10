function httpGet(url, callback) {
    var p = new Promise(function(resolve, reject) {
        $.get(url, function(data, status) {
            console.log("data: " + JSON.stringify(data) + ", status: " + status);
            if (callback(data, status))
                resolve();
            else
                reject();
        });
    });
    return p;
}

// --------------- NewBox ---------------------------
$("#new").click(function() {
    console.log("open new.");
    $("#newbox").show();
});

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


// --------------- OpenBox ----------------------------
$("#open").click(function() {
    $("#openbox").show();
    $("#select-mapid-down").hide();
    clearDropdown();
    // $("#filedrop").hide();

    $.get(svrUrl + "/get_map_list", function(data, status) {
        let maplist = data;
        let files = maplist["files"];
        for (let i = 0; i < files.length; i++) {
            addDropdownMap(files[i]);
        }
    });
});

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

function onClickOpen() {
    let selectMapId = $("#select-mapid").text();
    $.get(svrUrl + "/get_map/" + selectMapId, function(data, status) {
        if (data == "fail") {
            return;
        }
        
        // if (data.width > 50 || data.height > 50) {
        //     alert("map is too large for load!");
        //     return;
        // }
        onClickCloseOpenbox();
        mapid = parseInt(selectMapId);
        mapObj = data;
        loadImages(redraw);
    });
}
