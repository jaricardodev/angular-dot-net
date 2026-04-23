import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly http = inject(HttpClient);
  protected readonly forecasts = signal<WeatherForecast[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.loadWeatherForecast();
  }

  private loadWeatherForecast(): void {
    this.http.get<WeatherForecast[]>('/weatherforecast').subscribe({
      next: (data) => {
        this.forecasts.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load weather forecast.');
        this.loading.set(false);
      }
    });
  }
}

type WeatherForecast = {
  date: string;
  temperatureC: number;
  temperatureF: number;
  summary: string;
};
