data "terraform_remote_state" "network_details" {
  backend = "gcs"

  config = {
    bucket      = "sid-gcp-demo-bucket" # GCS bucket name
    prefix      = "networking"          # Path to the remote state file
    credentials = "/home/sudhanshu_53131e05_5784_4e23_81c/gcp.json"
  }
}

resource "google_compute_instance" "my_vm" {
  name         = "sid-instance"
  machine_type = "e2-micro"
  zone         = "us-east1-b"

  boot_disk {
    initialize_params {

      image = "ubuntu-os-cloud/ubuntu-2204-lts"
    }
  }
  network_interface {
    network    = data.terraform_remote_state.network_details.outputs.network_name
    subnetwork = data.terraform_remote_state.network_details.outputs.subnetwork_name
    access_config {}
  }

  /* metadata = {
    Name = "sid-instance"
    "ssh-keys" = "ubuntu:${file("/home/amit/gcp/terraform_base/networking/keys/vmkey.pub")}"  
  }
*/
  tags = ["sid-instance"]
}
