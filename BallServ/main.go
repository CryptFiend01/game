package main

import (
	"crypto/rand"
	"encoding/json"
	"fmt"
	"math/big"
	"net/http"
	"os"
	"strconv"
	"strings"

	lua "github.com/yuin/gopher-lua"
)

var (
	luaPath string
	userVm  map[string]*lua.LState
)

type Vector struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

func logRequest(r *http.Request) {
	r.ParseForm()
	fmt.Printf("%s %s\n", r.URL.Path, r.PostForm.Encode())
}

func getInt(op map[string]interface{}, key string) int {
	v := op[key]
	val := int(v.(float64))
	return val
}

func createState(user string) *lua.LState {
	L, ok := userVm[user]
	if ok && L != nil {
		L.Close()
	}

	L = lua.NewState()

	err := L.DoFile(luaPath)
	if err != nil {
		fmt.Printf("load lua file error: %v!\n", err)
		return nil
	}

	userVm[user] = L
	return L
}

func getState(user string) *lua.LState {
	L, ok := userVm[user]
	if !ok {
		return nil
	}
	return L
}

func releaseState(user string) {
	L := getState(user)
	if L != nil {
		L.Close()
	}
	delete(userVm, user)
}

func RandomInt(n int) int {
	result, _ := rand.Int(rand.Reader, big.NewInt(int64(n)))
	return int(result.Int64())
}

func makeUser() string {
	s := []byte("0123456789abcdefABCDEF")
	user := []byte{}
	for i := 0; i < 32; i++ {
		user = append(user, s[RandomInt(len(s))])
	}
	return string(user)
}

func InitGame(w http.ResponseWriter, r *http.Request) {
	user := makeUser()
	L := createState(user)
	if L == nil {
		fmt.Fprintf(w, `{"code":1, "data":"error"}`)
		return
	}
	err := L.CallByParam(lua.P{
		Fn:      L.GetGlobal("init_game"),
		NRet:    0,
		Protect: true,
	})
	if err != nil {
		fmt.Println(err)
		fmt.Fprintf(w, `{"code":1, "data":"error"}`)
	} else {
		fmt.Fprintf(w, `{"code":0, "data":"%s"}`, user)
	}

}

func UseSkill(w http.ResponseWriter, r *http.Request) {
	user := r.PostFormValue("user")
	L := getState(user)
	if L == nil {
		fmt.Fprintf(w, `{"code":1, "data":"error"}`)
		return
	}
	rid, _ := strconv.Atoi(r.PostFormValue("rid"))
	x, _ := strconv.ParseFloat(r.PostFormValue("x"), 64)
	y, _ := strconv.ParseFloat(r.PostFormValue("y"), 64)
	err := L.CallByParam(lua.P{
		Fn:      L.GetGlobal("use_skill"),
		NRet:    1,
		Protect: true,
	}, lua.LNumber(rid), lua.LNumber(x), lua.LNumber(y))
	if err != nil {
		fmt.Println(err)
		fmt.Fprintf(w, `{"code":1}`)
	} else {
		cmds := L.ToString(-1)
		fmt.Fprintf(w, `{"code":0, "data":%s}`, cmds)
	}
}

func ShootBall(w http.ResponseWriter, r *http.Request) {
	user := r.PostFormValue("user")
	L := getState(user)
	if L == nil {
		fmt.Fprintf(w, `{"code":1, "data":"error"}`)
		return
	}
	x, _ := strconv.ParseFloat(r.PostFormValue("x"), 64)
	y, _ := strconv.ParseFloat(r.PostFormValue("y"), 64)
	err := L.CallByParam(lua.P{
		Fn:      L.GetGlobal("ballhit"),
		NRet:    1,
		Protect: true,
	}, lua.LNumber(x), lua.LNumber(y))
	if err != nil {
		fmt.Println(err)
		fmt.Fprintf(w, `{"code":1}`)
	} else {
		cmds := L.ToString(-1)
		fmt.Fprintf(w, `{"code":0, "data":%s}`, cmds)
	}
}

func GetReplay(w http.ResponseWriter, r *http.Request) {
	user := r.PostFormValue("user")
	L := getState(user)
	if L == nil {
		fmt.Fprintf(w, `{"code":1, "data":"error"}`)
		return
	}
	err := L.CallByParam(lua.P{
		Fn:      L.GetGlobal("get_replay"),
		NRet:    1,
		Protect: true,
	})

	if err != nil {
		fmt.Println(err)
		fmt.Fprintf(w, `{"code":1}`)
	} else {
		replays := L.ToString(-1)
		fmt.Fprintf(w, `{"code":0, "data":%s}`, replays)
	}
	releaseState(user)
}

func CheckTime(w http.ResponseWriter, r *http.Request) {
	replay := r.PostFormValue("replay")
	L := createState("check")
	err := L.CallByParam(lua.P{
		Fn:      L.GetGlobal("check_replay_time"),
		NRet:    1,
		Protect: true,
	}, lua.LString(replay))

	if err != nil {
		fmt.Println(err)
		fmt.Fprintf(w, `{"code":1}`)
	} else {
		cost := L.ToNumber(-1)
		fmt.Fprintf(w, `{"code":0, "data":%f}`, cost)
	}
	releaseState("check")
}

func GetLines(w http.ResponseWriter, r *http.Request) {
	user := r.PostFormValue("user")
	L := getState(user)
	if L == nil {
		fmt.Fprintf(w, `{"code":1, "data":"error"}`)
		return
	}
	err := L.CallByParam(lua.P{
		Fn:      L.GetGlobal("show_lines"),
		NRet:    1,
		Protect: true,
	})

	if err != nil {
		fmt.Println(err)
		fmt.Fprintf(w, `{"code":1}`)
	} else {
		lines := L.ToString(-1)
		fmt.Fprintf(w, `{"code":0, "data":%s}`, lines)
	}
}

func DebugRunToStep(w http.ResponseWriter, r *http.Request) {
	user := r.PostFormValue("user")
	L := getState(user)
	if L == nil {
		fmt.Fprintf(w, `{"code":1, "data":"error"}`)
		return
	}
	x, _ := strconv.ParseFloat(r.PostFormValue("x"), 64)
	y, _ := strconv.ParseFloat(r.PostFormValue("y"), 64)
	step, _ := strconv.Atoi(r.PostFormValue("step"))
	err := L.CallByParam(lua.P{
		Fn:      L.GetGlobal("debug_run_to_step"),
		NRet:    1,
		Protect: true,
	}, lua.LNumber(x), lua.LNumber(y), lua.LNumber(step))
	if err != nil {
		fmt.Println(err)
		fmt.Fprintf(w, `{"code":1}`)
	} else {
		cmds := L.ToString(-1)
		fmt.Fprintf(w, `{"code":0, "data":%s}`, cmds)
	}
}

func DebugOneStep(w http.ResponseWriter, r *http.Request) {
	user := r.PostFormValue("user")
	L := getState(user)
	if L == nil {
		fmt.Fprintf(w, `{"code":1, "data":"error"}`)
		return
	}
	err := L.CallByParam(lua.P{
		Fn:      L.GetGlobal("debug_one_ball_step"),
		NRet:    1,
		Protect: true,
	})

	if err != nil {
		fmt.Println(err)
		fmt.Fprintf(w, `{"code":1}`)
	} else {
		cmds := L.ToString(-1)
		fmt.Fprintf(w, `{"code":0, "data":%s}`, cmds)
	}
}

func GetBoard(w http.ResponseWriter, r *http.Request) {
	user := r.PostFormValue("user")
	L := getState(user)
	if L == nil {
		fmt.Fprintf(w, `{"code":1, "data":"error"}`)
		return
	}
	err := L.CallByParam(lua.P{
		Fn:      L.GetGlobal("get_board"),
		NRet:    1,
		Protect: true,
	})

	if err != nil {
		fmt.Println(err)
		fmt.Fprintf(w, `{"code":1}`)
	} else {
		board := L.ToString(-1)
		fmt.Fprintf(w, `{"code":0, "data":%s}`, board)
	}
}

func Test() {
	L := createState("test")
	repStr := `[{"op":2,"rid":2,"taget":null},{"op":1,"dir":{"x":0.9899494936611665,"y":-0.1414213562373095}},{"op":2,"rid":1},{"op":1,"dir":{"x":0.7794454151597706,"y":-0.6264701467639241}},{"op":2,"rid":2},{"op":1,"dir":{"x":0.980953712496688,"y":-0.19424163801555325}},{"op":1,"dir":{"x":0.01648597757117986,"y":-0.9998640970369537}}]`
	data := []map[string]interface{}{}
	err := json.Unmarshal([]byte(repStr), &data)
	if err != nil {
		fmt.Printf("Unmarshal replay json error: %v\n", err)
		return
	}

	L.CallByParam(lua.P{
		Fn:      L.GetGlobal("init_game"),
		NRet:    0,
		Protect: true,
	})

	for i := 0; i < len(data); i++ {
		op := data[i]
		opType := getInt(op, "op")
		if opType == 1 {
			var dir Vector
			dirv := op["dir"]
			dirm := dirv.(map[string]interface{})
			dir.X = dirm["x"].(float64)
			dir.Y = dirm["y"].(float64)
			L.CallByParam(lua.P{
				Fn:      L.GetGlobal("ballhit"),
				NRet:    1,
				Protect: true,
			}, lua.LNumber(dir.X), lua.LNumber(dir.Y))
			cmds := L.ToString(-1)
			fmt.Println("ball cmds: " + cmds)
		} else if opType == 2 {
			rid := getInt(op, "rid")
			tagv, ok := op["target"]
			var target Vector
			if !ok || tagv == nil {
				target.X = -1
				target.Y = -1
			} else {
				tagm := tagv.(map[string]interface{})
				target.X = tagm["x"].(float64)
				target.Y = tagm["y"].(float64)
			}
			L.CallByParam(lua.P{
				Fn:      L.GetGlobal("use_skill"),
				NRet:    1,
				Protect: true,
			}, lua.LNumber(rid), lua.LNumber(target.X), lua.LNumber(target.Y))
			cmds := L.ToString(-1)
			fmt.Println("skill cmds: " + cmds)
		}
	}
	releaseState("test")
}

func wrapper(f func(w http.ResponseWriter, r *http.Request)) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		logRequest(r)
		w.Header().Set("Access-Control-Allow-Origin", "*")
		f(w, r)
	}
}

func main() {
	content, err := os.ReadFile("lua.txt")
	if err != nil {
		fmt.Printf("load lua.txt error: %v\n", err)
		return
	}
	luaPath = string(content)
	luaPath = strings.Trim(luaPath, " ")
	luaPath = strings.Trim(luaPath, "\r")
	luaPath = strings.Trim(luaPath, "\n")

	userVm = make(map[string]*lua.LState)

	http.HandleFunc("/init_game", wrapper(InitGame))
	http.HandleFunc("/shoot_ball", wrapper(ShootBall))
	http.HandleFunc("/use_skill", wrapper(UseSkill))
	http.HandleFunc("/check_time", wrapper(CheckTime))
	http.HandleFunc("/get_replay", wrapper(GetReplay))
	http.HandleFunc("/get_lines", wrapper(GetLines))
	http.HandleFunc("/debug_to_step", wrapper(DebugRunToStep))
	http.HandleFunc("/debug_one_step", wrapper(DebugOneStep))
	http.HandleFunc("/get_board", wrapper(GetBoard))
	http.ListenAndServe("0.0.0.0:7777", nil)
}
