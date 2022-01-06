import { ICallback } from '../../types';
import { events } from './common/events';
import { Ticker } from './common/ticker/ticker';
import { EventEmitter } from 'events';
import { TimeSeries } from './common/time-series/time-series';

export abstract class MessageRate<
  TMessageRateFields extends Record<string, any> = Record<string, any>,
> extends EventEmitter {
  protected readerTicker: Ticker;

  constructor() {
    super();
    this.readerTicker = new Ticker(() => {
      this.onTick();
    }, 1000);
    this.readerTicker.runTimer();
  }

  protected onTick(): void {
    const ts = TimeSeries.getCurrentTimestamp();
    const rates = this.getRateFields();
    this.emit(events.RATE_TICK, ts, rates);
  }

  quit(cb: ICallback<void>): void {
    this.readerTicker.once(events.DOWN, cb);
    this.readerTicker.quit();
  }

  abstract getRateFields(): TMessageRateFields;
}
