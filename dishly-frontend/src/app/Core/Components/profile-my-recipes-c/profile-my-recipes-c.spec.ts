import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileMyRecipesC } from './profile-my-recipes-c';

describe('ProfileMyRecipesC', () => {
  let component: ProfileMyRecipesC;
  let fixture: ComponentFixture<ProfileMyRecipesC>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileMyRecipesC]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileMyRecipesC);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
