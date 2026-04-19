import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchRecipes } from './search-recipes';

describe('SearchRecipes', () => {
  let component: SearchRecipes;
  let fixture: ComponentFixture<SearchRecipes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchRecipes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchRecipes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
