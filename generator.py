import argparse
import json
import math
import random
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone


def parse_args():
    parser = argparse.ArgumentParser(description="Generator danych IoT")
    parser.add_argument("--url", required=True, help="Adres API, np. http://localhost:3000/api/measurements")
    parser.add_argument("--api-key", required=True, help="Klucz API czujnika")
    parser.add_argument("--mode", choices=["past", "live"], default="past", help="Tryb: past lub live")
    parser.add_argument("--count", type=int, default=15, help="Liczba punktów (dla mode=past)")
    parser.add_argument("--interval", type=float, default=5.0, help="Odstęp czasu w sekundach")
    parser.add_argument("--pattern", choices=["random", "sine"], default="random", help="Przebieg wartości")
    parser.add_argument("--min", type=float, default=18.0, help="Zakres min")
    parser.add_argument("--max", type=float, default=26.0, help="Zakres max")
    parser.add_argument("--force-value", type=float, help="Wymuś konkretną wartość (do testu walidacji F4)")
    return parser.parse_args()
3

def generate_val(i, min_v, max_v, pattern):
    if pattern == "sine":
        mid = (min_v + max_v) / 2.0
        amp = (max_v - min_v) / 2.0
        return round(mid + amp * math.sin(i * 0.5), 2)
    return round(random.uniform(min_v, max_v), 2)


def send(url, key, timestamp, value):
    payload = json.dumps({"timestamp": timestamp, "value": value}).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json", "X-API-Key": key},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"[{resp.status}] Wysłano: {timestamp} -> {value}")
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        if e.code == 422:
            print(f"[ODRZUCONO - 422 (F4)] Wartość {value} spoza przedziału min/max: {err_body}")
        else:
            print(f"[BŁĄD {e.code}] {err_body}")
    except Exception as e:
        print(f"[BŁĄD POŁĄCZENIA] {e}")


def main():
    args = parse_args()

    if args.force_value is not None:
        send(args.url, args.api_key, datetime.now(timezone.utc).isoformat(), args.force_value)
        return

    if args.mode == "past":
        start = datetime.now(timezone.utc) - timedelta(seconds=args.count * args.interval)
        for i in range(args.count):
            ts = (start + timedelta(seconds=i * args.interval)).isoformat()
            val = generate_val(i, args.min, args.max, args.pattern)
            send(args.url, args.api_key, ts, val)
    else:
        i = 0
        print("Wysyłanie na żywo (Ctrl+C aby przerwać)...")
        try:
            while True:
                ts = datetime.now(timezone.utc).isoformat()
                val = generate_val(i, args.min, args.max, args.pattern)
                send(args.url, args.api_key, ts, val)
                i += 1
                time.sleep(args.interval)
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()