import json
import os
from pathlib import Path
import socket
import subprocess
import sys
import tempfile
import time
import unittest
from urllib.error import HTTPError, URLError
from urllib.request import ProxyHandler, build_opener


class ServerTests:
    mode: str

    @classmethod
    def setUpClass(cls) -> None:
        with socket.socket() as listener:
            listener.bind(("127.0.0.1", 0))
            port = listener.getsockname()[1]

        cls.base_url = f"http://127.0.0.1:{port}"
        cls.client = build_opener(ProxyHandler({}))
        cls.logs = tempfile.TemporaryFile()
        cls.addClassCleanup(cls.logs.close)
        command = (
            [sys.executable, "-m", "app", "prod"]
            if cls.mode == "prod"
            else [sys.executable, "-m", "uvicorn", "app.main:app", "--no-use-colors"]
        )
        cls.server = subprocess.Popen(
            [*command, "--host", "127.0.0.1", "--port", str(port)],
            cwd=Path(__file__).resolve().parents[1],
            env={
                **os.environ,
                "TZ": "Asia/Shanghai",
                "ACADEMY_ENV": "development",
            },
            stdout=cls.logs,
            stderr=subprocess.STDOUT,
        )
        cls.addClassCleanup(cls.stop_server)
        deadline = time.monotonic() + 20
        while time.monotonic() < deadline and cls.server.poll() is None:
            try:
                with cls.client.open(f"{cls.base_url}/api/v1/health", timeout=1):
                    return
            except (OSError, URLError):
                time.sleep(0.1)

        cls.stop_server()
        cls.logs.seek(0)
        raise RuntimeError(cls.logs.read().decode("utf-8", errors="replace"))

    @classmethod
    def stop_server(cls) -> None:
        if cls.server.poll() is None:
            cls.server.terminate()
            try:
                cls.server.wait(timeout=5)
            except subprocess.TimeoutExpired:
                cls.server.kill()
                cls.server.wait(timeout=5)

    def test_health(self) -> None:
        with self.client.open(f"{self.base_url}/api/v1/health", timeout=3) as response:
            self.assertEqual(response.status, 200)
            self.assertEqual(
                json.load(response), {"service": "academy-py", "status": "ok"}
            )

    def test_routes(self) -> None:
        with self.client.open(f"{self.base_url}/api/v1/routes", timeout=3) as response:
            self.assertEqual(
                json.load(response),
                {
                    "reserved": [
                        "/api/v1/health",
                        "/api/v1/transform",
                        "/api/v1/middleware",
                    ]
                },
            )

    def test_reserved_routes_are_not_implemented(self) -> None:
        for route in ("/api/v1/transform", "/api/v1/middleware"):
            with self.subTest(route=route):
                with self.assertRaises(HTTPError) as raised:
                    self.client.open(f"{self.base_url}{route}", timeout=3)
                self.assertEqual(raised.exception.code, 404)


class DevStartupTests(ServerTests, unittest.TestCase):
    mode = "dev"

    def test_openapi(self) -> None:
        with self.client.open(f"{self.base_url}/openapi.json", timeout=3) as response:
            schema = json.load(response)
            self.assertEqual(
                set(schema["paths"]), {"/api/v1/health", "/api/v1/routes"}
            )
            self.assertEqual(schema["info"]["version"], "0.1.0")
            self.assertEqual(
                schema["components"]["schemas"]["ServiceStatus"]["required"],
                ["service", "status"],
            )

    def test_docs(self) -> None:
        with self.client.open(f"{self.base_url}/docs", timeout=3) as response:
            self.assertEqual(response.status, 200)
            self.assertIn(b"swagger-ui", response.read())

    def test_redoc(self) -> None:
        with self.client.open(f"{self.base_url}/redoc", timeout=3) as response:
            self.assertEqual(response.status, 200)
            self.assertIn(b"redoc", response.read())

    def test_oauth_redirect(self) -> None:
        with self.client.open(
            f"{self.base_url}/docs/oauth2-redirect", timeout=3
        ) as response:
            self.assertEqual(response.status, 200)


class ProdStartupTests(ServerTests, unittest.TestCase):
    mode = "prod"

    def test_documentation_endpoints_are_not_exposed(self) -> None:
        for route in ("/openapi.json", "/docs", "/redoc", "/docs/oauth2-redirect"):
            with self.subTest(route=route):
                with self.assertRaises(HTTPError) as raised:
                    with self.client.open(f"{self.base_url}{route}", timeout=3):
                        pass
                self.assertEqual(raised.exception.code, 404)
