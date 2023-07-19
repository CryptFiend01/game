local Ball = require "ball_logic.ball"
local Heap = require "ball_logic.heap"

local data = {
    lines = {},
    balls = nil,
    base = {x = 250, y = 800},
    next_base = nil,
    begin_dir = {x = 0, y = 0},
    enemys = {},
    start_line = 0,
    pushed = -1,
    through = false,
    
    round = 0,
    win = false,

    cmds = {},
    ops = {},

    take_grids = {},
    skills = {},
    ball_dmg = 500,
}

local function add_cmd(cmd)
    cmd.id = #data.cmds + 1
    table.insert(data.cmds, cmd)
end

local function get_cmds()
    return data.cmds
end

local function get_replay()
    return data.ops
end

local function init(base, interval, roles)
    data.balls = Heap:new(ball.less)
end

local function start_round(dir)
    
end

local function update_round()
    
end

return {
    data = data,
    get_cmds = get_cmds,
    get_replay = get_replay,
    init = init,
    start_round = start_round,
    update_round = update_round
}