import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
@Injectable({
  providedIn: 'root'
})
export class AzureOcrService {
  URL =
    'https://mx-test-ife-cv.cognitiveservices.azure.com/vision/v2.0/ocr?language=es';
  constructor(private http: HttpClient) {}

  postImgToOCR(img: File) {
    const headers = new HttpHeaders({
      'Ocp-Apim-Subscription-Key': '569eb371f9c64c5582aca157767f9933'
    });
    const formData: FormData = new FormData();
    formData.append('', img);
    return this.http.post(this.URL, formData, { headers });
  }
}
