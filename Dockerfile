# Etapa 1: Build (compila NestJS con Node.js y npm)
FROM node:18-alpine AS builder

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos necesarios
COPY package*.json ./
RUN npm install --production=false

COPY . .

# Compila el proyecto NestJS
RUN npm run build

# Etapa 2: Producción (solo archivos necesarios para ejecutar la app)
FROM node:18-alpine AS production

WORKDIR /app

# Solo copiamos node_modules y build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Expone el puerto usado por NestJS (ajústalo si usas otro)
EXPOSE 3000

# Inicia la aplicación
CMD ["node", "dist/main.js"]
