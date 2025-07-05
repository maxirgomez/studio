const { testPostgresConnection } = require("./src/lib/pg-test");

// Ejecuta la función de prueba de conexión
(async () => {
  await testPostgresConnection();
})(); 