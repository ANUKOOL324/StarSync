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

Or from `Starsync_backend`:

```powershell
docker compose -f ..\docker-compose.piston.yml up -d
```

Then set this in `Starsync_backend/.env`:

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

## Common Issues

### Docker Desktop is not running

On Windows, this error usually means Docker Desktop is closed or still starting:

```txt
open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified
```

Open Docker Desktop, wait for the engine to start, then run:

```powershell
docker compose -f docker-compose.piston.yml up -d
```

### Code runner is unavailable

If the editor shows `Code runner is currently unavailable`, check that:

1. Docker Desktop is running.
2. The Piston container is running.
3. `CODE_RUNNER_URL` points to `http://localhost:2000/api/v2`.

```powershell
docker compose -f docker-compose.piston.yml ps
Invoke-RestMethod http://localhost:2000/api/v2/runtimes
```

### C++ timeout

C++ is supported, but compiling large C++ files inside Docker Desktop can be slow.
For demos, use lightweight starter code:

```cpp
#include <iostream>
using namespace std;

int main() {
    cout << "hello" << endl;
    return 0;
}
```

Very heavy C++ code may timeout. That is expected for this local runner setup,
and the API should return a clean error instead of exposing backend internals.
