# Angular & .NET Interview Q&A

> Based on the `jaricardodev/angular-dot-net` repository — a minimal Angular 19 + .NET 9 starter.

---

## Core Angular Concepts

### 1. What is Angular, and how does it differ from AngularJS?

**Angular** (v2+) is a complete rewrite of AngularJS, built with TypeScript, a component-based architecture, and a reactive, unidirectional data-flow model.

| | AngularJS (v1) | Angular (v2+) |
|---|---|---|
| Language | JavaScript | TypeScript |
| Architecture | MVC / $scope | Component tree |
| Change detection | Dirty-checking / digest loop | Zone.js + signals |
| Mobile | Not designed for it | Optimized |
| DI | Custom | Hierarchical, typed |

This repo uses **Angular 19** (evidenced by `signal()`, the `@if`/`@for` block syntax, and standalone bootstrap in `main.ts`) — none of that existed in AngularJS.

---

### 2. Explain the architecture of an Angular application (Modules, Components, Templates, Services)

This repo demonstrates the modern **standalone** architecture (no `NgModule`):

```
main.ts  ──bootstrapApplication(App, appConfig)──►  App component
                                                          │
                                       appConfig (providers: HttpClient, Router, ZoneChangeDetection)
```

| Building block | Where in this repo |
|---|---|
| **Component** | `app.ts` — `@Component({selector, templateUrl, styleUrl})` |
| **Template** | `app.html` — declarative HTML with `@if`/`@for` control flow |
| **Service (injected)** | `HttpClient` injected via `inject(HttpClient)` in `app.ts:10` |
| **Configuration/DI root** | `app.config.ts` — `appConfig` with `providers: [...]` |
| **Router** | `app.routes.ts` + `provideRouter(routes)` in `app.config.ts:12` |

In the traditional (`NgModule`) world there would also be `app.module.ts`, but Angular 14+ supports standalone components that declare their own imports, which is what this project uses.

---

### 3. What are components and directives?

**Components** are the fundamental UI building block — a TypeScript class decorated with `@Component` that pairs a template and styles. In `app.ts`:

```typescript
@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App { ... }
```

**Directives** are instructions to the DOM without their own template. There are three kinds:
- **Structural** (`*ngIf`, `*ngFor` or the newer `@if`/`@for` blocks used here) — change DOM structure
- **Attribute** (`[ngClass]`, `[ngStyle]`) — change element appearance/behavior
- **Components** are technically a directive subtype with a template

This repo uses Angular 17+ **built-in control flow blocks** (`@if`, `@for` in `app.html`) instead of structural directives.

---

### 4. What are Angular Modules (NgModule) and the purpose of `app.module.ts`?

`NgModule` is the *classic* way to organize an Angular app — it declares which components, pipes, and directives belong together and what external modules they need. `app.module.ts` was the root module that bootstrapped everything.

**This repo does not have `app.module.ts`** because it uses the modern **standalone** pattern:
- `main.ts` calls `bootstrapApplication(App, appConfig)` directly
- `app.config.ts` is the equivalent of the root NgModule's `providers` array
- Individual components import what they need directly

This is the recommended pattern from Angular 14+ onwards.

---

### 5. What are decorators and metadata?

Decorators are TypeScript functions (prefixed with `@`) that attach metadata to a class, property, method, or parameter. Angular's compiler reads this metadata to understand how to instantiate and wire up objects.

From `app.ts`:
```typescript
@Component({          // ← decorator
  selector: 'app-root',   // ← metadata: CSS selector for this component
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App { ... }
```

Other common Angular decorators: `@Injectable`, `@Pipe`, `@Directive`, `@Input`, `@Output`, `@NgModule`.

---

### 6. What is the purpose of `ngZone`?

`NgZone` is a wrapper around Zone.js that tells Angular *when* to run change detection. Whenever an async operation (click, HTTP response, timer) completes *inside* Angular's zone, change detection is triggered automatically.

This repo explicitly configures Zone.js in `app.config.ts`:
```typescript
provideZoneChangeDetection({ eventCoalescing: true })
```
`eventCoalescing: true` batches multiple DOM events that fire together into a single change-detection cycle, reducing unnecessary re-renders. You would use `NgZone.runOutsideAngular()` for performance-critical work (e.g., animations) that shouldn't trigger change detection.

---

## Data Binding & Component Communication

### 7. Explain the difference between one-way and two-way data binding

| Type | Syntax | Direction | Example in repo |
|---|---|---|---|
| **Interpolation** (one-way) | `{{ expr }}` | Component → DOM | `{{ forecast.date }}` in `app.html` |
| **Property binding** (one-way) | `[prop]="expr"` | Component → DOM | e.g., `[disabled]="loading()"` |
| **Event binding** (one-way) | `(event)="handler()"` | DOM → Component | e.g., `(click)="reload()"` |
| **Two-way** | `[(ngModel)]="prop"` | Both directions | Not used here (no form inputs) |

Two-way binding is syntactic sugar: `[(ngModel)]` = `[ngModel]` + `(ngModelChange)`.

---

### 8. How can components share data? (Input, Output, ViewChild, Services)

| Mechanism | When to use |
|---|---|
| `@Input()` | Parent → Child |
| `@Output()` + `EventEmitter` | Child → Parent |
| `@ViewChild` | Parent accesses child's class directly |
| **Service** | Sibling components / any distance |

In this repo, the single `App` component calls the API itself via injected `HttpClient` (a built-in service). In a larger app you'd extract that into a `WeatherService` and share it across components.

---

### 9. What are `@Input()` and `@Output()` decorators?

```typescript
// Child component
@Component({ selector: 'app-forecast-row', ... })
export class ForecastRow {
  @Input() forecast!: WeatherForecast;           // receive data from parent
  @Output() selected = new EventEmitter<string>(); // emit event to parent
}

// Parent template
<app-forecast-row
  [forecast]="item"             // @Input binding
  (selected)="onSelect($event)" // @Output binding
/>
```

The `WeatherForecast` type defined in `app.ts` is exactly the shape you'd pass as an `@Input`.

---

### 10. What is the purpose of `ngFor trackBy`?

`trackBy` tells Angular *how to identify* each list item so it can reuse DOM nodes instead of recreating them when the array changes.

This repo uses the modern Angular 17+ `@for` block with `track` in `app.html`:
```html
@for (forecast of forecasts(); track forecast.date) {
  <tr>...</tr>
}
```
`track forecast.date` is the direct equivalent of `trackBy: (i, f) => f.date` in the old `*ngFor` directive. Without it, Angular would destroy and recreate every `<tr>` on each change. With it, only rows whose `date` changed are touched.

---

## Lifecycle Hooks & Performance

### 11. Describe the Angular Component Lifecycle

| Hook | Timing |
|---|---|
| `ngOnChanges` | Before `ngOnInit`, and on every `@Input` change |
| **`ngOnInit`** | Once after the first `ngOnChanges`; component is ready |
| `ngDoCheck` | Every change-detection run |
| `ngAfterContentInit` | After `<ng-content>` is projected |
| `ngAfterContentChecked` | After every check of projected content |
| `ngAfterViewInit` | After the component's view (+ children) is initialized |
| `ngAfterViewChecked` | After every check of the view |
| **`ngOnDestroy`** | Just before the component is removed from the DOM |

---

### 12. What is the difference between the constructor and `ngOnInit`?

| | Constructor | `ngOnInit` |
|---|---|---|
| When | Class instantiation by JS | After Angular sets `@Input` values |
| Safe for | DI / field init | Business logic, HTTP calls |
| `@Input` available? | ❌ | ✅ |

In `app.ts` the HTTP call is made in the **constructor**:
```typescript
constructor() {
  this.loadWeatherForecast();
}
```
This works here because `App` is the root component with no `@Input` dependencies. Best practice would be to move it to `ngOnInit` to align with the lifecycle contract and make the component more testable.

---

### 13. How do you optimize the performance of an Angular application?

| Technique | How |
|---|---|
| **AOT** (default in prod) | Pre-compiles templates at build time |
| **Lazy loading** | Load feature modules/routes on demand |
| **OnPush** change detection | Only check a component when its `@Input` reference changes or an event fires inside it |
| **Signals** | Fine-grained reactivity — only update what changed |
| **`track`** in `@for` | Reuse DOM nodes (see Q10) |
| **`eventCoalescing`** | Batch Zone.js events — already in this repo (`app.config.ts`) |
| **`@defer`** blocks | Angular 17+ lazy-loads parts of the template |

This repo already uses **signals** (`signal<WeatherForecast[]>([])`, `signal(true)`) and `eventCoalescing`, making it more performant than a classic zone-based app.

---

### 14. What is the difference between AOT and JIT compilation?

| | JIT (Just-in-Time) | AOT (Ahead-of-Time) |
|---|---|---|
| When compiled | In the browser at runtime | At build time (`ng build`) |
| Bundle size | Larger (includes compiler) | Smaller |
| Startup speed | Slower | Faster |
| Error detection | At runtime | At build time |
| Used in | `ng serve` (dev) | `ng build` (prod, default) |

The Angular build output from this repo goes to `Api/wwwroot` (configured in `angular.json`), and `Program.cs` serves it as static files — this is always the **AOT-compiled** production bundle.

---

## Services & Dependency Injection

### 15. What is Dependency Injection (DI) and its benefits?

DI is a design pattern where a class *declares* its dependencies rather than *creating* them. Angular's DI system resolves and injects them.

**Benefits:** loose coupling, easier testing (swap real service for mock), singleton management, code reuse.

In `app.ts`:
```typescript
private readonly http = inject(HttpClient);
```
`inject()` is the modern function-based alternative to constructor injection. Angular's DI system provides the `HttpClient` instance (registered via `provideHttpClient()` in `app.config.ts`).

The test in `app.spec.ts` swaps the real `HttpClient` for a mock with `provideHttpClientTesting()` — this is DI's testability benefit in action.

---

### 16. What is a singleton service and how is it achieved?

A service decorated with `@Injectable({ providedIn: 'root' })` is instantiated once and shared across the entire app — this is the singleton pattern.

`HttpClient` itself follows this pattern. If this project had a `WeatherService`:
```typescript
@Injectable({ providedIn: 'root' })   // ← one instance for the whole app
export class WeatherService { ... }
```

Providing a service in a specific `NgModule` (or `providers` array of a lazy route) scopes it to that subtree, giving you *non*-singleton behavior when needed.

---

### 17. What are Angular Interceptors?

Interceptors are middleware for `HttpClient` requests/responses. They implement `HttpInterceptorFn` (functional, modern style) and are registered via `withInterceptors()`.

Common uses: attach JWT auth headers, show a global loading spinner, handle 401 errors globally, log requests.

```typescript
// auth.interceptor.ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  const authReq = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  return next(authReq);
};

// app.config.ts
provideHttpClient(withInterceptors([authInterceptor]))
```

---

## Forms & Routing

### 18. What is the difference between Template-driven and Reactive Forms?

| | Template-driven | Reactive |
|---|---|---|
| Setup | `FormsModule` + `ngModel` | `ReactiveFormsModule` + `FormGroup`/`FormControl` |
| Form state | Lives in the template | Lives in the component class |
| Validation | HTML attributes + directives | Validator functions |
| Testing | Harder (requires DOM) | Easy (pure TypeScript) |
| Best for | Simple forms | Complex, dynamic forms |

This repo has no forms (it's read-only weather data), but Reactive Forms would be the right choice for anything non-trivial.

---

### 19. How do you create custom validators in Reactive Forms?

```typescript
// Validator function
export function noWeekendValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const date = new Date(control.value);
    const day = date.getDay();
    return day === 0 || day === 6 ? { noWeekend: true } : null;
  };
}

// Usage
this.form = new FormGroup({
  date: new FormControl('', [Validators.required, noWeekendValidator()])
});
```

Async validators return `Observable<ValidationErrors | null>` or `Promise<...>` and are passed in the third argument to `FormControl`.

---

### 20. What are Angular Route Guards?

Guards control navigation. Modern Angular uses **functional guards** (returning `boolean | UrlTree`):

| Guard | Purpose |
|---|---|
| `canActivate` | Can the user enter this route? |
| `canActivateChild` | Can the user enter a child route? |
| `canDeactivate` | Can the user leave this route? (e.g., unsaved form) |
| `canLoad` / `canMatch` | Can the lazy-loaded chunk even be fetched? |

```typescript
// auth.guard.ts
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  return auth.isLoggedIn() ? true : inject(Router).parseUrl('/login');
};

// app.routes.ts
{ path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] }
```

This repo's `app.routes.ts` has an empty routes array — it's the file where you'd add these guards.

---

### 21. What is lazy loading and how do you implement it?

Lazy loading defers loading a feature's JavaScript bundle until the user navigates to that route. This shrinks the initial bundle size.

```typescript
// app.routes.ts
export const routes: Routes = [
  // Lazy-load a standalone component
  {
    path: 'weather',
    loadComponent: () =>
      import('./weather/weather.component').then(m => m.WeatherComponent)
  },
  // Lazy-load a whole feature with its own routes
  {
    path: 'admin',
    loadChildren: () =>
      import('./admin/admin.routes').then(m => m.adminRoutes)
  }
];
```

- `loadComponent` is for **standalone components** (the pattern this repo uses)
- `loadChildren` is for lazy-loading a whole **route subtree**
- Angular's build tooling automatically splits these into separate chunks at build time
- `canMatch` / `canLoad` guards can prevent even *downloading* the chunk if the user lacks permission

---

## Repo Architecture Summary

This project is a minimal but modern Angular 19 + .NET 9 starter. Key patterns to highlight in an interview:

| Feature | File |
|---|---|
| Standalone bootstrap (no NgModule) | `client/src/main.ts` |
| Functional DI with `inject()` | `client/src/app/app.ts:10` |
| Signals for state (`signal()`) | `client/src/app/app.ts:11-13` |
| `@if`/`@for` control flow syntax | `client/src/app/app.html:4,19` |
| `track` (replaces `trackBy`) | `client/src/app/app.html:19` |
| `provideZoneChangeDetection` + coalescing | `client/src/app/app.config.ts:10` |
| `provideHttpClient` + `provideRouter` | `client/src/app/app.config.ts:11-12` |
| Angular build served by ASP.NET Core | `Api/Program.cs:16-18`, `Api/wwwroot` |
| HTTP mock in unit tests (DI swap) | `client/src/app/app.spec.ts` |
