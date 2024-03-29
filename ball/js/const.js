const CmdType = {
    CREATE_BALL : 1,
    COLLIDE : 2,
    ROLE_SKILL: 3,
    ENEMY_SKILL: 4,
    REMOVE_SKILL : 5,
    SKILL_EFFECT : 6,
    ENEMY_MOVE: 7,
    SKILL_READY: 8,
    PUSH: 11,
    ROUND_END: 12,
    WIN : 13,
    LOSE : 14
}

const ColorSet = {
    LineSolid : "#00aa11",
    LineDash : "#ebbef7"
}

const SkillType = {
    BALL_ADD : 1,
    RANGE_TRIGGER : 2, 
    ROUND_DAMAGE : 3,
    SOLID_BLOCK : 4,
    DASH_BLOCK : 5,
    BALL_THROUGH : 6,
    DEAD_TRIGGER : 7
}

const StageEvent = {
    DEAD_CALL : 1, // cid, count
    HIT_MOVE: 2, // 
    HIT_CHANGE: 3, // shapes|angle 
    ROUND_MOVE: 4 // move_type
}

const EvtType = {
    CALL_ENEMY : 1, // {id: 1, cid:1, grid:1}
    ENEMY_MOVE : 2, // {id: 1, grid: 2}
    SKILL_TRIGGER : 3, // {skill:1...}
    ROTATE : 4
}

const OpType = {
    BALL : 1,
    SKILL : 2
}

const Board = {
    WIDTH : 8,
    HEIGHT : 11,
    SIDE : 48
}

const Canvas = {
    width : 400,
    height : 700
}
