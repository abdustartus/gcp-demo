terraform {
  backend "gcs" {
    bucket      = "sid-gcp-demo-bucket"
    prefix      = "vm"
    credentials = "/home/sudhanshu_53131e05_5784_4e23_81c/gcp.json"
  }
}
