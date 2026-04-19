import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TermsaAndConditions } from './termsa-and-conditions';

describe('TermsaAndConditions', () => {
  let component: TermsaAndConditions;
  let fixture: ComponentFixture<TermsaAndConditions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TermsaAndConditions]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TermsaAndConditions);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
