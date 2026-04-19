import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DishlySelectComponent } from './dishly-select';

describe('DishlySelectComponent', () => {
  let component: DishlySelectComponent;
  let fixture: ComponentFixture<DishlySelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DishlySelectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DishlySelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
