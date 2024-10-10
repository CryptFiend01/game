package game

type Pos struct {
	X int `json:"x"`
	Y int `json:"y"`
}

type Player struct {
	PlayerId int
	Name     string
	ConfigId int
	Pos      Pos
}

type Enemy struct {
	EnemyId  int
	ConfigId int
	Pos      Pos
}

type Bullet struct {
	BulletId int
	ConfigId int
	Pos      Pos
}

var (
	enemys  = make(map[int]*Enemy)
	bullets = make(map[int]*Bullet)
	players = make(map[int]*Player)
)

func Init() {
}
