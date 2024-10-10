package ws

import (
	"log/slog"
	"net/http"

	"github.com/gorilla/websocket"
)

type MsgFunc func(msg []byte)

var (
	upgrader = websocket.Upgrader{CheckOrigin: func(r *http.Request) bool {
		return true
	}}
	OnClientMsg MsgFunc
)

func Session(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		slog.Error("Upgrade failed:", err)
		return
	}

	for {
		mt, data, err := ws.ReadMessage()
		if err != nil {
			slog.Error("ReadMessage failed:", err)
			return
		}

		if mt == websocket.TextMessage {
			if OnClientMsg != nil {
				OnClientMsg(data)
			}
		} else {
			slog.Info("ws recv", "data", string(data))
			return
		}
	}
}

func Init(port string) {
	http.HandleFunc("/ws", Session)
	err := http.ListenAndServe("0.0.0.0:"+port, nil)
	if err != nil {
		slog.Error("ListenAndServe failed:", err)
	}
}
