import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react({
            babel: {
                plugins: [['babel-plugin-react-compiler']],
            },
        }),
    ],
    server: {
        port: 3000, // <-- Set your desired port here
        strictPort: true, // <-- Prevent fallback to another port if 3000 is busy
    },
})
