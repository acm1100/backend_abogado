import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  SelectQueryBuilder,
  In,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
  Like,
  Not,
  IsNull,
} from 'typeorm';
import { 
  CreateGastoDto, 
  UpdateGastoDto, 
  CambiarEstadoGastoDto,
  AsignarGastoDto,
  ReembolsoGastoDto,
  FiltrosGastoDto,
  PaginacionGastoDto,
  EstadisticasGastoDto
} from './dto';
import { Gasto, EstadoGasto, TipoGasto, CategoriaGasto } from '../../entities/gasto.entity';
import { Usuario } from '../../entities/usuario.entity';
import { Cliente } from '../../entities/cliente.entity';
import { Caso } from '../../entities/caso.entity';
import { Proyecto } from '../../entities/proyecto.entity';
import { Documentacion } from '../../entities/documentacion.entity';

@Injectable()
export class GastosService {
  private readonly logger = new Logger(GastosService.name);

  constructor(
    @InjectRepository(Gasto)
    private readonly gastoRepository: Repository<Gasto>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
    @InjectRepository(Caso)
    private readonly casoRepository: Repository<Caso>,
    @InjectRepository(Proyecto)
    private readonly proyectoRepository: Repository<Proyecto>,
    @InjectRepository(Documentacion)
    private readonly documentacionRepository: Repository<Documentacion>,
  ) {}

  // ... (rest of the class implementation remains unchanged)
}
