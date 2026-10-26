import { isTerminal, TaskStatus, updateStatusContent } from './domain';

export interface TransitionOperations {
  read(): Promise<string>;
  write(content: string): Promise<void>;
  moveToArchive(): Promise<void>;
  restorePath(): Promise<void>;
}

export async function applyStatusTransition(
  status: TaskStatus,
  timestamp: string,
  message: string,
  operations: TransitionOperations,
): Promise<void> {
  const original = await operations.read();
  const updated = updateStatusContent(original, status, timestamp, message);
  try {
    await operations.write(updated);
    if (isTerminal(status)) await operations.moveToArchive();
  } catch (error) {
    try {
      await operations.restorePath();
      await operations.write(original);
    } catch {
      throw new Error('Task status transition and rollback both failed');
    }
    throw error;
  }
}
