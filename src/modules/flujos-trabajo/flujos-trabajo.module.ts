import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import { FlujosTrabajoService } from './flujos-trabajo.service';
import { FlujosTrabajoController } from './flujos-trabajo.controller';

// Entities
import { FlujoTrabajo } from '../../entities/flujo_trabajo.entity';
import { Usuario } from '../../entities/usuario.entity';
import { Caso } from '../../entities/caso.entity';
import { Gasto } from '../../entities/gasto.entity';
import { Facturacion } from '../../entities/facturacion.entity';
import { Documentacion } from '../../entities/documentacion.entity';
import { Proyecto } from '../../entities/proyecto.entity';
import { Cliente } from '../../entities/cliente.entity';

import { AuthModule } from '../auth/auth.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { CasosModule } from '../casos/casos.module';
import { GastosModule } from '../gastos/gastos.module';
import { FacturacionModule } from '../facturacion/facturacion.module';
import { DocumentosModule } from '../documentos/documentos.module';
import { ProyectosModule } from '../proyectos/proyectos.module';
import { ClientesModule } from '../clientes/clientes.module';

@Module({
  imports: [
    // TypeORM entities
    TypeOrmModule.forFeature([
      FlujoTrabajo,
      Usuario,
      Caso,
      Gasto,
      Facturacion,
      Documentacion,
      Proyecto,
      Cliente,
    ]),

    ScheduleModule.forRoot(),
    forwardRef(() => AuthModule),
    forwardRef(() => UsuariosModule),
    forwardRef(() => CasosModule),
    forwardRef(() => GastosModule),
    forwardRef(() => FacturacionModule),
    forwardRef(() => DocumentosModule),
    forwardRef(() => ProyectosModule),
    forwardRef(() => ClientesModule),
  ],

  controllers: [FlujosTrabajoController],

  providers: [
    FlujosTrabajoService,
    
    // Workflow execution engine
    {
      provide: 'WORKFLOW_ENGINE',
      useValue: {
        // Core workflow execution settings
        ejecucion: {
          timeoutDefectoMinutos: 60,
          maxReintentos: 3,
          intervaloReintentoSegundos: 30,
          procesarEnParalelo: true,
          maxEjecucionesSimultaneas: 10,
        },
        
        // Step execution configuration
        pasos: {
          timeoutDefectoMinutos: 30,
          guardarEstadoIntermedio: true,
          permitirOmision: true,
          validarCondicionesEjecucion: true,
        },
        
        // Action handlers configuration
        acciones: {
          aprobacion: {
            timeoutDefectoHoras: 24,
            recordatorioHoras: [4, 12, 20],
            escalamientoHoras: 48,
            requiereComentarioRechazo: true,
          },
          notificacion: {
            canalesDisponibles: ['EMAIL', 'SMS', 'PUSH', 'WEBHOOK'],
            reintentosFallos: 3,
            timeoutSegundos: 30,
            plantillasPersonalizadas: true,
          },
          documento: {
            formatosPermitidos: ['PDF', 'DOCX', 'XLSX'],
            almacenamientoTemporal: true,
            firmaDigital: true,
            versionado: true,
          },
          integracion: {
            timeoutSegundos: 60,
            autenticacionRequerida: true,
            validarRespuesta: true,
            logearTransacciones: true,
          },
        },
        
        // Monitoring and analytics
        monitoreo: {
          metricas: {
            habilitado: true,
            intervaloPersistenciaMinutos: 5,
            mantenerHistorialDias: 365,
          },
          alertas: {
            fallosConsecutivos: 3,
            tiempoEjecucionExcesivo: 120, // minutos
            tasaExitoBaja: 0.8, // 80%
          },
          auditoria: {
            registrarTodosLosPasos: true,
            incluirDatosSensibles: false,
            compresionHistorial: true,
          },
        },
      },
    },

    // Workflow conditions evaluator
    {
      provide: 'CONDITION_EVALUATOR',
      useValue: {
        evaluadores: {
          // Numeric comparisons
          'MONTO_MAYOR': (valor: number, referencia: number) => valor > referencia,
          'MONTO_MENOR': (valor: number, referencia: number) => valor < referencia,
          'MONTO_IGUAL': (valor: number, referencia: number) => valor === referencia,
          
          // Date comparisons
          'FECHA_VENCIMIENTO': (fecha: Date, dias: number) => {
            const ahora = new Date();
            const diferencia = (fecha.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24);
            return diferencia <= dias;
          },
          
          // String comparisons
          'CAMPO_VALOR': (valor: any, referencia: any, operador: string) => {
            switch (operador) {
              case '==': return valor === referencia;
              case '!=': return valor !== referencia;
              case 'contains': return String(valor).includes(String(referencia));
              case 'not_contains': return !String(valor).includes(String(referencia));
              case 'in': return Array.isArray(referencia) && referencia.includes(valor);
              case 'not_in': return Array.isArray(referencia) && !referencia.includes(valor);
              default: return false;
            }
          },
          
          // Business logic conditions
          'ESTADO_CASO': (estadoCaso: string, estadosPermitidos: string[]) => {
            return estadosPermitidos.includes(estadoCaso);
          },
          
          'ROL_USUARIO': (usuarioId: string, rolesRequeridos: string[]) => {
            // En implementación real, consultar roles del usuario
            return true; // Placeholder
          },
          
          'DOCUMENTO_PRESENTE': (documentos: any[], tipoRequerido: string) => {
            return documentos.some(doc => doc.tipo === tipoRequerido);
          },
        },
        
        configuracion: {
          evaluacionEnParalelo: true,
          cacheResultados: true,
          timeoutSegundos: 10,
          logearEvaluaciones: true,
        },
      },
    },

    // Notification service
    {
      provide: 'NOTIFICATION_SERVICE',
      useValue: {
        canales: {
          email: {
            habilitado: true,
            servidor: process.env.EMAIL_HOST || 'localhost',
            puerto: parseInt(process.env.EMAIL_PORT || '587'),
            usuario: process.env.EMAIL_USER,
            password: process.env.EMAIL_PASS,
            plantillasHTML: true,
          },
          sms: {
            habilitado: false, // Configurar según proveedor
            proveedor: 'twilio', // o 'nexmo', 'messagebird', etc.
            apiKey: process.env.SMS_API_KEY,
            remitente: process.env.SMS_SENDER,
          },
          push: {
            habilitado: true,
            firebase: {
              serverKey: process.env.FIREBASE_SERVER_KEY,
              databaseURL: process.env.FIREBASE_DATABASE_URL,
            },
          },
          webhook: {
            habilitado: true,
            timeoutSegundos: 30,
            reintentos: 3,
            validarSSL: true,
          },
        },
        
        plantillas: {
          workflowIniciado: {
            asunto: 'Flujo de trabajo iniciado: {{nombreFlujo}}',
            cuerpo: 'El flujo "{{nombreFlujo}}" ha sido iniciado para {{tipoEntidad}} {{entidadId}}.',
          },
          workflowCompletado: {
            asunto: 'Flujo completado: {{nombreFlujo}}',
            cuerpo: 'El flujo "{{nombreFlujo}}" se ha completado exitosamente.',
          },
          workflowFallido: {
            asunto: 'Error en flujo: {{nombreFlujo}}',
            cuerpo: 'El flujo "{{nombreFlujo}}" ha fallado en el paso {{pasoActual}}. Error: {{error}}',
          },
          aprobacionRequerida: {
            asunto: 'Aprobación requerida: {{nombrePaso}}',
            cuerpo: 'Se requiere su aprobación para el paso "{{nombrePaso}}" del flujo "{{nombreFlujo}}".',
          },
          aprobacionTimeout: {
            asunto: 'Recordatorio de aprobación: {{nombrePaso}}',
            cuerpo: 'Recordatorio: Tiene una aprobación pendiente para "{{nombrePaso}}".',
          },
        },
      },
    },

    // Integration manager
    {
      provide: 'INTEGRATION_MANAGER',
      useValue: {
        conectores: {
          sunat: {
            baseUrl: 'https://api.sunat.gob.pe',
            timeout: 30000,
            apiKey: process.env.SUNAT_API_KEY,
            endpoints: {
              validarRuc: '/v1/contribuyente/ruc/{{ruc}}',
              validarComprobante: '/v1/comprobante/validar',
            },
          },
          
          bancario: {
            habilitado: false, // Configurar según banco
            proveedor: 'bcp', // o 'interbank', 'bbva', etc.
            endpoints: {
              consultarCuenta: '/api/cuentas/{{numeroCuenta}}',
              realizarTransferencia: '/api/transferencias',
            },
          },
          
          contabilidad: {
            habilitado: true,
            sistema: 'contpaq', // o 'sap', 'oracle', etc.
            baseUrl: process.env.ACCOUNTING_API_URL,
            apiKey: process.env.ACCOUNTING_API_KEY,
          },
          
          documentos: {
            habilitado: true,
            proveedor: 'adobe', // Para firma digital
            apiKey: process.env.ADOBE_API_KEY,
          },
        },
        
        configuracion: {
          reintentosFallo: 3,
          timeoutDefecto: 60000,
          logearTransacciones: true,
          validarRespuestas: true,
          encriptarCredenciales: true,
        },
      },
    },

    // Workflow templates
    {
      provide: 'WORKFLOW_TEMPLATES',
      useValue: {
        // Pre-built workflow templates
        plantillas: {
          aprobacionGastos: {
            nombre: 'Aprobación de Gastos Estándar',
            descripcion: 'Flujo estándar para aprobación de gastos',
            pasos: [
              {
                nombre: 'Validación inicial',
                acciones: [{ tipo: 'REVISION', configuracion: { validarComprobante: true } }],
              },
              {
                nombre: 'Aprobación supervisor',
                acciones: [{ tipo: 'APROBACION', configuracion: { roles: ['supervisor'] } }],
              },
              {
                nombre: 'Aprobación gerencial',
                condiciones: [{ tipo: 'MONTO_MAYOR', valor: 1000 }],
                acciones: [{ tipo: 'APROBACION', configuracion: { roles: ['gerente'] } }],
              },
              {
                nombre: 'Procesamiento final',
                acciones: [{ tipo: 'NOTIFICACION', configuracion: { destinatarios: ['finanzas'] } }],
              },
            ],
          },
          
          onboardingCliente: {
            nombre: 'Incorporación de Cliente',
            descripcion: 'Proceso de incorporación de nuevos clientes',
            pasos: [
              {
                nombre: 'Recopilación de documentos',
                acciones: [{ tipo: 'FORMULARIO', configuracion: { documentosRequeridos: ['dni', 'ruc'] } }],
              },
              {
                nombre: 'Validación SUNAT',
                acciones: [{ tipo: 'INTEGRACION', configuracion: { sistema: 'sunat' } }],
              },
              {
                nombre: 'Creación de expediente',
                acciones: [{ tipo: 'DOCUMENTO', configuracion: { plantilla: 'expediente_cliente' } }],
              },
              {
                nombre: 'Notificación de bienvenida',
                acciones: [{ tipo: 'NOTIFICACION', configuracion: { plantilla: 'bienvenida_cliente' } }],
              },
            ],
          },
        },
      },
    },
  ],

  exports: [
    FlujosTrabajoService,
    TypeOrmModule,
    'WORKFLOW_ENGINE',
    'CONDITION_EVALUATOR',
    'NOTIFICATION_SERVICE',
    'INTEGRATION_MANAGER',
    'WORKFLOW_TEMPLATES',
  ],
})
export class FlujosTrabajoModule {
  constructor() {
    console.log('FlujosTrabajoModule initialized - Workflow automation system ready');
  }
}
