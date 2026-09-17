import unittest
from datetime import datetime
from zoneinfo import ZoneInfo
from scripts.notification_window import resolve_mode


class NotificationWindowTest(unittest.TestCase):
    def at(self, hour, minute=0):
        return datetime(2026, 9, 6, hour, minute, tzinfo=ZoneInfo("Asia/Kolkata"))

    def test_observed_delayed_morning_run(self):
        self.assertEqual(resolve_mode("Auto", "30 1 * * *", self.at(11, 50)), ("Good Morning", 600))

    def test_observed_delayed_special_day_run(self):
        self.assertEqual(resolve_mode("Auto", "30 3 * * *", self.at(13, 33)), ("Special Day", 16020))

    def test_no_afternoon_greeting_even_for_manual_runs(self):
        for mode in ("Auto", "Good Morning"):
            self.assertEqual(resolve_mode(mode, "30 1 * * *", self.at(12))[1], 0)

    def test_special_day_expires_before_evening(self):
        self.assertEqual(resolve_mode("Special Day", "", self.at(17, 59))[1], 60)
        self.assertEqual(resolve_mode("Special Day", "", self.at(18))[1], 0)

    def test_before_window_and_unknown_mode(self):
        self.assertEqual(resolve_mode("Good Morning", "", self.at(4))[1], 0)
        self.assertEqual(resolve_mode("Special Day", "", self.at(7))[1], 0)
        with self.assertRaises(ValueError):
            resolve_mode("invalid", "", self.at(9))


if __name__ == "__main__":
    unittest.main()
