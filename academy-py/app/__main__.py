import argparse
import os
from pathlib import Path

import uvicorn


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="Run the academy-py service.")
    parser.add_argument("mode", choices=("dev", "prod"))
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--workers", type=int, default=1)
    args = parser.parse_args(argv)
    if not 1 <= args.port <= 65535:
        parser.error("--port must be between 1 and 65535")
    if args.workers < 1:
        parser.error("--workers must be at least 1")
    if args.mode == "dev" and args.workers != 1:
        parser.error("--workers is only supported in prod mode")

    # Explicit startup mode takes precedence over inherited environment and .env.
    os.environ["ACADEMY_ENV"] = args.mode
    os.environ["TZ"] = "Asia/Shanghai"
    uvicorn.run(
        "app.main:app",
        host=args.host,
        port=args.port,
        reload=args.mode == "dev",
        reload_dirs=[str(Path(__file__).resolve().parent)]
        if args.mode == "dev"
        else None,
        workers=args.workers,
        log_level="info",
        access_log=True,
        use_colors=False,
    )


if __name__ == "__main__":
    main()
