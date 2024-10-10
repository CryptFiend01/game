// 实现一个html5 canvas绘图引擎，支持图层添加
class CanvasEngine {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.layers = [];
  }

  addLayer(layer) {
    this.layers.push(layer);
  }

  render() {
    // layer 按照zIndex 升序排序
    this.layers.sort((a, b) => a.zIndex - b.zIndex);

    // 遍历图层，依次绘制
    this.layers.forEach(layer => {
      layer.draw();
    });
  }
}

class Layer {
    constructor(tag, width, height) {
        this.width = width;
        this.height = height;
        this.zIndex = 0;
        this.tag = tag;
        this.canvas = document.createElement(tag);
        this.context = this.canvas.getContext('2d');
        this.image = null;
        this.x = 0;
        this.y = 0;
    }

    getTag() {
        return this.tag;
    }

    setImage(image) {
        this.image = image;
        this.context.drawImage(this.image, 0, 0);
    }

    draw(context) {
        context.drawImage(this.canvas, 0, 0);
    }

}