local Logic = require "ball_logic.logic"
local Const = require "ball_logic.const"
local Help = require "ball_logic.help"
local json = require "json"
local Basic = require "ball_logic.basic"

local function main()
    local roles = {
        {id = 1, count = 10, times = 50, skill = {type = Const.SkillType.BALL_ADD, dmg = 1000, cd = 4}},
        {id = 2, count = 10, times = 50, skill = {type = Const.SkillType.BALL_THROUGH, round = 2, cd = 2}},
        {id = 3, count = 10, times = 50, skill = {}},
        {id = 4, count = 10, times = 50, skill = {type = Const.SkillType.ROUND_DAMAGE, width = 3, height = 3, dmg = 5000, round = 4, cd = 4, push = true}},
        {id = 5, count = 10, times = 50, skill = {}},
    }
    local rs = '[{"op":2,"rid":2,"target":null},{"op":1,"dir":{"x":0.9899494936611665,"y":-0.1414213562373095}},{"op":2,"rid":1},{"op":1,"dir":{"x":0.7794454151597706,"y":-0.6264701467639241}},{"op":2,"rid":2},{"op":1,"dir":{"x":0.980953712496688,"y":-0.19424163801555325}},{"op":1,"dir":{"x":0.01648597757117986,"y":-0.9998640970369537}}]'
    local replay = json.decode(rs)
    local t1 = os.clock()
    Logic.init(roles)
    for _, op in ipairs(replay) do
        if op.op == Const.OpType.SKILL then
            if type(op.target) ~= "table" then
                op.target = nil
            end
            Logic.use_skill(roles[op.rid], op.target)
        else
            Logic.start_round(op.dir)
            Logic.update_round()
        end
        local cmds = Logic.get_cmds()
        if cmds[#cmds].type == Const.CmdType.WIN then
            break
        end
    end
    local t2 = os.clock()
    print("use time "..(t2 - t1).."ms")
end

main()
