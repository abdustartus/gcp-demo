terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "6.8.0"
    }
  }
}

provider "google" {
  credentials = file("/home/sudhanshu_53131e05_5784_4e23_81c/gcp.json")
  project     = "upgradlabs-1749732689320"
  region      = "us-central1"
} #
