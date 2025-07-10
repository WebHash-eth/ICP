import { Actor, ActorConfig } from '@dfinity/agent';
import * as frontend from '../candid/frontend.did';
import * as clc from '../candid/clc.did';

export function createFrontendActor(config: ActorConfig) {
  return Actor.createActor<frontend._SERVICE>(frontend.idlFactory, config);
}

export function createClcActor(config: ActorConfig) {
  return Actor.createActor<clc._SERVICE>(clc.idlFactory, config);
}
