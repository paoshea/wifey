#!/usr/bin/env node

const net = require('net');
const { spawn } = require('child_process');

function findAvailablePort(startPort) {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.unref();
        server.on('error', () => {
            findAvailablePort(startPort + 1).then(resolve, reject);
        });
        server.listen(startPort, '0.0.0.0', () => {
            const { port } = server.address();
            server.close(() => {
                resolve(port);
            });
        });
    });
}

async function startServer() {
    try {
        // Find an available port
        const port = await findAvailablePort(3000);
        console.log(`Starting server on port ${port}...`);

        // Set environment variables for the port
        process.env.PORT = port;
        process.env.NEXTAUTH_URL = `http://localhost:${port}`;
        process.env.NEXT_PUBLIC_APP_URL = `http://localhost:${port}`;

        // Start the Next.js server with the available port
        const server = spawn('next', ['start', '-p', port.toString(), '-H', '0.0.0.0'], {
            stdio: 'inherit',
            env: {
                ...process.env,
                PORT: port.toString(),
                NEXTAUTH_URL: `http://localhost:${port}`,
                NEXT_PUBLIC_APP_URL: `http://localhost:${port}`
            }
        });

        // Handle server process events
        server.on('error', (error) => {
            console.error('Failed to start server:', error);
            process.exit(1);
        });

        process.on('SIGINT', () => {
            server.kill('SIGINT');
            process.exit(0);
        });

        process.on('SIGTERM', () => {
            server.kill('SIGTERM');
            process.exit(0);
        });

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
