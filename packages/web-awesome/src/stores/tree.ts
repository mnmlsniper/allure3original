import { fetchReportJsonData } from "@allure/web-commons";
import { signal } from "@preact/signals";
import type { StoreSignalState } from "@/stores/types";

export const treeStore = signal<StoreSignalState<any>>({
  loading: true,
  error: undefined,
  data: undefined,
});

export const fetchTreeData = async (treeName: string) => {
  treeStore.value = {
    ...treeStore.value,
    loading: true,
    error: undefined,
  };

  try {
    const res = await fetchReportJsonData(`widgets/${treeName}.json`);

    treeStore.value = {
      data: res,
      error: undefined,
      loading: false,
    };
  } catch (e) {
    treeStore.value = {
      ...treeStore.value,
      error: e.message,
      loading: false,
    };
  }
};
