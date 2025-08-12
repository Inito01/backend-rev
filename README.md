# Backend para análisis de Documentos.

Este es el backend para la aplicación de análisis de documentos de revisiones técnicas.

## Requisitos Previos

Asegúrate de tener instalados los siguientes programas:

- [Node.js](https://nodejs.org/)
- [Docker](https://www.docker.com/products/docker-desktop/)

## Configuración

1.  **Clona el repositorio:**
    ```bash
    git clone <URL-DEL-REPOSITORIO>
    cd backend-rev
    ```

2.  **Crea una cuenta en OCR.space:**
    Necesitarás una API key del servicio de OCR.space.
    - Ve a [https://ocr.space/ocrapi](https://ocr.space/ocrapi) y regístrate para obtener una API key gratuita.

3.  **Configura las variables de entorno:**
    Crea un archivo `.env` en la raíz del directorio `backend-rev` y añade la siguiente variable:
    ```
    OCR_API_KEY=TU_API_KEY_DE_OCR_SPACE
    ```
    Reemplaza `TU_API_KEY_DE_OCR_SPACE` con la clave que obtuviste en el paso anterior.

## Cómo levantar el servicio standalone

Asegurate de instalar las dependencias:

```bash
npm install
```

Puedes levantar el servicio utilizando:

```bash
npm run dev
```

El backend estará corriendo en `http://localhost:8000`.

## Cómo levantar ambos servicios (Backend y Frontend) || Recomendado

El archivo `docker-compose.yml` en este directorio está configurado para levantar tanto el backend como el frontend.

1.  **Asegúrate de que la estructura de carpetas sea la siguiente:**
    ```
    /tu-proyecto
    |-- /backend-rev
    |-- /frontend-rev
    ```

2.  **Desde la carpeta `backend-rev`, ejecuta:**
    ```bash
    docker-compose up -d --build
    ```

Esto iniciará ambos contenedores. El frontend estará disponible en `http://localhost:3000` y se comunicará con el backend.

## Tests

Para correr las pruebas unitarias, puedes usar los siguientes comandos:

-   **Correr todos los tests una vez:**
    ```bash
    npm test
    ```

-   **Correr los tests y generar un reporte de cobertura:**
    ```bash
    npm run test:coverage
    ```

```
--------------------------------|---------|----------|---------|---------|---------------------------
File                            | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------------------------------|---------|----------|---------|---------|---------------------------
All files                       |   86.14 |    88.99 |    92.3 |   86.03 |
 config                         |     100 |      100 |     100 |     100 |
  database.js                   |     100 |      100 |     100 |     100 |
 controllers/auth               |     100 |      100 |     100 |     100 |
  authController.js             |     100 |      100 |     100 |     100 |
 controllers/document           |   90.56 |      100 |     100 |   90.56 |
  documentController.js         |   90.56 |      100 |     100 |   90.56 | 47,95,136,177,205
 domain/services/auth           |     100 |       80 |     100 |     100 |
  authService.js                |     100 |       80 |     100 |     100 | 6-7
 domain/services/document       |     100 |      100 |     100 |     100 |
  documentService.js            |     100 |      100 |     100 |     100 |
 domain/services/document/queue |   89.47 |    66.66 |     100 |   89.47 |
  documentQueue.js              |   89.47 |    66.66 |     100 |   89.47 | 37,63,132-136
 infraestructure/repositories   |   70.96 |    28.57 |     100 |   70.96 |
  documentRepository.js         |   52.63 |    28.57 |     100 |   52.63 | 9-10,19,34-35,55-56,75-76
  userRepository.js             |     100 |      100 |     100 |     100 |
 infraestructure/upload         |   69.23 |      100 |   33.33 |   69.23 |
  multerConfig.js               |   69.23 |      100 |   33.33 |   69.23 | 12-17
 middlewares                    |     100 |    92.85 |     100 |     100 |
  authMiddleware.js             |     100 |    91.66 |     100 |     100 | 33
  errorHandler.js               |     100 |    93.75 |     100 |     100 | 56
 routes                         |       0 |      100 |       0 |       0 |
  authRoutes.js                 |       0 |      100 |     100 |       0 | 5-10
  documentRoutes.js             |       0 |      100 |       0 |       0 | 7-58
--------------------------------|---------|----------|---------|---------|---------------------------

Test Suites: 12 passed, 12 total
Tests:       75 passed, 75 total
Snapshots:   0 total
Time:        2.871 s, estimated 3 s
```