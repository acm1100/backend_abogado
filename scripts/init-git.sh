#!/bin/bash

# Script para inicializar Git y subir el proyecto
# Ejecutar después de instalar Git

echo "Inicializando repositorio Git para PAB Legal System..."

# Verificar que Git esté instalado
if ! command -v git &> /dev/null; then
    echo "[ERROR] Git no está instalado. Por favor instala Git primero:"
    echo "   - Windows: https://git-scm.com/download/win"
    echo "   - O usar: winget install Git.Git"
    exit 1
fi

# Inicializar repositorio
echo "ℹ️  Inicializando repositorio..."
git init

# Configurar usuario (cambiar si es necesario)
echo "ℹ️  Configurando usuario Git..."
git config user.name "PAB Development Team"
git config user.email "dev@pab-legal.com"

# Configurar rama principal
echo "ℹ️  Configurando rama principal..."
git branch -M main

# Agregar todos los archivos
echo "ℹ️  Agregando archivos..."
git add .

# Crear commit inicial
echo "ℹ️  Creando commit inicial..."
git commit -m "feat: Initial commit - PAB Legal Management System

- Complete NestJS backend with TypeScript
- Multi-tenant architecture 
- 16 business modules implemented
- PostgreSQL + Redis integration
- JWT authentication with RBAC
- Swagger documentation
- Docker configuration
- Health checks and monitoring
- Enterprise-grade legal management system"

echo "[SUCCESS] Repositorio Git inicializado correctamente!"
echo ""
echo "Próximos pasos:"
echo "1. Crear repositorio en GitHub/GitLab"
echo "2. Agregar remote: git remote add origin <repository-url>"
echo "3. Subir código: git push -u origin main"
echo ""
echo "Comandos para repositorio remoto:"
echo "   git remote add origin https://github.com/username/pab-legal-backend.git"
echo "   git push -u origin main"
