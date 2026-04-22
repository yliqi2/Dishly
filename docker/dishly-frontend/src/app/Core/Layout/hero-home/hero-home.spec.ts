import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeroHome } from './hero-home';

describe('HeroHome', () => {
  let component: HeroHome;
  let fixture: ComponentFixture<HeroHome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeroHome]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeroHome);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
