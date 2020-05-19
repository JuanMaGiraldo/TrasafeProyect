import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { LoadInfoPage } from './load-info.page';

describe('LoadInfoPage', () => {
  let component: LoadInfoPage;
  let fixture: ComponentFixture<LoadInfoPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LoadInfoPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(LoadInfoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
