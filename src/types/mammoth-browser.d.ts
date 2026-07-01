declare module "mammoth/mammoth.browser" {
  const mammoth: {
    extractRawText: (opts: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string; messages: unknown[] }>;
  };
  export default mammoth;
}
