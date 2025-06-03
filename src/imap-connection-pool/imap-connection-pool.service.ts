import {
  Injectable,
  OnModuleDestroy,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ImapFlow, MailboxLockObject } from 'imapflow';
import { ConfigService } from '@nestjs/config';

interface PoolConnection {
  client: ImapFlow;
  inUse: boolean;
  lastUsed: Date;
  id: string;
}

interface QueuedOperation {
  resolve: (connection: PoolConnection) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}

@Injectable()
export class ImapConnectionPoolService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(ImapConnectionPoolService.name);
  private readonly connectionPool: PoolConnection[] = [];
  private readonly operationQueue: QueuedOperation[] = [];
  private isShuttingDown = false;

  //   Configuraciones del pool
  private readonly CLEANUP_INTERVAL = 120000; // 2 minutos para limpiar conexiones inactivas
  private readonly HEALTH_CHECK_INTERVAL = 3000; // 3 segundos para verificar salud de conexiones
  private readonly MAX_CONNECTIONS = 5; // Máximo de conexiones simultáneas
  private readonly LOCK_TIMEOUT = 10000; // 10 Segundos mailbox bloqueado (este se usará para el timeout de getMailboxLock)
  private readonly CONNECTION_TIMEOUT = 30000; // 30 segundos para operaciones (tiempo máximo para que una operación IMAP responda)
  private readonly IDLE_TIMEOUT = 300000; // 5 minutos sin uso
  private readonly QUEUE_TIMEOUT = 10000; // 10 segundos esperando conexión en cola

  private cleanupIntervalId: NodeJS.Timeout | null = null;

  constructor(private configService: ConfigService) {}

  /**
   * Inicializa el servicio del pool y configura intervalos de limpieza y salud.
   */
  onModuleInit() {
    this.logger.log('🚀 Servicio IMAP Connection Pool inicializado');
    this.cleanupIntervalId = setInterval(() => {
      void this.cleanupIdleConnections();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Limpia todas las conexiones al destruir el módulo.
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('Iniciando cierre del servicio IMAP Connection Pool...');
    this.isShuttingDown = true;

    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }

    // Rechazar operaciones en cola
    while (this.operationQueue.length > 0) {
      const op = this.operationQueue.shift()!;
      clearTimeout(op.timeout);
      op.reject(new Error('Servicio de pool cerrándose'));
    }

    // Cerrar todas las conexiones
    const closePromises = this.connectionPool.map(async (poolConn) => {
      await this.safeCloseConnection(poolConn.client);
    });

    await Promise.allSettled(closePromises);
    this.connectionPool.length = 0;

    this.logger.log('📤 Servicio IMAP Connection Pool cerrado correctamente');
  }

  /**
   * Adquiere una conexión del pool para una operación.
   * Este método gestiona la cola si no hay conexiones disponibles.
   */
  private async acquireConnection(): Promise<PoolConnection> {
    return new Promise<PoolConnection>((resolve, reject) => {
      const timeout = setTimeout(() => {
        // Remover de la cola si expira
        const index = this.operationQueue.findIndex(
          (op) => op.resolve === resolve,
        );
        if (index !== -1) {
          this.operationQueue.splice(index, 1);
        }
        reject(new Error('Timeout esperando conexión disponible'));
      }, this.QUEUE_TIMEOUT);

      const queuedOp: QueuedOperation = { resolve, reject, timeout };

      // Intentar obtener conexión inmediatamente
      this.tryGetConnection()
        .then((connection) => {
          if (connection) {
            clearTimeout(timeout);
            resolve(connection);
            return;
          }
          // Si no hay conexión disponible, agregar a la cola
          this.operationQueue.push(queuedOp);
          this.logger.log(
            `Operación en cola. Cola actual: ${this.operationQueue.length}`,
          );
        })
        .catch((err) => {
          clearTimeout(timeout);
          reject(err instanceof Error ? err : new Error(String(err)));
        });
    });
  }

  /**
   * Intenta obtener una conexión disponible del pool o crea una nueva si es posible.
   */
  private async tryGetConnection(): Promise<PoolConnection | null> {
    // Buscar conexión disponible y saludable
    for (const poolConn of this.connectionPool) {
      if (
        !poolConn.inUse &&
        (await this.isConnectionHealthy(poolConn.client))
      ) {
        poolConn.inUse = true;
        poolConn.lastUsed = new Date();
        return poolConn;
      }
    }

    // Limpiar conexiones muertas
    await this.removeDeadConnections();

    // Si podemos crear una nueva conexión
    if (this.connectionPool.length < this.MAX_CONNECTIONS) {
      try {
        const client = await this.createConnection();
        const poolConn: PoolConnection = {
          client,
          inUse: true,
          lastUsed: new Date(),
          id: `conn-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        };
        this.connectionPool.push(poolConn);
        this.logger.log(
          `Nueva conexión creada. Pool: ${this.connectionPool.length}/${this.MAX_CONNECTIONS}`,
        );
        return poolConn;
      } catch (error) {
        this.logger.error(`Error creando nueva conexión: ${error}`);
        return null;
      }
    }
    return null;
  }

  /**
   * Libera una conexión de vuelta al pool.
   */
  private releaseConnection(poolConn: PoolConnection): void {
    poolConn.inUse = false;
    poolConn.lastUsed = new Date();

    // Procesar siguiente operación en cola
    const nextOp = this.operationQueue.shift();
    if (nextOp) {
      clearTimeout(nextOp.timeout);
      nextOp.resolve(poolConn);
      poolConn.inUse = true;
    }
  }

  /**
   * Crea una nueva conexión IMAP usando las configuraciones del servicio.
   */
  private async createConnection(): Promise<ImapFlow> {
    if (this.isShuttingDown) {
      throw new Error('Servicio en proceso de cierre');
    }

    const client = new ImapFlow({
      host: this.configService.get<string>('IMAP_HOST') ?? '',
      port: this.configService.get<number>('IMAP_PORT') ?? 993,
      secure: true,
      auth: {
        user: this.configService.get<string>('IMAP_USER') ?? '',
        pass: this.configService.get<string>('IMAP_PASS') ?? '',
      },
      logger: false,
      socketTimeout: 30000,
      greetingTimeout: 15000,
      connectionTimeout: 10000,
    });

    await Promise.race([
      client.connect(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout')), 15000),
      ),
    ]);
    if (!client.authenticated) {
      await this.safeCloseConnection(client);
      throw new Error('Falló la autenticación IMAP');
    }

    return client;
  }

  /**
   * Cierra una conexión de ImapFlow de forma segura, incluyendo logout y cierre forzado si es necesario.
   */
  private async safeCloseConnection(client: ImapFlow): Promise<void> {
    if (!client) return;

    try {
      // Solo hacer logout si la conexión está usable y autenticada
      if (client.usable && client.authenticated) {
        await Promise.race([
          client.logout(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Logout timeout')), 3000),
          ),
        ]);
      }
    } catch (error) {
      this.logger.warn(`Error en logout: ${error}`);
    }
    // Siempre intentar cerrar la conexión TCP como último recurso
    try {
      if (client.usable) {
        client.close();
      }
    } catch (closeError) {
      this.logger.warn(`Error forzando cierre: ${closeError}`);
    }
  }

  /**
   * Verifica si una conexión está saludable enviando un comando NOOP.
   */
  private async isConnectionHealthy(client: ImapFlow): Promise<boolean> {
    try {
      if (!client.authenticated || !client.usable) {
        return false;
      }
      // Hacer un NOOP para verificar que la conexión funciona
      await Promise.race([
        client.noop(),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Health check timeout')),
            this.HEALTH_CHECK_INTERVAL,
          ),
        ),
      ]);

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Remueve conexiones muertas o insalubres del pool.
   */
  private async removeDeadConnections(): Promise<void> {
    const deadConnections: number[] = [];

    for (let i = 0; i < this.connectionPool.length; i++) {
      const poolConn = this.connectionPool[i];
      if (
        !poolConn.inUse &&
        !(await this.isConnectionHealthy(poolConn.client))
      ) {
        deadConnections.push(i);
        await this.safeCloseConnection(poolConn.client);
      }
    }

    // Remover en orden inverso para no afectar índices
    for (let i = deadConnections.length - 1; i >= 0; i--) {
      this.connectionPool.splice(deadConnections[i], 1);
    }

    if (deadConnections.length > 0) {
      this.logger.log(`Removidas ${deadConnections.length} conexiones muertas`); //
    }
  }

  /**
   * Limpia conexiones inactivas del pool que han superado el IDLE_TIMEOUT.
   */
  private async cleanupIdleConnections(): Promise<void> {
    if (this.isShuttingDown) return;

    const now = new Date();
    const toRemove: number[] = [];

    for (let i = 0; i < this.connectionPool.length; i++) {
      const poolConn = this.connectionPool[i];
      const idleTime = now.getTime() - poolConn.lastUsed.getTime();

      if (!poolConn.inUse && idleTime > this.IDLE_TIMEOUT) {
        toRemove.push(i);
        await this.safeCloseConnection(poolConn.client);
      }
    }

    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.connectionPool.splice(toRemove[i], 1);
    }

    if (toRemove.length > 0) {
      this.logger.log(`Limpiadas ${toRemove.length} conexiones inactivas`);
    }
  }

  // ==================== MÉTODOS PÚBLICOS PARA LOS OTROS SERVICIOS ====================

  /**
   * Ejecuta una función con una conexión IMAP del pool, abriendo el mailbox.
   * Este método es para operaciones que no necesitan un bloqueo exclusivo del mailbox.
   */
  async executeWithMailboxOpen<T>(
    operation: (client: ImapFlow) => Promise<T>,
    mailbox: string = 'INBOX',
  ): Promise<T> {
    if (this.isShuttingDown) {
      throw new Error('Servicio de pool en proceso de cierre');
    }

    let poolConn: PoolConnection | null = null;

    try {
      poolConn = await this.acquireConnection();

      // Abrir mailbox sin bloquear
      await poolConn.client.mailboxOpen(mailbox);

      const result = await Promise.race([
        operation(poolConn.client),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Operation timeout')),
            this.CONNECTION_TIMEOUT,
          ),
        ),
      ]);

      return result;
    } catch (error) {
      this.logger.error(`Error en operación IMAP con mailboxOpen: ${error}`);

      // Si la conexión falló, marcarla como muerta y removerla del pool
      if (poolConn) {
        await this.safeCloseConnection(poolConn.client);
        const index = this.connectionPool.indexOf(poolConn);
        if (index !== -1) {
          this.connectionPool.splice(index, 1);
        }
        poolConn = null;
      }

      throw error;
    } finally {
      if (poolConn) {
        this.releaseConnection(poolConn);
      }
    }
  }

  /**
   * Ejecuta una función con una conexión IMAP del pool, adquiriendo un bloqueo del mailbox.
   * Este método es para operaciones que modifican el mailbox y necesitan exclusividad.
   */
  async executeWithMailboxLock<T>(
    operation: (client: ImapFlow, lock: MailboxLockObject) => Promise<T>,
    mailbox: string = 'INBOX',
  ): Promise<T> {
    if (this.isShuttingDown) {
      throw new Error('Servicio de pool en proceso de cierre');
    }

    let poolConn: PoolConnection | null = null;
    let lock: MailboxLockObject | null = null;

    try {
      poolConn = await this.acquireConnection();

      lock = await Promise.race([
        //
        poolConn.client.getMailboxLock(mailbox),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Lock timeout')),
            this.LOCK_TIMEOUT,
          ),
        ),
      ]);

      const result = await Promise.race([
        operation(poolConn.client, lock),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Operation timeout')),
            this.CONNECTION_TIMEOUT,
          ),
        ),
      ]);

      return result;
    } catch (error) {
      this.logger.error(`Error en operación IMAP con lock: ${error}`);

      // Si la conexión falló, marcarla como muerta y removerla del pool
      if (poolConn) {
        await this.safeCloseConnection(poolConn.client);
        const index = this.connectionPool.indexOf(poolConn);
        if (index !== -1) {
          this.connectionPool.splice(index, 1);
        }
        poolConn = null;
      }

      throw error;
    } finally {
      if (lock) {
        try {
          lock.release();
        } catch (err) {
          this.logger.error(`Error al liberar lock: ${err}`);
        }
      }

      if (poolConn) {
        this.releaseConnection(poolConn);
      }
    }
  }

  // ==================== MÉTODOS UTILITARIOS DEL POOL (para monitoreo) ====================

  /**
   * Obtiene estadísticas del pool de conexiones.
   */
  getPoolStats(): {
    total: number;
    inUse: number;
    available: number;
    queueLength: number;
  } {
    const inUse = this.connectionPool.filter((c) => c.inUse).length;
    return {
      total: this.connectionPool.length,
      inUse,
      available: this.connectionPool.length - inUse,
      queueLength: this.operationQueue.length,
    };
  }

  /**
   * Verifica la salud del pool de conexiones.
   */
  async checkPoolHealth(): Promise<{
    healthy: number;
    unhealthy: number;
    total: number;
  }> {
    let healthy = 0;
    let unhealthy = 0;

    for (const poolConn of this.connectionPool) {
      if (await this.isConnectionHealthy(poolConn.client)) {
        healthy++;
      } else {
        unhealthy++;
      }
    }

    return {
      healthy,
      unhealthy,
      total: this.connectionPool.length,
    };
  }
}
