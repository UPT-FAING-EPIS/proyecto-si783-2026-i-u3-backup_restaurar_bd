output "webapp_url" {
  value       = azurerm_linux_web_app.app.default_hostname
  description = "The default hostname of the SafeBridge web app."
}
