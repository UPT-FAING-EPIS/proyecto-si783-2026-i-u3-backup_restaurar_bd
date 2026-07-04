Feature: Gestión de Backup de Base de Datos
  Como administrador de bases de datos
  Quiero poder crear y restaurar backups
  Para garantizar la integridad y disponibilidad de los datos

  Scenario: Crear un backup exitoso
    Given el usuario tiene una conexión activa a la base de datos
    When el usuario solicita crear un backup de tipo "full"
    Then el sistema genera un archivo de backup con extensión ".sql"
    And el sistema muestra un mensaje de confirmación

  Scenario: Restaurar un backup existente
    Given el usuario tiene un archivo de backup válido
    When el usuario selecciona restaurar el backup
    Then el sistema restaura los datos en la base de datos destino
    And el sistema muestra el progreso de la restauración

  Scenario: Conexión fallida a la base de datos
    Given el usuario ingresa credenciales incorrectas
    When el usuario intenta conectarse a la base de datos
    Then el sistema muestra un mensaje de error de conexión
