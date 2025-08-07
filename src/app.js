import express from 'express';
import dotenv from 'dotenv';
import documentRoutes from './routes/documentRoutes.js';
import errorHandler from './middlewares/errorHandlers.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.get('/', (req, res) => {
  res.send('Testeo de backend');
});

app.use('/api/documents', documentRoutes);

// Handler global de errores
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
