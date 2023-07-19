const CmdType = {
    CREATE_BALL : 1,
    COLLIDE : 2,
    HIT: 3,
    ROLE_SKILL: 4,
    ENEMY_SKILL: 5,
    REMOVE_SKILL : 6,
    SKILL_EFFECT : 7,
    ENEMY_MOVE: 8,
    PUSH: 10,
    ROUND_END: 11,
    WIN : 12,
    LOSE : 13
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