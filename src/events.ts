export const events = {
  GOING_UP: 'going_up',
  UP: 'up',
  GOING_DOWN: 'going_down',
  DOWN: 'down',
  ERROR: 'error',
  IDLE: 'idle',
  BROKER_UP: 'broker_up',
  BROKER_DOWN: 'broker_down',
  HEARTBEAT_UP: 'heartbeat_up',
  HEARTBEAT_DOWN: 'heartbeat_down',
  HEARTBEAT_SHUTDOWN_READY: 'heartbeat_shutdown_ready',
  GC_UP: 'gc_up',
  GC_DOWN: 'gc_down',
  GC_LOCK_ACQUIRED: 'gc_lock_acquired',
  GC_SHUTDOWN_READY: 'gc_shutdown_ready',
  CONSUMER_OFFLINE: 'consumer_offline',
  QUEUE_DESTROYED: 'queue_destroyed',
  SCHEDULER_QUIT: 'scheduler_quit',
  SCHEDULER_RUNNER_UP: 'scheduler_runner_up',
  SCHEDULER_RUNNER_DOWN: 'scheduler_runner_down',
  SCHEDULER_RUNNER_SHUTDOWN_READY: 'scheduler_runner_shutdown_ready',
  STATS_UP: 'stats_up',
  STATS_DOWN: 'stats_down',
  STATS_SHUTDOWN_READY: 'stats_shutdown_ready',
  MESSAGE_PRODUCED: 'message_produced',
  MESSAGE_NEXT: 'message_next',
  MESSAGE_RECEIVED: 'message_received',
  MESSAGE_ACKNOWLEDGED: 'message_acknowledged',
  MESSAGE_UNACKNOWLEDGED: 'message_unacknowledged',
  MESSAGE_CONSUME_TIMEOUT: 'message_consume_timeout',
  MESSAGE_EXPIRED: 'message_expired',
  MESSAGE_REQUEUED: 'message_requeued',
  MESSAGE_DELAYED: 'message_delayed',
  MESSAGE_DEAD_LETTER: 'message_dead_letter',
  MESSAGE_DESTROYED: 'message_destroyed',
};
