import { Plugin } from "@allure/plugin-api";
import { type AllureStaticServer } from "@allure/static-server";

export class ServerReloadPlugin implements Plugin {
  constructor(
    readonly options: {
      server: AllureStaticServer;
      timeout?: number;
    },
  ) {}

  update = async () => {
    this.options.server.reload();
  };
}
