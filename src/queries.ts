export const USAGE_QUERY = `
  query GetUsage($accountTag: String!, $start: Time!, $end: Time!) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        workers: workersInvocationsAdaptive(
          limit: 1
          filter: { datetime_geq: $start, datetime_leq: $end }
        ) {
          sum {
            requests
          }
          quantiles {
            cpuTimeP50
          }
        }
        kv: kvOperationsAdaptiveGroups(
          limit: 10
          filter: { datetime_geq: $start, datetime_leq: $end }
        ) {
          sum {
            requests
          }
          dimensions {
            actionType
          }
        }
        d1: d1QueriesAdaptiveGroups(
          limit: 1
          filter: { datetime_geq: $start, datetime_leq: $end }
        ) {
          sum {
            rowsRead
            rowsWritten
          }
        }
      }
    }
  }
`;
