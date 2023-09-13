local Fix = require "ball_logic.fixed"

local CmdType = {
    CREATE_BALL = 1,    -- 创建球，{type: 1, dir: {x:1, y:2}, id: 1, cid: 2} id:球的id，cid：玩家id
    COLLIDE = 2,        -- 弹射，{type: 2, reflect: {x: 3, y:4}, target:{x: 1, y: 1}, dmg: {id:1, dmg:10, hp:180}, evts: [{type:1, id:1001, cid:9, grid:3}]}，reflect:弹射后的方向向量，target：撞击点，dmg伤害，evts撞击产生的事件
    ROLE_SKILL = 3,     -- 角色使用技能，{type:3, cid:1, target: {x:1, y:1}, cd:3, range:{x:100,y:100, width:200, height:200}} cid:角色id， target：格子xy，cd：冷却回合数，range：像素范围
    ENEMY_SKILL = 4,    -- 敌方使用技能（暂缺）
    REMOVE_SKILL = 5,   -- 移除持续技能效果 {type:5, cid: 1} cid: 技能id
    SKILL_EFFECT = 6,   -- 技能效果（被动技能，或者持续性技能触发），{type:5, cid: 1, effects:[{dmg:{id:1, dmg:10, hp:100}, evts:{type:1, id:1001, cid:9, grid:3}},...]} cid: 技能id，effects技能效果，同弹射伤害结构
    ENEMY_MOVE = 7,     -- 敌方移动（暂缺）
    SKILL_READY = 8,    -- 技能准备 {type:8, cid:1}
    PUSH = 11,          -- 地图推进，{type: 11, line: 5, moved:[{id:1, x:30, y:50},...]} line：推进行数，moved：推进的同时有些怪物会同时移动
    ROUND_END = 12,     -- 回合结束，{type: 12, base:{x:1, y:2}} base: 发射点位置
    WIN = 13,           -- 胜利
    LOSE = 14           -- 失败
}

local SkillType = {
    BALL_ADD = 1,     -- 强化球伤
    RANGE_TRIGGER = 2,-- 范围触发
    ROUND_DAMAGE = 3, -- 回合伤害
    SOLID_BLOCK = 4,  -- 召唤实体
    DASH_BLOCK = 5,   -- 虚化物召唤
    BALL_THROUGH = 6, -- 穿透球
    DEAD_TRIGGER = 7, -- 死亡触发
    RANGE_DAMAGE = 8, -- 一次性范围伤害
}

-- 配置表事件（内部）
local StageEvent = {
    DEAD_CALL = 1, -- cid, count
    HIT_MOVE = 2, -- times, grid
    ROUND_MOVE = 3
}

-- 返回命令事件类型（外部）
local EvtType = {
    CALL_ENEMY = 1, -- 召唤敌方 {type:1, id:1, cid:1001, grid:20} id: 唯一id，cid：配置id，grid左上角所在格子的位置
    ENEMY_MOVE = 2, -- 敌方移动（暂缺）
    SKILL_TRIGGER = 3, -- 技能触发（暂缺）
}

-- 运行事件（内部）
local BallEvent = {
    EVT_SKILL = 1, -- 释放技能事件
}

local OpType = {
    BALL = 1,
    SKILL = 2
}

local Board = {
    WIDTH = Fix.tofix(8),
    HEIGHT = Fix.tofix(11),
    SIDE = Fix.tofix(48),
    NWIDTH = 8,
    NHEIGHT = 11,
    NSIDE = 48
}

local Canvas = {
    WIDTH = Fix.tofix(400),
    HEIGHT = Fix.tofix(700),
    NWIDTH = 400,
    NHEIGHT = 700
}

local Offset = {
    x = (Canvas.WIDTH - Board.WIDTH * Board.SIDE) / 2, 
    y = Fix.tofix(5),
    nx = (Canvas.NWIDTH - Board.NWIDTH * Board.NSIDE) / 2,
    ny = 5
}

local GameRect = {
    left = Offset.x,
    top = Offset.y,
    right = Board.WIDTH * Board.SIDE + Offset.x,
    bottom = Board.HEIGHT * Board.SIDE + Offset.y
}

local Base = {
    x = Fix.tofix(200),
    y = Fix.tofix(552)
}

local Const = {
    CmdType = CmdType,
    SkillType = SkillType,
    StageEvent = StageEvent,
    EvtType = EvtType,
    BallEvent = BallEvent,
    OpType = OpType,
    Board = Board,
    Canvas = Canvas,
    Offset = Offset,
    GameRect = GameRect,
    Base = Base,

    MAX_NUM = Fix.tofix(1e7),
    MIN_NUM = Fix.tofix(1e-7),

    BALL_DMG = Fix.tofix(500),
    INTERVAL = Fix.tofix(15)
}

return Const
