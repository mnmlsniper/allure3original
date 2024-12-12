import { ResultsReader } from "@allure/reader-api";

const readerId = "attachments";

export const attachments: ResultsReader = {
  async read(visitor, data) {
    await visitor.visitAttachmentFile(data, { readerId });
    return true;
  },
  readerId: () => readerId,
};
