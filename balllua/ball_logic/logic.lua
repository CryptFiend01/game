local Ball = require "ball_logic.ball"
local Heap = require "ball_logic.heap"
local Line = require "ball_logic.line"
local Const = require "ball_logic.const"
local StageCfg = require "ball_logic.data.stage"
local MonsterCfg = require "ball_logic.data.monster"
local ObjectCfg = require "ball_logic.data.object"
local RoleCfg = require "ball_logic.data.rolecfg"
local Help = require "ball_logic.help"
local Basic = require "ball_logic.basic"
local Collide = require "ball_logic.collide"
local Role = require "ball_logic.role"
local Skill = require "ball_logic.skill"
local Fix = require "ball_logic.fixed"

local GameRect = Const.GameRect

local frames = {
    Line:new({x1 = GameRect.left, y1 = GameRect.top, x2 = GameRect.right, y2 = GameRect.top, solid = true}),
    Line:new({x1 = GameRect.right, y1 = GameRect.top, x2 = GameRect.right, y2 = GameRect.bottom, solid = true}),
    Line:new({x1 = GameRect.left, y1 = GameRect.bottom, x2 = GameRect.left, y2 = GameRect.top, solid = true}),
    Line:new({x1 = GameRect.right, y1 = GameRect.bottom, x2 = GameRect.left, y2 = GameRect.bottom, solid = true})
}

local data = {}

local function init_data()
    data.lines = {}
    data.balls = Heap:new(Ball.less)
    data.rect = {
        left = GameRect.left,
        top = GameRect.top + Const.Board.SIDE,
        right = GameRect.right,
        bottom = GameRect.bottom
    }
    data.base = Basic.copy_point(Const.Base)
    data.base_line = Line:new({x1 = Fix.zero, y1 = Const.Base.y, x2 = Const.Board.WIDTH * Const.Board.SIDE, y2 = Const.Base.y})
    data.next_base = nil
    data.begin_dir = {x = Fix.zero, y = Fix.zero}
    data.enemys = {}
    data.enemy_count = 0
    data.enemy_visible_count = 0
    data.start_line = 0
    data.pushed = 0
    data.interval = Const.INTERVAL

    data.round = 0
    data.win = false

    data.cmds = {}
    data.ops = {}

    data.take_grids = {}
    data.skills = {}
    data.callid = 1001

    data.roles = {}
    data.skill_deads = {deads = {}, all = false}

    if not ObjectCfg._inited then
        for _, obj in pairs(ObjectCfg) do
            obj.size = obj.anchor.x * 2 / Const.Board.NSIDE;
        end
        ObjectCfg._inited = true
    end
end

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

local function set_take_grid(grid, eid)
    --Help.err_print("grid "..grid.." set enemy "..eid)
    if grid < 0 or grid >= #data.take_grids then
        return
    end

    if data.take_grids[grid + 1] == 0 or eid == 0 then
        data.take_grids[grid + 1] = eid
    else
        Help.err_print("grid " .. grid .. " has taked by ".. data.take_grids[grid + 1])
    end
end

local function reset_take_grids()
    data.take_grids = {}

    for i = 1, Const.Board.NWIDTH * Const.Board.NHEIGHT do
        table.insert(data.take_grids, 0)
    end
    
    for eid, enemy in pairs(data.enemys) do
        if enemy.visible and enemy.hp > Fix.zero then
            if enemy.obj.size == 1 then
                set_take_grid(enemy.grid, eid)
            else
                for i = 0, enemy.obj.size - 1 do
                    for j = 0, enemy.obj.size - 1 do
                        local grid = enemy.grid + j + i * Const.Board.NWIDTH
                        set_take_grid(grid, eid)
                    end
                end
            end
        end
    end
end

local function get_next_base(ball)
    if not data.next_base then
        data.next_base = Basic.ray_line_intersection(ball, ball.dir, data.base_line)
    end
end

local function check_next_collide(start, dir, ignores, hitid)
    return Collide.check_next_collide(start, dir, data.lines, ignores, hitid)
end

local function aim(dir, times)
    return Collide.aim(data.base, dir, data.lines, times)
end

local function push_data_map(push_line)
    data.lines = {}
    for _, l in ipairs(frames) do
        table.insert(data.lines, l)
    end
    data.enemy_visible_count = 0
    data.start_line = data.start_line - push_line
    local add_views = {}
    local yoffset = Fix.tofix(push_line) * Const.Board.SIDE
    local move_enemy = function(enemy)
        if enemy.hp <= Fix.zero then
           return 
        end

        local visible = true
        for _, line in ipairs(enemy.lines) do
            line:move(yoffset)
        end

        enemy.rect.top = enemy.rect.top + yoffset
        enemy.rect.bottom = enemy.rect.bottom + yoffset
        enemy.grid = enemy.grid + push_line * Const.Board.NWIDTH
        if enemy.rect.top < data.rect.top or enemy.rect.bottom > data.rect.bottom then
            visible = false
        end

        if not enemy.visible and visible then
            table.insert(add_views, {id = enemy.id, cid = enemy.cid, grid = enemy.grid, hp = enemy.hp})
        elseif enemy.visible and enemy.solid and not visible then
            data.enemy_count = data.enemy_count - 1
        end
        enemy.visible = visible

        if visible then
            for _, l in ipairs(enemy.lines) do
                table.insert(data.lines, l)
            end
            if enemy.solid then
                data.enemy_visible_count = data.enemy_visible_count + 1
            end
        end
    end
    for eid, enemy in pairs(data.enemys) do
        move_enemy(enemy)
    end

    Help.hiden_in_line(data.lines, #frames+1)
    return add_views
end

local function push_map(push_line)
    if push_line <= 0 then
        return
    end

    local add_enemies = push_data_map(push_line)

    reset_take_grids()

    add_cmd({type = Const.CmdType.PUSH, line =  push_line, add_enemies = add_enemies})
end

local function remove_dead(lines, id)
    local temp = {}
    for _, l in ipairs(lines) do
        if l.mid ~= id then
            l:un_hide(id)
            table.insert(temp, l)
        end
    end
    return temp
end

local function get_enemies()
    local enemys = {}
    for _, m in ipairs(StageCfg.monsters) do
        local mc = MonsterCfg[m.cid]
        assert(mc ~= nil, "cid=="..m.cid)
        local obj = ObjectCfg[mc.type]
        assert(obj ~= nil, "mc.type=="..mc.type)
        if not m.point then
            m.point = Help.get_point_by_grid(obj, m.grid)
        end

        local lines = Line.make_lines(m.id, m.point, obj, mc.solid)
        local enemy = {
            id = m.id,
            point = m.point,
            grid = m.grid,
            cid = m.cid,
            hp = Fix.tofix(mc.hp),
            visible = true,
            solid = mc.solid,
            evt = mc.evt,
            obj = obj,
            lines = lines,
            rect = Help.make_rect(lines)
        }
        enemys[m.id] = enemy
    end
    return enemys
end

local function add_enemy(id, mc, obj, grid)
    local point = Help.get_point_by_grid(obj, grid)
    local lines = Line.make_lines(id, point, obj, mc.solid)
    local enemy = {
        id = id,
        point = point,
        grid = grid,
        cid = mc.id,
        hp = mc.hp,
        visible = true,
        solid = mc.solid,
        evt = mc.evt,
        obj = obj,
        lines = lines,
        rect = Help.make_rect(lines)
    }

    for _, l in ipairs(lines) do
        table.insert(data.lines, l)
    end

    data.enemys[id] = enemy
    data.enemy_count = data.enemy_count + 1
    data.enemy_visible_count = data.enemy_visible_count + 1
    Help.hiden_part_lines(lines, data.lines, #frames + 1)
    return enemy
end

local function get_enemy_info(enemy)
    return {
        id = enemy.id,
        grid = enemy.grid,
        hp = enemy.hp,
        cid = enemy.cid
    }
end

local function add_enemies(cid, count, grid)
    local evts = {}
    local mc = MonsterCfg[cid]
    assert(mc ~= nil, "cid=="..cid)
    local obj = ObjectCfg[mc.type]
    assert(obj ~= nil, "mc.type=="..mc.type)
    local free_grids = {}
    local g = grid
    for i = 1, count do
        while data.take_grids[g+1] ~= 0 do
            g = g + 1
        end
        
        table.insert(free_grids, g)
        g = g + 1
    end

    local news = {}
    for i = 1, count do
        local eid = data.callid + i
        local e = add_enemy(eid, mc, obj, free_grids[i])
        table.insert(evts, {
            type = Const.EvtType.CALL_ENEMY,
            id = eid,
            cid = cid,
            grid = free_grids[i]
        })
        table.insert(news, e)
    end
    data.callid = data.callid + count

    return {evts = evts, enemies = news}
end

local function sub_enemy_hp(enemy, sub)
    enemy.hp = enemy.hp - sub
    if enemy.hp < Fix.zero then
        enemy.hp = Fix.zero
    end
end

local function on_enemy_dead(id)
    local ret = {deads = {id}}

    -- 移除碰撞线
    data.lines = remove_dead(data.lines, id)
    
    local enemy = data.enemys[id]
    if not enemy then
        print("enemy "..id.." not exist.")
        return
    end
    -- 清空格子占据
    for i = 0, enemy.obj.size - 1 do
        for j = 0, enemy.obj.size - 1 do
            local grid = enemy.grid + j + i * Const.Board.WIDTH
            set_take_grid(grid, 0)
        end
    end

    -- 处理死亡事件
    if enemy.evt and enemy.evt.type == Const.StageEvent.DEAD_CALL then
        ret.deads = nil
        local r = add_enemies(enemy.evt.cid, enemy.evt.count, enemy.grid)
        ret.evts = r.evts
        ret.enemies = r.enemies
    else
    end
    return ret
end

local function check_collide(deads)
    local temp = {}
    if deads then
        data.balls:foreach(function (ball)
            if ball:is_event() then
                table.insert(temp, ball)
                return
            end
            if Help.contain(deads, ball:next_collide_id()) then
                --ball:recover_state()
                ball:calc_collide(data.lines)
            end
            if ball:next_collide_point() then
                table.insert(temp, ball)
            else
                get_next_base(ball)
            end
        end)
    else
        data.balls:foreach(function (ball)
            if ball:is_event() then
                table.insert(temp, ball)
                return
            end
            --ball:recover_state()
            ball:calc_collide(data.lines)
            if ball:next_collide_point() then
                table.insert(temp, ball)
            else
                get_next_base(ball)
            end
        end)
    end
    
    data.balls:clear()
    for _, ball in ipairs(temp) do
        data.balls:add(ball)
    end
end

local function effect_skill(skill)
    local effects = {}
    local effect_enemy = function(enemy)
        if enemy.hp <= 0 then
            return
        end
        sub_enemy_hp(enemy, skill.cfg.dmg)
        local cmd = {dmg={id = enemy.id, dmg = skill.cfg.dmg, hp = enemy.hp}}
        table.insert(effects, cmd)
        if enemy.hp <= 0 then
            local ret = on_enemy_dead(enemy.id)
            cmd.evts = ret.evts
            if not data.skill_deads.all then
                if ret.deads then
                    for _, eid in ipairs(ret.deads) do
                        table.insert(data.skill_deads.deads, eid)
                    end
                else
                    data.skill_deads.all = true
                end
            end
            if enemy.solid then
                data.enemy_count = data.enemy_count - 1
                data.enemy_visible_count = data.enemy_visible_count - 1                
            end
        end
    end
    if skill.cfg.type == Const.SkillType.ROUND_DAMAGE then
        skill.round = skill.round + 1
        local enemies = Skill.get_skill_enemies(data, skill.target, skill.cfg)
        for _, enemy in pairs(enemies) do
            effect_enemy(enemy)
        end
    elseif skill.cfg.type == Const.SkillType.RANGE_DAMAGE then
        for _, enemy in pairs(skill.enemies) do
            effect_enemy(enemy)
        end
    end

    if data.enemy_count <= 0 then
        add_cmd({type = Const.CmdType.WIN})
        data.win = true
    elseif data.enemy_visible_count <= 0 then
        data.balls:clear()
    end
    return effects
end

local function check_skill_valid()
    if #data.skills == 0 or data.win then
        return
    end

    local temp = {}
    for _, skill in ipairs(data.skills) do
        if skill.round >= skill.cfg.round then
            add_cmd({type = Const.CmdType.REMOVE_SKILL, cid = skill.cid})
        else
            table.insert(temp, skill)
        end
    end
    data.skills = temp
end

local function start_skill_round()
    data.cmds = {}
end

local function use_skill(rid, target, is_op)
    local role = data.roles[rid]
    if is_op then
        local op = {op = Const.OpType.SKILL, rid = role.id}
        if target then
            op.target = Basic.copy_point(target)
        end
        table.insert(data.ops, op)
    end
    local cfg = role.cfg.skill
    local cmd = {
        type = Const.CmdType.ROLE_SKILL,
        cid = role.id,
        target = target,
        cd = cfg.cd,
        range = {}
    }
    add_cmd(cmd)
    if cfg.type == Const.SkillType.BALL_ADD then
        --data.ball_dmg = cfg.dmg
        role:change_attack(cfg.dmg, cfg.times)
    elseif cfg.type == Const.SkillType.ROUND_DAMAGE then
        -- 回合技能每次生效都根据范围及时处理，不能预先获得受击敌人
        local range = Skill.get_skill_range(target, cfg.width, cfg.height)
        local skill = {cid = role.id, cfg = cfg, target = target, round = 0}
        table.insert(data.skills, skill)
        table.insert(cmd.range, range)
        cmd.effects = effect_skill(skill)
    elseif cfg.type == Const.SkillType.BALL_THROUGH then
        Line.through = true
        --data.ball_dmg = data.ball_dmg * 3
        for _, role in pairs(data.roles) do
            role:change_attack(role:get_attack() * Fix.tofix(3), -1)
        end
    elseif cfg.type == Const.SkillType.RANGE_DAMAGE then
        local enemies = Skill.get_skill_enemies(data, target, cfg)
        local skill = {cid = role.id, cfg = cfg, enemies = enemies}
        cmd.effects = effect_skill(skill)
    end
    check_skill_valid()
end

local function init(roles)
    init_data()
    for i = 1, #roles do
        local role = Role:new(RoleCfg[roles[i]])
        data.roles[role.id] = role
    end

    local max_line = StageCfg.max_line
    if max_line < Const.Board.NHEIGHT then
        max_line = Const.Board.NHEIGHT
    end

    for _, line in ipairs(frames) do
        table.insert(data.lines, line)
    end

    data.start_line = max_line - Const.Board.NHEIGHT
    local yoffset = Fix.tofix(data.start_line) * Const.Board.SIDE

    data.enemys = get_enemies()
    for eid, enemy in pairs(data.enemys) do
        if enemy.solid then
            data.enemy_count = data.enemy_count + 1
        end

        for _, line in ipairs(enemy.lines) do
            line.y1 = line.y1 - yoffset
            line.y2 = line.y2 - yoffset
        end

        enemy.rect.top = enemy.rect.top - yoffset
        enemy.rect.bottom = enemy.rect.bottom - yoffset
        enemy.grid = enemy.grid - data.start_line * Const.Board.NWIDTH

        if enemy.rect.top < data.rect.top or enemy.rect.bottom > data.rect.bottom then
            enemy.visible = false
        end
    end

    for eid, enemy in pairs(data.enemys) do
        if enemy.visible then
            for _, l in ipairs(enemy.lines) do
                table.insert(data.lines, l)
            end
            if enemy.solid then
                data.enemy_visible_count = data.enemy_visible_count + 1
            end
        end
    end

    Help.hiden_in_line(data.lines, #frames + 1)
    reset_take_grids()
end

local function start_round(dir)
    table.insert(data.ops, {op = Const.OpType.BALL, dir = Basic.point_to_number(dir)})
    data.cmds = {}
    --Basic.assign_point(dir, data.begin_dir)
    print(Help.table_to_json(dir))
    data.begin_dir = {
        x = Fix.tofix(dir.x),
        y = Fix.tofix(dir.y)
    }
    for _, role in pairs(data.roles) do
        role:reset()
    end

    local collide = check_next_collide(data.base, data.begin_dir, {}, 0)
    local dist = Basic.distance(collide.point, data.base)
    local n = 0
    local fn = Fix.zero
    for _, role in pairs(data.roles) do
        for i = 1, role:ball_count() do
            local ball = Ball:new({
                id = n + 1,
                role = role,
                x = data.base.x,
                y = data.base.y,
                collide = collide,
                dist = dist + fn * data.interval,
                dir = Basic.copy_point(data.begin_dir),
                interval = fn * data.interval
            })
            data.balls:add(ball)
            add_cmd({
                type = Const.CmdType.CREATE_BALL,
                bid = n + 1,
                cid = role.id,
                dir = Basic.point_to_number(data.begin_dir)
            })
            n = n + 1
            fn = fn + Fix.one
        end
    end
    data.next_base = nil
end

local function ball_event(evt)
    data.skill_deads.deads = {}
    data.skill_deads.all = false
    if evt.type == Const.BallEvent.EVT_SKILL then
        use_skill(evt.rid, Help.grid_to_xy(evt.grid), false)
    end

    if data.skill_deads.all then
        check_collide(nil)
    elseif #data.skill_deads.deads > 0 then
        check_collide(data.skill_deads.deads)
    end
end

local function ball_step(step)
    local ball = data.balls:pop()
    if ball:is_event() then
        -- 虚拟事件球
        ball_event(ball.evt)
        return
    end
    local line = ball:next_collide_line()
    -- 距离最短，移动后发生碰撞才会创建命令
    local cmd = {
        type = Const.CmdType.COLLIDE,
        bid = ball.id,
        target = Basic.copy_point(ball:next_collide_point())
    }

    -- 先将剩余所有球的passed加上第一个球的dist
    local d = ball:rest_dist()
    data.balls:foreach(function (b)
        b:move(d)
    end)
    ball:set_collide_finish()

    -- 更新球的状态，最快的球移动到碰撞点，计算弹射后的方向和下次碰撞点
    if ball:update(data) then
        cmd.reflect = Basic.copy_point(ball.dir)
        if ball:next_collide_point() then
            data.balls:add(ball)
        else
            -- 没有继续弹射了，计算落点，设置下次发射点
            get_next_base(ball)
        end
    end

    local role = ball.role
    cmd.anger = role:get_anger()

    -- 球打在敌方单位上
    if line.mid > 0 then
        local enemy = data.enemys[line.mid]
        if enemy.hp > 0 then
            if enemy.solid then
                sub_enemy_hp(enemy, role:get_attack())
                cmd.dmg = {id = enemy.id, dmg = Fix.tonumber(role:get_attack()), hp = Fix.tonumber(enemy.hp)}
            else
                -- 非实物一般只计算打击次数，hp表示最大次数
                sub_enemy_hp(enemy, 1)
                cmd.dmg = {id = enemy.id, dmg = 1, hp = Fix.tonumber(enemy.hp)}
            end

            if enemy.hp <= 0 then
                --print('enemy '..enemy.id..' dead.')
                local ret = on_enemy_dead(enemy.id)
                cmd.evts = ret.evts
                --local count1 = data.balls:count()
                check_collide(ret.deads)
                -- local count2 = data.balls:count()
                -- if count2 < count1 then
                --     print("enemy "..enemy.id.." reduce "..(count2-count1))
                -- end
                if enemy.solid then
                    data.enemy_count = data.enemy_count - 1
                    data.enemy_visible_count = data.enemy_visible_count - 1
                end

                if data.enemy_count <= 0 then
                    add_cmd(cmd)
                    data.win = true
                    add_cmd({type = Const.CmdType.WIN})
                    return
                elseif data.enemy_visible_count <= 0 then
                    add_cmd(cmd)
                    data.balls:clear()
                    return
                end
            end

            role:recover_attack()
        else
            Help.err_print("collide dead enemy! id=" .. cmd.bid .. " mid=" .. line.mid)
        end
    end

    add_cmd(cmd)

    -- 准备释放技能
    if role:is_anger_full() then
        local skill_cfg = role:get_skill()
        local grid = Skill.select_skill_grid(data, skill_cfg)
        if grid >= 0 or not skill_cfg.shape then
            local vball = Ball:new({
                id = -1,
                dist = skill_cfg.before,
                evt = {
                    type = Const.BallEvent.EVT_SKILL, 
                    rid = ball:role_id(), 
                    grid = grid
                }
            })
            data.balls:add(vball)
            role:clear_anger()
            local grids
            if grid >= 0 and skill_cfg.shape then
                grids = Skill.get_skill_grids(skill_cfg, grid)
            end
            add_cmd({type = Const.CmdType.SKILL_READY, cid = ball:role_id(), grid = grid, grids = grids})
        end
    end
end

local function is_ball_round_finish()
    return data.balls:empty() or data.win
end

local function ball_round()
    local step = 1
    while not is_ball_round_finish() do
        step = step + 1
        ball_step(step)
    end
end

local function enemy_round()
    if data.win then
        return
    end
end

local function push_round()
    if data.win then
        return
    end

    local push_line = 0
    if #data.lines <= #frames and data.start_line > 0 then
        push_line = math.min(data.start_line, 10)
    elseif data.pushed + 1 < #StageCfg.push then
        local next_push = StageCfg.push[data.pushed + 1]
        if data.round >= next_push.round then
            push_line = math.min(data.start_line, next_push.line)
            data.pushed = data.pushed + 1
        end
    end
    push_map(push_line)
end

local function skill_round()
    if data.win then
        return
    end
    for _, skill in ipairs(data.skills) do
        local cmd = {type = Const.CmdType.SKILL_EFFECT, cid = skill.cid}
        add_cmd(cmd)
        cmd.effects = effect_skill(skill)
        if data.win then
            break
        end
    end

    check_skill_valid()
end

local function end_round()
    if data.win then
        return
    end
    Line.through = false
    if data.next_base then
        Basic.assign_point(data.next_base, data.base)
    end

    add_cmd({type = Const.CmdType.ROUND_END, base = Basic.point_to_number(data.base)})
end

local function rest_round()
    enemy_round()
    data.round = data.round + 1
    skill_round()
    push_round()
    end_round()
end

local function update_round()
    ball_round()
    rest_round()
end

local function get_base()
    return data.base
end

local function get_board()
    local board = {
        balls = {},
        lines = data.lines,
        enemies = {},
        enemy_count = data.enemy_count,
        enemy_visible_count = data.enemy_visible_count,
    }

    data.balls:foreach(function (b)
        table.insert(board.balls, b:info())
    end)

    for _, enemy in pairs(data.enemys) do
        if enemy.visible and enemy.hp > 0 then
            table.insert(board.enemies, get_enemy_info(enemy))
        end
    end
    return board
end

return {
    data = data,
    get_cmds = get_cmds,
    get_replay = get_replay,
    init = init,
    use_skill = use_skill,
    start_round = start_round,
    update_round = update_round,
    ball_round = ball_round,
    rest_round = rest_round,
    ball_step = ball_step,
    is_ball_round_finish = is_ball_round_finish,
    get_base = get_base,
    get_board = get_board,
    check_next_collide = check_next_collide,
    aim = aim,
    start_skill_round = start_skill_round
}