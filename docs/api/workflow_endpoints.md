# Workflow API Endpoints Reference

## Overview

The Workflow API provides comprehensive endpoints for managing chunked import workflows. This API enables programmatic control over the five-phase import process, including workflow initiation, phase management, monitoring, and error recovery.

### Base URL
```
https://your-domain.com/api/database/import/workflow
```

### Authentication
All endpoints require authentication via NextAuth session. Include session cookies or authorization headers as appropriate for your authentication setup.

### Common Headers
```http
Content-Type: application/json
Authorization: Bearer <token>  # If using token-based auth
```

### Response Format
All responses follow a consistent JSON structure:
```json
{
  "success": boolean,
  "message": string,
  "data": object,  // Varies by endpoint
  "timestamp": string,  // ISO 8601 timestamp
  "requestId": string   // Unique request identifier
}
```

## Core Workflow Endpoints

### Start Workflow

Initiates a new import workflow with the specified data source.

**Endpoint:** `POST /api/database/import/workflow/start`

**Request Body:**
```json
{
  "dataSourceId": "string",   // Required: Data source identifier
  "workflowName": "string",   // Optional: Human-readable workflow name
  "options": {                // Optional: Workflow configuration
    "batchSize": 3,           // Number of locations to process concurrently
    "timeout": 1800,          // Timeout in seconds
    "maxRetries": 3           // Maximum retry attempts
  }
}
```

**Parameters:**
- `spreadsheetId` (string, required): Valid Google Sheets spreadsheet ID
- `workflowName` (string, optional): Descriptive name for the workflow
- `options` (object, optional): Configuration overrides

**Success Response (200):**
```json
{
  "success": true,
  "message": "Workflow started successfully",
  "data": {
    "workflowId": "wf_1234567890abcdef",
    "status": "processing",
    "currentPhase": "scan",
    "estimatedDuration": "15 minutes",
    "startTime": "2024-03-15T10:30:00.000Z"
  },
  "timestamp": "2024-03-15T10:30:00.000Z",
  "requestId": "req_abcdef123456"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid spreadsheet ID or parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `429 Too Many Requests`: Rate limit exceeded

**Example Request:**
```bash
curl -X POST https://your-domain.com/api/database/import/workflow/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "spreadsheetId": "1U_A10jLAKiyV6TAWFA5mE7ONwMlxGsuHffnj0a-Qojw",
    "workflowName": "Monthly Data Import - March 2024"
  }'
```

### Get Workflow Status

Retrieves the current status and progress of a workflow.

**Endpoint:** `GET /api/database/import/workflow/{workflowId}/status`

**Path Parameters:**
- `workflowId` (string, required): Unique workflow identifier

**Query Parameters:**
- `includeDetails` (boolean, optional): Include detailed phase information (default: false)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Workflow status retrieved",
  "data": {
    "workflowId": "wf_1234567890abcdef",
    "status": "processing",
    "currentPhase": "locations",
    "phaseProgress": {
      "current": 5,
      "total": 12,
      "message": "Processing Charlottesville location sheet..."
    },
    "overallProgress": 35,
    "startTime": "2024-03-15T10:30:00.000Z",
    "lastUpdateTime": "2024-03-15T10:35:00.000Z",
    "estimatedCompletion": "2024-03-15T10:45:00.000Z",
    "phases": {
      "scan": {
        "status": "completed",
        "startTime": "2024-03-15T10:30:00.000Z",
        "endTime": "2024-03-15T10:32:00.000Z",
        "duration": "2 minutes"
      },
      "locations": {
        "status": "processing",
        "startTime": "2024-03-15T10:32:00.000Z",
        "progress": {
          "current": 5,
          "total": 12
        }
      }
    }
  },
  "timestamp": "2024-03-15T10:35:00.000Z",
  "requestId": "req_fedcba654321"
}
```

**Error Responses:**
- `404 Not Found`: Workflow not found
- `401 Unauthorized`: Authentication required

### Approve Phase

Approves the current phase and initiates the next phase in the workflow.

**Endpoint:** `POST /api/database/import/workflow/{workflowId}/approve/{phaseId}`

**Path Parameters:**
- `workflowId` (string, required): Unique workflow identifier
- `phaseId` (string, required): Phase to approve (scan, locations, verify, count, import)

**Request Body:**
```json
{
  "notes": "string",  // Optional: Approval notes
  "options": {        // Optional: Phase-specific options
    "skipWarnings": false,
    "forceContinue": false
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Phase approved, proceeding to next phase",
  "data": {
    "workflowId": "wf_1234567890abcdef",
    "approvedPhase": "scan",
    "nextPhase": "locations",
    "estimatedDuration": "8 minutes",
    "startTime": "2024-03-15T10:32:00.000Z"
  },
  "timestamp": "2024-03-15T10:32:00.000Z",
  "requestId": "req_123456abcdef"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid phase or workflow state
- `409 Conflict`: Phase already approved or workflow in invalid state
- `404 Not Found`: Workflow or phase not found

### Retry Phase

Retries a failed phase in the workflow.

**Endpoint:** `POST /api/database/import/workflow/{workflowId}/retry/{phaseId}`

**Path Parameters:**
- `workflowId` (string, required): Unique workflow identifier
- `phaseId` (string, required): Phase to retry

**Request Body:**
```json
{
  "reason": "string",  // Optional: Reason for retry
  "options": {         // Optional: Retry configuration
    "resetData": false,
    "maxRetries": 3
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Phase retry initiated",
  "data": {
    "workflowId": "wf_1234567890abcdef",
    "retryPhase": "locations",
    "retryCount": 2,
    "maxRetries": 3,
    "startTime": "2024-03-15T10:40:00.000Z"
  },
  "timestamp": "2024-03-15T10:40:00.000Z",
  "requestId": "req_retry123456"
}
```

### Cancel Workflow

Cancels an active workflow and performs cleanup operations.

**Endpoint:** `POST /api/database/import/workflow/{workflowId}/cancel`

**Path Parameters:**
- `workflowId` (string, required): Unique workflow identifier

**Request Body:**
```json
{
  "reason": "string",  // Optional: Cancellation reason
  "cleanupOptions": {  // Optional: Cleanup configuration
    "removeData": false,
    "archiveLogs": true
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Workflow cancelled successfully",
  "data": {
    "workflowId": "wf_1234567890abcdef",
    "status": "cancelled",
    "cancelTime": "2024-03-15T10:50:00.000Z",
    "cleanupStatus": "completed",
    "partialResults": {
      "completedPhases": ["scan", "locations"],
      "processedLocations": 8,
      "totalLocations": 12
    }
  },
  "timestamp": "2024-03-15T10:50:00.000Z",
  "requestId": "req_cancel123456"
}
```

## Phase-Specific Endpoints

### Get Scan Phase Results

Retrieves detailed results from the scan phase.

**Endpoint:** `GET /api/database/import/phase/scan/{workflowId}`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Scan phase results retrieved",
  "data": {
    "phase": "scan",
    "status": "completed",
    "startTime": "2024-03-15T10:30:00.000Z",
    "endTime": "2024-03-15T10:32:00.000Z",
    "duration": "2 minutes",
    "results": {
      "spreadsheetValid": true,
      "headersValid": true,
      "totalLocations": 12,
      "activeLocations": 10,
      "inactiveLocations": 2,
      "validationResults": {
        "masterSheet": {
          "tabsValidated": ["Open", "Pending", "Closed"],
          "openTab": {
            "headersValid": true,
            "requiredHeaders": [
              "State", "City", "Address", "Phone Number",
              "Sheet ID", "Is Active", "Manager Email", "Opened"
            ],
            "missingHeaders": [],
            "extraHeaders": []
          },
          "pendingTab": {
            "headersValid": true,
            "requiredHeaders": [
              "State", "City", "Address", "Phone Number",
              "Sheet ID", "Is Active", "Manager Email", "Opening"
            ],
            "missingHeaders": [],
            "extraHeaders": []
          },
          "closedTab": {
            "headersValid": true,
            "requiredHeaders": [
              "State", "City", "Address", "Phone Number",
              "Sheet ID", "Is Active", "Manager Email", "Opened", "Closed"
            ],
            "missingHeaders": [],
            "extraHeaders": []
          }
        },
        "sheetIds": {
          "total": 12,
          "valid": 11,
          "invalid": 1,
          "duplicates": 0,
          "errors": ["Invalid format: sheet_003"]
        }
      },
      "warnings": [
        "Sheet ID format warning for location VA-003"
      ],
      "errors": [],
      "recommendations": [
        "Review invalid sheet ID formats before proceeding"
      ]
    }
  },
  "timestamp": "2024-03-15T10:32:00.000Z",
  "requestId": "req_scan_results"
}
```

### Get Locations Phase Results

Retrieves detailed results from the locations phase.

**Endpoint:** `GET /api/database/import/phase/locations/{workflowId}`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Locations phase results retrieved",
  "data": {
    "phase": "locations",
    "status": "completed",
    "startTime": "2024-03-15T10:32:00.000Z",
    "endTime": "2024-03-15T10:40:00.000Z",
    "duration": "8 minutes",
    "results": {
      "summary": {
        "totalLocations": 10,
        "processedLocations": 10,
        "successfulLocations": 9,
        "failedLocations": 1,
        "byStatus": {
          "open": 6,
          "pending": 3,
          "closed": 1
        },
        "totalSaints": 245,
        "totalSaintYears": 1250,
        "totalMilestones": 89
      },
      "locationDetails": [
        {
          "locationId": "VA-001",
          "sheetId": "1i60SVH9dTItSrxHftydRbVe2jyuxAsPH6D9f03YWjDg",
          "status": "success",
          "saintsCount": 28,
          "eventsCount": 145,
          "milestonesCount": 12,
          "processingTime": "45 seconds"
        },
        {
          "locationId": "VA-002",
          "sheetId": "1abc123def456ghi789jkl012mno345pqr678stu901vwx",
          "status": "failed",
          "error": "Access denied for sheet",
          "retryCount": 2
        }
      ],
      "performanceMetrics": {
        "averageProcessingTime": "48 seconds",
        "totalApiCalls": 156,
        "rateLimitDelays": "2.3 seconds",
        "memoryUsage": "256 MB"
      },
      "errors": [
        {
          "locationId": "VA-002",
          "sheetId": "1abc123def456ghi789jkl012mno345pqr678stu901vwx",
          "error": "Access denied",
          "timestamp": "2024-03-15T10:35:00.000Z",
          "retryCount": 2
        }
      ],
      "warnings": [
        "Large dataset detected for location VA-001 (500+ records)"
      ]
    }
  },
  "timestamp": "2024-03-15T10:40:00.000Z",
  "requestId": "req_locations_results"
}
```

### Get Verify Phase Results

Retrieves detailed results from the verify phase.

**Endpoint:** `GET /api/database/import/phase/verify/{workflowId}`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Verify phase results retrieved",
  "data": {
    "phase": "verify",
    "status": "completed",
    "startTime": "2024-03-15T10:40:00.000Z",
    "endTime": "2024-03-15T10:45:00.000Z",
    "duration": "5 minutes",
    "results": {
      "conflictAnalysis": {
        "totalConflicts": 3,
        "duplicateSaints": 2,
        "invalidReferences": 1,
        "conflicts": [
          {
            "type": "duplicate_saint",
            "severity": "warning",
            "description": "Saint number 123 exists in both VA-001 and VA-005",
            "locations": ["VA-001", "VA-005"],
            "resolution": "manual_review_required"
          }
        ]
      },
      "dataQuality": {
        "totalRecords": 1495,
        "validRecords": 1485,
        "invalidRecords": 10,
        "qualityScore": 99.3,
        "issues": {
          "invalidDates": 5,
          "missingRequiredFields": 3,
          "invalidUrls": 2
        }
      },
      "crossValidation": {
        "saintReferences": {
          "total": 1250,
          "valid": 1245,
          "invalid": 5,
          "orphaned": 0
        },
        "milestoneReferences": {
          "total": 89,
          "valid": 87,
          "invalid": 2
        }
      },
      "recommendations": [
        "Review duplicate saint numbers before proceeding",
        "Fix invalid date formats in 5 records",
        "Validate Facebook event URLs"
      ]
    }
  },
  "timestamp": "2024-03-15T10:45:00.000Z",
  "requestId": "req_verify_results"
}
```

### Get Count Phase Results

Retrieves detailed results from the count phase.

**Endpoint:** `GET /api/database/import/phase/count/{workflowId}`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Count phase results retrieved",
  "data": {
    "phase": "count",
    "status": "completed",
    "startTime": "2024-03-15T10:45:00.000Z",
    "endTime": "2024-03-15T10:46:00.000Z",
    "duration": "1 minute",
    "results": {
      "importSummary": {
        "locations": {
          "toCreate": 2,
          "toUpdate": 8,
          "total": 10
        },
        "saints": {
          "toCreate": 245,
          "total": 245
        },
        "events": {
          "toCreate": 1250,
          "total": 1250
        },
        "milestones": {
          "toCreate": 89,
          "total": 89
        }
      },
      "estimatedOperations": {
        "databaseInserts": 1584,
        "databaseUpdates": 8,
        "indexUpdates": 3,
        "cacheInvalidations": 12
      },
      "resourceRequirements": {
        "estimatedTime": "12 minutes",
        "memoryUsage": "512 MB",
        "databaseConnections": 2,
        "apiQuotaUsage": 200
      },
      "riskAssessment": {
        "riskLevel": "low",
        "criticalConflicts": 0,
        "warnings": 3,
        "recommendations": [
          "Monitor memory usage during import",
          "Ensure adequate database connections"
        ]
      }
    }
  },
  "timestamp": "2024-03-15T10:46:00.000Z",
  "requestId": "req_count_results"
}
```

### Get Import Phase Results

Retrieves detailed results from the import phase.

**Endpoint:** `GET /api/database/import/phase/import/{workflowId}`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Import phase results retrieved",
  "data": {
    "phase": "import",
    "status": "completed",
    "startTime": "2024-03-15T10:46:00.000Z",
    "endTime": "2024-03-15T10:58:00.000Z",
    "duration": "12 minutes",
    "results": {
      "executionSummary": {
        "status": "success",
        "totalOperations": 1592,
        "successfulOperations": 1588,
        "failedOperations": 4,
        "rollbackPerformed": false
      },
      "operationDetails": {
        "locations": {
          "created": 2,
          "updated": 8,
          "failed": 0
        },
        "saints": {
          "created": 243,
          "failed": 2
        },
        "events": {
          "created": 1245,
          "failed": 5
        },
        "milestones": {
          "created": 87,
          "failed": 2
        }
      },
      "performanceMetrics": {
        "totalProcessingTime": "12 minutes",
        "averageOperationTime": "0.45 seconds",
        "peakMemoryUsage": "678 MB",
        "databaseConnectionsUsed": 2,
        "apiCallsMade": 245
      },
      "errors": [
        {
          "operation": "create_saint",
          "recordId": "saint_123",
          "error": "Unique constraint violation",
          "timestamp": "2024-03-15T10:52:00.000Z",
          "retryCount": 1
        }
      ],
      "warnings": [
        "High memory usage detected during bulk operations"
      ],
      "postImportActions": {
        "indexesRebuilt": true,
        "cachesInvalidated": true,
        "notificationsSent": true
      }
    }
  },
  "timestamp": "2024-03-15T10:58:00.000Z",
  "requestId": "req_import_results"
}
```

## Error Response Format

All error responses follow a consistent format:

```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "type": "error_type",
    "details": "Detailed error information",
    "suggestions": ["Suggestion 1", "Suggestion 2"]
  },
  "timestamp": "2024-03-15T10:30:00.000Z",
  "requestId": "req_error123456"
}
```

### Common Error Codes

| Code | Type | Description |
|------|------|-------------|
| `INVALID_SPREADSHEET_ID` | validation | Spreadsheet ID format is invalid |
| `SPREADSHEET_NOT_FOUND` | access | Spreadsheet doesn't exist or access denied |
| `WORKFLOW_NOT_FOUND` | not_found | Specified workflow doesn't exist |
| `PHASE_INVALID_STATE` | state | Phase is in invalid state for operation |
| `RATE_LIMIT_EXCEEDED` | rate_limit | API rate limit exceeded |
| `AUTHENTICATION_FAILED` | auth | Authentication credentials invalid |
| `DATABASE_ERROR` | database | Database operation failed |
| `VALIDATION_FAILED` | validation | Data validation failed |

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Authenticated Requests**: 100 requests per minute per user
- **Anonymous Requests**: 10 requests per minute per IP
- **Workflow Operations**: 5 concurrent workflows per user
- **Phase Operations**: 1 operation per phase per workflow at a time

Rate limit headers are included in all responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642185600
X-RateLimit-Retry-After: 60
```

## Webhook Notifications

Optional webhook notifications can be configured for workflow events:

**Configuration:**
```json
{
  "webhooks": {
    "workflowStarted": "https://your-app.com/webhooks/workflow-started",
    "phaseCompleted": "https://your-app.com/webhooks/phase-completed",
    "workflowCompleted": "https://your-app.com/webhooks/workflow-completed",
    "errorOccurred": "https://your-app.com/webhooks/error-occurred"
  }
}
```

**Webhook Payload:**
```json
{
  "event": "phase_completed",
  "workflowId": "wf_1234567890abcdef",
  "phase": "scan",
  "status": "success",
  "timestamp": "2024-03-15T10:32:00.000Z",
  "data": {
    // Phase-specific data
  }
}
```

## SDK Examples

### JavaScript/Node.js

```javascript
const workflowApi = {
  async startWorkflow(spreadsheetId, options = {}) {
    const response = await fetch('/api/database/import/workflow/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        spreadsheetId,
        workflowName: options.name,
        options: {
          batchSize: options.batchSize || 3,
          timeout: options.timeout || 1800
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Workflow start failed: ${response.statusText}`);
    }

    return response.json();
  },

  async getWorkflowStatus(workflowId) {
    const response = await fetch(`/api/database/import/workflow/${workflowId}/status`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.statusText}`);
    }

    return response.json();
  },

  async approvePhase(workflowId, phaseId, notes = '') {
    const response = await fetch(`/api/database/import/workflow/${workflowId}/approve/${phaseId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ notes })
    });

    if (!response.ok) {
      throw new Error(`Phase approval failed: ${response.statusText}`);
    }

    return response.json();
  }
};

// Usage example
async function runImportWorkflow(spreadsheetId) {
  try {
    // Start workflow
    const startResult = await workflowApi.startWorkflow(spreadsheetId, {
      name: 'Monthly Import',
      batchSize: 5
    });

    const workflowId = startResult.data.workflowId;
    console.log(`Workflow started: ${workflowId}`);

    // Poll for completion
    while (true) {
      const status = await workflowApi.getWorkflowStatus(workflowId);

      if (status.data.status === 'completed') {
        console.log('Workflow completed successfully');
        break;
      } else if (status.data.status === 'failed') {
        console.error('Workflow failed');
        break;
      } else if (status.data.status === 'waiting_for_approval') {
        // Auto-approve for demonstration
        await workflowApi.approvePhase(workflowId, status.data.currentPhase);
        console.log(`Approved phase: ${status.data.currentPhase}`);
      }

      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  } catch (error) {
    console.error('Workflow execution failed:', error);
  }
}
```

### Python

```python
import requests
import time
from typing import Dict, Any

class WorkflowAPI:
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url
        self.token = token
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        })

    def start_workflow(self, spreadsheet_id: str, name: str = None) -> Dict[str, Any]:
        payload = {
            'spreadsheetId': spreadsheet_id,
            'workflowName': name
        }

        response = self.session.post(f'{self.base_url}/start', json=payload)
        response.raise_for_status()
        return response.json()

    def get_workflow_status(self, workflow_id: str) -> Dict[str, Any]:
        response = self.session.get(f'{self.base_url}/{workflow_id}/status')
        response.raise_for_status()
        return response.json()

    def approve_phase(self, workflow_id: str, phase_id: str, notes: str = '') -> Dict[str, Any]:
        payload = {'notes': notes}
        response = self.session.post(
            f'{self.base_url}/{workflow_id}/approve/{phase_id}',
            json=payload
        )
        response.raise_for_status()
        return response.json()

    def cancel_workflow(self, workflow_id: str, reason: str = '') -> Dict[str, Any]:
        payload = {'reason': reason}
        response = self.session.post(f'{self.base_url}/{workflow_id}/cancel', json=payload)
        response.raise_for_status()
        return response.json()

# Usage example
def run_import_workflow(spreadsheet_id: str):
    api = WorkflowAPI('https://your-domain.com/api/database/import/workflow', 'your-token')

    try:
        # Start workflow
        result = api.start_workflow(spreadsheet_id, 'Monthly Import')
        workflow_id = result['data']['workflowId']
        print(f'Workflow started: {workflow_id}')

        # Monitor workflow
        while True:
            status = api.get_workflow_status(workflow_id)
            workflow_status = status['data']['status']

            if workflow_status == 'completed':
                print('Workflow completed successfully')
                break
            elif workflow_status == 'failed':
                print('Workflow failed')
                break
            elif workflow_status == 'waiting_for_approval':
                # Auto-approve for demonstration
                phase = status['data']['currentPhase']
                api.approve_phase(workflow_id, phase)
                print(f'Approved phase: {phase}')

            time.sleep(5)  # Wait 5 seconds before next check

    except requests.exceptions.RequestException as e:
        print(f'API request failed: {e}')
    except Exception as e:
        print(f'Workflow execution failed: {e}')
```

## Best Practices

### Error Handling
- Always check the `success` field in responses
- Implement exponential backoff for retries
- Log request IDs for debugging
- Handle rate limiting gracefully

### Performance
- Use webhooks for real-time notifications instead of polling
- Cache workflow status when appropriate
- Batch approval operations when possible
- Monitor API usage and adjust rate limits

### Security
- Store tokens securely and rotate regularly
- Validate all input parameters
- Use HTTPS for all API communications
- Implement proper session management

### Monitoring
- Track workflow completion rates
- Monitor error patterns
- Set up alerts for failed workflows
- Log performance metrics

This API reference provides comprehensive documentation for integrating with the chunked import workflow system. For additional support or questions, please refer to the main workflow documentation or contact the development team.