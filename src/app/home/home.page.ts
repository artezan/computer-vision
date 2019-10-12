import {
  Component,
  ViewEncapsulation,
  Inject,
  AfterViewInit
} from '@angular/core';
import {
  CameraPreview,
  CameraPreviewPictureOptions,
  CameraPreviewOptions,
  CameraPreviewDimensions
} from '@ionic-native/camera-preview/ngx';
import { DOCUMENT } from '@angular/common';
import { createWorker } from 'tesseract.js';
import * as Tesseract from 'tesseract.js';
declare const Buffer;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class HomePage implements AfterViewInit {
  result = [];
  log: string;
  status: { camera: boolean } = { camera: false };
  canvas;
  mockImg;
  b64Str: string;
  showImg = false;
  imgSrc: string;
  imgGeneral;
  ctxGeneral;
  grayscale = '100';
  saturate = '1';
  brightness = '300';
  contrast = '400';
  constructor(
    private cameraPreview: CameraPreview,
    @Inject(DOCUMENT) private document: Document
  ) {}
  ngAfterViewInit() {
    this.mockImg = this.document.getElementById('image1');
  }

  startCamera() {
    const cameraPreviewOpts: CameraPreviewOptions = {
      x: 0,
      y: 0,
      width: window.screen.width,
      height: window.screen.height,
      camera: 'rear',
      tapPhoto: true,
      tapToFocus: true,
      previewDrag: true,
      toBack: true,
      alpha: 1
    };
    // start camera
    this.cameraPreview.startCamera(cameraPreviewOpts).then(
      res => {
        this.document.body.style.setProperty(
          '--ion-background-color',
          'trasparent'
        );
        this.result.push(res);
        getComputedStyle(document.documentElement).getPropertyValue(
          '--my-variable-name'
        );
        this.cameraPreview.show().then(
          result => {
            this.result.push(`show: ${result}`);
            // start camera mode
            this.status.camera = true;
          },
          err => this.result.push('err show' + err)
        );
        console.log(res);
      },
      err => {
        console.log(err);
        this.result.push('err start camera' + err);
      }
    );
  }

  stopCamera() {
    this.cameraPreview.stopCamera().then(() => {
      this.status.camera = false;
      this.log = this.result.join('\n');
    });
  }
  draw(img, test) {
    this.canvas = document.getElementById('canvas') as any;
    // this.canvas = this.document.createElement('canvas');
    const ctx = this.canvas.getContext('2d');
    this.result.push('Draw');
    this.result.push(`img.width: ${img.width}`);
    this.canvas.width = img.width;
    this.canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    this.result.push('Draw finish');
    if (test === 'a') {
      ctx.filter =
        'grayscale(100%) saturate(1) brightness(300%) contrast(400%)';
      ctx.drawImage(img, 0, 0);
    } else if (test === 'b') {
      const imageData = ctx.getImageData(
        0,
        0,
        this.canvas.width,
        this.canvas.height
      );
      const pix = imageData.data;
      this.testB(pix, ctx, imageData);
    } else if (test === 'normal') {
      ctx.drawImage(img, 0, 0);
    }
    this.imgGeneral = img;
    this.ctxGeneral = ctx;
    this.imgSrc = this.canvas.toDataURL();
  }
  testB(pix, ctx, imageData) {
    const newColor = { r: 255, g: 255, b: 255, a: 255 };
    for (let i = 0, n = pix.length; i < n; i += 4) {
      let r = pix[i],
        g = pix[i + 1],
        b = pix[i + 2];

      if (r >= 50 && g >= 50 && b >= 50) {
        pix[i] = newColor.r;
        pix[i + 1] = newColor.g;
        pix[i + 2] = newColor.b;
        pix[i + 3] = newColor.a;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }
  read() {
    this.tesseractRead(this.canvas);
  }
  tesseractRead(toRead) {
    this.result.push('init read');
    const startTime = new Date().getTime();
    const worker = createWorker({
      langPath: './assets/i18n/fast',
      workerPath: './assets/tesseract/worker.min.js',
      corePath: './assets/tesseract/tesseract-core.wasm.js'
    });
    (async () => {
      console.log('here');
      this.result.push('init read tesseract');
      await worker.load();
      console.log('here2');
      this.result.push('load');

      await worker.loadLanguage('spa');
      await worker.initialize('spa');
      const { data } = await worker.recognize(toRead);
      const endTime = new Date().getTime();
      this.result.push(`Time(ms): ${endTime - startTime}`);
      console.log(data);
      this.result.push(data.text);
      this.log = this.result.join('\n');
      await worker.terminate();
    })();
    /*  worker
      .recognize(toRead)
      .progress(info => {
        console.log(info);
      })
      .then(result => {
        console.log(result.text);
      }); */
    /*   Tesseract.recognize(
      'https://tesseract.projectnaptha.com/img/eng_bw.png',
      'eng',
      { logger: m => console.log(m) }
    ).then(({ data: { text } }) => {
      console.log(text);
    }); */
  }
  fileInput(ev) {
    if (ev.target.files) {
      const file = ev.target.files[0];
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = (e: any) => {
        const img = new Image();
        img.src = e.target.result as any;
        img.onload = () => {
          this.draw(img, 'normal');
        };
      };
    }
  }
  takeSnapshot(test = 'a') {
    this.cameraPreview.takeSnapshot({ quality: 95 }).then(
      base64PictureData => {
        this.b64Str = base64PictureData;
        const image = this.document.createElement('img');
        this.result.push('sucess snap');
        image.src = 'data:image/jpeg;base64,' + base64PictureData;
        image.onload = () => {
          this.result.push(
            `image takeSnapshot: ${image.width} x ${image.height}, size: ${image.sizes} `
          );
          this.result.push('B64: ' + base64PictureData);
          this.draw(image, test);
        };
      },
      err => {
        this.result.push(`Snap err: ${err}`);
      }
    );
  }
  takePicture(test = 'a') {
    this.cameraPreview
      .takePicture({ width: 640, height: 640, quality: 85 })
      .then(
        base64PictureData => {
          this.b64Str = base64PictureData;

          const image = this.document.createElement('img');

          this.result.push('sucess takePicture');
          image.src = 'data:image/jpeg;base64,' + base64PictureData;
          image.onload = () => {
            this.result.push(
              `image takeSnapshot: ${image.width} x ${image.height}, size: ${image.sizes} `
            );
            this.result.push('B64: ' + base64PictureData);
            this.draw(image, test);
          };
        },
        err => {
          this.result.push(`Snap err: ${err}`);
        }
      );
  }
  // helpers
  handleChanges() {
    this.filters(this.ctxGeneral, this.imgGeneral, {
      grayscale: this.grayscale,
      saturate: this.saturate,
      brightness: this.brightness,
      contrast: this.contrast
    });
    this.imgSrc = this.canvas.toDataURL();
  }
  filters(ctx, image, { grayscale, saturate, brightness, contrast }) {
    ctx.filter = `grayscale(${grayscale}%) saturate(${saturate}) brightness(${brightness}%) contrast(${contrast}%)`;
    ctx.drawImage(image, 0, 0);
  }
  changColor() {
    this.document.body.style.setProperty(
      '--ion-background-color',
      'trasparent'
    );
    this.document.documentElement.style.setProperty(
      '--ion-background-color',
      '#8a1515'
    );
    this.document.documentElement.style.setProperty(`--color`, 'green');
    // root.style.setProperty('--ion-background-color-rgb', 'red');
    console.log(
      this.document.documentElement.style.getPropertyValue(
        '--ion-background-color'
      )
    );
  }
}
