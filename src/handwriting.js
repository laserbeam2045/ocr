import * as Preprocessing from "./alphabet_preprocessing.js?version=1";


const INPUT_SIZE = 40;

export class Handwriting {
  constructor(prop) {
    this.canvas = document.getElementById(prop.id);

    this.fabricCanvas = new fabric.Canvas(prop.id, {
      width: prop.width,
      height: prop.height,
      isDrawingMode: true,
      backgroundColor: "white",
    });

    this.fabricCanvas.freeDrawingBrush.width = 4;

    this.fabricCanvas.freeDrawingBrush.shadow = new fabric.Shadow({
      blur: 1,
      color: "blue",
    })

    customizeFabric()

    tf.loadModel("http://have-a-go.moo.jp/handwriting_2/trained_data/model.json")
      .then(model => {
        this.model = model
      })
  }

  // canvasに書かれたものを消すメソッド
  clear() {
    this.fabricCanvas.clear().set("backgroundColor", "white").renderAll()
  }

  // canvasに書かれた文字を推論するメソッド
  getChar() {
    return tf.tidy(() => {
      const input = this.createInputData(),
            output = this.model.predict(input),
            index = output.argMax(1).dataSync()[0]

      return symbol(index)
    });
  }

  // サーバーに画像を送信するメソッド
  send(label) {
    const canvas = this.createInputCanvas()
    sendImage(label, canvas, this.fabricCanvas.width, this.fabricCanvas.freeDrawingBrush.width)
    this.clear()
  }

  // 入力データを作成するメソッド
  createInputData() {
    const imageData = this.createInputCanvas().ctx.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE)

    return tf.fromPixels(imageData, 1).reshape([1, INPUT_SIZE, INPUT_SIZE, 1]).cast('float32').div(tf.scalar(255))
  }

  // 入力用に変換したcanvasを作成するメソッド
  createInputCanvas() {
    return Preprocessing.preprocessing(this.canvas, INPUT_SIZE)
  }
}


// 推論結果の数値を文字に変換する
function symbol(index) {
  if (index === 52)       return String.fromCharCode(39)          // ' (シングルクオート)
  else if (index === 53)  return String.fromCharCode(45)          // - (ハイフン
  else if (index === 54)  return String.fromCharCode(46)          // . (ピリオド)
  else if (index === 55)  return String.fromCharCode(47)          // / (スラッシュ)
  else if (index === 56)  return String.fromCharCode(124)         // | (パイプ)
  else if (index === 57)  return String.fromCharCode(880)         // Ͱ (ヘータ)
  else if (index === 58)  return String.fromCharCode(915)         // Γ (ガンマ)
  else if (index === 59)  return String.fromCharCode(923)         // Λ (ラムダ)
  else if (index === 60)  return String.fromCharCode(947)         // γ (ガンマ)
  else if (index < 26)    return String.fromCharCode(index + 65)  // アルファベット(大文字)
  else                    return String.fromCharCode(index + 71)  // アルファベット(小文字)
}


// サーバーに画像を送信する処理
function sendImage(label, canvas, before_size, brush_width) {
  // canvasデータからblobオブジェクトを作成
  canvas.toBlob(blob => {
    const oReq = new XMLHttpRequest();
    const url = "http://have-a-go.moo.jp/handwriting_2/import.php";
    const fd = new FormData();

    // FormDataに画像とラベルを追加
    fd.append("label", label);
    fd.append("image", blob);
    fd.append("before_size", before_size);
    fd.append("after_size", INPUT_SIZE);
    fd.append("brush_width", brush_width);

    // メソッドと送信先を指定
    oReq.open("POST", url, true);

    // 送信
    oReq.send(fd);
  }, "image/png");
}


// 点を打った時に、インクがにじむように拡大させる
function customizeFabric() {
  fabric.PencilBrush.prototype.onMouseDown = function(pointer) {
    this.startPoint = pointer;
    this.dotOnlyFlg = true;

    this._prepareForDrawing(pointer);
    this._captureDrawingPath(pointer);
    this._render();
  };

  fabric.PencilBrush.prototype.onMouseMove = function(pointer) {
    this.dotOnlyFlg = false;

    this._captureDrawingPath(pointer);
    this.canvas.clearContext(this.canvas.contextTop);
    this._render();
  };

  fabric.PencilBrush.prototype.onMouseUp = function() {
    if (this.dotOnlyFlg) {
      const moves = [
        {x: 0,  y: -1},
        {x: 1,  y: 0},
        {x: 0,  y: 1},
        {x: -1, y: 0},
        {x: 0,  y: -1},
      ];
      for (let move of moves) {
        const pointer = {
          x: this.startPoint.x + move.x,
          y: this.startPoint.y + move.y,
        };
        this._captureDrawingPath(pointer);
      }
    }

    this._finalizeAndAddPath();
  };
}
