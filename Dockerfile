# ================================
# MULTI-STAGE DOCKERFILE
# ================================

# --------------------------------
# Stage 1: Base
# --------------------------------
FROM node:18-alpine AS base

# Instalar dependencias del sistema
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl \
    tzdata

# Configurar zona horaria para Perú
ENV TZ=America/Lima
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Crear usuario no root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración
COPY --chown=nextjs:nodejs package*.json ./
COPY --chown=nextjs:nodejs tsconfig*.json ./
COPY --chown=nextjs:nodejs nest-cli.json ./

# --------------------------------
# Stage 2: Dependencies
# --------------------------------
FROM base AS dependencies

# Instalar todas las dependencias (dev + prod)
RUN npm ci --include=dev

# --------------------------------
# Stage 3: Development
# --------------------------------
FROM dependencies AS development

# Copiar código fuente
COPY --chown=nextjs:nodejs . .

# Crear directorios necesarios
RUN mkdir -p uploads logs
RUN chown -R nextjs:nodejs uploads logs

# Exponer puertos
EXPOSE 3000 9229

# Cambiar a usuario no root
USER nextjs

# Comando por defecto para desarrollo
CMD ["npm", "run", "start:dev"]

# --------------------------------
# Stage 4: Build
# --------------------------------
FROM dependencies AS build

# Copiar código fuente
COPY --chown=nextjs:nodejs . .

# Build de la aplicación
RUN npm run build

# Limpiar dependencias de desarrollo
RUN npm ci --omit=dev && npm cache clean --force

# --------------------------------
# Stage 5: Production
# --------------------------------
FROM base AS production

# Variables de entorno para producción
ENV NODE_ENV=production
ENV PORT=3000

# Copiar dependencias de producción
COPY --from=build --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copiar aplicación compilada
COPY --from=build --chown=nextjs:nodejs /app/dist ./dist

# Copiar archivos necesarios en runtime
COPY --from=build --chown=nextjs:nodejs /app/package*.json ./

# Crear directorios necesarios
RUN mkdir -p uploads logs
RUN chown -R nextjs:nodejs uploads logs

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Cambiar a usuario no root
USER nextjs

# Comando por defecto para producción
CMD ["node", "dist/main.js"]
