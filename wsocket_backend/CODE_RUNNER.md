# Code Runner Setup

The editor backend never runs code with `child_process`. It proxies code execution
to a Piston-compatible API through `CODE_RUNNER_URL`.

## Recommended Local Setup

The public Piston API can allow `/runtimes` but reject `/execute` with `401`.
For reliable local development, run your own Piston container:

First make sure Docker Desktop is running.

From the project root:

```powershell
docker compose -f docker-compose.piston.yml up -d
```

Or from `wsocket_backend`:

```powershell
docker compose -f ..\docker-compose.piston.yml up -d
```

Then set this in `wsocket_backend/.env`:

```env
CODE_RUNNER_URL=http://localhost:2000/api/v2
```

## Install Runtimes

The Piston API starts with no language runtimes installed. Install the languages
used by this app through Piston's package API.

Piston package names are not always the same as editor language names:

- `gcc` provides `c` and `cpp`
- `node` provides `javascript`
- `typescript` provides `typescript`
- `python` provides `python`

```powershell
$packagesToInstall = @(
  @{ language = "gcc"; version = "10.2.0" },
  @{ language = "node"; version = "20.11.1" },
  @{ language = "typescript"; version = "5.0.3" },
  @{ language = "python"; version = "3.10.0" }
)

foreach ($package in $packagesToInstall) {
  Invoke-RestMethod `
    -Method POST `
    -ContentType "application/json" `
    -Uri http://localhost:2000/api/v2/packages `
    -Body (@{
      language = $package.language
      version = $package.version
    } | ConvertTo-Json)
}
```

After install, confirm:

```powershell
Invoke-RestMethod http://localhost:2000/api/v2/runtimes
```

The app supports:

- `c`
- `cpp`
- `javascript`
- `typescript`
- `python`
