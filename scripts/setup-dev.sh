#!/bin/bash

# Script de configuración de desarrollo para PAB Legal System
# Este script configura el entorno de desarrollo local

set -e

echo "🚀 Configurando entorno de desarrollo para PAB Legal System..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_message() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    print_error "Este script debe ejecutarse desde el directorio raíz del proyecto"
    exit 1
fi

# 1. Verificar Node.js
print_info "Verificando Node.js..."
if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado. Por favor instala Node.js 18 o superior."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Se requiere Node.js 18 o superior. Versión actual: $(node -v)"
    exit 1
fi
print_message "Node.js $(node -v) detectado"

# 2. Verificar npm
print_info "Verificando npm..."
if ! command -v npm &> /dev/null; then
    print_error "npm no está instalado"
    exit 1
fi
print_message "npm $(npm -v) detectado"

# 3. Instalar dependencias
print_info "Instalando dependencias..."
npm install
print_message "Dependencias instaladas correctamente"

# 4. Copiar archivo de entorno si no existe
if [ ! -f ".env" ]; then
    print_info "Creando archivo .env desde .env.example..."
    cp .env.example .env
    print_warning "Archivo .env creado. Por favor configura las variables de entorno antes de continuar."
else
    print_message "Archivo .env ya existe"
fi

# 5. Verificar Docker (opcional)
print_info "Verificando Docker..."
if command -v docker &> /dev/null; then
    print_message "Docker $(docker --version | cut -d ' ' -f 3 | cut -d ',' -f 1) detectado"
    
    if command -v docker-compose &> /dev/null; then
        print_message "Docker Compose detectado"
        print_info "Para iniciar los servicios de desarrollo, ejecuta: npm run dev:db"
    fi
else
    print_warning "Docker no detectado. Tendrás que configurar PostgreSQL y Redis manualmente."
fi

# 6. Crear directorios necesarios
print_info "Creando directorios necesarios..."
mkdir -p uploads logs temp
print_message "Directorios creados"

# 7. Verificar PostgreSQL (si está disponible)
print_info "Verificando PostgreSQL..."
if command -v psql &> /dev/null; then
    print_message "PostgreSQL cliente detectado"
else
    print_warning "Cliente PostgreSQL no detectado. Asegúrate de tener PostgreSQL disponible."
fi

# 8. Mostrar próximos pasos
echo ""
print_info "🎉 Configuración completada!"
echo ""
echo "Próximos pasos:"
echo "1. Configura las variables en el archivo .env"
echo "2. Inicia los servicios: npm run dev:db (si tienes Docker)"
echo "3. Ejecuta las migraciones: npm run migration:run (cuando estén configuradas)"
echo "4. Inicia la aplicación: npm run start:dev"
echo ""
echo "URLs útiles:"
echo "- API: http://localhost:3000"
echo "- Documentación: http://localhost:3000/docs"
echo "- Health Check: http://localhost:3000/health"
echo ""
print_message "¡Feliz desarrollo! 🚀"
