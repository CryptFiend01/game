local Monster = {
    [1] = {id = 1, type = "brick", res = "Monster_1", solid = true, hp = 10000},
    [2] = {id = 2, type = "bigbrick", res = "Brick_1", solid = true, hp = 10000, evt = {type=1, cid=9, count=4}},
    [3] = {id = 3, type = "triangle1", res = "TriangleBrick_1", solid = true, hp = 10000},
    [4] = {id = 4, type = "triangle2", res = "TriangleBrick_2", solid = true, hp = 10000},
    [5] = {id = 5, type = "triangle3", res = "TriangleBrick_3", solid = true, hp = 10000},
    [6] = {id = 6, type = "triangle4", res = "TriangleBrick_4", solid = true, hp = 10000},
    [7] = {id = 7, type = "rotate", res = "Rotate_1", solid = true, hp = 10000},
    [8] = {id = 8, type = "smallbrick", res = "box_1", solid = false, hp = 2},
    [9] = {id = 9, type = "brick", res = "Monster_2", solid = true, hp = 5000},
    [101] = {id = 101, type = "monster", res = "Boss", solid = true, hp = 100000}
}

return Monster
