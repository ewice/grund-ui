import type { ReactiveController, ReactiveControllerHost } from 'lit';

export type PresenceStatus = 'idle' | 'starting' | 'ending';

export interface PresenceControllerOptions {
  isPresent: () => boolean;
  getTransitionElement?: () => HTMLElement | null;
  onExitComplete?: () => void;
  onStatusChange?: (status: PresenceStatus) => void;
}

/**
 * Reactive controller for exit-transition-safe presence management.
 *
 * Keeps `present` true during exit transitions so consumer CSS can animate
 * the exit before DOM is removed.
 */
export class PresenceController implements ReactiveController {
  private readonly host: ReactiveControllerHost & HTMLElement;
  private readonly options: PresenceControllerOptions;

  private _present = false;
  private _status: PresenceStatus = 'idle';
  private prevIsPresent = false;
  private isConnected = false;
  private exitCleanup: (() => void) | null = null;
  private startTimeoutId: number | null = null;
  private exitVersion = 0;

  constructor(host: ReactiveControllerHost & HTMLElement, options: PresenceControllerOptions) {
    this.host = host;
    this.options = options;
    host.addController(this);
  }

  public get present(): boolean {
    return this._present;
  }

  public get status(): PresenceStatus {
    return this._status;
  }

  public hostConnected(): void {
    this.isConnected = true;
    this.sync();
  }

  public hostDisconnected(): void {
    this.isConnected = false;
    this.exitVersion++;
    this.clearStartTimeout();
    this.cleanupExit();
    this.prevIsPresent = this.options.isPresent();
    this._present = this.prevIsPresent;
    this.setStatus('idle');
  }

  public hostUpdated(): void {
    this.sync();
  }

  private sync(): void {
    const isPresent = this.options.isPresent();

    if (isPresent === this.prevIsPresent) return;

    this.prevIsPresent = isPresent;

    if (isPresent) {
      this.enter();
    } else {
      this.exit();
    }
  }

  private enter(): void {
    const version = ++this.exitVersion;
    this.clearStartTimeout();
    this.cleanupExit();

    this._present = true;
    this.setStatus('starting');
    this.host.requestUpdate();

    // Keep the starting status observable for one render turn.
    this.startTimeoutId = window.setTimeout(() => {
      this.startTimeoutId = null;
      if (!this.isConnected) return;
      if (version !== this.exitVersion) return;
      if (!this.options.isPresent()) return;
      if (this._status !== 'starting') return;
      this.setStatus('idle');
      this.host.requestUpdate();
    }, 0);
  }

  private exit(): void {
    const version = ++this.exitVersion;
    this.clearStartTimeout();
    this.setStatus('ending');
    this.host.requestUpdate();

    const transitionEl = this.options.getTransitionElement?.() ?? this.host;
    if (!transitionEl) {
      this.completeExitAfterDelay(version);
      return;
    }

    const computedStyle = getComputedStyle(transitionEl);
    const exitDuration = Math.max(
      getMaxCssTime(computedStyle.transitionDuration, computedStyle.transitionDelay),
      getMaxCssTime(computedStyle.animationDuration, computedStyle.animationDelay),
    );

    if (exitDuration <= 0) {
      this.completeExitAfterDelay(version);
      return;
    }

    const pendingEvents = getPendingEndEvents(computedStyle);

    const handleEnd = (e: Event): void => {
      if (e.target !== transitionEl) return;

      const key = getEndEventKey(e);
      if (pendingEvents.size > 0) {
        if (!key || !pendingEvents.has(key)) return;
        pendingEvents.delete(key);
        if (pendingEvents.size > 0) return;
      }

      this.completeExit(version);
    };

    transitionEl.addEventListener('transitionend', handleEnd);
    transitionEl.addEventListener('animationend', handleEnd);
    transitionEl.addEventListener('transitioncancel', handleEnd);
    transitionEl.addEventListener('animationcancel', handleEnd);

    const timeoutId = window.setTimeout(() => {
      this.completeExit(version);
    }, exitDuration + 50);

    this.exitCleanup = () => {
      window.clearTimeout(timeoutId);
      transitionEl.removeEventListener('transitionend', handleEnd);
      transitionEl.removeEventListener('animationend', handleEnd);
      transitionEl.removeEventListener('transitioncancel', handleEnd);
      transitionEl.removeEventListener('animationcancel', handleEnd);
    };
  }

  private completeExitAfterDelay(version: number): void {
    const timeoutId = window.setTimeout(() => {
      this.completeExit(version);
    }, 0);

    this.exitCleanup = () => {
      window.clearTimeout(timeoutId);
    };
  }

  private completeExit(version: number): void {
    if (!this.isConnected) return;
    if (version !== this.exitVersion) return;
    if (this.options.isPresent()) return;
    if (this._status !== 'ending') return;

    this.cleanupExit();
    this._present = false;
    this.setStatus('idle');
    this.options.onExitComplete?.();
    this.host.requestUpdate();
  }

  private cleanupExit(): void {
    if (this.exitCleanup) {
      this.exitCleanup();
      this.exitCleanup = null;
    }
  }

  private clearStartTimeout(): void {
    if (this.startTimeoutId !== null) {
      window.clearTimeout(this.startTimeoutId);
      this.startTimeoutId = null;
    }
  }

  private setStatus(status: PresenceStatus): void {
    if (this._status === status) return;
    this._status = status;
    this.options.onStatusChange?.(status);
  }
}

function getPendingEndEvents(style: CSSStyleDeclaration): Set<string> {
  const events = new Set<string>();
  const transitionProperties = style.transitionProperty
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const transitionDurations = parseCssTimeList(style.transitionDuration);
  const transitionDelays = parseCssTimeList(style.transitionDelay);

  for (let i = 0; i < transitionProperties.length; i++) {
    const duration = transitionDurations[i] ?? transitionDurations[transitionDurations.length - 1] ?? 0;
    const delay = transitionDelays[i] ?? transitionDelays[transitionDelays.length - 1] ?? 0;
    if (duration + delay > 0 && transitionProperties[i] !== 'all') {
      events.add(`transition:${transitionProperties[i]}`);
    }
  }

  const animationNames = style.animationName
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part && part !== 'none');
  const animationDurations = parseCssTimeList(style.animationDuration);
  const animationDelays = parseCssTimeList(style.animationDelay);

  for (let i = 0; i < animationNames.length; i++) {
    const duration = animationDurations[i] ?? animationDurations[animationDurations.length - 1] ?? 0;
    const delay = animationDelays[i] ?? animationDelays[animationDelays.length - 1] ?? 0;
    if (duration + delay > 0) {
      events.add(`animation:${animationNames[i]}`);
    }
  }

  return events;
}

function getEndEventKey(event: Event): string | null {
  if (event instanceof TransitionEvent && event.propertyName) {
    return `transition:${event.propertyName}`;
  }

  if (event instanceof AnimationEvent && event.animationName) {
    return `animation:${event.animationName}`;
  }

  return null;
}

function getMaxCssTime(durations: string, delays: string): number {
  const durationList = parseCssTimeList(durations);
  const delayList = parseCssTimeList(delays);
  const itemCount = Math.max(durationList.length, delayList.length);

  let max = 0;
  for (let i = 0; i < itemCount; i++) {
    const duration = durationList[i] ?? durationList[durationList.length - 1] ?? 0;
    const delay = delayList[i] ?? delayList[delayList.length - 1] ?? 0;
    max = Math.max(max, duration + delay);
  }

  return max;
}

function parseCssTimeList(value: string): number[] {
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      if (part.endsWith('ms')) return Number.parseFloat(part);
      if (part.endsWith('s')) return Number.parseFloat(part) * 1000;
      return 0;
    });
}
