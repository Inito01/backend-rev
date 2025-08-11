import { jest } from '@jest/globals';

// Mock de modelo de usuario para pruebas
export const mockUser = {
  id: 1,
  name: 'Usuario Test',
  email: 'test@example.com',
  password: '$2b$10$abcdefghijklmnopqrstuv', // Hash ficticio
  role: 'user',
  validPassword: jest.fn(),
};

// Mock de token para pruebas
export const mockToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwibmFtZSI6IlVzdWFyaW8gVGVzdCIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNjI1MDY5NTIwfQ.mock_signature';

// Mock de datos de registro
export const mockRegisterData = {
  name: 'Nuevo Usuario',
  email: 'nuevo@example.com',
  password: 'Password123!',
};

// Mock de datos de login
export const mockLoginData = {
  email: 'test@example.com',
  password: 'Password123!',
};

// Mock de documento
export const mockDocument = {
  id: 1,
  fileName: 'test-document.pdf',
  fileType: 'application/pdf',
  filePath: '/uploads/test-document.pdf',
  status: 'pending',
  userId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Mock de resultado de análisis de documento
export const mockAnalysisResult = {
  id: 1,
  documentId: 1,
  patente: 'ABC123',
  marca: 'Toyota',
  modelo: 'Corolla',
  año: '2022',
  vencimiento: '2023-12-31',
  resultado: 'APROBADO',
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Mock de archivos para pruebas
export const mockFiles = [
  {
    fieldname: 'document',
    originalname: 'test-document.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    destination: './src/uploads',
    filename: '1625069520000-test-document.pdf',
    path: 'src/uploads/1625069520000-test-document.pdf',
    size: 12345,
  },
];

// Mock para req, res y next de Express
export const mockExpressParams = () => {
  const req = {
    body: {},
    params: {},
    query: {},
    user: {
      sub: 1,
      name: 'Usuario Test',
      email: 'test@example.com',
      role: 'user',
    },
    files: [],
  };

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    sendFile: jest.fn(),
    send: jest.fn(),
  };

  const next = jest.fn();

  return { req, res, next };
};
