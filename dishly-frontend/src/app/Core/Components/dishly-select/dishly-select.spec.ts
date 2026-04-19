import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DishlySelect } from './dishly-select';

describe('DishlySelect', () => {
  let component: DishlySelect;
  let fixture: ComponentFixture<DishlySelect>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DishlySelect]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DishlySelect);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
