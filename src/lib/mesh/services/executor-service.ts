// [IMPL-MESH_EXECUTOR] [REQ-MESH_PLATFORM]: Operation execution — phase 13

import type { Connector, ConnectorError } from "../connector/types";
import type { ChangeSet, Policy, SyncOperation } from "../domain";
import { allowsDelete } from "./policy-service";
import type { EventService } from "./event-service";

export type OperationResult = {
  operationId: string;
  success: boolean;
  error?: string;
  attempts: number;
  skipped?: boolean;
};

function isConnectorError(r: unknown): r is ConnectorError {
  return typeof r === "object" && r !== null && "code" in r && "message" in r;
}

export class ExecutorService {
  constructor(private readonly events?: EventService) {}

  executeOperation(
    operation: SyncOperation,
    source: Connector,
    target: Connector,
    policy: Policy,
  ): OperationResult {
    this.events?.recordOperationStarted(operation.id);
    if (operation.kind === "delete" && !allowsDelete(policy)) {
      this.events?.recordOperationFailed(operation.id, "delete blocked by policy");
      return {
        operationId: operation.id,
        success: false,
        error: "delete blocked by policy",
        attempts: 1,
        skipped: true,
      };
    }
    let result: OperationResult;
    switch (operation.kind) {
      case "copy":
      case "update": {
        const data = source.readFile(operation.sourcePath);
        if (isConnectorError(data)) {
          result = { operationId: operation.id, success: false, error: data.message, attempts: 1 };
          break;
        }
        const targetPath = operation.targetPath ?? operation.sourcePath;
        const writeErr = target.writeFile(targetPath, data);
        if (isConnectorError(writeErr)) {
          result = { operationId: operation.id, success: false, error: writeErr.message, attempts: 1 };
        } else {
          result = { operationId: operation.id, success: true, attempts: 1 };
        }
        break;
      }
      case "delete": {
        const delErr = target.deleteFile(operation.sourcePath);
        result = isConnectorError(delErr)
          ? { operationId: operation.id, success: false, error: delErr.message, attempts: 1 }
          : { operationId: operation.id, success: true, attempts: 1 };
        break;
      }
      default:
        result = { operationId: operation.id, success: true, attempts: 1, skipped: true };
    }
    if (result.success) {
      this.events?.recordOperationCompleted(operation.id);
    } else {
      this.events?.recordOperationFailed(operation.id, result.error ?? "unknown");
    }
    return result;
  }

  executeChangeSet(
    changeSet: ChangeSet,
    source: Connector,
    target: Connector,
    policy: Policy,
    maxAttempts = policy.retryMaxAttempts,
  ): OperationResult[] {
    const results: OperationResult[] = [];
    for (const op of changeSet.operations) {
      let attempt = 0;
      let last: OperationResult | undefined;
      while (attempt < maxAttempts) {
        attempt++;
        last = this.executeOperation(op, source, target, policy);
        if (last.success || last.skipped) {
          break;
        }
      }
      if (last) {
        results.push({ ...last, attempts: attempt });
      }
    }
    return results;
  }
}
