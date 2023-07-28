local Logic = require "ball_logic.logic"
local Const = require "ball_logic.const"
local Help = require "ball_logic.help"
local json = require "json"

local function main()
    local roles = {1,2,3,4,5}
    local rs = '[{"op":1,"dir":{"x":0.4767630403778865,"y":-0.8790318556967283}},{"op":1,"dir":{"x":0.9672254249554538,"y":-0.2539192338515178}},{"op":2,"rid":2,"target":null},{"op":1,"dir":{"x":0.9903273833618871,"y":-0.1387504009493231}},{"op":1,"dir":{"x":-0.06345822039332256,"y":-0.9979844960040776}},{"op":2,"rid":2,"target":null},{"op":1,"dir":{"x":0.9853997712347365,"y":-0.17025654422232636}},{"op":1,"dir":{"x":-0.18465830716658618,"y":-0.9828027826549794}},{"op":1,"dir":{"x":0.39316250957186666,"y":-0.9194689995139324}}]'
    local replay = json.decode(rs)
    local t1 = os.clock()
    Logic.init(roles)
    for _, op in ipairs(replay) do
        if op.op == Const.OpType.SKILL then
            if type(op.target) ~= "table" then
                op.target = nil
            end
            Logic.use_skill(op.rid, op.target)
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
