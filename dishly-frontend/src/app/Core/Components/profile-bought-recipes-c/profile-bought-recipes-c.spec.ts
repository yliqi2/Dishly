import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileBoughtRecipesC } from './profile-bought-recipes-c';

describe('ProfileBoughtRecipesC', () => {
  let component: ProfileBoughtRecipesC;
  let fixture: ComponentFixture<ProfileBoughtRecipesC>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileBoughtRecipesC]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileBoughtRecipesC);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
