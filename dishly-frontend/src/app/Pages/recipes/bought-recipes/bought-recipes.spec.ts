import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoughtRecipes } from './bought-recipes';

describe('BoughtRecipes', () => {
  let component: BoughtRecipes;
  let fixture: ComponentFixture<BoughtRecipes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoughtRecipes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoughtRecipes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
