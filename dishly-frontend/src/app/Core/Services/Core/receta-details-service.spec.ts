import { TestBed } from '@angular/core/testing';

import { RecetaDetailsService } from './receta-details-service';

describe('RecetaDetailsService', () => {
  let service: RecetaDetailsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RecetaDetailsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
