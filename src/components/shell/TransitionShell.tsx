import type { ReactNode } from 'react';

import type { ViewConfig } from '../../hooks/useViewTransition';

type TransitionShellProps = {
  config: ViewConfig;
  children: ReactNode;
};

export function TransitionShell({ config, children }: TransitionShellProps) {
  return (
    <div data-view data-state={config.state} data-transition={config.transition}>
      {children}
    </div>
  );
}
