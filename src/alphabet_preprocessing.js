

export function preprocessing(canvas, input_size) {
  // input_size x input_sizeまでダウンサイジングする
  const tmpCanvas = canvas.getContext("2d").downScaleTo(input_size);

  // 重心の座標が中心からどれだけずれているか
  const center = tmpCanvas.ctx.getCenter(),
        center_of_g = tmpCanvas.ctx.getCenterOfGravity(),
        x = center.x - center_of_g.x,
        y = center.y - center_of_g.y;

  // input用のサイズでcanvasを作り、必要な領域だけ転写する
  const tmpCanvas2 = new Canvas(input_size, input_size);
  tmpCanvas2.ctx.fillStyle = "white";
  tmpCanvas2.ctx.fillRect(0, 0, input_size, input_size);
  tmpCanvas2.ctx.drawImage(tmpCanvas, 0, 0, tmpCanvas.width, tmpCanvas.width, x, y, input_size, input_size);

  // グレイスケールに変換する
  tmpCanvas2.ctx.toGrayScale();

  return tmpCanvas2;
}



function Canvas(width, height) {
  const canvas = document.createElement("canvas");
  canvas.ctx = canvas.getContext("2d");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}


// データを2分の1ずつ縮小する
CanvasRenderingContext2D.prototype.downScaleTo = function(size) {
  let tmpCanvas, tmpSize = size,
      half = x => Math.ceil(x / 2);

  while (tmpSize * 2 < this.canvas.width) tmpSize *= 2;
  tmpCanvas = new Canvas(tmpSize, tmpSize);
  tmpCanvas.ctx.fillStyle = "white";
  tmpCanvas.ctx.fillRect(0, 0, tmpCanvas.width, tmpCanvas.height);
  tmpCanvas.ctx.drawImage(this.canvas, 0, 0, tmpSize, tmpSize);

  while (half(tmpSize) > size) {
    tmpCanvas.ctx.drawImage(tmpCanvas, 0, 0, tmpSize, tmpSize, 0, 0, half(tmpSize), half(tmpSize));
    tmpSize = half(tmpSize);
  }

  const canvas = new Canvas(size, size);
  canvas.ctx.drawImage(tmpCanvas, 0, 0, tmpSize, tmpSize, 0, 0, size, size);
  return canvas;
};


// 中心の座標を取得する
CanvasRenderingContext2D.prototype.getCenter = function() {
  return {
    x: this.canvas.width / 2,
    y: this.canvas.height / 2
  };
};


// 重心の座標を取得する
CanvasRenderingContext2D.prototype.getCenterOfGravity = function() {
  const width = this.canvas.width,
        height = this.canvas.height,
        data = this.getImageData(0, 0, width, height).data;
  let area = 0, xk = 0, yk = 0;

  for (let x = 0; x < width; x++) {
    let k = 0;
    for (let y = 0; y < height; y++) {
      const index = (width * y + x) * 4,
            alpha = data[index + 3];
      if (alpha) k += (255 - data[index]);
    }
    area += k;
    xk += x * k;
  }
  for (let y = 0; y < height; y++) {
    let k = 0;
    for (let x = 0; x < width; x++) {
      const index = (width * y + x) * 4,
            alpha = data[index + 3];
      if (alpha) k += (255 - data[index]);
    }
    yk += y * k;
  }

  return {
    x: xk / area,
    y: yk / area
  };
};


// グレースケールに変換する
CanvasRenderingContext2D.prototype.toGrayScale = function() {
  const imageData = this.getImageData(0, 0, this.canvas.width, this.canvas.height),
        data = imageData.data;

  for (let i = 0, len = data.length; i < len; i += 4) {
    const r = data[i],
          g = data[i + 1],
          b = data[i + 2],
          gray = (306 * r + 601 * g + 117 * b) >> 10;

    data[i] = data[i + 1] = data[i + 2] = gray;
  }
  this.putImageData(imageData, 0, 0);
};
