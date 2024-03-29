local Const = require "ball_logic.const"
local Help = require "ball_logic.help"

-- 本脚本计算主要以格子为单位，所以不用fixednumber

local function get_skill_range(point, width, height)
    -- 此处point不是fixed
    return {
        x = (point.x - math.floor(width / 2)) * Const.Board.NSIDE + Const.Offset.nx,
        y = (point.y - math.floor(height / 2)) * Const.Board.NSIDE + Const.Offset.ny,
        width = width * Const.Board.NSIDE,
        height = height * Const.Board.NSIDE
    }
end

local function in_game_board(p)
    return p.x >= 0 and p.x < Const.Board.NWIDTH and p.y >= 0 and p.y < Const.Board.NHEIGHT
end

local function get_enemy(data, p)
    if not in_game_board(p) then
        return nil
    end
    local grid = p.x + p.y * Const.Board.NWIDTH
    local eid = data.take_grids[grid+1]
    if eid ~= 0 then
        return data.enemys[eid]
    else
        return nil
    end
end 

local function add_enemy(enemies, data, p)
    local enemy = get_enemy(data, p)
    if enemy then
        enemies[enemy.id] = enemy
    end
end

local function get_cross_enemies(data, point, horizon, vertical)
    local enemies = {}
    for i = -horizon, horizon do
        local p = {x = point.x + i, y = point.y}
        if in_game_board(p) then
            add_enemy(enemies, data, p)
        end
    end

    for i = -vertical, vertical do
        local p = {x = point.x, y = point.y + i}
        if in_game_board(p) then
            add_enemy(enemies, data, p)
        end
    end
    return enemies
end

local function get_rect_enemies(data, point, width, height)
    local enemies = {}
    local x = math.floor(width / 2)
    local y = math.floor(height / 2)
    for h = -y, y do
        for w = -x, x do
            local p = {x = point.x + w, y = point.y + h}
            if in_game_board(p) then
                add_enemy(enemies, data, p)
            end
        end 
    end
    return enemies
end

local function get_skill_enemies(data, point, skill)
    -- 根据不同形状筛选敌人
    if skill.shape == "cross" then
        return get_cross_enemies(data, point, skill.horizon, skill.vertical)
    elseif skill.shape == "rect" then
        return get_rect_enemies(data, point, skill.width, skill.height)
    end
end

local function select_grid(data, is_tag, f)
    local grid = -1
    local max_count = 0

    for i, eid in ipairs(data.take_grids) do
        if eid ~= 0 or not is_tag then
            local count = f(i)
            if count > max_count then
                max_count = count
                grid = i
            end
        end
    end
    return grid
end

local function select_cross_grid(data, horizon, vertical)
    local get_enemy_count = function(g)
        local count = 1
        local point = Help.grid_to_xy(g)
        for i = -horizon, horizon do
            local p = {x = point.x + i, y = point.y}
            if in_game_board(p) and get_enemy(data, p) then
                count = count + 1
            end
        end

        for i = -vertical, -vertical do
            local p = {x = point.x, y = point.y + i}
            if in_game_board(p) and get_enemy(data, p) then
                count = count + 1
            end
        end

        return count
    end 
    return select_grid(data, true, get_enemy_count)
end

local function select_rect_grid(data, width, height)
    local get_enemy_count = function(g)
        local count = 0
        local point = Help.grid_to_xy(g)
        local x = math.floor(width / 2)
        local y = math.floor(height / 2)
        for h = -y, y do
            for w = -x, x do
                local p = {x = point.x + w, y = point.y + h}
                if in_game_board(p) and get_enemy(data, p) then
                    count = count + 1
                end
            end
        end
        return count
    end
    return select_grid(data, false, get_enemy_count)
end

local function select_skill_grid(data, skill)
    if not skill.shape then
        return -1
    end
    if skill.shape == "cross" then
        return select_cross_grid(data, skill.horizon, skill.vertical)
    elseif skill.shape == "rect" then
        return select_rect_grid(data, skill.width, skill.height)
    else
        return -1
    end
end

local function get_cross_grids(point, horizon, vertical)
    local grids = {}
    table.insert(grids, Help.xy_to_grid(point))
    for i = -horizon, horizon do
        local p = {x = point.x + i, y = point.y}
        if i ~= 0 and in_game_board(p) then
            local g = Help.xy_to_grid(p)
            table.insert(grids, g)            
        end
    end

    for i = -vertical, vertical do
        local p = {x = point.x, y = point.y + i}
        if i ~= 0 and in_game_board(p) then
            local g = Help.xy_to_grid(p)
            table.insert(grids, g)            
        end
    end
    return grids
end

local function get_rect_grids(point, width, height)
    local grids = {}
    local x = math.floor(width / 2)
    local y = math.floor(height / 2)
    for h = -y, y do
        for w = -x, x do
            local p = {x = point.x + w, y = point.y + h}
            if in_game_board(p) then
                local g = Help.xy_to_grid(p)
                table.insert(grids, g)                
            end
        end 
    end
    return grids
end

local function get_skill_grids(skill, grid)
    local point = Help.grid_to_xy(grid)
    if skill.shape == "cross" then
        return get_cross_grids(point, skill.horizon, skill.vertical)
    elseif skill.shape == "rect" then
        return get_rect_grids(point, skill.width, skill.height)
    else
        return {}
    end
end

return {
    get_skill_range = get_skill_range,
    select_skill_grid = select_skill_grid,
    get_skill_enemies = get_skill_enemies,
    get_skill_grids = get_skill_grids,
}