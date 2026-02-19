import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchingBar } from './searching-bar';

describe('SearchingBar', () => {
  let component: SearchingBar;
  let fixture: ComponentFixture<SearchingBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchingBar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchingBar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
