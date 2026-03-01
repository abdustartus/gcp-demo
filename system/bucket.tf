resource "google_storage_bucket" "example" {
  name          = "sid-gcp-demo-bucket"
  location      = "US"
  force_destroy = true
}
