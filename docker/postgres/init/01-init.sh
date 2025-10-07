#!/bin/bash
set -e

# Crear bases de datos adicionales si es necesario
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Crear extensiones necesarias
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "unaccent";
    CREATE EXTENSION IF NOT EXISTS "pg_trgm";
    
    -- Crear base de datos de testing
    CREATE DATABASE pab_legal_test;
    
    -- Configurar locale para Perú
    UPDATE pg_database SET datcollate='es_PE.UTF-8', datctype='es_PE.UTF-8' WHERE datname='pab_legal_dev';
    UPDATE pg_database SET datcollate='es_PE.UTF-8', datctype='es_PE.UTF-8' WHERE datname='pab_legal_test';
EOSQL

echo "[SUCCESS] PostgreSQL initialization completed successfully!"
