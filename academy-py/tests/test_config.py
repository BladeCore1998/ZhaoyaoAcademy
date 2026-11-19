import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from pydantic import ValidationError

from app.config import Settings


class SettingsTests(unittest.TestCase):
    def test_default_environment_is_production(self) -> None:
        with patch.dict(os.environ, {}, clear=True):
            settings = Settings(_env_file=None)
        self.assertEqual(settings.env, "prod")
        self.assertFalse(settings.is_development)

    def test_supported_environment_names(self) -> None:
        for value, expected in (
            ("dev", "dev"),
            ("development", "dev"),
            ("prod", "prod"),
            ("production", "prod"),
        ):
            with self.subTest(value=value):
                with patch.dict(os.environ, {"ACADEMY_ENV": value}, clear=True):
                    settings = Settings(_env_file=None)
                self.assertEqual(settings.env, expected)
                self.assertEqual(settings.is_development, expected == "dev")

    def test_invalid_environment_fails_validation(self) -> None:
        for value in ("", "prd", "staging"):
            with self.subTest(value=value):
                with patch.dict(os.environ, {"ACADEMY_ENV": value}, clear=True):
                    with self.assertRaises(ValidationError):
                        Settings(_env_file=None)

    def test_environment_overrides_dotenv(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            env_file = Path(directory) / ".env"
            env_file.write_text("ACADEMY_ENV=development\n", encoding="utf-8")
            with patch.dict(os.environ, {}, clear=True):
                self.assertTrue(Settings(_env_file=env_file).is_development)
            with patch.dict(os.environ, {"ACADEMY_ENV": "prod"}, clear=True):
                self.assertFalse(Settings(_env_file=env_file).is_development)
