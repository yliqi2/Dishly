import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DishlyAi } from './dishly-ai';

describe('DishlyAi', () => {
  let component: DishlyAi;
  let fixture: ComponentFixture<DishlyAi>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DishlyAi]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DishlyAi);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
