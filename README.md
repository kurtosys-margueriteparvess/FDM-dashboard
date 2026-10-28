# Fund Data Management: Overview prototype

Static prototype (HTML, CSS, JS; no build step). All data is invented.

- Scenario toggle: the quiet "Prototype view" bar at the very top. `?scenario=nodata` and `?date=YYYY-MM-DD` are honoured in the URL.
- Run locally: `python3 -m http.server 8000`, then open http://localhost:8000

## Publish to a private GitHub repo

```bash
cd fdm-overview-prototype
git init -b main
git add .
git commit -m "FDM overview prototype"
gh repo create <org-or-user>/fdm-overview-prototype --private --source=. --push
```

## Host it with GitHub Pages

1. Repo, Settings, Pages, Build and deployment, Source: **GitHub Actions**.
2. Push to `main`. The workflow in `.github/workflows/pages.yml` deploys it.
3. The URL appears in the workflow run and under Settings, Pages.

Pages from a private repo needs GitHub Pro, Team or Enterprise Cloud. Only Enterprise Cloud
can limit the site to org members; on other plans the published site is public even though the repo is private.
`index.html` carries `noindex`, which keeps search engines away but is not access control.
