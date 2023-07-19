local Logic = require "ball_logic.logic"
local Const = require "ball_logic.const"
local Help = require "ball_logic.help"

function main()
    local base = {x = 250, y = 800}
    local interval = 15
    local roles = {
        {id = 1, count = 10, times = 50, skill = {}},
        {id = 2, count = 10, times = 50, skill = {}},
        {id = 3, count = 10, times = 50, skill = {}},
        {id = 4, count = 10, times = 50, skill = {}},
        {id = 5, count = 10, times = 50, skill = {}},
    }
    Logic.init()
    while true do
        Logic.start_round({x = 1, y = 0})
        Logic.update_round()
        local cmds = Logic.get_cmds()
        if cmds[#cmds].type == Const.CmdType.WIN then
            break
        end
    end

    local replay = Logic.get_replay()
    print(Help.table_to_string(replay))
end

main()