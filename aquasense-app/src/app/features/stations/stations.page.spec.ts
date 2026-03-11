import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StationsPage } from './stations.page';

describe('StationsPage', () => {
  let component: StationsPage;
  let fixture: ComponentFixture<StationsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(StationsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
