export const getLatestBlock = `query {
  chain {
    latestBlock {
      header {
        height
      }
    }
  }
}`;

export const getLatestSyncedBlock = `query {
  blocks(last: 1) {
    nodes {
      height
    }
  }
}`;
