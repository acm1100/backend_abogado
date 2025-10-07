@echo off
REM Script de configuración de desarrollo para PAB Legal System (Windows)
REM Este script configura el entorno de desarrollo local en Windows

echo Configurando entorno de desarrollo para PAB Legal System...

REM Verificar que estamos en el directorio correcto
if not exist "package.json" (
    echo [ERROR] Este script debe ejecutarse desde el directorio raíz del proyecto
    exit /b 1
)

REM 1. Verificar Node.js
echo ℹ️  Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no está instalado. Por favor instala Node.js 18 o superior.
    exit /b 1
)

for /f "tokens=1 delims=." %%a in ('node --version') do set NODE_MAJOR=%%a
set NODE_MAJOR=%NODE_MAJOR:v=%
if %NODE_MAJOR% lss 18 (
    echo [ERROR] Se requiere Node.js 18 o superior. Versión actual: 
    node --version
    exit /b 1
)
echo [SUCCESS] Node.js detectado
node --version

REM 2. Verificar npm
echo ℹ️  Verificando npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm no está instalado
    exit /b 1
)
echo [SUCCESS] npm detectado
npm --version

REM 3. Instalar dependencias
echo ℹ️  Instalando dependencias...
npm install
if %errorlevel% neq 0 (
    echo [ERROR] Error instalando dependencias
    exit /b 1
)
echo [SUCCESS] Dependencias instaladas correctamente

REM 4. Copiar archivo de entorno si no existe
if not exist ".env" (
    echo ℹ️  Creando archivo .env desde .env.example...
    copy .env.example .env
    echo [WARNING] Archivo .env creado. Por favor configura las variables de entorno antes de continuar.
) else (
    echo [SUCCESS] Archivo .env ya existe
)

REM 5. Verificar Docker (opcional)
echo ℹ️  Verificando Docker...
docker --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Docker detectado
    docker --version
    
    docker-compose --version >nul 2>&1
    if %errorlevel% equ 0 (
        echo [SUCCESS] Docker Compose detectado
        echo ℹ️  Para iniciar los servicios de desarrollo, ejecuta: npm run dev:db
    )
) else (
    echo [WARNING] Docker no detectado. Tendrás que configurar PostgreSQL y Redis manualmente.
)

REM 6. Crear directorios necesarios
echo ℹ️  Creando directorios necesarios...
if not exist "uploads" mkdir uploads
if not exist "logs" mkdir logs
if not exist "temp" mkdir temp
echo [SUCCESS] Directorios creados

REM 7. Mostrar próximos pasos
echo.
echo [INFO] Configuración completada!
echo.
echo Próximos pasos:
echo 1. Configura las variables en el archivo .env
echo 2. Inicia los servicios: npm run dev:db (si tienes Docker)
echo 3. Ejecuta las migraciones: npm run migration:run (cuando estén configuradas)
echo 4. Inicia la aplicación: npm run start:dev
echo.
echo URLs útiles:
echo - API: http://localhost:3000
echo - Documentación: http://localhost:3000/docs
echo - Health Check: http://localhost:3000/health
echo.
echo [SUCCESS] ¡Feliz desarrollo!

pause
