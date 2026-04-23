# angular-dot-net

Angular frontend served as static files by an ASP.NET Core Web API backend (weather template).

## Run locally

1. Build Angular into ASP.NET Core `wwwroot`:

```bash
cd /home/runner/work/angular-dot-net/angular-dot-net/client
npm install
npm run build
```

2. Run the .NET API (which also serves Angular):

```bash
cd /home/runner/work/angular-dot-net/angular-dot-net/Api
dotnet run
```

Then open the URL shown by `dotnet run` (for example `https://localhost:5001`).

## API endpoint

- `GET /weatherforecast`
