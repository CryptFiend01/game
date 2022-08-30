import json

blocks = [0] * 90000

tiles = [[1, 83]] * 90000

map_data = {"width":300, "height":300, "side":16, "images":["TileA5_PHC_Exterior-Nature.png"], "init1":[15, 15], "init2":[285, 285], "blocks":blocks, "tiles":tiles}

json.dump(map_data, open('json/1001.json', 'w'))