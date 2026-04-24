import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeletePostModal } from './delete-post-modal';

describe('DeletePostModal', () => {
  let component: DeletePostModal;
  let fixture: ComponentFixture<DeletePostModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeletePostModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeletePostModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
