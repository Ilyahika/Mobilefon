"""Authoritative game catalogue and balance settings."""

PHONES = {
    "iphone5": dict(brand="Starter", name="iPhone 5", cam=24, perf=18, value=28_000, rarity=0, starter=True),
    "poco_m5": dict(brand="POCO", name="POCO M5", cam=42, perf=45, value=38_000, rarity=0),
    "poco_x5": dict(brand="POCO", name="POCO X5 Pro", cam=57, perf=62, value=62_000, rarity=1),
    "poco_f5": dict(brand="POCO", name="POCO F5 Pro", cam=65, perf=76, value=88_000, rarity=2),
    "poco_f6pro": dict(brand="POCO", name="POCO F6 Pro", cam=75, perf=89, value=125_000, rarity=3, flagship=True),
    "poco_f7ultra": dict(brand="POCO", name="POCO F7 Ultra", cam=84, perf=96, value=175_000, rarity=4, flagship=True),
    "xiaomi_12t": dict(brand="Xiaomi", name="Xiaomi 12T", cam=58, perf=65, value=68_000, rarity=0),
    "xiaomi_13t": dict(brand="Xiaomi", name="Xiaomi 13T Pro", cam=68, perf=77, value=105_000, rarity=1),
    "xiaomi_14t": dict(brand="Xiaomi", name="Xiaomi 14T Pro", cam=78, perf=86, value=145_000, rarity=2),
    "xiaomi_13u": dict(brand="Xiaomi", name="Xiaomi 13 Ultra", cam=88, perf=84, value=185_000, rarity=3, flagship=True),
    "xiaomi_14u": dict(brand="Xiaomi", name="Xiaomi 14 Ultra", cam=94, perf=91, value=245_000, rarity=4, flagship=True),
    "xiaomi_15u": dict(brand="Xiaomi", name="Xiaomi 15 Ultra", cam=98, perf=97, value=310_000, rarity=4, flagship=True),
    "pixel_7a": dict(brand="Pixel", name="Google Pixel 7a", cam=63, perf=55, value=75_000, rarity=0),
    "pixel_8a": dict(brand="Pixel", name="Google Pixel 8a", cam=70, perf=64, value=98_000, rarity=1),
    "pixel_9": dict(brand="Pixel", name="Google Pixel 9", cam=79, perf=76, value=145_000, rarity=2),
    "pixel_7pro": dict(brand="Pixel", name="Google Pixel 7 Pro", cam=86, perf=74, value=165_000, rarity=3, flagship=True),
    "pixel_8pro": dict(brand="Pixel", name="Google Pixel 8 Pro", cam=92, perf=83, value=225_000, rarity=3, flagship=True),
    "pixel_9pro": dict(brand="Pixel", name="Google Pixel 9 Pro XL", cam=97, perf=91, value=285_000, rarity=4, flagship=True),
    "samsung_a15": dict(brand="Samsung", name="Galaxy A15", cam=41, perf=38, value=42_000, rarity=0),
    "samsung_a35": dict(brand="Samsung", name="Galaxy A35", cam=58, perf=54, value=68_000, rarity=1),
    "samsung_a55": dict(brand="Samsung", name="Galaxy A55", cam=66, perf=63, value=92_000, rarity=2),
    "samsung_s21u": dict(brand="Samsung", name="Galaxy S21 Ultra", cam=84, perf=77, value=145_000, rarity=3, flagship=True),
    "samsung_s22u": dict(brand="Samsung", name="Galaxy S22 Ultra", cam=89, perf=84, value=185_000, rarity=3, flagship=True),
    "samsung_s23u": dict(brand="Samsung", name="Galaxy S23 Ultra", cam=94, perf=91, value=245_000, rarity=4, flagship=True),
    "samsung_s24u": dict(brand="Samsung", name="Galaxy S24 Ultra", cam=98, perf=97, value=315_000, rarity=4, flagship=True),
    "iphone_11": dict(brand="iPhone", name="iPhone 11", cam=58, perf=58, value=82_000, rarity=0),
    "iphone_13": dict(brand="iPhone", name="iPhone 13", cam=72, perf=74, value=135_000, rarity=1),
    "iphone_14plus": dict(brand="iPhone", name="iPhone 14 Plus", cam=79, perf=81, value=175_000, rarity=2),
    "iphone_11pm": dict(brand="iPhone", name="iPhone 11 Pro Max", cam=76, perf=72, value=155_000, rarity=3, flagship=True),
    "iphone_12pm": dict(brand="iPhone", name="iPhone 12 Pro Max", cam=82, perf=80, value=195_000, rarity=3, flagship=True),
    "iphone_13pm": dict(brand="iPhone", name="iPhone 13 Pro Max", cam=88, perf=87, value=245_000, rarity=3, flagship=True),
    "iphone_14pm": dict(brand="iPhone", name="iPhone 14 Pro Max", cam=94, perf=92, value=310_000, rarity=4, flagship=True),
    "iphone_15pm": dict(brand="iPhone", name="iPhone 15 Pro Max", cam=99, perf=99, value=390_000, rarity=4, flagship=True),
}

PHONE_CASES = {
    "POCO": {"price": 65_000},
    "Xiaomi": {"price": 105_000},
    "Pixel": {"price": 145_000},
    "Samsung": {"price": 210_000},
    "iPhone": {"price": 295_000},
}

NUMBER_CASES = {
    "simple": {"price": 15_000, "boost": (1.0, 3.0)},
    "pretty": {"price": 75_000, "boost": (3.0, 8.0)},
    "business": {"price": 350_000, "boost": (8.0, 18.0)},
}

TOPICS = [
    ("Юмор", 1.08),
    ("Технологии", 1.16),
    ("Игры", 1.12),
    ("Лайфстайл", 1.0),
    ("Обзор телефона", 1.22),
]

RARITY_MULTIPLIERS = (1.0, 1.18, 1.45, 1.85, 2.5)
