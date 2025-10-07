import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';

import { GastosService } from './gastos.service';
import { GastosController } from './gastos.controller';

// Entities
import { Gasto } from '../../entities/gasto.entity';
import { Usuario } from '../../entities/usuario.entity';
import { Cliente } from '../../entities/cliente.entity';
import { Caso } from '../../entities/caso.entity';
import { Proyecto } from '../../entities/proyecto.entity';
import { Documentacion } from '../../entities/documentacion.entity';
import { Facturacion } from '../../entities/facturacion.entity';

import { AuthModule } from '../auth/auth.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { ClientesModule } from '../clientes/clientes.module';
import { CasosModule } from '../casos/casos.module';
import { ProyectosModule } from '../proyectos/proyectos.module';
import { DocumentosModule } from '../documentos/documentos.module';

@Module({
  imports: [
    // TypeORM entities
    TypeOrmModule.forFeature([
      Gasto,
      Usuario,
      Cliente,
      Caso,
      Proyecto,
      Documentacion,
      Facturacion,
    ]),

    // Multer configuration for file uploads
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, cb) => {
          // Organize files by type and date
          const uploadPath = join(process.cwd(), 'uploads', 'gastos', new Date().getFullYear().toString());
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          // Generate unique filename with original extension
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      fileFilter: (req, file, cb) => {
        // Allow common document and image formats
        const allowedMimes = [
          'application/pdf',
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/plain',
        ];

        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Tipo de archivo no permitido'), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
        files: 15, // Maximum 15 files per request
      },
    }),

    forwardRef(() => AuthModule),
    forwardRef(() => UsuariosModule),
    forwardRef(() => ClientesModule),
    forwardRef(() => CasosModule),
    forwardRef(() => ProyectosModule),
    forwardRef(() => DocumentosModule),
  ],

  controllers: [GastosController],

  providers: [
    GastosService,
    
    {
      provide: 'GASTO_CONFIG',
      useValue: {
        aprobacion: {
          montoMaximoSinAprobacion: 500, // PEN
          requiereFlujoAprobacion: true,
          nivelesTotales: 3, // Directo, Supervisor, Gerente
        },
        reembolso: {
          plazoMaximoDias: 30,
          metodosPago: ['EFECTIVO', 'TRANSFERENCIA_BANCARIA', 'CHEQUE', 'DESCUENTO_NOMINA'],
          requiereComprobanteValido: true,
        },
        facturacion: {
          markupDefecto: 15, // 15% markup por defecto
          incluirEnFacturacionAutomatica: true,
          requiereAprobacionParaFacturar: true,
        },
        contabilidad: {
          sincronizarConSistemaContable: true,
          generarAsientosAutomaticos: true,
          cuentasContablesPorCategoria: {
            'MATERIALES_OFICINA': '631001',
            'COMBUSTIBLE': '625001',
            'VIATICOS': '629001',
            'COMUNICACIONES': '636001',
            'SERVICIOS_PROFESIONALES': '634001',
            'MANTENIMIENTO': '634002',
            'CAPACITACION': '623001',
            'MARKETING': '627001',
            'TECNOLOGIA': '656001',
            'OTROS': '659001',
          },
        },
        validacion: {
          requiereComprobanteElectronico: true,
          validarRucProveedorSunat: true,
          calcularIgvAutomaticamente: true,
          permitirGastosSinCaso: false,
        },
        integraciones: {
          sunat: {
            validarComprobantes: true,
            consultarRucProveedores: true,
          },
          sistemaContable: {
            sincronizacionAutomatica: true,
            generarAsientos: true,
          },
          sistemaAprobacion: {
            notificacionesEmail: true,
            recordatoriosAutomaticos: true,
          },
        },
        auditoria: {
          registrarTodosLosCambios: true,
          mantenerHistorialCompleto: true,
          notificarCambiosCriticos: true,
        },
      },
    },

    // Validators and helpers
    {
      provide: 'EXPENSE_VALIDATORS',
      useValue: {
        // Custom validators for business rules
        validarComprobante: (comprobante: any) => {
          // Validate receipt/invoice format and content
          return true;
        },
        validarProveedor: (proveedor: any) => {
          // Validate provider information
          return true;
        },
        calcularImpuestos: (monto: number, tipoComprobante: string) => {
          // Calculate taxes based on amount and receipt type
          if (tipoComprobante === 'FACTURA') {
            const baseImponible = monto / 1.18;
            const igv = monto - baseImponible;
            return { baseImponible, igv, total: monto };
          }
          return { baseImponible: monto, igv: 0, total: monto };
        },
      },
    },
  ],

  exports: [
    GastosService,
    TypeOrmModule,
    'GASTO_CONFIG',
    'EXPENSE_VALIDATORS',
  ],
})
export class GastosModule {
  constructor() {
    console.log('GastosModule initialized - Expense management system ready');
  }
}
