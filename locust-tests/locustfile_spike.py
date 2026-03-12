from locust import HttpUser, task, between
from locust import LoadTestShape
import random

MOVIE_IDS = ["1", "2", "3", "4", "5", "6"]

class BookMyShowUser(HttpUser):
    wait_time = between(1, 3)

    @task(5)
    def browse_movies(self):
        self.client.get("/api/movies", name="/api/movies")

    @task(3)
    def view_shows(self):
        movie_id = random.choice(MOVIE_IDS)
        self.client.get(f"/api/shows/{movie_id}", name="/api/shows/[movieId]")

    @task(1)
    def view_homepage(self):
        self.client.get("/", name="/")

class SpikeShape(LoadTestShape):
    stages = [
        {"duration": 60,  "users": 100,  "spawn_rate": 10},
        {"duration": 180, "users": 1000, "spawn_rate": 50},
        {"duration": 240, "users": 0,    "spawn_rate": 50},
    ]

    def tick(self):
        run_time = self.get_run_time()
        for stage in self.stages:
            if run_time < stage["duration"]:
                return stage["users"], stage["spawn_rate"]
        return None
