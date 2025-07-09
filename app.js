const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Configure uploads
const UPLOAD_FOLDER = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_FOLDER)) {
    fs.mkdirSync(UPLOAD_FOLDER);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_FOLDER);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); // Or use a more secure filename strategy
    }
});
const upload = multer({ storage: storage });

// Initialize database
function initDb() {
    const db = new sqlite3.Database('database.db');
    db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS cadastros (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT,
                data_nascimento TEXT,
                sexo TEXT,
                nome_pai TEXT,
                nome_mae TEXT,
                cpf TEXT,
                rg TEXT,
                titulo_eleitor TEXT,
                telefone TEXT,
                email TEXT,
                endereco TEXT,
                inscricao_imobiliaria TEXT,
                vinculo_imovel TEXT,
                documentacao_nome TEXT
            )
        `);
    });
    db.close();
}

// Middleware to parse URL-encoded bodies (for form data)
app.use(express.urlencoded({ extended: true }));
// Middleware to serve static files (like your form.html)
app.use(express.static('public')); // Assuming your form.html is in a 'public' directory

// Route for the form submission
app.post('/', upload.single('documentacao'), (req, res) => {
    const dados = req.body;
    const file = req.file;

    if (!file) {
        return res.status(400).send('No file uploaded.');
    }

    const filename = file.originalname;

    const db = new sqlite3.Database('database.db');
    db.run(`
        INSERT INTO cadastros (
            nome, data_nascimento, sexo, nome_pai, nome_mae, cpf, rg,
            titulo_eleitor, telefone, email, endereco,
            inscricao_imobiliaria, vinculo_imovel, documentacao_nome
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        dados.nome, dados.dataNascimento, dados.sexo, dados.nomePai, dados.nomeMae,
        dados.cpf, dados.rg, dados.tituloEleitor, dados.telefone, dados.email,
        dados.endereco, dados.inscricao, dados.vinculo, filename
    ], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).send("Error saving data.");
        }
        res.send("Cadastro realizado com sucesso!");
    });
    db.close();
});

// Serve the HTML form
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'form.html'));
});

// Start the server
app.listen(PORT, () => {
    initDb(); // Initialize DB when server starts
    console.log(`Server running on http://localhost:${PORT}`);
});