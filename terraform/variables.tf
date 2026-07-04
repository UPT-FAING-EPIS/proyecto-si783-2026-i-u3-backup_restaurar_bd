variable "resource_group_name" {
  type    = string
  default = "rg-safebridge-prod"
}

variable "location" {
  type    = string
  default = "East US"
}

variable "app_service_plan_name" {
  type    = string
  default = "asp-safebridge-linux"
}

variable "web_app_name" {
  type    = string
  default = "app-safebridge-web"
}

variable "docker_image" {
  type        = string
  description = "La imagen de Docker a desplegar (eg. ghcr.io/usuario/safebridge:latest)"
}

variable "database_url" {
  type        = string
  description = "URL de la base de datos"
  sensitive   = true
}
