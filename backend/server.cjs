// ... (imports)

// Middleware
app.use(cors({
// ... (CORS configuration)
}));
// Reduzindo o limite de 50mb para 1mb, já que o logo é pequeno e o resto é texto.
app.use(express.json({ limit: '1mb' })); 
app.set('trust proxy', 1);

// ... (rest of the file)