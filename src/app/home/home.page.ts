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
            this.result.push(result);
            // start camera mode
            this.status.camera = true;
          },
          err => this.result.push(err)
        );
        console.log(res);
      },
      err => {
        console.log(err);
        this.result = err;
      }
    );
  }

  stopCamera() {
    this.cameraPreview.stopCamera().then(() => {
      this.status.camera = false;
      this.log = this.result.join('\n');
    });
  }
  draw(img) {
    // this.canvas = document.getElementById('canvas') as any;
    this.canvas = this.document.createElement('canvas');
    const ctx = this.canvas.getContext('2d');
    const image = new Image();
    this.result.push(img.width);
    this.canvas.width = img.width;
    this.canvas.height = img.height;

    ctx.filter = 'grayscale(100%) saturate(1) brightness(300%) contrast(400%)';
    ctx.drawImage(img, 0, 0);
    image.src = this.canvas.toDataURL();
  }
  read() {
    this.tesseractRead(this.canvas);
  }
  tesseractRead(toRead) {
    const worker = createWorker({
      langPath: './assets/i18n/fast',
      workerPath: './assets/tesseract/worker.min.js',
      corePath: './assets/tesseract/tesseract-core.wasm.js'
    });
    (async () => {
      console.log('here');
      this.log = 'init';
      await worker.load();
      console.log('here2');
      this.log = 'load';

      await worker.loadLanguage('spa');
      await worker.initialize('spa');
      const { data } = await worker.recognize(toRead);
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
          this.draw(img);
        };
      };
    }
  }
  takeSnapshot() {
    this.cameraPreview.takeSnapshot({ quality: 95 }).then(
      base64PictureData => {
        const image = new Image();
        image.src = 'data:image/jpeg;base64,' + base64PictureData;
        this.draw(image);
      },
      err => {
        this.result.push(err);
      }
    );
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
