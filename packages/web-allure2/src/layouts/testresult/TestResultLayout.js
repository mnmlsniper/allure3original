import { Model } from "backbone";
import TestResultView from "@/components/testresult/TestResultView.js";
import TestResultModel from "@/data/testresult/TestResultModel.js";
import AppLayout from "@/layouts/application/AppLayout.js";
import router from "@/router.js";

export default class TestResultLayout extends AppLayout {
  initialize({ uid }) {
    super.initialize();
    this.uid = uid;
    this.model = new TestResultModel({ uid });
    this.routeState = new Model();
  }

  loadData() {
    return this.model.fetch();
  }

  getContentView() {
    const baseUrl = `#testresult/${this.uid}`;
    return new TestResultView({ baseUrl, model: this.model, routeState: this.routeState });
  }

  onViewReady() {
    const { uid, tabName } = this.options;
    this.onRouteUpdate(uid, tabName);
  }

  onRouteUpdate(uid, tabName) {
    this.routeState.set("testResultTab", tabName);

    const attachment = router.getUrlParams().attachment;
    if (attachment) {
      this.routeState.set("attachment", attachment);
    } else {
      this.routeState.unset("attachment");
    }
  }

  shouldKeepState(uid) {
    return this.uid === uid;
  }
}
