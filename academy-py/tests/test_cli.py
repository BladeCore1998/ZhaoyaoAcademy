from contextlib import redirect_stderr
from io import StringIO
import os
import unittest
from unittest.mock import patch

from app.__main__ import main


class StartupCommandTests(unittest.TestCase):
    def test_dev_enables_reload(self) -> None:
        with patch.dict(os.environ, {"ACADEMY_ENV": "prod"}):
            with patch("app.__main__.uvicorn.run") as run:
                main(["dev", "--host", "127.0.0.1", "--port", "8080"])
                self.assertEqual(os.environ["ACADEMY_ENV"], "dev")
                self.assertEqual(os.environ["TZ"], "Asia/Shanghai")
                self.assertEqual(run.call_args.args, ("app.main:app",))
                self.assertTrue(run.call_args.kwargs["reload"])
                self.assertTrue(run.call_args.kwargs["reload_dirs"])
                self.assertEqual(run.call_args.kwargs["host"], "127.0.0.1")
                self.assertEqual(run.call_args.kwargs["port"], 8080)
                self.assertEqual(run.call_args.kwargs["workers"], 1)

    def test_prod_disables_reload_and_overrides_development(self) -> None:
        with patch.dict(os.environ, {"ACADEMY_ENV": "development"}):
            with patch("app.__main__.uvicorn.run") as run:
                main(["prod", "--workers", "2"])
                self.assertEqual(os.environ["ACADEMY_ENV"], "prod")
                self.assertFalse(run.call_args.kwargs["reload"])
                self.assertIsNone(run.call_args.kwargs["reload_dirs"])
                self.assertEqual(run.call_args.kwargs["workers"], 2)

    def test_invalid_arguments_do_not_start_server(self) -> None:
        for args in (
            [],
            ["production"],
            ["dev", "--workers", "2"],
            ["prod", "--workers", "0"],
            ["prod", "--port", "0"],
            ["prod", "--port", "65536"],
        ):
            with self.subTest(args=args):
                with patch("app.__main__.uvicorn.run") as run:
                    with redirect_stderr(StringIO()):
                        with self.assertRaises(SystemExit) as raised:
                            main(args)
                    self.assertEqual(raised.exception.code, 2)
                    run.assert_not_called()
