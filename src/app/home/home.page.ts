import {
  Component,
  ViewEncapsulation,
  Inject,
  AfterViewInit,
  ViewChild
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
import { Platform, LoadingController } from '@ionic/angular';
import { AzureOcrService } from '../services/azure-ocr.service';
import { environment } from 'src/environments/environment';
declare const Buffer;

type FiltersTest = 'normal' | 'a' | 'b' | 'c' | 'd';

type TabSelect = 'log' | 'edit' | 'camera';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class HomePage {
  result = [];
  log: string;
  status: { camera: boolean; mock: boolean } = { camera: false, mock: false };
  canvas: HTMLCanvasElement;
  b64Str: string;
  imgSrc: string;
  imgGeneral: any;
  ctxGeneral: CanvasRenderingContext2D;
  grayscale = 0;
  saturate = 100;
  brightness = 100;
  contrast = 100;
  invert = 0;
  opacity = 100;
  sepia = 0;
  showIMG = false;
  public tabSelect: TabSelect = 'log';
  constructor(
    private cameraPreview: CameraPreview,
    public platform: Platform,
    public loadingController: LoadingController,
    public azureOcrService: AzureOcrService,
    @Inject(DOCUMENT) private document: Document
  ) {
    console.log(environment);
    //  this.platform.platforms().some()
  }
  // camera cordova
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
        if (err === 'cordova_not_available') {
          this.mockCamera();
        }
      }
    );
  }
  takeSnapshot(test: FiltersTest = 'a') {
    this.cameraPreview.takeSnapshot({ quality: 95 }).then(
      base64PictureData => {
        this.b64Str = base64PictureData;
        const image = this.document.createElement('img');
        this.result.push('sucess snap');
        image.src = 'data:image/jpeg;base64,' + base64PictureData;
        image.onload = async () => {
          const load = await this.presentLoading();
          this.result.push(
            `image takeSnapshot: ${image.width} x ${image.height}, size: ${image.sizes} `
          );
          this.result.push('B64: ' + base64PictureData);
          this.draw(image, test);
          this.goToEdit();
          load.dismiss();
        };
      },
      err => {
        this.result.push(`Snap err: ${err}`);
      }
    );
  }
  takePicture(test: FiltersTest = 'a') {
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
  stopCamera() {
    this.status.camera = false;
    if (this.status.mock) {
      this.document.body.style.cssText = '--ion-background-color: #121212;';
    } else {
      this.cameraPreview.stopCamera().then(() => {
        this.log = this.result.join('\n');
      });
    }
  }
  // end camera
  // mock camera
  mockCamera() {
    this.status = { camera: true, mock: true };
    console.log('mock');
    this.document.body.style.cssText =
      // tslint:disable-next-line: quotemark
      "background-image: url('./assets/image/ife1.jpg'); --ion-background-color: trasparent; background-repeat; background-size: 100% ";
  }
  // canvas
  // 1:
  draw(img: HTMLImageElement, test: FiltersTest) {
    // this.canvas = document.getElementById('canvas') as any;
    this.canvas = this.document.createElement('canvas');
    const ctx = this.canvas.getContext('2d');
    this.result.push('Draw');
    this.result.push(`img.width: ${img.width}`);
    this.canvas.width = img.width;
    this.canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    this.result.push('Draw finish');
    // test filters by canvas
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
    } else if (test === 'c') {
      ctx.filter = 'grayscale(100%) brightness(600%) contrast(800%)';
      ctx.drawImage(img, 0, 0);
    } else if (test === 'd') {
      ctx.filter = 'grayscale(100%)';
      ctx.drawImage(img, 0, 0);
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
    } else if (test === 'azure') {
      const file = this.dataURLtoFile(img.src, 'img');

      this.sendToAzure(file);
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
  // end canvas
  // tesseract OCR
  read() {
    this.tesseractRead(this.canvas);
  }
  readWithFilter() {
    this.filters(this.ctxGeneral, this.imgGeneral, {
      grayscale: this.grayscale,
      saturate: this.saturate,
      brightness: this.brightness,
      contrast: this.contrast,
      sepia: this.sepia,
      opacity: this.opacity,
      invert: this.invert
    });
    this.tesseractRead(this.canvas);
  }
  tesseractRead(toRead) {
    this.result.push('init read');
    this.log = this.result.join('\n');
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
  // file input
  fileInput(ev) {
    if (ev.target.files) {
      const file: File = ev.target.files[0];
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = (e: any) => {
        const r = new FileReader();
        this.sendToAzure(file);
        const img = new Image();
        img.src = e.target.result as any;
        img.onload = () => {
          this.draw(img, 'normal');
          this.showIMG = true;
          // this.goToEdit();
        };
      };
    }
  }
  // helpers
  sendToAzure(img: File) {
    console.log('blob', img);
    console.log('isBlob', img instanceof Blob);
    this.azureOcrService.postImgToOCR(img).subscribe(res => console.log(res));
  }

  private dataURLtoFile(dataurl, filename): File {
    let arr = dataurl.split(','),
      mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]),
      n = bstr.length,
      u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }

  // filter image
  filters(
    ctx,
    image,
    { grayscale, saturate, brightness, contrast, sepia, opacity, invert }
  ) {
    ctx.filter = `grayscale(${grayscale}%) saturate(${saturate}) brightness(${brightness}%) contrast(${contrast}%) sepia(${sepia}%) opacity(${opacity}%) invert(${invert}%)`;
    ctx.drawImage(image, 0, 0);
  }
  testMock() {
    console.log('test');
    const image = this.document.createElement('img');

    this.result.push('sucess takePicture');
    image.src = './assets/image/ife1.jpg';
    image.onload = async () => {
      const load = await this.presentLoading();
      this.result.push(
        `image takeSnapshot: ${image.width} x ${image.height}, size: ${image.sizes} `
      );
      this.draw(image, 'normal');
      this.goToEdit();
      load.dismiss();
    };
  }
  goToEdit() {
    this.stopCamera();
    this.tabSelect = 'edit';
  }
  async presentLoading() {
    const loading = await this.loadingController.create({
      message: 'Loading...'
    });
    await loading.present();
    return loading;
  }
  changColor() {
    getComputedStyle(document.documentElement).getPropertyValue(
      '--my-variable-name'
    );
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
  } // tests no funtional
  testAzure() {
    const file = this.dataURLtoFile(
      'data:image/jpeg;base64,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 ',
      'img.png'
    );
    this.sendToAzure(file);
  }
}
