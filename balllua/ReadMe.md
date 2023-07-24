命令说明：

##### 创建球 type = 1

    示例：{type: 1, dir: {x:1, y:2}, id: 1, cid: 2}

    id:球的id，

    cid：玩家id

##### 弹射  type = 2

    示例：{type: 2, reflect: {x: 3, y:4}, target:{x: 1, y: 1}, dmg: {id:1, dmg:10, hp:180}, evts: [{type:1, id:1001, cid:9, grid:3},...]}

    reflect:弹射后的方向向量

    target：撞击点

    dmg：伤害，其中dmg为扣血值，hp为最终血量

    evts：撞击产生的事件

##### 角色使用技能 type=3

    示例：{type:3, cid:1, target: {x:1, y:1}, cd:3, range:{x:100,y:100, width:200, height:200}}

    cid：角色id

    target：格子xy

    cd：冷却回合数

    range：像素范围

##### 敌方使用技能（暂缺）type = 4

##### 移除持续技能 type=5

    示例：{type:5, cid: 1}

    cid: 技能id

##### 技能效果（被动技能，或者持续性技能触发）type=6

    示例：{type:6, cid: 1, effects:[{dmg:{id:1, dmg:10, hp:100}, evts:{type:1, id:1001, cid:9, grid:3}},...]}

    cid: 技能id

    effects：技能效果，同弹射伤害结构

##### 敌方移动（暂缺）type = 7

##### 地图推进 type = 11

    示例：{type: 11, line: 5, moved:[{id:1, x:30, y:50},...]}

    line：推进行数

    moved：推进的同时有些怪物会同时移动

##### 回合结束 type = 12

    示例：{type: 12, base:{x:1, y:2}}

    base: 发射点位置

##### 胜利 type = 13

   示例：{type:13}
