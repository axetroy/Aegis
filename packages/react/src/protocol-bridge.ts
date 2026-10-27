export interface AegisProtocolChannel {
  sendMessage(type: string, payload?: unknown): void;
  onMessage(handler: (message: { type: string; payload?: unknown }) => void): () => void;
}

let protocolChannel: AegisProtocolChannel | undefined;

export function setAegisProtocolChannel(channel?: AegisProtocolChannel): void {
  protocolChannel = channel;
}

export function getAegisProtocolChannel(): AegisProtocolChannel | undefined {
  return protocolChannel;
}
