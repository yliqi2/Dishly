import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChefAnimation } from './chef-animation';

describe('ChefAnimation', () => {
  let component: ChefAnimation;
  let fixture: ComponentFixture<ChefAnimation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChefAnimation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChefAnimation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
