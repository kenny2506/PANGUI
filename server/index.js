const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { PORT } = require('./config');
const { login } = require('./auth');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// API Routes
app.post('/api/login', login);

// Socket.io
io.on('connection', (socket) => {
    // console.log('Nueva conexión:', socket.id);

    socket.on('join-agent', (data) => {
        // data esperada: { hostname: 'server1' }
        console.log(`Agente conectado: ${data?.hostname} (${socket.id})`);
        socket.join('agents');
    });

    socket.on('join-client', () => {
        console.log(`Cliente Web conectado (${socket.id})`);
        socket.join('clients');
    });

    socket.on('metrics', (data) => {
        // Broadcast a todos los clientes conectados
        // data: { hostname, cpu, ram, disk, services, timestamp }
        io.to('clients').emit('server-update', data);
    });

    socket.on('disconnect', () => {
        // Si fuera un agente, podríamos notificar desconexión
        // Por ahora lo dejamos simple
    });
});

server.listen(PORT, () => {
    console.log(`Servidor Pangui corriendo en http://localhost:${PORT}`);
});
