import { TFunction } from '../../../../types';
import { EventEmitter } from 'events';
import { events } from '../events';
import { PowerManager } from '../power-manager/power-manager';
import { TickerError } from './ticker.error';
import { PanicError } from '../errors/panic.error';

export class Ticker extends EventEmitter {
  protected powerManager = new PowerManager();
  protected onTickFn: TFunction;
  protected onNextTickFn: TFunction | null = null;
  protected time: number;

  protected timeout: NodeJS.Timeout | null = null;
  protected interval: NodeJS.Timer | null = null;

  constructor(onTickFn: TFunction, time: number) {
    super();
    this.onTickFn = onTickFn;
    this.time = time;
    this.powerManager.goingUp();
  }

  protected shutdown(): void {
    this.powerManager.commit();
    this.emit(events.DOWN);
  }

  protected onTick(): void {
    if (this.powerManager.isGoingDown()) {
      this.shutdown();
    } else if (this.powerManager.isRunning()) {
      const tickFn = this.onNextTickFn ?? this.onTickFn;
      this.onNextTickFn = null;
      tickFn();
    } else {
      this.emit(events.ERROR, new PanicError(`Unexpected call`));
    }
  }

  quit(): void {
    if (this.powerManager.isGoingUp()) {
      this.powerManager.rollback();
      this.emit(events.DOWN);
    } else {
      this.powerManager.goingDown();
      if (this.timeout) {
        clearTimeout(this.timeout);
        this.shutdown();
      } else if (this.interval) {
        clearInterval(this.interval);
        this.shutdown();
      }
    }
  }

  nextTick(): void {
    if (this.timeout || this.interval) {
      throw new TickerError('A timer is already running');
    }
    if (this.powerManager.isGoingDown()) {
      this.shutdown();
    } else {
      if (this.powerManager.isGoingUp()) {
        this.powerManager.commit();
      }
      if (this.powerManager.isRunning()) {
        this.timeout = setTimeout(() => {
          this.timeout = null;
          this.onTick();
        }, this.time);
      }
    }
  }

  nextTickFn(fn: TFunction): void {
    this.onNextTickFn = fn;
    this.nextTick();
  }

  runTimer(): void {
    if (this.interval || this.timeout) {
      throw new TickerError('A timer is already running');
    }
    if (this.powerManager.isGoingUp()) {
      this.powerManager.commit();
    }
    if (this.powerManager.isRunning()) {
      this.interval = setInterval(() => this.onTick(), this.time);
    }
  }
}
