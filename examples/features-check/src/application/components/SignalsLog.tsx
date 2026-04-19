import './SignalsLog.css';

import { LoggerService } from '@/core/services/logging';
import { observer, useService } from '@/libs/ioc';

export const SignalsLog = observer(() => {
  const loggerService: LoggerService = useService(LoggerService);

  return (
    <div id={'logs'}>
      <h2>Signal log</h2>
      <div className={'signal-log'}>
        {loggerService.entries.length === 0 ? (
          <div className={'signal-log__empty'}>
            No signals yet — try the buttons above.
          </div>
        ) : (
          loggerService.entries.map((entry) => (
            <div key={entry.id} className={'signal-log__entry'}>
              <span className={'signal-log__type'}>{entry.type}</span>
              <span className={'signal-log__payload'}>
                {entry.payload !== undefined
                  ? JSON.stringify(entry.payload)
                  : '—'}
              </span>
            </div>
          ))
        )}
      </div>

      <button className={'counter ghost'} onClick={() => loggerService.clear()}>
        Clear log
      </button>
    </div>
  );
});
