import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteRecipeModal } from './delete-recipe-modal';

describe('DeleteRecipeModal', () => {
  let component: DeleteRecipeModal;
  let fixture: ComponentFixture<DeleteRecipeModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteRecipeModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeleteRecipeModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
