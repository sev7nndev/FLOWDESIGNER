const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const sanitizeHtml = require('sanitize-html');
const mercadopago = require('mercadopago');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// --- Configuração de CORS Restrita ---
const ALLOWED_ORIGINS = [
  'http://localhost:3000', 
  'https://ai.studio', // Domínio de desenvolvimento/produção
  // Adicione o domínio de produção aqui
];

app.use(cors({
  origin: (origin, callback) => {
    // Permite requisições sem 'origin' (como ferramentas CLI ou requisições do mesmo servidor)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'DELETE', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Reduzindo o limite de 50mb para 1mb, já que o logo é pequeno e o resto é texto.
app.use(express.json({ limit: '1mb' })); 
app.set('trust proxy', 1);

// ... (rest of the file)