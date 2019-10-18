import { TestBed } from '@angular/core/testing';

import { AzureOcrService } from './azure-ocr.service';

describe('AzureOcrService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: AzureOcrService = TestBed.get(AzureOcrService);
    expect(service).toBeTruthy();
  });
});
