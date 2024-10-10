// 实现一个websocketclient
class WebSocketClient {
  constructor(url) {
    this.url = url;
    this.ws = null;
  }

  connect() {
    this.ws = new WebSocket(this.url);
    this.ws.onopen = () => {
      console.log('WebSocket连接已打开！');
    };

    this.ws.onmessage = (event) => {
      console.log('收到服务器消息：', event.data);
    }

    this.ws.onclose = () => {
      console.log('WebSocket连接已关闭！');
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket连接发生错误：', error);
    };
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    } else {
      console.error('WebSocket连接未建立或已关闭，无法发送消息！');
    }
  }
}