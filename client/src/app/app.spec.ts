import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { App } from './app';

describe('App', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const req = httpMock.expectOne('/weatherforecast');
    req.flush([]);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render weather rows', () => {
    const fixture = TestBed.createComponent(App);
    const req = httpMock.expectOne('/weatherforecast');
    req.flush([
      { date: '2026-04-24', temperatureC: 10, temperatureF: 50, summary: 'Cool' }
    ]);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Weather Forecast');
    expect(compiled.querySelector('tbody tr td')?.textContent).toContain('2026-04-24');
  });
});
