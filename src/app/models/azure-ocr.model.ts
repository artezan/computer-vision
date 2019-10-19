export interface Word {
  boundingBox: string;
  text: string;
}

export interface Line {
  boundingBox: string;
  words: Word[];
}

export interface Region {
  boundingBox: string;
  lines: Line[];
}

export interface OCRModel {
  language: string;
  orientation: string;
  textAngle: number;
  regions: Region[];
}
