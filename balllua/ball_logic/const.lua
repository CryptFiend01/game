local CmdType = {
    CREATE_BALL = 1,
    COLLIDE = 2,
    ROLE_SKILL = 3,
    ENEMY_SKILL = 4,
    SKILL_EFFECT = 5,
    ENEMY_MOVE = 6,
    PUSH = 11,
    ROUND_END = 12,
    WIN = 13,
    LOSE = 14
}

local SkillType = {
    BALL_ADD = 1,
    RANGE_TRIGGER = 2,
    ROUND_DAMAGE = 3,
    SOLID_BLOCK = 4,
    DASH_BLOCK = 5,
    BALL_THROUGH = 6,
    DEAD_TRIGGER = 7
}

local StageEvent = {
    DEAD_CALL = 1, -- cid, count
    HIT_MOVE = 2, -- times, grid
    ROUND_MOVE = 3
}

local EvtType = {
    CALL_ENEMY = 1,
    ENEMY_MOVE = 2,
    SKILL_TRIGGER = 3,
}

local OpType = {
    BALL = 1,
    SKILL = 2
}

local Board = {
    WIDTH = 8,
    HEIGHT = 11,
    SIDE = 48
}

local Canvas = {
    WIDTH = 400,
    HEIGHT = 700
}

local Offset = {
    x = (Canvas.WIDTH - Board.WIDTH * Board.SIDE) / 2, 
    y = 5
}

local GameRect = {
    left = Offset.x,
    top = Offset.y,
    right = Board.WIDTH * Board.SIDE + Offset.x,
    bottom = Board.HEIGHT * Board.SIDE + Offset.y
}

local Base = {
    x = 200,
    y = 552
}

local Const = {
    CmdType = CmdType,
    SkillType = SkillType,
    StageEvent = StageEvent,
    EvtType = EvtType,
    OpType = OpType,
    Board = Board,
    Canvas = Canvas,
    Offset = Offset,
    GameRect = GameRect,
    Base = Base,

    MAX_NUM = 1e9,
    MIN_NUM = 1e-9,

    BALL_DMG = 500,
    INTERVAL = 15
}

return Const
