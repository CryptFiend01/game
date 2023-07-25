local Const = require "ball_logic.const"
local err_print = print

local function contain(t, v)
    for _, v1 in ipairs(t) do
        if v1 == v then
            return true
        end
    end
    return false
end

local function table_to_string(t)
    local s = '{'
    for k, v in pairs(t) do
        if type(v) == "table" then
            s = s .. k .. '=' .. table_to_string(v) .. ','
        else
            s = s .. k .. '=' .. tostring(v) .. ','
        end
    end
    s = s .. '}'
    return s
end

local function table_to_json(t)
    local is_kv = true
    local s = ''
    local sep = ''
    for k, v in pairs(t) do
        s = s .. sep
        if sep == '' then
            sep = ','
        end
        if type(k) ~= "string" then
            is_kv = false
        else
            s = s .. '"' .. k .. '":'
        end

        if type(v) == "table" then
            s = s .. table_to_json(v)
        elseif type(v) == "string" then
            s = s .. '"' .. v .. '"'
        else
            s = s .. tostring(v)
        end
    end

    if is_kv then
        return '{' .. s .. '}'
    else
        return '[' .. s .. ']'
    end
end

local function set_logger(logger)
    err_print = logger
end

local function logerr(s)
    err_print(s)
end

local function get_point_by_grid(obj, grid)
    local x = math.floor(grid % Const.Board.WIDTH)
    local y = math.floor(grid / Const.Board.WIDTH)
    return {
        x = x * Const.Board.SIDE + obj.anchor.x + Const.Offset.x,
        y = y * Const.Board.SIDE + obj.anchor.y + Const.Offset.y
    }
end

local function make_rect(lines)
    local rect = {left = Const.MAX_NUM, right = Const.MIN_NUM, top = Const.MAX_NUM, bottom = Const.MIN_NUM}
    for _, l in ipairs(lines) do
        local rl = {
            left = math.min(l.x1, l.x2),
            top = math.min(l.y1, l.y2),
            right = math.max(l.x1, l.x2),
            bottom = math.max(l.y1, l.y2)
        }
        
        rect.left = math.min(rect.left, rl.left)
        rect.right = math.max(rect.right, rl.right)
        rect.top = math.min(rect.top, rl.top)
        rect.bottom = math.max(rect.bottom, rl.bottom)
    end
    return rect
end

local function hide_one_line(l1, lines, start)
    for i = start, #lines do
        if l1 ~= lines[i] and lines[i].solid then
            l1:hide_each_other(lines[i])
        end
    end
end

local function hiden_part_lines(parts, lines, start)
    for _, l1 in ipairs(parts) do
        if l1.solid then
            hide_one_line(l1, lines, start)
        end
    end
end

local function hiden_in_line(lines, start)
    for i = start, #lines do
        local l1 = lines[i]
        if l1.solid then
            hide_one_line(l1, lines, start)
        end
    end
end

return {
    contain = contain,
    table_to_string = table_to_string,
    table_to_json = table_to_json,
    set_logger = set_logger,
    err_print = err_print,
    get_point_by_grid = get_point_by_grid,
    make_rect = make_rect,
    hiden_in_line = hiden_in_line,
    hiden_part_lines = hiden_part_lines,
}