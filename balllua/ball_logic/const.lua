local BallConst = {
    CmdType = {
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
    },

    SkillType = {
        BALL_ADD = 1,
        RANGE_TRIGGER = 2,
        ROUND_DAMAGE = 3,
        SOLID_BLOCK = 4,
        DASH_BLOCK = 5,
        BALL_THROUGH = 6,
        DEAD_TRIGGER = 7
    },

    StageEvent = {
        DEAD_CALL = 1, -- cid, count
        HIT_MOVE = 2, -- times, grid
        ROUND_MOVE = 3
    },

    EvtType = {
        CALL_ENEMY = 1,
        ENEMY_MOVE = 2,
        SKILL_TRIGGER = 3,
    },

    MIN_NUM = 1e-9,
}

return BallConst
