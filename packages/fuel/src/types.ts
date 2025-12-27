export type ChainInfoData = {
  data: {
    chain: {
      latestBlock: {
        header: {
          height: string;
        };
      };
    };
  };
};

export type IndexerBlocksData = {
  data: {
    blocks: {
      nodes: [{ height: string }];
    };
  };
};
