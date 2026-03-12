import random
import json
from locust import HttpUser, task, between, constant_pacing

MOVIE_IDS = ["1", "2", "3", "4", "5", "6"]

class BrowseUser(HttpUser):
    """Simulates users browsing movies — heaviest traffic"""
    weight = 3
    wait_time = between(1, 3)

    @task(5)
    def get_movies(self):
        self.client.get("/api/movies", name="/api/movies")

    @task(3)
    def get_shows(self):
        movie_id = random.choice(MOVIE_IDS)
        self.client.get(f"/api/shows/{movie_id}", name="/api/shows/[movieId]")

    @task(1)
    def get_homepage(self):
        self.client.get("/", name="/")


class SeatCheckerUser(HttpUser):
    """Simulates users checking seat availability"""
    weight = 2
    wait_time = between(1, 2)

    @task
    def check_seats(self):
        movie_id = random.choice(MOVIE_IDS)
        with self.client.get(f"/api/shows/{movie_id}", name="/api/shows/[movieId]", catch_response=True) as resp:
            if resp.status_code == 200:
                shows = resp.json()
                if shows:
                    show_id = random.choice(shows)["id"]
                    self.client.get(f"/api/seats/{show_id}", name="/api/seats/[showId]")


class BookingUser(HttpUser):
    """Simulates users completing bookings"""
    weight = 2
    wait_time = between(2, 5)

    @task
    def book_seats(self):
        movie_id = random.choice(MOVIE_IDS)
        with self.client.get(f"/api/shows/{movie_id}", name="/api/shows/[movieId]", catch_response=True) as resp:
            if resp.status_code == 200:
                shows = resp.json()
                if not shows:
                    return
                show = random.choice(shows)
                show_id = show["id"]

        with self.client.get(f"/api/seats/{show_id}", name="/api/seats/[showId]", catch_response=True) as resp:
            if resp.status_code == 200:
                seats = resp.json()
                available = [s["id"] for s in seats if s["status"] == "AVAILABLE"]
                if len(available) < 2:
                    return
                selected = random.sample(available, 2)
                payload = {"showId": show_id, "seats": selected}
                self.client.post("/api/book", json=payload, name="/api/book")


class ConcertRushUser(HttpUser):
    """Simulates Coldplay ticket rush — aggressive concurrent booking"""
    weight = 1
    wait_time = constant_pacing(0.5)

    @task
    def rush_book(self):
        # All rush users hammer the same show (show 1) — simulates single event spike
        with self.client.get("/api/shows/1", name="/api/shows/[movieId] RUSH", catch_response=True) as resp:
            if resp.status_code == 200:
                shows = resp.json()
                if not shows:
                    return
                show_id = shows[0]["id"]

        with self.client.get(f"/api/seats/{show_id}", name="/api/seats/[showId] RUSH", catch_response=True) as resp:
            if resp.status_code == 200:
                seats = resp.json()
                available = [s["id"] for s in seats if s["status"] == "AVAILABLE"]
                if len(available) < 2:
                    resp.failure("No seats available")
                    return
                selected = random.sample(available, 2)
                payload = {"showId": show_id, "seats": selected}
                self.client.post("/api/book", json=payload, name="/api/book RUSH")
